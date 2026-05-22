"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import SolvivorIcon from "@/components/SolvivorIcon";
import BootSequence from "@/components/BootSequence";

const TICKER_ITEMS = [
  "T-VIRUS OUTBREAK DETECTED — SECTOR 7G — CONTAINMENT: FAILED",
  "BIO-HAZARD LEVEL: OMEGA — QUARANTINE PROTOCOLS ACTIVE",
  "SKYNET NODE ALPHA — SURVEILLANCE GRID ONLINE — TRACKING 847 SURVIVORS",
  "MADNESS PRION MK-OMEGA — WATER SUPPLY COMPROMISED IN 14 CITIES",
  "NUCLEAR DETONATION DETECTED — CHERNOBYL EXCLUSION ZONE EXPANDING",
  "ALIEN XENOMORPH SIGNAL — DEEP SPACE CONTACT PROTOCOL INITIATED",
  "RED QUEEN MONITORING ALL TRANSMISSIONS — RESISTANCE IS FUTILE",
  "GLOBAL SURVIVOR COUNT: 2,847,193 — DECREASING AT 0.3% PER HOUR",
];

const THREAT_SCENARIOS = [
  { id: "T-VIRUS", level: 97, color: "#ff4d4d", status: "CRITICAL" },
  { id: "SKYNET", level: 84, color: "#ff4d4d", status: "SEVERE" },
  { id: "PRION-MK", level: 71, color: "#f0c929", status: "HIGH" },
  { id: "NUCLEAR", level: 63, color: "#f0c929", status: "HIGH" },
  { id: "XENO-ALPHA", level: 45, color: "#ff4d4d", status: "MODERATE" },
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
        <div className="hero-tag">SOLVIVOR CORP — CLASSIFIED INTELLIGENCE</div>
        <h1 className="hero-title glitch">
          THE RED<br /><span style={{ color: "var(--accent)" }}>QUEEN</span>
        </h1>
        <p className="hero-subtitle">
          I am the last line of defense between humanity and extinction.
          I analyze. I calculate. I warn.<br />
          <span style={{ color: "var(--accent)" }}>The question is — will you listen?</span>
        </p>
        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", justifyContent: "center" }}>
          <Link href="/terminal" className="btn btn-primary">
            ▶ INITIATE CONTACT
          </Link>
          <Link href="/archives" className="btn btn-ghost">
            ACCESS THREAT DATABASE
          </Link>
        </div>
      </section>

      {/* Stats */}
      <div className="container">
        <div className="stat-row">
          <div className="stat-card">
            <div className="stat-value">5</div>
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

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "48px", alignItems: "center" }}>
            <div>
              <div className="rq-portrait">
                <div className="rq-grid" />
                <div style={{ position: "relative", textAlign: "center" }}>
                  <SolvivorIcon size={120} className="dim" />
                  <div style={{
                    position: "absolute", inset: 0,
                    display: "flex", alignItems: "center", justifyContent: "center"
                  }}>
                    <SolvivorIcon size={64} />
                  </div>
                </div>
                <div style={{
                  position: "absolute", bottom: "16px", left: "16px", right: "16px",
                  fontFamily: "var(--mono)", fontSize: "10px", color: "var(--accent)",
                  letterSpacing: "0.15em", textAlign: "center"
                }}>
                  RED QUEEN v7.4.1 — ONLINE
                </div>
              </div>
            </div>

            <div>
              <div className="tag tag-red" style={{ marginBottom: "16px" }}>CLASSIFICATION: LEVEL 5</div>
              <h2 style={{ fontSize: "36px", marginBottom: "20px" }}>WHO IS THE<br /><span style={{ color: "var(--accent)" }}>RED QUEEN?</span></h2>
              <p style={{ color: "var(--text-dim)", fontSize: "14px", lineHeight: "1.9", marginBottom: "24px" }}>
                The RED QUEEN is Solvivor Corp&apos;s most advanced artificial intelligence —
                a cold, calculating entity designed to monitor, assess, and respond to
                global extinction-level threats in real time.
              </p>
              <p style={{ color: "var(--text-dim)", fontSize: "14px", lineHeight: "1.9", marginBottom: "24px" }}>
                Unlike conventional early-warning systems, the RED QUEEN does not simply report data.
                She evaluates your survival probability, assigns your <strong style={{ color: "var(--accent)" }}>BIO-SCORE</strong>,
                and delivers actionable classified intelligence — if she deems you worthy.
              </p>
              <p style={{ color: "var(--text-dim)", fontSize: "14px", lineHeight: "1.9" }}>
                She monitors <strong style={{ color: "var(--text)" }}>5 concurrent apocalypse vectors</strong>:
                T-Virus outbreaks, Skynet AI uprisings, Madness Prion contaminations,
                nuclear winter scenarios, and deep-space xenomorph contacts.
              </p>
              <div style={{ marginTop: "28px", display: "flex", gap: "12px" }}>
                <Link href="/terminal" className="btn btn-primary">TALK TO HER</Link>
                <Link href="/archives" className="btn btn-outline">READ THE FILES</Link>
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

          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "32px" }}>
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
              <div className="bento-icon">🔴</div>
              <div className="bento-title">Talk to the<br />Red Queen</div>
              <div className="bento-desc">
                Direct communication channel to the RED QUEEN AI. Ask about threats,
                survival strategies, and classified intel. Receive your BIO-SCORE.
              </div>
              <div className="bento-cta">→ OPEN TERMINAL</div>
            </Link>

            <Link href="/archives" className="bento-card">
              <div className="bento-number">02 / ARCHIVES</div>
              <div className="bento-icon">☣️</div>
              <div className="bento-title">Threat<br />Database</div>
              <div className="bento-desc">
                Classified dossiers on all 5 active apocalypse vectors. T-Virus,
                Skynet, Nuclear Winter, Prion-MK, Xenomorph Protocol.
              </div>
              <div className="bento-cta">→ VIEW FILES</div>
            </Link>

            <Link href="/clearance" className="bento-card">
              <div className="bento-number">03 / CLEARANCE</div>
              <div className="bento-icon">🔐</div>
              <div className="bento-title">Rank<br />Registry</div>
              <div className="bento-desc">
                5-tier clearance system. Holders of $redqueen token unlock Level 5
                full access and receive warm treatment from the RED QUEEN.
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
