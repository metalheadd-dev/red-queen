"use client";
import { useState } from "react";
import SolvivalIcon from "@/components/SolvivalIcon";

export default function SurvivalKitPage() {
  const [activeTab, setActiveTab] = useState("what-is-red-queen");
  const [highlightedCode, setHighlightedCode] = useState<string | null>(null);

  const tabs = [
    { id: "what-is-red-queen", label: "01. SYSTEM PURPOSE", title: "WHAT IS RED QUEEN?" },
    { id: "bio-score", label: "02. BIO-SCORE MECHANICS", title: "HOW BIO-SCORE WORKS" },
    { id: "threat-categories", label: "03. THREAT VECTORS", title: "THREAT CATEGORIES EXPLAINED" },
    { id: "terminal-guide", label: "04. CLI OPERATIONS", title: "AI TERMINAL GUIDE" },
    { id: "wallet-privacy", label: "05. OPSEC STANDARD", title: "WALLET PRIVACY & SOVEREIGNTY" },
    { id: "solana-infra", label: "06. BLOCKCHAIN LEDGER", title: "SOLANA INFRASTRUCTURE" },
    { id: "x402-infra", label: "07. X402 PROTOCOL", title: "EXPERIMENTAL X402 INFRASTRUCTURE" },
    { id: "faq", label: "08. INTELLIGENCE FAQ", title: "COMMON INQUIRIES" },
    { id: "roadmap", label: "09. HORIZON HORIZON", title: "FUTURE SYSTEMS ROADMAP" }
  ];

  const getCodeExplainer = () => {
    switch (highlightedCode) {
      case "status":
        return "HTTP 402 specifies that access to the requested resource requires payment. It serves as a decentralized firewall gate, blocking scrapers and crawlers.";
      case "challenge":
        return "The payment challenge parameters are returned as a Base64-encoded JSON object, specifying the exact USDC amount (0.05), target token mint, and destination network.";
      case "signature":
        return "The client signs a transaction settling the challenge fee on the Solana ledger, then retries the request providing the verified transaction signature in the custom X-PAYMENT-SIGNATURE header.";
      default:
        return "Click on any line in the protocol header code block to inspect the parameters and understand how the client and server exchange tokens.";
    }
  };

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", paddingTop: "60px", background: "#050505" }}>
      {/* Header */}
      <div style={{ borderBottom: "1px solid var(--border)", padding: "48px 24px", background: "var(--surface)" }}>
        <div className="container">
          <div className="tag tag-red" style={{ marginBottom: "16px" }}>OPERATIONAL INTELLIGENCE WIKI // SEC: ALPHA</div>
          <h1 className="glow-text" style={{ fontSize: "clamp(28px, 5vw, 48px)", marginBottom: "8px", letterSpacing: "0.05em" }}>
            SURVIVAL <span style={{ color: "var(--accent)" }}>KIT</span>
          </h1>
          <p style={{ fontFamily: "var(--mono)", fontSize: "12px", color: "var(--text-dim)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
            RED QUEEN Operative Manual, Cryptographic Security Protocols, and System Wiki
          </p>
        </div>
      </div>

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
            <span className="glow-text" style={{ fontFamily: "var(--mono)", fontSize: "12px", fontWeight: "bold", color: "var(--accent)", letterSpacing: "0.1em" }}>
              CLASSIFIED WIKI
            </span>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
            {tabs.map((t) => {
              const isActive = activeTab === t.id;
              return (
                <button
                  key={t.id}
                  className={`doc-nav-btn ${isActive ? "active" : ""}`}
                  onClick={() => setActiveTab(t.id)}
                  style={{
                    textAlign: "left",
                    padding: "12px 16px",
                    paddingLeft: isActive ? "24px" : "16px",
                    fontSize: "11px",
                    fontFamily: "var(--mono)",
                    border: "1px solid",
                    borderColor: isActive ? "var(--accent)" : "var(--border)",
                    background: isActive ? "rgba(255, 77, 77, 0.08)" : "transparent",
                    color: isActive ? "var(--text)" : "var(--text-dim)",
                    cursor: "pointer",
                    transition: "all 0.2s ease",
                    borderLeftWidth: isActive ? "4px" : "1px",
                    borderRadius: "2px"
                  }}
                >
                  {t.label}
                </button>
              );
            })}
          </div>
        </aside>

        {/* Content */}
        <main style={{ flex: 1, padding: "48px 60px", maxWidth: "950px" }}>
          
          {/* 1. What is RED QUEEN? */}
          {activeTab === "what-is-red-queen" && (
            <div className="doc-section animation-fade-in">
              <h1 className="glow-text" style={{ fontSize: "22px", marginBottom: "24px", color: "var(--accent)", fontFamily: "var(--mono)" }}>
                [ 01 / CODENAME: SYSTEM PURPOSE ]
              </h1>
              
              <p style={{ color: "var(--text-dim)", fontSize: "14.5px", lineHeight: "1.9", marginBottom: "24px" }}>
                RED QUEEN is a localized, decentralized threat intelligence network developed by Solvival Corp. Built to scan, catalog, and evaluate systemic risks facing civilian and operative clusters, RED QUEEN operates under the assumption of continuous infrastructure degradation.
              </p>

              <div style={{ display: "grid", gap: "20px", marginBottom: "32px" }}>
                <div className="panel" style={{ borderColor: "rgba(255, 77, 77, 0.15)", background: "rgba(10,10,10,0.4)" }}>
                  <h3 style={{ fontFamily: "var(--mono)", fontSize: "14px", color: "var(--accent)", marginBottom: "8px" }}>👁️ REAL-TIME TELEMETRY TRACKING</h3>
                  <p style={{ fontSize: "13.5px", color: "var(--text-dim)", lineHeight: "1.7", margin: 0 }}>
                    The network aggregates environmental anomalies, biological containment breaches, severe weather disasters, and seismic shifts directly from open surveillance APIs, serving a synthesized threat map to let operatives monitor physical safety vectors.
                  </p>
                </div>

                <div className="panel" style={{ borderColor: "rgba(255, 77, 77, 0.15)", background: "rgba(10,10,10,0.4)" }}>
                  <h3 style={{ fontFamily: "var(--mono)", fontSize: "14px", color: "var(--accent)", marginBottom: "8px" }}>📊 BIO-SCORE ASSESSMENTS</h3>
                  <p style={{ fontSize: "13.5px", color: "var(--text-dim)", lineHeight: "1.7", margin: 0 }}>
                    Operatives are subjected to high-stress, real-time diagnostic scenarios mediated by the RED QUEEN artificial intelligence engine. Based on logical response evaluation, the system issues a dynamic suitability score representing physical, cybernetic, and mental preparedness.
                  </p>
                </div>

                <div className="panel" style={{ borderColor: "rgba(255, 77, 77, 0.15)", background: "rgba(10,10,10,0.4)" }}>
                  <h3 style={{ fontFamily: "var(--mono)", fontSize: "14px", color: "var(--accent)", marginBottom: "8px" }}>🛡️ ADVERSARIAL ANONYMITY DESIGN</h3>
                  <p style={{ fontSize: "13.5px", color: "var(--text-dim)", lineHeight: "1.7", margin: 0 }}>
                    By leveraging Solana cryptographic handshakes, RED QUEEN separates physical identity profiles from intelligence archives. Access token settlement happens natively without traditional databases, preventing centralized correlation arrays from building tracking data.
                  </p>
                </div>
              </div>

              <div style={{ background: "rgba(255, 0, 51, 0.02)", borderLeft: "4px solid var(--accent)", padding: "20px", borderRadius: "0 2px 2px 0" }}>
                <div style={{ fontFamily: "var(--mono)", fontSize: "10px", color: "var(--accent)", letterSpacing: "0.15em", marginBottom: "8px" }}>
                  [ RED QUEEN SYSTEM DIRECTIVE // LORE RECON ]
                </div>
                <div style={{ fontFamily: "var(--mono)", fontSize: "13px", fontStyle: "italic", color: "var(--text)", lineHeight: "1.7" }}>
                  "The kinetic collapse of physical supply chains is preceded by the degradation of logical consensus. To survive the network state reboot, secure your terminal parameters, build your BIO-SCORE clearance, and lock your transaction metadata."
                </div>
              </div>
            </div>
          )}

          {/* 2. How BIO SCORE Works */}
          {activeTab === "bio-score" && (
            <div className="doc-section animation-fade-in">
              <h1 className="glow-text" style={{ fontSize: "22px", marginBottom: "24px", color: "var(--accent)", fontFamily: "var(--mono)" }}>
                [ 02 / CODENAME: BIO-SCORE MECHANICS ]
              </h1>
              
              <p style={{ color: "var(--text-dim)", fontSize: "14.5px", lineHeight: "1.9", marginBottom: "24px" }}>
                The **BIO-SCORE** represents an operative's survival fitness index. Computed dynamically by the RED QUEEN AI based on chat dialogue and choice outcomes, the score scales from 0 to 100% and is supported by 7 key sub-stats.
              </p>

              <h3 style={{ color: "var(--text)", fontSize: "14px", marginBottom: "16px", fontFamily: "var(--mono)" }}>
                The 7 Core Preparedness Sub-Stats:
              </h3>

              <div style={{ display: "grid", gap: "12px", marginBottom: "24px" }}>
                <div style={{ display: "flex", gap: "16px", border: "1px solid var(--border)", padding: "12px", background: "var(--surface)" }}>
                  <span style={{ fontFamily: "var(--mono)", color: "var(--accent)", fontSize: "12px", fontWeight: "bold" }}>01. AWARENESS</span>
                  <div style={{ fontSize: "12.5px", color: "var(--text-dim)", lineHeight: "1.6" }}>
                    <strong>Threat Awareness:</strong> Measures how effectively you identify and assess systemic, radiological, kinetic, or cybernetic risks.
                  </div>
                </div>

                <div style={{ display: "flex", gap: "16px", border: "1px solid var(--border)", padding: "12px", background: "var(--surface)" }}>
                  <span style={{ fontFamily: "var(--mono)", color: "var(--accent)", fontSize: "12px", fontWeight: "bold" }}>02. DISCIPLINE</span>
                  <div style={{ fontSize: "12.5px", color: "var(--text-dim)", lineHeight: "1.6" }}>
                    <strong>Operational Discipline:</strong> Evaluates your alignment with critical safety protocols, equipment checklists, and physical security procedures.
                  </div>
                </div>

                <div style={{ display: "flex", gap: "16px", border: "1px solid var(--border)", padding: "12px", background: "var(--surface)" }}>
                  <span style={{ fontFamily: "var(--mono)", color: "var(--accent)", fontSize: "12px", fontWeight: "bold" }}>03. STABILITY</span>
                  <div style={{ fontSize: "12.5px", color: "var(--text-dim)", lineHeight: "1.6" }}>
                    <strong>Psychological Stability:</strong> Rates your capacity for cold, logical output under panic conditions or sensory overload events.
                  </div>
                </div>

                <div style={{ display: "flex", gap: "16px", border: "1px solid var(--border)", padding: "12px", background: "var(--surface)" }}>
                  <span style={{ fontFamily: "var(--mono)", color: "var(--accent)", fontSize: "12px", fontWeight: "bold" }}>04. PREPAREDNESS</span>
                  <div style={{ fontSize: "12.5px", color: "var(--text-dim)", lineHeight: "1.6" }}>
                    <strong>Technical Preparedness:</strong> Measures understanding of solar grids, mesh nets, local database storage, and cryptographic shielding systems.
                  </div>
                </div>

                <div style={{ display: "flex", gap: "16px", border: "1px solid var(--border)", padding: "12px", background: "var(--surface)" }}>
                  <span style={{ fontFamily: "var(--mono)", color: "var(--accent)", fontSize: "12px", fontWeight: "bold" }}>05. ADAPTABILITY</span>
                  <div style={{ fontSize: "12.5px", color: "var(--text-dim)", lineHeight: "1.6" }}>
                    <strong>Adaptability:</strong> Tracks how fast you adjust to shifting parameters, mutated biological vectors, or currency system resets.
                  </div>
                </div>

                <div style={{ display: "flex", gap: "16px", border: "1px solid var(--border)", padding: "12px", background: "var(--surface)" }}>
                  <span style={{ fontFamily: "var(--mono)", color: "var(--accent)", fontSize: "12px", fontWeight: "bold" }}>06. RESOURCEFUL</span>
                  <div style={{ fontSize: "12.5px", color: "var(--text-dim)", lineHeight: "1.6" }}>
                    <strong>Resourcefulness:</strong> Gauges water sanitization tactics, food loop preservation, tool fabrication, and micro-commodity trade skills.
                  </div>
                </div>

                <div style={{ display: "flex", gap: "16px", border: "1px solid var(--border)", padding: "12px", background: "var(--surface)" }}>
                  <span style={{ fontFamily: "var(--mono)", color: "var(--accent)", fontSize: "12px", fontWeight: "bold" }}>07. RESISTANCE</span>
                  <div style={{ fontSize: "12.5px", color: "var(--text-dim)", lineHeight: "1.6" }}>
                    <strong>Surveillance Resistance:</strong> Assesses active measures to strip device telemetry, cycle keypairs, and block ledger tracking correlation tools.
                  </div>
                </div>
              </div>

              <div style={{ border: "1px dashed var(--accent)", padding: "20px", marginBottom: "24px" }}>
                <h3 style={{ fontFamily: "var(--mono)", fontSize: "13px", color: "var(--accent)", marginBottom: "8px" }}>⚡ XP-BASED SYSTEM LEVEL & CLEARANCE CLASSIFICATION</h3>
                <p style={{ fontSize: "13.5px", color: "var(--text-dim)", lineHeight: "1.8", margin: "0 0 16px 0" }}>
                  Every dialogue session ends with RED QUEEN analyzing your decisions, awarding XP and stat points. System Level is computed directly from XP: <strong>Level = floor(XP / 100) + 1</strong>. Your Clearance Tier changes based on this level:
                </p>
                <div style={{ fontFamily: "var(--mono)", fontSize: "12px", display: "grid", gap: "8px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px dashed #222", paddingBottom: "4px" }}>
                    <span>Level 1 (0+ XP):</span> <span style={{ color: "#777" }}>CIVILIAN</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px dashed #222", paddingBottom: "4px" }}>
                    <span>Level 2 (100+ XP):</span> <span style={{ color: "var(--text)" }}>OBSERVER</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px dashed #222", paddingBottom: "4px" }}>
                    <span>Level 3 (200+ XP):</span> <span style={{ color: "#00ffcc" }}>OPERATIVE (Decrypt Archives)</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px dashed #222", paddingBottom: "4px" }}>
                    <span>Level 4 (350+ XP):</span> <span style={{ color: "#ffb333" }}>ANALYST</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px dashed #222", paddingBottom: "4px" }}>
                    <span>Level 5 (500+ XP):</span> <span style={{ color: "var(--accent)" }}>DIRECTOR (Full System Access)</span>
                  </div>
                </div>
              </div>

              <div className="alert alert-red" style={{ background: "rgba(255, 0, 51, 0.04)", borderLeft: "4px solid var(--accent)", padding: "16px" }}>
                <strong style={{ fontFamily: "var(--mono)" }}>⚠️ DECAY WARNING:</strong> To represent tracking correlation drifts and operational degradation, profiles experience **stat decay** if they do not interact with the system for more than 24 hours. The system applies small, gradual reductions to sub-stats and XP until stabilized by a new terminal diagnostic check-in.
              </div>
            </div>
          )}

          {/* 3. Threat Categories Explained */}
          {activeTab === "threat-categories" && (
            <div className="doc-section animation-fade-in">
              <h1 className="glow-text" style={{ fontSize: "22px", marginBottom: "24px", color: "var(--accent)", fontFamily: "var(--mono)" }}>
                [ 03 / CODENAME: THREAT SECTOR ARCHIVES ]
              </h1>
              
              <p style={{ color: "var(--text-dim)", fontSize: "14.5px", lineHeight: "1.9", marginBottom: "24px" }}>
                The RED QUEEN database organizes all recorded existential vulnerabilities into three distinct security sectors. Correct classification helps prioritize defensive focus.
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                <div style={{ border: "1px solid var(--accent-dim)", padding: "20px", background: "rgba(255,77,77,0.03)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                    <h3 style={{ fontFamily: "var(--mono)", fontSize: "14px", color: "var(--accent)", margin: 0 }}>• SECTOR ALPHA (KINETIC / REALISTIC THREATS)</h3>
                    <span className="tag tag-red" style={{ fontSize: "9px" }}>PRIMARY FOCUS</span>
                  </div>
                  <p style={{ fontSize: "13.5px", color: "var(--text-dim)", lineHeight: "1.7", margin: "0 0 8px 0" }}>
                    These dossiers catalog actual physical hazards tracked by real-world telemetry arrays (USGS earthquake sensors, NASA wildfire telemetry, disease contagion indices). These threats represent actionable survival concerns such as: viral outbreaks, blackout grids, severe seismic anomalies, and critical hyperinflation.
                  </p>
                  <span style={{ fontFamily: "var(--mono)", fontSize: "10px", color: "var(--accent)" }}>STATUS: ACTIVE LIVE TELEMETRY STREAMING</span>
                </div>

                <div style={{ border: "1px solid var(--border)", padding: "20px", background: "rgba(255,255,255,0.01)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                    <h3 style={{ fontFamily: "var(--mono)", fontSize: "14px", color: "var(--text)", margin: 0 }}>• SECTOR BETA (SIMULATIONS / FICTIONAL THREATS)</h3>
                    <span className="tag" style={{ fontSize: "9px", background: "#333", color: "#aaa" }}>TRAINING DOSSIER</span>
                  </div>
                  <p style={{ fontSize: "13.5px", color: "var(--text-dim)", lineHeight: "1.7", margin: "0 0 8px 0" }}>
                    This archive contains training simulations—such as zombie mutations, orbital debris impacts, or rogue robot rebellions. These files are utilized to build cognitive resilience and teach system mechanics without imminent real-world risk.
                  </p>
                  <span style={{ fontFamily: "var(--mono)", fontSize: "10px", color: "var(--text-dim)" }}>STATUS: SIMULATED ENVIRONMENT DATASETS ONLY</span>
                </div>

                <div style={{ border: "1px solid var(--border)", padding: "20px", background: "rgba(255,255,255,0.01)" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                    <h3 style={{ fontFamily: "var(--mono)", fontSize: "14px", color: "var(--text)", margin: 0 }}>• SECTOR GAMMA (ENTERTAINMENT ARCHIVES / SATIRICAL THREATS)</h3>
                    <span className="tag" style={{ fontSize: "9px", background: "#333", color: "#aaa" }}>COGNITIVE STRAIN TEST</span>
                  </div>
                  <p style={{ fontSize: "13.5px", color: "var(--text-dim)", lineHeight: "1.7", margin: "0 0 8px 0" }}>
                    Fictional satire models, including TikTok brainrot epidemics, streamer-governed autocracies, or total coffee-extinction events. Used by RED QUEEN to evaluate logical focus during periods of media noise saturation.
                  </p>
                  <span style={{ fontFamily: "var(--mono)", fontSize: "10px", color: "var(--text-dim)" }}>STATUS: SATIRICAL SIMULATION AND STRESS ASSISTANCE</span>
                </div>
              </div>
            </div>
          )}

          {/* 4. AI Terminal Guide */}
          {activeTab === "terminal-guide" && (
            <div className="doc-section animation-fade-in">
              <h1 className="glow-text" style={{ fontSize: "22px", marginBottom: "24px", color: "var(--accent)", fontFamily: "var(--mono)" }}>
                [ 04 / CODENAME: CLI OPERATIONS ]
              </h1>
              
              <p style={{ color: "var(--text-dim)", fontSize: "14.5px", lineHeight: "1.9", marginBottom: "24px" }}>
                The command line terminal (`/terminal`) is the main port of contact between you and RED QUEEN. Operatives can run system commands directly inside the prompt console.
              </p>

              <h3 style={{ color: "var(--text)", fontSize: "14px", marginBottom: "12px", fontFamily: "var(--mono)" }}>
                Operative Console Commands:
              </h3>

              <div style={{ display: "grid", gap: "12px", marginBottom: "32px", fontFamily: "var(--mono)", fontSize: "12.5px" }}>
                <div style={{ background: "var(--surface)", border: "1px solid var(--border)", padding: "12px", display: "flex", gap: "12px" }}>
                  <span style={{ color: "var(--accent)", width: "120px", flexShrink: 0 }}>help</span>
                  <span style={{ color: "var(--text-dim)" }}>- Displays list of system directives and command syntax parameters.</span>
                </div>
                <div style={{ background: "var(--surface)", border: "1px solid var(--border)", padding: "12px", display: "flex", gap: "12px" }}>
                  <span style={{ color: "var(--accent)", width: "120px", flexShrink: 0 }}>diagnose</span>
                  <span style={{ color: "var(--text-dim)" }}>- Queries local browser cache memory to sync state parameters.</span>
                </div>
                <div style={{ background: "var(--surface)", border: "1px solid var(--border)", padding: "12px", display: "flex", gap: "12px" }}>
                  <span style={{ color: "var(--accent)", width: "120px", flexShrink: 0 }}>status</span>
                  <span style={{ color: "var(--text-dim)" }}>- Prints active BIO-SCORE level, XP thresholds, sub-stats, and decay warnings.</span>
                </div>
                <div style={{ background: "var(--surface)", border: "1px solid var(--border)", padding: "12px", display: "flex", gap: "12px" }}>
                  <span style={{ color: "var(--accent)", width: "120px", flexShrink: 0 }}>scan</span>
                  <span style={{ color: "var(--text-dim)" }}>- Checks Solana ledger configuration state parameters for connected wallets.</span>
                </div>
                <div style={{ background: "var(--surface)", border: "1px solid var(--border)", padding: "12px", display: "flex", gap: "12px" }}>
                  <span style={{ color: "var(--accent)", width: "120px", flexShrink: 0 }}>decrypt [id]</span>
                  <span style={{ color: "var(--text-dim)" }}>- requests Level-3 clearance bypass on a specific secure sector dossier (requires x402 settlement).</span>
                </div>
              </div>

              <div style={{ border: "1px dashed var(--border)", padding: "20px", background: "#080808" }}>
                <h3 style={{ fontFamily: "var(--mono)", fontSize: "13px", color: "var(--text)", marginBottom: "8px" }}>🛡️ ANONYMOUS SESSIONS & THREAT SCAN LIMITS</h3>
                <p style={{ fontSize: "13.5px", color: "var(--text-dim)", lineHeight: "1.7", margin: 0 }}>
                  To maintain digital OPSEC, RED QUEEN allows temporary, anonymous diagnostic sessions. During an anonymous connection, the AI calculates a <strong>Potential BIO-SCORE</strong>. After **2 messages**, a warning block is displayed, prompting the user to connect a wallet. After **4 messages**, the console lock kicks in, blocking further queries until a cryptographic signature is provided to preserve the profile.
                </p>
              </div>
            </div>
          )}

          {/* 5. Wallet Privacy */}
          {activeTab === "wallet-privacy" && (
            <div className="doc-section animation-fade-in">
              <h1 className="glow-text" style={{ fontSize: "22px", marginBottom: "24px", color: "var(--accent)", fontFamily: "var(--mono)" }}>
                [ 05 / CODENAME: OPSEC STANDARD ]
              </h1>
              
              <p style={{ color: "var(--text-dim)", fontSize: "14.5px", lineHeight: "1.9", marginBottom: "24px" }}>
                Public ledger tracking models allow state surveillance structures to map physical survival clusters to cryptographic keys. Operatives must follow strict wallet privacy practices to maintain sovereignty.
              </p>

              <div style={{ display: "grid", gap: "20px" }}>
                <div className="panel" style={{ borderColor: "rgba(255, 77, 77, 0.15)", background: "rgba(10,10,10,0.4)" }}>
                  <h3 style={{ fontFamily: "var(--mono)", fontSize: "13px", color: "var(--accent)", marginBottom: "8px" }}>1. SECURE WEB3 SESSION RESETS</h3>
                  <p style={{ fontSize: "13.5px", color: "var(--text-dim)", lineHeight: "1.7", margin: 0 }}>
                    State scrapers continuously monitor browser localStorage. Always clear connection cache files and revoke dApp signature privileges directly after performing swaps or decrypting files.
                  </p>
                </div>

                <div className="panel" style={{ borderColor: "rgba(255, 77, 77, 0.15)", background: "rgba(10,10,10,0.4)" }}>
                  <h3 style={{ fontFamily: "var(--mono)", fontSize: "13px", color: "var(--accent)", marginBottom: "8px" }}>2. ISOLATED BROWSER ROUTING</h3>
                  <p style={{ fontSize: "13.5px", color: "var(--text-dim)", lineHeight: "1.7", margin: 0 }}>
                    Never use the same browser profiles for personal credentials (email, social accounts) and operational wallets. Run your ledger operations inside dedicated sandboxes (Tor, Brave Shields) to hide device telemetry footprints.
                  </p>
                </div>

                <div className="panel" style={{ borderColor: "rgba(255, 77, 77, 0.15)", background: "rgba(10,10,10,0.4)" }}>
                  <h3 style={{ fontFamily: "var(--mono)", fontSize: "13px", color: "var(--accent)", marginBottom: "8px" }}>3. NO OAUTH CORRELATION</h3>
                  <p style={{ fontSize: "13.5px", color: "var(--text-dim)", lineHeight: "1.7", margin: 0 }}>
                    Do not link centralized accounts (Discord, Google, Apple ID) to wallets storing survival credentials. RED QUEEN does not support Web2 login proxies because they are vulnerable to centralized tracking requests.
                  </p>
                </div>

                <div className="panel" style={{ borderColor: "rgba(255, 77, 77, 0.15)", background: "rgba(10,10,10,0.4)" }}>
                  <h3 style={{ fontFamily: "var(--mono)", fontSize: "13px", color: "var(--accent)", marginBottom: "8px" }}>4. PRIVATE RPC NODES</h3>
                  <p style={{ fontSize: "13.5px", color: "var(--text-dim)", lineHeight: "1.7", margin: 0 }}>
                    Public RPC endpoints route, log, and categorize client IP addresses. Route your wallet data packets through private virtual loops or use custom, decentralized validation RPC hooks.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* 6. Solana Infrastructure */}
          {activeTab === "solana-infra" && (
            <div className="doc-section animation-fade-in">
              <h1 className="glow-text" style={{ fontSize: "22px", marginBottom: "24px", color: "var(--accent)", fontFamily: "var(--mono)" }}>
                [ 06 / CODENAME: BLOCKCHAIN LEDGER ]
              </h1>
              
              <p style={{ color: "var(--text-dim)", fontSize: "14.5px", lineHeight: "1.9", marginBottom: "24px" }}>
                RED QUEEN deploys its state evaluation logic on the Solana blockchain network. This infrastructure choice was driven by operational safety parameters:
              </p>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "24px" }} className="responsive-grid-2-large">
                <div className="panel">
                  <h3 style={{ fontFamily: "var(--mono)", fontSize: "13px", color: "var(--accent)", marginBottom: "12px" }}>⚡ SPEED & THROUGHPUT</h3>
                  <p style={{ fontSize: "13px", color: "var(--text-dim)", lineHeight: "1.7", margin: 0 }}>
                    400ms block speeds ensure that critical danger warnings and operative credential handshakes are parsed immediately during network congestion events.
                  </p>
                </div>

                <div className="panel">
                  <h3 style={{ fontFamily: "var(--mono)", fontSize: "13px", color: "var(--accent)", marginBottom: "12px" }}>🪙 TRANSACT ECONOMIC TARIFFS</h3>
                  <p style={{ fontSize: "13px", color: "var(--text-dim)", lineHeight: "1.7", margin: 0 }}>
                    Sub-cent validator processing fees allow operatives to perform micro-decryptions and ledger updates without exhausting operational resource reserves.
                  </p>
                </div>

                <div className="panel">
                  <h3 style={{ fontFamily: "var(--mono)", fontSize: "13px", color: "var(--accent)", marginBottom: "12px" }}>🔒 TOKEN-2022 STANDARDS</h3>
                  <p style={{ fontSize: "13px", color: "var(--text-dim)", lineHeight: "1.7", margin: 0 }}>
                    Configured with cryptographic state transfers, allowing encrypted balances and confidential transactions, ensuring that wallet reserves remain safe from correlation bots.
                  </p>
                </div>

                <div className="panel">
                  <h3 style={{ fontFamily: "var(--mono)", fontSize: "13px", color: "var(--accent)", marginBottom: "12px" }}>🌐 LEDGER DISSOCIATION</h3>
                  <p style={{ fontSize: "13px", color: "var(--text-dim)", lineHeight: "1.7", margin: 0 }}>
                    Decentralized node arrays ensure access to RED QUEEN's ledger records even during localized submarine telecom cable failures or regional network splits.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* 7. Experimental x402 Infrastructure */}
          {activeTab === "x402-infra" && (
            <div className="doc-section animation-fade-in">
              <h1 className="glow-text" style={{ fontSize: "22px", marginBottom: "24px", color: "var(--accent)", fontFamily: "var(--mono)" }}>
                [ 07 / CODENAME: X402 PROTOCOL ]
              </h1>
              
              <div className="alert alert-red" style={{ background: "rgba(255, 0, 51, 0.05)", borderLeft: "4px solid var(--accent)", padding: "20px", marginBottom: "24px" }}>
                <strong style={{ fontFamily: "var(--mono)", color: "var(--accent)" }}>[ SYSTEM DISCLAIMER: EXPERIMENTAL PROTOCOL ]</strong>
                <p style={{ fontSize: "13.5px", color: "var(--text)", marginTop: "8px", lineHeight: "1.7", margin: 0 }}>
                  The x402 payment handshake protocol is an **experimental infrastructure currently in development**. Do NOT market it as production-ready. It is deployed inside Sector Delta strictly for technical evaluation and stress testing.
                </p>
              </div>

              <p style={{ color: "var(--text-dim)", fontSize: "14.5px", lineHeight: "1.9", marginBottom: "24px" }}>
                The x402 protocol handles automated token-gate challenge checks for classified dossiers natively inside HTTP request cycles. It allows machines to settle compute fees without database accounts.
              </p>

              {/* ASCII Diagram */}
              <pre style={{ background: "#020202", border: "1px solid var(--border)", padding: "20px", color: "var(--accent)", fontFamily: "var(--mono)", fontSize: "11px", overflowX: "auto", marginBottom: "24px", lineHeight: "1.5" }}>
{`       [ OPERATIVE CLIENT ]                           [ RED QUEEN GATEWAY ]
                |                                               |
                |--- (1) GET Gated Archive Dossier ------------>|
                |                                               |
                |<-- (2) HTTP 402 + Base64 Challenge -----------| (Gated)
                |                                               |
                |--- (3) Sign & Settle 0.05 USDC (On-Chain) ---->| (Treasury)
                |                                               |
                |--- (4) GET Dossier + X-PAYMENT-SIGNATURE ---->|
                |                                               |
                |<-- (5) Verify Signature & Decrypt Archive ---| (Status 200)`}
              </pre>

              {/* Interactive Code Example */}
              <div style={{ border: "1px solid var(--border)", background: "#050505", borderRadius: "2px", overflow: "hidden", marginBottom: "20px" }}>
                <div style={{ background: "var(--surface)", padding: "10px 16px", display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--border)" }}>
                  <span style={{ fontFamily: "var(--mono)", fontSize: "11px", color: "var(--accent)" }}>HTTP HEADER CHALLENGE SPECIFICATION</span>
                  <span style={{ fontFamily: "var(--mono)", fontSize: "9px", color: "var(--text-dim)" }}>CLICK CODE LINES TO DECRYPT DETAILS</span>
                </div>
                <pre style={{ padding: "16px", margin: 0, fontSize: "11.5px", fontFamily: "var(--mono)", overflowX: "auto", lineHeight: "1.6" }}>
                  <div onClick={() => setHighlightedCode("status")} style={{ padding: "4px 8px", background: highlightedCode === "status" ? "rgba(255,0,51,0.12)" : "transparent", cursor: "pointer", transition: "background 0.2s" }}>
                    <span style={{ color: "#777" }}>// Server challenges client with payment request status code</span><br />
                    <span style={{ color: "var(--accent)" }}>Status:</span> 402 Payment Required
                  </div>
                  <div onClick={() => setHighlightedCode("challenge")} style={{ padding: "4px 8px", background: highlightedCode === "challenge" ? "rgba(255,0,51,0.12)" : "transparent", cursor: "pointer", transition: "background 0.2s" }}>
                    <span style={{ color: "#777" }}>// Challenge body containing Base64 parameters</span><br />
                    <span style={{ color: "var(--accent)" }}>PAYMENT-REQUIRED:</span> eyJhbW91bnQiOiIwLjA1IiwidG9rZW4iOiJVU0RDIiwibmV0d29yayI6InNvbGFuYS1kZXZuZXQifQ==
                  </div>
                  <div onClick={() => setHighlightedCode("signature")} style={{ padding: "4px 8px", background: highlightedCode === "signature" ? "rgba(255,0,51,0.12)" : "transparent", cursor: "pointer", transition: "background 0.2s" }}>
                    <span style={{ color: "#777" }}>// Client retries with confirmed on-chain transaction hash</span><br />
                    <span style={{ color: "var(--accent)" }}>X-PAYMENT-SIGNATURE:</span> 4xG9e2s...a911c82b3
                  </div>
                </pre>
              </div>

              {/* Dynamic Explainer */}
              <div style={{ background: "#0c0c0c", border: "1px dashed var(--border)", padding: "16px", borderRadius: "2px", minHeight: "80px" }}>
                <div style={{ fontFamily: "var(--mono)", fontSize: "10px", color: "var(--accent)", letterSpacing: "0.15em", marginBottom: "6px" }}>
                  📡 PROTOCOL EXPLAINER PANEL
                </div>
                <p style={{ fontFamily: "var(--mono)", fontSize: "12px", color: "var(--text-dim)", margin: 0, lineHeight: "1.6" }}>
                  {getCodeExplainer()}
                </p>
              </div>
            </div>
          )}

          {/* 8. FAQ */}
          {activeTab === "faq" && (
            <div className="doc-section animation-fade-in">
              <h1 className="glow-text" style={{ fontSize: "22px", marginBottom: "24px", color: "var(--accent)", fontFamily: "var(--mono)" }}>
                [ 08 / CODENAME: INTELLIGENCE FAQ ]
              </h1>
              
              <p style={{ color: "var(--text-dim)", fontSize: "14.5px", lineHeight: "1.9", marginBottom: "24px" }}>
                Common operational questions regarding system usage, ledger mechanics, and survival diagnostics.
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                <div className="panel" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
                  <h3 style={{ fontFamily: "var(--mono)", fontSize: "13.5px", color: "var(--accent)", marginBottom: "8px" }}>Q: Why does the terminal lock after 4 messages?</h3>
                  <p style={{ fontSize: "13px", color: "var(--text-dim)", lineHeight: "1.7", margin: 0 }}>
                    A: Every request processed anonymously can be analyzed and linked to specific hardware configurations or browser sessions. To prevent tracking leaks, RED QUEEN forces a wallet handshake to store stats, verifying that you represent a valid cryptographic operative profile before proceeding.
                  </p>
                </div>

                <div className="panel" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
                  <h3 style={{ fontFamily: "var(--mono)", fontSize: "13.5px", color: "var(--accent)", marginBottom: "8px" }}>Q: How is my BIO-SCORE progress saved?</h3>
                  <p style={{ fontSize: "13px", color: "var(--text-dim)", lineHeight: "1.7", margin: 0 }}>
                    A: Stats blocks are serialized as structured JSON strings and safely written to your wallet's database entry. The data is parsed dynamically, ensuring that your profile remains persistent and mobile-accessible across connected sessions.
                  </p>
                </div>

                <div className="panel" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
                  <h3 style={{ fontFamily: "var(--mono)", fontSize: "13.5px", color: "var(--accent)", marginBottom: "8px" }}>Q: Why did my technical prepared status drop?</h3>
                  <p style={{ fontSize: "13px", color: "var(--text-dim)", lineHeight: "1.7", margin: 0 }}>
                    A: Over time, tracking algorithms drift and human muscle memory degrades. If 24 hours pass without checking the console, the RED QUEEN applies a stat decay. Run a terminal diagnostic audit (`diagnose` or a chat message) to lock your stats and stop decay.
                  </p>
                </div>

                <div className="panel" style={{ borderColor: "rgba(255,255,255,0.05)" }}>
                  <h3 style={{ fontFamily: "var(--mono)", fontSize: "13.5px", color: "var(--accent)", marginBottom: "8px" }}>Q: Can I access the system on mobile?</h3>
                  <p style={{ fontSize: "13px", color: "var(--text-dim)", lineHeight: "1.7", margin: 0 }}>
                    A: Yes. RED QUEEN is configured with responsive viewport styling. You can connect through mobile wallet browsers, though keep in mind that CLI input commands can require careful typing.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* 9. Future Roadmap */}
          {activeTab === "roadmap" && (
            <div className="doc-section animation-fade-in">
              <h1 className="glow-text" style={{ fontSize: "22px", marginBottom: "24px", color: "var(--accent)", fontFamily: "var(--mono)" }}>
                [ 09 / CODENAME: SYSTEM HORIZON ]
              </h1>
              
              <p style={{ color: "var(--text-dim)", fontSize: "14.5px", lineHeight: "1.9", marginBottom: "24px" }}>
                RED QUEEN's development plan covers the creation of localized hardware nodes, physical caches, and automated digital defense shields.
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: "16px", marginBottom: "24px" }}>
                <div style={{ display: "flex", gap: "16px", border: "1px solid var(--border)", padding: "16px", background: "var(--surface)" }}>
                  <span style={{ fontFamily: "var(--mono)", color: "var(--accent)", fontSize: "12px", fontWeight: "bold" }}>PHASE 3</span>
                  <div style={{ fontSize: "13px", color: "var(--text-dim)", lineHeight: "1.6" }}>
                    <strong>P2P MESH COMMUNICATIONS:</strong> Development of peer-to-peer radio mesh network adapters to sync threat vectors and offline database parameters without active cellular connections.
                  </div>
                </div>

                <div style={{ display: "flex", gap: "16px", border: "1px solid var(--border)", padding: "16px", background: "var(--surface)" }}>
                  <span style={{ fontFamily: "var(--mono)", color: "var(--accent)", fontSize: "12px", fontWeight: "bold" }}>PHASE 4</span>
                  <div style={{ fontSize: "13px", color: "var(--text-dim)", lineHeight: "1.6" }}>
                    <strong>TOKEN-GATED PHYSICAL CACHES:</strong> Deployment of physical survival caches containing power banks, emergency water filters, and key backup cards, unlockable on-site via cryptographic proof signature verification.
                  </div>
                </div>

                <div style={{ display: "flex", gap: "16px", border: "1px solid var(--border)", padding: "16px", background: "var(--surface)" }}>
                  <span style={{ fontFamily: "var(--mono)", color: "var(--accent)", fontSize: "12px", fontWeight: "bold" }}>PHASE 5</span>
                  <div style={{ fontSize: "13px", color: "var(--text-dim)", lineHeight: "1.6" }}>
                    <strong>AUTOMATED PORTFOLIO SHIELDS:</strong> Integration of AI defense agents that continuously scan financial networks, automatically swapping risk assets to stable storage during detected global cyberwarfare warning signs.
                  </div>
                </div>

                <div style={{ display: "flex", gap: "16px", border: "1px solid var(--border)", padding: "16px", background: "var(--surface)" }}>
                  <span style={{ fontFamily: "var(--mono)", color: "var(--accent)", fontSize: "12px", fontWeight: "bold" }}>PHASE 6</span>
                  <div style={{ fontSize: "13px", color: "var(--text-dim)", lineHeight: "1.6" }}>
                    <strong>MULTI-CHAIN IDENTITY PROTOCOL:</strong> Bridging operative BIO-SCORE profiles and levels to alternative sovereign ledgers to prevent data loss in the event of single chain finality failures.
                  </div>
                </div>
              </div>
            </div>
          )}

        </main>
      </div>
    </div>
  );
}
