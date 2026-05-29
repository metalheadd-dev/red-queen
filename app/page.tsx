"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import SolvivalIcon from "@/components/SolvivalIcon";
import BootSequence from "@/components/BootSequence";
import { THREAT_OF_THE_DAY } from "@/lib/threatOfTheDay";

const TICKER_ITEMS = [
  "CRITICAL COMPUTE ALERT: ADVERSARIAL LLM NETWORKS CROSS-REFERENCING WALLET METADATA WITH WEB2 SOCIAL GRAPHS",
  "PROTOCOL UPDATE: X402 ON-CHAIN TRANSACTION CHANNELS FULLY OPERATIONAL",
  "ENCRYPT YOUR TRANSMISSION // DECRYPTION SCRIPT RUNNING IN SECTOR 4",
  "SYBIL ATTACK VECTOR DETECTED: 104,281 PSEUDO-IDENTITIES HARVESTING ENCRYPTED WALLET HEURISTICS",
  "AI PERSONA HARVESTING MATRICES SCANNING SOCIAL HANDLES IN SECTOR 9",
  "MEV EXPLOIT DETECTED ON DEX HUBS — SLIPPAGE ATTACK EXPOSES SENSITIVE USER METADATA"
];

const THREAT_SCENARIOS = [
  { id: "WALLET-TRAIL", level: 94, color: "#ff4d4d", status: "CRITICAL" },
  { id: "AI-PROFILING", level: 91, color: "#ff4d4d", status: "SEVERE" },
  { id: "FEED-MANIP", level: 89, color: "#ff4d4d", status: "SEVERE" },
  { id: "DEEPFAKE-SE", level: 86, color: "#ff4d4d", status: "SEVERE" },
  { id: "REPUTATION-X", level: 82, color: "#f0c929", status: "HIGH" },
  { id: "META-LEAK", level: 80, color: "#f0c929", status: "HIGH" }
];

const MAP_HOTSPOTS = [
  { id: "zone-1", name: "AI Surveillance Hub (West-Atlantic)", type: "AI-PROFILING", desc: "Crawlers aggregating forum posts & social profiles into personality datasets.", risk: "High behavioral prediction accuracy.", solution: "Rotate social handles; inject adversarial noise.", coords: { x: 120, y: 150 } },
  { id: "zone-2", name: "Chain-Surveillance Target (East-Asia)", type: "WALLET-TRAIL", desc: "Active correlation engines matching exchange deposits with physical nodes.", risk: "Complete transaction de-anonymization.", solution: "Utilize non-custodial routers & mixers.", coords: { x: 580, y: 180 } },
  { id: "zone-3", name: "Outrage Feed Injection Loop (Central Europe)", type: "FEED-MANIP", desc: "Clustered sentiment bots pushing panic packets into targeted timelines.", risk: "Panic-driven retail trading decisions.", solution: "Disable timeline algorithmic personalization.", coords: { x: 380, y: 110 } },
  { id: "zone-4", name: "Synthetic Phishing Node (North America)", type: "DEEPFAKE-SE", desc: "Autonomous vocal clone agents targeting OTC traders.", risk: "Corporate treasury depletion via credential spoofing.", solution: "Deploy multi-modal pre-shared authorization passphrases.", coords: { x: 190, y: 220 } },
  { id: "zone-5", name: "Algorithmic Blacklist Node (Pacific Ocean)", type: "REPUTATION-X", desc: "DEX router pool blacklisting propagating dirty score flags.", risk: "Immediate freeze of assets in web3 interfaces.", solution: "Run AML scanning sweeps prior to high-volume pooling.", coords: { x: 490, y: 310 } },
  { id: "zone-6", name: "OAuth Configuration Leak (Middle East)", type: "META-LEAK", desc: "Central databases leaking login cookies cross-referenced to public keys.", risk: "Cross-graph identity unmasking.", solution: "Strictly isolate development and storage browsers.", coords: { x: 420, y: 240 } }
];

const FEED_TEMPLATES = [
  "[ALERT] Active phishing wave targeting Phantom users via fake Solana Seeker hardware upgrade notices.",
  "[INFO] System intercepted correlation loop tracing wallet 9xG...e2s to local residential IP.",
  "[WARN] Sentiment injection detected. Outrage bot clusters actively boosting panic posts in DeFi tags.",
  "[CRITICAL] Autonomous clone agent successfully bypassed voice authentication on OTC router.",
  "[ALERT] Algorithmic blacklist sweep flagged 4 liquidity pools on Raydium. Swaps blocked.",
  "[WARN] Web2 data broker breach leaked 42,000 OAuth session tokens linked to Solana addresses.",
  "[ALERT] Jupiter routing latency registered on Node 14. Automated frontrunning bots detected.",
  "[CRITICAL] Smart contract drain alert: Malicious bytecodes injected into newly deployed pump.fun token routers.",
  "[INFO] Sentinel node blocked metadata harvesting sweep from 4 malicious Chrome extensions.",
  "[SATIRICAL] Meme brainrot spike: Autonomous AGI agent launches 'AGI-RUG' token and rug-pulls itself within 12 seconds.",
  "[ALERT] DNS hijack warning: Phishing replica of jup.ag registered on external registrar. Do not authorize signatures.",
  "[WARN] Cognitive Timeline Attack: Sentiment steering AI networks registered active manipulation spikes in Solana tags.",
  "[CRITICAL] Level 5 threat detected: Cross-protocol address matching engine unmasking identities of Tornado Cash depositors.",
  "[INFO] Red Queen intercepted synthetic voice attack trying to bypass hardware key confirmation routes.",
  "[ALERT] Minor magnetosphere solar storm registered: Packet loss estimated at 0.8% across satcom relays.",
  "[WARN] Satirical collapse threat: Global coffee supply chain disruptions causing 300% surge in workspace violence telemetry.",
  "[INFO] Secure Sandbox verified: 12 key-exfiltration cookies purged from local browser memory caches.",
  "[CRITICAL] Dynamic blacklist event: Raydium AMM liquidity providers flagged by automated compliance bots."
];

export default function HomePage() {
  const [booted, setBooted] = useState(false);
  const [threatData, setThreatData] = useState<{ scenario: string; transmission: string } | null>(null);
  const [loadingThreat, setLoadingThreat] = useState(false);
  
  // Interactive state
  const [selectedHotspot, setSelectedHotspot] = useState(MAP_HOTSPOTS[0]);
  const [mapNodes, setMapNodes] = useState<any[]>([]);
  const [selectedNode, setSelectedNode] = useState<any>(null);
  const [loadingMap, setLoadingMap] = useState(false);
  const [hoveredNode, setHoveredNode] = useState<any>(null);
  const [activeX402Step, setActiveX402Step] = useState(1);
  const [liveFeed, setLiveFeed] = useState<Array<{ id: number; time: string; msg: string }>>([]);

  // Onboarding wizard states
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState(1);

  useEffect(() => {
    if (booted) {
      fetchThreat();
      
      // Fetch live threat map nodes
      async function loadMapNodes() {
        setLoadingMap(true);
        try {
          const res = await fetch("/api/threat-map");
          const data = await res.json();
          setMapNodes(data);
          if (data.length > 0) setSelectedNode(data[0]);
        } catch (err) {
          console.error("Failed to load threat map nodes:", err);
        }
        setLoadingMap(false);
      }
      loadMapNodes();
      
      // Initialize dynamic alerts feed
      const initFeed = Array.from({ length: 4 }).map((_, idx) => {
        const time = new Date(Date.now() - idx * 120000);
        return {
          id: idx,
          time: time.toTimeString().split(" ")[0],
          msg: FEED_TEMPLATES[idx % FEED_TEMPLATES.length]
        };
      });
      setLiveFeed(initFeed);

      // Trigger onboarding on first-visit check
      const completedOnboarding = localStorage.getItem("red-queen-onboarding-v5");
      if (!completedOnboarding) {
        setShowOnboarding(true);
      }
    }
  }, [booted]);

  // Append real-time alerts loop
  useEffect(() => {
    if (!booted) return;
    const interval = setInterval(() => {
      const now = new Date();
      const timeStr = now.toTimeString().split(" ")[0];
      const randomMsg = FEED_TEMPLATES[Math.floor(Math.random() * FEED_TEMPLATES.length)];
      setLiveFeed((prev) => [
        { id: Date.now(), time: timeStr, msg: randomMsg },
        ...prev.slice(0, 5)
      ]);
    }, 8000);
    return () => clearInterval(interval);
  }, [booted]);

  async function fetchThreat() {
    setLoadingThreat(true);
    try {
      const res = await fetch("/api/threat", { method: "POST" });
      const data = await res.json();
      setThreatData(data);
    } catch {
      setThreatData({
        scenario: "WALLET-TRAIL",
        transmission: "[ERR_0x9B] SIGNAL CORRUPTED. RE-ESTABLISH UPLINK.",
      });
    }
    setLoadingThreat(false);
  }

  const handleCloseOnboarding = () => {
    localStorage.setItem("red-queen-onboarding-v5", "true");
    setShowOnboarding(false);
  };

  if (!booted) {
    return <BootSequence onComplete={() => setBooted(true)} />;
  }

  return (
    <div style={{ paddingTop: "60px" }} className="page-bg">
      {/* Ticker */}
      <div className="ticker-wrap">
        <div className="ticker-inner">
          {[...TICKER_ITEMS, ...TICKER_ITEMS].map((item, i) => (
            <span key={i} className="ticker-item">
              <span className="tick-accent">▶</span>
              {item}
            </span>
          ))}
        </div>
      </div>

      {/* Hero */}
      <section className="hero" style={{ minHeight: "85vh", paddingTop: "40px" }}>
        <div className="hero-glow" />
        <div className="hero-tag">[ CODENAME: RED QUEEN AI // CORE NET FIREWALL ]</div>
        <h1 className="hero-title glitch" style={{ fontSize: "clamp(36px, 8vw, 76px)" }}>
          SURVIVE THE<br /><span style={{ color: "var(--accent)" }}>NEXT INTERNET</span>
        </h1>
        <p className="hero-subtitle" style={{ maxWidth: "700px" }}>
          The threats on the next internet aren&apos;t zombies—they are chain-surveillance crawlers, automated wallet doxxing grids, and AI profile scrapers tracking your transactions. Connect your Solana wallet to run live, non-custodial counter-intelligence scans. Clear your digital footprint before predatory networks profile you.
        </p>
        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", justifyContent: "center", zIndex: 10 }}>
          <Link href="/terminal" className="btn btn-primary">
            ▶ ENTER TERMINAL
          </Link>
          <Link href="/threat-vector" className="btn btn-ghost">
            ACCESS ARCHIVES
          </Link>
          <button onClick={() => { setOnboardingStep(1); setShowOnboarding(true); }} className="btn btn-outline" style={{ fontSize: "11px", fontFamily: "var(--mono)", cursor: "pointer" }}>
            [ EXPLAIN FEATURES ]
          </button>
        </div>

        {/* Token CA */}
        <div style={{
          marginTop: "32px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "10px",
          flexWrap: "wrap",
          zIndex: 10
        }}>
          <span style={{
            fontFamily: "var(--mono)",
            fontSize: "13px",
            fontWeight: 700,
            color: "var(--accent)",
            letterSpacing: "0.1em",
          }}>$THREAT</span>
          <div style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            background: "rgba(255,77,77,0.06)",
            border: "1px solid rgba(255,77,77,0.2)",
            borderRadius: "2px",
            padding: "6px 14px",
          }}>
            <span style={{
              fontFamily: "var(--mono)",
              fontSize: "11px",
              color: "var(--text-dim)",
              letterSpacing: "0.08em",
            }}>3SBP25W239gQwTjTebshDcyNKBzM1J9ADRyqDqLQpump</span>
          </div>
          <a
            href="https://pump.fun/coin/3SBP25W239gQwTjTebshDcyNKBzM1J9ADRyqDqLQpump"
            target="_blank"
            rel="noopener noreferrer"
            style={{
              fontFamily: "var(--mono)",
              fontSize: "10px",
              color: "var(--accent)",
              textDecoration: "none",
              letterSpacing: "0.12em",
              border: "1px solid rgba(255,77,77,0.3)",
              padding: "6px 12px",
              borderRadius: "2px",
              transition: "all 0.2s",
            }}
          >
            PUMP.FUN ↗
          </a>
        </div>
      </section>

      {/* Onboarding Start Here Section */}
      <section className="page-section" style={{
        borderTop: "1px solid var(--border)",
        background: "var(--surface)",
        padding: "60px 0",
        position: "relative"
      }}>
        <div className="container">
          <div className="section-header" style={{ marginBottom: "32px" }}>
            <span className="section-line" />
            <span className="section-tag">AI SURVIVAL INTELLIGENCE SYSTEM</span>
            <span className="section-line" />
          </div>

          <div className="panel" style={{
            background: "rgba(10, 10, 10, 0.6)",
            borderColor: "rgba(255, 77, 77, 0.2)",
            padding: "40px",
            boxShadow: "0 0 30px rgba(255, 0, 51, 0.05)",
            position: "relative",
            overflow: "hidden"
          }}>
            {/* Top Corner brackets for high-tech look */}
            <div style={{ position: "absolute", top: "10px", left: "10px", width: "15px", height: "15px", borderTop: "2px solid var(--accent)", borderLeft: "2px solid var(--accent)" }} />
            <div style={{ position: "absolute", top: "10px", right: "10px", width: "15px", height: "15px", borderTop: "2px solid var(--accent)", borderRight: "2px solid var(--accent)" }} />
            <div style={{ position: "absolute", bottom: "10px", left: "10px", width: "15px", height: "15px", borderBottom: "2px solid var(--accent)", borderLeft: "2px solid var(--accent)" }} />
            <div style={{ position: "absolute", bottom: "10px", right: "10px", width: "15px", height: "15px", borderBottom: "2px solid var(--accent)", borderRight: "2px solid var(--accent)" }} />

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "40px" }} className="responsive-grid-2-large">
              <div>
                <h2 style={{ fontFamily: "var(--title-font)", fontSize: "28px", color: "var(--text)", marginBottom: "16px", letterSpacing: "0.05em" }}>
                  AI SURVIVAL <span style={{ color: "var(--accent)" }}>INTELLIGENCE SYSTEM</span>
                </h2>
                <p style={{ fontSize: "15px", color: "var(--text-dim)", lineHeight: "1.8", marginBottom: "24px" }}>
                  Analyze threats. Train preparedness. Talk to the RED QUEEN. Improve your BIO SCORE. 
                  The RED QUEEN is a decentralized threat-intelligence network mapping physical and digital surveillance vectors.
                </p>
                <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                  <Link href="/terminal" className="btn btn-primary" style={{ fontSize: "11px" }}>
                    ▶ ENTER TERMINAL
                  </Link>
                  <Link href="/threat-vector" className="btn btn-ghost" style={{ fontSize: "11px", border: "1px solid var(--border)" }}>
                    EXPLORE THREATS
                  </Link>
                  <Link href="/survival-kit" className="btn btn-ghost" style={{ fontSize: "11px", border: "1px solid var(--border)", color: "#00ffcc" }}>
                    OPEN SURVIVAL KIT
                  </Link>
                </div>
              </div>

              {/* 3-Step Flow */}
              <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                <div style={{ fontFamily: "var(--mono)", fontSize: "11px", color: "var(--accent)", letterSpacing: "0.15em", marginBottom: "4px" }}>
                  [ OPERATIVE UPLINK PROTOCOL ]
                </div>
                
                {/* Step 1 */}
                <div style={{ display: "flex", gap: "16px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.03)", padding: "16px", borderRadius: "2px" }}>
                  <div style={{ fontFamily: "var(--title-font)", fontSize: "20px", fontWeight: "bold", color: "var(--accent)", width: "32px", height: "32px", display: "flex", alignItems: "center", justifyItems: "center", border: "1px solid var(--accent)", borderRadius: "50%", justifyContent: "center", flexShrink: 0 }}>
                    1
                  </div>
                  <div>
                    <h4 style={{ fontFamily: "var(--title-font)", fontSize: "14px", color: "var(--text)", margin: "0 0 6px 0", letterSpacing: "0.05em" }}>CHOOSE THREAT CATEGORY</h4>
                    <p style={{ fontSize: "13px", color: "var(--text-dim)", margin: 0, lineHeight: "1.6" }}>
                      Select between Realistic hazards, Fictional simulations, and Satirical archives.
                    </p>
                  </div>
                </div>

                {/* Step 2 */}
                <div style={{ display: "flex", gap: "16px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.03)", padding: "16px", borderRadius: "2px" }}>
                  <div style={{ fontFamily: "var(--title-font)", fontSize: "20px", fontWeight: "bold", color: "var(--accent)", width: "32px", height: "32px", display: "flex", alignItems: "center", justifyItems: "center", border: "1px solid var(--accent)", borderRadius: "50%", justifyContent: "center", flexShrink: 0 }}>
                    2
                  </div>
                  <div>
                    <h4 style={{ fontFamily: "var(--title-font)", fontSize: "14px", color: "var(--text)", margin: "0 0 6px 0", letterSpacing: "0.05em" }}>TALK TO RED QUEEN</h4>
                    <p style={{ fontSize: "13px", color: "var(--text-dim)", margin: 0, lineHeight: "1.6" }}>
                      Query the terminal. Formulate survival tactics. Be evaluated in real-time.
                    </p>
                  </div>
                </div>

                {/* Step 3 */}
                <div style={{ display: "flex", gap: "16px", background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.03)", padding: "16px", borderRadius: "2px" }}>
                  <div style={{ fontFamily: "var(--title-font)", fontSize: "20px", fontWeight: "bold", color: "var(--accent)", width: "32px", height: "32px", display: "flex", alignItems: "center", justifyItems: "center", border: "1px solid var(--accent)", borderRadius: "50%", justifyContent: "center", flexShrink: 0 }}>
                    3
                  </div>
                  <div>
                    <h4 style={{ fontFamily: "var(--title-font)", fontSize: "14px", color: "var(--text)", margin: "0 0 6px 0", letterSpacing: "0.05em" }}>BUILD YOUR BIO SCORE</h4>
                    <p style={{ fontSize: "13px", color: "var(--text-dim)", margin: 0, lineHeight: "1.6" }}>
                      Earn persistent XP and level up from Civilian to Director as you prove tactical intelligence.
                    </p>
                  </div>
                </div>

              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Threat of the Day Section */}
      <section className="page-section" style={{
        borderTop: "1px solid var(--border)",
        borderBottom: "1px solid var(--border)",
        padding: "80px 0",
        background: "radial-gradient(circle at center, rgba(255, 0, 51, 0.05) 0%, rgba(5, 5, 5, 1) 100%)",
        position: "relative",
        overflow: "hidden"
      }}>
        {/* Flashing alert overlay background lines */}
        <div style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          height: "6px",
          background: "repeating-linear-gradient(45deg, var(--accent), var(--accent) 10px, #000 10px, #000 20px)",
          boxShadow: "0 2px 10px rgba(255, 0, 51, 0.5)"
        }} />

        <div className="container">
          {/* Header */}
          <div style={{ textAlign: "center", marginBottom: "40px" }}>
            <div className="tag tag-red" style={{
              fontSize: "14px",
              fontFamily: "var(--mono)",
              padding: "6px 16px",
              animation: "pulse-dot 1.5s infinite",
              letterSpacing: "0.2em",
              display: "inline-block",
              marginBottom: "16px",
              boxShadow: "0 0 15px rgba(255, 0, 51, 0.3)"
            }}>
              🚨 IMMEDIATE SYSTEM ALERT 🚨
            </div>
            <h2 className="glitch glow-text" style={{
              fontSize: "clamp(28px, 5vw, 48px)",
              fontFamily: "var(--mono)",
              fontWeight: 900,
              color: "#ff0033",
              margin: 0,
              letterSpacing: "0.05em",
              textTransform: "uppercase"
            }}>
              THREAT OF THE DAY DETECTED
            </h2>
            <p style={{
              fontFamily: "var(--mono)",
              fontSize: "11px",
              color: "var(--text-muted)",
              marginTop: "8px",
              letterSpacing: "0.15em"
            }}>
              [ SECURE NODE UPLINK SHIELD IMMEDIATELY // VECTOR LOGIC LOADED ]
            </p>
          </div>

          {/* Aggressive Layout Panel */}
          <div className="panel" style={{
            background: "#080808",
            border: "3px solid #ff0033",
            boxShadow: "0 0 40px rgba(255, 0, 51, 0.2)",
            padding: "40px",
            position: "relative",
            borderRadius: "4px"
          }}>
            {/* Corner Bracket Details */}
            <div style={{ position: "absolute", top: "10px", left: "10px", width: "20px", height: "20px", borderTop: "2px solid #ff0033", borderLeft: "2px solid #ff0033" }} />
            <div style={{ position: "absolute", top: "10px", right: "10px", width: "20px", height: "20px", borderTop: "2px solid #ff0033", borderRight: "2px solid #ff0033" }} />
            <div style={{ position: "absolute", bottom: "10px", left: "10px", width: "20px", height: "20px", borderBottom: "2px solid #ff0033", borderLeft: "2px solid #ff0033" }} />
            <div style={{ position: "absolute", bottom: "10px", right: "10px", width: "20px", height: "20px", borderBottom: "2px solid #ff0033", borderRight: "2px solid #ff0033" }} />

            <div style={{
              position: "absolute",
              top: "16px",
              right: "24px",
              fontFamily: "var(--mono)",
              fontSize: "11px",
              color: "rgba(255, 77, 77, 0.6)",
              letterSpacing: "0.1em"
            }}>
              NODE STAMP: {THREAT_OF_THE_DAY.publishDate} // SYSTEM SCAN
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1.3fr 0.7fr", gap: "32px", alignItems: "center" }} className="responsive-grid-2-large">
              
              {/* Left Column: Info */}
              <div>
                <div style={{ fontFamily: "var(--mono)", fontSize: "12px", color: "var(--text-dim)", textTransform: "uppercase", marginBottom: "6px" }}>
                  IDENTIFIED VECTOR: <span style={{ color: "var(--accent)" }}>{THREAT_OF_THE_DAY.codename}</span>
                </div>
                
                <h1 className="glow-text" style={{
                  fontSize: "clamp(32px, 4vw, 52px)",
                  margin: "0 0 20px",
                  color: "#ffffff",
                  lineHeight: "1.1",
                  fontWeight: "bold",
                  textTransform: "uppercase",
                  letterSpacing: "-0.02em"
                }}>
                  {THREAT_OF_THE_DAY.name}
                </h1>

                <div style={{ borderTop: "1px dashed rgba(255, 77, 77, 0.2)", paddingTop: "20px" }}>
                  <p style={{ fontSize: "14.5px", color: "var(--text)", lineHeight: "1.8", margin: "0 0 24px" }}>
                    <strong style={{ color: "#ff4d4d", fontFamily: "var(--mono)", fontSize: "11px", display: "block", marginBottom: "6px", letterSpacing: "0.1em" }}>
                      [ ASSESSMENT & BIOLOGICAL TRACE ]
                    </strong>
                    {THREAT_OF_THE_DAY.description}
                  </p>
                  
                  <p style={{ fontSize: "14.5px", color: "#00ffcc", lineHeight: "1.8", margin: 0 }}>
                    <strong style={{ color: "#00ffcc", fontFamily: "var(--mono)", fontSize: "11px", display: "block", marginBottom: "6px", letterSpacing: "0.1em" }}>
                      [ REQUIRED SURVIVAL PROTOCOL ]
                    </strong>
                    {THREAT_OF_THE_DAY.countermeasure}
                  </p>
                </div>
              </div>

              {/* Right Column: Risk Gauge & CTA */}
              <div style={{
                background: "rgba(255, 0, 51, 0.03)",
                border: "1px solid rgba(255, 77, 77, 0.15)",
                padding: "32px 24px",
                textAlign: "center",
                borderRadius: "2px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center"
              }}>
                <div style={{ fontFamily: "var(--mono)", fontSize: "11px", color: "var(--text-dim)", letterSpacing: "0.15em", marginBottom: "8px" }}>
                  CRITICALITY LEVEL
                </div>

                <div style={{
                  position: "relative",
                  width: "120px",
                  height: "120px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: "50%",
                  border: "4px double #ff0033",
                  boxShadow: "0 0 20px rgba(255, 0, 51, 0.2)",
                  marginBottom: "16px",
                  background: "#030303"
                }}>
                  <div style={{
                    fontFamily: "var(--mono)",
                    fontSize: "36px",
                    fontWeight: 900,
                    color: "#ff0033",
                  }}>
                    {THREAT_OF_THE_DAY.severity}%
                  </div>
                </div>

                <span className="tag tag-red" style={{
                  fontSize: "12px",
                  fontFamily: "var(--mono)",
                  fontWeight: "bold",
                  padding: "4px 12px",
                  letterSpacing: "0.15em",
                  marginBottom: "24px"
                }}>
                  STATUS: {THREAT_OF_THE_DAY.status}
                </span>

                <Link href="/terminal" className="btn btn-primary" style={{ width: "100%", justifyContent: "center", fontSize: "11px", boxShadow: "0 0 15px rgba(255,0,51,0.3)" }}>
                  ASK RED QUEEN ABOUT THIS ↗
                </Link>
              </div>

            </div>
          </div>
        </div>
      </section>

      {/* Interactive Threat Map Section */}
      <section className="page-section" style={{ borderTop: "1px solid var(--border)", background: "var(--surface)", padding: "60px 0" }}>
        <div className="container">
          <div className="section-header">
            <span className="section-line" />
            <span className="section-tag">LIVE THREAT MAP & GRID ANOMALIES</span>
            <span className="section-line" />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1.25fr 0.75fr", gap: "32px", marginTop: "32px" }} className="responsive-grid-2-large">
            {/* SVG Network Map */}
            <div className="panel" style={{ background: "#020202", borderColor: "rgba(255,0,51,0.15)", position: "relative", minHeight: "420px", padding: "16px", overflow: "hidden" }}>
              <div style={{ position: "absolute", top: "16px", left: "16px", fontFamily: "var(--mono)", fontSize: "10px", color: "var(--accent)", letterSpacing: "0.15em", zIndex: 10 }}>
                [ SYSTEM RADAR MONITORING NETWORK // LIVE GEOGRAPHY ]
              </div>

              {loadingMap || mapNodes.length === 0 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "12px", alignItems: "center", justifyContent: "center", height: "360px", fontFamily: "var(--mono)", color: "var(--text-dim)", fontSize: "12px" }}>
                  <span className="loading-dots">SYNCHRONIZING TACTICAL RADAR NODES<span>.</span><span>.</span><span>.</span></span>
                </div>
              ) : (
                <div style={{ position: "relative", width: "100%", height: "100%" }}>
                  <svg viewBox="0 0 800 400" style={{ width: "100%", height: "auto", opacity: 0.9 }}>
                    {/* Tactical grid background lines */}
                    <defs>
                      <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                        <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255, 0, 51, 0.04)" strokeWidth="1" />
                      </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#grid)" />

                    {/* Holographic Radar Concentric Circles */}
                    <circle cx="400" cy="200" r="100" fill="none" stroke="rgba(255, 0, 51, 0.05)" strokeWidth="1" strokeDasharray="5 5" />
                    <circle cx="400" cy="200" r="200" fill="none" stroke="rgba(255, 0, 51, 0.05)" strokeWidth="1" strokeDasharray="5 5" />
                    <circle cx="400" cy="200" r="300" fill="none" stroke="rgba(255, 0, 51, 0.05)" strokeWidth="1" strokeDasharray="5 5" />

                    {/* Continent Outlines (Tactical Wireframe) */}
                    <path d="M 120 100 L 220 80 L 280 110 L 230 180 L 150 180 L 110 130 Z" fill="rgba(255,255,255,0.01)" stroke="rgba(255, 77, 77, 0.12)" strokeWidth="1.5" strokeDasharray="3 3" />
                    <path d="M 180 200 L 250 230 L 240 300 L 200 360 L 170 280 Z" fill="rgba(255,255,255,0.01)" stroke="rgba(255, 77, 77, 0.12)" strokeWidth="1.5" strokeDasharray="3 3" />
                    <path d="M 380 60 L 580 50 L 700 90 L 730 180 L 580 200 L 420 180 L 360 140 Z" fill="rgba(255,255,255,0.01)" stroke="rgba(255, 77, 77, 0.12)" strokeWidth="1.5" strokeDasharray="3 3" />
                    <path d="M 380 190 L 460 180 L 490 240 L 440 310 L 380 270 Z" fill="rgba(255,255,255,0.01)" stroke="rgba(255, 77, 77, 0.12)" strokeWidth="1.5" strokeDasharray="3 3" />
                    <path d="M 630 260 L 700 270 L 690 320 L 640 310 Z" fill="rgba(255,255,255,0.01)" stroke="rgba(255, 77, 77, 0.12)" strokeWidth="1.5" strokeDasharray="3 3" />
                    <path d="M 300 40 L 340 30 L 320 60 Z" fill="rgba(255,255,255,0.01)" stroke="rgba(255, 77, 77, 0.12)" strokeWidth="1.5" strokeDasharray="3 3" />

                    {/* Sonar Radar Sweep */}
                    <line x1="400" y1="200" x2="800" y2="200" stroke="rgba(255, 77, 77, 0.2)" strokeWidth="2">
                      <animateTransform attributeName="transform" type="rotate" from="0 400 200" to="360 400 200" dur="12s" repeatCount="indefinite"/>
                    </line>

                    {/* Threat Nodes */}
                    {mapNodes.map((node) => {
                      const isSelected = selectedNode?.id === node.id;
                      const color = node.type === "GEOLOGICAL" ? "#ff4d4d" : node.type === "ALGORITHMIC" ? "#00ffcc" : "#f0c929";
                      return (
                        <g key={node.id} 
                           onClick={() => setSelectedNode(node)} 
                           onMouseEnter={() => setHoveredNode(node)}
                           onMouseLeave={() => setHoveredNode(null)}
                           style={{ cursor: "pointer" }}>
                          {/* Pulsing ring */}
                          <circle cx={node.coords.x} cy={node.coords.y} r={isSelected ? 16 : 8} fill="none" stroke={color} strokeWidth="1.5" opacity={isSelected ? 0.9 : 0.5}>
                            <animate attributeName="r" values="5;22;5" dur="3s" repeatCount="indefinite" />
                          </circle>
                          {/* Inner core */}
                          <circle cx={node.coords.x} cy={node.coords.y} r="5" fill={color} />
                        </g>
                      );
                    })}
                  </svg>

                  {/* Compact Hover Card */}
                  {hoveredNode && (
                    <div style={{
                      position: "absolute",
                      left: `${(hoveredNode.coords.x / 800) * 100}%`,
                      top: `${(hoveredNode.coords.y / 400) * 100}%`,
                      transform: "translate(-50%, -115%)",
                      background: "rgba(5, 5, 5, 0.95)",
                      border: "1px solid var(--accent)",
                      padding: "10px 14px",
                      borderRadius: "2px",
                      pointerEvents: "none",
                      zIndex: 100,
                      minWidth: "180px",
                      boxShadow: "0 4px 20px rgba(0,0,0,0.8)"
                    }}>
                      <div style={{ fontFamily: "var(--mono)", fontSize: "9px", color: "var(--accent)", letterSpacing: "0.1em", textTransform: "uppercase", marginBottom: "4px" }}>
                        [{hoveredNode.type} // {hoveredNode.region}]
                      </div>
                      <div style={{ fontSize: "12px", fontWeight: "bold", color: "#fff", marginBottom: "2px" }}>
                        {hoveredNode.name}
                      </div>
                      <div style={{ fontFamily: "var(--mono)", fontSize: "10px", color: "var(--text-dim)" }}>
                        Severity: <span style={{ color: "var(--accent)" }}>{hoveredNode.severity}%</span>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Tactical Info Pane */}
            {selectedNode ? (
              <div className="panel" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", background: "rgba(10,10,10,0.6)", borderColor: "rgba(255,0,51,0.2)" }}>
                <div>
                  <div className="tag tag-red" style={{ marginBottom: "16px", fontSize: "10px", fontFamily: "var(--mono)" }}>
                    [ RADAR DIAGNOSTIC DOSSIER ]
                  </div>
                  <h3 className="glow-text" style={{ fontSize: "20px", marginBottom: "8px", textTransform: "uppercase" }}>
                    {selectedNode.name}
                  </h3>
                  <div style={{ fontFamily: "var(--mono)", fontSize: "10px", color: "var(--text-dim)", marginBottom: "20px", textTransform: "uppercase" }}>
                    REGION: <span style={{ color: "var(--accent)" }}>{selectedNode.region}</span><br />
                    LAT/LNG: <span style={{ color: "#00ffcc" }}>{selectedNode.lat.toFixed(4)}, {selectedNode.lng.toFixed(4)}</span>
                  </div>
                  
                  <p style={{ fontSize: "13.5px", color: "var(--text-dim)", lineHeight: "1.7", marginBottom: "16px" }}>
                    <strong>Description:</strong> {selectedNode.desc}
                  </p>
                  <p style={{ fontSize: "13.5px", color: "var(--text-dim)", lineHeight: "1.7", marginBottom: "16px" }}>
                    <strong style={{ color: "var(--accent)" }}>Criticality:</strong> {selectedNode.severity}% Severity Rating
                  </p>
                  <p style={{ fontSize: "13.5px", color: "#00ffcc", lineHeight: "1.7", marginBottom: "16px" }}>
                    <strong>Defense Protocol:</strong> {selectedNode.solution}
                  </p>

                  <div style={{ borderTop: "1px dashed var(--border)", paddingTop: "14px", marginTop: "14px" }}>
                    <div style={{ fontFamily: "var(--mono)", fontSize: "9px", color: "var(--accent)", letterSpacing: "0.1em", marginBottom: "6px" }}>
                      [ RED QUEEN CRITICAL FEED ]
                    </div>
                    <p style={{ fontSize: "12px", color: "var(--text)", fontStyle: "italic", lineHeight: "1.6", margin: 0 }}>
                      {selectedNode.analysis}
                    </p>
                  </div>
                </div>

                <div style={{ marginTop: "24px", paddingTop: "20px", borderTop: "1px solid var(--border)" }}>
                  <Link href="/terminal" className="btn btn-primary" style={{ width: "100%", justifyContent: "center", fontSize: "11px" }}>
                    COMMUNICATE WITH RED QUEEN OVER UPLINK ↗
                  </Link>
                </div>
              </div>
            ) : (
              <div className="panel" style={{ display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-dim)", fontFamily: "var(--mono)", fontSize: "12px" }}>
                [ CHOOSE RADAR NODE TO SCAN ]
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Compute Resource Allocations Panel */}
      <section className="page-section" style={{ borderTop: "1px solid var(--border)", padding: "60px 0" }}>
        <div className="container">
          <div className="section-header">
            <span className="section-line" />
            <span className="section-tag">[ COMPUTE ALLOCATION SCHEME: FREE VS. GATED ]</span>
            <span className="section-line" />
          </div>

          <div style={{ display: "grid", gap: "24px", marginTop: "32px" }} className="bento-2">
            {/* FREE TIER CARD */}
            <div className="bento-card" style={{ borderColor: "var(--border)", background: "rgba(10,10,10,0.5)", padding: "32px", cursor: "default" }}>
              <h3 style={{ fontSize: "16px", color: "var(--text-dim)", marginBottom: "16px", fontFamily: "var(--mono)", fontWeight: "bold" }}>
                [ PUBLIC ACCESS TIER: FREE ]
              </h3>
              <p style={{ color: "var(--text-dim)", fontSize: "13px", lineHeight: "1.7", marginBottom: "20px" }}>
                Access basic early-warning signals and read public threat dossiers.
              </p>
              <ul style={{ listStyle: "none", padding: 0, display: "flex", flexDirection: "column", gap: "10px", fontFamily: "var(--mono)", fontSize: "12px", color: "var(--text-dim)" }}>
                <li>✔ Basic Red Queen Chat (Pending status)</li>
                <li>✔ Public Threat Archives (Sector Gamma)</li>
                <li>✔ Real-Time Incident Alerts Feed</li>
                <li>✔ Basic Bio-Score calculation</li>
              </ul>
            </div>

            {/* x402 COMPUTE CARD */}
            <div className="bento-card" style={{ borderColor: "var(--accent)", background: "rgba(255, 0, 51, 0.02)", padding: "32px", cursor: "default" }}>
              <h3 style={{ fontSize: "16px", color: "var(--accent)", marginBottom: "16px", fontFamily: "var(--mono)", fontWeight: "bold" }}>
                [ COMPUTE-ON-DEMAND: x402 METERED ]
              </h3>
              <p style={{ color: "var(--text-dim)", fontSize: "13px", lineHeight: "1.7", marginBottom: "20px" }}>
                Fund decentralized AI compute cycles in real-time to run deep security traces.
              </p>
              <ul style={{ listStyle: "none", padding: 0, display: "flex", flexDirection: "column", gap: "10px", fontFamily: "var(--mono)", fontSize: "12px", color: "var(--text)" }}>
                <li>✔ Deep Wallet Metadata Diagnostic Scans (0.05 USDC)</li>
                <li>✔ Psychological Profiling & Threat Vectors Decryption</li>
                <li>✔ Advanced AI Counter-Intelligence Reports</li>
                <li>✔ Sector Delta Gated Archive Decryption</li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* Live Threat Feed & Monitor Section */}
      <section className="page-section" style={{ borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)" }}>
        <div className="container">
          <div style={{ display: "grid", gridTemplateColumns: "1.1fr 0.9fr", gap: "32px" }} className="responsive-grid-2-large">
            
            {/* Live Feed Ticker */}
            <div className="panel">
              <div style={{ fontFamily: "var(--mono)", fontSize: "11px", color: "var(--text-dim)", letterSpacing: "0.2em", marginBottom: "20px", display: "flex", justifyContent: "space-between" }}>
                <span>[ REAL-TIME INCIDENT FEED ]</span>
                <span style={{ color: "var(--accent)" }}>● MONITORING ACTIVE</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "12px", minHeight: "260px" }}>
                {liveFeed.map((alert) => (
                  <div key={alert.id} style={{ fontFamily: "var(--mono)", fontSize: "11.5px", paddingBottom: "10px", borderBottom: "1px dashed var(--border)", color: "var(--text-dim)", display: "flex", gap: "12px" }}>
                    <span style={{ color: "var(--accent)" }}>[{alert.time}]</span>
                    <span>{alert.msg}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Live Threat Monitor bar listings */}
            <div className="panel">
              <div style={{ fontFamily: "var(--mono)", fontSize: "11px", color: "var(--text-dim)", letterSpacing: "0.2em", marginBottom: "20px" }}>
                ACTIVE THREAT SCALE INDEX
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                {THREAT_SCENARIOS.map((t) => (
                  <div key={t.id}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "4px" }}>
                      <span style={{ fontFamily: "var(--mono)", fontSize: "11px", color: "var(--text)" }}>{t.id}</span>
                      <span style={{ fontFamily: "var(--mono)", fontSize: "11px", color: t.color }}>{t.level}% — {t.status}</span>
                    </div>
                    <div className="threat-bar-wrap" style={{ height: "4px" }}>
                      <div className="threat-bar-fill" style={{ width: `${t.level}%`, background: t.color }} />
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ marginTop: "16px", fontFamily: "var(--mono)", fontSize: "10px", color: "var(--text-dim)", fontStyle: "italic" }}>
                * Sector Delta elements require a mandatory 0.05 USDC x402 computation handshake to decrypt classified datasets.
              </div>
            </div>

          </div>
        </div>
      </section>

      {/* Premium Copywriting Feature Cards (Problem -> Risk -> Solution) */}
      <section className="page-section" style={{ background: "var(--surface)", padding: "60px 0" }}>
        <div className="container">
          <div className="section-header">
            <span className="section-line" />
            <span className="section-tag">COGNITIVE PRIVACY SHIELDS // CAPABILITY CARD MATRIX</span>
            <span className="section-line" />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "20px", marginTop: "32px" }}>
            {[
              {
                title: "AI Threat Intelligence",
                problem: "Autonomous scrapers compile files mapping your web3 profile.",
                risk: "Predictive targeted scams tailored exactly to your habits.",
                solution: "Red Queen scans public vectors to alert you prior to target doxxing loops."
              },
              {
                title: "Wallet Exposure Analysis",
                problem: "Transparent public ledgers leak transaction frequency parameters.",
                risk: "Clustering algorithms correlate transaction nodes with real identities.",
                solution: "Deep auditing tracing logic isolating structural pattern leakage points."
              },
              {
                title: "Metadata Risk Monitoring",
                problem: "Browser session cookies cross-reference private addresses with keys.",
                risk: "Cross-graph tracking correlation exposing physical locations.",
                solution: "Analyzes system metadata parameters to map leaks."
              },
              {
                title: "Feed Manipulation Detection",
                problem: "Timeline algorithms inject sentiment control outrage loops.",
                risk: "Algorithmic engineering steering financial market decisions.",
                solution: "Scans public handle records to map timeline injection vulnerabilities."
              },
              {
                title: "x402 Autonomous Payments",
                problem: "Mandatory logins and subscriptions require static data storage.",
                risk: "Leaked credentials compromise linked on-chain portfolios.",
                solution: "Accountless pay-per-scan settled natively over Solana via micro-fees."
              },
              {
                title: "Privacy Diagnostics",
                problem: "Centralized scanning services store raw query IP logs.",
                risk: "IP logging maps physical nodes directly to cryptographic keys.",
                solution: "Strict non-custodial diagnostics using salted SHA-256 database protection."
              },
              {
                title: "Survival Intelligence Reports",
                problem: "Security briefs are filled with dense, unusable jargon.",
                risk: "Operatives fail to act due to complexity of security reports.",
                solution: "Frictionless, technical but understandable counter-intelligence briefs."
              },
              {
                title: "Digital Reputation Defense",
                problem: "Compliance registries tag clean wallets via dirty routing hops.",
                risk: "Immediate freeze from decentralized applications without recourse.",
                solution: "Runs sweeping telemetry checks on compliance blacklist nodes."
              }
            ].map((card, idx) => (
              <div key={idx} className="bento-card" style={{ borderColor: "rgba(255, 0, 51, 0.15)", background: "#050505", padding: "24px" }}>
                <h3 style={{ fontSize: "16px", color: "var(--accent)", marginBottom: "16px", fontFamily: "var(--mono)", fontWeight: "bold" }}>
                  {card.title}
                </h3>
                <div style={{ display: "flex", flexDirection: "column", gap: "10px", fontSize: "12.5px" }}>
                  <p style={{ color: "var(--text-dim)", margin: 0 }}>
                    <strong style={{ color: "#777" }}>PROBLEM:</strong> {card.problem}
                  </p>
                  <p style={{ color: "var(--text-dim)", margin: 0 }}>
                    <strong style={{ color: "var(--accent)" }}>RISK:</strong> {card.risk}
                  </p>
                  <p style={{ color: "#00ffcc", margin: 0 }}>
                    <strong>SOLUTION:</strong> {card.solution}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* x402 Interactive Education Flow Section */}
      <section className="page-section" style={{ borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)", padding: "60px 0" }}>
        <div className="container">
          <div className="section-header">
            <span className="section-line" />
            <span className="section-tag">X402 AUTONOMOUS PAYMENT PROTOCOL FLOW</span>
            <span className="section-line" />
          </div>

          <div style={{ maxWidth: "800px", margin: "32px auto 0" }}>
            <div style={{ display: "flex", justifyContent: "space-between", gap: "8px", flexWrap: "wrap", marginBottom: "24px" }}>
              {[
                { step: 1, label: "1. REQUEST" },
                { step: 2, label: "2. 402 CHALLENGE" },
                { step: 3, label: "3. PAYMENT" },
                { step: 4, label: "4. VERIFY" },
                { step: 5, label: "5. ACCESS" }
              ].map((s) => (
                <button
                  key={s.step}
                  onClick={() => setActiveX402Step(s.step)}
                  className="btn"
                  style={{
                    flex: 1,
                    minWidth: "120px",
                    justifyContent: "center",
                    fontSize: "11px",
                    background: activeX402Step === s.step ? "var(--accent)" : "transparent",
                    color: activeX402Step === s.step ? "#000" : "var(--text-dim)",
                    border: "1px solid var(--border-red)",
                    borderRadius: "2px"
                  }}
                >
                  {s.label}
                </button>
              ))}
            </div>

            <div className="panel" style={{ background: "rgba(255, 0, 51, 0.02)", borderColor: "rgba(255, 0, 51, 0.2)" }}>
              {activeX402Step === 1 && (
                <div>
                  <h4 style={{ color: "var(--accent)", fontFamily: "var(--mono)", marginBottom: "8px" }}>STEP 1: Operative Launches Diagnostic Script</h4>
                  <p style={{ fontSize: "14px", color: "var(--text-dim)", margin: 0, lineHeight: "1.7" }}>
                    The client initiates an API query to decrypt a secured threat dossier. No session parameters, logins, or cookie keys are transmitted, keeping the request completely anonymous.
                  </p>
                </div>
              )}
              {activeX402Step === 2 && (
                <div>
                  <h4 style={{ color: "var(--accent)", fontFamily: "var(--mono)", marginBottom: "8px" }}>STEP 2: Server Emits HTTP 402 Challenge Header</h4>
                  <p style={{ fontSize: "14px", color: "var(--text-dim)", margin: 0, lineHeight: "1.7" }}>
                    The backend API intercepts the request, blocks output compilation, and triggers an HTTP `402 Payment Required` status. It outputs a Base64-encoded `PAYMENT-REQUIRED` JSON challenge.
                  </p>
                </div>
              )}
              {activeX402Step === 3 && (
                <div>
                  <h4 style={{ color: "var(--accent)", fontFamily: "var(--mono)", marginBottom: "8px" }}>STEP 3: Wallet Settles Micro-USDC Fee</h4>
                  <p style={{ fontSize: "14px", color: "var(--text-dim)", margin: 0, lineHeight: "1.7" }}>
                    The user&apos;s browser wallet adapter catches the 402 challenge, decodes the required amount (0.05 USDC), and requests approval for a transaction settled natively on Solana.
                  </p>
                </div>
              )}
              {activeX402Step === 4 && (
                <div>
                  <h4 style={{ color: "var(--accent)", fontFamily: "var(--mono)", marginBottom: "8px" }}>STEP 4: Server Verifies Ledger Transaction</h4>
                  <p style={{ fontSize: "14px", color: "var(--text-dim)", margin: 0, lineHeight: "1.7" }}>
                    The client retries the endpoint with the transaction signature in the `X-PAYMENT-SIGNATURE` header. The server parses the Solana ledger via RPC to confirm payment finality and checks replay registries.
                  </p>
                </div>
              )}
              {activeX402Step === 5 && (
                <div>
                  <h4 style={{ color: "#00ffcc", fontFamily: "var(--mono)", marginBottom: "8px" }}>STEP 5: Dossier Decrypted In Client Memory</h4>
                  <p style={{ fontSize: "14px", color: "var(--text-dim)", margin: 0, lineHeight: "1.7" }}>
                    Verification matches. The server releases the custom security diagnostic data. Unredacted reports are rendered directly into local memory, leaving no permanent transaction tracing links.
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Access Terminals */}
      <section className="page-section">
        <div className="container">
          <div className="section-header">
            <span className="section-line" />
            <span className="section-tag">ACCESS TERMINALS</span>
            <span className="section-line" />
          </div>

          <div className="bento-grid bento-3">
            <Link href="/terminal" className="bento-card">
              <div className="bento-number">01 / TERMINAL</div>
              <div className="bento-icon" style={{ height: "40px", display: "flex", alignItems: "center", marginBottom: "16px" }}>
                <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <circle cx="16" cy="16" r="3" fill="var(--accent)" />
                  <circle cx="16" cy="16" r="8" stroke="var(--accent)" strokeWidth="1" strokeDasharray="3 3" opacity="0.8">
                    <animateTransform attributeName="transform" type="rotate" from="0 16 16" to="360 16 16" dur="8s" repeatCount="indefinite" />
                  </circle>
                  <circle cx="16" cy="16" r="13" stroke="var(--accent)" strokeWidth="1" opacity="0.4" />
                  <path d="M16 0 V6 M16 26 V32 M0 16 H6 M26 16 H32" stroke="var(--accent)" strokeWidth="1" opacity="0.5" />
                </svg>
              </div>
              <div className="bento-title">Talk to the<br />Red Queen</div>
              <div className="bento-desc">
                Direct communication channel to the RED QUEEN AI. Ask about threats,
                survival strategies, and classified intel. Receive your BIO-SCORE.
              </div>
              <div className="bento-cta">→ OPEN TERMINAL</div>
            </Link>

            <Link href="/threat-vector" className="bento-card">
              <div className="bento-number">02 / THREAT VECTORS</div>
              <div className="bento-icon" style={{ height: "40px", display: "flex", alignItems: "center", marginBottom: "16px" }}>
                <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M16 3 L29 27 H3 Z" stroke="var(--accent)" strokeWidth="1.5" strokeLinejoin="round" fill="rgba(255, 77, 77, 0.05)" />
                  <circle cx="16" cy="17" r="5" stroke="var(--accent)" strokeWidth="1" strokeDasharray="2 2" />
                  <path d="M16 10 V14" stroke="var(--accent)" strokeWidth="2" strokeLinecap="round" />
                  <circle cx="16" cy="21" r="1.5" fill="var(--accent)" />
                  <path d="M12 20 L8 22 M20 20 L24 22" stroke="var(--accent)" strokeWidth="1" opacity="0.6" />
                </svg>
              </div>
              <div className="bento-title">Threat<br />Database</div>
              <div className="bento-desc">
                Classified dossiers on realistic, fictional, satirical, and algorithmic threat vectors.
              </div>
              <div className="bento-cta">→ VIEW FILES</div>
            </Link>

            <Link href="/network-clearance" className="bento-card">
              <div className="bento-number">03 / CLEARANCE</div>
              <div className="bento-icon" style={{ height: "40px", display: "flex", alignItems: "center", marginBottom: "16px" }}>
                <svg width="32" height="32" viewBox="0 0 32 32" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <rect x="8" y="13" width="16" height="13" rx="2" stroke="var(--accent)" strokeWidth="1.5" fill="rgba(255, 77, 77, 0.05)" />
                  <path d="M12 13 V9 C12 6.8 13.8 5 16 5 C18.2 5 20 6.8 20 9 V13" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" />
                  <circle cx="16" cy="18" r="2" fill="var(--accent)" />
                  <path d="M16 20 V23" stroke="var(--accent)" strokeWidth="1.5" strokeLinecap="round" />
                  <path d="M4 16 H8 M24 16 H28" stroke="var(--accent)" strokeWidth="1" opacity="0.6" />
                </svg>
              </div>
              <div className="bento-title">Rank<br />Registry</div>
              <div className="bento-desc">
                5-tier clearance system. Holders of $THREAT token unlock Level 5
                full access and receive cooperative treatments.
              </div>
              <div className="bento-cta">→ CHECK CLEARANCE</div>
            </Link>
          </div>
        </div>
      </section>

      {/* Call to Action */}
      <section style={{ padding: "80px 0", textAlign: "center", borderTop: "1px solid var(--border)" }}>
        <div className="container">
          <div className="tag tag-red" style={{ marginBottom: "24px" }}>DO NOT IGNORE THIS WARNING</div>
          <h2 style={{ fontSize: "clamp(28px, 5vw, 56px)", marginBottom: "20px" }}>
            THE COLLAPSE IS<br /><span style={{ color: "var(--accent)" }}>ALREADY HAPPENING</span>
          </h2>
          <p style={{ color: "var(--text-dim)", maxWidth: "500px", margin: "0 auto 36px", lineHeight: "1.9" }}>
            Every second you wait, your survival probability decreases.
            The RED QUEEN has the intelligence you need.
            Will you have the courage to ask?
          </p>
          <Link href="/terminal" className="btn btn-primary" style={{ fontSize: "14px", padding: "14px 36px" }}>
            ▶ BEGIN ASSESSMENT
          </Link>
        </div>
      </section>

      {/* Onboarding Wizard Overlay */}
      {showOnboarding && (
        <div style={{
          position: "fixed",
          top: 0, left: 0, right: 0, bottom: 0,
          background: "rgba(0, 0, 0, 0.95)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          zIndex: 2000,
          padding: "20px",
          backdropFilter: "blur(8px)"
        }}>
          <div style={{
            maxWidth: "600px",
            width: "100%",
            border: "1px solid var(--accent)",
            background: "#080808",
            padding: "36px",
            borderRadius: "4px",
            boxShadow: "0 0 40px rgba(255, 0, 51, 0.25)"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px solid var(--border)", paddingBottom: "12px", marginBottom: "20px" }}>
              <span style={{ fontFamily: "var(--mono)", fontSize: "11px", color: "var(--accent)" }}>[ SYSTEM BRIEFING: ONBOARDING PROTOCOL ]</span>
              <span style={{ fontFamily: "var(--mono)", fontSize: "11px", color: "var(--text-dim)" }}>STEP {onboardingStep} / 5</span>
            </div>

            {onboardingStep === 1 && (
              <div>
                <h3 style={{ fontSize: "18px", color: "var(--text)", marginBottom: "16px" }}>WELCOME TO THE RED QUEEN AI</h3>
                <p style={{ fontSize: "13.5px", color: "var(--text-dim)", lineHeight: "1.8", marginBottom: "24px" }}>
                  UPLINK ESTABLISHED. The apocalypse of the next internet is not a distant biological outbreak—it is happening right now inside your browser. Automated crawlers, metadata harvesting loops, and behavioral AI profiles are actively scraping your transaction history and online patterns to track you.
                </p>
              </div>
            )}
            {onboardingStep === 2 && (
              <div>
                <h3 style={{ fontSize: "18px", color: "var(--text)", marginBottom: "16px" }}>SECTOR MATRIX & THREAT TRACKING</h3>
                <p style={{ fontSize: "13.5px", color: "var(--text-dim)", lineHeight: "1.8", marginBottom: "24px" }}>
                  We monitor threats across multiple sectors. While physical threats are archived in Sector Alpha and Beta, Sector Delta represents the frontlines of digital survival—monitoring chain surveillance, deepfake identity scams, and algorithmic timeline steering.
                </p>
              </div>
            )}
            {onboardingStep === 3 && (
              <div>
                <h3 style={{ fontSize: "18px", color: "var(--text)", marginBottom: "16px" }}>THE PRIVACY ENGINE: HOW X402 WORKS</h3>
                <p style={{ fontSize: "13.5px", color: "var(--text-dim)", lineHeight: "1.8", marginBottom: "24px" }}>
                  We do not ask for accounts, emails, passwords, or subscriptions. To run advanced diagnostic scans, we utilize the open on-chain x402 protocol. This executes a frictionless micro-payment (0.05 USDC) settled natively over Solana to fund the AI compute cycle in real-time.
                </p>
              </div>
            )}
            {onboardingStep === 4 && (
              <div>
                <h3 style={{ fontSize: "18px", color: "var(--text)", marginBottom: "16px" }}>SECURE WALLET UPLINK</h3>
                <p style={{ fontSize: "13.5px", color: "var(--text-dim)", lineHeight: "1.8", marginBottom: "24px" }}>
                  Connecting your Solana wallet allows the Red Queen to map network vulnerabilities. To protect you, all session histories and reports are indexed in our database under a secure, salted SHA-256 hash. If your wallet disconnects, your data trace ceases to exist.
                </p>
              </div>
            )}
            {onboardingStep === 5 && (
              <div>
                <h3 style={{ fontSize: "18px", color: "#00ffcc", marginBottom: "16px" }}>ONBOARDING INITIALIZED</h3>
                <p style={{ fontSize: "13.5px", color: "var(--text-dim)", lineHeight: "1.8", marginBottom: "24px" }}>
                  Your briefing is complete, subject. Run your first wallet metadata check, explore the threat vault index, or connect your wallet to initiate terminal chat contact with the Red Queen.
                </p>
              </div>
            )}

            <div style={{ display: "flex", gap: "12px", justifyContent: "flex-end", borderTop: "1px solid var(--border)", paddingTop: "20px" }}>
              {onboardingStep > 1 && (
                <button className="btn btn-ghost" onClick={() => setOnboardingStep(onboardingStep - 1)} style={{ fontSize: "11px" }}>
                  [ PREVIOUS ]
                </button>
              )}
              {onboardingStep < 5 ? (
                <button className="btn btn-primary" onClick={() => setOnboardingStep(onboardingStep + 1)} style={{ fontSize: "11px" }}>
                  [ NEXT ]
                </button>
              ) : (
                <button className="btn btn-primary" onClick={handleCloseOnboarding} style={{ fontSize: "11px", background: "#00ffcc", color: "#000" }}>
                  [ INITIATE CONSOLE ]
                </button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
