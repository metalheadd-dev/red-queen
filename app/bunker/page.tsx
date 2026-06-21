"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/components/AuthProvider";
import { useWallet } from "@solana/wallet-adapter-react";
import Link from "next/link";

// ── SVG ICONS ────────────────────────────────────────────────────────────────
const IcShield = ({ c, s = 14 }: { c: string; s?: number }) => (
  <svg width={s} height={s} viewBox="0 0 16 16" fill="none">
    <path d="M8 2L14 5L14 9C14 12 8 15 8 15C8 15 2 12 2 9L2 5Z" stroke={c} strokeWidth="1.5" fill="none" />
    <line x1="8" y1="6" x2="8" y2="12" stroke={c} strokeWidth="1" />
    <line x1="5" y1="9" x2="11" y2="9" stroke={c} strokeWidth="1" />
  </svg>
);
const IcDrop = ({ c, s = 14 }: { c: string; s?: number }) => (
  <svg width={s} height={s} viewBox="0 0 16 16" fill="none">
    <path d="M8 2C8 2 3 8 3 11C3 13.8 5.2 16 8 16C10.8 16 13 13.8 13 11C13 8 8 2 8 2Z" stroke={c} strokeWidth="1.5" fill="none" />
  </svg>
);
const IcFood = ({ c, s = 14 }: { c: string; s?: number }) => (
  <svg width={s} height={s} viewBox="0 0 16 16" fill="none">
    <line x1="3" y1="4" x2="3" y2="14" stroke={c} strokeWidth="1.5" />
    <path d="M3 4C3 4 3 1 6 1L6 7C6 7 3 7 3 4Z" stroke={c} strokeWidth="1.2" fill="none" />
    <line x1="10" y1="1" x2="10" y2="5" stroke={c} strokeWidth="1.5" />
    <line x1="8" y1="3" x2="12" y2="3" stroke={c} strokeWidth="1.2" />
    <path d="M8 5C8 5 7 7 10 7C13 7 12 5 12 5" stroke={c} strokeWidth="1.2" fill="none" />
    <line x1="10" y1="7" x2="10" y2="14" stroke={c} strokeWidth="1.5" />
  </svg>
);
const IcPower = ({ c, s = 14 }: { c: string; s?: number }) => (
  <svg width={s} height={s} viewBox="0 0 16 16" fill="none">
    <polyline points="10,2 6,8 10,8 6,14" stroke={c} strokeWidth="1.5" fill="none" />
  </svg>
);
const IcDot = ({ c, s = 6 }: { c: string; s?: number }) => (
  <svg width={s} height={s} viewBox="0 0 6 6" fill="none">
    <circle cx="3" cy="3" r="2.5" fill={c} />
  </svg>
);
const IcArrow = ({ c }: { c: string }) => (
  <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
    <polyline points="2,8 14,8" stroke={c} strokeWidth="1.5" />
    <polyline points="10,4 14,8 10,12" stroke={c} strokeWidth="1.5" fill="none" />
  </svg>
);
const IcLock = ({ c, s = 12 }: { c: string; s?: number }) => (
  <svg width={s} height={s} viewBox="0 0 16 16" fill="none">
    <rect x="3" y="8" width="10" height="7" stroke={c} strokeWidth="1.2" fill="none" />
    <path d="M5 8V6C5 4 11 4 11 6V8" stroke={c} strokeWidth="1.2" fill="none" />
    <circle cx="8" cy="11.5" r="1" fill={c} />
  </svg>
);
const IcSword = ({ c, s = 14 }: { c: string; s?: number }) => (
  <svg width={s} height={s} viewBox="0 0 16 16" fill="none">
    <line x1="2" y1="14" x2="12" y2="4" stroke={c} strokeWidth="1.5" />
    <polyline points="10,2 14,2 14,6" stroke={c} strokeWidth="1.5" fill="none" />
    <line x1="2" y1="10" x2="4" y2="12" stroke={c} strokeWidth="1.2" />
  </svg>
);
const IcRadar = ({ c, s = 14 }: { c: string; s?: number }) => (
  <svg width={s} height={s} viewBox="0 0 16 16" fill="none">
    <circle cx="8" cy="8" r="6" stroke={c} strokeWidth="1.2" fill="none" />
    <circle cx="8" cy="8" r="3" stroke={c} strokeWidth="1" fill="none" />
    <line x1="8" y1="8" x2="13" y2="4" stroke={c} strokeWidth="1.2" />
    <circle cx="13" cy="4" r="1" fill={c} />
  </svg>
);

// ── DATA ─────────────────────────────────────────────────────────────────────
const FACTIONS = [
  { id: "survivors",   name: "SURVIVORS",        color: "#aaaaaa", item: "Canteen",       passive: "-15% Durability Break",    weakness: "No spec bonuses" },
  { id: "nomads",      name: "NOMADS",           color: "#ff8800", item: "Compass",       passive: "Yield × 1.15",             weakness: "-15% Armor" },
  { id: "marauders",   name: "MARAUDERS",        color: "#ff003c", item: "Spiked Vest",   passive: "Damage × 1.10",            weakness: "Predictable ATK" },
  { id: "scientists",  name: "SCIENTISTS",       color: "#00aaff", item: "Slate",         passive: "Craft Time × 0.80",        weakness: "-10% Max HP" },
  { id: "governments", name: "GOVERNMENTS",      color: "#ffffff", item: "Comms Badge",   passive: "Reduces Escape Chance",    weakness: "-10% Initiative" },
  { id: "engineers",   name: "ENGINEERS",        color: "#ff6b00", item: "Heavy Wrench",  passive: "Build Cost × 0.85",        weakness: "Crit cap 1.2×" },
  { id: "hackers",     name: "HACKERS",          color: "#00ff88", item: "Decrypt Rig",   passive: "Predicts Events +48h",     weakness: "-25% Melee" },
  { id: "syndicates",  name: "SYNDICATES",       color: "#d4af37", item: "Energy Shield", passive: "Shield × 1.20",            weakness: "+15% Maintenance" },
];

const SEED_CHAT = [
  { time: "01:05", sender: "CYBER_NOMAD",    text: "WATER IN SECTOR 4 DOWN TO 12%. ANYONE GOT FILTERS?",      color: undefined as string | undefined },
  { time: "01:08", sender: "GATEKEEPER_X",   text: "SYNDICATE SHIELDS STABLE. STAKED 300 THREAT.",            color: "#d4af37" },
  { time: "01:12", sender: "RADIO_GHOST",    text: "RED QUEEN BOUNTY ON MARAUDER_BLADE. TARGET AUDIT ACTIVE.", color: "#ff003c" },
  { time: "01:14", sender: "NET_VIPER",      text: "NET SCAN DONE. SECURE LINES.",                            color: undefined },
];

// ── RESOURCE BAR ─────────────────────────────────────────────────────────────
function ResBar({ label, value, color, Icon }: { label: string; value: number; color: string; Icon: React.FC<{ c: string; s?: number }> }) {
  const warn = value < 30;
  const c = warn ? "#ff003c" : color;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <Icon c={c} s={12} />
          <span style={{ fontFamily: "Rajdhani, sans-serif", fontSize: "11px", letterSpacing: "0.15em", color: "rgba(255,255,255,0.5)", fontWeight: 700 }}>{label}</span>
        </div>
        <span style={{ fontFamily: "Orbitron, sans-serif", fontSize: "11px", color: c, fontWeight: 900 }}>{value.toFixed(1)}%</span>
      </div>
      <div style={{ height: "4px", background: "rgba(255,255,255,0.05)", position: "relative" }}>
        <div style={{ height: "100%", width: `${value}%`, background: c, boxShadow: `0 0 8px ${c}66`, transition: "width 0.8s ease" }} />
        {warn && <div style={{ position: "absolute", right: 0, top: "-2px", width: "4px", height: "8px", background: "#ff003c", animation: "hud-blink 0.8s infinite" }} />}
      </div>
    </div>
  );
}

// ── MAIN PAGE ─────────────────────────────────────────────────────────────────
export default function BunkerPage() {
  const { authIdentifier } = useAuth();
  const { publicKey } = useWallet();
  const currentWallet = authIdentifier || (publicKey ? publicKey.toString() : null);

  const [profileName, setProfileName] = useState("SURVIVOR_GUEST");
  const [selectedFaction, setSelectedFaction] = useState(FACTIONS[0]);
  const [stakedThreat, setStakedThreat] = useState(150);
  const [shieldIntegrity, setShieldIntegrity] = useState(65);
  const [stakeInput, setStakeInput] = useState("");

  const [waterLevel, setWaterLevel] = useState(45.5);
  const [foodLevel, setFoodLevel] = useState(62.8);
  const [powerGrid, setPowerGrid] = useState(78.2);

  const [cliInput, setCliInput] = useState("");
  const [cliHistory, setCliHistory] = useState([
    "RED QUEEN CORE v7.4.1 // BUNKER NODE ONLINE",
    "READY. Type 'help' for commands.",
  ]);
  const [decryptionAttempts, setDecryptionAttempts] = useState(5);
  const [isDecrypting, setIsDecrypting] = useState(false);

  const [chatMessages, setChatMessages] = useState<typeof SEED_CHAT>([]);
  const [chatInput, setChatInput] = useState("");

  const chatEndRef = useRef<HTMLDivElement>(null);
  const cliEndRef = useRef<HTMLDivElement>(null);

  // Profile fetch
  useEffect(() => {
    if (!currentWallet) return;
    fetch(`/api/profile?wallet=${currentWallet}`)
      .then(r => r.json())
      .then(d => {
        if (d?.profile) {
          const n = d.profile.apocalyptic_name || d.profile.apoptotic_name || `OPERATIVE_${currentWallet.slice(0, 6)}`;
          setProfileName(n.toUpperCase());
        }
      })
      .catch(() => setProfileName(`OPERATIVE_${currentWallet.slice(0, 6)}`.toUpperCase()));
  }, [currentWallet]);

  // Chat restore
  useEffect(() => {
    const cached = typeof window !== "undefined" && localStorage.getItem("redqueen_bunker_general_chat");
    if (cached) {
      try { setChatMessages(JSON.parse(cached)); } catch { setChatMessages(SEED_CHAT); }
    } else {
      setChatMessages(SEED_CHAT);
      localStorage.setItem("redqueen_bunker_general_chat", JSON.stringify(SEED_CHAT));
    }
    const attempts = typeof window !== "undefined" && localStorage.getItem("redqueen_bunker_decryption_attempts");
    if (attempts) setDecryptionAttempts(Number(attempts));
  }, []);

  // Shield calc
  useEffect(() => {
    const bonus = selectedFaction.id === "syndicates" ? 1.20 : 1.0;
    setShieldIntegrity(Math.min(99, Math.round(25 * bonus + Math.log2(stakedThreat + 1) * 8.5)));
  }, [stakedThreat, selectedFaction]);

  // Resource drift
  useEffect(() => {
    const t = setInterval(() => {
      setWaterLevel(p => Math.max(0, Math.min(100, parseFloat((p + (Math.random() - 0.5) * 0.15).toFixed(2)))));
      setFoodLevel(p => Math.max(0, Math.min(100, parseFloat((p + (Math.random() - 0.5) * 0.12).toFixed(2)))));
      setPowerGrid(p => Math.max(0, Math.min(100, parseFloat((p + (Math.random() - 0.5) * 0.2).toFixed(2)))));
    }, 3000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [chatMessages]);
  useEffect(() => { cliEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [cliHistory]);

  const handleChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    const t = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const msg = { time: t, sender: profileName, text: chatInput.toUpperCase(), color: "#ff003c" };
    const updated = [...chatMessages, msg];
    setChatMessages(updated);
    setChatInput("");
    localStorage.setItem("redqueen_bunker_general_chat", JSON.stringify(updated));
    setTimeout(() => {
      const names = ["CYPHER_REBEL", "MARKET_RUNNER", "WASTE_STALKER"];
      const texts = ["DIRECTIVE PARAMETERS LOCK ACQUIRED.", "WATER MINIMUMS MODIFIED.", "ARENA ENCOUNTERS ENFORCED."];
      const bot = { time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }), sender: names[Math.floor(Math.random() * 3)], text: texts[Math.floor(Math.random() * 3)], color: undefined as string | undefined };
      const final = [...updated, bot];
      setChatMessages(final);
      localStorage.setItem("redqueen_bunker_general_chat", JSON.stringify(final));
    }, 1200);
  };

  const runDecrypt = () => {
    if (decryptionAttempts <= 0) { setCliHistory(p => [...p, ">> ERROR: ATTEMPTS EXHAUSTED. RECHARGE VIA STAKING."]); return; }
    setIsDecrypting(true);
    const next = decryptionAttempts - 1;
    setDecryptionAttempts(next);
    localStorage.setItem("redqueen_bunker_decryption_attempts", String(next));
    setCliHistory(p => [...p, ">> BYPASS INITIATED...", "CONNECTING TO NODE 0x4FF8..."]);
    let count = 0;
    const iv = setInterval(() => {
      const lines = [
        `[ SCANNING ] SECTOR_${Math.floor(Math.random() * 20)}...`,
        `[ BYPASSING ] PACKETS: ${Math.floor(Math.random() * 1000)} / 1000`,
        `[ DECRYPTING ] KEY MATCH: ${(50 + Math.random() * 45).toFixed(2)}%`,
      ];
      setCliHistory(p => [...p, lines[count % 3]]);
      count++;
      if (count >= 3) {
        clearInterval(iv);
        setIsDecrypting(false);
        setCliHistory(p => [...p, Math.random() > 0.15
          ? ">> SUCCESS: Coordinates decoded (45.1092, -122.6801)."
          : ">> FAILED: EM interference signal loss."
        ]);
      }
    }, 600);
  };

  const handleCli = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cliInput.trim() || isDecrypting) return;
    const cmd = cliInput.trim().toLowerCase();
    setCliHistory(p => [...p, `guest@redqueen:~$ ${cliInput}`]);
    setCliInput("");
    setTimeout(() => {
      if (cmd === "help") setCliHistory(p => [...p, "COMMANDS: help / clear / status / scan / decrypt"]);
      else if (cmd === "clear") setCliHistory([]);
      else if (cmd === "status") setCliHistory(p => [...p, `STABLE. FACTION: ${selectedFaction.name}. ESCROW: ${stakedThreat}T. SHIELD: ${shieldIntegrity}%.`]);
      else if (cmd === "scan") setCliHistory(p => [...p, "SWEEPING...", "  TARGET: MARAUDER_BLADE [GRID_18.2] (120 THREAT)", "  TARGET: COLLECTIVE_U04 [GRID_4.5] (250 THREAT)"]);
      else if (cmd === "decrypt") runDecrypt();
      else setCliHistory(p => [...p, `>> UNKNOWN: '${cmd}'`]);
    }, 150);
  };

  const handleStake = () => {
    const v = parseInt(stakeInput);
    if (!isNaN(v) && v > 0) { setStakedThreat(p => p + v); setStakeInput(""); }
  };

  const shieldColor = shieldIntegrity > 60 ? "#00ff88" : shieldIntegrity > 30 ? "#ff8800" : "#ff003c";

  return (
    <div
      id="game-bunker-root"
      style={{
        background: "#030303",
        minHeight: "100vh",
        color: "#ffffff",
        fontFamily: "Rajdhani, sans-serif",
        position: "relative",
        boxSizing: "border-box",
        overflowX: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* Ambient glows */}
      <div style={{ position: "fixed", top: 0, left: 0, width: "40%", height: "100%", background: "radial-gradient(ellipse at 10% 40%, rgba(255,0,60,0.07) 0%, transparent 60%)", pointerEvents: "none", zIndex: 0 }} />
      <div style={{ position: "fixed", top: 0, right: 0, width: "40%", height: "100%", background: "radial-gradient(ellipse at 90% 60%, rgba(0,180,255,0.04) 0%, transparent 60%)", pointerEvents: "none", zIndex: 0 }} />

      {/* Scanlines */}
      <div className="hud-scanline" />

      {/* Grid */}
      <div style={{ position: "fixed", inset: 0, backgroundImage: "linear-gradient(rgba(255,0,60,0.004) 1px, transparent 1px), linear-gradient(90deg, rgba(255,0,60,0.004) 1px, transparent 1px)", backgroundSize: "40px 40px", pointerEvents: "none", zIndex: 0 }} />

      {/* Frame */}
      <div style={{ position: "fixed", top: "10px", left: "10px", right: "10px", bottom: "10px", border: "1px solid rgba(255,0,60,0.06)", pointerEvents: "none", zIndex: 50 }} />

      {/* ═══ HEADER ══════════════════════════════════════════════════════════ */}
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "14px 24px 12px", borderBottom: "1px solid rgba(255,0,60,0.07)", position: "relative", zIndex: 20, flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
          <span style={{ fontFamily: "Orbitron, sans-serif", color: "#ff003c", fontWeight: 900, fontSize: "15px", letterSpacing: "0.25em" }}>
            &gt; BASE BUNKER &nbsp;///&nbsp; COMMAND HUB &nbsp;///
          </span>
          <div style={{ display: "flex", gap: "12px", fontSize: "11px", fontFamily: "Oxanium, sans-serif", fontWeight: 700, letterSpacing: "0.08em" }}>
            <Link href="/" style={{ color: "#555", textDecoration: "none" }}>[ LEAVE_HUB ]</Link>
            <Link href="/arena" style={{ color: "#555", textDecoration: "none" }}>[ PVP_ARENA ]</Link>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "16px", fontFamily: "Rajdhani, sans-serif", fontSize: "12px", color: "#555", letterSpacing: "0.15em", fontWeight: 700 }}>
          <IcDot c="#ff003c" s={6} />
          <span style={{ color: "#fff" }}>GRID: STABLE</span>
          <span style={{ color: "#444" }}>|</span>
          <span>NODE v7.4.1</span>
          <span style={{ color: "#444" }}>|</span>
          <span style={{ color: "#ff003c" }}>{profileName}</span>
        </div>
      </header>

      {/* ═══ MAIN GRID ═══════════════════════════════════════════════════════ */}
      <main style={{ display: "grid", gridTemplateColumns: "280px 1fr 280px", gap: "0", flexGrow: 1, position: "relative", zIndex: 10, minHeight: 0 }}>

        {/* ── LEFT COLUMN ──────────────────────────────────────────────────── */}
        <div style={{ borderRight: "1px solid rgba(255,0,60,0.07)", display: "flex", flexDirection: "column", gap: "0", overflowY: "auto", maxHeight: "calc(100vh - 120px)" }}>

          {/* RESOURCES */}
          <div style={{ padding: "14px 16px", borderBottom: "1px solid rgba(255,0,60,0.07)" }}>
            <div style={{ fontFamily: "Orbitron, sans-serif", fontSize: "9px", color: "#ff003c", fontWeight: 900, letterSpacing: "0.2em", marginBottom: "12px" }}>
              BUNKER RESOURCES
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <ResBar label="WATER" value={waterLevel} color="#00aaff" Icon={IcDrop} />
              <ResBar label="FOOD" value={foodLevel} color="#00ff88" Icon={IcFood} />
              <ResBar label="POWER" value={powerGrid} color="#ff8800" Icon={IcPower} />
            </div>
          </div>

          {/* SHIELD STATUS */}
          <div style={{ padding: "14px 16px", borderBottom: "1px solid rgba(255,0,60,0.07)" }}>
            <div style={{ fontFamily: "Orbitron, sans-serif", fontSize: "9px", color: "#ff003c", fontWeight: 900, letterSpacing: "0.2em", marginBottom: "12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span>SHIELD INTEGRITY</span>
              <span style={{ color: shieldColor, fontSize: "14px", fontWeight: 900 }}>{shieldIntegrity}%</span>
            </div>
            {/* Shield ring */}
            <div style={{ display: "flex", justifyContent: "center", marginBottom: "10px" }}>
              <svg width="90" height="90" viewBox="0 0 90 90" fill="none">
                <circle cx="45" cy="45" r="38" stroke="rgba(255,255,255,0.05)" strokeWidth="6" fill="none" />
                <circle cx="45" cy="45" r="38" stroke={shieldColor} strokeWidth="6" fill="none"
                  strokeDasharray={`${2 * Math.PI * 38 * shieldIntegrity / 100} ${2 * Math.PI * 38}`}
                  strokeDashoffset={2 * Math.PI * 38 * 0.25}
                  strokeLinecap="butt"
                  style={{ filter: `drop-shadow(0 0 6px ${shieldColor})`, transition: "stroke-dasharray 0.8s ease" }}
                />
                <text x="45" y="41" textAnchor="middle" fill={shieldColor} fontSize="13" fontFamily="Orbitron" fontWeight="900">{shieldIntegrity}%</text>
                <text x="45" y="55" textAnchor="middle" fill="rgba(255,255,255,0.3)" fontSize="7" fontFamily="Rajdhani" letterSpacing="2">INTEGRITY</text>
              </svg>
            </div>
            {/* Staking */}
            <div style={{ fontFamily: "Rajdhani, sans-serif", fontSize: "10px", color: "#555", letterSpacing: "0.1em", marginBottom: "6px" }}>ESCROW: <span style={{ color: "#d4af37", fontWeight: 900 }}>{stakedThreat} $THREAT</span></div>
            <div style={{ display: "flex", gap: "6px" }}>
              <input
                value={stakeInput}
                onChange={e => setStakeInput(e.target.value)}
                placeholder="AMOUNT"
                style={{ flex: 1, background: "rgba(0,0,0,0.5)", border: "1px solid rgba(255,0,60,0.2)", color: "#fff", fontFamily: "Orbitron, sans-serif", fontSize: "10px", padding: "6px 8px", outline: "none", letterSpacing: "0.08em" }}
              />
              <button
                onClick={handleStake}
                style={{ background: "rgba(255,0,60,0.15)", border: "1px solid #ff003c", color: "#ff003c", fontFamily: "Orbitron, sans-serif", fontSize: "9px", padding: "6px 10px", cursor: "pointer", letterSpacing: "0.1em", fontWeight: 900 }}
              >
                STAKE
              </button>
            </div>
            <div style={{ display: "flex", gap: "4px", marginTop: "5px" }}>
              {[50, 100, 500].map(v => (
                <button key={v} onClick={() => { setStakedThreat(p => p + v); }}
                  style={{ flex: 1, background: "transparent", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.4)", fontFamily: "Orbitron, sans-serif", fontSize: "9px", padding: "4px 0", cursor: "pointer" }}>
                  +{v}
                </button>
              ))}
            </div>
          </div>

          {/* ENTER ARENA CTA */}
          <div style={{ padding: "14px 16px" }}>
            <Link href="/arena" style={{ textDecoration: "none" }}>
              <button style={{
                width: "100%", padding: "14px",
                background: "linear-gradient(135deg, #ff003c 0%, #cc0030 100%)",
                border: "none", color: "#fff",
                fontFamily: "Orbitron, sans-serif", fontSize: "13px", fontWeight: 900, letterSpacing: "0.2em",
                cursor: "pointer",
                boxShadow: "0 0 30px rgba(255,0,60,0.4)",
                clipPath: "polygon(8px 0%, 100% 0%, calc(100% - 8px) 100%, 0% 100%)",
                display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
              }}>
                <IcSword c="#fff" s={16} /> ENTER ARENA
              </button>
            </Link>
          </div>
        </div>

        {/* ── CENTER COLUMN ────────────────────────────────────────────────── */}
        <div style={{ display: "flex", flexDirection: "column", overflowY: "auto", maxHeight: "calc(100vh - 120px)" }}>

          {/* FACTION SELECTOR */}
          <div style={{ padding: "14px 16px", borderBottom: "1px solid rgba(255,0,60,0.07)" }}>
            <div style={{ fontFamily: "Orbitron, sans-serif", fontSize: "9px", color: "#ff003c", fontWeight: 900, letterSpacing: "0.2em", marginBottom: "10px" }}>
              FACTION REGISTRY
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "5px" }}>
              {FACTIONS.map(f => {
                const active = selectedFaction.id === f.id;
                return (
                  <div
                    key={f.id}
                    onClick={() => setSelectedFaction(f)}
                    style={{
                      border: `1px solid ${active ? f.color : "rgba(255,255,255,0.07)"}`,
                      background: active ? `${f.color}18` : "rgba(5,5,5,0.6)",
                      padding: "10px 12px",
                      cursor: "pointer",
                      transition: "all 0.12s",
                      boxShadow: active ? `0 0 12px ${f.color}33` : "none",
                    }}
                  >
                    <div style={{ fontFamily: "Orbitron, sans-serif", fontSize: "10px", color: active ? f.color : "#888", fontWeight: 900, letterSpacing: "0.08em", marginBottom: "3px" }}>{f.name}</div>
                    <div style={{ fontFamily: "Rajdhani, sans-serif", fontSize: "10px", color: "rgba(255,255,255,0.4)", letterSpacing: "0.05em" }}>{f.passive}</div>
                    <div style={{ fontFamily: "Oxanium, sans-serif", fontSize: "9px", color: active ? f.color : "#444", marginTop: "4px", letterSpacing: "0.05em" }}>{f.item.toUpperCase()}</div>
                  </div>
                );
              })}
            </div>
            {/* Selected faction detail */}
            <div style={{ marginTop: "10px", background: `${selectedFaction.color}0d`, border: `1px solid ${selectedFaction.color}33`, padding: "10px 12px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontFamily: "Orbitron, sans-serif", fontSize: "11px", color: selectedFaction.color, fontWeight: 900, letterSpacing: "0.1em" }}>{selectedFaction.name}</div>
                <div style={{ fontFamily: "Rajdhani, sans-serif", fontSize: "10px", color: "rgba(255,255,255,0.4)", marginTop: "2px" }}>WEAKNESS: {selectedFaction.weakness}</div>
              </div>
              <IcShield c={selectedFaction.color} s={24} />
            </div>
          </div>

          {/* CLI TERMINAL */}
          <div style={{ padding: "14px 16px", borderBottom: "1px solid rgba(255,0,60,0.07)", flexGrow: 1 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
              <div style={{ fontFamily: "Orbitron, sans-serif", fontSize: "9px", color: "#ff003c", fontWeight: 900, letterSpacing: "0.2em" }}>
                DECRYPTION TERMINAL
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
                <span style={{ fontFamily: "Orbitron, sans-serif", fontSize: "9px", color: decryptionAttempts > 0 ? "#00ff88" : "#ff003c" }}>
                  {decryptionAttempts}/5 ATTEMPTS
                </span>
                <button
                  onClick={runDecrypt}
                  disabled={isDecrypting || decryptionAttempts <= 0}
                  style={{
                    background: isDecrypting ? "rgba(255,0,60,0.05)" : "rgba(255,0,60,0.15)",
                    border: "1px solid rgba(255,0,60,0.3)",
                    color: isDecrypting ? "#555" : "#ff003c",
                    fontFamily: "Orbitron, sans-serif", fontSize: "9px", padding: "4px 8px",
                    cursor: isDecrypting ? "not-allowed" : "pointer", letterSpacing: "0.1em", fontWeight: 900,
                    display: "flex", alignItems: "center", gap: "4px",
                  }}
                >
                  <IcLock c={isDecrypting ? "#555" : "#ff003c"} s={10} />
                  {isDecrypting ? "DECRYPTING..." : "DECRYPT"}
                </button>
              </div>
            </div>
            {/* CLI output */}
            <div className="hud-scrollbar" style={{
              background: "rgba(0,0,0,0.6)", border: "1px solid rgba(255,0,60,0.1)",
              padding: "8px 10px", height: "180px", overflowY: "auto",
              display: "flex", flexDirection: "column", gap: "2px",
            }}>
              {cliHistory.map((line, i) => (
                <div key={i} style={{
                  fontFamily: "JetBrains Mono, monospace", fontSize: "10px", lineHeight: 1.5,
                  color: line.startsWith(">>") ? "#ff003c" : line.startsWith("guest@") ? "#00ff88" : line.startsWith("[") ? "#ff8800" : "rgba(255,255,255,0.5)",
                }}>
                  {line}
                </div>
              ))}
              <div ref={cliEndRef} />
            </div>
            {/* Quick buttons */}
            <div style={{ display: "flex", gap: "4px", marginTop: "6px", marginBottom: "6px" }}>
              {["help", "status", "scan", "decrypt"].map(cmd => (
                <button key={cmd} onClick={() => {
                  setCliHistory(p => [...p, `guest@redqueen:~$ ${cmd}`]);
                  setTimeout(() => {
                    if (cmd === "help") setCliHistory(p => [...p, "COMMANDS: help / clear / status / scan / decrypt"]);
                    else if (cmd === "status") setCliHistory(p => [...p, `STABLE. FACTION: ${selectedFaction.name}. ESCROW: ${stakedThreat}T. SHIELD: ${shieldIntegrity}%.`]);
                    else if (cmd === "scan") setCliHistory(p => [...p, "SWEEPING...", "  TARGET: MARAUDER_BLADE [GRID_18.2] (120 THREAT)", "  TARGET: COLLECTIVE_U04 [GRID_4.5] (250 THREAT)"]);
                    else if (cmd === "decrypt") runDecrypt();
                  }, 150);
                }}
                  style={{ background: "transparent", border: "1px solid rgba(255,0,60,0.15)", color: "rgba(255,255,255,0.4)", fontFamily: "Orbitron, sans-serif", fontSize: "9px", padding: "3px 8px", cursor: "pointer", letterSpacing: "0.08em" }}>
                  {cmd}
                </button>
              ))}
            </div>
            {/* CLI input */}
            <form onSubmit={handleCli} style={{ display: "flex", border: "1px solid rgba(255,0,60,0.15)", background: "#050505" }}>
              <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "10px", color: "#00ff88", padding: "6px 6px 6px 8px" }}>$</span>
              <input
                value={cliInput}
                onChange={e => setCliInput(e.target.value)}
                placeholder="enter command..."
                disabled={isDecrypting}
                style={{ flex: 1, background: "transparent", border: "none", color: "#fff", fontFamily: "JetBrains Mono, monospace", fontSize: "10px", padding: "6px 4px", outline: "none" }}
              />
              <button type="submit" style={{ background: "transparent", border: "none", color: "#ff003c", padding: "0 8px", cursor: "pointer", display: "flex", alignItems: "center" }}>
                <IcArrow c="#ff003c" />
              </button>
            </form>
          </div>
        </div>

        {/* ── RIGHT COLUMN ─────────────────────────────────────────────────── */}
        <div style={{ borderLeft: "1px solid rgba(255,0,60,0.07)", display: "flex", flexDirection: "column", overflowY: "auto", maxHeight: "calc(100vh - 120px)" }}>

          {/* RADAR / SECTOR MAP */}
          <div style={{ padding: "14px 16px", borderBottom: "1px solid rgba(255,0,60,0.07)" }}>
            <div style={{ fontFamily: "Orbitron, sans-serif", fontSize: "9px", color: "#ff003c", fontWeight: 900, letterSpacing: "0.2em", marginBottom: "10px", display: "flex", alignItems: "center", gap: "6px" }}>
              <IcRadar c="#ff003c" s={10} /> SECTOR SCAN
            </div>
            {/* Radar display */}
            <div style={{ display: "flex", justifyContent: "center" }}>
              <div style={{ position: "relative", width: "140px", height: "140px" }}>
                <svg width="140" height="140" viewBox="0 0 140 140" fill="none" style={{ position: "absolute" }}>
                  <circle cx="70" cy="70" r="65" stroke="rgba(255,0,60,0.1)" strokeWidth="1" fill="none" />
                  <circle cx="70" cy="70" r="48" stroke="rgba(255,0,60,0.07)" strokeWidth="1" fill="none" />
                  <circle cx="70" cy="70" r="30" stroke="rgba(255,0,60,0.07)" strokeWidth="1" fill="none" />
                  <line x1="70" y1="5" x2="70" y2="135" stroke="rgba(255,0,60,0.06)" strokeWidth="1" />
                  <line x1="5" y1="70" x2="135" y2="70" stroke="rgba(255,0,60,0.06)" strokeWidth="1" />
                  <line x1="70" y1="70" x2="130" y2="30" stroke="rgba(255,0,60,0.5)" strokeWidth="1.5" className="hud-radar-scanner-sweep" style={{ transformOrigin: "70px 70px" }} />
                  {/* blip targets */}
                  <circle cx="105" cy="45" r="3" fill="#ff003c" className="hud-blink-fast" />
                  <circle cx="40" cy="95" r="2.5" fill="#ff8800" className="hud-blink-fast" />
                  <circle cx="90" cy="100" r="2" fill="#ffffff" />
                  <circle cx="70" cy="70" r="3" fill="#00ff88" />
                </svg>
              </div>
            </div>
            {/* Targets */}
            <div style={{ marginTop: "8px", display: "flex", flexDirection: "column", gap: "4px" }}>
              {[
                { name: "MARAUDER_BLADE", grid: "GRID_18.2", bounty: "120T", color: "#ff003c" },
                { name: "COLLECTIVE_U04", grid: "GRID_4.5",  bounty: "250T", color: "#ff8800" },
              ].map(t => (
                <div key={t.name} style={{ display: "flex", justifyContent: "space-between", padding: "5px 8px", background: "rgba(255,0,60,0.05)", border: "1px solid rgba(255,0,60,0.1)" }}>
                  <div>
                    <div style={{ fontFamily: "Orbitron, sans-serif", fontSize: "9px", color: t.color, fontWeight: 900 }}>{t.name}</div>
                    <div style={{ fontFamily: "Rajdhani, sans-serif", fontSize: "9px", color: "#444" }}>{t.grid}</div>
                  </div>
                  <span style={{ fontFamily: "Orbitron, sans-serif", fontSize: "10px", color: "#d4af37", fontWeight: 900, alignSelf: "center" }}>{t.bounty}</span>
                </div>
              ))}
            </div>
          </div>

          {/* DAILY ATTEMPTS */}
          <div style={{ padding: "14px 16px", borderBottom: "1px solid rgba(255,0,60,0.07)" }}>
            <div style={{ fontFamily: "Orbitron, sans-serif", fontSize: "9px", color: "#ff003c", fontWeight: 900, letterSpacing: "0.2em", marginBottom: "10px" }}>
              DAILY OPS
            </div>
            {[
              { label: "SCAVENGE RUNS", used: 1, max: 3, color: "#ff8800" },
              { label: "ARENA DUELS",   used: 0, max: 3, color: "#ff003c" },
              { label: "DECRYPTIONS",   used: 5 - decryptionAttempts, max: 5, color: "#00aaff" },
            ].map(op => (
              <div key={op.label} style={{ marginBottom: "8px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontFamily: "Rajdhani, sans-serif", fontSize: "10px", color: "rgba(255,255,255,0.4)", letterSpacing: "0.1em", marginBottom: "4px" }}>
                  <span>{op.label}</span>
                  <span style={{ color: op.color }}>{op.max - op.used}/{op.max}</span>
                </div>
                <div style={{ display: "flex", gap: "3px" }}>
                  {Array.from({ length: op.max }).map((_, i) => (
                    <div key={i} style={{ flex: 1, height: "6px", background: i < (op.max - op.used) ? op.color : "rgba(255,255,255,0.05)", boxShadow: i < (op.max - op.used) ? `0 0 4px ${op.color}66` : "none" }} />
                  ))}
                </div>
              </div>
            ))}
          </div>

          {/* BUNKER CHAT */}
          <div style={{ padding: "14px 16px", flexGrow: 1, display: "flex", flexDirection: "column" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "8px" }}>
              <IcDot c="#ff003c" s={6} />
              <span style={{ fontFamily: "Orbitron, sans-serif", fontSize: "9px", color: "#ff003c", fontWeight: 900, letterSpacing: "0.15em" }}>BUNKER CHAT</span>
            </div>
            <div className="hud-scrollbar" style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "4px", minHeight: "120px", maxHeight: "200px", marginBottom: "8px" }}>
              {chatMessages.map((m, i) => (
                <div key={i} style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "10px", lineHeight: 1.4 }}>
                  <span style={{ color: "rgba(255,255,255,0.2)" }}>[{m.time}] </span>
                  <span style={{ color: m.color || "#888", fontWeight: 700 }}>{m.sender}: </span>
                  <span style={{ color: "rgba(255,255,255,0.7)" }}>{m.text}</span>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>
            <form onSubmit={handleChat} style={{ display: "flex", border: "1px solid rgba(255,0,60,0.15)", background: "#050505" }}>
              <input
                value={chatInput}
                onChange={e => setChatInput(e.target.value)}
                placeholder="TRANSMIT..."
                style={{ flex: 1, background: "transparent", border: "none", color: "#fff", fontFamily: "JetBrains Mono, monospace", fontSize: "10px", padding: "5px 8px", outline: "none", textTransform: "uppercase" }}
              />
              <button type="submit" style={{ background: "transparent", border: "none", color: "#ff003c", padding: "0 8px", cursor: "pointer", display: "flex", alignItems: "center" }}>
                <IcArrow c="#ff003c" />
              </button>
            </form>
          </div>
        </div>
      </main>
    </div>
  );
}
