"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useAuth } from "@/components/AuthProvider";
import { useWallet } from "@solana/wallet-adapter-react";
import Link from "next/link";

interface Faction {
  id: string;
  name: string;
  trait: string;
  description: string;
  borderColor: string;
  glowColor: string;
}

const FACTIONS: Faction[] = [
  {
    id: "nomads",
    name: "NOMADS",
    trait: "+15% Scavenging Yield",
    description: "Wasteland scouts who excel at uncovering hidden resources in highly toxic sectors.",
    borderColor: "#f0c929",
    glowColor: "rgba(240, 201, 41, 0.25)"
  },
  {
    id: "scientists",
    name: "SCIENTISTS",
    trait: "-20% Decode Time",
    description: "Pre-collapse research remnants utilizing cryptography to decrypt hidden technology nodes.",
    borderColor: "#a855f7",
    glowColor: "rgba(168, 85, 247, 0.25)"
  },
  {
    id: "marauders",
    name: "MARAUDERS",
    trait: "+10% Limb Strike Damage",
    description: "Aggressive front-line combatants specialized in targeting vulnerability points.",
    borderColor: "#ff0033",
    glowColor: "rgba(255, 0, 51, 0.25)"
  },
  {
    id: "engineers",
    name: "ENGINEERS",
    trait: "-15% Repair Cost",
    description: "DePIN hardware operators specialized in bunker fortification and power grid routing.",
    borderColor: "#00ffcc",
    glowColor: "rgba(0, 255, 204, 0.25)"
  },
  {
    id: "syndicates",
    name: "BUNKER SYNDICATES",
    trait: "+20% Defensive Shield",
    description: "Fortified underground network syndicates utilizing heavy hardware to resist hostile raids.",
    borderColor: "#22c55e",
    glowColor: "rgba(34, 197, 94, 0.25)"
  },
  {
    id: "hackers",
    name: "HACKERS",
    trait: "Preview Next Threat",
    description: "Mainframe infiltrators capable of intercepting upcoming environmental vector shifts.",
    borderColor: "#3b82f6",
    glowColor: "rgba(59, 130, 246, 0.25)"
  }
];

export default function BunkerPage() {
  const { session, authIdentifier } = useAuth();
  const { publicKey, connected } = useWallet();

  // Faction pledge state
  const [selectedFaction, setSelectedFaction] = useState<Faction | null>(null);

  // Staking and shield state
  const [stakedThreat, setStakedThreat] = useState<number>(100);
  const [shieldIntegrity, setShieldIntegrity] = useState<number>(65);

  // Scavenging resource levels (simulated dynamic levels)
  const [waterLevel, setWaterLevel] = useState<number>(45);
  const [foodLevel, setFoodLevel] = useState<number>(62);
  const [powerGrid, setPowerGrid] = useState<number>(78);

  // Turn-based Combat State
  const [playerHp, setPlayerHp] = useState<number>(100);
  const [droneHp, setDroneHp] = useState<number>(100);
  const [combatActive, setCombatActive] = useState<boolean>(false);
  const [combatLogs, setCombatLogs] = useState<string[]>([]);
  const [activeStatusEffects, setActiveStatusEffects] = useState<string[]>([]);
  const [combatOutcome, setCombatOutcome] = useState<"win" | "lose" | null>(null);
  
  const combatLogEndRef = useRef<HTMLDivElement | null>(null);

  // Trigger shield calculations when staked threat changes
  useEffect(() => {
    // Basic logarithmic shield projection formula
    const calculatedShield = Math.min(99.9, Math.round(30 + Math.log2(stakedThreat + 1) * 8));
    setShieldIntegrity(calculatedShield);
  }, [stakedThreat]);

  // Scroll to bottom of combat logs
  useEffect(() => {
    if (combatLogEndRef.current) {
      combatLogEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [combatLogs]);

  // Initialize combat
  const startCombatSimulation = () => {
    setPlayerHp(100);
    setDroneHp(100);
    setCombatActive(true);
    setCombatOutcome(null);
    setActiveStatusEffects([]);
    setCombatLogs([
      "SECURE CORE: Initiating defense grid simulation...",
      "WARNING: Red Queen Containment Drone detected in Sector 4.",
      "SYSTEM CHECK: Operative limb-targeting targeting active."
    ]);
  };

  // Perform combat turns
  const executeCombatTurn = (target: "HEAD" | "TORSO" | "ARMS" | "LEGS") => {
    if (!combatActive || combatOutcome) return;

    let hitChance = 0.8;
    let baseDamage = 15;
    let targetMsg = "";
    let logs: string[] = [];

    // Faction modifiers
    const isMarauder = selectedFaction?.id === "marauders";
    const damageMultiplier = isMarauder ? 1.1 : 1.0;

    switch (target) {
      case "HEAD":
        hitChance = 0.35;
        baseDamage = 40;
        targetMsg = "Targeting security drone optics processor [HEAD]...";
        break;
      case "TORSO":
        hitChance = 0.85;
        baseDamage = 18;
        targetMsg = "Targeting main fusion core block [TORSO]...";
        break;
      case "ARMS":
        hitChance = 0.55;
        baseDamage = 22;
        targetMsg = "Targeting defense micro-laser arrays [ARMS]...";
        break;
      case "LEGS":
        hitChance = 1.0;
        baseDamage = 12;
        targetMsg = "Targeting kinetic stabilizing thrusters [LEGS]...";
        break;
    }

    logs.push(`> OPERATIVE: ${targetMsg}`);

    // Roll for player hit
    const rollPlayer = Math.random();
    let hitSucceeded = rollPlayer <= hitChance;
    let actualDamage = 0;

    if (hitSucceeded) {
      actualDamage = Math.round(baseDamage * damageMultiplier * (0.9 + Math.random() * 0.2));
      const targetHp = Math.max(0, droneHp - actualDamage);
      logs.push(`> IMPACT: Direct strike! Inflicted ${actualDamage} damage to drone ${target}.`);
      setDroneHp(targetHp);

      if (targetHp <= 0) {
        setDroneHp(0);
        logs.push("SYSTEM ALERT: Red Queen Security Drone neutralized.");
        setCombatOutcome("win");
        setCombatActive(false);
        setCombatLogs(prev => [...prev, ...logs]);
        return;
      }
    } else {
      logs.push("> MISS: Targeting lock lost. Strike deflected.");
    }

    // Drone retaliation strike
    const droneTargets = ["Optics", "Chassis", "Actuators"];
    const randomTarget = droneTargets[Math.floor(Math.random() * droneTargets.length)];
    const rollDrone = Math.random();
    
    // Higher drone hit rate if player targeted slow head lock-on
    const droneHitChance = target === "HEAD" ? 0.75 : 0.6;
    
    logs.push(`> ENEMY: Red Queen Drone counter-attacking...`);

    if (rollDrone <= droneHitChance) {
      const droneBaseDamage = 16;
      const droneActualDamage = Math.round(droneBaseDamage * (0.85 + Math.random() * 0.3));
      const newPlayerHp = Math.max(0, playerHp - droneActualDamage);
      
      logs.push(`> INTRUSION: Drone struck your ${randomTarget}! Took ${droneActualDamage} physical damage.`);
      setPlayerHp(newPlayerHp);

      // Status effect rolls (e.g., Radiation or Bleeding)
      if (Math.random() < 0.25 && !activeStatusEffects.includes("SYSTEM BLEED")) {
        setActiveStatusEffects(prev => [...prev, "SYSTEM BLEED"]);
        logs.push("> WARNING: Structural damage detected. [SYSTEM BLEED] effect active.");
      }

      if (newPlayerHp <= 0) {
        setPlayerHp(0);
        logs.push("CRITICAL FAILURE: Operative mainframe flatlined.");
        setCombatOutcome("lose");
        setCombatActive(false);
      }
    } else {
      logs.push("> EVADE: Defensive protocols active. Counter-strike evaded.");
    }

    // Apply active status effects at end of turn
    if (activeStatusEffects.includes("SYSTEM BLEED") && playerHp > 0) {
      const bleedDamage = 5;
      const finalHp = Math.max(0, playerHp - bleedDamage);
      logs.push(`> DECAY: [SYSTEM BLEED] triggered. Took ${bleedDamage} structural damage.`);
      setPlayerHp(finalHp);
      
      if (finalHp <= 0) {
        setPlayerHp(0);
        logs.push("CRITICAL FAILURE: Bleedout complete. Mainframe flatlined.");
        setCombatOutcome("lose");
        setCombatActive(false);
      }
    }

    setCombatLogs(prev => [...prev, ...logs]);
  };

  const currentWallet = authIdentifier || (publicKey ? publicKey.toString() : null);

  return (
    <div style={{ background: "#050505", minHeight: "100vh", color: "#ffffff", fontFamily: "var(--mono), monospace", paddingBottom: "80px", position: "relative" }}>
      {/* Background CRT Scanlines */}
      <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", background: "linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.06), rgba(0, 255, 0, 0.02), rgba(0, 0, 255, 0.06))", backgroundSize: "100% 4px, 6px 100%", zIndex: 10, pointerEvents: "none", opacity: 0.4 }} />

      {/* Navigation Header */}
      <nav style={{ borderBottom: "1px solid #ff0033", padding: "16px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#080808" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <span style={{ color: "#ff0033", fontWeight: "bold", fontSize: "16px", textShadow: "0 0 6px rgba(255, 0, 51, 0.6)", fontFamily: "Orbitron, sans-serif" }}>
            RED QUEEN // BUNKER SIMULATION
          </span>
          <span style={{ fontSize: "11px", background: "rgba(255, 0, 51, 0.15)", border: "1px solid #ff0033", padding: "2px 8px", borderRadius: "1px", color: "#ff0033" }}>
            BETA ENGINE
          </span>
        </div>
        <div style={{ display: "flex", gap: "20px", fontSize: "13px" }}>
          <Link href="/solvivors" style={{ color: "var(--text-dim)", textDecoration: "none" }} className="hover-glow">[ RETURN TO HUB ]</Link>
          <Link href="/operative" style={{ color: "var(--text-dim)", textDecoration: "none" }} className="hover-glow">[ DOSSIERS ]</Link>
        </div>
      </nav>

      {/* Main Grid Command Mainframe */}
      <main style={{ maxWidth: "1200px", margin: "40px auto", padding: "0 24px", display: "flex", flexDirection: "column", gap: "32px" }}>
        
        {/* Banner Alert Command */}
        <section style={{ border: "1px solid #ff0033", background: "rgba(255, 0, 51, 0.02)", padding: "24px", position: "relative", boxShadow: "0 0 10px rgba(255, 0, 51, 0.1)" }}>
          <div style={{ position: "absolute", top: "-10px", left: "20px", background: "#050505", padding: "0 10px", color: "#ff0033", fontSize: "12px", fontWeight: "bold" }}>
            COMMAND TERMINAL // ACTIVE SECTOR
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "20px" }}>
            <div>
              <h1 style={{ fontFamily: "Orbitron, sans-serif", fontSize: "24px", letterSpacing: "1px", margin: "0 0 8px 0", color: "#ffffff" }}>
                BUNKER DIRECTIVE: SURVIVE THE MATRIX
              </h1>
              <p style={{ margin: 0, color: "var(--text-dim)", fontSize: "13.5px", lineHeight: "1.6" }}>
                Establish your faction alliance, fortify your shield mechanics using tokenized defensive models, and verify target-locking algorithms on the terminal drone grids. 
              </p>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "4px", fontSize: "12px", background: "#080808", padding: "12px", border: "1px solid #1f1f1f", minWidth: "220px" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "var(--text-muted)" }}>SECTOR RATING:</span><span style={{ color: "#ff0033" }}>94% HAZARD</span></div>
              <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "var(--text-muted)" }}>CLEARANCE:</span><span>LEVEL 5 ACTUATOR</span></div>
              <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "var(--text-muted)" }}>PASSPORT HASH:</span><span style={{ fontSize: "10px" }}>{currentWallet ? `${currentWallet.slice(0, 6)}...${currentWallet.slice(-6)}` : "OFFLINE"}</span></div>
            </div>
          </div>
        </section>

        {/* Triple Row Dashboard widgets */}
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "32px" }} className="responsive-grid-2">
          
          {/* Left Column widgets */}
          <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
            
            {/* Widget 1: Factions system */}
            <div style={{ border: "1px solid #1f1f1f", background: "#080808", padding: "24px" }}>
              <h2 style={{ fontFamily: "Orbitron, sans-serif", fontSize: "16px", color: "#ffffff", marginTop: 0, marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ display: "inline-block", width: "8px", height: "8px", background: "#ff0033" }} />
                1. SELECT FACTION ALLIANCE
              </h2>
              <p style={{ fontSize: "13px", color: "var(--text-muted)", marginTop: 0, marginBottom: "20px" }}>
                Your faction pledge updates passive modifiers, defensive capabilities, and tactical indexes.
              </p>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }} className="responsive-grid-2">
                {FACTIONS.map(f => {
                  const isSelected = selectedFaction?.id === f.id;
                  return (
                    <div
                      key={f.id}
                      onClick={() => setSelectedFaction(f)}
                      style={{
                        border: `1px solid ${isSelected ? f.borderColor : "#1a1a1a"}`,
                        background: isSelected ? f.glowColor : "#050505",
                        padding: "16px",
                        borderRadius: "2px",
                        cursor: "pointer",
                        transition: "all 0.2s ease-in-out",
                        boxShadow: isSelected ? `0 0 10px ${f.borderColor}33` : "none"
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                        <span style={{ fontWeight: "bold", fontSize: "14px", color: isSelected ? f.borderColor : "#ffffff" }}>{f.name}</span>
                        <span style={{ fontSize: "11px", color: f.borderColor, border: `1px solid ${f.borderColor}44`, padding: "1px 6px", borderRadius: "1px", background: "rgba(0,0,0,0.3)" }}>{f.trait}</span>
                      </div>
                      <div style={{ fontSize: "12px", color: "var(--text-dim)", lineHeight: "1.5" }}>{f.description}</div>
                    </div>
                  );
                })}
              </div>

              {selectedFaction && (
                <div style={{ marginTop: "20px", padding: "12px", border: "1px solid rgba(0, 255, 204, 0.2)", background: "rgba(0, 255, 204, 0.02)", fontSize: "13px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span>ACTIVE MODIFIER PLEDGED:</span>
                  <span style={{ color: "#00ffcc", fontWeight: "bold" }}>{selectedFaction.name} // {selectedFaction.trait}</span>
                </div>
              )}
            </div>

            {/* Widget 2: Tactical Combat Simulator */}
            <div style={{ border: "1px solid #1f1f1f", background: "#080808", padding: "24px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                <h2 style={{ fontFamily: "Orbitron, sans-serif", fontSize: "16px", color: "#ffffff", margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ display: "inline-block", width: "8px", height: "8px", background: "#ff0033" }} />
                  2. TACTICAL COMBAT SIMULATOR
                </h2>
                {!combatActive ? (
                  <button
                    onClick={startCombatSimulation}
                    style={{ background: "#ff0033", border: "none", color: "#ffffff", padding: "6px 16px", fontSize: "12px", fontFamily: "var(--mono)", fontWeight: "bold", cursor: "pointer", borderRadius: "1px", textShadow: "0 0 4px rgba(255,255,255,0.6)" }}
                  >
                    [ INITIATE SIMULATION ]
                  </button>
                ) : (
                  <button
                    onClick={() => setCombatActive(false)}
                    style={{ background: "transparent", border: "1px solid #ff0033", color: "#ff0033", padding: "4px 12px", fontSize: "11px", fontFamily: "var(--mono)", cursor: "pointer" }}
                  >
                    [ SYSTEM SHUTDOWN ]
                  </button>
                )}
              </div>

              {!combatActive ? (
                <div style={{ border: "1px dashed #1f1f1f", height: "300px", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", background: "#050505", gap: "12px" }}>
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#ff0033" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.6, filter: "drop-shadow(0 0 8px rgba(255,0,51,0.25))" }}>
                    <path d="M12 2v20M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6" />
                  </svg>
                  <span style={{ fontSize: "14px", color: "var(--text-dim)" }}>Grid Combat Engine Idle</span>
                  <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>Click initiate above to run target-locking sequence</span>
                </div>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  
                  {/* Combat Stats Header */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                    {/* Operative HP Bar */}
                    <div style={{ background: "#050505", border: "1px solid #1a1a1a", padding: "12px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "6px" }}>
                        <span>OPERATIVE SYS STATUS:</span>
                        <span style={{ color: playerHp > 30 ? "#00ffcc" : "#ff0033", fontWeight: "bold" }}>{playerHp}% HP</span>
                      </div>
                      <div style={{ height: "10px", background: "#1f1f1f", borderRadius: "1px", overflow: "hidden" }}>
                        <div style={{ width: `${playerHp}%`, height: "100%", background: playerHp > 30 ? "#00ffcc" : "#ff0033", transition: "width 0.3s ease-out" }} />
                      </div>
                      {activeStatusEffects.length > 0 && (
                        <div style={{ display: "flex", gap: "6px", marginTop: "8px" }}>
                          {activeStatusEffects.map(effect => (
                            <span key={effect} style={{ fontSize: "10px", background: "rgba(255,0,51,0.15)", border: "1px solid #ff0033", padding: "1px 6px", color: "#ff0033", fontWeight: "bold" }}>
                              {effect}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Security Drone HP Bar */}
                    <div style={{ background: "#050505", border: "1px solid #1a1a1a", padding: "12px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "6px" }}>
                        <span>CONTAINMENT SECURITY DRONE:</span>
                        <span style={{ color: "#ff0033", fontWeight: "bold" }}>{droneHp}% HP</span>
                      </div>
                      <div style={{ height: "10px", background: "#1f1f1f", borderRadius: "1px", overflow: "hidden" }}>
                        <div style={{ width: `${droneHp}%`, height: "100%", background: "#ff0033", transition: "width 0.3s ease-out" }} />
                      </div>
                    </div>
                  </div>

                  {/* Active logs and action pad */}
                  <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "20px" }} className="responsive-grid-2">
                    
                    {/* Combat Log Console */}
                    <div style={{ background: "#050505", border: "1px solid #1a1a1a", padding: "12px", height: "220px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                      <div style={{ overflowY: "auto", flexGrow: 1, fontSize: "11px", display: "flex", flexDirection: "column", gap: "6px" }}>
                        {combatLogs.map((log, i) => (
                          <div key={i} style={{ color: log.startsWith("> IMPACT") ? "#00ffcc" : log.startsWith("> INTRUSION") || log.startsWith("CRITICAL") ? "#ff0033" : "var(--text-dim)" }}>
                            {log}
                          </div>
                        ))}
                        <div ref={combatLogEndRef} />
                      </div>
                      
                      {combatOutcome && (
                        <div style={{ borderTop: "1px solid #1f1f1f", paddingTop: "8px", marginTop: "8px", textAlign: "center", fontWeight: "bold", fontSize: "13px", color: combatOutcome === "win" ? "#00ffcc" : "#ff0033" }}>
                          {combatOutcome === "win" ? "✓ SIMULATION COMPLETE: DRONE NEUTRALIZED" : "✗ MAINSTAT FLUID DECAY: OPERATIVE DESTROYED"}
                          <button
                            onClick={startCombatSimulation}
                            style={{ display: "block", margin: "6px auto 0", background: "transparent", border: "1px solid currentColor", color: "inherit", padding: "2px 10px", fontSize: "10px", cursor: "pointer", fontFamily: "var(--mono)" }}
                          >
                            [ RUN AGAIN ]
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Limb-targeting input panel */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                      <span style={{ fontSize: "12px", fontWeight: "bold", color: "var(--text-muted)" }}>SELECT TARGET VECTOR:</span>
                      
                      <button
                        onClick={() => executeCombatTurn("HEAD")}
                        disabled={!!combatOutcome}
                        style={{
                          background: "transparent",
                          border: "1px solid #ff0033",
                          color: "#ffffff",
                          padding: "10px",
                          fontFamily: "var(--mono)",
                          fontSize: "12px",
                          textAlign: "left",
                          cursor: combatOutcome ? "not-allowed" : "pointer",
                          display: "flex",
                          justifyContent: "space-between",
                          opacity: combatOutcome ? 0.4 : 1
                        }}
                        className="hover-glow"
                      >
                        <span>[HEAD] OPTICAL BLOCK</span>
                        <span style={{ color: "#ff0033" }}>35% HIT // 40 DMG</span>
                      </button>

                      <button
                        onClick={() => executeCombatTurn("TORSO")}
                        disabled={!!combatOutcome}
                        style={{
                          background: "transparent",
                          border: "1px solid #1f1f1f",
                          color: "#ffffff",
                          padding: "10px",
                          fontFamily: "var(--mono)",
                          fontSize: "12px",
                          textAlign: "left",
                          cursor: combatOutcome ? "not-allowed" : "pointer",
                          display: "flex",
                          justifyContent: "space-between",
                          opacity: combatOutcome ? 0.4 : 1
                        }}
                        className="hover-glow"
                      >
                        <span>[TORSO] FUSION CORE</span>
                        <span style={{ color: "#00ffcc" }}>85% HIT // 18 DMG</span>
                      </button>

                      <button
                        onClick={() => executeCombatTurn("ARMS")}
                        disabled={!!combatOutcome}
                        style={{
                          background: "transparent",
                          border: "1px solid #1f1f1f",
                          color: "#ffffff",
                          padding: "10px",
                          fontFamily: "var(--mono)",
                          fontSize: "12px",
                          textAlign: "left",
                          cursor: combatOutcome ? "not-allowed" : "pointer",
                          display: "flex",
                          justifyContent: "space-between",
                          opacity: combatOutcome ? 0.4 : 1
                        }}
                        className="hover-glow"
                      >
                        <span>[ARMS] LASER SENSOR</span>
                        <span style={{ color: "#f0c929" }}>55% HIT // 22 DMG</span>
                      </button>

                      <button
                        onClick={() => executeCombatTurn("LEGS")}
                        disabled={!!combatOutcome}
                        style={{
                          background: "transparent",
                          border: "1px solid #1f1f1f",
                          color: "#ffffff",
                          padding: "10px",
                          fontFamily: "var(--mono)",
                          fontSize: "12px",
                          textAlign: "left",
                          cursor: combatOutcome ? "not-allowed" : "pointer",
                          display: "flex",
                          justifyContent: "space-between",
                          opacity: combatOutcome ? 0.4 : 1
                        }}
                        className="hover-glow"
                      >
                        <span>[LEGS] STABILIZERS</span>
                        <span style={{ color: "#3b82f6" }}>100% HIT // 12 DMG</span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Right Column widgets */}
          <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
            
            {/* Widget 3: $THREAT Staking defensive shield */}
            <div style={{ border: "1px solid #1f1f1f", background: "#080808", padding: "24px" }}>
              <h2 style={{ fontFamily: "Orbitron, sans-serif", fontSize: "16px", color: "#ffffff", marginTop: 0, marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ display: "inline-block", width: "8px", height: "8px", background: "#ff0033" }} />
                3. DEFENSIVE SHIELD GRID
              </h2>
              
              <div style={{ display: "flex", justifyContent: "center", marginBottom: "20px" }}>
                {/* Visual Circular Shield Indicator */}
                <div style={{ width: "120px", height: "120px", borderRadius: "50%", border: "4px solid #1f1f1f", borderTopColor: "#00ffcc", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", position: "relative", boxShadow: "0 0 15px rgba(0,255,204,0.15)" }}>
                  <span style={{ fontSize: "20px", fontWeight: "bold", color: "#00ffcc" }}>{shieldIntegrity}%</span>
                  <span style={{ fontSize: "9px", color: "var(--text-muted)" }}>SHIELD OK</span>
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <div style={{ fontSize: "12px", display: "flex", justifyContent: "space-between" }}>
                  <span>STAKED $THREAT ESCROW:</span>
                  <span style={{ color: "#f0c929", fontWeight: "bold" }}>{stakedThreat} $THREAT</span>
                </div>
                
                <input
                  type="range"
                  min="0"
                  max="1000"
                  value={stakedThreat}
                  onChange={(e) => setStakedThreat(Number(e.target.value))}
                  style={{ width: "100%", accentColor: "#00ffcc", cursor: "pointer" }}
                />
                
                <div style={{ fontSize: "11px", color: "var(--text-muted)", lineHeight: "1.4", borderTop: "1px solid #1f1f1f", paddingTop: "10px", marginTop: "4px" }}>
                  Staking native token holdings projects an active electromagnetic shield layer over your bunker core inventory. Scaled to protect items from raid intrusions.
                </div>
              </div>
            </div>

            {/* Widget 4: Resource Scarcity & Radar */}
            <div style={{ border: "1px solid #1f1f1f", background: "#080808", padding: "24px" }}>
              <h2 style={{ fontFamily: "Orbitron, sans-serif", fontSize: "16px", color: "#ffffff", marginTop: 0, marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ display: "inline-block", width: "8px", height: "8px", background: "#ff0033" }} />
                4. SCAVENGING RESOURCE LEVEL
              </h2>

              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {/* Water meter */}
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "4px" }}>
                    <span>CLEAN WATER SUPPLY:</span>
                    <span style={{ color: "#3b82f6", fontWeight: "bold" }}>{waterLevel}%</span>
                  </div>
                  <div style={{ height: "6px", background: "#1f1f1f", borderRadius: "1px" }}>
                    <div style={{ width: `${waterLevel}%`, height: "100%", background: "#3b82f6" }} />
                  </div>
                </div>

                {/* Food meter */}
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "4px" }}>
                    <span>FOOD PROVISIONS:</span>
                    <span style={{ color: "#f0c929", fontWeight: "bold" }}>{foodLevel}%</span>
                  </div>
                  <div style={{ height: "6px", background: "#1f1f1f", borderRadius: "1px" }}>
                    <div style={{ width: `${foodLevel}%`, height: "100%", background: "#f0c929" }} />
                  </div>
                </div>

                {/* Energy grid meter */}
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "4px" }}>
                    <span>GRID ELECTROMAGNETIC INPUT:</span>
                    <span style={{ color: "#00ffcc", fontWeight: "bold" }}>{powerGrid}%</span>
                  </div>
                  <div style={{ height: "6px", background: "#1f1f1f", borderRadius: "1px" }}>
                    <div style={{ width: `${powerGrid}%`, height: "100%", background: "#00ffcc" }} />
                  </div>
                </div>
              </div>

              <div style={{ border: "1px solid #ff0033", background: "rgba(255, 0, 51, 0.05)", padding: "10px", marginTop: "20px", fontSize: "11px", color: "#ff0033", lineHeight: "1.4" }}>
                <strong>LIVE ANOMALY ADVISORY:</strong> Real-world wildfire vectors registered in Sector Alpha. Water levels are decreasing dynamically. Scarcity multipliers activated.
              </div>
            </div>

          </div>
        </div>

      </main>
    </div>
  );
}
