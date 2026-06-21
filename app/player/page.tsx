"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/AuthProvider";
import { useWallet } from "@solana/wallet-adapter-react";
import Link from "next/link";

// ── SVG ICONS ─────────────────────────────────────────────────────────────────
const IcSword  = ({c,s=16}:{c:string;s?:number}) => <svg width={s} height={s} viewBox="0 0 16 16" fill="none"><line x1="2" y1="14" x2="12" y2="4" stroke={c} strokeWidth="1.5"/><polyline points="10,2 14,2 14,6" stroke={c} strokeWidth="1.5" fill="none"/><line x1="2" y1="10" x2="4" y2="12" stroke={c} strokeWidth="1.2"/></svg>;
const IcShield = ({c,s=16}:{c:string;s?:number}) => <svg width={s} height={s} viewBox="0 0 16 16" fill="none"><path d="M8 2L14 5L14 9C14 12 8 15 8 15C8 15 2 12 2 9L2 5Z" stroke={c} strokeWidth="1.5" fill="none"/></svg>;
const IcDot    = ({c,s=6 }:{c:string;s?:number}) => <svg width={s} height={s} viewBox="0 0 6 6" fill="none"><circle cx="3" cy="3" r="2.5" fill={c}/></svg>;
const IcStar   = ({c,s=10}:{c:string;s?:number}) => <svg width={s} height={s} viewBox="0 0 16 16" fill="none"><polygon points="8,1 10,6 15,6 11,10 13,15 8,12 3,15 5,10 1,6 6,6" fill={c}/></svg>;
const IcCheck  = ({c,s=11}:{c:string;s?:number}) => <svg width={s} height={s} viewBox="0 0 16 16" fill="none"><polyline points="2,8 6,12 14,4" stroke={c} strokeWidth="2" fill="none"/></svg>;
const IcGun    = ({c,s=22}:{c:string;s?:number}) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><rect x="2" y="9" width="13" height="6" stroke={c} strokeWidth="1.5" fill="none"/><rect x="15" y="8" width="7" height="4" stroke={c} strokeWidth="1.2" fill="none"/><line x1="5" y1="15" x2="5" y2="20" stroke={c} strokeWidth="1.5"/><line x1="4" y1="9" x2="4" y2="6" stroke={c} strokeWidth="1.2"/><line x1="7" y1="9" x2="7" y2="6" stroke={c} strokeWidth="1.2"/></svg>;
const IcHelmet = ({c,s=22}:{c:string;s?:number}) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M4 15C4 9 7 3 12 3C17 3 20 9 20 15" stroke={c} strokeWidth="1.5" fill="none"/><line x1="3" y1="17" x2="21" y2="17" stroke={c} strokeWidth="1.5"/><line x1="6" y1="20" x2="18" y2="20" stroke={c} strokeWidth="1.2"/></svg>;
const IcChest  = ({c,s=22}:{c:string;s?:number}) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><rect x="3" y="4" width="18" height="15" stroke={c} strokeWidth="1.5" fill="none"/><line x1="3" y1="10" x2="21" y2="10" stroke={c} strokeWidth="1"/><circle cx="12" cy="7" r="1.5" fill={c}/></svg>;
const IcGlove  = ({c,s=22}:{c:string;s?:number}) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M4 14V8C4 6 6 5 7 6V3C7 2 10 2 10 3V2C10 1 13 1 13 2V3C13 1 16 1 16 3V8" stroke={c} strokeWidth="1.2" fill="none"/><path d="M4 14C4 17 6 20 12 20C18 20 20 17 20 14V8" stroke={c} strokeWidth="1.5" fill="none"/></svg>;
const IcBoots  = ({c,s=22}:{c:string;s?:number}) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M6 2L6 14L3 18L3 21L15 21L15 18L12 14" stroke={c} strokeWidth="1.5" fill="none"/><line x1="6" y1="14" x2="12" y2="14" stroke={c} strokeWidth="1.5"/><path d="M12 2L12 14" stroke={c} strokeWidth="1.5"/></svg>;
const IcKnife  = ({c,s=22}:{c:string;s?:number}) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><line x1="4" y1="20" x2="17" y2="7" stroke={c} strokeWidth="1.8"/><path d="M17 7L20 4L20 7L17 10Z" stroke={c} strokeWidth="1.2" fill="none"/><line x1="4" y1="20" x2="7" y2="20" stroke={c} strokeWidth="1.8"/></svg>;
const IcPack   = ({c,s=22}:{c:string;s?:number}) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><rect x="5" y="4" width="14" height="17" rx="2" stroke={c} strokeWidth="1.5" fill="none"/><line x1="9" y1="4" x2="9" y2="2" stroke={c} strokeWidth="1.2"/><line x1="15" y1="4" x2="15" y2="2" stroke={c} strokeWidth="1.2"/><line x1="9" y1="2" x2="15" y2="2" stroke={c} strokeWidth="1.2"/><line x1="5" y1="11" x2="19" y2="11" stroke={c} strokeWidth="1"/></svg>;
const IcBolt   = ({c,s=13}:{c:string;s?:number}) => <svg width={s} height={s} viewBox="0 0 16 16" fill="none"><polyline points="10,2 5,9 9,9 6,14" stroke={c} strokeWidth="1.5" fill="none"/></svg>;
const IcTarget = ({c,s=13}:{c:string;s?:number}) => <svg width={s} height={s} viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6" stroke={c} strokeWidth="1" fill="none"/><circle cx="8" cy="8" r="3" stroke={c} strokeWidth="1" fill="none"/><circle cx="8" cy="8" r="1.5" fill={c}/></svg>;

// ── TIER COLORS ───────────────────────────────────────────────────────────────
const TIER_COLOR: Record<string,string> = {
  COMMON:"#777", UNCOMMON:"#00aa44", RARE:"#2288ff", EPIC:"#aa44ff", NAMED:"#d4af37",
};

// ── GEAR DATA ─────────────────────────────────────────────────────────────────
const GEAR = [
  { id:"w1",  slot:"PRIMARY",   Icon:IcGun,    tier:"NAMED",    name:"COMBAT RIFLE MK-IV", power:247, stats:{TOTAL_DMG:"3.7M", RPM:"98",  MAG:"30" }, attrs:["Damage +18%","Crit Chance +8%","Armor Dmg +12%"], talent:"Overflowing — Kills restore 50% magazine" },
  { id:"w2",  slot:"SECONDARY", Icon:IcGun,    tier:"EPIC",     name:"TACTICAL SMG VX",    power:220, stats:{TOTAL_DMG:"1.2M", RPM:"140", MAG:"45" }, attrs:["Damage +10%","Headshot +15%"],                   talent:"Ranger — Damage scales with distance" },
  { id:"w3",  slot:"SIDEARM",   Icon:IcKnife,  tier:"RARE",     name:"COMBAT BLADE",       power:180, stats:{TOTAL_DMG:"440k", RPM:"—",   MAG:"—"  }, attrs:["Bleed on hit","Melee +20%"],                     talent:"Predator — Bleed spreads to nearby enemies" },
  { id:"hd",  slot:"HEAD",      Icon:IcHelmet, tier:"EPIC",     name:"TACTICAL HELMET v3", power:238, stats:{ARMOR:"726k",     DEF:"28",  MOD:"—"  }, attrs:["DEF +8","Glitch Resistance","HS Armor +10%"],    talent:"Vigilance — +25% skill dmg after taking damage" },
  { id:"ch",  slot:"CHEST",     Icon:IcChest,  tier:"NAMED",    name:"PLATED VEST ALPHA",  power:251, stats:{ARMOR:"726k",     DEF:"52",  MOD:"—"  }, attrs:["DEF +18","Max HP +20%","Armor Regen +5%"],       talent:"Intimidate — +20% dmg while shield active" },
  { id:"gl",  slot:"GLOVES",    Icon:IcGlove,  tier:"RARE",     name:"GRIP GAUNTLETS II",  power:216, stats:{ARMOR:"726k",     DEF:"12",  MOD:"—"  }, attrs:["AGI +6","Headshot Dmg +8%"],                     talent:"Glass Cannon — +30% dmg, no armor" },
  { id:"bt",  slot:"BOOTS",     Icon:IcBoots,  tier:"EPIC",     name:"STALKER BOOTS MK-II",power:233, stats:{ARMOR:"726k",     DEF:"18",  MOD:"—"  }, attrs:["AGI +10","Speed +8%","Stamina +12%"],            talent:"Kinetic Momentum — Speed builds bonus dmg" },
  { id:"pk",  slot:"BACKPACK",  Icon:IcPack,   tier:"UNCOMMON", name:"FIELD PACK STD",     power:198, stats:{ARMOR:"726k",     DEF:"5",   MOD:"—"  }, attrs:["Carry +15kg","Skill Haste +5%"],                 talent:"Wyvern Wear — +15% skill duration" },
];

const TABS = ["LOADOUT","STATS","ACHIEVEMENTS","COMBAT LOG"] as const;
type Tab = typeof TABS[number];

const COMBAT_LOG = [
  {result:"WIN",  opp:"SHADOW_RUNNER",  dmg:47, taken:12, t:"02:14"},
  {result:"WIN",  opp:"MARAUDER_K",     dmg:63, taken:34, t:"01:58"},
  {result:"LOSS", opp:"GATEKEEPER_X",   dmg:28, taken:81, t:"01:22"},
  {result:"WIN",  opp:"PHANTOM_UNIT",   dmg:55, taken:20, t:"00:47"},
  {result:"WIN",  opp:"NET_VIPER",      dmg:71, taken:15, t:"23:31"},
];

const ACHIEVEMENTS = [
  {name:"FIRST BLOOD",   done:true,  desc:"Win first PvP duel"},
  {name:"BUNKER LORD",   done:true,  desc:"Stake 500+ $THREAT"},
  {name:"SURVIVOR",      done:true,  desc:"Survive 24h without dying"},
  {name:"GHOST RUNNER",  done:false, desc:"3 scavenge runs in one day"},
  {name:"INFILTRATOR",   done:false, desc:"Decrypt 10 nodes"},
  {name:"SECTOR HUNTER", done:false, desc:"Claim 3 bounty targets"},
];

// ── STAT BAR ──────────────────────────────────────────────────────────────────
function StatBar({label,value,color}:{label:string;value:number;color:string}) {
  return (
    <div style={{display:"flex",flexDirection:"column",gap:"3px"}}>
      <div style={{display:"flex",justifyContent:"space-between",fontFamily:"Rajdhani,sans-serif",fontSize:"11px",fontWeight:700,letterSpacing:"0.12em",color:"rgba(255,255,255,0.45)",textTransform:"uppercase"}}>
        <span>{label}</span>
        <span style={{color:"#fff",fontFamily:"Orbitron,sans-serif",fontSize:"10px",fontWeight:900}}>{value}</span>
      </div>
      <div style={{height:"3px",background:"rgba(255,255,255,0.06)"}}>
        <div style={{height:"100%",width:`${value}%`,background:color,boxShadow:`0 0 6px ${color}`,transition:"width 1s ease"}}/>
      </div>
    </div>
  );
}

// ── GEAR SLOT BUTTON ──────────────────────────────────────────────────────────
function GearSlot({
  g,
  active,
  onClick,
  onMouseEnter,
  onMouseLeave,
}: {
  g: typeof GEAR[0];
  active: boolean;
  onClick: () => void;
  onMouseEnter?: () => void;
  onMouseLeave?: () => void;
}) {
  const tc = TIER_COLOR[g.tier];
  return (
    <button 
      onClick={onClick} 
      onMouseEnter={onMouseEnter}
      onMouseLeave={onMouseLeave}
      style={{
        border:`1px solid ${active?"#ff003c":tc+"44"}`,
        background:active?"rgba(255,0,60,0.1)":"rgba(8,8,8,0.85)",
        padding:"10px 8px",cursor:"pointer",transition:"all 0.12s",
        display:"flex",flexDirection:"column",alignItems:"center",gap:"5px",
        boxShadow:active?`0 0 20px rgba(255,0,60,0.3), inset 0 0 20px rgba(255,0,60,0.05)`:`inset 0 0 0 1px ${tc}22`,
        position:"relative",backdropFilter:"blur(8px)",textAlign:"center",
      }}
    >
      <div style={{position:"absolute",top:3,right:3,width:5,height:5,background:tc}}/>
      <g.Icon c={active?"#ff003c":tc} s={24}/>
      <div style={{fontFamily:"Rajdhani,sans-serif",fontSize:"9px",color:active?"#ff003c":"rgba(255,255,255,0.3)",letterSpacing:"0.1em",fontWeight:700,textTransform:"uppercase"}}>{g.slot}</div>
      <div style={{fontFamily:"Orbitron,sans-serif",fontSize:"8px",color:active?"#fff":tc,fontWeight:900,letterSpacing:"0.03em",lineHeight:1.2,overflow:"hidden",textOverflow:"ellipsis",maxWidth:"96px",whiteSpace:"nowrap"}}>{g.name}</div>
      <div style={{fontFamily:"Orbitron,sans-serif",fontSize:"13px",color:tc,fontWeight:900,textShadow:`0 0 8px ${tc}66`}}>{g.power}</div>
    </button>
  );
}

// ── MAIN ──────────────────────────────────────────────────────────────────────
export default function PlayerPage() {
  const {authIdentifier} = useAuth();
  const {publicKey}      = useWallet();
  const wallet = authIdentifier || (publicKey?.toString() ?? null);

  const [selectedId, setSelectedId] = useState("w1");
  const [activeTab,  setActiveTab]  = useState<Tab>("LOADOUT");
  const [hoveredSlot, setHoveredSlot] = useState<string | null>(null);

  const profileName  = "RED QUEEN ADMIN";
  const faction      = "MARAUDERS";
  const factionColor = "#ff003c";
  const level        = 14;
  const gearScore    = Math.round(GEAR.reduce((a,g)=>a+g.power,0)/GEAR.length);
  const xp=7400; const xpMax=10000;
  const kills=47; const deaths=12;
  const threat=320;
  const sel = GEAR.find(g=>g.id===selectedId)!;

  useEffect(() => {
    if (!wallet) return;
    // profile fetch would go here
  }, [wallet]);

  const panelBg = {background:"rgba(0,0,0,0.5)",border:"1px solid rgba(255,0,60,0.15)",backdropFilter:"blur(6px)"};

  return (
    <div id="game-player-root" style={{background:"#030303",height:"100vh",color:"#fff",fontFamily:"Rajdhani,sans-serif",position:"relative",overflow:"hidden",display:"flex",flexDirection:"column"}}>

      {/* ── Distinct Player Backdrop Hangar image ── */}
      <div style={{
        position:"absolute",
        inset:0,
        backgroundImage:"url(/images/player_backdrop.png)",
        backgroundSize:"cover",
        backgroundPosition:"center",
        opacity:0.18,
        mixBlendMode:"lighten",
        pointerEvents:"none",
        zIndex:0
      }}/>

      {/* ── Holographic Circular Pedestal at character feet ── */}
      <div style={{
        position:"absolute",
        bottom:"-30px",
        left:"2vw",
        width:"36vw",
        height:"120px",
        background:"radial-gradient(ellipse at 50% 50%, rgba(255,0,60,0.25) 0%, transparent 70%)",
        borderTop:"2px solid rgba(255,0,60,0.4)",
        boxShadow:"0 -10px 40px rgba(255,0,60,0.5)",
        transform:"perspective(800px) rotateX(75deg)",
        zIndex:1,
        pointerEvents:"none"
      }}>
        <div style={{
          position:"absolute",
          inset:"10px",
          border:"1.5px dashed rgba(255,255,255,0.4)",
          borderRadius:"50%",
          animation:"hud-rotate-clockwise 10s linear infinite"
        }} />
        <div style={{
          position:"absolute",
          inset:"20px",
          border:"1px solid rgba(255,0,60,0.6)",
          borderRadius:"50%",
          animation:"hud-rotate-counter 6s linear infinite"
        }} />
      </div>

      {/* ── Ambient glows */}
      <div style={{position:"absolute",top:0,left:0,width:"45%",height:"100%",background:"radial-gradient(ellipse at 20% 50%, rgba(255,0,60,0.09) 0%, transparent 65%)",pointerEvents:"none",zIndex:1}}/>
      <div style={{position:"absolute",top:0,right:0,width:"45%",height:"100%",background:"radial-gradient(ellipse at 80% 50%, rgba(200,220,255,0.06) 0%, transparent 65%)",pointerEvents:"none",zIndex:1}}/>

      {/* ── CRT scanlines */}
      <div className="hud-scanline"/>

      {/* ── Grid */}
      <div style={{position:"absolute",inset:0,backgroundImage:"linear-gradient(rgba(255,0,60,0.005) 1px,transparent 1px),linear-gradient(90deg,rgba(255,0,60,0.005) 1px,transparent 1px)",backgroundSize:"40px 40px",pointerEvents:"none",zIndex:1}}/>

      {/* ── Frame */}
      <div style={{position:"absolute",top:"10px",left:"10px",right:"10px",bottom:"10px",border:"1px solid rgba(255,0,60,0.07)",pointerEvents:"none",zIndex:15}}/>

      {/* Left: Full-height Red Queen operative standing on the platform */}
      <div style={{
        position:"absolute",bottom:0,left:"-2vw",
        width:"44vw",height:"90vh",
        backgroundImage:"url(/images/redqueen_silhouette.png)",
        backgroundSize:"contain",backgroundPosition:"left bottom",backgroundRepeat:"no-repeat",
        zIndex:2,pointerEvents:"none",
        filter:"brightness(0.9) drop-shadow(0 0 50px rgba(255,0,60,0.6))",
      }}/>

      {/* ── Interactive Tactical Connection Diodes & Labels ── */}
      {(() => {
        const nodes: Record<string, { top: string; left: string; label: string }> = {
          HEAD:      { top: "25%", left: "16.5vw", label: "NEURAL HELMET SYS" },
          PRIMARY:   { top: "42%", left: "20.5vw", label: "PRIMARY TARGETER" },
          SECONDARY: { top: "48%", left: "22.0vw", label: "SECONDARY LINK" },
          SIDEARM:   { top: "54%", left: "19.5vw", label: "SIDEARM PROTOCOL" },
          CHEST:     { top: "38%", left: "16.0vw", label: "NANO-CORE PLATES" },
          BACKPACK:  { top: "45%", left: "13.0vw", label: "TACTICAL SYS PACK" },
          GLOVES:    { top: "51%", left: "24.0vw", label: "STRIKE RECEPTORS" },
          BOOTS:     { top: "75%", left: "15.0vw", label: "KINETIC THRUSTERS" },
        };

        return Object.entries(nodes).map(([slotKey, node]) => {
          const matchingGearItem = GEAR.find(g => g.slot === slotKey || (g.id === "w1" && slotKey === "PRIMARY") || (g.id === "w2" && slotKey === "SECONDARY") || (g.id === "w3" && slotKey === "SIDEARM"));
          const isActive = selectedId === matchingGearItem?.id || hoveredSlot === slotKey;
          const glowColor = isActive ? "#ff003c" : "rgba(255,255,255,0.35)";
          
          return (
            <div key={slotKey} style={{
              position: "absolute",
              top: node.top,
              left: node.left,
              zIndex: 10,
              pointerEvents: "none",
              display: "flex",
              alignItems: "center",
              gap: "8px",
              fontFamily: "monospace",
              fontSize: "8px"
            }}>
              <div style={{
                width: "8px",
                height: "8px",
                borderRadius: "50%",
                background: glowColor,
                boxShadow: `0 0 10px ${glowColor}`,
                position: "relative",
                display: "flex",
                alignItems: "center",
                justifyContent: "center"
              }}>
                {isActive && (
                  <div style={{
                    position: "absolute",
                    inset: "-4px",
                    border: `1px solid ${glowColor}`,
                    borderRadius: "50%",
                    animation: "hud-blink 1s infinite"
                  }} />
                )}
              </div>
              {isActive && (
                <div style={{
                  color: "#ff003c",
                  textShadow: "0 0 5px #ff003c",
                  fontWeight: "bold",
                  background: "rgba(0,0,0,0.8)",
                  border: "1px solid rgba(255,0,60,0.3)",
                  padding: "2px 6px",
                  letterSpacing: "0.1em",
                  whiteSpace: "nowrap"
                }}>
                  {node.label} // ON
                </div>
              )}
            </div>
          );
        });
      })()}

      {/* ── SVG callout lines overlay ── */}
      <svg style={{
        position: "absolute", bottom: 0, left: "-2vw",
        width: "44vw", height: "90vh",
        zIndex: 3, pointerEvents: "none"
      }}>
        <defs>
          <filter id="glow-lines" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>
        {(() => {
          const lines = [
            { id: "HEAD",      x1: "37.5%", y1: "25%", x2: "75%", y2: "25%" },
            { id: "CHEST",     x1: "36.3%", y1: "38%", x2: "75%", y2: "38%" },
            { id: "BACKPACK",  x1: "29.5%", y1: "45%", x2: "75%", y2: "45%" },
            { id: "PRIMARY",   x1: "46.6%", y1: "42%", x2: "75%", y2: "42%" },
            { id: "SECONDARY", x1: "50%",   y1: "48%", x2: "75%", y2: "48%" },
            { id: "SIDEARM",   x1: "44.3%", y1: "54%", x2: "75%", y2: "54%" },
            { id: "GLOVES",    x1: "54.5%", y1: "51%", x2: "75%", y2: "51%" },
            { id: "BOOTS",     x1: "34%",   y1: "75%", x2: "75%", y2: "75%" },
          ];

          return lines.map(l => {
            const matchingGearItem = GEAR.find(g => g.slot === l.id || (g.id === "w1" && l.id === "PRIMARY") || (g.id === "w2" && l.id === "SECONDARY") || (g.id === "w3" && l.id === "SIDEARM"));
            const isActive = selectedId === matchingGearItem?.id || hoveredSlot === l.id;
            const stroke = isActive ? "#ff003c" : "rgba(255,255,255,0.06)";
            
            return (
              <g key={l.id}>
                <line x1={l.x1} y1={l.y1} x2={l.x2} y2={l.y2} 
                  stroke={stroke} strokeWidth={isActive ? "1.5" : "1"} 
                  strokeDasharray={isActive ? "none" : "3 3"}
                  style={{ transition: "stroke 0.2s ease, stroke-width 0.2s ease" }}
                  filter={isActive ? "url(#glow-lines)" : undefined}
                />
                <circle cx={l.x1} cy={l.y1} r={isActive ? 3 : 1.5} fill={stroke} style={{ transition: "all 0.2s" }} />
                <circle cx={l.x2} cy={l.y2} r={isActive ? 2 : 1} fill={stroke} style={{ transition: "all 0.2s" }} />
              </g>
            );
          });
        })()}
      </svg>

      {/* ═══ HEADER ═══════════════════════════════════════════════════════════ */}
      <header style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"14px 24px 12px",borderBottom:"1px solid rgba(255,0,60,0.07)",position:"relative",zIndex:20,flexShrink:0}}>
        <div style={{display:"flex",alignItems:"center",gap:"20px"}}>
          <span style={{fontFamily:"Orbitron,sans-serif",color:"#ff003c",fontWeight:900,fontSize:"15px",letterSpacing:"0.25em"}}>&gt; OPERATIVE FILE &nbsp;///&nbsp; CHARACTER SCREEN</span>
          <div style={{display:"flex",gap:"12px",fontSize:"11px",fontFamily:"Oxanium,sans-serif",fontWeight:700,letterSpacing:"0.08em"}}>
            <Link href="/"       style={{color:"#555",textDecoration:"none"}}>[ HUB ]</Link>
            <Link href="/bunker" style={{color:"#555",textDecoration:"none"}}>[ BUNKER ]</Link>
            <Link href="/arena"  style={{color:"#555",textDecoration:"none"}}>[ ARENA ]</Link>
          </div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:"16px",fontSize:"12px",color:"#555",fontFamily:"Rajdhani,sans-serif",letterSpacing:"0.15em",fontWeight:700}}>
          <span>SEASON 1</span>
          <IcDot c="#ff003c" s={6}/>
          <span style={{color:factionColor}}>{faction} <IcStar c={factionColor} s={10}/></span>
          <IcDot c="#ff003c" s={6}/>
          <span style={{color:"#d4af37",fontFamily:"Orbitron,sans-serif",fontSize:"10px"}}>{threat} $THREAT</span>
        </div>
      </header>

      {/* ═══ MAIN ═════════════════════════════════════════════════════════════ */}
      <main style={{display:"grid",gridTemplateColumns:"300px 1fr 1fr",gap:"0",flexGrow:1,minHeight:0,position:"relative",zIndex:10}}>

        {/* ─── LEFT — Identity stats overlaid on character ─────────────── */}
        <div style={{padding:"16px 16px 16px 20px",display:"flex",flexDirection:"column",gap:"12px",justifyContent:"flex-end"}}>

          {/* Identity card — at the bottom over the character */}
          <div style={{...panelBg,padding:"14px"}}>
            <div style={{display:"flex",alignItems:"center",gap:"10px",marginBottom:"6px"}}>
              <IcTarget c="#ff003c" s={20}/>
              <div>
                <div style={{fontFamily:"Orbitron,sans-serif",color:"#ff003c",fontWeight:900,fontSize:"15px",letterSpacing:"0.06em",lineHeight:1.1}}>{profileName}</div>
                <div style={{fontFamily:"Rajdhani,sans-serif",fontSize:"10px",color:"#555",letterSpacing:"0.15em",fontWeight:700}}>RANK: <span style={{color:factionColor}}>RED QUEEN</span> &nbsp;/&nbsp; RATING: 1847</div>
              </div>
            </div>
            {/* Gear score — Division 2 big number */}
            <div style={{display:"flex",alignItems:"baseline",gap:"8px",margin:"10px 0 8px",padding:"8px 0",borderTop:"1px solid rgba(255,0,60,0.1)",borderBottom:"1px solid rgba(255,0,60,0.1)"}}>
              <div style={{fontFamily:"Orbitron,sans-serif",fontSize:"48px",fontWeight:900,color:"#fff",lineHeight:1,textShadow:"0 0 30px rgba(255,255,255,0.2)"}}>{gearScore}</div>
              <div style={{fontFamily:"Rajdhani,sans-serif",fontSize:"11px",color:"rgba(255,255,255,0.35)",letterSpacing:"0.15em",textTransform:"uppercase"}}>Gear Score</div>
            </div>
            {/* Key stats */}
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"4px",marginBottom:"10px"}}>
              {[
                {label:"SIG DMG",  val:"3.7M",  color:"#ff003c"},
                {label:"ARMOR",    val:"726k",  color:"#4488ff"},
                {label:"K/D",      val:`${(kills/Math.max(1,deaths)).toFixed(2)}`,color:"#d4af37"},
                {label:"BIO-SCORE",val:"1,847", color:"#00ff88"},
              ].map(s=>(
                <div key={s.label} style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.06)",padding:"5px 8px"}}>
                  <div style={{fontFamily:"Rajdhani,sans-serif",fontSize:"9px",color:"rgba(255,255,255,0.35)",letterSpacing:"0.12em"}}>{s.label}</div>
                  <div style={{fontFamily:"Orbitron,sans-serif",fontSize:"13px",color:s.color,fontWeight:900}}>{s.val}</div>
                </div>
              ))}
            </div>
            {/* XP */}
            <div>
              <div style={{display:"flex",justifyContent:"space-between",fontFamily:"Rajdhani,sans-serif",fontSize:"9px",color:"rgba(255,255,255,0.3)",letterSpacing:"0.1em",marginBottom:"3px"}}>
                <span>LVL {level}</span>
                <span style={{color:"#ff003c",fontFamily:"Orbitron,sans-serif"}}>{xp.toLocaleString()} / {xpMax.toLocaleString()}</span>
              </div>
              <div style={{height:"4px",background:"rgba(255,255,255,0.05)"}}>
                <div style={{height:"100%",width:`${(xp/xpMax)*100}%`,background:"linear-gradient(90deg,#ff003c,#ff6b00)",boxShadow:"0 0 8px rgba(255,0,60,0.6)"}}/>
              </div>
            </div>
          </div>

          {/* Stats */}
          <div style={{...panelBg,padding:"12px",display:"flex",flexDirection:"column",gap:"7px"}}>
            <StatBar label="ATTACK"    value={68} color="#ff003c"/>
            <StatBar label="DEFENSE"   value={42} color="#4488ff"/>
            <StatBar label="AGILITY"   value={57} color="#00ff88"/>
            <StatBar label="INTELLECT" value={71} color="#aa44ff"/>
            <StatBar label="LUCK"      value={33} color="#d4af37"/>
          </div>

          {/* CTA */}
          <Link href="/arena" style={{textDecoration:"none"}}>
            <button style={{
              width:"100%",padding:"18px",
              background:"linear-gradient(135deg,#ff003c 0%,#cc0030 100%)",
              border:"none",color:"#fff",
              fontFamily:"Orbitron,sans-serif",fontSize:"16px",fontWeight:900,letterSpacing:"0.3em",
              cursor:"pointer",textShadow:"0 0 15px rgba(255,255,255,0.5)",
              boxShadow:"0 0 60px rgba(255,0,60,0.6), inset 0 1px 0 rgba(255,255,255,0.1)",
              clipPath:"polygon(12px 0%,100% 0%,calc(100% - 12px) 100%,0% 100%)",
              display:"flex",alignItems:"center",justifyContent:"center",gap:"12px",
              transition:"all 0.15s",
            }} className="fight-btn-ready">
              <IcSword c="#fff" s={20}/> ENTER ARENA
            </button>
          </Link>
        </div>

        {/* ─── CENTER — Gear grid + tabs ──────────────────────────────── */}
        <div style={{display:"flex",flexDirection:"column",borderLeft:"1px solid rgba(255,0,60,0.07)"}}>
          {/* Tab bar */}
          <div style={{display:"flex",borderBottom:"1px solid rgba(255,0,60,0.07)",flexShrink:0}}>
            {TABS.map(t=>(
              <button key={t} onClick={()=>setActiveTab(t)} style={{
                flex:1,background:activeTab===t?"rgba(255,0,60,0.1)":"transparent",
                border:"none",borderBottom:activeTab===t?"2px solid #ff003c":"2px solid transparent",
                color:activeTab===t?"#fff":"#555",
                fontFamily:"Orbitron,sans-serif",fontSize:"10px",padding:"10px",
                cursor:"pointer",letterSpacing:"0.15em",fontWeight:900,transition:"all 0.12s",
              }}>{t}</button>
            ))}
          </div>

          <div style={{flexGrow:1,overflowY:"auto",padding:"16px"}} className="hud-scrollbar">

            {/* LOADOUT */}
            {activeTab==="LOADOUT" && (
              <div>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"10px"}}>
                  <span style={{fontFamily:"Orbitron,sans-serif",fontSize:"9px",color:"#ff003c",fontWeight:900,letterSpacing:"0.2em"}}>LOADOUT</span>
                  <span style={{fontFamily:"Rajdhani,sans-serif",fontSize:"10px",color:"rgba(255,255,255,0.25)",letterSpacing:"0.1em"}}>INVENTORY 8/12</span>
                </div>

                {/* Weapons */}
                <div style={{marginBottom:"8px"}}>
                  <div style={{fontFamily:"Rajdhani,sans-serif",fontSize:"9px",color:"rgba(255,255,255,0.25)",letterSpacing:"0.2em",marginBottom:"5px",textTransform:"uppercase"}}>WEAPONS</div>
                  <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:"5px"}}>
                    {GEAR.filter(g=>["w1","w2","w3"].includes(g.id)).map(g=>(
                      <GearSlot 
                        key={g.id} 
                        g={g} 
                        active={selectedId===g.id} 
                        onClick={()=>setSelectedId(g.id)}
                        onMouseEnter={()=>setHoveredSlot(g.slot)}
                        onMouseLeave={()=>setHoveredSlot(null)}
                      />
                    ))}
                  </div>
                </div>

                {/* Gear */}
                <div style={{marginBottom:"8px"}}>
                  <div style={{fontFamily:"Rajdhani,sans-serif",fontSize:"9px",color:"rgba(255,255,255,0.25)",letterSpacing:"0.2em",marginBottom:"5px",textTransform:"uppercase"}}>GEAR</div>
                  <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:"5px"}}>
                    {GEAR.filter(g=>!["w1","w2","w3"].includes(g.id)).map(g=>(
                      <GearSlot 
                        key={g.id} 
                        g={g} 
                        active={selectedId===g.id} 
                        onClick={()=>setSelectedId(g.id)}
                        onMouseEnter={()=>setHoveredSlot(g.slot)}
                        onMouseLeave={()=>setHoveredSlot(null)}
                      />
                    ))}
                  </div>
                </div>

                {/* Total score bar */}
                <div style={{padding:"10px 12px",background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.06)"}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"5px"}}>
                    <span style={{fontFamily:"Rajdhani,sans-serif",fontSize:"10px",color:"rgba(255,255,255,0.4)",letterSpacing:"0.12em"}}>TOTAL GEAR SCORE</span>
                    <span style={{fontFamily:"Orbitron,sans-serif",fontSize:"18px",color:"#fff",fontWeight:900}}>{gearScore}</span>
                  </div>
                  <div style={{height:"3px",background:"rgba(255,255,255,0.05)"}}>
                    <div style={{height:"100%",width:`${Math.min(100,(gearScore/300)*100)}%`,background:"linear-gradient(90deg,#ff003c,#ff8800)",boxShadow:"0 0 8px rgba(255,100,0,0.5)"}}/>
                  </div>
                </div>
              </div>
            )}

            {/* STATS */}
            {activeTab==="STATS" && (
              <div style={{display:"flex",flexDirection:"column",gap:"12px"}}>
                <div style={{...panelBg,padding:"16px"}}>
                  <div style={{fontFamily:"Orbitron,sans-serif",fontSize:"9px",color:"#ff003c",fontWeight:900,letterSpacing:"0.2em",marginBottom:"12px"}}>OPERATIVE STATS</div>
                  <div style={{display:"flex",flexDirection:"column",gap:"8px"}}>
                    <StatBar label="ATTACK"    value={68} color="#ff003c"/>
                    <StatBar label="DEFENSE"   value={42} color="#4488ff"/>
                    <StatBar label="AGILITY"   value={57} color="#00ff88"/>
                    <StatBar label="INTELLECT" value={71} color="#aa44ff"/>
                    <StatBar label="LUCK"      value={33} color="#d4af37"/>
                  </div>
                </div>
                <div style={{...panelBg,padding:"16px"}}>
                  <div style={{fontFamily:"Orbitron,sans-serif",fontSize:"9px",color:"#ff003c",fontWeight:900,letterSpacing:"0.2em",marginBottom:"12px"}}>COMBAT RECORD</div>
                  <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:"6px"}}>
                    {[{l:"KILLS",v:kills,c:"#ff003c"},{l:"DEATHS",v:deaths,c:"#888"},{l:"DUELS",v:kills+deaths,c:"#4488ff"},{l:"WIN%",v:`${Math.round(kills/(kills+deaths)*100)}%`,c:"#d4af37"}].map(s=>(
                      <div key={s.l} style={{textAlign:"center",padding:"10px 6px",background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.06)"}}>
                        <div style={{fontFamily:"Orbitron,sans-serif",fontSize:"22px",color:s.c,fontWeight:900}}>{s.v}</div>
                        <div style={{fontFamily:"Rajdhani,sans-serif",fontSize:"9px",color:"rgba(255,255,255,0.35)",letterSpacing:"0.1em",marginTop:"3px"}}>{s.l}</div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* ACHIEVEMENTS */}
            {activeTab==="ACHIEVEMENTS" && (
              <div style={{display:"flex",flexDirection:"column",gap:"6px"}}>
                {ACHIEVEMENTS.map((a,i)=>(
                  <div key={i} style={{display:"flex",alignItems:"center",gap:"12px",padding:"10px 14px",background:a.done?"rgba(0,255,136,0.04)":"rgba(255,255,255,0.02)",border:`1px solid ${a.done?"rgba(0,255,136,0.15)":"rgba(255,255,255,0.05)"}`,opacity:a.done?1:0.5}}>
                    <IcCheck c={a.done?"#00ff88":"#444"} s={14}/>
                    <div>
                      <div style={{fontFamily:"Orbitron,sans-serif",fontSize:"11px",color:a.done?"#fff":"#555",fontWeight:900,letterSpacing:"0.06em"}}>{a.name}</div>
                      <div style={{fontFamily:"Rajdhani,sans-serif",fontSize:"10px",color:"rgba(255,255,255,0.3)",marginTop:"2px"}}>{a.desc}</div>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* COMBAT LOG */}
            {activeTab==="COMBAT LOG" && (
              <div style={{display:"flex",flexDirection:"column",gap:"5px"}}>
                {COMBAT_LOG.map((l,i)=>(
                  <div key={i} style={{display:"flex",alignItems:"center",gap:"14px",padding:"10px 14px",background:l.result==="WIN"?"rgba(0,255,136,0.04)":"rgba(255,0,60,0.04)",border:`1px solid ${l.result==="WIN"?"rgba(0,255,136,0.12)":"rgba(255,0,60,0.12)"}`}}>
                    <div style={{fontFamily:"Orbitron,sans-serif",fontSize:"12px",color:l.result==="WIN"?"#00ff88":"#ff003c",fontWeight:900,minWidth:44}}>{l.result}</div>
                    <div style={{flex:1,fontFamily:"Rajdhani,sans-serif",fontSize:"12px",color:"#fff",fontWeight:700}}>vs {l.opp}</div>
                    <div style={{fontFamily:"Orbitron,sans-serif",fontSize:"10px",color:"#ff003c"}}>DMG {l.dmg}</div>
                    <div style={{fontFamily:"Orbitron,sans-serif",fontSize:"10px",color:"#555"}}>TAKEN {l.taken}</div>
                    <div style={{fontFamily:"Rajdhani,sans-serif",fontSize:"10px",color:"#555",letterSpacing:"0.1em"}}>[{l.t}]</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* ─── RIGHT — Item inspection panel ──────────────────────────── */}
        <div style={{borderLeft:"1px solid rgba(255,0,60,0.07)",display:"flex",flexDirection:"column",overflowY:"auto"}} className="hud-scrollbar">
          {sel && (
            <div style={{padding:"16px",display:"flex",flexDirection:"column",gap:"12px"}}>

              {/* Item header — big */}
              <div style={{...panelBg,padding:"16px"}}>
                <div style={{display:"flex",gap:"16px",alignItems:"flex-start",marginBottom:"14px",paddingBottom:"14px",borderBottom:"1px solid rgba(255,0,60,0.08)"}}>
                  <div style={{width:64,height:64,background:"rgba(255,255,255,0.03)",border:`1px solid ${TIER_COLOR[sel.tier]}55`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0,boxShadow:`0 0 20px ${TIER_COLOR[sel.tier]}33`}}>
                    <sel.Icon c={TIER_COLOR[sel.tier]} s={36}/>
                  </div>
                  <div>
                    <div style={{fontFamily:"Rajdhani,sans-serif",fontSize:"10px",color:TIER_COLOR[sel.tier],letterSpacing:"0.2em",fontWeight:900,marginBottom:"4px"}}>{sel.tier} &nbsp;//&nbsp; {sel.slot}</div>
                    <div style={{fontFamily:"Orbitron,sans-serif",fontSize:"15px",color:"#fff",fontWeight:900,letterSpacing:"0.06em",lineHeight:1.1}}>{sel.name}</div>
                    <div style={{fontFamily:"Orbitron,sans-serif",fontSize:"28px",color:TIER_COLOR[sel.tier],fontWeight:900,marginTop:"6px",textShadow:`0 0 20px ${TIER_COLOR[sel.tier]}88`}}>
                      {sel.power} <span style={{fontSize:"11px",color:"rgba(255,255,255,0.3)"}}>POWER</span>
                    </div>
                  </div>
                </div>

                {/* Core stats grid — Division 2 style */}
                <div style={{fontFamily:"Orbitron,sans-serif",fontSize:"9px",color:"#ff003c",letterSpacing:"0.2em",fontWeight:900,marginBottom:"8px"}}>CORE STATS</div>
                <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"5px",marginBottom:"14px"}}>
                  {Object.entries(sel.stats).map(([k,v])=>(
                    <div key={k} style={{background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.07)",padding:"8px",textAlign:"center"}}>
                      <div style={{fontFamily:"Orbitron,sans-serif",fontSize:"14px",color:"#fff",fontWeight:900}}>{v}</div>
                      <div style={{fontFamily:"Rajdhani,sans-serif",fontSize:"8px",color:"rgba(255,255,255,0.35)",letterSpacing:"0.12em",marginTop:"2px"}}>{k.replace("_"," ")}</div>
                    </div>
                  ))}
                </div>

                {/* Attributes */}
                <div style={{fontFamily:"Orbitron,sans-serif",fontSize:"9px",color:"#ff003c",letterSpacing:"0.2em",fontWeight:900,marginBottom:"8px"}}>ATTRIBUTES</div>
                <div style={{display:"flex",flexDirection:"column",gap:"4px",marginBottom:"14px"}}>
                  {sel.attrs.map((a,i)=>(
                    <div key={i} style={{display:"flex",alignItems:"center",gap:"8px",padding:"6px 10px",background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.05)"}}>
                      <IcCheck c="#00ff88" s={10}/>
                      <span style={{fontFamily:"Rajdhani,sans-serif",fontSize:"12px",color:"rgba(255,255,255,0.7)",letterSpacing:"0.06em"}}>{a}</span>
                    </div>
                  ))}
                </div>

                {/* Talent — highlighted box */}
                <div style={{padding:"12px",background:`${TIER_COLOR[sel.tier]}0d`,border:`1px solid ${TIER_COLOR[sel.tier]}44`,boxShadow:`0 0 20px ${TIER_COLOR[sel.tier]}11`}}>
                  <div style={{fontFamily:"Orbitron,sans-serif",fontSize:"9px",color:TIER_COLOR[sel.tier],letterSpacing:"0.2em",fontWeight:900,marginBottom:"6px"}}>TALENT</div>
                  <div style={{fontFamily:"Rajdhani,sans-serif",fontSize:"13px",color:"rgba(255,255,255,0.7)",lineHeight:1.5,letterSpacing:"0.04em"}}>{sel.talent}</div>
                </div>
              </div>

              {/* Talents list */}
              <div style={{...panelBg,padding:"14px"}}>
                <div style={{fontFamily:"Orbitron,sans-serif",fontSize:"9px",color:"#ff003c",fontWeight:900,letterSpacing:"0.2em",marginBottom:"10px"}}>OPERATIVE TALENTS</div>
                {[
                  {name:"BATTLE HARDENED",desc:"+10% dmg vs Torso targets",active:true, Icon:IcTarget},
                  {name:"ADRENALINE SURGE",desc:"Speed boost after crit",    active:true, Icon:IcBolt  },
                  {name:"GHOST PROTOCOL",  desc:"25% dodge chance on melee", active:false,Icon:IcShield},
                ].map(t=>(
                  <div key={t.name} style={{display:"flex",alignItems:"center",gap:"8px",padding:"7px 8px",background:t.active?"rgba(255,0,60,0.06)":"rgba(255,255,255,0.02)",border:`1px solid ${t.active?"rgba(255,0,60,0.2)":"rgba(255,255,255,0.05)"}`,marginBottom:"4px"}}>
                    <t.Icon c={t.active?"#ff003c":"#444"} s={13}/>
                    <div style={{flex:1}}>
                      <div style={{fontFamily:"Orbitron,sans-serif",fontSize:"9px",color:t.active?"#fff":"#555",fontWeight:900,letterSpacing:"0.05em"}}>{t.name}</div>
                      <div style={{fontFamily:"Rajdhani,sans-serif",fontSize:"9px",color:"rgba(255,255,255,0.25)",marginTop:"1px"}}>{t.desc}</div>
                    </div>
                    {t.active&&<IcCheck c="#00ff88" s={10}/>}
                  </div>
                ))}
              </div>

              {/* $THREAT balance */}
              <div style={{...panelBg,padding:"14px",borderColor:"#d4af3744"}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <div>
                    <div style={{fontFamily:"Orbitron,sans-serif",fontSize:"9px",color:"#555",letterSpacing:"0.15em",marginBottom:"2px"}}>ESCROW BALANCE</div>
                    <div style={{fontFamily:"Orbitron,sans-serif",fontSize:"26px",color:"#d4af37",fontWeight:900,textShadow:"0 0 15px rgba(212,175,55,0.5)"}}>{threat} <span style={{fontSize:"12px",opacity:.6}}>$THREAT</span></div>
                  </div>
                  <IcStar c="#d4af37" s={26}/>
                </div>
              </div>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}
