"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
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
    { id: "clearance-portal", label: "🔒 ACCESS PORTAL", title: "GO TO CLEARANCE PORTAL", isRedirect: true, href: "/network-clearance" }
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
                {t.label}
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
                {t.title}
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
                <h3 style={{ fontSize: "15px", color: "#ffffff", marginBottom: "8px", fontFamily: "var(--mono)" }}>🔒 ANONYMOUS SESSION BLOCKOUT</h3>
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
                Connecting the Mapbox API enables full geographic tracking and high-fidelity rendering of active global threat vectors. Follow these instructions to authenticate and deploy the live tactical map:
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {[
                  {
                    step: "1. CREATE MAPBOX ACCOUNT",
                    desc: "Visit Mapbox (mapbox.com) and register for a developer account. The base tier is free and offers generous monthly tile loading allowances."
                  },
                  {
                    step: "2. OBTAIN PUBLIC ACCESS TOKEN",
                    desc: "Navigate to your Account Dashboard and copy the default public access token. Public tokens always start with the prefix 'pk.eyJ...'."
                  },
                  {
                    step: "3. ROOT ENVIRONMENT CONFIGURATION",
                    desc: "Create or open a '.env.local' file in the root directory of your project. Inject your token using the public client prefix: NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN=pk.your_token_here"
                  },
                  {
                    step: "4. VERCEL DEPLOYMENT CONFIGURATION",
                    desc: "When deploying to Vercel, navigate to Project Settings > Environment Variables. Add the key 'NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN' with your copied token as the value, then trigger a redeploy to inject the environment build variable."
                  }
                ].map((item, idx) => (
                  <div key={idx} style={{ background: "#0c0c0c", border: "1px solid rgba(255,255,255,0.03)", padding: "16px 20px", borderRadius: "2px" }}>
                    <h4 style={{ fontSize: "14px", color: "var(--accent)", margin: "0 0 6px 0", fontFamily: "var(--mono)" }}>{item.step}</h4>
                    <p style={{ fontSize: "13.5px", color: "var(--text-dim)", lineHeight: "1.6", margin: 0 }}>{item.desc}</p>
                  </div>
                ))}
              </div>

              <div className="panel" style={{ background: "#0c0c0c", borderColor: "rgba(0, 255, 204, 0.15)", padding: "24px" }}>
                <h3 style={{ fontSize: "15px", color: "#00ffcc", marginBottom: "8px", fontFamily: "var(--mono)" }}>🛰️ AUTOMATED GRID FALLBACK</h3>
                <p style={{ fontSize: "13.5px", color: "var(--text-dim)", lineHeight: "1.7", margin: 0 }}>
                  If the <code>NEXT_PUBLIC_MAPBOX_ACCESS_TOKEN</code> environment variable is missing, the RED QUEEN will automatically fallback to a low-fidelity local terminal matrix simulator, preserving the tactical interface styling while logging diagnostic warning events in the console.
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
                  <h3 style={{ fontSize: "15px", color: "#00ffcc", marginBottom: "8px" }}>🧠 NEXT STAGE: COGNITIVE SCALING</h3>
                  <p style={{ fontSize: "13.5px", color: "var(--text-dim)", lineHeight: "1.6", margin: 0 }}>
                    Accumulated revenues are utilized to secure advanced storage nodes, lease higher compute capacity, and acquire extensive telemetry databases. This enables the Red Queen to ingest larger intelligence feeds, write sharper analysis, and raise her overall Solvival Intelligence score.
                  </p>
                </div>
              </div>

              <div className="panel" style={{ background: "#0c0c0c", borderColor: "rgba(255, 0, 51, 0.15)", padding: "24px" }}>
                <h3 style={{ fontSize: "15px", color: "var(--accent)", marginBottom: "8px", fontFamily: "var(--mono)" }}>🔒 PREMIUM CHANNELS ACTIVE</h3>
                <ul style={{ margin: "6px 0 0 0", paddingLeft: "20px", color: "var(--text-dim)", fontSize: "13.5px", lineHeight: "1.7" }}>
                  <li><strong>Premium AI Dossier (<code>/api/intel/premium</code>):</strong> Gated behind a <strong>$0.01 USDC</strong> payment.</li>
                  <li><strong>Live DePIN Diagnostics (<code>/api/intel/depin</code>):</strong> Gated behind a <strong>$0.02 USDC</strong> payment.</li>
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
