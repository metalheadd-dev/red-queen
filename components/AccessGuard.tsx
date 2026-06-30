"use client";

import { useState, useEffect, useCallback } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useAuth } from "./AuthProvider";
import dynamic from "next/dynamic";
import SolvivalIcon from "./SolvivalIcon";

const WalletMultiButton = dynamic(
  () => import("@solana/wallet-adapter-react-ui").then((mod) => mod.WalletMultiButton),
  { ssr: false }
);

interface AccessGuardProps {
  children: React.ReactNode;
}

type ProfileData = {
  access_type: string;
  holder_tier: number;
  verified_balance: number;
  [key: string]: any;
};

export default function AccessGuard({ children }: AccessGuardProps) {
  const { connected, publicKey, signMessage } = useWallet();
  const { authIdentifier, session, loading: authLoading, loginWithWallet } = useAuth();
  
  const [profileLoading, setProfileLoading] = useState(false);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [accessGranted, setAccessGranted] = useState<boolean | null>(null);
  
  // Invite Activation state
  const [inviteCode, setInviteCode] = useState("");
  const [activating, setActivating] = useState(false);
  const [verifyStatus, setVerifyStatus] = useState("");
  const [attemptedLogin, setAttemptedLogin] = useState(false);

  const activeIdentifier = authIdentifier || (publicKey ? publicKey.toString() : "");

  const requestSignature = async () => {
    if (!publicKey || !signMessage) return null;
    try {
      const message = "Sign in to Red Queen Node 7.4.1";
      const encoded = new TextEncoder().encode(message);
      const signatureBytes = await signMessage(encoded);
      const bs58 = (await import("bs58")).default;
      const signatureBase58 = bs58.encode(signatureBytes);
      
      const sigData = { signature: signatureBase58, message };
      localStorage.setItem(`rq_sol_sig:${publicKey.toString()}`, JSON.stringify(sigData));
      return sigData;
    } catch (err) {
      console.error("Failed to sign authentication challenge:", err);
      return null;
    }
  };

  const getAuthHeaders = useCallback(() => {
    const headers: Record<string, string> = {
      "Content-Type": "application/json"
    };
    if (session?.access_token) {
      headers["Authorization"] = `Bearer ${session.access_token}`;
    } else if (typeof window !== "undefined" && publicKey) {
      const savedSig = localStorage.getItem(`rq_sol_sig:${publicKey.toString()}`);
      if (savedSig) {
        try {
          const { signature, message } = JSON.parse(savedSig);
          headers["X-Solana-PublicKey"] = publicKey.toString();
          headers["X-Solana-Signature"] = signature;
          headers["X-Solana-Message"] = message;
        } catch (e) {
          console.error(e);
        }
      }
    }
    return headers;
  }, [session, publicKey]);

  // Load profile from API and verify access status
  const checkAccess = useCallback(async (identifier: string, token?: string) => {
    if (!identifier) return;
    setProfileLoading(true);
    setVerifyStatus("");
    try {
      let prof: any = null;

      // 1. Try to query Database via API using verified headers
      try {
        const headers = getAuthHeaders();
        const res = await fetch(`/api/profile?wallet=${identifier}`, {
          headers
        });
        if (res.ok) {
          const data = await res.json();
          if (data && data.profile) {
            prof = data.profile;
          }
        }
      } catch (dbErr) {
        console.warn("AccessGuard: db lookup failed, trying fallback:", dbErr);
      }

      // 2. Fallback: Lookup local storage
      if (!prof && typeof window !== "undefined") {
        const saved = localStorage.getItem(`rq_ops_profile:${identifier}`);
        if (saved) {
          try {
            prof = JSON.parse(saved);
          } catch (jsonErr) {
            console.error("AccessGuard: failed to parse local profile:", jsonErr);
          }
        }
      }

      // 3. Evaluate Profile permissions
      if (prof) {
        const hasBalance = (prof.verified_balance || prof.verifiedBalance || 0) >= 1000000 || (prof.holder_tier || prof.holderTier || 0) >= 2;
        const hasInvite = prof.access_type === "Invite" || prof.accessType === "Invite" || 
                           prof.access_type === "Holder" || prof.accessType === "Holder" ||
                           prof.access_type === "Admin" || prof.accessType === "Admin";
        if (hasBalance || hasInvite) {
          setProfile(prof);
          setAccessGranted(true);
          setProfileLoading(false);
          return;
        }
      }

      // 4. Fallback: directly query Solana Mainnet RPC if it's a connected wallet
      if (identifier && !identifier.startsWith("email-auth:")) {
        setVerifyStatus("QUERYING SOLANA MAINNET FOR $THREAT HOLDINGS...");
        try {
          const { Connection, PublicKey } = await import("@solana/web3.js");
          const { getAssociatedTokenAddress } = await import("@solana/spl-token");
          
          const rpcUrl = process.env.NEXT_PUBLIC_SOLANA_RPC_URL || "https://solana-rpc.publicnode.com";
          const connection = new Connection(rpcUrl, "confirmed");
          const walletPubkey = new PublicKey(identifier);
          const mintPubkey = new PublicKey("AUCYMsSZXASMiXfjLNL26NF7sPehUA4ncEzTCx8MdSYg"); // $THREAT mint
          const ata = await getAssociatedTokenAddress(mintPubkey, walletPubkey);
          
          const balanceResponse = await connection.getTokenAccountBalance(ata);
          const balance = balanceResponse.value.uiAmount || 0;
          
          if (balance >= 1000000) {
            setVerifyStatus(`VERIFIED: ${balance.toLocaleString()} $THREAT. ACCESS GRANTED.`);
            const updatedProf = prof ? {
              ...prof,
              verifiedBalance: balance,
              holderTier: 2,
              holderStatus: "Holder",
              accessType: "Holder"
            } : {
              name: "OPERATIVE",
              faction: "None",
              class: "None",
              role: "None",
              level: 1,
              xp: 0,
              credits: 500,
              reputation: 0,
              health: 100,
              verifiedBalance: balance,
              holderTier: 2,
              holderStatus: "Holder",
              accessType: "Holder"
            };

            if (typeof window !== "undefined") {
              localStorage.setItem(`rq_ops_profile:${identifier}`, JSON.stringify(updatedProf));
            }
            setProfile(updatedProf);
            setAccessGranted(true);
            setProfileLoading(false);
            return;
          }
        } catch (chainErr) {
          console.warn("AccessGuard: client-side RPC query failed:", chainErr);
        }
      }

      setAccessGranted(false);
    } catch (e) {
      console.error("Access verification error:", e);
      setAccessGranted(false);
    }
    setProfileLoading(false);
  }, [getAuthHeaders]);

  // Sync wallet connection to Supabase session when connected
  useEffect(() => {
    if (connected && !session && !authLoading && loginWithWallet && !attemptedLogin) {
      setAttemptedLogin(true);
      loginWithWallet().catch(err => {
        console.error("Wallet auto-login failed:", err);
      });
    }
  }, [connected, session, authLoading, loginWithWallet, attemptedLogin]);

  // Reset login state if wallet is disconnected
  useEffect(() => {
    if (!connected) {
      setAttemptedLogin(false);
    }
  }, [connected]);

  // Effect to verify access whenever session or wallet changes
  useEffect(() => {
    if (connected && activeIdentifier) {
      if (publicKey && !session) {
        const saved = localStorage.getItem(`rq_sol_sig:${publicKey.toString()}`);
        if (!saved && signMessage) {
          requestSignature().then((sig) => {
            if (sig) {
              checkAccess(activeIdentifier, undefined);
            } else {
              setAccessGranted(false);
            }
          });
          return;
        }
      }
      checkAccess(activeIdentifier, session?.access_token);
    } else {
      setProfile(null);
      setAccessGranted(null);
    }
  }, [connected, activeIdentifier, session, checkAccess, publicKey, signMessage]);

  // Trigger manual verified balance refresh
  const handleReVerify = async () => {
    if (!activeIdentifier) return;
    setVerifyStatus("QUERYING SOLANA BLOCKCHAIN FOR $THREAT BALANCE...");

    // 1. Direct client-side RPC check if session is missing
    if (!session) {
      try {
        const { Connection, PublicKey } = await import("@solana/web3.js");
        const { getAssociatedTokenAddress } = await import("@solana/spl-token");
        
        const rpcUrl = process.env.NEXT_PUBLIC_SOLANA_RPC_URL || "https://solana-rpc.publicnode.com";
        const connection = new Connection(rpcUrl, "confirmed");
        const walletPubkey = new PublicKey(activeIdentifier);
        const mintPubkey = new PublicKey("AUCYMsSZXASMiXfjLNL26NF7sPehUA4ncEzTCx8MdSYg");
        const ata = await getAssociatedTokenAddress(mintPubkey, walletPubkey);
        
        const balanceResponse = await connection.getTokenAccountBalance(ata);
        const balance = balanceResponse.value.uiAmount || 0;
        
        if (balance >= 1000000) {
          setVerifyStatus("ON-CHAIN VERIFICATION SUCCESSFUL.");
          checkAccess(activeIdentifier, undefined);
        } else {
          setVerifyStatus(`VERIFICATION FAILED: Required 1,000,000 $THREAT. Found ${balance.toLocaleString()}`);
        }
      } catch (e: any) {
        setVerifyStatus(`VERIFICATION FAILURE: ${e.message || String(e)}`);
      }
      return;
    }

    // 2. Database API verification check using verified headers
    try {
      const headers = getAuthHeaders();
      const res = await fetch("/api/profile/verify-holder", {
        method: "POST",
        headers,
        body: JSON.stringify({ wallet_address: activeIdentifier, wallet: activeIdentifier })
      });
      const data = await res.json();
      if (data.success) {
        setVerifyStatus("ON-CHAIN VERIFICATION RE-RUN SUCCESSFUL.");
        checkAccess(activeIdentifier, session?.access_token);
      } else {
        setVerifyStatus(`VERIFICATION FAILED: ${data.error || "UNKNOWN ERROR"}`);
      }
    } catch (e) {
      setVerifyStatus("VERIFICATION FAILURE: CHECK RPC CONNECTIVITY.");
      console.error(e);
    }
  };

  // Submit invite code activation using verified headers
  const handleActivateInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteCode.trim() || !activeIdentifier) return;
    setActivating(true);
    setVerifyStatus("");
    try {
      const headers = getAuthHeaders();
      const res = await fetch("/api/invite/activate", {
        method: "POST",
        headers,
        body: JSON.stringify({ code: inviteCode, wallet: activeIdentifier })
      });
      const data = await res.json();
      if (data.success) {
        alert("ACCESS GRANTED. INVITATION ACTIVATED.");
        checkAccess(activeIdentifier, session?.access_token);
      } else {
        alert(`Failed to activate: ${data.error}`);
      }
    } catch (err) {
      console.error(err);
      alert("Verification Server Error");
    }
    setActivating(false);
  };

  // State 1: Wallet not connected
  if (!connected) {
    return (
      <div style={containerStyle}>
        <div style={panelStyle}>
          <div style={brandHeaderStyle}>
            <SolvivalIcon size={48} />
            <h1 style={titleStyle}>RED QUEEN ACCESS GATEWAY</h1>
            <p style={subtitleStyle}>SOLVIVAL CORP // BETA PROTOCOLS</p>
          </div>
          
          <div className="alert warn" style={{ margin: "24px 0" }}>
            <strong style={{ display: "block", marginBottom: "4px" }}>BETA DEPLOYMENT DETECTED</strong>
            Operations is a restricted sector. Unauthenticated access is strictly prohibited.
          </div>

          <div style={{ textAlign: "center", margin: "32px 0" }}>
            <WalletMultiButton />
          </div>

          <div style={descBoxStyle}>
            <h3 style={{ color: "#fff", fontFamily: "var(--mono)", fontSize: "14px", marginBottom: "8px" }}>
              CLOSED BETA REQUIREMENTS
            </h3>
            <ul style={listStyle}>
              <li>Hold at least <strong>1,000,000 $THREAT</strong> tokens in your Solana wallet.</li>
              <li>OR activate a valid <strong>Invite Code</strong> issued by Solvival Corp.</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  // State 2: Wallet connected but checking database access
  if (authLoading || profileLoading || accessGranted === null) {
    return (
      <div style={containerStyle}>
        <div style={{ textAlign: "center", fontFamily: "var(--mono)", color: "var(--red)" }}>
          <div className="zombie-container" style={{ marginBottom: "20px" }}>
            <div className="zombie-art">
{`   ░░░░░░░░░░
  ░░  ░░░░  ░░
 ░░░░  ░░  ░░░░
░░  ░░░░░░░░  ░░`}
            </div>
          </div>
          <p style={{ letterSpacing: "0.1em", fontSize: "14px" }}>
            [ SECURING ENCRYPTED ACCESS PORTALS... ]
          </p>
          <div style={progressBarContainerStyle}>
            <div style={progressBarFillStyle} />
          </div>
        </div>
      </div>
    );
  }

  // State 4: Access Denied
  if (accessGranted === false) {
    return (
      <div style={containerStyle}>
        <div style={panelStyle}>
          <div style={brandHeaderStyle}>
            <span style={{ color: "var(--red)", fontSize: "36px" }}>⚠️</span>
            <h1 style={{ ...titleStyle, color: "var(--red)" }}>ACCESS RESTRICTED</h1>
            <p style={subtitleStyle}>IDENTIFIER: {activeIdentifier.slice(0, 8)}...{activeIdentifier.slice(-8)}</p>
          </div>

          <div className="alert error" style={{ margin: "20px 0" }}>
            Your account does not meet the necessary holding or invite criteria to enter Operations.
          </div>

          <div style={descBoxStyle}>
            <h4 style={{ color: "#fff", margin: "0 0 8px 0" }}>CURRENT VERIFIED METRICS:</h4>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", fontSize: "13px" }}>
              <div>
                <span style={{ color: "#888" }}>$THREAT Balance:</span>{" "}
                <strong style={{ color: "var(--red)" }}>
                  {profile?.verified_balance?.toLocaleString() || 0} / 1,000,000
                </strong>
              </div>
              <div>
                <span style={{ color: "#888" }}>Holder Tier:</span>{" "}
                <strong>Tier {profile?.holder_tier || 0}</strong>
              </div>
            </div>
          </div>

          {verifyStatus && (
            <div style={{ color: "var(--yellow)", fontFamily: "var(--mono)", fontSize: "11px", margin: "12px 0", textAlign: "center" }}>
              {verifyStatus}
            </div>
          )}

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", margin: "24px 0" }}>
            <div style={{ borderRight: "1px solid var(--border)", paddingRight: "16px" }}>
              <h4 style={{ color: "#fff", fontSize: "14px", margin: "0 0 12px 0" }}>ACTIVATE ACCESS KEY</h4>
              <form onSubmit={handleActivateInvite}>
                <input
                  type="text"
                  placeholder="ENTER ACCESS KEY"
                  value={inviteCode}
                  onChange={(e) => setInviteCode(e.target.value.toUpperCase())}
                  disabled={activating}
                  style={inputStyle}
                />
                <button
                  type="submit"
                  disabled={activating || !inviteCode.trim()}
                  className="btn"
                  style={{ width: "100%", textTransform: "uppercase" }}
                >
                  {activating ? "ACTIVATING..." : "ACTIVATE"}
                </button>
              </form>
            </div>

            <div style={{ display: "flex", flexDirection: "column", justifyContent: "center" }}>
              <h4 style={{ color: "#fff", fontSize: "14px", margin: "0 0 12px 0" }}>RE-AUDIT WALLET</h4>
              <p style={{ fontSize: "11px", color: "#888", margin: "0 0 12px 0" }}>
                If you have purchased $THREAT, click below to update your balance.
              </p>
              <button
                onClick={handleReVerify}
                className="btn-sec"
                style={{ width: "100%" }}
              >
                RE-VERIFY HOLDINGS
              </button>
            </div>
          </div>

          <div style={{ textAlign: "center", marginTop: "16px" }}>
            <WalletMultiButton />
          </div>
        </div>
      </div>
    );
  }

  // State 3: Access Granted
  return <>{children}</>;
}

// ─── STYLES ─────────────────────────────────────────────────────────────────
const containerStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  minHeight: "100vh",
  background: "#050505",
  padding: "20px",
  boxSizing: "border-box",
};

const panelStyle: React.CSSProperties = {
  width: "100%",
  maxWidth: "600px",
  background: "var(--surface)",
  border: "1px solid var(--border)",
  padding: "32px",
  boxSizing: "border-box",
  boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
};

const brandHeaderStyle: React.CSSProperties = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  textAlign: "center",
};

const titleStyle: React.CSSProperties = {
  fontSize: "20px",
  fontFamily: "var(--mono)",
  letterSpacing: "0.1em",
  color: "#fff",
  margin: "16px 0 4px 0",
};

const subtitleStyle: React.CSSProperties = {
  fontSize: "10px",
  fontFamily: "var(--mono)",
  letterSpacing: "0.2em",
  color: "#888",
  margin: 0,
};

const descBoxStyle: React.CSSProperties = {
  background: "rgba(0,0,0,0.3)",
  border: "1px solid var(--border)",
  padding: "16px",
  borderRadius: "4px",
};

const listStyle: React.CSSProperties = {
  margin: 0,
  paddingLeft: "20px",
  fontSize: "12px",
  lineHeight: "1.6",
  color: "#bbb",
};

const inputStyle: React.CSSProperties = {
  width: "100%",
  background: "#080808",
  border: "1px solid var(--border)",
  color: "#fff",
  padding: "8px 12px",
  fontFamily: "var(--mono)",
  fontSize: "13px",
  marginBottom: "12px",
  boxSizing: "border-box",
};

const progressBarContainerStyle: React.CSSProperties = {
  width: "200px",
  height: "4px",
  background: "#111",
  margin: "20px auto 0",
  borderRadius: "2px",
  overflow: "hidden",
};

const progressBarFillStyle: React.CSSProperties = {
  width: "100%",
  height: "100%",
  background: "var(--red)",
};
