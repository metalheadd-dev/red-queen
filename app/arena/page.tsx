"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/components/AuthProvider";
import { useWallet } from "@solana/wallet-adapter-react";
import Link from "next/link";
import OnboardingBriefing from "@/components/OnboardingBriefing";

type Limb = "HEAD" | "TORSO" | "ARMS" | "LEGS";

interface Message {
  time: string;
  sender: string;
  text: string;
  color?: string;
}

// ─── HP BAR (segmented) ──────────────────────────────────────────────────────
function HpBar({ hp, maxHp, color }: { hp: number; maxHp: number; color: string }) {
  return (
    <div style={{ width: "100%" }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontFamily: "Rajdhani, sans-serif", fontSize: "10px", color: color, letterSpacing: "0.12em", fontWeight: 700, marginBottom: "3px" }}>
        <span>VITALITY_CORE</span>
        <span style={{ color: "#fff" }}>{hp} / {maxHp} HP</span>
      </div>
      <div style={{ display: "flex", gap: "2px" }}>
        {Array.from({ length: 20 }).map((_, i) => {
          const threshold = (maxHp / 20) * (i + 1);
          const active = hp >= threshold;
          return (
            <div key={i} style={{
              height: "4px", flexGrow: 1,
              background: active ? color : "rgba(255,255,255,0.03)",
              boxShadow: active ? `0 0 6px ${color}88` : "none",
              transition: "background 0.5s cubic-bezier(0.16, 1, 0.3, 1), box-shadow 0.5s cubic-bezier(0.16, 1, 0.3, 1)"
            }} />
          );
        })}
      </div>
    </div>
  );
}

// ─── SVG ICONS ───────────────────────────────────────────────────────────────
const IconHead = ({ color }: { color: string }) => (
  <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
    <polygon points="8,1 14,5 14,11 8,15 2,11 2,5" stroke={color} strokeWidth="1.2" fill="none" />
    <circle cx="8" cy="8" r="1.5" fill={color} />
  </svg>
);
const IconTorso = ({ color }: { color: string }) => (
  <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
    <rect x="3" y="2" width="10" height="12" stroke={color} strokeWidth="1.2" fill="none" />
    <line x1="3" y1="6" x2="13" y2="6" stroke={color} strokeWidth="0.8" />
  </svg>
);
const IconArms = ({ color }: { color: string }) => (
  <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
    <line x1="1" y1="8" x2="15" y2="8" stroke={color} strokeWidth="1.2" />
    <polyline points="4,5 1,8 4,11" stroke={color} strokeWidth="1.2" fill="none" />
  </svg>
);
const IconLegs = ({ color }: { color: string }) => (
  <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
    <line x1="8" y1="1" x2="8" y2="8" stroke={color} strokeWidth="1.2" />
    <line x1="8" y1="8" x2="4" y2="15" stroke={color} strokeWidth="1.2" />
    <line x1="8" y1="8" x2="12" y2="15" stroke={color} strokeWidth="1.2" />
  </svg>
);
const IconSword = ({ color, size = 14 }: { color: string; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
    <line x1="2" y1="14" x2="12" y2="4" stroke={color} strokeWidth="1.2" />
    <polyline points="10,2 14,2 14,6" stroke={color} strokeWidth="1.2" fill="none" />
  </svg>
);
const IconShield = ({ color, size = 14 }: { color: string; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
    <path d="M8 2 L14 5 L14 9 C14 12 8 15 8 15 C8 15 2 12 2 9 L2 5 Z" stroke={color} strokeWidth="1.2" fill="none" />
  </svg>
);
const IconSkull = ({ color, size = 12 }: { color: string; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
    <path d="M8 2C4.5 2 2 4.5 2 7.5C2 10 3.5 11.5 4 12L4 14L12 14L12 12C12.5 11.5 14 10 14 7.5C14 4.5 11.5 2 8 2Z" stroke={color} strokeWidth="1" fill="none" />
    <circle cx="6" cy="8" r="0.8" fill={color} />
    <circle cx="10" cy="8" r="0.8" fill={color} />
  </svg>
);
const IconBolt = ({ color, size = 12 }: { color: string; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
    <polyline points="10,2 5,9 9,9 6,14" stroke={color} strokeWidth="1.2" fill="none" />
  </svg>
);
const IconLock = ({ color, size = 12 }: { color: string; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
    <rect x="3" y="8" width="10" height="7" stroke={color} strokeWidth="1" fill="none" />
    <path d="M5 8V6C5 4 11 4 11 6V8" stroke={color} strokeWidth="1" fill="none" />
  </svg>
);
const IconAmmo = ({ color, size = 12 }: { color: string; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
    <rect x="6" y="3" width="4" height="10" rx="1" stroke={color} strokeWidth="1" fill="none" />
    <rect x="6" y="1" width="4" height="3" fill={color} />
  </svg>
);
const IconDot = ({ color, size = 6 }: { color: string; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 8 8" fill="none">
    <circle cx="4" cy="4" r="2" fill={color} />
  </svg>
);
const IconStar = ({ color, size = 8 }: { color: string; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
    <polygon points="8,1 10,6 15,6 11,10 13,15 8,12 3,15 5,10 1,6 6,6" fill={color} />
  </svg>
);
const IconSend = ({ color }: { color: string }) => (
  <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><polyline points="2,8 14,8" stroke={color} strokeWidth="1.2"/><polyline points="10,4 14,8 10,12" stroke={color} strokeWidth="1.2" fill="none"/></svg>
);
const IconVictory = ({ color }: { color: string }) => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><polyline points="2,8 6,12 14,4" stroke={color} strokeWidth="1.8" fill="none"/></svg>
);
const IconRetry = ({ color }: { color: string }) => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M3 8C3 5 5.5 3 8 3C10.5 3 13 5 13 8" stroke={color} strokeWidth="1.2" fill="none"/><polyline points="1,6 3,8 5,6" stroke={color} strokeWidth="1.2" fill="none"/><path d="M13 8C13 11 10.5 13 8 13C5.5 13 3 11 3 8" stroke={color} strokeWidth="1.2" fill="none"/></svg>
);
const IconCrosshair = ({ color, size = 14 }: { color: string; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
    <circle cx="8" cy="8" r="5" stroke={color} strokeWidth="1" fill="none" />
    <line x1="8" y1="1" x2="8" y2="4" stroke={color} strokeWidth="1" />
    <line x1="8" y1="12" x2="8" y2="15" stroke={color} strokeWidth="1" />
    <line x1="1" y1="8" x2="4" y2="8" stroke={color} strokeWidth="1" />
    <line x1="12" y1="8" x2="15" y2="8" stroke={color} strokeWidth="1" />
    <circle cx="8" cy="8" r="1" fill={color} />
  </svg>
);

// ─── LIMB SELECTOR (HUD Overlays) ────────────────────────────────────────────
function LimbSelector({
  label,
  selected,
  onSelect,
  accentColor,
  disabled,
}: {
  label: string;
  selected: Limb | null;
  onSelect: (l: Limb) => void;
  accentColor: string;
  disabled?: boolean;
}) {
  const limbs: { key: Limb; Icon: React.FC<{ color: string }> }[] = [
    { key: "HEAD", Icon: IconHead },
    { key: "TORSO", Icon: IconTorso },
    { key: "ARMS", Icon: IconArms },
    { key: "LEGS", Icon: IconLegs },
  ];

  return (
    <div style={{ width: "100%" }}>
      <div style={{ fontFamily: "Orbitron, sans-serif", fontSize: "8px", letterSpacing: "0.15em", color: "rgba(255,255,255,0.45)", marginBottom: "6px", fontWeight: 700, textAlign: "left" }}>
        {label}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px" }}>
        {limbs.map((l) => {
          const isActive = selected === l.key;
          const iconColor = isActive ? accentColor : "rgba(255,255,255,0.3)";
          return (
            <button
              key={l.key}
              onClick={() => !disabled && onSelect(l.key)}
              style={{
                background: isActive ? `${accentColor}1c` : "rgba(0,0,0,0.6)",
                border: `1px solid ${isActive ? accentColor : "rgba(255,255,255,0.06)"}`,
                color: isActive ? "#ffffff" : "rgba(255,255,255,0.4)",
                fontFamily: "Rajdhani, sans-serif",
                fontSize: "10px",
                fontWeight: 700,
                letterSpacing: "0.05em",
                padding: "5px 2px",
                cursor: disabled ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "6px",
                transition: "all 0.12s ease",
                textTransform: "uppercase",
                boxShadow: isActive ? `0 0 10px ${accentColor}33` : "none",
              }}
            >
              <l.Icon color={iconColor} />
              <span>{l.key}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── SEED CHAT DATA ──────────────────────────────────────────────────────────
const SEED_CHAT: Message[] = [
  { time: "22:51", sender: "REDQUEEN_X", text: "LET'S SEE IF YOU CAN KEEP UP.", color: "#ff003c" },
  { time: "22:51", sender: "DESGECEAN", text: "ALWAYS READY." },
  { time: "22:52", sender: "REDQUEEN_X", text: "NO MERCY.", color: "#ff003c" },
  { time: "22:52", sender: "DESGECEAN", text: "BRING IT." },
  { time: "22:52", sender: "SYSTEM", text: "MATCH FOUND. PREPARING ARENA...", color: "#ff8800" },
];

const getLimbStyle = (limb: Limb, side: "left" | "right") => {
  const positions: Record<Limb, { x: string; bottom: string }> = {
    HEAD:  { x: "18vw", bottom: "72vh" },
    TORSO: { x: "20vw", bottom: "48vh" },
    ARMS:  { x: "15vw", bottom: "46vh" },
    LEGS:  { x: "20vw", bottom: "20vh" },
  };
  const pos = positions[limb];
  return {
    position: "absolute" as const,
    bottom: pos.bottom,
    [side]: pos.x,
    zIndex: 25,
    transform: "translate(-50%, 50%)",
    pointerEvents: "none" as const,
  };
};

function CombatNode({
  limb,
  side,
  flash,
  popup,
}: {
  limb: Limb;
  side: "left" | "right";
  flash: { limb: Limb; type: "hit" | "block" | "miss" } | null;
  popup: { text: string; limb: Limb } | null;
}) {
  const isFlashActive = flash?.limb === limb;
  const isPopupActive = popup?.limb === limb;

  const style = getLimbStyle(limb, side);
  
  let flashColor = "transparent";
  let shadowColor = "transparent";
  if (isFlashActive) {
    if (flash.type === "hit") {
      flashColor = "rgba(255, 0, 60, 0.95)";
      shadowColor = "rgba(255, 0, 60, 0.8)";
    } else if (flash.type === "block") {
      flashColor = "rgba(0, 170, 255, 0.95)";
      shadowColor = "rgba(0, 170, 255, 0.8)";
    } else {
      flashColor = "rgba(150, 150, 150, 0.8)";
      shadowColor = "rgba(150, 150, 150, 0.5)";
    }
  }

  return (
    <div style={style}>
      <div style={{
        width: "16px",
        height: "16px",
        border: "1px solid rgba(255, 255, 255, 0.25)",
        borderRadius: "50%",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        position: "relative"
      }}>
        <div style={{
          width: "4px",
          height: "4px",
          borderRadius: "50%",
          background: side === "left" ? "#ff003c" : "#00aaff"
        }} />
        
        <span style={{
          position: "absolute",
          left: side === "left" ? "20px" : "auto",
          right: side === "right" ? "20px" : "auto",
          fontFamily: "JetBrains Mono, monospace",
          fontSize: "8px",
          color: "rgba(255,255,255,0.45)",
          whiteSpace: "nowrap",
          fontWeight: 700
        }}>
          {limb[0]}_{side === "left" ? "PL" : "OP"}
        </span>

        {isFlashActive && (
          <div style={{
            position: "absolute",
            width: "60px",
            height: "60px",
            borderRadius: "50%",
            background: "transparent",
            border: `3px solid ${flashColor}`,
            boxShadow: `0 0 25px ${shadowColor}`,
            animation: "combat-node-flash 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards",
          }} />
        )}
      </div>

      {isPopupActive && (
        <div style={{
          position: "absolute",
          top: "-35px",
          left: "50%",
          transform: "translateX(-50%)",
          fontFamily: "Orbitron, sans-serif",
          fontSize: popup.text.includes("CRIT") ? "12px" : "10px",
          fontWeight: 900,
          color: popup.text.startsWith("-") 
            ? (popup.text.includes("CRIT") ? "#ff003c" : "#ff8800") 
            : (popup.text.includes("BLOCK") ? "#00aaff" : "rgba(255,255,255,0.5)"),
          textShadow: popup.text.startsWith("-") ? "0 0 10px rgba(255, 0, 60, 0.6)" : "none",
          whiteSpace: "nowrap",
          animation: "combat-damage-rise 1.2s cubic-bezier(0.16, 1, 0.3, 1) forwards",
          zIndex: 100
        }}>
          {popup.text}
        </div>
      )}
    </div>
  );
}

// ─── MAIN ARENA PAGE ─────────────────────────────────────────────────────────
export default function ArenaPage() {
  const { authIdentifier } = useAuth();
  const { publicKey } = useWallet();
  const wallet = authIdentifier || (publicKey ? publicKey.toString() : null);

  const [profileName, setProfileName] = useState<string>("RED QUEEN ADMIN");

  // Match state
  const [matchActive, setMatchActive] = useState(false);
  const [countdown, setCountdown] = useState(12);
  const [playerHp, setPlayerHp] = useState(174);
  const [playerMaxHp] = useState(174);
  const [opponentHp, setOpponentHp] = useState(154);
  const [opponentMaxHp] = useState(183);
  const [threatWager, setThreatWager] = useState(10);
  const [playerStatus, setPlayerStatus] = useState<string[]>([]);
  const [opponentStatus, setOpponentStatus] = useState<string[]>([]);
  const [selectedAttack, setSelectedAttack] = useState<Limb | null>(null);
  const [selectedDefense, setSelectedDefense] = useState<Limb | null>(null);
  const [shakeTrigger, setShakeTrigger] = useState(false);
  const [combatOutcome, setCombatOutcome] = useState<"win" | "lose" | null>(null);

  // Gamification state hooks
  const [playerFlash, setPlayerFlash] = useState<{ limb: Limb; type: "hit" | "block" | "miss" } | null>(null);
  const [opponentFlash, setOpponentFlash] = useState<{ limb: Limb; type: "hit" | "block" | "miss" } | null>(null);
  const [playerPopup, setPlayerPopup] = useState<{ text: string; limb: Limb } | null>(null);
  const [opponentPopup, setOpponentPopup] = useState<{ text: string; limb: Limb } | null>(null);

  const [toxicFogActive, setToxicFogActive] = useState(true);
  const [scarceAmmoActive, setScarceAmmoActive] = useState(true);
  const [electroSurgeActive, setElectroSurgeActive] = useState(true);
  const [dataBreachActive, setDataBreachActive] = useState(true);

  const playerStats = { attack: 68, defense: 42, agility: 57, intellect: 71, luck: 33 };
  const opponentStats = { attack: 64, defense: 49, agility: 52, intellect: 63, luck: 27 };

  const [chatMessages, setChatMessages] = useState<Message[]>([]);
  const [chatInput, setChatInput] = useState("");
  const [battleLogs, setBattleLogs] = useState<Message[]>([
    { time: "22:48", sender: "SYSTEM", text: "DESGECEAN joined the arena" },
    { time: "22:48", sender: "SYSTEM", text: "REDQUEEN_X joined the arena" },
    { time: "22:48", sender: "SYSTEM", text: `Bet locked: 10 THREAT` },
    { time: "22:48", sender: "SYSTEM", text: "Match type: Ranked 1v1" },
    { time: "22:49", sender: "SYSTEM", text: "Arena: Wasteland Coliseum" },
    { time: "22:49", sender: "SYSTEM", text: "Preparing combat protocols..." },
  ]);

  const [terminalOpen, setTerminalOpen] = useState(false);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const logEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!wallet) return;
    fetch(`/api/profile?wallet=${wallet}`)
      .then(r => r.json())
      .then(d => {
        if (d?.profile) {
          const n = d.profile.apocalyptic_name || d.profile.apoptotic_name || `OPERATIVE_${wallet.slice(0, 6)}`;
          setProfileName(n.toUpperCase());
        }
      })
      .catch(() => setProfileName(`OPERATIVE_${wallet.slice(0, 6)}`.toUpperCase()));
  }, [wallet]);

  useEffect(() => {
    const cached = typeof window !== "undefined" && localStorage.getItem("redqueen_arena_fighter_chat");
    if (cached) {
      try { setChatMessages(JSON.parse(cached)); } catch { setChatMessages(SEED_CHAT); }
    } else {
      setChatMessages(SEED_CHAT);
      localStorage.setItem("redqueen_arena_fighter_chat", JSON.stringify(SEED_CHAT));
    }
  }, []);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [chatMessages]);
  useEffect(() => { logEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [battleLogs]);

  useEffect(() => {
    if (countdown > 0 && !matchActive) {
      const t = setTimeout(() => setCountdown(p => p - 1), 1000);
      return () => clearTimeout(t);
    } else if (countdown === 0 && !matchActive) {
      startMatch();
    }
  }, [countdown, matchActive]);

  const startMatch = () => {
    setMatchActive(true);
    setPlayerHp(174); setOpponentHp(154);
    setCombatOutcome(null); setSelectedAttack(null); setSelectedDefense(null);
    setPlayerStatus([]); setOpponentStatus([]);
    const t = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    setBattleLogs(p => [...p, { time: t, sender: "SYSTEM", text: "[COMBAT] ENGAGED. TACTICAL DIRECTIVES ACTIVE." }]);
  };

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    const t = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const msg: Message = { time: t, sender: profileName, text: chatInput.toUpperCase(), color: "#ff003c" };
    const updated = [...chatMessages, msg];
    setChatMessages(updated);
    setChatInput("");
    localStorage.setItem("redqueen_arena_fighter_chat", JSON.stringify(updated));
    setTimeout(() => {
      const replies = [
        "YOUR SHIELD CALIBRATION IS TOO LOW.",
        "PREPARE COGNITIVE DISSOLUTION.",
        "MY HUD DETECTED YOUR SHIELD SHIFT.",
        "CHECK YOUR LIMB INTEGRITY. EXPOSURE IMMINENT.",
      ];
      const opp: Message = { time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }), sender: "DESGECEAN", text: replies[Math.floor(Math.random() * replies.length)] };
      const final = [...updated, opp];
      setChatMessages(final);
      localStorage.setItem("redqueen_arena_fighter_chat", JSON.stringify(final));
    }, 1200);
  };

  const executeCombatRound = () => {
    if (!selectedAttack || !selectedDefense || combatOutcome) return;
    setShakeTrigger(true);
    setTimeout(() => setShakeTrigger(false), 400);

    const t = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const logs: Message[] = [];
    const limbs: Limb[] = ["HEAD", "TORSO", "ARMS", "LEGS"];
    const oppAtk = limbs[Math.floor(Math.random() * 4)];
    const oppDef = limbs[Math.floor(Math.random() * 4)];

    const dmgMult = scarceAmmoActive ? 0.85 : 1.0;

    // Player attacks
    const atkConfig: Record<Limb, { chance: number; base: number }> = {
      HEAD: { chance: 0.35, base: 50 },
      TORSO: { chance: 0.85, base: 24 },
      ARMS: { chance: 0.55, base: 28 },
      LEGS: { chance: 1.0, base: 14 },
    };
    let pHitChance = atkConfig[selectedAttack].chance * ((playerStats.agility * (electroSurgeActive ? 1.1 : 1.0)) / opponentStats.agility);
    const oppBlocked = oppDef === selectedAttack;
    if (oppBlocked) pHitChance *= 0.25;

    let pFlashType: "hit" | "block" | "miss" = "miss";
    let pPopupText = "MISS";

    let oppHpNext = opponentHp;
    if (Math.random() <= pHitChance) {
      let dmg = Math.round(atkConfig[selectedAttack].base * (playerStats.attack / opponentStats.defense) * (0.9 + Math.random() * 0.2) * dmgMult);
      if (oppBlocked) {
        dmg = Math.round(dmg * 0.15);
        logs.push({ time: t, sender: "SYSTEM", text: `BLOCKED! Opponent deflected 85% on [${selectedAttack}]. Dealt ${dmg} dmg.` });
        pFlashType = "block";
        pPopupText = `BLOCK (${dmg})`;
      } else {
        const isCrit = Math.random() <= playerStats.luck / 100;
        if (isCrit) {
          dmg = Math.round(dmg * 1.5);
          logs.push({ time: t, sender: profileName, text: `[CRIT] Struck [${selectedAttack}] for ${dmg} dmg.`, color: "#ff003c" });
          pPopupText = `-${dmg} CRIT`;
        } else {
          logs.push({ time: t, sender: profileName, text: `Hit [${selectedAttack}] for ${dmg} dmg.` });
          pPopupText = `-${dmg}`;
        }
        pFlashType = "hit";
        if (selectedAttack === "HEAD" && Math.random() > 0.4) setOpponentStatus(p => [...p, "GLITCHED"]);
        if (selectedAttack === "TORSO" && Math.random() > 0.4) setOpponentStatus(p => [...p, "BLEEDING"]);
        if (selectedAttack === "LEGS" && Math.random() > 0.4) setOpponentStatus(p => [...p, "SLOWED"]);
      }
      oppHpNext = Math.max(0, opponentHp - dmg);
      setOpponentHp(oppHpNext);
    } else {
      logs.push({ time: t, sender: "SYSTEM", text: `Strike on [${selectedAttack}] evaded.` });
      pFlashType = "miss";
      pPopupText = "EVADED";
    }

    setOpponentFlash({ limb: selectedAttack, type: pFlashType });
    setOpponentPopup({ text: pPopupText, limb: selectedAttack });

    // Opponent attacks
    let oHitChance = atkConfig[oppAtk].chance * (opponentStats.agility / (playerStats.agility * (electroSurgeActive ? 1.1 : 1.0)));
    const playerBlocked = selectedDefense === oppAtk;
    if (playerBlocked) oHitChance *= 0.25;

    let oFlashType: "hit" | "block" | "miss" = "miss";
    let oPopupText = "MISS";

    let plyHpNext = playerHp;
    if (Math.random() <= oHitChance) {
      let dmg = Math.round(atkConfig[oppAtk].base * (opponentStats.attack / playerStats.defense) * (0.9 + Math.random() * 0.2) * dmgMult);
      if (playerBlocked) {
        dmg = Math.round(dmg * 0.15);
        logs.push({ time: t, sender: "SYSTEM", text: `DEFLECTED! Blocked [${oppAtk}]. Absorbed 85% (took ${dmg}).`, color: "#ffffff" });
        oFlashType = "block";
        oPopupText = `BLOCKED (${dmg})`;
      } else {
        const isCrit = Math.random() <= opponentStats.luck / 100;
        if (isCrit) {
          dmg = Math.round(dmg * 1.5);
          logs.push({ time: t, sender: "DESGECEAN", text: `[CRIT] Struck your [${oppAtk}] for ${dmg} dmg.`, color: "#ff003c" });
          oPopupText = `-${dmg} CRIT`;
        } else {
          logs.push({ time: t, sender: "DESGECEAN", text: `Hit your [${oppAtk}] for ${dmg} dmg.` });
          oPopupText = `-${dmg}`;
        }
        oFlashType = "hit";
        if (oppAtk === "HEAD" && Math.random() > 0.4) setPlayerStatus(p => [...p, "GLITCHED"]);
        if (oppAtk === "TORSO" && Math.random() > 0.4) setPlayerStatus(p => [...p, "BLEEDING"]);
        if (oppAtk === "LEGS" && Math.random() > 0.4) setPlayerStatus(p => [...p, "SLOWED"]);
      }
      plyHpNext = Math.max(0, playerHp - dmg);
      setPlayerHp(plyHpNext);
    } else {
      logs.push({ time: t, sender: "SYSTEM", text: `Enemy strike on [${oppAtk}] missed.` });
      oFlashType = "miss";
      oPopupText = "EVADED";
    }

    setPlayerFlash({ limb: oppAtk, type: oFlashType });
    setPlayerPopup({ text: oPopupText, limb: oppAtk });

    // Reset animations after 1.2s
    setTimeout(() => {
      setPlayerFlash(null);
      setOpponentFlash(null);
      setPlayerPopup(null);
      setOpponentPopup(null);
    }, 1200);

    // Toxic fog DoT
    if (toxicFogActive) {
      plyHpNext = Math.max(0, plyHpNext - 5);
      oppHpNext = Math.max(0, oppHpNext - 5);
      setPlayerHp(plyHpNext); setOpponentHp(oppHpNext);
      logs.push({ time: t, sender: "SYSTEM", text: "[FOG] Toxic Fog: Both took 5 decay damage.", color: "#ff8800" });
    }
    if (playerStatus.includes("BLEEDING")) { plyHpNext = Math.max(0, plyHpNext - 5); setPlayerHp(plyHpNext); }
    if (opponentStatus.includes("BLEEDING")) { oppHpNext = Math.max(0, oppHpNext - 5); setOpponentHp(oppHpNext); }

    if (oppHpNext <= 0 && plyHpNext <= 0) {
      setCombatOutcome("lose"); setMatchActive(false);
      logs.push({ time: t, sender: "SYSTEM", text: "[ERASURE] MUTUAL ELIMINATION.", color: "#ff003c" });
    } else if (oppHpNext <= 0) {
      setCombatOutcome("win"); setMatchActive(false);
      logs.push({ time: t, sender: "SYSTEM", text: `[VICTORY] +${threatWager} $THREAT recouped.`, color: "#ffffff" });
    } else if (plyHpNext <= 0) {
      setCombatOutcome("lose"); setMatchActive(false);
      logs.push({ time: t, sender: "SYSTEM", text: `[DEFEAT] Burned ${threatWager} $THREAT.`, color: "#ff003c" });
    }

    setBattleLogs(p => [...p, ...logs]);
    setSelectedAttack(null);
    setSelectedDefense(null);
  };

  const resetEncounter = () => {
    setPlayerHp(174); setOpponentHp(154);
    setSelectedAttack(null); setSelectedDefense(null);
    setPlayerStatus([]); setOpponentStatus([]);
    setCombatOutcome(null); setMatchActive(false); setCountdown(12);
    setBattleLogs([{ time: "00:00", sender: "SYSTEM", text: "ENCOUNTER RESET. ESCROW RELOADED." }]);
  };

  const canFight = matchActive && selectedAttack && selectedDefense && !combatOutcome;

  const getReticleRotation = () => {
    switch (selectedAttack) {
      case "HEAD": return 45;
      case "TORSO": return 135;
      case "ARMS": return 225;
      case "LEGS": return 315;
      default: return 0;
    }
  };

  return (
    <div
      id="game-arena-root"
      className={shakeTrigger ? "hud-screen-shake" : ""}
      style={{
        background: "#030303",
        minHeight: "100vh",
        height: "100vh",
        color: "#ffffff",
        fontFamily: "Rajdhani, sans-serif",
        position: "relative",
        boxSizing: "border-box",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
    >
      
      {/* Subtle Coordinate Dotted Grid Lattice Background */}
      <div style={{
        position: "absolute",
        inset: 0,
        backgroundImage: "radial-gradient(rgba(255, 255, 255, 0.03) 1px, transparent 1px)",
        backgroundSize: "40px 40px",
        pointerEvents: "none",
        zIndex: 0
      }} />

      {/* Seamless Fog/Glow Blends (Left Crimson Warning Glow, Right Cold Tactical Blue) */}
      <div style={{ position: "absolute", top: 0, left: 0, width: "60%", height: "100%", background: "radial-gradient(circle at 10% 60%, rgba(255,0,60,0.22) 0%, transparent 70%)", pointerEvents: "none", zIndex: 1 }} />
      <div style={{ position: "absolute", top: 0, right: 0, width: "60%", height: "100%", background: "radial-gradient(circle at 90% 60%, rgba(0,170,255,0.12) 0%, transparent 70%)", pointerEvents: "none", zIndex: 1 }} />

      {/* Animated Toxic Green particle fog layer */}
      {toxicFogActive && (
        <div style={{
          position: "absolute",
          inset: 0,
          background: "radial-gradient(ellipse at 50% 80%, rgba(0, 255, 136, 0.05) 0%, transparent 80%)",
          mixBlendMode: "screen",
          pointerEvents: "none",
          zIndex: 3,
        }}>
          <svg style={{ position: "absolute", width: "100%", height: "100%" }}>
            <filter id="fog-blur">
              <feGaussianBlur stdDeviation="25" />
            </filter>
            <circle cx="-5%" cy="85%" r="200" fill="rgba(0, 255, 136, 0.07)" filter="url(#fog-blur)" style={{ animation: "drift-right 28s infinite linear" }} />
            <circle cx="105%" cy="92%" r="240" fill="rgba(0, 255, 136, 0.05)" filter="url(#fog-blur)" style={{ animation: "drift-left 32s infinite linear" }} />
          </svg>
          <style>{`
            @keyframes drift-right {
              0% { transform: translateX(0px) translateY(0px); }
              50% { transform: translateX(250px) translateY(-40px); }
              100% { transform: translateX(500px) translateY(0px); }
            }
            @keyframes drift-left {
              0% { transform: translateX(0px) translateY(0px); }
              50% { transform: translateX(-250px) translateY(-70px); }
              100% { transform: translateX(-500px) translateY(0px); }
            }
          `}</style>
        </div>
      )}

      <div className="hud-scanline" style={{zIndex:3}}/>

      {/* ─── CHARACTER SILHOUETTES (Strong glowing rim shadows) ─── */}
      <div style={{
        position: "absolute", bottom: 0, left: "-3vw",
        width: "44vw", height: "88vh",
        backgroundImage: "url(/images/redqueen_silhouette.png)",
        backgroundSize: "contain", backgroundPosition: "left bottom", backgroundRepeat: "no-repeat",
        zIndex: 2, pointerEvents: "none",
        filter: "brightness(0.9) drop-shadow(0 0 50px rgba(255,0,62,0.65))",
      }} />
      <div style={{
        position: "absolute", bottom: 0, right: "-3vw",
        width: "44vw", height: "88vh",
        backgroundImage: "url(/images/soldier_silhouette.png)",
        backgroundSize: "contain", backgroundPosition: "right bottom", backgroundRepeat: "no-repeat",
        zIndex: 2, pointerEvents: "none",
        filter: "brightness(0.7) drop-shadow(0 0 45px rgba(0,170,255,0.3))", // Cold Blue Rim glow
      }} />

      {/* Visual Limb Telemetry Nodes & Flashes */}
      {(["HEAD", "TORSO", "ARMS", "LEGS"] as Limb[]).map(limb => (
        <CombatNode key={`left-${limb}`} limb={limb} side="left" flash={playerFlash} popup={playerPopup} />
      ))}
      {(["HEAD", "TORSO", "ARMS", "LEGS"] as Limb[]).map(limb => (
        <CombatNode key={`right-${limb}`} limb={limb} side="right" flash={opponentFlash} popup={opponentPopup} />
      ))}

      {/* ─── FLOATING TOP HEADER ──────────────────────────────────────────────── */}
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "24px 40px 12px", position: "relative", zIndex: 20, flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
          <span style={{ fontFamily: "Orbitron, sans-serif", color: "#ffffff", fontWeight: 900, fontSize: "14px", letterSpacing: "0.25em" }}>
            &gt; DUEL ARENA // SECTOR 18
          </span>
          <div style={{ display: "flex", gap: "12px", fontSize: "10px", fontFamily: "JetBrains Mono, monospace", letterSpacing: "0.05em" }}>
            <Link href="/" style={{ color: "rgba(255,255,255,0.4)", textDecoration: "none" }}>[ HUB ]</Link>
            <Link href="/bunker" style={{ color: "rgba(255,255,255,0.4)", textDecoration: "none" }}>[ BUNKER_HQ ]</Link>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", fontSize: "10px", color: "rgba(255,255,255,0.35)", fontFamily: "JetBrains Mono, monospace", letterSpacing: "0.15em" }}>
          <span>WST_COLISEUM</span>
          <IconDot color="#ff003c" size={4} />
          <span style={{ color: "#ffffff" }}>WAGER: {threatWager}T</span>
        </div>
      </header>

      {/* ─── FLOATING TACTICAL OVERLAYS ───────────────────────────────────────── */}
      <div style={{ display: "flex", flexGrow: 1, minHeight: 0, position: "relative", zIndex: 10, padding: "0 40px" }}>
        
        {/* Left Side Operative HUD (Floating - No borders) */}
        <div style={{ width: "260px", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "20px 0 40px", flexShrink: 0 }}>
          <div>
            <div style={{ fontFamily: "Orbitron, sans-serif", color: "#ff003c", fontWeight: 900, fontSize: "16px", letterSpacing: "0.05em", lineHeight: 1.1 }}>{profileName}</div>
            <span style={{ fontFamily: "Rajdhani, sans-serif", fontSize: "9px", color: "rgba(255,255,255,0.35)", letterSpacing: "0.1em", display:"block", marginBottom:"8px" }}>
              RANK: RED QUEEN // MMR 1847
            </span>
            <HpBar hp={playerHp} maxHp={playerMaxHp} color="#ff003c" />
            {playerStatus.length > 0 && (
              <div style={{ display: "flex", gap: "3px", marginTop: "6px" }}>
                {playerStatus.map((s, i) => <span key={i} style={{ border: "1px solid #ff003c", color: "#ff003c", fontFamily: "monospace", fontSize: "8px", padding: "1px 4px" }}>{s}</span>)}
              </div>
            )}
          </div>

          {/* Defense Selector Sector (Floating over the left silhouette) */}
          <div style={{ marginTop: "40px" }}>
            <LimbSelector
              label="COUNTERMEASURE SHIELD SECTOR"
              selected={selectedDefense}
              onSelect={setSelectedDefense}
              accentColor="#00aaff"
              disabled={!matchActive || !!combatOutcome}
            />
          </div>
        </div>

        {/* Center Targeting Reticle (Focal Point - Lock-on radar HUD) */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "space-between", flexGrow: 1, padding: "20px 8px" }}>
          
          {/* Match Status display */}
          <div style={{ textAlign: "center" }}>
            <span style={{ fontFamily: "Rajdhani, sans-serif", fontSize: "9px", color: "rgba(255,255,255,0.35)", letterSpacing: "0.3em", display:"block" }}>
              {matchActive ? "ENGAGED // PROTOCOL ACTIVE" : "LOCKING SIGNALS"}
            </span>
            <span style={{ fontFamily: "Orbitron, sans-serif", fontSize: "36px", fontWeight: 900, color: "#ff003c", textShadow: "0 0 25px rgba(255,0,62,0.85)" }}>
              {matchActive ? (combatOutcome ? "END" : "LIVE") : `00:${countdown.toString().padStart(2, "0")}`}
            </span>
          </div>

          {/* Advanced Target Reticle Grid */}
          <div style={{ position: "relative", width: "260px", height: "260px", display: "flex", justifyContent: "center", alignItems: "center", flexShrink: 0 }}>
            <svg width="260" height="260" viewBox="0 0 220 220" style={{ position: "absolute", zIndex: 4, overflow: "visible" }}>
              {/* Spinning vectors inside reticle */}
              <g style={{ transform: `rotate(${getReticleRotation()}deg)`, transformOrigin: "110px 110px", transition: "transform 0.4s cubic-bezier(0.16, 1, 0.3, 1)" }}>
                <circle cx="110" cy="110" r="100" fill="none" stroke="rgba(255,0,62,0.06)" strokeWidth="1" strokeDasharray="6 8" />
                <circle cx="110" cy="110" r="92" fill="none" stroke="rgba(255,255,255,0.02)" strokeWidth="1.2" />
                <circle cx="110" cy="110" r="75" fill="none" stroke="#ff003c" strokeWidth="1" strokeDasharray="30 110" style={{filter:"drop-shadow(0 0 3px #ff003c)"}} />
                
                {/* Lock-on frames */}
                <path d="M 65,73 L 65,65 L 73,65" fill="none" stroke="#ff003c" strokeWidth="1.5" />
                <path d="M 155,73 L 155,65 L 147,65" fill="none" stroke="#ff003c" strokeWidth="1.5" />
                <path d="M 65,147 L 65,155 L 73,155" fill="none" stroke="#ff003c" strokeWidth="1.5" />
                <path d="M 155,147 L 155,155 L 147,155" fill="none" stroke="#ff003c" strokeWidth="1.5" />
              </g>

              {/* Dynamic Laser Lock-on lines pointing from reticle center to target opponent limbs */}
              {selectedAttack && (() => {
                let tx = 110, ty = 110;
                if (selectedAttack === "HEAD") { tx = 370; ty = 30; }
                else if (selectedAttack === "TORSO") { tx = 380; ty = 130; }
                else if (selectedAttack === "ARMS") { tx = 350; ty = 170; }
                else if (selectedAttack === "LEGS") { tx = 360; ty = 240; }

                return (
                  <g>
                    <line x1="110" y1="110" x2={tx} y2={ty} stroke="#ff003c" strokeWidth="1.8" strokeDasharray="4 4" style={{ filter: "drop-shadow(0 0 5px #ff003c)" }} />
                    <circle cx={tx} cy={ty} r="5" fill="#ff003c" style={{ filter: "drop-shadow(0 0 6px #ff003c)" }} />
                    <g transform={`translate(${tx}, ${ty})`}>
                      <circle cx="0" cy="0" r="12" fill="none" stroke="#ff003c" strokeWidth="1.2" strokeDasharray="3 3" className="hud-spin-cw" />
                      <text x="16" y="3" fill="#ff003c" fontSize="8" fontFamily="Orbitron" fontWeight="bold" style={{ textShadow: "0 0 3px #ff003c" }}>LOCK_ON</text>
                    </g>
                  </g>
                );
              })()}

              {/* Dynamic Shield Projector line pointing to player limbs */}
              {selectedDefense && (() => {
                let tx = 110, ty = 110;
                if (selectedDefense === "HEAD") { tx = -150; ty = 30; }
                else if (selectedDefense === "TORSO") { tx = -160; ty = 130; }
                else if (selectedDefense === "ARMS") { tx = -130; ty = 170; }
                else if (selectedDefense === "LEGS") { tx = -140; ty = 240; }

                return (
                  <g>
                    <line x1="110" y1="110" x2={tx} y2={ty} stroke="#00aaff" strokeWidth="1.5" strokeDasharray="4 4" style={{ filter: "drop-shadow(0 0 5px #00aaff)" }} />
                    <circle cx={tx} cy={ty} r="4" fill="#00aaff" style={{ filter: "drop-shadow(0 0 5px #00aaff)" }} />
                    <g transform={`translate(${tx}, ${ty})`}>
                      <circle cx="0" cy="0" r="10" fill="none" stroke="#00aaff" strokeWidth="1.2" strokeDasharray="3 3" className="hud-spin-ccw" />
                      <text x="-38" y="3" fill="#00aaff" fontSize="8" fontFamily="Orbitron" fontWeight="bold" style={{ textShadow: "0 0 3px #00aaff" }}>DEFEND</text>
                    </g>
                  </g>
                );
              })()}
              
              {/* Radar scanner sweep line */}
              <line x1="110" y1="110" x2="186" y2="68" stroke="rgba(255,0,62,0.4)" strokeWidth="1.2" className="hud-radar-scanner-sweep" style={{ transformOrigin: "110px 110px" }} />
              <circle cx="186" cy="68" r="2" fill="#ff003c" className="hud-blink-fast" />
            </svg>
            
            <div style={{ 
              fontFamily: "Orbitron, sans-serif", 
              width: "80px", 
              height: "80px", 
              background: "rgba(0,0,0,0.92)", 
              border: "1.5px solid #ff003c", 
              display: "flex", 
              justifyContent: "center", 
              alignItems: "center", 
              zIndex: 6, 
              boxShadow: "0 0 25px rgba(255,0,62,0.45)", 
              clipPath: "polygon(20% 0%, 80% 0%, 100% 20%, 100% 80%, 80% 100%, 20% 100%, 0% 80%, 0% 20%)", 
              position: "relative" 
            }}>
              <span style={{ fontSize: "22px", color: "#ff003c", fontWeight: 900, textShadow: "0 0 10px #ff003c", letterSpacing:"0.05em" }}>VS</span>
            </div>
          </div>

          {/* Action Trigger Area (Cinematic buttons) */}
          <div style={{ width: "100%", maxWidth: "340px", display: "flex", flexDirection: "column", gap: "8px" }}>
            {!matchActive && !combatOutcome && (
              <div style={{ display: "flex", gap: "4px", marginBottom:"4px", justifyContent: "center" }}>
                {[10, 50, 100, 250].map(v => (
                  <button key={v} onClick={() => setThreatWager(v)} style={{ background: threatWager === v ? "#ff003c" : "rgba(255,255,255,0.02)", border: `1px solid ${threatWager === v ? "#ff003c" : "rgba(255,255,255,0.07)"}`, color: "#ffffff", fontFamily: "Orbitron, sans-serif", fontSize: "9px", padding: "3px 8px", cursor: "pointer" }}>
                    {v}T
                  </button>
                ))}
              </div>
            )}

            {combatOutcome ? (
              <div style={{display:"flex",flexDirection:"column",gap:"6px"}}>
                <div style={{ textAlign: "center", fontFamily: "Orbitron, sans-serif", fontSize: "14px", color: combatOutcome === "win" ? "#00ff88" : "#ff003c", fontWeight: 900, textShadow: `0 0 15px currentColor`, letterSpacing: "0.1em", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px" }}>
                  {combatOutcome === "win" ? <><IconVictory color="#00ff88" /> VICTORY SECURED</> : <><IconSkull color="#ff003c" size={14} /> SYS_DEATH / CORRUPTED</>}
                </div>
                <button onClick={resetEncounter} style={{
                  width: "100%", padding: "12px",
                  background: "rgba(255,0,62,0.05)", border: "1.5px solid #ff003c", color: "#ff003c",
                  fontFamily: "Orbitron, sans-serif", fontSize: "11px", fontWeight: 900, letterSpacing: "0.15em",
                  cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: "6px",
                  boxShadow: "0 0 20px rgba(255,0,62,0.2)"
                }}>
                  <IconRetry color="#ff003c" /> RE-CALIBRATE PROTOCOL
                </button>
              </div>
            ) : !matchActive ? (
              <button onClick={startMatch} style={{
                width: "100%", padding: "14px",
                background: "linear-gradient(135deg, #ff003c 0%, #cc0030 100%)", border: "none", color: "#ffffff",
                fontFamily: "Orbitron, sans-serif", fontSize: "13px", fontWeight: 900, letterSpacing: "0.2em",
                cursor: "pointer", textShadow: "0 0 10px rgba(255,255,255,0.4)",
                boxShadow: "0 0 35px rgba(255,0,62,0.4)"
              }}>
                <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}><IconSword color="#fff" size={14} /> LOCK TARGETS</span>
              </button>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                <button
                  onClick={executeCombatRound}
                  disabled={!canFight}
                  style={{
                    width: "100%", padding: "14px",
                    background: canFight ? "#ff003c" : "rgba(255,255,255,0.02)",
                    border: canFight ? "none" : "1.5px solid rgba(255,0,62,0.25)",
                    color: canFight ? "#ffffff" : "rgba(255,255,255,0.25)",
                    fontFamily: "Orbitron, sans-serif", fontSize: "14px", fontWeight: 900, letterSpacing: "0.2em",
                    cursor: canFight ? "pointer" : "not-allowed",
                    boxShadow: canFight ? "0 0 30px rgba(255,0,62,0.4)" : "none",
                  }}
                >
                  {canFight ? "EXECUTE TARGETING MATCH" : "AWAITING LOCK DATA"}
                </button>
                {canFight && (
                  <div style={{ display: "flex", justifyContent: "center", gap: "6px", fontFamily: "JetBrains Mono, monospace", fontSize: "8.5px", color: "rgba(255,255,255,0.4)" }}>
                    <span style={{ color: "#ff003c" }}>ATK: {selectedAttack}</span>
                    <span>//</span>
                    <span style={{ color: "#ffffff" }}>DEF: {selectedDefense}</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* Right Side Opponent HUD (Floating - No borders) */}
        <div style={{ width: "260px", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "20px 0 40px", flexShrink: 0, alignItems: "flex-end" }}>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontFamily: "Orbitron, sans-serif", color: "#ffffff", fontWeight: 900, fontSize: "16px", letterSpacing: "0.05em", lineHeight: 1.1 }}>DESGECEAN</div>
            <span style={{ fontFamily: "Rajdhani, sans-serif", fontSize: "9px", color: "rgba(255,255,255,0.35)", letterSpacing: "0.1em", display:"block", marginBottom:"8px" }}>
              RANK: SURVIVOR // MMR 1732
            </span>
            <HpBar hp={opponentHp} maxHp={opponentMaxHp} color="#9f9f9f" />
            {opponentStatus.length > 0 && (
              <div style={{ display: "flex", gap: "3px", marginTop: "6px", justifyContent: "flex-end" }}>
                {opponentStatus.map((s, i) => <span key={i} style={{ border: "1px solid rgba(255,255,255,0.35)", color: "rgba(255,255,255,0.6)", fontFamily: "monospace", fontSize: "8px", padding: "1px 4px" }}>{s}</span>)}
              </div>
            )}
          </div>

          {/* Attack Selector Sector (Floating over the right silhouette) */}
          <div style={{ marginTop: "40px", width: "100%" }}>
            <LimbSelector
              label="ORBITAL TARGETING ATK VECTOR"
              selected={selectedAttack}
              onSelect={setSelectedAttack}
              accentColor="#ff003c"
              disabled={!matchActive || !!combatOutcome}
            />
          </div>
        </div>
      </div>

      {/* ─── EXPANDABLE ARENA TERMINAL DRAWER (Hides chat/mutators, preserving negative space) ─── */}
      <div style={{
        position:"absolute",
        bottom:0,
        left:0,
        right:0,
        zIndex:30,
        background:"rgba(2,2,2,0.97)",
        borderTop:"1px solid rgba(255,0,62,0.15)",
        transform:`translateY(${terminalOpen ? "0%" : "calc(100% - 24px)"})`,
        transition:"transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)"
      }}>
        {/* Toggle Bar */}
        <button onClick={()=>setTerminalOpen(!terminalOpen)} style={{
          width:"100%",
          height:"24px",
          background:"transparent",
          border:"none",
          color:"rgba(255,255,255,0.4)",
          fontFamily:"Orbitron,sans-serif",
          fontSize:"8px",
          letterSpacing:"0.3em",
          cursor:"pointer",
          display:"flex",
          alignItems:"center",
          justifyContent:"center",
          textTransform:"uppercase"
        }}>
          {terminalOpen ? "[ COLLAPSE COMBAT DECK ]" : "[ OPEN COMBAT CHAT, LOGS & MUTATORS ]"}
        </button>

        {/* Content Inside Drawer */}
        <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",height:"160px",padding:"8px 40px 14px",gap:"24px"}}>
          
          {/* CHAT */}
          <div style={{display:"flex",flexDirection:"column",minHeight:0}}>
            <div style={{fontFamily:"Orbitron,sans-serif",fontSize:"8px",color:"#ff003c",letterSpacing:"0.1em",marginBottom:"4px"}}>RADIO_CHAT_NET</div>
            <div className="hud-scrollbar" style={{flex:1,overflowY:"auto",display:"flex",flexDirection:"column",gap:"1px",marginBottom:"4px"}}>
              {chatMessages.map((m,i)=>(
                <div key={i} style={{fontFamily:"JetBrains Mono,monospace",fontSize:"9px",lineHeight:1.3}}>
                  <span style={{color:"rgba(255,255,255,0.25)"}}>[{m.time}] </span>
                  <span style={{color:m.color||"#777777",fontWeight:700}}>{m.sender}: </span>
                  <span style={{color:"rgba(255,255,255,0.7)"}}>{m.text}</span>
                </div>
              ))}
              <div ref={chatEndRef}/>
            </div>
            <form onSubmit={handleSendChat} style={{display:"flex",border:"1px solid rgba(255,0,62,0.2)",background:"#000000"}}>
              <input value={chatInput} onChange={e=>setChatInput(e.target.value)} placeholder="ENTER TRANSMISSION..." style={{flex:1,background:"transparent",border:"none",color:"#fff",fontFamily:"JetBrains Mono,monospace",fontSize:"9px",padding:"4px 6px",outline:"none",textTransform:"uppercase"}}/>
              <button type="submit" style={{background:"transparent",border:"none",color:"#ff003c",padding:"0 6px",cursor:"pointer",display:"flex",alignItems:"center"}}><IconSend color="#ff003c"/></button>
            </form>
          </div>

          {/* MUTATORS CONFIG */}
          <div style={{display:"flex",flexDirection:"column",minHeight:0}}>
            <span style={{fontFamily:"Orbitron,sans-serif",fontSize:"8px",color:"rgba(255,255,255,0.4)",letterSpacing:"0.15em",marginBottom:"4px"}}>ATMOSPHERIC MUTATORS</span>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px", flex: 1 }}>
              {[
                { active: toxicFogActive, toggle: setToxicFogActive, Icon: IconSkull, name: "TOXIC FOG", label: "PPM: 384 [DANGER]" },
                { active: scarceAmmoActive, toggle: setScarceAmmoActive, Icon: IconAmmo, name: "SCARCE AMMO", label: "DEPLETED // -15% DMG" },
                { active: electroSurgeActive, toggle: setElectroSurgeActive, Icon: IconBolt, name: "ELECTRO SURGE", label: "GRID STATIC // 120Hz" },
                { active: dataBreachActive, toggle: setDataBreachActive, Icon: IconLock, name: "DATA BREACH", label: "LEAKING // JAM CORE" },
              ].map((m) => (
                <div
                  key={m.name}
                  onClick={() => !matchActive && m.toggle(!m.active)}
                  style={{
                    border: `1px solid ${m.active ? "#ff003c" : "rgba(255,255,255,0.06)"}`,
                    background: m.active ? "rgba(255,0,62,0.08)" : "rgba(10,10,10,0.6)",
                    padding: "6px 10px",
                    cursor: matchActive ? "not-allowed" : "pointer",
                    display: "flex", flexDirection: "column", alignItems: "flex-start", gap: "2px",
                    transition: "all 0.12s",
                    position: "relative",
                    borderRadius: "2px",
                    boxShadow: m.active ? "0 0 10px rgba(255,0,60,0.15)" : "none"
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: "6px", width: "100%" }}>
                    <m.Icon color={m.active ? "#ff003c" : "rgba(255,255,255,0.3)"} size={11} />
                    <span style={{ fontFamily: "Orbitron, sans-serif", fontSize: "9px", color: m.active ? "#fff" : "rgba(255,255,255,0.4)", fontWeight: 800, letterSpacing: "0.05em" }}>{m.name}</span>
                    <span style={{ marginLeft: "auto", width: "5px", height: "5px", borderRadius: "50%", background: m.active ? "#ff003c" : "rgba(255,255,255,0.15)", boxShadow: m.active ? "0 0 5px #ff003c" : "none" }} />
                  </div>
                  {m.active && (
                    <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "7px", color: "#ff8800", letterSpacing: "0.02em" }}>
                      {m.label}
                    </span>
                  )}
                </div>
              ))}
            </div>
          </div>

          {/* BATTLE LOG */}
          <div style={{display:"flex",flexDirection:"column",minHeight:0}}>
            <div style={{fontFamily:"Orbitron,sans-serif",fontSize:"8px",color:"rgba(255,255,255,0.3)",letterSpacing:"0.15em",marginBottom:"4px"}}>BATTLE_LOGS</div>
            <div className="hud-scrollbar" style={{flex:1,overflowY:"auto",display:"flex",flexDirection:"column",gap:"1px"}}>
              {battleLogs.map((l, i) => (
                <div key={i} style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "9px", lineHeight: 1.3 }}>
                  <span style={{ color: "rgba(255,255,255,0.2)" }}>[{l.time}] </span>
                  <span style={{ color: l.color ? l.color : l.sender === profileName ? "#ffffff" : l.sender === "DESGECEAN" ? "#ff003c" : "rgba(255,255,255,0.3)" }}>
                    {l.text}
                  </span>
                </div>
              ))}
              <div ref={logEndRef} />
            </div>
          </div>
        </div>
      </div>

      <OnboardingBriefing page="arena" />

      <style>{`
        @keyframes combat-node-flash {
          0% { transform: scale(0.35); opacity: 1; }
          100% { transform: scale(1.6); opacity: 0; }
        }
        @keyframes combat-damage-rise {
          0% { transform: translate(-50%, 0px); opacity: 1; }
          40% { transform: translate(-50%, -25px); opacity: 1; }
          100% { transform: translate(-50%, -50px); opacity: 0; }
        }
      `}</style>
    </div>
  );
}
