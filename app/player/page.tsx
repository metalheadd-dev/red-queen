"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/AuthProvider";
import { useWallet } from "@solana/wallet-adapter-react";
import Link from "next/link";

// ── SVG ICONS ─────────────────────────────────────────────────────────────────
const IcSword   = ({ c, s=16 }: {c:string;s?:number}) => <svg width={s} height={s} viewBox="0 0 16 16" fill="none"><line x1="2" y1="14" x2="12" y2="4" stroke={c} strokeWidth="1.5"/><polyline points="10,2 14,2 14,6" stroke={c} strokeWidth="1.5" fill="none"/><line x1="2" y1="10" x2="4" y2="12" stroke={c} strokeWidth="1.2"/></svg>;
const IcShield  = ({ c, s=16 }: {c:string;s?:number}) => <svg width={s} height={s} viewBox="0 0 16 16" fill="none"><path d="M8 2L14 5L14 9C14 12 8 15 8 15C8 15 2 12 2 9L2 5Z" stroke={c} strokeWidth="1.5" fill="none"/></svg>;
const IcStar    = ({ c, s=12 }: {c:string;s?:number}) => <svg width={s} height={s} viewBox="0 0 16 16" fill="none"><polygon points="8,1 10,6 15,6 11,10 13,15 8,12 3,15 5,10 1,6 6,6" fill={c}/></svg>;
const IcDot     = ({ c, s=6  }: {c:string;s?:number}) => <svg width={s} height={s} viewBox="0 0 6 6" fill="none"><circle cx="3" cy="3" r="2.5" fill={c}/></svg>;
const IcSkull   = ({ c, s=14 }: {c:string;s?:number}) => <svg width={s} height={s} viewBox="0 0 16 16" fill="none"><path d="M8 2C4.5 2 2 4.5 2 7.5C2 10 3.5 11.5 4 12L4 14L12 14L12 12C12.5 11.5 14 10 14 7.5C14 4.5 11.5 2 8 2Z" stroke={c} strokeWidth="1.2" fill="none"/><circle cx="6" cy="8" r="1" fill={c}/><circle cx="10" cy="8" r="1" fill={c}/></svg>;
const IcCross   = ({ c, s=14 }: {c:string;s?:number}) => <svg width={s} height={s} viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6" stroke={c} strokeWidth="1.2" fill="none"/><line x1="8" y1="1" x2="8" y2="5" stroke={c} strokeWidth="1.2"/><line x1="8" y1="11" x2="8" y2="15" stroke={c} strokeWidth="1.2"/><line x1="1" y1="8" x2="5" y2="8" stroke={c} strokeWidth="1.2"/><line x1="11" y1="8" x2="15" y2="8" stroke={c} strokeWidth="1.2"/><circle cx="8" cy="8" r="1.5" fill={c}/></svg>;
const IcBolt    = ({ c, s=12 }: {c:string;s?:number}) => <svg width={s} height={s} viewBox="0 0 16 16" fill="none"><polyline points="10,2 5,9 9,9 6,14" stroke={c} strokeWidth="1.5" fill="none"/></svg>;
const IcTarget  = ({ c, s=14 }: {c:string;s?:number}) => <svg width={s} height={s} viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6" stroke={c} strokeWidth="1" fill="none"/><circle cx="8" cy="8" r="3" stroke={c} strokeWidth="1" fill="none"/><circle cx="8" cy="8" r="1.5" fill={c}/></svg>;
const IcCheck   = ({ c, s=12 }: {c:string;s?:number}) => <svg width={s} height={s} viewBox="0 0 16 16" fill="none"><polyline points="2,8 6,12 14,4" stroke={c} strokeWidth="2" fill="none"/></svg>;
const IcGun     = ({ c, s=16 }: {c:string;s?:number}) => <svg width={s} height={s} viewBox="0 0 16 16" fill="none"><rect x="1" y="7" width="9" height="4" stroke={c} strokeWidth="1.2" fill="none"/><rect x="10" y="6" width="5" height="3" stroke={c} strokeWidth="1" fill="none"/><line x1="4" y1="11" x2="4" y2="14" stroke={c} strokeWidth="1.2"/><line x1="3" y1="7" x2="3" y2="5" stroke={c} strokeWidth="1.2"/><line x1="5" y1="7" x2="5" y2="5" stroke={c} strokeWidth="1.2"/></svg>;
const IcHelmet  = ({ c, s=14 }: {c:string;s?:number}) => <svg width={s} height={s} viewBox="0 0 16 16" fill="none"><path d="M3 10C3 6 5 2 8 2C11 2 13 6 13 10" stroke={c} strokeWidth="1.5" fill="none"/><line x1="2" y1="11" x2="14" y2="11" stroke={c} strokeWidth="1.5"/><line x1="4" y1="13" x2="12" y2="13" stroke={c} strokeWidth="1"/></svg>;
const IcChest   = ({ c, s=14 }: {c:string;s?:number}) => <svg width={s} height={s} viewBox="0 0 16 16" fill="none"><rect x="2" y="3" width="12" height="10" stroke={c} strokeWidth="1.2" fill="none"/><line x1="2" y1="7" x2="14" y2="7" stroke={c} strokeWidth="1"/><circle cx="8" cy="5" r="1" fill={c}/></svg>;
const IcGlove   = ({ c, s=14 }: {c:string;s?:number}) => <svg width={s} height={s} viewBox="0 0 16 16" fill="none"><path d="M3 9V5C3 4 4 3 5 4V2C5 1 7 1 7 2V1C7 0 9 0 9 1V2C9 1 11 1 11 2V5" stroke={c} strokeWidth="1.2" fill="none"/><path d="M3 9C3 11 4 13 8 13C12 13 13 11 13 9V5" stroke={c} strokeWidth="1.2" fill="none"/></svg>;
const IcBoots   = ({ c, s=14 }: {c:string;s?:number}) => <svg width={s} height={s} viewBox="0 0 16 16" fill="none"><path d="M4 2L4 9L2 12L2 14L10 14L10 12L8 9" stroke={c} strokeWidth="1.2" fill="none"/><line x1="4" y1="9" x2="8" y2="9" stroke={c} strokeWidth="1.2"/><path d="M8 2L8 9" stroke={c} strokeWidth="1.2"/></svg>;
const IcKnife   = ({ c, s=14 }: {c:string;s?:number}) => <svg width={s} height={s} viewBox="0 0 16 16" fill="none"><line x1="3" y1="13" x2="11" y2="5" stroke={c} strokeWidth="1.5"/><path d="M11 5L13 3L13 5L11 7Z" stroke={c} strokeWidth="1" fill="none"/><line x1="3" y1="13" x2="5" y2="13" stroke={c} strokeWidth="1.5"/></svg>;

// ── DATA ──────────────────────────────────────────────────────────────────────
const FACTIONS: Record<string, {color:string; passive:string; weakness:string}> = {
  "SURVIVORS":   { color: "#aaaaaa", passive: "Durability Break -15%",    weakness: "No specialization bonuses" },
  "NOMADS":      { color: "#ff8800", passive: "Yield × 1.15",             weakness: "-15% Physical Armor" },
  "MARAUDERS":   { color: "#ff003c", passive: "Damage × 1.10",            weakness: "Predictable ATK patterns" },
  "SCIENTISTS":  { color: "#00aaff", passive: "Craft Time × 0.80",        weakness: "-10% Max HP" },
  "GOVERNMENTS": { color: "#cccccc", passive: "Reduces Escape Chance",    weakness: "-10% Initiative" },
  "ENGINEERS":   { color: "#ff6b00", passive: "Build Cost × 0.85",        weakness: "Crit cap at 1.2×" },
  "HACKERS":     { color: "#00ff88", passive: "Event Prediction +48h",    weakness: "-25% Melee Damage" },
  "SYNDICATES":  { color: "#d4af37", passive: "Shield × 1.20",            weakness: "+15% Maintenance Fees" },
};

const GEAR_SLOTS = [
  { id: "primary",   label: "PRIMARY",   Icon: IcGun,    tier: "RARE",      name: "COMBAT RIFLE MK-IV",      dmg: "68",  attrs: ["ATK +12", "CRIT +5%"] },
  { id: "secondary", label: "SECONDARY", Icon: IcGun,    tier: "UNCOMMON",  name: "SIDEARM 9mm",             dmg: "34",  attrs: ["ATK +6"] },
  { id: "melee",     label: "MELEE",     Icon: IcKnife,  tier: "COMMON",    name: "COMBAT BLADE",            dmg: "22",  attrs: ["ATK +4", "BLEED"] },
  { id: "helmet",    label: "HEAD",      Icon: IcHelmet, tier: "RARE",      name: "TACTICAL HELMET v3",      def: "28",  attrs: ["DEF +8", "GLITCH RES"] },
  { id: "chest",     label: "CHEST",     Icon: IcChest,  tier: "EPIC",      name: "PLATED VEST ALPHA",       def: "52",  attrs: ["DEF +18", "HP +20"] },
  { id: "gloves",    label: "GLOVES",    Icon: IcGlove,  tier: "UNCOMMON",  name: "GRIP GAUNTLETS",          def: "12",  attrs: ["AGI +6"] },
  { id: "boots",     label: "BOOTS",     Icon: IcBoots,  tier: "RARE",      name: "STALKER BOOTS MK-II",     def: "18",  attrs: ["AGI +10", "SPD +8"] },
  { id: "backpack",  label: "PACK",      Icon: IcChest,  tier: "COMMON",    name: "FIELD PACK",              def: "5",   attrs: ["CARRY +15"] },
];

const TIER_COLOR: Record<string, string> = {
  COMMON: "#888",  UNCOMMON: "#00aa44",  RARE: "#00aaff",  EPIC: "#9900ff",  LEGENDARY: "#d4af37",
};

const COMBAT_LOG = [
  { t: "02:14", result: "WIN",  opp: "SHADOW_RUNNER",  dmg: 47, taken: 12, mode: "RANKED" },
  { t: "01:58", result: "WIN",  opp: "MARAUDER_K",     dmg: 63, taken: 34, mode: "RANKED" },
  { t: "01:22", result: "LOSS", opp: "GATEKEEPER_X",   dmg: 28, taken: 81, mode: "RANKED" },
  { t: "00:47", result: "WIN",  opp: "PHANTOM_UNIT",   dmg: 55, taken: 20, mode: "RANKED" },
  { t: "23:31", result: "WIN",  opp: "NET_VIPER",      dmg: 71, taken: 15, mode: "RANKED" },
];

const ACHIEVEMENTS = [
  { name: "FIRST BLOOD",   desc: "Win your first PvP duel",               done: true  },
  { name: "SURVIVOR",      desc: "Reach 24h without dying",               done: true  },
  { name: "BUNKER LORD",   desc: "Stake 500+ $THREAT in escrow",          done: true  },
  { name: "GHOST RUNNER",  desc: "Complete 3 scavenge runs in one day",   done: false },
  { name: "INFILTRATOR",   desc: "Successfully decrypt 10 nodes",         done: false },
  { name: "SECTOR HUNTER", desc: "Claim 3 bounty targets",                done: false },
];

const STATUS_EFFECTS = [
  { name: "WELL-FED",  color: "#00ff88", desc: "+8% ATK this cycle" },
  { name: "RESTED",    color: "#00aaff", desc: "+5% DEF regeneration" },
];

// ── STAT BAR ──────────────────────────────────────────────────────────────────
function StatBar({ label, value, max = 100, color }: { label: string; value: number; max?: number; color: string }) {
  const pct = Math.min(100, Math.round((value / max) * 100));
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "3px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontFamily: "Rajdhani, sans-serif", fontSize: "11px", letterSpacing: "0.15em", textTransform: "uppercase", fontWeight: 700, color: "rgba(255,255,255,0.45)" }}>
        <span>{label}</span>
        <span style={{ color: "#fff", fontFamily: "Orbitron, sans-serif", fontSize: "10px", fontWeight: 900 }}>{value}</span>
      </div>
      <div style={{ height: "3px", background: "rgba(255,255,255,0.06)", position: "relative" }}>
        <div style={{ height: "100%", width: `${pct}%`, background: color, boxShadow: `0 0 6px ${color}`, transition: "width 1s ease" }} />
      </div>
    </div>
  );
}

// ── GEAR SLOT ─────────────────────────────────────────────────────────────────
function GearSlot({ slot, selected, onClick }: { slot: typeof GEAR_SLOTS[0]; selected: boolean; onClick: () => void }) {
  const tierColor = TIER_COLOR[slot.tier];
  return (
    <div
      onClick={onClick}
      style={{
        border: `1px solid ${selected ? "#ff003c" : tierColor + "55"}`,
        background: selected ? "rgba(255,0,60,0.08)" : "rgba(5,5,5,0.8)",
        padding: "8px",
        cursor: "pointer",
        transition: "all 0.12s",
        boxShadow: selected ? "0 0 14px rgba(255,0,60,0.25)" : `0 0 6px ${tierColor}22`,
        position: "relative",
        display: "flex",
        flexDirection: "column",
        gap: "4px",
        backdropFilter: "blur(6px)",
      }}
    >
      {/* Tier corner */}
      <div style={{ position: "absolute", top: 0, right: 0, background: tierColor, width: "6px", height: "6px" }} />
      <div style={{ display: "flex", alignItems: "center", gap: "5px" }}>
        <slot.Icon c={selected ? "#ff003c" : tierColor} s={13} />
        <span style={{ fontFamily: "Rajdhani, sans-serif", fontSize: "9px", color: "rgba(255,255,255,0.35)", letterSpacing: "0.12em", fontWeight: 700 }}>{slot.label}</span>
      </div>
      <div style={{ fontFamily: "Orbitron, sans-serif", fontSize: "9px", color: selected ? "#ff003c" : tierColor, fontWeight: 900, letterSpacing: "0.04em", lineHeight: 1.2 }}>{slot.name}</div>
      <div style={{ fontFamily: "Rajdhani, sans-serif", fontSize: "9px", color: "rgba(255,255,255,0.25)" }}>
        {slot.attrs[0]}
      </div>
    </div>
  );
}

// ── MAIN PAGE ─────────────────────────────────────────────────────────────────
export default function PlayerPage() {
  const { authIdentifier } = useAuth();
  const { publicKey } = useWallet();
  const wallet = authIdentifier || (publicKey ? publicKey.toString() : null);

  const [profileName, setProfileName] = useState("RED QUEEN ADMIN");
  const [selectedGear, setSelectedGear] = useState<string | null>("primary");
  const [activeTab, setActiveTab] = useState<"LOG" | "THREATS" | "ACHIEVEMENTS">("LOG");

  // Mock game stats — would come from API/Supabase
  const stats = { atk: 68, def: 42, agi: 57, int: 71, lck: 33, bioScore: 1847 };
  const faction = "MARAUDERS";
  const factionData = FACTIONS[faction];
  const xp = 7400; const xpMax = 10000; const level = 14;
  const kills = 47; const deaths = 12; const kd = (kills / Math.max(1, deaths)).toFixed(2);
  const threatBalance = 320;
  const selectedGearData = GEAR_SLOTS.find(g => g.id === selectedGear);

  useEffect(() => {
    if (!wallet) return;
    fetch(`/api/profile?wallet=${wallet}`)
      .then(r => r.json())
      .then(d => { if (d?.profile) { const n = d.profile.apocalyptic_name || d.profile.apoptotic_name || `OPERATIVE_${wallet.slice(0,6)}`; setProfileName(n.toUpperCase()); } })
      .catch(() => {});
  }, [wallet]);

  return (
    <div
      id="game-player-root"
      style={{ background: "#030303", height: "100vh", color: "#fff", fontFamily: "Rajdhani, sans-serif", position: "relative", overflow: "hidden", display: "flex", flexDirection: "column" }}
    >
      {/* ── Ambient glows */}
      <div style={{ position: "absolute", top: 0, left: 0, width: "50%", height: "100%", background: "radial-gradient(ellipse at 0% 60%, rgba(255,0,60,0.1) 0%, transparent 60%)", pointerEvents: "none", zIndex: 1 }} />
      <div style={{ position: "absolute", top: 0, right: 0, width: "50%", height: "100%", background: "radial-gradient(ellipse at 100% 40%, rgba(0,150,255,0.05) 0%, transparent 60%)", pointerEvents: "none", zIndex: 1 }} />

      {/* ── Scanlines */}
      <div className="hud-scanline" />

      {/* ── Grid */}
      <div style={{ position: "absolute", inset: 0, backgroundImage: "linear-gradient(rgba(255,0,60,0.004) 1px, transparent 1px), linear-gradient(90deg, rgba(255,0,60,0.004) 1px, transparent 1px)", backgroundSize: "40px 40px", pointerEvents: "none", zIndex: 1 }} />

      {/* ── Frame */}
      <div style={{ position: "absolute", top: "10px", left: "10px", right: "10px", bottom: "10px", border: "1px solid rgba(255,0,60,0.07)", pointerEvents: "none", zIndex: 50 }} />

      {/* ── Character silhouette — large, left-center */}
      <div style={{ position: "absolute", bottom: 0, left: "14%", width: "30vw", height: "92vh", backgroundImage: "url(/images/redqueen_silhouette.png)", backgroundSize: "contain", backgroundPosition: "center bottom", backgroundRepeat: "no-repeat", opacity: 0.22, pointerEvents: "none", zIndex: 2 }} />

      {/* ═══ HEADER ═══════════════════════════════════════════════════════════ */}
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 20px", borderBottom: "1px solid rgba(255,0,60,0.07)", position: "relative", zIndex: 20, flexShrink: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
          <span style={{ fontFamily: "Orbitron, sans-serif", color: "#ff003c", fontWeight: 900, fontSize: "14px", letterSpacing: "0.25em" }}>
            &gt; OPERATIVE FILE &nbsp;///&nbsp; CHARACTER SCREEN
          </span>
          <div style={{ display: "flex", gap: "12px", fontSize: "11px", fontFamily: "Oxanium, sans-serif", fontWeight: 700, letterSpacing: "0.08em" }}>
            <Link href="/" style={{ color: "#555", textDecoration: "none" }}>[ HUB ]</Link>
            <Link href="/bunker" style={{ color: "#555", textDecoration: "none" }}>[ BUNKER ]</Link>
            <Link href="/arena" style={{ color: "#555", textDecoration: "none" }}>[ ARENA ]</Link>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "14px", fontFamily: "Rajdhani, sans-serif", fontSize: "11px", color: "#555", letterSpacing: "0.15em", fontWeight: 700 }}>
          <IcDot c="#ff003c" s={5} />
          <span style={{ color: "#fff" }}>LVL {level}</span>
          <IcDot c="#ff003c" s={5} />
          <span style={{ color: factionData.color }}>{faction}</span>
          <IcDot c="#ff003c" s={5} />
          <span style={{ color: "#d4af37", fontFamily: "Orbitron, sans-serif", fontSize: "10px" }}>{threatBalance} $THREAT</span>
        </div>
      </header>

      {/* ═══ MAIN GRID ════════════════════════════════════════════════════════ */}
      <main style={{ display: "grid", gridTemplateColumns: "290px 1fr 320px", flexGrow: 1, minHeight: 0, position: "relative", zIndex: 10 }}>

        {/* ── LEFT — Identity + Stats ────────────────────────────────────── */}
        <div style={{ padding: "14px 14px 14px 18px", display: "flex", flexDirection: "column", gap: "10px", borderRight: "1px solid rgba(255,0,60,0.06)", overflowY: "auto" }}>

          {/* Identity card */}
          <div className="hud-panel" style={{ padding: "14px" }}>
            {/* Name + faction badge */}
            <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "10px" }}>
              <IcCross c="#ff003c" s={22} />
              <div>
                <div style={{ fontFamily: "Orbitron, sans-serif", color: "#ff003c", fontWeight: 900, fontSize: "14px", letterSpacing: "0.06em", lineHeight: 1.1 }}>{profileName}</div>
                <div style={{ fontFamily: "Rajdhani, sans-serif", fontSize: "10px", color: "#555", letterSpacing: "0.15em", fontWeight: 700, marginTop: "2px" }}>
                  FACTION: <span style={{ color: factionData.color }}>{faction}</span> &nbsp;/&nbsp; RANK: RED QUEEN
                </div>
              </div>
            </div>

            {/* Status effects */}
            {STATUS_EFFECTS.length > 0 && (
              <div style={{ display: "flex", gap: "4px", marginBottom: "10px", flexWrap: "wrap" }}>
                {STATUS_EFFECTS.map(s => (
                  <span key={s.name} style={{ border: `1px solid ${s.color}55`, color: s.color, fontFamily: "Orbitron, sans-serif", fontSize: "8px", padding: "2px 6px", letterSpacing: "0.08em", fontWeight: 900, background: `${s.color}11` }}>{s.name}</span>
                ))}
              </div>
            )}

            {/* BIO-SCORE */}
            <div style={{ textAlign: "center", padding: "10px 0", borderTop: "1px solid rgba(255,0,60,0.1)", borderBottom: "1px solid rgba(255,0,60,0.1)", marginBottom: "10px" }}>
              <div style={{ fontFamily: "Rajdhani, sans-serif", fontSize: "9px", color: "#555", letterSpacing: "0.2em", fontWeight: 700 }}>BIO-SCORE</div>
              <div style={{ fontFamily: "Orbitron, sans-serif", fontSize: "36px", fontWeight: 900, color: "#ff003c", textShadow: "0 0 20px rgba(255,0,60,0.6)", lineHeight: 1 }}>{stats.bioScore.toLocaleString()}</div>
              <div style={{ fontFamily: "Rajdhani, sans-serif", fontSize: "9px", color: "#555", letterSpacing: "0.15em" }}>CLEARANCE: <span style={{ color: "#d4af37" }}>LEVEL 5</span></div>
            </div>

            {/* XP Bar */}
            <div style={{ marginBottom: "10px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", fontFamily: "Rajdhani, sans-serif", fontSize: "10px", color: "rgba(255,255,255,0.4)", letterSpacing: "0.1em", marginBottom: "4px" }}>
                <span>LEVEL {level}</span>
                <span style={{ fontFamily: "Orbitron, sans-serif", fontSize: "9px", color: "#ff003c" }}>{xp.toLocaleString()} / {xpMax.toLocaleString()} XP</span>
              </div>
              <div style={{ height: "5px", background: "rgba(255,255,255,0.05)" }}>
                <div style={{ height: "100%", width: `${(xp / xpMax) * 100}%`, background: "linear-gradient(90deg, #ff003c, #ff6b00)", boxShadow: "0 0 8px rgba(255,0,60,0.6)", transition: "width 1s ease" }} />
              </div>
            </div>

            {/* K/D */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "4px", textAlign: "center" }}>
              {[
                { label: "KILLS", value: kills, color: "#ff003c" },
                { label: "DEATHS", value: deaths, color: "#888" },
                { label: "K/D", value: kd, color: "#d4af37" },
              ].map(s => (
                <div key={s.label} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", padding: "6px 4px" }}>
                  <div style={{ fontFamily: "Orbitron, sans-serif", fontSize: "14px", color: s.color, fontWeight: 900 }}>{s.value}</div>
                  <div style={{ fontFamily: "Rajdhani, sans-serif", fontSize: "9px", color: "#555", letterSpacing: "0.1em" }}>{s.label}</div>
                </div>
              ))}
            </div>
          </div>

          {/* Combat Stats — Destiny 2 style */}
          <div className="hud-panel" style={{ padding: "12px" }}>
            <div style={{ fontFamily: "Orbitron, sans-serif", fontSize: "9px", color: "#ff003c", fontWeight: 900, letterSpacing: "0.2em", marginBottom: "10px" }}>OPERATIVE STATS</div>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <StatBar label="ATTACK"    value={stats.atk} color="#ff003c" />
              <StatBar label="DEFENSE"   value={stats.def} color="#4488ff" />
              <StatBar label="AGILITY"   value={stats.agi} color="#00ff88" />
              <StatBar label="INTELLECT" value={stats.int} color="#aa44ff" />
              <StatBar label="LUCK"      value={stats.lck} color="#d4af37" />
            </div>
          </div>

          {/* Faction passive */}
          <div className="hud-panel" style={{ padding: "12px", borderColor: `${factionData.color}44` }}>
            <div style={{ fontFamily: "Orbitron, sans-serif", fontSize: "9px", color: factionData.color, fontWeight: 900, letterSpacing: "0.2em", marginBottom: "8px", display: "flex", alignItems: "center", gap: "6px" }}>
              <IcShield c={factionData.color} s={10} /> FACTION PASSIVE
            </div>
            <div style={{ fontFamily: "Orbitron, sans-serif", fontSize: "11px", color: factionData.color, fontWeight: 900, marginBottom: "4px" }}>{factionData.passive}</div>
            <div style={{ fontFamily: "Rajdhani, sans-serif", fontSize: "10px", color: "#555", letterSpacing: "0.05em" }}>WEAKNESS: {factionData.weakness}</div>
          </div>
        </div>

        {/* ── CENTER — Character + Gear overlay ─────────────────────────── */}
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "space-between", padding: "16px 12px", position: "relative" }}>

          {/* Top badge */}
          <div style={{ textAlign: "center" }}>
            <div style={{ fontFamily: "Rajdhani, sans-serif", fontSize: "10px", color: "#555", letterSpacing: "0.2em", fontWeight: 700 }}>OPERATIVE STATUS</div>
            <div style={{ fontFamily: "Orbitron, sans-serif", fontSize: "36px", fontWeight: 900, color: "#ff003c", textShadow: "0 0 20px rgba(255,0,60,0.8)", lineHeight: 1 }}>ACTIVE</div>
            <div style={{ fontFamily: "Rajdhani, sans-serif", fontSize: "10px", color: "#555", letterSpacing: "0.2em" }}>SECTOR 7 — DEEP GRID</div>
          </div>

          {/* Gear power score — Division 2 style large number */}
          <div style={{ textAlign: "center" }}>
            <div style={{ fontFamily: "Rajdhani, sans-serif", fontSize: "10px", color: "#555", letterSpacing: "0.3em", fontWeight: 700, marginBottom: "4px" }}>GEAR SCORE</div>
            <div style={{ fontFamily: "Orbitron, sans-serif", fontSize: "64px", fontWeight: 900, color: "#ffffff", lineHeight: 1, textShadow: "0 0 30px rgba(255,255,255,0.2)" }}>
              {GEAR_SLOTS.reduce((acc, g) => acc + parseInt(g.dmg || g.def || "0"), 0)}
            </div>
            <div style={{ display: "flex", justifyContent: "center", gap: "8px", marginTop: "6px" }}>
              <div style={{ height: "2px", width: "40px", background: "#ff003c", boxShadow: "0 0 6px #ff003c" }} />
              <div style={{ height: "2px", width: "40px", background: "rgba(255,255,255,0.15)" }} />
            </div>
          </div>

          {/* Selected gear detail panel — Division 2 inspection style */}
          {selectedGearData && (
            <div className="hud-panel" style={{ width: "100%", padding: "14px", background: "rgba(3,3,3,0.92)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "8px" }}>
                <div>
                  <div style={{ fontFamily: "Rajdhani, sans-serif", fontSize: "9px", color: TIER_COLOR[selectedGearData.tier], letterSpacing: "0.2em", fontWeight: 900, marginBottom: "3px" }}>
                    {selectedGearData.tier} &nbsp;/&nbsp; {selectedGearData.label}
                  </div>
                  <div style={{ fontFamily: "Orbitron, sans-serif", fontSize: "14px", color: "#ffffff", fontWeight: 900, letterSpacing: "0.06em" }}>{selectedGearData.name}</div>
                </div>
                <selectedGearData.Icon c={TIER_COLOR[selectedGearData.tier]} s={28} />
              </div>
              {/* Stat modifiers */}
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                {selectedGearData.attrs.map((a, i) => (
                  <div key={i} style={{ display: "flex", alignItems: "center", gap: "6px", fontFamily: "Rajdhani, sans-serif", fontSize: "11px", color: "rgba(255,255,255,0.6)", letterSpacing: "0.08em" }}>
                    <IcCheck c="#00ff88" s={10} />
                    <span style={{ color: "#00ff88" }}>{a}</span>
                  </div>
                ))}
              </div>
              {/* Power value */}
              <div style={{ marginTop: "8px", paddingTop: "8px", borderTop: "1px solid rgba(255,255,255,0.06)", display: "flex", justifyContent: "space-between" }}>
                <span style={{ fontFamily: "Rajdhani, sans-serif", fontSize: "10px", color: "#555", letterSpacing: "0.1em" }}>POWER</span>
                <span style={{ fontFamily: "Orbitron, sans-serif", fontSize: "14px", color: TIER_COLOR[selectedGearData.tier], fontWeight: 900 }}>
                  {selectedGearData.dmg || selectedGearData.def}
                </span>
              </div>
            </div>
          )}

          {/* CTA buttons */}
          <div style={{ display: "flex", gap: "8px", width: "100%" }}>
            <Link href="/arena" style={{ flex: 1, textDecoration: "none" }}>
              <button style={{
                width: "100%", padding: "15px",
                background: "linear-gradient(135deg, #ff003c 0%, #cc0030 100%)",
                border: "none", color: "#fff",
                fontFamily: "Orbitron, sans-serif", fontSize: "13px", fontWeight: 900, letterSpacing: "0.25em",
                cursor: "pointer", textTransform: "uppercase",
                boxShadow: "0 0 40px rgba(255,0,60,0.5)",
                clipPath: "polygon(8px 0%, 100% 0%, calc(100% - 8px) 100%, 0% 100%)",
                display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
                transition: "all 0.15s",
              }} className="fight-btn-ready">
                <IcSword c="#fff" s={16} /> ENTER ARENA
              </button>
            </Link>
            <Link href="/bunker" style={{ flex: 1, textDecoration: "none" }}>
              <button style={{
                width: "100%", padding: "15px",
                background: "rgba(255,255,255,0.04)",
                border: "2px solid rgba(255,255,255,0.15)", color: "#fff",
                fontFamily: "Orbitron, sans-serif", fontSize: "13px", fontWeight: 900, letterSpacing: "0.25em",
                cursor: "pointer", textTransform: "uppercase",
                clipPath: "polygon(8px 0%, 100% 0%, calc(100% - 8px) 100%, 0% 100%)",
                display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
                transition: "all 0.15s",
              }}>
                <IcShield c="#fff" s={16} /> BUNKER
              </button>
            </Link>
          </div>
        </div>

        {/* ── RIGHT — Gear Grid + Talents ───────────────────────────────── */}
        <div style={{ padding: "14px 18px 14px 14px", display: "flex", flexDirection: "column", gap: "10px", borderLeft: "1px solid rgba(255,0,60,0.06)", overflowY: "auto" }}>

          {/* Gear slots — Division 2 inventory grid */}
          <div className="hud-panel" style={{ padding: "12px" }}>
            <div style={{ fontFamily: "Orbitron, sans-serif", fontSize: "9px", color: "#ff003c", fontWeight: 900, letterSpacing: "0.2em", marginBottom: "10px" }}>
              LOADOUT
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "5px" }}>
              {GEAR_SLOTS.map(slot => (
                <GearSlot key={slot.id} slot={slot} selected={selectedGear === slot.id} onClick={() => setSelectedGear(selectedGear === slot.id ? null : slot.id)} />
              ))}
            </div>
          </div>

          {/* Talents */}
          <div className="hud-panel" style={{ padding: "12px" }}>
            <div style={{ fontFamily: "Orbitron, sans-serif", fontSize: "9px", color: "#ff003c", fontWeight: 900, letterSpacing: "0.2em", marginBottom: "10px" }}>TALENTS</div>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
              {[
                { name: "BATTLE HARDENED", desc: "+10% damage vs Torso targets", active: true,  Icon: IcTarget },
                { name: "ADRENALINE SURGE",desc: "Speed boost after crit hit",   active: true,  Icon: IcBolt   },
                { name: "GHOST PROTOCOL",  desc: "25% chance to dodge melee",    active: false, Icon: IcSkull  },
                { name: "IRON GRIP",       desc: "Weapon drop chance -40%",      active: false, Icon: IcGun    },
              ].map(t => (
                <div key={t.name} style={{ display: "flex", alignItems: "center", gap: "8px", padding: "7px 8px", background: t.active ? "rgba(255,0,60,0.06)" : "rgba(255,255,255,0.02)", border: `1px solid ${t.active ? "rgba(255,0,60,0.2)" : "rgba(255,255,255,0.05)"}` }}>
                  <t.Icon c={t.active ? "#ff003c" : "#444"} s={13} />
                  <div>
                    <div style={{ fontFamily: "Orbitron, sans-serif", fontSize: "9px", color: t.active ? "#fff" : "#555", fontWeight: 900, letterSpacing: "0.05em" }}>{t.name}</div>
                    <div style={{ fontFamily: "Rajdhani, sans-serif", fontSize: "9px", color: "rgba(255,255,255,0.25)", marginTop: "1px" }}>{t.desc}</div>
                  </div>
                  {t.active && <IcCheck c="#00ff88" s={10} />}
                </div>
              ))}
            </div>
          </div>

          {/* $THREAT balance + XP decay warning */}
          <div className="hud-panel" style={{ padding: "12px", borderColor: "#d4af3744" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <div>
                <div style={{ fontFamily: "Orbitron, sans-serif", fontSize: "9px", color: "#555", letterSpacing: "0.15em", marginBottom: "2px" }}>ESCROW BALANCE</div>
                <div style={{ fontFamily: "Orbitron, sans-serif", fontSize: "22px", color: "#d4af37", fontWeight: 900, textShadow: "0 0 12px rgba(212,175,55,0.4)" }}>{threatBalance} <span style={{ fontSize: "11px" }}>$THREAT</span></div>
              </div>
              <IcStar c="#d4af37" s={22} />
            </div>
            {threatBalance < 100 && (
              <div style={{ marginTop: "8px", padding: "5px 8px", background: "rgba(255,0,60,0.08)", border: "1px solid rgba(255,0,60,0.3)", fontFamily: "Rajdhani, sans-serif", fontSize: "10px", color: "#ff003c", letterSpacing: "0.08em" }}>
                WARNING: XP DECAY ACTIVE — Stake more $THREAT to protect profile
              </div>
            )}
          </div>
        </div>
      </main>

      {/* ═══ FOOTER ═══════════════════════════════════════════════════════════ */}
      <footer style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", height: "185px", flexShrink: 0, zIndex: 20, borderTop: "1px solid rgba(255,0,60,0.06)", position: "relative" }}>

        {/* Tab nav */}
        <div style={{ position: "absolute", top: 0, left: 0, right: 0, display: "flex", borderBottom: "1px solid rgba(255,0,60,0.06)", zIndex: 2 }}>
          {(["LOG", "THREATS", "ACHIEVEMENTS"] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)}
              style={{ flex: 1, background: activeTab === tab ? "rgba(255,0,60,0.08)" : "transparent", border: "none", borderBottom: activeTab === tab ? "2px solid #ff003c" : "2px solid transparent", color: activeTab === tab ? "#ff003c" : "#555", fontFamily: "Orbitron, sans-serif", fontSize: "9px", padding: "8px", cursor: "pointer", letterSpacing: "0.15em", fontWeight: 900, transition: "all 0.12s" }}>
              {tab}
            </button>
          ))}
        </div>

        {/* Tab content spans all 3 cols */}
        <div style={{ gridColumn: "1 / -1", padding: "38px 20px 10px", overflowY: "auto", display: "flex", gap: "8px", flexWrap: "wrap", alignContent: "flex-start" }} className="hud-scrollbar">
          {activeTab === "LOG" && COMBAT_LOG.map((l, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "5px 10px", background: l.result === "WIN" ? "rgba(0,255,136,0.04)" : "rgba(255,0,60,0.04)", border: `1px solid ${l.result === "WIN" ? "rgba(0,255,136,0.12)" : "rgba(255,0,60,0.12)"}`, minWidth: "220px", flexGrow: 1 }}>
              <span style={{ fontFamily: "Orbitron, sans-serif", fontSize: "10px", color: l.result === "WIN" ? "#00ff88" : "#ff003c", fontWeight: 900, minWidth: "36px" }}>{l.result}</span>
              <span style={{ fontFamily: "Rajdhani, sans-serif", fontSize: "10px", color: "#fff", fontWeight: 700, flex: 1 }}>vs {l.opp}</span>
              <span style={{ fontFamily: "Orbitron, sans-serif", fontSize: "9px", color: "#ff003c" }}>DMG {l.dmg}</span>
              <span style={{ fontFamily: "Orbitron, sans-serif", fontSize: "9px", color: "#555" }}>TAKEN {l.taken}</span>
              <span style={{ fontFamily: "Rajdhani, sans-serif", fontSize: "9px", color: "#555", letterSpacing: "0.1em" }}>[{l.t}]</span>
            </div>
          ))}

          {activeTab === "THREATS" && (
            <>
              {[
                { name: "TOXIC FOG — SECTOR 7",   severity: "HIGH",   color: "#ff003c", desc: "HP regen -10% for 48h" },
                { name: "SOLAR FLARE INCOMING",    severity: "MEDIUM", color: "#ff8800", desc: "Lock-on disabled next cycle" },
                { name: "MARAUDER RAID ALERT",     severity: "HIGH",   color: "#ff003c", desc: "Bunker under threat" },
                { name: "WATER SCARCITY — GRID 3", severity: "LOW",    color: "#d4af37", desc: "Water value +35%" },
              ].map((t, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "5px 10px", background: `${t.color}08`, border: `1px solid ${t.color}22`, minWidth: "220px", flexGrow: 1 }}>
                  <IcBolt c={t.color} s={12} />
                  <div style={{ flex: 1 }}>
                    <div style={{ fontFamily: "Orbitron, sans-serif", fontSize: "9px", color: t.color, fontWeight: 900 }}>{t.name}</div>
                    <div style={{ fontFamily: "Rajdhani, sans-serif", fontSize: "9px", color: "rgba(255,255,255,0.35)" }}>{t.desc}</div>
                  </div>
                  <span style={{ fontFamily: "Rajdhani, sans-serif", fontSize: "9px", color: t.color, border: `1px solid ${t.color}44`, padding: "1px 6px", letterSpacing: "0.1em" }}>{t.severity}</span>
                </div>
              ))}
            </>
          )}

          {activeTab === "ACHIEVEMENTS" && ACHIEVEMENTS.map((a, i) => (
            <div key={i} style={{ display: "flex", alignItems: "center", gap: "10px", padding: "5px 10px", background: a.done ? "rgba(0,255,136,0.03)" : "rgba(255,255,255,0.02)", border: `1px solid ${a.done ? "rgba(0,255,136,0.12)" : "rgba(255,255,255,0.05)"}`, minWidth: "200px", flexGrow: 1, opacity: a.done ? 1 : 0.5 }}>
              <IcCheck c={a.done ? "#00ff88" : "#444"} s={12} />
              <div>
                <div style={{ fontFamily: "Orbitron, sans-serif", fontSize: "9px", color: a.done ? "#fff" : "#555", fontWeight: 900 }}>{a.name}</div>
                <div style={{ fontFamily: "Rajdhani, sans-serif", fontSize: "9px", color: "rgba(255,255,255,0.3)" }}>{a.desc}</div>
              </div>
            </div>
          ))}
        </div>
      </footer>
    </div>
  );
}
