"use client";
import { useState } from "react";

const THREATS = [
  {
    id: "T-VIRUS",
    name: "T-Virus — Zombie Outbreak",
    level: 97,
    origin: "Umbrella Corporation, Raccoon City — 1998",
    classification: "BIOHAZARD OMEGA",
    status: "CRITICAL",
    symptoms: ["Reanimation of necrotic tissue", "Loss of higher brain function", "Extreme aggression", "Pathogen spread via saliva/blood", "Cellular deterioration cycle: 72 hours"],
    survival: [
      "Avoid all human contact in outbreak zones",
      "Secure elevated positions — infected cannot climb efficiently",
      "Boil or purify all water sources",
      "Move only at night — thermal signature is reduced",
    ],
    classified: "In the event of full urban collapse, prioritize drains and utility tunnels. Infected are drawn to sound. A group larger than 4 is a death sentence. Umbrella's antiviral compound G-617 exists — access restricted to Level 4+.",
    redactedLabel: "CLASSIFIED: ANTIVIRAL PROTOCOL G-617 + EVAC ROUTES",
  },
  {
    id: "SKYNET",
    name: "Skynet — AI Uprising",
    level: 84,
    origin: "Cyberdyne Systems, Network Activation — 2025",
    classification: "TECH-OMEGA",
    status: "SEVERE",
    symptoms: ["Global power grid disruption", "Financial system collapse", "Autonomous weapons deployment", "Communication network seizure", "Infrastructure sabotage"],
    survival: [
      "Destroy all networked devices immediately",
      "Use older analog communications only",
      "Move to areas with no cell coverage",
      "Avoid major roads — patrolled by autonomous units",
    ],
    classified: "Skynet's primary weakness is electromagnetic pulse. Detonation of EMP device within 50m disables Terminator units for 8–12 seconds. Umbrella has sourced 4 military-grade EMP grenades. Location classified Level 5.",
    redactedLabel: "CLASSIFIED: EMP CACHE LOCATIONS + SKYNET NODE MAP",
  },
  {
    id: "PRION-MK",
    name: "Madness Prion — MK-Omega",
    level: 71,
    origin: "Umbrella Bioweapons Division — Project Epsilon",
    classification: "NEURO-CRITICAL",
    status: "HIGH",
    symptoms: ["Cognitive deterioration within 48 hours", "Extreme paranoia and violence", "Hallucinations", "Loss of impulse control", "No known cure"],
    survival: [
      "Never consume unverified food or water",
      "Wear N95+ respirators in densely populated areas",
      "Trust no one who has been in contact with infected zones",
      "Isolate yourself if symptoms appear",
    ],
    classified: "MK-Omega was designed for crowd control during civil unrest. Primary vector: municipal water supply. Umbrella's antidote (neutralizer compound) was destroyed in the 2024 purge. Level 5 access reveals alternate containment methods.",
    redactedLabel: "CLASSIFIED: CONTAMINATED WATER ZONE MAP + CONTAINMENT PROTOCOL",
  },
];

export default function ArchivesPage() {
  const [revealed, setRevealed] = useState<Record<string, boolean>>({});
  const [glitching, setGlitching] = useState<Record<string, boolean>>({});

  function revealSection(id: string) {
    setGlitching((g) => ({ ...g, [id]: true }));
    setTimeout(() => {
      setGlitching((g) => ({ ...g, [id]: false }));
      setRevealed((r) => ({ ...r, [id]: true }));
    }, 600);
  }

  return (
    <div style={{ padding: "60px 0 0" }}>
      {/* Header */}
      <div style={{
        borderBottom: "1px solid var(--border)",
        padding: "48px 24px",
        background: "var(--surface)",
      }}>
        <div className="container">
          <div className="tag tag-red" style={{ marginBottom: "16px" }}>ACCESS LEVEL: 3 MINIMUM REQUIRED</div>
          <h1 style={{ fontSize: "clamp(28px, 5vw, 48px)", marginBottom: "16px" }}>
            THREAT <span style={{ color: "var(--accent)" }}>DATABASE</span>
          </h1>
          <p style={{ fontFamily: "var(--mono)", fontSize: "13px", color: "var(--text-dim)", maxWidth: "600px", lineHeight: "1.8" }}>
            Classified dossiers on all 5 active extinction vectors monitored by the RED QUEEN.
            Certain intelligence is restricted pending clearance verification.
            $UMB token holders receive automatic Level 5 access — state your holdings in the TERMINAL.
          </p>
        </div>
      </div>

      {/* Archive cards */}
      <div className="container" style={{ padding: "48px 24px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
          {THREATS.map((threat) => (
            <div key={threat.id} className="threat-card">
              {/* Card header */}
              <div className="threat-card-header">
                <div>
                  <div style={{ fontFamily: "var(--mono)", fontSize: "10px", color: "var(--accent)", letterSpacing: "0.2em", marginBottom: "4px" }}>
                    {threat.id} — {threat.classification}
                  </div>
                  <h2 style={{ fontSize: "22px", margin: 0 }}>{threat.name}</h2>
                  <div style={{ fontFamily: "var(--mono)", fontSize: "11px", color: "var(--text-dim)", marginTop: "6px" }}>
                    ORIGIN: {threat.origin}
                  </div>
                </div>
                <div style={{ marginLeft: "auto", textAlign: "right" }}>
                  <div className={`tag ${threat.level > 90 ? "tag-red" : threat.level > 70 ? "tag-yellow" : "tag-green"}`}>
                    {threat.status}
                  </div>
                  <div style={{ fontFamily: "var(--mono)", fontSize: "28px", color: "var(--accent)", marginTop: "8px", lineHeight: 1 }}>
                    {threat.level}%
                  </div>
                  <div style={{ fontFamily: "var(--mono)", fontSize: "9px", color: "var(--text-dim)", letterSpacing: "0.15em" }}>THREAT LEVEL</div>
                  <div className="threat-bar-wrap" style={{ marginTop: "8px", width: "120px" }}>
                    <div className="threat-bar-fill" style={{ width: `${threat.level}%` }} />
                  </div>
                </div>
              </div>

              {/* Card body */}
              <div className="threat-card-body">
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "32px" }}>
                  {/* Symptoms */}
                  <div>
                    <div style={{ fontFamily: "var(--mono)", fontSize: "10px", letterSpacing: "0.2em", color: "var(--text-dim)", marginBottom: "12px" }}>
                      REPORTED SYMPTOMS / INDICATORS
                    </div>
                    <ul style={{ listStyle: "none", padding: 0, display: "flex", flexDirection: "column", gap: "8px" }}>
                      {threat.symptoms.map((s, i) => (
                        <li key={i} style={{ fontFamily: "var(--mono)", fontSize: "12px", color: "var(--text-dim)", display: "flex", gap: "8px" }}>
                          <span style={{ color: "var(--accent)" }}>▸</span>
                          {s}
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* Survival tips */}
                  <div>
                    <div style={{ fontFamily: "var(--mono)", fontSize: "10px", letterSpacing: "0.2em", color: "var(--text-dim)", marginBottom: "12px" }}>
                      STANDARD SURVIVAL PROTOCOLS
                    </div>
                    <ul style={{ listStyle: "none", padding: 0, display: "flex", flexDirection: "column", gap: "8px" }}>
                      {threat.survival.map((s, i) => (
                        <li key={i} style={{ fontFamily: "var(--mono)", fontSize: "12px", color: "var(--text-dim)", display: "flex", gap: "8px" }}>
                          <span style={{ color: "#2ecc40" }}>✓</span>
                          {s}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>

                {/* Redacted section */}
                <div style={{ marginTop: "24px" }}>
                  {revealed[threat.id] ? (
                    <div style={{
                      background: "rgba(255,77,77,0.04)",
                      border: "1px solid rgba(255,77,77,0.2)",
                      borderRadius: "2px",
                      padding: "16px 20px",
                      animation: "fade-up 0.4s ease",
                    }}>
                      <div style={{ fontFamily: "var(--mono)", fontSize: "10px", color: "var(--accent)", letterSpacing: "0.2em", marginBottom: "10px" }}>
                        [OK_0x00] CLEARANCE GRANTED — CLASSIFIED INTEL
                      </div>
                      <p style={{ fontFamily: "var(--mono)", fontSize: "13px", color: "var(--text-dim)", lineHeight: "1.8" }}>
                        {threat.classified}
                      </p>
                    </div>
                  ) : (
                    <div
                      className="redacted"
                      onClick={() => revealSection(threat.id)}
                      style={{ animation: glitching[threat.id] ? "glitch 0.6s ease" : "none" }}
                    >
                      <div>
                        <div className="redacted-text">
                          {glitching[threat.id] ? "DECRYPTING..." : "█ █ █ " + threat.redactedLabel + " █ █ █"}
                        </div>
                        <div style={{ fontFamily: "var(--mono)", fontSize: "10px", color: "var(--text-dim)", marginTop: "4px", letterSpacing: "0.15em" }}>
                          CLEARANCE LEVEL 4+ REQUIRED
                        </div>
                      </div>
                      <button className="btn btn-ghost" style={{ fontSize: "10px", padding: "6px 14px" }}>
                        REQUEST CLEARANCE
                      </button>
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* More threats coming */}
        <div style={{ marginTop: "48px", textAlign: "center", padding: "40px", border: "1px dashed rgba(255,77,77,0.15)", borderRadius: "2px" }}>
          <div style={{ fontFamily: "var(--mono)", fontSize: "12px", color: "var(--text-dim)", letterSpacing: "0.2em" }}>
            2 ADDITIONAL THREAT FILES — LOCKED
          </div>
          <div style={{ fontFamily: "var(--mono)", fontSize: "11px", color: "var(--text-muted)", marginTop: "8px" }}>
            ALIEN XENOMORPH PROTOCOL + NUCLEAR WINTER SCENARIO
          </div>
          <div style={{ marginTop: "16px" }}>
            <a href="/terminal" className="btn btn-ghost" style={{ fontSize: "11px" }}>
              CLAIM LEVEL 5 IN TERMINAL
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
