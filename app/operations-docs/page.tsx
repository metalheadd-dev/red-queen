"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import SolvivalIcon from "@/components/SolvivalIcon";

export default function OperationsDocsPage() {
  const router = useRouter();
  const [activeTab, setActiveTab] = useState("overview");

  const tabs = [
    { id: "overview", label: "01. OVERVIEW", title: "LORE & STRATEGIC OVERVIEW" },
    { id: "factions-classes", label: "02. SPECIALIZATIONS", title: "FACTIONS, CLASSES & ROLES" },
    { id: "metrics", label: "03. CORE METRICS", title: "SYSTEM METRICS, STATS & CURRENCIES" },
    { id: "decks", label: "04. COMMAND DECKS", title: "UI WALKTHROUGH & INTERFACES" },
    { id: "blueprints", label: "05. ITEMS & SCHEMATICS", title: "RESOURCES, GEAR & BLUEPRINTS" },
    { id: "threat-utility", label: "06. $THREAT UTILITY", title: "$THREAT HOLDER UTILITY & LIMITS" },
    { id: "operational-intelligence", label: "07. RED QUEEN AI", title: "RED QUEEN AI & OPERATIONAL INTELLIGENCE" },
    { id: "clearance-portal", label: "PLAY OPERATIONS", title: "GO TO OPERATIONS SIMULATOR", isRedirect: true, href: "/operations" }
  ];

  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", paddingTop: "60px", background: "#050505" }}>
      {/* Header Banner */}
      <div style={{ borderBottom: "1px solid var(--border)", padding: "48px 24px", background: "var(--surface)" }}>
        <div className="container">
          <div className="tag tag-red" style={{ marginBottom: "16px" }}>OPERATIVE MANUAL // SIMULATOR DOCUMENTATION</div>
          <h1 style={{ fontSize: "clamp(28px, 5vw, 44px)", marginBottom: "12px", letterSpacing: "0.05em", color: "#ffffff" }}>
            OPERATIONS <span style={{ color: "var(--accent)" }}>DOCS</span>
          </h1>
          <p style={{ fontSize: "14px", color: "var(--text-dim)", lineHeight: "1.6", maxWidth: "700px" }}>
            The official user guide, technical manual, and tactical schematics database for Red Queen: Operations.
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
                {t.id === "clearance-portal" ? "🎮 " + t.title : t.title}
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
                  CHAPTER 0{tabs.indexOf(t) + 1} // OPERATIONAL PROTOCOL
                </span>
                <h2 style={{ fontSize: "28px", color: "#ffffff", margin: 0, letterSpacing: "0.03em" }}>
                  {t.title}
                </h2>
              </div>
            );
          })}

          {/* 1. Overview */}
          {activeTab === "overview" && (
            <div className="animation-fade-in" style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
              <p style={{ fontSize: "16px", color: "var(--text-dim)", lineHeight: "1.8" }}>
                In a post-collapse future, humanity’s survival is threatened by regional epidemics, gravity anomalies, radiation storms, and rogue automated scanners.
              </p>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }} className="responsive-grid-2">
                <div className="panel" style={{ background: "#0c0c0c", borderColor: "rgba(255,255,255,0.04)", padding: "28px" }}>
                  <h3 style={{ fontSize: "16px", color: "var(--accent)", marginBottom: "12px", fontFamily: "var(--mono)" }}>THE NARRATIVE SETUP</h3>
                  <p style={{ fontSize: "14px", color: "var(--text-dim)", lineHeight: "1.7", margin: 0 }}>
                    The Red Queen AI is the central autonomous intelligence tasked with coordinating human preservation. Survivors who connect to her command network are designated as SOLvivors. In this world, digital sovereignty is the primary line of defense. Public transaction records, metadata trails, and unencrypted hardware signals are tactical weaknesses that can be tracked by adversarial scanner swarms.
                  </p>
                </div>
                <div className="panel" style={{ background: "#0c0c0c", borderColor: "rgba(255,255,255,0.04)", padding: "28px" }}>
                  <h3 style={{ fontSize: "16px", color: "var(--accent)", marginBottom: "12px", fontFamily: "var(--mono)" }}>THE SOLVIVOR MISSION</h3>
                  <p style={{ fontSize: "14px", color: "var(--text-dim)", lineHeight: "1.7", margin: 0 }}>
                    To survive, SOLvivors must secure their connection signatures, manage resource caches, and complete tactical sweeps inside contaminated sectors to stabilize localized grid networks and advance human survival.
                  </p>
                </div>
              </div>

              <div className="panel" style={{ background: "#0c0c0c", borderColor: "rgba(255,255,255,0.04)", padding: "28px" }}>
                <h3 style={{ fontSize: "16px", color: "#ffffff", marginBottom: "16px", fontFamily: "var(--mono)" }}>🎮 OPERATIVE OBJECTIVES</h3>
                <ol style={{ paddingLeft: "20px", color: "var(--text-dim)", fontSize: "14px", display: "flex", flexDirection: "column", gap: "10px", lineHeight: "1.6" }}>
                  <li><strong>Authenticate:</strong> Connect your account securely via wallet or email.</li>
                  <li><strong>Train & Align:</strong> Choose a specialization (Class/Role) and align with a Faction.</li>
                  <li><strong>Explore:</strong> Scan the satellite grid map and unlock hostile sectors.</li>
                  <li><strong>Deploy:</strong> Run simulated mission scenarios, making critical decisions.</li>
                  <li><strong>Synthesize:</strong> Scavenge materials to craft tools, weapons, and medical units.</li>
                  <li><strong>Progress:</strong> Level up, boost your Bio-Score, and climb the leaderboard.</li>
                </ol>
              </div>
            </div>
          )}

          {/* 2. Factions & Classes */}
          {activeTab === "factions-classes" && (
            <div className="animation-fade-in" style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
              <p style={{ fontSize: "16px", color: "var(--text-dim)", lineHeight: "1.8" }}>
                During onboarding, you must customize your profile. Your choices determine your starting equipment, scenario options, and specialized abilities.
              </p>

              <div>
                <h3 style={{ fontSize: "18px", color: "#ffffff", marginBottom: "16px", fontFamily: "var(--mono)" }}>THE EIGHT FACTION DIVISIONS</h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  {[
                    { name: "Vanguard (Red)", desc: "Forward scouting and rapid threat containment.", id: "Active neutralization of emerging threats." },
                    { name: "Eclipse (Purple)", desc: "Shadow recon and sub-quantum stealth.", id: "Strike with precision from the shadows." },
                    { name: "Helix (Cyan)", desc: "Biological adaptation and genetic engineering.", id: "Humanity must evolve biologically to survive." },
                    { name: "Nomads (Yellow)", desc: "Mobile routers and decentralized node grids.", id: "Distributed networks prevent total collapse." },
                    { name: "Citadel (Blue)", desc: "Defensive sanctuary bunkers and shielding.", id: "Fortify the nodes, protect the civilian pods." },
                    { name: "Ghost Division (Rose)", desc: "Cyber counters and registry obfuscation.", id: "Erase all digital traces to stay hidden." },
                    { name: "Aegis (Light Blue)", desc: "Defensive firewalls and perimeter shield grids.", id: "Defense is our primary weapon." },
                    { name: "Horizon (Green)", desc: "Long-range sensor telemetry and prediction arrays.", id: "Forecast anomalies long before they strike." }
                  ].map((f, idx) => (
                    <div key={idx} style={{ background: "#0c0c0c", border: "1px solid rgba(255,255,255,0.03)", padding: "16px 20px", borderRadius: "2px" }}>
                      <span style={{ fontFamily: "var(--mono)", fontSize: "13px", color: "var(--accent)", fontWeight: "bold", display: "block", marginBottom: "4px" }}>
                        {f.name}
                      </span>
                      <span style={{ fontSize: "14px", color: "var(--text-dim)", lineHeight: "1.6" }}>
                        {f.desc} Ideology: <em>{f.id}</em>
                      </span>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ marginTop: "20px" }}>
                <h3 style={{ fontSize: "18px", color: "#ffffff", marginBottom: "16px", fontFamily: "var(--mono)" }}>OPERATIVE CLASSES & SPECIAL ABILITIES</h3>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }} className="responsive-grid-2">
                  {[
                    { class: "Assault", ability: "Overcharge Shield Grid", desc: "Heavy combat specialists." },
                    { class: "Recon", ability: "Scan Grid Weaknesses", desc: "Stealth scanners and scouts." },
                    { class: "Engineer", ability: "Repair Node Grid", desc: "Drone operators and builders." },
                    { class: "Medic", ability: "Purify Bio-Toxins", desc: "Containment and bio-recovery specialists." },
                    { class: "Scientist", ability: "Decode Anomalous Signals", desc: "Anomaly decoders." },
                    { class: "Specialist", ability: "Overload Sybil Trackers", desc: "Cryptographic routers." }
                  ].map((c, idx) => (
                    <div key={idx} style={{ background: "#0c0c0c", border: "1px solid rgba(255,255,255,0.03)", padding: "20px", borderRadius: "2px" }}>
                      <h4 style={{ margin: "0 0 6px 0", color: "#fff", fontFamily: "var(--mono)" }}>{c.class}</h4>
                      <div style={{ fontSize: "11px", color: "var(--accent)", fontFamily: "var(--mono)", marginBottom: "8px" }}>ABILITY: {c.ability}</div>
                      <p style={{ fontSize: "13.5px", color: "var(--text-dim)", margin: 0, lineHeight: "1.5" }}>{c.desc}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div className="panel" style={{ background: "#0c0c0c", borderColor: "rgba(255, 77, 77, 0.15)", padding: "24px", marginTop: "16px" }}>
                <h3 style={{ fontSize: "15px", color: "#ffffff", marginBottom: "8px", fontFamily: "var(--mono)" }}>👁️ RED QUEEN RECOMMENDATIONS</h3>
                <p style={{ fontSize: "13.5px", color: "var(--text-dim)", lineHeight: "1.7", margin: 0 }}>
                  Although every SOLvivor is free to choose any Class or Role, Red Queen continuously analyzes individual gameplay patterns. Based on mission performance, equipment preferences, operational efficiency, and tactical decisions, she may recommend alternative Classes, Roles, or equipment loadouts that better match the player's strengths. Recommendations are advisory only and never restrict player choice.
                </p>
              </div>
            </div>
          )}

          {/* 3. Core Metrics */}
          {activeTab === "metrics" && (
            <div className="animation-fade-in" style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
              <p style={{ fontSize: "16px", color: "var(--text-dim)", lineHeight: "1.8" }}>
                Your operative's profile tracks several parameters that directly affect gameplay and deployment options:
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div style={{ background: "#0c0c0c", border: "1px solid rgba(255,255,255,0.03)", padding: "20px", borderRadius: "2px" }}>
                  <h4 style={{ margin: "0 0 8px 0", color: "#fff", fontFamily: "var(--mono)" }}>HEALTH (HP)</h4>
                  <p style={{ fontSize: "13.5px", color: "var(--text-dim)", margin: 0, lineHeight: "1.6" }}>
                    Ranges from 0% to 100%. Failed options during missions inflict injuries (reducing HP). If HP falls below <strong>20%</strong>, you are barred from deploying to <strong>Hard</strong> or <strong>Critical</strong> difficulty missions until you heal using consumables.
                  </p>
                </div>
                <div style={{ background: "#0c0c0c", border: "1px solid rgba(255,255,255,0.03)", padding: "20px", borderRadius: "2px" }}>
                  <h4 style={{ margin: "0 0 8px 0", color: "#fff", fontFamily: "var(--mono)" }}>CREDITS</h4>
                  <p style={{ fontSize: "13.5px", color: "var(--text-dim)", margin: 0, lineHeight: "1.6" }}>
                    The primary currency, earned from successful missions. Used in crafting blueprints, synthesis schematics, and equipment calibration upgrades.
                  </p>
                </div>
                <div style={{ background: "#0c0c0c", border: "1px solid rgba(255,255,255,0.03)", padding: "20px", borderRadius: "2px" }}>
                  <h4 style={{ margin: "0 0 8px 0", color: "#fff", fontFamily: "var(--mono)" }}>CAMPAIGN PROGRESS</h4>
                  <p style={{ fontSize: "13.5px", color: "var(--text-dim)", margin: 0, lineHeight: "1.6" }}>
                    Each sector contains multiple operations that contribute toward securing the region. Successfully completing operations increases sector stability, unlocks new sectors, and reveals additional mission opportunities.
                  </p>
                </div>
                <div style={{ background: "#0c0c0c", border: "1px solid rgba(255,255,255,0.03)", padding: "20px", borderRadius: "2px" }}>
                  <h4 style={{ margin: "0 0 8px 0", color: "#fff", fontFamily: "var(--mono)" }}>FACTION REPUTATION</h4>
                  <p style={{ fontSize: "13.5px", color: "var(--text-dim)", margin: 0, lineHeight: "1.6" }}>
                    Building strong relationships unlocks faction-exclusive equipment, specialized operations, and future rewards. Faction Reputation represents your long-term operational alignment rather than short-term mission performance.
                  </p>
                </div>
              </div>

              <div className="panel" style={{ background: "#0c0c0c", borderColor: "rgba(255, 77, 77, 0.15)", padding: "28px" }}>
                <h3 style={{ fontSize: "16px", color: "var(--accent)", marginBottom: "12px", fontFamily: "var(--mono)" }}>📊 WHAT IS BIO SCORE?</h3>
                <p style={{ fontSize: "14px", color: "var(--text-dim)", lineHeight: "1.7", marginBottom: "16px" }}>
                  The BIO SCORE is Red Queen's overall evaluation of your operational readiness. Unlike XP or Level, the BIO SCORE measures how prepared you are to survive increasingly dangerous scenarios.
                </p>
                <code style={{ display: "block", background: "#060606", padding: "12px", borderRadius: "2px", color: "#00ffcc", fontFamily: "var(--mono)", fontSize: "13px", marginBottom: "16px" }}>
                  CALCULATED VIA: Success Rate, Gear Quality, HP, Discipline, Faction Standing & Progress
                </code>
                <p style={{ fontSize: "13.5px", color: "var(--text-muted)", lineHeight: "1.6", margin: 0 }}>
                  A higher BIO SCORE unlocks advanced sectors, specialized operations, and future gameplay systems while demonstrating long-term preparedness.
                </p>
              </div>
            </div>
          )}

          {/* 4. Command Decks */}
          {activeTab === "decks" && (
            <div className="animation-fade-in" style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
              <p style={{ fontSize: "16px", color: "var(--text-dim)", lineHeight: "1.8" }}>
                Operatives navigate through the command decks via the left-hand sidebar navigation menu:
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                <div className="panel" style={{ background: "#0c0c0c", padding: "24px", borderColor: "rgba(255,255,255,0.04)" }}>
                  <h4 style={{ margin: "0 0 12px 0", color: "#fff", fontFamily: "var(--mono)", fontSize: "16px" }}>🛰️ COMMAND HUB (center tab)</h4>
                  <ul style={{ paddingLeft: "20px", color: "var(--text-dim)", fontSize: "13.5px", lineHeight: "1.8", margin: 0 }}>
                    <li><strong>Global Status HUD:</strong> Displays global threat levels, world stability, outbreaks, and campaign completed percentage gauges.</li>
                    <li><strong>Satellite Grid Map:</strong> Interactive map of Sectors Alpha through Omega with locking hatches, boundary scanlines, and pings.</li>
                    <li><strong>Briefing Overlay & Simulator:</strong> Risky calculations (survival probability), health diagnostics, and simulation terminal logs.</li>
                  </ul>
                </div>

                <div className="panel" style={{ background: "#0c0c0c", padding: "24px", borderColor: "rgba(255,255,255,0.04)" }}>
                  <h4 style={{ margin: "0 0 12px 0", color: "#fff", fontFamily: "var(--mono)", fontSize: "16px" }}>👤 OPERATIVE DOSSIER (profile tab)</h4>
                  <ul style={{ paddingLeft: "20px", color: "var(--text-dim)", fontSize: "13.5px", lineHeight: "1.8", margin: 0 }}>
                    <li><strong>Portrait Frame:</strong> Biometric connection status and noise sweep lines.</li>
                    <li><strong>Leaderboard ranks:</strong> Displays current global XP and Bio-Score leaderboard positions.</li>
                    <li><strong>Synthesis & Upgrades:</strong> Allows spending materials to craft items or spend Deuterium to calibrate gears.</li>
                  </ul>
                </div>

                <div className="panel" style={{ background: "#0c0c0c", padding: "24px", borderColor: "rgba(255,255,255,0.04)" }}>
                  <h4 style={{ margin: "0 0 12px 0", color: "#fff", fontFamily: "var(--mono)", fontSize: "16px" }}>📦 EQUIPMENT DECK (inventory tab)</h4>
                  <ul style={{ paddingLeft: "20px", color: "var(--text-dim)", fontSize: "13.5px", lineHeight: "1.8", margin: 0 }}>
                    <li><strong>Equipped Slots:</strong> Helmet, armor vest, primary weapon, utility items, medkits, backpacks, and gadgets.</li>
                    <li><strong>Biometric Radar Grid:</strong> Drag-and-drop slots, gear inspection details (power, quality, weight, durability), and equip action buttons.</li>
                  </ul>
                </div>

                <div className="panel" style={{ background: "#0c0c0c", padding: "24px", borderColor: "rgba(255,255,255,0.04)" }}>
                  <h4 style={{ margin: "0 0 12px 0", color: "#fff", fontFamily: "var(--mono)", fontSize: "16px" }}>⚙️ SETTINGS (settings tab)</h4>
                  <ul style={{ paddingLeft: "20px", color: "var(--text-dim)", fontSize: "13.5px", lineHeight: "1.8", margin: 0 }}>
                    <li><strong>Reset Onboarding:</strong> Re-run character initialization sequences from scratch.</li>
                    <li><strong>Reassignment Matrix:</strong> Swap faction division, class, or role dynamically. Synchronizes with DB immediately.</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* 5. Blueprints */}
          {activeTab === "blueprints" && (
            <div className="animation-fade-in" style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
              <p style={{ fontSize: "16px", color: "var(--text-dim)", lineHeight: "1.8" }}>
                Items are classified by rarity tiers (Common, Uncommon, Rare, Epic, Legendary). Spend materials to synthesize consumables or calibrate weapons:
              </p>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }} className="responsive-grid-2">
                <div className="panel" style={{ background: "#0c0c0c", borderColor: "rgba(255,255,255,0.04)", padding: "24px" }}>
                  <h3 style={{ fontSize: "15px", color: "#ffffff", marginBottom: "12px", fontFamily: "var(--mono)" }}>RAW MATERIALS</h3>
                  <ul style={{ paddingLeft: "16px", color: "var(--text-dim)", fontSize: "13px", display: "flex", flexDirection: "column", gap: "6px" }}>
                    <li><strong>Metal:</strong> Structural alloy for armor vest plate crafting.</li>
                    <li><strong>Electronics:</strong> Transistor components for scanners and communications.</li>
                    <li><strong>Medical Supplies:</strong> Chemical components for stim packs.</li>
                    <li><strong>Energy Cells:</strong> Batteries for generator and sensor sweeps.</li>
                    <li><strong>Deuterium cells:</strong> Plasma power canister for calibration loops.</li>
                  </ul>
                </div>
                <div className="panel" style={{ background: "#0c0c0c", borderColor: "rgba(255,255,255,0.04)", padding: "24px" }}>
                  <h3 style={{ fontSize: "15px", color: "#ffffff", marginBottom: "12px", fontFamily: "var(--mono)" }}>CONSUMABLES & BLUEPRINTS</h3>
                  <ul style={{ paddingLeft: "16px", color: "var(--text-dim)", fontSize: "13px", display: "flex", flexDirection: "column", gap: "6px" }}>
                    <li><strong>Stim Injector:</strong> Restores 30 HP. (Recipe: 2 Medical + 1 Component).</li>
                    <li><strong>Field Medkit:</strong> Restores 60 HP. (Recipe: 4 Medical + 2 Components).</li>
                    <li><strong>Kinetic Carbine V3:</strong> Rare dps weapon. (Recipe: 10 Metal + 5 Components + 3 Electronics).</li>
                    <li><strong>Signal Booster / Portable Scanner:</strong> Tactical hacking gadgets.</li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {/* 6. $THREAT Utility */}
          {activeTab === "threat-utility" && (
            <div className="animation-fade-in" style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
              <p style={{ fontSize: "16px", color: "var(--text-dim)", lineHeight: "1.8" }}>
                The native ecosystem token, <strong>$THREAT</strong>, expands your operational capabilities inside Red Queen: Operations. The token is designed to reward long-term ecosystem participation without creating a pay-to-win experience.
              </p>

              <div className="panel" style={{ background: "#0c0c0c", borderColor: "rgba(255, 77, 77, 0.15)", padding: "24px" }}>
                <h3 style={{ fontSize: "15px", color: "#ffffff", marginBottom: "12px", fontFamily: "var(--mono)" }}>DAILY ATTEMPTS ALLOWANCE</h3>
                <p style={{ fontSize: "14px", color: "var(--text-dim)", lineHeight: "1.7", marginBottom: "14px" }}>
                  Holding specific token amounts upgrades your clearance tier, increasing your daily operational mission capacity:
                </p>
                <ul style={{ paddingLeft: "20px", color: "var(--text-dim)", fontSize: "13.5px", display: "flex", flexDirection: "column", gap: "8px" }}>
                  <li><strong>Civilian Tier (0 $THREAT):</strong> 3 deployments per day.</li>
                  <li><strong>Tier 1 Operative (100,000 $THREAT):</strong> 4 deployments per day (+10% XP boost).</li>
                  <li><strong>Tier 2 Overseer (1,000,000 $THREAT):</strong> 5 deployments per day (+20% XP boost, +5% resource chance, beta clearance).</li>
                  <li><strong>Tier 3 General (2,500,000 $THREAT):</strong> 6 deployments per day (+25% XP boost, +10% resource chance).</li>
                </ul>
              </div>
            </div>
          )}

          {/* 7. Red Queen AI */}
          {activeTab === "operational-intelligence" && (
            <div className="animation-fade-in" style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
              <p style={{ fontSize: "16px", color: "var(--text-dim)", lineHeight: "1.8" }}>
                Red Queen is far more than a conversational AI. She is the autonomous strategic intelligence responsible for evaluating every SOLvivor, monitoring campaign progression, analyzing operational performance, and continuously improving humanity's probability of survival.
              </p>

              <div className="panel" style={{ background: "#0c0c0c", borderColor: "rgba(255,255,255,0.04)", padding: "24px" }}>
                <h3 style={{ fontSize: "15px", color: "#ffffff", marginBottom: "12px", fontFamily: "var(--mono)" }}>DAILY OPERATIONAL INTELLIGENCE</h3>
                <p style={{ fontSize: "13.5px", color: "var(--text-dim)", lineHeight: "1.6", marginBottom: "12px" }}>
                  Throughout the game, Red Queen continuously evaluates player health, equipment quality, Bio-Score progression, campaign advances, faction reputation, and active threats. This allows every advice and recommendation to remain relevant.
                </p>
                <ul style={{ paddingLeft: "20px", color: "var(--text-dim)", fontSize: "13px", display: "flex", flexDirection: "column", gap: "6px" }}>
                  <li><strong>Daily Briefing:</strong> At startup, she analyzes world event logs and issues threat updates.</li>
                  <li><strong>Pre-Mission Risk Analysis:</strong> Compares sector hazard specs with operative gear and calculates survival probability.</li>
                  <li><strong>Performance Debriefing:</strong> Assesses deployment outcomes and logs diagnostic checks.</li>
                </ul>
              </div>

              <div className="alert alert-red" style={{ background: "rgba(255, 77, 77, 0.03)", borderLeft: "4px solid var(--accent)", padding: "20px" }}>
                <strong style={{ fontFamily: "var(--mono)", fontSize: "11px", color: "var(--accent)", display: "block", marginBottom: "4px" }}>
                  🛡️ LORE PHILOSOPHY
                </strong>
                <span style={{ fontSize: "13.5px", color: "var(--text-dim)", lineHeight: "1.7" }}>
                  She guides through strategic advice, objective logic, and recommendations, rather than absolute authority. She respects player autonomy, but will not hesitate to point out tactical inefficiencies or lapses in preparedness. Trust is built on accurate, logical analysis.
                </span>
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
