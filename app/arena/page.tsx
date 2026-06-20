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
    <div style={{ display: "flex", flexDirection: "column", gap: "3px", width: "100%" }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", color: color === "#ff0033" ? "rgba(255, 0, 51, 0.7)" : "rgba(255, 255, 255, 0.7)", fontFamily: "var(--mono), monospace", letterSpacing: "0.05em" }}>
        <span>{label}</span>
        <span>{value}</span>
      </div>
      <div style={{ height: "4px", background: "#050505", border: "1px solid #1f1f1f", position: "relative" }}>
        <div style={{ height: "100%", width: `${percentage}%`, background: color, boxShadow: `0 0 6px ${color}88` }} />
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
        width: "48px", 
        height: "48px", 
        border: `1px solid ${color === "#ff0033" ? "rgba(255, 0, 51, 0.2)" : "rgba(255, 255, 255, 0.15)"}`, 
        background: "#080808", 
        display: "flex", 
        justifyContent: "center", 
        alignItems: "center", 
        position: "relative",
        boxShadow: `inset 0 0 6px rgba(0,0,0,0.8)`
      }} 
      className="inventory-slot"
    >
      <div style={{ color: color, opacity: 0.85 }}>{icon}</div>
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
    { time: "22:51", sender: "REDQUEEN_X", text: "Let's see if you can keep up.", color: "#ff0033" },
    { time: "22:51", sender: "DESGECEAN", text: "Always ready." },
    { time: "22:52", sender: "REDQUEEN_X", text: "No mercy.", color: "#ff0033" },
    { time: "22:52", sender: "DESGECEAN", text: "Bring it." },
    { time: "22:52", sender: "SYSTEM", text: "Match found. Preparing arena...", color: "#ff0033" }
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
      color: "#ff0033"
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
        newLogs.push({ time: timeStr, sender: "DESGECEAN", text: `💥 CRITICAL HAWKEYE! Struck your [${opponentAttack}] for ${oppDmg} damage.`, color: "#ff0033" });
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
      newLogs.push({ time: timeStr, sender: "SYSTEM", text: "💀 MATCH CONCLUDED: Mutual destruction.", color: "#ff0033" });
    } else if (oppHp <= 0) {
      setCombatOutcome("win");
      setMatchActive(false);
      newLogs.push({ time: timeStr, sender: "SYSTEM", text: "🏆 VICTORY! Opponent eliminated. +10 $THREAT locked.", color: "#00ffcc" });
    } else if (plyHp <= 0) {
      setCombatOutcome("lose");
      setMatchActive(false);
      newLogs.push({ time: timeStr, sender: "SYSTEM", text: "❌ DEFEAT: Mainframe shut down. Lost 10 $THREAT.", color: "#ff0033" });
    }

    setBattleLogs(prev => [...prev, ...newLogs]);
    setSelectedAttack(null);
    setSelectedDefense(null);
  };

  // SVGs for equipment slots
  const HelmetIcon = () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M12 2C6.5 2 2 6.5 2 12c0 3 .5 5.5 2.5 7.5L6 18c1.5-1.5 2.5-3.5 2.5-5.5V11h7v1.5c0 2 1 4 2.5 5.5l1.5 1.5c2-2 2.5-4.5 2.5-7.5 0-5.5-4.5-10-10-10z" />
      <path d="M9 11c0-1.5 1-3 3-3s3 1.5 3 3" />
      <circle cx="9" cy="13" r="1" fill="currentColor" />
      <circle cx="15" cy="13" r="1" fill="currentColor" />
    </svg>
  );

  const ArmorIcon = () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M12 2L4 5v7c0 5.25 3.42 10.15 8 11.5 4.58-1.35 8-6.25 8-11.5V5l-8-3z" />
      <path d="M9 7h6v3H9z" />
      <path d="M8 12h8v3H8z" />
    </svg>
  );

  const WeaponIcon = () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M14.5 17.5L3 6V3h3l11.5 11.5" />
      <path d="M13 19l2 2m4-4l2 2" />
      <path d="M19 5l-3 3 1.5 1.5 3-3z" />
    </svg>
  );

  const PantsIcon = () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M6 2h12v7l-2 8H8l-2-8V2z" />
      <path d="M10 2v15M14 2v15" />
      <path d="M6 9h12" />
    </svg>
  );

  const BootsIcon = () => (
    <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M4 16v-2a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v2l-3 4H7l-3-4z" />
      <path d="M8 10V6a2 2 0 0 1 4 0v4M12 10V6a2 2 0 0 1 4 0v4" />
    </svg>
  );

  return (
    <div style={{ background: "#050505", minHeight: "100vh", color: "#ffffff", fontFamily: "var(--mono), monospace", padding: "16px", position: "relative", boxSizing: "border-box" }}>
      {/* Background CRT Scanlines overlay */}
      <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", background: "linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.06), rgba(0, 255, 0, 0.02), rgba(0, 0, 255, 0.06))", backgroundSize: "100% 4px, 6px 100%", zIndex: 10, pointerEvents: "none", opacity: 0.35 }} />

      {/* Screen Frame Border */}
      <div style={{ position: "absolute", top: "8px", left: "8px", right: "8px", bottom: "8px", border: "1px solid rgba(255, 0, 51, 0.2)", pointerEvents: "none", zIndex: 5 }} />

      {/* Main Container */}
      <div style={{ maxWidth: "1280px", margin: "0 auto", position: "relative", zIndex: 6, display: "flex", flexDirection: "column", gap: "16px", height: "calc(100vh - 32px)", justifyContent: "space-between" }}>
        
        {/* Navigation / Header Bar */}
        <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(255, 0, 51, 0.3)", paddingBottom: "10px", marginTop: "4px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
            <span style={{ color: "#ff0033", fontWeight: "bold", fontSize: "16px", fontFamily: "var(--title-font)", textShadow: "0 0 6px rgba(255, 0, 51, 0.5)", letterSpacing: "0.08em" }}>
              &gt; P2P ARENA &nbsp; /// &nbsp; 1v1 DUEL &nbsp; ///
            </span>
            <div style={{ display: "flex", gap: "10px", fontSize: "11px" }}>
              <Link href="/solvivors" style={{ color: "rgba(255, 255, 255, 0.4)", textDecoration: "none" }} className="hover-glow">[ HUB ]</Link>
              <Link href="/bunker" style={{ color: "rgba(255, 255, 255, 0.4)", textDecoration: "none" }} className="hover-glow">[ BUNKER ]</Link>
            </div>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "12px", fontSize: "11px", color: "rgba(255,255,255,0.5)", fontFamily: "var(--mono)" }}>
            <span>SEASON 1</span>
            <span style={{ color: "#ff0033" }}>●</span>
            <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>RANKED MATCH <span style={{ color: "#ff0033" }}>✭</span></span>
          </div>
        </header>

        {/* 1v1 Duel Layout Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1.1fr 1.2fr 1.1fr", gap: "24px", flexGrow: 1, alignItems: "stretch", minHeight: "0" }}>
          
          {/* LEFT COMMANDER: REDQUEEN_X */}
          <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
            {/* Inventory Slots on Left */}
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <InventorySlot icon={<HelmetIcon />} color="#ff0033" />
              <InventorySlot icon={<ArmorIcon />} color="#ff0033" />
              <InventorySlot icon={<WeaponIcon />} color="#ff0033" />
              <InventorySlot icon={<PantsIcon />} color="#ff0033" />
              <InventorySlot icon={<BootsIcon />} color="#ff0033" />
            </div>

            {/* Profile Panel & Silhouette */}
            <div style={{ flexGrow: 1, display: "flex", flexDirection: "column", gap: "10px", height: "100%", justifyContent: "center" }}>
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#ff0033" }}>
                    <span style={{ fontSize: "11px", color: "#ff0033" }}>🛡️</span>
                    <span style={{ fontSize: "18px", fontWeight: "900", letterSpacing: "0.05em", textShadow: "0 0 8px rgba(255,0,51,0.5)" }}>REDQUEEN_X</span>
                    <span style={{ fontSize: "10px" }}>★</span>
                  </div>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", color: "rgba(255,255,255,0.4)", marginTop: "2px", fontFamily: "var(--mono)" }}>
                  <span>RANK: <span style={{ color: "#ff0033" }}>RED QUEEN</span></span>
                  <span>RATING: 1847</span>
                </div>
              </div>

              {/* HP Bar */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", marginBottom: "4px", color: "#ff0033" }}>
                  <span>HP</span>
                  <span>{playerHp} / {playerMaxHp}</span>
                </div>
                <div style={{ display: "flex", gap: "3px" }}>
                  {Array.from({ length: 15 }).map((_, i) => {
                    const blockVal = (playerMaxHp / 15) * (i + 1);
                    const isActive = playerHp >= blockVal;
                    return (
                      <div
                        key={i}
                        style={{
                          height: "10px",
                          flexGrow: 1,
                          background: isActive ? "#ff0033" : "#0d0a0a",
                          border: "1px solid #140808",
                          boxShadow: isActive ? "0 0 6px rgba(255, 0, 51, 0.6)" : "none"
                        }}
                      />
                    );
                  })}
                </div>
              </div>

              {/* Silhouette Container */}
              <div style={{ flexGrow: 1, minHeight: "220px", maxHeight: "300px", background: "radial-gradient(circle at center, rgba(255,0,51,0.15) 0%, rgba(0,0,0,0) 80%)", border: "1px solid rgba(255,0,51,0.15)", display: "flex", justifyContent: "center", alignItems: "center", position: "relative", overflow: "hidden" }}>
                <img
                  src="/images/redqueen_silhouette.png"
                  alt="Red Queen Silhouette"
                  style={{ height: "92%", width: "auto", filter: "drop-shadow(0 0 10px rgba(255,0,51,0.45))", objectFit: "contain" }}
                />
                <div style={{ position: "absolute", bottom: "8px", left: "10px", fontSize: "9px", color: "rgba(255,0,51,0.8)", letterSpacing: "0.05em" }}>// ACTIVE INTEGRITY</div>
              </div>

              {/* Stats graphs */}
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <StatBar label="ATTACK" value={playerStats.attack} max={100} color="#ff0033" />
                <StatBar label="DEFENSE" value={playerStats.defense} max={100} color="#ff0033" />
                <StatBar label="AGILITY" value={playerStats.agility} max={100} color="#ff0033" />
                <StatBar label="INTELLECT" value={playerStats.intellect} max={100} color="#ff0033" />
                <StatBar label="LUCK" value={playerStats.luck} max={100} color="#ff0033" />
              </div>
            </div>
          </div>

          {/* CENTER PANEL: ARENA & BATTLE CONTROL */}
          <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", alignItems: "center", padding: "10px 0" }}>
            
            {/* Top countdown */}
            <div style={{ textAlign: "center", marginTop: "4px" }}>
              <span style={{ fontSize: "10px", color: "rgba(255,255,255,0.4)", letterSpacing: "0.1em" }}>MATCH STARTS IN</span>
              <div style={{ fontFamily: "var(--title-font)", fontSize: "40px", color: "#ff0033", fontWeight: "900", textShadow: "0 0 10px rgba(255,0,51,0.6)", marginTop: "2px" }}>
                00:{countdown.toString().padStart(2, "0")}
              </div>
            </div>

            {/* Circular VS logo */}
            <div style={{ position: "relative", width: "190px", height: "190px", display: "flex", justifyContent: "center", alignItems: "center" }}>
              {/* Spinning tech wheels */}
              <div style={{ position: "absolute", width: "100%", height: "100%", borderRadius: "50%", border: "2px dashed rgba(255,0,51,0.15)", animation: "spin 25s linear infinite" }} />
              <div style={{ position: "absolute", width: "84%", height: "84%", borderRadius: "50%", border: "1px dashed rgba(255,255,255,0.1)", animation: "spin-reverse 15s linear infinite" }} />
              
              <div style={{ width: "100px", height: "100px", borderRadius: "50%", background: "#050505", border: "2px solid #ff0033", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 5, boxShadow: "0 0 25px rgba(255,0,51,0.3)" }}>
                <span style={{ fontFamily: "var(--title-font)", fontSize: "36px", color: "#ff0033", fontWeight: "900", textShadow: "0 0 6px #ff0033" }}>VS</span>
              </div>
            </div>

            {/* Match details HUD */}
            <div style={{ textAlign: "center", width: "100%", display: "flex", flexDirection: "column", gap: "10px" }}>
              <div>
                <span style={{ fontSize: "9px", color: "rgba(255,255,255,0.4)", letterSpacing: "0.1em" }}>ARENA</span>
                <div style={{ fontSize: "14px", fontWeight: "bold", color: "#ffffff", letterSpacing: "0.05em" }}>WASTELAND COLISEUM</div>
              </div>
              
              <div>
                <span style={{ fontSize: "9px", color: "rgba(255,255,255,0.4)", letterSpacing: "0.1em" }}>BET</span>
                <div style={{ fontSize: "15px", fontWeight: "bold", color: "#f0c929", textShadow: "0 0 6px rgba(240,201,41,0.3)" }}>10 THREAT</div>
              </div>
              
              <div>
                <span style={{ fontSize: "9px", color: "rgba(255,255,255,0.4)", letterSpacing: "0.1em" }}>MATCH TYPE</span>
                <div style={{ fontSize: "11px", color: "rgba(255,255,255,0.7)" }}>RANKED 1v1</div>
              </div>
            </div>

            {/* Action launcher */}
            <div style={{ width: "100%", padding: "0 16px" }}>
              {!matchActive ? (
                <button
                  onClick={triggerStartMatch}
                  style={{
                    width: "100%",
                    background: "#ff0033",
                    border: "none",
                    color: "#ffffff",
                    fontFamily: "var(--mono)",
                    fontSize: "12px",
                    fontWeight: "bold",
                    padding: "12px",
                    cursor: "pointer",
                    boxShadow: "0 0 10px rgba(255,0,51,0.4)"
                  }}
                  className="hover-glow"
                >
                  [ INITIATE 1v1 ENCOUNTER ]
                </button>
              ) : (
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  <div style={{ fontSize: "10px", color: "rgba(255,255,255,0.4)", textAlign: "center" }}>TARGET INPUT CHOSEN:</div>
                  <div style={{ display: "flex", gap: "6px" }}>
                    <div style={{ flex: 1, border: "1px solid #ff0033", background: "rgba(255,0,51,0.05)", padding: "5px", fontSize: "10px", textAlign: "center" }}>
                      ATTACK: {selectedAttack || "..."}
                    </div>
                    <div style={{ flex: 1, border: "1px solid #00ffcc", background: "rgba(0,255,204,0.05)", padding: "5px", fontSize: "10px", textAlign: "center" }}>
                      SHIELD: {selectedDefense || "..."}
                    </div>
                  </div>
                  {selectedAttack && selectedDefense && (
                    <button
                      onClick={submitTacticalMoves}
                      style={{
                        width: "100%",
                        background: "#ff0033",
                        border: "none",
                        color: "#ffffff",
                        fontFamily: "var(--mono)",
                        fontSize: "11px",
                        fontWeight: "bold",
                        padding: "10px",
                        cursor: "pointer",
                        boxShadow: "0 0 8px rgba(255,0,51,0.3)"
                      }}
                      className="hover-glow"
                    >
                      [ SUBMIT TACTICAL MOVE ]
                    </button>
                  )}
                </div>
              )}
            </div>

          </div>

          {/* RIGHT COMMANDER: DESGECEAN */}
          <div style={{ display: "flex", gap: "16px", alignItems: "center" }}>
            {/* Profile Panel & Silhouette */}
            <div style={{ flexGrow: 1, display: "flex", flexDirection: "column", gap: "10px", height: "100%", justifyContent: "center" }}>
              <div style={{ textAlign: "right" }}>
                <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "8px", color: "#a6a6a6" }}>
                  <span style={{ fontSize: "10px" }}>☼</span>
                  <span style={{ fontSize: "18px", fontWeight: "900", letterSpacing: "0.05em", color: "#ffffff", textShadow: "0 0 8px rgba(255,255,255,0.2)" }}>DESGECEAN</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", color: "rgba(255,255,255,0.4)", marginTop: "2px", fontFamily: "var(--mono)" }}>
                  <span>RANK: SURVIVOR</span>
                  <span>RATING: 1732</span>
                </div>
              </div>

              {/* HP Bar */}
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", marginBottom: "4px", color: "rgba(255,255,255,0.7)" }}>
                  <span>HP</span>
                  <span>{opponentHp} / {opponentMaxHp}</span>
                </div>
                <div style={{ display: "flex", gap: "3px" }}>
                  {Array.from({ length: 15 }).map((_, i) => {
                    const blockVal = (opponentMaxHp / 15) * (i + 1);
                    const isActive = opponentHp >= blockVal;
                    return (
                      <div
                        key={i}
                        style={{
                          height: "10px",
                          flexGrow: 1,
                          background: isActive ? "#ffffff" : "#0a0a0a",
                          border: "1px solid #141414",
                          boxShadow: isActive ? "0 0 6px rgba(255, 255, 255, 0.4)" : "none"
                        }}
                      />
                    );
                  })}
                </div>
              </div>

              {/* Silhouette Container */}
              <div style={{ flexGrow: 1, minHeight: "220px", maxHeight: "300px", background: "radial-gradient(circle at center, rgba(255,255,255,0.06) 0%, rgba(0,0,0,0) 80%)", border: "1px solid rgba(255,255,255,0.1)", display: "flex", justifyContent: "center", alignItems: "center", position: "relative", overflow: "hidden" }}>
                <img
                  src="/images/soldier_silhouette.png"
                  alt="Soldier Silhouette"
                  style={{ height: "92%", width: "auto", filter: "brightness(0.9) drop-shadow(0 0 10px rgba(255,255,255,0.15))", objectFit: "contain" }}
                />
                <div style={{ position: "absolute", bottom: "8px", right: "10px", fontSize: "9px", color: "rgba(255,255,255,0.4)", letterSpacing: "0.05em" }}>// THREAT ALIGNED</div>
              </div>

              {/* Stats graphs */}
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <StatBar label="ATTACK" value={opponentStats.attack} max={100} color="#a6a6a6" />
                <StatBar label="DEFENSE" value={opponentStats.defense} max={100} color="#a6a6a6" />
                <StatBar label="AGILITY" value={opponentStats.agility} max={100} color="#a6a6a6" />
                <StatBar label="INTELLECT" value={opponentStats.intellect} max={100} color="#a6a6a6" />
                <StatBar label="LUCK" value={opponentStats.luck} max={100} color="#a6a6a6" />
              </div>
            </div>

            {/* Inventory Slots on Right */}
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <InventorySlot icon={<HelmetIcon />} color="#a6a6a6" />
              <InventorySlot icon={<ArmorIcon />} color="#a6a6a6" />
              <InventorySlot icon={<WeaponIcon />} color="#a6a6a6" />
              <InventorySlot icon={<PantsIcon />} color="#a6a6a6" />
              <InventorySlot icon={<BootsIcon />} color="#a6a6a6" />
            </div>
          </div>

        </div>

        {/* BOTTOM HUD SECTION: CHAT, MUTATORS, LOG */}
        <div style={{ display: "grid", gridTemplateColumns: "1.15fr 1fr 1.15fr", gap: "20px", minHeight: "220px", maxHeight: "240px", marginBottom: "4px" }}>
          
          {/* Bottom Left: Arena Chat */}
          <div style={{ border: "1px solid rgba(255, 0, 51, 0.25)", background: "#060606", padding: "12px", display: "flex", flexDirection: "column", justifyContent: "space-between", position: "relative" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(255, 0, 51, 0.15)", paddingBottom: "6px", marginBottom: "8px" }}>
              <span style={{ fontSize: "11px", color: "#ff0033", fontWeight: "bold", letterSpacing: "0.05em" }}>● ARENA CHAT</span>
              <button style={{ background: "none", border: "none", color: "rgba(255,255,255,0.3)", cursor: "pointer", fontSize: "11px", padding: 0 }} className="hover-glow">✕</button>
            </div>
            
            <div style={{ overflowY: "auto", flexGrow: 1, fontSize: "11px", display: "flex", flexDirection: "column", gap: "5px", marginBottom: "8px", paddingRight: "4px" }}>
              {chatMessages.map((msg, i) => (
                <div key={i} style={{ lineHeight: "1.4" }}>
                  <span style={{ color: "rgba(255,255,255,0.25)", marginRight: "6px", fontFamily: "var(--mono)" }}>[{msg.time}]</span>
                  <span style={{ color: msg.color || "#a6a6a6", fontWeight: "bold", marginRight: "6px" }}>{msg.sender}:</span>
                  <span style={{ color: "rgba(255,255,255,0.8)" }}>{msg.text}</span>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>

            <form onSubmit={handleSendChat} style={{ display: "flex", border: "1px solid #1a1a1a", background: "#030303" }}>
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="Type your message..."
                style={{ flexGrow: 1, background: "transparent", border: "none", color: "#ffffff", fontFamily: "var(--mono)", fontSize: "11px", padding: "6px 8px", outline: "none" }}
              />
              <button
                type="submit"
                style={{ background: "transparent", border: "none", color: "#ff0033", cursor: "pointer", padding: "0 8px", display: "flex", alignItems: "center" }}
              >
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><line x1="22" y1="2" x2="11" y2="13" /><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>
              </button>
            </form>
          </div>

          {/* Bottom Center: Mutators Panel */}
          <div style={{ border: "1px solid rgba(255, 0, 51, 0.25)", background: "#060606", padding: "12px", display: "flex", flexDirection: "column", gap: "8px" }}>
            <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.5)", fontWeight: "bold", borderBottom: "1px solid rgba(255, 0, 51, 0.15)", paddingBottom: "6px" }}>MUTATORS</span>
            
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px", flexGrow: 1, minHeight: "0" }}>
              {/* Mutator 1: TOXIC FOG */}
              <div style={{ border: "1px solid rgba(255, 0, 51, 0.2)", background: "rgba(255, 0, 51, 0.02)", padding: "6px 8px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <span style={{ color: "#ff0033", fontSize: "12px" }}>💀</span>
                  <div style={{ fontSize: "9.5px", fontWeight: "bold", color: "#ff0033", letterSpacing: "0.05em" }}>TOXIC FOG</div>
                </div>
                <span style={{ fontSize: "9px", color: "rgba(255, 0, 51, 0.8)", fontWeight: "bold" }}>-10% HP REGEN</span>
              </div>

              {/* Mutator 2: SCARCE AMMO */}
              <div style={{ border: "1px solid rgba(255, 0, 51, 0.2)", background: "rgba(255, 0, 51, 0.02)", padding: "6px 8px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <span style={{ color: "#ff0033", fontSize: "12px" }}>⚡</span>
                  <div style={{ fontSize: "9.5px", fontWeight: "bold", color: "#ff0033", letterSpacing: "0.05em" }}>SCARCE AMMO</div>
                </div>
                <span style={{ fontSize: "9px", color: "rgba(255, 0, 51, 0.8)", fontWeight: "bold" }}>-15% DAMAGE</span>
              </div>

              {/* Mutator 3: ELECTRO SURGE */}
              <div style={{ border: "1px solid rgba(255, 0, 51, 0.2)", background: "rgba(255, 0, 51, 0.02)", padding: "6px 8px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <span style={{ color: "#ff0033", fontSize: "12px" }}>⚡</span>
                  <div style={{ fontSize: "9.5px", fontWeight: "bold", color: "#ff0033", letterSpacing: "0.05em" }}>ELECTRO SURGE</div>
                </div>
                <span style={{ fontSize: "9px", color: "rgba(255, 0, 51, 0.8)", fontWeight: "bold" }}>+10% AGILITY</span>
              </div>

              {/* Mutator 4: DATA BREACH */}
              <div style={{ border: "1px solid rgba(255, 0, 51, 0.2)", background: "rgba(255, 0, 51, 0.02)", padding: "6px 8px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                  <span style={{ color: "#ff0033", fontSize: "12px" }}>🔒</span>
                  <div style={{ fontSize: "9.5px", fontWeight: "bold", color: "#ff0033", letterSpacing: "0.05em" }}>DATA BREACH</div>
                </div>
                <span style={{ fontSize: "9px", color: "rgba(255, 0, 51, 0.8)", fontWeight: "bold" }}>-5% INTELLECT</span>
              </div>
            </div>
          </div>

          {/* Bottom Right: Battle Log */}
          <div style={{ border: "1px solid rgba(255, 0, 51, 0.25)", background: "#060606", padding: "12px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(255, 0, 51, 0.15)", paddingBottom: "6px", marginBottom: "8px" }}>
              <span style={{ fontSize: "11px", color: "rgba(255,255,255,0.5)", fontWeight: "bold" }}>BATTLE LOG</span>
              <button style={{ background: "none", border: "none", color: "rgba(255,255,255,0.3)", cursor: "pointer", fontSize: "11px", padding: 0 }} className="hover-glow">✕</button>
            </div>

            <div style={{ overflowY: "auto", flexGrow: 1, fontSize: "10.5px", display: "flex", flexDirection: "column", gap: "5px", paddingRight: "4px", marginBottom: "4px" }}>
              {battleLogs.map((log, i) => (
                <div key={i} style={{ lineHeight: "1.3" }}>
                  <span style={{ color: "rgba(255,255,255,0.25)", marginRight: "6px" }}>[{log.time}]</span>
                  <span style={{
                    color: log.color ? log.color :
                           log.sender === "REDQUEEN_X" ? "#00ffcc" : 
                           log.sender === "DESGECEAN" ? "#ff0033" : "rgba(255,255,255,0.55)"
                  }}>
                    {log.text}
                  </span>
                </div>
              ))}
              <div ref={logEndRef} />
            </div>

            {/* Combat Selection overlay when match is active */}
            {matchActive && !combatOutcome && (
              <div style={{ borderTop: "1px solid #1a1a1a", paddingTop: "6px", display: "flex", flexDirection: "column", gap: "5px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "9.5px", color: "rgba(255,255,255,0.4)" }}>SELECT ATTACK:</span>
                  <div style={{ display: "flex", gap: "4px" }}>
                    {(["HEAD", "TORSO", "ARMS", "LEGS"] as Limb[]).map(l => (
                      <button
                        key={l}
                        onClick={() => setSelectedAttack(l)}
                        style={{
                          background: selectedAttack === l ? "#ff0033" : "#030303",
                          border: `1px solid ${selectedAttack === l ? "#ff0033" : "#1f1f1f"}`,
                          color: "#ffffff",
                          fontSize: "8.5px",
                          fontFamily: "var(--mono)",
                          padding: "2px 5px",
                          cursor: "pointer"
                        }}
                      >
                        {l}
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span style={{ fontSize: "9.5px", color: "rgba(255,255,255,0.4)" }}>SELECT SHIELD:</span>
                  <div style={{ display: "flex", gap: "4px" }}>
                    {(["HEAD", "TORSO", "ARMS", "LEGS"] as Limb[]).map(l => (
                      <button
                        key={l}
                        onClick={() => setSelectedDefense(l)}
                        style={{
                          background: selectedDefense === l ? "#00ffcc" : "#030303",
                          border: `1px solid ${selectedDefense === l ? "#00ffcc" : "#1f1f1f"}`,
                          color: selectedDefense === l ? "#050505" : "#ffffff",
                          fontSize: "8.5px",
                          fontFamily: "var(--mono)",
                          padding: "2px 5px",
                          cursor: "pointer"
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

        </div>

      </div>

      {/* Embedded CSS Animations */}
      <style jsx global>{`
        @keyframes spin { 
          0% { transform: rotate(0deg); } 
          100% { transform: rotate(360deg); } 
        }
        @keyframes spin-reverse { 
          0% { transform: rotate(360deg); } 
          100% { transform: rotate(0deg); } 
        }
        .hover-glow:hover {
          color: #ff0033 !important;
          text-shadow: 0 0 6px rgba(255,0,51,0.6);
        }
      `}</style>
    </div>
  );
}
