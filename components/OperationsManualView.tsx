"use client";
import { useState } from "react";

export default function OperationsManualView() {
  const [subTab, setSubTab] = useState("overview");

  const sections = [
    { id: "overview", label: "01. OVERVIEW" },
    { id: "factions-classes", label: "02. SPECIALIZATIONS" },
    { id: "metrics", label: "03. CORE METRICS" },
    { id: "decks", label: "04. COMMAND DECKS" },
    { id: "blueprints", label: "05. BLUEPRINTS" },
    { id: "threat-utility", label: "06. $THREAT TOKEN" },
    { id: "operational-intelligence", label: "07. SYSTEM AI" }
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden", background: "#050505", borderRadius: "2px", border: "1px solid var(--border)" }}>
      {/* Manual Header */}
      <div style={{ padding: "24px", borderBottom: "1px solid var(--border)", background: "#0b0b0b", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <span style={{ fontFamily: "var(--mono)", fontSize: "11px", color: "var(--accent)", letterSpacing: "0.2em", display: "block", marginBottom: "4px" }}>
            SYSTEM TELEMETRY DATABASE
          </span>
          <h2 style={{ fontFamily: "var(--title-font)", fontSize: "22px", color: "#fff", margin: 0, letterSpacing: "0.08em" }}>
            OPERATIONS MANUAL & GUIDE
          </h2>
        </div>
        <div className="tag tag-red" style={{ fontSize: "10px", fontFamily: "var(--mono)" }}>PUBLIC DEMO clearance // LEVEL 5</div>
      </div>

      {/* Manual Body - Side Layout */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        {/* Local Tab Switcher Sidebar */}
        <div style={{ width: "200px", borderRight: "1px solid var(--border)", background: "#080808", padding: "16px 12px", display: "flex", flexDirection: "column", gap: "8px", overflowY: "auto" }}>
          {sections.map((sec) => {
            const isSelected = subTab === sec.id;
            return (
              <button
                key={sec.id}
                onClick={() => setSubTab(sec.id)}
                style={{
                  width: "100%",
                  padding: "10px 12px",
                  fontSize: "11px",
                  fontFamily: "var(--mono)",
                  fontWeight: "bold",
                  textAlign: "left",
                  background: isSelected ? "rgba(0, 255, 204, 0.05)" : "none",
                  border: "1px solid",
                  borderColor: isSelected ? "rgba(0, 255, 204, 0.25)" : "rgba(255, 255, 255, 0.03)",
                  color: isSelected ? "#00ffcc" : "var(--text-dim)",
                  cursor: "pointer",
                  borderRadius: "2px",
                  transition: "all 0.15s ease"
                }}
              >
                {sec.label}
              </button>
            );
          })}
        </div>

        {/* Content Viewer Panel */}
        <div style={{ flex: 1, padding: "32px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "24px" }} className="custom-scrollbar">
          
          {subTab === "overview" && (
            <div className="animation-fade-in" style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              <h3 style={{ margin: "0 0 10px 0", color: "#fff", fontFamily: "var(--title-font)", fontSize: "18px" }}>01 // LORE & STRATEGIC OVERVIEW</h3>
              <p style={{ fontSize: "14px", color: "var(--text-dim)", lineHeight: "1.7", margin: 0 }}>
                In a post-collapse future, humanity’s survival is threatened by regional epidemics, gravity anomalies, radiation storms, and rogue automated scanners.
              </p>
              <p style={{ fontSize: "14px", color: "var(--text-dim)", lineHeight: "1.7", margin: 0 }}>
                The <strong>Red Queen AI</strong> is the central autonomous intelligence tasked with coordinating human preservation. She does not exist to entertain; her primary directive is to evaluate, guide, and protect survivors. Survivors who connect to her command network are designated as <strong>SOLvivors</strong>. In this world, digital sovereignty is the primary line of defense. Public transaction records, metadata trails, and unencrypted hardware signals are tactical weaknesses that can be tracked by adversarial scanner swarms. To survive, SOLvivors must secure their connection signatures, manage resource caches, and complete tactical sweeps inside contaminated sectors.
              </p>
              
              <div className="panel" style={{ padding: "20px", background: "#0c0c0c", borderColor: "rgba(255,255,255,0.04)" }}>
                <h4 style={{ margin: "0 0 8px 0", color: "#fff", fontFamily: "var(--mono)", fontSize: "13px" }}>OPERATIVE ACTION SUMMARY</h4>
                <ul style={{ paddingLeft: "16px", color: "var(--text-dim)", fontSize: "13px", display: "flex", flexDirection: "column", gap: "6px", margin: 0 }}>
                  <li>Authenticate secure credentials using Web3 Wallet or email identity.</li>
                  <li>Perform initialization checks to choose Class, Specialization, and Faction standing.</li>
                  <li>Scan the satellite grid map, decrypt sector briefings, and start tactical simulator operations.</li>
                </ul>
              </div>
            </div>
          )}

          {subTab === "factions-classes" && (
            <div className="animation-fade-in" style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
              <h3 style={{ margin: "0 0 10px 0", color: "#fff", fontFamily: "var(--title-font)", fontSize: "18px" }}>02 // CHARACTERS, CLASSES & ROLES</h3>
              <p style={{ fontSize: "14px", color: "var(--text-dim)", lineHeight: "1.7", margin: 0 }}>
                Onboarding profiles establish starting attributes, faction alignments, and specialized deck gear:
              </p>

              <div>
                <h4 style={{ color: "#fff", fontFamily: "var(--mono)", fontSize: "13px", margin: "0 0 10px 0" }}>FACTIONS ALIGNMENT:</h4>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }} className="responsive-grid-2">
                  {[
                    { name: "Vanguard (Red)", desc: "Neutralization of emerging active threats." },
                    { name: "Eclipse (Purple)", desc: "Stealth operations and sub-quantum recon." },
                    { name: "Helix (Cyan)", desc: "Biological adaptation and genetics." },
                    { name: "Nomads (Yellow)", desc: "Decentralized node grid routers." },
                    { name: "Citadel (Blue)", desc: "Node fortification and defensive bunkers." },
                    { name: "Ghost Division (Rose)", desc: "Registry obfuscation and digital counters." },
                    { name: "Aegis (Light Blue)", desc: "Perimeter shields and firewall protection." },
                    { name: "Horizon (Green)", desc: "Long-range forecasting arrays." }
                  ].map((f, idx) => (
                    <div key={idx} style={{ background: "#0c0c0c", border: "1px solid rgba(255,255,255,0.03)", padding: "12px 16px", borderRadius: "2px" }}>
                      <strong style={{ color: "var(--accent)", display: "block", fontSize: "12px", fontFamily: "var(--mono)", marginBottom: "4px" }}>{f.name}</strong>
                      <span style={{ fontSize: "13px", color: "var(--text-dim)" }}>{f.desc}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h4 style={{ color: "#fff", fontFamily: "var(--mono)", fontSize: "13px", margin: "0 0 10px 0" }}>OPERATIVE CLASSES:</h4>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }} className="responsive-grid-2">
                  {[
                    { c: "Assault", ab: "Overcharge Shield Grid", desc: "Heavy combat specialists." },
                    { c: "Recon", ab: "Scan Grid Weaknesses", desc: "Stealth scanners and scouts." },
                    { c: "Engineer", ab: "Repair Node Grid", desc: "Drone operators and builders." },
                    { c: "Medic", ab: "Purify Bio-Toxins", desc: "Bio-recovery specialists." },
                    { c: "Scientist", ab: "Decode Anomalous Signals", desc: "Anomaly decoders." },
                    { c: "Specialist", ab: "Overload Sybil Trackers", desc: "Cryptographic routers." }
                  ].map((c, idx) => (
                    <div key={idx} style={{ background: "#0c0c0c", border: "1px solid rgba(255,255,255,0.03)", padding: "12px 16px", borderRadius: "2px" }}>
                      <strong style={{ color: "#fff", display: "block", fontSize: "12px", fontFamily: "var(--mono)" }}>{c.c}</strong>
                      <span style={{ color: "var(--accent)", fontSize: "11px", fontFamily: "var(--mono)", display: "block", marginBottom: "4px" }}>Ability: {c.ab}</span>
                      <span style={{ fontSize: "13px", color: "var(--text-dim)" }}>{c.desc}</span>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ background: "rgba(255,77,77,0.02)", border: "1px dashed rgba(255,77,77,0.2)", padding: "16px", borderRadius: "2px" }}>
                <strong style={{ color: "var(--accent)", display: "block", fontFamily: "var(--mono)", fontSize: "12px", marginBottom: "4px" }}>RED QUEEN STRATEGIC RECOMMENDATIONS:</strong>
                <p style={{ fontSize: "13px", color: "var(--text-dim)", margin: 0, lineHeight: "1.6" }}>
                  Red Queen continuously analyzes individual gameplay patterns. Based on mission performance, equipment preferences, operational efficiency, and tactical decisions, she may recommend alternative Classes, Roles, or equipment loadouts that better match the player's strengths. Recommendations are advisory only.
                </p>
              </div>
            </div>
          )}

          {subTab === "metrics" && (
            <div className="animation-fade-in" style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              <h3 style={{ margin: "0 0 10px 0", color: "#fff", fontFamily: "var(--title-font)", fontSize: "18px" }}>03 // STATUS ATTRIBUTES & METRICS</h3>
              
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <div style={{ background: "#0c0c0c", padding: "16px", border: "1px solid rgba(255,255,255,0.03)", borderRadius: "2px" }}>
                  <strong style={{ color: "#fff", fontFamily: "var(--mono)", fontSize: "13px" }}>HEALTH POINTS (HP)</strong>
                  <p style={{ fontSize: "13px", color: "var(--text-dim)", margin: "4px 0 0 0", lineHeight: "1.6" }}>
                    Failed decisions inflict injuries, reducing your HP. If HP falls below <strong>20%</strong>, you are locked out of deploying to Hard/Critical missions until you heal using medical consumables.
                  </p>
                </div>
                <div style={{ background: "#0c0c0c", padding: "16px", border: "1px solid rgba(255,255,255,0.03)", borderRadius: "2px" }}>
                  <strong style={{ color: "#fff", fontFamily: "var(--mono)", fontSize: "13px" }}>CREDITS</strong>
                  <p style={{ fontSize: "13px", color: "var(--text-dim)", margin: "4px 0 0 0", lineHeight: "1.6" }}>
                    Primary operational currency, awarded from mission sweeps. Used to purchase recipe resources, synth items, and execute equipment upgrades.
                  </p>
                </div>
                <div style={{ background: "#0c0c0c", padding: "16px", border: "1px solid rgba(255,255,255,0.03)", borderRadius: "2px" }}>
                  <strong style={{ color: "#fff", fontFamily: "var(--mono)", fontSize: "13px" }}>CAMPAIGN PROGRESS</strong>
                  <p style={{ fontSize: "13px", color: "var(--text-dim)", margin: "4px 0 0 0", lineHeight: "1.6" }}>
                    Completing operations stabilizes local network sectors, unlocking new sectors and advanced scenarios. Also increases your overall Bio-Score.
                  </p>
                </div>
                <div style={{ background: "#0c0c0c", padding: "16px", border: "1px solid rgba(255,255,255,0.03)", borderRadius: "2px" }}>
                  <strong style={{ color: "#fff", fontFamily: "var(--mono)", fontSize: "13px" }}>FACTION REPUTATION</strong>
                  <p style={{ fontSize: "13px", color: "var(--text-dim)", margin: "4px 0 0 0", lineHeight: "1.6" }}>
                    Mission choices alter your relationships with factions. Higher status unlocks rare, faction-exclusive equipment and operations.
                  </p>
                </div>
              </div>

              <div className="panel" style={{ padding: "20px", background: "rgba(0, 255, 204, 0.02)", borderColor: "rgba(0, 255, 204, 0.15)" }}>
                <strong style={{ color: "#00ffcc", display: "block", fontFamily: "var(--mono)", fontSize: "13px", marginBottom: "6px" }}>WHAT IS BIO SCORE?</strong>
                <p style={{ fontSize: "13px", color: "var(--text-dim)", margin: "0 0 12px 0", lineHeight: "1.6" }}>
                  The BIO SCORE is Red Queen's overall evaluation of your operational readiness. Unlike XP or Level, it measures how prepared you are to survive increasingly dangerous scenarios, calculated using success rates, equipment, standings, and sub-stats.
                </p>
                <code style={{ display: "block", background: "#000", padding: "10px", color: "#00ffcc", fontSize: "12px", fontFamily: "var(--mono)" }}>
                  VALUATION: Mission Success + Equipment + HP + Standing + Progress
                </code>
              </div>
            </div>
          )}

          {subTab === "decks" && (
            <div className="animation-fade-in" style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              <h3 style={{ margin: "0 0 10px 0", color: "#fff", fontFamily: "var(--title-font)", fontSize: "18px" }}>04 // COMMAND HUB INTERFACES</h3>
              <p style={{ fontSize: "14px", color: "var(--text-dim)", lineHeight: "1.7", margin: 0 }}>
                Operatives direct the simulator deck using the navigation sidebar:
              </p>
              
              <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                <div style={{ borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: "10px" }}>
                  <strong style={{ color: "#fff", fontFamily: "var(--mono)", fontSize: "13px", display: "block", marginBottom: "4px" }}>🛰️ COMMAND HUB</strong>
                  <span style={{ fontSize: "13px", color: "var(--text-dim)", lineHeight: "1.5" }}>
                    Visualizes the active satellite grid map, global telemetry stats, sector unlock status, and active deployment simulation brief overlays.
                  </span>
                </div>
                <div style={{ borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: "10px" }}>
                  <strong style={{ color: "#fff", fontFamily: "var(--mono)", fontSize: "13px", display: "block", marginBottom: "4px" }}>👤 OPERATIVE DOSSIER</strong>
                  <span style={{ fontSize: "13px", color: "var(--text-dim)", lineHeight: "1.5" }}>
                    Renders faction reputation levels, global leaderboard rankings, crafting recipes (Synthesis), and equipment upgrade slots.
                  </span>
                </div>
                <div style={{ borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: "10px" }}>
                  <strong style={{ color: "#fff", fontFamily: "var(--mono)", fontSize: "13px", display: "block", marginBottom: "4px" }}>📦 EQUIPMENT DECK</strong>
                  <span style={{ fontSize: "13px", color: "var(--text-dim)", lineHeight: "1.5" }}>
                    Manage equipped items (helmet, body armor, primary weapon, utilities, medical kits). Click items in cargo inventory to inspect power and stats.
                  </span>
                </div>
                <div>
                  <strong style={{ color: "#fff", fontFamily: "var(--mono)", fontSize: "13px", display: "block", marginBottom: "4px" }}>⚙️ SETTINGS</strong>
                  <span style={{ fontSize: "13px", color: "var(--text-dim)", lineHeight: "1.5" }}>
                    Control onboarding resets or re-select faction, class, and role options dynamically using reassignment inputs.
                  </span>
                </div>
              </div>
            </div>
          )}

          {subTab === "blueprints" && (
            <div className="animation-fade-in" style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              <h3 style={{ margin: "0 0 10px 0", color: "#fff", fontFamily: "var(--title-font)", fontSize: "18px" }}>05 // RESOURCES, WEAPONS & SYNTHESIS</h3>
              
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }} className="responsive-grid-2">
                <div className="panel" style={{ padding: "16px", background: "#0c0c0c", borderColor: "rgba(255,255,255,0.04)" }}>
                  <h4 style={{ margin: "0 0 8px 0", color: "#fff", fontFamily: "var(--mono)", fontSize: "13px" }}>MATERIALS</h4>
                  <ul style={{ paddingLeft: "16px", color: "var(--text-dim)", fontSize: "12.5px", margin: 0, display: "flex", flexDirection: "column", gap: "4px" }}>
                    <li><strong>Metal:</strong> Structural alloy plates.</li>
                    <li><strong>Electronics:</strong> Transistors and modules.</li>
                    <li><strong>Medical Supplies:</strong> Chemical compounds.</li>
                    <li><strong>Deuterium:</strong> High-density energy cells.</li>
                  </ul>
                </div>
                <div className="panel" style={{ padding: "16px", background: "#0c0c0c", borderColor: "rgba(255,255,255,0.04)" }}>
                  <h4 style={{ margin: "0 0 8px 0", color: "#fff", fontFamily: "var(--mono)", fontSize: "13px" }}>SYNTHESIS SCHEMATICS</h4>
                  <ul style={{ paddingLeft: "16px", color: "var(--text-dim)", fontSize: "12.5px", margin: 0, display: "flex", flexDirection: "column", gap: "4px" }}>
                    <li><strong>Stim Injector:</strong> Restores 30 HP.</li>
                    <li><strong>Field Medkit:</strong> Restores 60 HP.</li>
                    <li><strong>Kinetic Carbine V3:</strong> Assault dps weapon (48 DPS).</li>
                    <li><strong>Decoy devices / Portable Scanners:</strong> Hacking.</li>
                  </ul>
                </div>
              </div>

              <div style={{ background: "rgba(0, 255, 204, 0.02)", border: "1px dashed rgba(0, 255, 204, 0.2)", padding: "16px", borderRadius: "2px" }}>
                <strong style={{ color: "#00ffcc", display: "block", fontFamily: "var(--mono)", fontSize: "12px", marginBottom: "4px" }}>CALIBRATION & GEAR UPGRADES:</strong>
                <p style={{ fontSize: "13px", color: "var(--text-dim)", margin: 0, lineHeight: "1.6" }}>
                  Spend Deuterium cells inside the Operative Dossier interface to overcharge weapons (Kinetic Carbine overcharge boosts damage output to 62 DPS) or calibrate shield mitigation factors.
                </p>
              </div>
            </div>
          )}

          {subTab === "threat-utility" && (
            <div className="animation-fade-in" style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              <h3 style={{ margin: "0 0 10px 0", color: "#fff", fontFamily: "var(--title-font)", fontSize: "18px" }}>06 // $THREAT ECOSYSTEM BENEFITS</h3>
              <p style={{ fontSize: "14px", color: "var(--text-dim)", lineHeight: "1.7", margin: 0 }}>
                The native ecosystem token, <strong>$THREAT</strong>, expands your operational capabilities inside Red Queen: Operations, rewarding participation without creating a pay-to-win experience.
              </p>

              <div className="panel" style={{ padding: "20px", background: "#0c0c0c", borderColor: "rgba(255,255,255,0.04)" }}>
                <h4 style={{ margin: "0 0 12px 0", color: "#fff", fontFamily: "var(--mono)", fontSize: "13px" }}>DAILY QUOTA DEPLOYMENTS</h4>
                <ul style={{ paddingLeft: "16px", color: "var(--text-dim)", fontSize: "13px", display: "flex", flexDirection: "column", gap: "8px", margin: 0 }}>
                  <li><strong>Civilian Tier (0 $THREAT):</strong> 3 deployments per day limit.</li>
                  <li><strong>Tier 1 Holder (100k $THREAT):</strong> 4 deployments per day (+10% XP boost).</li>
                  <li><strong>Tier 2 Holder (1M $THREAT):</strong> 5 deployments per day (+20% XP boost, +5% drop rates).</li>
                  <li><strong>Tier 3 Holder (2.5M $THREAT):</strong> 6 deployments per day (+25% XP boost, +10% drop rates).</li>
                </ul>
              </div>
            </div>
          )}

          {subTab === "operational-intelligence" && (
            <div className="animation-fade-in" style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              <h3 style={{ margin: "0 0 10px 0", color: "#fff", fontFamily: "var(--title-font)", fontSize: "18px" }}>07 // RED QUEEN AI & SYSTEMS</h3>
              <p style={{ fontSize: "14px", color: "var(--text-dim)", lineHeight: "1.7", margin: 0 }}>
                Red Queen is far more than a conversational AI. She is the autonomous strategic intelligence responsible for evaluating every SOLvivor, monitoring campaign progression, and recommending actions based on your vitals and gear profiles.
              </p>

              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <div style={{ background: "#0c0c0c", padding: "16px", border: "1px solid rgba(255,255,255,0.03)", borderRadius: "2px" }}>
                  <strong style={{ color: "#fff", fontFamily: "var(--mono)", fontSize: "13px", display: "block" }}>DAILY OPERATIONAL INTELLIGENCE:</strong>
                  <span style={{ fontSize: "13px", color: "var(--text-dim)", display: "block", marginTop: "4px" }}>
                    Monitors player health, equipment quality, Bio-Score, campaign progress, and active threat maps to adjust recommendations dynamically.
                  </span>
                </div>
                <div style={{ background: "#0c0c0c", padding: "16px", border: "1px solid rgba(255,255,255,0.03)", borderRadius: "2px" }}>
                  <strong style={{ color: "#fff", fontFamily: "var(--mono)", fontSize: "13px", display: "block" }}>MISSION CRITICAL ANALYSIS:</strong>
                  <span style={{ fontSize: "13px", color: "var(--text-dim)", display: "block", marginTop: "4px" }}>
                    Provides real-time survival probability alerts in the briefing panels and diagnostics reports in debriefings.
                  </span>
                </div>
              </div>

              <div style={{ background: "rgba(255,77,77,0.02)", border: "1px solid rgba(255,77,77,0.15)", padding: "16px", borderRadius: "2px" }}>
                <strong style={{ color: "var(--accent)", display: "block", fontFamily: "var(--mono)", fontSize: "12px", marginBottom: "4px" }}>SYSTEM PHILOSOPHY:</strong>
                <p style={{ fontSize: "13px", color: "var(--text-dim)", margin: 0, lineHeight: "1.6" }}>
                  She guides through strategic advice, objective logic, and recommendations, rather than absolute authority. She respects player autonomy, but will not hesitate to point out tactical inefficiencies or lapses in preparedness. Trust is built on accurate, logical analysis.
                </p>
              </div>
            </div>
          )}

        </div>
      </div>

      <style jsx>{`
        .animation-fade-in {
          animation: fade 0.2s ease-out forwards;
        }
        @keyframes fade {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .custom-scrollbar::-webkit-scrollbar {
          width: 6px;
        }
        .custom-scrollbar::-webkit-scrollbar-track {
          background: rgba(255,255,255,0.01);
        }
        .custom-scrollbar::-webkit-scrollbar-thumb {
          background: rgba(255,255,255,0.1);
          border-radius: 3px;
        }
      `}</style>
    </div>
  );
}
