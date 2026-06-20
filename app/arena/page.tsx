"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/components/AuthProvider";
import { useWallet } from "@solana/wallet-adapter-react";
import Link from "next/link";

type Limb = "HEAD" | "TORSO" | "ARMS" | "LEGS";

interface Message {
  time: string;
  sender: string;
  text: string;
  color?: string;
}

interface StatBarProps {
  label: string;
  value: number;
  max: number;
  color: string;
}

function StatBar({ label, value, max, color }: StatBarProps) {
  const percentage = Math.min(100, Math.round((value / max) * 100));
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2px", width: "100%", position: "relative", zIndex: 3 }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", color: color === "#ff003c" ? "#ff003c" : "#8a8a8a", fontFamily: "Rajdhani, sans-serif", letterSpacing: "0.15em", textTransform: "uppercase", fontWeight: 600 }}>
        <span>{label}</span>
        <span style={{ color: "#ffffff", fontWeight: 700 }}>{value}</span>
      </div>
      <div style={{ height: "3px", background: "rgba(17,17,17,0.6)", border: "1px solid rgba(255,255,255,0.05)", position: "relative" }}>
        <div style={{ height: "100%", width: `${percentage}%`, background: color, boxShadow: color === "#ff003c" ? "0 0 10px rgba(255, 0, 60, 0.6)" : "0 0 10px rgba(255, 255, 255, 0.4)" }} />
      </div>
    </div>
  );
}

interface InventorySlotProps {
  icon: React.ReactNode;
  color: string;
}

function InventorySlot({ icon, color }: InventorySlotProps) {
  return (
    <div 
      style={{ 
        width: "44px", 
        height: "44px", 
        border: `1px solid ${color === "#ff003c" ? "rgba(255, 0, 60, 0.15)" : "rgba(255, 255, 255, 0.1)"}`, 
        background: "rgba(5, 5, 5, 0.8)", 
        display: "flex", 
        justifyContent: "center", 
        alignItems: "center", 
        position: "relative",
        borderRadius: "2px",
        boxShadow: "inset 0 0 8px rgba(0,0,0,0.95)",
        zIndex: 3
      }} 
      className="inventory-slot"
    >
      <div style={{ color: color, opacity: 0.75 }}>{icon}</div>
      <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", border: `1px solid ${color}0b`, pointerEvents: "none" }} />
    </div>
  );
}

export default function ArenaPage() {
  const { authIdentifier } = useAuth();
  const { publicKey } = useWallet();
  const wallet = authIdentifier || (publicKey ? publicKey.toString() : null);

  // Combat States
  const [matchActive, setMatchActive] = useState<boolean>(false);
  const [countdown, setCountdown] = useState<number>(12);
  const [playerHp, setPlayerHp] = useState<number>(174);
  const [playerMaxHp] = useState<number>(174);
  const [opponentHp, setOpponentHp] = useState<number>(154);
  const [opponentMaxHp] = useState<number>(183);
  
  // Stats
  const playerStats = { attack: 68, defense: 42, agility: 57, intellect: 71, luck: 33 };
  const opponentStats = { attack: 64, defense: 49, agility: 52, intellect: 63, luck: 27 };

  // Concurrent Turn Selections
  const [selectedAttack, setSelectedAttack] = useState<Limb | null>(null);
  const [selectedDefense, setSelectedDefense] = useState<Limb | null>(null);

  // Chat States
  const [chatMessages, setChatMessages] = useState<Message[]>([
    { time: "22:51", sender: "REDQUEEN_X", text: "Let's see if you can keep up.", color: "#ff003c" },
    { time: "22:51", sender: "DESGECEAN", text: "Always ready." },
    { time: "22:52", sender: "REDQUEEN_X", text: "No mercy.", color: "#ff003c" },
    { time: "22:52", sender: "DESGECEAN", text: "Bring it." },
    { time: "22:52", sender: "SYSTEM", text: "Match found. Preparing arena...", color: "#ff003c" }
  ]);
  const [chatInput, setChatInput] = useState<string>("");

  // Battle Log States
  const [battleLogs, setBattleLogs] = useState<Message[]>([
    { time: "22:48", sender: "SYSTEM", text: "DESGECEAN joined the arena" },
    { time: "22:48", sender: "SYSTEM", text: "REDQUEEN_X joined the arena" },
    { time: "22:48", sender: "SYSTEM", text: "Bet locked: 10 THREAT" },
    { time: "22:48", sender: "SYSTEM", text: "Match type: Ranked 1v1" },
    { time: "22:49", sender: "SYSTEM", text: "Arena: Wasteland Coliseum" },
    { time: "22:49", sender: "SYSTEM", text: "Preparing combat protocols..." }
  ]);

  const [combatOutcome, setCombatOutcome] = useState<"win" | "lose" | null>(null);

  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const logEndRef = useRef<HTMLDivElement | null>(null);

  // Auto scroll chat and logs
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [battleLogs]);

  // Countdown timer simulation
  useEffect(() => {
    if (countdown > 0 && !matchActive) {
      const timer = setTimeout(() => setCountdown(prev => prev - 1), 1000);
      return () => clearTimeout(timer);
    } else if (countdown === 0 && !matchActive) {
      triggerStartMatch();
    }
  }, [countdown, matchActive]);

  const triggerStartMatch = () => {
    setMatchActive(true);
    setPlayerHp(174);
    setOpponentHp(154);
    setCombatOutcome(null);
    setSelectedAttack(null);
    setSelectedDefense(null);
    
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setBattleLogs(prev => [
      ...prev,
      { time: timeStr, sender: "SYSTEM", text: "⚔️ COMBAT ENGAGED. Dynamic mutators active." }
    ]);
  };

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMsg: Message = {
      time: timeStr,
      sender: "REDQUEEN_X",
      text: chatInput,
      color: "#ff003c"
    };

    setChatMessages(prev => [...prev, userMsg]);
    setChatInput("");

    // Simulated opponent replies
    setTimeout(() => {
      const replies = [
        "Your strike indicators won't save you.",
        "USDC pool is mine.",
        "Calculation error on your shield.",
        "Check your limb integrity.",
        "Nice setup, but mine is better.",
        "Tactical retreat is always an option."
      ];
      const oppMsg: Message = {
        time: timeStr,
        sender: "DESGECEAN",
        text: replies[Math.floor(Math.random() * replies.length)]
      };
      setChatMessages(prev => [...prev, oppMsg]);
    }, 1200);
  };

  const submitTacticalMoves = () => {
    if (!selectedAttack || !selectedDefense || combatOutcome) return;

    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    let newLogs: Message[] = [];

    // Opponent makes concurrent moves
    const limbs: Limb[] = ["HEAD", "TORSO", "ARMS", "LEGS"];
    const opponentAttack = limbs[Math.floor(Math.random() * limbs.length)];
    const opponentDefense = limbs[Math.floor(Math.random() * limbs.length)];

    newLogs.push({ time: timeStr, sender: "SYSTEM", text: `RESOLVING ROUND: You attacked [${selectedAttack}], defended [${selectedDefense}]. Opponent attacked [${opponentAttack}], defended [${opponentDefense}].` });

    // 1. Player Attack resolution (modified by stats)
    let playerHitChance = 0.8;
    let playerBaseDamage = 22;
    switch (selectedAttack) {
      case "HEAD":
        playerHitChance = 0.35;
        playerBaseDamage = 50;
        break;
      case "TORSO":
        playerHitChance = 0.85;
        playerBaseDamage = 24;
        break;
      case "ARMS":
        playerHitChance = 0.55;
        playerBaseDamage = 28;
        break;
      case "LEGS":
        playerHitChance = 1.0;
        playerBaseDamage = 14;
        break;
    }

    // Adjust hit chance based on stats
    const agilityRatio = playerStats.agility / opponentStats.agility;
    playerHitChance *= agilityRatio;

    // Defended penalty
    if (opponentDefense === selectedAttack) {
      playerHitChance *= 0.25;
      newLogs.push({ time: timeStr, sender: "SYSTEM", text: `Deflected! Opponent blocked strike on their [${selectedAttack}].`, color: "#f0c929" });
    }

    const hitRoll = Math.random();
    let oppHp = opponentHp;
    if (hitRoll <= playerHitChance) {
      // Crit roll based on luck
      const critRoll = Math.random();
      const isCrit = critRoll <= (playerStats.luck / 100);
      let dmg = Math.round(playerBaseDamage * (playerStats.attack / opponentStats.defense) * (0.9 + Math.random() * 0.2));
      if (isCrit) {
        dmg = Math.round(dmg * 1.5);
        newLogs.push({ time: timeStr, sender: "REDQUEEN_X", text: `💥 CRITICAL DIRECT HIT! Dealt ${dmg} damage to opponent's [${selectedAttack}].`, color: "#00ffcc" });
      } else {
        newLogs.push({ time: timeStr, sender: "REDQUEEN_X", text: `Direct hit! Dealt ${dmg} damage to opponent's [${selectedAttack}].` });
      }
      oppHp = Math.max(0, opponentHp - dmg);
      setOpponentHp(oppHp);
    } else {
      newLogs.push({ time: timeStr, sender: "SYSTEM", text: `Strike on opponent's [${selectedAttack}] missed.` });
    }

    // 2. Opponent Attack resolution
    let oppHitChance = 0.8;
    let oppBaseDamage = 22;
    switch (opponentAttack) {
      case "HEAD":
        oppHitChance = 0.35;
        oppBaseDamage = 50;
        break;
      case "TORSO":
        oppHitChance = 0.85;
        oppBaseDamage = 24;
        break;
      case "ARMS":
        oppHitChance = 0.55;
        oppBaseDamage = 28;
        break;
      case "LEGS":
        oppHitChance = 1.0;
        oppBaseDamage = 14;
        break;
    }

    // Adjust hit chance
    const oppAgilityRatio = opponentStats.agility / playerStats.agility;
    oppHitChance *= oppAgilityRatio;

    // Defended check
    if (selectedDefense === opponentAttack) {
      oppHitChance *= 0.25;
      newLogs.push({ time: timeStr, sender: "SYSTEM", text: `Blocked! You deflected the incoming strike on your [${opponentAttack}].`, color: "#00ffcc" });
    }

    const oppHitRoll = Math.random();
    let plyHp = playerHp;
    if (oppHitRoll <= oppHitChance) {
      const oppCritRoll = Math.random();
      const oppIsCrit = oppCritRoll <= (opponentStats.luck / 100);
      let oppDmg = Math.round(oppBaseDamage * (opponentStats.attack / playerStats.defense) * (0.9 + Math.random() * 0.2));
      if (oppIsCrit) {
        oppDmg = Math.round(oppDmg * 1.5);
        newLogs.push({ time: timeStr, sender: "DESGECEAN", text: `💥 CRITICAL HAWKEYE! Struck your [${opponentAttack}] for ${oppDmg} damage.`, color: "#ff003c" });
      } else {
        newLogs.push({ time: timeStr, sender: "DESGECEAN", text: `Struck your [${opponentAttack}] for ${oppDmg} damage.` });
      }
      plyHp = Math.max(0, playerHp - oppDmg);
      setPlayerHp(plyHp);
    } else {
      newLogs.push({ time: timeStr, sender: "SYSTEM", text: `Hostile strike on your [${opponentAttack}] evaded.` });
    }

    // Check game outcome
    if (oppHp <= 0 && plyHp <= 0) {
      setCombatOutcome("lose");
      setMatchActive(false);
      newLogs.push({ time: timeStr, sender: "SYSTEM", text: "💀 MATCH CONCLUDED: Mutual destruction.", color: "#ff003c" });
    } else if (oppHp <= 0) {
      setCombatOutcome("win");
      setMatchActive(false);
      newLogs.push({ time: timeStr, sender: "SYSTEM", text: "🏆 VICTORY! Opponent eliminated. +10 $THREAT locked.", color: "#00ffcc" });
    } else if (plyHp <= 0) {
      setCombatOutcome("lose");
      setMatchActive(false);
      newLogs.push({ time: timeStr, sender: "SYSTEM", text: "❌ DEFEAT: Mainframe shut down. Lost 10 $THREAT.", color: "#ff003c" });
    }

    setBattleLogs(prev => [...prev, ...newLogs]);
    setSelectedAttack(null);
    setSelectedDefense(null);
  };

  // SVGs for equipment slots
  const HelmetIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M12 2C6.5 2 2 6.5 2 12c0 3 .5 5.5 2.5 7.5L6 18c1.5-1.5 2.5-3.5 2.5-5.5V11h7v1.5c0 2 1 4 2.5 5.5l1.5 1.5c2-2 2.5-4.5 2.5-7.5 0-5.5-4.5-10-10-10z" />
      <path d="M9 11c0-1.5 1-3 3-3s3 1.5 3 3" />
      <circle cx="9" cy="13" r="1" fill="currentColor" />
      <circle cx="15" cy="13" r="1" fill="currentColor" />
    </svg>
  );

  const ArmorIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M12 2L4 5v7c0 5.25 3.42 10.15 8 11.5 4.58-1.35 8-6.25 8-11.5V5l-8-3z" />
      <path d="M9 7h6v3H9z" />
      <path d="M8 12h8v3H8z" />
    </svg>
  );

  const WeaponIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M14.5 17.5L3 6V3h3l11.5 11.5" />
      <path d="M13 19l2 2m4-4l2 2" />
      <path d="M19 5l-3 3 1.5 1.5 3-3z" />
    </svg>
  );

  const PantsIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M6 2h12v7l-2 8H8l-2-8V2z" />
      <path d="M10 2v15M14 2v15" />
      <path d="M6 9h12" />
    </svg>
  );

  const BootsIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M4 16v-2a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v2l-3 4H7l-3-4z" />
      <path d="M8 10V6a2 2 0 0 1 4 0v4M12 10V6a2 2 0 0 1 4 0v4" />
    </svg>
  );

  return (
    <div id="game-arena-root" style={{ background: "#050505", minHeight: "100vh", color: "#ffffff", fontFamily: "Exo 2, Rajdhani, sans-serif", padding: "16px 24px", position: "relative", boxSizing: "border-box", overflow: "hidden", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
      {/* Global CSS Style tag for typography, scanning sweeps and targeting effects */}
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Exo+2:wght@300;400;600;700&family=Orbitron:wght@500;800;900&family=Oxanium:wght@400;500;700&family=Rajdhani:wght@400;500;600;700&display=swap');

        /* Fullscreen CRT scanline overlay */
        #game-arena-root::before {
          content: " ";
          display: block;
          position: absolute;
          top: 0; left: 0; bottom: 0; right: 0;
          background: repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,.012) 3px);
          background-size: 100% 4px;
          z-index: 10;
          pointer-events: none;
          opacity: 0.45;
        }

        /* 50px grid overlay */
        #game-arena-root::after {
          content: " ";
          display: block;
          position: absolute;
          top: 0; left: 0; bottom: 0; right: 0;
          background-image: linear-gradient(rgba(255, 0, 60, 0.015) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(255, 0, 60, 0.015) 1px, transparent 1px);
          background-size: 50px 50px;
          z-index: 1;
          pointer-events: none;
        }

        /* Radar sweep animation overlay */
        .radar-sweep {
          position: absolute;
          top: 0; left: 0; width: 100%; height: 100%;
          background: linear-gradient(to bottom, rgba(255,0,60,0) 0%, rgba(255,0,60,0.02) 50%, rgba(255,0,60,0) 100%);
          animation: sweep-down 6s linear infinite;
          z-index: 2;
          pointer-events: none;
        }

        @keyframes sweep-down {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100%); }
        }

        @keyframes spin { 
          0% { transform: rotate(0deg); } 
          100% { transform: rotate(360deg); } 
        }
        @keyframes spin-reverse { 
          0% { transform: rotate(360deg); } 
          100% { transform: rotate(0deg); } 
        }
        .hover-glow:hover {
          color: #ff003c !important;
          text-shadow: 0 0 10px rgba(255,0,60,0.8);
        }
      `}</style>

      {/* Dynamic scanline sweeps layer */}
      <div className="radar-sweep" />

      {/* Screen Frame Border */}
      <div style={{ position: "absolute", top: "12px", left: "12px", right: "12px", bottom: "12px", border: "1px solid rgba(255, 0, 60, 0.08)", pointerEvents: "none", zIndex: 5 }} />

      {/* Header Bar */}
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(255, 0, 60, 0.08)", paddingBottom: "8px", position: "relative", zIndex: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
          <span style={{ color: "#ff003c", fontWeight: "900", fontSize: "14px", fontFamily: "Orbitron, sans-serif", textShadow: "0 0 8px rgba(255, 0, 60, 0.6)", letterSpacing: "0.15em" }}>
            &gt; P2P ARENA &nbsp; /// &nbsp; 1v1 DUEL &nbsp; ///
          </span>
          <div style={{ display: "flex", gap: "12px", fontSize: "10px", fontFamily: "Rajdhani, sans-serif", letterSpacing: "0.15em", fontWeight: 600 }}>
            <Link href="/solvivors" style={{ color: "#8a8a8a", textDecoration: "none" }} className="hover-glow">[ HUB ]</Link>
            <Link href="/bunker" style={{ color: "#8a8a8a", textDecoration: "none" }} className="hover-glow">[ BUNKER ]</Link>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", fontSize: "10px", color: "#8a8a8a", fontFamily: "Rajdhani, sans-serif", letterSpacing: "0.15em", fontWeight: 600 }}>
          <span>SEASON 1</span>
          <span style={{ color: "#ff003c" }}>●</span>
          <span style={{ display: "flex", alignItems: "center", gap: "4px", color: "#ffffff" }}>RANKED MATCH <span style={{ color: "#ff003c" }}>★</span></span>
        </div>
      </header>

      {/* Main 1v1 Arena HUD Layer */}
      <main style={{ display: "grid", gridTemplateColumns: "1fr 1.15fr 1fr", gap: "24px", flexGrow: 1, alignItems: "center", position: "relative", zIndex: 10, minHeight: "0", margin: "12px 0" }}>
        
        {/* PLAYER A (Left Panel) */}
        <div style={{ display: "flex", gap: "16px", alignItems: "center", height: "100%", position: "relative", padding: "12px" }}>
          
          {/* Crimson Red Glow Queen Silhouette standing in the background */}
          <img
            src="/images/redqueen_silhouette.png"
            alt="Red Queen Silhouette"
            style={{
              position: "absolute",
              top: "10%",
              left: "50%",
              transform: "translateX(-40%)",
              height: "75%",
              width: "auto",
              opacity: 0.65,
              filter: "drop-shadow(0 0 25px rgba(255, 0, 60, 0.65))",
              zIndex: 1,
              pointerEvents: "none"
            }}
          />

          {/* Symmetrical items stacked on A far left */}
          <div style={{ display: "flex", flexDirection: "column", gap: "12px", zIndex: 3 }}>
            <InventorySlot icon={<HelmetIcon />} color="#ff003c" />
            <InventorySlot icon={<ArmorIcon />} color="#ff003c" />
            <InventorySlot icon={<WeaponIcon />} color="#ff003c" />
            <InventorySlot icon={<PantsIcon />} color="#ff003c" />
            <InventorySlot icon={<BootsIcon />} color="#ff003c" />
          </div>

          {/* Symmetrical stats layout overlaid on B */}
          <div style={{ flexGrow: 1, display: "flex", flexDirection: "column", justifyContent: "space-between", height: "100%", maxWidth: "220px", zIndex: 3 }}>
            <div>
              <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#ff003c" }}>
                <span style={{ fontSize: "16px", fontWeight: "900", fontFamily: "Orbitron, sans-serif", letterSpacing: "0.05em", textShadow: "0 0 10px rgba(255, 0, 60, 0.5)" }}>REDQUEEN_X</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "9px", color: "#8a8a8a", marginTop: "2px", fontFamily: "Rajdhani, sans-serif", letterSpacing: "0.15em", fontWeight: 600 }}>
                <span>RANK: <span style={{ color: "#ff003c" }}>RED QUEEN</span></span>
                <span>RAT: 1847</span>
              </div>
            </div>

            {/* HP Bar */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "9px", marginBottom: "4px", color: "#ff003c", fontFamily: "Rajdhani, sans-serif", letterSpacing: "0.15em", fontWeight: 700 }}>
                <span>HP</span>
                <span style={{ color: "#ffffff" }}>{playerHp} / {playerMaxHp}</span>
              </div>
              <div style={{ display: "flex", gap: "2px" }}>
                {Array.from({ length: 18 }).map((_, i) => {
                  const blockVal = (playerMaxHp / 18) * (i + 1);
                  const isActive = playerHp >= blockVal;
                  return (
                    <div
                      key={i}
                      style={{
                        height: "8px",
                        flexGrow: 1,
                        background: isActive ? "#ff003c" : "rgba(17,17,17,0.7)",
                        border: "1px solid rgba(0,0,0,0.6)",
                        boxShadow: isActive ? "0 0 6px rgba(255, 0, 60, 0.6)" : "none"
                      }}
                    />
                  );
                })}
              </div>
            </div>

            {/* Faint technical label */}
            <div style={{ fontSize: "8px", color: "rgba(255,0,60,0.6)", letterSpacing: "0.2em", fontFamily: "Rajdhani, sans-serif", fontWeight: 700, margin: "8px 0" }}>
              // SECURE_LOCK: LOCKED_A
            </div>

            {/* Stats bars */}
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <StatBar label="ATTACK" value={playerStats.attack} max={100} color="#ff003c" />
              <StatBar label="DEFENSE" value={playerStats.defense} max={100} color="#ff003c" />
              <StatBar label="AGILITY" value={playerStats.agility} max={100} color="#ff003c" />
              <StatBar label="INTELLECT" value={playerStats.intellect} max={100} color="#ff003c" />
              <StatBar label="LUCK" value={playerStats.luck} max={100} color="#ff003c" />
            </div>
          </div>

        </div>

        {/* TARGETING SYSTEM CENTER */}
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", alignItems: "center", padding: "10px 0", height: "100%", zIndex: 5 }}>
          
          {/* Target Countdown */}
          <div style={{ textAlign: "center" }}>
            <span style={{ fontSize: "9px", color: "#8a8a8a", letterSpacing: "0.15em", fontFamily: "Rajdhani, sans-serif", fontWeight: 600 }}>ACQUISITION TIME</span>
            <div style={{ fontFamily: "Orbitron, sans-serif", fontSize: "32px", color: "#ff003c", fontWeight: "900", textShadow: "0 0 10px rgba(255, 0, 60, 0.7)", marginTop: "2px" }}>
              00:{countdown.toString().padStart(2, "0")}
            </div>
          </div>

          {/* Concentric Circle Target system */}
          <div style={{ position: "relative", width: "190px", height: "190px", display: "flex", justifyContent: "center", alignItems: "center", margin: "10px 0" }}>
            {/* outer rings */}
            <div style={{ position: "absolute", width: "100%", height: "100%", borderRadius: "50%", border: "1px dashed rgba(255, 0, 60, 0.25)", animation: "spin 40s linear infinite" }} />
            <div style={{ position: "absolute", width: "88%", height: "88%", borderRadius: "50%", border: "1.5px dashed rgba(255, 255, 255, 0.08)", animation: "spin-reverse 20s linear infinite" }} />
            <div style={{ position: "absolute", width: "76%", height: "76%", borderRadius: "50%", border: "1px solid rgba(255, 0, 60, 0.12)" }} />
            
            {/* Crosshair indicators */}
            <div style={{ position: "absolute", width: "120%", height: "1px", background: "linear-gradient(90deg, rgba(255,0,60,0) 0%, rgba(255,0,60,0.15) 50%, rgba(255,0,60,0) 100%)" }} />
            <div style={{ position: "absolute", height: "120%", width: "1px", background: "linear-gradient(180deg, rgba(255,0,60,0) 0%, rgba(255,0,60,0.15) 50%, rgba(255,0,60,0) 100%)" }} />

            {/* Tech metadata details */}
            <div style={{ position: "absolute", top: "15px", left: "-25px", fontSize: "7.5px", color: "rgba(255,0,60,0.5)", fontFamily: "var(--mono)" }}>LOCK: ACQ</div>
            <div style={{ position: "absolute", bottom: "15px", right: "-30px", fontSize: "7.5px", color: "#8a8a8a", fontFamily: "var(--mono)" }}>DIST: 42.1KM</div>
            
            <div style={{ width: "90px", height: "90px", borderRadius: "50%", background: "#050505", border: "2px solid #ff003c", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 5, boxShadow: "0 0 15px rgba(255, 0, 60, 0.5)" }}>
              <span style={{ fontFamily: "Orbitron, sans-serif", fontSize: "32px", color: "#ff003c", fontWeight: "900", textShadow: "0 0 6px #ff003c", letterSpacing: "-0.05em" }}>VS</span>
            </div>
          </div>

          {/* Technical targeting details */}
          <div style={{ textAlign: "center", width: "100%", display: "flex", flexDirection: "column", gap: "6px", fontFamily: "Rajdhani, sans-serif" }}>
            <div>
              <span style={{ fontSize: "9px", color: "#8a8a8a", letterSpacing: "0.15em", fontWeight: 600 }}>ARENA COORDINATE</span>
              <div style={{ fontSize: "12px", fontWeight: "bold", color: "#ffffff", letterSpacing: "0.05em" }}>WASTELAND COLISEUM</div>
            </div>
            
            <div>
              <span style={{ fontSize: "9px", color: "#8a8a8a", letterSpacing: "0.15em", fontWeight: 600 }}>LOCKED ESCROW</span>
              <div style={{ fontSize: "14px", fontWeight: "bold", color: "#ff003c", textShadow: "0 0 8px rgba(255, 0, 60, 0.45)" }}>10 $THREAT</div>
            </div>
          </div>

          {/* Action Trigger */}
          <div style={{ width: "100%", padding: "0 16px" }}>
            {!matchActive ? (
              <button
                onClick={triggerStartMatch}
                style={{
                  width: "100%",
                  background: "#ff003c",
                  border: "none",
                  color: "#ffffff",
                  fontFamily: "Orbitron, sans-serif",
                  fontSize: "11px",
                  fontWeight: "900",
                  padding: "11px",
                  cursor: "pointer",
                  borderRadius: "2px",
                  letterSpacing: "0.15em",
                  boxShadow: "0 0 10px rgba(255, 0, 60, 0.4)"
                }}
                className="hover-glow"
              >
                [ ENGAGE DUEL ]
              </button>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <div style={{ display: "flex", gap: "6px" }}>
                  <div style={{ flex: 1, border: "1px solid rgba(255, 0, 60, 0.15)", background: "rgba(5, 5, 5, 0.8)", padding: "4px", fontSize: "9px", textAlign: "center", fontFamily: "Rajdhani, sans-serif", fontWeight: 700, color: "#ff003c" }}>
                    ATTACK: {selectedAttack || "---"}
                  </div>
                  <div style={{ flex: 1, border: "1px solid rgba(255, 255, 255, 0.1)", background: "rgba(5, 5, 5, 0.8)", padding: "4px", fontSize: "9px", textAlign: "center", fontFamily: "Rajdhani, sans-serif", fontWeight: 700, color: "#ffffff" }}>
                    SHIELD: {selectedDefense || "---"}
                  </div>
                </div>
                {selectedAttack && selectedDefense && (
                  <button
                    onClick={submitTacticalMoves}
                    style={{
                      width: "100%",
                      background: "#ff003c",
                      border: "none",
                      color: "#ffffff",
                      fontFamily: "Orbitron, sans-serif",
                      fontSize: "10px",
                      fontWeight: "900",
                      padding: "8px",
                      cursor: "pointer",
                      borderRadius: "2px",
                      letterSpacing: "0.1em",
                      boxShadow: "0 0 10px rgba(255, 0, 60, 0.45)"
                    }}
                    className="hover-glow"
                  >
                    [ LOCK STRIKES ]
                  </button>
                )}
              </div>
            )}
          </div>

        </div>

        {/* PLAYER B (Right Panel) */}
        <div style={{ display: "flex", gap: "16px", alignItems: "center", height: "100%", justifyContent: "flex-end", position: "relative", padding: "12px" }}>
          
          {/* White Rim Glow Soldier Silhouette standing in the background */}
          <img
            src="/images/soldier_silhouette.png"
            alt="Soldier Silhouette"
            style={{
              position: "absolute",
              top: "10%",
              left: "50%",
              transform: "translateX(-60%)",
              height: "75%",
              width: "auto",
              opacity: 0.65,
              filter: "drop-shadow(0 0 25px rgba(255, 255, 255, 0.25))",
              zIndex: 1,
              pointerEvents: "none"
            }}
          />

          {/* Symmetrical stats layout overlaid on B */}
          <div style={{ flexGrow: 1, display: "flex", flexDirection: "column", justifyContent: "space-between", height: "100%", width: "220px", zIndex: 3 }}>
            <div style={{ textAlign: "right" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "8px" }}>
                <span style={{ fontSize: "16px", fontWeight: "900", fontFamily: "Orbitron, sans-serif", letterSpacing: "0.05em", color: "#ffffff", textShadow: "0 0 10px rgba(255, 255, 255, 0.2)" }}>DESGECEAN</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "9px", color: "#8a8a8a", marginTop: "2px", fontFamily: "Rajdhani, sans-serif", letterSpacing: "0.15em", fontWeight: 600 }}>
                <span>RANK: SURVIVOR</span>
                <span>RAT: 1732</span>
              </div>
            </div>

            {/* HP Bar */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "9px", marginBottom: "4px", color: "#8a8a8a", fontFamily: "Rajdhani, sans-serif", letterSpacing: "0.15em", fontWeight: 700 }}>
                <span>HP</span>
                <span style={{ color: "#ffffff" }}>{opponentHp} / {opponentMaxHp}</span>
              </div>
              <div style={{ display: "flex", gap: "2px" }}>
                {Array.from({ length: 18 }).map((_, i) => {
                  const blockVal = (opponentMaxHp / 18) * (i + 1);
                  const isActive = opponentHp >= blockVal;
                  return (
                    <div
                      key={i}
                      style={{
                        height: "8px",
                        flexGrow: 1,
                        background: isActive ? "#ffffff" : "rgba(17,17,17,0.7)",
                        border: "1px solid rgba(0,0,0,0.6)",
                        boxShadow: isActive ? "0 0 6px rgba(255, 255, 255, 0.4)" : "none"
                      }}
                    />
                  );
                })}
              </div>
            </div>

            {/* Faint technical label */}
            <div style={{ fontSize: "8px", color: "rgba(255,255,255,0.4)", letterSpacing: "0.2em", fontFamily: "Rajdhani, sans-serif", fontWeight: 700, margin: "8px 0", textAlign: "right" }}>
              // SECURE_LOCK: LOCKED_B
            </div>

            {/* Stats bars */}
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <StatBar label="ATTACK" value={opponentStats.attack} max={100} color="#8a8a8a" />
              <StatBar label="DEFENSE" value={opponentStats.defense} max={100} color="#8a8a8a" />
              <StatBar label="AGILITY" value={opponentStats.agility} max={100} color="#8a8a8a" />
              <StatBar label="INTELLECT" value={opponentStats.intellect} max={100} color="#8a8a8a" />
              <StatBar label="LUCK" value={opponentStats.luck} max={100} color="#8a8a8a" />
            </div>
          </div>

          {/* Symmetrical items stacked on B far right */}
          <div style={{ display: "flex", flexDirection: "column", gap: "12px", zIndex: 3 }}>
            <InventorySlot icon={<HelmetIcon />} color="#8a8a8a" />
            <InventorySlot icon={<ArmorIcon />} color="#8a8a8a" />
            <InventorySlot icon={<WeaponIcon />} color="#8a8a8a" />
            <InventorySlot icon={<PantsIcon />} color="#8a8a8a" />
            <InventorySlot icon={<BootsIcon />} color="#8a8a8a" />
          </div>

        </div>

      </main>

      {/* BOTTOM PANEL ROW: Floating HUD with near-invisible borders */}
      <footer style={{ display: "grid", gridTemplateColumns: "1.15fr 1fr 1.15fr", gap: "16px", minHeight: "190px", maxHeight: "210px", position: "relative", zIndex: 20 }}>
        
        {/* Arena Chat Box */}
        <div style={{ background: "rgba(10, 10, 10, 0.85)", border: "1px solid rgba(255, 0, 60, 0.08)", backdropFilter: "blur(12px)", padding: "12px", display: "flex", flexDirection: "column", justifyContent: "space-between", borderRadius: "2px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(255, 0, 60, 0.08)", paddingBottom: "4px", marginBottom: "8px" }}>
            <span style={{ fontSize: "9.5px", color: "#ff003c", fontWeight: "bold", fontFamily: "Rajdhani, sans-serif", letterSpacing: "0.15em" }}>● ARENA CHAT</span>
            <button style={{ background: "none", border: "none", color: "rgba(255,255,255,0.25)", cursor: "pointer", fontSize: "10px" }} className="hover-glow">✕</button>
          </div>
          
          <div style={{ overflowY: "auto", flexGrow: 1, fontSize: "10.5px", display: "flex", flexDirection: "column", gap: "4px", marginBottom: "8px", paddingRight: "4px", fontFamily: "var(--mono), monospace" }}>
            {chatMessages.map((msg, i) => (
              <div key={i} style={{ lineHeight: "1.3" }}>
                <span style={{ color: "rgba(255,255,255,0.25)", marginRight: "6px" }}>[{msg.time}]</span>
                <span style={{ color: msg.color || "#8a8a8a", fontWeight: "bold", marginRight: "6px" }}>{msg.sender}:</span>
                <span style={{ color: "rgba(255,255,255,0.7)" }}>{msg.text}</span>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>

          <form onSubmit={handleSendChat} style={{ display: "flex", border: "1px solid rgba(255,0,60,0.15)", background: "#050505" }}>
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="TYPE TRANSMISSION..."
              style={{ flexGrow: 1, background: "transparent", border: "none", color: "#ffffff", fontFamily: "var(--mono), monospace", fontSize: "9.5px", padding: "5px 8px", outline: "none", textTransform: "uppercase" }}
            />
            <button type="submit" style={{ background: "transparent", border: "none", color: "#ff003c", cursor: "pointer", padding: "0 8px", display: "flex", alignItems: "center" }}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>
            </button>
          </form>
        </div>

        {/* Environmental Mutators Box */}
        <div style={{ background: "rgba(10, 10, 10, 0.85)", border: "1px solid rgba(255, 0, 60, 0.08)", backdropFilter: "blur(12px)", padding: "12px", display: "flex", flexDirection: "column", gap: "6px", borderRadius: "2px" }}>
          <span style={{ fontSize: "9.5px", color: "#8a8a8a", fontWeight: "bold", fontFamily: "Rajdhani, sans-serif", letterSpacing: "0.15em", borderBottom: "1px solid rgba(255, 0, 60, 0.08)", paddingBottom: "4px" }}>ENVIRONMENT MUTATORS</span>
          
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px", flexGrow: 1, minHeight: "0" }}>
            {/* Mutator 1: TOXIC FOG */}
            <div style={{ border: "1px solid rgba(255, 0, 60, 0.08)", background: "rgba(5, 5, 5, 0.5)", padding: "5px 8px", display: "flex", flexDirection: "column", justifyContent: "space-between", borderRadius: "2px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                <span style={{ color: "#ff003c", fontSize: "10px" }}>💀</span>
                <div style={{ fontSize: "9px", fontWeight: "bold", color: "#ffffff", fontFamily: "Rajdhani, sans-serif" }}>TOXIC FOG</div>
              </div>
              <span style={{ fontSize: "9px", color: "#ff003c", fontWeight: "bold", fontFamily: "Rajdhani, sans-serif" }}>-10% HP REGEN</span>
            </div>

            {/* Mutator 2: SCARCE AMMO */}
            <div style={{ border: "1px solid rgba(255, 0, 60, 0.08)", background: "rgba(5, 5, 5, 0.5)", padding: "5px 8px", display: "flex", flexDirection: "column", justifyContent: "space-between", borderRadius: "2px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                <span style={{ color: "#ff003c", fontSize: "10px" }}>🛡️</span>
                <div style={{ fontSize: "9px", fontWeight: "bold", color: "#ffffff", fontFamily: "Rajdhani, sans-serif" }}>SCARCE AMMO</div>
              </div>
              <span style={{ fontSize: "9px", color: "#ff003c", fontWeight: "bold", fontFamily: "Rajdhani, sans-serif" }}>-15% DAMAGE</span>
            </div>

            {/* Mutator 3: ELECTRO SURGE */}
            <div style={{ border: "1px solid rgba(255, 0, 60, 0.08)", background: "rgba(5, 5, 5, 0.5)", padding: "5px 8px", display: "flex", flexDirection: "column", justifyContent: "space-between", borderRadius: "2px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                <span style={{ color: "#ff003c", fontSize: "10px" }}>⚡</span>
                <div style={{ fontSize: "9px", fontWeight: "bold", color: "#ffffff", fontFamily: "Rajdhani, sans-serif" }}>ELECTRO SURGE</div>
              </div>
              <span style={{ fontSize: "9px", color: "#ff003c", fontWeight: "bold", fontFamily: "Rajdhani, sans-serif" }}>+10% AGILITY</span>
            </div>

            {/* Mutator 4: DATA BREACH */}
            <div style={{ border: "1px solid rgba(255, 0, 60, 0.08)", background: "rgba(5, 5, 5, 0.5)", padding: "5px 8px", display: "flex", flexDirection: "column", justifyContent: "space-between", borderRadius: "2px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                <span style={{ color: "#ff003c", fontSize: "10px" }}>🔒</span>
                <div style={{ fontSize: "9px", fontWeight: "bold", color: "#ffffff", fontFamily: "Rajdhani, sans-serif" }}>DATA BREACH</div>
              </div>
              <span style={{ fontSize: "9px", color: "#ff003c", fontWeight: "bold", fontFamily: "Rajdhani, sans-serif" }}>-5% INTELLECT</span>
            </div>
          </div>
        </div>

        {/* Combat Log Box */}
        <div style={{ background: "rgba(10, 10, 10, 0.85)", border: "1px solid rgba(255, 0, 60, 0.08)", backdropFilter: "blur(12px)", padding: "12px", display: "flex", flexDirection: "column", justifyContent: "space-between", borderRadius: "2px" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(255, 0, 60, 0.08)", paddingBottom: "4px", marginBottom: "8px" }}>
            <span style={{ fontSize: "9.5px", color: "#8a8a8a", fontWeight: "bold", fontFamily: "Rajdhani, sans-serif", letterSpacing: "0.15em" }}>BATTLE LOGS</span>
            <button style={{ background: "none", border: "none", color: "rgba(255,255,255,0.25)", cursor: "pointer", fontSize: "10px" }} className="hover-glow">✕</button>
          </div>

          <div style={{ overflowY: "auto", flexGrow: 1, fontSize: "10px", display: "flex", flexDirection: "column", gap: "4px", paddingRight: "4px", marginBottom: "4px", fontFamily: "var(--mono), monospace" }}>
            {battleLogs.map((log, i) => (
              <div key={i} style={{ lineHeight: "1.3" }}>
                <span style={{ color: "rgba(255,255,255,0.25)", marginRight: "6px" }}>[{log.time}]</span>
                <span style={{
                  color: log.color ? log.color :
                         log.sender === "REDQUEEN_X" ? "#00ffcc" : 
                         log.sender === "DESGECEAN" ? "#ff003c" : "rgba(255,255,255,0.55)"
                }}>
                  {log.text}
                </span>
              </div>
            ))}
            <div ref={logEndRef} />
          </div>

          {/* Combat Selection options overlay */}
          {matchActive && !combatOutcome && (
            <div style={{ borderTop: "1px solid rgba(255,0,60,0.15)", paddingTop: "6px", display: "flex", flexDirection: "column", gap: "5px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "9px", color: "#8a8a8a", fontFamily: "Rajdhani, sans-serif", letterSpacing: "0.08em" }}>ATTACK TARGET:</span>
                <div style={{ display: "flex", gap: "3px" }}>
                  {(["HEAD", "TORSO", "ARMS", "LEGS"] as Limb[]).map(l => (
                    <button
                      key={l}
                      onClick={() => setSelectedAttack(l)}
                      style={{
                        background: selectedAttack === l ? "#ff003c" : "#050505",
                        border: `1px solid ${selectedAttack === l ? "#ff003c" : "#1a1a1a"}`,
                        color: "#ffffff",
                        fontSize: "8.5px",
                        fontFamily: "var(--mono), monospace",
                        padding: "2px 4px",
                        cursor: "pointer",
                        borderRadius: "2px"
                      }}
                    >
                      {l}
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span style={{ fontSize: "9px", color: "#8a8a8a", fontFamily: "Rajdhani, sans-serif", letterSpacing: "0.08em" }}>SHIELD SECTOR:</span>
                <div style={{ display: "flex", gap: "3px" }}>
                  {(["HEAD", "TORSO", "ARMS", "LEGS"] as Limb[]).map(l => (
                    <button
                      key={l}
                      onClick={() => setSelectedDefense(l)}
                      style={{
                        background: selectedDefense === l ? "#ffffff" : "#050505",
                        border: `1px solid ${selectedDefense === l ? "#ffffff" : "#1a1a1a"}`,
                        color: selectedDefense === l ? "#050505" : "#ffffff",
                        fontSize: "8.5px",
                        fontFamily: "var(--mono), monospace",
                        padding: "2px 4px",
                        cursor: "pointer",
                        borderRadius: "2px"
                      }}
                    >
                      {l}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>

      </footer>
    </div>
  );
}
