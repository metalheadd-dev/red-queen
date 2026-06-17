"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import SolvivalIcon from "@/components/SolvivalIcon";

export default function SurvivalKitPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("what-is-red-queen");

  const tabs = [
    { id: "what-is-red-queen", label: "01. OVERVIEW", title: "WHAT IS RED QUEEN?" },
    { id: "bio-score", label: "02. BIO-SCORE", title: "BIO-SCORE MECHANICS" },
    { id: "xp-vs-bio-score", label: "03. XP VS BIO-SCORE", title: "XP VS BIO-SCORE COMPARISON" },
    { id: "terminal-guide", label: "04. CLI MANUAL", title: "HOW THE TERMINAL WORKS" },
    { id: "threat-categories", label: "05. HAZARD SECTORS", title: "THREAT CATEGORIES" },
    { id: "wallet-connection", label: "06. IDENTITY", title: "WALLET & IDENTITY SECURITY" },
    { id: "clearance-levels", label: "07. TIERS", title: "SYSTEM CLEARANCE LEVELS" },
    { id: "faq", label: "08. INQUIRIES", title: "FREQUENTLY ASKED QUESTIONS" },
    { id: "map-config", label: "09. MAP API", title: "MAP API CONFIGURATION" },
    { id: "usdc-paywalls", label: "10. PAYWALLS", title: "USDC PAYWALLS & MICRO-PAYMENTS" },
    { id: "roadmap", label: "11. ROADMAP", title: "FUTURE ROADMAP & DEVELOPMENT PLAN" },
    { id: "clearance-portal", label: "ACCESS PORTAL", title: "GO TO CLEARANCE PORTAL", isRedirect: true, href: "/network-clearance" }
  ];

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", paddingTop: "60px", background: "#050505" }}>
      {/* Header Banner */}
      <div style={{ borderBottom: "1px solid var(--border)", padding: "48px 24px", background: "var(--surface)" }}>
        <div className="container">
          <div className="tag tag-red" style={{ marginBottom: "16px" }}>OPERATIVE MANUAL // SYSTEM DOCUMENTATION</div>
          <h1 style={{ fontSize: "clamp(28px, 5vw, 44px)", marginBottom: "12px", letterSpacing: "0.05em", color: "#ffffff" }}>
            SURVIVAL <span style={{ color: "var(--accent)" }}>KIT</span>
          </h1>
          <p style={{ fontSize: "14px", color: "var(--text-dim)", lineHeight: "1.6", maxWidth: "700px" }}>
            The official user guide, technical documentation, and tactical FAQ for navigating the RED QUEEN AI intelligence platform.
          </p>
        </div>
      </div>

      {/* Main Grid Layout */}
      <div className="container" style={{ display: "flex", flex: 1, padding: "40px 24px", gap: "40px" }}>
        
        {/* Navigation Sidebar */}
        <aside style={{
          width: "280px",
          display: "flex",
          flexDirection: "column",
          gap: "10px",
          flexShrink: 0
        }} className="desktop-only">
          <div style={{ marginBottom: "20px", display: "flex", alignItems: "center", gap: "12px" }}>
            <SolvivalIcon size={28} />
            <span style={{ fontFamily: "var(--mono)", fontSize: "11px", fontWeight: "bold", color: "var(--accent)", letterSpacing: "0.15em" }}>
              DOCUMENTATION
            </span>
          </div>

          {tabs.map((t) => {
            const isActive = activeTab === t.id;
            return (
              <button
                key={t.id}
                onClick={() => {
                  if ('isRedirect' in t && t.isRedirect) {
                    router.push(t.href || "/");
                  } else {
                    setActiveTab(t.id);
                  }
                }}
                style={{
                  textAlign: "left",
                  padding: "14px 18px",
                  fontSize: "12px",
                  fontFamily: "var(--mono)",
                  fontWeight: "bold",
                  border: "1px solid",
                  borderColor: isActive ? "var(--accent)" : "rgba(255, 255, 255, 0.05)",
                  background: isActive ? "rgba(255, 77, 77, 0.06)" : "#0b0b0b",
                  color: isActive ? "#ffffff" : "var(--text-dim)",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                  borderRadius: "2px",
                  boxShadow: isActive ? "0 0 10px rgba(255, 0, 51, 0.1)" : "none"
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  {t.id === "clearance-portal" && (
                    <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, color: "var(--accent)", filter: "drop-shadow(0 0 2px var(--accent))" }}>
                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                    </svg>
                  )}
                  <span>{t.label}</span>
                </div>
              </button>
            );
          })}
        </aside>
 
        {/* Mobile Navigation Selector */}
        <div style={{ display: "none", width: "100%", marginBottom: "20px" }} className="mobile-menu-toggle">
          <select
            value={activeTab}
            onChange={(e) => {
              const selected = tabs.find(t => t.id === e.target.value);
              if (selected && 'isRedirect' in selected && selected.isRedirect) {
                router.push(selected.href || "/");
              } else {
                setActiveTab(e.target.value);
              }
            }}
            style={{
              width: "100%",
              padding: "12px",
              background: "#0b0b0b",
              border: "1px solid var(--border-red)",
              color: "#ffffff",
              fontFamily: "var(--mono)",
              fontSize: "13px",
              borderRadius: "2px",
              outline: "none"
            }}
          >
            {tabs.map((t) => (
              <option key={t.id} value={t.id}>
                {t.id === "clearance-portal" ? "🔒 " + t.title : t.title}
              </option>
            ))}
          </select>
        </div>

        {/* Documentation Content Area */}
        <main style={{ flex: 1, minWidth: 0, paddingBottom: "60px" }}>
          
          {/* Chapter Title */}
          {tabs.map((t) => {
            if (t.id !== activeTab) return null;
            return (
              <div key={t.id} style={{ borderBottom: "1px solid var(--border)", paddingBottom: "20px", marginBottom: "32px" }}>
                <span style={{ fontFamily: "var(--mono)", fontSize: "11px", color: "var(--accent)", letterSpacing: "0.2em", display: "block", marginBottom: "6px" }}>
                  CHAPTER {tabs.indexOf(t) + 1} // OPERATIONAL BRIEFING
                </span>
                <h2 style={{ fontSize: "28px", color: "#ffffff", margin: 0, letterSpacing: "0.03em" }}>
                  {t.title}
                </h2>
              </div>
            );
          })}

          {/* 1. What is RED QUEEN */}
          {activeTab === "what-is-red-queen" && (
            <div className="animation-fade-in" style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
              <p style={{ fontSize: "16px", color: "var(--text-dim)", lineHeight: "1.8" }}>
                RED QUEEN is an immersive AI survival intelligence platform and operational network. Built to monitor, catalog, and evaluate systemic threat vectors facing digital and physical infrastructures, the platform serves as a critical simulation layer for digital autonomy.
              </p>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }} className="responsive-grid-2">
                <div className="panel" style={{ background: "#0c0c0c", borderColor: "rgba(255,255,255,0.04)", padding: "28px" }}>
                  <h3 style={{ fontSize: "16px", color: "var(--accent)", marginBottom: "12px" }}>LIVE THREAT RADAR</h3>
                  <p style={{ fontSize: "14px", color: "var(--text-dim)", lineHeight: "1.7", margin: 0 }}>
                    Aggregates real-world anomalies, biological contamination spikes, and geological disasters from live telemetry databases, plotting them onto a tactical world map.
                  </p>
                </div>

                <div className="panel" style={{ background: "#0c0c0c", borderColor: "rgba(255,255,255,0.04)", padding: "28px" }}>
                  <h3 style={{ fontSize: "16px", color: "var(--accent)", marginBottom: "12px" }}>COGNITIVE DIAGNOSTICS</h3>
                  <p style={{ fontSize: "14px", color: "var(--text-dim)", lineHeight: "1.7", margin: 0 }}>
                    Subjects users to high-stress crisis scenarios within the terminal console, grading replies dynamically to calculate survival readiness and OPSEC indices.
                  </p>
                </div>
              </div>

              <div className="alert alert-red" style={{ background: "rgba(255, 77, 77, 0.03)", borderLeft: "4px solid var(--accent)", padding: "24px" }}>
                <strong style={{ fontFamily: "var(--mono)", fontSize: "11px", display: "block", color: "var(--accent)", marginBottom: "8px", letterSpacing: "0.1em" }}>
                  [ PRINCIPLE DIRECTIVE ]
                </strong>
                <span style={{ fontSize: "14px", color: "var(--text)", lineHeight: "1.7", display: "block" }}>
                  "Sovereignty begins with information. By understanding active threat matrices and maintaining rigorous digital discipline, operatives safeguard their digital footprints prior to network anomalies."
                </span>
              </div>
            </div>
          )}

          {/* 2. How BIO SCORE works */}
          {activeTab === "bio-score" && (
            <div className="animation-fade-in" style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
              <p style={{ fontSize: "16px", color: "var(--text-dim)", lineHeight: "1.8" }}>
                The <strong>BIO-SCORE</strong> represents your current, real-time survival readiness rating, calculated from 0% to 100%. It is computed dynamically as the mathematical average of 7 core preparedness sub-stats:
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {[
                  { name: "AWARENESS", desc: "Your capacity to identify, catalog, and evaluate active physical and digital risk sectors." },
                  { name: "DISCIPLINE", desc: "Consistency in maintaining secure routines, hardware checklists, and protocol alignment." },
                  { name: "STABILITY", desc: "Psychological resilience and ability to provide clear, logical responses during simulated stress conditions." },
                  { name: "TECHNICAL PREPARATION", desc: "Understanding of isolated compute setups, cold storage devices, and offline data backups." },
                  { name: "ADAPTABILITY", desc: "Your agility in adjusting strategy to fit mutating biological threats or shifting economic rules." },
                  { name: "RESOURCEFULNESS", desc: "Skill in designing local loop solutions for clean water, off-grid energy, and peer communication." },
                  { name: "SURVEILLANCE RESISTANCE", desc: "OPSEC proficiency, trace decoupling, address rotation, and privacy firewall configuration." }
                ].map((stat, idx) => (
                  <div key={idx} style={{ background: "#0c0c0c", border: "1px solid rgba(255,255,255,0.03)", padding: "16px 20px", borderRadius: "2px", display: "flex", gap: "16px" }} className="responsive-grid-2">
                    <span style={{ fontFamily: "var(--mono)", fontSize: "12px", color: "var(--accent)", fontWeight: "bold", width: "180px", flexShrink: 0 }}>
                      0{idx + 1}. {stat.name}
                    </span>
                    <span style={{ fontSize: "14px", color: "var(--text-dim)", lineHeight: "1.6" }}>
                      {stat.desc}
                    </span>
                  </div>
                ))}
              </div>

              <div className="panel" style={{ background: "#0c0c0c", borderColor: "rgba(255,255,255,0.04)", padding: "24px" }}>
                <h3 style={{ fontSize: "15px", color: "#ffffff", marginBottom: "8px", fontFamily: "var(--mono)" }}>📊 MATHEMATICAL FORMULA</h3>
                <code style={{ display: "block", background: "#060606", padding: "12px", borderRadius: "2px", color: "#00ffcc", fontFamily: "var(--mono)", fontSize: "13px", marginBottom: "12px" }}>
                  BIO-SCORE = sum(sub_stats) / 7
                </code>
                <p style={{ fontSize: "13.5px", color: "var(--text-dim)", lineHeight: "1.6", margin: 0 }}>
                  Each of the 7 stats is graded on a scale of 0 to 100. The total sum is divided by 7 to yield your overall rating. Performing terminal challenges updates individual sub-stats.
                </p>
              </div>

              <div className="alert alert-red" style={{ background: "rgba(255, 77, 77, 0.03)", borderLeft: "4px solid var(--accent)", padding: "20px" }}>
                <strong style={{ fontFamily: "var(--mono)", fontSize: "11px", color: "var(--accent)", display: "block", marginBottom: "4px" }}>
                  ⚠️ TELEMETRY INACTIVITY DECAY
                </strong>
                <span style={{ fontSize: "13.5px", color: "var(--text-dim)", lineHeight: "1.7" }}>
                  Operational readiness degrades when not actively maintained. If 24 hours pass without checking in at the terminal console, the system applies a gradual decay to your sub-stats, reducing your BIO-SCORE by <strong>5% per day</strong> until it hits a baseline minimum of 10%. Performing terminal diagnostics halts decay and restores active scores.
                </span>
              </div>
            </div>
          )}

          {/* 3. XP vs BIO SCORE */}
          {activeTab === "xp-vs-bio-score" && (
            <div className="animation-fade-in" style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
              <p style={{ fontSize: "16px", color: "var(--text-dim)", lineHeight: "1.8" }}>
                To ensure a balanced progression, the platform maintains a strict architectural separation between permanent experience metrics and dynamic preparedness values:
              </p>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }} className="responsive-grid-2">
                
                {/* XP Panel */}
                <div className="panel" style={{ background: "#0c0c0c", borderColor: "rgba(255,255,255,0.04)", padding: "28px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px" }}>
                    <h3 style={{ fontSize: "16px", color: "#ffffff", margin: 0 }}>EXPERIENCE POINTS (XP)</h3>
                    <span className="tag tag-green" style={{ fontSize: "10px" }}>PERMANENT</span>
                  </div>
                  <ul style={{ paddingLeft: "18px", color: "var(--text-dim)", fontSize: "14px", display: "flex", flexDirection: "column", gap: "10px", lineHeight: "1.6" }}>
                    <li>Accumulates continuously through diagnostic queries and terminal interactions.</li>
                    <li><strong>Never decreases</strong> under any circumstances.</li>
                    <li>Calculates your permanent System Level: <code>Level = floor(XP / 100) + 1</code>.</li>
                    <li>Used directly to unlock permanent Clearance Levels and archive decrypt codes.</li>
                  </ul>
                </div>

                {/* Bio Score Panel */}
                <div className="panel" style={{ background: "#0c0c0c", borderColor: "rgba(255,255,255,0.04)", padding: "28px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px" }}>
                    <h3 style={{ fontSize: "16px", color: "var(--accent)", margin: 0 }}>BIO-SCORE</h3>
                    <span className="tag tag-red" style={{ fontSize: "10px" }}>DYNAMIC</span>
                  </div>
                  <ul style={{ paddingLeft: "18px", color: "var(--text-dim)", fontSize: "14px", display: "flex", flexDirection: "column", gap: "10px", lineHeight: "1.6" }}>
                    <li>Calculated as the active average of your 7 individual sub-stats.</li>
                    <li><strong>Fluctuates dynamically</strong> based on terminal checks and crisis logs.</li>
                    <li>Decreases over time due to **Inactivity Decay** if you go offline.</li>
                    <li>Reflects your immediate survival readiness, OPSEC trace safety, and operational posture.</li>
                  </ul>
                </div>

              </div>

              <div className="panel" style={{ background: "#0c0c0c", borderColor: "rgba(255,255,255,0.04)", padding: "28px" }}>
                <h3 style={{ fontSize: "16px", color: "#ffffff", marginBottom: "16px", fontFamily: "var(--mono)" }}>🛠️ XP PROGRESSION SYSTEM</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                  <div style={{ borderBottom: "1px dashed rgba(255, 255, 255, 0.05)", paddingBottom: "10px" }}>
                    <span style={{ fontFamily: "var(--mono)", fontSize: "12px", color: "#00ffcc", fontWeight: "bold" }}>BASE XP REWARDS:</span>
                    <ul style={{ margin: "6px 0 0 0", paddingLeft: "20px", color: "var(--text-dim)", fontSize: "13.5px" }}>
                      <li><strong>Console Diagnostic Check-in:</strong> +20 XP</li>
                      <li><strong>Terminal Crisis Interaction (Chat):</strong> +10 to +30 XP (dynamically analyzed)</li>
                      <li><strong>On-Chain Metadata Scan:</strong> +15 XP</li>
                    </ul>
                  </div>
                  <div>
                    <span style={{ fontFamily: "var(--mono)", fontSize: "12px", color: "var(--accent)", fontWeight: "bold" }}>XP BOOSTERS (STACKED MULTIPLIERS):</span>
                    <ul style={{ margin: "6px 0 0 0", paddingLeft: "20px", color: "var(--text-dim)", fontSize: "13.5px" }}>
                      <li><strong>$THREAT Token Hold:</strong> Holding any balance of <code>$THREAT</code> applies a flat <strong>2.00x multiplier</strong>.</li>
                      <li><strong>Clearance Level Multipliers:</strong>
                        <ul style={{ paddingLeft: "16px", margin: "4px 0" }}>
                          <li>Level 1: 1.00x</li>
                          <li>Level 2: 1.25x</li>
                          <li>Level 3: 1.50x</li>
                          <li>Level 4: 1.75x</li>
                          <li>Level 5: 2.00x</li>
                        </ul>
                      </li>
                      <li><strong>Formula:</strong> <code>Total XP Gained = Base XP * Token Booster * Clearance Booster</code></li>
                      <li style={{ marginTop: "4px", fontStyle: "italic", color: "#ffffff" }}>Example: A Level 5 Director holding $THREAT tokens gets a 4.00x total XP multiplier!</li>
                    </ul>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* 4. How the terminal works */}
          {activeTab === "terminal-guide" && (
            <div className="animation-fade-in" style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
              <p style={{ fontSize: "16px", color: "var(--text-dim)", lineHeight: "1.8" }}>
                The command line interface is your gateway to communication with the RED QUEEN. Operatives can transmit specific commands to query databases, calculate stats, or decode logs:
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: "10px", fontFamily: "var(--mono)", fontSize: "13px" }}>
                {[
                  { cmd: "/help", desc: "Display all available system commands, syntax guides, and clearance requirements." },
                  { cmd: "/bio", desc: "Query your current active BIO-SCORE, sub-stats ratings, and security evaluation status." },
                  { cmd: "/scan", desc: "Triggers deep metadata checks verifying your signature profiles on ledger tracking networks (requires connected wallet)." },
                  { cmd: "/decrypt [ID]", desc: "Requests cryptographic decryption of specific secure threat vector dossiers in the archives (requires Level-3 clearance)." }
                ].map((item, idx) => (
                  <div key={idx} style={{ background: "#0b0b0b", border: "1px solid rgba(255,255,255,0.03)", padding: "14px 20px", display: "flex", gap: "12px", borderRadius: "2px" }} className="responsive-grid-2">
                    <span style={{ color: "var(--accent)", fontWeight: "bold", width: "120px", flexShrink: 0 }}>{item.cmd}</span>
                    <span style={{ color: "var(--text-dim)" }}>- {item.desc}</span>
                  </div>
                ))}
              </div>

              <div className="panel" style={{ background: "#0c0c0c", borderColor: "rgba(255, 77, 77, 0.15)", padding: "24px" }}>
                <h3 style={{ fontSize: "15px", color: "#ffffff", marginBottom: "8px", fontFamily: "var(--mono)", display: "flex", alignItems: "center", gap: "8px" }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="var(--accent)" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, filter: "drop-shadow(0 0 3px var(--accent))" }}>
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                  <span>ANONYMOUS SESSION BLOCKOUT</span>
                </h3>
                <p style={{ fontSize: "13.5px", color: "var(--text-dim)", lineHeight: "1.7", margin: 0 }}>
                  To maintain rigorous digital OPSEC, RED QUEEN restricts anonymous profiles to prevent crawler engines from scraping session keys. Unsigned visitors can transmit up to <strong>2 queries</strong> before a wallet prompt appears, and the terminal will <strong>completely lock after 4 queries</strong>. Connecting a Solana wallet verifies your operative signature, saves your progress, and unlocks unlimited diagnostic queries.
                </p>
              </div>
            </div>
          )}

          {/* 5. Threat categories */}
          {activeTab === "threat-categories" && (
            <div className="animation-fade-in" style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
              <p style={{ fontSize: "16px", color: "var(--text-dim)", lineHeight: "1.8" }}>
                To prioritize security responses, RED QUEEN catalogs systemic vulnerabilities across four distinct sectors:
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {[
                  {
                    sector: "SECTOR ALPHA (KINETIC / REALISTIC)",
                    type: "LIVE TELEMETRY",
                    color: "#ff4d4d",
                    desc: "Dossiers charting real-world environmental hazards. These threats are fed directly from global telemetry arrays: USGS earthquake sensors, NASA EONET thermal sensors, and disease.sh infection databases. Focuses on viral outbreaks, extreme weather vectors, seismic shifts, and energy grids."
                  },
                  {
                    sector: "SECTOR BETA (SIMULATED / FICTIONAL)",
                    type: "TRAINING BRIEFINGS",
                    color: "#a855f7",
                    desc: "Fictional training scenarios designed to test cognitive responses under severe grid collapse parameters (e.g. robotic sweeps, automated drone rogue outbreaks, localized containment breaches). Builds mental agility without actual danger."
                  },
                  {
                    sector: "SECTOR GAMMA (SATIRICAL / COGNITIVE STRAIN)",
                    type: "NOISE TEST",
                    color: "#f0c929",
                    desc: "Satirical, media-focused threats designed to evaluate an operative's capability to separate critical information from background noise (e.g., social feed timeline steering, brainrot spikes, global coffee trade splits)."
                  },
                  {
                    sector: "SECTOR DELTA (ALGORITHMIC / DATA SHIELDS)",
                    type: "CYBER TELEMETRY",
                    color: "#00ffcc",
                    desc: "Systemic cybersecurity hazards, network exploit anomalies, cryptographic pipeline vulnerabilities, and AI model poisoning vectors targeting the core progression nodes."
                  }
                ].map((sec, idx) => (
                  <div key={idx} style={{ background: "#0c0c0c", border: `1px solid rgba(255,255,255,0.03)`, borderLeft: `4px solid ${sec.color}`, padding: "20px 24px", borderRadius: "2px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px", flexWrap: "wrap", gap: "8px" }}>
                      <h4 style={{ fontSize: "14px", color: "#ffffff", margin: 0 }}>{sec.sector}</h4>
                      <span className="tag" style={{ background: "rgba(255,255,255,0.04)", color: sec.color, borderColor: "rgba(255,255,255,0.06)", fontSize: "9px" }}>{sec.type}</span>
                    </div>
                    <p style={{ fontSize: "13.5px", color: "var(--text-dim)", lineHeight: "1.7", margin: 0 }}>
                      {sec.desc}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 6. Wallet connection */}
          {activeTab === "wallet-connection" && (
            <div className="animation-fade-in" style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
              <p style={{ fontSize: "16px", color: "var(--text-dim)", lineHeight: "1.8" }}>
                Connecting your Solana wallet establishes a secure, cryptographic operative passport. RED QUEEN implements Supabase Web3 Authentication and decentralized privacy controls:
              </p>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }} className="responsive-grid-2">
                <div className="panel" style={{ background: "#0c0c0c", borderColor: "rgba(255,255,255,0.04)", padding: "24px" }}>
                  <h3 style={{ fontSize: "15px", color: "#ffffff", marginBottom: "8px" }}>SECURE CHALLENGE SIGNING</h3>
                  <p style={{ fontSize: "13.5px", color: "var(--text-dim)", lineHeight: "1.6", margin: 0 }}>
                    When you connect your wallet, the terminal generates a secure login challenge. Signing this challenge confirms ownership of the wallet, establishes a secure session token, and prevents unauthorized database writes or query-string spoofing.
                  </p>
                </div>

                <div className="panel" style={{ background: "#0c0c0c", borderColor: "rgba(255,255,255,0.04)", padding: "24px" }}>
                  <h3 style={{ fontSize: "15px", color: "#ffffff", marginBottom: "8px" }}>SALTED PROFILE HASHING</h3>
                  <p style={{ fontSize: "13.5px", color: "var(--text-dim)", lineHeight: "1.6", margin: 0 }}>
                    Your wallet's public key is combined with a secure server-side salt and hashed via SHA-256 before database index lookup. This keeps your on-chain ledger profile anonymized inside our database structures.
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* 7. Clearance levels */}
          {activeTab === "clearance-levels" && (
            <div className="animation-fade-in" style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
              <p style={{ fontSize: "16px", color: "var(--text-dim)", lineHeight: "1.8" }}>
                Unlocking permanent clearance levels grants access to advanced briefings, dossier decryption routines, and strategic AI terminal models:
              </p>

              <div className="panel" style={{ padding: "0", background: "#0c0c0c", borderColor: "rgba(255,255,255,0.04)", overflow: "hidden" }}>
                <table className="clearance-table" style={{ width: "100%", borderCollapse: "collapse" }}>
                  <thead>
                    <tr style={{ background: "rgba(255,255,255,0.01)" }}>
                      <th style={{ padding: "16px 20px" }}>CLEARANCE LEVEL</th>
                      <th style={{ padding: "16px 20px" }}>REQUIRED XP</th>
                      <th style={{ padding: "16px 20px" }}>UNLOCKED FUNCTIONALITY</th>
                    </tr>
                  </thead>
                  <tbody>
                    {[
                      { tier: "LEVEL 1: CIVILIAN", xp: "0+ XP", desc: "Access to general system dashboard, public incident tickers, and Sector Alpha outlines." },
                      { tier: "LEVEL 2: OBSERVER", xp: "100+ XP", desc: "Live physical maps, active telemetry sensors, and automated incident feeds enabled." },
                      { tier: "LEVEL 3: OPERATIVE", xp: "200+ XP", desc: "Decryption of Sector Alpha and Beta dossier database files authorized." },
                      { tier: "LEVEL 4: ANALYST", xp: "350+ XP", desc: "Access to advanced strategic briefings and cognitive diagnostic modeling." },
                      { tier: "LEVEL 5: DIRECTOR", xp: "500+ XP", desc: "Full gateway clearances, raw database logs decryption, and cooperative features." }
                    ].map((row, idx) => (
                      <tr key={idx} style={{ borderTop: "1px solid rgba(255,255,255,0.03)" }}>
                        <td style={{ padding: "16px 20px", fontWeight: "bold", color: "var(--accent)", fontFamily: "var(--mono)" }}>{row.tier}</td>
                        <td style={{ padding: "16px 20px", fontFamily: "var(--mono)" }}>{row.xp}</td>
                        <td style={{ padding: "16px 20px", color: "var(--text-dim)", fontSize: "13.5px" }}>{row.desc}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 8. FAQ */}
          {activeTab === "faq" && (
            <div className="animation-fade-in" style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {[
                  {
                    q: "Why does the terminal lock after 4 messages?",
                    a: "Unsigned anonymous sessions expose browser footprints to scraping bots. To maintain OPSEC and secure your progression, RED QUEEN requires a cryptographic wallet signature after 4 messages to calculate a secure profile hash."
                  },
                  {
                    q: "How are my levels and sub-stats saved?",
                    a: "They are serialized as a secure payload and written directly to your profile database record. Only your salted public key hash is stored, ensuring absolute privacy."
                  },
                  {
                    q: "Does my XP decay if I go offline?",
                    a: "No. Experience Points (XP) represent permanent system training and cumulative progress. They never decrease. Only your BIO-SCORE sub-stats are subject to inactivity decay if you do not check in for 24 hours."
                  },
                  {
                    q: "Can I access the RED QUEEN platform on my mobile device?",
                    a: "Yes. The platform is responsive and fully optimized. You can interact with the terminal and check stats using mobile dApp browsers like Phantom or Solflare."
                  },
                  {
                    q: "How can I restore decayed sub-stats?",
                    a: "Simply connect your wallet, enter the terminal, and initiate a diagnostic check-in by chatting with the RED QUEEN AI. This updates your interaction logs and restores active scores."
                  }
                ].map((faq, idx) => (
                  <div key={idx} style={{ background: "#0c0c0c", border: "1px solid rgba(255,255,255,0.03)", padding: "20px 24px", borderRadius: "2px" }}>
                    <h3 style={{ fontSize: "15px", color: "var(--accent)", marginBottom: "8px", fontFamily: "var(--mono)" }}>
                      Q: {faq.q}
                    </h3>
                    <p style={{ fontSize: "14px", color: "var(--text-dim)", lineHeight: "1.7", margin: 0 }}>
                      A: {faq.a}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 9. Map API Configuration */}
          {activeTab === "map-config" && (
            <div className="animation-fade-in" style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
              <p style={{ fontSize: "16px", color: "var(--text-dim)", lineHeight: "1.8" }}>
                The RED QUEEN mapping system is fully decentralized, running on keyless GPU-accelerated MapLibre GL. This eliminates proprietary access tokens, API request caps, and setup requirements. Here is how the tactical feed functions:
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {[
                  {
                    step: "1. OPEN-SOURCE ENGINE",
                    desc: "Leverages MapLibre GL, a high-performance open-source fork of Mapbox GL. It communicates directly with client-side WebGL/WebGPU layers to render maps natively."
                  },
                  {
                    step: "2. KEYLESS VECTOR TILES",
                    desc: "Uses CartoDB's public dark-matter vector tile stylesheets. No developer account creation or authorization headers are necessary to load the global basemap."
                  },
                  {
                    step: "3. ZERO-CONFIGURATION DEPLOYMENTS",
                    desc: "Since the map is keyless, NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN and other external API keys are completely obsolete. Dev nodes and production pipelines compile cleanly out-of-the-box."
                  },
                  {
                    step: "4. LIVE telemetry parsing",
                    desc: "Integrates directly with backend APIs parsing live geological tremors from USGS, environmental anomalies from NASA EONET, and natural disaster alert events from GDACS."
                  }
                ].map((item, idx) => (
                  <div key={idx} style={{ background: "#0c0c0c", border: "1px solid rgba(255,255,255,0.03)", padding: "16px 20px", borderRadius: "2px" }}>
                    <h4 style={{ fontSize: "14px", color: "var(--accent)", margin: "0 0 6px 0", fontFamily: "var(--mono)" }}>{item.step}</h4>
                    <p style={{ fontSize: "13.5px", color: "var(--text-dim)", lineHeight: "1.6", margin: 0 }}>{item.desc}</p>
                  </div>
                ))}
              </div>

              <div className="panel" style={{ background: "#0c0c0c", borderColor: "rgba(0, 255, 204, 0.15)", padding: "24px" }}>
                <h3 style={{ fontSize: "15px", color: "#00ffcc", marginBottom: "8px", fontFamily: "var(--mono)" }}>🛰️ HARDWARE ACCELERATION NOTICE</h3>
                <p style={{ fontSize: "13.5px", color: "var(--text-dim)", lineHeight: "1.7", margin: 0 }}>
                  MapLibre GL requires WebGL context support. If the radar map fails to load, verify that hardware acceleration is enabled in your browser settings and that privacy blockers are not preventing canvas rendering.
                </p>
              </div>
            </div>
          )}

          {/* 10. USDC Paywalls */}
          {activeTab === "usdc-paywalls" && (
            <div className="animation-fade-in" style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
              <p style={{ fontSize: "16px", color: "var(--text-dim)", lineHeight: "1.8" }}>
                RED QUEEN gates its most premium intelligence (detailed AI threat vector briefings, real-time DePIN mesh network sensor data, and secret archives) behind micro-payments. This is powered by <strong>x402</strong>, a standard payment protocol that lets you pay per request using USDC stablecoin on Solana.
              </p>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }} className="responsive-grid-2">
                <div className="panel" style={{ background: "#0c0c0c", borderColor: "rgba(255,255,255,0.04)", padding: "24px" }}>
                  <h3 style={{ fontSize: "15px", color: "#ffffff", marginBottom: "8px" }}>HTTP 402 PAYMENT PROTOCOL</h3>
                  <p style={{ fontSize: "13.5px", color: "var(--text-dim)", lineHeight: "1.6", margin: 0 }}>
                    When you request a premium route (e.g. <code>/api/intel/premium</code>), the server returns an HTTP 402 code with the exact USDC price and recipient wallet. Your wallet builds the transaction, submits it to Solana, and retries the request with a signed proof header to instantly unlock the content.
                  </p>
                </div>

                <div className="panel" style={{ background: "#0c0c0c", borderColor: "rgba(255,255,255,0.04)", padding: "24px" }}>
                  <h3 style={{ fontSize: "15px", color: "#ffffff", marginBottom: "8px" }}>SOLANA MICROTRANSACTIONS</h3>
                  <p style={{ fontSize: "13.5px", color: "var(--text-dim)", lineHeight: "1.6", margin: 0 }}>
                    By using Solana Devnet/Mainnet and USDC, transaction finality takes under 400ms and network gas fees are less than a tenth of a cent. This allows pay-per-use requests (e.g. $0.01 per scan) to bypass expensive monthly subscriptions.
                  </p>
                </div>

                <div className="panel" style={{ background: "#0c0c0c", borderColor: "rgba(255, 77, 77, 0.15)", padding: "24px" }}>
                  <h3 style={{ fontSize: "15px", color: "var(--accent)", marginBottom: "8px" }}>🔄 AUTONOMOUS TOKEN BUYBACKS</h3>
                  <p style={{ fontSize: "13.5px", color: "var(--text-dim)", lineHeight: "1.6", margin: 0 }}>
                    USDC proceeds accumulated from micro-payments go directly into the Red Queen's treasury. When the balance hits a minimum threshold of <strong>10.00 USDC</strong>, she programmatically fires a swap on Jupiter to purchase `$THREAT` tokens, creating a closed-loop agent utility model.
                  </p>
                </div>

                <div className="panel" style={{ background: "#0c0c0c", borderColor: "rgba(0, 255, 204, 0.15)", padding: "24px" }}>
                  <h3 style={{ fontSize: "15px", color: "#00ffcc", marginBottom: "8px", display: "flex", alignItems: "center", gap: "8px" }}>
                    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, filter: "drop-shadow(0 0 3px currentColor)" }}>
                      <rect x="4" y="4" width="16" height="16" rx="2" />
                      <line x1="9" y1="9" x2="9" y2="15" />
                      <line x1="9" y1="15" x2="15" y2="15" />
                      <line x1="15" y1="15" x2="15" y2="9" />
                      <line x1="15" y1="9" x2="9" y2="9" />
                      <line x1="9" y1="1" x2="9" y2="4" />
                      <line x1="15" y1="1" x2="15" y2="4" />
                      <line x1="9" y1="20" x2="9" y2="23" />
                      <line x1="15" y1="20" x2="15" y2="23" />
                      <line x1="20" y1="9" x2="23" y2="9" />
                      <line x1="20" y1="15" x2="23" y2="15" />
                      <line x1="1" y1="9" x2="4" y2="9" />
                      <line x1="1" y1="15" x2="4" y2="15" />
                    </svg>
                    <span>NEXT STAGE: COGNITIVE SCALING</span>
                  </h3>
                  <p style={{ fontSize: "13.5px", color: "var(--text-dim)", lineHeight: "1.6", margin: 0 }}>
                    Accumulated revenues are utilized to secure advanced storage nodes, lease higher compute capacity, and acquire extensive telemetry databases. This enables the Red Queen to ingest larger intelligence feeds, write sharper analysis, and raise her overall Solvival Intelligence score.
                  </p>
                </div>
              </div>

              <div className="panel" style={{ background: "#0c0c0c", borderColor: "rgba(255, 0, 51, 0.15)", padding: "24px" }}>
                <h3 style={{ fontSize: "15px", color: "var(--accent)", marginBottom: "8px", fontFamily: "var(--mono)", display: "flex", alignItems: "center", gap: "8px" }}>
                  <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, filter: "drop-shadow(0 0 3px currentColor)" }}>
                    <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                    <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                  </svg>
                  <span>PREMIUM CHANNELS ACTIVE</span>
                </h3>
                <ul style={{ margin: "6px 0 0 0", paddingLeft: "20px", color: "var(--text-dim)", fontSize: "13.5px", lineHeight: "1.7" }}>
                  <li><strong>Premium AI Dossier (<code>/api/intel/premium</code>):</strong> Gated behind a <strong>$0.01 USDC</strong> payment.</li>
                  <li><strong>Live DePIN Diagnostics (<code>/api/intel/depin</code>):</strong> Gated behind a <strong>$0.02 USDC</strong> payment.</li>
                </ul>
              </div>
            </div>
          )}

          {/* 11. Roadmap */}
          {activeTab === "roadmap" && (
            <div className="animation-fade-in" style={{ display: "flex", flexDirection: "column", gap: "40px" }}>
              
              <div className="panel" style={{ background: "rgba(255, 77, 77, 0.03)", borderColor: "rgba(255, 77, 77, 0.25)", padding: "32px" }}>
                <h3 style={{ fontSize: "18px", color: "var(--accent)", marginBottom: "12px", fontFamily: "var(--mono)", fontWeight: "bold" }}>📋 PROTOCOL DEVELOPMENT NOTICE</h3>
                <p style={{ fontSize: "16px", color: "var(--text-dim)", lineHeight: "1.8", margin: 0 }}>
                  This roadmap is a living document representing the planned direction of the Red Queen Surveillance Ecosystem on Solana. As the protocol grows, details are subject to adjustment. I am actively open to community feedback and suggestions to shape this survival plan.
                </p>
              </div>

              {/* Core vision */}
              <div>
                <h3 style={{ fontSize: "22px", color: "#fff", marginBottom: "16px", fontFamily: "var(--title-font)", letterSpacing: "0.05em" }}>THE RED QUEEN VISION</h3>
                <p style={{ fontSize: "16px", color: "var(--text-dim)", lineHeight: "1.8", margin: 0 }}>
                  The goal is to build a complete, decentralized Surveillance Ecosystem and Intelligence Survival Terminal on Solana. Red Queen is a central AI mainframe aggregating real-time threat telemetry, tracking player clearance levels via their survival performance, and operating as an autonomous, self-funding economic agent.
                </p>
              </div>

              {/* Part 1: Current State */}
              <div>
                <h3 style={{ fontSize: "24px", color: "#fff", marginBottom: "24px", fontFamily: "var(--title-font)", letterSpacing: "0.05em", borderBottom: "2px solid rgba(255,255,255,0.08)", paddingBottom: "12px" }}>PART 1: ACTIVE SYSTEMS & LIVE BUILD</h3>
                
                <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                  
                  <div className="panel" style={{ background: "#0c0c0c", padding: "32px", borderColor: "rgba(255,255,255,0.03)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "10px", marginBottom: "12px" }}>
                      <h4 style={{ fontSize: "16px", color: "#fff", margin: 0, fontFamily: "var(--mono)", fontWeight: "bold" }}>1. THE MAIN TERMINAL CONSOLE</h4>
                      <span style={{ fontSize: "10px", fontFamily: "var(--mono)", color: "#00ffcc" }}>ROUTE: /terminal</span>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "15px", color: "var(--text-dim)", lineHeight: "1.6", marginBottom: "16px" }}>
                      <p><strong>WHAT IT IS //</strong> The central communication interface and digital entry point.</p>
                      <p><strong>HOW IT WORKS //</strong> The primary screen where SOLvivors chat and interact directly with the Red Queen AI to query system statuses, run diagnostic checks, and access database records.</p>
                    </div>
                    <Link href="/terminal" style={{ fontSize: "12px", color: "#00e5ff", textDecoration: "underline", fontFamily: "var(--mono)", fontWeight: "bold" }}>Access Console [/terminal] &rarr;</Link>
                  </div>

                  <div className="panel" style={{ background: "#0c0c0c", padding: "32px", borderColor: "rgba(255,255,255,0.03)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "10px", marginBottom: "12px" }}>
                      <h4 style={{ fontSize: "16px", color: "#fff", margin: 0, fontFamily: "var(--mono)", fontWeight: "bold" }}>2. THE LIVE THREATS DASHBOARD</h4>
                      <span style={{ fontSize: "10px", fontFamily: "var(--mono)", color: "#00ffcc" }}>ROUTE: /</span>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "15px", color: "var(--text-dim)", lineHeight: "1.6", marginBottom: "16px" }}>
                      <p><strong>WHAT IT IS //</strong> The real-world telemetry monitoring interface on the homepage.</p>
                      <p><strong>HOW IT WORKS //</strong> A live terminal feed rendering the Threat of the Day, global containment criticality indices, and active environmental warning alerts.</p>
                    </div>
                    <Link href="/" style={{ fontSize: "12px", color: "#00e5ff", textDecoration: "underline", fontFamily: "var(--mono)", fontWeight: "bold" }}>Access Dashboard [/] &rarr;</Link>
                  </div>

                  <div className="panel" style={{ background: "#0c0c0c", padding: "32px", borderColor: "rgba(255,255,255,0.03)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "10px", marginBottom: "12px" }}>
                      <h4 style={{ fontSize: "16px", color: "#fff", margin: 0, fontFamily: "var(--mono)", fontWeight: "bold" }}>3. THE ALL-THREATS DATABASE</h4>
                      <span style={{ fontSize: "10px", fontFamily: "var(--mono)", color: "#00ffcc" }}>ROUTE: /threat-vector</span>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "15px", color: "var(--text-dim)", lineHeight: "1.6", marginBottom: "16px" }}>
                      <p><strong>WHAT IT IS //</strong> The complete archive of active and historical threat vectors tracked by the mainframe's sensors.</p>
                      <p><strong>HOW IT WORKS //</strong> SOLvivors can browse through all threat vectors cataloged by the mainframe's sensors, filtering by hazard sector, checking historical incident alerts, and accessing detailed dossiers for each threat index.</p>
                    </div>
                    <Link href="/threat-vector" style={{ fontSize: "12px", color: "#00e5ff", textDecoration: "underline", fontFamily: "var(--mono)", fontWeight: "bold" }}>Access Vectors [/threat-vector] &rarr;</Link>
                  </div>

                  <div className="panel" style={{ background: "#0c0c0c", padding: "32px", borderColor: "rgba(255,255,255,0.03)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "10px", marginBottom: "12px" }}>
                      <h4 style={{ fontSize: "16px", color: "#fff", margin: 0, fontFamily: "var(--mono)", fontWeight: "bold" }}>4. THE SOLVIVOR PROFILE DASHBOARD</h4>
                      <span style={{ fontSize: "10px", fontFamily: "var(--mono)", color: "#00ffcc" }}>ROUTE: /operative</span>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "15px", color: "var(--text-dim)", lineHeight: "1.6", marginBottom: "16px" }}>
                      <p><strong>WHAT IT IS //</strong> Your personal mainframe command center.</p>
                      <p><strong>HOW IT WORKS //</strong> You can create your profile using either a standard email login or a Solana wallet. The system initializes your profile, tracks your total XP, calculates your level, and displays your active survival stats (Technical Preparedness, Surveillance Resistance, Physical Fortitude), as well as your active tasks and bounties progress.</p>
                      <p><strong>YOUR STATS //</strong> Every action you take improves your technical preparedness, surveillance resistance, and physical fortitude.</p>
                      <p style={{ fontStyle: "italic" }}><strong>UX DIRECTION //</strong> I will continue making layout improvements to the user profile dashboard to enhance the telemetry visualization and interactivity.</p>
                    </div>
                    <Link href="/operative" style={{ fontSize: "12px", color: "#00e5ff", textDecoration: "underline", fontFamily: "var(--mono)", fontWeight: "bold" }}>Access Profile [/operative] &rarr;</Link>
                  </div>

                  <div className="panel" style={{ background: "#0c0c0c", padding: "32px", borderColor: "rgba(255,255,255,0.03)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "10px", marginBottom: "12px" }}>
                      <h4 style={{ fontSize: "16px", color: "#fff", margin: 0, fontFamily: "var(--mono)", fontWeight: "bold" }}>5. THE SOLVIVORS HUB</h4>
                      <span style={{ fontSize: "10px", fontFamily: "var(--mono)", color: "#00ffcc" }}>ROUTE: /solvivors</span>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "15px", color: "var(--text-dim)", lineHeight: "1.6", marginBottom: "16px" }}>
                      <p><strong>WHAT IT IS //</strong> The community mission and media dashboard.</p>
                      <p><strong>HOW IT WORKS //</strong> The hub dashboard contains one active section and three locked sectors scheduled to open soon:</p>
                      <ul style={{ paddingLeft: "24px", display: "flex", flexDirection: "column", gap: "4px" }}>
                        <li><strong>Operations (LIVE Now):</strong> Access active tasks and bounties to submit proofs and earn rewards.</li>
                        <li><strong>Broadcasts (Opening Soon):</strong> Real-time tactical transmissions and news feeds.</li>
                        <li><strong>Lore (Opening Soon):</strong> Survivor diaries and system archives explaining the collapse.</li>
                        <li><strong>Comics (Opening Soon):</strong> Graphic archives and media files detailing the story.</li>
                      </ul>
                    </div>
                    <Link href="/solvivors" style={{ fontSize: "12px", color: "#00e5ff", textDecoration: "underline", fontFamily: "var(--mono)", fontWeight: "bold" }}>Access Hub [/solvivors] &rarr;</Link>
                  </div>

                  <div className="panel" style={{ background: "#0c0c0c", padding: "32px", borderColor: "rgba(255,255,255,0.03)" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "10px", marginBottom: "12px" }}>
                      <h4 style={{ fontSize: "16px", color: "#fff", margin: 0, fontFamily: "var(--mono)", fontWeight: "bold" }}>6. pay.sh & x402 TELEMETRY GATEWAY</h4>
                      <span style={{ fontSize: "10px", fontFamily: "var(--mono)", color: "#00ffcc" }}>GATEWAY ACTIVE</span>
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px", fontSize: "15px", color: "var(--text-dim)", lineHeight: "1.6" }}>
                      <p><strong>WHAT IT IS //</strong> A pay-per-use payment system built directly into the API endpoints using the pay.sh specifications and x402 protocol standards.</p>
                      <p><strong>HOW IT WORKS //</strong> Premium briefs are protected by x402 paywalls. SOLvivors pay a tiny micro-fee (0.01 or 0.02 USDC) directly from their wallets. The decryption settles in under 400 milliseconds.</p>
                      <div style={{ border: "1px dashed rgba(0, 255, 204, 0.15)", padding: "14px", background: "rgba(0,255,204,0.01)", margin: "8px 0" }}>
                        <strong style={{ color: "#00ffcc", fontSize: "11px", fontFamily: "var(--mono)", display: "block", marginBottom: "4px" }}>LIVE FEEDS AVAILABLE NOW:</strong>
                        <ul style={{ paddingLeft: "16px", display: "flex", flexDirection: "column", gap: "4px", fontSize: "13.5px" }}>
                          <li><strong>Premium Intel Endpoint (<code>/api/intel/premium</code>):</strong> USGS earthquakes, NASA hazard maps, pathogen metrics (0.01 USDC).</li>
                          <li><strong>Solana Telemetry Endpoint (<code>/api/intel/depin</code>):</strong> Solana blocks, priority fees, validator node statuses (0.02 USDC).</li>
                        </ul>
                      </div>
                      <p><strong>THE TREASURY LOOP //</strong> 100% of the USDC collected from these paywalls goes to the Red Queen Treasury. Once the treasury hits 10 USDC, the backend autonomously swaps the USDC on Jupiter to buy back and lock the native <strong>$THREAT</strong> token.</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Part 2: Future Roadmap */}
              <div>
                <h3 style={{ fontSize: "24px", color: "#fff", marginBottom: "24px", fontFamily: "var(--title-font)", letterSpacing: "0.05em", borderBottom: "2px solid rgba(255,255,255,0.08)", paddingBottom: "12px" }}>PART 2: THE FUTURE ROADMAP (WHAT IS COMING NEXT)</h3>
                
                <p style={{ fontSize: "16px", color: "var(--text-dim)", marginBottom: "24px" }}>
                  The goal is to evolve the Red Queen from a telemetry tool into a living, AI-controlled apocalypse simulation where the world itself is the main character.
                </p>

                <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                  
                  <div className="panel" style={{ background: "#0a0a0a", borderColor: "rgba(255,255,255,0.05)", padding: "32px" }}>
                    <span style={{ fontSize: "11px", color: "var(--accent)", fontFamily: "var(--mono)", display: "block", marginBottom: "6px" }}>STEP 01 // MAIN ENGINE</span>
                    <h4 style={{ fontSize: "16px", color: "#fff", margin: "0 0 10px 0", fontFamily: "var(--sans)" }}>Dynamic Daily Threat Forecasts</h4>
                    <p style={{ fontSize: "15px", color: "var(--text-dim)", lineHeight: "1.6", margin: 0 }}>
                      <strong>THE GOAL //</strong> Make the daily threat briefings on the homepage dynamically generated by AI.<br />
                      <strong>HOW IT WORKS //</strong> The Red Queen AI will automatically scan real-world datasets (like global USGS earthquake feeds and NASA weather hazards) and compile a custom, lore-rich apocalypse report every single day.
                    </p>
                  </div>

                  <div className="panel" style={{ background: "#0a0a0a", borderColor: "rgba(255,255,255,0.05)", padding: "32px" }}>
                    <span style={{ fontSize: "11px", color: "var(--accent)", fontFamily: "var(--mono)", display: "block", marginBottom: "6px" }}>STEP 02 // COMPETITION</span>
                    <h4 style={{ fontSize: "16px", color: "#fff", margin: "0 0 10px 0", fontFamily: "var(--sans)" }}>The SOLvivor Leaderboard & SOLvive Seasons</h4>
                    <p style={{ fontSize: "15px", color: "var(--text-dim)", lineHeight: "1.6", margin: 0 }}>
                      <strong>THE GOAL //</strong> Create a competitive tracking system and define targets for your BIO-SCORE.<br />
                      <strong>HOW IT WORKS //</strong> A public Leaderboard page will be deployed displaying all SOLvivors sorted by level, total XP, and completed quests. I plan to introduce competitive <strong>SOLvive Seasons with rewards</strong> distributed to the highest-ranking survivors. Your level and BIO-SCORE will unlock narrative ranks (from Candidate to Specialist, all the way to elite <strong>SOLvivor</strong> status), giving you access to exclusive terminal themes, restricted archives, and higher-paying missions.
                    </p>
                  </div>

                  <div className="panel" style={{ background: "#0a0a0a", borderColor: "rgba(255,255,255,0.05)", padding: "32px" }}>
                    <span style={{ fontSize: "11px", color: "var(--accent)", fontFamily: "var(--mono)", display: "block", marginBottom: "6px" }}>STEP 03 // UX POLISH</span>
                    <h4 style={{ fontSize: "16px", color: "#fff", margin: "0 0 10px 0", fontFamily: "var(--sans)" }}>Immersive UI & UX Upgrades</h4>
                    <p style={{ fontSize: "15px", color: "var(--text-dim)", lineHeight: "1.6", margin: 0 }}>
                      <strong>THE GOAL //</strong> Build a highly interactive terminal console.<br />
                      <strong>HOW IT WORKS //</strong> I will continue polishing the interface, adding more interactive elements, terminal-style transitions, and visual detailing that aligns closely with the core lore.
                    </p>
                  </div>

                  <div className="panel" style={{ background: "#0a0a0a", borderColor: "rgba(255,255,255,0.05)", padding: "32px" }}>
                    <span style={{ fontSize: "11px", color: "var(--accent)", fontFamily: "var(--mono)", display: "block", marginBottom: "6px" }}>STEP 04 // MOBILE</span>
                    <h4 style={{ fontSize: "16px", color: "#fff", margin: "0 0 10px 0", fontFamily: "var(--sans)" }}>Solana Seeker Phone Mobile Optimization</h4>
                    <p style={{ fontSize: "15px", color: "var(--text-dim)", lineHeight: "1.6", margin: 0 }}>
                      <strong>THE GOAL //</strong> Optimized mobile experience for handheld terminal operations.<br />
                      <strong>HOW IT WORKS //</strong> An improved mobile version tailored specifically for the Solana Seeker Phone will be released. This version will offer additional bonuses and exclusive clearance rewards for Seeker users.
                    </p>
                  </div>

                  <div className="panel" style={{ background: "#0a0a0a", borderColor: "rgba(255,255,255,0.05)", padding: "32px" }}>
                    <span style={{ fontSize: "11px", color: "var(--accent)", fontFamily: "var(--mono)", display: "block", marginBottom: "6px" }}>STEP 05 // CONNECTIONS</span>
                    <h4 style={{ fontSize: "16px", color: "#fff", margin: "0 0 10px 0", fontFamily: "var(--sans)" }}>pay.sh Directory & Agent-to-Agent Accessibility</h4>
                    <p style={{ fontSize: "15px", color: "var(--text-dim)", lineHeight: "1.6", margin: 0 }}>
                      <strong>THE GOAL //</strong> Open the Red Queen data feeds to the broader Solana developer ecosystem and AI agents.<br />
                      <strong>HOW IT WORKS //</strong> By registering our endpoints in the official pay.sh directory, Red Queen's specialized threat intelligence becomes discoverable to the entire developer community. External autonomous AI agents will be able to query terminal APIs directly, paying in USDC to receive our specialized DePIN and environment data.<br />
                      <strong>MCP SERVER //</strong> I will build a native Model Context Protocol (MCP) server for Red Queen, allowing external AI agents (such as custom LLMs and developer copilots) to connect to the mainframe directly as a specialized tool to receive threat data.
                    </p>
                  </div>

                  <div className="panel" style={{ background: "#0a0a0a", borderColor: "rgba(255,255,255,0.05)", padding: "32px" }}>
                    <span style={{ fontSize: "11px", color: "var(--accent)", fontFamily: "var(--mono)", display: "block", marginBottom: "6px" }}>STEP 06 // B2B TELEMETRY</span>
                    <h4 style={{ fontSize: "16px", color: "#fff", margin: "0 0 10px 0", fontFamily: "var(--sans)" }}>Expanding Telemetry via x402 Payments</h4>
                    <p style={{ fontSize: "15px", color: "var(--text-dim)", lineHeight: "1.6", margin: 0 }}>
                      <strong>THE GOAL //</strong> Increase the data depth of the Red Queen mainframe.<br />
                      <strong>HOW IT WORKS //</strong> The Red Queen agent will autonomously query more external paid developer APIs using stablecoin micropayments, expanding the central database with fresh feeds from other platforms.
                    </p>
                  </div>

                  <div className="panel" style={{ background: "#0a0a0a", borderColor: "rgba(255, 77, 77, 0.2)", padding: "32px" }}>
                    <span style={{ fontSize: "11px", color: "var(--accent)", fontFamily: "var(--mono)", display: "block", marginBottom: "6px" }}>STEP 07 // SIMULATION OVERLAY</span>
                    <h4 style={{ fontSize: "18px", color: "#fff", margin: "0 0 12px 0", fontFamily: "var(--sans)", fontWeight: "bold" }}>The Red Queen Apocalypse Simulation & Items Marketplace</h4>
                    
                    <div style={{ display: "flex", flexDirection: "column", gap: "16px", fontSize: "15px", color: "var(--text-dim)", lineHeight: "1.7" }}>
                      <p>
                        <strong>THE GOAL //</strong> A living simulation and marketplace where survival meets strategy.
                      </p>
                      <p>
                        This is the core gameplay integration where players survive inside a persistent, AI-governed virtual world. Rather than a traditional survival MMO, strategy game, or clicker, this is a living, AI-controlled apocalypse simulation where players become operatives trying to survive a constantly evolving world.
                      </p>

                      <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "14px" }}>
                        <strong style={{ color: "#fff", display: "block", marginBottom: "6px" }}>The World Layer</strong>
                        <p>
                          Players join a faction (Nomads, Scientists, Marauders, Governments, Engineers, Hackers, or Bunker Syndicates) to react to daily global events (e.g. H5N1 outbreak). Every action contributes to a global outcome, shifting region safety and sector control map values.
                        </p>
                      </div>

                      <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "14px" }}>
                        <strong style={{ color: "#fff", display: "block", marginBottom: "6px" }}>The Survival Layer & cNFT Cards</strong>
                        <p>
                          BIO-SCORE tracks permanent survival reputation. Elite ranks achieve SOLvivor status. Characters will be represented on-chain by **Solana Compressed NFTs (cNFTs)**, with the Red Queen AI autonomously assigning profiles matching player history.
                        </p>
                      </div>

                      <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "14px" }}>
                        <strong style={{ color: "#fff", display: "block", marginBottom: "6px" }}>Tactical PvP Combat</strong>
                        <p>
                          A tactical prediction game targeting specific limbs (Head, Torso, Arms, Legs) with associated strategic handicaps (like damage reduction or mobility loss) and faction-specific abilities.
                        </p>
                      </div>

                      <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "14px" }}>
                        <strong style={{ color: "#fff", display: "block", marginBottom: "6px" }}>Items Marketplace & Revenue Sharing</strong>
                        <p>
                          Trade survival gear, resources, and blueprints. Marketplace fee cuts are shared back: a portion is routed to `$THREAT` holders as yields, and another portion is used by the Red Queen agent for buybacks.
                        </p>
                      </div>

                      <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "14px" }}>
                        <strong style={{ color: "#fff", display: "block", marginBottom: "6px" }}>The AI Game Master</strong>
                        <p>
                          Red Queen commentates battles, broadcasts global warnings, launches faction missions, and dynamically adapts the world map sectors.
                        </p>
                      </div>
                    </div>
                  </div>

                  <div className="panel" style={{ background: "#0a0a0a", borderColor: "rgba(255,255,255,0.05)", padding: "32px" }}>
                    <span style={{ fontSize: "11px", color: "var(--accent)", fontFamily: "var(--mono)", display: "block", marginBottom: "6px" }}>STEP 08 // AUTOMATION</span>
                    <h4 style={{ fontSize: "16px", color: "#fff", margin: "0 0 10px 0", fontFamily: "var(--sans)" }}>Agent Upgrades & Autonomous Bots</h4>
                    <p style={{ fontSize: "15px", color: "var(--text-dim)", lineHeight: "1.6", margin: 0 }}>
                      <strong>THE GOAL //</strong> Automated rewards, background notifications, and user-launched agents.<br />
                      <strong>HOW IT WORKS //</strong> Upgrading the agent core to run continuous loops, post automated briefings, reply to community posts, and handle payouts. This will also introduce the ability for SOLvivors to stake <strong>$THREAT</strong> to deploy Sentry Bots (sub-agents) in the mainframe to run background data tasks and earn passive yields.
                    </p>
                  </div>
                </div>
              </div>

              {/* Factions */}
              <div className="panel" style={{ background: "#0c0c0c", padding: "32px", borderColor: "rgba(255,255,255,0.03)" }}>
                <h3 style={{ fontSize: "18px", color: "#ffffff", marginBottom: "16px", fontFamily: "var(--mono)", fontWeight: "bold" }}>Role of the $THREAT Token in the Ecosystem</h3>
                <p style={{ fontSize: "16px", color: "var(--text-dim)", lineHeight: "1.8", marginBottom: "16px" }}>
                  To ensure <strong>$THREAT</strong> serves as utility infrastructure in this survival ecosystem rather than a speculative asset, the following mechanics are planned for integration:
                </p>
                <ul style={{ margin: 0, paddingLeft: "20px", color: "var(--text-dim)", fontSize: "15.5px", lineHeight: "1.8", display: "flex", flexDirection: "column", gap: "8px" }}>
                  <li><strong>Bunker Shielding:</strong> Secure your accumulated items, equipment, and resources from Marauder raids. Staking <strong>$THREAT</strong> acts as an on-chain defensive shield. The higher your stake, the stronger your bunker defense factor, preventing other players from siphoning or stealing your inventory.</li>
                  <li><strong>Daily Play Energy:</strong> Staking or spending <strong>$THREAT</strong> grants you additional attempts or energy charges per day to run simulation actions and participate in PvP battles, allowing you to win more token rewards.</li>
                  <li><strong>Revives:</strong> If your SOLvivor is defeated in the PvP sector, pay <strong>$THREAT</strong> to execute a clones-restore.</li>
                  <li><strong>Factions Progression:</strong> Spend <strong>$THREAT</strong> to purchase advanced research files, equipment blueprints, and clearance cards.</li>
                  <li><strong>Marketplace Yields:</strong> Hold <strong>$THREAT</strong> to receive your share of revenue generated by transaction fees on the items marketplace.</li>
                  <li><strong>Own Your Survival Legacy:</strong> Your BIO-SCORE and clearance levels are permanent records of your achievements and decisions.</li>
                </ul>
              </div>

            </div>
          )}


        </main>
      </div>

      {/* Styled JSX for fade animation */}
      <style jsx>{`
        .animation-fade-in {
          animation: page-fade 0.35s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
        @keyframes page-fade {
          from { opacity: 0; transform: translateY(6px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
