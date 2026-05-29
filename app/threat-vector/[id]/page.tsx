"use client";
import { useState, useEffect, use } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { Connection, PublicKey, Transaction, TransactionInstruction } from "@solana/web3.js";
import Link from "next/link";
import { CATEGORIES, Threat } from "@/lib/threats";
import { getThreatMetadata } from "@/lib/threatMetadata";

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

  const [logs, setLogs] = useState<string[]>([]);
  const [paymentStep, setPaymentStep] = useState<"idle" | "requesting" | "signing" | "settling" | "verifying" | "processing" | "compiling" | "completed">("idle");

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
    setPaymentStep("requesting");
    setLogs(["[ REQUEST ] Allocating Red Queen compute node..."]);
    
    const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

    try {
      await sleep(800);
      setLogs(prev => [...prev, `[ CHALLENGE ] HTTP 402 challenge generated: ${paymentMeta?.amount || 0.05} USDC required.`]);
      await sleep(600);
      
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

      setPaymentStep("signing");
      setLogs(prev => [...prev, "[ TRANSACTION ] Awaiting client wallet signature handshake..."]);
      await sleep(400);

      // Request user signature
      const signature = await sendTransaction(transaction, connection);
      
      setPaymentStep("settling");
      setLogs(prev => [...prev, `[ SETTLE ] Signature received: ${signature.slice(0, 12)}...`]);
      setLogs(prev => [...prev, "[ SETTLE ] Broadcasting transaction payload to Solana mainnet..."]);
      await sleep(800);

      setPaymentStep("verifying");
      setLogs(prev => [...prev, "[ VERIFY ] Confirming on-chain transaction block inclusion..."]);
      
      // Wait for confirmation
      await connection.confirmTransaction(signature, "confirmed");
      setLogs(prev => [...prev, "[ VERIFY ] Block confirmed on-chain successfully."]);
      await sleep(600);

      setPaymentStep("processing");
      setLogs(prev => [...prev, "[ PROCESS ] Signature validated. Decrypting payload files..."]);
      
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
      setLogs(prev => [...prev, "[ PROCESS ] Neural diagnostic processing loops initialized..."]);
      await sleep(800);

      setPaymentStep("compiling");
      setLogs(prev => [...prev, "[ COMPILE ] Generating custom threat diagnostics report..."]);
      await sleep(800);

      setPaymentStep("completed");
      setLogs(prev => [...prev, "[ COMPLETE ] Decryption complete. Access yielded."]);
      await sleep(600);

      setDiagnosticsReport(data.report);
      setShowModal(false);
      triggerDecryptAnimation();
      setPaymentStep("idle");
    } catch (err: any) {
      console.error("Payment confirmation failed:", err);
      setLogs(prev => [...prev, `[ ERROR ] Operation aborted: ${err.message || "Ensure you have USDC in your wallet"}`]);
      await sleep(2500);
      setPaymentStep("idle");
      setSubmittingPayment(false);
    }
  }

  const meta = getThreatMetadata(threat.id, threat.level, threat.status, category.key);

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
            <div className="responsive-grid-2" style={{ display: "grid", gap: "24px", marginBottom: "32px" }}>
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

            {/* Always Visible Live Database Telemetry Grid */}
            <div style={{ borderTop: "1px solid var(--border)", paddingTop: "32px", marginBottom: "32px" }}>
              <div style={{ fontFamily: "var(--mono)", fontSize: "11px", color: category.color, letterSpacing: "0.2em", marginBottom: "20px" }}>
                [ LIVE DATABASE METRICS & SIGNAL STABILITY ]
              </div>
              
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px", marginBottom: "24px" }}>
                <div style={{ background: "#0c0c0c", border: "1px solid #181818", padding: "16px", borderRadius: "2px" }}>
                  <div style={{ fontFamily: "var(--mono)", fontSize: "9px", color: "var(--text-dim)", letterSpacing: "0.15em", marginBottom: "6px" }}>
                    THREAT PROBABILITY
                  </div>
                  <div style={{ fontFamily: "var(--mono)", fontSize: "20px", color: "var(--text)", fontWeight: "bold" }}>
                    {meta.probability}
                  </div>
                </div>
                
                <div style={{ background: "#0c0c0c", border: "1px solid #181818", padding: "16px", borderRadius: "2px" }}>
                  <div style={{ fontFamily: "var(--mono)", fontSize: "9px", color: "var(--text-dim)", letterSpacing: "0.15em", marginBottom: "6px" }}>
                    SURVIVAL DIFFICULTY
                  </div>
                  <div style={{ fontFamily: "var(--mono)", fontSize: "14px", color: "var(--text)", fontWeight: "bold", textTransform: "uppercase" }}>
                    {meta.difficulty}
                  </div>
                </div>

                <div style={{ background: "#0c0c0c", border: "1px solid #181818", padding: "16px", borderRadius: "2px" }}>
                  <div style={{ fontFamily: "var(--mono)", fontSize: "9px", color: "var(--text-dim)", letterSpacing: "0.15em", marginBottom: "6px" }}>
                    CONTAINMENT STATUS
                  </div>
                  <div style={{ fontFamily: "var(--mono)", fontSize: "12px", color: "#ff4d4d", fontWeight: "bold", textTransform: "uppercase" }}>
                    {meta.containmentStatus}
                  </div>
                </div>

                <div style={{ background: "#0c0c0c", border: "1px solid #181818", padding: "16px", borderRadius: "2px" }}>
                  <div style={{ fontFamily: "var(--mono)", fontSize: "9px", color: "var(--text-dim)", letterSpacing: "0.15em", marginBottom: "6px" }}>
                    RELATED VECTORS
                  </div>
                  <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginTop: "4px" }}>
                    {meta.relatedThreats.map((rt) => (
                      <Link key={rt} href={`/threat-vector/${rt}`} style={{ fontFamily: "var(--mono)", fontSize: "11px", color: category.color, textDecoration: "underline" }}>
                        {rt}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>

              {/* Live Updates & Incidents Row */}
              <div className="responsive-grid-2" style={{ display: "grid", gap: "20px" }}>
                <div style={{ background: "#080808", border: "1px dashed var(--border)", padding: "16px", borderRadius: "2px" }}>
                  <div style={{ fontFamily: "var(--mono)", fontSize: "10px", color: "var(--text)", letterSpacing: "0.15em", marginBottom: "8px" }}>
                    📡 LIVE INCIDENT TELEMETRY
                  </div>
                  <div style={{ fontFamily: "var(--mono)", fontSize: "11.5px", color: "var(--text-dim)", lineHeight: "1.6" }}>
                    {meta.liveUpdates}
                  </div>
                </div>

                <div style={{ background: "#080808", border: "1px dashed var(--border)", padding: "16px", borderRadius: "2px" }}>
                  <div style={{ fontFamily: "var(--mono)", fontSize: "10px", color: "var(--text)", letterSpacing: "0.15em", marginBottom: "8px" }}>
                    ⚠️ RECENT SPECIFIC INCIDENTS
                  </div>
                  <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "6px" }}>
                    {meta.recentIncidents.map((incident, idx) => (
                      <li key={idx} style={{ fontFamily: "var(--mono)", fontSize: "11.5px", color: "var(--text-dim)", display: "flex", gap: "6px" }}>
                        <span style={{ color: "var(--accent)" }}>•</span>{incident}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Decryption Portal */}
            <div style={{ borderTop: "1px solid var(--border)", paddingTop: "32px" }}>
              {revealed ? (
                category.key === "realistic" ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: "32px", marginTop: "24px" }}>
                    {/* 1. Threat Overview */}
                    <div className="panel" style={{ borderColor: "rgba(255, 77, 77, 0.15)", background: "rgba(10,10,10,0.4)" }}>
                      <h3 style={{ fontFamily: "var(--title-font)", fontSize: "16px", color: "var(--accent)", marginBottom: "12px", borderBottom: "1px dashed rgba(255, 77, 77, 0.2)", paddingBottom: "8px" }}>
                        1. THREAT OVERVIEW
                      </h3>
                      <p style={{ fontSize: "14.5px", color: "var(--text-dim)", lineHeight: "1.8", margin: 0 }}>
                        {threat.name} is classified as a {threat.classification} level hazard. This archive provides early-warning telemetry indicators and emergency tactical guides for civilian networks.
                      </p>
                    </div>

                    {/* 2. How It Operates */}
                    <div className="panel" style={{ borderColor: "rgba(255, 77, 77, 0.15)", background: "rgba(10,10,10,0.4)" }}>
                      <h3 style={{ fontFamily: "var(--title-font)", fontSize: "16px", color: "var(--accent)", marginBottom: "16px", borderBottom: "1px dashed rgba(255, 77, 77, 0.2)", paddingBottom: "8px" }}>
                        2. HOW IT OPERATES
                      </h3>
                      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                        {meta.timelineProgression.map((step, idx) => (
                          <div key={idx} style={{ display: "flex", gap: "16px", alignItems: "flex-start" }}>
                            <span style={{ fontFamily: "var(--mono)", fontSize: "12px", color: "var(--accent)", fontWeight: "bold", background: "rgba(255, 77, 77, 0.05)", border: "1px solid rgba(255, 77, 77, 0.2)", width: "24px", height: "24px", display: "flex", alignItems: "center", justifyItems: "center", justifyContent: "center", borderRadius: "2px", flexShrink: 0 }}>
                              0{idx + 1}
                            </span>
                            <span style={{ fontFamily: "var(--mono)", fontSize: "12.5px", color: "var(--text-dim)", lineHeight: "1.6", marginTop: "3px" }}>
                              {step}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }} className="responsive-grid-2-large">
                      {/* 3. Warning Signs */}
                      <div className="panel" style={{ borderColor: "rgba(255, 77, 77, 0.15)", background: "rgba(10,10,10,0.4)" }}>
                        <h3 style={{ fontFamily: "var(--title-font)", fontSize: "16px", color: "var(--accent)", marginBottom: "12px", borderBottom: "1px dashed rgba(255, 77, 77, 0.2)", paddingBottom: "8px" }}>
                          3. WARNING SIGNS
                        </h3>
                        <ul style={{ listStyle: "none", padding: 0, display: "flex", flexDirection: "column", gap: "8px" }}>
                          {threat.symptoms.map((s, i) => (
                            <li key={i} style={{ fontFamily: "var(--mono)", fontSize: "12.5px", color: "var(--text-dim)", display: "flex", gap: "8px" }}>
                              <span style={{ color: "var(--accent)" }}>▸</span>{s}
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* 4. Survival Protocols */}
                      <div className="panel" style={{ borderColor: "rgba(255, 77, 77, 0.15)", background: "rgba(10,10,10,0.4)" }}>
                        <h3 style={{ fontFamily: "var(--title-font)", fontSize: "16px", color: "var(--accent)", marginBottom: "12px", borderBottom: "1px dashed rgba(255, 77, 77, 0.2)", paddingBottom: "8px" }}>
                          4. SURVIVAL PROTOCOLS
                        </h3>
                        <ul style={{ listStyle: "none", padding: 0, display: "flex", flexDirection: "column", gap: "8px" }}>
                          {threat.survival.map((s, i) => (
                            <li key={i} style={{ fontFamily: "var(--mono)", fontSize: "12.5px", color: "var(--text-dim)", display: "flex", gap: "8px" }}>
                              <span style={{ color: "#00ffcc" }}>✓</span>{s}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {/* 5. RED QUEEN Analysis */}
                    <div style={{ background: "rgba(255, 0, 51, 0.03)", borderLeft: "4px solid var(--accent)", padding: "24px", borderRadius: "0 2px 2px 0" }}>
                      <h3 style={{ fontFamily: "var(--title-font)", fontSize: "14px", color: "var(--accent)", marginBottom: "8px", letterSpacing: "0.1em" }}>
                        5. RED QUEEN ANALYSIS DIRECTIVE
                      </h3>
                      <p style={{ fontFamily: "var(--mono)", fontSize: "13px", fontStyle: "italic", color: "var(--text)", lineHeight: "1.7", margin: 0 }}>
                        "{meta.aiCommentary}"
                      </p>
                      <div style={{ marginTop: "16px", paddingTop: "12px", borderTop: "1px dashed rgba(255,77,77,0.15)", fontFamily: "var(--mono)", fontSize: "12.5px", color: "var(--text-dim)" }}>
                        <strong>Classified Payload:</strong> {threat.classified}
                      </div>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }} className="responsive-grid-2-large">
                      {/* 6. Risk Level */}
                      <div className="panel" style={{ borderColor: "rgba(255, 77, 77, 0.15)", background: "rgba(10,10,10,0.4)" }}>
                        <h3 style={{ fontFamily: "var(--title-font)", fontSize: "16px", color: "var(--accent)", marginBottom: "12px", borderBottom: "1px dashed rgba(255, 77, 77, 0.2)", paddingBottom: "8px" }}>
                          6. RISK LEVEL DIAGNOSTICS
                        </h3>
                        <div style={{ display: "flex", flexDirection: "column", gap: "10px", fontFamily: "var(--mono)", fontSize: "12.5px" }}>
                          <div style={{ display: "flex", justifyContent: "space-between" }}>
                            <span>CRITICALITY RATING:</span>
                            <span style={{ color: "var(--accent)", fontWeight: "bold" }}>{threat.level}%</span>
                          </div>
                          <div style={{ display: "flex", justifyContent: "space-between" }}>
                            <span>DIFFICULTY CLASS:</span>
                            <span style={{ color: "var(--accent)", fontWeight: "bold" }}>{meta.difficulty}</span>
                          </div>
                          <div style={{ display: "flex", justifyContent: "space-between" }}>
                            <span>CONTAINMENT STATUS:</span>
                            <span style={{ color: "#ff4d4d", fontWeight: "bold" }}>{meta.containmentStatus}</span>
                          </div>
                        </div>
                      </div>

                      {/* 7. Related Threats */}
                      <div className="panel" style={{ borderColor: "rgba(255, 77, 77, 0.15)", background: "rgba(10,10,10,0.4)" }}>
                        <h3 style={{ fontFamily: "var(--title-font)", fontSize: "16px", color: "var(--accent)", marginBottom: "12px", borderBottom: "1px dashed rgba(255, 77, 77, 0.2)", paddingBottom: "8px" }}>
                          7. RELATED DOSSIERS
                        </h3>
                        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                          {meta.relatedThreats.map((rt) => (
                            <Link key={rt} href={`/threat-vector/${rt}`} style={{ fontFamily: "var(--mono)", fontSize: "12px", color: "var(--accent)", textDecoration: "underline", background: "rgba(255,77,77,0.04)", border: "1px solid rgba(255,77,77,0.1)", padding: "6px 12px", borderRadius: "2px" }}>
                              ↗ {rt}
                            </Link>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                    {/* RED QUEEN AI Commentary */}
                    <div style={{ background: "rgba(255, 0, 51, 0.02)", borderLeft: "3px solid var(--accent)", padding: "20px", borderRadius: "0 2px 2px 0" }}>
                      <div style={{ fontFamily: "var(--mono)", fontSize: "10px", color: "var(--accent)", letterSpacing: "0.15em", marginBottom: "8px" }}>
                        [ RED QUEEN DIRECTIVE // CLASSIFIED COMMENTARY ]
                      </div>
                      <div style={{ fontFamily: "var(--mono)", fontSize: "12.5px", fontStyle: "italic", color: "var(--text)", lineHeight: "1.7" }}>
                        "{meta.aiCommentary}"
                      </div>
                    </div>

                    {/* Core Decrypted File content */}
                    <div style={{ background: "rgba(0, 255, 204, 0.03)", border: "1px solid rgba(0, 255, 204, 0.2)", borderRadius: "2px", padding: "20px 24px" }}>
                      <div style={{ fontFamily: "var(--mono)", fontSize: "10px", color: "#00ffcc", letterSpacing: "0.2em", marginBottom: "12px" }}>
                        [CLEARANCE LEVEL 5 GRANTED] — SECURE DOSSIER PAYLOAD
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

                    {/* Vector Escalation Timeline */}
                    <div style={{ background: "#080808", border: "1px solid var(--border)", padding: "24px", borderRadius: "2px" }}>
                      <div style={{ fontFamily: "var(--mono)", fontSize: "10px", color: "#00ffcc", letterSpacing: "0.15em", marginBottom: "16px" }}>
                        [ SHIELD ANALYSIS: VECTOR ESCALATION PIPELINE ]
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                        {meta.timelineProgression.map((step, idx) => (
                          <div key={idx} style={{ display: "flex", gap: "16px", alignItems: "flex-start" }}>
                            <span style={{ fontFamily: "var(--mono)", fontSize: "12px", color: "#00ffcc", fontWeight: "bold", background: "rgba(0, 255, 204, 0.05)", border: "1px solid rgba(0, 255, 204, 0.2)", width: "24px", height: "24px", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "2px", flexShrink: 0 }}>
                              0{idx + 1}
                            </span>
                            <span style={{ fontFamily: "var(--mono)", fontSize: "12px", color: "var(--text-dim)", lineHeight: "1.6", marginTop: "3px" }}>
                              {step}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    {/* Action Plan */}
                    <div style={{ background: "#080808", border: "1px solid var(--border)", padding: "24px", borderRadius: "2px" }}>
                      <div style={{ fontFamily: "var(--mono)", fontSize: "10px", color: "#00ffcc", letterSpacing: "0.15em", marginBottom: "16px" }}>
                        [ COUNTER-MEASURE ACTIONS RECON ]
                      </div>
                      <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "10px" }}>
                        {meta.recommendedActions.map((action, idx) => (
                          <li key={idx} style={{ fontFamily: "var(--mono)", fontSize: "12px", color: "var(--text)", display: "flex", gap: "10px", alignItems: "center" }}>
                            <span style={{ color: "#00ffcc", fontWeight: "bold" }}>✔</span>
                            <span>{action}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )
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
            {paymentStep !== "idle" ? (
              <div>
                <div className="tag tag-red" style={{ marginBottom: "20px", display: "inline-block", fontFamily: "var(--mono)" }}>
                  [ COMPUTE HANDSHAKE LOGS ]
                </div>
                
                <div style={{
                  background: "#020202",
                  border: "1px solid #151515",
                  padding: "20px",
                  borderRadius: "2px",
                  height: "220px",
                  overflowY: "auto",
                  display: "flex",
                  flexDirection: "column",
                  gap: "8px",
                  fontFamily: "var(--mono)",
                  fontSize: "11.5px",
                  color: "var(--accent)",
                  marginBottom: "24px",
                  boxShadow: "inset 0 0 10px rgba(0,0,0,0.8)"
                }}>
                  {logs.map((log, i) => {
                    const isError = log.includes("[ ERROR ]");
                    const isComplete = log.includes("[ COMPLETE ]");
                    return (
                      <div 
                        key={i} 
                        style={{ 
                          color: isError 
                            ? "#ff4d4d" 
                            : isComplete 
                            ? "#00ffcc" 
                            : "var(--accent)",
                          textShadow: isComplete 
                            ? "0 0 4px rgba(0, 255, 204, 0.4)" 
                            : "none"
                        }}
                      >
                        {log}
                      </div>
                    );
                  })}
                  {paymentStep !== "completed" && !logs.some(l => l.includes("[ ERROR ]")) && (
                    <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                      <span className="loading-dots"><span>.</span><span>.</span><span>.</span></span>
                    </div>
                  )}
                </div>

                <div style={{ display: "flex", justifyContent: "flex-end" }}>
                  {logs.some(l => l.includes("[ ERROR ]")) && (
                    <button 
                      className="btn btn-ghost" 
                      onClick={() => { setPaymentStep("idle"); setSubmittingPayment(false); }}
                      style={{ fontSize: "11px", fontFamily: "var(--mono)" }}
                    >
                      [ RETRY / CLOSE ]
                    </button>
                  )}
                </div>
              </div>
            ) : (
              <div>
                <div className="tag tag-red" style={{ marginBottom: "20px", display: "inline-block", fontFamily: "var(--mono)" }}>
                  [ COMPUTE REQUEST DETECTED ]
                </div>
                
                <h3 style={{ fontSize: "16px", marginBottom: "16px", letterSpacing: "0.05em", fontFamily: "var(--mono)", lineHeight: "1.6", color: "var(--text)" }}>
                  Advanced intelligence analysis requires additional processing allocation.
                </h3>
                
                <p style={{ fontFamily: "var(--mono)", fontSize: "12.5px", color: "var(--text-dim)", marginBottom: "24px", lineHeight: "1.6" }}>
                  x402 settlement required: <span style={{ color: "var(--accent)" }}>{paymentMeta?.amount || 0.05} USDC</span>. This handles server-side OpenAI compute cycles and private cryptographic indexing key processing.
                </p>
                
                <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end" }}>
                  <button 
                    className="btn btn-ghost" 
                    onClick={() => setShowModal(false)}
                    disabled={submittingPayment}
                    style={{ fontSize: "11px", fontFamily: "var(--mono)" }}
                  >
                    [ DECLINE ]
                  </button>
                  <button 
                    className="btn btn-primary" 
                    onClick={handleConfirmPayment}
                    disabled={submittingPayment}
                    style={{ fontSize: "11px", fontFamily: "var(--mono)" }}
                  >
                    [ INITIATE SETTLEMENT ]
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
