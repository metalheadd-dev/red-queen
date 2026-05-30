"use client";
import { useState, useEffect, use } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { useAuth } from "@/components/AuthProvider";
import Link from "next/link";
import { CATEGORIES, Threat } from "@/lib/threats";
import { getThreatMetadata } from "@/lib/threatMetadata";

export default function ThreatDossierPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const id = resolvedParams.id;
  const { publicKey, connected } = useWallet();
  const { setVisible } = useWalletModal();
  const { user, authIdentifier } = useAuth();

  const solanaWalletAddress = publicKey ? publicKey.toString() : null;
  const activeIdentity = authIdentifier || solanaWalletAddress;

  const [threat, setThreat] = useState<Threat | null>(null);
  const [category, setCategory] = useState<any>(null);
  
  const [revealed, setRevealed] = useState(false);
  const [glitching, setGlitching] = useState(false);
  const [loading, setLoading] = useState(false);
  
  // Custom Dynamic Report for Sector Delta
  const [diagnosticsReport, setDiagnosticsReport] = useState<string | null>(null);

  // User stats & decrypt warning states
  const [userStats, setUserStats] = useState<any>(null);
  const [loadingStats, setLoadingStats] = useState(false);
  const [decryptError, setDecryptError] = useState<string | null>(null);

  useEffect(() => {
    let foundThreat: Threat | null = null;
    let foundCat: any = null;

    for (const cat of CATEGORIES) {
      const match = cat.threats.find((t) => t.id === id);
      if (match) {
        foundThreat = match;
        foundCat = cat;
        break;
      }
    }

    setThreat(foundThreat);
    setCategory(foundCat);
  }, [id]);

  useEffect(() => {
    async function loadStats() {
      if (!activeIdentity) {
        setUserStats(null);
        return;
      }
      setLoadingStats(true);
      try {
        const res = await fetch(`/api/profile?wallet=${activeIdentity}`);
        const data = await res.json();
        if (data.profile && data.profile.stats) {
          setUserStats(data.profile.stats);
        } else {
          setUserStats({ level: 1 });
        }
      } catch (err) {
        console.error("Failed to load user stats:", err);
        setUserStats({ level: 1 });
      } finally {
        setLoadingStats(false);
      }
    }
    loadStats();
    setDecryptError(null);
  }, [activeIdentity]);

  if (!threat || !category) {
    return (
      <div style={{ padding: "120px 24px 60px", textTransform: "uppercase", fontFamily: "var(--mono)", color: "var(--accent)", background: "#050505", minHeight: "100vh" }} className="container">
        [ERR_0x04] VECTOR ID NOT FOUND IN DATABASE.
        <br /><br />
        <Link href="/threat-vector" className="btn btn-ghost" style={{ marginTop: "20px" }}>RETURN TO HUB</Link>
      </div>
    );
  }

  const isSectorDelta = category.key === "algorithmic";

  async function handleDecryptClick() {
    setDecryptError(null);
    
    if (!activeIdentity) {
      setDecryptError("IDENTITY HANDSHAKE REQUIRED. Please connect your Solana wallet or log in with your email credentials to verify your operative clearance level.");
      return;
    }

    const currentLevel = userStats?.level || 1;
    const requiredLevel = isSectorDelta ? 5 : 3;

    if (currentLevel < requiredLevel) {
      setDecryptError(`[ACCESS DENIED] INSUFFICIENT OPERATIVE CLEARANCE. Sector requires Level ${requiredLevel} (${requiredLevel === 5 ? "DIRECTOR" : "OPERATIVE"}). Your active signature profile registers as Level ${currentLevel} (${currentLevel >= 4 ? "ANALYST" : currentLevel >= 3 ? "OPERATIVE" : currentLevel >= 2 ? "OBSERVER" : "CIVILIAN"}). Submit diagnostics inside the Terminal to earn XP and upgrade clearance.`);
      return;
    }

    setLoading(true);
    if (isSectorDelta) {
      try {
        const res = await fetch(`/api/terminal/analyze-wallet?vector=${threat!.id}&wallet=${activeIdentity}`, {
          method: "POST"
        });

        if (res.ok) {
          const data = await res.json();
          setDiagnosticsReport(data.report);
          triggerDecryptAnimation();
        } else {
          const err = await res.json().catch(() => ({}));
          setDecryptError(err.error || "[ERR_0x9B] Decryption analysis sweep trigger failed.");
        }
      } catch (err) {
        console.error(err);
        setDecryptError("System timeout: Connection to telemetry processing node lost.");
      } finally {
        setLoading(false);
      }
    } else {
      triggerDecryptAnimation();
      setLoading(false);
    }
  }

  function triggerDecryptAnimation() {
    setGlitching(true);
    setTimeout(() => {
      setGlitching(false);
      setRevealed(true);
    }, 650);
  }

  const meta = getThreatMetadata(threat.id, threat.level, threat.status, category.key);

  return (
    <div style={{ padding: "80px 0 60px", minHeight: "100vh", background: "#050505" }}>
      <div className="container" style={{ padding: "24px" }}>
        {/* Breadcrumb */}
        <div style={{ marginBottom: "24px" }}>
          <Link href="/threat-vector" style={{ fontFamily: "var(--mono)", fontSize: "11px", color: category.color, textDecoration: "none", letterSpacing: "0.15em" }}>
            ← BACK TO MATRIX
          </Link>
        </div>

        {/* Dossier Card */}
        <div className="threat-card" style={{ borderColor: category.color + "25", padding: "32px", background: "var(--surface)" }}>
          {/* Card Header */}
          <div className="threat-card-header" style={{ borderBottom: "1px solid var(--border)", paddingBottom: "24px", marginBottom: "24px" }}>
            <div>
              <div style={{ fontFamily: "var(--mono)", fontSize: "10px", color: category.color, letterSpacing: "0.2em", marginBottom: "6px" }}>
                {threat.id} — {threat.classification}
              </div>
              <h1 className="glow-text" style={{ fontSize: "28px", margin: 0 }}>{threat.name}</h1>
              <div style={{ fontFamily: "var(--mono)", fontSize: "11px", color: "var(--text-dim)", marginTop: "8px" }}>
                ORIGIN SYSTEM: {threat.origin}
              </div>
            </div>
            
            <div style={{ marginLeft: "auto", textAlign: "right" }}>
              <div className={`tag ${threat.level > 90 ? "tag-red" : threat.level > 70 ? "tag-yellow" : "tag-green"}`}>
                {threat.status}
              </div>
              <div style={{ fontFamily: "var(--mono)", fontSize: "36px", color: category.color, marginTop: "8px", lineHeight: 1 }}>
                {threat.level}%
              </div>
              <div style={{ fontFamily: "var(--mono)", fontSize: "9px", color: "var(--text-dim)", letterSpacing: "0.15em" }}>THREAT SCALE</div>
              <div className="threat-bar-wrap" style={{ marginTop: "8px", width: "140px" }}>
                <div className="threat-bar-fill" style={{ width: `${threat.level}%`, background: category.color }} />
              </div>
            </div>
          </div>

          {/* Indicators & Actions */}
          <div className="threat-card-body">
            <div className="responsive-grid-2" style={{ display: "grid", gap: "24px", marginBottom: "32px" }}>
              <div>
                <div style={{ fontFamily: "var(--mono)", fontSize: "10px", letterSpacing: "0.2em", color: "var(--text-dim)", marginBottom: "12px" }}>
                  REPORTED SYMPTOMS & ANOMALIES
                </div>
                <ul style={{ listStyle: "none", padding: 0, display: "flex", flexDirection: "column", gap: "8px" }}>
                  {threat.symptoms.map((s, i) => (
                    <li key={i} style={{ fontFamily: "var(--mono)", fontSize: "12px", color: "var(--text-dim)", display: "flex", gap: "8px" }}>
                      <span style={{ color: category.color }}>▸</span>{s}
                    </li>
                  ))}
                </ul>
              </div>
              <div>
                <div style={{ fontFamily: "var(--mono)", fontSize: "10px", letterSpacing: "0.2em", color: "var(--text-dim)", marginBottom: "12px" }}>
                  CYBER DEFENSE & SURVIVAL PROTOCOLS
                </div>
                <ul style={{ listStyle: "none", padding: 0, display: "flex", flexDirection: "column", gap: "8px" }}>
                  {threat.survival.map((s, i) => (
                    <li key={i} style={{ fontFamily: "var(--mono)", fontSize: "12px", color: "var(--text-dim)", display: "flex", gap: "8px" }}>
                      <span style={{ color: "#00ffcc" }}>✓</span>{s}
                    </li>
                  ))}
                </ul>
              </div>
            </div>

            {/* Always Visible Live Database Telemetry Grid */}
            <div style={{ borderTop: "1px solid var(--border)", paddingTop: "32px", marginBottom: "32px" }}>
              <div style={{ fontFamily: "var(--mono)", fontSize: "11px", color: category.color, letterSpacing: "0.2em", marginBottom: "20px" }}>
                [ LIVE DATABASE METRICS & SIGNAL STABILITY ]
              </div>
              
              <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "16px", marginBottom: "24px" }}>
                <div style={{ background: "#0c0c0c", border: "1px solid #181818", padding: "16px", borderRadius: "2px" }}>
                  <div style={{ fontFamily: "var(--mono)", fontSize: "9px", color: "var(--text-dim)", letterSpacing: "0.15em", marginBottom: "6px" }}>
                    THREAT PROBABILITY
                  </div>
                  <div style={{ fontFamily: "var(--mono)", fontSize: "20px", color: "var(--text)", fontWeight: "bold" }}>
                    {meta.probability}
                  </div>
                </div>
                
                <div style={{ background: "#0c0c0c", border: "1px solid #181818", padding: "16px", borderRadius: "2px" }}>
                  <div style={{ fontFamily: "var(--mono)", fontSize: "9px", color: "var(--text-dim)", letterSpacing: "0.15em", marginBottom: "6px" }}>
                    SURVIVAL DIFFICULTY
                  </div>
                  <div style={{ fontFamily: "var(--mono)", fontSize: "14px", color: "var(--text)", fontWeight: "bold", textTransform: "uppercase" }}>
                    {meta.difficulty}
                  </div>
                </div>

                <div style={{ background: "#0c0c0c", border: "1px solid #181818", padding: "16px", borderRadius: "2px" }}>
                  <div style={{ fontFamily: "var(--mono)", fontSize: "9px", color: "var(--text-dim)", letterSpacing: "0.15em", marginBottom: "6px" }}>
                    CONTAINMENT STATUS
                  </div>
                  <div style={{ fontFamily: "var(--mono)", fontSize: "12px", color: "#ff4d4d", fontWeight: "bold", textTransform: "uppercase" }}>
                    {meta.containmentStatus}
                  </div>
                </div>

                <div style={{ background: "#0c0c0c", border: "1px solid #181818", padding: "16px", borderRadius: "2px" }}>
                  <div style={{ fontFamily: "var(--mono)", fontSize: "9px", color: "var(--text-dim)", letterSpacing: "0.15em", marginBottom: "6px" }}>
                    RELATED VECTORS
                  </div>
                  <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginTop: "4px" }}>
                    {meta.relatedThreats.map((rt) => (
                      <Link key={rt} href={`/threat-vector/${rt}`} style={{ fontFamily: "var(--mono)", fontSize: "11px", color: category.color, textDecoration: "underline" }}>
                        {rt}
                      </Link>
                    ))}
                  </div>
                </div>
              </div>

              {/* Live Updates & Incidents Row */}
              <div className="responsive-grid-2" style={{ display: "grid", gap: "20px" }}>
                <div style={{ background: "#080808", border: "1px dashed var(--border)", padding: "16px", borderRadius: "2px" }}>
                  <div style={{ fontFamily: "var(--mono)", fontSize: "10px", color: "var(--text)", letterSpacing: "0.15em", marginBottom: "8px" }}>
                    📡 LIVE INCIDENT TELEMETRY
                  </div>
                  <div style={{ fontFamily: "var(--mono)", fontSize: "11.5px", color: "var(--text-dim)", lineHeight: "1.6" }}>
                    {meta.liveUpdates}
                  </div>
                </div>

                <div style={{ background: "#080808", border: "1px dashed var(--border)", padding: "16px", borderRadius: "2px" }}>
                  <div style={{ fontFamily: "var(--mono)", fontSize: "10px", color: "var(--text)", letterSpacing: "0.15em", marginBottom: "8px" }}>
                    ⚠️ RECENT SPECIFIC INCIDENTS
                  </div>
                  <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "6px" }}>
                    {meta.recentIncidents.map((incident, idx) => (
                      <li key={idx} style={{ fontFamily: "var(--mono)", fontSize: "11.5px", color: "var(--text-dim)", display: "flex", gap: "6px" }}>
                        <span style={{ color: "var(--accent)" }}>•</span>{incident}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            </div>

            {/* Decryption Portal */}
            <div style={{ borderTop: "1px solid var(--border)", paddingTop: "32px" }}>
              {revealed ? (
                category.key === "realistic" ? (
                  <div style={{ display: "flex", flexDirection: "column", gap: "32px", marginTop: "24px" }}>
                    {/* 1. Threat Overview */}
                    <div className="panel" style={{ borderColor: "rgba(255, 77, 77, 0.15)", background: "rgba(10,10,10,0.4)" }}>
                      <h3 style={{ fontFamily: "var(--title-font)", fontSize: "16px", color: "var(--accent)", marginBottom: "12px", borderBottom: "1px dashed rgba(255, 77, 77, 0.2)", paddingBottom: "8px" }}>
                        1. THREAT OVERVIEW
                      </h3>
                      <p style={{ fontSize: "14.5px", color: "var(--text-dim)", lineHeight: "1.8", margin: 0 }}>
                        {threat.name} is classified as a {threat.classification} level hazard. This archive provides early-warning telemetry indicators and emergency tactical guides for civilian networks.
                      </p>
                    </div>

                    {/* 2. How It Operates */}
                    <div className="panel" style={{ borderColor: "rgba(255, 77, 77, 0.15)", background: "rgba(10,10,10,0.4)" }}>
                      <h3 style={{ fontFamily: "var(--title-font)", fontSize: "16px", color: "var(--accent)", marginBottom: "16px", borderBottom: "1px dashed rgba(255, 77, 77, 0.2)", paddingBottom: "8px" }}>
                        2. HOW IT OPERATES
                      </h3>
                      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                        {meta.timelineProgression.map((step, idx) => (
                          <div key={idx} style={{ display: "flex", gap: "16px", alignItems: "flex-start" }}>
                            <span style={{ fontFamily: "var(--mono)", fontSize: "12px", color: "var(--accent)", fontWeight: "bold", background: "rgba(255, 77, 77, 0.05)", border: "1px solid rgba(255, 77, 77, 0.2)", width: "24px", height: "24px", display: "flex", alignItems: "center", justifyItems: "center", justifyContent: "center", borderRadius: "2px", flexShrink: 0 }}>
                              0{idx + 1}
                            </span>
                            <span style={{ fontFamily: "var(--mono)", fontSize: "12.5px", color: "var(--text-dim)", lineHeight: "1.6", marginTop: "3px" }}>
                              {step}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }} className="responsive-grid-2-large">
                      {/* 3. Warning Signs */}
                      <div className="panel" style={{ borderColor: "rgba(255, 77, 77, 0.15)", background: "rgba(10,10,10,0.4)" }}>
                        <h3 style={{ fontFamily: "var(--title-font)", fontSize: "16px", color: "var(--accent)", marginBottom: "12px", borderBottom: "1px dashed rgba(255, 77, 77, 0.2)", paddingBottom: "8px" }}>
                          3. WARNING SIGNS
                        </h3>
                        <ul style={{ listStyle: "none", padding: 0, display: "flex", flexDirection: "column", gap: "8px" }}>
                          {threat.symptoms.map((s, i) => (
                            <li key={i} style={{ fontFamily: "var(--mono)", fontSize: "12.5px", color: "var(--text-dim)", display: "flex", gap: "8px" }}>
                              <span style={{ color: "var(--accent)" }}>▸</span>{s}
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* 4. Survival Protocols */}
                      <div className="panel" style={{ borderColor: "rgba(255, 77, 77, 0.15)", background: "rgba(10,10,10,0.4)" }}>
                        <h3 style={{ fontFamily: "var(--title-font)", fontSize: "16px", color: "var(--accent)", marginBottom: "12px", borderBottom: "1px dashed rgba(255, 77, 77, 0.2)", paddingBottom: "8px" }}>
                          4. SURVIVAL PROTOCOLS
                        </h3>
                        <ul style={{ listStyle: "none", padding: 0, display: "flex", flexDirection: "column", gap: "8px" }}>
                          {threat.survival.map((s, i) => (
                            <li key={i} style={{ fontFamily: "var(--mono)", fontSize: "12.5px", color: "var(--text-dim)", display: "flex", gap: "8px" }}>
                              <span style={{ color: "#00ffcc" }}>✓</span>{s}
                            </li>
                          ))}
                        </ul>
                      </div>
                    </div>

                    {/* 5. RED QUEEN Analysis */}
                    <div style={{ background: "rgba(255, 0, 51, 0.03)", borderLeft: "4px solid var(--accent)", padding: "24px", borderRadius: "0 2px 2px 0" }}>
                      <h3 style={{ fontFamily: "var(--title-font)", fontSize: "14px", color: "var(--accent)", marginBottom: "8px", letterSpacing: "0.1em" }}>
                        5. RED QUEEN ANALYSIS DIRECTIVE
                      </h3>
                      <p style={{ fontFamily: "var(--mono)", fontSize: "13px", fontStyle: "italic", color: "var(--text)", lineHeight: "1.7", margin: 0 }}>
                        "{meta.aiCommentary}"
                      </p>
                      <div style={{ marginTop: "16px", paddingTop: "12px", borderTop: "1px dashed rgba(255,77,77,0.15)", fontFamily: "var(--mono)", fontSize: "12.5px", color: "var(--text-dim)" }}>
                        <strong>Classified Payload:</strong> {threat.classified}
                      </div>
                    </div>

                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }} className="responsive-grid-2-large">
                      {/* 6. Risk Level */}
                      <div className="panel" style={{ borderColor: "rgba(255, 77, 77, 0.15)", background: "rgba(10,10,10,0.4)" }}>
                        <h3 style={{ fontFamily: "var(--title-font)", fontSize: "16px", color: "var(--accent)", marginBottom: "12px", borderBottom: "1px dashed rgba(255, 77, 77, 0.2)", paddingBottom: "8px" }}>
                          6. RISK LEVEL DIAGNOSTICS
                        </h3>
                        <div style={{ display: "flex", flexDirection: "column", gap: "10px", fontFamily: "var(--mono)", fontSize: "12.5px" }}>
                          <div style={{ display: "flex", justifyContent: "space-between" }}>
                            <span>CRITICALITY RATING:</span>
                            <span style={{ color: "var(--accent)", fontWeight: "bold" }}>{threat.level}%</span>
                          </div>
                          <div style={{ display: "flex", justifyContent: "space-between" }}>
                            <span>DIFFICULTY CLASS:</span>
                            <span style={{ color: "var(--accent)", fontWeight: "bold" }}>{meta.difficulty}</span>
                          </div>
                          <div style={{ display: "flex", justifyContent: "space-between" }}>
                            <span>CONTAINMENT STATUS:</span>
                            <span style={{ color: "#ff4d4d", fontWeight: "bold" }}>{meta.containmentStatus}</span>
                          </div>
                        </div>
                      </div>

                      {/* 7. Related Threats */}
                      <div className="panel" style={{ borderColor: "rgba(255, 77, 77, 0.15)", background: "rgba(10,10,10,0.4)" }}>
                        <h3 style={{ fontFamily: "var(--title-font)", fontSize: "16px", color: "var(--accent)", marginBottom: "12px", borderBottom: "1px dashed rgba(255, 77, 77, 0.2)", paddingBottom: "8px" }}>
                          7. RELATED DOSSIERS
                        </h3>
                        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                          {meta.relatedThreats.map((rt) => (
                            <Link key={rt} href={`/threat-vector/${rt}`} style={{ fontFamily: "var(--mono)", fontSize: "12px", color: "var(--accent)", textDecoration: "underline", background: "rgba(255,77,77,0.04)", border: "1px solid rgba(255,77,77,0.1)", padding: "6px 12px", borderRadius: "2px" }}>
                              ↗ {rt}
                            </Link>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ) : (
                  <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                    {/* RED QUEEN AI Commentary */}
                    <div style={{ background: category.color + "05", borderLeft: `3px solid ${category.color}`, padding: "20px", borderRadius: "0 2px 2px 0" }}>
                      <div style={{ fontFamily: "var(--mono)", fontSize: "10px", color: category.color, letterSpacing: "0.15em", marginBottom: "8px" }}>
                        [ RED QUEEN DIRECTIVE // CLASSIFIED COMMENTARY ]
                      </div>
                      <div style={{ fontFamily: "var(--mono)", fontSize: "12.5px", fontStyle: "italic", color: "var(--text)", lineHeight: "1.7" }}>
                        "{meta.aiCommentary}"
                      </div>
                    </div>

                    {/* Core Decrypted File content */}
                    <div style={{ background: category.color + "0A", border: `1px solid ${category.color}33`, borderRadius: "2px", padding: "20px 24px" }}>
                      <div style={{ fontFamily: "var(--mono)", fontSize: "10px", color: category.color, letterSpacing: "0.2em", marginBottom: "12px" }}>
                        [CLEARANCE LEVEL {isSectorDelta ? "5" : "3"} GRANTED] — SECURE DOSSIER PAYLOAD
                      </div>
                      <p style={{ fontFamily: "var(--mono)", fontSize: "13px", color: "var(--text-dim)", lineHeight: "1.8", margin: 0 }}>
                        {threat.classified}
                      </p>
                      
                      {isSectorDelta && diagnosticsReport && (
                        <div style={{ marginTop: "20px", borderTop: `1px dashed ${category.color}40`, paddingTop: "20px" }}>
                          <div style={{ fontFamily: "var(--mono)", fontSize: "10px", color: category.color, letterSpacing: "0.15em", marginBottom: "8px" }}>
                            ▶ DIAGNOSTICS REPORT
                          </div>
                          <pre style={{
                            fontFamily: "var(--mono)",
                            fontSize: "12px",
                            color: "var(--text)",
                            background: "#080808",
                            border: "1px solid #111",
                            padding: "16px",
                            whiteSpace: "pre-wrap",
                            margin: 0,
                            lineHeight: "1.7",
                            textShadow: `0 0 2px ${category.color}66`
                          }}>
                            {diagnosticsReport}
                          </pre>
                        </div>
                      )}
                    </div>

                    {/* Vector Escalation Timeline */}
                    <div style={{ background: "#080808", border: `1px solid ${category.color}20`, padding: "24px", borderRadius: "2px" }}>
                      <div style={{ fontFamily: "var(--mono)", fontSize: "10px", color: category.color, letterSpacing: "0.15em", marginBottom: "16px" }}>
                        [ SHIELD ANALYSIS: VECTOR ESCALATION PIPELINE ]
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                        {meta.timelineProgression.map((step, idx) => (
                          <div key={idx} style={{ display: "flex", gap: "16px", alignItems: "flex-start" }}>
                            <span style={{ fontFamily: "var(--mono)", fontSize: "12px", color: category.color, fontWeight: "bold", background: category.color + "0F", border: `1px solid ${category.color}40`, width: "24px", height: "24px", display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "2px", flexShrink: 0 }}>
                              0{idx + 1}
                            </span>
                            <span style={{ fontFamily: "var(--mono)", fontSize: "12px", color: "var(--text-dim)", lineHeight: "1.6", marginTop: "3px" }}>
                              {step}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                    {/* Action Plan */}
                    <div style={{ background: "#080808", border: `1px solid ${category.color}20`, padding: "24px", borderRadius: "2px" }}>
                      <div style={{ fontFamily: "var(--mono)", fontSize: "10px", color: category.color, letterSpacing: "0.15em", marginBottom: "16px" }}>
                        [ COUNTER-MEASURE ACTIONS RECON ]
                      </div>
                      <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "10px" }}>
                        {meta.recommendedActions.map((action, idx) => (
                          <li key={idx} style={{ fontFamily: "var(--mono)", fontSize: "12px", color: "var(--text)", display: "flex", gap: "10px", alignItems: "center" }}>
                            <span style={{ color: category.color, fontWeight: "bold" }}>✔</span>
                            <span>{action}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                )
              ) : isSectorDelta ? (
                <div
                  className="redacted-viewport-locked"
                  onClick={handleDecryptClick}
                  style={{ animation: glitching ? "glitch 0.6s ease" : "none", cursor: "pointer", minHeight: "220px" }}
                >
                  {/* Glowing horizontal blockouts */}
                  <div className="redacted-blockout-line" style={{ width: "70%" }}></div>
                  <div className="redacted-blockout-line" style={{ width: "85%" }}></div>
                  <div className="redacted-blockout-line" style={{ width: "45%" }}></div>
                  <div className="redacted-blockout-line" style={{ width: "90%" }}></div>
                  
                  {/* Flickering overlay prompt */}
                  <div className="redacted-overlay-prompt">
                    <div className="redacted-flicker-text" style={{ color: "#ff4d4d", fontWeight: "bold" }}>
                      [COMPUTE GATE ENCRYPTED // REQUIRE LEVEL 5 DIRECTOR CLEARANCE]
                    </div>
                    <div style={{ fontFamily: "var(--mono)", fontSize: "10px", color: "var(--text-dim)", marginTop: "12px", letterSpacing: "0.15em", textAlign: "center", padding: "0 12px" }}>
                      {loading ? "VALIDATING KEY PROFILE..." : "CLICK TO INITIATE COGNITIVE TELEMETRY SWEEP"}
                    </div>
                    <button className="btn btn-ghost" disabled={loading} style={{ fontSize: "11px", padding: "8px 20px", marginTop: "12px" }}>
                      {loading ? "PROCESSING..." : "REQUEST DIAGNOSTIC ACCESS"}
                    </button>
                    {decryptError && (
                      <div style={{
                        marginTop: "16px",
                        padding: "10px 14px",
                        background: "rgba(255, 77, 77, 0.1)",
                        border: "1px solid rgba(255, 77, 77, 0.3)",
                        color: "#ff4d4d",
                        fontFamily: "var(--mono)",
                        fontSize: "11px",
                        maxWidth: "420px",
                        lineHeight: "1.5",
                        textAlign: "center"
                      }}>
                        {decryptError}
                      </div>
                    )}
                  </div>
                </div>
              ) : (
                <div
                  className="redacted"
                  onClick={handleDecryptClick}
                  style={{ animation: glitching ? "glitch 0.6s ease" : "none", cursor: "pointer", display: "flex", flexDirection: "column", gap: "12px", alignItems: "center" }}
                >
                  <div style={{ textAlign: "center" }}>
                    <div className="redacted-text" style={{ fontSize: "14px", textShadow: "0 0 4px rgba(255, 0, 51, 0.6)" }}>
                      {glitching ? "DECRYPTING..." : `█ █ █ ${threat.name} █ █ █`}
                    </div>
                    <div style={{ fontFamily: "var(--mono)", fontSize: "10px", color: "var(--text-dim)", marginTop: "6px", letterSpacing: "0.15em" }}>
                      CLICK TO DECRYPT FILE — ACCESS LEVEL 3 REQUIRED
                    </div>
                  </div>
                  <button className="btn btn-ghost" disabled={loading} style={{ fontSize: "11px", padding: "8px 20px" }}>
                    {loading ? "CHECKING CLEARANCE..." : "REQUEST SYSTEM ACCESS"}
                  </button>
                  {decryptError && (
                    <div style={{
                      marginTop: "12px",
                      padding: "10px 14px",
                      background: "rgba(255, 77, 77, 0.1)",
                      border: "1px solid rgba(255, 77, 77, 0.3)",
                      color: "#ff4d4d",
                      fontFamily: "var(--mono)",
                      fontSize: "11px",
                      maxWidth: "420px",
                      lineHeight: "1.5",
                      textAlign: "center"
                    }}>
                      {decryptError}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
