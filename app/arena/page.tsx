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
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: color, fontFamily: "Rajdhani, sans-serif", letterSpacing: "0.15em", textTransform: "uppercase", fontWeight: 500 }}>
        <span>{label}</span>
        <span style={{ color: "#ffffff", fontWeight: 700 }}>{value}</span>
      </div>
      <div style={{ height: "2px", background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)", position: "relative" }}>
        <div style={{ height: "100%", width: `${percentage}%`, background: color, boxShadow: `0 0 8px ${color}` }} />
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
        width: "46px", 
        height: "46px", 
        border: `1px solid ${color === "#ff003c" ? "rgba(255, 0, 60, 0.2)" : "rgba(255, 255, 255, 0.12)"}`, 
        background: "rgba(3, 3, 3, 0.65)", 
        display: "flex", 
        justifyContent: "center", 
        alignItems: "center", 
        position: "relative",
        boxShadow: "inset 0 0 6px rgba(0,0,0,0.9)",
        zIndex: 3
      }}
    >
      <div style={{ color: color, opacity: 0.8 }}>{icon}</div>
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
      <span className="font-orbitron" style={{ fontSize: "11px", color: accentColor, fontWeight: "700", letterSpacing: "0.15em" }}>
        {type === "ATTACK" ? "STRIKE TARGET" : "SHIELD SECTOR"}
      </span>
      <div style={{ width: "95px", height: "120px", position: "relative" }}>
        <svg width="85" height="115" viewBox="0 0 80 120" style={{ display: "block", margin: "auto" }}>
          {/* Head block - hexagonal wireframe */}
          <polygon
            points="40,10 49,15 49,25 40,30 31,25 31,15"
            fill={selectedLimb === "HEAD" ? accentColor : "transparent"}
            stroke={accentColor}
            strokeWidth="1.5"
            style={{ cursor: "pointer", transition: "all 0.15s" }}
            onClick={() => onSelectLimb("HEAD")}
          />
          {/* Neck line */}
          <line x1="40" y1="30" x2="40" y2="36" stroke={accentColor} strokeWidth="1.5" />
          
          {/* Torso block - tapered tactical harness polygon */}
          <polygon
            points="25,36 55,36 50,76 30,76"
            fill={selectedLimb === "TORSO" ? accentColor : "transparent"}
            stroke={accentColor}
            strokeWidth="1.5"
            style={{ cursor: "pointer", transition: "all 0.15s" }}
            onClick={() => onSelectLimb("TORSO")}
          />
          {/* Left Arm block - tapered polygon */}
          <polygon
            points="10,38 22,38 18,72 10,72"
            fill={selectedLimb === "ARMS" ? accentColor : "transparent"}
            stroke={accentColor}
            strokeWidth="1.5"
            style={{ cursor: "pointer", transition: "all 0.15s" }}
            onClick={() => onSelectLimb("ARMS")}
          />
          {/* Right Arm block - tapered polygon */}
          <polygon
            points="58,38 70,38 70,72 62,72"
            fill={selectedLimb === "ARMS" ? accentColor : "transparent"}
            stroke={accentColor}
            strokeWidth="1.5"
            style={{ cursor: "pointer", transition: "all 0.15s" }}
            onClick={() => onSelectLimb("ARMS")}
          />
          {/* Left Leg block - tapered polygon */}
          <polygon
            points="25,80 37,80 34,116 26,116"
            fill={selectedLimb === "LEGS" ? accentColor : "transparent"}
            stroke={accentColor}
            strokeWidth="1.5"
            style={{ cursor: "pointer", transition: "all 0.15s" }}
            onClick={() => onSelectLimb("LEGS")}
          />
          {/* Right Leg block - tapered polygon */}
          <polygon
            points="43,80 55,80 54,116 46,116"
            fill={selectedLimb === "LEGS" ? accentColor : "transparent"}
            stroke={accentColor}
            strokeWidth="1.5"
            style={{ cursor: "pointer", transition: "all 0.15s" }}
            onClick={() => onSelectLimb("LEGS")}
          />
        </svg>
      </div>
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

  const [shakeTrigger, setShakeTrigger] = useState<boolean>(false);
  const [chatMessages, setChatMessages] = useState<Message[]>([]);
  const [chatInput, setChatInput] = useState<string>("");

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

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  useEffect(() => {
    logEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [battleLogs]);

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

    setTimeout(() => {
      const replies = [
        "YOUR SHIELD CALIBRATION FREQUENCY IS TOO LOW.",
        "USDC ESCROWS ARE SECURED. PREPARE COGNITIVE DISSOLUTION.",
        "MY TACTICAL HUD DETECTED YOUR SHIELD SHIFT ON TORSO.",
        "CHECK YOUR LIMB INTEGRITY RATINGS. EXPOSURE IMMINENT."
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

    setShakeTrigger(true);
    setTimeout(() => setShakeTrigger(false), 300);

    const timeStr = new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    let newLogs: Message[] = [];

    const limbs: Limb[] = ["HEAD", "TORSO", "ARMS", "LEGS"];
    const opponentAttack = limbs[Math.floor(Math.random() * limbs.length)];
    const opponentDefense = limbs[Math.floor(Math.random() * limbs.length)];

    newLogs.push({ time: timeStr, sender: "SYSTEM", text: `RESOLVING ROUND: YOU STRIKE [${selectedAttack}], BLOCK [${selectedDefense}]. OPPONENT STRIKES [${opponentAttack}], BLOCKS [${opponentDefense}].` });

    let dmgMultiplier = 1.0;
    if (scarceAmmoActive) {
      dmgMultiplier *= 0.85;
    }

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

    const agilityRatio = (playerStats.agility * (electroSurgeActive ? 1.1 : 1.0)) / opponentStats.agility;
    playerHitChance *= agilityRatio;

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
          newLogs.push({ time: timeStr, sender: profileName, text: `💥 CRITICAL STRIKE! Dealt ${dmg} damage to Opponent's [${selectedAttack}].`, color: "#ff003c" });
        } else {
          newLogs.push({ time: timeStr, sender: profileName, text: `Direct Hit! Dealt ${dmg} damage to Opponent's [${selectedAttack}].` });
        }

        if (selectedAttack === "HEAD" && Math.random() > 0.4) {
          setOpponentStatus(prev => [...prev, "GLITCHED"]);
        } else if (selectedAttack === "TORSO" && Math.random() > 0.4) {
          setOpponentStatus(prev => [...prev, "BLEEDING"]);
        } else if (selectedAttack === "LEGS" && Math.random() > 0.4) {
          setOpponentStatus(prev => [...prev, "SLOWED"]);
        }
      }
      oppHp = Math.max(0, opponentHp - dmg);
      setOpponentHp(oppHp);
    } else {
      newLogs.push({ time: timeStr, sender: "SYSTEM", text: `Your strike on Opponent's [${selectedAttack}] was evaded.` });
    }

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
        newLogs.push({ time: timeStr, sender: "SYSTEM", text: `DEFLECTED! You blocked incoming strike on [${opponentAttack}]. Absorbed 85% damage (took ${oppDmg} HP).`, color: "#ffffff" });
      } else {
        if (oppIsCrit) {
          oppDmg = Math.round(oppDmg * 1.5);
          newLogs.push({ time: timeStr, sender: "DESGECEAN", text: `💥 CRITICAL SHOT! Took ${oppDmg} damage to your [${opponentAttack}].`, color: "#ff003c" });
        } else {
          newLogs.push({ time: timeStr, sender: "DESGECEAN", text: `Hit! Took ${oppDmg} damage to your [${opponentAttack}].` });
        }

        if (opponentAttack === "HEAD" && Math.random() > 0.4) {
          setPlayerStatus(prev => [...prev, "GLITCHED"]);
        } else if (opponentAttack === "TORSO" && Math.random() > 0.4) {
          setPlayerStatus(prev => [...prev, "BLEEDING"]);
        } else if (opponentAttack === "LEGS" && Math.random() > 0.4) {
          setPlayerStatus(prev => [...prev, "SLOWED"]);
        }
      }
      plyHp = Math.max(0, playerHp - oppDmg);
      setPlayerHp(plyHp);
    } else {
      newLogs.push({ time: timeStr, sender: "SYSTEM", text: `Hostile strike on your [${opponentAttack}] evaded.` });
    }

    if (toxicFogActive) {
      plyHp = Math.max(0, plyHp - 5);
      oppHp = Math.max(0, oppHp - 5);
      setPlayerHp(plyHp);
      setOpponentHp(oppHp);
      newLogs.push({ time: timeStr, sender: "SYSTEM", text: "💀 Toxic Fog Active: Both operatives took 5 decay damage.", color: "#ff003c" });
    }

    if (playerStatus.includes("BLEEDING")) {
      plyHp = Math.max(0, plyHp - 5);
      setPlayerHp(plyHp);
    }
    if (opponentStatus.includes("BLEEDING")) {
      oppHp = Math.max(0, oppHp - 5);
      setOpponentHp(oppHp);
    }

    if (oppHp <= 0 && plyHp <= 0) {
      setCombatOutcome("lose");
      setMatchActive(false);
      newLogs.push({ time: timeStr, sender: "SYSTEM", text: "💀 COMBAT CONCLUDED: MUTUAL ERASURE.", color: "#ff003c" });
    } else if (oppHp <= 0) {
      setCombatOutcome("win");
      setMatchActive(false);
      newLogs.push({ time: timeStr, sender: "SYSTEM", text: `🏆 VICTORY! Opponent eliminated. Recouped +${threatWager} $THREAT.`, color: "#ffffff" });
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
    <div id="game-arena-root" className={shakeTrigger ? "hud-screen-shake" : ""} style={{ background: "#030303", minHeight: "100vh", height: "100vh", color: "#ffffff", fontFamily: "Rajdhani, sans-serif", padding: "20px 24px", position: "relative", boxSizing: "border-box", overflow: "hidden", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
      {/* Ambient Edge Blooms */}
      <div className="hud-ambient-crimson-left" />
      <div className="hud-ambient-white-right" />

      {/* CRT Scanline */}
      <div className="hud-scanline" />
      
      {/* 40px HUD grid */}
      <div style={{
        position: "absolute",
        top: 0, left: 0, right: 0, bottom: 0,
        backgroundImage: "linear-gradient(rgba(255, 0, 60, 0.006) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 0, 60, 0.006) 1px, transparent 1px)",
        backgroundSize: "40px 40px",
        pointerEvents: "none",
        zIndex: 1
      }} />

      {/* Symmetrical border frame */}
      <div style={{ position: "absolute", top: "12px", left: "12px", right: "12px", bottom: "12px", border: "1px solid rgba(255, 0, 60, 0.06)", pointerEvents: "none", zIndex: 10 }} />

      {/* HEADER SECTION */}
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(255, 0, 60, 0.08)", paddingBottom: "10px", position: "relative", zIndex: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
          <span className="font-orbitron" style={{ color: "#ff003c", fontWeight: "900", fontSize: "16px", letterSpacing: "0.25em" }}>
            &gt; P2P ARENA &nbsp; /// &nbsp; 1V1 DUEL &nbsp; ///
          </span>
          <div className="font-oxanium" style={{ display: "flex", gap: "12px", fontSize: "11px", letterSpacing: "0.08em", fontWeight: "bold" }}>
            <Link href="/" style={{ color: "#8a8a8a", textDecoration: "none" }} className="hover-glow">[ LEAVE_HUB ]</Link>
            <Link href="/bunker" style={{ color: "#8a8a8a", textDecoration: "none" }} className="hover-glow">[ BASE_BUNKER ]</Link>
          </div>
        </div>
        <div className="font-rajdhani" style={{ display: "flex", alignItems: "center", gap: "20px", fontSize: "12px", color: "#8a8a8a", letterSpacing: "0.15em", fontWeight: 700 }}>
          <span>SEASON 1</span>
          <span style={{ color: "#ff003c" }}>●</span>
          <span style={{ display: "flex", alignItems: "center", gap: "4px", color: "#ffffff" }}>RANKED MATCH <span style={{ color: "#ff003c" }}>★</span></span>
        </div>
      </header>

      {/* Main Symmetrical HUD Layer with Large Characters (90% height) behind UI */}
      <main style={{ display: "grid", gridTemplateColumns: "1.1fr 1fr 1.1fr", gap: "20px", flexGrow: 1, alignItems: "center", position: "relative", zIndex: 10, minHeight: "0", margin: "12px 0" }}>
        
        {/* CHARACTER A BLUEPRINT (LEFT BACKGROUND) */}
        <div 
          className="hud-silhouette-left"
          style={{
            position: "absolute",
            bottom: "0px",
            left: "-2vw",
            width: "48vw",
            height: "92vh",
            backgroundImage: "url(/images/redqueen_silhouette.png)",
            backgroundSize: "contain",
            backgroundPosition: "left bottom",
            backgroundRepeat: "no-repeat",
            zIndex: 2,
            pointerEvents: "none"
          }} 
        />

        {/* CHARACTER B BLUEPRINT (RIGHT BACKGROUND) */}
        <div 
          className="hud-silhouette-right"
          style={{
            position: "absolute",
            bottom: "0px",
            right: "-2vw",
            width: "48vw",
            height: "92vh",
            backgroundImage: "url(/images/soldier_silhouette.png)",
            backgroundSize: "contain",
            backgroundPosition: "right bottom",
            backgroundRepeat: "no-repeat",
            zIndex: 2,
            pointerEvents: "none"
          }} 
        />

        {/* PLAYER A CONTROLS (LEFT HUD) */}
        <div style={{ display: "flex", gap: "16px", alignItems: "center", height: "100%", position: "relative", zIndex: 3 }}>
          {/* Inventory stacked on far left */}
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <InventorySlot icon={<HelmetIcon />} color="#ff003c" />
            <InventorySlot icon={<ArmorIcon />} color="#ff003c" />
            <InventorySlot icon={<WeaponIcon />} color="#ff003c" />
            <InventorySlot icon={<PantsIcon />} color="#ff003c" />
            <InventorySlot icon={<BootsIcon />} color="#ff003c" />
          </div>

          {/* Symmetrical Stats Panel */}
          <div className="hud-panel" style={{ flexGrow: 1, display: "flex", flexDirection: "column", justifyContent: "space-between", height: "100%", maxWidth: "260px", padding: "16px", background: "rgba(3, 3, 3, 0.28)", border: "1px solid rgba(255, 0, 60, 0.08)", backdropFilter: "blur(3px)" }}>
            <div>
              <div style={{ color: "#ff003c" }}>
                <div className="font-orbitron" style={{ fontSize: "20px", fontWeight: "900", letterSpacing: "0.08em" }}>
                  RED QUEEN
                </div>
                <div className="font-orbitron" style={{ fontSize: "20px", fontWeight: "900", letterSpacing: "0.08em", marginTop: "-4px" }}>
                  ADMIN <span style={{ fontSize: "14px" }}>★</span>
                </div>
              </div>
              
              <div className="font-rajdhani" style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "#8a8a8a", marginTop: "8px", letterSpacing: "0.12em", fontWeight: 700 }}>
                <span>RANK: <span style={{ color: "#ff003c" }}>RED QUEEN</span></span>
                <span>RATING: 1847</span>
              </div>
            </div>

            {/* Segmented HP Block */}
            <div style={{ margin: "14px 0" }}>
              <div className="font-rajdhani" style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", marginBottom: "6px", color: "#ff003c", letterSpacing: "0.12em", fontWeight: 700 }}>
                <span>HP CAPACITY</span>
                <span style={{ color: "#ffffff" }}>{playerHp} / {playerMaxHp}</span>
              </div>
              <div style={{ display: "flex", gap: "2.5px" }}>
                {Array.from({ length: 18 }).map((_, i) => {
                  const blockVal = (playerMaxHp / 18) * (i + 1);
                  const isActive = playerHp >= blockVal;
                  return (
                    <div
                      key={i}
                      style={{
                        height: "9px",
                        flexGrow: 1,
                        background: isActive ? "#ff003c" : "rgba(255,255,255,0.04)",
                        border: "1px solid #000000",
                        boxShadow: isActive ? "0 0 5px rgba(255, 0, 60, 0.6)" : "none"
                      }}
                    />
                  );
                })}
              </div>
              {playerStatus.length > 0 && (
                <div style={{ display: "flex", gap: "4px", marginTop: "6px" }}>
                  {playerStatus.map((s, idx) => (
                    <span key={idx} style={{ border: "1px solid #ff003c", color: "#ff003c", fontSize: "9px", fontFamily: "monospace", padding: "0px 4px", fontWeight: "bold" }}>
                      {s}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Faction attributes */}
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <StatBar label="ATTACK" value={playerStats.attack} max={100} color="#ff003c" />
              <StatBar label="DEFENSE" value={playerStats.defense} max={100} color="#ff003c" />
              <StatBar label="AGILITY" value={playerStats.agility} max={100} color="#ff003c" />
              <StatBar label="INTELLECT" value={playerStats.intellect} max={100} color="#ff003c" />
              <StatBar label="LUCK" value={playerStats.luck} max={100} color="#ff003c" />
            </div>

            {/* Shield block mannequin */}
            <div style={{ marginTop: "12px" }}>
              <TargetingMannequin
                type="DEFENSE"
                selectedLimb={selectedDefense}
                onSelectLimb={setSelectedDefense}
                accentColor="#ffffff"
              />
            </div>
          </div>
        </div>

        {/* MILITARY TARGETING RETICLE HUB (CENTERPIECE) */}
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", alignItems: "center", padding: "10px 0", height: "100%", zIndex: 5 }}>
          
          <div style={{ textAlign: "center" }}>
            <span className="font-rajdhani" style={{ fontSize: "11px", color: "#8a8a8a", letterSpacing: "0.15em", fontWeight: 700 }}>
              MATCH STATUS TIMING
            </span>
            <div className="font-orbitron" style={{ fontSize: "36px", color: "#ff003c", fontWeight: "900", textShadow: "0 0 12px rgba(255, 0, 60, 0.8)", marginTop: "2px" }}>
              {matchActive ? "ROUND ACTIVE" : `00:${countdown.toString().padStart(2, "0")}`}
            </div>
          </div>

          {/* Scanner/Target rings centerpiece - Futuristic Combat Computer */}
          <div style={{ position: "relative", width: "260px", height: "260px", display: "flex", justifyContent: "center", alignItems: "center", margin: "14px 0" }}>
            <svg width="260" height="260" viewBox="0 0 260 260" className="hud-reticle-glow" style={{ position: "absolute", zIndex: 4, overflow: "visible" }}>
              {/* Outer compass ring */}
              <circle cx="130" cy="130" r="120" fill="none" stroke="rgba(255, 0, 60, 0.15)" strokeWidth="1" strokeDasharray="6 4" className="hud-spin-cw" />
              {/* Thin second ring with degree marks */}
              <circle cx="130" cy="130" r="105" fill="none" stroke="rgba(255, 255, 255, 0.08)" strokeWidth="1" />
              {/* Degree mark ticks */}
              {Array.from({ length: 12 }).map((_, idx) => {
                const angle = (idx * 30 * Math.PI) / 180;
                const x1 = 130 + 100 * Math.cos(angle);
                const y1 = 130 + 100 * Math.sin(angle);
                const x2 = 130 + 106 * Math.cos(angle);
                const y2 = 130 + 106 * Math.sin(angle);
                return (
                  <line key={idx} x1={x1} y1={y1} x2={x2} y2={y2} stroke="rgba(255, 0, 60, 0.45)" strokeWidth="1.5" />
                );
              })}
              
              {/* Rotating tactical bracket sectors */}
              <circle cx="130" cy="130" r="90" fill="none" stroke="#ff003c" strokeWidth="1.5" strokeDasharray="30 150" className="hud-spin-ccw" />
              <circle cx="130" cy="130" r="85" fill="none" stroke="rgba(255,255,255,0.05)" strokeWidth="1" strokeDasharray="3 3" />
              
              {/* Core acquisition crosshairs */}
              <line x1="130" y1="15" x2="130" y2="85" stroke="rgba(255, 0, 60, 0.35)" strokeWidth="1" />
              <line x1="130" y1="175" x2="130" y2="245" stroke="rgba(255, 0, 60, 0.35)" strokeWidth="1" />
              <line x1="15" y1="130" x2="85" y2="130" stroke="rgba(255, 0, 60, 0.35)" strokeWidth="1" />
              <line x1="175" y1="130" x2="245" y2="130" stroke="rgba(255, 0, 60, 0.35)" strokeWidth="1" />
              
              {/* Corner Lock brackets */}
              <path d="M 85,95 L 85,85 L 95,85" fill="none" stroke="#ff003c" strokeWidth="2" />
              <path d="M 175,95 L 175,85 L 165,85" fill="none" stroke="#ff003c" strokeWidth="2" />
              <path d="M 85,165 L 85,175 L 95,175" fill="none" stroke="#ff003c" strokeWidth="2" />
              <path d="M 175,165 L 175,175 L 165,175" fill="none" stroke="#ff003c" strokeWidth="2" />
              
              {/* Radar Sweep Line */}
              <line x1="130" y1="130" x2="221" y2="78" stroke="rgba(255,0,60,0.4)" strokeWidth="1.5" className="hud-radar-scanner-sweep" style={{ transformOrigin: "130px 130px" }} />
              
              {/* Blinking signal tags */}
              <circle cx="210" cy="60" r="3" fill="#ff003c" className="hud-blink-fast" />
              <text x="218" y="57" fill="#ff003c" fontSize="8" fontFamily="monospace" fontWeight="bold" letterSpacing="0.05em">ACQ_LOCK</text>
              <text x="218" y="67" fill="rgba(255,255,255,0.4)" fontSize="8" fontFamily="monospace" letterSpacing="0.05em">RNG: 12.4M</text>
              
              <text x="35" y="210" fill="rgba(255,255,255,0.3)" fontSize="8" fontFamily="monospace" letterSpacing="0.05em">AZIMUTH: 184.22</text>
              <text x="35" y="220" fill="rgba(255,255,255,0.3)" fontSize="8" fontFamily="monospace" letterSpacing="0.05em">ELEV: -12.40</text>
            </svg>

            {/* Central Octagon container holding the VS label */}
            <div 
              className="font-orbitron"
              style={{
                width: "84px",
                height: "84px",
                background: "rgba(3, 3, 3, 0.95)",
                border: "2px solid #ff003c",
                display: "flex",
                justifyContent: "center",
                alignItems: "center",
                zIndex: 6,
                boxShadow: "0 0 30px rgba(255, 0, 60, 0.65)",
                clipPath: "polygon(20% 0%, 80% 0%, 100% 20%, 100% 80%, 80% 100%, 20% 100%, 0% 80%, 0% 20%)",
                position: "relative"
              }}
            >
              {/* Subtle inner grid outline */}
              <div style={{ position: "absolute", inset: "3px", border: "1px dashed rgba(255, 0, 60, 0.25)", clipPath: "polygon(20% 0%, 80% 0%, 100% 20%, 100% 80%, 80% 100%, 20% 100%, 0% 80%, 0% 20%)", pointerEvents: "none" }} />
              <span style={{ fontSize: "30px", color: "#ff003c", fontWeight: "900", textShadow: "0 0 10px #ff003c", letterSpacing: "-0.02em" }}>VS</span>
            </div>
          </div>

          <div style={{ textAlign: "center", width: "100%", display: "flex", flexDirection: "column", gap: "8px", fontFamily: "Rajdhani, sans-serif" }}>
            <div>
              <span className="font-orbitron" style={{ fontSize: "11px", color: "#8a8a8a", letterSpacing: "0.15em", fontWeight: 700 }}>TACTICAL ARENA</span>
              <div className="font-oxanium" style={{ fontSize: "14px", fontWeight: "bold", color: "#ffffff", letterSpacing: "0.08em" }}>WASTELAND COLISEUM</div>
            </div>
            
            <div>
              <span className="font-orbitron" style={{ fontSize: "11px", color: "#8a8a8a", letterSpacing: "0.15em", fontWeight: 700 }}>ESCROW RISK WAGER</span>
              
              {!matchActive ? (
                <div style={{ display: "flex", justifyContent: "center", gap: "6px", marginTop: "4px" }}>
                  {[10, 50, 100, 250].map(val => (
                    <button
                      key={val}
                      onClick={() => setThreatWager(val)}
                      style={{
                        background: threatWager === val ? "#ff003c" : "transparent",
                        border: `1px solid ${threatWager === val ? "#ff003c" : "rgba(255,255,255,0.15)"}`,
                        color: "#ffffff",
                        fontFamily: "monospace",
                        fontSize: "11px",
                        padding: "2px 8px",
                        cursor: "pointer"
                      }}
                    >
                      {val}T
                    </button>
                  ))}
                </div>
              ) : (
                <div className="font-oxanium" style={{ fontSize: "16px", fontWeight: "bold", color: "#ff003c", textShadow: "0 0 8px rgba(255, 0, 60, 0.5)" }}>{threatWager} $THREAT</div>
              )}
            </div>
          </div>

          {/* Action Portal */}
          <div style={{ width: "100%", padding: "0 16px", zIndex: 12 }}>
            {combatOutcome ? (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <div className="font-orbitron" style={{ fontSize: "14px", color: combatOutcome === "win" ? "#ffffff" : "#ff003c", fontWeight: "900", textAlign: "center", textShadow: "0 0 8px currentColor" }}>
                  {combatOutcome === "win" ? "🏆 ENCOUNTER VICTORY" : "💀 MAINFLOW DEACTIVATED"}
                </div>
                <button
                  onClick={resetEncounter}
                  className="hud-btn"
                  style={{ width: "100%", fontSize: "12px", padding: "12px" }}
                >
                  [ RETRY DUEL ]
                </button>
              </div>
            ) : !matchActive ? (
              <button
                onClick={triggerStartMatch}
                className="hud-btn"
                style={{ width: "100%", fontSize: "13px", padding: "14px" }}
              >
                [ INITIATE 1v1 ENCOUNTER ]
              </button>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
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

        {/* PLAYER B CONTROLS (RIGHT HUD) */}
        <div style={{ display: "flex", gap: "16px", alignItems: "center", height: "100%", justifyContent: "flex-end", position: "relative", zIndex: 3 }}>
          {/* Symmetrical Stats Panel */}
          <div className="hud-panel" style={{ flexGrow: 1, display: "flex", flexDirection: "column", justifyContent: "space-between", height: "100%", width: "260px", padding: "16px", background: "rgba(3, 3, 3, 0.28)", border: "1px solid rgba(255, 255, 255, 0.04)", backdropFilter: "blur(3px)" }}>
            <div style={{ textAlign: "right" }}>
              <div>
                <div className="font-orbitron" style={{ fontSize: "20px", fontWeight: "900", color: "#ffffff" }}>
                  DESGECEAN
                </div>
              </div>
              
              <div className="font-rajdhani" style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "#8a8a8a", marginTop: "8px", letterSpacing: "0.12em", fontWeight: 700 }}>
                <span>RANK: SURVIVOR</span>
                <span>RATING: 1732</span>
              </div>
            </div>

            {/* Segmented HP Block */}
            <div style={{ margin: "14px 0" }}>
              <div className="font-rajdhani" style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", marginBottom: "6px", color: "#8a8a8a", letterSpacing: "0.12em", fontWeight: 700 }}>
                <span>HP CAPACITY</span>
                <span style={{ color: "#ffffff" }}>{opponentHp} / {opponentMaxHp}</span>
              </div>
              <div style={{ display: "flex", gap: "2.5px" }}>
                {Array.from({ length: 18 }).map((_, i) => {
                  const blockVal = (opponentMaxHp / 18) * (i + 1);
                  const isActive = opponentHp >= blockVal;
                  return (
                    <div
                      key={i}
                      style={{
                        height: "9px",
                        flexGrow: 1,
                        background: isActive ? "#ffffff" : "rgba(255,255,255,0.04)",
                        border: "1px solid #000000",
                        boxShadow: isActive ? "0 0 5px rgba(255, 255, 255, 0.4)" : "none"
                      }}
                    />
                  );
                })}
              </div>
              {opponentStatus.length > 0 && (
                <div style={{ display: "flex", gap: "4px", marginTop: "6px", justifyContent: "flex-end" }}>
                  {opponentStatus.map((s, idx) => (
                    <span key={idx} style={{ border: "1px solid #ffffff", color: "#ffffff", fontSize: "9px", fontFamily: "monospace", padding: "0px 4px", fontWeight: "bold" }}>
                      {s}
                    </span>
                  ))}
                </div>
              )}
            </div>

            {/* Faction attributes */}
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              <StatBar label="ATTACK" value={opponentStats.attack} max={100} color="#8a8a8a" />
              <StatBar label="DEFENSE" value={opponentStats.defense} max={100} color="#8a8a8a" />
              <StatBar label="AGILITY" value={opponentStats.agility} max={100} color="#8a8a8a" />
              <StatBar label="INTELLECT" value={opponentStats.intellect} max={100} color="#8a8a8a" />
              <StatBar label="LUCK" value={opponentStats.luck} max={100} color="#8a8a8a" />
            </div>

            {/* Attack targeting mannequin */}
            <div style={{ marginTop: "12px" }}>
              <TargetingMannequin
                type="ATTACK"
                selectedLimb={selectedAttack}
                onSelectLimb={setSelectedAttack}
                accentColor="#ff003c"
              />
            </div>
          </div>

          {/* Inventory stacked on far right */}
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <InventorySlot icon={<HelmetIcon />} color="#8a8a8a" />
            <InventorySlot icon={<ArmorIcon />} color="#8a8a8a" />
            <InventorySlot icon={<WeaponIcon />} color="#8a8a8a" />
            <InventorySlot icon={<PantsIcon />} color="#8a8a8a" />
            <InventorySlot icon={<BootsIcon />} color="#8a8a8a" />
          </div>
        </div>

      </main>

      {/* BOTTOM FLOATING PANELS */}
      <footer style={{ display: "grid", gridTemplateColumns: "1.15fr 1fr 1.15fr", gap: "16px", minHeight: "190px", maxHeight: "210px", position: "relative", zIndex: 20 }}>
        
        {/* Chat Card (transparent) */}
        <div className="hud-panel" style={{ border: "1px solid rgba(255, 0, 60, 0.08)", background: "rgba(3, 3, 3, 0.35)", padding: "12px", display: "flex", flexDirection: "column", justifyContent: "space-between", backdropFilter: "blur(4px)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(255, 0, 60, 0.08)", paddingBottom: "4px", marginBottom: "8px" }}>
            <span className="font-orbitron" style={{ fontSize: "11px", color: "#ff003c", fontWeight: "bold", letterSpacing: "0.15em" }}>
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

          <form onSubmit={handleSendChat} style={{ display: "flex", border: "1px solid rgba(255,0,60,0.2)", background: "#050505" }}>
            <input
              type="text"
              value={chatInput}
              onChange={(e) => setChatInput(e.target.value)}
              placeholder="TYPE TRANSMISSION..."
              style={{ flexGrow: 1, background: "transparent", border: "none", color: "#ffffff", fontFamily: "monospace", fontSize: "11px", padding: "6px 8px", outline: "none", textTransform: "uppercase" }}
            />
          </form>
        </div>

        {/* Mutators Card (transparent) */}
        <div className="hud-panel" style={{ border: "1px solid rgba(255, 0, 60, 0.08)", background: "rgba(3, 3, 3, 0.35)", padding: "12px", display: "flex", flexDirection: "column", gap: "6px", backdropFilter: "blur(4px)" }}>
          <span className="font-orbitron" style={{ fontSize: "11px", color: "#8a8a8a", fontWeight: "bold", letterSpacing: "0.1em", borderBottom: "1px solid rgba(255, 0, 60, 0.08)", paddingBottom: "4px" }}>
            ENVIRONMENT MUTATORS
          </span>
          
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px", flexGrow: 1, minHeight: "0" }}>
            <div 
              onClick={() => !matchActive && setToxicFogActive(!toxicFogActive)}
              style={{ 
                border: `1px solid ${toxicFogActive ? "#ff003c" : "rgba(255, 255, 255, 0.08)"}`, 
                background: toxicFogActive ? "rgba(255, 0, 60, 0.08)" : "rgba(5, 5, 5, 0.6)", 
                padding: "6px", 
                display: "flex", 
                flexDirection: "column", 
                justifyContent: "space-between", 
                cursor: matchActive ? "not-allowed" : "pointer"
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                <span style={{ color: "#ff003c", fontSize: "11px" }}>💀</span>
                <div className="font-rajdhani" style={{ fontSize: "10px", fontWeight: "bold", color: "#ffffff" }}>TOXIC FOG</div>
              </div>
              <span className="font-oxanium" style={{ fontSize: "11px", color: "#ff003c", fontWeight: "bold" }}>-10% HP REGEN</span>
            </div>

            <div 
              onClick={() => !matchActive && setScarceAmmoActive(!scarceAmmoActive)}
              style={{ 
                border: `1px solid ${scarceAmmoActive ? "#ff003c" : "rgba(255, 255, 255, 0.08)"}`, 
                background: scarceAmmoActive ? "rgba(255, 0, 60, 0.08)" : "rgba(5, 5, 5, 0.6)", 
                padding: "6px", 
                display: "flex", 
                flexDirection: "column", 
                justifyContent: "space-between", 
                cursor: matchActive ? "not-allowed" : "pointer"
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                <span style={{ color: "#ff003c", fontSize: "11px" }}>🛡️</span>
                <div className="font-rajdhani" style={{ fontSize: "10px", fontWeight: "bold", color: "#ffffff" }}>SCARCE AMMO</div>
              </div>
              <span className="font-oxanium" style={{ fontSize: "11px", color: "#ff003c", fontWeight: "bold" }}>-15% DAMAGE</span>
            </div>

            <div 
              onClick={() => !matchActive && setElectroSurgeActive(!electroSurgeActive)}
              style={{ 
                border: `1px solid ${electroSurgeActive ? "#ff003c" : "rgba(255, 255, 255, 0.08)"}`, 
                background: electroSurgeActive ? "rgba(255, 0, 60, 0.08)" : "rgba(5, 5, 5, 0.6)", 
                padding: "6px", 
                display: "flex", 
                flexDirection: "column", 
                justifyContent: "space-between", 
                cursor: matchActive ? "not-allowed" : "pointer"
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                <span style={{ color: "#ff003c", fontSize: "11px" }}>⚡</span>
                <div className="font-rajdhani" style={{ fontSize: "10px", fontWeight: "bold", color: "#ffffff" }}>ELECTRO SURGE</div>
              </div>
              <span className="font-oxanium" style={{ fontSize: "11px", color: "#ff003c", fontWeight: "bold" }}>+10% AGILITY</span>
            </div>

            <div 
              onClick={() => !matchActive && setDataBreachActive(!dataBreachActive)}
              style={{ 
                border: `1px solid ${dataBreachActive ? "#ff003c" : "rgba(255, 255, 255, 0.08)"}`, 
                background: dataBreachActive ? "rgba(255, 0, 60, 0.08)" : "rgba(5, 5, 5, 0.6)", 
                padding: "6px", 
                display: "flex", 
                flexDirection: "column", 
                justifyContent: "space-between", 
                cursor: matchActive ? "not-allowed" : "pointer"
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                <span style={{ color: "#ff003c", fontSize: "11px" }}>🔒</span>
                <div className="font-rajdhani" style={{ fontSize: "10px", fontWeight: "bold", color: "#ffffff" }}>DATA BREACH</div>
              </div>
              <span className="font-oxanium" style={{ fontSize: "11px", color: "#ff003c", fontWeight: "bold" }}>-5% INTELLECT</span>
            </div>
          </div>
        </div>

        {/* Combat Log Card (transparent) */}
        <div className="hud-panel" style={{ border: "1px solid rgba(255, 0, 60, 0.08)", background: "rgba(3, 3, 3, 0.35)", padding: "12px", display: "flex", flexDirection: "column", justifyContent: "space-between", backdropFilter: "blur(4px)" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(255, 0, 60, 0.08)", paddingBottom: "4px", marginBottom: "8px" }}>
            <span className="font-orbitron" style={{ fontSize: "11px", color: "#8a8a8a", fontWeight: "bold", letterSpacing: "0.1em" }}>
              TACTICAL BATTLE LOGS
            </span>
          </div>

          <div className="hud-scrollbar" style={{ overflowY: "auto", flexGrow: 1, fontSize: "12px", display: "flex", flexDirection: "column", gap: "4px", paddingRight: "4px", fontFamily: "monospace" }}>
            {battleLogs.map((log, i) => (
              <div key={i} style={{ lineHeight: "1.3" }}>
                <span style={{ color: "rgba(255,255,255,0.25)", marginRight: "6px" }}>[{log.time}]</span>
                <span style={{
                  color: log.color ? log.color :
                         log.sender === profileName ? "#ffffff" : 
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
