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

// ─── Permanent grant key helpers ────────────────────────────────────────────
// Always keyed by raw publicKey.toString() — never by authIdentifier or session.
// This survives wallet disconnect / Supabase session expiry / page refresh.
const GRANT_KEY = (rawWallet: string) => `rq_invite_grant:${rawWallet}`;

function readGrant(rawWallet: string): string | null {
  if (typeof window === "undefined" || !rawWallet) return null;
  return localStorage.getItem(GRANT_KEY(rawWallet));
}

function writeGrant(rawWallet: string, accessType: string) {
  if (typeof window === "undefined" || !rawWallet) return;
  localStorage.setItem(GRANT_KEY(rawWallet), accessType);
}

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

  // Raw wallet — always stable, regardless of Supabase session
  const rawWallet = publicKey ? publicKey.toString() : "";

  // Active identifier for API calls (may include session context)
  const activeIdentifier = authIdentifier || rawWallet;

  const getAuthHeaders = useCallback(() => {
    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (session?.access_token) {
      headers["Authorization"] = `Bearer ${session.access_token}`;
    } else if (typeof window !== "undefined" && publicKey) {
      const savedSig = localStorage.getItem(`rq_sol_sig:${rawWallet}`);
      if (savedSig) {
        try {
          const { signature, message } = JSON.parse(savedSig);
          headers["X-Solana-PublicKey"] = rawWallet;
          headers["X-Solana-Signature"] = signature;
          headers["X-Solana-Message"] = message;
        } catch (e) { /* ignore */ }
      }
    }
    return headers;
  }, [session, publicKey, rawWallet]);

  // ─── Core access check ────────────────────────────────────────────────────
  const checkAccess = useCallback(async (identifier: string) => {
    if (!identifier || !rawWallet) return;
    setProfileLoading(true);
    setVerifyStatus("");

    try {
      // STEP 0 — Check permanent localStorage grant first (session-independent)
      const persistedGrant = readGrant(rawWallet);
      if (persistedGrant === "Invite" || persistedGrant === "Holder" || persistedGrant === "Admin") {
        // Load game profile from cache or create minimal stub
        const cached = localStorage.getItem(`rq_ops_profile:${rawWallet}`) ||
                       localStorage.getItem(`rq_ops_profile:${identifier}`);
        const prof = cached ? (() => { try { return JSON.parse(cached); } catch { return null; } })() : null;
        setProfile(prof || { access_type: persistedGrant, holder_tier: 0, verified_balance: 0 });
        setAccessGranted(true);
        setProfileLoading(false);
        return;
      }

      let prof: any = null;

      // STEP 1 — Try DB via API
      try {
        const headers = getAuthHeaders();
        const res = await fetch(`/api/profile?wallet=${rawWallet}`, { headers });
        if (res.ok) {
          const data = await res.json();
          if (data?.profile) prof = data.profile;
        }
      } catch (dbErr) {
        console.warn("AccessGuard: db lookup failed:", dbErr);
      }

      // STEP 2 — Fallback: localStorage (try both raw wallet and authIdentifier keys)
      if (!prof) {
        const keys = [`rq_ops_profile:${rawWallet}`, `rq_ops_profile:${identifier}`];
        for (const key of keys) {
          const saved = localStorage.getItem(key);
          if (saved) {
            try { prof = JSON.parse(saved); break; } catch { /* ignore */ }
          }
        }
      }

      // STEP 3 — Evaluate profile permissions
      if (prof) {
        const hasBalance = (prof.verified_balance || prof.verifiedBalance || 0) >= 1000000
          || (prof.holder_tier || prof.holderTier || 0) >= 2;
        const hasInvite = ["Invite", "Holder", "Admin"].some(
          t => prof.access_type === t || prof.accessType === t
        );
        if (hasBalance || hasInvite) {
          // Write permanent grant so next refresh skips all this
          writeGrant(rawWallet, prof.access_type || prof.accessType || (hasBalance ? "Holder" : "Invite"));
          localStorage.setItem(`rq_ops_profile:${rawWallet}`, JSON.stringify(prof));
          setProfile(prof);
          setAccessGranted(true);
          setProfileLoading(false);
          return;
        }
      }

      // STEP 4 — On-chain Solana RPC check
      if (rawWallet) {
        setVerifyStatus("QUERYING SOLANA MAINNET FOR $THREAT HOLDINGS...");
        try {
          const { Connection, PublicKey } = await import("@solana/web3.js");
          const { getAssociatedTokenAddress } = await import("@solana/spl-token");
          const rpcUrl = process.env.NEXT_PUBLIC_SOLANA_RPC_URL || "https://solana-rpc.publicnode.com";
          const connection = new Connection(rpcUrl, "confirmed");
          const walletPubkey = new PublicKey(rawWallet);
          const mintPubkey = new PublicKey("AUCYMsSZXASMiXfjLNL26NF7sPehUA4ncEzTCx8MdSYg");
          const ata = await getAssociatedTokenAddress(mintPubkey, walletPubkey);
          const balanceResponse = await connection.getTokenAccountBalance(ata);
          const balance = balanceResponse.value.uiAmount || 0;
          if (balance >= 1000000) {
            setVerifyStatus(`VERIFIED: ${balance.toLocaleString()} $THREAT. ACCESS GRANTED.`);
            const updatedProf = {
              ...(prof || {}),
              name: prof?.name || "OPERATIVE",
              faction: prof?.faction || "None",
              class: prof?.class || "None",
              role: prof?.role || "None",
              level: prof?.level || 1,
              xp: prof?.xp || 0,
              credits: prof?.credits || 500,
              reputation: prof?.reputation || 0,
              health: prof?.health || 100,
              verifiedBalance: balance,
              holderTier: 2,
              holderStatus: "Holder",
              accessType: "Holder",
              access_type: "Holder",
            };
            writeGrant(rawWallet, "Holder");
            localStorage.setItem(`rq_ops_profile:${rawWallet}`, JSON.stringify(updatedProf));
            setProfile(updatedProf);
            setAccessGranted(true);
            setProfileLoading(false);
            return;
          }
        } catch (chainErr) {
          console.warn("AccessGuard: RPC check failed:", chainErr);
        }
      }

      setAccessGranted(false);
    } catch (e) {
      console.error("Access verification error:", e);
      setAccessGranted(false);
    }
    setProfileLoading(false);
  }, [getAuthHeaders, rawWallet]);

  // Auto-login with Supabase (once per connect)
  useEffect(() => {
    if (connected && !session && !authLoading && loginWithWallet && !attemptedLogin) {
      setAttemptedLogin(true);
      loginWithWallet().catch(err => console.error("Wallet auto-login failed:", err));
    }
  }, [connected, session, authLoading, loginWithWallet, attemptedLogin]);

  useEffect(() => {
    if (!connected) setAttemptedLogin(false);
  }, [connected]);

  // Run access check whenever wallet connects or session changes
  useEffect(() => {
    if (connected && rawWallet) {
      checkAccess(activeIdentifier);
    } else {
      setProfile(null);
      setAccessGranted(null);
    }
  }, [connected, rawWallet, session, checkAccess]);

  // ─── Manual re-verify $THREAT balance ────────────────────────────────────
  const handleReVerify = async () => {
    if (!rawWallet) return;
    setVerifyStatus("QUERYING SOLANA BLOCKCHAIN FOR $THREAT BALANCE...");
    try {
      const { Connection, PublicKey } = await import("@solana/web3.js");
      const { getAssociatedTokenAddress } = await import("@solana/spl-token");
      const rpcUrl = process.env.NEXT_PUBLIC_SOLANA_RPC_URL || "https://solana-rpc.publicnode.com";
      const connection = new Connection(rpcUrl, "confirmed");
      const walletPubkey = new PublicKey(rawWallet);
      const mintPubkey = new PublicKey("AUCYMsSZXASMiXfjLNL26NF7sPehUA4ncEzTCx8MdSYg");
      const ata = await getAssociatedTokenAddress(mintPubkey, walletPubkey);
      const balanceResponse = await connection.getTokenAccountBalance(ata);
      const balance = balanceResponse.value.uiAmount || 0;
      if (balance >= 1000000) {
        setVerifyStatus("ON-CHAIN VERIFICATION SUCCESSFUL.");
        writeGrant(rawWallet, "Holder");
        checkAccess(activeIdentifier);
      } else {
        setVerifyStatus(`VERIFICATION FAILED: Required 1,000,000 $THREAT. Found ${balance.toLocaleString()}`);
      }
    } catch (e: any) {
      setVerifyStatus(`VERIFICATION FAILURE: ${e.message || String(e)}`);
    }
  };

  // ─── Invite activation ────────────────────────────────────────────────────
  const handleActivateInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteCode.trim() || !rawWallet) return;
    setActivating(true);
    setVerifyStatus("");
    try {
      const headers = getAuthHeaders();
      const res = await fetch("/api/invite/activate", {
        method: "POST",
        headers,
        body: JSON.stringify({ code: inviteCode, wallet: rawWallet })
      });
      const data = await res.json();
      if (data.success) {
        // Write permanent grant — always keyed by raw wallet
        writeGrant(rawWallet, "Invite");

        // Build profile stub and save it
        const existing = (() => {
          const s = localStorage.getItem(`rq_ops_profile:${rawWallet}`);
          if (s) { try { return JSON.parse(s); } catch { return {}; } }
          return {};
        })();
        const updatedProf = {
          ...existing,
          accessType: "Invite",
          access_type: "Invite",
          name: existing.name || "OPERATIVE",
          level: existing.level || 1,
          xp: existing.xp || 0,
          credits: existing.credits || 500,
          reputation: existing.reputation || 0,
          health: existing.health || 100,
        };
        localStorage.setItem(`rq_ops_profile:${rawWallet}`, JSON.stringify(updatedProf));

        setProfile(updatedProf);
        setAccessGranted(true);
      } else {
        alert(`Failed to activate: ${data.error}`);
      }
    } catch (err) {
      console.error(err);
      alert("Verification Server Error");
    }
    setActivating(false);
  };

  // ─── Render states ────────────────────────────────────────────────────────

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
              <li>OR activate a valid <strong>Access Code</strong> issued by Solvival Corp.</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  if (authLoading || profileLoading || accessGranted === null) {
    return (
      <div style={containerStyle}>
        <div style={{ textAlign: "center", fontFamily: "var(--mono)", color: "var(--red)" }}>
          <p style={{ letterSpacing: "0.1em", fontSize: "14px" }}>
            [ SECURING ENCRYPTED ACCESS PORTALS... ]
          </p>
          <div style={progressBarContainerStyle}>
            <div style={progressBarFillStyle} />
          </div>
          {verifyStatus && (
            <p style={{ fontSize: "11px", color: "#888", marginTop: "12px" }}>{verifyStatus}</p>
          )}
        </div>
      </div>
    );
  }

  if (accessGranted === false) {
    return (
      <div style={containerStyle}>
        <div style={panelStyle}>
          <div style={brandHeaderStyle}>
            <span style={{ color: "var(--red)", fontSize: "36px" }}>⚠️</span>
            <h1 style={{ ...titleStyle, color: "var(--red)" }}>ACCESS RESTRICTED</h1>
            <p style={subtitleStyle}>IDENTIFIER: {rawWallet.slice(0, 8)}...{rawWallet.slice(-8)}</p>
          </div>

          <div className="alert error" style={{ margin: "20px 0" }}>
            Your account does not meet the necessary holding or access code criteria.
          </div>

          <div style={descBoxStyle}>
            <h4 style={{ color: "#fff", margin: "0 0 8px 0" }}>CURRENT VERIFIED METRICS:</h4>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", fontSize: "13px" }}>
              <div>
                <span style={{ color: "#888" }}>$THREAT Balance:</span>{" "}
                <strong style={{ color: "var(--red)" }}>
                  {(profile?.verified_balance || 0).toLocaleString()} / 1,000,000
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
              <h4 style={{ color: "#fff", fontSize: "14px", margin: "0 0 12px 0" }}>ACTIVATE ACCESS CODE</h4>
              <form onSubmit={handleActivateInvite}>
                <input
                  type="text"
                  placeholder="ENTER ACCESS CODE"
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
                If you have purchased $THREAT, click below to verify your balance.
              </p>
              <button onClick={handleReVerify} className="btn-sec" style={{ width: "100%" }}>
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

  return <>{children}</>;
}

// ─── STYLES ─────────────────────────────────────────────────────────────────
const containerStyle: React.CSSProperties = {
  display: "flex", flexDirection: "column", alignItems: "center",
  justifyContent: "center", minHeight: "100vh", background: "#050505",
  padding: "20px", boxSizing: "border-box",
};
const panelStyle: React.CSSProperties = {
  width: "100%", maxWidth: "600px", background: "var(--surface)",
  border: "1px solid var(--border)", padding: "32px", boxSizing: "border-box",
  boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
};
const brandHeaderStyle: React.CSSProperties = {
  display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center",
};
const titleStyle: React.CSSProperties = {
  fontSize: "20px", fontFamily: "var(--mono)", letterSpacing: "0.1em",
  color: "#fff", margin: "16px 0 4px 0",
};
const subtitleStyle: React.CSSProperties = {
  fontSize: "10px", fontFamily: "var(--mono)", letterSpacing: "0.2em", color: "#888", margin: 0,
};
const descBoxStyle: React.CSSProperties = {
  background: "rgba(0,0,0,0.3)", border: "1px solid var(--border)", padding: "16px", borderRadius: "4px",
};
const listStyle: React.CSSProperties = {
  margin: 0, paddingLeft: "20px", fontSize: "12px", lineHeight: "1.6", color: "#bbb",
};
const inputStyle: React.CSSProperties = {
  width: "100%", background: "#080808", border: "1px solid var(--border)", color: "#fff",
  padding: "8px 12px", fontFamily: "var(--mono)", fontSize: "13px",
  marginBottom: "12px", boxSizing: "border-box",
};
const progressBarContainerStyle: React.CSSProperties = {
  width: "200px", height: "4px", background: "#111", margin: "20px auto 0",
  borderRadius: "2px", overflow: "hidden",
};
const progressBarFillStyle: React.CSSProperties = {
  width: "100%", height: "100%", background: "var(--red)",
};
