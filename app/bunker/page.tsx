"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/components/AuthProvider";
import { useWallet } from "@solana/wallet-adapter-react";
import Link from "next/link";

// ── SVG ICONS (Minimal HUD Style) ─────────────────────────────────────────────
const IcSword  = ({c,s=14}:{c:string;s?:number}) => <svg width={s} height={s} viewBox="0 0 16 16" fill="none"><line x1="2" y1="14" x2="12" y2="4" stroke={c} strokeWidth="1.2"/><polyline points="10,2 14,2 14,6" stroke={c} strokeWidth="1.2" fill="none"/><line x1="2" y1="10" x2="4" y2="12" stroke={c} strokeWidth="1"/></svg>;
const IcShield = ({c,s=14}:{c:string;s?:number}) => <svg width={s} height={s} viewBox="0 0 16 16" fill="none"><path d="M8 2L14 5L14 9C14 12 8 15 8 15C8 15 2 12 2 9L2 5Z" stroke={c} strokeWidth="1.2" fill="none"/></svg>;
const IcDrop   = ({c,s=12}:{c:string;s?:number}) => <svg width={s} height={s} viewBox="0 0 16 16" fill="none"><path d="M8 2C8 2 3 8 3 11C3 13.8 5.2 16 8 16C10.8 16 13 13.8 13 11C13 8 8 2 8 2Z" stroke={c} strokeWidth="1.2" fill="none"/></svg>;
const IcPower  = ({c,s=12}:{c:string;s?:number}) => <svg width={s} height={s} viewBox="0 0 16 16" fill="none"><polyline points="10,2 6,8 10,8 6,14" stroke={c} strokeWidth="1.2" fill="none"/></svg>;
const IcFood   = ({c,s=12}:{c:string;s?:number}) => <svg width={s} height={s} viewBox="0 0 16 16" fill="none"><line x1="3" y1="4" x2="3" y2="14" stroke={c} strokeWidth="1.2"/><path d="M3 4C3 4 3 1 6 1L6 7C6 7 3 7 3 4Z" stroke={c} strokeWidth="1" fill="none"/><line x1="10" y1="7" x2="10" y2="14" stroke={c} strokeWidth="1.2"/></svg>;
const IcLock   = ({c,s=14}:{c:string;s?:number}) => <svg width={s} height={s} viewBox="0 0 16 16" fill="none"><rect x="3" y="8" width="10" height="7" stroke={c} strokeWidth="1" fill="none"/><path d="M5 8V6C5 4 11 4 11 6V8" stroke={c} strokeWidth="1" fill="none"/><circle cx="8" cy="11.5" r="0.8" fill={c}/></svg>;
const IcTarget = ({c,s=14}:{c:string;s?:number}) => <svg width={s} height={s} viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6" stroke={c} strokeWidth="0.8" fill="none"/><circle cx="8" cy="8" r="3" stroke={c} strokeWidth="0.8" fill="none"/><circle cx="8" cy="8" r="1" fill={c}/></svg>;
const IcSend   = ({c}:{c:string}) => <svg width="12" height="12" viewBox="0 0 16 16" fill="none"><polyline points="2,8 14,8" stroke={c} strokeWidth="1.2"/><polyline points="10,4 14,8 10,12" stroke={c} strokeWidth="1.2" fill="none"/></svg>;
const IcDot    = ({c,s=4}:{c:string;s?:number}) => <svg width={s} height={s} viewBox="0 0 6 6" fill="none"><circle cx="3" cy="3" r="1.8" fill={c}/></svg>;
const IcStar   = ({c,s=8}:{c:string;s?:number}) => <svg width={s} height={s} viewBox="0 0 16 16" fill="none"><polygon points="8,1 10,6 15,6 11,10 13,15 8,12 3,15 5,10 1,6 6,6" fill={c}/></svg>;

// ── DATA ──────────────────────────────────────────────────────────────────────
const FACTIONS = [
  { id:"survivors",   name:"SURVIVORS",   color:"#ffffff", item:"Canteen",       passive:"Durability Break -15%",  weakness:"No spec bonuses" },
  { id:"nomads",      name:"NOMADS",      color:"#8b5a2b", item:"Compass",       passive:"Yield × 1.15",           weakness:"-15% Armor" },
  { id:"marauders",   name:"MARAUDERS",   color:"#ff003c", item:"Spiked Vest",   passive:"Damage × 1.10",          weakness:"Predictable ATK" },
  { id:"scientists",  name:"SCIENTISTS",  color:"#00aaff", item:"Slate",         passive:"Craft Time × 0.80",      weakness:"-10% Max HP" },
  { id:"governments", name:"GOVERNMENTS", color:"#9f9f9f", item:"Comms Badge",   passive:"Reduces Escape Chance",  weakness:"-10% Initiative" },
  { id:"engineers",   name:"ENGINEERS",   color:"#ff6b00", item:"Heavy Wrench",  passive:"Build Cost × 0.85",      weakness:"Crit cap 1.2x" },
  { id:"hackers",     name:"HACKERS",     color:"#00ff88", item:"Decrypt Rig",   passive:"Event Predict +48h",     weakness:"-25% Melee" },
  { id:"syndicates",  name:"SYNDICATES",  color:"#d4af37", item:"Energy Shield", passive:"Shield × 1.20",          weakness:"+15% Fees" },
];

const SEED_CHAT = [
  { time:"01:05", sender:"CYBER_NOMAD",  text:"WATER IN SECTOR 4 DOWN TO 12%.",               color: undefined as string|undefined },
  { time:"01:08", sender:"GATEKEEPER_X", text:"SYNDICATE SHIELDS STABLE. 300 THREAT STAKED.", color:"#d4af37" },
  { time:"01:12", sender:"RADIO_GHOST",  text:"BOUNTY ON MARAUDER_BLADE — AUDIT LIVE.",        color:"#ff003c" },
  { time:"01:14", sender:"NET_VIPER",    text:"NET SCAN DONE. LINES SECURE.",                  color: undefined },
];

// ── RESOURCE BAR (minimal floating) ───────────────────────────────────────────
function ResBar({label,value,color,Icon}:{label:string;value:number;color:string;Icon:React.FC<{c:string;s?:number}>}) {
  const c = value < 30 ? "#ff003c" : "#ffffff";
  return (
    <div style={{display:"flex",flexDirection:"column",gap:"2px",width:"130px"}}>
      <div style={{display:"flex",justifyContent:"space-between",alignItems:"center"}}>
        <div style={{display:"flex",alignItems:"center",gap:"4px"}}>
          <Icon c={value < 30 ? "#ff003c" : color} s={9}/>
          <span style={{fontFamily:"Rajdhani,sans-serif",fontSize:"9px",letterSpacing:"0.1em",color:"rgba(255,255,255,0.4)"}}>{label}</span>
        </div>
        <span style={{fontFamily:"Orbitron,sans-serif",fontSize:"9px",color:c,fontWeight:700}}>{value.toFixed(1)}%</span>
      </div>
      <div style={{height:"2px",background:"rgba(255,255,255,0.04)",position:"relative"}}>
        <div style={{
          height:"100%",
          width:`${value}%`,
          background:value < 30 ? "#ff003c" : color,
          boxShadow:value < 30 ? "0 0 8px #ff003c" : `0 0 6px ${color}aa`,
          transition:"all 0.3s ease"
        }} />
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
  const [cliHistory, setCliHistory] = useState(["RED QUEEN v7.4.1 // BUNKER COMMAND ONLINE", "> READY. Type 'help'."]);
  const [decryptionAttempts, setDecryptionAttempts] = useState(5);
  const [isDecrypting, setIsDecrypting] = useState(false);

  const [chatMessages, setChatMessages] = useState<typeof SEED_CHAT>([]);
  const [chatInput, setChatInput] = useState("");

  const [terminalOpen, setTerminalOpen] = useState(false);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const cliEndRef  = useRef<HTMLDivElement>(null);

  // Profile
  useEffect(() => {
    if (!wallet) return;
    fetch(`/api/profile?wallet=${wallet}`)
      .then(r => r.json())
      .then(d => { 
        if (d?.profile) { 
          const n = d.profile.apocalyptic_name || d.profile.apoptotic_name || `OPERATIVE_${wallet.slice(0,6)}`; 
          setProfileName(n.toUpperCase()); 
        }
      })
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
    setCliHistory(p => [...p, ">> BYPASS INITIATED...", "CONNECTING SECURE GRID..."]);
    let count = 0;
    const iv = setInterval(() => {
      const lines = [`[ SCANNING ] SECTOR_${Math.floor(Math.random()*20)}...`, `[ BYPASSING CORE ] ${Math.floor(Math.random()*1000)}/1000`, `[ DECRYPTING ] ${(50+Math.random()*45).toFixed(2)}%`];
      setCliHistory(p => [...p, lines[count%3]]);
      count++;
      if (count >= 3) {
        clearInterval(iv);
        setIsDecrypting(false);
        setCliHistory(p => [...p, Math.random() > .15 ? ">> SUCCESS: Coords decoded (45.1092,-122.6801)." : ">> FAILED: EM interference."]);
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
      else if (cmd === "scan")    setCliHistory(p => [...p, "SWEEPING DEPIN NETWORKS...", "  TARGET: MARAUDER_BLADE [GRID_18.2] (120T)", "  TARGET: COLLECTIVE_U04 [GRID_4.5] (250T)"]);
      else if (cmd === "decrypt") runDecrypt();
      else setCliHistory(p => [...p, `>> UNKNOWN COMMAND: '${cmd}'`]);
    }, 150);
  };

  const shieldColor = shieldIntegrity > 60 ? "#ffffff" : shieldIntegrity > 30 ? "#777777" : "#ff003c";
  const shieldCirc  = 2 * Math.PI * 40;

  return (
    <div id="game-bunker-root" style={{background:"#000000",height:"100vh",color:"#ffffff",fontFamily:"Rajdhani,sans-serif",position:"relative",overflow:"hidden",display:"flex",flexDirection:"column"}}>
      
      {/* Cinematic Ambient Background */}
      <div style={{
        position:"absolute",
        inset:0,
        backgroundImage:"url(/images/bunker_backdrop.png)",
        backgroundSize:"cover",
        backgroundPosition:"center",
        opacity:0.35,
        mixBlendMode:"lighten",
        pointerEvents:"none",
        zIndex:0
      }}/>

      {/* Dark Ambient Vignette Layer */}
      <div style={{
        position:"absolute",
        inset:0,
        background:"radial-gradient(circle, transparent 20%, #000000 95%), linear-gradient(to bottom, rgba(0,0,0,0.4), rgba(0,0,0,0.85))",
        pointerEvents:"none",
        zIndex:1
      }}/>

      {/* Atmospheric Fog/Glow overlay */}
      <div style={{
        position:"absolute",
        top:0,
        left:0,
        width:"100%",
        height:"100%",
        background:"radial-gradient(ellipse at 50% 50%, rgba(255,0,62,0.06) 0%, transparent 70%)",
        pointerEvents:"none",
        zIndex:2
      }}/>

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
          <span style={{fontFamily:"Orbitron,sans-serif",color:"#ffffff",fontWeight:900,fontSize:"14px",letterSpacing:"0.3em"}}>&gt; COMMAND HQ TERMINAL</span>
          <div style={{display:"flex",gap:"16px",fontSize:"10px",fontFamily:"JetBrains Mono,monospace",letterSpacing:"0.05em"}}>
            <Link href="/"      style={{color:"rgba(255,255,255,0.45)",textDecoration:"none",transition:"color 0.2s"}} onMouseEnter={e=>e.currentTarget.style.color="#ff003c"} onMouseLeave={e=>e.currentTarget.style.color="rgba(255,255,255,0.45)"}>[ DEPART_HQ ]</Link>
            <Link href="/arena" style={{color:"rgba(255,255,255,0.45)",textDecoration:"none",transition:"color 0.2s"}} onMouseEnter={e=>e.currentTarget.style.color="#ff003c"} onMouseLeave={e=>e.currentTarget.style.color="rgba(255,255,255,0.45)"}>[ PVP_ARENA ]</Link>
            <Link href="/player" style={{color:"rgba(255,255,255,0.45)",textDecoration:"none",transition:"color 0.2s"}} onMouseEnter={e=>e.currentTarget.style.color="#ff003c"} onMouseLeave={e=>e.currentTarget.style.color="rgba(255,255,255,0.45)"}>[ OPERATIVE_DECK ]</Link>
          </div>
        </div>
        <div style={{display:"flex",alignItems:"center",gap:"12px",fontSize:"10px",color:"rgba(255,255,255,0.35)",fontFamily:"JetBrains Mono,monospace",letterSpacing:"0.15em"}}>
          <span>S1 // SECURE_LINE</span>
          <IcDot c="#ff003c" s={4}/>
          <span style={{color:"#ffffff"}}>BUNKER SYS <IcStar c="#ff003c" s={8}/></span>
        </div>
      </header>

      {/* ─── FLOATING SIDE OVERLAYS & CENTRAL FOCUS ───────────────────────────── */}
      <div style={{display:"flex",flexGrow:1,minHeight:0,position:"relative",zIndex:10,padding:"0 40px"}}>
        
        {/* LEFT HUD OVERLAY (No containers/borders - 50% elements reduction) */}
        <div style={{width:"280px",display:"flex",flexDirection:"column",justifyContent:"space-between",padding:"20px 0 40px",flexShrink:0}}>
          
          {/* Operative Bio & Faction Accents */}
          <div style={{display:"flex",flexDirection:"column",gap:"4px"}}>
            <span style={{fontFamily:"Orbitron,sans-serif",color:"#ffffff",fontWeight:900,fontSize:"16px",letterSpacing:"0.1em"}}>{profileName}</span>
            <span style={{fontFamily:"Rajdhani,sans-serif",fontSize:"10px",color:"rgba(255,255,255,0.4)",letterSpacing:"0.15em"}}>
              PLEDGED: <span style={{color:selectedFaction.color,textShadow:`0 0 8px ${selectedFaction.color}88`,fontWeight:700}}>{selectedFaction.name}</span>
            </span>
            <div style={{
              width:"16px",
              height:"2px",
              background:selectedFaction.color,
              marginTop:"6px",
              boxShadow:`0 0 10px ${selectedFaction.color}`
            }}/>
          </div>

          {/* Staking & Shield Status */}
          <div style={{display:"flex",flexDirection:"column",gap:"10px",marginTop:"30px"}}>
            <div style={{display:"flex",alignItems:"center",gap:"16px"}}>
              <svg width="70" height="70" viewBox="0 0 96 96" fill="none" style={{flexShrink:0}}>
                <circle cx="48" cy="48" r="40" stroke="rgba(255,255,255,0.02)" strokeWidth="4" fill="none"/>
                <circle cx="48" cy="48" r="40" stroke={shieldColor} strokeWidth="4" fill="none"
                  strokeDasharray={`${shieldCirc*shieldIntegrity/100} ${shieldCirc}`}
                  strokeDashoffset={shieldCirc*0.25}
                  style={{filter:shieldColor==="#ff003c"?"drop-shadow(0 0 4px #ff003c)":"none",transition:"stroke-dasharray 0.8s ease"}}
                />
                <text x="48" y="46" textAnchor="middle" fill="#ffffff" fontSize="15" fontFamily="Orbitron" fontWeight="900">{shieldIntegrity}%</text>
                <text x="48" y="58" textAnchor="middle" fill="rgba(255,255,255,0.3)" fontSize="6" fontFamily="Rajdhani" letterSpacing="1">SHIELD</text>
              </svg>
              <div>
                <span style={{fontFamily:"Rajdhani,sans-serif",fontSize:"9px",color:"rgba(255,255,255,0.4)",letterSpacing:"0.1em",display:"block"}}>ESCROW RESERVE</span>
                <span style={{fontFamily:"Orbitron,sans-serif",fontSize:"14px",color:"#ffffff",fontWeight:900}}>{stakedThreat} $THREAT</span>
                
                {/* Minimal Quick Stake Overlay */}
                <div style={{display:"flex",gap:"4px",marginTop:"6px"}}>
                  <input value={stakeInput} onChange={e=>setStakeInput(e.target.value)} placeholder="STAKE"
                    style={{width:"60px",background:"rgba(255,255,255,0.03)",border:"1px solid rgba(255,255,255,0.08)",color:"#fff",fontFamily:"Orbitron,sans-serif",fontSize:"9px",padding:"4px 6px",outline:"none"}}/>
                  <button onClick={()=>{const v=parseInt(stakeInput);if(!isNaN(v)&&v>0){setStakedThreat(p=>p+v);setStakeInput("");}}} 
                    style={{background:"transparent",border:"1px solid #ff003c",color:"#ff003c",fontSize:"8px",fontFamily:"Orbitron,sans-serif",padding:"4px 8px",cursor:"pointer",letterSpacing:"0.05em"}}>
                    ADD
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* Minimal Floating Resource Monitors */}
          <div style={{display:"flex",flexDirection:"column",gap:"10px",marginTop:"40px"}}>
            <ResBar label="HQ_WATER_GRID" value={waterLevel} color="#00aaff" Icon={IcDrop}/>
            <ResBar label="STABLE_FOOD_STORES"  value={foodLevel}  color="#00ff88" Icon={IcFood}/>
            <ResBar label="POWER_CAPACITANCE" value={powerGrid}  color="#ff8800" Icon={IcPower}/>
          </div>
        </div>

        {/* ─── CENTRAL TACTICAL COMMAND RADAR Sweep (Focal Point) ──────────────── */}
        <div style={{flexGrow:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",position:"relative"}}>
          
          <div style={{textAlign:"center",marginBottom:"20px",position:"relative",zIndex:5}}>
            <span style={{fontFamily:"Rajdhani,sans-serif",fontSize:"9px",color:"rgba(255,255,255,0.3)",letterSpacing:"0.4em",display:"block"}}>TACTICAL INTEL MATRIX</span>
            <span style={{fontFamily:"Orbitron,sans-serif",fontSize:"28px",fontWeight:900,color:"#ffffff",letterSpacing:"0.1em",textShadow:"0 0 30px rgba(255,255,255,0.15)"}}>RED QUEEN SECTOR SCAN</span>
          </div>

          {/* Holographic Radar Sweeper Map */}
          <div style={{position:"relative",width:"340px",height:"340px",display:"flex",justifyContent:"center",alignItems:"center",flexShrink:0}}>
            <svg width="340" height="340" viewBox="0 0 240 240" style={{position:"absolute",zIndex:4,overflow:"visible"}}>
              <circle cx="120" cy="120" r="114" fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="1.5" />
              <circle cx="120" cy="120" r="110" fill="none" stroke="rgba(255,255,255,0.02)" strokeWidth="1" strokeDasharray="4 6" className="hud-spin-cw" />
              <circle cx="120" cy="120" r="85" fill="none" stroke="rgba(255,0,62,0.08)" strokeWidth="1" />
              <circle cx="120" cy="120" r="55" fill="none" stroke="rgba(255,255,255,0.02)" strokeWidth="0.8" strokeDasharray="3 3" />
              
              {/* Radar scanner sweep line */}
              <line x1="120" y1="120" x2="220" y2="70" stroke="#ff003c" strokeWidth="1.8" className="hud-radar-scanner-sweep" style={{transformOrigin:"120px 120px",filter:"drop-shadow(0 0 4px #ff003c)"}} />
              
              {/* Coordinate axis lines */}
              <line x1="120" y1="5" x2="120" y2="235" stroke="rgba(255,255,255,0.03)" strokeWidth="0.8" />
              <line x1="5" y1="120" x2="235" y2="120" stroke="rgba(255,255,255,0.03)" strokeWidth="0.8" />
              
              {/* Telemetry points */}
              <g className="hud-blink-fast">
                <circle cx="180" cy="90" r="3" fill="#ff003c" filter="drop-shadow(0 0 5px #ff003c)" />
                <text x="188" y="93" fill="rgba(255,255,255,0.8)" fontSize="7" fontFamily="Orbitron" fontWeight="bold">TGT_ALPHA [SEC_18]</text>
              </g>
              <g style={{animation: "hud-blink 2.2s infinite"}}>
                <circle cx="65" cy="145" r="2.5" fill="#ff8800" filter="drop-shadow(0 0 4px #ff8800)" />
                <text x="73" y="148" fill="rgba(255,255,255,0.5)" fontSize="7" fontFamily="Orbitron">SCAV_ZONE_4</text>
              </g>
              <g style={{animation: "hud-blink 1.7s infinite"}}>
                <circle cx="145" cy="175" r="2.5" fill="#00aaff" filter="drop-shadow(0 0 4px #00aaff)" />
                <text x="153" y="178" fill="rgba(255,255,255,0.5)" fontSize="7" fontFamily="Orbitron">SIGNAL_LOCK</text>
              </g>
            </svg>

            {/* Faction Center Node */}
            <div style={{
              width:"90px",
              height:"90px",
              background:"rgba(2,2,2,0.95)",
              border:`1.5px solid ${selectedFaction.color}`,
              display:"flex",
              flexDirection:"column",
              justifyContent:"center",
              alignItems:"center",
              zIndex:6,
              boxShadow:`0 0 20px ${selectedFaction.color}44`,
              clipPath:"polygon(20% 0%, 80% 0%, 100% 20%, 100% 80%, 80% 100%, 20% 100%, 0% 80%, 0% 20%)",
              position:"relative",
              textAlign:"center"
            }}>
              <span style={{fontSize:"8px",color:"rgba(255,255,255,0.35)",letterSpacing:"0.1em"}}>HQ_GRID</span>
              <span style={{fontSize:"14px",color:selectedFaction.color,fontWeight:900,letterSpacing:"0.05em",textShadow:`0 0 8px ${selectedFaction.color}`}}>{selectedFaction.name.slice(0,6)}</span>
            </div>
          </div>

          <div style={{textAlign:"center",marginTop:"20px",zIndex:5}}>
            <span style={{fontFamily:"Rajdhani,sans-serif",fontSize:"10px",color:"rgba(255,255,255,0.3)",letterSpacing:"0.2em"}}>SECTOR STABILITY INDEX</span>
            <span style={{fontFamily:"Oxanium,sans-serif",fontSize:"13px",color:"#00ff88",fontWeight:700,display:"block",letterSpacing:"0.05em"}}>GRID_7 // 98.4% STABLE</span>
          </div>

          {/* Primary Operations Actions (Clean Floating Overlays) */}
          <div style={{display:"flex",gap:"16px",marginTop:"30px",width:"100%",maxWidth:"440px"}}>
            <Link href="/arena" style={{textDecoration:"none",flex:1}}>
              <button style={{
                width:"100%",padding:"12px",
                background:"rgba(255,0,60,0.06)",
                border:"1.5px solid #ff003c",color:"#ffffff",
                fontFamily:"Orbitron,sans-serif",fontSize:"11px",fontWeight:900,letterSpacing:"0.2em",
                cursor:"pointer",textShadow:"0 0 8px #ff003c",
                boxShadow:"0 0 20px rgba(255,0,60,0.25)",
                display:"flex",alignItems:"center",justifyContent:"center",gap:"8px"
              }}>
                <IcSword c="#ff003c" s={12}/> ARENA DEPLOY
              </button>
            </Link>

            <button style={{
              flex:1,padding:"12px",
              background:"rgba(255,136,0,0.03)",
              border:"1px solid rgba(255,136,0,0.4)",color:"#ff8800",
              fontFamily:"Orbitron,sans-serif",fontSize:"11px",fontWeight:900,letterSpacing:"0.15em",
              cursor:"pointer",
              display:"flex",alignItems:"center",justifyContent:"center",gap:"8px",
            }}>
              <IcTarget c="#ff8800" s={12}/> SCAVENGE RUN <span style={{fontSize:"9px",opacity:.6}}>[2/3]</span>
            </button>

            <button onClick={runDecrypt} disabled={isDecrypting||decryptionAttempts<=0} style={{
              flex:1,padding:"12px",
              background:decryptionAttempts>0?"rgba(255,255,255,0.02)":"rgba(255,255,255,0.01)",
              border:`1px solid ${decryptionAttempts>0?"rgba(255,255,255,0.25)":"rgba(255,255,255,0.07)"}`,
              color:decryptionAttempts>0?"#ffffff":"rgba(255,255,255,0.2)",
              fontFamily:"Orbitron,sans-serif",fontSize:"11px",fontWeight:900,letterSpacing:"0.15em",
              cursor:(isDecrypting||decryptionAttempts<=0)?"not-allowed":"pointer",
              display:"flex",alignItems:"center",justifyContent:"center",gap:"8px",
            }}>
              <IcLock c={decryptionAttempts>0?"#ffffff":"rgba(255,255,255,0.2)"} s={12}/>
              {isDecrypting?"BYPASSING...":`DECRYPT [${decryptionAttempts}/5]`}
            </button>
          </div>
        </div>

        {/* RIGHT HUD OVERLAY (No containers/borders - 50% elements reduction) */}
        <div style={{width:"280px",display:"flex",flexDirection:"column",justifyContent:"space-between",padding:"20px 0 40px",flexShrink:0,alignItems:"flex-end"}}>
          
          {/* Pledge Faction Minimal Picker */}
          <div style={{width:"100%"}}>
            <span style={{fontFamily:"Orbitron,sans-serif",fontSize:"9px",color:"rgba(255,255,255,0.3)",letterSpacing:"0.15em",display:"block",marginBottom:"8px",textAlign:"right"}}>FACTION PLEDGE</span>
            <div style={{display:"flex",gap:"4px",flexWrap:"wrap",justifyContent:"flex-end"}}>
              {FACTIONS.map(f=>{
                const active = selectedFaction.id===f.id;
                const codes: Record<string, string> = {
                  survivors: "SRV", nomads: "NMD", marauders: "MRD", scientists: "SCI",
                  governments: "GOV", engineers: "ENG", hackers: "HCK", syndicates: "SYN"
                };
                return (
                  <button key={f.id} onClick={()=>setSelectedFaction(f)} style={{
                    width:"26px",height:"26px",
                    border:`1px solid ${active?f.color:"rgba(255,255,255,0.08)"}`,
                    background:active?`${f.color}22`:"rgba(0,0,0,0.4)",
                    cursor:"pointer",transition:"all 0.15s",
                    display:"flex",alignItems:"center",justifyContent:"center",
                    boxShadow:active?`0 0 10px ${f.color}44`:"none"
                  }}>
                    <span style={{fontFamily:"Orbitron,sans-serif",fontSize:"8px",color:active?f.color:"rgba(255,255,255,0.4)",fontWeight:900}}>
                      {codes[f.id]}
                    </span>
                  </button>
                );
              })}
            </div>
            
            {/* Active Faction description (Floating overlay) */}
            <div style={{marginTop:"8px",textAlign:"right"}}>
              <span style={{fontFamily:"Orbitron,sans-serif",fontSize:"10px",color:selectedFaction.color,fontWeight:700}}>{selectedFaction.name}</span>
              <p style={{fontFamily:"Rajdhani,sans-serif",fontSize:"10px",color:"rgba(255,255,255,0.6)",lineHeight:1.2,marginTop:"3px"}}>
                BUFF: {selectedFaction.passive}
              </p>
            </div>
          </div>

          {/* Minimal Bounty Targets Ledger */}
          <div style={{width:"100%",marginTop:"30px"}}>
            <span style={{fontFamily:"Orbitron,sans-serif",fontSize:"9px",color:"rgba(255,255,255,0.3)",letterSpacing:"0.15em",display:"block",marginBottom:"6px",textAlign:"right"}}>ACTIVE BOUNTIES</span>
            {[
              {name:"MARAUDER_BLADE", grid:"GRID_18.2", bounty:"120T", color:"#ff003c"},
              {name:"COLLECTIVE_U04", grid:"GRID_4.5",  bounty:"250T", color:"#777777"}
            ].map(t=>(
              <div key={t.name} style={{display:"flex",justifyContent:"space-between",alignItems:"center",padding:"4px 0",borderBottom:"1px solid rgba(255,255,255,0.02)"}}>
                <div style={{textAlign:"left"}}>
                  <span style={{fontFamily:"Orbitron,sans-serif",fontSize:"9px",color:t.color,fontWeight:700}}>{t.name}</span>
                  <span style={{fontFamily:"Rajdhani,sans-serif",fontSize:"8px",color:"rgba(255,255,255,0.25)",display:"block"}}>{t.grid}</span>
                </div>
                <span style={{fontFamily:"Orbitron,sans-serif",fontSize:"10px",color:"#d4af37",fontWeight:900}}>{t.bounty}</span>
              </div>
            ))}
          </div>

          {/* Stasis Chamber Health (Minimalist alert style) */}
          <div style={{width:"100%",marginTop:"35px"}}>
            <span style={{fontFamily:"Orbitron,sans-serif",fontSize:"9px",color:"rgba(255,255,255,0.3)",letterSpacing:"0.15em",display:"block",marginBottom:"6px",textAlign:"right"}}>STASIS REPLICATION</span>
            <div style={{display:"flex",alignItems:"center",gap:"8px",justifyContent:"flex-end",marginBottom:"4px"}}>
              <span style={{fontFamily:"Rajdhani,sans-serif",fontSize:"9px",color:"rgba(255,255,255,0.4)"}}>CLONE_03 STATUS:</span>
              <span style={{fontFamily:"Orbitron,sans-serif",fontSize:"9px",color:"#00ff88",fontWeight:700,letterSpacing:"0.05em"}}>ONLINE [98.2% VIABLE]</span>
            </div>
            <div style={{fontFamily:"Rajdhani,sans-serif",fontSize:"8px",lineHeight:"1.2",color:"rgba(255,0,62,0.6)",textAlign:"right",letterSpacing:"0.02em"}}>
              [WARNING] PERMADEATH ENGAGED. INVENTORY DESTRUCTION PROBABILITY 100%.
            </div>
          </div>
        </div>
      </div>

      {/* ─── EXPANDABLE TACTICAL DRAWER (Hides chat/logs, preserving negative space) ─── */}
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
          {terminalOpen ? "[ COLLAPSE FEED DECK ]" : "[ OPEN COGNITIVE LOGS & TERMINAL FEED ]"}
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
            <form onSubmit={handleChat} style={{display:"flex",border:"1px solid rgba(255,0,62,0.2)",background:"#000000"}}>
              <input value={chatInput} onChange={e=>setChatInput(e.target.value)} placeholder="ENTER COGNITIVE TRANSMISSION..." style={{flex:1,background:"transparent",border:"none",color:"#fff",fontFamily:"JetBrains Mono,monospace",fontSize:"9px",padding:"4px 6px",outline:"none",textTransform:"uppercase"}}/>
              <button type="submit" style={{background:"transparent",border:"none",color:"#ff003c",padding:"0 6px",cursor:"pointer",display:"flex",alignItems:"center"}}><IcSend c="#ff003c"/></button>
            </form>
          </div>

          {/* DECRYPT TERMINAL */}
          <div style={{display:"flex",flexDirection:"column",minHeight:0}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"4px"}}>
              <span style={{fontFamily:"Orbitron,sans-serif",fontSize:"8px",color:"rgba(255,255,255,0.4)",letterSpacing:"0.1em"}}>BYPASS_CLI</span>
              <span style={{fontFamily:"Orbitron,sans-serif",fontSize:"8px",color:"#00aaff"}}>{decryptionAttempts}/5 LFT</span>
            </div>
            <div className="hud-scrollbar" style={{flex:1,overflowY:"auto",display:"flex",flexDirection:"column",gap:"1px",marginBottom:"4px"}}>
              {cliHistory.map((line,i)=>(
                <div key={i} style={{fontFamily:"JetBrains Mono,monospace",fontSize:"9px",lineHeight:1.3,color:line.startsWith(">>")?"#ff003c":line.startsWith("guest@")?"#00ff88":line.startsWith("[")?"#ff8800":"rgba(255,255,255,0.35)"}}>{line}</div>
              ))}
              <div ref={cliEndRef}/>
            </div>
            <form onSubmit={handleCli} style={{display:"flex",border:"1px solid rgba(255,0,62,0.2)",background:"#000000"}}>
              <span style={{fontFamily:"JetBrains Mono,monospace",fontSize:"9px",color:"#00ff88",padding:"4px 2px 4px 6px"}}>$</span>
              <input value={cliInput} onChange={e=>setCliInput(e.target.value)} placeholder="command..." disabled={isDecrypting} style={{flex:1,background:"transparent",border:"none",color:"#fff",fontFamily:"JetBrains Mono,monospace",fontSize:"9px",padding:"4px 2px",outline:"none"}}/>
              <button type="submit" style={{background:"transparent",border:"none",color:"#ff003c",padding:"0 6px",cursor:"pointer",display:"flex",alignItems:"center"}}><IcSend c="#ff003c"/></button>
            </form>
          </div>

          {/* SYSTEM LOG */}
          <div style={{display:"flex",flexDirection:"column",minHeight:0}}>
            <div style={{fontFamily:"Orbitron,sans-serif",fontSize:"8px",color:"rgba(255,255,255,0.3)",letterSpacing:"0.15em",marginBottom:"4px"}}>TELEMETRY_LOGS</div>
            <div className="hud-scrollbar" style={{flex:1,overflowY:"auto",display:"flex",flexDirection:"column",gap:"1px"}}>
              {[
                {t:"01:05",text:"SHIELD INTEGRITY CORRELATION COMPLETE.", c:"#00ff88"},
                {t:"01:08",text:`FACTION LOCK ENFORCED: ${selectedFaction.name}`,c:selectedFaction.color},
                {t:"01:12",text:`RESERVE LOCK: ${stakedThreat} $THREAT`, c:"#d4af37"},
                {t:"01:14",text:"ARENA COOLDOWN DECREASED.",                    c:"#ff003c"},
                {t:"01:18",text:`WATER: ${waterLevel.toFixed(1)}%`,       c:waterLevel<30?"#ff003c":"rgba(255,255,255,0.4)"},
              ].map((l,i)=>(
                <div key={i} style={{fontFamily:"JetBrains Mono,monospace",fontSize:"9px",lineHeight:1.3}}>
                  <span style={{color:"rgba(255,255,255,0.2)"}}>[{l.t}] </span>
                  <span style={{color:l.c}}>{l.text}</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
