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

// ─── STAT BAR ───────────────────────────────────────────────────────────────
function StatBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "3px", width: "100%" }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", fontFamily: "Rajdhani, sans-serif", letterSpacing: "0.15em", textTransform: "uppercase", fontWeight: 700, color: "rgba(255,255,255,0.45)" }}>
        <span>{label}</span>
        <span style={{ color: "#fff", fontWeight: 900 }}>{value}</span>
      </div>
      <div style={{ height: "3px", background: "rgba(255,255,255,0.06)", position: "relative" }}>
        <div style={{ height: "100%", width: `${pct}%`, background: color, boxShadow: `0 0 6px ${color}` }} />
      </div>
    </div>
  );
}

// ─── SVG ICONS ───────────────────────────────────────────────────────────────
const IconHead = ({ color }: { color: string }) => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
    <polygon points="8,1 14,5 14,11 8,15 2,11 2,5" stroke={color} strokeWidth="1.5" fill="none" />
    <circle cx="8" cy="8" r="2" fill={color} />
  </svg>
);
const IconTorso = ({ color }: { color: string }) => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
    <rect x="3" y="2" width="10" height="12" rx="0" stroke={color} strokeWidth="1.5" fill="none" />
    <line x1="3" y1="6" x2="13" y2="6" stroke={color} strokeWidth="1" />
    <line x1="8" y1="6" x2="8" y2="14" stroke={color} strokeWidth="1" />
  </svg>
);
const IconArms = ({ color }: { color: string }) => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
    <line x1="1" y1="8" x2="15" y2="8" stroke={color} strokeWidth="1.5" />
    <polyline points="4,5 1,8 4,11" stroke={color} strokeWidth="1.5" fill="none" />
    <polyline points="12,5 15,8 12,11" stroke={color} strokeWidth="1.5" fill="none" />
  </svg>
);
const IconLegs = ({ color }: { color: string }) => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
    <line x1="8" y1="1" x2="8" y2="8" stroke={color} strokeWidth="1.5" />
    <line x1="8" y1="8" x2="4" y2="15" stroke={color} strokeWidth="1.5" />
    <line x1="8" y1="8" x2="12" y2="15" stroke={color} strokeWidth="1.5" />
  </svg>
);
const IconSword = ({ color, size = 16 }: { color: string; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
    <line x1="2" y1="14" x2="12" y2="4" stroke={color} strokeWidth="1.5" />
    <polyline points="10,2 14,2 14,6" stroke={color} strokeWidth="1.5" fill="none" />
    <line x1="2" y1="10" x2="4" y2="12" stroke={color} strokeWidth="1.2" />
  </svg>
);
const IconShield = ({ color, size = 16 }: { color: string; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
    <path d="M8 2 L14 5 L14 9 C14 12 8 15 8 15 C8 15 2 12 2 9 L2 5 Z" stroke={color} strokeWidth="1.5" fill="none" />
  </svg>
);
const IconSkull = ({ color, size = 12 }: { color: string; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
    <path d="M8 2C4.5 2 2 4.5 2 7.5C2 10 3.5 11.5 4 12L4 14L12 14L12 12C12.5 11.5 14 10 14 7.5C14 4.5 11.5 2 8 2Z" stroke={color} strokeWidth="1.2" fill="none" />
    <circle cx="6" cy="8" r="1" fill={color} />
    <circle cx="10" cy="8" r="1" fill={color} />
  </svg>
);
const IconBolt = ({ color, size = 12 }: { color: string; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
    <polyline points="10,2 5,9 9,9 6,14" stroke={color} strokeWidth="1.5" fill="none" />
  </svg>
);
const IconLock = ({ color, size = 12 }: { color: string; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
    <rect x="3" y="8" width="10" height="7" stroke={color} strokeWidth="1.2" fill="none" />
    <path d="M5 8V6C5 4 11 4 11 6V8" stroke={color} strokeWidth="1.2" fill="none" />
    <circle cx="8" cy="11.5" r="1" fill={color} />
  </svg>
);
const IconAmmo = ({ color, size = 12 }: { color: string; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
    <rect x="6" y="3" width="4" height="10" rx="1" stroke={color} strokeWidth="1.2" fill="none" />
    <rect x="6" y="1" width="4" height="3" rx="0.5" fill={color} />
  </svg>
);
const IconDot = ({ color, size = 8 }: { color: string; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 8 8" fill="none">
    <circle cx="4" cy="4" r="3" fill={color} />
  </svg>
);
const IconStar = ({ color, size = 10 }: { color: string; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
    <polygon points="8,1 10,6 15,6 11,10 13,15 8,12 3,15 5,10 1,6 6,6" fill={color} />
  </svg>
);
const IconSend = ({ color }: { color: string }) => (
  <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
    <polyline points="2,8 14,8" stroke={color} strokeWidth="1.5" />
    <polyline points="10,4 14,8 10,12" stroke={color} strokeWidth="1.5" fill="none" />
  </svg>
);
const IconVictory = ({ color }: { color: string }) => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
    <polyline points="2,8 6,12 14,4" stroke={color} strokeWidth="2" fill="none" />
  </svg>
);
const IconRetry = ({ color }: { color: string }) => (
  <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
    <path d="M3 8C3 5 5.5 3 8 3C10.5 3 13 5 13 8" stroke={color} strokeWidth="1.5" fill="none" />
    <polyline points="1,6 3,8 5,6" stroke={color} strokeWidth="1.5" fill="none" />
    <path d="M13 8C13 11 10.5 13 8 13C5.5 13 3 11 3 8" stroke={color} strokeWidth="1.5" fill="none" />
  </svg>
);
const IconCrosshair = ({ color, size = 16 }: { color: string; size?: number }) => (
  <svg width={size} height={size} viewBox="0 0 16 16" fill="none">
    <circle cx="8" cy="8" r="5" stroke={color} strokeWidth="1.2" fill="none" />
    <line x1="8" y1="1" x2="8" y2="5" stroke={color} strokeWidth="1.2" />
    <line x1="8" y1="11" x2="8" y2="15" stroke={color} strokeWidth="1.2" />
    <line x1="1" y1="8" x2="5" y2="8" stroke={color} strokeWidth="1.2" />
    <line x1="11" y1="8" x2="15" y2="8" stroke={color} strokeWidth="1.2" />
    <circle cx="8" cy="8" r="1.5" fill={color} />
  </svg>
);

// ─── LIMB SELECTOR ──────────────────────────────────────────────────────────
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
      <div style={{ fontFamily: "Orbitron, sans-serif", fontSize: "9px", letterSpacing: "0.2em", color: accentColor, marginBottom: "8px", fontWeight: 900, textAlign: "center" }}>
        {label}
      </div>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "5px" }}>
        {limbs.map((l) => {
          const isActive = selected === l.key;
          const iconColor = isActive ? accentColor : "rgba(255,255,255,0.35)";
          return (
            <button
              key={l.key}
              onClick={() => !disabled && onSelect(l.key)}
              style={{
                background: isActive ? `${accentColor}22` : "rgba(5,5,5,0.6)",
                border: `1px solid ${isActive ? accentColor : "rgba(255,255,255,0.08)"}`,
                color: isActive ? accentColor : "rgba(255,255,255,0.5)",
                fontFamily: "Rajdhani, sans-serif",
                fontSize: "11px",
                fontWeight: 700,
                letterSpacing: "0.12em",
                padding: "7px 4px 5px",
                cursor: disabled ? "not-allowed" : "pointer",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                gap: "3px",
                transition: "all 0.12s ease",
                textTransform: "uppercase",
                boxShadow: isActive ? `0 0 12px ${accentColor}44` : "none",
              }}
            >
              <l.Icon color={iconColor} />
              <span style={{ fontSize: "10px" }}>{l.key}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

// ─── SEED DATA ───────────────────────────────────────────────────────────────
const SEED_CHAT: Message[] = [
  { time: "22:51", sender: "REDQUEEN_X", text: "LET'S SEE IF YOU CAN KEEP UP.", color: "#ff003c" },
  { time: "22:51", sender: "DESGECEAN", text: "ALWAYS READY." },
  { time: "22:52", sender: "REDQUEEN_X", text: "NO MERCY.", color: "#ff003c" },
  { time: "22:52", sender: "DESGECEAN", text: "BRING IT." },
  { time: "22:52", sender: "SYSTEM", text: "MATCH FOUND. PREPARING ARENA...", color: "#ff8800" },
];

// ─── HP BAR (segmented) ──────────────────────────────────────────────────────
function HpBar({ hp, maxHp, color }: { hp: number; maxHp: number; color: string }) {
  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", fontFamily: "Rajdhani, sans-serif", fontSize: "11px", color: color, letterSpacing: "0.12em", fontWeight: 700, marginBottom: "5px" }}>
        <span>HP</span>
        <span style={{ color: "#fff" }}>{hp} / {maxHp}</span>
      </div>
      <div style={{ display: "flex", gap: "2px" }}>
        {Array.from({ length: 20 }).map((_, i) => {
          const threshold = (maxHp / 20) * (i + 1);
          const active = hp >= threshold;
          return (
            <div key={i} style={{
              height: "8px", flexGrow: 1,
              background: active ? color : "rgba(255,255,255,0.05)",
              boxShadow: active ? `0 0 4px ${color}88` : "none",
            }} />
          );
        })}
      </div>
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

    let oppHpNext = opponentHp;
    if (Math.random() <= pHitChance) {
      let dmg = Math.round(atkConfig[selectedAttack].base * (playerStats.attack / opponentStats.defense) * (0.9 + Math.random() * 0.2) * dmgMult);
      if (oppBlocked) { dmg = Math.round(dmg * 0.15); logs.push({ time: t, sender: "SYSTEM", text: `BLOCKED! Opponent deflected 85% on [${selectedAttack}]. Dealt ${dmg} dmg.` }); }
      else {
        const isCrit = Math.random() <= playerStats.luck / 100;
        if (isCrit) { dmg = Math.round(dmg * 1.5); logs.push({ time: t, sender: profileName, text: `[CRIT] Struck [${selectedAttack}] for ${dmg} dmg.`, color: "#ff003c" }); }
        else { logs.push({ time: t, sender: profileName, text: `Hit [${selectedAttack}] for ${dmg} dmg.` }); }
        if (selectedAttack === "HEAD" && Math.random() > 0.4) setOpponentStatus(p => [...p, "GLITCHED"]);
        if (selectedAttack === "TORSO" && Math.random() > 0.4) setOpponentStatus(p => [...p, "BLEEDING"]);
        if (selectedAttack === "LEGS" && Math.random() > 0.4) setOpponentStatus(p => [...p, "SLOWED"]);
      }
      oppHpNext = Math.max(0, opponentHp - dmg);
      setOpponentHp(oppHpNext);
    } else {
      logs.push({ time: t, sender: "SYSTEM", text: `Strike on [${selectedAttack}] evaded.` });
    }

    // Opponent attacks
    let oHitChance = atkConfig[oppAtk].chance * (opponentStats.agility / (playerStats.agility * (electroSurgeActive ? 1.1 : 1.0)));
    const playerBlocked = selectedDefense === oppAtk;
    if (playerBlocked) oHitChance *= 0.25;

    let plyHpNext = playerHp;
    if (Math.random() <= oHitChance) {
      let dmg = Math.round(atkConfig[oppAtk].base * (opponentStats.attack / playerStats.defense) * (0.9 + Math.random() * 0.2) * dmgMult);
      if (playerBlocked) { dmg = Math.round(dmg * 0.15); logs.push({ time: t, sender: "SYSTEM", text: `DEFLECTED! Blocked [${oppAtk}]. Absorbed 85% (took ${dmg}).`, color: "#ffffff" }); }
      else {
        const isCrit = Math.random() <= opponentStats.luck / 100;
        if (isCrit) { dmg = Math.round(dmg * 1.5); logs.push({ time: t, sender: "DESGECEAN", text: `[CRIT] Struck your [${oppAtk}] for ${dmg} dmg.`, color: "#ff003c" }); }
        else { logs.push({ time: t, sender: "DESGECEAN", text: `Hit your [${oppAtk}] for ${dmg} dmg.` }); }
        if (oppAtk === "HEAD" && Math.random() > 0.4) setPlayerStatus(p => [...p, "GLITCHED"]);
        if (oppAtk === "TORSO" && Math.random() > 0.4) setPlayerStatus(p => [...p, "BLEEDING"]);
        if (oppAtk === "LEGS" && Math.random() > 0.4) setPlayerStatus(p => [...p, "SLOWED"]);
      }
      plyHpNext = Math.max(0, playerHp - dmg);
      setPlayerHp(plyHpNext);
    } else {
      logs.push({ time: t, sender: "SYSTEM", text: `Enemy strike on [${oppAtk}] missed.` });
    }

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

  return (
    <div
      id="game-arena-root"
      className={shakeTrigger ? "hud-screen-shake" : ""}
      style={{
        background: "#030303",
        minHeight: "100vh",
        height: "100vh",
        color: "#fff",
        fontFamily: "Rajdhani, sans-serif",
        position: "relative",
        boxSizing: "border-box",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* ── Ambient glows ── */}
      <div style={{ position: "absolute", top: 0, left: 0, width: "45%", height: "100%", background: "radial-gradient(ellipse at 20% 50%, rgba(255,0,60,0.09) 0%, transparent 65%)", pointerEvents: "none", zIndex: 1 }} />
      <div style={{ position: "absolute", top: 0, right: 0, width: "45%", height: "100%", background: "radial-gradient(ellipse at 80% 50%, rgba(200,220,255,0.06) 0%, transparent 65%)", pointerEvents: "none", zIndex: 1 }} />

      {/* ── CRT scanlines ── */}
      <div className="hud-scanline" />

      {/* ── Subtle grid ── */}
      <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(255,0,60,0.005) 1px, transparent 1px), linear-gradient(90deg, rgba(255,0,60,0.005) 1px, transparent 1px)", backgroundSize: "40px 40px", pointerEvents: "none", zIndex: 1 }} />

      {/* ── Frame border ── */}
      <div style={{ position: "absolute", top: "10px", left: "10px", right: "10px", bottom: "10px", border: "1px solid rgba(255,0,60,0.07)", pointerEvents: "none", zIndex: 15 }} />

      {/* ═══════════════════════════════ CHARACTER SILHOUETTES ═══════════════ */}
      <div style={{
        position: "absolute", bottom: 0, left: "-2vw",
        width: "44vw", height: "88vh",
        backgroundImage: "url(/images/redqueen_silhouette.png)",
        backgroundSize: "contain", backgroundPosition: "left bottom", backgroundRepeat: "no-repeat",
        zIndex: 2, pointerEvents: "none",
        filter: "brightness(0.85) drop-shadow(0 0 40px rgba(255,0,60,0.5))",
      }} />
      <div style={{
        position: "absolute", bottom: 0, right: "-2vw",
        width: "44vw", height: "88vh",
        backgroundImage: "url(/images/soldier_silhouette.png)",
        backgroundSize: "contain", backgroundPosition: "right bottom", backgroundRepeat: "no-repeat",
        zIndex: 2, pointerEvents: "none",
        filter: "brightness(0.8) drop-shadow(0 0 40px rgba(200,230,255,0.3))",
      }} />

      {/* ═══════════════════════════════ HEADER ══════════════════════════════ */}
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 24px 12px", borderBottom: "1px solid rgba(255,0,60,0.07)", position: "relative", zIndex: 20, flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
          <span style={{ fontFamily: "Orbitron, sans-serif", color: "#ff003c", fontWeight: 900, fontSize: "15px", letterSpacing: "0.25em" }}>
            &gt; P2P ARENA &nbsp;///&nbsp; 1V1 DUEL &nbsp;///
          </span>
          <div style={{ display: "flex", gap: "12px", fontSize: "11px", fontFamily: "Oxanium, sans-serif", fontWeight: 700, letterSpacing: "0.08em" }}>
            <Link href="/" style={{ color: "#555", textDecoration: "none" }}>[ LEAVE_HUB ]</Link>
            <Link href="/bunker" style={{ color: "#555", textDecoration: "none" }}>[ BASE_BUNKER ]</Link>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "16px", fontSize: "12px", color: "#555", fontFamily: "Rajdhani, sans-serif", letterSpacing: "0.15em", fontWeight: 700 }}>
          <span>SEASON 1</span>
          <IconDot color="#ff003c" size={6} />
          <span style={{ color: "#fff", display: "flex", alignItems: "center", gap: "5px" }}>RANKED MATCH <IconStar color="#ff003c" size={10} /></span>
        </div>
      </header>

      {/* ═══════════════════════════════ MAIN CONTENT ════════════════════════ */}
      <main style={{ display: "grid", gridTemplateColumns: "300px 1fr 300px", gap: "0", flexGrow: 1, minHeight: 0, position: "relative", zIndex: 10 }}>

        {/* ─── LEFT PLAYER PANEL ──────────────────────────────────────────── */}
        <div style={{ padding: "16px 16px 16px 20px", display: "flex", flexDirection: "column", gap: "12px", justifyContent: "flex-start" }}>
          {/* Player identity */}
          <div style={{ background: "rgba(0,0,0,0.5)", border: "1px solid rgba(255,0,60,0.15)", backdropFilter: "blur(6px)", padding: "14px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
              <IconCrosshair color="#ff003c" size={20} />
              <div>
                <div style={{ fontFamily: "Orbitron, sans-serif", color: "#ff003c", fontWeight: 900, fontSize: "15px", letterSpacing: "0.06em", lineHeight: 1.1 }}>{profileName}</div>
                <div style={{ fontFamily: "Rajdhani, sans-serif", fontSize: "10px", color: "#555", letterSpacing: "0.15em", fontWeight: 700 }}>
                  RANK: <span style={{ color: "#ff003c" }}>RED QUEEN</span> &nbsp;/&nbsp; RATING: 1847
                </div>
              </div>
            </div>
            <HpBar hp={playerHp} maxHp={playerMaxHp} color="#ff003c" />
            {playerStatus.length > 0 && (
              <div style={{ display: "flex", gap: "4px", marginTop: "6px" }}>
                {playerStatus.map((s, i) => <span key={i} style={{ border: "1px solid #ff003c", color: "#ff003c", fontFamily: "monospace", fontSize: "9px", padding: "1px 5px", letterSpacing: "0.1em" }}>{s}</span>)}
              </div>
            )}
          </div>

          {/* Stats */}
          <div style={{ background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,0,60,0.1)", backdropFilter: "blur(4px)", padding: "12px", display: "flex", flexDirection: "column", gap: "7px" }}>
            <StatBar label="ATTACK" value={playerStats.attack} max={100} color="#ff003c" />
            <StatBar label="DEFENSE" value={playerStats.defense} max={100} color="#ff003c" />
            <StatBar label="AGILITY" value={playerStats.agility} max={100} color="#ff003c" />
            <StatBar label="INTELLECT" value={playerStats.intellect} max={100} color="#ff003c" />
            <StatBar label="LUCK" value={playerStats.luck} max={100} color="#ff003c" />
          </div>

          {/* SHIELD SECTOR (defense selector) */}
          <div style={{ background: "rgba(0,0,0,0.45)", border: "1px solid rgba(255,0,60,0.1)", backdropFilter: "blur(4px)", padding: "12px" }}>
            <LimbSelector
              label="SHIELD SECTOR — DEFEND"
              selected={selectedDefense}
              onSelect={setSelectedDefense}
              accentColor="#ffffff"
              disabled={!matchActive || !!combatOutcome}
            />
          </div>
        </div>

        {/* ─── CENTER HUD ──────────────────────────────────────────────────── */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "space-between", padding: "16px 8px", position: "relative" }}>

          {/* Match timer */}
          <div style={{ textAlign: "center" }}>
            <div style={{ fontFamily: "Rajdhani, sans-serif", fontSize: "10px", color: "#555", letterSpacing: "0.2em", fontWeight: 700, marginBottom: "2px" }}>
              {matchActive ? "ROUND IN PROGRESS" : "MATCH STARTS IN"}
            </div>
            <div style={{ fontFamily: "Orbitron, sans-serif", fontSize: "44px", fontWeight: 900, color: "#ff003c", textShadow: "0 0 20px rgba(255,0,60,0.8)", lineHeight: 1 }}>
              {matchActive ? (combatOutcome ? "END" : "LIVE") : `00:${countdown.toString().padStart(2, "0")}`}
            </div>
          </div>

          {/* VS + reticle */}
          <div style={{ position: "relative", width: "220px", height: "220px", display: "flex", justifyContent: "center", alignItems: "center", flexShrink: 0 }}>
            <svg width="220" height="220" viewBox="0 0 220 220" style={{ position: "absolute", zIndex: 4, overflow: "visible" }}>
              <circle cx="110" cy="110" r="100" fill="none" stroke="rgba(255,0,60,0.12)" strokeWidth="1" strokeDasharray="6 4" className="hud-spin-cw" />
              <circle cx="110" cy="110" r="82" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
              {Array.from({ length: 12 }).map((_, i) => {
                const a = (i * 30 * Math.PI) / 180;
                return <line key={i} x1={110 + 77 * Math.cos(a)} y1={110 + 77 * Math.sin(a)} x2={110 + 83 * Math.cos(a)} y2={110 + 83 * Math.sin(a)} stroke="rgba(255,0,60,0.4)" strokeWidth="1.5" />;
              })}
              <circle cx="110" cy="110" r="66" fill="none" stroke="#ff003c" strokeWidth="1.5" strokeDasharray="25 120" className="hud-spin-ccw" />
              <line x1="110" y1="15" x2="110" y2="72" stroke="rgba(255,0,60,0.3)" strokeWidth="1" />
              <line x1="110" y1="148" x2="110" y2="205" stroke="rgba(255,0,60,0.3)" strokeWidth="1" />
              <line x1="15" y1="110" x2="72" y2="110" stroke="rgba(255,0,60,0.3)" strokeWidth="1" />
              <line x1="148" y1="110" x2="205" y2="110" stroke="rgba(255,0,60,0.3)" strokeWidth="1" />
              <path d="M 68,76 L 68,68 L 76,68" fill="none" stroke="#ff003c" strokeWidth="2" />
              <path d="M 152,76 L 152,68 L 144,68" fill="none" stroke="#ff003c" strokeWidth="2" />
              <path d="M 68,144 L 68,152 L 76,152" fill="none" stroke="#ff003c" strokeWidth="2" />
              <path d="M 152,144 L 152,152 L 144,152" fill="none" stroke="#ff003c" strokeWidth="2" />
              <line x1="110" y1="110" x2="186" y2="68" stroke="rgba(255,0,60,0.35)" strokeWidth="1.5" className="hud-radar-scanner-sweep" style={{ transformOrigin: "110px 110px" }} />
              <circle cx="186" cy="68" r="2.5" fill="#ff003c" className="hud-blink-fast" />
            </svg>
            <div style={{ fontFamily: "Orbitron, sans-serif", width: "72px", height: "72px", background: "rgba(2,2,2,0.97)", border: "2px solid #ff003c", display: "flex", justifyContent: "center", alignItems: "center", zIndex: 6, boxShadow: "0 0 30px rgba(255,0,60,0.6)", clipPath: "polygon(20% 0%, 80% 0%, 100% 20%, 100% 80%, 80% 100%, 20% 100%, 0% 80%, 0% 20%)", position: "relative" }}>
              <span style={{ fontSize: "26px", color: "#ff003c", fontWeight: 900, textShadow: "0 0 10px #ff003c" }}>VS</span>
            </div>
          </div>

          {/* Arena info */}
          <div style={{ textAlign: "center", lineHeight: 1.5 }}>
            <div style={{ fontFamily: "Rajdhani, sans-serif", fontSize: "10px", color: "#444", letterSpacing: "0.2em", fontWeight: 700 }}>ARENA</div>
            <div style={{ fontFamily: "Oxanium, sans-serif", fontSize: "14px", color: "#ff003c", fontWeight: 700, letterSpacing: "0.08em" }}>WASTELAND COLISEUM</div>
            <div style={{ fontFamily: "Rajdhani, sans-serif", fontSize: "10px", color: "#444", letterSpacing: "0.18em", fontWeight: 700, marginTop: "6px" }}>BET</div>
            <div style={{ fontFamily: "Orbitron, sans-serif", fontSize: "16px", color: "#ff003c", fontWeight: 900 }}>{threatWager} THREAT</div>
            <div style={{ fontFamily: "Rajdhani, sans-serif", fontSize: "10px", color: "#444", letterSpacing: "0.15em", fontWeight: 700, marginTop: "4px" }}>MATCH TYPE</div>
            <div style={{ fontFamily: "Rajdhani, sans-serif", fontSize: "13px", color: "#fff", fontWeight: 700, letterSpacing: "0.1em" }}>RANKED</div>
          </div>

          {/* ══════════ ACTION AREA ══════════ */}
          <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: "8px" }}>
            {/* Wager selector (pre-match) */}
            {!matchActive && !combatOutcome && (
              <div style={{ display: "flex", justifyContent: "center", gap: "6px" }}>
                {[10, 50, 100, 250].map(v => (
                  <button key={v} onClick={() => setThreatWager(v)} style={{ background: threatWager === v ? "#ff003c" : "transparent", border: `1px solid ${threatWager === v ? "#ff003c" : "rgba(255,255,255,0.12)"}`, color: "#fff", fontFamily: "Orbitron, sans-serif", fontSize: "10px", padding: "4px 10px", cursor: "pointer", letterSpacing: "0.05em" }}>
                    {v}T
                  </button>
                ))}
              </div>
            )}

            {/* ─── FIGHT BUTTON (main CTA) ─── */}
            {combatOutcome ? (
              <>
                <div style={{ textAlign: "center", fontFamily: "Orbitron, sans-serif", fontSize: "16px", color: combatOutcome === "win" ? "#00ff88" : "#ff003c", fontWeight: 900, textShadow: `0 0 20px currentColor`, letterSpacing: "0.1em", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}>
                  {combatOutcome === "win" ? <><IconVictory color="#00ff88" /> ENCOUNTER VICTORY</> : <><IconSkull color="#ff003c" size={16} /> OPERATIVE DOWN</>}
                </div>
                <button
                  onClick={resetEncounter}
                  style={{
                    width: "100%", padding: "16px",
                    background: "rgba(255,0,60,0.12)",
                    border: "2px solid #ff003c",
                    color: "#ff003c",
                    fontFamily: "Orbitron, sans-serif",
                    fontSize: "13px", fontWeight: 900, letterSpacing: "0.2em",
                    cursor: "pointer",
                    boxShadow: "0 0 20px rgba(255,0,60,0.2)",
                    textTransform: "uppercase",
                    transition: "all 0.15s",
                  }}
                >
                  <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "8px" }}><IconRetry color="#ff003c" /> RETRY ENCOUNTER</span>
                </button>
              </>
            ) : !matchActive ? (
              <button
                onClick={startMatch}
                style={{
                  width: "100%", padding: "20px",
                  background: "linear-gradient(135deg, #ff003c 0%, #cc0030 100%)",
                  border: "none",
                  color: "#ffffff",
                  fontFamily: "Orbitron, sans-serif",
                  fontSize: "16px", fontWeight: 900, letterSpacing: "0.2em",
                  cursor: "pointer",
                  boxShadow: "0 0 40px rgba(255,0,60,0.5), inset 0 1px 0 rgba(255,255,255,0.1)",
                  textTransform: "uppercase",
                  textShadow: "0 0 10px rgba(255,255,255,0.3)",
                  transition: "all 0.15s",
                  clipPath: "polygon(8px 0%, 100% 0%, calc(100% - 8px) 100%, 0% 100%)",
                }}
              >
                <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "10px" }}><IconSword color="#fff" size={18} /> INITIATE DUEL</span>
              </button>
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                {/* Primary FIGHT button */}
                <button
                  onClick={executeCombatRound}
                  disabled={!canFight}
                  className={canFight ? "fight-btn-ready" : ""}
                  style={{
                    width: "100%", padding: "18px",
                    background: canFight
                      ? "linear-gradient(135deg, #ff003c 0%, #cc0030 100%)"
                      : "rgba(30,30,30,0.8)",
                    border: canFight ? "none" : "2px solid rgba(255,0,60,0.2)",
                    color: canFight ? "#ffffff" : "rgba(255,255,255,0.2)",
                    fontFamily: "Orbitron, sans-serif",
                    fontSize: "18px", fontWeight: 900, letterSpacing: "0.3em",
                    cursor: canFight ? "pointer" : "not-allowed",
                    boxShadow: canFight ? "0 0 50px rgba(255,0,60,0.6), inset 0 1px 0 rgba(255,255,255,0.1)" : "none",
                    textTransform: "uppercase",
                    textShadow: canFight ? "0 0 15px rgba(255,255,255,0.5)" : "none",
                    transition: "all 0.15s",
                    clipPath: "polygon(10px 0%, 100% 0%, calc(100% - 10px) 100%, 0% 100%)",
                  }}
                >
                  {canFight
                    ? <span style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "10px" }}><IconSword color="#fff" size={20} /> FIGHT</span>
                    : (!selectedAttack && !selectedDefense) ? "SELECT ATTACK + DEFEND"
                    : !selectedAttack ? "SELECT ATTACK TARGET"
                    : "SELECT DEFENSE ZONE"}
                </button>

                {/* Status chips */}
                {canFight && (
                  <div style={{ display: "flex", justifyContent: "center", gap: "8px", fontFamily: "Rajdhani, sans-serif", fontSize: "10px", letterSpacing: "0.12em", color: "rgba(255,255,255,0.4)" }}>
                    <span style={{ color: "#ff003c" }}>ATK: [{selectedAttack}]</span>
                    <IconDot color="rgba(255,255,255,0.2)" size={4} />
                    <span style={{ color: "#aaa" }}>DEF: [{selectedDefense}]</span>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ─── RIGHT PLAYER PANEL ─────────────────────────────────────────── */}
        <div style={{ padding: "16px 20px 16px 16px", display: "flex", flexDirection: "column", gap: "12px", justifyContent: "flex-start" }}>
          {/* Opponent identity */}
          <div style={{ background: "rgba(0,0,0,0.5)", border: "1px solid rgba(255,255,255,0.07)", backdropFilter: "blur(6px)", padding: "14px" }}>
            <div style={{ display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "10px", marginBottom: "6px" }}>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontFamily: "Orbitron, sans-serif", color: "#ffffff", fontWeight: 900, fontSize: "15px", letterSpacing: "0.06em", lineHeight: 1.1 }}>DESGECEAN</div>
                <div style={{ fontFamily: "Rajdhani, sans-serif", fontSize: "10px", color: "#555", letterSpacing: "0.15em", fontWeight: 700 }}>
                  RANK: SURVIVOR &nbsp;•&nbsp; RATING: 1732
                </div>
              </div>
              <IconCrosshair color="#555" size={20} />
            </div>
            <HpBar hp={opponentHp} maxHp={opponentMaxHp} color="#cccccc" />
            {opponentStatus.length > 0 && (
              <div style={{ display: "flex", gap: "4px", marginTop: "6px", justifyContent: "flex-end" }}>
                {opponentStatus.map((s, i) => <span key={i} style={{ border: "1px solid #aaa", color: "#aaa", fontFamily: "monospace", fontSize: "9px", padding: "1px 5px" }}>{s}</span>)}
              </div>
            )}
          </div>

          {/* Stats */}
          <div style={{ background: "rgba(0,0,0,0.4)", border: "1px solid rgba(255,255,255,0.06)", backdropFilter: "blur(4px)", padding: "12px", display: "flex", flexDirection: "column", gap: "7px" }}>
            <StatBar label="ATTACK" value={opponentStats.attack} max={100} color="#888" />
            <StatBar label="DEFENSE" value={opponentStats.defense} max={100} color="#888" />
            <StatBar label="AGILITY" value={opponentStats.agility} max={100} color="#888" />
            <StatBar label="INTELLECT" value={opponentStats.intellect} max={100} color="#888" />
            <StatBar label="LUCK" value={opponentStats.luck} max={100} color="#888" />
          </div>

          {/* STRIKE TARGET (attack selector) */}
          <div style={{ background: "rgba(0,0,0,0.45)", border: "1px solid rgba(255,0,60,0.1)", backdropFilter: "blur(4px)", padding: "12px" }}>
            <LimbSelector
              label="STRIKE TARGET — ATTACK"
              selected={selectedAttack}
              onSelect={setSelectedAttack}
              accentColor="#ff003c"
              disabled={!matchActive || !!combatOutcome}
            />
          </div>
        </div>
      </main>

      {/* ═══════════════════════════════ FOOTER PANELS ═══════════════════════ */}
      <footer style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "0", height: "195px", flexShrink: 0, position: "relative", zIndex: 20, borderTop: "1px solid rgba(255,0,60,0.06)" }}>

        {/* ─── ARENA CHAT ──────────────────────────────────────────────────── */}
        <div style={{ background: "rgba(2,2,2,0.7)", backdropFilter: "blur(6px)", borderRight: "1px solid rgba(255,0,60,0.07)", padding: "10px 12px", display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "7px", borderBottom: "1px solid rgba(255,0,60,0.07)", paddingBottom: "6px" }}>
            <IconDot color="#ff003c" size={6} />
            <span style={{ fontFamily: "Orbitron, sans-serif", fontSize: "9px", color: "#ff003c", fontWeight: 900, letterSpacing: "0.15em" }}>ARENA CHAT</span>
          </div>
          <div className="hud-scrollbar" style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "3px", marginBottom: "7px" }}>
            {chatMessages.map((m, i) => (
              <div key={i} style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "10px", lineHeight: 1.4 }}>
                <span style={{ color: "rgba(255,255,255,0.2)" }}>[{m.time}] </span>
                <span style={{ color: m.color || "#666", fontWeight: 700 }}>{m.sender}: </span>
                <span style={{ color: "rgba(255,255,255,0.75)" }}>{m.text}</span>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>
          <form onSubmit={handleSendChat} style={{ display: "flex", border: "1px solid rgba(255,0,60,0.15)", background: "#050505" }}>
            <input
              value={chatInput}
              onChange={e => setChatInput(e.target.value)}
              placeholder="TYPE TRANSMISSION..."
              style={{ flex: 1, background: "transparent", border: "none", color: "#fff", fontFamily: "JetBrains Mono, monospace", fontSize: "10px", padding: "5px 8px", outline: "none", textTransform: "uppercase" }}
            />
            <button type="submit" style={{ background: "transparent", border: "none", color: "#ff003c", padding: "0 8px", cursor: "pointer", display: "flex", alignItems: "center" }}><IconSend color="#ff003c" /></button>
          </form>
        </div>

        {/* ─── MUTATORS ────────────────────────────────────────────────────── */}
        <div style={{ background: "rgba(2,2,2,0.7)", backdropFilter: "blur(6px)", borderRight: "1px solid rgba(255,0,60,0.07)", padding: "10px 12px", display: "flex", flexDirection: "column" }}>
          <div style={{ fontFamily: "Orbitron, sans-serif", fontSize: "9px", color: "#555", fontWeight: 900, letterSpacing: "0.15em", marginBottom: "8px", borderBottom: "1px solid rgba(255,0,60,0.07)", paddingBottom: "6px" }}>
            MUTATORS
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "5px", flex: 1 }}>
            {[
              { active: toxicFogActive, toggle: setToxicFogActive, Icon: IconSkull, name: "TOXIC FOG", effect: "-10% HP REGEN" },
              { active: scarceAmmoActive, toggle: setScarceAmmoActive, Icon: IconAmmo, name: "SCARCE AMMO", effect: "-15% DAMAGE" },
              { active: electroSurgeActive, toggle: setElectroSurgeActive, Icon: IconBolt, name: "ELECTRO SURGE", effect: "+10% AGILITY" },
              { active: dataBreachActive, toggle: setDataBreachActive, Icon: IconLock, name: "DATA BREACH", effect: "-5% INTELLECT" },
            ].map((m) => (
              <div
                key={m.name}
                onClick={() => !matchActive && m.toggle(!m.active)}
                style={{
                  border: `1px solid ${m.active ? "#ff003c" : "rgba(255,255,255,0.06)"}`,
                  background: m.active ? "rgba(255,0,60,0.08)" : "rgba(5,5,5,0.5)",
                  padding: "6px 8px",
                  cursor: matchActive ? "not-allowed" : "pointer",
                  display: "flex", flexDirection: "column", justifyContent: "space-between",
                  transition: "all 0.12s",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
                  <m.Icon color={m.active ? "#ff003c" : "#444"} size={12} />
                  <span style={{ fontFamily: "Rajdhani, sans-serif", fontSize: "10px", color: m.active ? "#fff" : "#555", fontWeight: 700, letterSpacing: "0.05em" }}>{m.name}</span>
                </div>
                <span style={{ fontFamily: "Oxanium, sans-serif", fontSize: "10px", color: "#ff003c", fontWeight: 700 }}>{m.effect}</span>
              </div>
            ))}
          </div>
        </div>

        {/* ─── BATTLE LOG ──────────────────────────────────────────────────── */}
        <div style={{ background: "rgba(2,2,2,0.7)", backdropFilter: "blur(6px)", padding: "10px 12px", display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "7px", borderBottom: "1px solid rgba(255,0,60,0.07)", paddingBottom: "6px" }}>
            <span style={{ fontFamily: "Orbitron, sans-serif", fontSize: "9px", color: "#555", fontWeight: 900, letterSpacing: "0.15em" }}>BATTLE LOG</span>
          </div>
          <div className="hud-scrollbar" style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "3px" }}>
            {battleLogs.map((l, i) => (
              <div key={i} style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "10px", lineHeight: 1.4 }}>
                <span style={{ color: "rgba(255,255,255,0.2)" }}>[{l.time}] </span>
                <span style={{ color: l.color ? l.color : l.sender === profileName ? "#fff" : l.sender === "DESGECEAN" ? "#ff003c" : "#555" }}>
                  {l.text}
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
