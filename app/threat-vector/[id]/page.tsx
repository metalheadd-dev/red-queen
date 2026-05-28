"use client";
import { useState, useEffect, use } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { Connection, PublicKey, Transaction, TransactionInstruction } from "@solana/web3.js";
import Link from "next/link";
import { CATEGORIES, Threat } from "@/lib/threats";

const TOKEN_PROGRAM_ID = new PublicKey("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA");
const ASSOCIATED_TOKEN_PROGRAM_ID = new PublicKey("ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL");

// Decides token mint based on network endpoint
function getUSDCMint(endpoint: string): PublicKey {
  if (endpoint.includes("devnet")) {
    return new PublicKey("4zMMC9srt5Ri5X14GAgXwiHii3tzconxEksHXrTXst6H"); // Devnet USDC
  }
  return new PublicKey("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"); // Mainnet USDC
}

function getAssociatedTokenAddress(mint: PublicKey, owner: PublicKey): PublicKey {
  const [address] = PublicKey.findProgramAddressSync(
    [owner.toBuffer(), TOKEN_PROGRAM_ID.toBuffer(), mint.toBuffer()],
    ASSOCIATED_TOKEN_PROGRAM_ID
  );
  return address;
}

function createTransferInstruction(
  source: PublicKey,
  destination: PublicKey,
  owner: PublicKey,
  amount: number
): TransactionInstruction {
  const keys = [
    { pubkey: source, isSigner: false, isWritable: true },
    { pubkey: destination, isSigner: false, isWritable: true },
    { pubkey: owner, isSigner: true, isWritable: false },
  ];

  // Manual byte construction to avoid client-side Buffer errors
  const data = new Uint8Array(9);
  data[0] = 3; // Transfer instruction index
  // Write little endian u64 for amount
  let temp = amount;
  for (let i = 1; i <= 8; i++) {
    data[i] = temp & 0xff;
    temp = temp >> 8;
  }

  return new TransactionInstruction({
    keys,
    programId: TOKEN_PROGRAM_ID,
    data: data as any,
  });
}

export default function ThreatDossierPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const id = resolvedParams.id;
  const { publicKey, connected, sendTransaction } = useWallet();
  const { setVisible } = useWalletModal();

  const [threat, setThreat] = useState<Threat | null>(null);
  const [category, setCategory] = useState<any>(null);
  
  const [revealed, setRevealed] = useState(false);
  const [glitching, setGlitching] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // x402 payment requirements
  const [showModal, setShowModal] = useState(false);
  const [paymentMeta, setPaymentMeta] = useState<any>(null);
  const [submittingPayment, setSubmittingPayment] = useState(false);
  
  // Custom Dynamic Report for Sector Delta
  const [diagnosticsReport, setDiagnosticsReport] = useState<string | null>(null);

  useEffect(() => {
    let foundThreat: Threat | null = null;
    let foundCat: any = null;

    for (const cat of CATEGORIES) {
      const match = cat.threats.find((t) => t.id === id);
      if (match) {
        foundThreat = match;
        foundCat = cat;
        break;
      }
    }

    setThreat(foundThreat);
    setCategory(foundCat);
  }, [id]);

  if (!threat || !category) {
    return (
      <div style={{ padding: "120px 24px 60px", textTransform: "uppercase", fontFamily: "var(--mono)", color: "var(--accent)", background: "#050505", minHeight: "100vh" }} className="container">
        [ERR_0x04] VECTOR ID NOT FOUND IN DATABASE.
        <br /><br />
        <Link href="/threat-vector" className="btn btn-ghost" style={{ marginTop: "20px" }}>RETURN TO HUB</Link>
      </div>
    );
  }

  const isSectorDelta = category.key === "algorithmic";

  async function handleDecryptClick() {
    if (isSectorDelta) {
      setLoading(true);
      try {
        const res = await fetch(`/api/terminal/analyze-wallet?vector=${threat!.id}&wallet=${publicKey?.toString() || ""}`, {
          method: "POST"
        });

        if (res.status === 402) {
          const challengeBase64 = res.headers.get("PAYMENT-REQUIRED");
          if (challengeBase64) {
            try {
              const decoded = JSON.parse(atob(challengeBase64));
              setPaymentMeta({
                amount: parseFloat(decoded.amount),
                recipient: decoded.recipient,
                token: decoded.token,
                network: decoded.network
              });
            } catch (err) {
              console.error("Failed to decode challenge Base64:", err);
              setPaymentMeta({
                amount: 0.05,
                recipient: "RedQnBv2pTwtE4x3o5dM4rQ1tBvM2bTwtE4x3o5dM4r",
                token: "USDC",
                network: "solana-devnet"
              });
            }
          } else {
            const reqAmount = res.headers.get("PAYMENT-REQUIRED-AMOUNT") || "0.05";
            const reqRecipient = res.headers.get("PAYMENT-REQUIRED-RECIPIENT") || "RedQnBv2pTwtE4x3o5dM4rQ1tBvM2bTwtE4x3o5dM4r";
            const reqToken = res.headers.get("PAYMENT-REQUIRED-TOKEN") || "USDC";
            const reqNetwork = res.headers.get("PAYMENT-REQUIRED-NETWORK") || "solana-mainnet";

            setPaymentMeta({
              amount: parseFloat(reqAmount),
              recipient: reqRecipient,
              token: reqToken,
              network: reqNetwork
            });
          }
          setShowModal(true);
        } else if (res.ok) {
          const data = await res.json();
          setDiagnosticsReport(data.report);
          triggerDecryptAnimation();
        } else {
          const err = await res.json().catch(() => ({}));
          alert(err.error || "[ERR_0x9B] Decryption trigger failed.");
        }
      } catch (err) {
        console.error(err);
      } finally {
        setLoading(false);
      }
    } else {
      triggerDecryptAnimation();
    }
  }

  function triggerDecryptAnimation() {
    setGlitching(true);
    setTimeout(() => {
      setGlitching(false);
      setRevealed(true);
    }, 650);
  }

  async function handleConfirmPayment() {
    if (!connected || !publicKey) {
      setVisible(true);
      return;
    }

    setSubmittingPayment(true);
    try {
      // Determine the RPC Connection based on network
      const networkUrl = paymentMeta.network === "solana-devnet" 
        ? "https://api.devnet.solana.com" 
        : "https://api.mainnet-beta.solana.com";

      const connection = new Connection(networkUrl, "confirmed");
      const usdcMint = getUSDCMint(networkUrl);
      const recipientPubkey = new PublicKey(paymentMeta.recipient);

      // Derive token accounts
      const userAta = getAssociatedTokenAddress(usdcMint, publicKey);
      const recipientAta = getAssociatedTokenAddress(usdcMint, recipientPubkey);

      // Decimals is 6, 0.05 USDC = 50,000 base units
      const amountBase = Math.round(paymentMeta.amount * 1_000_000);

      // Create transaction
      const transaction = new Transaction().add(
        createTransferInstruction(userAta, recipientAta, publicKey, amountBase)
      );

      // Fetch latest blockhash
      const { blockhash } = await connection.getLatestBlockhash("confirmed");
      transaction.recentBlockhash = blockhash;
      transaction.feePayer = publicKey;

      // Request user signature
      const signature = await sendTransaction(transaction, connection);
      
      // Wait for confirmation
      await connection.confirmTransaction(signature, "confirmed");

      // Resubmit with signature header
      const res = await fetch(`/api/terminal/analyze-wallet?vector=${threat!.id}&wallet=${publicKey.toString()}`, {
        method: "POST",
        headers: {
          "X-PAYMENT-SIGNATURE": signature,
          "X-USER-WALLET": publicKey.toString()
        }
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.error || "Server validation failed.");
      }

      const data = await res.json();
      setDiagnosticsReport(data.report);
      setShowModal(false);
      triggerDecryptAnimation();
    } catch (err: any) {
      console.error("Payment confirmation failed:", err);
      alert(`[ERR_0x42] TRANSACTION FAILED: ${err.message || "Ensure you have USDC in your wallet"}`);
    } finally {
      setSubmittingPayment(false);
    }
  }

  return (
    <div style={{ padding: "80px 0 60px", minHeight: "100vh", background: "#050505" }}>
      <div className="container" style={{ padding: "24px" }}>
        {/* Breadcrumb */}
        <div style={{ marginBottom: "24px" }}>
          <Link href="/threat-vector" style={{ fontFamily: "var(--mono)", fontSize: "11px", color: category.color, textDecoration: "none", letterSpacing: "0.15em" }}>
            ← BACK TO MATRIX
          </Link>
        </div>

        {/* Dossier Card */}
        <div className="threat-card" style={{ borderColor: category.color + "25", padding: "32px", background: "var(--surface)" }}>
          {/* Card Header */}
          <div className="threat-card-header" style={{ borderBottom: "1px solid var(--border)", paddingBottom: "24px", marginBottom: "24px" }}>
            <div>
              <div style={{ fontFamily: "var(--mono)", fontSize: "10px", color: category.color, letterSpacing: "0.2em", marginBottom: "6px" }}>
                {threat.id} — {threat.classification}
              </div>
              <h1 className="glow-text" style={{ fontSize: "28px", margin: 0 }}>{threat.name}</h1>
              <div style={{ fontFamily: "var(--mono)", fontSize: "11px", color: "var(--text-dim)", marginTop: "8px" }}>
                ORIGIN SYSTEM: {threat.origin}
              </div>
            </div>
            
            <div style={{ marginLeft: "auto", textAlign: "right" }}>
              <div className={`tag ${threat.level > 90 ? "tag-red" : threat.level > 70 ? "tag-yellow" : "tag-green"}`}>
                {threat.status}
              </div>
              <div style={{ fontFamily: "var(--mono)", fontSize: "36px", color: category.color, marginTop: "8px", lineHeight: 1 }}>
                {threat.level}%
              </div>
              <div style={{ fontFamily: "var(--mono)", fontSize: "9px", color: "var(--text-dim)", letterSpacing: "0.15em" }}>THREAT SCALE</div>
              <div className="threat-bar-wrap" style={{ marginTop: "8px", width: "140px" }}>
                <div className="threat-bar-fill" style={{ width: `${threat.level}%`, background: category.color }} />
              </div>
            </div>
          </div>

          {/* Indicators & Actions */}
          <div className="threat-card-body">
            <div className="responsive-grid-2" style={{ display: "grid", gap: "24px" }}>
              <div>
                <div style={{ fontFamily: "var(--mono)", fontSize: "10px", letterSpacing: "0.2em", color: "var(--text-dim)", marginBottom: "12px" }}>
                  REPORTED SYMPTOMS & ANOMALIES
                </div>
                <ul style={{ listStyle: "none", padding: 0, display: "flex", flexDirection: "column", gap: "8px" }}>
                  {threat.symptoms.map((s, i) => (
                    <li key={i} style={{ fontFamily: "var(--mono)", fontSize: "12px", color: "var(--text-dim)", display: "flex", gap: "8px" }}>
                      <span style={{ color: category.color }}>▸</span>{s}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <div style={{ fontFamily: "var(--mono)", fontSize: "10px", letterSpacing: "0.2em", color: "var(--text-dim)", marginBottom: "12px" }}>
                  CYBER DEFENSE & SURVIVAL PROTOCOLS
                </div>
                <ul style={{ listStyle: "none", padding: 0, display: "flex", flexDirection: "column", gap: "8px" }}>
                  {threat.survival.map((s, i) => (
                    <li key={i} style={{ fontFamily: "var(--mono)", fontSize: "12px", color: "var(--text-dim)", display: "flex", gap: "8px" }}>
                      <span style={{ color: "#00ffcc" }}>✓</span>{s}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Decryption Portal */}
            <div style={{ marginTop: "32px", borderTop: "1px solid var(--border)", paddingTop: "32px" }}>
              {revealed ? (
                <div style={{ background: "rgba(0, 255, 204, 0.03)", border: "1px solid rgba(0, 255, 204, 0.2)", borderRadius: "2px", padding: "20px 24px" }}>
                  <div style={{ fontFamily: "var(--mono)", fontSize: "10px", color: "#00ffcc", letterSpacing: "0.2em", marginBottom: "12px" }}>
                    [CLEARANCE LEVEL 5 GRANTED] — SYSTEM DOSSIER DECRYPTED
                  </div>
                  <p style={{ fontFamily: "var(--mono)", fontSize: "13px", color: "var(--text-dim)", lineHeight: "1.8", margin: 0 }}>
                    {threat.classified}
                  </p>
                  
                  {isSectorDelta && diagnosticsReport && (
                    <div style={{ marginTop: "20px", borderTop: "1px dashed rgba(0, 255, 204, 0.2)", paddingTop: "20px" }}>
                      <div style={{ fontFamily: "var(--mono)", fontSize: "10px", color: "#00ffcc", letterSpacing: "0.15em", marginBottom: "8px" }}>
                        ▶ DIAGNOSTICS REPORT
                      </div>
                      <pre style={{
                        fontFamily: "var(--mono)",
                        fontSize: "12px",
                        color: "var(--text)",
                        background: "#080808",
                        border: "1px solid #111",
                        padding: "16px",
                        whiteSpace: "pre-wrap",
                        margin: 0,
                        lineHeight: "1.7",
                        textShadow: "0 0 2px rgba(0, 255, 204, 0.4)"
                      }}>
                        {diagnosticsReport}
                      </pre>
                    </div>
                  )}
                </div>
              ) : isSectorDelta ? (
                <div
                  className="redacted-viewport-locked"
                  onClick={handleDecryptClick}
                  style={{ animation: glitching ? "glitch 0.6s ease" : "none", cursor: "pointer", minHeight: "180px" }}
                >
                  {/* Glowing horizontal blockouts */}
                  <div className="redacted-blockout-line" style={{ width: "70%" }}></div>
                  <div className="redacted-blockout-line" style={{ width: "85%" }}></div>
                  <div className="redacted-blockout-line" style={{ width: "45%" }}></div>
                  <div className="redacted-blockout-line" style={{ width: "90%" }}></div>
                  
                  {/* Flickering overlay prompt */}
                  <div className="redacted-overlay-prompt">
                    <div className="redacted-flicker-text">
                      [COMPUTE GATE ENCRYPTED // REQUIRE X402 HANDSHAKE TO MAP METADATA]
                    </div>
                    <div style={{ fontFamily: "var(--mono)", fontSize: "10px", color: "var(--text-dim)", marginTop: "12px", letterSpacing: "0.15em" }}>
                      {loading ? "CHECKING CLEARANCE..." : "CLICK TO TRIGGER METADATA ANALYSIS — REQUIRES x402 PAYMENT (0.05 USDC)"}
                    </div>
                    <button className="btn btn-ghost" disabled={loading} style={{ fontSize: "11px", padding: "8px 20px", marginTop: "12px" }}>
                      {loading ? "CHECKING..." : "REQUEST SYSTEM ACCESS"}
                    </button>
                  </div>
                </div>
              ) : (
                <div
                  className="redacted"
                  onClick={handleDecryptClick}
                  style={{ animation: glitching ? "glitch 0.6s ease" : "none", cursor: "pointer", display: "flex", flexDirection: "column", gap: "12px", alignItems: "center" }}
                >
                  <div style={{ textAlign: "center" }}>
                    <div className="redacted-text" style={{ fontSize: "14px", textShadow: "0 0 4px rgba(255, 0, 51, 0.6)" }}>
                      {glitching ? "DECRYPTING..." : `█ █ █ {threat.redactedLabel} █ █ █`}
                    </div>
                    <div style={{ fontFamily: "var(--mono)", fontSize: "10px", color: "var(--text-dim)", marginTop: "6px", letterSpacing: "0.15em" }}>
                      CLICK TO DECRYPT FILE — ACCESS LEVEL 3 REQUIRED
                    </div>
                  </div>
                  <button className="btn btn-ghost" disabled={loading} style={{ fontSize: "11px", padding: "8px 20px" }}>
                    {loading ? "CHECKING CLEARANCE..." : "REQUEST SYSTEM ACCESS"}
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* x402 Payment Warning Modal */}
      {showModal && (
        <div style={{
          position: "fixed",
          top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(0, 0, 0, 0.9)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 1000,
          padding: "20px",
          backdropFilter: "blur(5px)"
        }}>
          <div style={{
            maxWidth: "500px",
            width: "100%",
            border: "1px solid var(--accent)",
            background: "#080808",
            padding: "32px",
            borderRadius: "4px",
            boxShadow: "0 0 30px rgba(255, 0, 51, 0.2)"
          }}>
            <div className="tag tag-red" style={{ marginBottom: "20px", display: "inline-block" }}>
              WARNING: PAYMENT REQUIRED
            </div>
            
            <h3 style={{ fontSize: "20px", marginBottom: "16px", letterSpacing: "0.05em" }}>
              x402 DECRYPTION UPLINK
            </h3>
            
            <p style={{ fontFamily: "var(--mono)", fontSize: "12px", color: "var(--text-dim)", lineHeight: "1.8", marginBottom: "24px" }}>
              Running a deep-network metadata trace on vector <strong style={{ color: "var(--accent)" }}>{threat.id}</strong> requires a <strong style={{ color: "var(--text)" }}>0.05 USDC</strong> micro-computation tax. 
              <br /><br />
              This non-custodial transaction goes directly to the Red Queen computational treasury balance to power dynamic diagnostic scans.
            </p>
            
            <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
              <button 
                className="btn btn-ghost" 
                onClick={() => setShowModal(false)}
                disabled={submittingPayment}
                style={{ fontSize: "11px" }}
              >
                DECLINE
              </button>
              <button 
                className="btn btn-primary" 
                onClick={handleConfirmPayment}
                disabled={submittingPayment}
                style={{ fontSize: "11px" }}
              >
                {submittingPayment ? "CONFIRMING..." : "APPROVE & TRANSMIT"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
