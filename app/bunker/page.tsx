"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/AuthProvider";
import { useWallet } from "@solana/wallet-adapter-react";
import Link from "next/link";

interface Faction {
  id: string;
  name: string;
  trait: string;
  description: string;
  borderColor: string;
  glowColor: string;
}

const FACTIONS: Faction[] = [
  {
    id: "nomads",
    name: "NOMADS",
    trait: "+15% Scavenging Yield",
    description: "Wasteland scouts who excel at recovering items in highly toxic sectors.",
    borderColor: "rgba(255,0,60,0.3)",
    glowColor: "rgba(255, 0, 60, 0.05)"
  },
  {
    id: "scientists",
    name: "SCIENTISTS",
    trait: "-20% Decode Time",
    description: "Pre-collapse research remnants utilizing cryptography to decrypt hidden technology nodes.",
    borderColor: "rgba(255,0,60,0.3)",
    glowColor: "rgba(255, 0, 60, 0.05)"
  },
  {
    id: "marauders",
    name: "MARAUDERS",
    trait: "+10% Limb Strike Damage",
    description: "Aggressive combatants specialized in targeting vulnerability points.",
    borderColor: "rgba(255,0,60,0.3)",
    glowColor: "rgba(255, 0, 60, 0.05)"
  },
  {
    id: "engineers",
    name: "ENGINEERS",
    trait: "-15% Repair Cost",
    description: "DePIN hardware operators specialized in bunker fortification and power grid routing.",
    borderColor: "rgba(255,0,60,0.3)",
    glowColor: "rgba(255, 0, 60, 0.05)"
  },
  {
    id: "syndicates",
    name: "BUNKER SYNDICATES",
    trait: "+20% Defensive Shield",
    description: "Fortified underground network syndicates utilizing heavy hardware to resist hostile raids.",
    borderColor: "rgba(255,0,60,0.3)",
    glowColor: "rgba(255, 0, 60, 0.05)"
  },
  {
    id: "hackers",
    name: "HACKERS",
    trait: "Preview Next Threat",
    description: "Mainframe infiltrators capable of intercepting upcoming environmental vector shifts.",
    borderColor: "rgba(255,0,60,0.3)",
    glowColor: "rgba(255, 0, 60, 0.05)"
  }
];

interface TacticalResourceBarProps {
  label: string;
  value: number;
  color: string;
}

function TacticalResourceBar({ label, value, color }: TacticalResourceBarProps) {
  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2px", width: "100%" }}>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "9.5px", color: "rgba(255, 255, 255, 0.5)", fontFamily: "Rajdhani, sans-serif", letterSpacing: "0.15em", fontWeight: 600 }}>
        <span>{label}</span>
        <span style={{ color: "#ffffff", fontWeight: 700 }}>{value}%</span>
      </div>
      <div style={{ height: "3px", background: "#111111", border: "1px solid rgba(255,255,255,0.05)", position: "relative" }}>
        <div style={{ height: "100%", width: `${value}%`, background: color, boxShadow: `0 0 6px ${color}88` }} />
      </div>
    </div>
  );
}

export default function BunkerPage() {
  const { authIdentifier } = useAuth();
  const { publicKey } = useWallet();

  // Faction state
  const [selectedFaction, setSelectedFaction] = useState<Faction | null>(null);

  // Staking & Shield
  const [stakedThreat, setStakedThreat] = useState<number>(100);
  const [shieldIntegrity, setShieldIntegrity] = useState<number>(65);

  // Resource parameters
  const [waterLevel] = useState<number>(45);
  const [foodLevel] = useState<number>(62);
  const [powerGrid] = useState<number>(78);

  // Auto-calculating shield integrity based on staked $THREAT
  useEffect(() => {
    const baseShield = selectedFaction?.id === "syndicates" ? 45 : 30;
    const calculatedShield = Math.min(99.9, Math.round(baseShield + Math.log2(stakedThreat + 1) * 8));
    setShieldIntegrity(calculatedShield);
  }, [stakedThreat, selectedFaction]);

  const currentWallet = authIdentifier || (publicKey ? publicKey.toString() : null);

  return (
    <div id="game-bunker-root" style={{ background: "#050505", minHeight: "100vh", color: "#ffffff", fontFamily: "Exo 2, Rajdhani, sans-serif", padding: "16px 24px", position: "relative", boxSizing: "border-box", overflowX: "hidden", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
      {/* Google Fonts import locally for game-specific typographies */}
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Exo+2:wght@300;400;600;700&family=Orbitron:wght@500;800;900&family=Oxanium:wght@400;500;700&family=Rajdhani:wght@400;500;600;700&display=swap');

        /* Fullscreen CRT scanline overlay */
        #game-bunker-root::before {
          content: " ";
          display: block;
          position: absolute;
          top: 0; left: 0; bottom: 0; right: 0;
          background: repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,.01) 3px);
          background-size: 100% 4px;
          z-index: 10;
          pointer-events: none;
          opacity: 0.4;
        }

        /* 50px grid overlay */
        #game-bunker-root::after {
          content: " ";
          display: block;
          position: absolute;
          top: 0; left: 0; bottom: 0; right: 0;
          background-image: linear-gradient(rgba(255, 0, 60, 0.015) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(255, 0, 60, 0.015) 1px, transparent 1px);
          background-size: 50px 50px;
          z-index: 1;
          pointer-events: none;
        }

        /* Radar sweep animation overlay */
        .radar-sweep {
          position: absolute;
          top: 0; left: 0; width: 100%; height: 100%;
          background: linear-gradient(to bottom, rgba(255,0,60,0) 0%, rgba(255,0,60,0.02) 50%, rgba(255,0,60,0) 100%);
          animation: sweep-down 8s linear infinite;
          z-index: 2;
          pointer-events: none;
        }

        @keyframes sweep-down {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100%); }
        }

        @keyframes spin { 
          0% { transform: rotate(0deg); } 
          100% { transform: rotate(360deg); } 
        }
        @keyframes spin-reverse { 
          0% { transform: rotate(360deg); } 
          100% { transform: rotate(0deg); } 
        }
        .hover-glow:hover {
          color: #ff003c !important;
          text-shadow: 0 0 10px rgba(255,0,60,0.8);
        }
      `}</style>

      {/* Dynamic scanline sweeps layer */}
      <div className="radar-sweep" />

      {/* Screen Frame Border */}
      <div style={{ position: "absolute", top: "12px", left: "12px", right: "12px", bottom: "12px", border: "1px solid rgba(255, 0, 60, 0.08)", pointerEvents: "none", zIndex: 5 }} />

      {/* Navigation Header */}
      <header style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px solid rgba(255, 0, 60, 0.08)", paddingBottom: "8px", position: "relative", zIndex: 20 }}>
        <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
          <span style={{ color: "#ff003c", fontWeight: "900", fontSize: "14px", fontFamily: "Orbitron, sans-serif", textShadow: "0 0 8px rgba(255, 0, 60, 0.6)", letterSpacing: "0.15em" }}>
            &gt; RED QUEEN // BUNKER SIMULATION
          </span>
          <div style={{ display: "flex", gap: "12px", fontSize: "10px", fontFamily: "Rajdhani, sans-serif", letterSpacing: "0.15em", fontWeight: 600 }}>
            <Link href="/solvivors" style={{ color: "#8a8a8a", textDecoration: "none" }} className="hover-glow">[ HUB ]</Link>
            <Link href="/operative" style={{ color: "#8a8a8a", textDecoration: "none" }} className="hover-glow">[ DOSSIERS ]</Link>
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "12px", fontSize: "10px", color: "#8a8a8a", fontFamily: "Rajdhani, sans-serif", letterSpacing: "0.15em", fontWeight: 600 }}>
          <span>BETA ENGINE</span>
          <span style={{ color: "#ff003c" }}>●</span>
          <span style={{ display: "flex", alignItems: "center", gap: "4px", color: "#ffffff" }}>SECTOR HASH: <span style={{ color: "#ff003c", fontSize: "8.5px" }}>{currentWallet ? `${currentWallet.slice(0, 6)}...${currentWallet.slice(-4)}` : "OFFLINE"}</span></span>
        </div>
      </header>

      {/* Main Bunker Command Mainframe layout */}
      <main style={{ display: "grid", gridTemplateColumns: "1fr 1.15fr 1fr", gap: "24px", flexGrow: 1, alignItems: "center", position: "relative", zIndex: 10, minHeight: "0", margin: "12px 0" }}>
        
        {/* LEFT PANEL: Faction Alliances */}
        <div style={{ background: "rgba(10, 10, 10, 0.85)", border: "1px solid rgba(255, 0, 60, 0.08)", backdropFilter: "blur(12px)", borderRadius: "2px", padding: "16px", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          <div>
            <h2 style={{ fontFamily: "Orbitron, sans-serif", fontSize: "12px", color: "#ff003c", marginTop: 0, marginBottom: "8px", letterSpacing: "0.1em", fontWeight: 900 }}>
              1. FACTION STANDING
            </h2>
            <p style={{ fontSize: "11px", color: "#8a8a8a", marginTop: 0, marginBottom: "12px", fontFamily: "Rajdhani, sans-serif", letterSpacing: "0.08em" }}>
              Select a faction to overlay its active attributes on your core.
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "10px", overflowY: "auto", maxHeight: "360px", paddingRight: "4px" }}>
              {FACTIONS.map(f => {
                const isSelected = selectedFaction?.id === f.id;
                return (
                  <div
                    key={f.id}
                    onClick={() => setSelectedFaction(f)}
                    style={{
                      border: `1px solid ${isSelected ? "#ff003c" : "rgba(255, 255, 255, 0.05)"}`,
                      background: isSelected ? "rgba(255, 0, 60, 0.05)" : "rgba(5, 5, 5, 0.5)",
                      padding: "10px",
                      borderRadius: "2px",
                      cursor: "pointer",
                      transition: "all 0.18s ease-in-out"
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "4px" }}>
                      <span style={{ fontWeight: "bold", fontSize: "11px", color: isSelected ? "#ff003c" : "#ffffff", fontFamily: "Orbitron, sans-serif" }}>{f.name}</span>
                      <span style={{ fontSize: "9px", color: "#ff003c", border: "1px solid rgba(255,0,60,0.2)", padding: "1px 5px", background: "rgba(0,0,0,0.4)", fontFamily: "Rajdhani, sans-serif", fontWeight: 700 }}>{f.trait}</span>
                    </div>
                    <div style={{ fontSize: "10px", color: "#8a8a8a", lineHeight: "1.4" }}>{f.description}</div>
                  </div>
                );
              })}
            </div>
          </div>

          {selectedFaction && (
            <div style={{ marginTop: "12px", padding: "8px", border: "1px solid rgba(255, 0, 60, 0.15)", background: "rgba(255, 0, 60, 0.03)", fontSize: "10px", display: "flex", justifyContent: "space-between", alignItems: "center", fontFamily: "Rajdhani, sans-serif", letterSpacing: "0.08em" }}>
              <span style={{ color: "#8a8a8a" }}>PLEDGED SIGNAL:</span>
              <span style={{ color: "#ff003c", fontWeight: "bold" }}>{selectedFaction.name} // LOCKED</span>
            </div>
          )}
        </div>

        {/* CENTER PANEL: Main active radar HUD & redirect */}
        <div style={{ display: "flex", flexDirection: "column", justifyContent: "space-between", alignItems: "center", padding: "10px 0", height: "100%" }}>
          
          {/* Top terminal headers */}
          <div style={{ textAlign: "center" }}>
            <span style={{ fontSize: "9px", color: "#8a8a8a", letterSpacing: "0.15em", fontFamily: "Rajdhani, sans-serif", fontWeight: 600 }}>TACTICAL RADAR</span>
            <div style={{ fontFamily: "Orbitron, sans-serif", fontSize: "18px", color: "#ffffff", fontWeight: "900", letterSpacing: "0.1em", marginTop: "2px" }}>
              SECTOR ALPHA SCANNER
            </div>
          </div>

          {/* Symmetrical Concentric Targeting Scanner */}
          <div style={{ position: "relative", width: "190px", height: "190px", display: "flex", justifyContent: "center", alignItems: "center" }}>
            {/* outer rings */}
            <div style={{ position: "absolute", width: "100%", height: "100%", borderRadius: "50%", border: "1px dashed rgba(255, 0, 60, 0.25)", animation: "spin 36s linear infinite" }} />
            <div style={{ position: "absolute", width: "88%", height: "88%", borderRadius: "50%", border: "1px dashed rgba(255, 255, 255, 0.08)", animation: "spin-reverse 18s linear infinite" }} />
            <div style={{ position: "absolute", width: "76%", height: "76%", borderRadius: "50%", border: "1px solid rgba(255, 0, 60, 0.1)" }} />
            
            {/* Radar crosshairs */}
            <div style={{ position: "absolute", width: "120%", height: "1px", background: "linear-gradient(90deg, rgba(255,0,60,0) 0%, rgba(255,0,60,0.12) 50%, rgba(255,0,60,0) 100%)" }} />
            <div style={{ position: "absolute", height: "120%", width: "1px", background: "linear-gradient(180deg, rgba(255,0,60,0) 0%, rgba(255,0,60,0.12) 50%, rgba(255,0,60,0) 100%)" }} />

            {/* Pulsing hazard point */}
            <div style={{ position: "absolute", top: "50px", left: "60px", width: "6px", height: "6px", borderRadius: "50%", background: "#ff003c", boxShadow: "0 0 10px #ff003c", animation: "pulse 1.2s infinite" }} />
            
            <div style={{ width: "90px", height: "90px", borderRadius: "50%", background: "#050505", border: "2px solid #ff003c", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", zIndex: 5, boxShadow: "0 0 15px rgba(255, 0, 60, 0.45)" }}>
              <span style={{ fontSize: "8px", color: "#8a8a8a", fontFamily: "Rajdhani, sans-serif", letterSpacing: "0.1em", fontWeight: 700 }}>HAZARD</span>
              <span style={{ fontFamily: "Orbitron, sans-serif", fontSize: "18px", color: "#ff003c", fontWeight: "900", textShadow: "0 0 6px #ff003c" }}>94%</span>
            </div>
          </div>

          {/* Active Live Advisory ticker */}
          <div style={{ textAlign: "center", padding: "0 10px" }}>
            <span style={{ fontSize: "8px", color: "#ff003c", letterSpacing: "0.2em", fontWeight: 900, fontFamily: "Orbitron, sans-serif", display: "block", marginBottom: "4px" }}>
              WARNING // DYNAMIC VECTOR SHIFT
            </span>
            <span style={{ fontSize: "11px", color: "#ffffff", fontFamily: "Rajdhani, sans-serif", letterSpacing: "0.05em", lineHeight: "1.4" }}>
              Wildfire vectors registered. Scarcity multipliers activated on Water supply.
            </span>
          </div>

          {/* RED BUTTON: Route directly to P2P Arena */}
          <div style={{ width: "100%", padding: "0 16px" }}>
            <Link
              href="/arena"
              style={{
                display: "block",
                textAlign: "center",
                background: "#ff003c",
                border: "none",
                color: "#ffffff",
                fontFamily: "Orbitron, sans-serif",
                fontSize: "11px",
                fontWeight: "900",
                padding: "12px",
                textDecoration: "none",
                cursor: "pointer",
                borderRadius: "2px",
                letterSpacing: "0.15em",
                boxShadow: "0 0 10px rgba(255, 0, 60, 0.5), 0 0 20px rgba(255, 0, 60, 0.25)"
              }}
              className="hover-glow"
            >
              [ DEPLOY TO COMBAT ARENA ]
            </Link>
          </div>

        </div>

        {/* RIGHT PANEL: Shield Grid & Resources */}
        <div style={{ background: "rgba(10, 10, 10, 0.85)", border: "1px solid rgba(255, 0, 60, 0.08)", backdropFilter: "blur(12px)", borderRadius: "2px", padding: "16px", height: "100%", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
          
          {/* Defensive Shield Grid */}
          <div>
            <h2 style={{ fontFamily: "Orbitron, sans-serif", fontSize: "12px", color: "#ff003c", marginTop: 0, marginBottom: "8px", letterSpacing: "0.1em", fontWeight: 900 }}>
              2. SHIELD CORE GRID
            </h2>
            <p style={{ fontSize: "11px", color: "#8a8a8a", marginTop: 0, marginBottom: "16px", fontFamily: "Rajdhani, sans-serif", letterSpacing: "0.08em" }}>
              Adjust $THREAT Staking level to project electromagnetic barrier protection.
            </p>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "16px", background: "rgba(5,5,5,0.6)", padding: "10px", border: "1px solid rgba(255,255,255,0.03)", borderRadius: "2px" }}>
              <div>
                <div style={{ fontSize: "8.5px", color: "#8a8a8a", fontFamily: "Rajdhani, sans-serif", letterSpacing: "0.1em" }}>STAKED ESCROW</div>
                <div style={{ fontSize: "14px", fontWeight: "bold", color: "#ff003c", fontFamily: "Orbitron, sans-serif" }}>{stakedThreat} $THREAT</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: "8.5px", color: "#8a8a8a", fontFamily: "Rajdhani, sans-serif", letterSpacing: "0.1em" }}>INTEGRITY</div>
                <div style={{ fontSize: "14px", fontWeight: "bold", color: "#ffffff", fontFamily: "Orbitron, sans-serif" }}>{shieldIntegrity}%</div>
              </div>
            </div>

            <input
              type="range"
              min="0"
              max="1000"
              value={stakedThreat}
              onChange={(e) => setStakedThreat(Number(e.target.value))}
              style={{ width: "100%", accentColor: "#ff003c", cursor: "pointer", background: "#111111", height: "4px", outline: "none", border: "none" }}
            />
          </div>

          {/* Scavenging Resource Levels */}
          <div style={{ borderTop: "1px solid rgba(255, 0, 60, 0.08)", paddingTop: "12px" }}>
            <h2 style={{ fontFamily: "Orbitron, sans-serif", fontSize: "11px", color: "#ff003c", marginTop: 0, marginBottom: "12px", letterSpacing: "0.1em", fontWeight: 900 }}>
              3. RESOURCES
            </h2>

            <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
              <TacticalResourceBar label="CLEAN WATER SUPPLY" value={waterLevel} color="#ff003c" />
              <TacticalResourceBar label="FOOD PROVISIONS" value={foodLevel} color="#ff003c" />
              <TacticalResourceBar label="GRID ELECTROMAGNETIC INPUT" value={powerGrid} color="#ff003c" />
            </div>
          </div>

        </div>

      </main>

      {/* Technical Footer metadata */}
      <footer style={{ borderTop: "1px solid rgba(255, 0, 60, 0.08)", paddingTop: "6px", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "9px", color: "rgba(255,255,255,0.35)", fontFamily: "Rajdhani, sans-serif", letterSpacing: "0.15em", zIndex: 20 }}>
        <span>SEC_SYS: STABLE // SCANNER_LOCK: STABLE</span>
        <span>SYS_VER: 7.4.1 // TERMINAL_ACTIVE</span>
      </footer>
    </div>
  );
}
