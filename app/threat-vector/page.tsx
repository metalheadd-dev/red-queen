"use client";
import { useState, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { Connection, PublicKey } from "@solana/web3.js";
import Link from "next/link";
import { CATEGORIES, Threat } from "@/lib/threats";
import { getWorkingConnection } from "@/lib/solana";

const THREAT_MINT = new PublicKey("3SBP25W239gQwTjTebshDcyNKBzM1J9ADRyqDqLQpump");

export default function ThreatVectorPage() {
  const { publicKey, connected } = useWallet();
  const { setVisible } = useWalletModal();
  const [activeCategory, setActiveCategory] = useState("realistic");
  const [threatBalance, setThreatBalance] = useState<number | null>(null);
  const [loadingBalance, setLoadingBalance] = useState(false);

  useEffect(() => {
    async function checkBalance() {
      if (!publicKey) {
        setThreatBalance(null);
        return;
      }
      setLoadingBalance(true);
      try {
        const connection = await getWorkingConnection(false);
        const tokenAccounts = await connection.getParsedTokenAccountsByOwner(publicKey, {
          mint: THREAT_MINT,
        });
        if (tokenAccounts.value.length === 0) {
          setThreatBalance(0);
        } else {
          const balanceInfo = tokenAccounts.value[0].account.data.parsed.info.tokenAmount;
          setThreatBalance(balanceInfo.uiAmount || 0);
        }
      } catch (err) {
        console.error("Failed to query $THREAT balance:", err);
        // Fallback to mock hold if Mainnet RPC fails
        setThreatBalance(500); 
      }
      setLoadingBalance(false);
    }
    checkBalance();
  }, [publicKey]);

  const currentCat = CATEGORIES.find((c) => c.key === activeCategory)!;
  const isGated = false;
  const hasAccess = true;

  return (
    <div style={{ padding: "60px 0 0", minHeight: "100vh", background: "#050505" }}>
      {/* Header */}
      <div style={{ borderBottom: "1px solid var(--border)", padding: "48px 24px", background: "var(--surface)" }}>
        <div className="container">
          <div className="tag tag-red" style={{ marginBottom: "16px" }}>SECURE DATAFEED — RED QUEEN NODE 7.4</div>
          <h1 className="glow-text" style={{ fontSize: "clamp(28px, 5vw, 48px)", marginBottom: "8px", letterSpacing: "0.05em" }}>
            THREAT <span style={{ color: "var(--accent)" }}>ARCHIVES</span>
          </h1>
          <p style={{ fontFamily: "var(--mono)", fontSize: "12px", color: "var(--text-dim)", marginBottom: "16px", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            Interactive database of monitored digital and societal threats
          </p>
          <p style={{ fontFamily: "var(--mono)", fontSize: "13px", color: "var(--text-dim)", maxWidth: "680px", lineHeight: "1.8" }}>
            Classified central node directory of threats. Select a sector below. 
            Sector Alpha (Kinetic) and Sector Beta (Anomalies) are open to all operators.
            Sector Delta houses active algorithmic diagnostic sweeps, which verify your cryptographic footprint to map potential digital vulnerabilities.
            Sector Gamma contains entertainment-classified simulations. Hold <span style={{ color: "var(--accent)" }}>$THREAT</span> tokens for expanded clearance tiers.
          </p>
        </div>
      </div>

      {/* Category Tabs */}
      <div style={{ borderBottom: "1px solid var(--border)", background: "var(--surface)" }}>
        <div className="container" style={{ display: "flex", overflowX: "auto" }}>
          {CATEGORIES.map((cat) => {
            let classification = "CORE ARCHIVE";
            if (cat.key === "fictional") classification = "EXPERIMENTAL SIMULATION";
            else if (cat.key === "satirical") classification = "ENTERTAINMENT ARCHIVE";
            else if (cat.key === "algorithmic") classification = "ALGORITHMIC VECTOR";

            return (
              <button
                key={cat.key}
                onClick={() => setActiveCategory(cat.key)}
                style={{
                  fontFamily: "var(--mono)",
                  fontSize: "11px",
                  letterSpacing: "0.12em",
                  padding: "14px 24px",
                  background: "none",
                  border: "none",
                  borderBottom: activeCategory === cat.key ? `2px solid ${cat.color}` : "2px solid transparent",
                  color: activeCategory === cat.key ? cat.color : "var(--text-dim)",
                  cursor: "pointer",
                  transition: "all 0.2s",
                  whiteSpace: "nowrap",
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "flex-start",
                  gap: "4px"
                }}
              >
                <div>{cat.label} <span style={{ opacity: 0.5 }}>({cat.threats.length})</span></div>
                <span style={{ fontSize: "8.5px", color: "var(--text-muted)", letterSpacing: "0.05em", fontWeight: "bold" }}>
                  [{classification}]
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Main Section */}
      <div className="container" style={{ padding: "48px 24px" }}>
        {isGated && !connected ? (
          <div style={{
            textAlign: "center",
            maxWidth: "600px",
            margin: "40px auto",
            padding: "48px 32px",
            border: "1px solid rgba(255, 77, 77, 0.2)",
            background: "rgba(255, 77, 77, 0.02)",
            borderRadius: "4px"
          }}>
            <div className="tag tag-red" style={{ marginBottom: "20px" }}>SECURE DECRYPTION UPLINK REQUIRED</div>
            <h3 style={{ fontSize: "20px", marginBottom: "12px" }}>Uplink Gated</h3>
            <p style={{ fontFamily: "var(--mono)", fontSize: "12px", color: "var(--text-dim)", lineHeight: "1.8", marginBottom: "24px" }}>
              To view this sector's threat files, connect your Solana wallet. The system will inspect your public key for active $THREAT token credentials.
            </p>
            <button className="btn btn-primary" onClick={() => setVisible(true)}>CONNECT WALLET</button>
          </div>
        ) : isGated && connected && threatBalance !== null && threatBalance === 0 ? (
          <div style={{
            textAlign: "center",
            maxWidth: "600px",
            margin: "40px auto",
            padding: "48px 32px",
            border: "1px solid rgba(240, 201, 41, 0.3)",
            background: "rgba(240, 201, 41, 0.02)",
            borderRadius: "4px"
          }}>
            <div className="tag tag-yellow" style={{ marginBottom: "20px", color: "#f0c929", borderColor: "rgba(240, 201, 41, 0.3)" }}>
              $THREAT CLEARANCE CHECK FAILED
            </div>
            <h3 style={{ fontSize: "20px", marginBottom: "12px", color: "#f0c929" }}>Insufficient Clearance</h3>
            <p style={{ fontFamily: "var(--mono)", fontSize: "12px", color: "var(--text-dim)", lineHeight: "1.8", marginBottom: "24px" }}>
              Your wallet holds 0 $THREAT. Level 2+ clearance is required to scan these files. Hold at least 1 $THREAT token to bypass encryption lock.
            </p>
            <div style={{ display: "flex", gap: "12px", justifyContent: "center" }}>
              <a
                href="https://pump.fun/coin/3SBP25W239gQwTjTebshDcyNKBzM1J9ADRyqDqLQpump"
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-primary"
                style={{ background: "#f0c929", color: "#000" }}
              >
                BUY $THREAT ON PUMP.FUN ↗
              </a>
            </div>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
            {loadingBalance && (
              <div style={{ fontFamily: "var(--mono)", fontSize: "12px", color: "var(--text-dim)", textAlign: "center" }}>
                DECRYPTING SECURITY SIGNATURES<span className="loading-dots"><span>.</span><span>.</span><span>.</span></span>
              </div>
            )}
            
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "24px" }}>
              {currentCat.threats.map((threat) => (
                <div key={threat.id} className="threat-card" style={{
                  display: "flex",
                  flexDirection: "column",
                  justifyContent: "space-between",
                  minHeight: "260px",
                  borderColor: currentCat.color + "25",
                  boxShadow: `0 8px 30px rgba(0,0,0,0.5), 0 0 15px ${currentCat.color}03`
                }}>
                  <div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "start", marginBottom: "12px" }}>
                      <div style={{ fontFamily: "var(--mono)", fontSize: "10px", color: currentCat.color, letterSpacing: "0.15em" }}>
                        {threat.id}
                      </div>
                      <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                        <span style={{
                          fontFamily: "var(--mono)",
                          fontSize: "9px",
                          padding: "2px 6px",
                          borderRadius: "2px",
                          fontWeight: "bold",
                          textTransform: "uppercase",
                          letterSpacing: "0.05em",
                          background: currentCat.color + "1A",
                          color: currentCat.color,
                          border: `1px solid ${currentCat.color}4D`
                        }}>
                          {activeCategory === "algorithmic" && "Algorithmic Sweep"}
                          {activeCategory === "satirical" && "Free"}
                          {activeCategory === "realistic" && "Open Access"}
                          {activeCategory === "fictional" && "Open Access"}
                        </span>
                        <div className={`tag ${threat.level > 90 ? "tag-red" : threat.level > 70 ? "tag-yellow" : "tag-green"}`} style={{ fontSize: "9px" }}>
                          {threat.status}
                        </div>
                      </div>
                    </div>
                    
                    <h3 style={{ fontSize: "18px", margin: "0 0 8px", color: "var(--text)" }}>{threat.name}</h3>
                    
                    {activeCategory === "algorithmic" && (
                      <p style={{ fontFamily: "var(--mono)", fontSize: "12px", color: "var(--text-dim)", marginBottom: "16px", lineHeight: "1.6" }}>
                        {threat.id === "WALLET-TRAIL" && "Scans open ledger records to analyze if your transactional footprints expose real-world identity markers."}
                        {threat.id === "AI-PROFILING" && "Evaluates your data footprint to predict how behavioral LLMs model and trap your market actions."}
                        {threat.id === "FEED-MANIP" && "Analyzes social handle metadata to trace if your active feeds are being targeted by automated sentiment scripts."}
                        {threat.id === "DEEPFAKE-SE" && "Runs a secure mock-interaction check to assess your vulnerability against autonomous phishing agents."}
                        {threat.id === "REPUTATION-X" && "Sweeps multi-chain telemetry grids to evaluate if your wallet address has been flagged by algorithmic blacklists."}
                        {threat.id === "META-LEAK" && "Detects leaking configuration parameters bridging your cryptographic keys to public databases."}
                        {threat.id === "SYBIL-ATTACK" && "Detects botnet crawler networks mapping clusters of pseudonymous addresses back to a single network router profile."}
                        {threat.id === "MEV-EXPLOIT" && "Monitors public transaction mempools for frontrunning sandwich sweeps and arbitrage exfiltration routes."}
                        {threat.id === "PHISHING-NET" && "Scours decentralized domains for smart contract clones designed to trick users into signing exfiltration approvals."}
                        {threat.id === "COMPUTE-HIJACK" && "Scans background browser threads for rogue WebAssembly compilation scripts draining hardware performance."}
                      </p>
                    )}

                    <div style={{ fontFamily: "var(--mono)", fontSize: "10px", color: "var(--text-dim)", marginBottom: "16px" }}>
                      CLASSIFICATION: {threat.classification}
                    </div>
                    
                    <div style={{ fontFamily: "var(--mono)", fontSize: "11px", color: "var(--text-dim)", display: "flex", gap: "8px", flexDirection: "column" }}>
                      <div style={{ display: "flex", justifyContent: "space-between" }}>
                        <span>THREAT RATE:</span>
                        <span style={{ color: currentCat.color }}>{threat.level}%</span>
                      </div>
                      <div className="threat-bar-wrap" style={{ height: "4px" }}>
                        <div className="threat-bar-fill" style={{ width: `${threat.level}%`, background: currentCat.color }} />
                      </div>
                    </div>
                  </div>
                  
                  <div style={{ marginTop: "24px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontFamily: "var(--mono)", fontSize: "10px", color: "var(--text-muted)" }}>
                      ORIGIN: {threat.origin}
                    </span>
                    <Link href={`/threat-vector/${threat.id}`} className="btn btn-ghost" style={{
                      fontSize: "10px",
                      padding: "6px 14px",
                      borderColor: currentCat.color + "50",
                      color: currentCat.color
                    }}>
                      DECRYPT DOSSIER →
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
