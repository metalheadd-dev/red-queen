"use client";

import { useState, useEffect, useCallback, useRef } from "react";
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
    borderColor: "#f0c929",
    glowColor: "rgba(240, 201, 41, 0.25)"
  },
  {
    id: "scientists",
    name: "SCIENTISTS",
    trait: "-20% Decode Time",
    description: "Pre-collapse research remnants utilizing cryptography to decrypt hidden technology nodes.",
    borderColor: "#a855f7",
    glowColor: "rgba(168, 85, 247, 0.25)"
  },
  {
    id: "marauders",
    name: "MARAUDERS",
    trait: "+10% Limb Strike Damage",
    description: "Aggressive combatants specialized in targeting vulnerability points.",
    borderColor: "#ff0033",
    glowColor: "rgba(255, 0, 51, 0.25)"
  },
  {
    id: "engineers",
    name: "ENGINEERS",
    trait: "-15% Repair Cost",
    description: "DePIN hardware operators specialized in bunker fortification and power grid routing.",
    borderColor: "#00ffcc",
    glowColor: "rgba(0, 255, 204, 0.25)"
  },
  {
    id: "syndicates",
    name: "BUNKER SYNDICATES",
    trait: "+20% Defensive Shield",
    description: "Fortified underground network syndicates utilizing heavy hardware to resist hostile raids.",
    borderColor: "#22c55e",
    glowColor: "rgba(34, 197, 94, 0.25)"
  },
  {
    id: "hackers",
    name: "HACKERS",
    trait: "Preview Next Threat",
    description: "Mainframe infiltrators capable of intercepting upcoming environmental vector shifts.",
    borderColor: "#3b82f6",
    glowColor: "rgba(59, 130, 246, 0.25)"
  }
];

export default function BunkerPage() {
  const { session, authIdentifier } = useAuth();
  const { publicKey } = useWallet();

  // Faction state
  const [selectedFaction, setSelectedFaction] = useState<Faction | null>(null);

  // Staking & Shield
  const [stakedThreat, setStakedThreat] = useState<number>(100);
  const [shieldIntegrity, setShieldIntegrity] = useState<number>(65);

  // Resource parameters
  const [waterLevel, setWaterLevel] = useState<number>(45);
  const [foodLevel, setFoodLevel] = useState<number>(62);
  const [powerGrid, setPowerGrid] = useState<number>(78);

  // Auto-calculating shield integrity based on staked $THREAT
  useEffect(() => {
    const baseShield = selectedFaction?.id === "syndicates" ? 45 : 30;
    const calculatedShield = Math.min(99.9, Math.round(baseShield + Math.log2(stakedThreat + 1) * 8));
    setShieldIntegrity(calculatedShield);
  }, [stakedThreat, selectedFaction]);

  const currentWallet = authIdentifier || (publicKey ? publicKey.toString() : null);

  return (
    <div style={{ background: "#050505", minHeight: "100vh", color: "#ffffff", fontFamily: "var(--mono), monospace", paddingBottom: "80px", position: "relative" }}>
      {/* Background CRT Scanlines */}
      <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100%", background: "linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.06), rgba(0, 255, 0, 0.02), rgba(0, 0, 255, 0.06))", backgroundSize: "100% 4px, 6px 100%", zIndex: 10, pointerEvents: "none", opacity: 0.4 }} />

      {/* Navigation Header */}
      <nav style={{ borderBottom: "1px solid #ff0033", padding: "16px 24px", display: "flex", justifyContent: "space-between", alignItems: "center", background: "#080808" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <span style={{ color: "#ff0033", fontWeight: "bold", fontSize: "16px", textShadow: "0 0 6px rgba(255, 0, 51, 0.6)", fontFamily: "Orbitron, sans-serif" }}>
            RED QUEEN // BUNKER SIMULATION
          </span>
          <span style={{ fontSize: "11px", background: "rgba(255, 0, 51, 0.15)", border: "1px solid #ff0033", padding: "2px 8px", borderRadius: "1px", color: "#ff0033" }}>
            BETA ENGINE
          </span>
        </div>
        <div style={{ display: "flex", gap: "20px", fontSize: "13px" }}>
          <Link href="/solvivors" style={{ color: "var(--text-dim)", textDecoration: "none" }} className="hover-glow">[ RETURN TO HUB ]</Link>
          <Link href="/operative" style={{ color: "var(--text-dim)", textDecoration: "none" }} className="hover-glow">[ DOSSIERS ]</Link>
        </div>
      </nav>

      {/* Main Grid Command Mainframe */}
      <main style={{ maxWidth: "1200px", margin: "40px auto", padding: "0 24px", display: "flex", flexDirection: "column", gap: "32px" }}>
        
        {/* Banner Alert Command */}
        <section style={{ border: "1px solid #ff0033", background: "rgba(255, 0, 51, 0.02)", padding: "24px", position: "relative", boxShadow: "0 0 10px rgba(255, 0, 51, 0.1)" }}>
          <div style={{ position: "absolute", top: "-10px", left: "20px", background: "#050505", padding: "0 10px", color: "#ff0033", fontSize: "12px", fontWeight: "bold" }}>
            COMMAND TERMINAL // ACTIVE SECTOR
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", flexWrap: "wrap", gap: "20px" }}>
            <div>
              <h1 style={{ fontFamily: "Orbitron, sans-serif", fontSize: "24px", letterSpacing: "1px", margin: "0 0 8px 0", color: "#ffffff" }}>
                BUNKER DIRECTIVE: SURVIVE THE MATRIX
              </h1>
              <p style={{ margin: 0, color: "var(--text-dim)", fontSize: "13.5px", lineHeight: "1.6" }}>
                Pledge your faction, adjust your $THREAT Staking defensive shields, and enter the turn-based 1v1 tactical PvP combat grid to verify your operative survivability.
              </p>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "4px", fontSize: "12px", background: "#080808", padding: "12px", border: "1px solid #1f1f1f", minWidth: "220px" }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "var(--text-muted)" }}>SECTOR RATING:</span><span style={{ color: "#ff0033" }}>94% HAZARD</span></div>
              <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "var(--text-muted)" }}>CLEARANCE:</span><span>LEVEL 5 ACTUATOR</span></div>
              <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "var(--text-muted)" }}>PASSPORT HASH:</span><span style={{ fontSize: "10px" }}>{currentWallet ? `${currentWallet.slice(0, 6)}...${currentWallet.slice(-6)}` : "OFFLINE"}</span></div>
            </div>
          </div>
        </section>

        {/* Double Column Dashboard layout */}
        <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "32px" }} className="responsive-grid-2">
          
          {/* Left Column widgets */}
          <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
            
            {/* Widget 1: Factions system */}
            <div style={{ border: "1px solid #1f1f1f", background: "#080808", padding: "24px" }}>
              <h2 style={{ fontFamily: "Orbitron, sans-serif", fontSize: "16px", color: "#ffffff", marginTop: 0, marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ display: "inline-block", width: "8px", height: "8px", background: "#ff0033" }} />
                1. SELECT FACTION ALLIANCE
              </h2>
              <p style={{ fontSize: "13px", color: "var(--text-muted)", marginTop: 0, marginBottom: "20px" }}>
                Pledge your alliance to modify your active parameters, stats scaling multipliers, and combat abilities.
              </p>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }} className="responsive-grid-2">
                {FACTIONS.map(f => {
                  const isSelected = selectedFaction?.id === f.id;
                  return (
                    <div
                      key={f.id}
                      onClick={() => setSelectedFaction(f)}
                      style={{
                        border: `1px solid ${isSelected ? f.borderColor : "#1a1a1a"}`,
                        background: isSelected ? f.glowColor : "#050505",
                        padding: "16px",
                        borderRadius: "2px",
                        cursor: "pointer",
                        transition: "all 0.2s ease-in-out",
                        boxShadow: isSelected ? `0 0 10px ${f.borderColor}33` : "none"
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                        <span style={{ fontWeight: "bold", fontSize: "14px", color: isSelected ? f.borderColor : "#ffffff" }}>{f.name}</span>
                        <span style={{ fontSize: "11px", color: f.borderColor, border: `1px solid ${f.borderColor}44`, padding: "1px 6px", borderRadius: "1px", background: "rgba(0,0,0,0.3)" }}>{f.trait}</span>
                      </div>
                      <div style={{ fontSize: "12px", color: "var(--text-dim)", lineHeight: "1.5" }}>{f.description}</div>
                    </div>
                  );
                })}
              </div>

              {selectedFaction && (
                <div style={{ marginTop: "20px", padding: "12px", border: "1px solid rgba(0, 255, 204, 0.2)", background: "rgba(0, 255, 204, 0.02)", fontSize: "13px", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <span>ACTIVE MODIFIER PLEDGED:</span>
                  <span style={{ color: "#00ffcc", fontWeight: "bold" }}>{selectedFaction.name} // {selectedFaction.trait}</span>
                </div>
              )}
            </div>

            {/* Widget 2: P2P Combat Arena Entry */}
            <div style={{ border: "1px solid #ff0033", background: "rgba(255,0,51,0.02)", padding: "24px", display: "flex", flexDirection: "column", gap: "16px", boxShadow: "0 0 15px rgba(255,0,51,0.05)" }}>
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <h2 style={{ fontFamily: "Orbitron, sans-serif", fontSize: "16px", color: "#ffffff", margin: 0, display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ display: "inline-block", width: "8px", height: "8px", background: "#ff0033" }} />
                  2. P2P BATTLE ARENA
                </h2>
                <span style={{ fontSize: "10px", background: "rgba(255, 0, 51, 0.15)", border: "1px solid #ff0033", padding: "2px 8px", color: "#ff0033" }}>
                  1v1 DUEL ONLINE
                </span>
              </div>
              <div style={{ border: "1px dashed rgba(255,0,51,0.3)", padding: "20px", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", background: "#050505", gap: "12px", textAlign: "center" }}>
                <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#ff0033" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ filter: "drop-shadow(0 0 8px rgba(255,0,51,0.25))" }}>
                  <path d="M14.5 17.5L3 6V3h3l11.5 11.5M13 19l2 2m4-4l2 2" />
                </svg>
                <span style={{ fontSize: "14px", color: "#ffffff", fontWeight: "bold" }}>ARENA DEPLOYMENT TERMINAL</span>
                <span style={{ fontSize: "11px", color: "var(--text-dim)", maxWidth: "320px" }}>
                  Enter the live cybernetic grid to match with online hostiles. Risk and lock $THREAT in ranked combat matchups.
                </span>
                <Link
                  href="/arena"
                  style={{
                    marginTop: "8px",
                    background: "#ff0033",
                    border: "none",
                    color: "#ffffff",
                    padding: "10px 24px",
                    fontSize: "12px",
                    fontFamily: "var(--mono)",
                    fontWeight: "bold",
                    textDecoration: "none",
                    cursor: "pointer",
                    boxShadow: "0 0 10px rgba(255,0,51,0.4)"
                  }}
                  className="hover-glow"
                >
                  [ ENTER P2P BATTLE ARENA ]
                </Link>
              </div>
            </div>
          </div>

          {/* Right Column widgets */}
          <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
            
            {/* Widget 3: $THREAT Staking defensive shield */}
            <div style={{ border: "1px solid #1f1f1f", background: "#080808", padding: "24px" }}>
              <h2 style={{ fontFamily: "Orbitron, sans-serif", fontSize: "16px", color: "#ffffff", marginTop: 0, marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ display: "inline-block", width: "8px", height: "8px", background: "#ff0033" }} />
                3. DEFENSIVE SHIELD GRID
              </h2>
              
              <div style={{ display: "flex", justifyContent: "center", marginBottom: "20px" }}>
                {/* Visual Circular Shield Indicator */}
                <div style={{ width: "120px", height: "120px", borderRadius: "50%", border: "4px solid #1f1f1f", borderTopColor: "#00ffcc", display: "flex", flexDirection: "column", justifyContent: "center", alignItems: "center", position: "relative", boxShadow: "0 0 15px rgba(0,255,204,0.15)" }}>
                  <span style={{ fontSize: "20px", fontWeight: "bold", color: "#00ffcc" }}>{shieldIntegrity}%</span>
                  <span style={{ fontSize: "9px", color: "var(--text-muted)" }}>SHIELD OK</span>
                </div>
              </div>

              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                <div style={{ fontSize: "12px", display: "flex", justifyContent: "space-between" }}>
                  <span>STAKED $THREAT ESCROW:</span>
                  <span style={{ color: "#f0c929", fontWeight: "bold" }}>{stakedThreat} $THREAT</span>
                </div>
                
                <input
                  type="range"
                  min="0"
                  max="1000"
                  value={stakedThreat}
                  onChange={(e) => setStakedThreat(Number(e.target.value))}
                  style={{ width: "100%", accentColor: "#00ffcc", cursor: "pointer" }}
                />
                
                <div style={{ fontSize: "11px", color: "var(--text-muted)", lineHeight: "1.4", borderTop: "1px solid #1f1f1f", paddingTop: "10px", marginTop: "4px" }}>
                  Staking native token holdings projects an active electromagnetic shield layer over your bunker core inventory. Scaled to protect items from raid intrusions.
                </div>
              </div>
            </div>

            {/* Widget 4: Resource Scarcity & Radar */}
            <div style={{ border: "1px solid #1f1f1f", background: "#080808", padding: "24px" }}>
              <h2 style={{ fontFamily: "Orbitron, sans-serif", fontSize: "16px", color: "#ffffff", marginTop: 0, marginBottom: "16px", display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ display: "inline-block", width: "8px", height: "8px", background: "#ff0033" }} />
                4. SCAVENGING RESOURCE LEVEL
              </h2>

              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {/* Water meter */}
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "4px" }}>
                    <span>CLEAN WATER SUPPLY:</span>
                    <span style={{ color: "#3b82f6", fontWeight: "bold" }}>{waterLevel}%</span>
                  </div>
                  <div style={{ height: "6px", background: "#1f1f1f", borderRadius: "1px" }}>
                    <div style={{ width: `${waterLevel}%`, height: "100%", background: "#3b82f6" }} />
                  </div>
                </div>

                {/* Food meter */}
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "4px" }}>
                    <span>FOOD PROVISIONS:</span>
                    <span style={{ color: "#f0c929", fontWeight: "bold" }}>{foodLevel}%</span>
                  </div>
                  <div style={{ height: "6px", background: "#1f1f1f", borderRadius: "1px" }}>
                    <div style={{ width: `${foodLevel}%`, height: "100%", background: "#f0c929" }} />
                  </div>
                </div>

                {/* Energy grid meter */}
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", marginBottom: "4px" }}>
                    <span>GRID ELECTROMAGNETIC INPUT:</span>
                    <span style={{ color: "#00ffcc", fontWeight: "bold" }}>{powerGrid}%</span>
                  </div>
                  <div style={{ height: "6px", background: "#1f1f1f", borderRadius: "1px" }}>
                    <div style={{ width: `${powerGrid}%`, height: "100%", background: "#00ffcc" }} />
                  </div>
                </div>
              </div>

              <div style={{ border: "1px solid #ff0033", background: "rgba(255, 0, 51, 0.05)", padding: "10px", marginTop: "20px", fontSize: "11px", color: "#ff0033", lineHeight: "1.4" }}>
                <strong>LIVE ANOMALY ADVISORY:</strong> Real-world wildfire vectors registered in Sector Alpha. Water supply is decreasing dynamically. Scarcity multipliers activated.
              </div>
            </div>

          </div>
        </div>

      </main>
    </div>
  );
}
