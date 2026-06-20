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
    description: "Baseline human refugees conserving resources and conserving grid equipment."
  },
  {
    id: "nomads",
    name: "NOMADS",
    themeColor: "#8b5a2b",
    startingItem: "Compass",
    passiveFormula: "Resource Scavenger (Yield = Base * 1.15)",
    weakness: "Physical armor rating reduced by 15%",
    description: "Wasteland scouts utilizing recovery optics and sector map trackers."
  },
  {
    id: "marauders",
    name: "MARAUDERS",
    themeColor: "#cc0000",
    startingItem: "Spiked Vest",
    passiveFormula: "Vandal Vector (Damage = Base * 1.10)",
    weakness: "Predictable attack target selector",
    description: "Aggressive front-line combatants raiding disputed infrastructure deposits."
  },
  {
    id: "scientists",
    name: "SCIENTISTS",
    themeColor: "#00a8ff",
    startingItem: "Slate",
    passiveFormula: "Blueprint Opt (Decode Time = Base * 0.80)",
    weakness: "Physical health max capacity reduced by 10%",
    description: "Cryptographic analysts utilizing pre-collapse data nodes and satellites."
  },
  {
    id: "governments",
    name: "GOVERNMENTS",
    themeColor: "#5c6b73",
    startingItem: "Comms Badge",
    passiveFormula: "Tactical Intercept (Reduces target escape chance)",
    weakness: "Speed and initiative checks penalized by 10%",
    description: "Organized military units trying to reclaim grid infrastructure."
  },
  {
    id: "engineers",
    name: "ENGINEERS",
    themeColor: "#ff6b00",
    startingItem: "Heavy Wrench",
    passiveFormula: "Structural Fort (Build Cost = Base * 0.85)",
    weakness: "Combat critical damage multiplier capped at 1.2x",
    description: "Hardware operators maintaining DePIN towers and shield configurations."
  },
  {
    id: "hackers",
    name: "HACKERS",
    themeColor: "#00ff00",
    startingItem: "Decryption Rig",
    passiveFormula: "Forecast Bypass (Predicts environmental anomalies 48h in advance)",
    weakness: "Physical melee combat damage reduced by 25%",
    description: "Infiltrators bypassing satellite encryptions and network hubs."
  },
  {
    id: "syndicates",
    name: "BUNKER SYNDICATES",
    themeColor: "#d4af37",
    startingItem: "Energy Shield",
    passiveFormula: "Escrow Shield (Shield Capacity = Base * 1.20)",
    weakness: "Equipment maintenance fees increased by 15%",
    description: "Wealthy bankers protecting local infrastructure nodes and vaults."
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
  { time: "01:14", sender: "NET_VIPER", text: "HACKERS FORECASTING DUST STORM IN 24H. SECURE TRANSMISSION LINES." },
  { time: "01:15", sender: "REDQUEEN_AI", text: "DIRECTIVE 4409 INITIATED. REPORT COGNITIVE FLUCTUATION.", color: "#ff003c" }
];

export default function BunkerPage() {
  const { authIdentifier } = useAuth();
  const { publicKey } = useWallet();
  const currentWallet = authIdentifier || (publicKey ? publicKey.toString() : null);

  // Profile data loading
  const [profileName, setProfileName] = useState<string>("SURVIVOR_GUEST");
  
  // Game simulation state
  const [selectedFaction, setSelectedFaction] = useState<Faction>(FACTIONS[0]);
  const [stakedThreat, setStakedThreat] = useState<number>(150);
  const [shieldIntegrity, setShieldIntegrity] = useState<number>(65);

  // Resource telemetry fluctuating dynamically
  const [waterLevel, setWaterLevel] = useState<number>(45.5);
  const [foodLevel, setFoodLevel] = useState<number>(62.8);
  const [powerGrid, setPowerGrid] = useState<number>(78.2);

  // CLI hacking terminal state
  const [cliInput, setCliInput] = useState<string>("");
  const [cliHistory, setCliHistory] = useState<string[]>([
    "RED QUEEN MAIN CONTROL CONSOLE // NODE 7.4.1",
    "INITIALIZATION COMPLETED. READY FOR INPUT.",
    "TYPE 'help' FOR LIST OF SYSTEM UTILITIES."
  ]);
  const [decryptionAttempts, setDecryptionAttempts] = useState<number>(5);
  const [isDecrypting, setIsDecrypting] = useState<boolean>(false);

  // General Chat state
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatInput, setChatInput] = useState<string>("");
  
  // Center HUD active tab (RADAR vs SHIELD GRID)
  const [centerTab, setCenterTab] = useState<"RADAR" | "SHIELD">("RADAR");

  // DOM Refs for auto-scroll
  const chatEndRef = useRef<HTMLDivElement | null>(null);
  const cliEndRef = useRef<HTMLDivElement | null>(null);

  // Load profile name on mount/wallet change
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

  // Load chat and attempts from localStorage
  useEffect(() => {
    if (typeof window !== "undefined") {
      // General Chat history loading
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

      // Decryption attempts loading
      const cachedAttempts = localStorage.getItem("redqueen_bunker_decryption_attempts");
      if (cachedAttempts) {
        setDecryptionAttempts(Number(cachedAttempts));
      } else {
        setDecryptionAttempts(5);
        localStorage.setItem("redqueen_bunker_decryption_attempts", "5");
      }
    }
  }, []);

  // Calculate shield integrity dynamically based on staked amount + selected faction bonus
  useEffect(() => {
    const factionBonus = selectedFaction.id === "syndicates" ? 1.20 : 1.0;
    const baseShield = 25 * factionBonus;
    const calculatedShield = Math.min(99, Math.round(baseShield + Math.log2(stakedThreat + 1) * 8.5));
    setShieldIntegrity(calculatedShield);
  }, [stakedThreat, selectedFaction]);

  // Resource level live telemetry micro-fluctuations
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

  // Auto-scroll scrollable boxes
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

  useEffect(() => {
    cliEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [cliHistory]);

  // Send message in general chat
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

    // Simulated response to make chat look alive
    setTimeout(() => {
      const responseNames = ["OPERATOR_K4", "WASTE_STALKER", "CYPHER_REBEL", "MARKET_RUNNER"];
      const responseTexts = [
        "DIRECTIVE 4409 PARAMS LOOK SHIFTED. MONITOR BIO-SCORE.",
        "MARKET WATER FLOOR MARKUPS COMPLETED. SECURED 50% MINIMUM.",
        "ARENA WAGERS ARE HOT TODAY. WHO IS UP?",
        "DECRA RIG LOCKED. SYSTEM STATUS CALIBRATION IN PROGRESS."
      ];
      const botMsg: ChatMessage = {
        time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        sender: responseNames[Math.floor(Math.random() * responseNames.length)],
        text: responseTexts[Math.floor(Math.random() * responseTexts.length)]
      };
      const finalChat = [...updatedChat, botMsg];
      setChatMessages(finalChat);
      localStorage.setItem("redqueen_bunker_general_chat", JSON.stringify(finalChat));
    }, 1800);
  };

  // Run Hacking Decryption routine
  const runDecryptionSimulation = () => {
    if (decryptionAttempts <= 0) {
      setCliHistory(prev => [...prev, ">> ERROR: DAILY DECRYPTION ATTEMPTS EXHAUSTED (0/5).", "RECHARGE VIA Staking or Burning $THREAT."]);
      return;
    }

    setIsDecrypting(true);
    const newAttempts = decryptionAttempts - 1;
    setDecryptionAttempts(newAttempts);
    localStorage.setItem("redqueen_bunker_decryption_attempts", String(newAttempts));

    setCliHistory(prev => [...prev, ">> INITIATING MATRIX DECRYPTION BYPASS...", "CONNECTING TO DEPIN GATEWAY NODE 0x4FF8..."]);

    let count = 0;
    const interval = setInterval(() => {
      const hexLines = [
        `[ SCANNING NODE ] SECTOR_${Math.floor(Math.random() * 20)} ADDR_0x${Math.random().toString(16).substring(2, 6).toUpperCase()}...`,
        `[ BYPASSING ] PACKETS INGESTED: ${Math.floor(Math.random() * 1000)} / 1000`,
        `[ CRACKING KEY ] MATCH_RATE: ${(50 + Math.random() * 45).toFixed(2)}%`,
        `[ SHADOW STEP ] COGNITIVE ALGORITHM APPLIED...`
      ];
      setCliHistory(prev => [...prev, hexLines[count % hexLines.length]]);
      count++;

      if (count >= 5) {
        clearInterval(interval);
        setIsDecrypting(false);
        const success = Math.random() > 0.15;
        if (success) {
          const lootList = [
            "COGNITIVE DECRYPT SUCCESS: Satellite feed 18.2 unlocked. Sector coordinates: 45.1092, -122.6801.",
            "COGNITIVE DECRYPT SUCCESS: Unlocked Government transmission badge: 'EMERGENCY PROTOCOL SHUTDOWN LEVEL 5'.",
            "COGNITIVE DECRYPT SUCCESS: DePIN signal unlocked. Captured Target Audit: OPERATOR_BLADE flagged at Sector Alpha.",
            "COGNITIVE DECRYPT SUCCESS: Cybernetic schematic unlocked. Blueprint 'PLASMA CUTTER HARNESS' downloaded."
          ];
          setCliHistory(prev => [...prev, `>> ${lootList[Math.floor(Math.random() * lootList.length)]}`, "DECRYPTION CYCLE TERMINATED. READY."]);
        } else {
          setCliHistory(prev => [...prev, ">> DECRYPTION FAILED. SIGNAL DEGRADED BY SOLAR EM INTERFERENCE.", "DECRYPTION CYCLE TERMINATED. READY."]);
        }
      }
    }, 600);
  };

  // Submit terminal command
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
          "AVAILABLE HUD SYSTEM UTILITIES:",
          "  help     - Display this helper command log",
          "  clear    - Clear console display logs",
          "  status   - Diagnostic check on current server grid",
          "  scan     - Sweep surrounding sector arrays for Target Audits",
          "  decrypt  - Attempt bypass decryption core (5 daily limits)"
        ]);
      } else if (cmd === "clear") {
        setCliHistory([]);
      } else if (cmd === "status") {
        setCliHistory(prev => [
          ...prev,
          `SYSTEM DIAGNOSTICS: STABLE`,
          `  OPERATIVE PROFILE: ${profileName}`,
          `  faction pledge: ${selectedFaction.name}`,
          `  escrow stake: ${stakedThreat} $THREAT`,
          `  shield cells: ${shieldIntegrity}% integrity calibrated`,
          `  resources: Water ${waterLevel}%, Food ${foodLevel}%, EM Grid ${powerGrid}%`
        ]);
      } else if (cmd === "scan") {
        setCliHistory(prev => [
          ...prev,
          "SWEEPING SYSTEM SECTORS...",
          "  TARGET FOUND: MARAUDER_BLADE [THREAT level 94%] at Sector GRID_18.2 [BOUNTY: 120 $THREAT]",
          "  TARGET FOUND: COLLECTIVE_UNIT_04 [THREAT level 89%] at Sector GRID_4.5 [BOUNTY: 250 $THREAT]",
          "READY."
        ]);
      } else if (cmd === "decrypt") {
        runDecryptionSimulation();
      } else {
        setCliHistory(prev => [...prev, `>> COMMAND NOT RECOGNIZED: '${cmd}'. TYPE 'help' FOR ASSISTANCE.`]);
      }
    }, 150);
  };

  // Quick action buttons for terminal
  const runQuickCommand = (cmd: string) => {
    if (isDecrypting) return;
    setCliHistory(prev => [...prev, `guest@redqueen:~$ ${cmd}`]);
    setTimeout(() => {
      if (cmd === "help") {
        setCliHistory(prev => [
          ...prev,
          "AVAILABLE HUD SYSTEM UTILITIES:",
          "  help     - Display this helper command log",
          "  clear    - Clear console display logs",
          "  status   - Diagnostic check on current server grid",
          "  scan     - Sweep surrounding sector arrays for Target Audits",
          "  decrypt  - Attempt bypass decryption core (5 daily limits)"
        ]);
      } else if (cmd === "status") {
        setCliHistory(prev => [
          ...prev,
          `SYSTEM DIAGNOSTICS: STABLE`,
          `  OPERATIVE PROFILE: ${profileName}`,
          `  faction pledge: ${selectedFaction.name}`,
          `  escrow stake: ${stakedThreat} $THREAT`,
          `  shield cells: ${shieldIntegrity}% integrity calibrated`,
          `  resources: Water ${waterLevel}%, Food ${foodLevel}%, EM Grid ${powerGrid}%`
        ]);
      } else if (cmd === "scan") {
        setCliHistory(prev => [
          ...prev,
          "SWEEPING SYSTEM SECTORS...",
          "  TARGET FOUND: MARAUDER_BLADE [THREAT level 94%] at Sector GRID_18.2 [BOUNTY: 120 $THREAT]",
          "  TARGET FOUND: COLLECTIVE_UNIT_04 [THREAT level 89%] at Sector GRID_4.5 [BOUNTY: 250 $THREAT]",
          "READY."
        ]);
      } else if (cmd === "decrypt") {
        runDecryptionSimulation();
      }
    }, 150);
  };

  return (
    <div id="game-bunker-root" style={{ background: "#000000", minHeight: "100vh", height: "100vh", color: "#ffffff", fontFamily: "Rajdhani, sans-serif", padding: "20px 24px", position: "relative", boxSizing: "border-box", overflow: "hidden", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
      {/* Fullscreen matrix grid scanlines overlays */}
      <div className="hud-scanline" />
      <div style={{
        position: "absolute",
        top: 0, left: 0, right: 0, bottom: 0,
        backgroundImage: "linear-gradient(rgba(255, 0, 60, 0.01) 1px, transparent 1px), linear-gradient(90deg, rgba(255, 0, 60, 0.01) 1px, transparent 1px)",
        backgroundSize: "40px 40px",
        pointerEvents: "none",
        zIndex: 1
      }} />

      {/* red glowing perimeter frame */}
      <div style={{ position: "absolute", top: "12px", left: "12px", right: "12px", bottom: "12px", border: "1px solid rgba(255, 0, 60, 0.15)", pointerEvents: "none", zIndex: 10 }} />
      {/* HUD tech corners */}
      <div style={{ position: "absolute", top: "10px", left: "10px", width: "16px", height: "16px", borderTop: "3px solid #ff003c", borderLeft: "3px solid #ff003c", zIndex: 11 }} />
      <div style={{ position: "absolute", top: "10px", right: "10px", width: "16px", height: "16px", borderTop: "3px solid #ff003c", borderRight: "3px solid #ff003c", zIndex: 11 }} />
      <div style={{ position: "absolute", bottom: "10px", left: "10px", width: "16px", height: "16px", borderBottom: "3px solid #ff003c", borderLeft: "3px solid #ff003c", zIndex: 11 }} />
      <div style={{ position: "absolute", bottom: "10px", right: "10px", width: "16px", height: "16px", borderBottom: "3px solid #ff003c", borderRight: "3px solid #ff003c", zIndex: 11 }} />

      {/* HEADER SECTION */}
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(255, 0, 60, 0.18)", paddingBottom: "10px", zIndex: 20, position: "relative" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
          <span style={{ color: "#ff003c", fontWeight: "900", fontSize: "18px", fontFamily: "Orbitron, sans-serif", textShadow: "0 0 10px rgba(255, 0, 60, 0.6)", letterSpacing: "0.2em" }}>
            &gt; RED QUEEN CORE // BUNKER MONITOR
          </span>
          <div style={{ display: "flex", gap: "16px", fontSize: "12px", fontFamily: "Rajdhani, sans-serif", letterSpacing: "0.15em", fontWeight: 700 }}>
            <Link href="/" style={{ color: "#8a8a8a", textDecoration: "none" }} className="hover-glow">[ DISCONNECT_HUB ]</Link>
          </div>
        </div>
        
        <div style={{ display: "flex", alignItems: "center", gap: "20px", fontSize: "12px", color: "#8a8a8a", fontFamily: "Rajdhani, sans-serif", letterSpacing: "0.15em", fontWeight: 700 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
            <span style={{ color: "#00ffcc", animation: "hud-blink 1.5s infinite" }}>●</span>
            <span style={{ color: "#ffffff" }}>GRID STATUS: STABLE</span>
          </div>
          <span>BETA NODE_v7.4.1</span>
          <span style={{ color: "#ff003c" }}>|</span>
          <span style={{ color: "#ffffff" }}>ID: <span style={{ color: "#ff003c" }}>{profileName}</span></span>
        </div>
      </header>

      {/* OPERATIONS CONSOLE - 3-COLUMN ASYMMETRICAL HUD */}
      <main style={{ display: "grid", gridTemplateColumns: "1fr 1.25fr 1fr", gap: "20px", flexGrow: 1, margin: "16px 0", minHeight: "0", zIndex: 10, position: "relative" }}>
        
        {/* LEFT COLUMN: FACTION DIRECTORY */}
        <div className="hud-panel" style={{ padding: "16px", display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
          <h2 style={{ fontFamily: "Orbitron, sans-serif", fontSize: "14px", color: "#ff003c", margin: "0 0 4px 0", letterSpacing: "0.15em", fontWeight: 900 }}>
            [ 01. FACTION REGISTRY ]
          </h2>
          <p style={{ fontSize: "12px", color: "#8a8a8a", margin: "0 0 12px 0", letterSpacing: "0.08em" }}>
            SELECT FACTION MATRIX TO PLEDGE ALLIANCE AND LOAD TRAITS:
          </p>

          {/* Scrollable list of 8 factions */}
          <div className="hud-scrollbar" style={{ display: "flex", flexDirection: "column", gap: "8px", overflowY: "auto", flexGrow: 1, paddingRight: "4px" }}>
            {FACTIONS.map(f => {
              const isSelected = selectedFaction.id === f.id;
              return (
                <div
                  key={f.id}
                  onClick={() => setSelectedFaction(f)}
                  style={{
                    border: `1px solid ${isSelected ? "#ff003c" : "rgba(255, 255, 255, 0.08)"}`,
                    background: isSelected ? "rgba(255, 0, 60, 0.07)" : "rgba(5, 5, 5, 0.6)",
                    padding: "10px 12px",
                    cursor: "pointer",
                    transition: "all 0.15s ease",
                    display: "flex",
                    flexDirection: "column",
                    gap: "4px"
                  }}
                  className="hover-glow"
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                    <span style={{ fontSize: "13px", fontFamily: "Orbitron, sans-serif", color: isSelected ? "#ff003c" : "#ffffff", fontWeight: 700, letterSpacing: "0.1em" }}>
                      {f.name}
                    </span>
                    <span style={{
                      fontSize: "10px",
                      color: "#000000",
                      background: f.themeColor,
                      padding: "1px 6px",
                      fontWeight: 900,
                      borderRadius: "1px",
                      fontFamily: "Orbitron, sans-serif"
                    }}>
                      {f.startingItem.toUpperCase()}
                    </span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "rgba(255,255,255,0.7)" }}>
                    <span>PASSIVE: <span style={{ color: "#ff003c", fontWeight: 600 }}>{f.passiveFormula}</span></span>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Selected Faction Dossier */}
          <div style={{ borderTop: "1px solid rgba(255, 0, 60, 0.18)", marginTop: "12px", paddingTop: "12px" }}>
            <div style={{ fontSize: "11px", color: "#ff003c", fontFamily: "Orbitron, sans-serif", fontWeight: 900, letterSpacing: "0.1em", marginBottom: "4px" }}>
              // FACTION RECON ARCHIVE
            </div>
            <div style={{ fontSize: "13px", color: "#ffffff", lineHeight: "1.4", marginBottom: "8px" }}>
              {selectedFaction.description}
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "2px", fontSize: "11px", fontFamily: "var(--mono), monospace", background: "rgba(5,5,5,0.8)", padding: "6px", border: "1px solid rgba(255,255,255,0.03)" }}>
              <div><span style={{ color: "#ff003c" }}>&gt; LIMITATION:</span> <span style={{ color: "#8a8a8a" }}>{selectedFaction.weakness}</span></div>
            </div>
          </div>
        </div>

        {/* CENTER COLUMN: MAIN SCANNER & HACKING CONSOLE */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px", height: "100%", minHeight: "0" }}>
          
          {/* Main Visual Display Shield/Radar */}
          <div className="hud-panel" style={{ flexGrow: 1, padding: "16px", display: "flex", flexDirection: "column", minHeight: "0" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(255, 0, 60, 0.15)", paddingBottom: "6px", marginBottom: "12px" }}>
              <span style={{ fontFamily: "Orbitron, sans-serif", fontSize: "13px", color: "#ff003c", fontWeight: "900", letterSpacing: "0.15em" }}>
                [ 02. CORE DEPIN SECTOR MONITOR ]
              </span>
              <div style={{ display: "flex", gap: "2px" }}>
                <button
                  onClick={() => setCenterTab("RADAR")}
                  style={{
                    background: centerTab === "RADAR" ? "#ff003c" : "transparent",
                    color: centerTab === "RADAR" ? "#ffffff" : "#ff003c",
                    border: "1px solid #ff003c",
                    fontSize: "10px",
                    fontFamily: "Orbitron, sans-serif",
                    padding: "2px 8px",
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
                    fontSize: "10px",
                    fontFamily: "Orbitron, sans-serif",
                    padding: "2px 8px",
                    cursor: "pointer",
                    fontWeight: 700
                  }}
                >
                  SHIELD CELLS
                </button>
              </div>
            </div>

            {/* Display Visual Area */}
            <div style={{ flexGrow: 1, display: "flex", justifyContent: "center", alignItems: "center", position: "relative" }}>
              {centerTab === "RADAR" ? (
                /* RADAR SCANNER */
                <div style={{ position: "relative", width: "220px", height: "220px", display: "flex", justifyContent: "center", alignItems: "center" }}>
                  <svg width="220" height="220" viewBox="0 0 220 220" style={{ position: "absolute", overflow: "visible" }}>
                    {/* Concentric rings */}
                    <circle cx="110" cy="110" r="100" fill="none" stroke="rgba(255, 0, 60, 0.12)" strokeWidth="1" />
                    <circle cx="110" cy="110" r="75" fill="none" stroke="rgba(255, 0, 60, 0.08)" strokeWidth="1" strokeDasharray="4 4" />
                    <circle cx="110" cy="110" r="50" fill="none" stroke="rgba(255, 0, 60, 0.1)" strokeWidth="1" />
                    <circle cx="110" cy="110" r="25" fill="none" stroke="rgba(255, 0, 60, 0.15)" strokeWidth="1" />

                    {/* Crosshairs */}
                    <line x1="10" y1="110" x2="210" y2="110" stroke="rgba(255, 0, 60, 0.15)" strokeWidth="1" />
                    <line x1="110" y1="10" x2="110" y2="210" stroke="rgba(255, 0, 60, 0.15)" strokeWidth="1" />

                    {/* Sweep scanner line */}
                    <circle cx="110" cy="110" r="100" fill="none" />
                    
                    {/* Dots representing anomalies/targets */}
                    <circle cx="60" cy="80" r="3" fill="#ff003c" filter="drop-shadow(0 0 5px #ff003c)" className="hud-blink-fast" />
                    <text x="65" y="77" fill="#ff003c" fontSize="8" fontFamily="monospace">TRG_01_BLADE</text>
                    
                    <circle cx="160" cy="140" r="3" fill="#ff003c" opacity="0.7" />
                    <text x="165" y="137" fill="#8a8a8a" fontSize="8" fontFamily="monospace">TRG_02_COLL</text>

                    <circle cx="130" cy="50" r="2" fill="#00ffcc" className="hud-blink-fast" />
                    <text x="135" y="47" fill="#00ffcc" fontSize="8" fontFamily="monospace">DEPIN_RELAY</text>
                  </svg>

                  {/* Rotating visual sweep overlay */}
                  <div style={{
                    width: "200px", height: "200px",
                    borderRadius: "50%",
                    background: "conic-gradient(rgba(255, 0, 60, 0.15) 0deg, rgba(255, 0, 60, 0) 90deg, transparent 360deg)",
                    position: "absolute",
                    animation: "spin 5s linear infinite",
                    pointerEvents: "none"
                  }} />
                  <style jsx>{`
                    @keyframes spin {
                      from { transform: rotate(0deg); }
                      to { transform: rotate(360deg); }
                    }
                  `}</style>

                  <div style={{ zIndex: 10, background: "rgba(3,3,3,0.95)", border: "1px solid #ff003c", padding: "8px 12px", textAlign: "center", minWidth: "120px", boxShadow: "0 0 10px rgba(255, 0, 60, 0.2)" }}>
                    <div style={{ fontSize: "9px", color: "#8a8a8a", fontFamily: "Orbitron, sans-serif" }}>HAZARD DETECTED</div>
                    <div style={{ fontSize: "18px", color: "#ff003c", fontWeight: "900", fontFamily: "Orbitron, sans-serif" }}>94.2%</div>
                  </div>
                </div>
              ) : (
                /* DEFENSIVE SHIELD GRID (HEXAGON MESH) */
                <div style={{ position: "relative", width: "240px", height: "180px", display: "flex", justifyContent: "center", alignItems: "center" }}>
                  <svg width="240" height="180" viewBox="0 0 240 180">
                    <defs>
                      <pattern id="hexagons" width="30" height="52" patternUnits="userSpaceOnUse" patternTransform="scale(0.8)">
                        <path d="M15 0 L30 8.6 L30 25.8 L15 34.4 L0 25.8 L0 8.6 Z" fill="none" stroke="#ff003c" strokeWidth="1" strokeOpacity={shieldIntegrity / 100} />
                        <path d="M15 51.6 L30 43 L30 25.8 L15 17.2 L0 25.8 L0 43 Z" fill="none" stroke="#ff003c" strokeWidth="1" strokeOpacity={shieldIntegrity / 100} />
                      </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#hexagons)" />
                    {/* Glowing shield outlines */}
                    <ellipse cx="120" cy="90" rx="90" ry="70" fill="none" stroke="#ff003c" strokeWidth="2" strokeDasharray="5 5" style={{ opacity: shieldIntegrity / 100, filter: "drop-shadow(0 0 6px #ff003c)" }} />
                  </svg>
                  
                  <div style={{ position: "absolute", zIndex: 10, background: "rgba(3,3,3,0.95)", border: "1px solid #ff003c", padding: "8px 12px", textAlign: "center", minWidth: "120px" }}>
                    <div style={{ fontSize: "9px", color: "#8a8a8a", fontFamily: "Orbitron, sans-serif" }}>SHIELD CELLS</div>
                    <div style={{ fontSize: "18px", color: "#ffffff", fontWeight: "900", fontFamily: "Orbitron, sans-serif" }}>{shieldIntegrity}%</div>
                  </div>
                </div>
              )}
            </div>

            {/* Slider calibrator */}
            <div style={{ background: "rgba(5, 5, 5, 0.7)", border: "1px solid rgba(255,0,60,0.15)", padding: "12px", borderRadius: "2px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "6px" }}>
                <span style={{ fontSize: "12px", color: "#8a8a8a", fontWeight: "bold" }}>STAKED $THREAT LEVEL:</span>
                <span style={{ fontSize: "14px", color: "#ff003c", fontWeight: "bold", fontFamily: "Orbitron, sans-serif" }}>{stakedThreat} THREAT</span>
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
                  height: "5px",
                  background: "rgba(255, 255, 255, 0.1)"
                }}
              />
              <div style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", color: "#8a8a8a", marginTop: "4px" }}>
                <span>0 THREAT</span>
                <span>1000 THREAT</span>
              </div>
            </div>
          </div>

          {/* Interactive Hacking Terminal CLI */}
          <div className="hud-panel" style={{ height: "200px", padding: "12px", display: "flex", flexDirection: "column", justifyContent: "space-between", minHeight: "0" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(255, 0, 60, 0.15)", paddingBottom: "4px", marginBottom: "8px" }}>
              <span style={{ fontFamily: "Orbitron, sans-serif", fontSize: "12px", color: "#ff003c", fontWeight: "900", letterSpacing: "0.1em" }}>
                [ 03. CLI DECRYPTION MODULE ]
              </span>
              <span style={{ fontSize: "11px", color: "#8a8a8a", fontFamily: "monospace" }}>
                DAILY DECRYPTS: <span style={{ color: decryptionAttempts > 0 ? "#00ffcc" : "#ff003c", fontWeight: "bold" }}>{decryptionAttempts} / 5</span>
              </span>
            </div>

            {/* Hacking quick action buttons */}
            <div style={{ display: "flex", gap: "4px", marginBottom: "6px" }}>
              <button onClick={() => runQuickCommand("help")} disabled={isDecrypting} style={{ flex: 1, fontSize: "10px", fontFamily: "Orbitron, sans-serif", border: "1px solid rgba(255,0,60,0.2)", background: "rgba(5,5,5,0.7)", color: "#ff003c", padding: "2px 0", cursor: "pointer" }} className="hover-glow">[ HELP ]</button>
              <button onClick={() => runQuickCommand("status")} disabled={isDecrypting} style={{ flex: 1, fontSize: "10px", fontFamily: "Orbitron, sans-serif", border: "1px solid rgba(255,0,60,0.2)", background: "rgba(5,5,5,0.7)", color: "#ff003c", padding: "2px 0", cursor: "pointer" }} className="hover-glow">[ STATUS ]</button>
              <button onClick={() => runQuickCommand("scan")} disabled={isDecrypting} style={{ flex: 1, fontSize: "10px", fontFamily: "Orbitron, sans-serif", border: "1px solid rgba(255,0,60,0.2)", background: "rgba(5,5,5,0.7)", color: "#ff003c", padding: "2px 0", cursor: "pointer" }} className="hover-glow">[ GRID SCAN ]</button>
              <button onClick={() => runQuickCommand("decrypt")} disabled={isDecrypting} style={{ flex: 1, fontSize: "10px", fontFamily: "Orbitron, sans-serif", border: "1px solid #ff003c", background: "rgba(255,0,60,0.15)", color: "#ffffff", padding: "2px 0", cursor: "pointer" }} className="hover-glow">[ DECRYPT CORE ]</button>
            </div>

            {/* CLI log view */}
            <div className="hud-scrollbar" style={{ overflowY: "auto", flexGrow: 1, fontSize: "12px", fontFamily: "monospace", display: "flex", flexDirection: "column", gap: "2px", marginBottom: "6px", paddingRight: "4px", color: "#00ffcc" }}>
              {cliHistory.map((line, idx) => (
                <div key={idx} style={{ wordBreak: "break-all", whiteSpace: "pre-wrap" }}>{line}</div>
              ))}
              <div ref={cliEndRef} />
            </div>

            <form onSubmit={handleCliSubmit} style={{ display: "flex", border: "1px solid rgba(255, 0, 60, 0.2)", background: "#050505" }}>
              <span style={{ color: "#ff003c", fontFamily: "monospace", padding: "4px 0 4px 8px", fontSize: "12px", userSelect: "none" }}>guest@redqueen:~$</span>
              <input
                type="text"
                value={cliInput}
                onChange={(e) => setCliInput(e.target.value)}
                disabled={isDecrypting}
                placeholder="TYPE UTILITY COMMAND..."
                style={{ flexGrow: 1, background: "transparent", border: "none", color: "#00ffcc", fontFamily: "monospace", fontSize: "12px", padding: "4px 8px", outline: "none" }}
              />
            </form>
          </div>

        </div>

        {/* RIGHT COLUMN: DIRECTIVES, TELEMETRY, PERSISTENT CHAT & PORTAL */}
        <div style={{ display: "flex", flexDirection: "column", gap: "20px", height: "100%", minHeight: "0" }}>
          
          {/* Directives & Target Board */}
          <div className="hud-panel" style={{ padding: "12px", display: "flex", flexDirection: "column", gap: "8px" }}>
            <div>
              <span className="hud-blink-fast" style={{ fontFamily: "Orbitron, sans-serif", fontSize: "12px", color: "#ff003c", fontWeight: "900", letterSpacing: "0.1em", display: "block" }}>
                ⚠️ ACTIVE RED QUEEN DIRECTIVE
              </span>
              <div style={{ background: "rgba(255,0,60,0.05)", border: "1px solid rgba(255,0,60,0.2)", padding: "8px", marginTop: "4px", fontSize: "13px", color: "#ffffff", lineHeight: "1.3" }}>
                &gt; OPERATIVE DIRECTIVE: SECURE SATELLITE RELAY AT COORDINATES <span style={{ color: "#ff003c", fontWeight: "bold" }}>45.1092, -122.6801</span> WITHIN 12 HOURS. +10% BIO-SCORE YIELD ON ALL SECURED LOGS.
              </div>
            </div>

            <div style={{ borderTop: "1px dashed rgba(255,0,60,0.2)", paddingTop: "8px" }}>
              <span style={{ fontFamily: "Orbitron, sans-serif", fontSize: "11px", color: "#8a8a8a", fontWeight: "900", letterSpacing: "0.1em", display: "block", marginBottom: "4px" }}>
                TARGET AUDIT BOARD (BOUNTIES)
              </span>
              <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "12px", background: "rgba(5,5,5,0.8)", padding: "4px 8px", border: "1px solid rgba(255,255,255,0.04)" }}>
                  <span>1. MARAUDER_BLADE [GRID_18.2]</span>
                  <span style={{ color: "#ff003c", fontWeight: "bold" }}>120 THREAT</span>
                </div>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "12px", background: "rgba(5,5,5,0.8)", padding: "4px 8px", border: "1px solid rgba(255,255,255,0.04)" }}>
                  <span>2. COLLECTIVE_U04 [GRID_4.5]</span>
                  <span style={{ color: "#ff003c", fontWeight: "bold" }}>250 THREAT</span>
                </div>
              </div>
            </div>
          </div>

          {/* Resources Monitor */}
          <div className="hud-panel" style={{ padding: "12px" }}>
            <span style={{ fontFamily: "Orbitron, sans-serif", fontSize: "12px", color: "#ff003c", fontWeight: "900", letterSpacing: "0.1em", display: "block", marginBottom: "8px" }}>
              RESOURCE LEVELS TELEMETRY
            </span>
            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "#8a8a8a", fontWeight: 700 }}>
                  <span>WATER LEVELS SUPPLY</span>
                  <span style={{ color: "#ffffff" }}>{waterLevel}%</span>
                </div>
                <div style={{ height: "4px", background: "rgba(255,255,255,0.05)", marginTop: "2px" }}>
                  <div style={{ height: "100%", width: `${waterLevel}%`, background: "#ff003c", boxShadow: "0 0 8px #ff003c" }} />
                </div>
              </div>
              
              <div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "#8a8a8a", fontWeight: 700 }}>
                  <span>FOOD PROVISIONS</span>
                  <span style={{ color: "#ffffff" }}>{foodLevel}%</span>
                </div>
                <div style={{ height: "4px", background: "rgba(255,255,255,0.05)", marginTop: "2px" }}>
                  <div style={{ height: "100%", width: `${foodLevel}%`, background: "#ff003c", boxShadow: "0 0 8px #ff003c" }} />
                </div>
              </div>

              <div>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", color: "#8a8a8a", fontWeight: 700 }}>
                  <span>GRID ELECTROMAGNETIC INPUT</span>
                  <span style={{ color: "#ffffff" }}>{powerGrid}%</span>
                </div>
                <div style={{ height: "4px", background: "rgba(255,255,255,0.05)", marginTop: "2px" }}>
                  <div style={{ height: "100%", width: `${powerGrid}%`, background: "#ff003c", boxShadow: "0 0 8px #ff003c" }} />
                </div>
              </div>
            </div>
          </div>

          {/* Persistent General Chat */}
          <div className="hud-panel" style={{ flexGrow: 1, padding: "12px", display: "flex", flexDirection: "column", justifyContent: "space-between", minHeight: "0" }}>
            <span style={{ fontFamily: "Orbitron, sans-serif", fontSize: "12px", color: "#ff003c", fontWeight: "900", letterSpacing: "0.15em", borderBottom: "1px solid rgba(255,0,60,0.15)", paddingBottom: "4px", marginBottom: "8px", display: "block" }}>
              ● GENERAL SECURE CHANNEL
            </span>

            {/* Chat Messages */}
            <div className="hud-scrollbar" style={{ overflowY: "auto", flexGrow: 1, fontSize: "12px", display: "flex", flexDirection: "column", gap: "4px", marginBottom: "8px", paddingRight: "4px", fontFamily: "monospace" }}>
              {chatMessages.map((msg, i) => (
                <div key={i} style={{ lineHeight: "1.3" }}>
                  <span style={{ color: "rgba(255,255,255,0.25)", marginRight: "6px" }}>[{msg.time}]</span>
                  <span style={{ color: msg.color || "#ff003c", fontWeight: "bold", marginRight: "6px" }}>{msg.sender}:</span>
                  <span style={{ color: "rgba(255,255,255,0.85)" }}>{msg.text}</span>
                </div>
              ))}
              <div ref={chatEndRef} />
            </div>

            <form onSubmit={handleSendChat} style={{ display: "flex", border: "1px solid rgba(255,0,60,0.2)", background: "#050505" }}>
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                placeholder="BROADCAST UPLINK SIGNAL..."
                style={{ flexGrow: 1, background: "transparent", border: "none", color: "#ffffff", fontFamily: "monospace", fontSize: "11px", padding: "5px 8px", outline: "none", textTransform: "uppercase" }}
              />
              <button type="submit" style={{ background: "transparent", border: "none", color: "#ff003c", cursor: "pointer", padding: "0 8px" }}>
                <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><polygon points="22 2 15 22 11 13 2 9 22 2" /></svg>
              </button>
            </form>
          </div>

          {/* Action Gateway Portal */}
          <Link
            href="/arena"
            className="hud-btn"
            style={{
              display: "block",
              textAlign: "center",
              fontSize: "14px",
              padding: "14px",
              textDecoration: "none",
              boxShadow: "0 0 15px rgba(255, 0, 60, 0.45)"
            }}
          >
            [ ACCESS P2P COMBAT ARENA ]
          </Link>

        </div>

      </main>

      {/* TECHNICAL HUD FOOTER */}
      <footer style={{ borderTop: "1px solid rgba(255, 0, 60, 0.15)", paddingTop: "8px", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "11px", color: "rgba(255,255,255,0.35)", letterSpacing: "0.2em" }}>
        <span>SEC_SYS: STABLE // SCANNER_LOCK: DEPIN_ON</span>
        <span>SYS_VER: 7.4.1 // APOCALYPSE_NODE_ONLINE</span>
      </footer>
    </div>
  );
}
