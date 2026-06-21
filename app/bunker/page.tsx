"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/components/AuthProvider";
import { useWallet } from "@solana/wallet-adapter-react";
import Link from "next/link";

// ── SVG ICONS ─────────────────────────────────────────────────────────────────
const IcSword  = ({c,s=16}:{c:string;s?:number}) => <svg width={s} height={s} viewBox="0 0 16 16" fill="none"><line x1="2" y1="14" x2="12" y2="4" stroke={c} strokeWidth="1.5"/><polyline points="10,2 14,2 14,6" stroke={c} strokeWidth="1.5" fill="none"/><line x1="2" y1="10" x2="4" y2="12" stroke={c} strokeWidth="1.2"/></svg>;
const IcShield = ({c,s=16}:{c:string;s?:number}) => <svg width={s} height={s} viewBox="0 0 16 16" fill="none"><path d="M8 2L14 5L14 9C14 12 8 15 8 15C8 15 2 12 2 9L2 5Z" stroke={c} strokeWidth="1.5" fill="none"/></svg>;
const IcDrop   = ({c,s=12}:{c:string;s?:number}) => <svg width={s} height={s} viewBox="0 0 16 16" fill="none"><path d="M8 2C8 2 3 8 3 11C3 13.8 5.2 16 8 16C10.8 16 13 13.8 13 11C13 8 8 2 8 2Z" stroke={c} strokeWidth="1.5" fill="none"/></svg>;
const IcPower  = ({c,s=12}:{c:string;s?:number}) => <svg width={s} height={s} viewBox="0 0 16 16" fill="none"><polyline points="10,2 6,8 10,8 6,14" stroke={c} strokeWidth="1.5" fill="none"/></svg>;
const IcFood   = ({c,s=12}:{c:string;s?:number}) => <svg width={s} height={s} viewBox="0 0 16 16" fill="none"><line x1="3" y1="4" x2="3" y2="14" stroke={c} strokeWidth="1.5"/><path d="M3 4C3 4 3 1 6 1L6 7C6 7 3 7 3 4Z" stroke={c} strokeWidth="1.2" fill="none"/><line x1="10" y1="7" x2="10" y2="14" stroke={c} strokeWidth="1.5"/><path d="M8 7C8 7 7 5 10 5C13 5 12 7 12 7" stroke={c} strokeWidth="1.2" fill="none"/></svg>;
const IcLock   = ({c,s=16}:{c:string;s?:number}) => <svg width={s} height={s} viewBox="0 0 16 16" fill="none"><rect x="3" y="8" width="10" height="7" stroke={c} strokeWidth="1.2" fill="none"/><path d="M5 8V6C5 4 11 4 11 6V8" stroke={c} strokeWidth="1.2" fill="none"/><circle cx="8" cy="11.5" r="1" fill={c}/></svg>;
const IcTarget = ({c,s=16}:{c:string;s?:number}) => <svg width={s} height={s} viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6" stroke={c} strokeWidth="1" fill="none"/><circle cx="8" cy="8" r="3" stroke={c} strokeWidth="1" fill="none"/><circle cx="8" cy="8" r="1.5" fill={c}/></svg>;
const IcSend   = ({c}:{c:string}) => <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><polyline points="2,8 14,8" stroke={c} strokeWidth="1.5"/><polyline points="10,4 14,8 10,12" stroke={c} strokeWidth="1.5" fill="none"/></svg>;
const IcDot    = ({c,s=6}:{c:string;s?:number}) => <svg width={s} height={s} viewBox="0 0 6 6" fill="none"><circle cx="3" cy="3" r="2.5" fill={c}/></svg>;
const IcStar   = ({c,s=10}:{c:string;s?:number}) => <svg width={s} height={s} viewBox="0 0 16 16" fill="none"><polygon points="8,1 10,6 15,6 11,10 13,15 8,12 3,15 5,10 1,6 6,6" fill={c}/></svg>;

// ── DATA ──────────────────────────────────────────────────────────────────────
const FACTIONS = [
  { id:"survivors",   name:"SURVIVORS",   color:"#aaaaaa", item:"Canteen",       passive:"Durability Break -15%",  weakness:"No spec bonuses" },
  { id:"nomads",      name:"NOMADS",      color:"#ff8800", item:"Compass",       passive:"Yield × 1.15",           weakness:"-15% Armor" },
  { id:"marauders",   name:"MARAUDERS",   color:"#ff003c", item:"Spiked Vest",   passive:"Damage × 1.10",          weakness:"Predictable ATK" },
  { id:"scientists",  name:"SCIENTISTS",  color:"#00aaff", item:"Slate",         passive:"Craft Time × 0.80",      weakness:"-10% Max HP" },
  { id:"governments", name:"GOVERNMENTS", color:"#cccccc", item:"Comms Badge",   passive:"Reduces Escape Chance",  weakness:"-10% Initiative" },
  { id:"engineers",   name:"ENGINEERS",   color:"#ff6b00", item:"Heavy Wrench",  passive:"Build Cost × 0.85",      weakness:"Crit cap 1.2×" },
  { id:"hackers",     name:"HACKERS",     color:"#00ff88", item:"Decrypt Rig",   passive:"Event Predict +48h",     weakness:"-25% Melee" },
  { id:"syndicates",  name:"SYNDICATES",  color:"#d4af37", item:"Energy Shield", passive:"Shield × 1.20",          weakness:"+15% Fees" },
];

const SEED_CHAT = [
  { time:"01:05", sender:"CYBER_NOMAD",  text:"WATER IN SECTOR 4 DOWN TO 12%.",               color: undefined as string|undefined },
  { time:"01:08", sender:"GATEKEEPER_X", text:"SYNDICATE SHIELDS STABLE. 300 THREAT STAKED.", color:"#d4af37" },
  { time:"01:12", sender:"RADIO_GHOST",  text:"BOUNTY ON MARAUDER_BLADE — AUDIT LIVE.",        color:"#ff003c" },
  { time:"01:14", sender:"NET_VIPER",    text:"NET SCAN DONE. LINES SECURE.",                  color: undefined },
];

// ── RESOURCE BAR ──────────────────────────────────────────────────────────────
function ResBar({label,value,color,Icon}:{label:string;value:number;color:string;Icon:React.FC<{c:string;s?:number}>}) {
  const c = value < 30 ? "#ff003c" : color;
  return (
    <div style={{display:"flex",flexDirection:"column",gap:"3px"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div style={{display:"flex",alignItems:"center",gap:"5px"}}>
          <Icon c={c} s={10}/>
          <span style={{fontFamily:"Rajdhani,sans-serif",fontSize:"10px",letterSpacing:"0.15em",color:"rgba(255,255,255,0.4)",fontWeight:700,textTransform:"uppercase"}}>{label}</span>
        </div>
        <span style={{fontFamily:"Orbitron,sans-serif",fontSize:"10px",color:c,fontWeight:900}}>{value.toFixed(1)}%</span>
      </div>
      <div style={{height:"3px",background:"rgba(255,255,255,0.05)"}}>
        <div style={{height:"100%",width:`${value}%`,background:c,boxShadow:`0 0 6px ${c}`,transition:"width 0.8s ease"}}/>
      </div>
    </div>
  );
}

// ── MAIN PAGE ─────────────────────────────────────────────────────────────────
export default function BunkerPage() {
  const { authIdentifier } = useAuth();
  const { publicKey } = useWallet();
  const wallet = authIdentifier || (publicKey?.toString() ?? null);

  const [profileName, setProfileName] = useState("SURVIVOR_GUEST");
  const [selectedFaction, setSelectedFaction] = useState(FACTIONS[0]);
  const [stakedThreat, setStakedThreat] = useState(150);
  const [shieldIntegrity, setShieldIntegrity] = useState(65);
  const [stakeInput, setStakeInput] = useState("");

  const [waterLevel, setWaterLevel] = useState(45.5);
  const [foodLevel,  setFoodLevel]  = useState(62.8);
  const [powerGrid,  setPowerGrid]  = useState(78.2);

  const [cliInput, setCliInput]   = useState("");
  const [cliHistory, setCliHistory] = useState(["RED QUEEN v7.4.1 // BUNKER ONLINE", "> READY. Type 'help'."]);
  const [decryptionAttempts, setDecryptionAttempts] = useState(5);
  const [isDecrypting, setIsDecrypting] = useState(false);

  const [chatMessages, setChatMessages] = useState<typeof SEED_CHAT>([]);
  const [chatInput, setChatInput] = useState("");

  const chatEndRef = useRef<HTMLDivElement>(null);
  const cliEndRef  = useRef<HTMLDivElement>(null);

  // Profile
  useEffect(() => {
    if (!wallet) return;
    fetch(`/api/profile?wallet=${wallet}`)
      .then(r => r.json())
      .then(d => { if (d?.profile) { const n = d.profile.apocalyptic_name || d.profile.apoptotic_name || `OPERATIVE_${wallet.slice(0,6)}`; setProfileName(n.toUpperCase()); }})
      .catch(() => {});
  }, [wallet]);

  // Restore localStorage
  useEffect(() => {
    const chat = typeof window !== "undefined" && localStorage.getItem("redqueen_bunker_general_chat");
    if (chat) { try { setChatMessages(JSON.parse(chat)); } catch { setChatMessages(SEED_CHAT); } }
    else { setChatMessages(SEED_CHAT); localStorage.setItem("redqueen_bunker_general_chat", JSON.stringify(SEED_CHAT)); }
    const att = typeof window !== "undefined" && localStorage.getItem("redqueen_bunker_decryption_attempts");
    if (att) setDecryptionAttempts(Number(att));
  }, []);

  // Shield calc
  useEffect(() => {
    const bonus = selectedFaction.id === "syndicates" ? 1.20 : 1.0;
    setShieldIntegrity(Math.min(99, Math.round(25 * bonus + Math.log2(stakedThreat + 1) * 8.5)));
  }, [stakedThreat, selectedFaction]);

  // Resource drift
  useEffect(() => {
    const t = setInterval(() => {
      setWaterLevel(p => Math.max(0, Math.min(100, parseFloat((p + (Math.random()-.5)*.15).toFixed(2)))));
      setFoodLevel (p => Math.max(0, Math.min(100, parseFloat((p + (Math.random()-.5)*.12).toFixed(2)))));
      setPowerGrid (p => Math.max(0, Math.min(100, parseFloat((p + (Math.random()-.5)*.20).toFixed(2)))));
    }, 3000);
    return () => clearInterval(t);
  }, []);

  useEffect(() => { chatEndRef.current?.scrollIntoView({behavior:"smooth"}); }, [chatMessages]);
  useEffect(() => { cliEndRef.current?.scrollIntoView({behavior:"smooth"}); }, [cliHistory]);

  const handleChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;
    const t = new Date().toLocaleTimeString([], {hour:"2-digit",minute:"2-digit"});
    const msg = {time:t, sender:profileName, text:chatInput.toUpperCase(), color:"#ff003c"};
    const updated = [...chatMessages, msg];
    setChatMessages(updated); setChatInput("");
    localStorage.setItem("redqueen_bunker_general_chat", JSON.stringify(updated));
    setTimeout(() => {
      const names = ["CYPHER_REBEL","MARKET_RUNNER","WASTE_STALKER"];
      const texts = ["DIRECTIVE LOCK ACQUIRED.","WATER MINIMUMS MODIFIED.","ARENA ENCOUNTERS ENFORCED."];
      const bot = {time:new Date().toLocaleTimeString([],{hour:"2-digit",minute:"2-digit"}), sender:names[Math.floor(Math.random()*3)], text:texts[Math.floor(Math.random()*3)], color:undefined as string|undefined};
      const final = [...updated, bot];
      setChatMessages(final);
      localStorage.setItem("redqueen_bunker_general_chat", JSON.stringify(final));
    }, 1200);
  };

  const runDecrypt = () => {
    if (decryptionAttempts <= 0) { setCliHistory(p => [...p, ">> ERROR: ATTEMPTS EXHAUSTED."]); return; }
    setIsDecrypting(true);
    const next = decryptionAttempts - 1;
    setDecryptionAttempts(next);
    localStorage.setItem("redqueen_bunker_decryption_attempts", String(next));
    setCliHistory(p => [...p, ">> BYPASS INITIATED...", "CONNECTING 0x4FF8..."]);
    let count = 0;
    const iv = setInterval(() => {
      const lines = [`[ SCANNING ] SECTOR_${Math.floor(Math.random()*20)}...`, `[ BYPASSING ] ${Math.floor(Math.random()*1000)}/1000`, `[ DECRYPTING ] ${(50+Math.random()*45).toFixed(2)}%`];
      setCliHistory(p => [...p, lines[count%3]]);
      count++;
      if (count >= 3) {
        clearInterval(iv);
        setIsDecrypting(false);
        setCliHistory(p => [...p, Math.random() > .15 ? ">> SUCCESS: Coords decoded (45.1092,-122.6801)." : ">> FAILED: EM signal loss."]);
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
      if (cmd === "help")    setCliHistory(p => [...p, "COMMANDS: help / clear / status / scan / decrypt"]);
      else if (cmd === "clear")   setCliHistory([]);
      else if (cmd === "status")  setCliHistory(p => [...p, `STABLE. FACTION:${selectedFaction.name}. ESCROW:${stakedThreat}T. SHIELD:${shieldIntegrity}%.`]);
      else if (cmd === "scan")    setCliHistory(p => [...p, "SWEEPING...", "  TARGET: MARAUDER_BLADE [GRID_18.2] (120T)", "  TARGET: COLLECTIVE_U04 [GRID_4.5] (250T)"]);
      else if (cmd === "decrypt") runDecrypt();
      else setCliHistory(p => [...p, `>> UNKNOWN: '${cmd}'`]);
    }, 150);
  };

  const shieldColor = shieldIntegrity > 60 ? "#00ff88" : shieldIntegrity > 30 ? "#ff8800" : "#ff003c";
  const shieldCirc  = 2 * Math.PI * 40;

  const panelStyle = { background:"rgba(0,0,0,0.5)", border:"1px solid rgba(255,0,60,0.15)", backdropFilter:"blur(6px)", padding:"14px" };
  const panelLabel = { fontFamily:"Orbitron,sans-serif", fontSize:"9px", color:"#ff003c", fontWeight:900, letterSpacing:"0.2em", textTransform:"uppercase" as const, marginBottom:"10px" };

  return (
    <div id="game-bunker-root" style={{background:"#030303",height:"100vh",color:"#fff",fontFamily:"Rajdhani,sans-serif",position:"relative",overflow:"hidden",display:"flex",flexDirection:"column"}}>

      {/* ── Distinct Bunker Backdrop room image ── */}
      <div style={{
        position:"absolute",
        inset:0,
        backgroundImage:"url(/images/bunker_backdrop.png)",
        backgroundSize:"cover",
        backgroundPosition:"center",
        opacity:0.18,
        mixBlendMode:"lighten",
        pointerEvents:"none",
        zIndex:0
      }}/>

      {/* ── Ambient glows */}
      <div style={{position:"absolute",top:0,left:0,width:"45%",height:"100%",background:"radial-gradient(ellipse at 20% 50%, rgba(255,0,60,0.09) 0%, transparent 65%)",pointerEvents:"none",zIndex:1}}/>
      <div style={{position:"absolute",top:0,right:0,width:"45%",height:"100%",background:"radial-gradient(ellipse at 80% 50%, rgba(200,220,255,0.06) 0%, transparent 65%)",pointerEvents:"none",zIndex:1}}/>

      {/* ── CRT scanlines */}
      <div className="hud-scanline"/>

      {/* ── Subtle grid */}
      <div style={{position:"absolute",inset:0,backgroundImage:"linear-gradient(rgba(255,0,60,0.005) 1px,transparent 1px),linear-gradient(90deg,rgba(255,0,60,0.005) 1px,transparent 1px)",backgroundSize:"40px 40px",pointerEvents:"none",zIndex:1}}/>

      {/* ── Frame border */}
      <div style={{position:"absolute",top:"10px",left:"10px",right:"10px",bottom:"10px",border:"1px solid rgba(255,0,60,0.07)",pointerEvents:"none",zIndex:15}}/>

      {/* ═══ HEADER ═══════════════════════════════════════════════════════════ */}
      <header style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"14px 24px 12px",borderBottom:"1px solid rgba(255,0,60,0.07)",position:"relative",zIndex:20,flexShrink:0}}>
        <div style={{display:"flex",alignItems:"center",gap:"20px"}}>
          <span style={{fontFamily:"Orbitron,sans-serif",color:"#ff003c",fontWeight:900,fontSize:"15px",letterSpacing:"0.25em"}}>&gt; BASE BUNKER &nbsp;///&nbsp; COMMAND HQ</span>
          <div style={{display:"flex",gap:"12px",fontSize:"11px",fontFamily:"Oxanium,sans-serif",fontWeight:700,letterSpacing:"0.08em"}}>
            <Link href="/"      style={{color:"#555",textDecoration:"none"}}>[ LEAVE_HUB ]</Link>
            <Link href="/arena" style={{color:"#555",textDecoration:"none"}}>[ PVP_ARENA ]</Link>
            <Link href="/player" style={{color:"#555",textDecoration:"none"}}>[ OPERATIVE ]</Link>
          </div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:"16px",fontSize:"12px",color:"#555",fontFamily:"Rajdhani,sans-serif",letterSpacing:"0.15em",fontWeight:700}}>
          <span>SEASON 1</span>
          <IcDot c="#ff003c" s={6}/>
          <span style={{color:"#fff",display:"flex",alignItems:"center",gap:"5px"}}>BUNKER COMMAND <IcStar c="#ff003c" s={10}/></span>
        </div>
      </header>

      {/* ═══ MAIN CONTENT ═════════════════════════════════════════════════════ */}
      <main style={{display:"grid",gridTemplateColumns:"300px 1fr 300px",gap:"0",flexGrow:1,minHeight:0,position:"relative",zIndex:10}}>

        {/* ─── LEFT PANEL ─────────────────────────────────────────────────── */}
        <div style={{padding:"16px 16px 16px 20px",display:"flex",flexDirection:"column",gap:"12px"}}>

          {/* Identity card */}
          <div style={panelStyle}>
            <div style={{display:"flex",alignItems:"center",gap:"10px",marginBottom:"8px"}}>
              <IcShield c="#ff003c" s={20}/>
              <div>
                <div style={{fontFamily:"Orbitron,sans-serif",color:"#ff003c",fontWeight:900,fontSize:"14px",letterSpacing:"0.06em",lineHeight:1.1}}>{profileName}</div>
                <div style={{fontFamily:"Rajdhani,sans-serif",fontSize:"10px",color:"#555",letterSpacing:"0.15em",fontWeight:700}}>FACTION: <span style={{color:selectedFaction.color}}>{selectedFaction.name}</span></div>
              </div>
            </div>
            {/* Shield ring */}
            <div style={{display:"flex",justifyContent:"center",margin:"4px 0 8px"}}>
              <svg width="96" height="96" viewBox="0 0 96 96" fill="none">
                <circle cx="48" cy="48" r="40" stroke="rgba(255,255,255,0.05)" strokeWidth="6" fill="none"/>
                <circle cx="48" cy="48" r="40" stroke={shieldColor} strokeWidth="6" fill="none"
                  strokeDasharray={`${shieldCirc*shieldIntegrity/100} ${shieldCirc}`}
                  strokeDashoffset={shieldCirc*0.25}
                  style={{filter:`drop-shadow(0 0 6px ${shieldColor})`,transition:"stroke-dasharray 0.8s ease"}}
                />
                <text x="48" y="44" textAnchor="middle" fill={shieldColor} fontSize="14" fontFamily="Orbitron" fontWeight="900">{shieldIntegrity}%</text>
                <text x="48" y="57" textAnchor="middle" fill="rgba(255,255,255,0.25)" fontSize="7" fontFamily="Rajdhani" letterSpacing="2">SHIELD</text>
              </svg>
            </div>
            <div style={{textAlign:"center",fontFamily:"Rajdhani,sans-serif",fontSize:"10px",color:"#555",letterSpacing:"0.1em",marginBottom:"10px"}}>
              ESCROW: <span style={{color:"#d4af37",fontFamily:"Orbitron,sans-serif",fontWeight:900}}>{stakedThreat} $THREAT</span>
            </div>
            {/* Staking */}
            <div style={{display:"flex",gap:"4px",marginBottom:"4px"}}>
              <input value={stakeInput} onChange={e=>setStakeInput(e.target.value)} placeholder="AMOUNT"
                style={{flex:1,background:"rgba(0,0,0,0.6)",border:"1px solid rgba(255,0,60,0.2)",color:"#fff",fontFamily:"Orbitron,sans-serif",fontSize:"9px",padding:"6px 8px",outline:"none",letterSpacing:"0.08em"}}/>
              <button onClick={()=>{const v=parseInt(stakeInput);if(!isNaN(v)&&v>0){setStakedThreat(p=>p+v);setStakeInput("");}}} className="hud-btn" style={{fontSize:"9px",padding:"6px 10px",letterSpacing:"0.1em"}}>STAKE</button>
            </div>
            <div style={{display:"flex",gap:"3px"}}>
              {[50,100,500].map(v=>(
                <button key={v} onClick={()=>setStakedThreat(p=>p+v)} className="hud-btn-secondary" style={{flex:1,fontSize:"9px",padding:"4px 0"}}>+{v}T</button>
              ))}
            </div>
          </div>

          {/* Resources */}
          <div style={panelStyle}>
            <div style={panelLabel}>BUNKER RESOURCES</div>
            <div style={{display:"flex",flexDirection:"column",gap:"8px"}}>
              <ResBar label="WATER" value={waterLevel} color="#00aaff" Icon={IcDrop}/>
              <ResBar label="FOOD"  value={foodLevel}  color="#00ff88" Icon={IcFood}/>
              <ResBar label="POWER" value={powerGrid}  color="#ff8800" Icon={IcPower}/>
            </div>
          </div>

          {/* Daily Ops */}
          <div style={panelStyle}>
            <div style={panelLabel}>DAILY OPS</div>
            {[
              {label:"SCAVENGE",  used:1, max:3, color:"#ff8800"},
              {label:"PVP DUELS", used:0, max:3, color:"#ff003c"},
              {label:"DECRYPTS",  used:5-decryptionAttempts, max:5, color:"#00aaff"},
            ].map(op=>(
              <div key={op.label} style={{marginBottom:"7px"}}>
                <div style={{display:"flex",justifyContent:"space-between",fontFamily:"Rajdhani,sans-serif",fontSize:"10px",color:"rgba(255,255,255,0.35)",letterSpacing:"0.1em",marginBottom:"3px"}}>
                  <span>{op.label}</span>
                  <span style={{color:op.color,fontFamily:"Orbitron,sans-serif",fontSize:"9px"}}>{op.max-op.used}/{op.max}</span>
                </div>
                <div style={{display:"flex",gap:"2px"}}>
                  {Array.from({length:op.max}).map((_,i)=>(
                    <div key={i} style={{flex:1,height:"5px",background:i<(op.max-op.used)?op.color:"rgba(255,255,255,0.04)",boxShadow:i<(op.max-op.used)?`0 0 4px ${op.color}66`:"none",transition:"all 0.3s"}}/>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ─── CENTER HUD ──────────────────────────────────────────────────── */}
        <div style={{display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"space-between",padding:"16px 8px",position:"relative"}}>

          {/* Status display */}
          <div style={{textAlign:"center", zIndex: 10}}>
            <div style={{fontFamily:"Rajdhani,sans-serif",fontSize:"11px",color:"rgba(255,255,255,0.35)",letterSpacing:"0.3em",fontWeight:700,marginBottom:"4px"}}>BUNKER STATUS</div>
            <div style={{fontFamily:"Orbitron,sans-serif",fontSize:"32px",fontWeight:900,color:"#ff003c",textShadow:"0 0 25px rgba(255,0,60,0.8)",lineHeight:1,letterSpacing:"0.05em"}}>ONLINE // ACTIVE</div>
          </div>

          {/* Holographic Radar / Sweeper map grid */}
          <div style={{position:"relative",width:"240px",height:"240px",display:"flex",justifyContent:"center",alignItems:"center",flexShrink:0}}>
            <svg width="240" height="240" viewBox="0 0 240 240" style={{position:"absolute",zIndex:4,overflow:"visible"}}>
              <circle cx="120" cy="120" r="110" fill="none" stroke="rgba(255,136,0,0.12)" strokeWidth="1" strokeDasharray="6 4" className="hud-spin-cw" />
              <circle cx="120" cy="120" r="90" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
              <circle cx="120" cy="120" r="70" fill="none" stroke="rgba(0,170,255,0.1)" strokeWidth="1" strokeDasharray="3 3" />
              <line x1="120" y1="120" x2="220" y2="70" stroke="rgba(255,0,60,0.45)" strokeWidth="2" className="hud-radar-scanner-sweep" style={{transformOrigin:"120px 120px"}} />
              {Array.from({length:8}).map((_,i)=>{
                const a = (i * 45 * Math.PI)/180;
                return <line key={i} x1={120 + 85 * Math.cos(a)} y1={120 + 85 * Math.sin(a)} x2={120 + 95 * Math.cos(a)} y2={120 + 95 * Math.sin(a)} stroke="rgba(255,255,255,0.15)" strokeWidth="1" />;
              })}
              <line x1="120" y1="10" x2="120" y2="230" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
              <line x1="10" y1="120" x2="230" y2="120" stroke="rgba(255,255,255,0.06)" strokeWidth="1" />
              <g className="hud-blink-fast">
                <circle cx="170" cy="80" r="4" fill="#ff003c" filter="drop-shadow(0 0 5px #ff003c)" />
                <text x="180" y="83" fill="#ff003c" fontSize="8" fontFamily="Orbitron" fontWeight="bold">TGT_ALPHA</text>
              </g>
              <g style={{animation: "hud-blink 2.2s infinite"}}>
                <circle cx="70" cy="150" r="3" fill="#ff8800" filter="drop-shadow(0 0 4px #ff8800)" />
                <text x="45" y="162" fill="#ff8800" fontSize="8" fontFamily="Orbitron">SCAV_ZONE_4</text>
              </g>
              <g style={{animation: "hud-blink 1.7s infinite"}}>
                <circle cx="140" cy="180" r="3" fill="#00aaff" filter="drop-shadow(0 0 4px #00aaff)" />
                <text x="148" y="183" fill="#00aaff" fontSize="8" fontFamily="Orbitron">SIGNAL_LOCK</text>
              </g>
            </svg>
            <div style={{
              fontFamily:"Orbitron,sans-serif",
              width:"90px",
              height:"90px",
              background:"rgba(2,2,2,0.9)",
              border:`2px solid ${selectedFaction.color}`,
              display:"flex",
              flexDirection:"column",
              justifyContent:"center",
              alignItems:"center",
              zIndex:6,
              boxShadow:`0 0 25px ${selectedFaction.color}55`,
              clipPath:"polygon(20% 0%, 80% 0%, 100% 20%, 100% 80%, 80% 100%, 20% 100%, 0% 80%, 0% 20%)",
              position:"relative",
              textAlign:"center"
            }}>
              <span style={{fontSize:"9px",color:"rgba(255,255,255,0.4)",letterSpacing:"0.1em"}}>DEEP SCAN</span>
              <span style={{fontSize:"13px",color:selectedFaction.color,fontWeight:900,textShadow:`0 0 8px ${selectedFaction.color}`}}>{selectedFaction.name.slice(0,6)}</span>
            </div>
          </div>

          {/* Location details */}
          <div style={{textAlign:"center", zIndex: 10}}>
            <div style={{fontFamily:"Rajdhani,sans-serif",fontSize:"10px",color:"rgba(255,255,255,0.3)",letterSpacing:"0.2em",marginBottom:"2px"}}>GRID COORDINATES</div>
            <div style={{fontFamily:"Oxanium,sans-serif",fontSize:"14px",color:"#ff8800",fontWeight:700,letterSpacing:"0.08em"}}>SECTOR 7 [45.1092, -122.6801]</div>
            <div style={{fontFamily:"Rajdhani,sans-serif",fontSize:"9px",color:"#555",marginTop:"4px"}}>STABILITY FACTOR: 98.4%</div>
          </div>

          {/* THREE BIG ACTION BUTTONS — EXACT ARENA FIGHT BUTTON STYLE */}
          <div style={{width:"100%",display:"flex",flexDirection:"column",gap:"8px"}}>

            {/* ENTER ARENA — primary red */}
            <Link href="/arena" style={{textDecoration:"none",width:"100%"}}>
              <button style={{
                width:"100%",padding:"20px",
                background:"linear-gradient(135deg, #ff003c 0%, #cc0030 100%)",
                border:"none",color:"#ffffff",
                fontFamily:"Orbitron,sans-serif",fontSize:"17px",fontWeight:900,letterSpacing:"0.3em",
                cursor:"pointer",textShadow:"0 0 15px rgba(255,255,255,0.5)",
                boxShadow:"0 0 60px rgba(255,0,60,0.6), inset 0 1px 0 rgba(255,255,255,0.1)",
                clipPath:"polygon(12px 0%, 100% 0%, calc(100% - 12px) 100%, 0% 100%)",
                display:"flex",alignItems:"center",justifyContent:"center",gap:"12px",
                transition:"all 0.15s",
              }} className="fight-btn-ready">
                <IcSword c="#fff" s={20}/> ENTER ARENA
              </button>
            </Link>

            {/* SCAVENGE — orange */}
            <button style={{
              width:"100%",padding:"16px",
              background:"rgba(255,136,0,0.08)",
              border:"2px solid rgba(255,136,0,0.6)",color:"#ff8800",
              fontFamily:"Orbitron,sans-serif",fontSize:"14px",fontWeight:900,letterSpacing:"0.25em",
              cursor:"pointer",
              boxShadow:"0 0 25px rgba(255,136,0,0.2)",
              clipPath:"polygon(10px 0%, 100% 0%, calc(100% - 10px) 100%, 0% 100%)",
              display:"flex",alignItems:"center",justifyContent:"center",gap:"10px",
              transition:"all 0.15s",
            }}>
              <IcTarget c="#ff8800" s={18}/> SCAVENGE RUN <span style={{fontSize:"10px",opacity:.6}}>[2/3]</span>
            </button>

            {/* DECRYPT — blue */}
            <button onClick={runDecrypt} disabled={isDecrypting||decryptionAttempts<=0} style={{
              width:"100%",padding:"14px",
              background:decryptionAttempts>0?"rgba(0,170,255,0.08)":"rgba(255,255,255,0.03)",
              border:`2px solid ${decryptionAttempts>0?"rgba(0,170,255,0.6)":"rgba(255,255,255,0.1)"}`,
              color:decryptionAttempts>0?"#00aaff":"rgba(255,255,255,0.2)",
              fontFamily:"Orbitron,sans-serif",fontSize:"13px",fontWeight:900,letterSpacing:"0.2em",
              cursor:(isDecrypting||decryptionAttempts<=0)?"not-allowed":"pointer",
              boxShadow:decryptionAttempts>0?"0 0 20px rgba(0,170,255,0.2)":"none",
              clipPath:"polygon(10px 0%, 100% 0%, calc(100% - 10px) 100%, 0% 100%)",
              display:"flex",alignItems:"center",justifyContent:"center",gap:"10px",
              transition:"all 0.15s",
            }}>
              <IcLock c={decryptionAttempts>0?"#00aaff":"rgba(255,255,255,0.2)"} s={16}/>
              {isDecrypting?"DECRYPTING...":`DECRYPT SECTOR [${decryptionAttempts}/5]`}
            </button>
          </div>
        </div>

        {/* ─── RIGHT PANEL ─────────────────────────────────────────────────── */}
        <div style={{padding:"16px 20px 16px 16px",display:"flex",flexDirection:"column",gap:"12px"}}>

          {/* Faction selector */}
          <div style={panelStyle}>
            <div style={panelLabel}>PLEDGE FACTION</div>
            <div style={{display:"grid",gridTemplateColumns:"1fr 1fr",gap:"4px",marginBottom:"8px"}}>
              {FACTIONS.map(f=>{
                const active = selectedFaction.id===f.id;
                return (
                  <button key={f.id} onClick={()=>setSelectedFaction(f)} style={{
                    border:`1px solid ${active?f.color:"rgba(255,255,255,0.07)"}`,
                    background:active?`${f.color}18`:"rgba(5,5,5,0.6)",
                    padding:"8px 8px",cursor:"pointer",transition:"all 0.12s",
                    boxShadow:active?`0 0 12px ${f.color}44`:"none",
                    textAlign:"left",
                  }}>
                    <div style={{fontFamily:"Orbitron,sans-serif",fontSize:"9px",color:active?f.color:"#777",fontWeight:900,letterSpacing:"0.05em"}}>{f.name}</div>
                    <div style={{fontFamily:"Rajdhani,sans-serif",fontSize:"9px",color:"rgba(255,255,255,0.25)",marginTop:"1px"}}>{f.item}</div>
                  </button>
                );
              })}
            </div>
            {/* Active faction detail */}
            <div style={{padding:"8px 10px",background:`${selectedFaction.color}0d`,border:`1px solid ${selectedFaction.color}33`}}>
              <div style={{fontFamily:"Rajdhani,sans-serif",fontSize:"9px",color:"rgba(255,255,255,0.35)",letterSpacing:"0.1em",marginBottom:"2px"}}>PASSIVE</div>
              <div style={{fontFamily:"Orbitron,sans-serif",fontSize:"10px",color:selectedFaction.color,fontWeight:900}}>{selectedFaction.passive}</div>
            </div>
          </div>

          {/* Bounty Targets */}
          <div style={panelStyle}>
            <div style={panelLabel}>BOUNTY TARGETS</div>
            {[
              {name:"MARAUDER_BLADE",grid:"GRID_18.2",bounty:"120T",color:"#ff003c"},
              {name:"COLLECTIVE_U04",grid:"GRID_4.5", bounty:"250T",color:"#ff8800"},
              {name:"PHANTOM_K",     grid:"GRID_9.1", bounty:"75T", color:"#aaaaaa"},
            ].map(t=>(
              <div key={t.name} style={{display:"flex",justifyContent:"space-between",padding:"7px 8px",background:"rgba(255,0,60,0.04)",border:"1px solid rgba(255,0,60,0.08)",marginBottom:"4px"}}>
                <div>
                  <div style={{fontFamily:"Orbitron,sans-serif",fontSize:"9px",color:t.color,fontWeight:900,letterSpacing:"0.05em"}}>{t.name}</div>
                  <div style={{fontFamily:"Rajdhani,sans-serif",fontSize:"9px",color:"#444",letterSpacing:"0.1em"}}>{t.grid}</div>
                </div>
                <span style={{fontFamily:"Orbitron,sans-serif",fontSize:"12px",color:"#d4af37",fontWeight:900,alignSelf:"center"}}>{t.bounty}</span>
              </div>
            ))}
          </div>

          {/* Stasis Clone Chamber */}
          <div style={panelStyle}>
            <div style={panelLabel}>CLONE STASIS CHAMBER</div>
            <div style={{display:"flex",alignItems:"center",gap:"12px",background:"rgba(0,255,136,0.03)",border:"1px solid rgba(0,255,136,0.12)",padding:"8px 10px",marginBottom:"5px"}}>
              <div style={{width:"12px",height:"32px",border:"1.5px solid #00ff88",borderRadius:"3px",position:"relative",background:"rgba(0,255,136,0.05)",boxShadow:"0 0 8px rgba(0,255,136,0.3)",flexShrink:0}}>
                <div style={{position:"absolute",bottom:"2px",left:"1px",right:"1px",height:"78%",background:"#00ff88",boxShadow:"0 0 6px #00ff88",animation:"hud-blink 3s infinite"}}/>
              </div>
              <div style={{flex:1}}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"baseline"}}>
                  <span style={{fontFamily:"Orbitron,sans-serif",fontSize:"10px",color:"#fff",fontWeight:900}}>CLONE_03</span>
                  <span style={{fontFamily:"Orbitron,sans-serif",fontSize:"9px",color:"#00ff88"}}>ONLINE</span>
                </div>
                <div style={{fontFamily:"Rajdhani,sans-serif",fontSize:"9px",color:"rgba(255,255,255,0.4)",letterSpacing:"0.05em",marginTop:"2px"}}>
                  VIABILITY: <span style={{color:"#fff"}}>98.2%</span> &nbsp;/&nbsp; LEVEL: 14
                </div>
              </div>
            </div>
            <div style={{fontFamily:"Rajdhani,sans-serif",fontSize:"8.5px",lineHeight:"1.3",color:"rgba(255,0,60,0.5)",letterSpacing:"0.05em",padding:"4px 8px",background:"rgba(255,0,60,0.05)",border:"1px solid rgba(255,0,60,0.1)"}}>
              [WARNING] PERMADEATH ACTIVE. IF CLONE_03 DIES IN ARENA, 150T ESCROW AND CHARACTER INVENTORY WILL BE PERMANENTLY DELETED.
            </div>
          </div>
        </div>
      </main>

      {/* ═══ FOOTER PANELS ════════════════════════════════════════════════════ */}
      <footer style={{display:"grid",gridTemplateColumns:"1fr 1fr 1fr",height:"185px",flexShrink:0,position:"relative",zIndex:20,borderTop:"1px solid rgba(255,0,60,0.07)"}}>

        {/* CHAT */}
        <div style={{background:"rgba(2,2,2,0.7)",backdropFilter:"blur(6px)",borderRight:"1px solid rgba(255,0,60,0.06)",padding:"10px 14px",display:"flex",flexDirection:"column"}}>
          <div style={{display:"flex",alignItems:"center",gap:"6px",marginBottom:"6px",borderBottom:"1px solid rgba(255,0,60,0.07)",paddingBottom:"5px"}}>
            <IcDot c="#ff003c" s={5}/>
            <span style={{fontFamily:"Orbitron,sans-serif",fontSize:"9px",color:"#ff003c",fontWeight:900,letterSpacing:"0.15em"}}>BUNKER CHAT</span>
          </div>
          <div className="hud-scrollbar" style={{flex:1,overflowY:"auto",display:"flex",flexDirection:"column",gap:"2px",marginBottom:"6px"}}>
            {chatMessages.map((m,i)=>(
              <div key={i} style={{fontFamily:"JetBrains Mono,monospace",fontSize:"10px",lineHeight:1.4}}>
                <span style={{color:"rgba(255,255,255,0.2)"}}>[{m.time}] </span>
                <span style={{color:m.color||"#555",fontWeight:700}}>{m.sender}: </span>
                <span style={{color:"rgba(255,255,255,0.7)"}}>{m.text}</span>
              </div>
            ))}
            <div ref={chatEndRef}/>
          </div>
          <form onSubmit={handleChat} style={{display:"flex",border:"1px solid rgba(255,0,60,0.15)",background:"#050505"}}>
            <input value={chatInput} onChange={e=>setChatInput(e.target.value)} placeholder="TYPE TRANSMISSION..." style={{flex:1,background:"transparent",border:"none",color:"#fff",fontFamily:"JetBrains Mono,monospace",fontSize:"10px",padding:"5px 8px",outline:"none",textTransform:"uppercase"}}/>
            <button type="submit" style={{background:"transparent",border:"none",color:"#ff003c",padding:"0 8px",cursor:"pointer",display:"flex",alignItems:"center"}}><IcSend c="#ff003c"/></button>
          </form>
        </div>

        {/* DECRYPT TERMINAL */}
        <div style={{background:"rgba(2,2,2,0.7)",backdropFilter:"blur(6px)",borderRight:"1px solid rgba(255,0,60,0.06)",padding:"10px 14px",display:"flex",flexDirection:"column"}}>
          <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"6px",borderBottom:"1px solid rgba(255,0,60,0.07)",paddingBottom:"5px"}}>
            <span style={{fontFamily:"Orbitron,sans-serif",fontSize:"9px",color:"#555",fontWeight:900,letterSpacing:"0.15em"}}>DECRYPTION TERMINAL</span>
            <span style={{fontFamily:"Orbitron,sans-serif",fontSize:"9px",color:decryptionAttempts>0?"#00aaff":"#ff003c",fontWeight:900}}>{decryptionAttempts}/5</span>
          </div>
          <div className="hud-scrollbar" style={{flex:1,overflowY:"auto",display:"flex",flexDirection:"column",gap:"1px",marginBottom:"4px"}}>
            {cliHistory.map((line,i)=>(
              <div key={i} style={{fontFamily:"JetBrains Mono,monospace",fontSize:"10px",lineHeight:1.4,color:line.startsWith(">>")?"#ff003c":line.startsWith("guest@")?"#00ff88":line.startsWith("[")?"#ff8800":"rgba(255,255,255,0.4)"}}>{line}</div>
            ))}
            <div ref={cliEndRef}/>
          </div>
          <div style={{display:"flex",gap:"3px",marginBottom:"4px"}}>
            {["help","status","scan","decrypt"].map(cmd=>(
              <button key={cmd} onClick={()=>{setCliHistory(p=>[...p,`guest@redqueen:~$ ${cmd}`]);setTimeout(()=>{if(cmd==="help")setCliHistory(p=>[...p,"COMMANDS: help/clear/status/scan/decrypt"]);else if(cmd==="status")setCliHistory(p=>[...p,`STABLE. ${selectedFaction.name}. ${stakedThreat}T. ${shieldIntegrity}%`]);else if(cmd==="scan")setCliHistory(p=>[...p,"SWEEPING...","  MARAUDER_BLADE (120T)","  COLLECTIVE_U04 (250T)"]);else if(cmd==="decrypt")runDecrypt();},150);}}
                style={{background:"transparent",border:"1px solid rgba(255,0,60,0.15)",color:"rgba(255,255,255,0.35)",fontFamily:"Orbitron,sans-serif",fontSize:"8px",padding:"2px 6px",cursor:"pointer",letterSpacing:"0.08em"}}>
                {cmd}
              </button>
            ))}
          </div>
          <form onSubmit={handleCli} style={{display:"flex",border:"1px solid rgba(255,0,60,0.15)",background:"#050505"}}>
            <span style={{fontFamily:"JetBrains Mono,monospace",fontSize:"10px",color:"#00ff88",padding:"5px 4px 5px 8px"}}>$</span>
            <input value={cliInput} onChange={e=>setCliInput(e.target.value)} placeholder="enter command..." disabled={isDecrypting} style={{flex:1,background:"transparent",border:"none",color:"#fff",fontFamily:"JetBrains Mono,monospace",fontSize:"10px",padding:"5px 4px",outline:"none"}}/>
            <button type="submit" style={{background:"transparent",border:"none",color:"#ff003c",padding:"0 8px",cursor:"pointer",display:"flex",alignItems:"center"}}><IcSend c="#ff003c"/></button>
          </form>
        </div>

        {/* SYSTEM LOG */}
        <div style={{background:"rgba(2,2,2,0.7)",backdropFilter:"blur(6px)",padding:"10px 14px",display:"flex",flexDirection:"column"}}>
          <div style={{fontFamily:"Orbitron,sans-serif",fontSize:"9px",color:"#555",fontWeight:900,letterSpacing:"0.15em",marginBottom:"6px",borderBottom:"1px solid rgba(255,0,60,0.07)",paddingBottom:"5px"}}>SYSTEM LOG</div>
          <div className="hud-scrollbar" style={{flex:1,overflowY:"auto",display:"flex",flexDirection:"column",gap:"2px"}}>
            {[
              {t:"01:05",text:"SHIELD INTEGRITY RECALCULATED.",         c:"#00ff88"},
              {t:"01:08",text:`FACTION PLEDGE: ${selectedFaction.name}`,c:selectedFaction.color},
              {t:"01:12",text:`ESCROW LOCKED: ${stakedThreat} $THREAT`, c:"#d4af37"},
              {t:"01:14",text:"ARENA MATCH QUEUED.",                    c:"#ff003c"},
              {t:"01:18",text:`WATER: ${waterLevel.toFixed(1)}%`,       c:waterLevel<30?"#ff003c":"#00aaff"},
              {t:"01:21",text:"NODE v7.4.1 OPERATIONAL.",               c:"rgba(255,255,255,0.3)"},
            ].map((l,i)=>(
              <div key={i} style={{fontFamily:"JetBrains Mono,monospace",fontSize:"10px",lineHeight:1.4}}>
                <span style={{color:"rgba(255,255,255,0.2)"}}>[{l.t}] </span>
                <span style={{color:l.c}}>{l.text}</span>
              </div>
            ))}
          </div>
        </div>
      </footer>
    </div>
  );
}
