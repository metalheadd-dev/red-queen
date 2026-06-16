"use client";
import Link from "next/link";
import SolvivalIcon from "@/components/SolvivalIcon";

export default function RoadmapPage() {
  return (
    <div style={{ minHeight: "100vh", display: "flex", flexDirection: "column", paddingTop: "80px", background: "#050505", color: "#fff" }}>
      {/* Header section */}
      <div style={{ borderBottom: "1px solid rgba(255, 77, 77, 0.1)", padding: "48px 24px", background: "linear-gradient(180deg, rgba(255, 77, 77, 0.03) 0%, rgba(5,5,5,0) 100%)" }}>
        <div className="container" style={{ maxWidth: "800px", margin: "0 auto", textAlign: "center" }}>
          <div style={{ display: "inline-flex", alignItems: "center", gap: "10px", padding: "6px 14px", border: "1px solid rgba(255, 77, 77, 0.3)", borderRadius: "30px", background: "rgba(255, 77, 77, 0.05)", marginBottom: "16px" }}>
            <SolvivalIcon size={20} />
            <span style={{ fontSize: "11px", fontFamily: "var(--mono)", letterSpacing: "0.15em", color: "var(--accent)" }}>MAIN SYSTEM ROADMAP</span>
          </div>
          <h1 className="glow-text" style={{ fontSize: "clamp(32px, 5vw, 48px)", margin: "0 0 12px", fontFamily: "var(--title-font)", fontWeight: "bold", letterSpacing: "0.05em", textTransform: "uppercase" }}>
            RED QUEEN <span style={{ color: "var(--accent)" }}>ROADMAP</span>
          </h1>
          <p style={{ fontSize: "14.5px", color: "var(--text-dim)", maxWidth: "650px", margin: "0 auto", lineHeight: "1.7", fontFamily: "var(--sans)" }}>
            The planned direction of the Red Queen Surveillance Ecosystem on Solana. This is a living document, actively open to community feedback and suggestions.
          </p>
        </div>
      </div>

      {/* Content Area */}
      <div className="container" style={{ maxWidth: "800px", margin: "0 auto", padding: "40px 24px", display: "flex", flexDirection: "column", gap: "40px" }}>
        
        {/* Core Vision Panel */}
        <div className="panel" style={{ background: "rgba(255, 77, 77, 0.02)", borderColor: "rgba(255, 77, 77, 0.15)", padding: "24px", borderRadius: "2px" }}>
          <h3 style={{ fontSize: "16px", color: "var(--accent)", marginBottom: "8px", fontFamily: "var(--mono)" }}>THE VISION</h3>
          <p style={{ fontSize: "13.5px", color: "var(--text-dim)", lineHeight: "1.7", margin: 0 }}>
            Building a comprehensive Surveillance Ecosystem and Intelligence Survival Terminal on Solana. Red Queen acts as a centralized AI mainframe that aggregates real-time threat telemetry, tracks player clearances through survival performance, and operates as an autonomous, self-funding agent.
          </p>
        </div>

        {/* Part 1: Current State */}
        <div>
          <h3 style={{ fontSize: "18px", color: "#fff", marginBottom: "20px", fontFamily: "var(--title-font)", letterSpacing: "0.05em", borderBottom: "1px solid rgba(255,255,255,0.08)", paddingBottom: "8px" }}>PART 1: ACTIVE SYSTEMS & LIVE BUILD</h3>
          
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <div className="panel" style={{ background: "#0c0c0c", padding: "20px" }}>
              <h4 style={{ fontSize: "14.5px", color: "#fff", margin: "0 0 8px 0", fontFamily: "var(--mono)" }}>1. THE MAIN TERMINAL CONSOLE</h4>
              <p style={{ fontSize: "13px", color: "var(--text-dim)", lineHeight: "1.6", margin: "0 0 12px 0" }}>
                The core interactive terminal interface where SOLvivors chat and query the Red Queen AI directly to request diagnostics.
              </p>
              <Link href="/terminal" style={{ fontSize: "11px", color: "#00e5ff", textDecoration: "underline", fontFamily: "var(--mono)" }}>Access Console [/terminal]</Link>
            </div>

            <div className="panel" style={{ background: "#0c0c0c", padding: "20px" }}>
              <h4 style={{ fontSize: "14.5px", color: "#fff", margin: "0 0 8px 0", fontFamily: "var(--mono)" }}>2. THE LIVE THREATS DASHBOARD</h4>
              <p style={{ fontSize: "13px", color: "var(--text-dim)", lineHeight: "1.6", margin: "0 0 12px 0" }}>
                The primary telemetry dashboard rendering the Threat of the Day and active environmental alerts.
              </p>
              <Link href="/" style={{ fontSize: "11px", color: "#00e5ff", textDecoration: "underline", fontFamily: "var(--mono)" }}>Access Dashboard [/]</Link>
            </div>

            <div className="panel" style={{ background: "#0c0c0c", padding: "20px" }}>
              <h4 style={{ fontSize: "14.5px", color: "#fff", margin: "0 0 8px 0", fontFamily: "var(--mono)" }}>3. THE ALL-THREATS DATABASE</h4>
              <p style={{ fontSize: "13px", color: "var(--text-dim)", lineHeight: "1.6", margin: "0 0 12px 0" }}>
                The complete archive of active and historical threat vectors tracked by the mainframe's sensors.
              </p>
              <Link href="/threat-vector" style={{ fontSize: "11px", color: "#00e5ff", textDecoration: "underline", fontFamily: "var(--mono)" }}>Access Vectors [/threat-vector]</Link>
            </div>

            <div className="panel" style={{ background: "#0c0c0c", padding: "20px" }}>
              <h4 style={{ fontSize: "14.5px", color: "#fff", margin: "0 0 8px 0", fontFamily: "var(--mono)" }}>4. THE SOLVIVOR PROFILE DASHBOARD</h4>
              <p style={{ fontSize: "13px", color: "var(--text-dim)", lineHeight: "1.6", margin: "0 0 12px 0" }}>
                Operatives create accounts using standard email login or a Solana wallet to calculate Level, total XP, stats, and track their active tasks and bounties progress.
              </p>
              <Link href="/operative" style={{ fontSize: "11px", color: "#00e5ff", textDecoration: "underline", fontFamily: "var(--mono)" }}>Access Profile [/operative]</Link>
            </div>

            <div className="panel" style={{ background: "#0c0c0c", padding: "20px" }}>
              <h4 style={{ fontSize: "14.5px", color: "#fff", margin: "0 0 8px 0", fontFamily: "var(--mono)" }}>5. THE SOLVIVORS HUB</h4>
              <p style={{ fontSize: "13px", color: "var(--text-dim)", lineHeight: "1.6", margin: "0 0 12px 0" }}>
                The active mission control. Only the <strong>Operations</strong> panel (Tasks & Bounties) is live. The other three sections (<strong>Broadcasts</strong>, <strong>Lore</strong>, and <strong>Comics</strong>) are currently locked and will open soon.
              </p>
              <Link href="/solvivors" style={{ fontSize: "11px", color: "#00e5ff", textDecoration: "underline", fontFamily: "var(--mono)" }}>Access Hub [/solvivors]</Link>
            </div>

            <div className="panel" style={{ background: "#0c0c0c", padding: "20px" }}>
              <h4 style={{ fontSize: "14.5px", color: "#fff", margin: "0 0 8px 0", fontFamily: "var(--mono)" }}>6. pay.sh & x402 TELEMETRY GATEWAY</h4>
              <p style={{ fontSize: "13px", color: "var(--text-dim)", lineHeight: "1.6", margin: 0 }}>
                USDC micropayment paywalls gating Premium Intel (`/api/intel/premium`) and Solana Telemetry (`/api/intel/depin`) feeds. Micro-fees accumulate in the treasury and autonomously execute $THREAT buybacks on Jupiter.
              </p>
            </div>
          </div>
        </div>

        {/* Part 2: Future Roadmap */}
        <div>
          <h3 style={{ fontSize: "18px", color: "#fff", marginBottom: "20px", fontFamily: "var(--title-font)", letterSpacing: "0.05em", borderBottom: "1px solid rgba(255,255,255,0.08)", paddingBottom: "8px" }}>PART 2: DEVELOPMENT ROADMAP</h3>
          
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            <div className="panel" style={{ background: "#0a0a0a", padding: "20px" }}>
              <span style={{ fontSize: "10px", color: "var(--accent)", fontFamily: "var(--mono)", display: "block", marginBottom: "4px" }}>STEP 01 // MAIN ENGINE</span>
              <h4 style={{ fontSize: "14.5px", color: "#fff", margin: "0 0 8px 0", fontFamily: "var(--sans)" }}>Dynamic Daily Threat Forecasts</h4>
              <p style={{ fontSize: "13px", color: "var(--text-dim)", lineHeight: "1.6", margin: 0 }}>
                Upgrading the main page threat briefings to be generated dynamically. The Red Queen AI will read global USGS earthquake updates and NASA weather alerts to compile real-time, narrative crisis briefings.
              </p>
            </div>

            <div className="panel" style={{ background: "#0a0a0a", padding: "20px" }}>
              <span style={{ fontSize: "10px", color: "var(--accent)", fontFamily: "var(--mono)", display: "block", marginBottom: "4px" }}>STEP 02 // COMPETITION</span>
              <h4 style={{ fontSize: "14.5px", color: "#fff", margin: "0 0 8px 0", fontFamily: "var(--sans)" }}>The SOLvivor Leaderboard & Seasons</h4>
              <p style={{ fontSize: "13px", color: "var(--text-dim)", lineHeight: "1.6", margin: 0 }}>
                Deploying a public competitive Leaderboard tracking BIO-SCORE and XP. To drive participation, I plan to introduce competitive **SOLvive Seasons with rewards** distributed to the highest-ranking survivors.
              </p>
            </div>

            <div className="panel" style={{ background: "#0a0a0a", padding: "20px" }}>
              <span style={{ fontSize: "10px", color: "var(--accent)", fontFamily: "var(--mono)", display: "block", marginBottom: "4px" }}>STEP 03 // UX POLISH</span>
              <h4 style={{ fontSize: "14.5px", color: "#fff", margin: "0 0 8px 0", fontFamily: "var(--sans)" }}>Immersive UI & UX Upgrades</h4>
              <p style={{ fontSize: "13px", color: "var(--text-dim)", lineHeight: "1.6", margin: 0 }}>
                Polishing layout styles, adding interactive terminal features, transitions, and immersive visual upgrades to make the interface more representative of the survival lore.
              </p>
            </div>

            <div className="panel" style={{ background: "#0a0a0a", padding: "20px" }}>
              <span style={{ fontSize: "10px", color: "var(--accent)", fontFamily: "var(--mono)", display: "block", marginBottom: "4px" }}>STEP 04 // MOBILE</span>
              <h4 style={{ fontSize: "14.5px", color: "#fff", margin: "0 0 8px 0", fontFamily: "var(--sans)" }}>Solana Seeker Phone Optimization</h4>
              <p style={{ fontSize: "13px", color: "var(--text-dim)", lineHeight: "1.6", margin: 0 }}>
                Releasing a custom, optimized mobile web view specifically built for the Solana Seeker Phone. Seeker users will receive special UI themes, clearance bonuses, and daily stats multipliers.
              </p>
            </div>

            <div className="panel" style={{ background: "#0a0a0a", padding: "20px" }}>
              <span style={{ fontSize: "10px", color: "var(--accent)", fontFamily: "var(--mono)", display: "block", marginBottom: "4px" }}>STEP 05 // CONNECTIONS</span>
              <h4 style={{ fontSize: "14.5px", color: "#fff", margin: "0 0 8px 0", fontFamily: "var(--sans)" }}>pay.sh Listing & Model Context Protocol (MCP) Server</h4>
              <p style={{ fontSize: "13px", color: "var(--text-dim)", lineHeight: "1.6", margin: 0 }}>
                Registering the Red Queen on the official pay.sh directory so other AI agents can query our specialized data feeds. I will build a native **MCP Server** for Red Queen, allowing external AI agents (like Claude or custom developer copilots) to connect to the mainframe directly as a specialized tool.
              </p>
            </div>

            <div className="panel" style={{ background: "#0a0a0a", padding: "20px" }}>
              <span style={{ fontSize: "10px", color: "var(--accent)", fontFamily: "var(--mono)", display: "block", marginBottom: "4px" }}>STEP 06 // B2B TELEMETRY</span>
              <h4 style={{ fontSize: "14.5px", color: "#fff", margin: "0 0 8px 0", fontFamily: "var(--sans)" }}>Telemetry Expansion via x402 Payments</h4>
              <p style={{ fontSize: "13px", color: "var(--text-dim)", lineHeight: "1.6", margin: 0 }}>
                The Red Queen agent will autonomously query more external paid developer APIs using stablecoin micropayments, feeding and expanding our central mainframe data with new environment and chain feeds.
              </p>
            </div>

            <div className="panel" style={{ background: "#0a0a0a", borderColor: "rgba(255, 77, 77, 0.15)", padding: "24px" }}>
              <span style={{ fontSize: "10px", color: "var(--accent)", fontFamily: "var(--mono)", display: "block", marginBottom: "4px" }}>STEP 07 // SIMULATION OVERLAY</span>
              <h4 style={{ fontSize: "16px", color: "#fff", margin: "0 0 12px 0", fontFamily: "var(--sans)", fontWeight: "bold" }}>The Red Queen Apocalypse Simulation & Items Marketplace</h4>
              
              <div style={{ display: "flex", flexDirection: "column", gap: "14px", fontSize: "13px", color: "var(--text-dim)", lineHeight: "1.6" }}>
                <p>
                  This is the core gameplay integration where players survive inside a persistent, AI-governed virtual world:
                </p>
                <ul style={{ paddingLeft: "20px" }}>
                  <li style={{ marginBottom: "8px" }}>
                    <strong>The World Layer:</strong> Align with a faction (Nomad, Scientist, Marauder, Government, Engineer, Hacker, or Bunker Syndicate). Red Queen generates daily threat events (e.g. H5N1 outbreak). SOLvivors contribute faction-specific actions to collectively determine the outcome (collapsing or stabilizing sectors).
                  </li>
                  <li style={{ marginBottom: "8px" }}>
                    <strong>The Survival Layer & cNFT Cards:</strong> Permanent reputation tracked via BIO-SCORE. Elite players achieve SOLvivor status to unlock classified sectors. Character profiles will be represented on-chain by **Solana Compressed NFTs (cNFTs)**, with the Red Queen AI autonomously deciding which character card fits you best based on your history of decisions.
                  </li>
                  <li style={{ marginBottom: "8px" }}>
                    <strong>Tactical PvP Combat:</strong> A turn-based prediction game targeting specific limbs (Head, Torso, Arms, Legs) with associated handicaps (e.g. arm injury reduces damage, leg injury prevents escape) and unique faction abilities.
                  </li>
                  <li style={{ marginBottom: "8px" }}>
                    <strong>Items Marketplace & Revenue Sharing:</strong> Trade gear, resources, and blueprints. Marketplace transaction fees will be split: a portion is shared back with `$THREAT` holders as passive yields, and another portion is used by the Red Queen agent for automated buybacks.
                  </li>
                  <li>
                    <strong>AI Game Master:</strong> Red Queen acts as narrator, generating missions, commenting on combat, and recording history.
                  </li>
                </ul>
              </div>
            </div>

            <div className="panel" style={{ background: "#0a0a0a", padding: "20px" }}>
              <span style={{ fontSize: "10px", color: "var(--accent)", fontFamily: "var(--mono)", display: "block", marginBottom: "4px" }}>STEP 08 // AUTOMATION</span>
              <h4 style={{ fontSize: "14.5px", color: "#fff", margin: "0 0 8px 0", fontFamily: "var(--sans)" }}>Agent Upgrades & Autonomous Bots</h4>
              <p style={{ fontSize: "13px", color: "var(--text-dim)", lineHeight: "1.6", margin: 0 }}>
                Upgrading the agent core to run continuous loops, post automated briefings, reply to community posts, and handle payouts. This will also introduce the ability for SOLvivors to stake `$THREAT` to deploy their own Sentry Bots (sub-agents) in the mainframe to run background data tasks and earn passive yields.
              </p>
            </div>
          </div>
        </div>

        {/* Token Mechanics */}
        <div className="panel" style={{ background: "#0c0c0c", padding: "24px" }}>
          <h3 style={{ fontSize: "15px", color: "#ffffff", marginBottom: "12px", fontFamily: "var(--mono)" }}>Role of the $THREAT Token in the Ecosystem</h3>
          <p style={{ fontSize: "13.5px", color: "var(--text-dim)", lineHeight: "1.7", marginBottom: "12px" }}>
            To ensure `$THREAT` serves as utility infrastructure in this survival ecosystem, the following mechanics are planned for integration:
          </p>
          <ul style={{ margin: 0, paddingLeft: "20px", color: "var(--text-dim)", fontSize: "13px", lineHeight: "1.7" }}>
            <li style={{ marginBottom: "6px" }}><strong>Bunker Shielding:</strong> Staking `$THREAT` acts as an on-chain defensive shield to protect your accumulated items, equipment, and resources from Marauder raids. The higher your stake, the stronger your bunker defense factor, preventing other players from siphoning your inventory.</li>
            <li style={{ marginBottom: "6px" }}><strong>Daily Play Energy:</strong> Staking or spending `$THREAT` grants you additional attempts or energy charges per day to run simulation actions and participate in PvP battles, allowing you to win more token rewards.</li>
            <li style={{ marginBottom: "6px" }}><strong>Revives:</strong> If your SOLvivor is defeated in the PvP sector, pay `$THREAT` to execute a clones-restore.</li>
            <li style={{ marginBottom: "6px" }}><strong>Factions Progression:</strong> Spend `$THREAT` to purchase advanced research files, equipment blueprints, and clearance cards.</li>
            <li><strong>Marketplace Yields:</strong> Hold `$THREAT` to receive your share of revenue generated by transaction fees on the items marketplace.</li>
          </ul>
        </div>

        {/* Back Button */}
        <div style={{ textAlign: "center", marginTop: "20px" }}>
          <Link href="/" style={{ fontSize: "12px", fontFamily: "var(--mono)", color: "var(--accent)", border: "1px solid rgba(255, 77, 77, 0.3)", padding: "10px 20px", textDecoration: "none", background: "rgba(255, 77, 77, 0.05)", borderRadius: "2px" }}>
            [ RETURN TO TERMINAL HOME ]
          </Link>
        </div>

      </div>
    </div>
  );
}
