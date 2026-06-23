"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/components/AuthProvider";
import { useWallet } from "@solana/wallet-adapter-react";
import Link from "next/link";
import OnboardingBriefing from "@/components/OnboardingBriefing";

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

// ── VOLUMETRIC VIAL (SVG with dynamic mouse tilting) ──────────────────────────
function VolumetricVial({
  label,
  value,
  color,
  glowColor,
  Icon,
}: {
  label: string;
  value: number;
  color: string;
  glowColor: string;
  Icon: React.FC<{ c: string; s?: number }>;
}) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [tilt, setTilt] = useState({ x: 0, y: 0 });

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = (e.clientX - rect.left) / rect.width - 0.5; // -0.5 to 0.5
    const y = (e.clientY - rect.top) / rect.height - 0.5; // -0.5 to 0.5
    setTilt({ x: x * 15, y: y * 15 }); // Max 15 degrees tilt
  };

  const handleMouseLeave = () => {
    setTilt({ x: 0, y: 0 });
  };

  const fillHeight = 100 - value; // percentage of empty space from top

  return (
    <div
      ref={containerRef}
      onMouseMove={handleMouseMove}
      style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        background: "rgba(10, 10, 10, 0.4)",
        border: "1px solid rgba(255, 255, 255, 0.05)",
        padding: "10px 14px",
        borderRadius: "4px",
        width: "100%",
        transition: "all 0.3s ease",
        cursor: "pointer",
        backdropFilter: "blur(5px)",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.15)";
        e.currentTarget.style.background = "rgba(20, 20, 20, 0.6)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "rgba(255, 255, 255, 0.05)";
        e.currentTarget.style.background = "rgba(10, 10, 10, 0.4)";
        handleMouseLeave();
      }}
    >
      <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <Icon c={value < 30 ? "#ff003c" : color} s={12} />
          <span style={{ fontFamily: "Rajdhani,sans-serif", fontSize: "9px", letterSpacing: "0.1em", color: "rgba(255,255,255,0.4)" }}>
            {label}
          </span>
        </div>
        <span style={{ fontFamily: "Orbitron,sans-serif", fontSize: "12px", color: value < 30 ? "#ff003c" : "#ffffff", fontWeight: 800 }}>
          {value.toFixed(1)}%
        </span>
      </div>

      {/* Volumetric Test Tube / Vial */}
      <div style={{ position: "relative", width: "24px", height: "54px", filter: `drop-shadow(0 0 6px ${value < 30 ? "#ff003c" : glowColor}aa)` }}>
        <svg width="24" height="54" viewBox="0 0 24 54" fill="none" style={{ overflow: "hidden" }}>
          {/* Glass Outer Contour */}
          <rect x="1" y="1" width="22" height="52" rx="11" stroke="rgba(255,255,255,0.3)" strokeWidth="1.5" />
          
          {/* Inner Liquid Container */}
          <mask id={`vial-mask-${label}`}>
            <rect x="2" y="2" width="20" height="50" rx="10" fill="#ffffff" />
          </mask>
          
          <g mask={`url(#vial-mask-${label})`}>
            {/* Liquid Fill */}
            <path
              d={`M -6,${10 + fillHeight * 0.38} Q 6,${8 + fillHeight * 0.38 + tilt.y * 0.4} 12,${10 + fillHeight * 0.38 + tilt.x * 0.4} T 30,${10 + fillHeight * 0.38} L 30,54 L -6,54 Z`}
              fill={value < 30 ? "#ff003c" : color}
              style={{
                transition: "d 0.1s ease, fill 0.3s ease",
                transform: `rotate(${tilt.x}deg)`,
                transformOrigin: "12px 27px",
              }}
            />
            {/* Highlight/Specularity overlay */}
            <rect x="3" y="3" width="4" height="48" rx="2" fill="rgba(255, 255, 255, 0.15)" />
            {/* Shadow overlay for depth */}
            <rect x="17" y="3" width="4" height="48" rx="2" fill="rgba(0, 0, 0, 0.25)" />
          </g>
          
          {/* Measuring Grid Lines */}
          <line x1="6" y1="12" x2="10" y2="12" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
          <line x1="6" y1="27" x2="12" y2="27" stroke="rgba(255,255,255,0.2)" strokeWidth="1" />
          <line x1="6" y1="40" x2="10" y2="40" stroke="rgba(255,255,255,0.15)" strokeWidth="1" />
        </svg>
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
  const [isDeployHovered, setIsDeployHovered] = useState(false);

  // Gamification & Simulation States
  const [decryptActive, setDecryptActive] = useState(false);
  const [decryptTarget, setDecryptTarget] = useState("");
  const [decryptGrid, setDecryptGrid] = useState<string[]>([]);
  const [decryptSeconds, setDecryptSeconds] = useState(6);
  
  const [scavengeActive, setScavengeActive] = useState(false);
  const [scavengeLogs, setScavengeLogs] = useState<string[]>([]);
  const [scavengeProgress, setScavengeProgress] = useState(0);

  const chatEndRef = useRef<HTMLDivElement>(null);
  const cliEndRef  = useRef<HTMLDivElement>(null);

  // Decrypt Countdown Timer Effect
  useEffect(() => {
    if (!decryptActive) return;
    if (decryptSeconds <= 0) {
      setDecryptActive(false);
      setCliHistory(p => [...p, ">> BYPASS TIMEOUT: Access matrix static.", ">> DECRYPTION FAILED."]);
      return;
    }
    const t = setTimeout(() => {
      setDecryptSeconds(s => s - 1);
    }, 1000);
    return () => clearTimeout(t);
  }, [decryptActive, decryptSeconds]);

  const startDecryptGame = () => {
    if (decryptionAttempts <= 0) {
      setCliHistory(p => [...p, ">> ERROR: ATTEMPTS EXHAUSTED."]);
      return;
    }
    const next = decryptionAttempts - 1;
    setDecryptionAttempts(next);
    localStorage.setItem("redqueen_bunker_decryption_attempts", String(next));

    const hexPool = ["A1", "3B", "C2", "D4", "9B", "E7", "F5", "8A", "6D", "0C", "7B", "1E"];
    const shuffled = [...hexPool].sort(() => Math.random() - 0.5);
    const target = shuffled[0];
    const grid = shuffled.slice(0, 9);
    
    setDecryptTarget(target);
    setDecryptGrid(grid);
    setDecryptSeconds(6);
    setDecryptActive(true);
    setTerminalOpen(true);
    setCliHistory(p => [...p, ">> MATRIX SECURITY ENGAGED.", `>> TARGET SEQUENCE: [ ${target} ]`]);
  };

  const handleHexClick = (code: string) => {
    if (!decryptActive) return;
    if (code === decryptTarget) {
      setDecryptActive(false);
      setCliHistory(p => [
        ...p,
        `>> ACCESS GRANTED: Bypass code ${code} validated.`,
        ">> SUCCESS: Decoded sector target (45.1092,-122.6801)."
      ]);
    } else {
      setDecryptActive(false);
      setCliHistory(p => [
        ...p,
        `>> DETECTED INTRUSION: Code ${code} invalid.`,
        ">> DECRYPTION FAILED."
      ]);
    }
  };

  const startScavengeRun = () => {
    setScavengeActive(true);
    setScavengeProgress(0);
    setScavengeLogs(["[SYS] Drone link active. Calibrating coordinate mesh..."]);
    
    let currentProgress = 0;
    const iv = setInterval(() => {
      currentProgress += 4;
      setScavengeProgress(currentProgress);
      
      if (currentProgress === 20) {
        setScavengeLogs(p => [...p, "[SYS] Drone deployed. Scanning coordinate sector 4..."]);
      } else if (currentProgress === 48) {
        setScavengeLogs(p => [...p, "[SYS] Biological indicators identified at [COORD: 18.2, 4.5]."]);
      } else if (currentProgress === 80) {
        setScavengeLogs(p => [...p, "[SYS] Salvaging scrap components from hazard ruins..."]);
      } else if (currentProgress >= 100) {
        clearInterval(iv);
        setScavengeLogs(p => [...p, "[SYS] SUCCESS: Plated vest blueprint retrieved.", "[SYS] Mission complete. Returning to HQ."]);
      }
    }, 80);
  };

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
      else if (cmd === "decrypt") startDecryptGame();
      else setCliHistory(p => [...p, `>> UNKNOWN COMMAND: '${cmd}'`]);
    }, 150);
  };

  const shieldColor = shieldIntegrity > 60 ? "#ffffff" : shieldIntegrity > 30 ? "#777777" : "#ff003c";
  const shieldCirc  = 2 * Math.PI * 40;

  return (
    <div id="game-bunker-root" style={{background:"#000000",height:"100vh",color:"#ffffff",fontFamily:"Rajdhani,sans-serif",position:"relative",overflow:"hidden",display:"flex",flexDirection:"column"}}>
      
      {/* Dynamic Screen-Wide Warning Red Ambient Flash on ARENA DEPLOY Hover */}
      <div style={{
        position: "absolute",
        inset: 0,
        background: "rgba(255, 0, 60, 0.08)",
        opacity: isDeployHovered ? 1 : 0,
        pointerEvents: "none",
        zIndex: 5,
        transition: "opacity 0.25s ease-in-out",
        animation: isDeployHovered ? "pulse-warn 1.2s infinite alternate ease-in-out" : "none"
      }}/>

      <style>{`
        @keyframes pulse-warn {
          0% { opacity: 0.02; }
          100% { opacity: 0.16; }
        }
      `}</style>

      {/* Cinematic Ambient Background */}
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
          <div style={{display:"flex",flexDirection:"column",gap:"10px",marginTop:"40px",width:"100%"}}>
            <VolumetricVial label="HQ_WATER_GRID" value={waterLevel} color="#00aaff" glowColor="#00aaff" Icon={IcDrop}/>
            <VolumetricVial label="STABLE_FOOD_STORES" value={foodLevel} color="#00ff88" glowColor="#00ff88" Icon={IcFood}/>
            <VolumetricVial label="POWER_CAPACITANCE" value={powerGrid} color="#ff8800" glowColor="#ff8800" Icon={IcPower}/>
          </div>
        </div>

        {/* ─── CENTRAL TACTICAL COMMAND RADAR Sweep (Focal Point) ──────────────── */}
        <div style={{flexGrow:1,display:"flex",flexDirection:"column",alignItems:"center",justifyContent:"center",position:"relative"}}>
          
          <div style={{textAlign:"center",marginBottom:"20px",position:"relative",zIndex:5}}>
            <span style={{fontFamily:"Rajdhani,sans-serif",fontSize:"9px",color:"rgba(255,255,255,0.3)",letterSpacing:"0.4em",display:"block"}}>TACTICAL INTEL MATRIX</span>
            <span style={{fontFamily:"Orbitron,sans-serif",fontSize:"28px",fontWeight:900,color:"#ffffff",letterSpacing:"0.1em",textShadow:"0 0 30px rgba(255,255,255,0.15)"}}>RED QUEEN SECTOR SCAN</span>
          </div>

          {/* Holographic Radar Sweeper Map */}
          <div style={{
            position:"relative",
            width:"340px",
            height:"340px",
            display:"flex",
            justifyContent:"center",
            alignItems:"center",
            flexShrink:0,
            transform: "perspective(900px) rotateX(32deg) rotateY(0deg) skewX(-2deg)",
            transformStyle: "preserve-3d",
            transition: "transform 0.5s ease-out"
          }}>
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

          {/* Primary Operations Actions (Chunky Console Key Overlays) */}
          <div style={{display:"flex",gap:"16px",marginTop:"30px",width:"100%",maxWidth:"440px"}}>
            <Link href="/arena" style={{textDecoration:"none",flex:1}}>
              <button 
                onMouseEnter={() => setIsDeployHovered(true)}
                onMouseLeave={() => setIsDeployHovered(false)}
                style={{
                  width:"100%",padding:"12px",
                  background:"rgba(255,0,60,0.18)",
                  border:"2px solid #ff003c",color:"#ffffff",
                  fontFamily:"Orbitron,sans-serif",fontSize:"11px",fontWeight:900,letterSpacing:"0.2em",
                  cursor:"pointer",textShadow:"0 0 8px #ff003c",
                  boxShadow:"0 4px 0px #990024, 0 0 15px rgba(255,0,60,0.4)",
                  display:"flex",alignItems:"center",justifyContent:"center",gap:"8px",
                  transition: "all 0.1s ease",
                  transform: "translateY(0px)"
                }}
                onMouseDown={e => {
                  e.currentTarget.style.transform = "translateY(2px)";
                  e.currentTarget.style.boxShadow = "0 2px 0px #990024, 0 0 10px rgba(255,0,60,0.4)";
                }}
                onMouseUp={e => {
                  e.currentTarget.style.transform = "translateY(0px)";
                  e.currentTarget.style.boxShadow = "0 4px 0px #990024, 0 0 15px rgba(255,0,60,0.4)";
                }}
              >
                <IcSword c="#ff003c" s={12}/> ARENA DEPLOY
              </button>
            </Link>

            <button 
              onClick={startScavengeRun}
              style={{
                flex:1,padding:"12px",
                background:"rgba(255,136,0,0.12)",
                border:"2px solid #ff8800",color:"#ffffff",
                fontFamily:"Orbitron,sans-serif",fontSize:"11px",fontWeight:900,letterSpacing:"0.15em",
                cursor:"pointer",
                boxShadow:"0 4px 0px #995500, 0 0 15px rgba(255,136,0,0.3)",
                display:"flex",alignItems:"center",justifyContent:"center",gap:"8px",
                transition: "all 0.1s ease",
                transform: "translateY(0px)"
              }}
              onMouseDown={e => {
                e.currentTarget.style.transform = "translateY(2px)";
                e.currentTarget.style.boxShadow = "0 2px 0px #995500, 0 0 10px rgba(255,136,0,0.3)";
              }}
              onMouseUp={e => {
                e.currentTarget.style.transform = "translateY(0px)";
                e.currentTarget.style.boxShadow = "0 4px 0px #995500, 0 0 15px rgba(255,136,0,0.3)";
              }}
            >
              <IcTarget c="#ff8800" s={12}/> SCAVENGE RUN <span style={{fontSize:"9px",opacity:.6}}>[2/3]</span>
            </button>

            <button 
              onClick={startDecryptGame} 
              disabled={decryptActive||decryptionAttempts<=0} 
              style={{
                flex:1,padding:"12px",
                background:decryptionAttempts>0?"rgba(255,255,255,0.06)":"rgba(255,255,255,0.01)",
                border:`2px solid ${decryptionAttempts>0?"#ffffff":"rgba(255,255,255,0.15)"}`,
                color:decryptionAttempts>0?"#ffffff":"rgba(255,255,255,0.2)",
                fontFamily:"Orbitron,sans-serif",fontSize:"11px",fontWeight:900,letterSpacing:"0.15em",
                cursor:(decryptActive||decryptionAttempts<=0)?"not-allowed":"pointer",
                boxShadow:decryptionAttempts>0?"0 4px 0px #555555, 0 0 15px rgba(255,255,255,0.15)":"none",
                display:"flex",alignItems:"center",justifyContent:"center",gap:"8px",
                transition: "all 0.1s ease",
                transform: "translateY(0px)"
              }}
              onMouseDown={e => {
                if (decryptionAttempts <= 0) return;
                e.currentTarget.style.transform = "translateY(2px)";
                e.currentTarget.style.boxShadow = "0 2px 0px #555555, 0 0 10px rgba(255,255,255,0.15)";
              }}
              onMouseUp={e => {
                if (decryptionAttempts <= 0) return;
                e.currentTarget.style.transform = "translateY(0px)";
                e.currentTarget.style.boxShadow = "0 4px 0px #555555, 0 0 15px rgba(255,255,255,0.15)";
              }}
            >
              <IcLock c={decryptionAttempts>0?"#ffffff":"rgba(255,255,255,0.2)"} s={12}/>
              {decryptActive?"BYPASSING...":`DECRYPT [${decryptionAttempts}/5]`}
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
          <div style={{display:"flex",flexDirection:"column",minHeight:0,position:"relative",height:"100%"}}>
            <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",marginBottom:"4px"}}>
              <span style={{fontFamily:"Orbitron,sans-serif",fontSize:"8px",color:"rgba(255,255,255,0.4)",letterSpacing:"0.1em"}}>BYPASS_CLI</span>
              <span style={{fontFamily:"Orbitron,sans-serif",fontSize:"8px",color:"#00aaff"}}>{decryptionAttempts}/5 LFT</span>
            </div>
            {decryptActive ? (
              <div style={{
                flex:1,
                display:"flex",
                flexDirection:"column",
                background:"rgba(5, 5, 5, 0.95)",
                border:"1px solid rgba(255, 0, 60, 0.3)",
                padding:"6px",
                borderRadius:"2px",
                position:"relative",
                justifyContent:"space-between"
              }}>
                <div style={{display:"flex",justifyContent:"space-between",alignItems:"center",fontFamily:"Orbitron,sans-serif",fontSize:"8px",marginBottom:"4px"}}>
                  <span style={{color:"#ff003c",fontWeight:900,letterSpacing:"0.05em"}}>TARGET: [ {decryptTarget} ]</span>
                  <span style={{color:decryptSeconds<=2?"#ff003c":"#ff8800",fontWeight:700}}>
                    TIME LEFT: {decryptSeconds}S
                  </span>
                </div>
                <div style={{
                  display:"grid",
                  gridTemplateColumns:"repeat(3, 1fr)",
                  gap:"4px",
                  flexGrow:1,
                  alignContent:"center"
                }}>
                  {decryptGrid.map((code,idx)=>(
                    <button
                      key={idx}
                      onClick={() => handleHexClick(code)}
                      style={{
                        background:"rgba(255,0,60,0.05)",
                        border:"1px solid rgba(255,255,255,0.1)",
                        color:"#ffffff",
                        fontFamily:"JetBrains Mono,monospace",
                        fontSize:"11px",
                        fontWeight:700,
                        padding:"3px 0",
                        cursor:"pointer",
                        borderRadius:"2px",
                        transition:"all 0.15s",
                      }}
                      onMouseEnter={e => {
                        e.currentTarget.style.borderColor = "#ff003c";
                        e.currentTarget.style.background = "rgba(255,0,60,0.15)";
                      }}
                      onMouseLeave={e => {
                        e.currentTarget.style.borderColor = "rgba(255,255,255,0.1)";
                        e.currentTarget.style.background = "rgba(255,0,60,0.05)";
                      }}
                    >
                      {code}
                    </button>
                  ))}
                </div>
                <div style={{height:"2px",background:"rgba(255,255,255,0.05)",marginTop:"4px",position:"relative"}}>
                  <div style={{
                    height:"100%",
                    width:`${(decryptSeconds/6)*100}%`,
                    background:decryptSeconds<=2?"#ff003c":"#ff8800",
                    transition:"width 1s linear"
                  }}/>
                </div>
              </div>
            ) : (
              <>
                <div className="hud-scrollbar" style={{flex:1,overflowY:"auto",display:"flex",flexDirection:"column",gap:"1px",marginBottom:"4px"}}>
                  {cliHistory.map((line,i)=>(
                    <div key={i} style={{
                      fontFamily:"JetBrains Mono,monospace",
                      fontSize:"9.5px",
                      lineHeight:1.3,
                      color:line.startsWith(">>")?"#ff003c":line.startsWith("guest@")?"#00ff88":line.startsWith("[")?"#ff8800":"#00ff88",
                      textShadow:line.startsWith(">>")?"0 0 4px rgba(255,0,60,0.6)":line.startsWith("guest@")?"0 0 4px rgba(0,255,136,0.6)":"0 0 4px rgba(0,255,136,0.3)"
                    }}>{line}</div>
                  ))}
                  <div ref={cliEndRef}/>
                </div>
                <form onSubmit={handleCli} style={{display:"flex",border:"1px solid rgba(255,0,62,0.2)",background:"#000000"}}>
                  <span style={{fontFamily:"JetBrains Mono,monospace",fontSize:"9.5px",color:"#00ff88",padding:"4px 2px 4px 6px",textShadow:"0 0 4px rgba(0,255,136,0.6)"}}>$</span>
                  <input value={cliInput} onChange={e=>setCliInput(e.target.value)} placeholder="command..." disabled={isDecrypting} style={{flex:1,background:"transparent",border:"none",color:"#00ff88",fontFamily:"JetBrains Mono,monospace",fontSize:"9.5px",padding:"4px 2px",outline:"none",textShadow:"0 0 4px rgba(0,255,136,0.6)"}}/>
                  <button type="submit" style={{background:"transparent",border:"none",color:"#ff003c",padding:"0 6px",cursor:"pointer",display:"flex",alignItems:"center"}}><IcSend c="#ff003c"/></button>
                </form>
              </>
            )}
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

      <OnboardingBriefing page="bunker" />

      {/* ─── SCAVENGE PROGRESS OVERLAY MODAL ──────────────────────────────────── */}
      {scavengeActive && (
        <div style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0, 0, 0, 0.85)",
          backdropFilter: "blur(6px)",
          zIndex: 9999,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          fontFamily: "Rajdhani, sans-serif"
        }}>
          <div style={{
            background: "rgba(10, 10, 10, 0.98)",
            border: "2px solid #ff8800",
            boxShadow: "0 0 35px rgba(255, 136, 0, 0.3)",
            width: "480px",
            padding: "24px",
            clipPath: "polygon(0% 0%, 90% 0%, 100% 10%, 100% 100%, 0% 100%)",
            display: "flex",
            flexDirection: "column",
            gap: "16px"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ fontFamily: "Orbitron, sans-serif", fontSize: "12px", color: "#ff8800", fontWeight: 900, letterSpacing: "0.2em" }}>
                &gt; SCAVENGER DRONE TELEMETRY
              </span>
              <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "10px", color: scavengeProgress >= 100 ? "#00ff88" : "#ff8800" }}>
                {scavengeProgress >= 100 ? "MISSION_COMPLETE" : "TRANSMITTING..."}
              </span>
            </div>

            <div style={{
              height: "120px",
              border: "1px solid rgba(255, 136, 0, 0.2)",
              background: "rgba(0, 0, 0, 0.5)",
              position: "relative",
              overflow: "hidden",
              borderRadius: "2px"
            }}>
              <div style={{
                position: "absolute",
                top: 0,
                left: 0,
                width: "100%",
                height: "2px",
                background: "rgba(255, 136, 0, 0.5)",
                boxShadow: "0 0 8px #ff8800",
                animation: "scanline-move 2s linear infinite"
              }} />
              <style>{`
                @keyframes scanline-move {
                  0% { top: 0%; }
                  100% { top: 100%; }
                }
              `}</style>
              
              <div style={{ position: "absolute", inset: "12px", fontFamily: "JetBrains Mono, monospace", fontSize: "9px", color: "rgba(255, 136, 0, 0.4)", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                <div>LOC_SCAN: GRID_18.2 [45.1092, -122.6801]</div>
                <div style={{ display: "flex", justifyContent: "space-between" }}>
                  <span>ELEV: 248m</span>
                  <span>SIG: {scavengeProgress}% STABLE</span>
                </div>
              </div>
              
              <div style={{
                position: "absolute",
                left: "50%",
                top: "50%",
                transform: "translate(-50%, -50%)",
                width: "80px",
                height: "80px",
                border: "1px dashed rgba(255, 136, 0, 0.15)",
                borderRadius: "50%"
              }} />
            </div>

            <div>
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", color: "rgba(255,255,255,0.6)", marginBottom: "4px" }}>
                <span>SCAN_PROGRESS</span>
                <span style={{ fontFamily: "Orbitron, sans-serif", fontWeight: 700 }}>{scavengeProgress}%</span>
              </div>
              <div style={{ display: "flex", gap: "2px" }}>
                {Array.from({ length: 25 }).map((_, i) => {
                  const val = (100 / 25) * (i + 1);
                  const active = scavengeProgress >= val;
                  return (
                    <div key={i} style={{
                      height: "6px",
                      flexGrow: 1,
                      background: active ? "#ff8800" : "rgba(255, 255, 255, 0.03)",
                      boxShadow: active ? "0 0 6px rgba(255, 136, 0, 0.6)" : "none",
                      transition: "all 0.1s ease"
                    }} />
                  );
                })}
              </div>
            </div>

            <div style={{
              height: "100px",
              background: "rgba(0,0,0,0.8)",
              border: "1px solid rgba(255,255,255,0.05)",
              padding: "8px 12px",
              overflowY: "auto",
              display: "flex",
              flexDirection: "column",
              gap: "2px",
              fontFamily: "JetBrains Mono, monospace",
              fontSize: "9px"
            }} className="hud-scrollbar">
              {scavengeLogs.map((log, i) => (
                <div key={i} style={{ color: log.startsWith("[SYS] SUCCESS") ? "#00ff88" : "rgba(255,255,255,0.7)" }}>
                  {log}
                </div>
              ))}
            </div>

            {scavengeProgress >= 100 && (
              <button
                onClick={() => setScavengeActive(false)}
                style={{
                  background: "#ff8800",
                  border: "none",
                  color: "#ffffff",
                  fontFamily: "Orbitron, sans-serif",
                  fontSize: "10px",
                  fontWeight: 900,
                  padding: "10px 0",
                  cursor: "pointer",
                  letterSpacing: "0.15em",
                  boxShadow: "0 0 15px rgba(255,136,0,0.4)"
                }}
              >
                DISMISS TELEMETRY GRID
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
