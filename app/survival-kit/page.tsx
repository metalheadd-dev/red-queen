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
          width: "280px",
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
            <button className={`doc-nav-btn ${activeTab === "mission" ? "active" : ""}`} onClick={() => setActiveTab("mission")}>
              1. CORE MISSION
            </button>
            <button className={`doc-nav-btn ${activeTab === "tokenomics" ? "active" : ""}`} onClick={() => setActiveTab("tokenomics")}>
              2. TOKENOMICS & CLEARANCE
            </button>
            <button className={`doc-nav-btn ${activeTab === "x402" ? "active" : ""}`} onClick={() => setActiveTab("x402")}>
              3. X402 PAYMENT PROTOCOL
            </button>
            <button className={`doc-nav-btn ${activeTab === "privacy" ? "active" : ""}`} onClick={() => setActiveTab("privacy")}>
              4. PRIVACY IMPLEMENTATION
            </button>
          </div>
        </aside>

        {/* Content */}
        <main style={{ flex: 1, padding: "48px 80px", maxWidth: "900px" }}>
          
          {activeTab === "mission" && (
            <div className="doc-section animation-fade-in">
              <h1 className="glow-text" style={{ fontSize: "36px", marginBottom: "24px" }}>[ CORE MISSION ]</h1>
              <p style={{ color: "var(--text-dim)", fontSize: "15px", lineHeight: "1.9", marginBottom: "24px", fontFamily: "var(--mono)" }}>
                The Red Queen acts as a decentralized counter-intelligence firewall. We shield operatives from digital collapse, behavioral profiling, and algorithmic trapping.
              </p>
              <p style={{ color: "var(--text-dim)", fontSize: "15px", lineHeight: "1.9", marginBottom: "24px", fontFamily: "var(--mono)" }}>
                In the next era of the web, the threats are no longer purely kinetic. Bunkers protect your physical shell; cryptography protects your digital sovereignty. The Red Queen analyzes network anomalies, maps surveillance vectors, and assesses user compliance profiles to build active readiness strategies.
              </p>
              <div className="alert alert-red" style={{ background: "rgba(255, 0, 51, 0.05)", borderLeft: "4px solid var(--accent)" }}>
                <strong>[ATTENTION]</strong> Your survival is directly correlated to your data containment. Unshielded footprints are terminal.
              </div>
            </div>
          )}

          {activeTab === "tokenomics" && (
            <div className="doc-section animation-fade-in">
              <h1 className="glow-text" style={{ fontSize: "36px", marginBottom: "24px" }}>[ TOKENOMICS & CLEARANCE ]</h1>
              <p style={{ color: "var(--text-dim)", fontSize: "15px", lineHeight: "1.9", marginBottom: "24px", fontFamily: "var(--mono)" }}>
                Holders of the <strong style={{ color: "var(--accent)" }}>$THREAT</strong> token unlock advanced operational clearance levels. The Red Queen adjusts her compliance algorithms based on your on-chain credentials:
              </p>
              
              <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginTop: "24px" }}>
                {[
                  { tier: "Tier 1: Civilian", desc: "No tokens required. Access basic alerts and public dossiers only." },
                  { tier: "Tier 2: Scout", desc: "Any $THREAT holding. Unlocks the AI Agent Terminal interface." },
                  { tier: "Tier 3: Operative", desc: "500+ $THREAT tokens. Priority queue and higher-detail threat briefings." },
                  { tier: "Tier 4: Overseer", desc: "5,000+ $THREAT tokens. Unlocks full access to Sector Alpha and Beta threat files." },
                  { tier: "Tier 5: Director", desc: "50,000+ $THREAT tokens. Unlocks all emergency protocols and warm allied AI tone parameters." }
                ].map((t, idx) => (
                  <div key={idx} className="bento-card" style={{ padding: "20px", borderColor: "rgba(255,0,51,0.15)" }}>
                    <h3 style={{ color: "var(--accent)", margin: "0 0 8px 0", fontSize: "14px" }}>{t.tier}</h3>
                    <p style={{ color: "var(--text-dim)", margin: 0, fontSize: "12px", fontFamily: "var(--mono)" }}>{t.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {activeTab === "x402" && (
            <div className="doc-section animation-fade-in">
              <h1 className="glow-text" style={{ fontSize: "36px", marginBottom: "24px" }}>[ THE X402 PAYMENT PROTOCOL ]</h1>
              <p style={{ color: "var(--text-dim)", fontSize: "15px", lineHeight: "1.9", marginBottom: "24px", fontFamily: "var(--mono)" }}>
                Active privacy utilities in Sector Delta run on a secure, pay-per-use architecture powered by the on-chain <strong style={{ color: "var(--accent)" }}>x402 Payment Required</strong> standard.
              </p>
              <p style={{ color: "var(--text-dim)", fontSize: "15px", lineHeight: "1.9", marginBottom: "24px", fontFamily: "var(--mono)" }}>
                - **No Accounts**: Access deep diagnostic scans instantly without registering passwords, emails, or sessions.
                <br />- **Instant Handshake**: The system triggers a Solana wallet transaction for exactly `0.05` USDC.
                <br />- **Micro-computation Tax**: Fees go directly to treasury nodes to power the compute cycles required for wallet footprint profiling.
              </p>
              <div className="bento-card" style={{ padding: "20px", background: "rgba(0,255,204,0.02)", borderColor: "rgba(0,255,204,0.2)" }}>
                <div style={{ fontFamily: "var(--mono)", fontSize: "10px", color: "#00ffcc", letterSpacing: "0.15em", marginBottom: "8px" }}>
                  x402 RETRY HANDSHAKE SCHEME
                </div>
                <p style={{ fontFamily: "var(--mono)", fontSize: "12px", color: "var(--text-dim)", margin: 0 }}>
                  Client POST Request → Server Returns 402 + PAYMENT-REQUIRED Challenge Header → Client signs & submits USDC transfer on Solana → Client resubmits request with X-PAYMENT-SIGNATURE header → Server yields Decrypted Report.
                </p>
              </div>
            </div>
          )}

          {activeTab === "privacy" && (
            <div className="doc-section animation-fade-in">
              <h1 className="glow-text" style={{ fontSize: "36px", marginBottom: "24px" }}>[ HARDENED PRIVACY IMPLEMENTATION ]</h1>
              <p style={{ color: "var(--text-dim)", fontSize: "15px", lineHeight: "1.9", marginBottom: "24px", fontFamily: "var(--mono)" }}>
                We maintain absolute architectural isolation to safeguard operative metadata footprints.
              </p>
              <p style={{ color: "var(--text-dim)", fontSize: "15px", lineHeight: "1.9", marginBottom: "24px", fontFamily: "var(--mono)" }}>
                1. **Non-Custodial Isolation**: Your private keys never leave your local client. We never prompt for, transmit, or record key data.
                <br />2. **Salted Hashing**: Operative session logs and settings are indexed inside Supabase using a salted SHA-256 hash of your public key. Mapped logs are completely anonymous.
                <br />3. **Confidential Transfers**: Solana Token Extensions (Token-2022) verify payment finality without logging direct public explorer links between your primary wallet and platform collection vaults.
              </p>
              <div className="alert alert-red" style={{ background: "rgba(255, 0, 51, 0.05)", borderLeft: "4px solid var(--accent)" }}>
                <strong>[PRIVACY ASSURANCE]</strong> Operative database footprints are non-correlatable. Your digital passport remains anonymous.
              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  );
}
