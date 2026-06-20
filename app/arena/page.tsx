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
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: color === "#ff003c" ? "#ff003c" : "#8a8a8a", fontFamily: "Rajdhani, sans-serif", letterSpacing: "0.15em", textTransform: "uppercase", fontWeight: 700 }}>
        <span>{label}</span>
        <span style={{ color: "#ffffff", fontWeight: 700 }}>{value}</span>
      </div>
      <div style={{ height: "4px", background: "rgba(17,17,17,0.6)", border: "1px solid rgba(255,255,255,0.05)", position: "relative" }}>
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
        width: "50px", 
        height: "50px", 
        border: `1px solid ${color === "#ff003c" ? "rgba(255, 0, 60, 0.25)" : "rgba(255, 255, 255, 0.15)"}`, 
        background: "rgba(5, 5, 5, 0.88)", 
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
      <div style={{ color: color, opacity: 0.85 }}>{icon}</div>
    </div>
  );
}

interface MannequinProps {
  type: "ATTACK" | "DEFENSE";
  selectedLimb: Limb | null;
  onSelectLimb: (limb: Limb) => void;
  accentColor: string;
}

function TargetingMannequin({ type, selectedLimb, onSelectLimb, accentColor }: MannequinProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: "6px", zIndex: 5, position: "relative", width: "100%" }}>
      <span style={{ fontSize: "11px", color: accentColor, fontWeight: "bold", letterSpacing: "0.15em", fontFamily: "Orbitron, sans-serif" }}>
        {type === "ATTACK" ? "STRIKE TARGET" : "SHIELD SECTOR"}
      </span>
      <div style={{ width: "90px", height: "130px", background: "rgba(5,5,5,0.75)", border: `1px solid ${accentColor}33`, padding: "8px", position: "relative" }}>
        <svg width="80" height="110" viewBox="0 0 80 120" style={{ display: "block", margin: "auto" }}>
          {/* Head block */}
          <circle
            cx="40"
            cy="20"
            r="10"
            fill={selectedLimb === "HEAD" ? accentColor : "transparent"}
            stroke={accentColor}
            strokeWidth="2"
            style={{ cursor: "pointer", transition: "all 0.15s" }}
            onClick={() => onSelectLimb("HEAD")}
          />
          {/* Neck line */}
          <line x1="40" y1="30" x2="40" y2="36" stroke={accentColor} strokeWidth="2" />
          
          {/* Torso block */}
          <rect
            x="25"
            y="36"
            width="30"
            height="40"
            rx="1"
            fill={selectedLimb === "TORSO" ? accentColor : "transparent"}
            stroke={accentColor}
            strokeWidth="2"
            style={{ cursor: "pointer", transition: "all 0.15s" }}
            onClick={() => onSelectLimb("TORSO")}
          />
          {/* Left Arm block */}
          <rect
            x="11"
            y="38"
            width="10"
            height="34"
            rx="1"
            fill={selectedLimb === "ARMS" ? accentColor : "transparent"}
            stroke={accentColor}
            strokeWidth="2"
            style={{ cursor: "pointer", transition: "all 0.15s" }}
            onClick={() => onSelectLimb("ARMS")}
          />
          {/* Right Arm block */}
          <rect
            x="59"
            y="38"
            width="10"
            height="34"
            rx="1"
            fill={selectedLimb === "ARMS" ? accentColor : "transparent"}
            stroke={accentColor}
            strokeWidth="2"
            style={{ cursor: "pointer", transition: "all 0.15s" }}
            onClick={() => onSelectLimb("ARMS")}
          />
          {/* Left Leg block */}
          <rect
            x="26"
            y="80"
            width="12"
            height="36"
            rx="1"
            fill={selectedLimb === "LEGS" ? accentColor : "transparent"}
            stroke={accentColor}
            strokeWidth="2"
            style={{ cursor: "pointer", transition: "all 0.15s" }}
            onClick={() => onSelectLimb("LEGS")}
          />
          {/* Right Leg block */}
          <rect
            x="42"
            y="80"
            width="12"
            height="36"
            rx="1"
            fill={selectedLimb === "LEGS" ? accentColor : "transparent"}
            stroke={accentColor}
            strokeWidth="2"
            style={{ cursor: "pointer", transition: "all 0.15s" }}
            onClick={() => onSelectLimb("LEGS")}
          />
        </svg>
      </div>
      <span style={{ fontSize: "11px", fontFamily: "monospace", color: "#ffffff", fontWeight: "bold" }}>
        {selectedLimb || "NOT LOCKED"}
      </span>
    </div>
  );
}

const SEED_CHAT_MESSAGES: Message[] = [
  { time: "22:51", sender: "REDQUEEN_X", text: "LET'S SEE IF YOU CAN KEEP UP.", color: "#ff003c" },
  { time: "22:51", sender: "DESGECEAN", text: "ALWAYS READY." },
  { time: "22:52", sender: "REDQUEEN_X", text: "NO MERCY.", color: "#ff003c" },
  { time: "22:52", sender: "DESGECEAN", text: "BRING IT." },
  { time: "22:52", sender: "SYSTEM", text: "MATCH FOUND. PREPARING ARENA...", color: "#ff003c" }
];

export default function ArenaPage() {
  const { authIdentifier } = useAuth();
  const { publicKey } = useWallet();
  const wallet = authIdentifier || (publicKey ? publicKey.toString() : null);

  // Profile metadata loading
  const [profileName, setProfileName] = useState<string>("RED QUEEN ADMIN");

  // Combat States
  const [matchActive, setMatchActive] = useState<boolean>(false);
  const [countdown, setCountdown] = useState<number>(10);
  const [playerHp, setPlayerHp] = useState<number>(174);
  const [playerMaxHp] = useState<number>(174);
  const [opponentHp, setOpponentHp] = useState<number>(154);
  const [opponentMaxHp] = useState<number>(183);

  // Custom Wager
  const [threatWager, setThreatWager] = useState<number>(10);

  // Status effects
  const [playerStatus, setPlayerStatus] = useState<string[]>([]);
  const [opponentStatus, setOpponentStatus] = useState<string[]>([]);

  // Mutator active toggles
  const [toxicFogActive, setToxicFogActive] = useState<boolean>(true);
  const [scarceAmmoActive, setScarceAmmoActive] = useState<boolean>(true);
  const [electroSurgeActive, setElectroSurgeActive] = useState<boolean>(true);
  const [dataBreachActive, setDataBreachActive] = useState<boolean>(true);

  // Stats
  const playerStats = { attack: 68, defense: 42, agility: 57, intellect: 71, luck: 33 };
  const opponentStats = { attack: 64, defense: 49, agility: 52, intellect: 63, luck: 27 };

  // Limb Selections
  const [selectedAttack, setSelectedAttack] = useState<Limb | null>(null);
  const [selectedDefense, setSelectedDefense] = useState<Limb | null>(null);

  // Screen shake impact animation trigger
  const [shakeTrigger, setShakeTrigger] = useState<boolean>(false);

  // Chat States
  const [chatMessages, setChatMessages] = useState<Message[]>([]);
  const [chatInput, setChatInput] = useState<string>("");

  // Battle Log States
  const [battleLogs, setBattleLogs] = useState<Message[]>([
    { time: "22:48", sender: "SYSTEM", text: "DESGECEAN JOINED THE ARENA" },
    { time: "22:48", sender: "SYSTEM", text: "REDQUEEN_X JOINED THE ARENA" },
    { time: "22:48", sender: "SYSTEM", text: "BET LOCKED: 10 THREAT" },
    { time: "22:48", sender: "SYSTEM", text: "MATCH TYPE: RANKED 1V1" },
    { time: "22:49", sender: "SYSTEM", text: "ARENA: WASTELAND COLISEUM" },
    { time: "22:49", sender: "SYSTEM", text: "PREPARING COMBAT PROTOCOLS..." }
  ]);

  const [combatOutcome, setCombatOutcome] = useState<"win" | "lose" | null>(null);

  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const logEndRef = useRef<HTMLDivElement | null>(null);

  // Load profile name on mount
  useEffect(() => {
    if (!wallet) {
      setProfileName("RED QUEEN ADMIN");
      return;
    }
    const fetchProfile = async () => {
      try {
        const res = await fetch(`/api/profile?wallet=${wallet}`);
        const data = await res.json();
        if (data && data.profile) {
          const name = data.profile.apocalyptic_name || data.profile.apoptotic_name || `OPERATIVE_${wallet.slice(0, 6)}`;
          setProfileName(name.toUpperCase());
        } else {
          setProfileName(`OPERATIVE_${wallet.slice(0, 6)}`.toUpperCase());
        }
      } catch (err) {
        setProfileName(`OPERATIVE_${wallet.slice(0, 6)}`.toUpperCase());
      }
    };
    fetchProfile();
  }, [wallet]);

  // Load persistent chat from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      const cachedChat = localStorage.getItem("redqueen_arena_fighter_chat");
      if (cachedChat) {
        try {
          setChatMessages(JSON.parse(cachedChat));
        } catch {
          setChatMessages(SEED_CHAT_MESSAGES);
        }
      } else {
        setChatMessages(SEED_CHAT_MESSAGES);
        localStorage.setItem("redqueen_arena_fighter_chat", JSON.stringify(SEED_CHAT_MESSAGES));
      }
    }
  }, []);

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
    setPlayerStatus([]);
    setOpponentStatus([]);
    
    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setBattleLogs(prev => [
      ...prev,
      { time: timeStr, sender: "SYSTEM", text: "⚔️ COMBAT ENGAGED. DYNAMIC TACTICAL DIRECTIVES ACTIVE." }
    ]);
  };

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    const userMsg: Message = {
      time: timeStr,
      sender: profileName,
      text: chatInput.toUpperCase(),
      color: "#ff003c"
    };

    const updatedChat = [...chatMessages, userMsg];
    setChatMessages(updatedChat);
    setChatInput("");
    localStorage.setItem("redqueen_arena_fighter_chat", JSON.stringify(updatedChat));

    // Simulated opponent replies
    setTimeout(() => {
      const replies = [
        "YOUR SHIELD CALIBRATION FREQUENCY IS TOO LOW.",
        "USDC ESCROWS ARE SECURED. PREPARE COGNITIVE DISSOLUTION.",
        "MY TACTICAL HUD DETECTED YOUR SHIELD SHIFT ON TORSO.",
        "CHECK YOUR LIMB INTEGRITY RATINGS. EXPOSURE IMMINENT.",
        "THE RED QUEEN AI PREDICTS A 94% CHANCE OF MY VICTORY."
      ];
      const oppMsg: Message = {
        time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        sender: "DESGECEAN",
        text: replies[Math.floor(Math.random() * replies.length)]
      };
      const finalChat = [...updatedChat, oppMsg];
      setChatMessages(finalChat);
      localStorage.setItem("redqueen_arena_fighter_chat", JSON.stringify(finalChat));
    }, 1200);
  };

  const submitTacticalMoves = () => {
    if (!selectedAttack || !selectedDefense || combatOutcome) return;

    // Trigger screen shake hit animation
    setShakeTrigger(true);
    setTimeout(() => setShakeTrigger(false), 300);

    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    let newLogs: Message[] = [];

    // Opponent makes concurrent moves
    const limbs: Limb[] = ["HEAD", "TORSO", "ARMS", "LEGS"];
    const opponentAttack = limbs[Math.floor(Math.random() * limbs.length)];
    const opponentDefense = limbs[Math.floor(Math.random() * limbs.length)];

    newLogs.push({ time: timeStr, sender: "SYSTEM", text: `RESOLVING ROUND: YOU STRIKE [${selectedAttack}], BLOCK [${selectedDefense}]. OPPONENT STRIKES [${opponentAttack}], BLOCKS [${opponentDefense}].` });

    // Apply Mutators and status modifiers
    let dmgMultiplier = 1.0;
    if (scarceAmmoActive) {
      dmgMultiplier *= 0.85; // -15% Damage mutator
    }

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
    const agilityRatio = (playerStats.agility * (electroSurgeActive ? 1.1 : 1.0)) / opponentStats.agility;
    playerHitChance *= agilityRatio;

    // If opponent blocked, reduce damage by 85%
    let oppBlocked = false;
    if (opponentDefense === selectedAttack) {
      playerHitChance *= 0.25;
      oppBlocked = true;
    }

    const hitRoll = Math.random();
    let oppHp = opponentHp;
    if (hitRoll <= playerHitChance) {
      const critRoll = Math.random();
      const isCrit = critRoll <= (playerStats.luck / 100);
      let dmg = Math.round(playerBaseDamage * (playerStats.attack / opponentStats.defense) * (0.9 + Math.random() * 0.2) * dmgMultiplier);
      
      if (oppBlocked) {
        dmg = Math.round(dmg * 0.15);
        newLogs.push({ time: timeStr, sender: "SYSTEM", text: `BLOCKED! Opponent deflected 85% damage on [${selectedAttack}]. Dealt ${dmg} damage.` });
      } else {
        if (isCrit) {
          dmg = Math.round(dmg * 1.5);
          newLogs.push({ time: timeStr, sender: profileName, text: `💥 CRITICAL STRIKE! Dealt ${dmg} damage to Opponent's [${selectedAttack}].`, color: "#00ffcc" });
        } else {
          newLogs.push({ time: timeStr, sender: profileName, text: `Direct Hit! Dealt ${dmg} damage to Opponent's [${selectedAttack}].` });
        }

        // Apply dynamic debuffs to opponent
        if (selectedAttack === "HEAD" && Math.random() > 0.4) {
          setOpponentStatus(prev => [...prev, "GLITCHED"]);
          newLogs.push({ time: timeStr, sender: "SYSTEM", text: "Target core GLITCHED. Intellect output reduced by 50% for 1 turn." });
        } else if (selectedAttack === "TORSO" && Math.random() > 0.4) {
          setOpponentStatus(prev => [...prev, "BLEEDING"]);
          newLogs.push({ time: timeStr, sender: "SYSTEM", text: "Target chassis ruptured. Bleeding status applied." });
        } else if (selectedAttack === "LEGS" && Math.random() > 0.4) {
          setOpponentStatus(prev => [...prev, "SLOWED"]);
          newLogs.push({ time: timeStr, sender: "SYSTEM", text: "Target stabilizers damaged. Slowed status applied." });
        }
      }
      oppHp = Math.max(0, opponentHp - dmg);
      setOpponentHp(oppHp);
    } else {
      newLogs.push({ time: timeStr, sender: "SYSTEM", text: `Your strike on Opponent's [${selectedAttack}] was evaded.` });
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
    const oppAgilityRatio = opponentStats.agility / (playerStats.agility * (electroSurgeActive ? 1.1 : 1.0));
    oppHitChance *= oppAgilityRatio;

    let playerBlocked = false;
    if (selectedDefense === opponentAttack) {
      oppHitChance *= 0.25;
      playerBlocked = true;
    }

    const oppHitRoll = Math.random();
    let plyHp = playerHp;
    if (oppHitRoll <= oppHitChance) {
      const oppCritRoll = Math.random();
      const oppIsCrit = oppCritRoll <= (opponentStats.luck / 100);
      let oppDmg = Math.round(oppBaseDamage * (opponentStats.attack / playerStats.defense) * (0.9 + Math.random() * 0.2) * dmgMultiplier);
      
      if (playerBlocked) {
        oppDmg = Math.round(oppDmg * 0.15);
        newLogs.push({ time: timeStr, sender: "SYSTEM", text: `DEFLECTED! You blocked incoming strike on [${opponentAttack}]. Absorbed 85% damage (took ${oppDmg} HP).`, color: "#00ffcc" });
      } else {
        if (oppIsCrit) {
          oppDmg = Math.round(oppDmg * 1.5);
          newLogs.push({ time: timeStr, sender: "DESGECEAN", text: `💥 CRITICAL SHOT! Took ${oppDmg} damage to your [${opponentAttack}].`, color: "#ff003c" });
        } else {
          newLogs.push({ time: timeStr, sender: "DESGECEAN", text: `Hit! Took ${oppDmg} damage to your [${opponentAttack}].` });
        }

        // Apply dynamic debuffs to player
        if (opponentAttack === "HEAD" && Math.random() > 0.4) {
          setPlayerStatus(prev => [...prev, "GLITCHED"]);
          newLogs.push({ time: timeStr, sender: "SYSTEM", text: "Mainframe GLITCHED. Decryption/intellect outputs degraded." });
        } else if (opponentAttack === "TORSO" && Math.random() > 0.4) {
          setPlayerStatus(prev => [...prev, "BLEEDING"]);
          newLogs.push({ time: timeStr, sender: "SYSTEM", text: "Internal core leak detected. Bleeding applied." });
        } else if (opponentAttack === "LEGS" && Math.random() > 0.4) {
          setPlayerStatus(prev => [...prev, "SLOWED"]);
          newLogs.push({ time: timeStr, sender: "SYSTEM", text: "Actuators damaged. Speed rating lowered." });
        }
      }
      plyHp = Math.max(0, playerHp - oppDmg);
      setPlayerHp(plyHp);
    } else {
      newLogs.push({ time: timeStr, sender: "SYSTEM", text: `Hostile strike on your [${opponentAttack}] evaded.` });
    }

    // Apply toxic fog mutator damage
    if (toxicFogActive) {
      plyHp = Math.max(0, plyHp - 5);
      oppHp = Math.max(0, oppHp - 5);
      setPlayerHp(plyHp);
      setOpponentHp(oppHp);
      newLogs.push({ time: timeStr, sender: "SYSTEM", text: "💀 Toxic Fog Active: Both operatives took 5 decay damage.", color: "#ff003c" });
    }

    // Apply bleeding debuffs
    if (playerStatus.includes("BLEEDING")) {
      plyHp = Math.max(0, plyHp - 5);
      setPlayerHp(plyHp);
      newLogs.push({ time: timeStr, sender: "SYSTEM", text: "🩸 You take 5 damage from Bleeding status." });
    }
    if (opponentStatus.includes("BLEEDING")) {
      oppHp = Math.max(0, oppHp - 5);
      setOpponentHp(oppHp);
      newLogs.push({ time: timeStr, sender: "SYSTEM", text: "🩸 Opponent takes 5 damage from Bleeding status." });
    }

    // Check game outcome
    if (oppHp <= 0 && plyHp <= 0) {
      setCombatOutcome("lose");
      setMatchActive(false);
      newLogs.push({ time: timeStr, sender: "SYSTEM", text: "💀 COMBAT CONCLUDED: MUTUAL ERASURE.", color: "#ff003c" });
    } else if (oppHp <= 0) {
      setCombatOutcome("win");
      setMatchActive(false);
      newLogs.push({ time: timeStr, sender: "SYSTEM", text: `🏆 VICTORY! Opponent eliminated. Recouped +${threatWager} $THREAT.`, color: "#00ffcc" });
    } else if (plyHp <= 0) {
      setCombatOutcome("lose");
      setMatchActive(false);
      newLogs.push({ time: timeStr, sender: "SYSTEM", text: `❌ DEFEAT: Core offline. Burned ${threatWager} $THREAT.`, color: "#ff003c" });
    }

    setBattleLogs(prev => [...prev, ...newLogs]);
    setSelectedAttack(null);
    setSelectedDefense(null);
  };

  const resetEncounter = () => {
    setPlayerHp(174);
    setOpponentHp(154);
    setSelectedAttack(null);
    setSelectedDefense(null);
    setPlayerStatus([]);
    setOpponentStatus([]);
    setCombatOutcome(null);
    setMatchActive(false);
    setCountdown(10);
    setBattleLogs([
      { time: "00:00", sender: "SYSTEM", text: "ENCOUNTER RESET. LOCKED ESCROW RELOADED." }
    ]);
  };

  // SVGs for equipment slots
  const HelmetIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M12 2C6.5 2 2 6.5 2 12c0 3 .5 5.5 2.5 7.5L6 18c1.5-1.5 2.5-3.5 2.5-5.5V11h7v1.5c0 2 1 4 2.5 5.5l1.5 1.5c2-2 2.5-4.5 2.5-7.5 0-5.5-4.5-10-10-10z" />
    </svg>
  );

  const ArmorIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M12 2L4 5v7c0 5.25 3.42 10.15 8 11.5 4.58-1.35 8-6.25 8-11.5V5l-8-3z" />
    </svg>
  );

  const WeaponIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M14.5 17.5L3 6V3h3l11.5 11.5" />
    </svg>
  );

  const PantsIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M6 2h12v7l-2 8H8l-2-8V2z" />
    </svg>
  );

  const BootsIcon = () => (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M4 16v-2a4 4 0 0 1 4-4h8a4 4 0 0 1 4 4v2l-3 4H7l-3-4z" />
    </svg>
  );

  return (
    <div id="game-arena-root" className={shakeTrigger ? "hud-screen-shake" : ""} style={{ background: "#000000", minHeight: "100vh", height: "100vh", color: "#ffffff", fontFamily: "Rajdhani, sans-serif", padding: "20px 24px", position: "relative", boxSizing: "border-box", overflow: "hidden", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
      {/* HUD scanline */}
      <div className="hud-scanline" />
      <div style={{
        position: "absolute",
        top: 0, left: 0, right: 0, bottom: 0,
        backgroundImage: "linear-gradient(rgba(255, 0, 60, 0.012) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 0, 60, 0.012) 1px, transparent 1px)",
        backgroundSize: "40px 40px",
        pointerEvents: "none",
        zIndex: 1
      }} />

      {/* Screen perimeter frame */}
      <div style={{ position: "absolute", top: "12px", left: "12px", right: "12px", bottom: "12px", border: "1px solid rgba(255, 0, 60, 0.15)", pointerEvents: "none", zIndex: 10 }} />
      {/* Corner bracket indicators */}
      <div style={{ position: "absolute", top: "10px", left: "10px", width: "16px", height: "16px", borderTop: "3px solid #ff003c", borderLeft: "3px solid #ff003c", zIndex: 11 }} />
      <div style={{ position: "absolute", top: "10px", right: "10px", width: "16px", height: "16px", borderTop: "3px solid #ff003c", borderRight: "3px solid #ff003c", zIndex: 11 }} />
      <div style={{ position: "absolute", bottom: "10px", left: "10px", width: "16px", height: "16px", borderBottom: "3px solid #ff003c", borderLeft: "3px solid #ff003c", zIndex: 11 }} />
      <div style={{ position: "absolute", bottom: "10px", right: "10px", width: "16px", height: "16px", borderBottom: "3px solid #ff003c", borderRight: "3px solid #ff003c", zIndex: 11 }} />

      {/* Header Bar matching first image navigation links */}
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(255, 0, 60, 0.18)", paddingBottom: "10px", position: "relative", zIndex: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
          <span style={{ color: "#ff003c", fontWeight: "900", fontSize: "18px", fontFamily: "Orbitron, sans-serif", textShadow: "0 0 10px rgba(255, 0, 60, 0.6)", letterSpacing: "0.2em" }}>
            &gt; P2P ARENA &nbsp; /// &nbsp; 1v1 DUEL &nbsp; ///
          </span>
          <div style={{ display: "flex", gap: "12px", fontSize: "11px", fontFamily: "monospace", letterSpacing: "0.08em", fontWeight: "bold" }}>
            <Link href="/" style={{ color: "#8a8a8a", textDecoration: "none" }} className="hover-glow">[ LEAVE_HUB ]</Link>
            <Link href="/bunker" style={{ color: "#8a8a8a", textDecoration: "none" }} className="hover-glow">[ BASE_BUNKER ]</Link>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "20px", fontSize: "12px", color: "#8a8a8a", fontFamily: "Rajdhani, sans-serif", letterSpacing: "0.15em", fontWeight: 700 }}>
          <span>SEASON 1</span>
          <span style={{ color: "#ff003c" }}>●</span>
          <span style={{ display: "flex", alignItems: "center", gap: "4px", color: "#ffffff" }}>RANKED MATCH <span style={{ color: "#ff003c" }}>★</span></span>
        </div>
      </header>

      {/* Symmetrical Combat Grid layout */}
      <main style={{ display: "grid", gridTemplateColumns: "1.15fr 1fr 1.15fr", gap: "20px", flexGrow: 1, alignItems: "center", position: "relative", zIndex: 10, minHeight: "0", margin: "12px 0" }}>
        
        {/* PLAYER A (Left Panel - Red Queen vector style) */}
        <div style={{ display: "flex", gap: "20px", alignItems: "center", height: "100%", position: "relative", padding: "12px 0" }}>
          
          {/* Symmetrical line art queen blueprint overlay behind stats */}
          <div style={{
            position: "absolute",
            top: "5%",
            left: "40%",
            width: "180px",
            height: "280px",
            backgroundImage: "url(/images/redqueen_silhouette.png)",
            backgroundSize: "contain",
            backgroundRepeat: "no-repeat",
            opacity: 0.22,
            filter: "brightness(0.6) sepia(1) hue-rotate(-50deg) saturate(3) drop-shadow(0 0 20px #ff003c)",
            zIndex: 1,
            pointerEvents: "none"
          }} />

          {/* Far Left Inventory Slots */}
          <div style={{ display: "flex", flexDirection: "column", gap: "10px", zIndex: 3 }}>
            <InventorySlot icon={<HelmetIcon />} color="#ff003c" />
            <InventorySlot icon={<ArmorIcon />} color="#ff003c" />
            <InventorySlot icon={<WeaponIcon />} color="#ff003c" />
            <InventorySlot icon={<PantsIcon />} color="#ff003c" />
            <InventorySlot icon={<BootsIcon />} color="#ff003c" />
          </div>

          {/* Player stats overlaid */}
          <div style={{ flexGrow: 1, display: "flex", flexDirection: "column", justifyContent: "space-between", height: "100%", maxWidth: "260px", zIndex: 3, background: "rgba(5, 5, 5, 0.85)", padding: "16px", border: "1px solid rgba(255,0,60,0.15)", borderRadius: "2px", backdropFilter: "blur(8px)" }}>
            <div>
              <div style={{ color: "#ff003c" }}>
                <div style={{ fontSize: "22px", fontWeight: "900", fontFamily: "Orbitron, sans-serif", letterSpacing: "0.08em", textShadow: "0 0 10px rgba(255, 0, 60, 0.6)" }}>
                  RED QUEEN
                </div>
                <div style={{ fontSize: "22px", fontWeight: "900", fontFamily: "Orbitron, sans-serif", letterSpacing: "0.08em", textShadow: "0 0 10px rgba(255, 0, 60, 0.6)", marginTop: "-4px" }}>
                  ADMIN <span style={{ fontSize: "14px", verticalAlign: "middle" }}>★</span>
                </div>
              </div>
              
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "#8a8a8a", marginTop: "8px", fontFamily: "Rajdhani, sans-serif", letterSpacing: "0.12em", fontWeight: 700 }}>
                <span>RANK: <span style={{ color: "#ff003c" }}>RED QUEEN</span></span>
                <span>RATING: 1847</span>
              </div>
            </div>

            {/* Segmented HP block bar */}
            <div style={{ margin: "14px 0" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "6px", color: "#ff003c", fontFamily: "Rajdhani, sans-serif", letterSpacing: "0.15em", fontWeight: 700 }}>
                <span>HP CAPACITY</span>
                <span style={{ color: "#ffffff" }}>{playerHp} / {playerMaxHp}</span>
              </div>
              <div style={{ display: "flex", gap: "3px" }}>
                {Array.from({ length: 18 }).map((_, i) => {
                  const blockVal = (playerMaxHp / 18) * (i + 1);
                  const isActive = playerHp >= blockVal;
                  return (
                    <div
                      key={i}
                      style={{
                        height: "10px",
                        flexGrow: 1,
                        background: isActive ? "#ff003c" : "rgba(17,17,17,0.7)",
                        border: "1px solid rgba(0,0,0,0.6)",
                        boxShadow: isActive ? "0 0 6px rgba(255, 0, 60, 0.7)" : "none"
                      }}
                    />
                  );
                })}
              </div>
              {playerStatus.length > 0 && (
                <div style={{ display: "flex", gap: "4px", marginTop: "6px" }}>
                  {playerStatus.map((s, idx) => (
                    <span key={idx} style={{ background: "#ff003c", color: "#ffffff", fontSize: "9px", fontFamily: "monospace", padding: "1px 4px", fontWeight: "bold" }}>
                      [{s}]
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Faction attribute stats */}
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <StatBar label="ATTACK" value={playerStats.attack} max={100} color="#ff003c" />
              <StatBar label="DEFENSE" value={playerStats.defense} max={100} color="#ff003c" />
              <StatBar label="AGILITY" value={playerStats.agility} max={100} color="#ff003c" />
              <StatBar label="INTELLECT" value={playerStats.intellect} max={100} color="#ff003c" />
              <StatBar label="LUCK" value={playerStats.luck} max={100} color="#ff003c" />
            </div>

            {/* Defensive block mannequin */}
            <div style={{ marginTop: "14px", display: "flex", justifyContent: "center" }}>
              <TargetingMannequin
                type="DEFENSE"
                selectedLimb={selectedDefense}
                onSelectLimb={setSelectedDefense}
                accentColor="#00ffcc"
              />
            </div>
          </div>
        </div>

        {/* CENTER CONTROL PANEL: RETICLES, TIMERS & PLAY BUTTON */}
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", alignItems: "center", padding: "10px 0", height: "100%", zIndex: 5 }}>
          
          {/* Target Acquisition Timer */}
          <div style={{ textAlign: "center" }}>
            <span style={{ fontSize: "11px", color: "#8a8a8a", letterSpacing: "0.15em", fontFamily: "Rajdhani, sans-serif", fontWeight: 700 }}>
              MATCH STATUS TIMING
            </span>
            <div style={{ fontFamily: "Orbitron, sans-serif", fontSize: "36px", color: "#ff003c", fontWeight: "900", textShadow: "0 0 12px rgba(255, 0, 60, 0.8)", marginTop: "2px" }}>
              {matchActive ? "ROUND ACTIVE" : `00:${countdown.toString().padStart(2, "0")}`}
            </div>
          </div>

          {/* SVGs targeting computer sweep */}
          <div style={{ position: "relative", width: "190px", height: "190px", display: "flex", justifyContent: "center", alignItems: "center", margin: "14px 0" }}>
            <div style={{ position: "absolute", width: "100%", height: "100%", borderRadius: "50%", border: "1px dashed rgba(255, 0, 60, 0.3)", animation: "spin 40s linear infinite" }} />
            <div style={{ position: "absolute", width: "86%", height: "86%", borderRadius: "50%", border: "1.5px dashed rgba(255, 255, 255, 0.08)", animation: "spin-reverse 20s linear infinite" }} />
            <div style={{ position: "absolute", width: "72%", height: "72%", borderRadius: "50%", border: "1px solid rgba(255, 0, 60, 0.15)" }} />
            
            <div style={{ position: "absolute", width: "120%", height: "1px", background: "linear-gradient(90deg, rgba(255,0,60,0) 0%, rgba(255,0,60,0.2) 50%, rgba(255,0,60,0) 100%)" }} />
            <div style={{ position: "absolute", height: "120%", width: "1px", background: "linear-gradient(180deg, rgba(255,0,60,0) 0%, rgba(255,0,60,0.2) 50%, rgba(255,0,60,0) 100%)" }} />

            <div style={{ width: "90px", height: "90px", borderRadius: "50%", background: "#030303", border: "2px solid #ff003c", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 5, boxShadow: "0 0 20px rgba(255, 0, 60, 0.6)" }}>
              <span style={{ fontFamily: "Orbitron, sans-serif", fontSize: "32px", color: "#ff003c", fontWeight: "900", textShadow: "0 0 8px #ff003c", letterSpacing: "-0.05em" }}>VS</span>
            </div>
            
            <style jsx>{`
              @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
              @keyframes spin-reverse { from { transform: rotate(360deg); } to { transform: rotate(0deg); } }
            `}</style>
          </div>

          {/* Combat Details */}
          <div style={{ textAlign: "center", width: "100%", display: "flex", flexDirection: "column", gap: "8px", fontFamily: "Rajdhani, sans-serif" }}>
            <div>
              <span style={{ fontSize: "11px", color: "#8a8a8a", letterSpacing: "0.15em", fontWeight: 700 }}>TACTICAL ARENA</span>
              <div style={{ fontSize: "15px", fontWeight: "bold", color: "#ffffff", letterSpacing: "0.08em" }}>WASTELAND COLISEUM</div>
            </div>
            
            <div>
              <span style={{ fontSize: "11px", color: "#8a8a8a", letterSpacing: "0.15em", fontWeight: 700 }}>ESCROW RISK WAGER</span>
              
              {/* Customizable Wager Selection */}
              {!matchActive ? (
                <div style={{ display: "flex", justifyContent: "center", gap: "6px", marginTop: "4px" }}>
                  {[10, 50, 100, 250].map(val => (
                    <button
                      key={val}
                      onClick={() => setThreatWager(val)}
                      style={{
                        background: threatWager === val ? "#ff003c" : "rgba(5,5,5,0.8)",
                        border: `1px solid ${threatWager === val ? "#ff003c" : "rgba(255,255,255,0.1)"}`,
                        color: "#ffffff",
                        fontFamily: "monospace",
                        fontSize: "11px",
                        padding: "2px 8px",
                        cursor: "pointer",
                        borderRadius: "1px"
                      }}
                    >
                      {val}T
                    </button>
                  ))}
                </div>
              ) : (
                <div style={{ fontSize: "18px", fontWeight: "bold", color: "#ff003c", textShadow: "0 0 8px rgba(255, 0, 60, 0.5)" }}>{threatWager} $THREAT</div>
              )}
            </div>
          </div>

          {/* Combat play actions */}
          <div style={{ width: "100%", padding: "0 16px", zIndex: 12 }}>
            {combatOutcome ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <div style={{ fontSize: "16px", fontFamily: "Orbitron, sans-serif", color: combatOutcome === "win" ? "#00ffcc" : "#ff003c", fontWeight: "900", textAlign: "center", textShadow: "0 0 10px currentColor" }}>
                  {combatOutcome === "win" ? "🏆 ENCOUNTER VICTORY" : "💀 MAINFLOW SHUTDOWN"}
                </div>
                <button
                  onClick={resetEncounter}
                  className="hud-btn"
                  style={{
                    width: "100%",
                    fontSize: "12px",
                    padding: "12px",
                    boxShadow: "0 0 15px rgba(255, 0, 60, 0.45)"
                  }}
                >
                  [ RETRY DUEL ]
                </button>
              </div>
            ) : !matchActive ? (
              <button
                onClick={triggerStartMatch}
                className="hud-btn"
                style={{
                  width: "100%",
                  fontSize: "13px",
                  padding: "14px",
                  boxShadow: "0 0 15px rgba(255, 0, 60, 0.45)"
                }}
              >
                [ INITIATE 1v1 ENCOUNTER ]
              </button>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <div style={{ display: "flex", gap: "6px" }}>
                  <div style={{ flex: 1, border: "1px solid rgba(255, 0, 60, 0.2)", background: "rgba(5, 5, 5, 0.9)", padding: "6px", fontSize: "11px", textAlign: "center", fontFamily: "Rajdhani, sans-serif", fontWeight: 700, color: "#ff003c" }}>
                    ATTACK: {selectedAttack || "NOT SET"}
                  </div>
                  <div style={{ flex: 1, border: "1px solid rgba(0, 255, 204, 0.2)", background: "rgba(5, 5, 5, 0.9)", padding: "6px", fontSize: "11px", textAlign: "center", fontFamily: "Rajdhani, sans-serif", fontWeight: 700, color: "#00ffcc" }}>
                    SHIELD: {selectedDefense || "NOT SET"}
                  </div>
                </div>
                
                <button
                  onClick={submitTacticalMoves}
                  disabled={!selectedAttack || !selectedDefense}
                  className="hud-btn"
                  style={{
                    width: "100%",
                    fontSize: "12px",
                    padding: "11px",
                    opacity: (!selectedAttack || !selectedDefense) ? 0.35 : 1,
                    cursor: (!selectedAttack || !selectedDefense) ? "not-allowed" : "pointer"
                  }}
                >
                  [ LOCK STRIKES & EXECUTE ]
                </button>
              </div>
            )}
          </div>
        </div>

        {/* PLAYER B (Right Panel - Soldier vector style) */}
        <div style={{ display: "flex", gap: "20px", alignItems: "center", height: "100%", justifyContent: "flex-end", position: "relative", padding: "12px 0" }}>
          
          {/* Symmetrical line art soldier blueprint overlay behind stats */}
          <div style={{
            position: "absolute",
            top: "5%",
            right: "40%",
            width: "180px",
            height: "280px",
            backgroundImage: "url(/images/soldier_silhouette.png)",
            backgroundSize: "contain",
            backgroundRepeat: "no-repeat",
            opacity: 0.22,
            filter: "brightness(0.7) sepia(1) hue-rotate(140deg) saturate(1.5) drop-shadow(0 0 20px #00ffcc)",
            zIndex: 1,
            pointerEvents: "none"
          }} />

          {/* Player stats overlaid */}
          <div style={{ flexGrow: 1, display: "flex", flexDirection: "column", justifyContent: "space-between", height: "100%", maxWidth: "260px", zIndex: 3, background: "rgba(5, 5, 5, 0.85)", padding: "16px", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "2px", backdropFilter: "blur(8px)" }}>
            <div style={{ textAlign: "right" }}>
              <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "8px" }}>
                <span style={{ fontSize: "22px", fontWeight: "900", fontFamily: "Orbitron, sans-serif", letterSpacing: "0.08em", color: "#ffffff", textShadow: "0 0 10px rgba(255, 255, 255, 0.2)" }}>
                  DESGECEAN
                </span>
                <span style={{ fontSize: "14px", color: "#8a8a8a" }}>★</span>
              </div>
              
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "#8a8a8a", marginTop: "8px", fontFamily: "Rajdhani, sans-serif", letterSpacing: "0.12em", fontWeight: 700 }}>
                <span>RANK: SURVIVOR</span>
                <span>RATING: 1732</span>
              </div>
            </div>

            {/* Segmented HP block bar */}
            <div style={{ margin: "14px 0" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "6px", color: "#8a8a8a", fontFamily: "Rajdhani, sans-serif", letterSpacing: "0.15em", fontWeight: 700 }}>
                <span>HP CAPACITY</span>
                <span style={{ color: "#ffffff" }}>{opponentHp} / {opponentMaxHp}</span>
              </div>
              <div style={{ display: "flex", gap: "3px" }}>
                {Array.from({ length: 18 }).map((_, i) => {
                  const blockVal = (opponentMaxHp / 18) * (i + 1);
                  const isActive = opponentHp >= blockVal;
                  return (
                    <div
                      key={i}
                      style={{
                        height: "10px",
                        flexGrow: 1,
                        background: isActive ? "#ffffff" : "rgba(17,17,17,0.7)",
                        border: "1px solid rgba(0,0,0,0.6)",
                        boxShadow: isActive ? "0 0 6px rgba(255, 255, 255, 0.4)" : "none"
                      }}
                    />
                  );
                })}
              </div>
              {opponentStatus.length > 0 && (
                <div style={{ display: "flex", gap: "4px", marginTop: "6px", justifyContent: "flex-end" }}>
                  {opponentStatus.map((s, idx) => (
                    <span key={idx} style={{ background: "#ffffff", color: "#000000", fontSize: "9px", fontFamily: "monospace", padding: "1px 4px", fontWeight: "bold" }}>
                      [{s}]
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Faction attribute stats */}
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <StatBar label="ATTACK" value={opponentStats.attack} max={100} color="#8a8a8a" />
              <StatBar label="DEFENSE" value={opponentStats.defense} max={100} color="#8a8a8a" />
              <StatBar label="AGILITY" value={opponentStats.agility} max={100} color="#8a8a8a" />
              <StatBar label="INTELLECT" value={opponentStats.intellect} max={100} color="#8a8a8a" />
              <StatBar label="LUCK" value={opponentStats.luck} max={100} color="#8a8a8a" />
            </div>

            {/* Attack targeting mannequin selector */}
            <div style={{ marginTop: "14px", display: "flex", justifyContent: "center" }}>
              <TargetingMannequin
                type="ATTACK"
                selectedLimb={selectedAttack}
                onSelectLimb={setSelectedAttack}
                accentColor="#ff003c"
              />
            </div>
          </div>

          {/* Far Right Inventory Slots */}
          <div style={{ display: "flex", flexDirection: "column", gap: "10px", zIndex: 3 }}>
            <InventorySlot icon={<HelmetIcon />} color="#8a8a8a" />
            <InventorySlot icon={<ArmorIcon />} color="#8a8a8a" />
            <InventorySlot icon={<WeaponIcon />} color="#8a8a8a" />
            <InventorySlot icon={<PantsIcon />} color="#8a8a8a" />
            <InventorySlot icon={<BootsIcon />} color="#8a8a8a" />
          </div>
        </div>

      </main>

      {/* BOTTOM FLOATING PANEL ROW */}
      <footer style={{ display: "grid", gridTemplateColumns: "1.15fr 1fr 1.15fr", gap: "16px", minHeight: "190px", maxHeight: "210px", position: "relative", zIndex: 20 }}>
        
        {/* Arena Chat Box */}
        <div className="hud-panel" style={{ padding: "12px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(255, 0, 60, 0.15)", paddingBottom: "4px", marginBottom: "8px" }}>
            <span style={{ fontSize: "11px", color: "#ff003c", fontWeight: "bold", fontFamily: "Orbitron, sans-serif", letterSpacing: "0.15em" }}>
              ● ARENA CHAT CHANNEL
            </span>
          </div>
          
          <div className="hud-scrollbar" style={{ overflowY: "auto", flexGrow: 1, fontSize: "12px", display: "flex", flexDirection: "column", gap: "4px", marginBottom: "8px", paddingRight: "4px", fontFamily: "monospace" }}>
            {chatMessages.map((msg, i) => (
              <div key={i} style={{ lineHeight: "1.3" }}>
                <span style={{ color: "rgba(255,255,255,0.25)", marginRight: "6px" }}>[{msg.time}]</span>
                <span style={{ color: msg.color || "#8a8a8a", fontWeight: "bold", marginRight: "6px" }}>{msg.sender}:</span>
                <span style={{ color: "rgba(255,255,255,0.8)" }}>{msg.text}</span>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>

          <form onSubmit={handleSendChat} style={{ display: "flex", border: "1px solid rgba(255,0,60,0.25)", background: "#050505" }}>
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="TYPE TRANSMISSION..."
              style={{ flexGrow: 1, background: "transparent", border: "none", color: "#ffffff", fontFamily: "monospace", fontSize: "11px", padding: "6px 8px", outline: "none", textTransform: "uppercase" }}
            />
            <button type="submit" style={{ background: "transparent", border: "none", color: "#ff003c", cursor: "pointer", padding: "0 8px", display: "flex", alignItems: "center" }}>
              <svg width="10" height="10" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>
            </button>
          </form>
        </div>

        {/* Environmental Mutators Box */}
        <div className="hud-panel" style={{ padding: "12px", display: "flex", flexDirection: "column", gap: "6px" }}>
          <span style={{ fontSize: "11px", color: "#8a8a8a", fontWeight: "bold", fontFamily: "Orbitron, sans-serif", letterSpacing: "0.1em", borderBottom: "1px solid rgba(255, 0, 60, 0.15)", paddingBottom: "4px" }}>
            ENVIRONMENT MUTATORS (CLICK TO TOGGLE)
          </span>
          
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px", flexGrow: 1, minHeight: "0" }}>
            {/* Mutator 1: TOXIC FOG */}
            <div 
              onClick={() => !matchActive && setToxicFogActive(!toxicFogActive)}
              style={{ 
                border: `1px solid ${toxicFogActive ? "#ff003c" : "rgba(255, 255, 255, 0.08)"}`, 
                background: toxicFogActive ? "rgba(255, 0, 60, 0.08)" : "rgba(5, 5, 5, 0.6)", 
                padding: "6px", 
                display: "flex", 
                flexDirection: "column", 
                justifyContent: "space-between", 
                borderRadius: "1px",
                cursor: matchActive ? "not-allowed" : "pointer"
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                <span style={{ color: "#ff003c", fontSize: "11px" }}>💀</span>
                <div style={{ fontSize: "10px", fontWeight: "bold", color: "#ffffff" }}>TOXIC FOG</div>
              </div>
              <span style={{ fontSize: "11px", color: "#ff003c", fontWeight: "bold" }}>-10% HP REGEN</span>
            </div>

            {/* Mutator 2: SCARCE AMMO */}
            <div 
              onClick={() => !matchActive && setScarceAmmoActive(!scarceAmmoActive)}
              style={{ 
                border: `1px solid ${scarceAmmoActive ? "#ff003c" : "rgba(255, 255, 255, 0.08)"}`, 
                background: scarceAmmoActive ? "rgba(255, 0, 60, 0.08)" : "rgba(5, 5, 5, 0.6)", 
                padding: "6px", 
                display: "flex", 
                flexDirection: "column", 
                justifyContent: "space-between", 
                borderRadius: "1px",
                cursor: matchActive ? "not-allowed" : "pointer"
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                <span style={{ color: "#ff003c", fontSize: "11px" }}>🛡️</span>
                <div style={{ fontSize: "10px", fontWeight: "bold", color: "#ffffff" }}>SCARCE AMMO</div>
              </div>
              <span style={{ fontSize: "11px", color: "#ff003c", fontWeight: "bold" }}>-15% DAMAGE</span>
            </div>

            {/* Mutator 3: ELECTRO SURGE */}
            <div 
              onClick={() => !matchActive && setElectroSurgeActive(!electroSurgeActive)}
              style={{ 
                border: `1px solid ${electroSurgeActive ? "#ff003c" : "rgba(255, 255, 255, 0.08)"}`, 
                background: electroSurgeActive ? "rgba(255, 0, 60, 0.08)" : "rgba(5, 5, 5, 0.6)", 
                padding: "6px", 
                display: "flex", 
                flexDirection: "column", 
                justifyContent: "space-between", 
                borderRadius: "1px",
                cursor: matchActive ? "not-allowed" : "pointer"
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                <span style={{ color: "#ff003c", fontSize: "11px" }}>⚡</span>
                <div style={{ fontSize: "10px", fontWeight: "bold", color: "#ffffff" }}>ELECTRO SURGE</div>
              </div>
              <span style={{ fontSize: "11px", color: "#ff003c", fontWeight: "bold" }}>+10% AGILITY</span>
            </div>

            {/* Mutator 4: DATA BREACH */}
            <div 
              onClick={() => !matchActive && setDataBreachActive(!dataBreachActive)}
              style={{ 
                border: `1px solid ${dataBreachActive ? "#ff003c" : "rgba(255, 255, 255, 0.08)"}`, 
                background: dataBreachActive ? "rgba(255, 0, 60, 0.08)" : "rgba(5, 5, 5, 0.6)", 
                padding: "6px", 
                display: "flex", 
                flexDirection: "column", 
                justifyContent: "space-between", 
                borderRadius: "1px",
                cursor: matchActive ? "not-allowed" : "pointer"
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                <span style={{ color: "#ff003c", fontSize: "11px" }}>🔒</span>
                <div style={{ fontSize: "10px", fontWeight: "bold", color: "#ffffff" }}>DATA BREACH</div>
              </div>
              <span style={{ fontSize: "11px", color: "#ff003c", fontWeight: "bold" }}>-5% INTELLECT</span>
            </div>
          </div>
        </div>

        {/* Combat Log Box */}
        <div className="hud-panel" style={{ padding: "12px", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(255, 0, 60, 0.15)", paddingBottom: "4px", marginBottom: "8px" }}>
            <span style={{ fontSize: "11px", color: "#8a8a8a", fontWeight: "bold", fontFamily: "Orbitron, sans-serif", letterSpacing: "0.1em" }}>
              TACTICAL BATTLE LOGS
            </span>
          </div>

          <div className="hud-scrollbar" style={{ overflowY: "auto", flexGrow: 1, fontSize: "12px", display: "flex", flexDirection: "column", gap: "4px", paddingRight: "4px", fontFamily: "monospace" }}>
            {battleLogs.map((log, i) => (
              <div key={i} style={{ lineHeight: "1.3" }}>
                <span style={{ color: "rgba(255,255,255,0.25)", marginRight: "6px" }}>[{log.time}]</span>
                <span style={{
                  color: log.color ? log.color :
                         log.sender === profileName ? "#00ffcc" : 
                         log.sender === "DESGECEAN" ? "#ff003c" : "rgba(255,255,255,0.55)"
                }}>
                  {log.text}
                </span>
              </div>
            ))}
            <div ref={logEndRef} />
          </div>
        </div>

      </footer>
    </div>
  );
}
