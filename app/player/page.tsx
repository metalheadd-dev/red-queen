"use client";

import { useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { useWallet } from "@solana/wallet-adapter-react";
import Link from "next/link";

// ── SVG ICONS ─────────────────────────────────────────────────────────────────
const IcSword  = ({c,s=14}:{c:string;s?:number}) => <svg width={s} height={s} viewBox="0 0 16 16" fill="none"><line x1="2" y1="14" x2="12" y2="4" stroke={c} strokeWidth="1.5"/><polyline points="10,2 14,2 14,6" stroke={c} strokeWidth="1.5" fill="none"/><line x1="2" y1="10" x2="4" y2="12" stroke={c} strokeWidth="1.2"/></svg>;
const IcShield = ({c,s=14}:{c:string;s?:number}) => <svg width={s} height={s} viewBox="0 0 16 16" fill="none"><path d="M8 2L14 5L14 9C14 12 8 15 8 15C8 15 2 12 2 9L2 5Z" stroke={c} strokeWidth="1.5" fill="none"/></svg>;
const IcStar   = ({c,s=12}:{c:string;s?:number}) => <svg width={s} height={s} viewBox="0 0 16 16" fill="none"><polygon points="8,1 10,6 15,6 11,10 13,15 8,12 3,15 5,10 1,6 6,6" fill={c}/></svg>;
const IcDot    = ({c,s=6 }:{c:string;s?:number}) => <svg width={s} height={s} viewBox="0 0 6 6" fill="none"><circle cx="3" cy="3" r="2.5" fill={c}/></svg>;
const IcCheck  = ({c,s=11}:{c:string;s?:number}) => <svg width={s} height={s} viewBox="0 0 16 16" fill="none"><polyline points="2,8 6,12 14,4" stroke={c} strokeWidth="2" fill="none"/></svg>;
const IcGun    = ({c,s=18}:{c:string;s?:number}) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><rect x="2" y="9" width="13" height="6" stroke={c} strokeWidth="1.5" fill="none"/><rect x="15" y="8" width="7" height="4" stroke={c} strokeWidth="1.2" fill="none"/><line x1="5" y1="15" x2="5" y2="20" stroke={c} strokeWidth="1.5"/><line x1="4" y1="9" x2="4" y2="6" stroke={c} strokeWidth="1.2"/><line x1="7" y1="9" x2="7" y2="6" stroke={c} strokeWidth="1.2"/></svg>;
const IcHelmet = ({c,s=18}:{c:string;s?:number}) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M4 15C4 9 7 3 12 3C17 3 20 9 20 15" stroke={c} strokeWidth="1.5" fill="none"/><line x1="3" y1="17" x2="21" y2="17" stroke={c} strokeWidth="1.5"/><line x1="6" y1="20" x2="18" y2="20" stroke={c} strokeWidth="1.2"/></svg>;
const IcChest  = ({c,s=18}:{c:string;s?:number}) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><rect x="3" y="4" width="18" height="15" stroke={c} strokeWidth="1.5" fill="none"/><line x1="3" y1="10" x2="21" y2="10" stroke={c} strokeWidth="1"/><circle cx="12" cy="7" r="1.5" fill={c}/></svg>;
const IcGlove  = ({c,s=18}:{c:string;s?:number}) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M4 14V8C4 6 6 5 7 6V3C7 2 10 2 10 3V2C10 1 13 1 13 2V3C13 1 16 1 16 3V8" stroke={c} strokeWidth="1.2" fill="none"/><path d="M4 14C4 17 6 20 12 20C18 20 20 17 20 14V8" stroke={c} strokeWidth="1.5" fill="none"/></svg>;
const IcBoots  = ({c,s=18}:{c:string;s?:number}) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><path d="M6 2L6 14L3 18L3 21L15 21L15 18L12 14" stroke={c} strokeWidth="1.5" fill="none"/><line x1="6" y1="14" x2="12" y2="14" stroke={c} strokeWidth="1.5"/><path d="M12 2L12 14" stroke={c} strokeWidth="1.5"/></svg>;
const IcKnife  = ({c,s=18}:{c:string;s?:number}) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><line x1="4" y1="20" x2="17" y2="7" stroke={c} strokeWidth="1.8"/><path d="M17 7L20 4L20 7L17 10Z" stroke={c} strokeWidth="1.2" fill="none"/><line x1="4" y1="20" x2="7" y2="20" stroke={c} strokeWidth="1.8"/></svg>;
const IcPack   = ({c,s=18}:{c:string;s?:number}) => <svg width={s} height={s} viewBox="0 0 24 24" fill="none"><rect x="5" y="4" width="14" height="17" rx="2" stroke={c} strokeWidth="1.5" fill="none"/><line x1="9" y1="4" x2="9" y2="2" stroke={c} strokeWidth="1.2"/><line x1="15" y1="4" x2="15" y2="2" stroke={c} strokeWidth="1.2"/><line x1="9" y1="2" x2="15" y2="2" stroke={c} strokeWidth="1.2"/><line x1="5" y1="11" x2="19" y2="11" stroke={c} strokeWidth="1"/></svg>;
const IcBolt   = ({c,s=12}:{c:string;s?:number}) => <svg width={s} height={s} viewBox="0 0 16 16" fill="none"><polyline points="10,2 5,9 9,9 6,14" stroke={c} strokeWidth="1.5" fill="none"/></svg>;
const IcTarget = ({c,s=12}:{c:string;s?:number}) => <svg width={s} height={s} viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6" stroke={c} strokeWidth="1" fill="none"/><circle cx="8" cy="8" r="3" stroke={c} strokeWidth="1" fill="none"/><circle cx="8" cy="8" r="1.5" fill={c}/></svg>;

// ── TIER SYSTEM ───────────────────────────────────────────────────────────────
const TIER_COLOR: Record<string, string> = {
  COMMON: "#777", UNCOMMON: "#00aa44", RARE: "#2288ff", EPIC: "#aa44ff", NAMED: "#d4af37",
};

// ── GEAR DATA ─────────────────────────────────────────────────────────────────
const GEAR = [
  { id:"w1",   slot:"PRIMARY WEAPON",   Icon:IcGun,    tier:"NAMED",    name:"COMBAT RIFLE MK-IV",   power:247, dmg:"3.7M", rpm:"98",  mag:"30",  attrs:["Damage +18%","Crit Chance +8%","Armor Damage +12%"],  talent:"Overflowing — Mag restores 50% ammo on kill" },
  { id:"w2",   slot:"SECONDARY WEAPON", Icon:IcGun,    tier:"EPIC",     name:"TACTICAL SMG VX",      power:220, dmg:"1.2M", rpm:"140", mag:"45",  attrs:["Damage +10%","Headshot +15%"],                        talent:"Ranger — Damage increases at range" },
  { id:"w3",   slot:"SIDEARM",          Icon:IcKnife,  tier:"RARE",     name:"COMBAT BLADE",         power:180, dmg:"440k", rpm:"—",   mag:"—",   attrs:["Bleed on hit","Melee +20%"],                          talent:"Predator — Bleeding spread to nearby targets" },
  { id:"hd",   slot:"HEAD",             Icon:IcHelmet, tier:"EPIC",     name:"TACTICAL HELMET v3",   power:238, def:"726k", armor:"28",           attrs:["DEF +8","Glitch Resistance","Headshot Armor +10%"],    talent:"Vigilance — +25% skill damage after damage taken" },
  { id:"ch",   slot:"CHEST",            Icon:IcChest,  tier:"NAMED",    name:"PLATED VEST ALPHA",    power:251, def:"726k", armor:"52",           attrs:["DEF +18","Max HP +20%","Armor Regen +5%"],             talent:"Intimidate — Deal 20% bonus damage while shield active" },
  { id:"gl",   slot:"GLOVES",           Icon:IcGlove,  tier:"RARE",     name:"GRIP GAUNTLETS II",    power:216, def:"726k", armor:"12",           attrs:["AGI +6","Headshot Damage +8%"],                       talent:"Glass Cannon — +30% damage, no armor" },
  { id:"bt",   slot:"BOOTS",            Icon:IcBoots,  tier:"EPIC",     name:"STALKER BOOTS MK-II",  power:233, def:"726k", armor:"18",           attrs:["AGI +10","Speed +8%","Stamina +12%"],                 talent:"Kinetic Momentum — Speed builds bonus damage" },
  { id:"pk",   slot:"BACKPACK",         Icon:IcPack,   tier:"UNCOMMON", name:"FIELD PACK STD",       power:198, def:"726k", armor:"5",            attrs:["Carry +15kg","Skill Haste +5%"],                      talent:"Wyvern Wear — +15% skill duration" },
];

const COMBAT_LOG = [
  { result:"WIN",  opp:"SHADOW_RUNNER",  dmg:47, taken:12, t:"02:14" },
  { result:"WIN",  opp:"MARAUDER_K",     dmg:63, taken:34, t:"01:58" },
  { result:"LOSS", opp:"GATEKEEPER_X",   dmg:28, taken:81, t:"01:22" },
  { result:"WIN",  opp:"PHANTOM_UNIT",   dmg:55, taken:20, t:"00:47" },
  { result:"WIN",  opp:"NET_VIPER",      dmg:71, taken:15, t:"23:31" },
];

const ACHIEVEMENTS = [
  { name:"FIRST BLOOD",   done:true,  desc:"Win first PvP duel" },
  { name:"BUNKER LORD",   done:true,  desc:"Stake 500+ $THREAT" },
  { name:"SURVIVOR",      done:true,  desc:"Survive 24h" },
  { name:"GHOST RUNNER",  done:false, desc:"3 scavenge runs in one day" },
  { name:"INFILTRATOR",   done:false, desc:"Decrypt 10 nodes" },
  { name:"SECTOR HUNTER", done:false, desc:"Claim 3 bounty targets" },
];

const TABS = ["LOADOUT","STATS","ACHIEVEMENTS","COMBAT LOG"] as const;
type Tab = typeof TABS[number];

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
function GearSlot({g,active,onClick}:{g:typeof GEAR[0];active:boolean;onClick:()=>void}) {
  const tc = TIER_COLOR[g.tier];
  return (
    <button onClick={onClick} style={{
      border:`1px solid ${active?"#ff003c":tc+"44"}`,
      background:active?"rgba(255,0,60,0.1)":"rgba(8,8,8,0.85)",
      padding:"10px 8px",cursor:"pointer",transition:"all 0.12s",
      display:"flex",flexDirection:"column",alignItems:"center",gap:"6px",
      boxShadow:active?`0 0 18px rgba(255,0,60,0.25)`:`inset 0 0 0 1px ${tc}22`,
      position:"relative",backdropFilter:"blur(8px)",textAlign:"center",
    }}>
      {/* Tier pip */}
      <div style={{position:"absolute",top:4,right:4,width:5,height:5,background:tc,borderRadius:0}}/>
      <g.Icon c={active?"#ff003c":tc} s={22}/>
      <div style={{fontFamily:"Rajdhani,sans-serif",fontSize:"9px",color:active?"#ff003c":"rgba(255,255,255,0.3)",letterSpacing:"0.1em",fontWeight:700,textTransform:"uppercase"}}>{g.slot}</div>
      <div style={{fontFamily:"Orbitron,sans-serif",fontSize:"8px",color:active?"#fff":tc,fontWeight:900,letterSpacing:"0.03em",lineHeight:1.2,whiteSpace:"nowrap",overflow:"hidden",textOverflow:"ellipsis",maxWidth:"90px"}}>{g.name}</div>
      <div style={{fontFamily:"Orbitron,sans-serif",fontSize:"11px",color:tc,fontWeight:900}}>{g.power}</div>
    </button>
  );
}

// ── MAIN ──────────────────────────────────────────────────────────────────────
export default function PlayerPage() {
  const {authIdentifier} = useAuth();
  const {publicKey} = useWallet();
  const wallet = authIdentifier || (publicKey?.toString() ?? null);

  const [selectedId, setSelectedId]   = useState("w1");
  const [activeTab, setActiveTab]     = useState<Tab>("LOADOUT");

  const profileName    = "RED QUEEN ADMIN";
  const faction        = "MARAUDERS";
  const factionColor   = "#ff003c";
  const level          = 14;
  const gearScore      = Math.round(GEAR.reduce((a,g)=>a+g.power,0)/GEAR.length);
  const xp = 7400; const xpMax = 10000;
  const kills=47; const deaths=12;
  const threat=320;
  const sel = GEAR.find(g=>g.id===selectedId)!;

  return (
    <div id="game-player-root" style={{
      background:"#030303",height:"100vh",color:"#fff",
      fontFamily:"Rajdhani,sans-serif",position:"relative",
      overflow:"hidden",display:"flex",flexDirection:"column",
    }}>
      {/* Ambient warm left glow — Division 2 feel */}
      <div style={{position:"fixed",inset:0,background:"radial-gradient(ellipse at 25% 60%, rgba(180,80,0,0.12) 0%, transparent 55%)",pointerEvents:"none",zIndex:1}}/>
      <div style={{position:"fixed",inset:0,background:"radial-gradient(ellipse at 80% 30%, rgba(255,0,60,0.07) 0%, transparent 50%)",pointerEvents:"none",zIndex:1}}/>

      {/* Scanlines */}
      <div className="hud-scanline"/>

      {/* Grid overlay */}
      <div style={{position:"fixed",inset:0,backgroundImage:"linear-gradient(rgba(255,0,60,0.003) 1px,transparent 1px),linear-gradient(90deg,rgba(255,0,60,0.003) 1px,transparent 1px)",backgroundSize:"40px 40px",pointerEvents:"none",zIndex:1}}/>

      {/* Frame */}
      <div style={{position:"fixed",top:10,left:10,right:10,bottom:10,border:"1px solid rgba(255,0,60,0.07)",pointerEvents:"none",zIndex:50}}/>

      {/* ═══ TOP NAV ═════════════════════════════════════════════════════════ */}
      <header style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"9px 20px",borderBottom:"1px solid rgba(255,0,60,0.08)",position:"relative",zIndex:30,flexShrink:0,background:"rgba(3,3,3,0.95)"}}>
        <div style={{display:"flex",gap:"2px"}}>
          {TABS.map(t=>(
            <button key={t} onClick={()=>setActiveTab(t)} style={{
              background:activeTab===t?"rgba(255,0,60,0.12)":"transparent",
              border:"none",borderBottom:activeTab===t?"2px solid #ff003c":"2px solid transparent",
              color:activeTab===t?"#fff":"#555",
              fontFamily:"Orbitron,sans-serif",fontSize:"10px",padding:"6px 16px",
              cursor:"pointer",letterSpacing:"0.15em",fontWeight:900,transition:"all 0.12s",
            }}>{t}</button>
          ))}
        </div>
        <div style={{display:"flex",alignItems:"center",gap:"18px",fontFamily:"Orbitron,sans-serif",fontSize:"10px",color:"#555",letterSpacing:"0.12em"}}>
          <span style={{display:"flex",alignItems:"center",gap:"5px"}}><IcDot c="#00ff88" s={5}/><span style={{color:"#00ff88"}}>ONLINE</span></span>
          <span>LVL {level}</span>
          <span style={{color:factionColor}}>{faction}</span>
          <span style={{color:"#d4af37"}}>{threat} $THREAT</span>
          <div style={{display:"flex",gap:"10px",marginLeft:"8px",fontSize:"10px",fontFamily:"Oxanium,sans-serif"}}>
            <Link href="/bunker" style={{color:"#555",textDecoration:"none"}}>[ BUNKER ]</Link>
            <Link href="/arena"  style={{color:"#555",textDecoration:"none"}}>[ ARENA ]</Link>
            <Link href="/"       style={{color:"#555",textDecoration:"none"}}>[ HUB ]</Link>
          </div>
        </div>
      </header>

      {/* ═══ MAIN BODY ════════════════════════════════════════════════════════ */}
      <div style={{display:"flex",flexGrow:1,minHeight:0,position:"relative",zIndex:10}}>

        {/* ── LEFT: CHARACTER MODEL PANEL ─────────────────────────────────── */}
        <div style={{width:"300px",flexShrink:0,position:"relative",borderRight:"1px solid rgba(255,0,60,0.07)",display:"flex",flexDirection:"column",justifyContent:"flex-end",overflow:"hidden",background:"rgba(0,0,0,0.3)"}}>

          {/* Atmospheric floor gradient */}
          <div style={{position:"absolute",bottom:0,left:0,right:0,height:"40%",background:"linear-gradient(to top, rgba(180,60,0,0.15) 0%, transparent 100%)",pointerEvents:"none",zIndex:2}}/>

          {/* Character silhouette — large, prominent, left-side */}
          <div style={{
            position:"absolute",bottom:0,left:"-10%",right:"-10%",
            height:"95%",
            backgroundImage:"url(/images/redqueen_silhouette.png)",
            backgroundSize:"contain",backgroundPosition:"center bottom",
            backgroundRepeat:"no-repeat",
            filter:"brightness(1.4) contrast(1.1)",
            zIndex:3,
            pointerEvents:"none",
          }}/>

          {/* Name overlay — bottom left, Division 2 style */}
          <div style={{position:"relative",zIndex:10,padding:"0 16px 16px",background:"linear-gradient(to top, rgba(3,3,3,0.96) 0%, transparent 100%)",paddingTop:"60px"}}>
            <div style={{fontFamily:"Orbitron,sans-serif",color:"#ff003c",fontWeight:900,fontSize:"16px",letterSpacing:"0.1em",lineHeight:1}}>{profileName}</div>
            <div style={{fontFamily:"Rajdhani,sans-serif",fontSize:"11px",color:"rgba(255,255,255,0.4)",letterSpacing:"0.2em",marginTop:"3px",textTransform:"uppercase"}}>
              {faction} &nbsp;/&nbsp; CLEARANCE LVL {level}
            </div>

            {/* Gear score — Division 2 big number */}
            <div style={{display:"flex",alignItems:"baseline",gap:"6px",margin:"12px 0 8px"}}>
              <div style={{fontFamily:"Orbitron,sans-serif",fontSize:"42px",fontWeight:900,color:"#ffffff",lineHeight:1,textShadow:"0 0 30px rgba(255,255,255,0.15)"}}>{gearScore}</div>
              <div style={{fontFamily:"Rajdhani,sans-serif",fontSize:"11px",color:"rgba(255,255,255,0.35)",letterSpacing:"0.15em"}}>GEAR SCORE</div>
            </div>

            {/* Key stats row — like Division 2's SHD, Damage, Armor */}
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"6px",marginBottom:"10px"}}>
              {[
                {label:"SIG DMG",  val:"3.7M",  color:"#ff003c"},
                {label:"ARMOR",    val:"726k",  color:"#4488ff"},
                {label:"K/D",      val:`${(kills/Math.max(1,deaths)).toFixed(2)}`, color:"#d4af37"},
                {label:"BIO-SCORE",val:"1,847",  color:"#00ff88"},
              ].map(s=>(
                <div key={s.label} style={{background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.06)",padding:"5px 8px"}}>
                  <div style={{fontFamily:"Rajdhani,sans-serif",fontSize:"9px",color:"rgba(255,255,255,0.35)",letterSpacing:"0.12em"}}>{s.label}</div>
                  <div style={{fontFamily:"Orbitron,sans-serif",fontSize:"13px",color:s.color,fontWeight:900}}>{s.val}</div>
                </div>
              ))}
            </div>

            {/* XP Bar */}
            <div style={{marginBottom:"6px"}}>
              <div style={{display:"flex",justifyContent:"space-between",fontFamily:"Rajdhani,sans-serif",fontSize:"9px",color:"rgba(255,255,255,0.3)",letterSpacing:"0.1em",marginBottom:"3px"}}>
                <span>XP</span>
                <span style={{color:"#ff003c",fontFamily:"Orbitron,sans-serif"}}>{xp.toLocaleString()} / {xpMax.toLocaleString()}</span>
              </div>
              <div style={{height:"4px",background:"rgba(255,255,255,0.05)"}}>
                <div style={{height:"100%",width:`${(xp/xpMax)*100}%`,background:"linear-gradient(90deg,#ff003c,#ff6b00)",boxShadow:"0 0 8px rgba(255,0,60,0.6)"}}/>
              </div>
            </div>

            {/* Status effects */}
            <div style={{display:"flex",gap:"4px",flexWrap:"wrap"}}>
              {[{name:"WELL-FED",c:"#00ff88"},{name:"RESTED",c:"#00aaff"}].map(s=>(
                <span key={s.name} style={{border:`1px solid ${s.c}44`,color:s.c,fontFamily:"Orbitron,sans-serif",fontSize:"8px",padding:"2px 5px",background:`${s.c}11`,letterSpacing:"0.08em"}}>{s.name}</span>
              ))}
            </div>
          </div>
        </div>

        {/* ── CENTER: CONTENT (tab-driven) ────────────────────────────────── */}
        <div style={{flexGrow:1,display:"flex",flexDirection:"column",minWidth:0,overflow:"hidden"}}>

          {/* LOADOUT TAB */}
          {activeTab==="LOADOUT" && (
            <div style={{display:"flex",flexGrow:1,minHeight:0}}>

              {/* Gear grid */}
              <div style={{padding:"16px",display:"flex",flexDirection:"column",gap:"0",flexShrink:0,width:"360px",borderRight:"1px solid rgba(255,0,60,0.07)"}}>
                <div style={{fontFamily:"Orbitron,sans-serif",fontSize:"9px",color:"#ff003c",fontWeight:900,letterSpacing:"0.2em",marginBottom:"10px",display:"flex",justifyContent:"space-between",alignItems:"center"}}>
                  <span>LOADOUT</span>
                  <span style={{color:"rgba(255,255,255,0.25)",fontFamily:"Rajdhani,sans-serif",fontSize:"10px",letterSpacing:"0.1em"}}>INVENTORY 8/12</span>
                </div>

                {/* Weapons row */}
                <div style={{marginBottom:"6px"}}>
                  <div style={{fontFamily:"Rajdhani,sans-serif",fontSize:"9px",color:"rgba(255,255,255,0.25)",letterSpacing:"0.2em",marginBottom:"5px",textTransform:"uppercase"}}>Weapons</div>
                  <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:"5px"}}>
                    {GEAR.filter(g=>["w1","w2","w3"].includes(g.id)).map(g=>(
                      <GearSlot key={g.id} g={g} active={selectedId===g.id} onClick={()=>setSelectedId(g.id)}/>
                    ))}
                  </div>
                </div>

                {/* Gear/Armor rows */}
                <div>
                  <div style={{fontFamily:"Rajdhani,sans-serif",fontSize:"9px",color:"rgba(255,255,255,0.25)",letterSpacing:"0.2em",marginBottom:"5px",textTransform:"uppercase"}}>Gear</div>
                  <div style={{display:"grid",gridTemplateColumns:"repeat(3,1fr)",gap:"5px"}}>
                    {GEAR.filter(g=>!["w1","w2","w3"].includes(g.id)).map(g=>(
                      <GearSlot key={g.id} g={g} active={selectedId===g.id} onClick={()=>setSelectedId(g.id)}/>
                    ))}
                  </div>
                </div>

                {/* Total gear score bar */}
                <div style={{marginTop:"12px",padding:"10px 12px",background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.06)"}}>
                  <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"6px"}}>
                    <span style={{fontFamily:"Rajdhani,sans-serif",fontSize:"10px",color:"rgba(255,255,255,0.4)",letterSpacing:"0.12em"}}>TOTAL GEAR SCORE</span>
                    <span style={{fontFamily:"Orbitron,sans-serif",fontSize:"16px",color:"#fff",fontWeight:900}}>{gearScore}</span>
                  </div>
                  <div style={{height:"3px",background:"rgba(255,255,255,0.05)"}}>
                    <div style={{height:"100%",width:`${Math.min(100,(gearScore/300)*100)}%`,background:"linear-gradient(90deg,#ff003c,#ff8800)",boxShadow:"0 0 8px rgba(255,100,0,0.5)"}}/>
                  </div>
                </div>
              </div>

              {/* Item detail — right of grid — Division 2 inspection panel */}
              {sel && (
                <div style={{flexGrow:1,padding:"16px",display:"flex",flexDirection:"column",gap:"12px",overflow:"auto",background:"rgba(4,4,4,0.6)"}} className="hud-scrollbar">
                  {/* Item header */}
                  <div style={{display:"flex",gap:"14px",alignItems:"flex-start",paddingBottom:"12px",borderBottom:"1px solid rgba(255,0,60,0.08)"}}>
                    <div style={{width:60,height:60,background:"rgba(255,255,255,0.03)",border:`1px solid ${TIER_COLOR[sel.tier]}44`,display:"flex",alignItems:"center",justifyContent:"center",flexShrink:0}}>
                      <sel.Icon c={TIER_COLOR[sel.tier]} s={32}/>
                    </div>
                    <div>
                      <div style={{fontFamily:"Rajdhani,sans-serif",fontSize:"10px",color:TIER_COLOR[sel.tier],letterSpacing:"0.2em",fontWeight:900,marginBottom:"3px"}}>{sel.tier} &nbsp;//&nbsp; {sel.slot}</div>
                      <div style={{fontFamily:"Orbitron,sans-serif",fontSize:"16px",color:"#fff",fontWeight:900,letterSpacing:"0.06em",lineHeight:1.1}}>{sel.name}</div>
                      <div style={{fontFamily:"Orbitron,sans-serif",fontSize:"22px",color:TIER_COLOR[sel.tier],fontWeight:900,marginTop:"4px",textShadow:`0 0 14px ${TIER_COLOR[sel.tier]}66`}}>{sel.power} <span style={{fontSize:"10px",color:"rgba(255,255,255,0.3)"}}>POWER</span></div>
                    </div>
                  </div>

                  {/* Core Stats — Division 2 style */}
                  <div>
                    <div style={{fontFamily:"Orbitron,sans-serif",fontSize:"9px",color:"#ff003c",letterSpacing:"0.2em",fontWeight:900,marginBottom:"8px"}}>CORE STATS</div>
                    <div style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",gap:"6px"}}>
                      {(sel.dmg ? [
                        {label:"TOTAL DMG", val:sel.dmg},
                        {label:"RPM",       val:sel.rpm || "—"},
                        {label:"MAG",       val:sel.mag || "—"},
                      ] : [
                        {label:"ARMOR",    val:sel.armor || "—"},
                        {label:"DEF",      val:sel.def || "—"},
                        {label:"POWER",    val:String(sel.power)},
                      ]).map(s=>(
                        <div key={s.label} style={{background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.07)",padding:"8px",textAlign:"center"}}>
                          <div style={{fontFamily:"Orbitron,sans-serif",fontSize:"15px",color:"#fff",fontWeight:900}}>{s.val}</div>
                          <div style={{fontFamily:"Rajdhani,sans-serif",fontSize:"9px",color:"rgba(255,255,255,0.35)",letterSpacing:"0.12em",marginTop:"2px"}}>{s.label}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Attributes */}
                  <div>
                    <div style={{fontFamily:"Orbitron,sans-serif",fontSize:"9px",color:"#ff003c",letterSpacing:"0.2em",fontWeight:900,marginBottom:"8px"}}>ATTRIBUTES</div>
                    <div style={{display:"flex",flexDirection:"column",gap:"5px"}}>
                      {sel.attrs.map((a,i)=>(
                        <div key={i} style={{display:"flex",alignItems:"center",gap:"8px",padding:"6px 10px",background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.05)"}}>
                          <IcCheck c="#00ff88" s={10}/>
                          <span style={{fontFamily:"Rajdhani,sans-serif",fontSize:"12px",color:"rgba(255,255,255,0.7)",letterSpacing:"0.06em"}}>{a}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Talent */}
                  <div style={{padding:"12px",background:`${TIER_COLOR[sel.tier]}0d`,border:`1px solid ${TIER_COLOR[sel.tier]}33`}}>
                    <div style={{fontFamily:"Orbitron,sans-serif",fontSize:"9px",color:TIER_COLOR[sel.tier],letterSpacing:"0.2em",fontWeight:900,marginBottom:"6px"}}>TALENT</div>
                    <div style={{fontFamily:"Rajdhani,sans-serif",fontSize:"12px",color:"rgba(255,255,255,0.65)",lineHeight:1.5,letterSpacing:"0.04em"}}>{sel.talent}</div>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* STATS TAB */}
          {activeTab==="STATS" && (
            <div style={{padding:"20px",display:"flex",flexDirection:"column",gap:"16px",overflow:"auto"}} className="hud-scrollbar">
              <div className="hud-panel" style={{padding:"16px",maxWidth:480}}>
                <div style={{fontFamily:"Orbitron,sans-serif",fontSize:"9px",color:"#ff003c",fontWeight:900,letterSpacing:"0.2em",marginBottom:"14px"}}>OPERATIVE STATS</div>
                <div style={{display:"flex",flexDirection:"column",gap:"10px"}}>
                  <StatBar label="ATTACK"    value={68} color="#ff003c"/>
                  <StatBar label="DEFENSE"   value={42} color="#4488ff"/>
                  <StatBar label="AGILITY"   value={57} color="#00ff88"/>
                  <StatBar label="INTELLECT" value={71} color="#aa44ff"/>
                  <StatBar label="LUCK"      value={33} color="#d4af37"/>
                </div>
              </div>
              <div className="hud-panel" style={{padding:"16px",maxWidth:480}}>
                <div style={{fontFamily:"Orbitron,sans-serif",fontSize:"9px",color:"#ff003c",fontWeight:900,letterSpacing:"0.2em",marginBottom:"14px"}}>COMBAT RECORD</div>
                <div style={{display:"grid",gridTemplateColumns:"repeat(4,1fr)",gap:"8px"}}>
                  {[{l:"KILLS",v:kills,c:"#ff003c"},{l:"DEATHS",v:deaths,c:"#888"},{l:"DUELS",v:kills+deaths,c:"#4488ff"},{l:"WIN RATE",v:`${Math.round(kills/(kills+deaths)*100)}%`,c:"#d4af37"}].map(s=>(
                    <div key={s.l} style={{textAlign:"center",padding:"10px",background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.06)"}}>
                      <div style={{fontFamily:"Orbitron,sans-serif",fontSize:"20px",color:s.c,fontWeight:900}}>{s.v}</div>
                      <div style={{fontFamily:"Rajdhani,sans-serif",fontSize:"9px",color:"rgba(255,255,255,0.35)",letterSpacing:"0.1em",marginTop:"3px"}}>{s.l}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* ACHIEVEMENTS TAB */}
          {activeTab==="ACHIEVEMENTS" && (
            <div style={{padding:"20px",display:"flex",flexDirection:"column",gap:"8px",overflow:"auto"}} className="hud-scrollbar">
              <div style={{fontFamily:"Orbitron,sans-serif",fontSize:"9px",color:"#ff003c",fontWeight:900,letterSpacing:"0.2em",marginBottom:"4px"}}>ACHIEVEMENTS</div>
              {ACHIEVEMENTS.map((a,i)=>(
                <div key={i} style={{display:"flex",alignItems:"center",gap:"12px",padding:"10px 14px",background:a.done?"rgba(0,255,136,0.04)":"rgba(255,255,255,0.02)",border:`1px solid ${a.done?"rgba(0,255,136,0.15)":"rgba(255,255,255,0.05)"}`,opacity:a.done?1:0.5,maxWidth:600}}>
                  <IcCheck c={a.done?"#00ff88":"#444"} s={14}/>
                  <div>
                    <div style={{fontFamily:"Orbitron,sans-serif",fontSize:"11px",color:a.done?"#fff":"#555",fontWeight:900,letterSpacing:"0.06em"}}>{a.name}</div>
                    <div style={{fontFamily:"Rajdhani,sans-serif",fontSize:"10px",color:"rgba(255,255,255,0.3)",marginTop:"2px"}}>{a.desc}</div>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* COMBAT LOG TAB */}
          {activeTab==="COMBAT LOG" && (
            <div style={{padding:"20px",display:"flex",flexDirection:"column",gap:"6px",overflow:"auto"}} className="hud-scrollbar">
              <div style={{fontFamily:"Orbitron,sans-serif",fontSize:"9px",color:"#ff003c",fontWeight:900,letterSpacing:"0.2em",marginBottom:"4px"}}>RECENT MATCHES</div>
              {COMBAT_LOG.map((l,i)=>(
                <div key={i} style={{display:"flex",alignItems:"center",gap:"14px",padding:"10px 14px",background:l.result==="WIN"?"rgba(0,255,136,0.04)":"rgba(255,0,60,0.04)",border:`1px solid ${l.result==="WIN"?"rgba(0,255,136,0.12)":"rgba(255,0,60,0.12)"}`,maxWidth:600}}>
                  <div style={{fontFamily:"Orbitron,sans-serif",fontSize:"12px",color:l.result==="WIN"?"#00ff88":"#ff003c",fontWeight:900,minWidth:44}}>{l.result}</div>
                  <div style={{flex:1,fontFamily:"Rajdhani,sans-serif",fontSize:"12px",color:"#fff",fontWeight:700,letterSpacing:"0.05em"}}>vs {l.opp}</div>
                  <div style={{fontFamily:"Orbitron,sans-serif",fontSize:"10px",color:"#ff003c"}}>DMG {l.dmg}</div>
                  <div style={{fontFamily:"Orbitron,sans-serif",fontSize:"10px",color:"#555"}}>TAKEN {l.taken}</div>
                  <div style={{fontFamily:"Rajdhani,sans-serif",fontSize:"10px",color:"#555",letterSpacing:"0.1em"}}>[{l.t}]</div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ═══ BOTTOM STATUS BAR ════════════════════════════════════════════════ */}
      <footer style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"8px 20px",borderTop:"1px solid rgba(255,0,60,0.07)",background:"rgba(3,3,3,0.95)",flexShrink:0,position:"relative",zIndex:20}}>
        <div style={{display:"flex",gap:"20px",fontFamily:"Rajdhani,sans-serif",fontSize:"10px",color:"rgba(255,255,255,0.35)",letterSpacing:"0.12em",fontWeight:700}}>
          <span>CONTAMINATED: <span style={{color:"#ff003c",fontFamily:"Orbitron,sans-serif",fontSize:"9px"}}>0/10</span></span>
          <span>RESOURCES: <span style={{color:"#d4af37",fontFamily:"Orbitron,sans-serif",fontSize:"9px"}}>STABLE</span></span>
          <span>SHIELD: <span style={{color:"#00ff88",fontFamily:"Orbitron,sans-serif",fontSize:"9px"}}>65%</span></span>
        </div>
        <div style={{display:"flex",gap:"8px"}}>
          <Link href="/arena" style={{textDecoration:"none"}}>
            <button style={{background:"linear-gradient(135deg,#ff003c,#cc0030)",border:"none",color:"#fff",fontFamily:"Orbitron,sans-serif",fontSize:"10px",padding:"8px 20px",cursor:"pointer",letterSpacing:"0.2em",fontWeight:900,clipPath:"polygon(6px 0%,100% 0%,calc(100% - 6px) 100%,0% 100%)",display:"flex",alignItems:"center",gap:"6px"}} className="fight-btn-ready">
              <IcSword c="#fff" s={12}/> ENTER ARENA
            </button>
          </Link>
          <Link href="/bunker" style={{textDecoration:"none"}}>
            <button style={{background:"rgba(255,255,255,0.04)",border:"1px solid rgba(255,255,255,0.15)",color:"#fff",fontFamily:"Orbitron,sans-serif",fontSize:"10px",padding:"8px 20px",cursor:"pointer",letterSpacing:"0.2em",fontWeight:900,clipPath:"polygon(6px 0%,100% 0%,calc(100% - 6px) 100%,0% 100%)",display:"flex",alignItems:"center",gap:"6px"}}>
              <IcShield c="#fff" s={12}/> BUNKER
            </button>
          </Link>
        </div>
        <div style={{fontFamily:"Rajdhani,sans-serif",fontSize:"10px",color:"rgba(255,255,255,0.25)",letterSpacing:"0.1em"}}>
          RED QUEEN v7.4.1 &nbsp;/&nbsp; NODE ONLINE
        </div>
      </footer>
    </div>
  );
}
