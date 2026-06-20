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
}

const FACTIONS: Faction[] = [
  { id: "nomads", name: "NOMADS", trait: "+15% SCAVENGING", description: "Wasteland scouts utilizing recovery optics." },
  { id: "scientists", name: "SCIENTISTS", trait: "-20% DECODE TIME", description: "Cryptographic analysts utilizing pre-collapse data nodes." },
  { id: "marauders", name: "MARAUDERS", trait: "+10% LIMB DAMAGE", description: "Aggressive front-line combatants targeting structural faults." },
  { id: "engineers", name: "ENGINEERS", trait: "-15% REPAIR COST", description: "Hardware operators maintaining power routing cores." },
  { id: "syndicates", name: "BUNKER SYNDICATES", trait: "+20% DEFENSE", description: "Heavy bunker networks resisting hostile intrusions." },
  { id: "hackers", name: "HACKERS", trait: "PREVIEW THREATS", description: "Infiltrators intercepting active environmental vector shifts." }
];

export default function BunkerPage() {
  const { authIdentifier } = useAuth();
  const { publicKey } = useWallet();

  // Faction state
  const [selectedFaction, setSelectedFaction] = useState<Faction | null>(FACTIONS[0]);
  const [stakedThreat, setStakedThreat] = useState<number>(100);
  const [shieldIntegrity, setShieldIntegrity] = useState<number>(65);

  // Resources
  const waterLevel = 45;
  const foodLevel = 62;
  const powerGrid = 78;

  // Calculate shield integrity dynamically
  useEffect(() => {
    const baseShield = selectedFaction?.id === "syndicates" ? 45 : 30;
    const calculatedShield = Math.min(99, Math.round(baseShield + Math.log2(stakedThreat + 1) * 8));
    setShieldIntegrity(calculatedShield);
  }, [stakedThreat, selectedFaction]);

  const currentWallet = authIdentifier || (publicKey ? publicKey.toString() : null);

  return (
    <div id="game-bunker-root" style={{ background: "#030303", minHeight: "100vh", color: "#ffffff", fontFamily: "Exo 2, Rajdhani, sans-serif", padding: "16px 24px", position: "relative", boxSizing: "border-box", overflow: "hidden", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
      {/* Global styling for military scanlines, target animations, and HUD grids */}
      <style jsx global>{`
        @import url('https://fonts.googleapis.com/css2?family=Exo+2:wght@300;400;600;700&family=Orbitron:wght@500;800;900&family=Oxanium:wght@400;500;700&family=Rajdhani:wght@400;500;600;700&display=swap');

        /* Fullscreen scanline filter */
        #game-bunker-root::before {
          content: " ";
          display: block;
          position: absolute;
          top: 0; left: 0; bottom: 0; right: 0;
          background: repeating-linear-gradient(0deg, transparent, transparent 2px, rgba(255,255,255,.015) 3px);
          background-size: 100% 4px;
          z-index: 10;
          pointer-events: none;
          opacity: 0.45;
        }

        /* 50px tactical grid */
        #game-bunker-root::after {
          content: " ";
          display: block;
          position: absolute;
          top: 0; left: 0; bottom: 0; right: 0;
          background-image: linear-gradient(rgba(255, 0, 60, 0.012) 1px, transparent 1px),
                            linear-gradient(90deg, rgba(255, 0, 60, 0.012) 1px, transparent 1px);
          background-size: 50px 50px;
          z-index: 1;
          pointer-events: none;
        }

        /* conic radar sweep animation */
        .radar-sweep-conic {
          position: absolute;
          width: 240px; height: 240px;
          border-radius: 50%;
          background: conic-gradient(rgba(255,0,60,0.12) 0deg, rgba(255,0,60,0) 180deg);
          animation: spin 6s linear infinite;
          pointer-events: none;
        }

        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
        @keyframes spin-reverse {
          0% { transform: rotate(360deg); }
          100% { transform: rotate(0deg); }
        }
        @keyframes pulse {
          0% { opacity: 0.35; }
          50% { opacity: 0.85; }
          100% { opacity: 0.35; }
        }

        .hover-glow:hover {
          color: #ff003c !important;
          text-shadow: 0 0 10px rgba(255,0,60,0.8);
        }

        /* Hide default slider styling */
        input[type=range].calibrator-slider {
          -webkit-appearance: none;
          background: transparent;
        }
        input[type=range].calibrator-slider::-webkit-slider-thumb {
          -webkit-appearance: none;
          height: 12px; width: 6px;
          background: #ff003c;
          border: 1px solid #ffffff;
          cursor: pointer;
          box-shadow: 0 0 8px #ff003c;
          border-radius: 0;
        }
      `}</style>

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
          <span style={{ display: "flex", alignItems: "center", gap: "4px", color: "#ffffff" }}>BUNKER_ID: <span style={{ color: "#ff003c", fontSize: "8.5px" }}>{currentWallet ? `${currentWallet.slice(0, 6)}...${currentWallet.slice(-4)}` : "OFFLINE"}</span></span>
        </div>
      </header>

      {/* Asymmetrical Operations layout: 65% Visual atmosphere (Hologram, radar, ticker), 35% Sidebar inputs */}
      <div style={{ display: "grid", gridTemplateColumns: "1.8fr 1fr", gap: "24px", flexGrow: 1, alignItems: "center", position: "relative", zIndex: 10, margin: "16px 0" }}>
        
        {/* LEFT/CENTER HUD: 65% Massive Visual Atmosphere */}
        <div style={{ height: "100%", position: "relative", display: "flex", flexDirection: "column", justifyContent: "space-between", padding: "12px", borderRight: "1px solid rgba(255, 0, 60, 0.08)" }}>
          
          {/* Faint Red Queen holographic silhouette overlay inside background */}
          <img
            src="/images/redqueen_silhouette.png"
            alt="Red Queen Hologram"
            style={{
              position: "absolute",
              top: "5%",
              left: "40%",
              transform: "translateX(-45%)",
              height: "85%",
              width: "auto",
              opacity: 0.18,
              filter: "drop-shadow(0 0 30px rgba(255, 0, 60, 0.5)) brightness(0.6)",
              zIndex: 1,
              pointerEvents: "none"
            }}
          />

          {/* Symmetrical metadata overlays on hologram */}
          <div style={{ display: "flex", justifyContent: "space-between", width: "100%", zIndex: 2, pointerEvents: "none" }}>
            <div style={{ fontFamily: "Rajdhani, sans-serif", fontSize: "10px", color: "rgba(255,255,255,0.3)", letterSpacing: "0.15em" }}>
              <div>COORD // GRID_32.0x14</div>
              <div>MAIN STAT: CALIBRATING...</div>
            </div>
            <div style={{ fontFamily: "Rajdhani, sans-serif", fontSize: "10px", color: "rgba(255,255,255,0.3)", letterSpacing: "0.15em", textAlign: "right" }}>
              <div>SYS_INTEGRITY: 99.4%</div>
              <div>ANTIGRAVITY ACTUATOR: OK</div>
            </div>
          </div>

          {/* Central giant visual radar / targeting scanner */}
          <div style={{ display: "flex", justifyContent: "center", alignItems: "center", flexGrow: 1, position: "relative", zIndex: 2 }}>
            <div style={{ position: "relative", width: "240px", height: "240px", display: "flex", justifyContent: "center", alignItems: "center" }}>
              {/* Rotating radar sweep */}
              <div className="radar-sweep-conic" />

              {/* Concentric rings */}
              <div style={{ position: "absolute", width: "100%", height: "100%", borderRadius: "50%", border: "1px dashed rgba(255, 0, 60, 0.2)", animation: "spin 35s linear infinite" }} />
              <div style={{ position: "absolute", width: "80%", height: "80%", borderRadius: "50%", border: "1.5px dashed rgba(255, 255, 255, 0.05)", animation: "spin-reverse 15s linear infinite" }} />
              <div style={{ position: "absolute", width: "60%", height: "60%", borderRadius: "50%", border: "1px solid rgba(255, 0, 60, 0.08)" }} />
              
              {/* Tactical lines crosshairs */}
              <div style={{ position: "absolute", width: "125%", height: "1px", background: "linear-gradient(90deg, rgba(255,0,60,0) 0%, rgba(255,0,60,0.12) 50%, rgba(255,0,60,0) 100%)" }} />
              <div style={{ position: "absolute", height: "125%", width: "1px", background: "linear-gradient(180deg, rgba(255,0,60,0) 0%, rgba(255,0,60,0.12) 50%, rgba(255,0,60,0) 100%)" }} />
              
              {/* Target dots */}
              <div style={{ position: "absolute", top: "45px", right: "50px", width: "4px", height: "4px", borderRadius: "50%", background: "#ff003c", boxShadow: "0 0 8px #ff003c", animation: "pulse 1.5s infinite" }} />
              <div style={{ position: "absolute", bottom: "75px", left: "40px", width: "4px", height: "4px", borderRadius: "50%", background: "#ff003c", opacity: 0.6 }} />

              <div style={{ width: "100px", height: "100px", borderRadius: "50%", background: "#030303", border: "2px solid #ff003c", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", zIndex: 5, boxShadow: "0 0 20px rgba(255, 0, 60, 0.4)" }}>
                <span style={{ fontSize: "8px", color: "rgba(255, 255, 255, 0.4)", fontFamily: "Rajdhani, sans-serif", letterSpacing: "0.1em", fontWeight: 700 }}>HAZARD_RATING</span>
                <span style={{ fontFamily: "Orbitron, sans-serif", fontSize: "20px", color: "#ff003c", fontWeight: "900", textShadow: "0 0 6px #ff003c" }}>94%</span>
              </div>
            </div>
          </div>

          {/* Warning ticker and deployment action */}
          <div style={{ display: "flex", flexDirection: "column", gap: "12px", zIndex: 2 }}>
            {/* Environmental Warning alert card */}
            <div style={{ border: "1px solid rgba(255, 0, 60, 0.15)", background: "rgba(10, 10, 10, 0.85)", padding: "10px 16px", borderRadius: "2px", display: "flex", justifyContent: "space-between", alignItems: "center", backdropFilter: "blur(12px)" }}>
              <div>
                <span style={{ fontSize: "9px", color: "#ff003c", fontWeight: "900", fontFamily: "Orbitron, sans-serif", letterSpacing: "0.15em", display: "block" }}>
                  WARNING // SECTOR_ANOMALY
                </span>
                <span style={{ fontSize: "11px", color: "rgba(255, 255, 255, 0.75)", fontFamily: "Rajdhani, sans-serif", letterSpacing: "0.05em", marginTop: "2px" }}>
                  Tectonic core vectors registered in Sector Alpha. Water provisions decaying dynamically.
                </span>
              </div>
              <span style={{ fontSize: "10px", color: "#ff003c", fontWeight: "bold", fontFamily: "var(--mono)" }}>CODE: RED_AQ</span>
            </div>

            {/* Deploy Trigger Button */}
            <Link
              href="/arena"
              style={{
                display: "block",
                textAlign: "center",
                background: "#ff003c",
                color: "#ffffff",
                fontFamily: "Orbitron, sans-serif",
                fontSize: "11px",
                fontWeight: "900",
                padding: "12px",
                textDecoration: "none",
                cursor: "pointer",
                borderRadius: "2px",
                letterSpacing: "0.15em",
                boxShadow: "0 0 10px rgba(255, 0, 60, 0.45), 0 0 20px rgba(255, 0, 60, 0.2)"
              }}
              className="hover-glow"
            >
              [ ENTER P2P BATTLE ARENA ]
            </Link>
          </div>

        </div>

        {/* RIGHT HUD PANEL: 35% Symmetrical command inputs */}
        <div style={{ height: "100%", display: "flex", flexDirection: "column", gap: "16px", justifyContent: "space-between" }}>
          
          {/* Faction selector registry */}
          <div style={{ background: "rgba(10, 10, 10, 0.85)", border: "1px solid rgba(255, 0, 60, 0.08)", backdropFilter: "blur(12px)", padding: "16px", borderRadius: "2px" }}>
            <h2 style={{ fontFamily: "Orbitron, sans-serif", fontSize: "11px", color: "#ff003c", marginTop: 0, marginBottom: "4px", letterSpacing: "0.1em", fontWeight: 900 }}>
              1. PLEDGED FACTIONS
            </h2>
            <div style={{ fontSize: "10px", color: "#8a8a8a", fontFamily: "Rajdhani, sans-serif", letterSpacing: "0.08em", marginBottom: "12px" }}>Select standing alliance zone:</div>
            
            <div style={{ display: "flex", flexDirection: "column", gap: "6px", maxHeight: "200px", overflowY: "auto", paddingRight: "2px" }}>
              {FACTIONS.map(f => {
                const isSelected = selectedFaction?.id === f.id;
                return (
                  <div
                    key={f.id}
                    onClick={() => setSelectedFaction(f)}
                    style={{
                      border: `1px solid ${isSelected ? "rgba(255, 0, 60, 0.15)" : "rgba(255, 255, 255, 0.05)"}`,
                      background: isSelected ? "rgba(255, 0, 60, 0.05)" : "rgba(5, 5, 5, 0.5)",
                      padding: "8px 10px",
                      borderRadius: "2px",
                      cursor: "pointer",
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center"
                    }}
                  >
                    <span style={{ fontSize: "10.5px", fontFamily: "Orbitron, sans-serif", color: isSelected ? "#ff003c" : "#ffffff", fontWeight: 700 }}>
                      {f.name}
                    </span>
                    <span style={{ fontSize: "9px", color: isSelected ? "#ffffff" : "#8a8a8a", fontFamily: "Rajdhani, sans-serif", fontWeight: 600 }}>
                      {f.trait}
                    </span>
                  </div>
                );
              })}
            </div>

            {selectedFaction && (
              <div style={{ borderTop: "1px solid rgba(255,0,60,0.1)", marginTop: "8px", paddingTop: "8px", fontSize: "9.5px", color: "#8a8a8a", fontFamily: "Rajdhani, sans-serif", lineHeight: "1.3" }}>
                <span style={{ color: "#ff003c", fontWeight: 700 }}>PROFILE:</span> {selectedFaction.description}
              </div>
            )}
          </div>

          {/* Defensive Shield calibration grid */}
          <div style={{ background: "rgba(10, 10, 10, 0.85)", border: "1px solid rgba(255, 0, 60, 0.08)", backdropFilter: "blur(12px)", padding: "16px", borderRadius: "2px" }}>
            <h2 style={{ fontFamily: "Orbitron, sans-serif", fontSize: "11px", color: "#ff003c", marginTop: 0, marginBottom: "4px", letterSpacing: "0.1em", fontWeight: 900 }}>
              2. SHIELD GRID CALIBRATION
            </h2>
            <div style={{ fontSize: "10px", color: "#8a8a8a", fontFamily: "Rajdhani, sans-serif", letterSpacing: "0.08em", marginBottom: "12px" }}>Stake THREAT to stabilize bunker layers:</div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px", background: "rgba(5,5,5,0.7)", padding: "8px", border: "1px solid rgba(255,255,255,0.03)", borderRadius: "2px" }}>
              <div>
                <span style={{ fontSize: "8.5px", color: "#8a8a8a", fontFamily: "Rajdhani, sans-serif" }}>ESCROW LOCK:</span>
                <div style={{ fontSize: "13px", fontWeight: "bold", color: "#ff003c", fontFamily: "Orbitron, sans-serif" }}>{stakedThreat} $THREAT</div>
              </div>
              <div style={{ textAlign: "right" }}>
                <span style={{ fontSize: "8.5px", color: "#8a8a8a", fontFamily: "Rajdhani, sans-serif" }}>INTEGRITY:</span>
                <div style={{ fontSize: "13px", fontWeight: "bold", color: "#ffffff", fontFamily: "Orbitron, sans-serif" }}>{shieldIntegrity}%</div>
              </div>
            </div>

            <input
              type="range"
              min="0"
              max="1000"
              value={stakedThreat}
              onChange={(e) => setStakedThreat(Number(e.target.value))}
              className="calibrator-slider"
              style={{ width: "100%", cursor: "pointer", background: "rgba(255,255,255,0.08)", height: "4px", outline: "none", border: "none" }}
            />
          </div>

          {/* Resource levels */}
          <div style={{ background: "rgba(10, 10, 10, 0.85)", border: "1px solid rgba(255, 0, 60, 0.08)", backdropFilter: "blur(12px)", padding: "16px", borderRadius: "2px" }}>
            <h2 style={{ fontFamily: "Orbitron, sans-serif", fontSize: "11px", color: "#ff003c", marginTop: 0, marginBottom: "12px", letterSpacing: "0.1em", fontWeight: 900 }}>
              3. RESOURCES
            </h2>

            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "9px", color: "#8a8a8a", fontFamily: "Rajdhani, sans-serif", letterSpacing: "0.1em", fontWeight: 700 }}>
                  <span>CLEAN WATER SUPPLY</span>
                  <span style={{ color: "#ffffff" }}>{waterLevel}%</span>
                </div>
                <div style={{ height: "3px", background: "rgba(17,17,17,0.6)", border: "1px solid rgba(255,255,255,0.05)" }}>
                  <div style={{ height: "100%", width: `${waterLevel}%`, background: "#ff003c", boxShadow: "0 0 6px #ff003c88" }} />
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "9px", color: "#8a8a8a", fontFamily: "Rajdhani, sans-serif", letterSpacing: "0.1em", fontWeight: 700 }}>
                  <span>FOOD PROVISIONS</span>
                  <span style={{ color: "#ffffff" }}>{foodLevel}%</span>
                </div>
                <div style={{ height: "3px", background: "rgba(17,17,17,0.6)", border: "1px solid rgba(255,255,255,0.05)" }}>
                  <div style={{ height: "100%", width: `${foodLevel}%`, background: "#ff003c", boxShadow: "0 0 6px #ff003c88" }} />
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "2px" }}>
                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "9px", color: "#8a8a8a", fontFamily: "Rajdhani, sans-serif", letterSpacing: "0.1em", fontWeight: 700 }}>
                  <span>GRID ELECTROMAGNETIC INPUT</span>
                  <span style={{ color: "#ffffff" }}>{powerGrid}%</span>
                </div>
                <div style={{ height: "3px", background: "rgba(17,17,17,0.6)", border: "1px solid rgba(255,255,255,0.05)" }}>
                  <div style={{ height: "100%", width: `${powerGrid}%`, background: "#ff003c", boxShadow: "0 0 6px #ff003c88" }} />
                </div>
              </div>
            </div>
          </div>

        </div>

      </div>

      {/* Technical Footer metadata */}
      <footer style={{ borderTop: "1px solid rgba(255, 0, 60, 0.08)", paddingTop: "6px", display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "9px", color: "rgba(255,255,255,0.35)", fontFamily: "Rajdhani, sans-serif", letterSpacing: "0.15em", zIndex: 20 }}>
        <span>SEC_SYS: STABLE // SCANNER_LOCK: STABLE</span>
        <span>SYS_VER: 7.4.1 // TERMINAL_ACTIVE</span>
      </footer>
    </div>
  );
}
