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
    description: "Wasteland scouts who excel at recovering items in highly toxic sectors.",
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
    description: "Aggressive combatants specialized in targeting vulnerability points.",
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

interface Opponent {
  name: string;
  faction: string;
  level: number;
  hp: number;
  trait: string;
  avatarSeed: number;
  statusEffects: string[];
}

const OPPONENT_NAMES = [
  "operative_x99", "marauder_warlord", "synth_hunter", "grid_runner", 
  "terminal_ghost", "bunker_boss", "decay_vector", "depin_operator",
  "xenomorph_host", "kaiju_watcher", "status_sync_locked", "waifu_hijacker"
];

type TargetLimb = "HEAD" | "TORSO" | "ARMS" | "LEGS";

export default function BunkerPage() {
  const { session, authIdentifier } = useAuth();
  const { publicKey, connected } = useWallet();

  // Faction state
  const [selectedFaction, setSelectedFaction] = useState<Faction | null>(null);

  // Staking & Shield
  const [stakedThreat, setStakedThreat] = useState<number>(100);
  const [shieldIntegrity, setShieldIntegrity] = useState<number>(65);

  // Resource parameters
  const [waterLevel, setWaterLevel] = useState<number>(45);
  const [foodLevel, setFoodLevel] = useState<number>(62);
  const [powerGrid, setPowerGrid] = useState<number>(78);

  // PvP State
  const [matchmaking, setMatchmaking] = useState<boolean>(false);
  const [activeMatch, setActiveMatch] = useState<boolean>(false);
  const [opponent, setOpponent] = useState<Opponent | null>(null);
  const [playerHp, setPlayerHp] = useState<number>(100);
  const [playerStatusEffects, setPlayerStatusEffects] = useState<string[]>([]);
  
  // Concurrency Turn Choices
  const [selectedAttack, setSelectedAttack] = useState<TargetLimb | null>(null);
  const [selectedDefense, setSelectedDefense] = useState<TargetLimb | null>(null);
  
  // Logs & Outcome
  const [combatLogs, setCombatLogs] = useState<string[]>([]);
  const [combatOutcome, setCombatOutcome] = useState<"win" | "lose" | null>(null);

  const combatLogEndRef = useRef<HTMLDivElement | null>(null);

  // Auto-calculating shield integrity based on staked $THREAT
  useEffect(() => {
    const baseShield = selectedFaction?.id === "syndicates" ? 45 : 30;
    const calculatedShield = Math.min(99.9, Math.round(baseShield + Math.log2(stakedThreat + 1) * 8));
    setShieldIntegrity(calculatedShield);
  }, [stakedThreat, selectedFaction]);

  // Scroll logs to bottom
  useEffect(() => {
    if (combatLogEndRef.current) {
      combatLogEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [combatLogs]);

  // Simulate PvP matchmaking
  const startMatchmaking = () => {
    setMatchmaking(true);
    setActiveMatch(false);
    setOpponent(null);
    setCombatOutcome(null);
    setSelectedAttack(null);
    setSelectedDefense(null);
    
    setTimeout(() => {
      const randomName = OPPONENT_NAMES[Math.floor(Math.random() * OPPONENT_NAMES.length)];
      const randomFaction = FACTIONS[Math.floor(Math.random() * FACTIONS.length)];
      
      const newOpponent: Opponent = {
        name: randomName.toUpperCase(),
        faction: randomFaction.name,
        level: Math.floor(Math.random() * 8) + 3,
        hp: 100,
        trait: randomFaction.trait,
        avatarSeed: Math.floor(Math.random() * 100),
        statusEffects: []
      };

      setPlayerHp(100);
      setPlayerStatusEffects([]);
      setOpponent(newOpponent);
      setMatchmaking(false);
      setActiveMatch(true);
      setCombatLogs([
        `MATCH CONFIGURED: Opponent located in Grid Sector Alpha.`,
        `HOSTILE: ${newOpponent.name} // Level ${newOpponent.level} // ${newOpponent.faction}`,
        `ALLIANCE TRAIT IN EFFECT: Hostile has ${newOpponent.trait}.`,
        `BATTLE ENGAGEMENT: Select your concurrent Attack Target and Defensive Shield zones...`
      ]);
    }, 2500);
  };

  // Turn resolution: Concurrent Attack and Defense
  const resolvePvPTurn = () => {
    if (!selectedAttack || !selectedDefense || !opponent || combatOutcome) return;

    let logs: string[] = [];

    // Faction modifiers for player
    const isMarauder = selectedFaction?.id === "marauders";
    const damageMultiplier = isMarauder ? 1.15 : 1.0;

    // Faction modifiers for opponent
    const opponentIsMarauder = opponent.faction === "MARAUDERS";
    const opponentDamageMultiplier = opponentIsMarauder ? 1.15 : 1.0;

    // Simulated Opponent turn choices (concurrent)
    const limbs: TargetLimb[] = ["HEAD", "TORSO", "ARMS", "LEGS"];
    const opponentAttack = limbs[Math.floor(Math.random() * limbs.length)];
    const opponentDefense = limbs[Math.floor(Math.random() * limbs.length)];

    logs.push(`----------------- RESOLVING ACTION -----------------`);
    logs.push(`> You targeted opponent's [${selectedAttack}] and defended your [${selectedDefense}].`);
    logs.push(`> Hostile targeted your [${opponentAttack}] and defended their [${opponentDefense}].`);

    // 1. Resolve Player's attack on Opponent
    let playerHitChance = 0.8;
    let playerBaseDamage = 18;
    switch (selectedAttack) {
      case "HEAD":
        playerHitChance = 0.35;
        playerBaseDamage = 45;
        break;
      case "TORSO":
        playerHitChance = 0.85;
        playerBaseDamage = 20;
        break;
      case "ARMS":
        playerHitChance = 0.55;
        playerBaseDamage = 24;
        break;
      case "LEGS":
        playerHitChance = 1.0;
        playerBaseDamage = 12;
        break;
    }

    // Apply active status effects on player (e.g. Confusion)
    if (playerStatusEffects.includes("CONFUSION")) {
      playerHitChance -= 0.25;
      logs.push(`> WARNING: Your [CONFUSION] debuff reduced your hit probability by 25%.`);
    }

    // Check if opponent defended player's target limb
    const opponentDefended = opponentDefense === selectedAttack;
    if (opponentDefended) {
      playerHitChance *= 0.2; // 80% reduction in hit chance if defended
      logs.push(`> DEFLECT: Opponent projected a shield on their [${selectedAttack}] zone.`);
    }

    // Roll player strike
    const playerRoll = Math.random();
    let opponentNewHp = opponent.hp;
    if (playerRoll <= playerHitChance) {
      const finalDmg = Math.round(playerBaseDamage * damageMultiplier * (0.85 + Math.random() * 0.3));
      opponentNewHp = Math.max(0, opponent.hp - finalDmg);
      logs.push(`> IMPACT: You struck ${opponent.name}'s [${selectedAttack}]! Dealt ${finalDmg} damage.`);
      
      // Apply status effects based on limb
      if (selectedAttack === "HEAD" && Math.random() < 0.5 && !opponent.statusEffects.includes("CONFUSION")) {
        opponent.statusEffects.push("CONFUSION");
        logs.push(`> CRITICAL: ${opponent.name} is confused! Optics processing disrupted.`);
      }
      if (selectedAttack === "ARMS" && Math.random() < 0.4 && !opponent.statusEffects.includes("DISARMED")) {
        opponent.statusEffects.push("DISARMED");
        logs.push(`> DISARM: Struck weapon arrays. ${opponent.name} has been disarmed.`);
      }
      if (selectedAttack === "LEGS" && Math.random() < 0.6 && !opponent.statusEffects.includes("SLOWED")) {
        opponent.statusEffects.push("SLOWED");
        logs.push(`> CRIPPLE: Struck stabilizers. ${opponent.name} turn recovery is slowed.`);
      }
    } else {
      logs.push(`> MISS: Your attack on [${selectedAttack}] missed or was completely absorbed.`);
    }

    // 2. Resolve Opponent's attack on Player
    let opponentHitChance = 0.8;
    let opponentBaseDamage = 18;
    switch (opponentAttack) {
      case "HEAD":
        opponentHitChance = 0.35;
        opponentBaseDamage = 45;
        break;
      case "TORSO":
        opponentHitChance = 0.85;
        opponentBaseDamage = 20;
        break;
      case "ARMS":
        opponentHitChance = 0.55;
        opponentBaseDamage = 24;
        break;
      case "LEGS":
        opponentHitChance = 1.0;
        opponentBaseDamage = 12;
        break;
    }

    // Apply active status effects on opponent
    if (opponent.statusEffects.includes("CONFUSION")) {
      opponentHitChance -= 0.25;
      logs.push(`> DEBUFF: Hostile [CONFUSION] reduced their hit probability.`);
    }

    // Check if player defended opponent's target limb
    const playerDefended = selectedDefense === opponentAttack;
    if (playerDefended) {
      opponentHitChance *= 0.2;
      logs.push(`> DEFLECT: Your energy shield blocked the incoming strike on your [${opponentAttack}].`);
    }

    // Roll opponent strike
    const opponentRoll = Math.random();
    let playerNewHp = playerHp;
    if (opponentRoll <= opponentHitChance) {
      let finalOpponentDmg = Math.round(opponentBaseDamage * opponentDamageMultiplier * (0.85 + Math.random() * 0.3));
      
      // $THREAT Staking defensive shield absorption
      if (opponentAttack === "TORSO" && shieldIntegrity > 0) {
        const absorption = Math.round(finalOpponentDmg * (shieldIntegrity / 100));
        finalOpponentDmg -= absorption;
        logs.push(`> SHIELD SHIELDING: Your staked $THREAT shield absorbed ${absorption} damage.`);
      }

      playerNewHp = Math.max(0, playerHp - finalOpponentDmg);
      logs.push(`> INTRUSION: ${opponent.name} struck your [${opponentAttack}]! Took ${finalOpponentDmg} damage.`);
      
      // Apply status effects to player
      if (opponentAttack === "HEAD" && Math.random() < 0.5 && !playerStatusEffects.includes("CONFUSION")) {
        setPlayerStatusEffects(prev => [...prev, "CONFUSION"]);
        logs.push(`> CRITICAL WARNING: Mainframe optics hit! [CONFUSION] status active.`);
      }
      if (opponentAttack === "ARMS" && Math.random() < 0.4 && !playerStatusEffects.includes("DISARMED")) {
        setPlayerStatusEffects(prev => [...prev, "DISARMED"]);
        logs.push(`> WEAPON ERROR: Micro-laser arrays offline! [DISARMED] status active.`);
      }
      if (opponentAttack === "LEGS" && Math.random() < 0.6 && !playerStatusEffects.includes("SLOWED")) {
        setPlayerStatusEffects(prev => [...prev, "SLOWED"]);
        logs.push(`> KINETIC ERROR: Stabilizer fluid leak! [SLOWED] status active.`);
      }
    } else {
      logs.push(`> EVADE: Hostile strike on [${opponentAttack}] missed or was absorbed.`);
    }

    // Update HP states
    setPlayerHp(playerNewHp);
    setOpponent(prev => prev ? { ...prev, hp: opponentNewHp } : null);

    // Check Match Outcomes
    if (opponentNewHp <= 0 && playerNewHp <= 0) {
      logs.push(`MUTUAL DESTRUCTION: Both operatives flatlined in Sector Alpha.`);
      setCombatOutcome("lose");
      setActiveMatch(false);
    } else if (opponentNewHp <= 0) {
      logs.push(`VICTORY: ${opponent.name} flatlined. XP +50 and Faction Standing increased.`);
      setCombatOutcome("win");
      setActiveMatch(false);
    } else if (playerNewHp <= 0) {
      logs.push(`DEFEAT: You flatlined. BIO-SCORE decay warning triggered.`);
      setCombatOutcome("lose");
      setActiveMatch(false);
    }

    setCombatLogs(prev => [...prev, ...logs]);
    setSelectedAttack(null);
    setSelectedDefense(null);
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
                Pledge your faction, adjust your $THREAT Staking defensive shields, and enter the turn-based 1v1 tactical PvP combat grid to verify your operative survivability.
              </p>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "4px", fontSize: "12px", background: "#080808", padding: "12px", border: "1px solid #1f1f1f", minWidth: "220px" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "var(--text-muted)" }}>SECTOR RATING:</span><span style={{ color: "#ff0033" }}>94% HAZARD</span></div>
              <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "var(--text-muted)" }}>CLEARANCE:</span><span>LEVEL 5 ACTUATOR</span></div>
              <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "var(--text-muted)" }}>PASSPORT HASH:</span><span style={{ fontSize: "10px" }}>{currentWallet ? `${currentWallet.slice(0, 6)}...${currentWallet.slice(-6)}` : "OFFLINE"}</span></div>
            </div>
          </div>
        </section>

        {/* Double Column Dashboard layout */}
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
                Pledge your alliance to modify your active parameters, stats scaling multipliers, and combat abilities.
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

            {/* Widget 2: Tactical 1v1 PvP Combat Simulator */}
            <div style={{ border: "1px solid #1f1f1f", background: "#080808", padding: "24px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px" }}>
                <h2 style={{ fontFamily: "Orbitron, sans-serif", fontSize: "16px", color: "#ffffff", margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ display: "inline-block", width: "8px", height: "8px", background: "#ff0033" }} />
                  2. TACTICAL 1v1 PvP COMBAT ENGINE
                </h2>
                {!activeMatch && !matchmaking ? (
                  <button
                    onClick={startMatchmaking}
                    style={{ background: "#ff0033", border: "none", color: "#ffffff", padding: "6px 16px", fontSize: "12px", fontFamily: "var(--mono)", fontWeight: "bold", cursor: "pointer", borderRadius: "1px", textShadow: "0 0 4px rgba(255,255,255,0.6)" }}
                  >
                    [ DEPLOY TO COMBAT GRID ]
                  </button>
                ) : (
                  <button
                    onClick={() => {
                      setActiveMatch(false);
                      setMatchmaking(false);
                    }}
                    style={{ background: "transparent", border: "1px solid #ff0033", color: "#ff0033", padding: "4px 12px", fontSize: "11px", fontFamily: "var(--mono)", cursor: "pointer" }}
                  >
                    [ ESCAPE FIGHT ]
                  </button>
                )}
              </div>

              {matchmaking && (
                <div style={{ border: "1px dashed #ff0033", height: "320px", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", background: "#050505", gap: "16px" }}>
                  <div style={{ width: "40px", height: "40px", border: "4px solid rgba(255,0,51,0.2)", borderTopColor: "#ff0033", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
                  <span style={{ fontSize: "14px", color: "#ff0033", letterSpacing: "2px", fontWeight: "bold", animation: "pulse 1.5s infinite" }}>SCANNING COMBAT GRID SECORS...</span>
                  <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>Finding active hostile players for 1v1 match...</span>
                  <style jsx global>{`
                    @keyframes spin { 0% { transform: rotate(0deg); } 100% { transform: rotate(360deg); } }
                    @keyframes pulse { 0% { opacity: 0.5; } 50% { opacity: 1; } 100% { opacity: 0.5; } }
                  `}</style>
                </div>
              )}

              {!activeMatch && !matchmaking && (
                <div style={{ border: "1px dashed #1f1f1f", height: "320px", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", background: "#050505", gap: "12px" }}>
                  <svg width="48" height="48" viewBox="0 0 24 24" fill="none" stroke="#ff0033" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ opacity: 0.6, filter: "drop-shadow(0 0 8px rgba(255,0,51,0.25))" }}>
                    <path d="M12 22a10 10 0 1 0 0-20 10 10 0 0 0 0 20z" />
                    <path d="M12 6v6l4 2" />
                  </svg>
                  <span style={{ fontSize: "14px", color: "var(--text-dim)" }}>Simulation Lobby Idle</span>
                  <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>Deploy to match with random faction hostiles on the grid</span>
                </div>
              )}

              {activeMatch && opponent && (
                <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  
                  {/* PvP Combat Stats header */}
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
                    {/* Player statistics */}
                    <div style={{ background: "#050505", border: "1px solid #1a1a1a", padding: "12px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "6px" }}>
                        <span>YOU // {selectedFaction ? selectedFaction.name : "ALLIANCELESS"}:</span>
                        <span style={{ color: playerHp > 30 ? "#00ffcc" : "#ff0033", fontWeight: "bold" }}>{playerHp}% HP</span>
                      </div>
                      <div style={{ height: "10px", background: "#1f1f1f", borderRadius: "1px", overflow: "hidden" }}>
                        <div style={{ width: `${playerHp}%`, height: "100%", background: playerHp > 30 ? "#00ffcc" : "#ff0033", transition: "width 0.3s ease-out" }} />
                      </div>
                      {playerStatusEffects.length > 0 && (
                        <div style={{ display: "flex", gap: "6px", marginTop: "8px", flexWrap: "wrap" }}>
                          {playerStatusEffects.map(effect => (
                            <span key={effect} style={{ fontSize: "9px", background: "rgba(255,0,51,0.15)", border: "1px solid #ff0033", padding: "1px 5px", color: "#ff0033", fontWeight: "bold" }}>
                              {effect}
                            </span>
                          ))}
                        </div>
                      )}
                    </div>

                    {/* Opponent statistics */}
                    <div style={{ background: "#050505", border: "1px solid #1a1a1a", padding: "12px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "6px" }}>
                        <span>OPPONENT: {opponent.name} [Lvl {opponent.level}]:</span>
                        <span style={{ color: "#ff0033", fontWeight: "bold" }}>{opponent.hp}% HP</span>
                      </div>
                      <div style={{ height: "10px", background: "#1f1f1f", borderRadius: "1px", overflow: "hidden" }}>
                        <div style={{ width: `${opponent.hp}%`, height: "100%", background: "#ff0033", transition: "width 0.3s ease-out" }} />
                      </div>
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: "6px", fontSize: "10px", color: "var(--text-muted)" }}>
                        <span>Faction: {opponent.faction}</span>
                        {opponent.statusEffects.length > 0 && (
                          <div style={{ display: "flex", gap: "4px" }}>
                            {opponent.statusEffects.map(e => (
                              <span key={e} style={{ color: "#f0c929", border: "1px solid rgba(240,201,41,0.3)", padding: "0 3px", fontSize: "8.5px" }}>{e}</span>
                            ))}
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Turn Selection matrix */}
                  <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "20px" }} className="responsive-grid-2">
                    
                    {/* Combat Log Console */}
                    <div style={{ background: "#050505", border: "1px solid #1a1a1a", padding: "12px", height: "260px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                      <div style={{ overflowY: "auto", flexGrow: 1, fontSize: "10.5px", display: "flex", flexDirection: "column", gap: "6px" }}>
                        {combatLogs.map((log, i) => (
                          <div key={i} style={{
                            color: log.startsWith("> IMPACT") ? "#00ffcc" : 
                                   log.startsWith("> INTRUSION") || log.startsWith("CRITICAL") || log.startsWith("DEFEAT") ? "#ff0033" : 
                                   log.startsWith("VICTORY") ? "#00ffcc" : 
                                   log.startsWith("-----") ? "#7f7f7f" : "var(--text-dim)"
                          }}>
                            {log}
                          </div>
                        ))}
                        <div ref={combatLogEndRef} />
                      </div>
                      
                      {combatOutcome && (
                        <div style={{ borderTop: "1px solid #1f1f1f", paddingTop: "8px", marginTop: "8px", textAlign: "center", fontWeight: "bold", fontSize: "12.5px", color: combatOutcome === "win" ? "#00ffcc" : "#ff0033" }}>
                          {combatOutcome === "win" ? "✓ VICTORY: HOSTILE ELIMINATED" : "✗ DEFEAT: YOUR MAINSTAT FLUID DECAYED"}
                          <button
                            onClick={startMatchmaking}
                            style={{ display: "block", margin: "6px auto 0", background: "transparent", border: "1px solid currentColor", color: "inherit", padding: "2px 10px", fontSize: "10px", cursor: "pointer", fontFamily: "var(--mono)" }}
                          >
                            [ MATCH AGAIN ]
                          </button>
                        </div>
                      )}
                    </div>

                    {/* Action selectors */}
                    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                      
                      {/* Attack Limb Selection */}
                      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                        <span style={{ fontSize: "11px", fontWeight: "bold", color: "var(--text-muted)" }}>[A] SELECT ATTACK TARGET:</span>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px" }}>
                          {(["HEAD", "TORSO", "ARMS", "LEGS"] as TargetLimb[]).map(limb => (
                            <button
                              key={limb}
                              onClick={() => setSelectedAttack(limb)}
                              disabled={!!combatOutcome}
                              style={{
                                background: selectedAttack === limb ? "rgba(255, 0, 51, 0.15)" : "transparent",
                                border: `1px solid ${selectedAttack === limb ? "#ff0033" : "#1f1f1f"}`,
                                color: "#ffffff",
                                padding: "6px 2px",
                                fontSize: "11px",
                                fontFamily: "var(--mono)",
                                cursor: combatOutcome ? "not-allowed" : "pointer",
                                opacity: combatOutcome ? 0.4 : 1
                              }}
                              className="hover-glow"
                            >
                              {limb}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Defense Limb Selection */}
                      <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginTop: "4px" }}>
                        <span style={{ fontSize: "11px", fontWeight: "bold", color: "var(--text-muted)" }}>[B] SELECT DEFENSIVE SHIELD:</span>
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px" }}>
                          {(["HEAD", "TORSO", "ARMS", "LEGS"] as TargetLimb[]).map(limb => (
                            <button
                              key={limb}
                              onClick={() => setSelectedDefense(limb)}
                              disabled={!!combatOutcome}
                              style={{
                                background: selectedDefense === limb ? "rgba(0, 255, 204, 0.15)" : "transparent",
                                border: `1px solid ${selectedDefense === limb ? "#00ffcc" : "#1f1f1f"}`,
                                color: "#ffffff",
                                padding: "6px 2px",
                                fontSize: "11px",
                                fontFamily: "var(--mono)",
                                cursor: combatOutcome ? "not-allowed" : "pointer",
                                opacity: combatOutcome ? 0.4 : 1
                              }}
                              className="hover-glow"
                            >
                              {limb}
                            </button>
                          ))}
                        </div>
                      </div>

                      {/* Submit Turn */}
                      <button
                        onClick={resolvePvPTurn}
                        disabled={!selectedAttack || !selectedDefense || !!combatOutcome}
                        style={{
                          marginTop: "10px",
                          background: (selectedAttack && selectedDefense && !combatOutcome) ? "#ff0033" : "transparent",
                          border: `1px solid ${(selectedAttack && selectedDefense && !combatOutcome) ? "#ff0033" : "#1f1f1f"}`,
                          color: (selectedAttack && selectedDefense && !combatOutcome) ? "#ffffff" : "var(--text-muted)",
                          padding: "10px",
                          fontWeight: "bold",
                          fontFamily: "var(--mono)",
                          fontSize: "12px",
                          cursor: (selectedAttack && selectedDefense && !combatOutcome) ? "pointer" : "not-allowed"
                        }}
                      >
                        [ SUBMIT TACTICAL ACTIONS ]
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
                <strong>LIVE ANOMALY ADVISORY:</strong> Real-world wildfire vectors registered in Sector Alpha. Water supply is decreasing dynamically. Scarcity multipliers activated.
              </div>
            </div>

          </div>
        </div>

      </main>
    </div>
  );
}
