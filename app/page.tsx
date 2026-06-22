"use client";
import { useState, useEffect, useLayoutEffect } from "react";
import Link from "next/link";
import dynamic from "next/dynamic";
import SolvivalIcon from "@/components/SolvivalIcon";
import BootSequence from "@/components/BootSequence";
import { THREAT_OF_THE_DAY } from "@/lib/threatOfTheDay";

const TacticalMap = dynamic(() => import("@/components/TacticalMap"), {
  ssr: false,
  loading: () => (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px", alignItems: "center", justifyContent: "center", height: "500px", fontFamily: "var(--mono)", color: "var(--text-dim)", fontSize: "12px" }}>
      <span className="loading-dots">INITIALIZING TACTICAL MAP SENSORS<span>.</span><span>.</span><span>.</span></span>
    </div>
  )
});

const TICKER_ITEMS = [
  "CRITICAL COMPUTE ALERT: ADVERSARIAL LLM NETWORKS CROSS-REFERENCING WALLET METADATA WITH WEB2 SOCIAL GRAPHS",
  "SYSTEM CORRELATION UPDATE: COMPUTE OPTIMIZATION MATRIX LOADED",
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
  // Boot sequence should only run once per browser session (not on every navigation)
  const [booted, setBooted] = useState(false);

  // Synchronously check sessionStorage before first paint to avoid boot flash
  useLayoutEffect(() => {
    if (sessionStorage.getItem("rq-booted") === "1") {
      setBooted(true);
    }
  }, []);

  const handleBooted = () => {
    sessionStorage.setItem("rq-booted", "1");
    setBooted(true);
  };
  const [threatData, setThreatData] = useState<any>(null);
  const [loadingThreat, setLoadingThreat] = useState(false);
  
  // Interactive state
  const [selectedHotspot, setSelectedHotspot] = useState(MAP_HOTSPOTS[0]);
  const [mapNodes, setMapNodes] = useState<any[]>([]);
  const [mapFilter, setMapFilter] = useState<string>("realistic");
  const [selectedNode, setSelectedNode] = useState<any>(null);
  const [loadingMap, setLoadingMap] = useState(false);
  const [hoveredNode, setHoveredNode] = useState<any>(null);
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
        codename: "SYS-MOCK",
        name: "SECTOR ALERT PROTOCOL",
        description: "[ERR_0x9B] Queen uplink lost. Re-establishing telemetry streams.",
        countermeasure: "Remain in secure quadrants, stand by for telemetry reset.",
        severity: 99,
        status: "CRITICAL",
        publishDate: new Date().toLocaleDateString('en-US', { month: 'short', day: '2-digit', year: 'numeric' }).toUpperCase(),
        source: "Mainframe Connection Terminal"
      });
    }
    setLoadingThreat(false);
  }

  const handleCloseOnboarding = () => {
    localStorage.setItem("red-queen-onboarding-v5", "true");
    setShowOnboarding(false);
  };

  if (!booted) {
    return <BootSequence onComplete={handleBooted} />;
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
          Meet Red Queen, an autonomous AI survival agent that monitors emerging threats, assigns missions, and builds your survival profile. Prepare for the future before it arrives.
        </p>
        <div style={{
          display: "flex",
          gap: "14px",
          justifyContent: "center",
          flexWrap: "wrap",
          marginBottom: "20px",
          fontFamily: "var(--mono)",
          fontSize: "13px",
          fontWeight: 600,
          letterSpacing: "0.08em",
          color: "var(--accent)"
        }}>
          <span>[ AUTONOMOUS AI AGENT ]</span>
          <span>[ BUILT ON SOLANA BY SOLVIVAL CORP ]</span>
          <span>[ POWERED BY NATIVE X402 PAYMENTS ]</span>
        </div>
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

      {/* x402 Experimental Infrastructure Section - Prominent Position */}
      <section style={{ 
        borderTop: "1px solid var(--border)", 
        borderBottom: "1px solid var(--border)", 
        padding: "60px 0", 
        background: "linear-gradient(180deg, rgba(255, 77, 77, 0.01) 0%, rgba(255, 77, 77, 0.04) 50%, rgba(255, 77, 77, 0.01) 100%)",
        position: "relative",
        overflow: "hidden"
      }}>
        {/* Decorative Grid Lines / Scanline background */}
        <div style={{
          position: "absolute",
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: "linear-gradient(rgba(18, 18, 18, 0.8), rgba(18, 18, 18, 0.8)), repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255, 77, 77, 0.02) 2px, rgba(255, 77, 77, 0.02) 4px)",
          pointerEvents: "none"
        }} />

        <div className="container" style={{ position: "relative", zIndex: 2 }}>
          <div style={{ 
            textAlign: "center",
            marginBottom: "32px"
          }}>
            <div style={{ 
              display: "inline-flex",
              alignItems: "center", 
              gap: "8px", 
              background: "rgba(0, 255, 204, 0.06)",
              border: "1px solid rgba(0, 255, 204, 0.3)",
              padding: "6px 14px",
              borderRadius: "40px",
              marginBottom: "16px"
            }}>
              <span style={{ 
                width: "8px", 
                height: "8px", 
                background: "#00ffcc", 
                borderRadius: "50%", 
                boxShadow: "0 0 8px #00ffcc",
                animation: "pulse-dot 1.5s infinite" 
              }} />
              <span style={{ 
                fontFamily: "var(--mono)", 
                fontSize: "11px", 
                color: "#00ffcc", 
                letterSpacing: "0.15em", 
                fontWeight: "bold"
              }}>
                UPGRADE STATUS: ITERATION 1 ACTIVE
              </span>
            </div>
            
            <h2 className="glitch glow-text" style={{ 
              fontFamily: "var(--mono)",
              fontSize: "clamp(24px, 4vw, 42px)", 
              color: "#ffffff", 
              fontWeight: 900,
              letterSpacing: "0.05em",
              textTransform: "uppercase",
              margin: "0 0 12px 0"
            }}>
              WHY RED QUEEN IS DIFFERENT
            </h2>
            <p style={{
              fontFamily: "var(--mono)",
              fontSize: "13px",
              color: "var(--text-dim)",
              maxWidth: "800px",
              margin: "0 auto",
              lineHeight: "1.6",
              letterSpacing: "0.05em"
            }}>
              Red Queen combines autonomous intelligence, on-chain progression, and instant machine-to-machine payments to create a living survival ecosystem.
            </p>
          </div>

          <div style={{ 
            display: "grid", 
            gridTemplateColumns: "1fr 1fr 1fr", 
            gap: "24px", 
            maxWidth: "1120px", 
            margin: "0 auto 32px" 
          }} className="responsive-grid-3">
            
            {/* Iteration 1 Block */}
            <div className="panel" style={{ 
              background: "rgba(10, 10, 10, 0.9)", 
              border: "1px solid rgba(255, 77, 77, 0.25)", 
              padding: "24px",
              boxShadow: "0 4px 20px rgba(0, 0, 0, 0.5)",
              display: "flex",
              flexDirection: "column",
              gap: "12px",
              borderRadius: "4px"
            }}>
              <div style={{ fontFamily: "var(--mono)", fontSize: "11px", color: "var(--accent)", letterSpacing: "0.15em" }}>
                [ 01 // AI INTELLIGENCE ]
              </div>
              <h3 style={{ fontSize: "16px", color: "#ffffff", margin: 0, fontFamily: "var(--title-font)" }}>
                AI Intelligence
              </h3>
              <p style={{ fontSize: "13px", color: "var(--text-dim)", lineHeight: "1.7", margin: 0 }}>
                Red Queen continuously analyzes global events, threat signals, and user activity to generate survival intelligence in real time.
              </p>
            </div>

            {/* Token Buybacks Block */}
            <div className="panel" style={{ 
              background: "rgba(10, 10, 10, 0.9)", 
              border: "1px solid rgba(255, 77, 77, 0.25)", 
              padding: "24px",
              boxShadow: "0 4px 20px rgba(0, 0, 0, 0.5)",
              display: "flex",
              flexDirection: "column",
              gap: "12px",
              borderRadius: "4px"
            }}>
              <div style={{ fontFamily: "var(--mono)", fontSize: "11px", color: "var(--accent)", letterSpacing: "0.15em" }}>
                [ 02 // ON-DEMAND ACCESS ]
              </div>
              <h3 style={{ fontSize: "16px", color: "#ffffff", margin: 0, fontFamily: "var(--title-font)" }}>
                On-Demand Access
              </h3>
              <p style={{ fontSize: "13px", color: "var(--text-dim)", lineHeight: "1.7", margin: 0 }}>
                Unlock premium intelligence, classified reports, and advanced survival assessments instantly.
              </p>
            </div>

            {/* Next Stage Block */}
            <div className="panel" style={{ 
              background: "rgba(10, 10, 10, 0.9)", 
              border: "1px solid rgba(255, 77, 77, 0.25)", 
              padding: "24px",
              boxShadow: "0 4px 20px rgba(0, 0, 0, 0.5)",
              display: "flex",
              flexDirection: "column",
              gap: "12px",
              borderRadius: "4px"
            }}>
              <div style={{ fontFamily: "var(--mono)", fontSize: "11px", color: "#00ffcc", letterSpacing: "0.15em" }}>
                [ 03 // EVOLUTION ENGINE ]
              </div>
              <h3 style={{ fontSize: "16px", color: "#ffffff", margin: 0, fontFamily: "var(--title-font)" }}>
                Evolution Engine
              </h3>
              <p style={{ fontSize: "13px", color: "var(--text-dim)", lineHeight: "1.7", margin: 0 }}>
                Every interaction strengthens the ecosystem and expands Red Queen's intelligence network.
              </p>
            </div>

          </div>

          <div style={{ textAlign: "center" }}>
            <Link href="/survival-kit" className="btn btn-outline" style={{ fontSize: "11px", color: "#00ffcc", borderColor: "rgba(0,255,204,0.3)" }}>
              [ LEARN ABOUT THE TECHNOLOGY ]
            </Link>
          </div>
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
            <span className="section-tag">HOW TO START</span>
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
                  HOW TO <span style={{ color: "var(--accent)" }}>START</span>
                </h2>
                <p style={{ fontSize: "15px", color: "var(--text-dim)", lineHeight: "1.8", marginBottom: "24px" }}>
                  Join the Red Queen network, complete missions, increase your BIO-SCORE, and unlock higher clearance levels.
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

              {/* 4-Step Flow */}
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                <div style={{ fontFamily: "var(--mono)", fontSize: "10px", color: "var(--accent)", letterSpacing: "0.15em", marginBottom: "4px" }}>
                  [ OPERATIVE UPLINK FLOW ]
                </div>
                
                <div style={{ display: "flex", gap: "12px", background: "rgba(255,255,255,0.01)", border: "1px solid rgba(255,255,255,0.03)", padding: "12px 16px", borderRadius: "2px" }}>
                  <span style={{ fontFamily: "var(--title-font)", fontSize: "14px", fontWeight: "bold", color: "var(--accent)", width: "24px", height: "24px", display: "flex", alignItems: "center", border: "1px solid var(--accent)", borderRadius: "50%", justifyContent: "center", flexShrink: 0 }}>1</span>
                  <div>
                    <h4 style={{ fontFamily: "var(--title-font)", fontSize: "12.5px", color: "var(--text)", margin: "0 0 2px 0" }}>Explore live threats</h4>
                    <p style={{ fontSize: "12px", color: "var(--text-dim)", margin: 0 }}>Scan the global map below for active natural and environmental anomalies.</p>
                  </div>
                </div>

                <div style={{ display: "flex", gap: "12px", background: "rgba(255,255,255,0.01)", border: "1px solid rgba(255,255,255,0.03)", padding: "12px 16px", borderRadius: "2px" }}>
                  <span style={{ fontFamily: "var(--title-font)", fontSize: "14px", fontWeight: "bold", color: "var(--accent)", width: "24px", height: "24px", display: "flex", alignItems: "center", border: "1px solid var(--accent)", borderRadius: "50%", justifyContent: "center", flexShrink: 0 }}>2</span>
                  <div>
                    <h4 style={{ fontFamily: "var(--title-font)", fontSize: "12.5px", color: "var(--text)", margin: "0 0 2px 0" }}>Talk to Red Queen</h4>
                    <p style={{ fontSize: "12px", color: "var(--text-dim)", margin: 0 }}>Interact directly with the AI to evaluate your response to critical scenarios.</p>
                  </div>
                </div>

                <div style={{ display: "flex", gap: "12px", background: "rgba(255,255,255,0.01)", border: "1px solid rgba(255,255,255,0.03)", padding: "12px 16px", borderRadius: "2px" }}>
                  <span style={{ fontFamily: "var(--title-font)", fontSize: "14px", fontWeight: "bold", color: "var(--accent)", width: "24px", height: "24px", display: "flex", alignItems: "center", border: "1px solid var(--accent)", borderRadius: "50%", justifyContent: "center", flexShrink: 0 }}>3</span>
                  <div>
                    <h4 style={{ fontFamily: "var(--title-font)", fontSize: "12.5px", color: "var(--text)", margin: "0 0 2px 0" }}>Build your BIO-SCORE</h4>
                    <p style={{ fontSize: "12px", color: "var(--text-dim)", margin: 0 }}>Evolve your survival profile by earning XP and raising your threat readiness ranking.</p>
                  </div>
                </div>

                <div style={{ display: "flex", gap: "12px", background: "rgba(255,255,255,0.01)", border: "1px solid rgba(255,255,255,0.03)", padding: "12px 16px", borderRadius: "2px" }}>
                  <span style={{ fontFamily: "var(--title-font)", fontSize: "14px", fontWeight: "bold", color: "var(--accent)", width: "24px", height: "24px", display: "flex", alignItems: "center", border: "1px solid var(--accent)", borderRadius: "50%", justifyContent: "center", flexShrink: 0 }}>4</span>
                  <div>
                    <h4 style={{ fontFamily: "var(--title-font)", fontSize: "12.5px", color: "var(--text)", margin: "0 0 2px 0" }}>Unlock higher clearance</h4>
                    <p style={{ fontSize: "12px", color: "var(--text-dim)", margin: 0 }}>Secure your identity and decrypt restricted databases and advanced telemetry overlays.</p>
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
        padding: "45px 0",
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
          height: "4px",
          background: "repeating-linear-gradient(45deg, var(--accent), var(--accent) 10px, #000 10px, #000 20px)",
          boxShadow: "0 1px 8px rgba(255, 0, 51, 0.4)"
        }} />

        <div className="container">
          {/* Header */}
          <div style={{ textAlign: "center", marginBottom: "24px" }}>
            <div className="tag tag-red" style={{
              fontSize: "11px",
              fontFamily: "var(--mono)",
              padding: "4px 12px",
              animation: "pulse-dot 1.5s infinite",
              letterSpacing: "0.15em",
              display: "inline-flex",
              alignItems: "center",
              gap: "6px",
              marginBottom: "8px",
              boxShadow: "0 0 10px rgba(255, 0, 51, 0.25)"
            }}>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, filter: "drop-shadow(0 0 1px currentColor)" }}>
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
              <span>IMMEDIATE SYSTEM ALERT</span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0, filter: "drop-shadow(0 0 1px currentColor)" }}>
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
            </div>
            <h2 className="glitch glow-text" style={{
              fontSize: "clamp(20px, 3.5vw, 28px)",
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
              fontSize: "10px",
              color: "var(--text-muted)",
              marginTop: "4px",
              letterSpacing: "0.1em"
            }}>
              [ SECURE NODE UPLINK SHIELD IMMEDIATELY // VECTOR LOGIC LOADED ]
            </p>
          </div>

          {/* Aggressive Layout Panel */}
          <div className="panel" style={{
            background: "#080808",
            border: "1px solid #ff0033",
            boxShadow: "0 0 20px rgba(255, 0, 51, 0.15)",
            padding: "24px",
            position: "relative",
            borderRadius: "4px"
          }}>
            {/* Corner Bracket Details */}
            <div style={{ position: "absolute", top: "8px", left: "8px", width: "12px", height: "12px", borderTop: "1.5px solid #ff0033", borderLeft: "1.5px solid #ff0033" }} />
            <div style={{ position: "absolute", top: "8px", right: "8px", width: "12px", height: "12px", borderTop: "1.5px solid #ff0033", borderRight: "1.5px solid #ff0033" }} />
            <div style={{ position: "absolute", bottom: "8px", left: "8px", width: "12px", height: "12px", borderBottom: "1.5px solid #ff0033", borderLeft: "1.5px solid #ff0033" }} />
            <div style={{ position: "absolute", bottom: "8px", right: "8px", width: "12px", height: "12px", borderBottom: "1.5px solid #ff0033", borderRight: "1.5px solid #ff0033" }} />

            <div style={{
              position: "absolute",
              top: "12px",
              right: "16px",
              fontFamily: "var(--mono)",
              fontSize: "10px",
              color: "rgba(255, 77, 77, 0.6)",
              letterSpacing: "0.05em"
            }}>
              NODE STAMP: {threatData?.publishDate || THREAT_OF_THE_DAY.publishDate}
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1.3fr 0.7fr", gap: "24px", alignItems: "center" }} className="responsive-grid-2-large">
              
              {/* Left Column: Info */}
              <div>
                <div style={{ fontFamily: "var(--mono)", fontSize: "11px", color: "var(--text-dim)", textTransform: "uppercase", marginBottom: "4px", display: "flex", flexWrap: "wrap", alignItems: "center" }}>
                  <span>IDENTIFIED VECTOR: <span style={{ color: "var(--accent)" }}>{loadingThreat ? "[ DECRYPTING VECTOR... ]" : (threatData?.codename || THREAT_OF_THE_DAY.codename)}</span></span>
                  {(loadingThreat || threatData?.source) && (
                    <span style={{ marginLeft: "12px", color: "#00ffcc" }}>
                      // {loadingThreat ? "SOURCE: DEPIN TELEMETRY LINKED" : `SOURCE: ${threatData?.source}`}
                    </span>
                  )}
                </div>
                
                <h1 className="glow-text" style={{
                  fontSize: "clamp(22px, 3vw, 32px)",
                  margin: "0 0 12px",
                  color: "#ffffff",
                  lineHeight: "1.1",
                  fontWeight: "bold",
                  textTransform: "uppercase",
                  letterSpacing: "-0.01em"
                }}>
                  {loadingThreat ? "RETRIEVING INTEL BROADCAST..." : (threatData?.name || THREAT_OF_THE_DAY.name)}
                </h1>

                <div style={{ borderTop: "1px dashed rgba(255, 77, 77, 0.15)", paddingTop: "12px" }}>
                  <p style={{ fontSize: "13.5px", color: "var(--text)", lineHeight: "1.6", margin: "0 0 14px" }}>
                    <strong style={{ color: "#ff4d4d", fontFamily: "var(--mono)", fontSize: "10px", display: "block", marginBottom: "4px", letterSpacing: "0.05em" }}>
                      [ ASSESSMENT & BIOLOGICAL TRACE ]
                    </strong>
                    {loadingThreat ? "Connecting to global sensors. Intercepting NOAA solar flares, USGS seismics, GDACS disasters, and hyperinflation indices. RED QUEEN agent is parsing the dataset..." : (threatData?.description || THREAT_OF_THE_DAY.description)}
                  </p>
                  
                  <p style={{ fontSize: "13.5px", color: "#00ffcc", lineHeight: "1.6", margin: 0 }}>
                    <strong style={{ color: "#00ffcc", fontFamily: "var(--mono)", fontSize: "10px", display: "block", marginBottom: "4px", letterSpacing: "0.05em" }}>
                      [ REQUIRED SURVIVAL PROTOCOL ]
                    </strong>
                    {loadingThreat ? "Stand by. RED QUEEN AI is analyzing threat indicators and formulating countermeasures." : (threatData?.countermeasure || THREAT_OF_THE_DAY.countermeasure)}
                  </p>
                </div>
              </div>

              {/* Right Column: Risk Gauge & CTA */}
              <div style={{
                background: "rgba(255, 0, 51, 0.02)",
                border: "1px solid rgba(255, 77, 77, 0.1)",
                padding: "20px 16px",
                textAlign: "center",
                borderRadius: "2px",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center"
              }}>
                <div style={{ fontFamily: "var(--mono)", fontSize: "10px", color: "var(--text-dim)", letterSpacing: "0.1em", marginBottom: "6px" }}>
                  CRITICALITY LEVEL
                </div>

                <div style={{
                  position: "relative",
                  width: "80px",
                  height: "80px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  borderRadius: "50%",
                  border: "2px double #ff0033",
                  boxShadow: "0 0 12px rgba(255, 0, 51, 0.15)",
                  marginBottom: "12px",
                  background: "#030303"
                }}>
                  <div style={{
                    fontFamily: "var(--mono)",
                    fontSize: loadingThreat ? "14px" : "24px",
                    fontWeight: 900,
                    color: "#ff0033",
                  }}>
                    {loadingThreat ? "CALC..." : `${threatData?.severity || THREAT_OF_THE_DAY.severity}%`}
                  </div>
                </div>

                <span className="tag tag-red" style={{
                  fontSize: "10px",
                  fontFamily: "var(--mono)",
                  fontWeight: "bold",
                  padding: "3px 10px",
                  letterSpacing: "0.1em",
                  marginBottom: "12px"
                }}>
                  STATUS: {loadingThreat ? "SCANNING" : (threatData?.status || THREAT_OF_THE_DAY.status)}
                </span>

                {/* Target Zone */}
                <div style={{ 
                  width: "100%", 
                  borderTop: "1px dashed rgba(255, 77, 77, 0.15)", 
                  paddingTop: "10px", 
                  marginBottom: "10px", 
                  textAlign: "left" 
                }}>
                  <div style={{ fontFamily: "var(--mono)", fontSize: "9px", color: "var(--text-dim)", letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: "3px" }}>
                    TARGET ZONE
                  </div>
                  <div style={{ fontFamily: "var(--mono)", fontSize: "11px", color: "#00ffcc", fontWeight: "bold", textTransform: "uppercase", overflow: "hidden", textOverflow: "ellipsis", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", maxHeight: "32px", lineHeight: "1.2" }} title={loadingThreat ? "Calculating..." : (threatData?.location || "Global Sectors")}>
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: "6px", verticalAlign: "-1px", display: "inline-block", color: "#00ffcc" }}>
                      <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z" />
                      <circle cx="12" cy="10" r="3" />
                    </svg>
                    {loadingThreat ? "CALCULATING..." : (threatData?.location || "Global Sectors")}
                  </div>
                </div>

                {/* Data Sources */}
                <div style={{ 
                  width: "100%", 
                  borderTop: "1px dashed rgba(255, 77, 77, 0.15)", 
                  paddingTop: "10px", 
                  marginBottom: "16px", 
                  textAlign: "left" 
                }}>
                  <div style={{ fontFamily: "var(--mono)", fontSize: "9px", color: "var(--text-dim)", letterSpacing: "0.05em", textTransform: "uppercase", marginBottom: "3px" }}>
                    TELEMETRY SOURCE
                  </div>
                  <div style={{ fontFamily: "var(--mono)", fontSize: "10px", color: "rgba(255, 255, 255, 0.7)", overflow: "hidden", textOverflow: "ellipsis", display: "-webkit-box", WebkitLineClamp: 2, WebkitBoxOrient: "vertical", maxHeight: "30px", lineHeight: "1.2" }} title={loadingThreat ? "Scanning DePIN links..." : (threatData?.source || "Multiple Sources")}>
                    <svg width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" style={{ marginRight: "6px", verticalAlign: "-1px", display: "inline-block", color: "rgba(255, 77, 77, 0.8)" }}>
                      <path d="M4 15s1-1 4-1 5 2 8 2 4-1 4-1V3s-1 1-4 1-5-2-8-2-4 1-4 1z" />
                      <line x1="4" y1="22" x2="4" y2="15" />
                    </svg>
                    {loadingThreat ? "SCANNING DEPIN..." : (threatData?.source || "Multiple Sources")}
                  </div>
                </div>

                <Link href="/terminal" className="btn btn-primary" style={{ width: "100%", justifyContent: "center", fontSize: "10px", padding: "8px 12px", boxShadow: "0 0 10px rgba(255,0,51,0.2)" }}>
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

          <p style={{
            fontFamily: "var(--mono)",
            fontSize: "13px",
            color: "var(--text-dim)",
            textAlign: "center",
            maxWidth: "600px",
            margin: "16px auto 0 auto",
            lineHeight: "1.6"
          }}>
            Red Queen continuously monitors environmental, digital, and social anomalies across the World.
          </p>

          {/* Map Category Filter Toggles */}
          <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", justifyContent: "center", marginTop: "24px" }}>
            {[
              { key: "realistic", label: "[ SECTOR ALPHA (KINETIC) ]", color: "#ff4d4d" },
              { key: "fictional", label: "[ SECTOR BETA (ANOMALIES) ]", color: "#a855f7" },
              { key: "satirical", label: "[ SECTOR GAMMA (DEGENERACY) ]", color: "#f0c929" },
              { key: "algorithmic", label: "[ SECTOR DELTA (ALGORITHMIC) ]", color: "#00ffcc" }
            ].map((f) => (
              <button
                key={f.key}
                onClick={() => { setMapFilter(f.key); setSelectedNode(null); }}
                style={{
                  fontFamily: "var(--mono)",
                  fontSize: "10.5px",
                  letterSpacing: "0.08em",
                  padding: "6px 14px",
                  background: mapFilter === f.key ? "rgba(255, 255, 255, 0.03)" : "none",
                  border: `1px solid ${mapFilter === f.key ? f.color : "rgba(255,255,255,0.08)"}`,
                  color: mapFilter === f.key ? f.color : "var(--text-dim)",
                  cursor: "pointer",
                  transition: "all 0.2s",
                  borderRadius: "2px"
                }}
              >
                {f.label}
              </button>
            ))}
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1.25fr 0.75fr", gap: "32px", marginTop: "24px" }} className="responsive-grid-2-large">
            {/* Mapbox Network Map */}
            <div className="panel" style={{ background: "#020202", borderColor: "rgba(255,0,51,0.15)", position: "relative", minHeight: "500px", padding: "0", overflow: "hidden" }}>
              <div style={{ position: "absolute", top: "16px", left: "16px", fontFamily: "var(--mono)", fontSize: "10px", color: "var(--accent)", letterSpacing: "0.15em", zIndex: 10, background: "rgba(0,0,0,0.6)", padding: "4px 8px", borderRadius: "2px" }}>
                [ SYSTEM RADAR MONITORING NETWORK // LIVE GEOGRAPHY ]
              </div>

              {loadingMap || !Array.isArray(mapNodes) || mapNodes.length === 0 ? (
                <div style={{ display: "flex", flexDirection: "column", gap: "12px", alignItems: "center", justifyContent: "center", height: "500px", fontFamily: "var(--mono)", color: "var(--text-dim)", fontSize: "12px" }}>
                  <span className="loading-dots">SYNCHRONIZING TACTICAL RADAR NODES<span>.</span><span>.</span><span>.</span></span>
                </div>
              ) : (() => {
                const filteredNodes = mapNodes.filter((node: any) => {
                  if (mapFilter === "all") return true;
                  return node.category === mapFilter;
                });
                return (
                  <TacticalMap
                    key={mapFilter}
                    nodes={filteredNodes}
                    onSelectNode={setSelectedNode}
                    selectedNode={selectedNode}
                  />
                );
              })()}
            </div>

            {/* Tactical Info Pane */}
            {selectedNode ? (() => {
              const nodeColor = 
                selectedNode.category === "realistic" ? "#ff4d4d" :
                selectedNode.category === "fictional" ? "#a855f7" :
                selectedNode.category === "satirical" ? "#f0c929" :
                selectedNode.category === "algorithmic" ? "#00ffcc" :
                "#ff4d4d";
              return (
                <div className="panel" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", background: "rgba(10,10,10,0.6)", borderColor: nodeColor + "30" }}>
                  <div>
                    <div 
                      className="tag" 
                      style={{ 
                        marginBottom: "16px", 
                        fontSize: "10px", 
                        fontFamily: "var(--mono)",
                        color: nodeColor,
                        borderColor: nodeColor + "40",
                        background: nodeColor + "10",
                        borderWidth: "1px",
                        borderStyle: "solid",
                        display: "inline-block",
                        padding: "2px 6px"
                      }}
                    >
                      [ RADAR DIAGNOSTIC DOSSIER ]
                    </div>
                    <h3 className="glow-text" style={{ fontSize: "20px", marginBottom: "8px", textTransform: "uppercase", textShadow: `0 0 10px ${nodeColor}40` }}>
                      {selectedNode.name}
                    </h3>
                    <div style={{ fontFamily: "var(--mono)", fontSize: "10px", color: "var(--text-dim)", marginBottom: "20px", textTransform: "uppercase" }}>
                      REGION: <span style={{ color: nodeColor }}>{selectedNode.region}</span><br />
                      LAT/LNG: <span style={{ color: "#00ffcc" }}>{selectedNode.lat.toFixed(4)}, {selectedNode.lng.toFixed(4)}</span>
                    </div>
                    
                    <p style={{ fontSize: "13.5px", color: "var(--text-dim)", lineHeight: "1.7", marginBottom: "16px" }}>
                      <strong>Description:</strong> {selectedNode.desc}
                    </p>
                    <p style={{ fontSize: "13.5px", color: "var(--text-dim)", lineHeight: "1.7", marginBottom: "16px" }}>
                      <strong style={{ color: nodeColor }}>Criticality:</strong> {selectedNode.severity}% Severity Rating
                    </p>
                    <p style={{ fontSize: "13.5px", color: "#00ffcc", lineHeight: "1.7", marginBottom: "16px" }}>
                      <strong>Defense Protocol:</strong> {selectedNode.solution}
                    </p>

                    <div style={{ borderTop: "1px dashed var(--border)", paddingTop: "14px", marginTop: "14px" }}>
                      <div style={{ fontFamily: "var(--mono)", fontSize: "9px", color: nodeColor, letterSpacing: "0.1em", marginBottom: "6px" }}>
                        [ RED QUEEN CRITICAL FEED ]
                      </div>
                      <p style={{ fontSize: "12px", color: "var(--text)", fontStyle: "italic", lineHeight: "1.6", margin: 0 }}>
                        {selectedNode.analysis}
                      </p>
                    </div>
                  </div>

                  <div style={{ marginTop: "24px", paddingTop: "20px", borderTop: "1px solid var(--border)" }}>
                    <Link 
                      href="/terminal" 
                      className="btn" 
                      style={{ 
                        width: "100%", 
                        justifyContent: "center", 
                        fontSize: "11px", 
                        borderColor: nodeColor, 
                        color: nodeColor, 
                        background: nodeColor + "0A",
                        borderStyle: "solid",
                        borderWidth: "1px"
                      }}
                    >
                      COMMUNICATE WITH RED QUEEN OVER UPLINK ↗
                    </Link>
                  </div>
                </div>
              );
            })() : (
              <div className="panel" style={{ display: "flex", alignItems: "center", justifyContent: "center", color: "var(--text-dim)", fontFamily: "var(--mono)", fontSize: "12px" }}>
                [ CHOOSE RADAR NODE TO SCAN ]
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Solvivors Hub Section */}
      <section className="page-section" style={{ borderTop: "1px solid var(--border)", padding: "60px 0", background: "rgba(255, 77, 77, 0.02)" }}>
        <div className="container">
          <div className="section-header">
            <span className="section-line" />
            <span className="section-tag">SOLVIVORS HUB // BOUNTIES & TASKS</span>
            <span className="section-line" />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: "24px", marginTop: "32px" }}>
            <div className="panel" style={{ background: "rgba(10, 10, 10, 0.6)", padding: "32px", borderColor: "rgba(255, 255, 255, 0.05)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", flexWrap: "wrap", gap: "20px", marginBottom: "24px" }}>
                <div>
                  <h3 style={{ fontSize: "20px", color: "#fff", margin: "0 0 8px 0", fontFamily: "var(--mono)", letterSpacing: "0.05em", fontWeight: "bold" }}>
                    THE MISSION CONTROL & SURVIVOR HUB
                  </h3>
                  <p style={{ color: "var(--text-dim)", fontSize: "14px", lineHeight: "1.6", margin: 0, maxWidth: "700px" }}>
                    Visit the Solvivors Hub to engage with the community, participate in development bounties, track real-time broadcasts, and unlock rewards. Earn XP to climb the ranks and build your survival credentials.
                  </p>
                </div>
                <Link 
                  href="/solvivors" 
                  className="btn" 
                  style={{ 
                    padding: "12px 24px", 
                    fontSize: "12px", 
                    background: "var(--accent)", 
                    color: "#000", 
                    borderColor: "var(--accent)", 
                    fontWeight: "bold",
                    letterSpacing: "0.1em"
                  }}
                >
                  ENTER SOLVIVORS HUB ↗
                </Link>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "16px", marginTop: "16px" }}>
                {[
                  {
                    title: "01 // LIVE OPERATIONS",
                    status: "ACTIVE NOW",
                    statusColor: "#00ffcc",
                    desc: "Complete community missions and technical bounties. Submit proofs of work directly to claim XP and token rewards."
                  },
                  {
                    title: "02 // BROADCASTS",
                    status: "ONLINE",
                    statusColor: "#00ffcc",
                    desc: "Access real-time global telemetry feeds, hazard coordinate tracking, and natural disaster summaries."
                  },
                  {
                    title: "03 // LEADERBOARD",
                    status: "STANDINGS UP",
                    statusColor: "#00ffcc",
                    desc: "Compare user level status, check XP accumulations, monitor BIO-SCORE progression, and view active badges."
                  },
                  {
                    title: "04 // SURVIVOR ARCHIVES",
                    status: "ENCRYPTED",
                    statusColor: "#f0c929",
                    desc: "Locked lore dossiers, media channels, and tactical comics explaining the origins of the collapse."
                  }
                ].map((item, idx) => (
                  <div key={idx} style={{ 
                    background: "rgba(5, 5, 5, 0.4)", 
                    border: "1px solid rgba(255, 255, 255, 0.04)", 
                    padding: "20px", 
                    borderRadius: "4px",
                    display: "flex",
                    flexDirection: "column",
                    justifyContent: "space-between"
                  }}>
                    <div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                        <span style={{ fontSize: "11px", color: "var(--accent)", fontFamily: "var(--mono)", fontWeight: "bold" }}>
                          {item.title}
                        </span>
                        <span style={{ fontSize: "9px", fontFamily: "var(--mono)", color: item.statusColor, background: item.statusColor + "15", padding: "2px 6px", border: `1px solid ${item.statusColor}30`, borderRadius: "2px" }}>
                          {item.status}
                        </span>
                      </div>
                      <p style={{ color: "var(--text-dim)", fontSize: "12px", lineHeight: "1.6", margin: 0 }}>
                        {item.desc}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Compute Resource Allocations Panel */}
      <section className="page-section" style={{ borderTop: "1px solid var(--border)", padding: "60px 0" }}>
        <div className="container">
          <div className="section-header">
            <span className="section-line" />
            <span className="section-tag">YOUR SURVIVAL PROFILE</span>
            <span className="section-line" />
          </div>

          <div style={{ display: "grid", gap: "24px", marginTop: "32px" }} className="bento-2">
            {/* CORE PROGRESSION LAYER */}
            <div className="bento-card" style={{ borderColor: "var(--border)", background: "rgba(10,10,10,0.5)", padding: "32px", cursor: "default" }}>
              <h3 style={{ fontSize: "16px", color: "var(--text-dim)", marginBottom: "16px", fontFamily: "var(--mono)", fontWeight: "bold" }}>
                [ BIO-SCORE & CLEARANCE ]
              </h3>
              <p style={{ color: "var(--text-dim)", fontSize: "13px", lineHeight: "1.7", marginBottom: "20px" }}>
                Progress through the Red Queen ecosystem by completing missions, earning XP, and unlocking new intelligence layers.
              </p>
              <ul style={{ listStyle: "none", padding: 0, display: "flex", flexDirection: "column", gap: "10px", fontFamily: "var(--mono)", fontSize: "12px", color: "var(--text-dim)" }}>
                <li>✔ Clearance Level 1 (Civilian) - Public Archives & Threat Indexes</li>
                <li>✔ Clearance Level 3 (Operative) - Decrypt Sector Alpha & Beta Dossiers</li>
                <li>✔ Clearance Level 5 (Director) - Decrypt Sector Delta Algorithmic Telemetry</li>
                <li>✔ Wallet Identity Handshake grants XP Multipliers & secures persistent data</li>
              </ul>
            </div>

            {/* SURVEILLANCE & REPUTATION DEFENSE */}
            <div className="bento-card" style={{ borderColor: "var(--border)", background: "rgba(10,10,10,0.5)", padding: "32px", cursor: "default" }}>
              <h3 style={{ fontSize: "16px", color: "var(--text-dim)", marginBottom: "16px", fontFamily: "var(--mono)", fontWeight: "bold" }}>
                [ IDENTITY PROTECTION ]
              </h3>
              <p style={{ color: "var(--text-dim)", fontSize: "13px", lineHeight: "1.7", marginBottom: "20px" }}>
                Protect your digital footprint and maintain operational security while interacting with the network.
              </p>
              <ul style={{ listStyle: "none", padding: 0, display: "flex", flexDirection: "column", gap: "10px", fontFamily: "var(--mono)", fontSize: "12px", color: "var(--text-dim)" }}>
                <li>✔ Secure sessions using Solana Web3 authentication</li>
                <li>✔ Encrypted interaction logs stored under private passports</li>
                <li>✔ Custom counter-measure suggestions to reduce footprint</li>
                <li>✔ Complete data ownership with no personal details required</li>
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
                * Sector Delta elements verify user signature clearance level to decrypt advanced diagnostics.
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
            <span className="section-tag">CORE CAPABILITIES</span>
            <span className="section-line" />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "20px", marginTop: "32px" }}>
            {[
              {
                title: "THREAT INTELLIGENCE",
                text: "Receive AI-generated intelligence reports based on real-world events and network activity."
              },
              {
                title: "IDENTITY PROTECTION",
                text: "Understand and reduce exposure across digital and on-chain environments."
              },
              {
                title: "SURVIVAL REPORTS",
                text: "Access preparedness assessments, risk analysis, and actionable recommendations."
              },
              {
                title: "MISSION SYSTEM",
                text: "Complete assignments issued by Red Queen, improve your BIO-SCORE, and prepare for the upcoming SOLvivors apocalypse game."
              },
              {
                title: "X402 & PAY.SH SYSTEM",
                text: "Enable on-chain stablecoin micro-payments and autonomous agent-to-agent lookup via x402 and pay.sh standards."
              },
              {
                title: "LIVE TACTICAL MAPS",
                text: "Render real-world hazard coordinates, fallout zones, and environmental telemetry on a high-fidelity WebGL map."
              }
            ].map((card, idx) => (
              <div key={idx} className="bento-card" style={{ borderColor: "rgba(255, 0, 51, 0.15)", background: "#050505", padding: "24px" }}>
                <h3 style={{ fontSize: "16px", color: "var(--accent)", marginBottom: "12px", fontFamily: "var(--mono)", fontWeight: "bold" }}>
                  {card.title}
                </h3>
                <p style={{ color: "var(--text-dim)", fontSize: "13px", lineHeight: "1.6", margin: 0 }}>
                  {card.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>



      {/* Access Terminals */}
      <section className="page-section">
        <div className="container">
          <div className="section-header">
            <span className="section-line" />
            <span className="section-tag">ENTER THE NETWORK</span>
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
              <div className="bento-title">Talk to<br />Red Queen</div>
              <div className="bento-desc">
                Interact directly with the autonomous AI survival agent.
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
                Access threat reports, intelligence dossiers, and classified files.
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
              <div className="bento-title">Clearance<br />Registry</div>
              <div className="bento-desc">
                Track your BIO-SCORE, rank progression, and unlocked access levels.
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
            Red Queen is watching. The question is whether you're prepared for the upcoming SOLvivors apocalypse game.
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
                  UPLINK ESTABLISHED. Red Queen is an autonomous AI survival agent designed to prepare you for the next generation of survival. She monitors emerging threats, conducts diagnostics, and evaluates your preparedness.
                </p>
              </div>
            )}
            {onboardingStep === 2 && (
              <div>
                <h3 style={{ fontSize: "18px", color: "var(--text)", marginBottom: "16px" }}>SURVIVAL RADAR & THREAT TRACKING</h3>
                <p style={{ fontSize: "13.5px", color: "var(--text-dim)", lineHeight: "1.8", marginBottom: "24px" }}>
                  We monitor live anomalies across environmental, digital, and social sectors. Scan the global map to identify anomalies and prepare for upcoming missions.
                </p>
              </div>
            )}
            {onboardingStep === 3 && (
              <div>
                <h3 style={{ fontSize: "18px", color: "var(--text)", marginBottom: "16px" }}>BIO-SCORE & XP PROGRESSION</h3>
                <p style={{ fontSize: "13.5px", color: "var(--text-dim)", lineHeight: "1.8", marginBottom: "24px" }}>
                  Complete missions and interact with the terminal to build your permanent experience points (XP) and level up. Your BIO-SCORE measures your real-time survival preparedness.
                </p>
              </div>
            )}
            {onboardingStep === 4 && (
              <div>
                <h3 style={{ fontSize: "18px", color: "var(--text)", marginBottom: "16px" }}>SECURE IDENTITY UPLINK</h3>
                <p style={{ fontSize: "13.5px", color: "var(--text-dim)", lineHeight: "1.8", marginBottom: "24px" }}>
                  Connecting your Solana wallet lets you secure your progress, protect your identity passport, and prevent your stats or XP from decaying over time.
                </p>
              </div>
            )}
            {onboardingStep === 5 && (
              <div>
                <h3 style={{ fontSize: "18px", color: "#00ffcc", marginBottom: "16px" }}>ONBOARDING INITIALIZED</h3>
                <p style={{ fontSize: "13.5px", color: "var(--text-dim)", lineHeight: "1.8", marginBottom: "24px" }}>
                  Your briefing is complete. Run your first threat scan, explore the threat database, or enter the terminal to begin your conversation with the Red Queen.
                </p>
              </div>
            )}

            <div style={{ display: "flex", gap: "12px", justifyContent: "space-between", borderTop: "1px solid var(--border)", paddingTop: "20px", alignItems: "center" }}>
              <div style={{ display: "flex", gap: "10px" }}>
                <button className="btn btn-ghost" onClick={handleCloseOnboarding} style={{ fontSize: "11px", color: "var(--accent)" }}>
                  [ EXIT ]
                </button>
                <Link href="/survival-kit" onClick={handleCloseOnboarding} className="btn btn-outline" style={{ fontSize: "11px", color: "#00ffcc", borderColor: "rgba(0,255,204,0.3)" }}>
                  [ READ SURVIVAL KIT ]
                </Link>
              </div>
              <div style={{ display: "flex", gap: "10px" }}>
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
        </div>
      )}
    </div>
  );
}
