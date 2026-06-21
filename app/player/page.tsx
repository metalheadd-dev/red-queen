"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/AuthProvider";
import { useWallet } from "@solana/wallet-adapter-react";
import Link from "next/link";

// ── SVG ICONS (Minimal HUD Style) ─────────────────────────────────────────────
const IcSword  = ({c,s=14}:{c:string;s?:number}) => <svg width={s} height={s} viewBox="0 0 16 16" fill="none"><line x1="2" y1="14" x2="12" y2="4" stroke={c} strokeWidth="1.2"/><polyline points="10,2 14,2 14,6" stroke={c} strokeWidth="1.2" fill="none"/><line x1="2" y1="10" x2="4" y2="12" stroke={c} strokeWidth="1"/></svg>;
const IcShield = ({c,s=14}:{c:string;s?:number}) => <svg width={s} height={s} viewBox="0 0 16 16" fill="none"><path d="M8 2L14 5L14 9C14 12 8 15 8 15C8 15 2 12 2 9L2 5Z" stroke={c} strokeWidth="1.2" fill="none"/></svg>;
const IcDot    = ({c,s=4 }:{c:string;s?:number}) => <svg width={s} height={s} viewBox="0 0 6 6" fill="none"><circle cx="3" cy="3" r="1.8" fill={c}/></svg>;
const IcStar   = ({c,s=8}:{c:string;s?:number}) => <svg width={s} height={s} viewBox="0 0 16 16" fill="none"><polygon points="8,1 10,6 15,6 11,10 13,15 8,12 3,15 5,10 1,6 6,6" fill={c}/></svg>;
const IcCheck  = ({c,s=10}:{c:string;s?:number}) => <svg width={s} height={s} viewBox="0 0 16 16" fill="none"><polyline points="2,8 6,12 14,4" stroke={c} strokeWidth="1.8" fill="none"/></svg>;
const IcGun    = ({c,s=20}:{c:string;s?:number}) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><rect x="2" y="9" width="13" height="6" stroke={c} strokeWidth="1.2" fill="none"/><rect x="15" y="8" width="7" height="4" stroke={c} strokeWidth="1" fill="none"/><line x1="5" y1="15" x2="5" y2="20" stroke={c} strokeWidth="1.2"/><line x1="4" y1="9" x2="4" y2="6" stroke={c} strokeWidth="1"/><line x1="7" y1="9" x2="7" y2="6" stroke={c} strokeWidth="1"/></svg>;
const IcHelmet = ({c,s=20}:{c:string;s?:number}) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M4 15C4 9 7 3 12 3C17 3 20 9 20 15" stroke={c} strokeWidth="1.2" fill="none"/><line x1="3" y1="17" x2="21" y2="17" stroke={c} strokeWidth="1.2"/><line x1="6" y1="20" x2="18" y2="20" stroke={c} strokeWidth="1"/></svg>;
const IcChest  = ({c,s=20}:{c:string;s?:number}) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><rect x="3" y="4" width="18" height="15" stroke={c} strokeWidth="1.2" fill="none"/><line x1="3" y1="10" x2="21" y2="10" stroke={c} strokeWidth="0.8"/><circle cx="12" cy="7" r="1.2" fill={c}/></svg>;
const IcGlove  = ({c,s=20}:{c:string;s?:number}) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M4 14V8C4 6 6 5 7 6V3C7 2 10 2 10 3V2C10 1 13 1 13 2V3C13 1 16 1 16 3V8" stroke={c} strokeWidth="1" fill="none"/><path d="M4 14C4 17 6 20 12 20C18 20 20 17 20 14V8" stroke={c} strokeWidth="1.2" fill="none"/></svg>;
const IcBoots  = ({c,s=20}:{c:string;s?:number}) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M6 2L6 14L3 18L3 21L15 21L15 18L12 14" stroke={c} strokeWidth="1.2" fill="none"/><line x1="6" y1="14" x2="12" y2="14" stroke={c} strokeWidth="1.2"/><path d="M12 2L12 14" stroke={c} strokeWidth="1.2"/></svg>;
const IcKnife  = ({c,s=20}:{c:string;s?:number}) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><line x1="4" y1="20" x2="17" y2="7" stroke={c} strokeWidth="1.5"/><path d="M17 7L20 4L20 7L17 10Z" stroke={c} strokeWidth="1" fill="none"/><line x1="4" y1="20" x2="7" y2="20" stroke={c} strokeWidth="1.5"/></svg>;
const IcPack   = ({c,s=20}:{c:string;s?:number}) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><rect x="5" y="4" width="14" height="17" rx="2" stroke={c} strokeWidth="1.2" fill="none"/><line x1="9" y1="4" x2="9" y2="2" stroke={c} strokeWidth="1"/><line x1="15" y1="4" x2="15" y2="2" stroke={c} strokeWidth="1"/><line x1="9" y1="2" x2="15" y2="2" stroke={c} strokeWidth="1"/><line x1="5" y1="11" x2="19" y2="11" stroke={c} strokeWidth="0.8"/></svg>;
const IcBolt   = ({c,s=11}:{c:string;s?:number}) => <svg width={s} height={s} viewBox="0 0 16 16" fill="none"><polyline points="10,2 5,9 9,9 6,14" stroke={c} strokeWidth="1.2" fill="none"/></svg>;
const IcTarget = ({c,s=11}:{c:string;s?:number}) => <svg width={s} height={s} viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6" stroke={c} strokeWidth="0.8" fill="none"/><circle cx="8" cy="8" r="3" stroke={c} strokeWidth="0.8" fill="none"/><circle cx="8" cy="8" r="1" fill={c}/></svg>;

// ── TIER COLORS ───────────────────────────────────────────────────────────────
const TIER_COLOR: Record<string,string> = {
  COMMON:"#777777", UNCOMMON:"#00aa44", RARE:"#2288ff", EPIC:"#aa44ff", NAMED:"#d4af37",
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

const TABS = ["STATS","ACHIEVEMENTS","COMBAT LOG"] as const;
type Tab = typeof TABS[number];

const COMBAT_LOG = [
  {result:"WIN",  opp:"SHADOW_RUNNER",  dmg:47, taken:12, t:"02:14"},
  {result:"WIN",  opp:"MARAUDER_K",     dmg:63, taken:34, t:"01:58"},
  {result:"LOSS", opp:"GATEKEEPER_X",   dmg:28, taken:81, t:"01:22"},
  {result:"WIN",  opp:"PHANTOM_UNIT",   dmg:55, taken:20, t:"00:47"},
];

const ACHIEVEMENTS = [
  {name:"FIRST BLOOD",   done:true,  desc:"Win first PvP duel"},
  {name:"BUNKER LORD",   done:true,  desc:"Stake 500+ $THREAT"},
  {name:"SURVIVOR",      done:true,  desc:"Survive 24h without dying"},
  {name:"GHOST RUNNER",  done:false, desc:"3 scavenge runs in one day"},
];

// ─── STAT BAR (Minimalist HUD) ────────────────────────────────────────────────
function StatBar({label,value,color}:{label:string;value:number;color:string}) {
  return (
    <div style={{display:"flex",flexDirection:"column",gap:"2px",width:"100%"}}>
      <div style={{display:"flex",justifyContent:"space-between",fontFamily:"Rajdhani,sans-serif",fontSize:"9.5px",letterSpacing:"0.1em",color:"rgba(255,255,255,0.4)"}}>
        <span>{label}</span>
        <span style={{color:"#fff",fontFamily:"Orbitron,sans-serif",fontSize:"9.5px",fontWeight:700}}>{value}</span>
      </div>
      <div style={{height:"2px",background:"rgba(255,255,255,0.03)"}}>
        <div style={{height:"100%",width:`${value}%`,background:color,boxShadow:`0 0 6px ${color}88`}}/>
      </div>
    </div>
  );
}

// ─── GEAR SLOT BUTTON ──────────────────────────────────────────────────────────
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
        border:active?"1px solid #ff003c":"1px solid rgba(255,255,255,0.05)",
        background:active?"rgba(255,0,62,0.08)":"rgba(0,0,0,0.5)",
        padding:"6px 10px",cursor:"pointer",transition:"all 0.15s",
        display:"flex",flexDirection:"column",alignItems:"center",gap:"3px",
        boxShadow:active?`0 0 15px rgba(255,0,62,0.3)`:"none",
        position:"relative",backdropFilter:"blur(4px)",width:"90px"
      }}
    >
      <div style={{position:"absolute",top:2,right:2,width:3,height:3,background:tc}}/>
      <g.Icon c={active?"#ff003c":tc} s={18}/>
      <div style={{fontFamily:"Rajdhani,sans-serif",fontSize:"7.5px",color:"rgba(255,255,255,0.35)",letterSpacing:"0.05em",textTransform:"uppercase"}}>{g.slot}</div>
      <div style={{fontFamily:"Orbitron,sans-serif",fontSize:"8px",color:active?"#ffffff":tc,fontWeight:700,letterSpacing:"0.02em",textOverflow:"ellipsis",maxWidth:"76px",whiteSpace:"nowrap",overflow:"hidden"}}>{g.name.split(" ")[0]}</div>
      <div style={{fontFamily:"Orbitron,sans-serif",fontSize:"10px",color:tc,fontWeight:900}}>{g.power}</div>
    </button>
  );
}

// ── MAIN ──────────────────────────────────────────────────────────────────────
export default function PlayerPage() {
  const {authIdentifier} = useAuth();
  const {publicKey}      = useWallet();
  const wallet = authIdentifier || (publicKey?.toString() ?? null);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [activeTab,  setActiveTab]  = useState<Tab | null>(null);
  const [hoveredSlot, setHoveredSlot] = useState<string | null>(null);

  const profileName  = "RED QUEEN ADMIN";
  const faction      = "MARAUDERS";
  const factionColor = "#ff003c";
  const level        = 14;
  const gearScore    = Math.round(GEAR.reduce((a,g)=>a+g.power,0)/GEAR.length);
  const xp=7400; const xpMax=10000;
  const kills=47; const deaths=12;
  const threat=320;
  
  const sel = selectedId ? GEAR.find(g=>g.id===selectedId) : null;

  useEffect(() => {
    if (!wallet) return;
  }, [wallet]);

  return (
    <div id="game-player-root" style={{background:"#000000",height:"100vh",color:"#ffffff",fontFamily:"Rajdhani,sans-serif",position:"relative",overflow:"hidden",display:"flex",flexDirection:"column"}}>

      {/* Cinematic Hangar Backdrop */}
      <div style={{
        position:"absolute",
        inset:0,
        backgroundImage:"url(/images/player_backdrop.png)",
        backgroundSize:"cover",
        backgroundPosition:"center",
        opacity:0.35,
        mixBlendMode:"lighten",
        pointerEvents:"none",
        zIndex:0
      }}/>

      {/* Dark Ambient Vignette Overlay */}
      <div style={{
        position:"absolute",
        inset:0,
        background:"radial-gradient(circle, transparent 15%, #000000 95%), linear-gradient(to bottom, rgba(0,0,0,0.3), rgba(0,0,0,0.85))",
        pointerEvents:"none",
        zIndex:1
      }}/>

      {/* Holographic Circular Pedestal at character feet */}
      <div style={{
        position:"absolute",
        bottom:"-30px",
        left:"50%",
        transform:"translateX(-50%) perspective(800px) rotateX(75deg)",
        width:"400px",
        height:"120px",
        background:"radial-gradient(ellipse at 50% 50%, rgba(255,0,62,0.2) 0%, transparent 70%)",
        borderTop:"1.5px solid rgba(255,0,62,0.3)",
        boxShadow:"0 -8px 30px rgba(255,0,62,0.35)",
        zIndex:1,
        pointerEvents:"none"
      }}>
        <div style={{
          position:"absolute",
          inset:"8px",
          border:"1px dashed rgba(255,255,255,0.2)",
          borderRadius:"50%",
          animation:"hud-rotate-clockwise 15s linear infinite"
        }} />
      </div>

      <div className="hud-scanline" style={{zIndex:3}}/>

      {/* ─── FLOATING TOP HEADER ──────────────────────────────────────────────── */}
      <header style={{
        display:"flex",
        justifyContent:"space-between",
        alignItems:"center",
        padding:"24px 40px 12px",
        position:"relative",
        zIndex:20,
        flexShrink:0
      }}>
        <div style={{display:"flex",alignItems:"baseline",gap:"24px"}}>
          <span style={{fontFamily:"Orbitron,sans-serif",color:"#ffffff",fontWeight:900,fontSize:"14px",letterSpacing:"0.3em"}}>&gt; OPERATIVE INVENTORY DECK</span>
          <div style={{display:"flex",gap:"16px",fontSize:"10px",fontFamily:"JetBrains Mono,monospace",letterSpacing:"0.05em"}}>
            <Link href="/"       style={{color:"rgba(255,255,255,0.45)",textDecoration:"none",transition:"color 0.2s"}} onMouseEnter={e=>e.currentTarget.style.color="#ff003c"} onMouseLeave={e=>e.currentTarget.style.color="rgba(255,255,255,0.45)"}>[ DEPART_DECK ]</Link>
            <Link href="/bunker" style={{color:"rgba(255,255,255,0.45)",textDecoration:"none",transition:"color 0.2s"}} onMouseEnter={e=>e.currentTarget.style.color="#ff003c"} onMouseLeave={e=>e.currentTarget.style.color="rgba(255,255,255,0.45)"}>[ COMMAND_HQ ]</Link>
            <Link href="/arena"  style={{color:"rgba(255,255,255,0.45)",textDecoration:"none",transition:"color 0.2s"}} onMouseEnter={e=>e.currentTarget.style.color="#ff003c"} onMouseLeave={e=>e.currentTarget.style.color="rgba(255,255,255,0.45)"}>[ DEPLOY_ARENA ]</Link>
          </div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:"12px",fontSize:"10px",color:"rgba(255,255,255,0.35)",fontFamily:"JetBrains Mono,monospace",letterSpacing:"0.15em"}}>
          <span>RANK: <span style={{color:factionColor}}>{faction}</span></span>
          <IcDot c="#ff003c" s={4}/>
          <span style={{color:"#d4af37"}}>{threat} $THREAT</span>
        </div>
      </header>

      {/* ─── CHARACTER SILHOUETTE (Focal Point - Center scaled up to 75% height) ─ */}
      <div style={{
        position:"absolute",
        bottom:0,
        left:"50%",
        transform:"translateX(-50%)",
        width:"38vw",
        height:"82vh",
        backgroundImage:"url(/images/redqueen_silhouette.png)",
        backgroundSize:"contain",
        backgroundPosition:"center bottom",
        backgroundRepeat:"no-repeat",
        zIndex:2,
        pointerEvents:"none",
        filter:"brightness(0.9) drop-shadow(0 0 50px rgba(255,0,62,0.4))",
      }}/>

      {/* ─── FLOATING EQUIPMENT HUD BUTTONS (Arranged around character) ───────── */}
      <div style={{
        position:"absolute",
        inset:0,
        zIndex:10,
        pointerEvents:"none",
        display:"flex",
        justifyContent:"space-between",
        padding:"12vh 60px 40px"
      }}>
        {/* Left Side Slots (Armor/Gear) */}
        <div style={{display:"flex",flexDirection:"column",gap:"16px",pointerEvents:"auto"}}>
          <span style={{fontFamily:"Orbitron,sans-serif",fontSize:"9px",color:"rgba(255,255,255,0.3)",letterSpacing:"0.1em"}}>DEFENSIVE ARMOR</span>
          {GEAR.filter(g=>["HEAD","CHEST","BACKPACK","GLOVES"].includes(g.slot)).map(g=>(
            <GearSlot 
              key={g.id} 
              g={g} 
              active={selectedId===g.id} 
              onClick={()=>setSelectedId(selectedId===g.id?null:g.id)}
              onMouseEnter={()=>setHoveredSlot(g.slot)}
              onMouseLeave={()=>setHoveredSlot(null)}
            />
          ))}
        </div>

        {/* Right Side Slots (Weapons/Utilities) */}
        <div style={{display:"flex",flexDirection:"column",gap:"16px",pointerEvents:"auto",alignItems:"flex-end"}}>
          <span style={{fontFamily:"Orbitron,sans-serif",fontSize:"9px",color:"rgba(255,255,255,0.3)",letterSpacing:"0.1em"}}>TACTICAL LOADOUT</span>
          {GEAR.filter(g=>["PRIMARY","SECONDARY","SIDEARM","BOOTS"].includes(g.slot)).map(g=>(
            <GearSlot 
              key={g.id} 
              g={g} 
              active={selectedId===g.id} 
              onClick={()=>setSelectedId(selectedId===g.id?null:g.id)}
              onMouseEnter={()=>setHoveredSlot(g.slot)}
              onMouseLeave={()=>setHoveredSlot(null)}
            />
          ))}
        </div>
      </div>

      {/* ─── DYNAMIC SVG TACTICAL CALLOUT LINES (Glows on Hover/Select) ───────── */}
      <svg style={{
        position:"absolute",
        inset:0,
        width:"100vw",
        height:"100vh",
        zIndex:3,
        pointerEvents:"none"
      }}>
        <defs>
          <filter id="glow-lines" x="-20%" y="-20%" width="140%" height="140%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>
        {(() => {
          // Lines mapping side HUD items to physical silhouette locations (centered)
          // HEAD: 41%, 30% | CHEST: 48%, 45% | BACKPACK: 44%, 52% | GLOVES: 39%, 60%
          // PRIMARY: 55%, 52% | SECONDARY: 53%, 45% | SIDEARM: 56%, 60% | BOOTS: 48%, 80%
          const lines = [
            { id: "HEAD",      slot: "HEAD",      hudX: "150", hudY: "210", tgtX: "50%", tgtY: "33%" },
            { id: "CHEST",     slot: "CHEST",     hudX: "150", hudY: "285", tgtX: "49%", tgtY: "44%" },
            { id: "BACKPACK",  slot: "BACKPACK",  hudX: "150", hudY: "360", tgtX: "46%", tgtY: "48%" },
            { id: "GLOVES",    slot: "GLOVES",    hudX: "150", hudY: "435", tgtX: "43%", tgtY: "58%" },
            { id: "PRIMARY",   slot: "PRIMARY",   hudX: "calc(100vw - 150px)", hudY: "210", tgtX: "54%", tgtY: "52%" },
            { id: "SECONDARY", slot: "SECONDARY", hudX: "calc(100vw - 150px)", hudY: "285", tgtX: "53%", tgtY: "46%" },
            { id: "SIDEARM",   slot: "SIDEARM",   hudX: "calc(100vw - 150px)", hudY: "360", tgtX: "55%", tgtY: "58%" },
            { id: "BOOTS",     slot: "BOOTS",     hudX: "calc(100vw - 150px)", hudY: "435", tgtX: "49%", tgtY: "78%" },
          ];

          return lines.map(l => {
            const matchingGearItem = GEAR.find(g => g.slot === l.slot);
            const isActive = selectedId === matchingGearItem?.id || hoveredSlot === l.slot;
            const stroke = isActive ? "#ff003c" : "rgba(255,255,255,0.03)";
            
            return (
              <g key={l.id}>
                <line x1={l.hudX} y1={l.hudY} x2={l.tgtX} y2={l.tgtY} 
                  stroke={stroke} strokeWidth={isActive ? "1.2" : "0.5"} 
                  strokeDasharray={isActive ? "none" : "3 3"}
                  style={{ transition: "stroke 0.2s ease, stroke-width 0.2s" }}
                  filter={isActive ? "url(#glow-lines)" : undefined}
                />
                <circle cx={l.tgtX} cy={l.tgtY} r={isActive ? 3 : 1.2} fill={stroke} style={{ transition: "all 0.2s" }} />
              </g>
            );
          });
        })()}
      </svg>

      {/* ─── FLOATING TOP-CENTER HUD (General stats & Gear Score) ─────────────── */}
      <div style={{
        position:"absolute",
        top:"80px",
        left:"50%",
        transform:"translateX(-50%)",
        zIndex:15,
        display:"flex",
        alignItems:"center",
        gap:"24px",
        pointerEvents:"none"
      }}>
        {/* Gear Score (Tarkov/Division 2 Style focal number) */}
        <div style={{display:"flex",alignItems:"baseline",gap:"8px"}}>
          <span style={{fontFamily:"Orbitron,sans-serif",fontSize:"38px",fontWeight:900,color:"#ffffff",lineHeight:1,textShadow:"0 0 20px rgba(255,255,255,0.1)"}}>{gearScore}</span>
          <span style={{fontFamily:"Rajdhani,sans-serif",fontSize:"9px",color:"rgba(255,255,255,0.4)",letterSpacing:"0.15em",textTransform:"uppercase"}}>GEAR SCORE</span>
        </div>
        <div style={{width:"1px",height:"24px",background:"rgba(255,255,255,0.1)"}}/>
        <div style={{display:"flex",flexDirection:"column"}}>
          <span style={{fontFamily:"Rajdhani,sans-serif",fontSize:"9px",color:"rgba(255,255,255,0.3)",letterSpacing:"0.1em"}}>BIO_LEVEL {level}</span>
          <span style={{fontFamily:"Orbitron,sans-serif",fontSize:"10px",color:"#ffffff",fontWeight:700}}>{xp.toLocaleString()} / {xpMax.toLocaleString()} XP</span>
        </div>
      </div>

      {/* ─── FLOATING BOTTOM STATS DECK (TABS) ─────────────────────────────────── */}
      <div style={{
        position:"absolute",
        bottom:"30px",
        left:"60px",
        zIndex:20,
        display:"flex",
        flexDirection:"column",
        gap:"6px",
        width:"300px"
      }}>
        {/* Tabs Bar */}
        <div style={{display:"flex",gap:"8px",marginBottom:"4px"}}>
          {TABS.map(t=>(
            <button key={t} onClick={()=>setActiveTab(activeTab===t?null:t)} style={{
              background:activeTab===t?"rgba(255,0,62,0.1)":"rgba(0,0,0,0.5)",
              border:activeTab===t?"1px solid #ff003c":"1px solid rgba(255,255,255,0.06)",
              color:activeTab===t?"#ffffff":"rgba(255,255,255,0.4)",
              fontFamily:"Orbitron,sans-serif",fontSize:"8px",padding:"4px 8px",
              cursor:"pointer",letterSpacing:"0.1em",fontWeight:700,transition:"all 0.15s",
            }}>{t}</button>
          ))}
        </div>

        {/* Tab content floating panels (No heavy containers) */}
        {activeTab && (
          <div style={{
            background:"rgba(2,2,2,0.92)",
            border:"1px solid rgba(255,255,255,0.08)",
            padding:"12px",
            maxHeight:"200px",
            overflowY:"auto"
          }} className="hud-scrollbar">
            {activeTab==="STATS" && (
              <div style={{display:"flex",flexDirection:"column",gap:"6px"}}>
                <StatBar label="ATTACK"    value={68} color="#ff003c"/>
                <StatBar label="DEFENSE"   value={42} color="#ffffff"/>
                <StatBar label="AGILITY"   value={57} color="#ffffff"/>
                <StatBar label="INTELLECT" value={71} color="#ffffff"/>
                <StatBar label="LUCK"      value={33} color="#ffffff"/>
              </div>
            )}
            
            {activeTab==="ACHIEVEMENTS" && (
              <div style={{display:"flex",flexDirection:"column",gap:"4px"}}>
                {ACHIEVEMENTS.map((a,i)=>(
                  <div key={i} style={{display:"flex",alignItems:"center",gap:"8px",opacity:a.done?1:0.4}}>
                    <IcCheck c={a.done?"#ff003c":"#555555"} s={10}/>
                    <div>
                      <span style={{fontFamily:"Orbitron,sans-serif",fontSize:"9px",fontWeight:700}}>{a.name}</span>
                      <span style={{fontFamily:"Rajdhani,sans-serif",fontSize:"8px",color:"rgba(255,255,255,0.4)",display:"block"}}>{a.desc}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {activeTab==="COMBAT LOG" && (
              <div style={{display:"flex",flexDirection:"column",gap:"4px"}}>
                {COMBAT_LOG.map((l,i)=>(
                  <div key={i} style={{display:"flex",justifyContent:"space-between",fontSize:"9px",borderBottom:"1px solid rgba(255,255,255,0.03)",paddingBottom:"2px"}}>
                    <span style={{color:l.result==="WIN"?"#00ff88":"#ff003c",fontWeight:700}}>{l.result} vs {l.opp}</span>
                    <span style={{color:"rgba(255,255,255,0.4)"}}>{l.t}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* ─── DYNAMIC GEAR INSPECTOR SLIDE-DRAWER (Shows ONLY on Selection) ────── */}
      <div style={{
        position:"absolute",
        top:0,
        right:0,
        bottom:0,
        width:"340px",
        background:"rgba(2,2,2,0.96)",
        borderLeft:"1.5px solid rgba(255,0,62,0.2)",
        boxShadow:"-10px 0 40px rgba(0,0,0,0.9)",
        transform:`translateX(${sel ? "0" : "100%"})`,
        transition:"transform 0.3s cubic-bezier(0.16, 1, 0.3, 1)",
        zIndex:25,
        padding:"80px 24px 40px",
        display:"flex",
        flexDirection:"column",
        gap:"16px"
      }}>
        {sel && (
          <>
            {/* Close Button */}
            <button onClick={()=>setSelectedId(null)} style={{
              position:"absolute",
              top:"24px",
              right:"24px",
              background:"transparent",
              border:"none",
              color:"rgba(255,255,255,0.4)",
              fontFamily:"Orbitron,sans-serif",
              fontSize:"10px",
              cursor:"pointer",
              letterSpacing:"0.05em"
            }}>[ CLOSE_MATRIX ]</button>

            {/* Item Title & Core Info */}
            <div style={{display:"flex",gap:"16px",alignItems:"flex-start"}}>
              <div style={{
                width:52,height:52,
                background:"rgba(0,0,0,0.6)",
                border:`1.5px solid ${TIER_COLOR[sel.tier]}`,
                display:"flex",
                alignItems:"center",
                justifyContent:"center",
                flexShrink:0,
                boxShadow:`0 0 15px ${TIER_COLOR[sel.tier]}33`
              }}>
                <sel.Icon c={TIER_COLOR[sel.tier]} s={30}/>
              </div>
              <div>
                <span style={{fontFamily:"Rajdhani,sans-serif",fontSize:"9px",color:TIER_COLOR[sel.tier],letterSpacing:"0.2em",fontWeight:700,display:"block"}}>{sel.tier} // {sel.slot}</span>
                <span style={{fontFamily:"Orbitron,sans-serif",fontSize:"14px",color:"#fff",fontWeight:900,letterSpacing:"0.05em"}}>{sel.name}</span>
                <div style={{fontFamily:"Orbitron,sans-serif",fontSize:"22px",color:TIER_COLOR[sel.tier],fontWeight:900,marginTop:"4px",textShadow:`0 0 12px ${TIER_COLOR[sel.tier]}aa`}}>
                  {sel.power} <span style={{fontSize:"10px",color:"rgba(255,255,255,0.3)",letterSpacing:"0.15em"}}>RATING</span>
                </div>
              </div>
            </div>

            {/* Core Stats */}
            <div style={{marginTop:"10px"}}>
              <span style={{fontFamily:"Orbitron,sans-serif",fontSize:"9px",color:"#ff003c",letterSpacing:"0.15em",fontWeight:700,display:"block",marginBottom:"6px"}}>LOADOUT_STATS</span>
              <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:"4px"}}>
                {Object.entries(sel.stats).map(([k,v])=>(
                  <div key={k} style={{background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.05)",padding:"6px",textAlign:"center"}}>
                    <div style={{fontFamily:"Orbitron,sans-serif",fontSize:"12px",color:"#fff",fontWeight:900}}>{v}</div>
                    <div style={{fontFamily:"Rajdhani,sans-serif",fontSize:"7.5px",color:"rgba(255,255,255,0.35)",letterSpacing:"0.05em",marginTop:"2px"}}>{k.replace("_"," ")}</div>
                  </div>
                ))}
              </div>
            </div>

            {/* Attributes List */}
            <div style={{marginTop:"10px"}}>
              <span style={{fontFamily:"Orbitron,sans-serif",fontSize:"9px",color:"#ff003c",letterSpacing:"0.15em",fontWeight:700,display:"block",marginBottom:"6px"}}>SECONDARY_ATTRIBUTES</span>
              <div style={{display:"flex",flexDirection:"column",gap:"4px"}}>
                {sel.attrs.map((a,i)=>(
                  <div key={i} style={{display:"flex",alignItems:"center",gap:"8px",padding:"4px 8px",background:"rgba(255,255,255,0.02)",border:"1px solid rgba(255,255,255,0.04)"}}>
                    <IcCheck c="#00ff88" s={8}/>
                    <span style={{fontFamily:"Rajdhani,sans-serif",fontSize:"11px",color:"rgba(255,255,255,0.7)"}}>{a}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Unique Talent */}
            <div style={{
              padding:"10px",
              background:`${TIER_COLOR[sel.tier]}08`,
              border:`1.5px solid ${TIER_COLOR[sel.tier]}33`,
              boxShadow:`0 0 15px ${TIER_COLOR[sel.tier]}11`,
              marginTop:"10px"
            }}>
              <span style={{fontFamily:"Orbitron,sans-serif",fontSize:"9px",color:TIER_COLOR[sel.tier],letterSpacing:"0.15em",fontWeight:700,display:"block",marginBottom:"4px"}}>PERK_TALENT</span>
              <p style={{fontFamily:"Rajdhani,sans-serif",fontSize:"12px",color:"rgba(255,255,255,0.75)",lineHeight:1.3}}>{sel.talent}</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
