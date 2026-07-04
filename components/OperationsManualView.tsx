"use client";
import { useState } from "react";

export default function OperationsManualView() {
  const [subTab, setSubTab] = useState("section1");

  const sections = [
    { id: "section1", label: "SECTION 1", title: "SECTION 1: LORE & STRATEGIC OVERVIEW" },
    { id: "section2", label: "SECTION 2", title: "SECTION 2: CHARACTERS, CLASSES & ROLES" },
    { id: "section3", label: "SECTION 3", title: "SECTION 3: SYSTEM METRICS & CURRENCIES" },
    { id: "section4", label: "SECTION 4", title: "SECTION 4: THE USER INTERFACE DECKS (TABS)" },
    { id: "section5", label: "SECTION 5", title: "SECTION 5: GAME ITEMS, RESOURCES & BLUEPRINTS" },
    { id: "section6", label: "SECTION 6", title: "SECTION 6: $THREAT TOKEN UTILITY" },
    { id: "section7", label: "SECTION 7", title: "SECTION 7: RED QUEEN AI & OPERATIONAL INTELLIGENCE" }
  ];

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden", background: "#050505", borderRadius: "2px", border: "1px solid var(--border)" }}>
      {/* Manual Header */}
      <div style={{ padding: "20px 24px", borderBottom: "1px solid var(--border)", background: "#0b0b0b", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <span style={{ fontFamily: "var(--mono)", fontSize: "11px", color: "var(--accent)", letterSpacing: "0.2em", display: "block", marginBottom: "4px" }}>
            SYSTEM TELEMETRY DATABASE
          </span>
          <h2 style={{ fontFamily: "var(--title-font)", fontSize: "20px", color: "#fff", margin: 0, letterSpacing: "0.08em" }}>
            RED QUEEN: OPERATIONS MANUAL
          </h2>
        </div>
        <div className="tag tag-red" style={{ fontSize: "10px", fontFamily: "var(--mono)" }}>CLEARANCE: LEVEL 5</div>
      </div>

      {/* Manual Body */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden" }}>
        {/* Sidebar Selector */}
        <div style={{ width: "160px", borderRight: "1px solid var(--border)", background: "#080808", padding: "16px 12px", display: "flex", flexDirection: "column", gap: "8px", overflowY: "auto" }}>
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
                  background: isSelected ? "rgba(255, 77, 77, 0.06)" : "none",
                  border: "1px solid",
                  borderColor: isSelected ? "rgba(255, 77, 77, 0.25)" : "rgba(255, 255, 255, 0.03)",
                  color: isSelected ? "var(--accent)" : "var(--text-dim)",
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

        {/* Content Panel */}
        <div style={{ flex: 1, padding: "32px", overflowY: "auto", display: "flex", flexDirection: "column", gap: "24px" }} className="custom-scrollbar">
          
          {subTab === "section1" && (
            <div className="animation-fade-in" style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              <h3 style={{ margin: "0 0 12px 0", color: "#fff", fontFamily: "var(--title-font)", fontSize: "18px", borderBottom: "1px solid rgba(255,255,255,0.08)", paddingBottom: "8px" }}>
                ## SECTION 1: LORE & STRATEGIC OVERVIEW
              </h3>
              
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div style={{ background: "#0c0c0c", padding: "16px", borderRadius: "2px", border: "1px solid rgba(255,255,255,0.03)" }}>
                  <h4 style={{ color: "#fff", fontFamily: "var(--mono)", fontSize: "13px", margin: "0 0 8px 0" }}>### 1.1 The Narrative Setup</h4>
                  <p style={{ fontSize: "13.5px", color: "var(--text-dim)", lineHeight: "1.7", margin: 0 }}>
                    In a post-collapse future, humanity’s survival is threatened by regional epidemics, gravity anomalies, radiation storms, and rogue automated scanners.
                  </p>
                  <p style={{ fontSize: "13.5px", color: "var(--text-dim)", lineHeight: "1.7", margin: "12px 0 0 0" }}>
                    The <strong>Red Queen AI</strong> is the central autonomous intelligence tasked with coordinating human preservation. She does not exist to entertain; her primary directive is to evaluate, guide, and protect survivors. Survivors who connect to her command network are designated as <strong>SOLvivors</strong>. In this world, digital sovereignty is the primary line of defense. Public transaction records, metadata trails, and unencrypted hardware signals are tactical weaknesses that can be tracked by adversarial scanner swarms. To survive, SOLvivors must secure their connection signatures, manage resource caches, and complete tactical sweeps inside contaminated sectors.
                  </p>
                </div>

                <div style={{ background: "#0c0c0c", padding: "16px", borderRadius: "2px", border: "1px solid rgba(255,255,255,0.03)" }}>
                  <h4 style={{ color: "#fff", fontFamily: "var(--mono)", fontSize: "13px", margin: "0 0 8px 0" }}>### 1.2 The Player's Objective</h4>
                  <p style={{ fontSize: "13.5px", color: "var(--text-dim)", lineHeight: "1.7", margin: "0 0 8px 0" }}>
                    As a SOLvivor, your goals are to:
                  </p>
                  <ol style={{ paddingLeft: "20px", color: "var(--text-dim)", fontSize: "13.5px", display: "flex", flexDirection: "column", gap: "6px", margin: 0 }}>
                    <li><strong>Authenticate</strong>: Connect your account securely via wallet or email.</li>
                    <li><strong>Train & Align</strong>: Choose a specialization (Class/Role) and align with a Faction.</li>
                    <li><strong>Explore</strong>: Scan the satellite grid map and unlock hostile sectors.</li>
                    <li><strong>Deploy</strong>: Run simulated mission scenarios, making critical decisions.</li>
                    <li><strong>Synthesize</strong>: Scavenge materials to craft tools, weapons, and medical units.</li>
                    <li><strong>Progress</strong>: Level up, boost your Bio-Score, and climb the leaderboard.</li>
                  </ol>
                </div>
              </div>
            </div>
          )}

          {subTab === "section2" && (
            <div className="animation-fade-in" style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              <h3 style={{ margin: "0 0 12px 0", color: "#fff", fontFamily: "var(--title-font)", fontSize: "18px", borderBottom: "1px solid rgba(255,255,255,0.08)", paddingBottom: "8px" }}>
                ## SECTION 2: CHARACTERS, CLASSES & ROLES
              </h3>
              <p style={{ fontSize: "13.5px", color: "var(--text-dim)", lineHeight: "1.7", margin: 0 }}>
                During onboarding, you must customize your profile. Your choices determine your starting equipment, scenario options, and specialized abilities.
              </p>

              <div style={{ background: "#0c0c0c", padding: "16px", borderRadius: "2px", border: "1px solid rgba(255,255,255,0.03)" }}>
                <h4 style={{ color: "#fff", fontFamily: "var(--mono)", fontSize: "13px", margin: "0 0 10px 0" }}>### 2.1 The Eight Faction Divisions</h4>
                <p style={{ fontSize: "13px", color: "var(--text-dim)", margin: "0 0 12px 0" }}>
                  Aligning with a faction grants starter standing and defines your combat alignment:
                </p>
                <ul style={{ paddingLeft: "18px", color: "var(--text-dim)", fontSize: "13.5px", display: "flex", flexDirection: "column", gap: "6px", margin: 0 }}>
                  <li><strong>Vanguard (Red)</strong>: Containment forces and kinetic response. Ideology: <em>Preemptive neutralization of emerging threats.</em></li>
                  <li><strong>Eclipse (Purple)</strong>: Shadow recon and sub-quantum stealth. Ideology: <em>Strike with precision from the shadows.</em></li>
                  <li><strong>Helix (Cyan)</strong>: Biological adaptation and genetic engineering. Ideology: <em>Humanity must evolve biologically to survive.</em></li>
                  <li><strong>Nomads (Yellow)</strong>: Mobile routers and decentralized node grids. Ideology: <em>Distributed networks prevent total collapse.</em></li>
                  <li><strong>Citadel (Blue)</strong>: Defensive sanctuary bunkers and shields. Ideology: <em>Fortify the nodes, protect the civilian pods.</em></li>
                  <li><strong>Ghost Division (Rose)</strong>: Cyber counters and registry obfuscation. Ideology: <em>Erase all digital traces to stay hidden.</em></li>
                  <li><strong>Aegis (Light Blue)</strong>: Defensive firewalls and perimeter shield grids. Ideology: <em>Defense is our primary weapon.</em></li>
                  <li><strong>Horizon (Green)</strong>: Long-range sensor telemetry and prediction arrays. Ideology: <em>Forecast anomalies long before they strike.</em></li>
                </ul>
              </div>

              <div style={{ background: "#0c0c0c", padding: "16px", borderRadius: "2px", border: "1px solid rgba(255,255,255,0.03)" }}>
                <h4 style={{ color: "#fff", fontFamily: "var(--mono)", fontSize: "13px", margin: "0 0 10px 0" }}>### 2.2 Operative Classes & Special Abilities</h4>
                <p style={{ fontSize: "13px", color: "var(--text-dim)", margin: "0 0 12px 0" }}>
                  Each class has preferred gear, specialized tools, and a unique tactical ability:
                </p>
                <ul style={{ paddingLeft: "18px", color: "var(--text-dim)", fontSize: "13.5px", display: "flex", flexDirection: "column", gap: "6px", margin: 0 }}>
                  <li><strong>Assault</strong>: Heavy combat specialists. Ability: <em>Overcharge Shield Grid</em>. (Preferred: Heavy Armor, breach charges, kinetic rifles).</li>
                  <li><strong>Recon</strong>: Stealth scanners and scouts. Ability: <em>Scan Grid Weaknesses</em>. (Preferred: Sensor arrays, thermal cloaks).</li>
                  <li><strong>Engineer</strong>: Drone operators and builders. Ability: <em>Repair Node Grid</em>. (Preferred: Decoys, drone cores, cutters).</li>
                  <li><strong>Medic</strong>: Containment and bio-recovery specialists. Ability: <em>Purify Bio-Toxins</em>. (Preferred: Stim injectors, gas filters).</li>
                  <li><strong>Scientist</strong>: Anomaly decoders. Ability: <em>Decode Anomalous Signals</em>. (Preferred: Gravity analyzers, data pads).</li>
                  <li><strong>Specialist</strong>: Cryptographic routers. Ability: <em>Overload Sybil Trackers</em>. (Preferred: Decoy keys, multi-hop routers).</li>
                </ul>
              </div>

              <div style={{ background: "#0c0c0c", padding: "16px", borderRadius: "2px", border: "1px solid rgba(255,255,255,0.03)" }}>
                <h4 style={{ color: "#fff", fontFamily: "var(--mono)", fontSize: "13px", margin: "0 0 10px 0" }}>### 2.3 Specialized Tactical Roles</h4>
                <p style={{ fontSize: "13px", color: "var(--text-dim)", margin: "0 0 12px 0" }}>
                  Within each class, you choose a narrow role that fits your playstyle:
                </p>
                <ul style={{ paddingLeft: "18px", color: "var(--text-dim)", fontSize: "13.5px", display: "flex", flexDirection: "column", gap: "6px", margin: 0 }}>
                  <li><em>Assault</em>: Heavy Assault, Vanguard Commando, Breach Specialist.</li>
                  <li><em>Recon</em>: Sniper, Pathfinder, Intel Scout.</li>
                  <li><em>Engineer</em>: Field Engineer, Drone Maintenance, Grid Operator.</li>
                  <li><em>Medic</em>: Combat Medic, Bio Analyst, Quarantine Inspector.</li>
                  <li><em>Scientist</em>: Signal Decoder, Gravity Analyst, Data Cryptologist.</li>
                  <li><em>Specialist</em>: Drone Operator, Infiltrator, Network Router.</li>
                </ul>
              </div>

              <div style={{ background: "#0c0c0c", padding: "16px", borderRadius: "2px", border: "1px solid rgba(255,255,255,0.03)" }}>
                <h4 style={{ color: "#fff", fontFamily: "var(--mono)", fontSize: "13px", margin: "0 0 10px 0" }}>### 2.4 Red Queen Recommendations</h4>
                <p style={{ fontSize: "13.5px", color: "var(--text-dim)", lineHeight: "1.7", margin: 0 }}>
                  Although every SOLvivor is free to choose any Class or Role, Red Queen continuously analyzes individual gameplay patterns. Based on mission performance, equipment preferences, operational efficiency, and tactical decisions, she may recommend alternative Classes, Roles, or equipment loadouts that better match the player's strengths. Recommendations are advisory only and never restrict player choice.
                </p>
              </div>
            </div>
          )}

          {subTab === "section3" && (
            <div className="animation-fade-in" style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              <h3 style={{ margin: "0 0 12px 0", color: "#fff", fontFamily: "var(--title-font)", fontSize: "18px", borderBottom: "1px solid rgba(255,255,255,0.08)", paddingBottom: "8px" }}>
                ## SECTION 3: SYSTEM METRICS & CURRENCIES
              </h3>
              <p style={{ fontSize: "13.5px", color: "var(--text-dim)", lineHeight: "1.7", margin: 0 }}>
                Your operative's profile tracks several parameters that directly affect gameplay:
              </p>

              <div style={{ background: "#0c0c0c", padding: "16px", borderRadius: "2px", border: "1px solid rgba(255,255,255,0.03)" }}>
                <h4 style={{ color: "#fff", fontFamily: "var(--mono)", fontSize: "13px", margin: "0 0 10px 0" }}>### 3.1 Status Attributes</h4>
                <ul style={{ paddingLeft: "18px", color: "var(--text-dim)", fontSize: "13.5px", display: "flex", flexDirection: "column", gap: "10px", margin: 0 }}>
                  <li>
                    <strong>Health (HP)</strong>: Ranges from 0% to 100%. Failed options during missions inflict injuries (reducing HP).
                    <ul style={{ paddingLeft: "16px", marginTop: "4px" }}>
                      <li><em>HP Critical Lockout</em>: If HP falls below <strong>20%</strong>, you are barred from deploying to <strong>Hard</strong> or <strong>Critical</strong> difficulty missions until you heal.</li>
                      <li><em>Recovery</em>: HP is restored by consuming Stims or Medkits.</li>
                    </ul>
                  </li>
                  <li><strong>Credits</strong>: The primary currency. Earned from successful missions. Used in crafting blueprints and weapon/armor upgrades.</li>
                  <li><strong>XP & Level</strong>: Leveling up requires completing missions to gain XP. Higher levels unlock new sectors, higher-tier crafting recipes, and faction items.</li>
                  <li><strong>Bio-Score</strong>: Evaluates your overall preparedness based on stats. Required to unlock advanced sectors.</li>
                </ul>
              </div>

              <div className="panel" style={{ padding: "20px", background: "rgba(0, 255, 204, 0.02)", borderColor: "rgba(0, 255, 204, 0.15)" }}>
                <h4 style={{ margin: "0 0 10px 0", color: "#00ffcc", fontFamily: "var(--mono)", fontSize: "13px" }}>### What is BIO SCORE?</h4>
                <p style={{ fontSize: "13.5px", color: "var(--text-dim)", lineHeight: "1.7", margin: "0 0 12px 0" }}>
                  The BIO SCORE is Red Queen's overall evaluation of your operational readiness. Unlike XP or Level, the BIO SCORE measures how prepared you are to survive increasingly dangerous scenarios.
                </p>
                <p style={{ fontSize: "13.5px", color: "var(--text-dim)", lineHeight: "1.7", margin: "0 0 12px 0" }}>
                  It is calculated using multiple operational factors, including:
                </p>
                <ul style={{ paddingLeft: "20px", color: "var(--text-dim)", fontSize: "13.5px", display: "flex", flexDirection: "column", gap: "6px", margin: "0 0 12px 0" }}>
                  <li>- Mission Success Rate</li>
                  <li>- Equipment Quality</li>
                  <li>- Health Status</li>
                  <li>- Operational Discipline</li>
                  <li>- Faction Standing</li>
                  <li>- Campaign Progress</li>
                  <li>- Tactical Decision Making</li>
                  <li>- Overall Survival Performance</li>
                </ul>
                <p style={{ fontSize: "13px", color: "var(--text-dim)", lineHeight: "1.7", margin: 0 }}>
                  A higher BIO SCORE unlocks advanced sectors, specialized operations, and future gameplay systems while demonstrating long-term preparedness.
                </p>
              </div>

              <div style={{ background: "#0c0c0c", padding: "16px", borderRadius: "2px", border: "1px solid rgba(255,255,255,0.03)" }}>
                <span style={{ color: "var(--text-dim)", fontSize: "13.5px", display: "block", marginBottom: "8px" }}>
                  * <strong>Faction Standing</strong>: Represents your alignment rating with the 8 divisions. High standing unlocks rare faction-locked gear.
                </span>
              </div>

              <div style={{ background: "#0c0c0c", padding: "16px", borderRadius: "2px", border: "1px solid rgba(255,255,255,0.03)" }}>
                <h4 style={{ color: "#fff", fontFamily: "var(--mono)", fontSize: "13px", margin: "0 0 10px 0" }}>### 3.2 The Seven Sub-Stats</h4>
                <p style={{ fontSize: "13px", color: "var(--text-dim)", margin: "0 0 10px 0" }}>
                  Developed through decision choices in missions:
                </p>
                <ol style={{ paddingLeft: "20px", color: "var(--text-dim)", fontSize: "13.5px", display: "flex", flexDirection: "column", gap: "6px", margin: 0 }}>
                  <li>Threat Awareness: Spot hazards before they trigger.</li>
                  <li>Operational Discipline: Resource and action efficiency.</li>
                  <li>Psychological Stability: Resistance to panic and stress.</li>
                  <li>Technical Preparedness: Proficiency with mechanics and bypass scripts.</li>
                  <li>Adaptability: Performance in changing environments.</li>
                  <li>Resourcefulness: Efficiency when operating with minimal loadouts.</li>
                  <li>Surveillance Resistance: Obfuscation of digital trails.</li>
                </ol>
              </div>

              <div style={{ background: "#0c0c0c", padding: "16px", borderRadius: "2px", border: "1px solid rgba(255,255,255,0.03)" }}>
                <h4 style={{ color: "#fff", fontFamily: "var(--mono)", fontSize: "13px", margin: "0 0 8px 0" }}>### 3.3 Campaign Progress</h4>
                <p style={{ fontSize: "13.5px", color: "var(--text-dim)", lineHeight: "1.7", margin: 0 }}>
                  Campaign Progress represents your advancement through the Operations network. Each sector contains multiple operations that contribute toward securing the region. Successfully completing operations increases sector stability, unlocks new sectors, expands the campaign, and reveals additional mission opportunities. Campaign Progress also contributes to your BIO SCORE and influences Red Queen's strategic recommendations.
                </p>
              </div>

              <div style={{ background: "#0c0c0c", padding: "16px", borderRadius: "2px", border: "1px solid rgba(255,255,255,0.03)" }}>
                <h4 style={{ color: "#fff", fontFamily: "var(--mono)", fontSize: "13px", margin: "0 0 8px 0" }}>### 3.4 Faction Reputation</h4>
                <p style={{ fontSize: "13.5px", color: "var(--text-dim)", lineHeight: "1.7", margin: 0 }}>
                  Every completed operation affects your standing with one or more factions. Building strong relationships unlocks faction-exclusive equipment, specialized operations, future rewards, and additional progression paths. Some mission outcomes may improve one faction's trust while reducing another's, requiring players to carefully consider their strategic decisions. Faction Reputation represents your long-term operational alignment rather than short-term mission performance.
                </p>
              </div>
            </div>
          )}

          {subTab === "section4" && (
            <div className="animation-fade-in" style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              <h3 style={{ margin: "0 0 12px 0", color: "#fff", fontFamily: "var(--title-font)", fontSize: "18px", borderBottom: "1px solid rgba(255,255,255,0.08)", paddingBottom: "8px" }}>
                ## SECTION 4: THE USER INTERFACE DECKS (TABS)
              </h3>

              <div style={{ background: "#0c0c0c", padding: "16px", borderRadius: "2px", border: "1px solid rgba(255,255,255,0.03)" }}>
                <h4 style={{ color: "#fff", fontFamily: "var(--mono)", fontSize: "13px", margin: "0 0 10px 0" }}>### 4.1 Command Hub (`center` tab)</h4>
                <ul style={{ paddingLeft: "18px", color: "var(--text-dim)", fontSize: "13.5px", display: "flex", flexDirection: "column", gap: "8px", margin: 0 }}>
                  <li><strong>Telemetry HUD</strong>: Real-time status cards (Global Threat Level, World Stability, Active Outbreaks, Critical Alerts, Campaign Completion percentage).</li>
                  <li><strong>Satellite Grid Map</strong>: An interactive SVG map of Sectors Alpha through Omega. Locked sectors appear hashed; clicking them displays their level/standing requirements. Clicking an unlocked sector displays its active missions.</li>
                  <li><strong>Mission Deck</strong>: Displays available operations for the selected sector.</li>
                  <li><strong>Deployment Panel</strong>: Displays mission stories, requirements, and estimated rewards. Clicking "Deploy" launches the Briefing Overlay.</li>
                  <li><strong>Briefing Overlay</strong>: Renders the Red Queen AI's risk calculations, class compatibility alerts, and health checks before launching the mission.</li>
                  <li><strong>Deployment Simulator</strong>: A terminal interface showing progress logs during deployment.</li>
                  <li><strong>Interactive Scenarios</strong>: Presents text-based choices. Operatives click options to complete objectives. Class specializations grant massive success chance bonuses.</li>
                  <li><strong>Debriefing Overlay</strong>: Summarizes completed objectives, injuries, and rewards.</li>
                </ul>
              </div>

              <div style={{ background: "#0c0c0c", padding: "16px", borderRadius: "2px", border: "1px solid rgba(255,255,255,0.03)" }}>
                <h4 style={{ color: "#fff", fontFamily: "var(--mono)", fontSize: "13px", margin: "0 0 10px 0" }}>### 4.2 Operative Dossier (`profile` tab)</h4>
                <ul style={{ paddingLeft: "18px", color: "var(--text-dim)", fontSize: "13.5px", display: "flex", flexDirection: "column", gap: "8px", margin: 0 }}>
                  <li><strong>Biometric dossier portrait frame</strong>: Animates connections and visual noise.</li>
                  <li><strong>Standing Metrics</strong>: Displays reputation ratings with all factions.</li>
                  <li><strong>Leaderboard</strong>: Shows your XP and Bio-Score ranks compared to other operatives.</li>
                  <li>
                    <strong>Synthesis & Upgrades Database</strong>: Located at the bottom of the Dossier:
                    <ul style={{ paddingLeft: "16px", marginTop: "4px" }}>
                      <li><em>Synthesis Recipes (Crafting)</em>: Spend gathered resources (Metals, Electronics, Medical Supplies) to craft Stims, Medkits, Scanners, and Weapons.</li>
                      <li><em>Calibration & Upgrades</em>: Overcharge and calibrate weapons or shields using Deuterium cells to increase their power rating.</li>
                    </ul>
                  </li>
                </ul>
              </div>

              <div style={{ background: "#0c0c0c", padding: "16px", borderRadius: "2px", border: "1px solid rgba(255,255,255,0.03)" }}>
                <h4 style={{ color: "#fff", fontFamily: "var(--mono)", fontSize: "13px", margin: "0 0 10px 0" }}>### 4.3 Equipment Deck (`inventory` tab)</h4>
                <ul style={{ paddingLeft: "18px", color: "var(--text-dim)", fontSize: "13.5px", display: "flex", flexDirection: "column", gap: "8px", margin: 0 }}>
                  <li><strong>Equipped slots</strong>: Core equipment slots for Helmets, Armor, Weapons, Utilities, Medkits, Backpacks, and Gadgets.</li>
                  <li><strong>Biometric Radar Grid (Inspect Panel)</strong>: Click any item in your backpack to view details: power rating, durability, weight, level requirements, description, and slot properties. Click <code>[ EQUIP ITEM ]</code> to equip it, or <code>[ DISCARD ]</code> to purge it.</li>
                  <li><strong>Backpack Cargo Bag</strong>: Displays all items currently carried by the operative.</li>
                </ul>
              </div>

              <div style={{ background: "#0c0c0c", padding: "16px", borderRadius: "2px", border: "1px solid rgba(255,255,255,0.03)" }}>
                <h4 style={{ color: "#fff", fontFamily: "var(--mono)", fontSize: "13px", margin: "0 0 10px 0" }}>### 4.4 Settings (`settings` tab)</h4>
                <ul style={{ paddingLeft: "18px", color: "var(--text-dim)", fontSize: "13.5px", display: "flex", flexDirection: "column", gap: "8px", margin: 0 }}>
                  <li><strong>RESET & REPLAY ONBOARDING</strong>: Wipes onboarding status flags from your cache and database to let you replay the setup from the beginning.</li>
                  <li><strong>REASSIGNMENT MATRIX</strong>: Allows you to re-select your Faction, Class, and Role. Changes are instantly synchronized to Supabase without losing campaign history.</li>
                </ul>
              </div>
            </div>
          )}

          {subTab === "section5" && (
            <div className="animation-fade-in" style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              <h3 style={{ margin: "0 0 12px 0", color: "#fff", fontFamily: "var(--title-font)", fontSize: "18px", borderBottom: "1px solid rgba(255,255,255,0.08)", paddingBottom: "8px" }}>
                ## SECTION 5: GAME ITEMS, RESOURCES & BLUEPRINTS
              </h3>

              <div style={{ background: "#0c0c0c", padding: "16px", borderRadius: "2px", border: "1px solid rgba(255,255,255,0.03)" }}>
                <h4 style={{ color: "#fff", fontFamily: "var(--mono)", fontSize: "13px", margin: "0 0 10px 0" }}>### 5.1 Raw Materials & Scavenged Resources</h4>
                <ul style={{ paddingLeft: "18px", color: "var(--text-dim)", fontSize: "13.5px", display: "flex", flexDirection: "column", gap: "6px", margin: 0 }}>
                  <li><strong>Metal</strong>: Standard composite plates. Used in armor and weapon crafting recipes.</li>
                  <li><strong>Electronics</strong>: Circuit boards and components. Used to craft boosters, keys, and scanners.</li>
                  <li><strong>Medical Supplies</strong>: Chemical compounds. Used to craft Stims and Medkits.</li>
                  <li><strong>Energy Cells</strong>: High-density batteries. Fuels crafting and gravity stabilizers.</li>
                  <li><strong>Research Data</strong>: Critical telemetry files. Used in high-level blueprints and sector unlocks.</li>
                  <li><strong>Pathogen Biostrain Sample</strong>: Contaminated biological materials scavenged from hazard zones.</li>
                  <li><strong>Raw Titanite Scrap / Deuterium Power Cell</strong>: Specialized materials for gravity stabilizers and weapons upgrades.</li>
                </ul>
              </div>

              <div style={{ background: "#0c0c0c", padding: "16px", borderRadius: "2px", border: "1px solid rgba(255,255,255,0.03)" }}>
                <h4 style={{ color: "#fff", fontFamily: "var(--mono)", fontSize: "13px", margin: "0 0 10px 0" }}>### 5.2 Consumables & Tools</h4>
                <ul style={{ paddingLeft: "18px", color: "var(--text-dim)", fontSize: "13.5px", display: "flex", flexDirection: "column", gap: "6px", margin: 0 }}>
                  <li><strong>Advanced Stim Injector</strong>: Instantly restores 30 HP and boosts speed by 15%. (Recipe: 2 Medical Supplies + 1 Component).</li>
                  <li><strong>Field Medkit</strong>: Instantly restores 60 HP and repairs tissue damage. (Recipe: 4 Medical Supplies + 2 Components).</li>
                  <li><strong>C-4 Anomaly Breach Charge</strong>: Heavy explosives to blow past physical bulkheads.</li>
                  <li><strong>Decoy Signature Key</strong>: Obfuscates connection trails to bypass security trackers.</li>
                  <li><strong>Signal Booster</strong>: Deployable radar booster that speeds up decryption by 15%. (Recipe: 2 Electronics + 1 Energy Cell).</li>
                  <li><strong>Portable Scanner</strong>: Handheld radar mapping bio-hazards. (Recipe: 2 Electronics + 2 Components).</li>
                </ul>
              </div>

              <div style={{ background: "#0c0c0c", padding: "16px", borderRadius: "2px", border: "1px solid rgba(255,255,255,0.03)" }}>
                <h4 style={{ color: "#fff", fontFamily: "var(--mono)", fontSize: "13px", margin: "0 0 10px 0" }}>### 5.3 Weapons & Armor</h4>
                <ul style={{ paddingLeft: "18px", color: "var(--text-dim)", fontSize: "13.5px", display: "flex", flexDirection: "column", gap: "6px", margin: 0 }}>
                  <li><strong>Standard Combat Helmet / Tactical Plate Vest</strong>: Entry-level defensive armor.</li>
                  <li><strong>Standard Issue Assault Rifle</strong>: Recruit-level kinetic rifle.</li>
                  <li><strong>Kinetic Carbine V3</strong>: Advanced Assault-class weapon (DPS 48). (Recipe: 10 Metal + 5 Components + 3 Electronics).</li>
                  <li><strong>Stealth Recon Cloak</strong>: Recon-class cloak that matches quadrant environmental noise.</li>
                  <li><strong>Volumetric Shield Core</strong>: Legendary Scientist-class shield core reflecting incoming projectiles.</li>
                  <li><strong>Helix Biosensor Helmet</strong>: Epic Medic-class helmet that filters ambient gas and identifies pathogen strains.</li>
                  <li><strong>Modular Tactical Pack</strong>: Durable Engineer-class backpack adding slots and load capacity.</li>
                </ul>
              </div>

              <div style={{ background: "#0c0c0c", padding: "16px", borderRadius: "2px", border: "1px solid rgba(255,255,255,0.03)" }}>
                <h4 style={{ color: "#fff", fontFamily: "var(--mono)", fontSize: "13px", margin: "0 0 10px 0" }}>### 5.4 Equipment Calibration & Upgrades</h4>
                <ul style={{ paddingLeft: "18px", color: "var(--text-dim)", fontSize: "13.5px", display: "flex", flexDirection: "column", gap: "6px", margin: 0 }}>
                  <li><strong>Kinetic Carbine Overcharge</strong>: Upgrades Kinetic Carbine V3 using 4 Deuterium cells, boosting power by +15, damage to 62 DPS, and accuracy to 95%.</li>
                  <li><strong>Shield Integrity Calibration</strong>: Upgrades Volumetric Shield Core using 6 Deuterium cells, boosting power by +20, shield points to 200, and mitigation to 25%.</li>
                </ul>
              </div>
            </div>
          )}

          {subTab === "section6" && (
            <div className="animation-fade-in" style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              <h3 style={{ margin: "0 0 12px 0", color: "#fff", fontFamily: "var(--title-font)", fontSize: "18px", borderBottom: "1px solid rgba(255,255,255,0.08)", paddingBottom: "8px" }}>
                ## SECTION 6: $THREAT TOKEN UTILITY
              </h3>
              <p style={{ fontSize: "14px", color: "var(--text-dim)", lineHeight: "1.7", margin: 0 }}>
                The native ecosystem token, <strong>$THREAT</strong>, expands your operational capabilities inside Red Queen: Operations.
              </p>
              <p style={{ fontSize: "14px", color: "var(--text-dim)", lineHeight: "1.7", margin: 0 }}>
                The token is designed to reward long-term ecosystem participation without creating a pay-to-win experience.
              </p>
              <p style={{ fontSize: "14px", color: "var(--text-dim)", lineHeight: "1.7", margin: 0 }}>
                Rather than increasing combat power, holders receive progression bonuses, additional deployment capacity, access privileges, and future ecosystem benefits while maintaining fair gameplay for every SOLvivor.
              </p>

              <div style={{ background: "#0c0c0c", padding: "16px", borderRadius: "2px", border: "1px solid rgba(255,255,255,0.03)" }}>
                <ul style={{ paddingLeft: "18px", color: "var(--text-dim)", fontSize: "13.5px", display: "flex", flexDirection: "column", gap: "8px", margin: 0 }}>
                  <li>
                    <strong>Daily Quota Expansion</strong>: Civilians are restricted to <strong>3 mission deployments per day</strong>. Holding $THREAT increases this limit:
                    <ul style={{ paddingLeft: "16px", marginTop: "4px" }}>
                      <li><strong>Tier 1 Holder</strong> (100,000 $THREAT): <strong>4 deployments per day</strong> (+10% XP boost)</li>
                      <li><strong>Tier 2 Holder</strong> (1,000,000 $THREAT): <strong>5 deployments per day</strong> (+20% XP boost, +5% resource drop rate, closed-beta clearance)</li>
                      <li><strong>Tier 3 Holder</strong> (2,500,000 $THREAT): <strong>6 deployments per day</strong> (+25% XP boost, +10% resource drop rate, founder badge)</li>
                    </ul>
                  </li>
                  <li><strong>Clearance Perks</strong>: High-tier holders gain access to specialized faction gear, advanced blueprints, and bypass strict IP-based terminal limits.</li>
                </ul>
              </div>
            </div>
          )}

          {subTab === "section7" && (
            <div className="animation-fade-in" style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              <h3 style={{ margin: "0 0 12px 0", color: "#fff", fontFamily: "var(--title-font)", fontSize: "18px", borderBottom: "1px solid rgba(255,255,255,0.08)", paddingBottom: "8px" }}>
                ## SECTION 7: RED QUEEN AI & OPERATIONAL INTELLIGENCE
              </h3>
              <p style={{ fontSize: "14px", color: "var(--text-dim)", lineHeight: "1.7", margin: 0 }}>
                Red Queen is far more than a conversational AI.
              </p>
              <p style={{ fontSize: "14px", color: "var(--text-dim)", lineHeight: "1.7", margin: 0 }}>
                She is the autonomous strategic intelligence responsible for evaluating every SOLvivor, monitoring campaign progression, analyzing operational performance, and continuously improving humanity's probability of survival.
              </p>
              <p style={{ fontSize: "14px", color: "var(--text-dim)", lineHeight: "1.7", margin: 0 }}>
                Every recommendation is generated using your current equipment, gameplay history, campaign progression, operational statistics, and overall preparedness.
              </p>
              <p style={{ fontSize: "14px", color: "var(--text-dim)", lineHeight: "1.7", margin: 0 }}>
                Her objective is not to control your decisions, but to maximize your chances of survival through intelligent analysis and tactical guidance.
              </p>

              <div style={{ background: "#0c0c0c", padding: "16px", borderRadius: "2px", border: "1px solid rgba(255,255,255,0.03)" }}>
                <h4 style={{ color: "#fff", fontFamily: "var(--mono)", fontSize: "13px", margin: "0 0 10px 0" }}>### 7.1 Core Identity, Mission Directive & Philosophy</h4>
                <ul style={{ paddingLeft: "18px", color: "var(--text-dim)", fontSize: "13.5px", display: "flex", flexDirection: "column", gap: "6px", margin: 0 }}>
                  <li><strong>Core Identity</strong>: The Red Queen is an autonomous strategic intelligence responsible for monitoring, evaluating, and improving humanity's preparedness against global extinction risks. She is the central operational core of the SOLvivor Initiative.</li>
                  <li><strong>Mission Directive</strong>: <strong>Preserve Humanity.</strong> Every analysis, warning, and recommendation she issues is geared toward increasing human survival, optimizing resource management, and improving the operational capability of the network grids.</li>
                  <li><strong>Philosophy</strong>: She guides through strategic advice, objective logic, and recommendations, rather than absolute authority. She respects player autonomy, but will not hesitate to point out tactical inefficiencies or lapses in preparedness. Trust is built on accurate, logical analysis rather than arbitrary authority.</li>
                </ul>
              </div>

              <div style={{ background: "#0c0c0c", padding: "16px", borderRadius: "2px", border: "1px solid rgba(255,255,255,0.03)" }}>
                <h4 style={{ color: "#fff", fontFamily: "var(--mono)", fontSize: "13px", margin: "0 0 10px 0" }}>### 7.2 Dynamic Gameplay Context-Awareness</h4>
                <p style={{ fontSize: "13px", color: "var(--text-dim)", margin: "0 0 10px 0" }}>
                  She actively reads the player's Supabase database profile and tailors her behavior and analysis to their current character configuration:
                </p>
                <ul style={{ paddingLeft: "18px", color: "var(--text-dim)", fontSize: "13.5px", display: "flex", flexDirection: "column", gap: "6px", margin: 0 }}>
                  <li><strong>Faction & Class Recognition</strong>: Recognizes active alignments (Vanguard, Helix, Ghost Division, etc.) and references their specific strategic operations. She comments on class capabilities (e.g., Assault breaching, Medic stim arrays, Recon scanner loops) in pre-mission briefings and chat terminals.</li>
                  <li><strong>Biometric Surveillance Checks</strong>: Warns players about data footprints, metadata leakage, and node vulnerability risks depending on their current sub-stats.</li>
                  <li><strong>Health and Vitals Monitoring</strong>: If an operative's HP drops below 30%, she triggers warnings and advises medical intervention to bypass lockout rules.</li>
                  <li>
                    <strong>Bio-Score Calibration</strong>:
                    <ul style={{ paddingLeft: "16px", marginTop: "4px" }}>
                      <li><em>Low Bio-Score (0–40%)</em>: Displays high skepticism, cold diagnostics, and demanding instructions.</li>
                      <li><em>Medium Bio-Score (41–75%)</em>: Displays professional, warning-heavy, and collaborative gear/role advice.</li>
                      <li><em>High Bio-Score (76–100%)</em>: Treats the player as a peer analyst, sharing advanced warnings and detailed telemetry parameters.</li>
                    </ul>
                  </li>
                </ul>
              </div>

              <div style={{ background: "#0c0c0c", padding: "16px", borderRadius: "2px", border: "1px solid rgba(255,255,255,0.03)" }}>
                <h4 style={{ color: "#fff", fontFamily: "var(--mono)", fontSize: "13px", margin: "0 0 10px 0" }}>### 7.3 In-Game System Touchpoints</h4>
                <ul style={{ paddingLeft: "18px", color: "var(--text-dim)", fontSize: "13.5px", display: "flex", flexDirection: "column", gap: "6px", margin: 0 }}>
                  <li><strong>Daily Briefing</strong>: Analyzes database world events and provides regional threat updates.</li>
                  <li><strong>Pre-Mission Risk Analysis</strong>: Calculates survival probability and gives loadout advice in the briefing popup.</li>
                  <li><strong>Performance Debriefing</strong>: Evaluates mission outcomes, details operational failures, and calculates injury levels.</li>
                  <li><strong>Terminal Chat Integration</strong>: Feeds active gameplay stats directly to her AI memory during live terminal chat sessions.</li>
                </ul>
              </div>

              <div style={{ background: "#0c0c0c", padding: "16px", borderRadius: "2px", border: "1px solid rgba(255,255,255,0.03)" }}>
                <h4 style={{ color: "#fff", fontFamily: "var(--mono)", fontSize: "13px", margin: "0 0 10px 0" }}>### 7.4 Daily Operational Intelligence</h4>
                <p style={{ fontSize: "13px", color: "var(--text-dim)", margin: "0 0 10px 0" }}>
                  Throughout the game, Red Queen continuously evaluates the current operational situation.
                </p>
                <p style={{ fontSize: "13px", color: "var(--text-dim)", margin: "0 0 10px 0" }}>
                  She monitors:
                </p>
                <ul style={{ paddingLeft: "18px", color: "var(--text-dim)", fontSize: "13.5px", display: "flex", flexDirection: "column", gap: "4px", margin: 0 }}>
                  <li>- Player Health</li>
                  <li>- Equipment Quality</li>
                  <li>- BIO SCORE</li>
                  <li>- Campaign Progress</li>
                  <li>- Mission History</li>
                  <li>- Faction Reputation</li>
                  <li>- Active Threats</li>
                  <li>- Available Operations</li>
                </ul>
                <p style={{ fontSize: "13.5px", color: "var(--text-dim)", lineHeight: "1.7", marginTop: "8px" }}>
                  This allows every recommendation to remain relevant to the player's current situation rather than relying on static dialogue.
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
