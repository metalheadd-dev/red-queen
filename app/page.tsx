"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import SolvivalIcon from "@/components/SolvivalIcon";
import BootSequence from "@/components/BootSequence";

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
  const [activeX402Step, setActiveX402Step] = useState(1);
  const [liveFeed, setLiveFeed] = useState<Array<{ id: number; time: string; msg: string }>>([]);

  // Onboarding wizard states
  const [showOnboarding, setShowOnboarding] = useState(false);
  const [onboardingStep, setOnboardingStep] = useState(1);

  useEffect(() => {
    if (booted) {
      fetchThreat();
      
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

      {/* Interactive Threat Map Section */}
      <section className="page-section" style={{ borderTop: "1px solid var(--border)", background: "var(--surface)", padding: "60px 0" }}>
        <div className="container">
          <div className="section-header">
            <span className="section-line" />
            <span className="section-tag">LIVE THREAT MAP & GRID ANOMALIES</span>
            <span className="section-line" />
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: "32px", marginTop: "32px" }} className="responsive-grid-2-large">
            {/* SVG Network Map */}
            <div className="panel" style={{ background: "#020202", borderColor: "rgba(255,0,51,0.15)", position: "relative", minHeight: "360px", padding: "16px" }}>
              <div style={{ position: "absolute", top: "16px", left: "16px", fontFamily: "var(--mono)", fontSize: "10px", color: "var(--accent)", letterSpacing: "0.15em" }}>
                [ SYSTEM RADAR MONITORING NETWORK ]
              </div>
              
              <svg viewBox="0 0 700 400" style={{ width: "100%", height: "100%", opacity: 0.85 }}>
                {/* Tactical grid background lines */}
                <defs>
                  <pattern id="grid" width="40" height="40" patternUnits="userSpaceOnUse">
                    <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255, 0, 51, 0.05)" strokeWidth="1" />
                  </pattern>
                </defs>
                <rect width="100%" height="100%" fill="url(#grid)" />

                {/* Abstract network connections */}
                <path d="M120 150 L190 220 L420 240 M580 180 L380 110 L420 240 M490 310 L420 240 M190 220 L490 310" stroke="rgba(255, 0, 51, 0.15)" strokeWidth="1" strokeDasharray="3 3" />
                
                {/* Hotspots */}
                {MAP_HOTSPOTS.map((spot) => {
                  const isSelected = selectedHotspot.id === spot.id;
                  return (
                    <g key={spot.id} onClick={() => setSelectedHotspot(spot)} style={{ cursor: "pointer" }}>
                      {/* Pulse circle */}
                      <circle cx={spot.coords.x} cy={spot.coords.y} r={isSelected ? "15" : "8"} fill="none" stroke={spot.type === "WALLET-TRAIL" || spot.type === "AI-PROFILING" ? "var(--accent)" : "#f0c929"} strokeWidth="1.5" opacity={isSelected ? 0.8 : 0.4}>
                        <animate attributeName="r" values="6;22;6" dur="3s" repeatCount="indefinite" />
                      </circle>
                      {/* Center dot */}
                      <circle cx={spot.coords.x} cy={spot.coords.y} r="5" fill={isSelected ? "var(--accent)" : "#ff0033"} />
                    </g>
                  );
                })}
              </svg>
            </div>

            {/* Tactical Info Pane */}
            <div className="panel" style={{ display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
              <div>
                <div className="tag tag-red" style={{ marginBottom: "16px", fontSize: "10px", fontFamily: "var(--mono)" }}>
                  [ THREAT VECTOR IDENTIFIED ]
                </div>
                <h3 className="glow-text" style={{ fontSize: "20px", marginBottom: "12px", textTransform: "uppercase" }}>
                  {selectedHotspot.name}
                </h3>
                <div style={{ fontFamily: "var(--mono)", fontSize: "11px", color: "var(--text-dim)", marginBottom: "20px", textTransform: "uppercase" }}>
                  VECTOR TYPE: <span style={{ color: "var(--accent)" }}>{selectedHotspot.type}</span>
                </div>
                
                <p style={{ fontSize: "13.5px", color: "var(--text-dim)", lineHeight: "1.8", marginBottom: "16px" }}>
                  <strong>Description:</strong> {selectedHotspot.desc}
                </p>
                <p style={{ fontSize: "13.5px", color: "var(--text-dim)", lineHeight: "1.8", marginBottom: "16px" }}>
                  <strong style={{ color: "#ff4d4d" }}>Risk Profile:</strong> {selectedHotspot.risk}
                </p>
                <p style={{ fontSize: "13.5px", color: "#00ffcc", lineHeight: "1.8", margin: 0 }}>
                  <strong>Counter-Measure:</strong> {selectedHotspot.solution}
                </p>
              </div>

              <div style={{ marginTop: "24px", paddingTop: "20px", borderTop: "1px solid var(--border)" }}>
                <Link href={`/threat-vector/${selectedHotspot.type}`} className="btn btn-primary" style={{ width: "100%", justifyContent: "center", fontSize: "11px" }}>
                  RUN THREAT SCAN ON PORTAL
                </Link>
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
