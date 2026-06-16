"use client";
import Link from "next/link";
import SolvivalIcon from "@/components/SolvivalIcon";

export default function RoadmapPage() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", paddingTop: "80px", background: "#050505", color: "#fff" }}>
      {/* Header section */}
      <div style={{ borderBottom: "1px solid rgba(255, 77, 77, 0.15)", padding: "80px 24px", background: "linear-gradient(180deg, rgba(255, 77, 77, 0.05) 0%, rgba(5,5,5,0) 100%)" }}>
        <div className="container" style={{ maxWidth: "1000px", margin: "0 auto", textAlign: "center" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "10px", padding: "10px 20px", border: "1px solid rgba(255, 77, 77, 0.4)", borderRadius: "30px", background: "rgba(255, 77, 77, 0.05)", marginBottom: "24px" }}>
            <SolvivalIcon size={24} />
            <span style={{ fontSize: "13px", fontFamily: "var(--mono)", letterSpacing: "0.2em", color: "var(--accent)", fontWeight: "bold" }}>MAIN SYSTEM ROADMAP</span>
          </div>
          <h1 className="glow-text" style={{ fontSize: "clamp(42px, 7vw, 64px)", margin: "0 0 20px", fontFamily: "var(--title-font)", fontWeight: "900", letterSpacing: "0.08em", textTransform: "uppercase", lineHeight: "1.1" }}>
            RED QUEEN <span style={{ color: "var(--accent)" }}>ROADMAP</span>
          </h1>
          <p style={{ fontSize: "18px", color: "var(--text-dim)", maxWidth: "800px", margin: "0 auto", lineHeight: "1.8", fontFamily: "var(--sans)" }}>
            The planned direction of the Red Queen Surveillance Ecosystem on Solana. This is a living document, actively open to community feedback and suggestions to shape this plan.
          </p>
        </div>
      </div>

      {/* Content Area */}
      <div className="container" style={{ maxWidth: "1000px", margin: "0 auto", padding: "64px 24px", display: "flex", flexDirection: "column", gap: "64px" }}>
        
        {/* Core Vision Panel */}
        <div className="panel" style={{ background: "rgba(255, 77, 77, 0.02)", borderColor: "rgba(255, 77, 77, 0.25)", padding: "40px", borderRadius: "4px" }}>
          <h3 style={{ fontSize: "20px", color: "var(--accent)", marginBottom: "16px", fontFamily: "var(--mono)", letterSpacing: "0.05em", fontWeight: "bold" }}>THE VISION</h3>
          <p style={{ fontSize: "16px", color: "var(--text-dim)", lineHeight: "1.8", margin: 0 }}>
            The vision is to build a comprehensive Surveillance Ecosystem and Intelligence Survival Terminal on Solana. Red Queen is designed as a central intelligence mainframe that aggregates real-time threat telemetry, tracks player clearances through survival performance, and operates as an autonomous, self-funding agent. Through this protocol, SOLvivors can analyze live environmental data, complete critical tasks to support the network, and participate in a persistent, AI-governed survival simulation.
          </p>
        </div>

        {/* Part 1: Current State */}
        <div>
          <h2 style={{ fontSize: "28px", color: "#fff", marginBottom: "32px", fontFamily: "var(--title-font)", letterSpacing: "0.08em", borderBottom: "2px solid rgba(255,255,255,0.08)", paddingBottom: "16px" }}>PART 1: ACTIVE SYSTEMS & LIVE BUILD</h2>
          
          <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
            
            {/* 1. Terminal Console */}
            <div className="panel" style={{ background: "#0c0c0c", padding: "40px", borderColor: "rgba(255,255,255,0.04)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "12px", marginBottom: "16px" }}>
                <h4 style={{ fontSize: "18px", color: "#fff", margin: 0, fontFamily: "var(--mono)", letterSpacing: "0.02em", fontWeight: "bold" }}>1. THE MAIN TERMINAL CONSOLE</h4>
                <span style={{ fontSize: "11px", fontFamily: "var(--mono)", background: "rgba(0, 255, 204, 0.1)", color: "#00ffcc", padding: "4px 10px", border: "1px solid rgba(0, 255, 204, 0.2)", borderRadius: "2px" }}>ROUTE: /terminal</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px", fontSize: "16px", color: "var(--text-dim)", lineHeight: "1.7", marginBottom: "24px" }}>
                <p>
                  <strong style={{ color: "var(--accent)", fontSize: "13px", fontFamily: "var(--mono)", display: "inline-block", width: "140px" }}>WHAT IT IS //</strong>
                  The central communication interface and digital entry point.
                </p>
                <p>
                  <strong style={{ color: "var(--accent)", fontSize: "13px", fontFamily: "var(--mono)", display: "inline-block", width: "140px" }}>HOW IT WORKS //</strong>
                  The primary screen where SOLvivors chat and interact directly with the Red Queen AI to query system statuses, run diagnostic checks, and access database records.
                </p>
              </div>
              <Link href="/terminal" style={{ fontSize: "13px", color: "#00e5ff", textDecoration: "underline", fontFamily: "var(--mono)", fontWeight: "bold", letterSpacing: "0.05em" }}>
                Access Console [/terminal] &rarr;
              </Link>
            </div>

            {/* 2. Threats Dashboard */}
            <div className="panel" style={{ background: "#0c0c0c", padding: "40px", borderColor: "rgba(255,255,255,0.04)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "12px", marginBottom: "16px" }}>
                <h4 style={{ fontSize: "18px", color: "#fff", margin: 0, fontFamily: "var(--mono)", letterSpacing: "0.02em", fontWeight: "bold" }}>2. THE LIVE THREATS DASHBOARD</h4>
                <span style={{ fontSize: "11px", fontFamily: "var(--mono)", background: "rgba(0, 255, 204, 0.1)", color: "#00ffcc", padding: "4px 10px", border: "1px solid rgba(0, 255, 204, 0.2)", borderRadius: "2px" }}>ROUTE: /</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px", fontSize: "16px", color: "var(--text-dim)", lineHeight: "1.7", marginBottom: "24px" }}>
                <p>
                  <strong style={{ color: "var(--accent)", fontSize: "13px", fontFamily: "var(--mono)", display: "inline-block", width: "140px" }}>WHAT IT IS //</strong>
                  The real-world telemetry monitoring interface on the homepage.
                </p>
                <p>
                  <strong style={{ color: "var(--accent)", fontSize: "13px", fontFamily: "var(--mono)", display: "inline-block", width: "140px" }}>HOW IT WORKS //</strong>
                  A live terminal feed rendering the Threat of the Day, global containment criticality indices, and active environmental warning alerts.
                </p>
              </div>
              <Link href="/" style={{ fontSize: "13px", color: "#00e5ff", textDecoration: "underline", fontFamily: "var(--mono)", fontWeight: "bold", letterSpacing: "0.05em" }}>
                Access Dashboard [/] &rarr;
              </Link>
            </div>

            {/* 3. All Threats DB */}
            <div className="panel" style={{ background: "#0c0c0c", padding: "40px", borderColor: "rgba(255,255,255,0.04)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "12px", marginBottom: "16px" }}>
                <h4 style={{ fontSize: "18px", color: "#fff", margin: 0, fontFamily: "var(--mono)", letterSpacing: "0.02em", fontWeight: "bold" }}>3. THE ALL-THREATS DATABASE</h4>
                <span style={{ fontSize: "11px", fontFamily: "var(--mono)", background: "rgba(0, 255, 204, 0.1)", color: "#00ffcc", padding: "4px 10px", border: "1px solid rgba(0, 255, 204, 0.2)", borderRadius: "2px" }}>ROUTE: /threat-vector</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px", fontSize: "16px", color: "var(--text-dim)", lineHeight: "1.7", marginBottom: "24px" }}>
                <p>
                  <strong style={{ color: "var(--accent)", fontSize: "13px", fontFamily: "var(--mono)", display: "inline-block", width: "140px" }}>WHAT IT IS //</strong>
                  The complete archive of active and historical threat vectors tracked by the mainframe's sensors.
                </p>
                <p>
                  <strong style={{ color: "var(--accent)", fontSize: "13px", fontFamily: "var(--mono)", display: "inline-block", width: "140px" }}>HOW IT WORKS //</strong>
                  SOLvivors can browse through all threat vectors cataloged by the mainframe's sensors, filtering by hazard sector, checking historical incident alerts, and accessing detailed dossiers for each threat index.
                </p>
              </div>
              <Link href="/threat-vector" style={{ fontSize: "13px", color: "#00e5ff", textDecoration: "underline", fontFamily: "var(--mono)", fontWeight: "bold", letterSpacing: "0.05em" }}>
                Access Vectors [/threat-vector] &rarr;
              </Link>
            </div>

            {/* 4. Profile Dashboard */}
            <div className="panel" style={{ background: "#0c0c0c", padding: "40px", borderColor: "rgba(255,255,255,0.04)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "12px", marginBottom: "16px" }}>
                <h4 style={{ fontSize: "18px", color: "#fff", margin: 0, fontFamily: "var(--mono)", letterSpacing: "0.02em", fontWeight: "bold" }}>4. THE SOLVIVOR PROFILE DASHBOARD</h4>
                <span style={{ fontSize: "11px", fontFamily: "var(--mono)", background: "rgba(0, 255, 204, 0.1)", color: "#00ffcc", padding: "4px 10px", border: "1px solid rgba(0, 255, 204, 0.2)", borderRadius: "2px" }}>ROUTE: /operative</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px", fontSize: "16px", color: "var(--text-dim)", lineHeight: "1.7", marginBottom: "24px" }}>
                <p>
                  <strong style={{ color: "var(--accent)", fontSize: "13px", fontFamily: "var(--mono)", display: "inline-block", width: "140px" }}>WHAT IT IS //</strong>
                  Your personal mainframe command center.
                </p>
                <p>
                  <strong style={{ color: "var(--accent)", fontSize: "13px", fontFamily: "var(--mono)", display: "inline-block", width: "140px" }}>HOW IT WORKS //</strong>
                  You can create your profile using either a standard email login or a Solana wallet. The system initializes your profile, tracks your total XP, calculates your level, and displays your active survival stats (Technical Preparedness, Surveillance Resistance, Physical Fortitude), as well as your active tasks and bounties progress.
                </p>
                <p>
                  <strong style={{ color: "var(--accent)", fontSize: "13px", fontFamily: "var(--mono)", display: "inline-block", width: "140px" }}>YOUR STATS //</strong>
                  Every action you take improves your technical preparedness, surveillance resistance, and physical fortitude.
                </p>
                <p style={{ fontStyle: "italic" }}>
                  <strong style={{ color: "var(--accent)", fontSize: "13px", fontFamily: "var(--mono)", display: "inline-block", width: "140px" }}>UX DIRECTION //</strong>
                  I will continue making layout improvements to the user profile dashboard to enhance the telemetry visualization and interactivity.
                </p>
              </div>
              <Link href="/operative" style={{ fontSize: "13px", color: "#00e5ff", textDecoration: "underline", fontFamily: "var(--mono)", fontWeight: "bold", letterSpacing: "0.05em" }}>
                Access Profile [/operative] &rarr;
              </Link>
            </div>

            {/* 5. Hub */}
            <div className="panel" style={{ background: "#0c0c0c", padding: "40px", borderColor: "rgba(255,255,255,0.04)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "12px", marginBottom: "16px" }}>
                <h4 style={{ fontSize: "18px", color: "#fff", margin: 0, fontFamily: "var(--mono)", letterSpacing: "0.02em", fontWeight: "bold" }}>5. THE SOLVIVORS HUB</h4>
                <span style={{ fontSize: "11px", fontFamily: "var(--mono)", background: "rgba(0, 255, 204, 0.1)", color: "#00ffcc", padding: "4px 10px", border: "1px solid rgba(0, 255, 204, 0.2)", borderRadius: "2px" }}>ROUTE: /solvivors</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px", fontSize: "16px", color: "var(--text-dim)", lineHeight: "1.7", marginBottom: "24px" }}>
                <p>
                  <strong style={{ color: "var(--accent)", fontSize: "13px", fontFamily: "var(--mono)", display: "inline-block", width: "140px" }}>WHAT IT IS //</strong>
                  The community mission and media dashboard.
                </p>
                <p>
                  <strong style={{ color: "var(--accent)", fontSize: "13px", fontFamily: "var(--mono)", display: "inline-block", width: "140px" }}>HOW IT WORKS //</strong>
                  The hub acts as a dashboard that currently has one active section and three locked sectors scheduled to open soon:
                </p>
                <ul style={{ paddingLeft: "32px", display: "flex", flexDirection: "column", gap: "8px" }}>
                  <li><strong>Operations (LIVE Now):</strong> Access active tasks (social work) and bounties (coding and creation challenges) to submit proofs and earn rewards.</li>
                  <li><strong>Broadcasts (Opening Soon):</strong> Real-time tactical transmissions and news feeds.</li>
                  <li><strong>Lore (Opening Soon):</strong> Survivor diaries and system archives explaining the collapse.</li>
                  <li><strong>Comics (Opening Soon):</strong> Graphic archives and media files detailing the story.</li>
                </ul>
              </div>
              <Link href="/solvivors" style={{ fontSize: "13px", color: "#00e5ff", textDecoration: "underline", fontFamily: "var(--mono)", fontWeight: "bold", letterSpacing: "0.05em" }}>
                Access Hub [/solvivors] &rarr;
              </Link>
            </div>

            {/* 6. pay.sh */}
            <div className="panel" style={{ background: "#0c0c0c", padding: "40px", borderColor: "rgba(255,255,255,0.04)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "12px", marginBottom: "16px" }}>
                <h4 style={{ fontSize: "18px", color: "#fff", margin: 0, fontFamily: "var(--mono)", letterSpacing: "0.02em", fontWeight: "bold" }}>6. pay.sh & x402 TELEMETRY GATEWAY</h4>
                <span style={{ fontSize: "11px", fontFamily: "var(--mono)", background: "rgba(0, 255, 204, 0.1)", color: "#00ffcc", padding: "4px 10px", border: "1px solid rgba(0, 255, 204, 0.2)", borderRadius: "2px" }}>GATEWAY ACTIVE</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px", fontSize: "16px", color: "var(--text-dim)", lineHeight: "1.7" }}>
                <p>
                  <strong style={{ color: "var(--accent)", fontSize: "13px", fontFamily: "var(--mono)", display: "inline-block", width: "140px" }}>WHAT IT IS //</strong>
                  A pay-per-use payment system built directly into the API endpoints using the pay.sh specifications and x402 protocol standards.
                </p>
                <p>
                  <strong style={{ color: "var(--accent)", fontSize: "13px", fontFamily: "var(--mono)", display: "inline-block", width: "140px" }}>HOW IT WORKS //</strong>
                  Premium briefs are protected by x402 paywalls. SOLvivors pay a tiny micro-fee (0.01 or 0.02 USDC) directly from their wallets. The decryption settles in under 400 milliseconds.
                </p>
                
                <div style={{ marginTop: "12px", border: "1px dashed rgba(0, 255, 204, 0.15)", padding: "20px", background: "rgba(0,255,204,0.01)" }}>
                  <strong style={{ color: "#00ffcc", fontSize: "12px", fontFamily: "var(--mono)", display: "block", marginBottom: "8px" }}>LIVE FEEDS AVAILABLE NOW:</strong>
                  <ul style={{ paddingLeft: "20px", display: "flex", flexDirection: "column", gap: "6px", fontSize: "14.5px" }}>
                    <li><strong>Premium Intel Endpoint (<code>/api/intel/premium</code>):</strong> Returns real-time USGS earthquakes, NASA natural hazard maps, and global pathogen metrics (gated at 0.01 USDC).</li>
                    <li><strong>Solana Telemetry Endpoint (<code>/api/intel/depin</code>):</strong> Returns live Solana block data, priority fee averages, and validator node status directly from the mainnet (gated at 0.02 USDC).</li>
                  </ul>
                </div>

                <p style={{ marginTop: "8px" }}>
                  <strong style={{ color: "var(--accent)", fontSize: "13px", fontFamily: "var(--mono)", display: "inline-block", width: "140px" }}>TREASURY LOOP //</strong>
                  100% of the USDC collected from these paywalls goes to the Red Queen Treasury. Once the treasury hits 10 USDC, the backend autonomously swaps the USDC on Jupiter to buy back and lock the native <strong>$THREAT</strong> token.
                </p>
              </div>
            </div>

          </div>
        </div>

        {/* Part 2: Future Roadmap */}
        <div>
          <h2 style={{ fontSize: "28px", color: "#fff", marginBottom: "32px", fontFamily: "var(--title-font)", letterSpacing: "0.08em", borderBottom: "2px solid rgba(255,255,255,0.08)", paddingBottom: "16px" }}>PART 2: THE FUTURE ROADMAP (WHAT IS COMING NEXT)</h2>
          
          <p style={{ fontSize: "17px", color: "var(--text-dim)", marginBottom: "32px", lineHeight: "1.7" }}>
            The goal is to evolve the Red Queen from a telemetry tool into a living, AI-controlled apocalypse simulation where the world itself is the main character.
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
            
            {/* Step 1 */}
            <div className="panel" style={{ background: "#0a0a0a", padding: "40px", borderColor: "rgba(255,255,255,0.04)" }}>
              <span style={{ fontSize: "12px", color: "var(--accent)", fontFamily: "var(--mono)", display: "block", marginBottom: "8px", letterSpacing: "0.1em", fontWeight: "bold" }}>STEP 01 // MAIN ENGINE</span>
              <h4 style={{ fontSize: "18px", color: "#fff", margin: "0 0 16px 0", fontFamily: "var(--sans)", fontWeight: "bold" }}>Dynamic Daily Threat Forecasts</h4>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px", fontSize: "16px", color: "var(--text-dim)", lineHeight: "1.7" }}>
                <p>
                  <strong style={{ color: "var(--accent)", fontSize: "12px", fontFamily: "var(--mono)", display: "inline-block", width: "140px" }}>THE GOAL //</strong>
                  Make the daily threat briefings on the homepage dynamically generated by AI.
                </p>
                <p>
                  <strong style={{ color: "var(--accent)", fontSize: "12px", fontFamily: "var(--mono)", display: "inline-block", width: "140px" }}>HOW IT WORKS //</strong>
                  The Red Queen AI will automatically scan real-world datasets (like global USGS earthquake feeds and NASA weather hazards) and compile a custom, lore-rich apocalypse report every single day.
                </p>
              </div>
            </div>

            {/* Step 2 */}
            <div className="panel" style={{ background: "#0a0a0a", padding: "40px", borderColor: "rgba(255,255,255,0.04)" }}>
              <span style={{ fontSize: "12px", color: "var(--accent)", fontFamily: "var(--mono)", display: "block", marginBottom: "8px", letterSpacing: "0.1em", fontWeight: "bold" }}>STEP 02 // COMPETITION</span>
              <h4 style={{ fontSize: "18px", color: "#fff", margin: "0 0 16px 0", fontFamily: "var(--sans)", fontWeight: "bold" }}>The SOLvivor Leaderboard & SOLvive Seasons</h4>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px", fontSize: "16px", color: "var(--text-dim)", lineHeight: "1.7" }}>
                <p>
                  <strong style={{ color: "var(--accent)", fontSize: "12px", fontFamily: "var(--mono)", display: "inline-block", width: "140px" }}>THE GOAL //</strong>
                  Create a competitive tracking system and define targets for your BIO-SCORE.
                </p>
                <p>
                  <strong style={{ color: "var(--accent)", fontSize: "12px", fontFamily: "var(--mono)", display: "inline-block", width: "140px" }}>HOW IT WORKS //</strong>
                  A public Leaderboard page will be deployed displaying all SOLvivors sorted by level, total XP, and completed quests. To drive participation, I plan to introduce competitive <strong>SOLvive Seasons with rewards</strong> distributed to the highest-ranking survivors. Your level and BIO-SCORE will unlock narrative ranks (from Candidate to Specialist, all the way to elite <strong>SOLvivor</strong> status), giving you access to exclusive terminal themes, restricted archives, and higher-paying missions.
                </p>
              </div>
            </div>

            {/* Step 3 */}
            <div className="panel" style={{ background: "#0a0a0a", padding: "40px", borderColor: "rgba(255,255,255,0.04)" }}>
              <span style={{ fontSize: "12px", color: "var(--accent)", fontFamily: "var(--mono)", display: "block", marginBottom: "8px", letterSpacing: "0.1em", fontWeight: "bold" }}>STEP 03 // UX POLISH</span>
              <h4 style={{ fontSize: "18px", color: "#fff", margin: "0 0 16px 0", fontFamily: "var(--sans)", fontWeight: "bold" }}>Immersive UI & UX Upgrades</h4>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px", fontSize: "16px", color: "var(--text-dim)", lineHeight: "1.7" }}>
                <p>
                  <strong style={{ color: "var(--accent)", fontSize: "12px", fontFamily: "var(--mono)", display: "inline-block", width: "140px" }}>THE GOAL //</strong>
                  Build a highly interactive terminal console.
                </p>
                <p>
                  <strong style={{ color: "var(--accent)", fontSize: "12px", fontFamily: "var(--mono)", display: "inline-block", width: "140px" }}>HOW IT WORKS //</strong>
                  I will continue polishing the interface, adding more interactive elements, terminal-style transitions, and visual detailing that aligns closely with the core lore.
                </p>
              </div>
            </div>

            {/* Step 4 */}
            <div className="panel" style={{ background: "#0a0a0a", padding: "40px", borderColor: "rgba(255,255,255,0.04)" }}>
              <span style={{ fontSize: "12px", color: "var(--accent)", fontFamily: "var(--mono)", display: "block", marginBottom: "8px", letterSpacing: "0.1em", fontWeight: "bold" }}>STEP 04 // MOBILE</span>
              <h4 style={{ fontSize: "18px", color: "#fff", margin: "0 0 16px 0", fontFamily: "var(--sans)", fontWeight: "bold" }}>Solana Seeker Phone Mobile Optimization</h4>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px", fontSize: "16px", color: "var(--text-dim)", lineHeight: "1.7" }}>
                <p>
                  <strong style={{ color: "var(--accent)", fontSize: "12px", fontFamily: "var(--mono)", display: "inline-block", width: "140px" }}>THE GOAL //</strong>
                  Optimized mobile experience for handheld terminal operations.
                </p>
                <p>
                  <strong style={{ color: "var(--accent)", fontSize: "12px", fontFamily: "var(--mono)", display: "inline-block", width: "140px" }}>HOW IT WORKS //</strong>
                  An improved mobile version tailored specifically for the Solana Seeker Phone will be released. This version will offer additional bonuses and exclusive clearance rewards for Seeker users.
                </p>
              </div>
            </div>

            {/* Step 5 */}
            <div className="panel" style={{ background: "#0a0a0a", padding: "40px", borderColor: "rgba(255,255,255,0.04)" }}>
              <span style={{ fontSize: "12px", color: "var(--accent)", fontFamily: "var(--mono)", display: "block", marginBottom: "8px", letterSpacing: "0.1em", fontWeight: "bold" }}>STEP 05 // CONNECTIONS</span>
              <h4 style={{ fontSize: "18px", color: "#fff", margin: "0 0 16px 0", fontFamily: "var(--sans)", fontWeight: "bold" }}>pay.sh Directory & Agent-to-Agent Accessibility</h4>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px", fontSize: "16px", color: "var(--text-dim)", lineHeight: "1.7" }}>
                <p>
                  <strong style={{ color: "var(--accent)", fontSize: "12px", fontFamily: "var(--mono)", display: "inline-block", width: "140px" }}>THE GOAL //</strong>
                  Open the Red Queen data feeds to the broader Solana developer ecosystem and AI agents.
                </p>
                <p>
                  <strong style={{ color: "var(--accent)", fontSize: "12px", fontFamily: "var(--mono)", display: "inline-block", width: "140px" }}>HOW IT WORKS //</strong>
                  By registering our endpoints in the official pay.sh directory, Red Queen's specialized threat intelligence becomes discoverable to the entire developer community. External autonomous AI agents will be able to query terminal APIs directly, paying in USDC to receive our specialized DePIN and environment data.
                </p>
                <p>
                  <strong style={{ color: "var(--accent)", fontSize: "12px", fontFamily: "var(--mono)", display: "inline-block", width: "140px" }}>MCP SERVER //</strong>
                  I will build a native Model Context Protocol (MCP) server for Red Queen. This allows other AI agents (such as custom LLMs and developer copilots) to connect to the mainframe directly as a specialized tool to receive threat data.
                </p>
              </div>
            </div>

            {/* Step 6 */}
            <div className="panel" style={{ background: "#0a0a0a", padding: "40px", borderColor: "rgba(255,255,255,0.04)" }}>
              <span style={{ fontSize: "12px", color: "var(--accent)", fontFamily: "var(--mono)", display: "block", marginBottom: "8px", letterSpacing: "0.1em", fontWeight: "bold" }}>STEP 06 // B2B TELEMETRY</span>
              <h4 style={{ fontSize: "18px", color: "#fff", margin: "0 0 16px 0", fontFamily: "var(--sans)", fontWeight: "bold" }}>Expanding Telemetry via x402 Payments</h4>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px", fontSize: "16px", color: "var(--text-dim)", lineHeight: "1.7" }}>
                <p>
                  <strong style={{ color: "var(--accent)", fontSize: "12px", fontFamily: "var(--mono)", display: "inline-block", width: "140px" }}>THE GOAL //</strong>
                  Increase the data depth of the Red Queen mainframe.
                </p>
                <p>
                  <strong style={{ color: "var(--accent)", fontSize: "12px", fontFamily: "var(--mono)", display: "inline-block", width: "140px" }}>HOW IT WORKS //</strong>
                  The Red Queen agent will autonomously query more external paid developer APIs using stablecoin micropayments, expanding the central database with fresh feeds from other platforms.
                </p>
              </div>
            </div>

            {/* Step 7 */}
            <div className="panel" style={{ background: "#0a0a0a", borderColor: "rgba(255, 77, 77, 0.25)", padding: "40px" }}>
              <span style={{ fontSize: "12px", color: "var(--accent)", fontFamily: "var(--mono)", display: "block", marginBottom: "8px", letterSpacing: "0.1em", fontWeight: "bold" }}>STEP 07 // SIMULATION OVERLAY</span>
              <h4 style={{ fontSize: "22px", color: "#fff", margin: "0 0 24px 0", fontFamily: "var(--title-font)", fontWeight: "bold" }}>The Red Queen Apocalypse Simulation & Items Marketplace</h4>
              
              <div style={{ display: "flex", flexDirection: "column", gap: "24px", fontSize: "16px", color: "var(--text-dim)", lineHeight: "1.8" }}>
                <p>
                  <strong style={{ color: "var(--accent)", fontSize: "12px", fontFamily: "var(--mono)", display: "inline-block", width: "140px" }}>THE GOAL //</strong>
                  A living simulation and marketplace where survival meets strategy.
                </p>
                <p>
                  This is the core gameplay integration where players survive inside a persistent, AI-governed virtual world. Rather than a traditional survival MMO, strategy game, or clicker, this is a living, AI-controlled apocalypse simulation where players become operatives trying to survive a constantly evolving world.
                </p>

                <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "20px" }}>
                  <h5 style={{ color: "#fff", fontSize: "16px", marginBottom: "10px", fontFamily: "var(--mono)", fontWeight: "bold" }}>The World Layer</h5>
                  <p>
                    The player enters the world as a new survivor. Instead of selecting a class, they align themselves with a faction that determines how they interact with the collapse:
                  </p>
                  <ul style={{ paddingLeft: "32px", margin: "12px 0", display: "flex", flexDirection: "column", gap: "6px" }}>
                    <li><strong>Nomads:</strong> Survive by moving, scavenging, and adapting.</li>
                    <li><strong>Scientists:</strong> Survive by researching threats and unlocking information.</li>
                    <li><strong>Marauders:</strong> Survive by taking resources from others.</li>
                    <li><strong>Governments:</strong> Try to control territories and populations.</li>
                    <li><strong>Engineers:</strong> Rebuild infrastructure and fortify sectors.</li>
                    <li><strong>Hackers:</strong> Manipulate systems and intelligence.</li>
                    <li><strong>Bunker Syndicates:</strong> Protect wealth and technology underground.</li>
                  </ul>
                  <p style={{ marginTop: "12px" }}>
                    Every day, Red Queen generates global events (virus mutations, grid collapses, communication failures). Every player sees the same event but reacts based on their faction. For example:
                  </p>
                  <div style={{ margin: "12px 0", padding: "16px", borderLeft: "3px solid var(--accent)", background: "rgba(255, 77, 77, 0.02)", fontFamily: "var(--mono)", fontSize: "14.5px" }}>
                    &quot;H5N1 outbreak detected in Sector-7.&quot;<br />
                    - Scientists investigate the mutation.<br />
                    - Governments attempt to suppress panic.<br />
                    - Nomads flee before quarantine begins.<br />
                    - Marauders raid evacuation routes.<br />
                    - Engineers try to stabilize infrastructure.<br />
                    - Hackers leak classified information.
                  </div>
                  <p>
                    Every action contributes to a global outcome. Regions can collapse, stabilize, rise, or fall. Safe zones can become war zones. Entire seasons will tell unique stories.
                  </p>
                </div>

                <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "20px" }}>
                  <h5 style={{ color: "#fff", fontSize: "16px", marginBottom: "10px", fontFamily: "var(--mono)", fontWeight: "bold" }}>The Survival Layer & cNFT Cards</h5>
                  <p>
                    Every player has a persistent identity. Instead of levels alone, players accumulate a BIO-SCORE representing survival effectiveness. It becomes a permanent reputation system alongside achievements and territory ownership. High-ranking players eventually become **SOLvivors** (elite operatives recognized by Red Queen, gaining access to classified missions, advanced intelligence, and restricted sectors).
                  </p>
                  <p style={{ marginTop: "10px" }}>
                    To represent this identity on-chain, I will implement **Solana Compressed NFTs (cNFTs)** as character cards. The Red Queen AI will autonomously decide which character card profile is best for you based on your history of decisions and actions.
                  </p>
                </div>

                <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "20px" }}>
                  <h5 style={{ color: "#fff", fontSize: "16px", marginBottom: "10px", fontFamily: "var(--mono)", fontWeight: "bold" }}>Tactical PvP Combat</h5>
                  <p>
                    PvP will not be shooter-style combat. It is a brutal tactical prediction game. When two players fight, they concurrently choose where to attack (Head, Torso, Arms, Legs) and what to protect. The outcome is based on strategy rather than speed:
                  </p>
                  <ul style={{ paddingLeft: "32px", margin: "12px 0", display: "flex", flexDirection: "column", gap: "6px" }}>
                    <li>An injured arm reduces combat effectiveness.</li>
                    <li>An injured leg reduces mobility and escape chances.</li>
                    <li>A head strike carries high risk but potentially devastating rewards.</li>
                  </ul>
                  <p style={{ marginTop: "10px" }}>
                    Faction abilities create variety: Scientists use biological attacks, Nomads gain superior mobility, Marauders hit harder, Hackers disable systems, Governments deploy support assets, and Bunker Syndicates access superior equipment.
                  </p>
                </div>

                <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "20px" }}>
                  <h5 style={{ color: "#fff", fontSize: "16px", marginBottom: "10px", fontFamily: "var(--mono)", fontWeight: "bold" }}>Items Marketplace & Revenue Sharing</h5>
                  <p>
                    A trading marketplace will allow SOLvivors to trade gear, resources, and blueprints. Transactions collect fee cuts. A portion of transaction fees is shared back with <strong>$THREAT</strong> holders as passive yields, and another portion is used by the Red Queen agent for automated buybacks.
                  </p>
                </div>

                <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "20px" }}>
                  <h5 style={{ color: "#fff", fontSize: "16px", marginBottom: "10px", fontFamily: "var(--mono)", fontWeight: "bold" }}>The AI Game Master</h5>
                  <p>
                    Throughout everything, Red Queen acts as a live AI Game Master. She comments on battles, announces global threats, generates missions, creates propaganda, records history, and adapts the world to player behavior, becoming the narrator of the apocalypse.
                  </p>
                </div>
              </div>
            </div>

            {/* Step 8 */}
            <div className="panel" style={{ background: "#0a0a0a", padding: "40px", borderColor: "rgba(255,255,255,0.04)" }}>
              <span style={{ fontSize: "12px", color: "var(--accent)", fontFamily: "var(--mono)", display: "block", marginBottom: "8px", letterSpacing: "0.1em", fontWeight: "bold" }}>STEP 08 // AUTOMATION</span>
              <h4 style={{ fontSize: "18px", color: "#fff", margin: "0 0 16px 0", fontFamily: "var(--sans)", fontWeight: "bold" }}>Agent Upgrades & Autonomous Bots</h4>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px", fontSize: "16px", color: "var(--text-dim)", lineHeight: "1.7" }}>
                <p>
                  <strong style={{ color: "var(--accent)", fontSize: "12px", fontFamily: "var(--mono)", display: "inline-block", width: "140px" }}>THE GOAL //</strong>
                  Automated rewards, background notifications, and user-launched agents.
                </p>
                <p>
                  <strong style={{ color: "var(--accent)", fontSize: "12px", fontFamily: "var(--mono)", display: "inline-block", width: "140px" }}>HOW IT WORKS //</strong>
                  Upgrading the agent core to run continuous loops, post automated briefings, reply to community posts, and handle payouts. This will also introduce the ability for SOLvivors to stake <strong>$THREAT</strong> to deploy their own Sentry Bots (sub-agents) in the mainframe to run background data tasks and earn passive yields.
                </p>
              </div>
            </div>

          </div>
        </div>

        {/* Token Mechanics */}
        <div className="panel" style={{ background: "#0c0c0c", padding: "40px", borderColor: "rgba(255,255,255,0.03)" }}>
          <h3 style={{ fontSize: "20px", color: "#ffffff", marginBottom: "20px", fontFamily: "var(--mono)", letterSpacing: "0.02em", fontWeight: "bold" }}>Role of the $THREAT Token in the Ecosystem</h3>
          <p style={{ fontSize: "16px", color: "var(--text-dim)", lineHeight: "1.8", marginBottom: "20px" }}>
            To ensure <strong>$THREAT</strong> serves as utility infrastructure in this survival ecosystem rather than a speculative asset, the following mechanics are planned for integration:
          </p>
          <ul style={{ margin: 0, paddingLeft: "24px", color: "var(--text-dim)", fontSize: "16px", lineHeight: "1.8", display: "flex", flexDirection: "column", gap: "12px" }}>
            <li><strong>Bunker Shielding:</strong> Secure your accumulated items, equipment, and resources from Marauder raids. Staking <strong>$THREAT</strong> acts as an on-chain defensive shield. The higher your stake, the stronger your bunker defense factor, preventing other players from siphoning or stealing your inventory.</li>
            <li><strong>Daily Play Energy:</strong> Staking or spending <strong>$THREAT</strong> grants you additional attempts or energy charges per day to run simulation actions and participate in PvP battles, allowing you to win more token rewards.</li>
            <li><strong>Revives:</strong> If your SOLvivor is defeated in the PvP sector, pay <strong>$THREAT</strong> to execute a clones-restore.</li>
            <li><strong>Factions Progression:</strong> Spend <strong>$THREAT</strong> to purchase advanced research files, equipment blueprints, and clearance cards.</li>
            <li><strong>Marketplace Yields:</strong> Hold <strong>$THREAT</strong> to receive your share of revenue generated by transaction fees on the items marketplace.</li>
            <li><strong>Own Your Survival Legacy:</strong> Your BIO-SCORE and clearance levels are permanent records of your achievements and decisions.</li>
          </ul>
        </div>

        {/* Back Button */}
        <div style={{ textAlign: "center", marginTop: "24px" }}>
          <Link href="/" style={{ fontSize: "13px", fontFamily: "var(--mono)", color: "var(--accent)", border: "1px solid rgba(255, 77, 77, 0.4)", padding: "14px 28px", textDecoration: "none", background: "rgba(255, 77, 77, 0.05)", borderRadius: "2px", letterSpacing: "0.05em", fontWeight: "bold" }}>
            [ RETURN TO TERMINAL HOME ]
          </Link>
        </div>

      </div>
    </div>
  );
}
