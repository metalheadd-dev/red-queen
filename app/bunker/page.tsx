"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/components/AuthProvider";
import { useWallet } from "@solana/wallet-adapter-react";
import Link from "next/link";

// ── SVG ICONS ─────────────────────────────────────────────────────────────────
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
const IcPower = ({ c, s = 14 }: { c: string; s?: number }) => (
  <svg width={s} height={s} viewBox="0 0 16 16" fill="none">
    <polyline points="10,2 6,8 10,8 6,14" stroke={c} strokeWidth="1.5" fill="none" />
  </svg>
);
const IcFood = ({ c, s = 14 }: { c: string; s?: number }) => (
  <svg width={s} height={s} viewBox="0 0 16 16" fill="none">
    <line x1="3" y1="4" x2="3" y2="14" stroke={c} strokeWidth="1.5" />
    <path d="M3 4C3 4 3 1 6 1L6 7C6 7 3 7 3 4Z" stroke={c} strokeWidth="1.2" fill="none" />
    <line x1="10" y1="7" x2="10" y2="14" stroke={c} strokeWidth="1.5" />
    <path d="M8 7C8 7 7 5 10 5C13 5 12 7 12 7" stroke={c} strokeWidth="1.2" fill="none" />
  </svg>
);
const IcLock = ({ c, s = 14 }: { c: string; s?: number }) => (
  <svg width={s} height={s} viewBox="0 0 16 16" fill="none">
    <rect x="3" y="8" width="10" height="7" stroke={c} strokeWidth="1.2" fill="none" />
    <path d="M5 8V6C5 4 11 4 11 6V8" stroke={c} strokeWidth="1.2" fill="none" />
    <circle cx="8" cy="11.5" r="1" fill={c} />
  </svg>
);
const IcSword = ({ c, s = 16 }: { c: string; s?: number }) => (
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
const IcDot = ({ c, s = 6 }: { c: string; s?: number }) => (
  <svg width={s} height={s} viewBox="0 0 6 6" fill="none">
    <circle cx="3" cy="3" r="2.5" fill={c} />
  </svg>
);
const IcSend = ({ c }: { c: string }) => (
  <svg width="12" height="12" viewBox="0 0 16 16" fill="none">
    <polyline points="2,8 14,8" stroke={c} strokeWidth="1.5" />
    <polyline points="10,4 14,8 10,12" stroke={c} strokeWidth="1.5" fill="none" />
  </svg>
);
const IcScan = ({ c, s = 14 }: { c: string; s?: number }) => (
  <svg width={s} height={s} viewBox="0 0 16 16" fill="none">
    <line x1="2" y1="5" x2="14" y2="5" stroke={c} strokeWidth="1" />
    <line x1="1" y1="8" x2="15" y2="8" stroke={c} strokeWidth="1.5" />
    <line x1="2" y1="11" x2="14" y2="11" stroke={c} strokeWidth="1" />
    <line x1="3" y1="2" x2="3" y2="14" stroke={c} strokeWidth="1" />
    <line x1="13" y1="2" x2="13" y2="14" stroke={c} strokeWidth="1" />
  </svg>
);

// ── DATA ──────────────────────────────────────────────────────────────────────
const FACTIONS = [
  { id: "survivors",   name: "SURVIVORS",   color: "#aaaaaa", item: "Canteen",       passive: "Durability Break -15%" },
  { id: "nomads",      name: "NOMADS",      color: "#ff8800", item: "Compass",       passive: "Yield × 1.15" },
  { id: "marauders",   name: "MARAUDERS",   color: "#ff003c", item: "Spiked Vest",   passive: "Damage × 1.10" },
  { id: "scientists",  name: "SCIENTISTS",  color: "#00aaff", item: "Slate",         passive: "Craft Time × 0.80" },
  { id: "governments", name: "GOVERNMENTS", color: "#cccccc", item: "Comms Badge",   passive: "Reduces Escape Chance" },
  { id: "engineers",   name: "ENGINEERS",   color: "#ff6b00", item: "Heavy Wrench",  passive: "Build Cost × 0.85" },
  { id: "hackers",     name: "HACKERS",     color: "#00ff88", item: "Decrypt Rig",   passive: "Predicts Events +48h" },
  { id: "syndicates",  name: "SYNDICATES",  color: "#d4af37", item: "Energy Shield", passive: "Shield × 1.20" },
];

const SEED_CHAT = [
  { time: "01:05", sender: "CYBER_NOMAD",  text: "WATER IN SECTOR 4 DOWN TO 12%.",               color: undefined as string | undefined },
  { time: "01:08", sender: "GATEKEEPER_X", text: "SYNDICATE SHIELDS STABLE. 300 THREAT STAKED.", color: "#d4af37" },
  { time: "01:12", sender: "RADIO_GHOST",  text: "BOUNTY ON MARAUDER_BLADE — TARGET AUDIT LIVE.", color: "#ff003c" },
  { time: "01:14", sender: "NET_VIPER",    text: "NET SCAN DONE. LINES SECURE.",                  color: undefined },
];

// ── RESOURCE BAR ──────────────────────────────────────────────────────────────
function ResBar({ label, value, color, Icon }: { label: string; value: number; color: string; Icon: React.FC<{ c: string; s?: number }> }) {
  const warn = value < 30;
  const c = warn ? "#ff003c" : color;
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
          <Icon c={c} s={11} />
          <span style={{ fontFamily: "Rajdhani, sans-serif", fontSize: "10px", letterSpacing: "0.15em", color: "rgba(255,255,255,0.45)", fontWeight: 700 }}>{label}</span>
        </div>
        <span style={{ fontFamily: "Orbitron, sans-serif", fontSize: "10px", color: c, fontWeight: 900 }}>{value.toFixed(1)}%</span>
      </div>
      <div style={{ height: "3px", background: "rgba(255,255,255,0.05)", position: "relative" }}>
        <div style={{ height: "100%", width: `${value}%`, background: c, boxShadow: `0 0 6px ${c}`, transition: "width 0.8s ease" }} />
      </div>
    </div>
  );
}

// ── MAIN PAGE ─────────────────────────────────────────────────────────────────
export default function BunkerPage() {
  const { authIdentifier } = useAuth();
  const { publicKey } = useWallet();
  const wallet = authIdentifier || (publicKey ? publicKey.toString() : null);

  const [profileName, setProfileName] = useState("SURVIVOR_GUEST");
  const [selectedFaction, setSelectedFaction] = useState(FACTIONS[0]);
  const [stakedThreat, setStakedThreat] = useState(150);
  const [shieldIntegrity, setShieldIntegrity] = useState(65);
  const [stakeInput, setStakeInput] = useState("");

  const [waterLevel, setWaterLevel] = useState(45.5);
  const [foodLevel, setFoodLevel] = useState(62.8);
  const [powerGrid, setPowerGrid] = useState(78.2);

  const [cliInput, setCliInput] = useState("");
  const [cliHistory, setCliHistory] = useState(["RED QUEEN v7.4.1 // BUNKER ONLINE", "> READY. Type 'help' for commands."]);
  const [decryptionAttempts, setDecryptionAttempts] = useState(5);
  const [isDecrypting, setIsDecrypting] = useState(false);

  const [chatMessages, setChatMessages] = useState<typeof SEED_CHAT>([]);
  const [chatInput, setChatInput] = useState("");
  const [activeTab, setActiveTab] = useState<"RESOURCES" | "FACTION" | "OPS">("RESOURCES");

  const chatEndRef = useRef<HTMLDivElement>(null);
  const cliEndRef = useRef<HTMLDivElement>(null);

  // Profile
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

  // Chat restore
  useEffect(() => {
    const cached = typeof window !== "undefined" && localStorage.getItem("redqueen_bunker_general_chat");
    if (cached) { try { setChatMessages(JSON.parse(cached)); } catch { setChatMessages(SEED_CHAT); } }
    else { setChatMessages(SEED_CHAT); localStorage.setItem("redqueen_bunker_general_chat", JSON.stringify(SEED_CHAT)); }
    const a = typeof window !== "undefined" && localStorage.getItem("redqueen_bunker_decryption_attempts");
    if (a) setDecryptionAttempts(Number(a));
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
    setChatMessages(updated); setChatInput("");
    localStorage.setItem("redqueen_bunker_general_chat", JSON.stringify(updated));
    setTimeout(() => {
      const names = ["CYPHER_REBEL", "MARKET_RUNNER", "WASTE_STALKER"];
      const texts = ["DIRECTIVE LOCK ACQUIRED.", "WATER MINIMUMS MODIFIED.", "ARENA ENCOUNTERS ENFORCED."];
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
      const lines = [`[ SCANNING ] SECTOR_${Math.floor(Math.random() * 20)}...`, `[ BYPASSING ] PACKETS: ${Math.floor(Math.random() * 1000)}/1000`, `[ DECRYPTING ] KEY MATCH: ${(50 + Math.random() * 45).toFixed(2)}%`];
      setCliHistory(p => [...p, lines[count % 3]]);
      count++;
      if (count >= 3) {
        clearInterval(iv);
        setIsDecrypting(false);
        setCliHistory(p => [...p, Math.random() > 0.15 ? ">> SUCCESS: Coordinates decoded (45.1092, -122.6801)." : ">> FAILED: EM interference signal loss."]);
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
      else if (cmd === "scan") setCliHistory(p => [...p, "SWEEPING...", "  TARGET: MARAUDER_BLADE [GRID_18.2] (120T)", "  TARGET: COLLECTIVE_U04 [GRID_4.5] (250T)"]);
      else if (cmd === "decrypt") runDecrypt();
      else setCliHistory(p => [...p, `>> UNKNOWN: '${cmd}'`]);
    }, 150);
  };

  const shieldColor = shieldIntegrity > 60 ? "#00ff88" : shieldIntegrity > 30 ? "#ff8800" : "#ff003c";
  const shieldCirc = 2 * Math.PI * 40;

  return (
    <div
      id="game-bunker-root"
      style={{
        background: "#030303",
        height: "100vh",
        color: "#ffffff",
        fontFamily: "Rajdhani, sans-serif",
        position: "relative",
        overflow: "hidden",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* ── Ambient glows */}
      <div style={{ position: "absolute", top: 0, left: 0, width: "45%", height: "100%", background: "radial-gradient(ellipse at 5% 50%, rgba(255,0,60,0.09) 0%, transparent 65%)", pointerEvents: "none", zIndex: 1 }} />
      <div style={{ position: "absolute", top: 0, right: 0, width: "45%", height: "100%", background: "radial-gradient(ellipse at 95% 50%, rgba(255,255,255,0.03) 0%, transparent 65%)", pointerEvents: "none", zIndex: 1 }} />

      {/* ── Scanlines */}
      <div className="hud-scanline" />

      {/* ── Subtle grid */}
      <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(255,0,60,0.005) 1px, transparent 1px), linear-gradient(90deg, rgba(255,0,60,0.005) 1px, transparent 1px)", backgroundSize: "40px 40px", pointerEvents: "none", zIndex: 1 }} />

      {/* ── Frame border */}
      <div style={{ position: "absolute", top: "10px", left: "10px", right: "10px", bottom: "10px", border: "1px solid rgba(255,0,60,0.07)", pointerEvents: "none", zIndex: 50 }} />

      {/* ── Character silhouettes */}
      <div style={{ position: "absolute", bottom: 0, left: "-4vw", width: "38vw", height: "88vh", backgroundImage: "url(/images/redqueen_silhouette.png)", backgroundSize: "contain", backgroundPosition: "left bottom", backgroundRepeat: "no-repeat", opacity: 0.18, pointerEvents: "none", zIndex: 2 }} />
      <div style={{ position: "absolute", bottom: 0, right: "-4vw", width: "38vw", height: "88vh", backgroundImage: "url(/images/soldier_silhouette.png)", backgroundSize: "contain", backgroundPosition: "right bottom", backgroundRepeat: "no-repeat", opacity: 0.18, pointerEvents: "none", zIndex: 2 }} />

      {/* ═══════════════════════════════ HEADER ═════════════════════════════ */}
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 20px 10px", borderBottom: "1px solid rgba(255,0,60,0.07)", position: "relative", zIndex: 20, flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
          <span style={{ fontFamily: "Orbitron, sans-serif", color: "#ff003c", fontWeight: 900, fontSize: "14px", letterSpacing: "0.25em" }}>
            &gt; BASE BUNKER &nbsp;///&nbsp; COMMAND HQ
          </span>
          <div style={{ display: "flex", gap: "12px", fontSize: "11px", fontFamily: "Oxanium, sans-serif", fontWeight: 700, letterSpacing: "0.08em" }}>
            <Link href="/" style={{ color: "#555", textDecoration: "none" }}>[ LEAVE_HUB ]</Link>
            <Link href="/arena" style={{ color: "#555", textDecoration: "none" }}>[ PVP_ARENA ]</Link>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "14px", fontFamily: "Rajdhani, sans-serif", fontSize: "11px", color: "#555", letterSpacing: "0.15em", fontWeight: 700 }}>
          <span>SEASON 1</span>
          <IcDot c="#ff003c" s={5} />
          <span style={{ color: "#fff" }}>BUNKER COMMAND</span>
          <IcDot c="#ff003c" s={5} />
          <span style={{ color: "#ff003c" }}>{profileName}</span>
        </div>
      </header>

      {/* ═══════════════════════════════ MAIN CONTENT ═══════════════════════ */}
      <main style={{ display: "grid", gridTemplateColumns: "300px 1fr 300px", flexGrow: 1, minHeight: 0, position: "relative", zIndex: 10 }}>

        {/* ── LEFT PANEL ──────────────────────────────────────────────────── */}
        <div style={{ padding: "14px 14px 14px 18px", display: "flex", flexDirection: "column", gap: "10px", borderRight: "1px solid rgba(255,0,60,0.06)" }}>

          {/* Player card */}
          <div className="hud-panel" style={{ padding: "12px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "8px" }}>
              <IcShield c="#ff003c" s={20} />
              <div>
                <div style={{ fontFamily: "Orbitron, sans-serif", color: "#ff003c", fontWeight: 900, fontSize: "14px", letterSpacing: "0.06em", lineHeight: 1.1 }}>{profileName}</div>
                <div style={{ fontFamily: "Rajdhani, sans-serif", fontSize: "10px", color: "#555", letterSpacing: "0.15em", fontWeight: 700 }}>
                  FACTION: <span style={{ color: selectedFaction.color }}>{selectedFaction.name}</span>
                </div>
              </div>
            </div>
            {/* Shield ring */}
            <div style={{ display: "flex", justifyContent: "center", margin: "6px 0 4px" }}>
              <svg width="96" height="96" viewBox="0 0 96 96" fill="none">
                <circle cx="48" cy="48" r="40" stroke="rgba(255,255,255,0.05)" strokeWidth="6" fill="none" />
                <circle cx="48" cy="48" r="40" stroke={shieldColor} strokeWidth="6" fill="none"
                  strokeDasharray={`${shieldCirc * shieldIntegrity / 100} ${shieldCirc}`}
                  strokeDashoffset={shieldCirc * 0.25}
                  style={{ filter: `drop-shadow(0 0 6px ${shieldColor})`, transition: "stroke-dasharray 0.8s ease" }}
                />
                <text x="48" y="44" textAnchor="middle" fill={shieldColor} fontSize="14" fontFamily="Orbitron" fontWeight="900">{shieldIntegrity}%</text>
                <text x="48" y="57" textAnchor="middle" fill="rgba(255,255,255,0.25)" fontSize="7" fontFamily="Rajdhani" letterSpacing="2">SHIELD</text>
              </svg>
            </div>
            {/* Escrow */}
            <div style={{ textAlign: "center", fontFamily: "Rajdhani, sans-serif", fontSize: "10px", color: "#555", letterSpacing: "0.1em", marginBottom: "8px" }}>
              ESCROW: <span style={{ color: "#d4af37", fontWeight: 900, fontFamily: "Orbitron, sans-serif" }}>{stakedThreat} $THREAT</span>
            </div>
            {/* Stake controls */}
            <div style={{ display: "flex", gap: "4px", marginBottom: "4px" }}>
              <input
                value={stakeInput}
                onChange={e => setStakeInput(e.target.value)}
                placeholder="AMOUNT"
                style={{ flex: 1, background: "rgba(0,0,0,0.6)", border: "1px solid rgba(255,0,60,0.2)", color: "#fff", fontFamily: "Orbitron, sans-serif", fontSize: "9px", padding: "6px 8px", outline: "none", letterSpacing: "0.1em" }}
              />
              <button
                onClick={() => { const v = parseInt(stakeInput); if (!isNaN(v) && v > 0) { setStakedThreat(p => p + v); setStakeInput(""); } }}
                className="hud-btn"
                style={{ fontSize: "9px", padding: "6px 10px", letterSpacing: "0.1em" }}
              >
                STAKE
              </button>
            </div>
            <div style={{ display: "flex", gap: "3px" }}>
              {[50, 100, 500].map(v => (
                <button key={v} onClick={() => setStakedThreat(p => p + v)} className="hud-btn-secondary" style={{ flex: 1, fontSize: "9px", padding: "4px 0" }}>
                  +{v}T
                </button>
              ))}
            </div>
          </div>

          {/* Resources */}
          <div className="hud-panel" style={{ padding: "12px" }}>
            <div style={{ fontFamily: "Orbitron, sans-serif", fontSize: "9px", color: "#ff003c", fontWeight: 900, letterSpacing: "0.2em", marginBottom: "10px" }}>BUNKER RESOURCES</div>
            <div style={{ display: "flex", flexDirection: "column", gap: "9px" }}>
              <ResBar label="WATER" value={waterLevel} color="#00aaff" Icon={IcDrop} />
              <ResBar label="FOOD"  value={foodLevel}  color="#00ff88" Icon={IcFood} />
              <ResBar label="POWER" value={powerGrid}  color="#ff8800" Icon={IcPower} />
            </div>
          </div>

          {/* Daily ops */}
          <div className="hud-panel" style={{ padding: "12px" }}>
            <div style={{ fontFamily: "Orbitron, sans-serif", fontSize: "9px", color: "#ff003c", fontWeight: 900, letterSpacing: "0.2em", marginBottom: "10px" }}>DAILY OPS</div>
            {[
              { label: "SCAVENGE",   used: 1, max: 3, color: "#ff8800" },
              { label: "PVP DUELS",  used: 0, max: 3, color: "#ff003c" },
              { label: "DECRYPTS",   used: 5 - decryptionAttempts, max: 5, color: "#00aaff" },
            ].map(op => (
              <div key={op.label} style={{ marginBottom: "7px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontFamily: "Rajdhani, sans-serif", fontSize: "10px", color: "rgba(255,255,255,0.35)", letterSpacing: "0.1em", marginBottom: "3px" }}>
                  <span>{op.label}</span>
                  <span style={{ color: op.color, fontFamily: "Orbitron, sans-serif", fontSize: "9px" }}>{op.max - op.used}/{op.max}</span>
                </div>
                <div style={{ display: "flex", gap: "2px" }}>
                  {Array.from({ length: op.max }).map((_, i) => (
                    <div key={i} style={{ flex: 1, height: "5px", background: i < (op.max - op.used) ? op.color : "rgba(255,255,255,0.04)", boxShadow: i < (op.max - op.used) ? `0 0 4px ${op.color}66` : "none", transition: "all 0.3s" }} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── CENTER HUD ──────────────────────────────────────────────────── */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "space-between", padding: "14px 8px", position: "relative" }}>

          {/* Bunker radar / clock display */}
          <div style={{ textAlign: "center" }}>
            <div style={{ fontFamily: "Rajdhani, sans-serif", fontSize: "10px", color: "#555", letterSpacing: "0.2em", fontWeight: 700, marginBottom: "2px" }}>BUNKER STATUS</div>
            <div style={{ fontFamily: "Orbitron, sans-serif", fontSize: "40px", fontWeight: 900, color: "#ff003c", textShadow: "0 0 20px rgba(255,0,60,0.8)", lineHeight: 1 }}>ACTIVE</div>
          </div>

          {/* Big radar in center */}
          <div style={{ position: "relative", width: "220px", height: "220px", display: "flex", justifyContent: "center", alignItems: "center", flexShrink: 0 }}>
            <svg width="220" height="220" viewBox="0 0 220 220" style={{ position: "absolute", overflow: "visible" }}>
              <circle cx="110" cy="110" r="100" fill="none" stroke="rgba(255,0,60,0.08)" strokeWidth="1" strokeDasharray="6 4" className="hud-spin-cw" />
              <circle cx="110" cy="110" r="75" fill="none" stroke="rgba(255,0,60,0.05)" strokeWidth="1" />
              <circle cx="110" cy="110" r="50" fill="none" stroke="rgba(255,0,60,0.05)" strokeWidth="1" />
              <circle cx="110" cy="110" r="25" fill="none" stroke="rgba(255,0,60,0.07)" strokeWidth="1" />
              <line x1="10" y1="110" x2="210" y2="110" stroke="rgba(255,0,60,0.06)" strokeWidth="1" />
              <line x1="110" y1="10" x2="110" y2="210" stroke="rgba(255,0,60,0.06)" strokeWidth="1" />
              {/* Scanner sweep */}
              <line x1="110" y1="110" x2="186" y2="60" stroke="rgba(255,0,60,0.45)" strokeWidth="1.5" className="hud-radar-scanner-sweep" style={{ transformOrigin: "110px 110px" }} />
              {/* Target blips */}
              <circle cx="152" cy="68" r="3" fill="#ff003c" className="hud-blink-fast" />
              <circle cx="72" cy="145" r="2.5" fill="#ff8800" className="hud-blink-fast" />
              <circle cx="145" cy="148" r="2" fill="#fff" />
              <circle cx="110" cy="110" r="4" fill="#00ff88" />
              <circle cx="110" cy="110" r="2" fill="#030303" />
              {/* Corner brackets */}
              <path d="M 68,76 L 68,68 L 76,68" fill="none" stroke="#ff003c" strokeWidth="2" />
              <path d="M 152,76 L 152,68 L 144,68" fill="none" stroke="#ff003c" strokeWidth="2" />
              <path d="M 68,144 L 68,152 L 76,152" fill="none" stroke="#ff003c" strokeWidth="2" />
              <path d="M 152,144 L 152,152 L 144,152" fill="none" stroke="#ff003c" strokeWidth="2" />
            </svg>
            {/* Center label */}
            <div style={{ fontFamily: "Orbitron, sans-serif", width: "64px", height: "64px", background: "rgba(2,2,2,0.97)", border: "2px solid rgba(255,0,60,0.4)", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", zIndex: 6, boxShadow: "0 0 20px rgba(255,0,60,0.3)", position: "relative" }}>
              <IcRadar c="#ff003c" s={18} />
              <span style={{ fontSize: "8px", color: "#ff003c", fontWeight: 900, letterSpacing: "0.08em", marginTop: "2px" }}>SCAN</span>
            </div>
          </div>

          {/* Arena info */}
          <div style={{ textAlign: "center", lineHeight: 1.5 }}>
            <div style={{ fontFamily: "Rajdhani, sans-serif", fontSize: "10px", color: "#444", letterSpacing: "0.2em", fontWeight: 700 }}>LOCATION</div>
            <div style={{ fontFamily: "Oxanium, sans-serif", fontSize: "14px", color: "#ff003c", fontWeight: 700, letterSpacing: "0.08em" }}>SECTOR 7 — DEEP GRID</div>
            <div style={{ fontFamily: "Rajdhani, sans-serif", fontSize: "10px", color: "#444", letterSpacing: "0.15em", fontWeight: 700, marginTop: "4px" }}>FACTION</div>
            <div style={{ fontFamily: "Orbitron, sans-serif", fontSize: "13px", color: selectedFaction.color, fontWeight: 700 }}>{selectedFaction.name}</div>
          </div>

          {/* ACTION BUTTONS — same style as arena */}
          <div style={{ width: "100%", display: "flex", flexDirection: "column", gap: "6px" }}>
            {/* Primary CTA — Enter Arena */}
            <Link href="/arena" style={{ textDecoration: "none", width: "100%" }}>
              <button style={{
                width: "100%", padding: "18px",
                background: "linear-gradient(135deg, #ff003c 0%, #cc0030 100%)",
                border: "none", color: "#ffffff",
                fontFamily: "Orbitron, sans-serif", fontSize: "16px", fontWeight: 900, letterSpacing: "0.3em",
                cursor: "pointer",
                boxShadow: "0 0 50px rgba(255,0,60,0.55), inset 0 1px 0 rgba(255,255,255,0.1)",
                textTransform: "uppercase",
                textShadow: "0 0 15px rgba(255,255,255,0.5)",
                transition: "all 0.15s",
                clipPath: "polygon(10px 0%, 100% 0%, calc(100% - 10px) 100%, 0% 100%)",
                display: "flex", alignItems: "center", justifyContent: "center", gap: "12px",
              }}
                className="fight-btn-ready"
              >
                <IcSword c="#fff" s={20} /> ENTER ARENA
              </button>
            </Link>
            {/* Decrypt button */}
            <button
              onClick={runDecrypt}
              disabled={isDecrypting || decryptionAttempts <= 0}
              style={{
                width: "100%", padding: "14px",
                background: isDecrypting ? "rgba(0,170,255,0.05)" : "rgba(0,170,255,0.1)",
                border: `2px solid ${decryptionAttempts > 0 ? "rgba(0,170,255,0.5)" : "rgba(255,255,255,0.1)"}`,
                color: decryptionAttempts > 0 ? "#00aaff" : "rgba(255,255,255,0.15)",
                fontFamily: "Orbitron, sans-serif", fontSize: "13px", fontWeight: 900, letterSpacing: "0.25em",
                cursor: (isDecrypting || decryptionAttempts <= 0) ? "not-allowed" : "pointer",
                boxShadow: decryptionAttempts > 0 ? "0 0 20px rgba(0,170,255,0.2)" : "none",
                textTransform: "uppercase", transition: "all 0.15s",
                clipPath: "polygon(10px 0%, 100% 0%, calc(100% - 10px) 100%, 0% 100%)",
                display: "flex", alignItems: "center", justifyContent: "center", gap: "10px",
              }}
            >
              <IcLock c={decryptionAttempts > 0 ? "#00aaff" : "rgba(255,255,255,0.15)"} s={16} />
              {isDecrypting ? "DECRYPTING..." : `DECRYPT  [${decryptionAttempts}/5]`}
            </button>
            {/* Scan button */}
            <button
              onClick={() => { setCliHistory(p => [...p, "guest@redqueen:~$ scan", "SWEEPING...", "  TARGET: MARAUDER_BLADE [GRID_18.2] (120T)", "  TARGET: COLLECTIVE_U04 [GRID_4.5] (250T)"]); }}
              style={{
                width: "100%", padding: "12px",
                background: "rgba(255,136,0,0.08)",
                border: "1px solid rgba(255,136,0,0.3)",
                color: "#ff8800",
                fontFamily: "Orbitron, sans-serif", fontSize: "12px", fontWeight: 900, letterSpacing: "0.2em",
                cursor: "pointer",
                textTransform: "uppercase", transition: "all 0.15s",
                clipPath: "polygon(8px 0%, 100% 0%, calc(100% - 8px) 100%, 0% 100%)",
                display: "flex", alignItems: "center", justifyContent: "center", gap: "10px",
              }}
            >
              <IcScan c="#ff8800" s={14} /> SECTOR SCAN
            </button>
          </div>
        </div>

        {/* ── RIGHT PANEL ─────────────────────────────────────────────────── */}
        <div style={{ padding: "14px 18px 14px 14px", display: "flex", flexDirection: "column", gap: "10px", borderLeft: "1px solid rgba(255,0,60,0.06)" }}>

          {/* Faction selector */}
          <div className="hud-panel" style={{ padding: "12px" }}>
            <div style={{ fontFamily: "Orbitron, sans-serif", fontSize: "9px", color: "#ff003c", fontWeight: 900, letterSpacing: "0.2em", marginBottom: "8px" }}>PLEDGE FACTION</div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px" }}>
              {FACTIONS.map(f => {
                const active = selectedFaction.id === f.id;
                return (
                  <button
                    key={f.id}
                    onClick={() => setSelectedFaction(f)}
                    style={{
                      border: `1px solid ${active ? f.color : "rgba(255,255,255,0.07)"}`,
                      background: active ? `${f.color}18` : "rgba(5,5,5,0.6)",
                      padding: "7px 8px",
                      cursor: "pointer",
                      transition: "all 0.12s",
                      boxShadow: active ? `0 0 10px ${f.color}33` : "none",
                      textAlign: "left",
                    }}
                  >
                    <div style={{ fontFamily: "Orbitron, sans-serif", fontSize: "9px", color: active ? f.color : "#777", fontWeight: 900, letterSpacing: "0.05em" }}>{f.name}</div>
                    <div style={{ fontFamily: "Rajdhani, sans-serif", fontSize: "9px", color: "rgba(255,255,255,0.25)", marginTop: "1px" }}>{f.item}</div>
                  </button>
                );
              })}
            </div>
            {/* Active faction detail */}
            <div style={{ marginTop: "8px", padding: "8px 10px", background: `${selectedFaction.color}0d`, border: `1px solid ${selectedFaction.color}33` }}>
              <div style={{ fontFamily: "Rajdhani, sans-serif", fontSize: "10px", color: "rgba(255,255,255,0.4)", letterSpacing: "0.08em" }}>PASSIVE</div>
              <div style={{ fontFamily: "Orbitron, sans-serif", fontSize: "10px", color: selectedFaction.color, fontWeight: 900, marginTop: "2px" }}>{selectedFaction.passive}</div>
            </div>
          </div>

          {/* Scan targets */}
          <div className="hud-panel" style={{ padding: "12px" }}>
            <div style={{ fontFamily: "Orbitron, sans-serif", fontSize: "9px", color: "#ff003c", fontWeight: 900, letterSpacing: "0.2em", marginBottom: "8px", display: "flex", alignItems: "center", gap: "6px" }}>
              <IcRadar c="#ff003c" s={9} /> BOUNTY TARGETS
            </div>
            {[
              { name: "MARAUDER_BLADE", grid: "GRID_18.2", bounty: "120T", color: "#ff003c" },
              { name: "COLLECTIVE_U04", grid: "GRID_4.5",  bounty: "250T", color: "#ff8800" },
              { name: "PHANTOM_K",      grid: "GRID_9.1",  bounty: "75T",  color: "#aaaaaa" },
            ].map(t => (
              <div key={t.name} style={{ display: "flex", justifyContent: "space-between", padding: "6px 8px", background: "rgba(255,0,60,0.04)", border: "1px solid rgba(255,0,60,0.08)", marginBottom: "4px" }}>
                <div>
                  <div style={{ fontFamily: "Orbitron, sans-serif", fontSize: "9px", color: t.color, fontWeight: 900, letterSpacing: "0.05em" }}>{t.name}</div>
                  <div style={{ fontFamily: "Rajdhani, sans-serif", fontSize: "9px", color: "#444", letterSpacing: "0.1em" }}>{t.grid}</div>
                </div>
                <span style={{ fontFamily: "Orbitron, sans-serif", fontSize: "11px", color: "#d4af37", fontWeight: 900, alignSelf: "center" }}>{t.bounty}</span>
              </div>
            ))}
          </div>
        </div>
      </main>

      {/* ═══════════════════════════════ FOOTER PANELS ══════════════════════ */}
      <footer style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", height: "190px", flexShrink: 0, position: "relative", zIndex: 20, borderTop: "1px solid rgba(255,0,60,0.06)" }}>

        {/* ── BUNKER CHAT */}
        <div style={{ background: "rgba(2,2,2,0.7)", backdropFilter: "blur(6px)", borderRight: "1px solid rgba(255,0,60,0.06)", padding: "10px 12px", display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "6px", borderBottom: "1px solid rgba(255,0,60,0.07)", paddingBottom: "5px" }}>
            <IcDot c="#ff003c" s={5} />
            <span style={{ fontFamily: "Orbitron, sans-serif", fontSize: "9px", color: "#ff003c", fontWeight: 900, letterSpacing: "0.15em" }}>BUNKER CHAT</span>
          </div>
          <div className="hud-scrollbar" style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "2px", marginBottom: "6px" }}>
            {chatMessages.map((m, i) => (
              <div key={i} style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "10px", lineHeight: 1.4 }}>
                <span style={{ color: "rgba(255,255,255,0.2)" }}>[{m.time}] </span>
                <span style={{ color: m.color || "#555", fontWeight: 700 }}>{m.sender}: </span>
                <span style={{ color: "rgba(255,255,255,0.7)" }}>{m.text}</span>
              </div>
            ))}
            <div ref={chatEndRef} />
          </div>
          <form onSubmit={handleChat} style={{ display: "flex", border: "1px solid rgba(255,0,60,0.15)", background: "#050505" }}>
            <input value={chatInput} onChange={e => setChatInput(e.target.value)} placeholder="TYPE TRANSMISSION..." style={{ flex: 1, background: "transparent", border: "none", color: "#fff", fontFamily: "JetBrains Mono, monospace", fontSize: "10px", padding: "5px 8px", outline: "none", textTransform: "uppercase" }} />
            <button type="submit" style={{ background: "transparent", border: "none", color: "#ff003c", padding: "0 8px", cursor: "pointer", display: "flex", alignItems: "center" }}><IcSend c="#ff003c" /></button>
          </form>
        </div>

        {/* ── DECRYPTION TERMINAL */}
        <div style={{ background: "rgba(2,2,2,0.7)", backdropFilter: "blur(6px)", borderRight: "1px solid rgba(255,0,60,0.06)", padding: "10px 12px", display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px", borderBottom: "1px solid rgba(255,0,60,0.07)", paddingBottom: "5px" }}>
            <span style={{ fontFamily: "Orbitron, sans-serif", fontSize: "9px", color: "#555", fontWeight: 900, letterSpacing: "0.15em" }}>DECRYPTION TERMINAL</span>
            <span style={{ fontFamily: "Orbitron, sans-serif", fontSize: "9px", color: decryptionAttempts > 0 ? "#00aaff" : "#ff003c", fontWeight: 900 }}>{decryptionAttempts}/5</span>
          </div>
          <div className="hud-scrollbar" style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "1px", marginBottom: "6px" }}>
            {cliHistory.map((line, i) => (
              <div key={i} style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "10px", lineHeight: 1.4, color: line.startsWith(">>") ? "#ff003c" : line.startsWith("guest@") ? "#00ff88" : line.startsWith("[") ? "#ff8800" : "rgba(255,255,255,0.4)" }}>
                {line}
              </div>
            ))}
            <div ref={cliEndRef} />
          </div>
          <form onSubmit={handleCli} style={{ display: "flex", border: "1px solid rgba(255,0,60,0.15)", background: "#050505" }}>
            <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "10px", color: "#00ff88", padding: "5px 4px 5px 8px" }}>$</span>
            <input value={cliInput} onChange={e => setCliInput(e.target.value)} placeholder="enter command..." disabled={isDecrypting} style={{ flex: 1, background: "transparent", border: "none", color: "#fff", fontFamily: "JetBrains Mono, monospace", fontSize: "10px", padding: "5px 4px", outline: "none" }} />
            <button type="submit" style={{ background: "transparent", border: "none", color: "#ff003c", padding: "0 8px", cursor: "pointer", display: "flex", alignItems: "center" }}><IcSend c="#ff003c" /></button>
          </form>
        </div>

        {/* ── SYSTEM LOG */}
        <div style={{ background: "rgba(2,2,2,0.7)", backdropFilter: "blur(6px)", padding: "10px 12px", display: "flex", flexDirection: "column" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px", marginBottom: "6px", borderBottom: "1px solid rgba(255,0,60,0.07)", paddingBottom: "5px" }}>
            <span style={{ fontFamily: "Orbitron, sans-serif", fontSize: "9px", color: "#555", fontWeight: 900, letterSpacing: "0.15em" }}>SYSTEM LOG</span>
          </div>
          <div className="hud-scrollbar" style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "2px" }}>
            {[
              { t: "01:05", text: "SHIELD INTEGRITY RECALCULATED.",          c: "#00ff88" },
              { t: "01:08", text: "FACTION PLEDGE UPDATED: " + selectedFaction.name, c: selectedFaction.color },
              { t: "01:12", text: `ESCROW LOCKED: ${stakedThreat} $THREAT.`, c: "#d4af37" },
              { t: "01:14", text: "ARENA MATCH QUEUED.",                      c: "#ff003c" },
              { t: "01:18", text: "WATER LEVELS: " + waterLevel.toFixed(1) + "%", c: waterLevel < 30 ? "#ff003c" : "#00aaff" },
              { t: "01:21", text: "NODE v7.4.1 OPERATIONAL.",                 c: "rgba(255,255,255,0.3)" },
            ].map((l, i) => (
              <div key={i} style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "10px", lineHeight: 1.4 }}>
                <span style={{ color: "rgba(255,255,255,0.2)" }}>[{l.t}] </span>
                <span style={{ color: l.c }}>{l.text}</span>
              </div>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
