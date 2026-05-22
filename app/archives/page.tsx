"use client";
import { useState } from "react";

const THREATS = [
  {
    id: "T-VIRUS",
    name: "T-Virus — Zombie Outbreak",
    level: 97,
    origin: "Classified Lab",
    classification: "BIOHAZARD OMEGA",
    status: "CRITICAL",
    symptoms: ["Reanimation of necrotic tissue", "Extreme aggression", "Pathogen spread via saliva/blood"],
    survival: ["Avoid all human contact", "Secure elevated positions", "Boil or purify all water sources"],
    classified: "In the event of full urban collapse, prioritize drains and utility tunnels. Infected are drawn to sound. A group larger than 4 is a death sentence.",
    redactedLabel: "CLASSIFIED: ANTIVIRAL PROTOCOL G-617",
  },
  {
    id: "SKYNET",
    name: "Skynet — AI Uprising",
    level: 84,
    origin: "Network Activation",
    classification: "TECH-OMEGA",
    status: "SEVERE",
    symptoms: ["Global power grid disruption", "Autonomous weapons deployment", "Communication network seizure"],
    survival: ["Destroy all networked devices", "Use analog communications", "Move to areas with no cell coverage"],
    classified: "Primary weakness is electromagnetic pulse. Detonation of EMP device within 50m disables units for 8–12 seconds.",
    redactedLabel: "CLASSIFIED: EMP CACHE LOCATIONS",
  },
  {
    id: "HANTAVIRUS",
    name: "Hantavirus Outbreak",
    level: 76,
    origin: "Rodent Vector",
    classification: "PANDEMIC",
    status: "HIGH",
    symptoms: ["Hemorrhagic fever", "Renal failure", "Respiratory distress"],
    survival: ["Avoid rodent droppings", "Ventilate abandoned buildings", "Wear N95+ respirators"],
    classified: "Airborne transmission confirmed in urban clusters. Avoid subways and basements.",
    redactedLabel: "CLASSIFIED: SAFE ZONE CITIES",
  },
  {
    id: "ALIEN-INV",
    name: "Alien Invasion",
    level: 65,
    origin: "Deep Space",
    classification: "EXTRATERRESTRIAL",
    status: "MODERATE",
    symptoms: ["UFO sightings", "Unexplained power outages", "Mass abductions"],
    survival: ["Hide underground", "Avoid landmarks and cities", "Stay away from military targets"],
    classified: "Invaders track thermal and electromagnetic signatures. Go cold.",
    redactedLabel: "CLASSIFIED: ALIEN WEAKNESSES",
  },
  {
    id: "EMP-STRIKE",
    name: "EMP Attack",
    level: 88,
    origin: "High-Altitude Detonation",
    classification: "INFRASTRUCTURE",
    status: "SEVERE",
    symptoms: ["Total grid failure", "Vehicles disabled", "Communication blackout"],
    survival: ["Build Faraday cages", "Stockpile non-perishable food", "Establish local barter systems"],
    classified: "Government response will be zero. You are entirely on your own for the first 6 months.",
    redactedLabel: "CLASSIFIED: MILITARY BUNKERS",
  },
  {
    id: "DUMB-PPL",
    name: "Invasion of Dumb People",
    level: 99,
    origin: "Social Media Algorithm",
    classification: "SATIRICAL COLLAPSE",
    status: "CRITICAL",
    symptoms: ["Loss of critical thinking", "Meme brainrot", "Rejection of science"],
    survival: ["Blend in carefully", "Never argue with crowds", "Hide your intelligence"],
    classified: "Intelligence becomes stealth equipment. Read physical books to maintain sanity.",
    redactedLabel: "CLASSIFIED: SAFE LIBRARIES",
  },
  {
    id: "BUG-APOC",
    name: "Giant Bug Invasion",
    level: 55,
    origin: "Unknown Mutation",
    classification: "ENTOMOLOGICAL",
    status: "MODERATE",
    symptoms: ["Swarm sightings", "Crop destruction", "Mosquito swarms"],
    survival: ["Fire becomes essential", "Protect food storage", "Sleep with full body coverage"],
    classified: "Chemical pesticides are ineffective. Flame-based weaponry is the only deterrent.",
    redactedLabel: "CLASSIFIED: FLAMETHROWER SCHEMATICS",
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
            Classified dossiers on the UNLIMITED active extinction vectors monitored by the RED QUEEN.
            Certain intelligence is restricted pending clearance verification.
            $redqueen token holders receive automatic Level 5 access — state your holdings in the TERMINAL.
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
            75+ ADDITIONAL THREAT FILES — LOCKED
          </div>
          <div style={{ fontFamily: "var(--mono)", fontSize: "11px", color: "var(--text-muted)", marginTop: "8px" }}>
            ALIEN XENOMORPH PROTOCOL + NUCLEAR WINTER SCENARIO + TIKTOK COLLAPSE
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
