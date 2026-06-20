"use client";

import { useState, useEffect, useRef } from "react";
import { useAuth } from "@/components/AuthProvider";
import { useWallet } from "@solana/wallet-adapter-react";
import Link from "next/link";

interface Faction {
  id: string;
  name: string;
  themeColor: string;
  startingItem: string;
  passiveFormula: string;
  weakness: string;
  description: string;
}

const FACTIONS: Faction[] = [
  {
    id: "survivors",
    name: "SURVIVORS",
    themeColor: "#ffffff",
    startingItem: "Canteen",
    passiveFormula: "Durability break chance -15%",
    weakness: "No high-tier specialization bonuses",
    description: "REFUGEES CONSERVING GRID EQUIPMENT."
  },
  {
    id: "nomads",
    name: "NOMADS",
    themeColor: "#ff003c",
    startingItem: "Compass",
    passiveFormula: "Scavenger (Yield = Base * 1.15)",
    weakness: "Physical armor reduced by 15%",
    description: "SCOUTS MAPPING SECTOR RESERVES."
  },
  {
    id: "marauders",
    name: "MARAUDERS",
    themeColor: "#ff003c",
    startingItem: "Spiked Vest",
    passiveFormula: "Vandal (Damage = Base * 1.10)",
    weakness: "Predictable attack target selectors",
    description: "RAIDERS ATTACKING DEPIN VAULTS."
  },
  {
    id: "scientists",
    name: "SCIENTISTS",
    themeColor: "#ffffff",
    startingItem: "Slate",
    passiveFormula: "Blueprint (Time = Base * 0.80)",
    weakness: "Physical HP capacity reduced by 10%",
    description: "ANALYSTS BYPASSING ENCRYPTION CORES."
  },
  {
    id: "governments",
    name: "GOVERNMENTS",
    themeColor: "#ffffff",
    startingItem: "Comms Badge",
    passiveFormula: "Intercept (Reduces target escape chance)",
    weakness: "Initiative checks penalized by 10%",
    description: "COMMANDERS ESTABLISHING GRID DIVIDENDS."
  },
  {
    id: "engineers",
    name: "ENGINEERS",
    themeColor: "#ff003c",
    startingItem: "Heavy Wrench",
    passiveFormula: "Fortify (Build Cost = Base * 0.85)",
    weakness: "Critical hits capped at 1.2x damage",
    description: "OPERATORS REPAIRING SHIELD CELLS."
  },
  {
    id: "hackers",
    name: "HACKERS",
    themeColor: "#ff003c",
    startingItem: "Decryption Rig",
    passiveFormula: "Bypass (Predicts environmental events)",
    weakness: "Melee combat damage reduced by 25%",
    description: "INFILTRATORS DECRYPTING NETWORKS."
  },
  {
    id: "syndicates",
    name: "BUNKER SYNDICATES",
    themeColor: "#ff003c",
    startingItem: "Energy Shield",
    passiveFormula: "Escrow (Shield Capacity = Base * 1.20)",
    weakness: "Maintenance fees increased by 15%",
    description: "BANKERS CONTROLLING ASSET FLOWS."
  }
];

interface ChatMessage {
  time: string;
  sender: string;
  text: string;
  color?: string;
}

const SEED_CHAT_MESSAGES: ChatMessage[] = [
  { time: "01:05", sender: "CYBER_NOMAD", text: "WATER LEVELS IN SECTOR 4 ARE DOWN TO 12%. ANYONE GOT FILTERS?" },
  { time: "01:08", sender: "GATEKEEPER_X", text: "SYNDICATE SHIELDS STABILIZED. STAKED 300 $THREAT." },
  { time: "01:12", sender: "RADIO_GHOST", text: "RED QUEEN ADDED BOUNTY ON MARAUDER_BLADE. TARGET AUDIT ACTIVE." },
  { time: "01:14", sender: "NET_VIPER", text: "NET SCAN COMPLETED. SECURE TRANSMISSION LINES." }
];

export default function BunkerPage() {
  const { authIdentifier } = useAuth();
  const { publicKey } = useWallet();
  const currentWallet = authIdentifier || (publicKey ? publicKey.toString() : null);

  const [profileName, setProfileName] = useState<string>("SURVIVOR_GUEST");
  const [selectedFaction, setSelectedFaction] = useState<Faction>(FACTIONS[0]);
  const [stakedThreat, setStakedThreat] = useState<number>(150);
  const [shieldIntegrity, setShieldIntegrity] = useState<number>(65);

  const [waterLevel, setWaterLevel] = useState<number>(45.5);
  const [foodLevel, setFoodLevel] = useState<number>(62.8);
  const [powerGrid, setPowerGrid] = useState<number>(78.2);

  const [cliInput, setCliInput] = useState<string>("");
  const [cliHistory, setCliHistory] = useState<string[]>([
    "RED QUEEN MAIN CONTROL CONSOLE // NODE 7.4.1",
    "INITIALIZATION COMPLETED. READY FOR INPUT.",
    "TYPE 'help' FOR LIST OF SYSTEM UTILITIES."
  ]);
  const [decryptionAttempts, setDecryptionAttempts] = useState<number>(5);
  const [isDecrypting, setIsDecrypting] = useState<boolean>(false);

  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState<string>("");
  const [centerTab, setCenterTab] = useState<"RADAR" | "SHIELD">("RADAR");

  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const cliEndRef = useRef<HTMLDivElement | null>(null);

  useEffect(() => {
    if (!currentWallet) {
      setProfileName("SURVIVOR_GUEST");
      return;
    }
    const fetchProfile = async () => {
      try {
        const res = await fetch(`/api/profile?wallet=${currentWallet}`);
        const data = await res.json();
        if (data && data.profile) {
          const name = data.profile.apocalyptic_name || data.profile.apoptotic_name || `OPERATIVE_${currentWallet.slice(0, 6)}`;
          setProfileName(name.toUpperCase());
        } else {
          setProfileName(`OPERATIVE_${currentWallet.slice(0, 6)}`.toUpperCase());
        }
      } catch (err) {
        setProfileName(`OPERATIVE_${currentWallet.slice(0, 6)}`.toUpperCase());
      }
    };
    fetchProfile();
  }, [currentWallet]);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const cachedChat = localStorage.getItem("redqueen_bunker_general_chat");
      if (cachedChat) {
        try {
          setChatMessages(JSON.parse(cachedChat));
        } catch {
          setChatMessages(SEED_CHAT_MESSAGES);
        }
      } else {
        setChatMessages(SEED_CHAT_MESSAGES);
        localStorage.setItem("redqueen_bunker_general_chat", JSON.stringify(SEED_CHAT_MESSAGES));
      }

      const cachedAttempts = localStorage.getItem("redqueen_bunker_decryption_attempts");
      if (cachedAttempts) {
        setDecryptionAttempts(Number(cachedAttempts));
      } else {
        setDecryptionAttempts(5);
        localStorage.setItem("redqueen_bunker_decryption_attempts", "5");
      }
    }
  }, []);

  useEffect(() => {
    const factionBonus = selectedFaction.id === "syndicates" ? 1.20 : 1.0;
    const baseShield = 25 * factionBonus;
    const calculatedShield = Math.min(99, Math.round(baseShield + Math.log2(stakedThreat + 1) * 8.5));
    setShieldIntegrity(calculatedShield);
  }, [stakedThreat, selectedFaction]);

  useEffect(() => {
    const interval = setInterval(() => {
      setWaterLevel(prev => {
        const delta = (Math.random() - 0.5) * 0.15;
        return Math.max(0, Math.min(100, parseFloat((prev + delta).toFixed(2))));
      });
      setFoodLevel(prev => {
        const delta = (Math.random() - 0.5) * 0.12;
        return Math.max(0, Math.min(100, parseFloat((prev + delta).toFixed(2))));
      });
      setPowerGrid(prev => {
        const delta = (Math.random() - 0.5) * 0.2;
        return Math.max(0, Math.min(100, parseFloat((prev + delta).toFixed(2))));
      });
    }, 3000);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  useEffect(() => {
    cliEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [cliHistory]);

  const handleSendChat = (e: React.FormEvent) => {
    e.preventDefault();
    if (!chatInput.trim()) return;

    const timeStr = new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
    const newMsg: ChatMessage = {
      time: timeStr,
      sender: profileName,
      text: chatInput.toUpperCase(),
      color: "#ffffff"
    };

    const updatedChat = [...chatMessages, newMsg];
    setChatMessages(updatedChat);
    setChatInput("");
    localStorage.setItem("redqueen_bunker_general_chat", JSON.stringify(updatedChat));

    setTimeout(() => {
      const responseNames = ["CYPHER_REBEL", "MARKET_RUNNER", "WASTE_STALKER"];
      const responseTexts = [
        "DIRECTIVE PARAMETERS LOCK ACQUIRED.",
        "WATER MINIMUMS DYNAMICALLY MODIFIED.",
        "ARENA ENCOUNTERS ENFORCED."
      ];
      const botMsg: ChatMessage = {
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        sender: responseNames[Math.floor(Math.random() * responseNames.length)],
        text: responseTexts[Math.floor(Math.random() * responseTexts.length)]
      };
      const finalChat = [...updatedChat, botMsg];
      setChatMessages(finalChat);
      localStorage.setItem("redqueen_bunker_general_chat", JSON.stringify(finalChat));
    }, 1200);
  };

  const runDecryptionSimulation = () => {
    if (decryptionAttempts <= 0) {
      setCliHistory(prev => [...prev, ">> ERROR: DECRYPTION EXHAUSTED (0/5).", "RECHARGE VIA Staking."]);
      return;
    }

    setIsDecrypting(true);
    const newAttempts = decryptionAttempts - 1;
    setDecryptionAttempts(newAttempts);
    localStorage.setItem("redqueen_bunker_decryption_attempts", String(newAttempts));

    setCliHistory(prev => [...prev, ">> BYPASS INITIATED...", "CONNECTING TO NODE 0x4FF8..."]);

    let count = 0;
    const interval = setInterval(() => {
      const hexLines = [
        `[ SCANNING ] SECTOR_${Math.floor(Math.random() * 20)}...`,
        `[ BYPASSING ] PACKETS: ${Math.floor(Math.random() * 1000)} / 1000`,
        `[ DECRYPTING ] KEY MATCH: ${(50 + Math.random() * 45).toFixed(2)}%`
      ];
      setCliHistory(prev => [...prev, hexLines[count % hexLines.length]]);
      count++;

      if (count >= 3) {
        clearInterval(interval);
        setIsDecrypting(false);
        const success = Math.random() > 0.15;
        if (success) {
          setCliHistory(prev => [...prev, ">> SUCCESS: Coordinates decoded (45.1092, -122.6801). Target Audited.", "READY."]);
        } else {
          setCliHistory(prev => [...prev, ">> FAILED: EM interference signal loss.", "READY."]);
        }
      }
    }, 600);
  };

  const handleCliSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!cliInput.trim() || isDecrypting) return;

    const cmd = cliInput.trim().toLowerCase();
    const updatedHistory = [...cliHistory, `guest@redqueen:~$ ${cliInput}`];
    setCliHistory(updatedHistory);
    setCliInput("");

    setTimeout(() => {
      if (cmd === "help") {
        setCliHistory(prev => [
          ...prev,
          "SYSTEM UTILITIES:",
          "  help     - Display helper command log",
          "  clear    - Clear console display logs",
          "  status   - Diagnostic check on current server grid",
          "  scan     - Sweep surrounding sector arrays for Target Audits",
          "  decrypt  - Attempt bypass decryption core"
        ]);
      } else if (cmd === "clear") {
        setCliHistory([]);
      } else if (cmd === "status") {
        setCliHistory(prev => [
          ...prev,
          `SYSTEM STABLE. PLEDGE: ${selectedFaction.name}. ESCROW: ${stakedThreat}T. SHIELD: ${shieldIntegrity}%.`
        ]);
      } else if (cmd === "scan") {
        setCliHistory(prev => [
          ...prev,
          "SWEEPING SYSTEM SECTORS...",
          "  TARGET: MARAUDER_BLADE [GRID_18.2] (120 $THREAT)",
          "  TARGET: COLLECTIVE_U04 [GRID_4.5] (250 $THREAT)"
        ]);
      } else if (cmd === "decrypt") {
        runDecryptionSimulation();
      } else {
        setCliHistory(prev => [...prev, `>> COMMAND NOT RECOGNIZED: '${cmd}'`]);
      }
    }, 150);
  };

  const runQuickCommand = (cmd: string) => {
    if (isDecrypting) return;
    setCliHistory(prev => [...prev, `guest@redqueen:~$ ${cmd}`]);
    setTimeout(() => {
      if (cmd === "help") {
        setCliHistory(prev => [
          ...prev,
          "SYSTEM UTILITIES:",
          "  help     - Display helper command log",
          "  clear    - Clear console display logs",
          "  status   - Diagnostic check on current server grid",
          "  scan     - Sweep surrounding sector arrays for Target Audits",
          "  decrypt  - Attempt bypass decryption core"
        ]);
      } else if (cmd === "status") {
        setCliHistory(prev => [
          ...prev,
          `SYSTEM STABLE. PLEDGE: ${selectedFaction.name}. ESCROW: ${stakedThreat}T. SHIELD: ${shieldIntegrity}%.`
        ]);
      } else if (cmd === "scan") {
        setCliHistory(prev => [
          ...prev,
          "SWEEPING SYSTEM SECTORS...",
          "  TARGET: MARAUDER_BLADE [GRID_18.2] (120 $THREAT)",
          "  TARGET: COLLECTIVE_U04 [GRID_4.5] (250 $THREAT)"
        ]);
      } else if (cmd === "decrypt") {
        runDecryptionSimulation();
      }
    }, 150);
  };

  return (
    <div id="game-bunker-root" style={{ background: "#030303", minHeight: "100vh", color: "#ffffff", fontFamily: "Rajdhani, sans-serif", padding: "30px 24px", position: "relative", boxSizing: "border-box", overflowX: "hidden" }}>
      {/* Ambient Edge Blooms */}
      <div className="hud-ambient-crimson-left" />
      <div className="hud-ambient-white-right" />

      {/* CRT Scanline */}
      <div className="hud-scanline" />
      
      {/* 40px HUD grid */}
      <div style={{
        position: "absolute",
        top: 0, left: 0, right: 0, bottom: 0,
        backgroundImage: "linear-gradient(rgba(255, 0, 60, 0.006) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 0, 60, 0.006) 1px, transparent 1px)",
        backgroundSize: "40px 40px",
        pointerEvents: "none",
        zIndex: 1
      }} />

      {/* Red perimeter borders */}
      <div style={{ position: "absolute", top: "12px", left: "12px", right: "12px", bottom: "12px", border: "1px solid rgba(255, 0, 60, 0.06)", pointerEvents: "none", zIndex: 10 }} />

      {/* CHARACTER A BLUEPRINT (LEFT BACKGROUND) */}
      <div 
        className="hud-silhouette-left"
        style={{
          position: "absolute",
          bottom: "0px",
          left: "-5vw",
          width: "40vw",
          height: "90vh",
          backgroundImage: "url(/images/redqueen_silhouette.png)",
          backgroundSize: "contain",
          backgroundPosition: "left bottom",
          backgroundRepeat: "no-repeat",
          zIndex: 2,
          opacity: 0.3,
          pointerEvents: "none"
        }} 
      />

      {/* CHARACTER B BLUEPRINT (RIGHT BACKGROUND) */}
      <div 
        className="hud-silhouette-right"
        style={{
          position: "absolute",
          bottom: "0px",
          right: "-5vw",
          width: "40vw",
          height: "90vh",
          backgroundImage: "url(/images/soldier_silhouette.png)",
          backgroundSize: "contain",
          backgroundPosition: "right bottom",
          backgroundRepeat: "no-repeat",
          zIndex: 2,
          opacity: 0.3,
          pointerEvents: "none"
        }} 
      />

      {/* HEADER */}
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(255, 0, 60, 0.08)", paddingBottom: "12px", zIndex: 20, position: "relative", marginBottom: "24px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
          <span className="font-orbitron" style={{ color: "#ff003c", fontWeight: "900", fontSize: "20px", letterSpacing: "0.2em" }}>
            &gt; RED QUEEN CORE // BUNKER MONITOR
          </span>
          <div className="font-oxanium" style={{ display: "flex", gap: "16px", fontSize: "13px", fontWeight: "bold" }}>
            <Link href="/" style={{ color: "#8a8a8a", textDecoration: "none" }} className="hover-glow">[ DISCONNECT_HUB ]</Link>
          </div>
        </div>
        
        <div className="font-rajdhani" style={{ display: "flex", alignItems: "center", gap: "20px", fontSize: "13px", color: "#8a8a8a", letterSpacing: "0.15em", fontWeight: 700 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ color: "#ff003c", animation: "hud-blink 1.5s infinite" }}>●</span>
            <span style={{ color: "#ffffff" }}>GRID STATUS: STABLE</span>
          </div>
          <span>BETA NODE_v7.4.1</span>
          <span style={{ color: "#ff003c" }}>|</span>
          <span style={{ color: "#ffffff" }}>ID: <span style={{ color: "#ff003c" }}>{profileName}</span></span>
        </div>
      </header>

      {/* OPERATIONS CONSOLE - LARGE SCROLLABLE TILES */}
      <main style={{ display: "grid", gridTemplateColumns: "1fr 1.25fr 1fr", gap: "24px", minHeight: "0", zIndex: 10, position: "relative", alignItems: "start" }}>
        
        {/* LEFT COLUMN: FACTION REGISTRY CARD */}
        <div className="hud-panel" style={{ border: "1px solid rgba(255, 0, 60, 0.08)", background: "rgba(3, 3, 3, 0.35)", padding: "20px", display: "flex", flexDirection: "column", gap: "16px", backdropFilter: "blur(4px)" }}>
          <h2 className="font-orbitron" style={{ fontSize: "16px", color: "#ff003c", margin: 0, letterSpacing: "0.15em", fontWeight: 900 }}>
            [ 01. FACTION SELECTOR ]
          </h2>
          <p className="font-rajdhani" style={{ fontSize: "13px", color: "#8a8a8a", margin: 0, letterSpacing: "0.08em", fontWeight: 600 }}>
            PLEDGE STANDING MATRIX FOR ACTIVE STAT MODIFIERS:
          </p>

          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {FACTIONS.map(f => {
              const isSelected = selectedFaction.id === f.id;
              return (
                <div
                  key={f.id}
                  onClick={() => setSelectedFaction(f)}
                  style={{
                    border: `1px solid ${isSelected ? "#ff003c" : "rgba(255, 255, 255, 0.08)"}`,
                    background: isSelected ? "rgba(255, 0, 60, 0.08)" : "rgba(5, 5, 5, 0.6)",
                    padding: "12px 14px",
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                    display: "flex",
                    flexDirection: "column",
                    gap: "4px"
                  }}
                  className="hover-glow"
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span className="font-orbitron" style={{ fontSize: "14px", color: isSelected ? "#ff003c" : "#ffffff", fontWeight: 700 }}>
                      {f.name}
                    </span>
                    <span className="font-oxanium" style={{
                      fontSize: "10px",
                      color: "#ffffff",
                      border: "1px solid rgba(255,255,255,0.2)",
                      padding: "2px 8px",
                      fontWeight: 900
                    }}>
                      {f.startingItem.toUpperCase()}
                    </span>
                  </div>
                  <div className="font-rajdhani" style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "rgba(255,255,255,0.7)", letterSpacing: "0.05em" }}>
                    <span>{f.passiveFormula}</span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Dossier Detail */}
          <div style={{ borderTop: "1px solid rgba(255, 0, 60, 0.08)", paddingTop: "14px" }}>
            <div className="font-orbitron" style={{ fontSize: "12px", color: "#ff003c", fontWeight: 900, letterSpacing: "0.1em", marginBottom: "4px" }}>
              // FACTION MISSION SCHEMATIC
            </div>
            <div style={{ fontSize: "14px", color: "#ffffff", lineHeight: "1.4", marginBottom: "8px" }}>
              {selectedFaction.description}
            </div>
            <div className="font-oxanium" style={{ fontSize: "12px", color: "#8a8a8a" }}>
              STRUCTURAL WEAKNESS: <span style={{ color: "#ff003c" }}>{selectedFaction.weakness}</span>
            </div>
          </div>
        </div>

        {/* CENTER COLUMN: MAIN DISPLAY SCANNER & HACKING TERMINAL */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          
          {/* Main Visual Display */}
          <div className="hud-panel" style={{ border: "1px solid rgba(255, 0, 60, 0.08)", background: "rgba(3, 3, 3, 0.35)", padding: "20px", display: "flex", flexDirection: "column", gap: "16px", backdropFilter: "blur(4px)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(255, 0, 60, 0.08)", paddingBottom: "8px" }}>
              <span className="font-orbitron" style={{ fontSize: "15px", color: "#ff003c", fontWeight: "900", letterSpacing: "0.15em" }}>
                [ 02. CORE DEPIN SECTOR MONITOR ]
              </span>
              <div className="font-oxanium" style={{ display: "flex", gap: "4px" }}>
                <button
                  onClick={() => setCenterTab("RADAR")}
                  style={{
                    background: centerTab === "RADAR" ? "#ff003c" : "transparent",
                    color: centerTab === "RADAR" ? "#ffffff" : "#ff003c",
                    border: "1px solid #ff003c",
                    fontSize: "11px",
                    padding: "4px 12px",
                    cursor: "pointer",
                    fontWeight: 700
                  }}
                >
                  RADAR
                </button>
                <button
                  onClick={() => setCenterTab("SHIELD")}
                  style={{
                    background: centerTab === "SHIELD" ? "#ff003c" : "transparent",
                    color: centerTab === "SHIELD" ? "#ffffff" : "#ff003c",
                    border: "1px solid #ff003c",
                    fontSize: "11px",
                    padding: "4px 12px",
                    cursor: "pointer",
                    fontWeight: 700
                  }}
                >
                  SHIELD CELLS
                </button>
              </div>
            </div>

            <div style={{ height: "260px", display: "flex", justifyContent: "center", alignItems: "center", position: "relative" }}>
              {centerTab === "RADAR" ? (
                <div style={{ position: "relative", width: "240px", height: "240px", display: "flex", justifyContent: "center", alignItems: "center" }}>
                  <svg width="240" height="240" viewBox="0 0 220 220" style={{ position: "absolute", overflow: "visible" }}>
                    <circle cx="110" cy="110" r="100" fill="none" stroke="rgba(255, 0, 60, 0.15)" strokeWidth="1" />
                    <circle cx="110" cy="110" r="75" fill="none" stroke="rgba(255, 0, 60, 0.1)" strokeWidth="1" strokeDasharray="4 4" />
                    <circle cx="110" cy="110" r="50" fill="none" stroke="rgba(255, 0, 60, 0.12)" strokeWidth="1" />
                    <line x1="10" y1="110" x2="210" y2="110" stroke="rgba(255, 0, 60, 0.2)" strokeWidth="1" />
                    <line x1="110" y1="10" x2="110" y2="210" stroke="rgba(255, 0, 60, 0.2)" strokeWidth="1" />
                    <circle cx="60" cy="80" r="4" fill="#ff003c" filter="drop-shadow(0 0 5px #ff003c)" className="hud-blink-fast" />
                    <text x="66" y="76" fill="#ff003c" fontSize="9" fontFamily="monospace">TRG_01_BLADE</text>
                    <circle cx="160" cy="140" r="4" fill="#ff003c" opacity="0.8" />
                    <text x="166" y="136" fill="#8a8a8a" fontSize="9" fontFamily="monospace">TRG_02_COLL</text>
                    <circle cx="130" cy="50" r="3" fill="#ffffff" className="hud-blink-fast" />
                  </svg>

                  <div style={{
                    width: "220px", height: "220px",
                    borderRadius: "50%",
                    background: "conic-gradient(rgba(255, 0, 60, 0.18) 0deg, rgba(255, 0, 60, 0) 90deg, transparent 360deg)",
                    position: "absolute",
                    animation: "spin 4s linear infinite",
                    pointerEvents: "none"
                  }} />
                  <style jsx>{`
                    @keyframes spin {
                      from { transform: rotate(0deg); }
                      to { transform: rotate(360deg); }
                    }
                  `}</style>

                  <div className="font-orbitron" style={{ zIndex: 10, background: "rgba(3,3,3,0.95)", border: "1px solid #ff003c", padding: "10px 16px", textAlign: "center", minWidth: "140px", boxShadow: "0 0 12px rgba(255, 0, 60, 0.3)" }}>
                    <div style={{ fontSize: "10px", color: "#8a8a8a" }}>HAZARD RATIO</div>
                    <div style={{ fontSize: "22px", color: "#ff003c", fontWeight: "900" }}>94.2%</div>
                  </div>
                </div>
              ) : (
                <div style={{ position: "relative", width: "240px", height: "180px", display: "flex", justifyContent: "center", alignItems: "center" }}>
                  <svg width="240" height="180" viewBox="0 0 240 180">
                    <defs>
                      <pattern id="hexagons" width="30" height="52" patternUnits="userSpaceOnUse" patternTransform="scale(0.8)">
                        <path d="M15 0 L30 8.6 L30 25.8 L15 34.4 L0 25.8 L0 8.6 Z" fill="none" stroke="#ff003c" strokeWidth="1.2" strokeOpacity={shieldIntegrity / 100} />
                      </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#hexagons)" />
                    <ellipse cx="120" cy="90" rx="90" ry="70" fill="none" stroke="#ff003c" strokeWidth="2.5" strokeDasharray="5 5" style={{ opacity: shieldIntegrity / 100, filter: "drop-shadow(0 0 8px #ff003c)" }} />
                  </svg>
                  
                  <div className="font-orbitron" style={{ position: "absolute", zIndex: 10, background: "rgba(3,3,3,0.95)", border: "1px solid #ff003c", padding: "10px 16px", textAlign: "center", minWidth: "140px" }}>
                    <div style={{ fontSize: "10px", color: "#8a8a8a" }}>SHIELD SECURITY</div>
                    <div style={{ fontSize: "22px", color: "#ffffff", fontWeight: "900" }}>{shieldIntegrity}%</div>
                  </div>
                </div>
              )}
            </div>

            <div style={{ background: "rgba(5, 5, 5, 0.8)", border: "1px solid rgba(255,0,60,0.08)", padding: "16px", borderRadius: "2px" }}>
              <div className="font-rajdhani" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px", fontWeight: 700, letterSpacing: "0.08em" }}>
                <span>STAKED $THREAT LOCK:</span>
                <span className="font-orbitron" style={{ fontSize: "16px", color: "#ff003c", fontWeight: "bold" }}>{stakedThreat} THREAT</span>
              </div>
              <input
                type="range"
                min="0"
                max="1000"
                value={stakedThreat}
                onChange={(e) => setStakedThreat(Number(e.target.value))}
                style={{
                  width: "100%",
                  accentColor: "#ff003c",
                  cursor: "pointer",
                  height: "6px",
                  background: "rgba(255, 255, 255, 0.15)"
                }}
              />
              <div className="font-oxanium" style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "#8a8a8a", marginTop: "4px" }}>
                <span>0 THREAT</span>
                <span>1000 THREAT</span>
              </div>
            </div>
          </div>

          {/* Interactive Hacking Terminal CLI */}
          <div className="hud-panel" style={{ border: "1px solid rgba(255, 0, 60, 0.08)", background: "rgba(3, 3, 3, 0.35)", height: "230px", padding: "16px", display: "flex", flexDirection: "column", justifyContent: "space-between", backdropFilter: "blur(4px)" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(255, 0, 60, 0.08)", paddingBottom: "6px", marginBottom: "8px" }}>
              <span className="font-orbitron" style={{ fontSize: "13px", color: "#ff003c", fontWeight: "900", letterSpacing: "0.1em" }}>
                [ 03. CLI DECRYPTION OVERRIDE ]
              </span>
              <span className="font-oxanium" style={{ fontSize: "12px", color: "#8a8a8a" }}>
                DECRYPTS: <span style={{ color: decryptionAttempts > 0 ? "#ffffff" : "#ff003c", fontWeight: "bold" }}>{decryptionAttempts} / 5</span>
              </span>
            </div>

            <div className="font-orbitron" style={{ display: "flex", gap: "6px", marginBottom: "8px" }}>
              <button onClick={() => runQuickCommand("help")} disabled={isDecrypting} style={{ flex: 1, fontSize: "11px", border: "1px solid rgba(255,0,60,0.15)", background: "rgba(5,5,5,0.75)", color: "#ff003c", padding: "4px 0", cursor: "pointer" }}>[ HELP ]</button>
              <button onClick={() => runQuickCommand("status")} disabled={isDecrypting} style={{ flex: 1, fontSize: "11px", border: "1px solid rgba(255,0,60,0.15)", background: "rgba(5,5,5,0.75)", color: "#ff003c", padding: "4px 0", cursor: "pointer" }}>[ STATUS ]</button>
              <button onClick={() => runQuickCommand("scan")} disabled={isDecrypting} style={{ flex: 1, fontSize: "11px", border: "1px solid rgba(255,0,60,0.15)", background: "rgba(5,5,5,0.75)", color: "#ff003c", padding: "4px 0", cursor: "pointer" }}>[ SCAN ]</button>
              <button onClick={() => runQuickCommand("decrypt")} disabled={isDecrypting} style={{ flex: 1, fontSize: "11px", border: "1px solid #ff003c", background: "rgba(255,0,60,0.2)", color: "#ffffff", padding: "4px 0", cursor: "pointer" }}>[ DECRYPT ]</button>
            </div>

            <div className="hud-scrollbar" style={{ overflowY: "auto", flexGrow: 1, fontSize: "12px", fontFamily: "monospace", display: "flex", flexDirection: "column", gap: "2px", marginBottom: "6px", paddingRight: "4px", color: "#ffffff" }}>
              {cliHistory.map((line, idx) => (
                <div key={idx} style={{ wordBreak: "break-all", whiteSpace: "pre-wrap" }}>{line}</div>
              ))}
              <div ref={cliEndRef} />
            </div>

            <form onSubmit={handleCliSubmit} style={{ display: "flex", border: "1px solid rgba(255, 0, 60, 0.15)", background: "#050505" }}>
              <span style={{ color: "#ff003c", fontFamily: "monospace", padding: "6px 0 6px 8px", fontSize: "12px" }}>guest@redqueen:~$</span>
              <input
                type="text"
                value={cliInput}
                onChange={(e) => setCliInput(e.target.value)}
                disabled={isDecrypting}
                placeholder="INPUT MATRIX DIRECTIVE..."
                style={{ flexGrow: 1, background: "transparent", border: "none", color: "#ffffff", fontFamily: "monospace", fontSize: "12px", padding: "6px 8px", outline: "none" }}
              />
            </form>
          </div>

        </div>

        {/* RIGHT COLUMN: DIRECTIVES, TELEMETRY, ENLARGED CHAT & PORTAL */}
        <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
          
          {/* Directives & Target Board */}
          <div className="hud-panel" style={{ border: "1px solid rgba(255, 0, 60, 0.08)", background: "rgba(3, 3, 3, 0.35)", padding: "16px", display: "flex", flexDirection: "column", gap: "10px", backdropFilter: "blur(4px)" }}>
            <div>
              <span className="font-orbitron hud-blink-fast" style={{ fontSize: "13px", color: "#ff003c", fontWeight: "900", letterSpacing: "0.1em", display: "block" }}>
                ⚠️ ACTIVE CORE DIRECTIVE
              </span>
              <div style={{ background: "rgba(255,0,60,0.06)", border: "1px solid rgba(255,0,60,0.12)", padding: "10px", marginTop: "6px", fontSize: "13px", color: "#ffffff", lineHeight: "1.4" }}>
                &gt; DIRECTIVE: SECURE SATELLITE RELAY AT COORDINATES <span style={{ color: "#ff003c", fontWeight: "bold" }}>45.1092, -122.6801</span> WITHIN 12 HOURS. +10% BIO-SCORE RECOVERY.
              </div>
            </div>

            <div style={{ borderTop: "1px dashed rgba(255,0,60,0.2)", paddingTop: "10px" }}>
              <span className="font-orbitron" style={{ fontSize: "12px", color: "#8a8a8a", fontWeight: "900", letterSpacing: "0.15em", display: "block", marginBottom: "6px" }}>
                ACTIVE RISK AUDITS (BOUNTIES)
              </span>
              <div className="font-rajdhani" style={{ display: "flex", flexDirection: "column", gap: "6px", fontWeight: 700 }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "13px", background: "rgba(5,5,5,0.8)", padding: "6px 10px", border: "1px solid rgba(255,255,255,0.05)" }}>
                  <span>1. MARAUDER_BLADE [GRID_18.2]</span>
                  <span style={{ color: "#ff003c", fontWeight: "bold" }}>120 THREAT</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "13px", background: "rgba(5,5,5,0.8)", padding: "6px 10px", border: "1px solid rgba(255,255,255,0.05)" }}>
                  <span>2. COLLECTIVE_U04 [GRID_4.5]</span>
                  <span style={{ color: "#ff003c", fontWeight: "bold" }}>250 THREAT</span>
                </div>
              </div>
            </div>
          </div>

          {/* Resources Monitor */}
          <div className="hud-panel" style={{ border: "1px solid rgba(255, 0, 60, 0.08)", background: "rgba(3, 3, 3, 0.35)", padding: "16px", backdropFilter: "blur(4px)" }}>
            <span className="font-orbitron" style={{ fontSize: "13px", color: "#ff003c", fontWeight: "900", letterSpacing: "0.1em", display: "block", marginBottom: "12px" }}>
              RESOURCE SYSTEM LEVELS
            </span>
            <div className="font-rajdhani" style={{ display: "flex", flexDirection: "column", gap: "10px", fontWeight: 700 }}>
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "#8a8a8a" }}>
                  <span>WATER LEVELS SUPPLY</span>
                  <span style={{ color: "#ffffff" }}>{waterLevel}%</span>
                </div>
                <div style={{ height: "5px", background: "rgba(255,255,255,0.05)", marginTop: "4px" }}>
                  <div style={{ height: "100%", width: `${waterLevel}%`, background: "#ff003c", boxShadow: "0 0 8px #ff003c" }} />
                </div>
              </div>
              
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "#8a8a8a" }}>
                  <span>FOOD PROVISIONS</span>
                  <span style={{ color: "#ffffff" }}>{foodLevel}%</span>
                </div>
                <div style={{ height: "5px", background: "rgba(255,255,255,0.05)", marginTop: "4px" }}>
                  <div style={{ height: "100%", width: `${foodLevel}%`, background: "#ff003c", boxShadow: "0 0 8px #ff003c" }} />
                </div>
              </div>

              <div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", color: "#8a8a8a" }}>
                  <span>GRID ELECTROMAGNETIC INPUT</span>
                  <span style={{ color: "#ffffff" }}>{powerGrid}%</span>
                </div>
                <div style={{ height: "5px", background: "rgba(255,255,255,0.05)", marginTop: "4px" }}>
                  <div style={{ height: "100%", width: `${powerGrid}%`, background: "#ff003c", boxShadow: "0 0 8px #ff003c" }} />
                </div>
              </div>
            </div>
          </div>

          {/* Persistent General Chat (Enlarged to 350px height) */}
          <div className="hud-panel" style={{ border: "1px solid rgba(255, 0, 60, 0.08)", background: "rgba(3, 3, 3, 0.35)", height: "350px", padding: "16px", display: "flex", flexDirection: "column", justifyContent: "space-between", backdropFilter: "blur(4px)" }}>
            <span className="font-orbitron" style={{ fontSize: "13px", color: "#ff003c", fontWeight: "900", letterSpacing: "0.15em", borderBottom: "1px solid rgba(255,0,60,0.18)", paddingBottom: "6px", marginBottom: "10px", display: "block" }}>
              ● GENERAL SECURE CHANNEL (PERSISTENT LOG)
            </span>

            {/* Chat Messages */}
            <div className="hud-scrollbar" style={{ overflowY: "auto", flexGrow: 1, fontSize: "13px", display: "flex", flexDirection: "column", gap: "6px", marginBottom: "10px", paddingRight: "4px", fontFamily: "monospace" }}>
              {chatMessages.map((msg, i) => (
                <div key={i} style={{ lineHeight: "1.4" }}>
                  <span style={{ color: "rgba(255,255,255,0.25)", marginRight: "8px" }}>[{msg.time}]</span>
                  <span style={{ color: msg.color || "#ff003c", fontWeight: "bold", marginRight: "8px" }}>{msg.sender}:</span>
                  <span style={{ color: "rgba(255,255,255,0.9)" }}>{msg.text}</span>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>

            <form onSubmit={handleSendChat} style={{ display: "flex", border: "1px solid rgba(255,0,60,0.25)", background: "#050505" }}>
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="BROADCAST UPLINK DIRECTION..."
                style={{ flexGrow: 1, background: "transparent", border: "none", color: "#ffffff", fontFamily: "monospace", fontSize: "12px", padding: "8px 10px", outline: "none", textTransform: "uppercase" }}
              />
            </form>
          </div>

          {/* Action Gateway Portal */}
          <Link
            href="/arena"
            className="hud-btn font-orbitron"
            style={{
              display: "block",
              textAlign: "center",
              fontSize: "15px",
              padding: "16px",
              textDecoration: "none",
              boxShadow: "0 0 16px rgba(255, 0, 60, 0.55)",
              fontWeight: 900
            }}
          >
            [ ENTER P2P BATTLE ARENA ]
          </Link>

        </div>

      </main>

      {/* TECHNICAL HUD FOOTER */}
      <footer className="font-oxanium" style={{ borderTop: "1px solid rgba(255, 0, 60, 0.08)", paddingTop: "12px", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "12px", color: "rgba(255,255,255,0.35)", letterSpacing: "0.2em", marginTop: "24px" }}>
        <span>SEC_SYS: STABLE // SCANNER_LOCK: DEPIN_ON</span>
        <span>SYS_VER: 7.4.1 // APOCALYPSE_NODE_ONLINE</span>
      </footer>
    </div>
  );
}
