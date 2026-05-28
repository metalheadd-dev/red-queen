"use client";
import { useState } from "react";
import SolvivalIcon from "@/components/SolvivalIcon";

export default function SurvivalKitPage() {
  const [activeTab, setActiveTab] = useState("mission");

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", paddingTop: "60px", background: "#050505" }}>
      {/* Docs Layout */}
      <div style={{ display: "flex", flex: 1, position: "relative" }}>
        
        {/* Sidebar */}
        <aside style={{
          width: "300px",
          borderRight: "1px solid var(--border)",
          background: "var(--surface)",
          padding: "32px 24px",
          position: "sticky",
          top: "60px",
          height: "calc(100vh - 60px)",
          overflowY: "auto",
          flexShrink: 0
        }}>
          <div style={{ marginBottom: "32px", display: "flex", alignItems: "center", gap: "12px" }}>
            <SolvivalIcon size={32} />
            <span className="glow-text" style={{ fontFamily: "var(--mono)", fontSize: "14px", fontWeight: "bold", color: "var(--accent)", letterSpacing: "0.1em" }}>
              USER MANUAL
            </span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <button 
              className={`doc-nav-btn ${activeTab === "mission" ? "active" : ""}`} 
              onClick={() => setActiveTab("mission")}
              style={{ textAlign: "left", padding: "12px 16px", fontSize: "11px" }}
            >
              01. DECENTRALIZED CORE MISSION
            </button>
            <button 
              className={`doc-nav-btn ${activeTab === "x402" ? "active" : ""}`} 
              onClick={() => setActiveTab("x402")}
              style={{ textAlign: "left", padding: "12px 16px", fontSize: "11px" }}
            >
              02. THE PRIVACY ENGINE: HOW X402 WORKS
            </button>
            <button 
              className={`doc-nav-btn ${activeTab === "privacy" ? "active" : ""}`} 
              onClick={() => setActiveTab("privacy")}
              style={{ textAlign: "left", padding: "12px 16px", fontSize: "11px" }}
            >
              03. OPERATIVE DATA PROTECTION
            </button>
            <button 
              className={`doc-nav-btn ${activeTab === "threats" ? "active" : ""}`} 
              onClick={() => setActiveTab("threats")}
              style={{ textAlign: "left", padding: "12px 16px", fontSize: "11px" }}
            >
              04. SYSTEM ENCYCLOPEDIA
            </button>
          </div>
        </aside>

        {/* Content */}
        <main style={{ flex: 1, padding: "48px 60px", maxWidth: "950px" }}>
          
          {activeTab === "mission" && (
            <div className="doc-section animation-fade-in">
              <h1 className="glow-text" style={{ fontSize: "22px", marginBottom: "24px", color: "var(--accent)", fontFamily: "var(--mono)" }}>
                [ 01 / DECENTRALIZED CORE MISSION ]
              </h1>
              <p style={{ color: "var(--text-dim)", fontSize: "14px", lineHeight: "1.9", marginBottom: "24px", fontFamily: "var(--mono)", whiteSpace: "pre-wrap" }}>
                The Red Queen AI is an autonomous web3 security console. Traditional security utilities scan files; the Red Queen scans public blockchains to identify vulnerabilities in your digital footprint. By matching public transaction signatures, cross-chain metadata, and social media data layers, our engine maps exactly what predatory tracking databases know about your wallet identity.
              </p>
              <div className="alert alert-red" style={{ background: "rgba(255, 0, 51, 0.05)", borderLeft: "4px solid var(--accent)", padding: "16px", marginTop: "24px" }}>
                <strong style={{ fontFamily: "var(--mono)" }}>[ATTENTION]</strong> Operative database footprints are non-correlatable. Your digital passport remains anonymous.
              </div>
            </div>
          )}

          {activeTab === "x402" && (
            <div className="doc-section animation-fade-in">
              <h1 className="glow-text" style={{ fontSize: "22px", marginBottom: "24px", color: "var(--accent)", fontFamily: "var(--mono)" }}>
                [ 02 / THE PRIVACY ENGINE: HOW X402 WORKS ]
              </h1>
              <p style={{ color: "var(--text-dim)", fontSize: "14px", lineHeight: "1.9", marginBottom: "24px", fontFamily: "var(--mono)", whiteSpace: "pre-wrap" }}>
                Active privacy utilities inside Sector Delta operate completely independent of traditional software registrations. We utilize the open internet standard incubated by the Coinbase Development Platform team and supported by the X402 Foundation and Solana Foundation.

                No Accounts: Access deep diagnostic scans instantly without usernames, emails, passwords, or subscriptions.

                The Scheme: Programmed via the x402 &apos;exact&apos; format. Triggering a diagnostic script queries the server, which issues an HTTP 402 Payment Required challenge header. Your wallet adapter settles a 0.05 USDC micro-fee over Solana. The server instantly verifies transaction finality from the RPC pool and returns your un-redacted report directly into client memory.
              </p>
            </div>
          )}

          {activeTab === "privacy" && (
            <div className="doc-section animation-fade-in">
              <h1 className="glow-text" style={{ fontSize: "22px", marginBottom: "24px", color: "var(--accent)", fontFamily: "var(--mono)" }}>
                [ 03 / OPERATIVE DATA PROTECTION & PRIVACY STACK ]
              </h1>
              <p style={{ color: "var(--text-dim)", fontSize: "14px", lineHeight: "1.9", marginBottom: "24px", fontFamily: "var(--mono)" }}>
                To protect you while tracing public vulnerabilities, the architecture enforces strict anonymity features:
              </p>
              
              <ul style={{ listStyle: "none", padding: 0, display: "flex", flexDirection: "column", gap: "16px" }}>
                <li style={{ fontFamily: "var(--mono)", fontSize: "13px", color: "var(--text-dim)", lineHeight: "1.8" }}>
                  <strong style={{ color: "var(--accent)" }}>1. Non-Custodial Isolation:</strong> The console never touches private keys.
                </li>
                <li style={{ fontFamily: "var(--mono)", fontSize: "13px", color: "var(--text-dim)", lineHeight: "1.8" }}>
                  <strong style={{ color: "var(--accent)" }}>2. SHA-256 Database Salting:</strong> User histories and bio-scores are indexed in Supabase using a salted hash of your wallet key—wiping any trace if the wallet is unlinked.
                </li>
                <li style={{ fontFamily: "var(--mono)", fontSize: "13px", color: "var(--text-dim)", lineHeight: "1.8" }}>
                  <strong style={{ color: "var(--accent)" }}>3. Transaction Blinding:</strong> Incoming x402 fees are processed through Token-2022 confidential verification rules, splitting public ledger connections to our primary treasury wallet.
                </li>
              </ul>
            </div>
          )}

          {activeTab === "threats" && (
            <div className="doc-section animation-fade-in">
              <h1 className="glow-text" style={{ fontSize: "22px", marginBottom: "24px", color: "var(--accent)", fontFamily: "var(--mono)" }}>
                [ 04 / SYSTEM ENCYCLOPEDIA OF ALGORITHMIC THREATS ]
              </h1>
              <p style={{ color: "var(--text-dim)", fontSize: "14px", lineHeight: "1.9", marginBottom: "32px", fontFamily: "var(--mono)" }}>
                Review the comprehensive threat model specifications monitored under active scanning parameters:
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
                <div>
                  <h3 style={{ fontFamily: "var(--mono)", fontSize: "14px", color: "var(--accent)", marginBottom: "8px" }}>
                    • WALLET-TRAIL (Chain-Surveillance Footprint tracking)
                  </h3>
                  <p style={{ fontFamily: "var(--mono)", fontSize: "13px", color: "var(--text-dim)", margin: "0 0 6px 0", lineHeight: "1.7" }}>
                    <strong>Threat Model:</strong> Public ledger tracking algorithms correlate open wallet addresses with metadata like IP routing or local Wi-Fi logs to geo-locate your real-world routine.
                  </p>
                  <p style={{ fontFamily: "var(--mono)", fontSize: "13px", color: "#00ffcc", margin: 0 }}>
                    <strong>Counter-Measure:</strong> Runs a pattern trace to isolate transactional spatial exposure profiles.
                  </p>
                </div>

                <div>
                  <h3 style={{ fontFamily: "var(--mono)", fontSize: "14px", color: "var(--accent)", marginBottom: "8px" }}>
                    • AI-PROFILING (LLM Persona Harvesting Radar)
                  </h3>
                  <p style={{ fontFamily: "var(--mono)", fontSize: "13px", color: "var(--text-dim)", margin: "0 0 6px 0", lineHeight: "1.7" }}>
                    <strong>Threat Model:</strong> Scraper networks track address actions to model your mental thresholds. Behavioral LLMs calculate exactly how you react to market panic or hype to design custom targeted traps.
                  </p>
                  <p style={{ fontFamily: "var(--mono)", fontSize: "13px", color: "#00ffcc", margin: 0 }}>
                    <strong>Counter-Measure:</strong> Generates an AI Survival Profile defining transaction anomalies.
                  </p>
                </div>

                <div>
                  <h3 style={{ fontFamily: "var(--mono)", fontSize: "14px", color: "var(--accent)", marginBottom: "8px" }}>
                    • FEED-MANIP (Social Sentiment Timeline Injection)
                  </h3>
                  <p style={{ fontFamily: "var(--mono)", fontSize: "13px", color: "var(--text-dim)", margin: "0 0 6px 0", lineHeight: "1.7" }}>
                    <strong>Threat Model:</strong> Algorithmic vectors feed accounts specific packets of misinformation or panic to alter timeline trends, forcing humans into panic-driven financial actions.
                  </p>
                  <p style={{ fontFamily: "var(--mono)", fontSize: "13px", color: "#00ffcc", margin: 0 }}>
                    <strong>Counter-Measure:</strong> Traces public handle metrics for timeline manipulation indicators.
                  </p>
                </div>

                <div>
                  <h3 style={{ fontFamily: "var(--mono)", fontSize: "14px", color: "var(--accent)", marginBottom: "8px" }}>
                    • DEEPFAKE-SE (Autonomous Agent Social Engineering)
                  </h3>
                  <p style={{ fontFamily: "var(--mono)", fontSize: "13px", color: "var(--text-dim)", margin: "0 0 6px 0", lineHeight: "1.7" }}>
                    <strong>Threat Model:</strong> Multi-modal AI structures clone trusted web3 developer voices and avatars to execute autonomous, highly targeted phishing scripts.
                  </p>
                  <p style={{ fontFamily: "var(--mono)", fontSize: "13px", color: "#00ffcc", margin: 0 }}>
                    <strong>Counter-Measure:</strong> Launches a secure, closed-sandbox loop simulation checking your exploit susceptibility.
                  </p>
                </div>

                <div>
                  <h3 style={{ fontFamily: "var(--mono)", fontSize: "14px", color: "var(--accent)", marginBottom: "8px" }}>
                    • REPUTATION-X (Algorithmic Network Blacklisting)
                  </h3>
                  <p style={{ fontFamily: "var(--mono)", fontSize: "13px", color: "var(--text-dim)", margin: "0 0 6px 0", lineHeight: "1.7" }}>
                    <strong>Threat Model:</strong> Compliance engines assign risk weights to public ledger public keys. Association with malicious routing pools automatically drops your on-chain reputation, freezing asset access.
                  </p>
                  <p style={{ fontFamily: "var(--mono)", fontSize: "13px", color: "#00ffcc", margin: 0 }}>
                    <strong>Counter-Measure:</strong> Sweeps multi-chain compliance registries to map ledger clearance verification.
                  </p>
                </div>

                <div>
                  <h3 style={{ fontFamily: "var(--mono)", fontSize: "14px", color: "var(--accent)", marginBottom: "8px" }}>
                    • META-LEAK (Web2-to-Web3 Cross-Graph Doxxing)
                  </h3>
                  <p style={{ fontFamily: "var(--mono)", fontSize: "13px", color: "var(--text-dim)", margin: "0 0 6px 0", lineHeight: "1.7" }}>
                    <strong>Threat Model:</strong> Central web services leak private metadata databases (emails, phone registries), which automated scrapers cross-reference directly to open cryptographic keys to unmask offline identities.
                  </p>
                  <p style={{ fontFamily: "var(--mono)", fontSize: "13px", color: "#00ffcc", margin: 0 }}>
                    <strong>Counter-Measure:</strong> Scans historic database leaks to trace public-to-private graph tracking exposure.
                  </p>
                </div>
              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  );
}
