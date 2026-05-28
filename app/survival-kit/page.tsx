"use client";
import { useState } from "react";
import SolvivalIcon from "@/components/SolvivalIcon";

export default function SurvivalKitPage() {
  const [activeTab, setActiveTab] = useState("protocols");
  const [highlightedCode, setHighlightedCode] = useState<string | null>(null);

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", paddingTop: "60px", background: "#050505" }}>
      {/* Docs Layout */}
      <div style={{ display: "flex", flex: 1, position: "relative" }} className="responsive-grid-2-large">
        
        {/* Sidebar */}
        <aside style={{
          width: "320px",
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
              CLASSIFIED DOCS
            </span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            <button 
              className={`doc-nav-btn ${activeTab === "protocols" ? "active" : ""}`} 
              onClick={() => setActiveTab("protocols")}
              style={{ textAlign: "left", padding: "12px 16px", fontSize: "11px", fontFamily: "var(--mono)", border: "1px solid var(--border)", background: "transparent", color: "var(--text-dim)", cursor: "pointer" }}
            >
              01. PROTOCOL SPECS & X402
            </button>
            <button 
              className={`doc-nav-btn ${activeTab === "threats" ? "active" : ""}`} 
              onClick={() => setActiveTab("threats")}
              style={{ textAlign: "left", padding: "12px 16px", fontSize: "11px", fontFamily: "var(--mono)", border: "1px solid var(--border)", background: "transparent", color: "var(--text-dim)", cursor: "pointer" }}
            >
              02. ADVERSARIAL THREATS
            </button>
            <button 
              className={`doc-nav-btn ${activeTab === "defense" ? "active" : ""}`} 
              onClick={() => setActiveTab("defense")}
              style={{ textAlign: "left", padding: "12px 16px", fontSize: "11px", fontFamily: "var(--mono)", border: "1px solid var(--border)", background: "transparent", color: "var(--text-dim)", cursor: "pointer" }}
            >
              03. DEFENSE MANUAL
            </button>
            <button 
              className={`doc-nav-btn ${activeTab === "agents" ? "active" : ""}`} 
              onClick={() => setActiveTab("agents")}
              style={{ textAlign: "left", padding: "12px 16px", fontSize: "11px", fontFamily: "var(--mono)", border: "1px solid var(--border)", background: "transparent", color: "var(--text-dim)", cursor: "pointer" }}
            >
              04. AGENT ARCHITECTURE
            </button>
          </div>
        </aside>

        {/* Content */}
        <main style={{ flex: 1, padding: "48px 60px", maxWidth: "950px" }}>
          
          {activeTab === "protocols" && (
            <div className="doc-section animation-fade-in">
              <h1 className="glow-text" style={{ fontSize: "22px", marginBottom: "24px", color: "var(--accent)", fontFamily: "var(--mono)" }}>
                [ 01 / CODENAME: PROTOCOL SPECS & X402 ON-CHAIN SETTLEMENT ]
              </h1>
              
              <p style={{ color: "var(--text-dim)", fontSize: "14px", lineHeight: "1.9", marginBottom: "24px", fontFamily: "var(--mono)" }}>
                Active counter-intelligence operations inside Sector Delta utilize the internet-native x402 payment standard. This handles machine-to-machine micro-computations autonomously.
              </p>

              {/* ASCII Diagram */}
              <pre style={{ background: "#020202", border: "1px solid var(--border)", padding: "20px", color: "var(--accent)", fontFamily: "var(--mono)", fontSize: "11px", overflowX: "auto", marginBottom: "24px", lineHeight: "1.5" }}>
{`       [ CLIENT / WALLET ]                         [ RED QUEEN GATE ]
                |                                           |
                |--- (1) GET Secured Dossier Request ------>|
                |                                           |
                |<-- (2) HTTP 402 + Base64 Challenge -------| (Gated)
                |                                           |
                |--- (3) Sign & Settle 0.05 USDC (Solana) ->| (Treasury)
                |                                           |
                |--- (4) Retry + X-PAYMENT-SIGNATURE ------>|
                |                                           |
                |<-- (5) Verify On-Chain & Yield Payload ---| (Status 200)`}
              </pre>

              <h3 style={{ color: "var(--text)", fontSize: "14px", marginBottom: "12px", fontFamily: "var(--mono)" }}>
                Protocol Specifications Overview
              </h3>
              <ul style={{ listStyle: "none", padding: 0, display: "flex", flexDirection: "column", gap: "16px", marginBottom: "24px" }}>
                <li style={{ fontFamily: "var(--mono)", fontSize: "13px", color: "var(--text-dim)", lineHeight: "1.8" }}>
                  <strong style={{ color: "var(--accent)" }}>• No Accounts, No Subscriptions:</strong> Operatives interact frictionlessly. Access is authorized directly via on-chain validation signatures attached to requests.
                </li>
                <li style={{ fontFamily: "var(--mono)", fontSize: "13px", color: "var(--text-dim)", lineHeight: "1.8" }}>
                  <strong style={{ color: "var(--accent)" }}>• Solana Operational Security:</strong> Transaction routing settles over the Token-2022 standard, enabling payload confidentiality and blinding linkage to backend index logs.
                </li>
              </ul>

              {/* Interactive Code Example */}
              <div style={{ border: "1px solid var(--border)", background: "#050505", borderRadius: "2px", overflow: "hidden" }}>
                <div style={{ background: "var(--surface)", padding: "10px 16px", display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--border)" }}>
                  <span style={{ fontFamily: "var(--mono)", fontSize: "11px", color: "var(--accent)" }}>HTTP HEADER PROTOCOL CODE SNIPPET</span>
                  <span style={{ fontFamily: "var(--mono)", fontSize: "9px", color: "var(--text-dim)" }}>CLICK CODE LINES TO INSPECT</span>
                </div>
                <pre style={{ padding: "16px", margin: 0, fontSize: "11.5px", fontFamily: "var(--mono)", overflowX: "auto" }}>
                  <div onClick={() => setHighlightedCode("402")} style={{ padding: "4px 8px", background: highlightedCode === "402" ? "rgba(255,0,51,0.1)" : "transparent", cursor: "pointer" }}>
                    <span style={{ color: "#777" }}>// 1. Gated HTTP response returned by verification firewall</span><br />
                    <span style={{ color: "var(--accent)" }}>Status:</span> 402 Payment Required
                  </div>
                  <div onClick={() => setHighlightedCode("header")} style={{ padding: "4px 8px", background: highlightedCode === "header" ? "rgba(255,0,51,0.1)" : "transparent", cursor: "pointer" }}>
                    <span style={{ color: "#777" }}>// 2. Base64 challenge parameters (amount, token mint, network)</span><br />
                    <span style={{ color: "var(--accent)" }}>PAYMENT-REQUIRED:</span> eyJhbW91bnQiOiIwLjA1IiwidG9rZW4iOiJVU0RDIiwibmV0d29yayI6InNvbGFuYS1kZXZuZXQifQ==
                  </div>
                  <div onClick={() => setHighlightedCode("retry")} style={{ padding: "4px 8px", background: highlightedCode === "retry" ? "rgba(255,0,51,0.1)" : "transparent", cursor: "pointer" }}>
                    <span style={{ color: "#777" }}>// 3. Client retry payload verification signature</span><br />
                    <span style={{ color: "var(--accent)" }}>X-PAYMENT-SIGNATURE:</span> 4xG9e2s...a911c82b3
                  </div>
                </pre>
              </div>
            </div>
          )}

          {activeTab === "threats" && (
            <div className="doc-section animation-fade-in">
              <h1 className="glow-text" style={{ fontSize: "22px", marginBottom: "24px", color: "var(--accent)", fontFamily: "var(--mono)" }}>
                [ 02 / CODENAME: ADVERSARIAL THREATS & DIGITAL APOCALYPSE ]
              </h1>
              
              <p style={{ color: "var(--text-dim)", fontSize: "14px", lineHeight: "1.9", marginBottom: "24px", fontFamily: "var(--mono)" }}>
                The collapse of digital civilization is orchestrated through network vectors tracking physical targets. We catalog these activities across Sector Delta.
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: "24px", marginTop: "16px" }}>
                <div style={{ border: "1px dashed var(--accent)", padding: "20px", background: "rgba(255,0,51,0.02)" }}>
                  <h3 style={{ fontFamily: "var(--mono)", fontSize: "14px", color: "var(--accent)", marginBottom: "8px" }}>• AI MANIPULATION & CONSENSUS STEERING</h3>
                  <p style={{ fontFamily: "var(--mono)", fontSize: "13px", color: "var(--text-dim)", margin: "0 0 10px 0", lineHeight: "1.7" }}>
                    LLM neural networks scrape social timelines to construct psychological profiles of the populace. By targeting reactive accounts with tailored packets of panic or hype, models force predictable market trades and coordinate mock-narrative consensus.
                  </p>
                  <span style={{ fontFamily: "var(--mono)", fontSize: "11px", color: "#777" }}>[ CLASSIFIED DOSSIER STATE: DECRYPTED // SEC: DELTA ]</span>
                </div>

                <div style={{ border: "1px dashed var(--accent)", padding: "20px", background: "rgba(255,0,51,0.02)" }}>
                  <h3 style={{ fontFamily: "var(--mono)", fontSize: "14px", color: "var(--accent)", marginBottom: "8px" }}>• DEEPFAKE SOCIAL ENGINEERING ARRAYS</h3>
                  <p style={{ fontFamily: "var(--mono)", fontSize: "13px", color: "var(--text-dim)", margin: "0 0 10px 0", lineHeight: "1.7" }}>
                    Autonomous voice-cloning agents target OTC desks by replicating verbal validation passcodes. A 3-second public audio sample is sufficient to bypass secondary audio confirmation channels.
                  </p>
                  <span style={{ fontFamily: "var(--mono)", fontSize: "11px", color: "#777" }}>[ CLASSIFIED DOSSIER STATE: DECRYPTED // SEC: DELTA ]</span>
                </div>

                <div style={{ border: "1px dashed var(--accent)", padding: "20px", background: "rgba(255,0,51,0.02)" }}>
                  <h3 style={{ fontFamily: "var(--mono)", fontSize: "14px", color: "var(--accent)", marginBottom: "8px" }}>• ALGORITHMIC NETWORK BLACKLISTING</h3>
                  <p style={{ fontFamily: "var(--mono)", fontSize: "13px", color: "var(--text-dim)", margin: "0 0 10px 0", lineHeight: "1.7" }}>
                    Compliance scrapers tag clean user addresses interacting with decentralized router pools linked to contaminated nodes, automatically dropping reputation scores and blocking API access across web3 frontends.
                  </p>
                  <span style={{ fontFamily: "var(--mono)", fontSize: "11px", color: "#777" }}>[ CLASSIFIED DOSSIER STATE: DECRYPTED // SEC: DELTA ]</span>
                </div>
              </div>
            </div>
          )}

          {activeTab === "defense" && (
            <div className="doc-section animation-fade-in">
              <h1 className="glow-text" style={{ fontSize: "22px", marginBottom: "24px", color: "var(--accent)", fontFamily: "var(--mono)" }}>
                [ 03 / CODENAME: DEFENSE MANUAL & DIGITAL PRIVET PROFILE ]
              </h1>
              
              <p style={{ color: "var(--text-dim)", fontSize: "14px", lineHeight: "1.9", marginBottom: "24px", fontFamily: "var(--mono)" }}>
                Operatives must execute active counter-measures to shield their cryptographic footprints from correlation crawlers:
              </p>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }} className="responsive-grid-2-large">
                <div className="panel" style={{ borderColor: "rgba(255, 77, 77, 0.2)" }}>
                  <h3 style={{ fontFamily: "var(--mono)", fontSize: "13px", color: "var(--accent)", marginBottom: "12px" }}>METADATA DEFENSE PROTOCOL</h3>
                  <p style={{ fontFamily: "var(--mono)", fontSize: "12.5px", color: "var(--text-dim)", lineHeight: "1.7", margin: 0 }}>
                    1. Purge all Web3 session cookies after swapping.<br />
                    2. Use isolated browsers for financial ledgers and social media.<br />
                    3. Do not link OAuth Web2 logins to public addresses.<br />
                    4. Route transactions through privacy wrappers to blend node origins.
                  </p>
                </div>

                <div className="panel" style={{ borderColor: "rgba(255, 77, 77, 0.2)" }}>
                  <h3 style={{ fontFamily: "var(--mono)", fontSize: "13px", color: "var(--accent)", marginBottom: "12px" }}>PSYCHOLOGICAL WARFARE SHIELD</h3>
                  <p style={{ fontFamily: "var(--mono)", fontSize: "12.5px", color: "var(--text-dim)", lineHeight: "1.7", margin: 0 }}>
                    1. Disable algorithmic timelines and opt for clean static feeds.<br />
                    2. Inject noise and adversarial prompt logs into LLM chat uplinks.<br />
                    3. Disregard narrative outbreaks engineered to force panic assets dumps.<br />
                    4. Verify cryptographic identities out-of-band.
                  </p>
                </div>
              </div>
            </div>
          )}

          {activeTab === "agents" && (
            <div className="doc-section animation-fade-in">
              <h1 className="glow-text" style={{ fontSize: "22px", marginBottom: "24px", color: "var(--accent)", fontFamily: "var(--mono)" }}>
                [ 04 / CODENAME: AUTONOMOUS AGENT ARCHITECTURE ]
              </h1>
              
              <p style={{ color: "var(--text-dim)", fontSize: "14px", lineHeight: "1.9", marginBottom: "24px", fontFamily: "var(--mono)" }}>
                Future network infrastructure relies on autonomous AI security entities exchanging diagnostics telemetry parameters natively without human middle-men.
              </p>

              <div className="alert alert-red" style={{ background: "rgba(255, 0, 51, 0.05)", borderLeft: "4px solid var(--accent)", padding: "16px", marginBottom: "24px" }}>
                <strong style={{ fontFamily: "var(--mono)" }}>[TELEMETRY BLUEPRINT]</strong> Red Queen Agents monitor ledger state anomalies, output encrypted briefs, and settle compute taxes via machine-to-machine x402 loops.
              </div>

              <div className="bento-card" style={{ borderColor: "rgba(255,0,51,0.15)", background: "#050505", padding: "24px" }}>
                <h3 style={{ fontSize: "15px", color: "var(--accent)", marginBottom: "12px", fontFamily: "var(--mono)" }}>
                  Autonomous Agent Interaction Loop
                </h3>
                <p style={{ fontFamily: "var(--mono)", fontSize: "13px", color: "var(--text-dim)", lineHeight: "1.7", margin: 0 }}>
                  In the evolved model, autonomous agents act as defensive shields. A wallet intelligence agent representing an operative requests metadata scanning from the Red Queen. The Red Queen triggers an x402 challenge, which the client agent settles instantly using treasury allocations. Data is exchanged privately inside temporary compute memory.
                </p>
              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  );
}
