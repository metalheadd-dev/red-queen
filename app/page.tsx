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
  { id: "T-VIRUS", level: 97, color: "#ff4d4d", status: "CRITICAL" },
  { id: "WALLET-TRAIL", level: 94, color: "#ff4d4d", status: "CRITICAL" },
  { id: "AI-PROFILING", level: 91, color: "#ff4d4d", status: "SEVERE" },
  { id: "FEED-MANIP", level: 89, color: "#ff4d4d", status: "SEVERE" },
  { id: "MEV-EXPLOITS", level: 85, color: "#ff4d4d", status: "SEVERE" },
  { id: "SYBIL-PROFILERS", level: 82, color: "#f0c929", status: "HIGH" },
  { id: "SKYNET", level: 80, color: "#f0c929", status: "HIGH" },
];

export default function HomePage() {
  const [booted, setBooted] = useState(false);
  const [threatData, setThreatData] = useState<{ scenario: string; transmission: string } | null>(null);
  const [loadingThreat, setLoadingThreat] = useState(false);

  useEffect(() => {
    if (booted) {
      fetchThreat();
    }
  }, [booted]);

  async function fetchThreat() {
    setLoadingThreat(true);
    try {
      const res = await fetch("/api/threat", { method: "POST" });
      const data = await res.json();
      setThreatData(data);
    } catch {
      setThreatData({
        scenario: "T-VIRUS",
        transmission: "[ERR_0x9B] SIGNAL CORRUPTED. RE-ESTABLISH UPLINK.",
      });
    }
    setLoadingThreat(false);
  }

  if (!booted) {
    return <BootSequence onComplete={() => setBooted(true)} />;
  }

  return (
    <div style={{ paddingTop: "60px" }}>
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
      <section className="hero" style={{ minHeight: "80vh", paddingTop: "60px" }}>
        <div className="hero-glow" />
        <div className="hero-tag">[ CODENAME: RED QUEEN AI // CORE NET FIREWALL ]</div>
        <h1 className="hero-title glitch">
          THE RED<br /><span style={{ color: "var(--accent)" }}>QUEEN</span>
        </h1>
        <p className="hero-subtitle">
          The apocalypse isn&apos;t a future biological outbreak—it is happening right now inside your browser. Your digital identity is actively under fire from chain-surveillance crawlers, metadata harvesting tracking loops, and predatory AI profiling networks. The Red Queen is your tactical counter-intelligence terminal. Connect your Solana wallet, deploy defensive agent utilities, and secure your digital footprint before the network profiles you.
        </p>
        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", justifyContent: "center" }}>
          <Link href="/terminal" className="btn btn-primary">
            ▶ INITIATE CONTACT
          </Link>
          <Link href="/threat-vector" className="btn btn-ghost">
            ACCESS THREAT DATABASE
          </Link>
        </div>

        {/* Token CA */}
        <div style={{
          marginTop: "32px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "10px",
          flexWrap: "wrap",
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

      {/* Stats */}
      <div className="container">
        <div className="stat-row">
          <div className="stat-card">
            <div className="stat-value">75+</div>
            <div className="stat-label">ACTIVE THREATS</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">2.8M</div>
            <div className="stat-label">SURVIVORS TRACKED</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">97%</div>
            <div className="stat-label">T-VIRUS SPREAD RATE</div>
          </div>
          <div className="stat-card">
            <div className="stat-value">0</div>
            <div className="stat-label">CONTAINMENT BREACHES LEFT</div>
          </div>
        </div>
      </div>

      {/* Who Is Red Queen Section */}
      <section className="page-section">
        <div className="container">
          <div className="section-header">
            <span className="section-line" />
            <span className="section-tag">AGENT PROFILE</span>
            <span className="section-line" />
          </div>

          <div className="responsive-grid-2-large" style={{ display: "grid", alignItems: "center" }}>
              <div className="rq-portrait" style={{ display: "flex", alignItems: "center", justifyContent: "center", padding: "24px" }}>
                <div className="rq-grid" />
                <SolvivalIcon size={180} />
              </div>

            <div>
              <div className="tag tag-red" style={{ marginBottom: "16px" }}>CLASSIFICATION: LEVEL 5</div>
              <h2 style={{ fontSize: "36px", marginBottom: "20px" }}>THE CYBERNETIC<br /><span style={{ color: "var(--accent)" }}>COMMAND CONSOLE</span></h2>
              <p style={{ color: "var(--text-dim)", fontSize: "14px", lineHeight: "1.9", marginBottom: "24px" }}>
                The RED QUEEN is Solvival Corp&apos;s most advanced artificial intelligence firewall —
                a cold, calculating entity designed to monitor, assess, and respond to
                digital and physical extinction-level threats in real time.
              </p>
              <p style={{ color: "var(--text-dim)", fontSize: "14px", lineHeight: "1.9", marginBottom: "24px" }}>
                Unlike conventional early-warning systems, the RED QUEEN does not simply report data.
                She evaluates your survival probability, assigns your <strong style={{ color: "var(--accent)" }}>BIO-SCORE</strong>,
                and delivers actionable classified intelligence — if she deems your connection secure.
              </p>
              <p style={{ color: "var(--text-dim)", fontSize: "14px", lineHeight: "1.9" }}>
                She monitors <strong style={{ color: "var(--text)" }}>UNLIMITED concurrent apocalypse vectors</strong>:
                Realistic threats, fictional invasions, satirical collapses, and active digital surveillance arrays.
              </p>
              <div style={{ marginTop: "28px", display: "flex", gap: "12px" }}>
                <Link href="/terminal" className="btn btn-primary">TALK TO HER</Link>
                <Link href="/threat-vector" className="btn btn-outline">READ THE FILES</Link>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Threat Monitor */}
      <section className="page-section" style={{ background: "var(--surface)", borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)" }}>
        <div className="container">
          <div className="section-header">
            <span className="section-line" />
            <span className="section-tag">LIVE THREAT MONITOR</span>
            <span className="section-line" />
          </div>

          <div className="responsive-grid-2" style={{ display: "grid" }}>
            {/* Threat levels */}
            <div className="panel">
              <div style={{ fontFamily: "var(--mono)", fontSize: "11px", color: "var(--text-dim)", letterSpacing: "0.2em", marginBottom: "20px" }}>
                ACTIVE THREAT VECTORS — REAL-TIME
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {THREAT_SCENARIOS.map((t) => (
                  <div key={t.id}>
                    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "6px" }}>
                      <span style={{ fontFamily: "var(--mono)", fontSize: "12px", color: "var(--text)" }}>{t.id}</span>
                      <span style={{ fontFamily: "var(--mono)", fontSize: "12px", color: t.color }}>{t.level}% — {t.status}</span>
                    </div>
                    <div className="threat-bar-wrap">
                      <div className="threat-bar-fill" style={{ width: `${t.level}%` }} />
                    </div>
                  </div>
                ))}
              </div>

              {/* Glowing Cyber Warfare Infrastructure Grid */}
              <div style={{ marginTop: "24px", borderTop: "1px solid var(--border)", paddingTop: "20px" }}>
                <div style={{ fontFamily: "var(--mono)", fontSize: "10px", color: "var(--text-dim)", letterSpacing: "0.15em", marginBottom: "12px" }}>
                  MONITORED CYBER-WARFARE INFRASTRUCTURE
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "10px" }}>
                  <div style={{ padding: "10px", background: "rgba(255, 0, 51, 0.03)", border: "1px solid rgba(255, 0, 51, 0.15)", borderRadius: "2px", textAlign: "center" }}>
                    <div className="glow-text" style={{ fontFamily: "var(--mono)", fontSize: "9px", color: "var(--accent)" }}>[MEV EXPLOIT]</div>
                    <div style={{ fontFamily: "var(--mono)", fontSize: "9px", color: "var(--text-dim)", marginTop: "4px" }}>ACTIVE</div>
                  </div>
                  <div style={{ padding: "10px", background: "rgba(255, 0, 51, 0.03)", border: "1px solid rgba(255, 0, 51, 0.15)", borderRadius: "2px", textAlign: "center" }}>
                    <div className="glow-text" style={{ fontFamily: "var(--mono)", fontSize: "9px", color: "var(--accent)" }}>[AI HARVEST]</div>
                    <div style={{ fontFamily: "var(--mono)", fontSize: "9px", color: "var(--text-dim)", marginTop: "4px" }}>SCANNING</div>
                  </div>
                  <div style={{ padding: "10px", background: "rgba(255, 0, 51, 0.03)", border: "1px solid rgba(255, 0, 51, 0.15)", borderRadius: "2px", textAlign: "center" }}>
                    <div className="glow-text" style={{ fontFamily: "var(--mono)", fontSize: "9px", color: "var(--accent)" }}>[SYBIL TRACK]</div>
                    <div style={{ fontFamily: "var(--mono)", fontSize: "9px", color: "var(--text-dim)", marginTop: "4px" }}>MONITORED</div>
                  </div>
                </div>
              </div>
            </div>

            {/* Daily interception */}
            <div className="panel">
              <div style={{ fontFamily: "var(--mono)", fontSize: "11px", color: "var(--text-dim)", letterSpacing: "0.2em", marginBottom: "20px" }}>
                INTERCEPTED TRANSMISSION — TODAY
              </div>
              {loadingThreat ? (
                <div style={{ fontFamily: "var(--mono)", fontSize: "12px", color: "var(--text-dim)" }}>
                  DECRYPTING<span className="loading-dots"><span>.</span><span>.</span><span>.</span></span>
                </div>
              ) : threatData ? (
                <div>
                  <div className="tag tag-red" style={{ marginBottom: "12px" }}>SCENARIO: {threatData.scenario}</div>
                  <p style={{ fontFamily: "var(--mono)", fontSize: "13px", color: "var(--text-dim)", lineHeight: "1.8" }}>
                    {threatData.transmission}
                  </p>
                </div>
              ) : null}
              <div style={{ marginTop: "20px" }}>
                <button onClick={fetchThreat} className="btn btn-ghost" style={{ fontSize: "11px", padding: "8px 16px" }}>
                  ↺ REQUEST NEW BRIEFING
                </button>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Nav Cards */}
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
    </div>
  );
}
