"use client";

import { useState, useEffect } from "react";

interface Step {
  title: string;
  desc: string;
  highlightStyle?: React.CSSProperties;
}

export default function OnboardingBriefing({ page }: { page: "bunker" | "arena" | "player" }) {
  const [active, setActive] = useState(false);
  const [stepIndex, setStepIndex] = useState(0);

  useEffect(() => {
    const completed = localStorage.getItem(`redqueen_onboarding_completed_${page}`);
    if (!completed) {
      setActive(true);
    }
  }, [page]);

  const closeBriefing = () => {
    localStorage.setItem(`redqueen_onboarding_completed_${page}`, "true");
    setActive(false);
  };

  const bunkerSteps: Step[] = [
    {
      title: "SYSTEM INITIALIZED // BUNKER DIAGNOSTICS",
      desc: "Operative, welcome to Command HQ. You are under direct supervision of the RED QUEEN AI. Follow this brief to calibrate your tactical feed.",
      highlightStyle: { outline: "9999px solid rgba(0,0,0,0.85)" }
    },
    {
      title: "STASIS VITALS CHAMBER",
      desc: "On your left side, monitor water reserves, food stores, and power grid capacitance. Shift telemetry by moving your mouse over these capsules.",
      highlightStyle: {
        position: "absolute",
        left: "40px",
        top: "160px",
        width: "280px",
        height: "440px",
        boxShadow: "0 0 0 9999px rgba(0, 0, 0, 0.85)",
        border: "2px solid #ff003c",
        zIndex: 1000
      }
    },
    {
      title: "HOLOGRAPHIC VECTOR RADAR",
      desc: "At the center is your tilted 3D vector radar. Blinking coordinates like TGT_ALPHA mark active DEPIN towers. Target lock sweeps continuously.",
      highlightStyle: {
        position: "absolute",
        left: "50%",
        top: "140px",
        width: "440px",
        height: "440px",
        transform: "translateX(-50%)",
        boxShadow: "0 0 0 9999px rgba(0, 0, 0, 0.85)",
        border: "2px solid #ff003c",
        zIndex: 1000
      }
    },
    {
      title: "TACTICAL CONSOLE KEYS",
      desc: "Access combat deployment, start grid scavenges, or bypass security codes using the physical deck switches below the scanner.",
      highlightStyle: {
        position: "absolute",
        left: "50%",
        top: "580px",
        width: "460px",
        height: "100px",
        transform: "translateX(-50%)",
        boxShadow: "0 0 0 9999px rgba(0, 0, 0, 0.85)",
        border: "2px solid #ff003c",
        zIndex: 1000
      }
    },
    {
      title: "COGNITIVE FEED DECK",
      desc: "Expand the footer deck to access bypass CLI, radio transmissions, and active telemetry ledger records.",
      highlightStyle: {
        position: "absolute",
        left: "0",
        bottom: "0",
        width: "100vw",
        height: "180px",
        boxShadow: "0 0 0 9999px rgba(0, 0, 0, 0.85)",
        border: "2px solid #ff003c",
        zIndex: 1000
      }
    }
  ];

  const arenaSteps: Step[] = [
    {
      title: "ARENA TELEMETRY PROTOCOL",
      desc: "Calibrating target vector matrix for PvP matches. No vertical grid boundaries exist. Color fog indicates relative tactical allegiances.",
      highlightStyle: { outline: "9999px solid rgba(0,0,0,0.85)" }
    },
    {
      title: "COUNTERMEASURE DEFENSE MATRIX",
      desc: "Select which body node of your silhouette on the left to defend (HEAD, TORSO, ARMS, LEGS) before the strike resolves.",
      highlightStyle: {
        position: "absolute",
        left: "40px",
        bottom: "40px",
        width: "280px",
        height: "300px",
        boxShadow: "0 0 0 9999px rgba(0, 0, 0, 0.85)",
        border: "2px solid #00aaff",
        zIndex: 1000
      }
    },
    {
      title: "ORBITAL TARGETING ATK MATRIX",
      desc: "Lock-on targeting vectors on the right opponent limb nodes. Selecting a sector rotates the mechanical sweep reticle in the center.",
      highlightStyle: {
        position: "absolute",
        right: "40px",
        bottom: "40px",
        width: "280px",
        height: "300px",
        boxShadow: "0 0 0 9999px rgba(0, 0, 0, 0.85)",
        border: "2px solid #ff003c",
        zIndex: 1000
      }
    },
    {
      title: "LOCK-ON SWEEP RETICLE",
      desc: "The center reticle projects targeting lasers connecting your options directly to opponent coordinates. Green particle alerts indicate active TOXIC FOG decay.",
      highlightStyle: {
        position: "absolute",
        left: "50%",
        top: "220px",
        width: "280px",
        height: "280px",
        transform: "translateX(-50%)",
        boxShadow: "0 0 0 9999px rgba(0, 0, 0, 0.85)",
        border: "2px solid #ff003c",
        zIndex: 1000
      }
    }
  ];

  const playerSteps: Step[] = [
    {
      title: "OPERATIVE INVENTORY DIAGNOSTICS",
      desc: "Inspect cNFT items, bio-levels, and genetic traits. Character models stand on rotating circular pedestals inside the armory bay.",
      highlightStyle: { outline: "9999px solid rgba(0,0,0,0.85)" }
    },
    {
      title: "GEAR SLOT CONNECTIONS",
      desc: "Item cards are columns on the left and right. Hovering cards lights up SVG dotted diagnostic sweeps directly to skeletal nodes on the silhouette.",
      highlightStyle: {
        position: "absolute",
        left: "40px",
        top: "160px",
        width: "140px",
        height: "460px",
        boxShadow: "0 0 0 9999px rgba(0, 0, 0, 0.85)",
        border: "2px solid #ff003c",
        zIndex: 1000
      }
    },
    {
      title: "RED QUEEN SYSTEM DOSSIER",
      desc: "Displays traits autonomously assigned by the Red Queen Game Master. Modifying slot elements is completely blocked to players.",
      highlightStyle: {
        position: "absolute",
        left: "50%",
        top: "170px",
        width: "260px",
        height: "180px",
        transform: "translateX(-50%)",
        boxShadow: "0 0 0 9999px rgba(0, 0, 0, 0.85)",
        border: "2px solid #ff003c",
        zIndex: 1000
      }
    }
  ];

  const steps = page === "bunker" ? bunkerSteps : page === "arena" ? arenaSteps : playerSteps;
  const currentStep = steps[stepIndex];

  if (!active) return null;

  return (
    <div style={{
      position: "fixed",
      inset: 0,
      zIndex: 99999,
      pointerEvents: "auto",
      fontFamily: "Rajdhani, sans-serif"
    }}>
      {/* Target Highlight Outline overlay */}
      <div style={currentStep.highlightStyle} />

      {/* Description HUD Box */}
      <div style={{
        position: "absolute",
        left: "50%",
        top: stepIndex === 0 ? "50%" : "35%",
        transform: "translate(-50%, -50%)",
        background: "rgba(3, 3, 3, 0.98)",
        border: "2.5px solid #ff003c",
        boxShadow: "0 0 35px rgba(255, 0, 60, 0.45)",
        padding: "24px 32px",
        width: "420px",
        zIndex: 10000,
        clipPath: "polygon(0% 0%, 90% 0%, 100% 12%, 100% 100%, 0% 100%)",
        textAlign: "center"
      }}>
        <div style={{
          fontFamily: "Orbitron, sans-serif",
          fontSize: "14px",
          color: "#ff003c",
          fontWeight: 900,
          letterSpacing: "0.15em",
          marginBottom: "12px",
          textShadow: "0 0 5px rgba(255,0,60,0.5)"
        }}>
          {currentStep.title}
        </div>
        <p style={{
          fontSize: "12px",
          color: "rgba(255,255,255,0.8)",
          lineHeight: 1.5,
          fontFamily: "JetBrains Mono, monospace",
          marginBottom: "24px"
        }}>
          {currentStep.desc}
        </p>

        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
          <button
            onClick={closeBriefing}
            style={{
              background: "transparent",
              border: "1px solid rgba(255,255,255,0.25)",
              color: "rgba(255,255,255,0.45)",
              fontSize: "9px",
              fontFamily: "Orbitron, sans-serif",
              padding: "6px 12px",
              cursor: "pointer",
              letterSpacing: "0.1em"
            }}
          >
            SKIP BRIEFING
          </button>
          
          <button
            onClick={() => {
              if (stepIndex < steps.length - 1) {
                setStepIndex(stepIndex + 1);
              } else {
                closeBriefing();
              }
            }}
            style={{
              background: "#ff003c",
              border: "none",
              color: "#ffffff",
              fontSize: "10px",
              fontFamily: "Orbitron, sans-serif",
              fontWeight: 900,
              padding: "8px 18px",
              cursor: "pointer",
              letterSpacing: "0.15em",
              boxShadow: "0 0 10px rgba(255,0,60,0.4)"
            }}
          >
            {stepIndex === steps.length - 1 ? "FINISH BRIEF" : "NEXT SYSTEM"}
          </button>
        </div>

        {/* System pagination ticks */}
        <div style={{ display: "flex", justifyContent: "center", gap: "6px", marginTop: "16px" }}>
          {steps.map((_, i) => (
            <div
              key={i}
              style={{
                width: "6px",
                height: "6px",
                borderRadius: "50%",
                background: stepIndex === i ? "#ff003c" : "rgba(255,255,255,0.15)",
                boxShadow: stepIndex === i ? "0 0 4px #ff003c" : "none"
              }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
