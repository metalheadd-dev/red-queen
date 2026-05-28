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
              01. MISSION OVERVIEW
            </button>
            <button 
              className={`doc-nav-btn ${activeTab === "x402" ? "active" : ""}`} 
              onClick={() => setActiveTab("x402")}
              style={{ textAlign: "left", padding: "12px 16px", fontSize: "11px" }}
            >
              02. HOW X402 WORKS
            </button>
            <button 
              className={`doc-nav-btn ${activeTab === "privacy" ? "active" : ""}`} 
              onClick={() => setActiveTab("privacy")}
              style={{ textAlign: "left", padding: "12px 16px", fontSize: "11px" }}
            >
              03. PRIVACY STACK
            </button>
            <button 
              className={`doc-nav-btn ${activeTab === "threats" ? "active" : ""}`} 
              onClick={() => setActiveTab("threats")}
              style={{ textAlign: "left", padding: "12px 16px", fontSize: "11px" }}
            >
              04. THREAT ENCYCLOPEDIA
            </button>
          </div>
        </aside>

        {/* Content */}
        <main style={{ flex: 1, padding: "48px 60px", maxWidth: "950px" }}>
          
          {activeTab === "mission" && (
            <div className="doc-section animation-fade-in">
              <h1 className="glow-text" style={{ fontSize: "24px", marginBottom: "24px", color: "var(--accent)", fontFamily: "var(--mono)" }}>
                [ 01 / RE-DEFINING THE APOCALYPSE: MISSION OVERVIEW ]
              </h1>
              <p style={{ color: "var(--text-dim)", fontSize: "14px", lineHeight: "1.9", marginBottom: "24px", fontFamily: "var(--mono)", whiteSpace: "pre-wrap" }}>
                Welcome to SOLvival Corp&apos;s Advanced Intelligence Division. Bunkers protect your physical shell; cryptography protects your digital sovereignty. The Red Queen AI acts as an autonomous counter-intelligence firewall. We analyze network anomalies, monitor metadata leaks, and deploy defensive AI agents to calculate your survival probability across the next internet. Your privacy is your only armor.
              </p>
              <div className="alert alert-red" style={{ background: "rgba(255, 0, 51, 0.05)", borderLeft: "4px solid var(--accent)", padding: "16px", marginTop: "24px" }}>
                <strong style={{ fontFamily: "var(--mono)" }}>[ATTENTION]</strong> Operative database footprints are non-correlatable. Your digital passport remains anonymous.
              </div>
            </div>
          )}

          {activeTab === "x402" && (
            <div className="doc-section animation-fade-in">
              <h1 className="glow-text" style={{ fontSize: "24px", marginBottom: "24px", color: "var(--accent)", fontFamily: "var(--mono)" }}>
                [ 02 / THE PRIVACY ENGINE: HOW X402 WORKS ]
              </h1>
              <p style={{ color: "var(--text-dim)", fontSize: "14px", lineHeight: "1.9", marginBottom: "24px", fontFamily: "var(--mono)" }}>
                Our high-tier active diagnostic utilities operate entirely on the open, internet-native x402 payment standard. 
              </p>
              <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginTop: "16px" }}>
                <div className="bento-card" style={{ padding: "20px", borderColor: "rgba(255,0,51,0.15)", background: "rgba(5,5,5,0.6)" }}>
                  <h3 style={{ color: "var(--accent)", margin: "0 0 8px 0", fontSize: "13px", fontFamily: "var(--mono)" }}>1. No Accounts, No Friction</h3>
                  <p style={{ color: "var(--text-dim)", margin: 0, fontSize: "13px", fontFamily: "var(--mono)", lineHeight: "1.7" }}>
                    You never register an email, configure passwords, or buy subscriptions.
                  </p>
                </div>
                
                <div className="bento-card" style={{ padding: "20px", borderColor: "rgba(255,0,51,0.15)", background: "rgba(5,5,5,0.6)" }}>
                  <h3 style={{ color: "var(--accent)", margin: "0 0 8px 0", fontSize: "13px", fontFamily: "var(--mono)" }}>2. The Compute Tax Loop</h3>
                  <p style={{ color: "var(--text-dim)", margin: 0, fontSize: "13px", fontFamily: "var(--mono)", lineHeight: "1.7" }}>
                    When you launch a diagnostic script, our server issues an HTTP 402 &apos;Payment Required&apos; response challenge. Your browser wallet adapter intercepts this challenge, prompts you for a quick signature, and settles a micro-fee (0.05 USDC) over Solana. The server instantly verifies transaction finality and delivers your un-redacted report directly into client memory.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === "privacy" && (
            <div className="doc-section animation-fade-in">
              <h1 className="glow-text" style={{ fontSize: "24px", marginBottom: "24px", color: "var(--accent)", fontFamily: "var(--mono)" }}>
                [ 03 / OPERATIVE DATA PROTECTION & PRIVACY STACK ]
              </h1>
              <p style={{ color: "var(--text-dim)", fontSize: "14px", lineHeight: "1.9", marginBottom: "24px", fontFamily: "var(--mono)" }}>
                To protect you while scanning public vectors, the platform enforces a zero-exposure security architecture:
              </p>
              
              <ul style={{ listStyle: "none", padding: 0, display: "flex", flexDirection: "column", gap: "16px" }}>
                <li style={{ fontFamily: "var(--mono)", fontSize: "13px", color: "var(--text-dim)", lineHeight: "1.8" }}>
                  <strong style={{ color: "var(--accent)" }}>• Non-Custodial Isolation:</strong> The system operates entirely via wallet signatures. We never touch, read, or request a private key.
                </li>
                <li style={{ fontFamily: "var(--mono)", fontSize: "13px", color: "var(--text-dim)", lineHeight: "1.8" }}>
                  <strong style={{ color: "var(--accent)" }}>• SHA-256 Profile Salting:</strong> All transaction logs, diagnostic data, and bio-scores are written to Supabase using a one-way salted hash of your wallet address. If your wallet disconnects, your data trace ceases to exist on our servers.
                </li>
                <li style={{ fontFamily: "var(--mono)", fontSize: "13px", color: "var(--text-dim)", lineHeight: "1.8" }}>
                  <strong style={{ color: "var(--accent)" }}>• On-Chain Transaction Blinding:</strong> Incoming x402 payments are verified using Solana Token Extensions (Token-2022) Confidential Transfers, blinding the public connection link between your public key and our collection nodes.
                </li>
              </ul>
            </div>
          )}

          {activeTab === "threats" && (
            <div className="doc-section animation-fade-in">
              <h1 className="glow-text" style={{ fontSize: "24px", marginBottom: "24px", color: "var(--accent)", fontFamily: "var(--mono)" }}>
                [ 04 / ENCYCLOPEDIA OF ALGOMETRIC THREATS ]
              </h1>
              <p style={{ color: "var(--text-dim)", fontSize: "14px", lineHeight: "1.9", marginBottom: "32px", fontFamily: "var(--mono)" }}>
                Review the official operational dossiers for the six primary threat vectors monitored inside Sector Delta:
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: "28px" }}>
                <div>
                  <h3 style={{ fontFamily: "var(--mono)", fontSize: "14px", color: "var(--accent)", marginBottom: "8px" }}>
                    • WALLET-TRAIL (Chain-Surveillance & Spatial Physical Tracking)
                  </h3>
                  <p style={{ fontFamily: "var(--mono)", fontSize: "13px", color: "var(--text-dim)", margin: "0 0 6px 0", lineHeight: "1.7" }}>
                    <strong>Threat Model:</strong> Public ledgers are fully transparent. Tracking algorithms scan transaction histories and correlate times with physical metadata (IP routing, local Wi-Fi logs) to geo-locate your real-world routine.
                  </p>
                  <p style={{ fontFamily: "var(--mono)", fontSize: "13px", color: "#00ffcc", margin: 0 }}>
                    <strong>Counter-Measure:</strong> The Red Queen runs a tracking-vulnerability trace to isolate structural pattern exposures.
                  </p>
                </div>

                <div>
                  <h3 style={{ fontFamily: "var(--mono)", fontSize: "14px", color: "var(--accent)", marginBottom: "8px" }}>
                    • AI-PROFILING (LLM Persona Harvesting & Target Trapping)
                  </h3>
                  <p style={{ fontFamily: "var(--mono)", fontSize: "13px", color: "var(--text-dim)", margin: "0 0 6px 0", lineHeight: "1.7" }}>
                    <strong>Threat Model:</strong> Advanced scrapers monitor your trades and posts to build behavioral profiles of your mind. Once an LLM predicts how you react to hype or panic, it designs targeted feeds to manipulate your market decisions.
                  </p>
                  <p style={{ fontFamily: "var(--mono)", fontSize: "13px", color: "#00ffcc", margin: 0 }}>
                    <strong>Counter-Measure:</strong> Evaluates your historical address variance to construct an encrypted AI Survival Profile.
                  </p>
                </div>

                <div>
                  <h3 style={{ fontFamily: "var(--mono)", fontSize: "14px", color: "var(--accent)", marginBottom: "8px" }}>
                    • FEED-MANIP (Social Sentiment Timeline Injection)
                  </h3>
                  <p style={{ fontFamily: "var(--mono)", fontSize: "13px", color: "var(--text-dim)", margin: "0 0 6px 0", lineHeight: "1.7" }}>
                    <strong>Threat Model:</strong> Timelines are psychological vectors. Algorithmic nodes inject tailored packets of misinformation or panic into your feeds to alter your emotional state and force you into making predictable, sub-optimal moves.
                  </p>
                  <p style={{ fontFamily: "var(--mono)", fontSize: "13px", color: "#00ffcc", margin: 0 }}>
                    <strong>Counter-Measure:</strong> Runs analysis filters on public handle data to isolate injection vulnerabilities.
                  </p>
                </div>

                <div>
                  <h3 style={{ fontFamily: "var(--mono)", fontSize: "14px", color: "var(--accent)", marginBottom: "8px" }}>
                    • DEEPFAKE-SE (Autonomous Agent Social Engineering Arrays)
                  </h3>
                  <p style={{ fontFamily: "var(--mono)", fontSize: "13px", color: "var(--text-dim)", margin: "0 0 6px 0", lineHeight: "1.7" }}>
                    <strong>Threat Model:</strong> Phishing has evolved. Autonomous AI agents can fully clone the writing styles, voices, and avatars of trusted web3 figures, executing automated, highly realistic social engineering scams against you.
                  </p>
                  <p style={{ fontFamily: "var(--mono)", fontSize: "13px", color: "#00ffcc", margin: 0 }}>
                    <strong>Counter-Measure:</strong> Launches a secure, closed-sandbox script simulation checking your exploit susceptibility.
                  </p>
                </div>

                <div>
                  <h3 style={{ fontFamily: "var(--mono)", fontSize: "14px", color: "var(--accent)", marginBottom: "8px" }}>
                    • REPUTATION-X (Algorithmic Blacklisting & Identity Smear)
                  </h3>
                  <p style={{ fontFamily: "var(--mono)", fontSize: "13px", color: "var(--text-dim)", margin: "0 0 6px 0", lineHeight: "1.7" }}>
                    <strong>Threat Model:</strong> Compliance metrics attach automated risk scores to public keys. If an algorithm mistakenly associates your wallet with a malicious pool, your on-chain reputation drops, instantly freezing you out of dApps.
                  </p>
                  <p style={{ fontFamily: "var(--mono)", fontSize: "13px", color: "#00ffcc", margin: 0 }}>
                    <strong>Counter-Measure:</strong> Sweeps multi-chain compliance registries to verify your ledger clearance level.
                  </p>
                </div>

                <div>
                  <h3 style={{ fontFamily: "var(--mono)", fontSize: "14px", color: "var(--accent)", marginBottom: "8px" }}>
                    • META-LEAK (Web2-to-Web3 Cross-Graph Doxxing Arrays)
                  </h3>
                  <p style={{ fontFamily: "var(--mono)", fontSize: "13px", color: "var(--text-dim)", margin: "0 0 6px 0", lineHeight: "1.7" }}>
                    <strong>Threat Model:</strong> The invisible bridge. A meta-leak occurs when central web databases leak configurations that cross-reference your private Web2 footprints (emails, phone registries) directly to your cryptographic keys.
                  </p>
                  <p style={{ fontFamily: "var(--mono)", fontSize: "13px", color: "#00ffcc", margin: 0 }}>
                    <strong>Counter-Measure:</strong> Scans database leaks to trace if your wallet public key has been mapped to your offline identity.
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
