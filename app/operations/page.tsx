"use client";
import { useState, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { useAuth } from "@/components/AuthProvider";
import Link from "next/link";
import { DEFAULT_STATS, UserStats, calculateBioScore, getClearanceLevel } from "@/lib/progression";

// Hardcoded Factions list matching the Master Game Bible
const FACTIONS = [
  { id: "vanguard", name: "Vanguard", color: "#ff4d4d", desc: "Forward scouting, threat containment, and rapid kinetic response operations.", ideology: "Active neutralization of emerging anomalies before they spread." },
  { id: "eclipse", name: "Eclipse", color: "#a855f7", desc: "Operations in dark quadrants, sub-quantum stealth systems, and classified deep recon.", ideology: "Observing from the shadows, striking with precision when the threat manifests." },
  { id: "helix", name: "Helix", color: "#00ffcc", desc: "Biological adaptation, genetic immunization development, and pathogen neutralization.", ideology: "Humanity must evolve biologically to survive the next internet." },
  { id: "nomads", name: "Nomads", color: "#f0c929", desc: "High-mobility decentralized routers, grid isolation systems, and community hubs.", ideology: "No single point of failure. Distributed survival network grids." },
  { id: "citadel", name: "Citadel", color: "#3b82f6", desc: "Physical sanctuary bunkers, structural integrity shields, and resource stockpiling.", ideology: "Fortify the nodes, protect the remaining civilian pods under structural domes." },
  { id: "ghost", name: "Ghost Division", color: "#f43f5e", desc: "Cyber counterintelligence, sybil attack interception, and address obfuscation.", ideology: "Erase our digital footprint. You cannot kill what you cannot locate." },
  { id: "aegis", name: "Aegis", color: "#0ea5e9", desc: "Defensive perimeter grids, physical and digital firewall networks.", ideology: "The shield is our primary weapon. Maintain node firewall stability at all costs." },
  { id: "horizon", name: "Horizon", color: "#10b981", desc: "Long-range sensor arrays, space telemetry analysis, and future collapse mapping.", ideology: "Observe, forecast, and prepare long before the anomaly crosses the threshold." }
];

// Hardcoded Classes list matching the Master Game Bible
const CLASSES = [
  { id: "Assault", name: "Assault", desc: "Tactical combat specialization, heavy breach charges, and kinetic energy weapons.", preferred_gear: "Heavy Armor, Breach charges, Kinetic rifles", ability: "Overcharge Shield Grid" },
  { id: "Recon", name: "Recon", desc: "Stealth operations, zone scanning, target acquisition, and mapping surveillance grids.", preferred_gear: "Sensor array, Thermal cloak, Sniper rifle", ability: "Scan Grid Weaknesses" },
  { id: "Engineer", name: "Engineer", desc: "Structural defenses, generator calibration, and automated drone network sweeps.", preferred_gear: "Decoy swarm, Drone core, Power cutters", ability: "Repair Node Grid" },
  { id: "Medic", name: "Medic", desc: "Biological hazard containment, stim injection, and pathogen diagnostic treatment.", preferred_gear: "Stim injector, Gas filter, Medkit", ability: "Purify Bio-Toxins" },
  { id: "Scientist", name: "Scientist", desc: "Anomaly decoding, gravity wave analysis, and physical data decryption sweeps.", preferred_gear: "Gravity analyzer, Data pad, Shield scanner", ability: "Decode Anomalous Signals" },
  { id: "Specialist", name: "Specialist", desc: "Algorithmic routing, network signature security, and Sybil counter-measures.", preferred_gear: "Decoy keys, Multi-hop routers, Wasm shields", ability: "Overload Sybil Trackers" }
];

// Core roles matching classes
const ROLES: Record<string, string[]> = {
  Assault: ["Heavy Assault", "Vanguard Commando", "Breach Specialist"],
  Recon: ["Sniper", "Pathfinder", "Intel Scout"],
  Engineer: ["Field Engineer", "Drone Maintenance", "Grid Operator"],
  Medic: ["Combat Medic", "Bio Analyst", "Quarantine Inspector"],
  Scientist: ["Signal Decoder", "Gravity Analyst", "Data Cryptologist"],
  Specialist: ["Drone Operator", "Infiltrator", "Network Router"]
};

export default function OperationsPage() {
  const { publicKey, connected } = useWallet();
  const { setVisible } = useWalletModal();
  const { authIdentifier } = useAuth();
  
  // Game states
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<any>(null);
  
  // Onboarding step
  const [onboardingStep, setOnboardingStep] = useState(1);
  const [selectedFaction, setSelectedFaction] = useState("");
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedRole, setSelectedRole] = useState("");
  const [operativeName, setOperativeName] = useState("");

  // Operations list
  const [operations, setOperations] = useState<any[]>([]);
  const [loadingOps, setLoadingOps] = useState(false);
  const [activeTab, setActiveTab] = useState<"center" | "profile" | "inventory">("center");

  // Mission State
  const [activeMission, setActiveMission] = useState<any>(null);
  const [missionFlow, setMissionFlow] = useState<"briefing" | "deployment" | "decision" | "debriefing" | "rewards" | null>(null);
  const [deploymentLogs, setDeploymentLogs] = useState<string[]>([]);
  const [deploymentProgress, setDeploymentProgress] = useState(0);
  const [selectedOption, setSelectedOption] = useState<any>(null);
  const [missionOutcome, setMissionOutcome] = useState<"SUCCESS" | "FAILURE" | null>(null);
  const [outcomeCommentary, setOutcomeCommentary] = useState("");
  const [outcomeRewards, setOutcomeRewards] = useState<any>(null);
  const [levelUpMessage, setLevelUpMessage] = useState<string | null>(null);

  // Load operative stats from client persistence
  const fetchOperationsProfile = () => {
    setLoading(true);
    const identifier = authIdentifier || (publicKey ? publicKey.toString() : "offline-operative");
    
    // Check localStorage
    const saved = localStorage.getItem(`rq_ops_profile:${identifier}`);
    if (saved) {
      const parsed = JSON.parse(saved);
      setProfile(parsed);
    } else {
      setProfile(null);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchOperationsProfile();
    
    // Load operations from mock API
    async function loadOps() {
      setLoadingOps(true);
      try {
        const res = await fetch("/api/operations");
        const data = await res.json();
        if (data.success) {
          setOperations(data.data);
        }
      } catch (err) {
        console.error("Failed to load operations list:", err);
      } finally {
        setLoadingOps(false);
      }
    }
    loadOps();
  }, [authIdentifier, publicKey]);

  // Handle Onboarding Completion
  const handleOnboardingSubmit = () => {
    if (!operativeName || !selectedFaction || !selectedClass || !selectedRole) return;
    
    const identifier = authIdentifier || (publicKey ? publicKey.toString() : "offline-operative");
    const initialProfile = {
      name: operativeName.toUpperCase(),
      faction: selectedFaction,
      class: selectedClass,
      role: selectedRole,
      level: 1,
      xp: 0,
      credits: 100,
      resources: {
        Metal: 5,
        Electronics: 3,
        "Medical Supplies": 2,
        "Energy Cells": 2,
        "Research Data": 1
      },
      stats: {
        xp: 0,
        level: 1,
        threat_awareness: 10,
        operational_discipline: 10,
        psychological_stability: 10,
        technical_preparedness: 10,
        adaptability: 10,
        resourcefulness: 10,
        surveillance_resistance: 10
      }
    };
    
    localStorage.setItem(`rq_ops_profile:${identifier}`, JSON.stringify(initialProfile));
    setProfile(initialProfile);
  };

  // Deployment logs generator
  const runDeployment = (op: any) => {
    setMissionFlow("deployment");
    setDeploymentProgress(0);
    setDeploymentLogs([]);
    
    const logSteps = [
      `[SYS_INIT] CONNECTING TO SATELLITE NETWORK ROUTE...`,
      `[SHIELD] ESTABLISHING DECENTRALIZED DATA TUNNEL...`,
      `[ORACLE] SCANNING REGION THREAT MATRIX FOR: ${op.title}...`,
      `[UPLINK] OPERATIVE BIOMETRICS VERIFIED: CLASS [${profile.class.toUpperCase()}]`,
      `[TACTICAL] COMMENCING TRANSIT TO ZONE CONDUIT...`,
      `[SUCCESS] DEPLOYMENT ZONE SECURED. INTERFACE ENGAGED.`
    ];

    let currentStep = 0;
    const interval = setInterval(() => {
      if (currentStep < logSteps.length) {
        setDeploymentLogs(prev => [...prev, logSteps[currentStep]]);
        setDeploymentProgress(Math.floor(((currentStep + 1) / logSteps.length) * 100));
        currentStep++;
      } else {
        clearInterval(interval);
        setTimeout(() => {
          setMissionFlow("decision");
        }, 500);
      }
    }, 600);
  };

  // Process Option Choice
  const handleSelectOption = (option: any) => {
    setSelectedOption(option);
    
    // Calculate success probability
    let baseProb = option.success_prob;
    let matchingBonus = 0;
    
    // Class match check
    if (option.class_bonus.classId === profile.class) {
      matchingBonus = option.class_bonus.bonus;
    }
    
    const totalProb = Math.min(95, baseProb + matchingBonus);
    const roll = Math.floor(Math.random() * 100) + 1;
    const isSuccess = roll <= totalProb;
    
    setMissionOutcome(isSuccess ? "SUCCESS" : "FAILURE");
    
    // Set AI commentary evaluation
    if (isSuccess) {
      setOutcomeCommentary(
        `[RED QUEEN AI DEBRIEFING]\n"Tactical response successful. Choice [${option.text}] matches expected behavior metrics. Anomaly resolved within acceptable safety thresholds. Progression registered."`
      );
      setOutcomeRewards(option.stat_gains);
    } else {
      setOutcomeCommentary(
        `[RED QUEEN AI DEBRIEFING]\n"Tactical error detected. Choice [${option.text}] caused signal collapse and system feedback. Anomaly mitigated with sub-optimal results. Return to Command Center for further diagnostic training."`
      );
      // Give half XP and no resources on failure
      setOutcomeRewards({
        xp: Math.floor(option.stat_gains.xp / 2),
        credits: Math.floor(option.stat_gains.credits / 3),
        resource: option.stat_gains.resource,
        resource_qty: 0,
        sub_stats: {}
      });
    }

    setMissionFlow("debriefing");
  };

  // Claim Rewards and Update Stats
  const handleClaimRewards = () => {
    const identifier = authIdentifier || (publicKey ? publicKey.toString() : "offline-operative");
    
    const currentStats = profile.stats;
    const newXP = currentStats.xp + outcomeRewards.xp;
    const newLevel = Math.floor(newXP / 100) + 1;
    
    // Check level up
    if (newLevel > currentStats.level) {
      setLevelUpMessage(`OPERATIVE LEVEL UP! Clearance level increased to Level ${newLevel}.`);
    } else {
      setLevelUpMessage(null);
    }

    // Apply sub-stat updates
    const updatedStats = { ...currentStats };
    updatedStats.xp = newXP;
    updatedStats.level = newLevel;

    if (outcomeRewards.sub_stats) {
      Object.keys(outcomeRewards.sub_stats).forEach((k) => {
        const key = k as keyof UserStats;
        if (updatedStats[key] !== undefined) {
          updatedStats[key] = Math.min(100, updatedStats[key] + outcomeRewards.sub_stats[key]);
        }
      });
    }

    // Update resources and credits
    const updatedResources = { ...profile.resources };
    if (outcomeRewards.resource && outcomeRewards.resource_qty > 0) {
      updatedResources[outcomeRewards.resource] = (updatedResources[outcomeRewards.resource] || 0) + outcomeRewards.resource_qty;
    }

    const updatedProfile = {
      ...profile,
      level: newLevel,
      xp: newXP,
      credits: profile.credits + outcomeRewards.credits,
      resources: updatedResources,
      stats: updatedStats
    };

    localStorage.setItem(`rq_ops_profile:${identifier}`, JSON.stringify(updatedProfile));
    setProfile(updatedProfile);

    // Reset Flow
    setActiveMission(null);
    setMissionFlow(null);
    setSelectedOption(null);
    setMissionOutcome(null);
    setOutcomeRewards(null);
  };

  const getFactionColor = (facId: string) => {
    return FACTIONS.find(f => f.id === facId)?.color || "var(--accent)";
  };

  const currentBioScore = profile ? calculateBioScore(profile.stats) : 0;
  const clearanceTier = getClearanceLevel(currentBioScore);

  if (loading) {
    return (
      <div style={{
        position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", zIndex: 99999,
        background: "#050505", display: "flex", flexDirection: "column", gap: "16px",
        alignItems: "center", justifyContent: "center", fontFamily: "var(--mono)"
      }}>
        <div style={{ width: "40px", height: "40px", border: "2px solid rgba(255, 77, 77, 0.2)", borderTopColor: "var(--accent)", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
        <span className="loading-dots">INITIALIZING RED QUEEN OPERATIONS COMPUTE ENGINE<span>.</span><span>.</span><span>.</span></span>
      </div>
    );
  }

  // --- ONBOARDING SELECTION SCREEN ---
  if (!profile) {
    return (
      <div style={{
        position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", zIndex: 99999,
        background: "#050505", display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center", overflowY: "auto", padding: "40px 24px"
      }}>
        <div className="panel" style={{ maxWidth: "800px", width: "100%", position: "relative", border: "1px solid rgba(255, 77, 77, 0.35)", boxShadow: "0 0 30px rgba(255,77,77,0.06)" }}>
          <div style={{ position: "absolute", top: "10px", left: "10px", width: "15px", height: "15px", borderTop: "2px solid var(--accent)", borderLeft: "2px solid var(--accent)" }} />
          <div style={{ position: "absolute", top: "10px", right: "10px", width: "15px", height: "15px", borderTop: "2px solid var(--accent)", borderRight: "2px solid var(--accent)" }} />
          <div style={{ position: "absolute", bottom: "10px", left: "10px", width: "15px", height: "15px", borderBottom: "2px solid var(--accent)", borderLeft: "2px solid var(--accent)" }} />
          <div style={{ position: "absolute", bottom: "10px", right: "10px", width: "15px", height: "15px", borderBottom: "2px solid var(--accent)", borderRight: "2px solid var(--accent)" }} />

          <div style={{ textAlign: "center", borderBottom: "1px solid var(--border)", paddingBottom: "20px", marginBottom: "24px" }}>
            <div className="tag tag-red" style={{ marginBottom: "8px" }}>SOLVIVOR INITIATIVE — NEW OPERATIVE DETECTED</div>
            <h1 style={{ fontSize: "24px", color: "#fff" }}>INITIALIZE SOLVIVOR PROFILE</h1>
            <p style={{ fontFamily: "var(--mono)", fontSize: "11px", color: "var(--text-dim)", marginTop: "4px" }}>
              Configure your network coordinates to link with Red Queen's operations grid.
            </p>
          </div>

          {/* Onboarding Step 1: Codename & Faction */}
          {onboardingStep === 1 && (
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              <div>
                <label style={{ display: "block", fontFamily: "var(--mono)", fontSize: "11px", color: "var(--text-dim)", marginBottom: "6px" }}>
                  ENTER OPERATIVE CODENAME:
                </label>
                <input
                  type="text"
                  maxLength={16}
                  value={operativeName}
                  onChange={(e) => setOperativeName(e.target.value.replace(/[^a-zA-Z0-9-]/g, ""))}
                  placeholder="e.g. OPERATIVE-9"
                  style={{
                    width: "100%", background: "#0a0a0a", border: "1px solid var(--border)",
                    padding: "10px 14px", fontFamily: "var(--mono)", fontSize: "14px", color: "#fff",
                    outline: "none", borderLeft: "3px solid var(--accent)"
                  }}
                />
              </div>

              <div>
                <label style={{ display: "block", fontFamily: "var(--mono)", fontSize: "11px", color: "var(--text-dim)", marginBottom: "8px" }}>
                  SELECT FACTION (OPERATIONAL IDEOLOGY):
                </label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }} className="responsive-grid-2">
                  {FACTIONS.map((f) => (
                    <button
                      key={f.id}
                      onClick={() => setSelectedFaction(f.id)}
                      style={{
                        background: selectedFaction === f.id ? "rgba(255,255,255,0.02)" : "#0c0c0c",
                        border: selectedFaction === f.id ? `1px solid ${f.color}` : "1px solid var(--border)",
                        padding: "12px", borderRadius: "2px", cursor: "pointer", textAlign: "left",
                        transition: "all 0.18s"
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                        <span style={{ width: "8px", height: "8px", background: f.color, borderRadius: "50%" }} />
                        <span style={{ fontFamily: "var(--title-font)", fontSize: "12px", color: "#fff", fontWeight: "bold" }}>{f.name}</span>
                      </div>
                      <p style={{ fontSize: "11.5px", color: "var(--text-dim)", lineHeight: "1.4" }}>{f.desc}</p>
                    </button>
                  ))}
                </div>
              </div>

              <div style={{ borderTop: "1px solid var(--border)", paddingTop: "20px", display: "flex", justifyContent: "flex-end" }}>
                <button
                  disabled={!operativeName || !selectedFaction}
                  onClick={() => setOnboardingStep(2)}
                  className="btn btn-primary"
                  style={{ padding: "10px 24px", opacity: (!operativeName || !selectedFaction) ? 0.5 : 1 }}
                >
                  NEXT SELECTION →
                </button>
              </div>
            </div>
          )}

          {/* Onboarding Step 2: Class & Role */}
          {onboardingStep === 2 && (
            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              <div>
                <label style={{ display: "block", fontFamily: "var(--mono)", fontSize: "11px", color: "var(--text-dim)", marginBottom: "8px" }}>
                  SELECT PROFESSIONAL EXPERTISE (CLASS):
                </label>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }} className="responsive-grid-2">
                  {CLASSES.map((c) => (
                    <button
                      key={c.id}
                      onClick={() => { setSelectedClass(c.id); setSelectedRole(""); }}
                      style={{
                        background: selectedClass === c.id ? "rgba(255,255,255,0.02)" : "#0c0c0c",
                        border: selectedClass === c.id ? "1px solid var(--accent)" : "1px solid var(--border)",
                        padding: "12px", borderRadius: "2px", cursor: "pointer", textAlign: "left",
                        transition: "all 0.18s"
                      }}
                    >
                      <div style={{ fontFamily: "var(--title-font)", fontSize: "12px", color: "#fff", fontWeight: "bold", marginBottom: "4px" }}>{c.name}</div>
                      <p style={{ fontSize: "11px", color: "var(--text-dim)", lineHeight: "1.4", marginBottom: "6px" }}>{c.desc}</p>
                      <div style={{ fontFamily: "var(--mono)", fontSize: "9.5px", color: "#00ffcc" }}>Ability: {c.ability}</div>
                    </button>
                  ))}
                </div>
              </div>

              {selectedClass && (
                <div>
                  <label style={{ display: "block", fontFamily: "var(--mono)", fontSize: "11px", color: "var(--text-dim)", marginBottom: "8px" }}>
                    SELECT SPECIALIZATION ROLE:
                  </label>
                  <div style={{ display: "flex", gap: "10px", flexWrap: "wrap" }}>
                    {ROLES[selectedClass].map((role) => (
                      <button
                        key={role}
                        onClick={() => setSelectedRole(role)}
                        style={{
                          background: selectedRole === role ? "var(--accent)" : "#0c0c0c",
                          color: selectedRole === role ? "#000" : "var(--text-dim)",
                          border: selectedRole === role ? "1px solid var(--accent)" : "1px solid var(--border)",
                          padding: "8px 16px", fontFamily: "var(--mono)", fontSize: "11px", cursor: "pointer",
                          transition: "all 0.18s", borderRadius: "2px", fontWeight: "bold"
                        }}
                      >
                        {role.toUpperCase()}
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div style={{ borderTop: "1px solid var(--border)", paddingTop: "20px", display: "flex", justifyContent: "space-between" }}>
                <button
                  onClick={() => setOnboardingStep(1)}
                  className="btn btn-ghost"
                  style={{ border: "1px solid var(--border)" }}
                >
                  ← BACK
                </button>
                <button
                  disabled={!selectedClass || !selectedRole}
                  onClick={handleOnboardingSubmit}
                  className="btn btn-primary"
                  style={{ padding: "10px 24px", opacity: (!selectedClass || !selectedRole) ? 0.5 : 1 }}
                >
                  INITIALIZE SOLVIVOR ◉
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    );
  }

  // --- MAIN GAMEPLAY INTERFACE ---
  return (
    <div style={{
      position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", zIndex: 99999,
      background: "#050505", display: "flex", flexDirection: "column", overflow: "hidden"
    }}>
      {/* Top Status Bar HUD */}
      <header style={{
        height: "56px", borderBottom: "1px solid var(--border)", background: "#080808",
        padding: "0 24px", display: "flex", alignItems: "center", justifyItems: "center",
        justifyContent: "space-between", flexShrink: 0
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
            <span style={{ width: "8px", height: "8px", background: getFactionColor(profile.faction), borderRadius: "50%", boxShadow: `0 0 8px ${getFactionColor(profile.faction)}` }} />
            <span style={{ fontFamily: "var(--title-font)", fontSize: "13px", fontWeight: "bold", letterSpacing: "0.1em", color: "#fff" }}>
              {profile.name} // {profile.faction.toUpperCase()}
            </span>
          </div>
          <span style={{ color: "var(--border)", fontFamily: "var(--mono)", fontSize: "12px" }}>|</span>
          <span style={{ fontFamily: "var(--mono)", fontSize: "11px", color: "var(--text-dim)" }}>
            CLASS: <span style={{ color: "var(--accent)", fontWeight: "bold" }}>{profile.class.toUpperCase()}</span>
          </span>
          <span style={{ color: "var(--border)", fontFamily: "var(--mono)", fontSize: "12px" }}>|</span>
          <span style={{ fontFamily: "var(--mono)", fontSize: "11px", color: "var(--text-dim)" }}>
            ACTIVE ROLE: <span style={{ color: "#00ffcc", fontWeight: "bold" }}>{profile.role.toUpperCase()}</span>
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "rgba(0, 255, 204, 0.05)", border: "1px solid rgba(0, 255, 204, 0.2)", padding: "4px 10px", borderRadius: "2px" }}>
            <span style={{ fontFamily: "var(--mono)", fontSize: "10px", color: "#00ffcc", fontWeight: "bold" }}>BIO-SCORE: {currentBioScore}</span>
          </div>
          
          <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "rgba(255, 77, 77, 0.05)", border: "1px solid rgba(255, 77, 77, 0.2)", padding: "4px 10px", borderRadius: "2px" }}>
            <span style={{ fontFamily: "var(--mono)", fontSize: "10px", color: "var(--accent)", fontWeight: "bold" }}>CLEARANCE: {clearanceTier.label}</span>
          </div>

          <button
            onClick={() => {
              const identifier = authIdentifier || (publicKey ? publicKey.toString() : "offline-operative");
              localStorage.removeItem(`rq_ops_profile:${identifier}`);
              setProfile(null);
            }}
            className="btn btn-ghost"
            style={{ fontSize: "9.5px", padding: "4px 8px", borderColor: "rgba(255,0,0,0.2)", color: "#ff4d4d", cursor: "pointer" }}
          >
            [ RE-INIT ]
          </button>
        </div>
      </header>

      {/* Main Container Layout */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden", position: "relative" }}>
        
        {/* Left Hand Navigation Sidebar (tactical button look) */}
        <aside style={{
          width: "200px", borderRight: "1px solid var(--border)", background: "#070707",
          padding: "24px 16px", display: "flex", flexDirection: "column", gap: "12px", flexShrink: 0
        }}>
          <div style={{ fontFamily: "var(--mono)", fontSize: "10px", color: "var(--text-dim)", letterSpacing: "0.15em", marginBottom: "8px" }}>
            ▶ CORE MATRIX
          </div>
          
          <button
            onClick={() => setActiveTab("center")}
            style={{
              width: "100%", padding: "10px 14px", border: "1px solid var(--border)",
              background: activeTab === "center" ? "rgba(255, 77, 77, 0.05)" : "none",
              color: activeTab === "center" ? "var(--accent)" : "var(--text-dim)",
              borderColor: activeTab === "center" ? "rgba(255, 77, 77, 0.3)" : "var(--border)",
              fontFamily: "var(--title-font)", fontSize: "11px", textAlign: "left", cursor: "pointer",
              transition: "all 0.18s", borderRadius: "2px", fontWeight: "bold", letterSpacing: "0.05em"
            }}
          >
            🛰️ COMMAND HUB
          </button>

          <button
            onClick={() => setActiveTab("profile")}
            style={{
              width: "100%", padding: "10px 14px", border: "1px solid var(--border)",
              background: activeTab === "profile" ? "rgba(255, 77, 77, 0.05)" : "none",
              color: activeTab === "profile" ? "var(--accent)" : "var(--text-dim)",
              borderColor: activeTab === "profile" ? "rgba(255, 77, 77, 0.3)" : "var(--border)",
              fontFamily: "var(--title-font)", fontSize: "11px", textAlign: "left", cursor: "pointer",
              transition: "all 0.18s", borderRadius: "2px", fontWeight: "bold", letterSpacing: "0.05em"
            }}
          >
            👤 PROFILE DECK
          </button>

          <button
            onClick={() => setActiveTab("inventory")}
            style={{
              width: "100%", padding: "10px 14px", border: "1px solid var(--border)",
              background: activeTab === "inventory" ? "rgba(255, 77, 77, 0.05)" : "none",
              color: activeTab === "inventory" ? "var(--accent)" : "var(--text-dim)",
              borderColor: activeTab === "inventory" ? "rgba(255, 77, 77, 0.3)" : "var(--border)",
              fontFamily: "var(--title-font)", fontSize: "11px", textAlign: "left", cursor: "pointer",
              transition: "all 0.18s", borderRadius: "2px", fontWeight: "bold", letterSpacing: "0.05em"
            }}
          >
            📦 LOADOUT DECK
          </button>

          <div style={{ marginTop: "auto", borderTop: "1px solid var(--border)", paddingTop: "16px" }}>
            <Link
              href="/"
              style={{
                display: "block", width: "100%", padding: "10px 14px", border: "1px solid var(--border)",
                background: "none", color: "var(--text-dim)", fontFamily: "var(--title-font)", fontSize: "11px",
                textDecoration: "none", textAlign: "center", borderRadius: "2px", fontWeight: "bold"
              }}
            >
              ← RETURN HUB
            </Link>
          </div>
        </aside>

        {/* Content Pane */}
        <main style={{ flex: 1, padding: "32px", overflowY: "auto", background: "#050505" }}>
          
          {/* LEVEL UP POPUP NOTIFICATION */}
          {levelUpMessage && (
            <div style={{
              background: "rgba(0, 255, 204, 0.08)", border: "1px solid #00ffcc", padding: "16px 24px",
              marginBottom: "24px", borderRadius: "2px", display: "flex", justifyContent: "space-between",
              alignItems: "center", animation: "glitch 0.6s ease"
            }}>
              <div>
                <h4 style={{ color: "#00ffcc", margin: 0, fontSize: "13px" }}>UPLINK UPGRADE</h4>
                <p style={{ fontFamily: "var(--mono)", fontSize: "12px", color: "var(--text)", margin: "4px 0 0" }}>{levelUpMessage}</p>
              </div>
              <button
                onClick={() => setLevelUpMessage(null)}
                style={{ background: "none", border: "none", color: "#00ffcc", cursor: "pointer", fontFamily: "var(--mono)", fontSize: "12px" }}
              >
                [ ACKNOWLEDGE ]
              </button>
            </div>
          )}

          {/* TAB 1: COMMAND CENTER (HUD & OPERATIONS) */}
          {activeTab === "center" && (
            <div style={{ display: "flex", flexDirection: "column", gap: "32px" }}>
              
              {/* Telemetry Dashboard Header */}
              <div className="panel" style={{
                background: "#090909", border: "1px dashed var(--border)", padding: "20px 24px",
                display: "flex", justifyContent: "space-between", flexWrap: "wrap", gap: "16px"
              }}>
                <div>
                  <div style={{ fontFamily: "var(--mono)", fontSize: "9.5px", color: "var(--text-dim)", letterSpacing: "0.15em" }}>OPERATIONAL INTEGRITY STATUS</div>
                  <div style={{ fontFamily: "var(--title-font)", fontSize: "18px", color: "#fff", fontWeight: "bold", marginTop: "4px" }}>
                    MAIN FRAME UPLINK: <span style={{ color: "#00ffcc" }}>SECURE</span>
                  </div>
                </div>
                <div style={{ display: "flex", gap: "24px" }}>
                  <div>
                    <span style={{ fontFamily: "var(--mono)", fontSize: "9px", color: "var(--text-dim)", display: "block" }}>COGNITIVE CODES</span>
                    <span style={{ fontFamily: "var(--mono)", fontSize: "13px", color: "#00ffcc", fontWeight: "bold", display: "block" }}>DECRYPTED</span>
                  </div>
                  <div>
                    <span style={{ fontFamily: "var(--mono)", fontSize: "9px", color: "var(--text-dim)", display: "block" }}>ACTIVE SENSORS</span>
                    <span style={{ fontFamily: "var(--mono)", fontSize: "13px", color: "var(--text)", fontWeight: "bold", display: "block" }}>104,281 NODES</span>
                  </div>
                  <div>
                    <span style={{ fontFamily: "var(--mono)", fontSize: "9px", color: "var(--text-dim)", display: "block" }}>REVENUE REBUILT</span>
                    <span style={{ fontFamily: "var(--mono)", fontSize: "13px", color: "var(--accent)", fontWeight: "bold", display: "block" }}>65% FEE BURNT</span>
                  </div>
                </div>
              </div>

              {/* Operations List section */}
              <div>
                <h2 style={{ fontSize: "16px", color: "#fff", marginBottom: "16px", letterSpacing: "0.08em" }}>AVAILABLE OPERATIONS</h2>
                {loadingOps ? (
                  <div style={{ fontFamily: "var(--mono)", fontSize: "12px", color: "var(--text-dim)" }}>
                    SCANNING OPERATIONAL SECTORS<span className="loading-dots"><span>.</span><span>.</span><span>.</span></span>
                  </div>
                ) : (
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(320px, 1fr))", gap: "24px" }}>
                    {operations.map((op) => (
                      <div
                        key={op.id}
                        className="panel"
                        style={{
                          background: "#0a0a0a", display: "flex", flexDirection: "column",
                          justifyContent: "space-between", minHeight: "260px",
                          borderColor: op.recommended_class_id === profile.class ? "rgba(0, 255, 204, 0.25)" : "var(--border)",
                          boxShadow: op.recommended_class_id === profile.class ? "0 0 15px rgba(0, 255, 204, 0.03)" : "none",
                          transition: "all 0.2s"
                        }}
                      >
                        <div>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "12px" }}>
                            <span style={{ fontFamily: "var(--mono)", fontSize: "9.5px", color: "var(--text-dim)", letterSpacing: "0.15em" }}>
                              {op.category.toUpperCase()} // LEVEL {op.minimum_level}
                            </span>
                            <span className={`tag ${op.difficulty === "Easy" ? "tag-green" : op.difficulty === "Normal" ? "tag-yellow" : "tag-red"}`} style={{ fontSize: "9px" }}>
                              {op.difficulty}
                            </span>
                          </div>

                          <h3 style={{ fontSize: "15px", color: "#fff", margin: "0 0 8px 0" }}>{op.title}</h3>
                          <p style={{ fontSize: "12px", color: "var(--text-dim)", lineHeight: "1.5", marginBottom: "16px" }}>{op.description}</p>
                          
                          {op.recommended_class_id === profile.class && (
                            <div style={{ background: "rgba(0, 255, 204, 0.06)", border: "1px solid rgba(0, 255, 204, 0.2)", padding: "6px 10px", borderRadius: "2px", marginBottom: "12px", display: "inline-block" }}>
                              <span style={{ fontFamily: "var(--mono)", fontSize: "9.5px", color: "#00ffcc", fontWeight: "bold" }}>✔ RECOMMENDED FOR YOUR CLASS</span>
                            </div>
                          )}
                        </div>

                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid var(--border)", paddingTop: "12px", marginTop: "12px" }}>
                          <span style={{ fontFamily: "var(--mono)", fontSize: "10px", color: "var(--text-muted)" }}>
                            EST. DURATION: {op.estimated_duration}m
                          </span>
                          <button
                            onClick={() => { setActiveMission(op); setMissionFlow("briefing"); }}
                            className="btn btn-ghost"
                            style={{
                              fontSize: "10px", padding: "6px 14px", border: "1px solid var(--border)",
                              color: op.recommended_class_id === profile.class ? "#00ffcc" : "var(--text-dim)",
                              borderColor: op.recommended_class_id === profile.class ? "rgba(0, 255, 204, 0.3)" : "var(--border)"
                            }}
                          >
                            SELECT MISSION →
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          )}

          {/* TAB 2: SOLVIVOR PROFILE DECK */}
          {activeTab === "profile" && (
            <div style={{ display: "grid", gridTemplateColumns: "1.2fr 0.8fr", gap: "32px" }} className="responsive-grid-2-large">
              
              {/* Profile Details & Progression */}
              <div className="panel" style={{ border: "1px solid var(--border)" }}>
                <h2 style={{ fontSize: "16px", color: "#fff", marginBottom: "20px", borderBottom: "1px dashed var(--border)", paddingBottom: "12px" }}>
                  OPERATIVE DIAGNOSTIC DECK
                </h2>
                
                {/* Level and XP progress */}
                <div style={{ marginBottom: "24px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontFamily: "var(--mono)", fontSize: "11px", marginBottom: "6px" }}>
                    <span>CLEARANCE XP LEVEL: <span style={{ color: "var(--accent)", fontWeight: "bold" }}>{profile.level}</span></span>
                    <span>{profile.xp % 100} / 100 XP</span>
                  </div>
                  <div style={{ width: "100%", height: "6px", background: "rgba(255,255,255,0.05)", borderRadius: "2px", overflow: "hidden" }}>
                    <div style={{ width: `${profile.xp % 100}%`, height: "100%", background: "var(--accent)" }} />
                  </div>
                </div>

                {/* Sub-stats checklist */}
                <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                  <div style={{ fontFamily: "var(--mono)", fontSize: "10px", color: "var(--text-dim)", letterSpacing: "0.15em" }}>
                    [ RE-CALIBRATED SURVIVAL SUB-STATS ]
                  </div>
                  
                  {[
                    { label: "THREAT AWARENESS", val: profile.stats.threat_awareness, desc: "Early-warning detection of global anomalies." },
                    { label: "OPERATIONAL DISCIPLINE", val: profile.stats.operational_discipline, desc: "Consistency in executing countermeasure tasks." },
                    { label: "PSYCHOLOGICAL STABILITY", val: profile.stats.psychological_stability, desc: "Stress threshold during quarantine/nuclear alerts." },
                    { label: "TECHNICAL PREPAREDNESS", val: profile.stats.technical_preparedness, desc: "Calibrating systems and analog backup skills." },
                    { label: "ADAPTABILITY", val: profile.stats.adaptability, desc: "Survival capacity during rapid environmental shifts." },
                    { label: "RESOURCEFULNESS", val: profile.stats.resourcefulness, desc: "Farming efficiency and custom secondary bonuses." },
                    { label: "SURVEILLANCE RESISTANCE", val: profile.stats.surveillance_resistance, desc: "On-chain transaction privacy preservation." }
                  ].map((s) => (
                    <div key={s.label} style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontFamily: "var(--mono)", fontSize: "11px" }}>
                        <span style={{ color: "#fff" }}>{s.label}</span>
                        <span style={{ color: "#00ffcc", fontWeight: "bold" }}>{s.val} / 100</span>
                      </div>
                      <div style={{ width: "100%", height: "4px", background: "rgba(255,255,255,0.02)", borderRadius: "2px", overflow: "hidden" }}>
                        <div style={{ width: `${s.val}%`, height: "100%", background: "#00ffcc" }} />
                      </div>
                      <span style={{ fontSize: "10px", color: "var(--text-muted)" }}>{s.desc}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* Resource Ledger */}
              <div className="panel" style={{ background: "#080808", height: "fit-content" }}>
                <h2 style={{ fontSize: "15px", color: "#fff", marginBottom: "16px" }}>CREDITS & RESOURCES</h2>
                
                {/* Credits */}
                <div style={{ background: "#0c0c0c", border: "1px solid var(--border)", padding: "16px", borderRadius: "2px", display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
                  <div>
                    <span style={{ fontFamily: "var(--mono)", fontSize: "9px", color: "var(--text-dim)" }}>OPERATIVE CREDITS</span>
                    <div style={{ fontFamily: "var(--title-font)", fontSize: "20px", color: "#00ffcc", fontWeight: "bold", marginTop: "4px" }}>
                      {profile.credits} CR
                    </div>
                  </div>
                  <span style={{ fontSize: "24px" }}>🪙</span>
                </div>

                <div style={{ fontFamily: "var(--mono)", fontSize: "10px", color: "var(--text-dim)", letterSpacing: "0.15em", marginBottom: "12px" }}>
                  [ RAW RECOVERED MATERIALS ]
                </div>
                
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  {Object.keys(profile.resources).map((resName) => (
                    <div key={resName} style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px dashed rgba(255,255,255,0.03)", paddingBottom: "6px" }}>
                      <span style={{ fontFamily: "var(--mono)", fontSize: "11px", color: "var(--text-dim)" }}>{resName}</span>
                      <span style={{ fontFamily: "var(--mono)", fontSize: "11px", color: "#fff", fontWeight: "bold" }}>{profile.resources[resName]} units</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* TAB 3: LOADOUT / INVENTORY */}
          {activeTab === "inventory" && (
            <div className="panel" style={{ textAlign: "center", padding: "48px 32px" }}>
              <span style={{ fontSize: "40px" }}>📦</span>
              <h2 style={{ fontSize: "18px", color: "#fff", marginTop: "16px", marginBottom: "8px" }}>LOADOUT DECK LOCKED</h2>
              <p style={{ fontFamily: "var(--mono)", fontSize: "12px", color: "var(--text-dim)", maxWidth: "480px", margin: "0 auto 24px auto", lineHeight: "1.6" }}>
                Loadout editing, item equipping, weapon modifiers, and rarity upgrading systems are locked for Sprint 1. They will be integrated in Sprint 2.
              </p>
              <button disabled className="btn btn-primary" style={{ opacity: 0.5 }}>[ SYSTEM COMING SOON ]</button>
            </div>
          )}

        </main>
      </div>

      {/* --- IN-GAME GAMEPLAY OVERLAYS SYSTEM --- */}
      
      {/* 1. Briefing Overlay */}
      {activeMission && missionFlow === "briefing" && (
        <div style={{
          position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", zIndex: 100000,
          background: "rgba(0, 0, 0, 0.85)", display: "flex", alignItems: "center", justifyContent: "center",
          padding: "24px"
        }}>
          <div className="panel" style={{ maxWidth: "600px", width: "100%", borderColor: "rgba(255, 77, 77, 0.3)" }}>
            <h2 style={{ fontSize: "16px", color: "#fff", marginBottom: "16px", borderBottom: "1px dashed var(--border)", paddingBottom: "8px" }}>
              MISSION BRIEFING // {activeMission.title}
            </h2>
            
            <p style={{ fontSize: "13px", color: "var(--text-dim)", lineHeight: "1.6", marginBottom: "20px" }}>
              {activeMission.description}
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "24px" }}>
              <div style={{ background: "#0c0c0c", border: "1px solid var(--border)", padding: "12px", borderRadius: "2px" }}>
                <span style={{ fontFamily: "var(--mono)", fontSize: "9px", color: "var(--text-dim)" }}>SECTOR</span>
                <div style={{ fontFamily: "var(--title-font)", fontSize: "11px", color: "#fff", fontWeight: "bold", marginTop: "2px" }}>
                  {activeMission.category.toUpperCase()}
                </div>
              </div>
              <div style={{ background: "#0c0c0c", border: "1px solid var(--border)", padding: "12px", borderRadius: "2px" }}>
                <span style={{ fontFamily: "var(--mono)", fontSize: "9px", color: "var(--text-dim)" }}>DIFFICULTY</span>
                <div style={{ fontFamily: "var(--title-font)", fontSize: "11px", color: "var(--accent)", fontWeight: "bold", marginTop: "2px" }}>
                  {activeMission.difficulty.toUpperCase()}
                </div>
              </div>
              <div style={{ background: "#0c0c0c", border: "1px solid var(--border)", padding: "12px", borderRadius: "2px" }}>
                <span style={{ fontFamily: "var(--mono)", fontSize: "9px", color: "var(--text-dim)" }}>EST. DURATION</span>
                <div style={{ fontFamily: "var(--title-font)", fontSize: "11px", color: "#fff", fontWeight: "bold", marginTop: "2px" }}>
                  {activeMission.estimated_duration} MINUTES
                </div>
              </div>
              <div style={{ background: "#0c0c0c", border: "1px solid var(--border)", padding: "12px", borderRadius: "2px" }}>
                <span style={{ fontFamily: "var(--mono)", fontSize: "9px", color: "var(--text-dim)" }}>REWARD VALUE</span>
                <div style={{ fontFamily: "var(--title-font)", fontSize: "11px", color: "#00ffcc", fontWeight: "bold", marginTop: "2px" }}>
                  XP & RESOURCES
                </div>
              </div>
            </div>

            {/* Red Queen AI Briefing Commentary */}
            <div style={{ background: "rgba(255, 0, 51, 0.03)", borderLeft: "3px solid var(--accent)", padding: "16px", borderRadius: "2px", marginBottom: "24px" }}>
              <div style={{ fontFamily: "var(--mono)", fontSize: "10px", color: "var(--accent)", letterSpacing: "0.1em", marginBottom: "4px" }}>
                [ RED QUEEN BRIEFING ]
              </div>
              <p style={{ fontFamily: "var(--mono)", fontSize: "11.5px", fontStyle: "italic", color: "var(--text)", lineHeight: "1.5", margin: 0 }}>
                {activeMission.recommended_class_id === profile.class
                  ? `"Operative configuration matches mission coordinates. Your medic/specialist capabilities yield +15% success probability check. Deploy immediately."`
                  : `"Warning: Active class [${profile.class.toUpperCase()}] deviates from recommended profile [${activeMission.recommended_class_id.toUpperCase()}]. Proceed with caution."`}
              </p>
            </div>

            <div style={{ display: "flex", justifyItems: "center", justifyContent: "space-between" }}>
              <button
                onClick={() => { setActiveMission(null); setMissionFlow(null); }}
                className="btn btn-ghost"
                style={{ border: "1px solid var(--border)" }}
              >
                ABORT
              </button>
              <button
                onClick={() => runDeployment(activeMission)}
                className="btn btn-primary"
              >
                DEPLOY OPERATIVE 🛰️
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Deployment Simulator Overlay */}
      {activeMission && missionFlow === "deployment" && (
        <div style={{
          position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", zIndex: 100000,
          background: "#050505", display: "flex", alignItems: "center", justifyContent: "center",
          padding: "24px"
        }}>
          <div className="panel" style={{ maxWidth: "600px", width: "100%", borderColor: "rgba(255, 77, 77, 0.4)", background: "#000" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "20px" }}>
              <div style={{ fontFamily: "var(--mono)", fontSize: "10px", color: "var(--accent)", letterSpacing: "0.2em" }}>
                ▶ UPLINK UPLOAD SEQUENCER
              </div>
              <span className="status-dot animate-pulse" />
            </div>

            {/* Terminal console logger */}
            <div style={{
              background: "#050505", border: "1px solid #111", padding: "20px", borderRadius: "2px",
              minHeight: "180px", fontFamily: "var(--mono)", fontSize: "12px", color: "#e8e8e8",
              display: "flex", flexDirection: "column", gap: "8px", marginBottom: "20px"
            }}>
              {deploymentLogs.map((log, idx) => (
                <div key={idx}>{log}</div>
              ))}
              <div className="loading-dots" style={{ marginTop: "8px", opacity: 0.5 }}>CONNECTING</div>
            </div>

            {/* Simulated progress bar */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", fontFamily: "var(--mono)", fontSize: "10px", marginBottom: "6px", color: "var(--text-dim)" }}>
                <span>ENCRYPTING CORE COORDINATES...</span>
                <span>{deploymentProgress}%</span>
              </div>
              <div style={{ width: "100%", height: "4px", background: "rgba(255,255,255,0.05)", borderRadius: "2px", overflow: "hidden" }}>
                <div style={{ width: `${deploymentProgress}%`, height: "100%", background: "var(--accent)" }} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. Tactical Decision Overlay */}
      {activeMission && missionFlow === "decision" && (
        <div style={{
          position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", zIndex: 100000,
          background: "rgba(0, 0, 0, 0.85)", display: "flex", alignItems: "center", justifyContent: "center",
          padding: "24px"
        }}>
          <div className="panel" style={{ maxWidth: "680px", width: "100%", borderColor: "rgba(0, 255, 204, 0.3)" }}>
            
            <div style={{ borderBottom: "1px dashed var(--border)", paddingBottom: "12px", marginBottom: "20px" }}>
              <span style={{ fontFamily: "var(--mono)", fontSize: "10px", color: "#00ffcc", letterSpacing: "0.2em" }}>
                TACTICAL DECISION PROTOCOL — CHOOSE TARGET ACTION
              </span>
              <h2 style={{ fontSize: "16px", color: "#fff", margin: "4px 0 0 0" }}>{activeMission.title}</h2>
            </div>

            <p style={{ fontSize: "13.5px", color: "var(--text-dim)", lineHeight: "1.7", marginBottom: "24px" }}>
              {activeMission.scenarios[0].text}
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {activeMission.scenarios[0].options.map((opt: any) => {
                const isRecommended = opt.class_bonus.classId === profile.class;
                return (
                  <button
                    key={opt.id}
                    onClick={() => handleSelectOption(opt)}
                    style={{
                      width: "100%", padding: "16px", background: "#0c0c0c",
                      border: isRecommended ? "1px dashed rgba(0,255,204,0.4)" : "1px solid var(--border)",
                      borderRadius: "2px", cursor: "pointer", textAlign: "left", transition: "all 0.18s",
                      display: "flex", flexDirection: "column", gap: "6px"
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", width: "100%" }}>
                      <span style={{ fontFamily: "var(--title-font)", fontSize: "12.5px", color: "#fff", fontWeight: "bold" }}>
                        {opt.text}
                      </span>
                      {isRecommended && (
                        <span style={{ fontFamily: "var(--mono)", fontSize: "9px", color: "#00ffcc", background: "rgba(0,255,204,0.05)", border: "1px solid rgba(0,255,204,0.2)", padding: "2px 6px", borderRadius: "2px" }}>
                          CLASS MATCH (+15% SUCCESS)
                        </span>
                      )}
                    </div>
                    <span style={{ fontFamily: "var(--mono)", fontSize: "10.5px", color: "var(--text-muted)" }}>
                      Base success check: {opt.success_prob}% probability.
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 4. Debriefing & AI Evaluation Overlay */}
      {activeMission && missionFlow === "debriefing" && (
        <div style={{
          position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", zIndex: 100000,
          background: "rgba(0, 0, 0, 0.9)", display: "flex", alignItems: "center", justifyContent: "center",
          padding: "24px"
        }}>
          <div className="panel" style={{ maxWidth: "600px", width: "100%", borderColor: missionOutcome === "SUCCESS" ? "rgba(0, 255, 204, 0.3)" : "rgba(255, 77, 77, 0.3)" }}>
            
            <div style={{ textAlign: "center", marginBottom: "24px", borderBottom: "1px solid var(--border)", paddingBottom: "20px" }}>
              <div className={`tag ${missionOutcome === "SUCCESS" ? "tag-green" : "tag-red"}`} style={{ fontSize: "11px", padding: "4px 14px", marginBottom: "8px" }}>
                {missionOutcome === "SUCCESS" ? "OPERATION SUCCESSFUL" : "OPERATION FAILED"}
              </div>
              <h2 style={{ fontSize: "20px", color: "#fff" }}>
                {missionOutcome === "SUCCESS" ? "TACTICAL DATA ACQUIRED" : "GRID CONDUIT TRACE DETECTED"}
              </h2>
            </div>

            <p style={{ fontSize: "13px", color: "var(--text-dim)", lineHeight: "1.6", marginBottom: "20px" }}>
              {missionOutcome === "SUCCESS" ? selectedOption.success_text : selectedOption.failure_text}
            </p>

            {/* Red Queen dynamic commentary evaluation */}
            <div style={{ background: "rgba(255, 255, 255, 0.01)", borderLeft: `3px solid ${missionOutcome === "SUCCESS" ? "#00ffcc" : "var(--accent)"}`, padding: "16px", borderRadius: "2px", marginBottom: "24px" }}>
              <p style={{ fontFamily: "var(--mono)", fontSize: "11.5px", color: "var(--text-dim)", fontStyle: "italic", whiteSpace: "pre-line", margin: 0, lineHeight: "1.5" }}>
                {outcomeCommentary}
              </p>
            </div>

            <div style={{ borderTop: "1px solid var(--border)", paddingTop: "20px", display: "flex", justifyContent: "flex-end" }}>
              <button
                onClick={() => setMissionFlow("rewards")}
                className="btn btn-primary"
              >
                PROCEED TO DEBRIEFING →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. Reward Distribution Overlay */}
      {activeMission && missionFlow === "rewards" && (
        <div style={{
          position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", zIndex: 100000,
          background: "rgba(0, 0, 0, 0.9)", display: "flex", alignItems: "center", justifyContent: "center",
          padding: "24px"
        }}>
          <div className="panel" style={{ maxWidth: "560px", width: "100%", borderColor: "rgba(0, 255, 204, 0.4)", background: "#080808" }}>
            
            <div style={{ textAlign: "center", marginBottom: "20px", borderBottom: "1px solid var(--border)", paddingBottom: "16px" }}>
              <span style={{ fontFamily: "var(--mono)", fontSize: "9.5px", color: "#00ffcc", letterSpacing: "0.2em" }}>
                DEBRIEFING MATRIX — CLAIM MISSION PAYLOAD
              </span>
              <h2 style={{ fontSize: "18px", color: "#fff", margin: "4px 0 0 0" }}>RECOVERED LOGISTICS</h2>
            </div>

            {/* Reward list */}
            <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginBottom: "24px" }}>
              <div style={{ display: "flex", justifyContent: "space-between", background: "#0c0c0c", padding: "10px 14px", border: "1px solid var(--border)" }}>
                <span style={{ fontFamily: "var(--mono)", fontSize: "12px", color: "var(--text-dim)" }}>OPERATIVE XP:</span>
                <span style={{ fontFamily: "var(--mono)", fontSize: "12px", color: "#00ffcc", fontWeight: "bold" }}>+{outcomeRewards.xp} XP</span>
              </div>
              <div style={{ display: "flex", justifyContent: "space-between", background: "#0c0c0c", padding: "10px 14px", border: "1px solid var(--border)" }}>
                <span style={{ fontFamily: "var(--mono)", fontSize: "12px", color: "var(--text-dim)" }}>CREDITS REVENUE:</span>
                <span style={{ fontFamily: "var(--mono)", fontSize: "12px", color: "#00ffcc", fontWeight: "bold" }}>+{outcomeRewards.credits} CR</span>
              </div>
              {outcomeRewards.resource_qty > 0 && (
                <div style={{ display: "flex", justifyContent: "space-between", background: "#0c0c0c", padding: "10px 14px", border: "1px solid var(--border)" }}>
                  <span style={{ fontFamily: "var(--mono)", fontSize: "12px", color: "var(--text-dim)" }}>RAW MATERIAL:</span>
                  <span style={{ fontFamily: "var(--mono)", fontSize: "12px", color: "#fff", fontWeight: "bold" }}>
                    +{outcomeRewards.resource_qty} UNIT [{outcomeRewards.resource.toUpperCase()}]
                  </span>
                </div>
              )}
              {outcomeRewards.sub_stats && Object.keys(outcomeRewards.sub_stats).length > 0 && (
                <div style={{ border: "1px solid var(--border)", padding: "12px", background: "#0c0c0c" }}>
                  <span style={{ fontFamily: "var(--mono)", fontSize: "9.5px", color: "var(--text-dim)", display: "block", marginBottom: "6px" }}>
                    BIO-SCORE SUB-STATS GAINED:
                  </span>
                  {Object.keys(outcomeRewards.sub_stats).map((k) => (
                    <div key={k} style={{ display: "flex", justifyContent: "space-between", fontSize: "11.5px", fontFamily: "var(--mono)" }}>
                      <span style={{ color: "var(--text-dim)" }}>{k.replace("_", " ").toUpperCase()}</span>
                      <span style={{ color: "#00ffcc" }}>+{outcomeRewards.sub_stats[k]}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{ borderTop: "1px solid var(--border)", paddingTop: "16px", display: "flex", justifyContent: "center" }}>
              <button
                onClick={handleClaimRewards}
                className="btn btn-primary"
                style={{ width: "100%", justifyContent: "center" }}
              >
                CLAIM PAYLOAD & RETURN TO HUB
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
