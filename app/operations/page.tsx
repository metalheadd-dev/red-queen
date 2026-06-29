"use client";
import { useState, useEffect } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { useAuth } from "@/components/AuthProvider";
import Link from "next/link";
import { DEFAULT_STATS, UserStats, calculateBioScore, getClearanceLevel } from "@/lib/progression";

// Factions list with unique colors and philosophies
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

// Classes list with preferred loadouts
const CLASSES = [
  { id: "Assault", name: "Assault", desc: "Tactical combat specialization, heavy breach charges, and kinetic energy weapons.", preferred_gear: "Heavy Armor, Breach charges, Kinetic rifles", ability: "Overcharge Shield Grid" },
  { id: "Recon", name: "Recon", desc: "Stealth operations, zone scanning, target acquisition, and mapping surveillance grids.", preferred_gear: "Sensor array, Thermal cloak, Sniper rifle", ability: "Scan Grid Weaknesses" },
  { id: "Engineer", name: "Engineer", desc: "Structural defenses, generator calibration, and automated drone network sweeps.", preferred_gear: "Decoy swarm, Drone core, Power cutters", ability: "Repair Node Grid" },
  { id: "Medic", name: "Medic", desc: "Biological hazard containment, stim injection, and pathogen diagnostic treatment.", preferred_gear: "Stim injector, Gas filter, Medkit", ability: "Purify Bio-Toxins" },
  { id: "Scientist", name: "Scientist", desc: "Anomaly decoding, gravity wave analysis, and physical data decryption sweeps.", preferred_gear: "Gravity analyzer, Data pad, Shield scanner", ability: "Decode Anomalous Signals" },
  { id: "Specialist", name: "Specialist", desc: "Algorithmic routing, network signature security, and Sybil counter-measures.", preferred_gear: "Decoy keys, Multi-hop routers, Wasm shields", ability: "Overload Sybil Trackers" }
];

// Core roles
const ROLES: Record<string, string[]> = {
  Assault: ["Heavy Assault", "Vanguard Commando", "Breach Specialist"],
  Recon: ["Sniper", "Pathfinder", "Intel Scout"],
  Engineer: ["Field Engineer", "Drone Maintenance", "Grid Operator"],
  Medic: ["Combat Medic", "Bio Analyst", "Quarantine Inspector"],
  Scientist: ["Signal Decoder", "Gravity Analyst", "Data Cryptologist"],
  Specialist: ["Drone Operator", "Infiltrator", "Network Router"]
};

export default function OperationsPage() {
  const { publicKey } = useWallet();
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
        }, 550);
      }
    }, 550);
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
        alignItems: "center", justifyContent: "center", fontFamily: "var(--mono)",
        border: "3px solid var(--accent-dim)"
      }}>
        <div style={{ width: "50px", height: "50px", border: "3px solid rgba(255, 77, 77, 0.1)", borderTopColor: "var(--accent)", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
        <span className="loading-dots" style={{ fontSize: "14px", letterSpacing: "0.1em", fontWeight: "bold", color: "var(--accent)" }}>
          INITIALIZING RED QUEEN COMMAND MAIN FRAME<span>.</span><span>.</span><span>.</span>
        </span>
      </div>
    );
  }

  // --- ONBOARDING SELECTION SCREEN ---
  if (!profile) {
    const selectedFactionDetails = FACTIONS.find(f => f.id === selectedFaction);
    const selectedClassDetails = CLASSES.find(c => c.id === selectedClass);

    return (
      <div style={{
        position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", zIndex: 99999,
        background: "#030303", display: "flex", flexDirection: "column",
        alignItems: "center", justifyContent: "center", overflowY: "auto", padding: "40px 24px"
      }}>
        <div className="panel" style={{
          maxWidth: "1100px", width: "100%", position: "relative",
          background: "#060606", border: "2px solid rgba(255, 77, 77, 0.4)",
          boxShadow: "0 0 50px rgba(255, 77, 77, 0.12)", padding: "40px"
        }}>
          {/* Corner brackets */}
          <div style={{ position: "absolute", top: "12px", left: "12px", width: "24px", height: "24px", borderTop: "3px solid var(--accent)", borderLeft: "3px solid var(--accent)" }} />
          <div style={{ position: "absolute", top: "12px", right: "12px", width: "24px", height: "24px", borderTop: "3px solid var(--accent)", borderRight: "3px solid var(--accent)" }} />
          <div style={{ position: "absolute", bottom: "12px", left: "12px", width: "24px", height: "24px", borderBottom: "3px solid var(--accent)", borderLeft: "3px solid var(--accent)" }} />
          <div style={{ position: "absolute", bottom: "12px", right: "12px", width: "24px", height: "24px", borderBottom: "3px solid var(--accent)", borderRight: "3px solid var(--accent)" }} />

          <div style={{ textAlign: "center", borderBottom: "1px solid rgba(255,255,255,0.08)", paddingBottom: "24px", marginBottom: "32px" }}>
            <div className="tag tag-red" style={{ marginBottom: "12px", fontSize: "11px", letterSpacing: "0.2em" }}>
              CRITICAL NOTICE: SECURITY ACCESS VERIFICATION REQUESTED
            </div>
            <h1 style={{ fontSize: "36px", color: "#fff", letterSpacing: "0.1em" }}>INITIALIZE SOLVIVOR PROFILE</h1>
            <p style={{ fontFamily: "var(--mono)", fontSize: "13px", color: "var(--text-dim)", marginTop: "8px" }}>
              Configure your tactical profile to link with Red Queen's global defense operations network.
            </p>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "1.3fr 0.7fr", gap: "40px" }} className="responsive-grid-2-large">
            {/* Left Selection Controls */}
            <div>
              {/* Onboarding Step 1: Codename & Faction */}
              {onboardingStep === 1 && (
                <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                  <div>
                    <label style={{ display: "block", fontFamily: "var(--mono)", fontSize: "12px", color: "var(--text-dim)", marginBottom: "8px", fontWeight: "bold" }}>
                      [01] ENTER OPERATIVE CALLSIGN:
                    </label>
                    <input
                      type="text"
                      maxLength={16}
                      value={operativeName}
                      onChange={(e) => setOperativeName(e.target.value.replace(/[^a-zA-Z0-9-]/g, ""))}
                      placeholder="e.g. OPERATIVE-9"
                      style={{
                        width: "100%", background: "#0a0a0a", border: "1px solid var(--border)",
                        padding: "14px 18px", fontFamily: "var(--mono)", fontSize: "16px", color: "#fff",
                        outline: "none", borderLeft: "4px solid var(--accent)"
                      }}
                    />
                  </div>

                  <div>
                    <label style={{ display: "block", fontFamily: "var(--mono)", fontSize: "12px", color: "var(--text-dim)", marginBottom: "12px", fontWeight: "bold" }}>
                      [02] ASSIGN DIVISION FACTION (OPERATIONAL IDEOLOGY):
                    </label>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }} className="responsive-grid-2">
                      {FACTIONS.map((f) => (
                        <button
                          key={f.id}
                          onClick={() => setSelectedFaction(f.id)}
                          style={{
                            background: selectedFaction === f.id ? "rgba(255,255,255,0.03)" : "#090909",
                            border: selectedFaction === f.id ? `2px solid ${f.color}` : "1px solid var(--border)",
                            padding: "16px", borderRadius: "2px", cursor: "pointer", textAlign: "left",
                            transition: "all 0.18s"
                          }}
                        >
                          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "6px" }}>
                            <span style={{ width: "10px", height: "10px", background: f.color, borderRadius: "50%", boxShadow: `0 0 8px ${f.color}` }} />
                            <span style={{ fontFamily: "var(--title-font)", fontSize: "14px", color: "#fff", fontWeight: "bold" }}>{f.name}</span>
                          </div>
                          <p style={{ fontSize: "12px", color: "var(--text-dim)", lineHeight: "1.4" }}>{f.desc}</p>
                        </button>
                      ))}
                    </div>
                  </div>

                  <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: "24px", display: "flex", justifyContent: "flex-end" }}>
                    <button
                      disabled={!operativeName || !selectedFaction}
                      onClick={() => setOnboardingStep(2)}
                      className="btn btn-primary"
                      style={{ padding: "14px 36px", fontSize: "13px", opacity: (!operativeName || !selectedFaction) ? 0.5 : 1 }}
                    >
                      CHOOSE CLASS →
                    </button>
                  </div>
                </div>
              )}

              {/* Onboarding Step 2: Class & Role */}
              {onboardingStep === 2 && (
                <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                  <div>
                    <label style={{ display: "block", fontFamily: "var(--mono)", fontSize: "12px", color: "var(--text-dim)", marginBottom: "12px", fontWeight: "bold" }}>
                      [03] CHOOSE OPERATIVE DISCIPLINE (CLASS):
                    </label>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }} className="responsive-grid-2">
                      {CLASSES.map((c) => (
                        <button
                          key={c.id}
                          onClick={() => { setSelectedClass(c.id); setSelectedRole(""); }}
                          style={{
                            background: selectedClass === c.id ? "rgba(255,255,255,0.03)" : "#090909",
                            border: selectedClass === c.id ? "2px solid var(--accent)" : "1px solid var(--border)",
                            padding: "16px", borderRadius: "2px", cursor: "pointer", textAlign: "left",
                            transition: "all 0.18s"
                          }}
                        >
                          <div style={{ fontFamily: "var(--title-font)", fontSize: "14px", color: "#fff", fontWeight: "bold", marginBottom: "6px" }}>{c.name}</div>
                          <p style={{ fontSize: "12px", color: "var(--text-dim)", lineHeight: "1.4", marginBottom: "8px" }}>{c.desc}</p>
                          <div style={{ fontFamily: "var(--mono)", fontSize: "10.5px", color: "#00ffcc" }}>Ability: {c.ability}</div>
                        </button>
                      ))}
                    </div>
                  </div>

                  {selectedClass && (
                    <div>
                      <label style={{ display: "block", fontFamily: "var(--mono)", fontSize: "12px", color: "var(--text-dim)", marginBottom: "12px", fontWeight: "bold" }}>
                        [04] SPECIFY TACTICAL SPECIALIZATION ROLE:
                      </label>
                      <div style={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                        {ROLES[selectedClass].map((role) => (
                          <button
                            key={role}
                            onClick={() => setSelectedRole(role)}
                            style={{
                              background: selectedRole === role ? "var(--accent)" : "#090909",
                              color: selectedRole === role ? "#000" : "var(--text-dim)",
                              border: selectedRole === role ? "2px solid var(--accent)" : "1px solid var(--border)",
                              padding: "12px 24px", fontFamily: "var(--mono)", fontSize: "12px", cursor: "pointer",
                              transition: "all 0.18s", borderRadius: "2px", fontWeight: "bold"
                            }}
                          >
                            {role.toUpperCase()}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  <div style={{ borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: "24px", display: "flex", justifyContent: "space-between" }}>
                    <button
                      onClick={() => setOnboardingStep(1)}
                      className="btn btn-ghost"
                      style={{ border: "1px solid var(--border)", padding: "12px 24px" }}
                    >
                      ← BACK
                    </button>
                    <button
                      disabled={!selectedClass || !selectedRole}
                      onClick={handleOnboardingSubmit}
                      className="btn btn-primary"
                      style={{ padding: "14px 36px", fontSize: "13px", opacity: (!selectedClass || !selectedRole) ? 0.5 : 1 }}
                    >
                      COMMISSION SOLVIVOR ◉
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Right Interactive Preview Panel - Reserved for Future Artwork */}
            <div style={{
              background: "#080808", border: "1px solid rgba(255,255,255,0.05)",
              padding: "24px", display: "flex", flexDirection: "column", justifyItems: "center",
              justifyContent: "space-between", position: "relative"
            }}>
              <div style={{ fontFamily: "var(--mono)", fontSize: "10px", color: "var(--text-muted)", letterSpacing: "0.2em" }}>
                [ PREVIEW SYSTEM DOSSIER ]
              </div>

              {/* Faction / Class Artwork container */}
              <div style={{
                flex: 1, display: "flex", flexDirection: "column", alignItems: "center",
                justifyContent: "center", margin: "24px 0", minHeight: "220px",
                border: "1px dashed rgba(255, 77, 77, 0.2)", background: "rgba(0,0,0,0.3)",
                position: "relative"
              }}>
                {/* Visual Bounding Brackets for future artwork */}
                <div style={{ position: "absolute", top: "10px", left: "10px", width: "12px", height: "12px", borderTop: "1.5px solid rgba(255,255,255,0.15)", borderLeft: "1.5px solid rgba(255,255,255,0.15)" }} />
                <div style={{ position: "absolute", top: "10px", right: "10px", width: "12px", height: "12px", borderTop: "1.5px solid rgba(255,255,255,0.15)", borderRight: "1.5px solid rgba(255,255,255,0.15)" }} />
                
                {selectedFactionDetails ? (
                  <div style={{ textAlign: "center", padding: "16px" }}>
                    {/* Faction emblem holder */}
                    <div style={{
                      width: "64px", height: "64px", border: `2px dashed ${selectedFactionDetails.color}`,
                      borderRadius: "50%", margin: "0 auto 16px auto", display: "flex", alignItems: "center",
                      justifyContent: "center", background: "rgba(255,255,255,0.01)"
                    }}>
                      <span style={{ color: selectedFactionDetails.color, fontSize: "28px" }}>🛡️</span>
                    </div>
                    <div style={{ fontFamily: "var(--title-font)", fontSize: "16px", color: "#fff", fontWeight: "bold" }}>
                      {selectedFactionDetails.name.toUpperCase()} DIVISION
                    </div>
                    <p style={{ fontSize: "11.5px", color: "var(--text-dim)", marginTop: "8px", fontStyle: "italic" }}>
                      "{selectedFactionDetails.ideology}"
                    </p>
                  </div>
                ) : (
                  <span style={{ fontFamily: "var(--mono)", fontSize: "11px", color: "var(--text-muted)" }}>
                    [ AWAITING FACTION DATA ]
                  </span>
                )}
              </div>

              {/* Class indicator details */}
              <div style={{ background: "#0c0c0c", border: "1px solid var(--border)", padding: "16px" }}>
                <span style={{ fontFamily: "var(--mono)", fontSize: "9px", color: "var(--text-dim)", display: "block" }}>
                  SELECTED PROFESSIONAL DISCIPLINE
                </span>
                <div style={{ fontFamily: "var(--title-font)", fontSize: "14px", color: selectedClassDetails ? "var(--accent)" : "#fff", fontWeight: "bold", marginTop: "4px" }}>
                  {selectedClassDetails ? selectedClassDetails.name.toUpperCase() : "UNASSIGNED"}
                </div>
                {selectedClassDetails && (
                  <div style={{ fontFamily: "var(--mono)", fontSize: "10px", color: "var(--text-dim)", marginTop: "6px" }}>
                    Preferred gear: {selectedClassDetails.preferred_gear}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  // --- IMMERSIVE GAMEPLAY MAIN HUB ---
  return (
    <div style={{
      position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", zIndex: 99999,
      background: "#030303", display: "flex", flexDirection: "column", overflow: "hidden"
    }}>
      {/* Top Status Bar HUD - Upgraded size and glow */}
      <header style={{
        height: "64px", borderBottom: "2px solid rgba(255, 77, 77, 0.25)", background: "#060606",
        padding: "0 32px", display: "flex", alignItems: "center", justifyItems: "center",
        justifyContent: "space-between", flexShrink: 0
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ width: "12px", height: "12px", background: getFactionColor(profile.faction), borderRadius: "50%", boxShadow: `0 0 12px ${getFactionColor(profile.faction)}` }} />
            <span style={{ fontFamily: "var(--title-font)", fontSize: "15px", fontWeight: "900", letterSpacing: "0.15em", color: "#fff" }}>
              {profile.name} // {profile.faction.toUpperCase()}
            </span>
          </div>
          <span style={{ color: "rgba(255,255,255,0.15)", fontFamily: "var(--mono)", fontSize: "14px" }}>|</span>
          <span style={{ fontFamily: "var(--mono)", fontSize: "12.5px", color: "var(--text-dim)" }}>
            CLASS: <span style={{ color: "var(--accent)", fontWeight: "bold" }}>{profile.class.toUpperCase()}</span>
          </span>
          <span style={{ color: "rgba(255,255,255,0.15)", fontFamily: "var(--mono)", fontSize: "14px" }}>|</span>
          <span style={{ fontFamily: "var(--mono)", fontSize: "12.5px", color: "var(--text-dim)" }}>
            OPERATIVE ROLE: <span style={{ color: "#00ffcc", fontWeight: "bold" }}>{profile.role.toUpperCase()}</span>
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "20px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", background: "rgba(0, 255, 204, 0.08)", border: "1px solid rgba(0, 255, 204, 0.3)", padding: "6px 14px", borderRadius: "2px" }}>
            <span style={{ fontFamily: "var(--mono)", fontSize: "11px", color: "#00ffcc", fontWeight: "bold", letterSpacing: "0.05em" }}>BIO-SCORE: {currentBioScore}</span>
          </div>
          
          <div style={{ display: "flex", alignItems: "center", gap: "10px", background: "rgba(255, 77, 77, 0.08)", border: "1px solid rgba(255, 77, 77, 0.3)", padding: "6px 14px", borderRadius: "2px" }}>
            <span style={{ fontFamily: "var(--mono)", fontSize: "11px", color: "var(--accent)", fontWeight: "bold", letterSpacing: "0.05em" }}>CLEARANCE: {clearanceTier.label}</span>
          </div>

          <button
            onClick={() => {
              const identifier = authIdentifier || (publicKey ? publicKey.toString() : "offline-operative");
              localStorage.removeItem(`rq_ops_profile:${identifier}`);
              setProfile(null);
            }}
            className="btn btn-ghost"
            style={{ fontSize: "10px", padding: "6px 12px", borderColor: "rgba(255,0,0,0.3)", color: "#ff4d4d", cursor: "pointer", fontWeight: "bold" }}
          >
            [ RE-INITIALIZE ]
          </button>
        </div>
      </header>

      {/* Main Container Layout */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden", position: "relative" }}>
        
        {/* Navigation Sidebar - Upgraded button styling */}
        <aside style={{
          width: "220px", borderRight: "1px solid var(--border)", background: "#060606",
          padding: "32px 20px", display: "flex", flexDirection: "column", gap: "16px", flexShrink: 0
        }}>
          <div style={{ fontFamily: "var(--mono)", fontSize: "11px", color: "var(--text-dim)", letterSpacing: "0.2em", marginBottom: "8px", fontWeight: "bold" }}>
            ▶ OPERATIONAL DECKS
          </div>
          
          <button
            onClick={() => setActiveTab("center")}
            style={{
              width: "100%", padding: "14px 18px", border: "1px solid var(--border)",
              background: activeTab === "center" ? "rgba(255, 77, 77, 0.08)" : "none",
              color: activeTab === "center" ? "var(--accent)" : "var(--text-dim)",
              borderColor: activeTab === "center" ? "rgba(255, 77, 77, 0.4)" : "var(--border)",
              fontFamily: "var(--title-font)", fontSize: "12px", textAlign: "left", cursor: "pointer",
              transition: "all 0.18s", borderRadius: "2px", fontWeight: "bold", letterSpacing: "0.08em"
            }}
          >
            🛰️ COMMAND HUB
          </button>

          <button
            onClick={() => setActiveTab("profile")}
            style={{
              width: "100%", padding: "14px 18px", border: "1px solid var(--border)",
              background: activeTab === "profile" ? "rgba(255, 77, 77, 0.08)" : "none",
              color: activeTab === "profile" ? "var(--accent)" : "var(--text-dim)",
              borderColor: activeTab === "profile" ? "rgba(255, 77, 77, 0.4)" : "var(--border)",
              fontFamily: "var(--title-font)", fontSize: "12px", textAlign: "left", cursor: "pointer",
              transition: "all 0.18s", borderRadius: "2px", fontWeight: "bold", letterSpacing: "0.08em"
            }}
          >
            👤 OPERATIVE DOSSIER
          </button>

          <button
            onClick={() => setActiveTab("inventory")}
            style={{
              width: "100%", padding: "14px 18px", border: "1px solid var(--border)",
              background: activeTab === "inventory" ? "rgba(255, 77, 77, 0.08)" : "none",
              color: activeTab === "inventory" ? "var(--accent)" : "var(--text-dim)",
              borderColor: activeTab === "inventory" ? "rgba(255, 77, 77, 0.4)" : "var(--border)",
              fontFamily: "var(--title-font)", fontSize: "12px", textAlign: "left", cursor: "pointer",
              transition: "all 0.18s", borderRadius: "2px", fontWeight: "bold", letterSpacing: "0.08em"
            }}
          >
            📦 EQUIPMENT DECK
          </button>

          <div style={{ marginTop: "auto", borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: "20px" }}>
            <Link
              href="/"
              style={{
                display: "block", width: "100%", padding: "12px 14px", border: "1px solid var(--border)",
                background: "none", color: "var(--text-dim)", fontFamily: "var(--title-font)", fontSize: "11px",
                textDecoration: "none", textAlign: "center", borderRadius: "2px", fontWeight: "bold", letterSpacing: "0.08em"
              }}
            >
              ← DISCONNECT HUB
            </Link>
          </div>
        </aside>

        {/* Content Pane */}
        <main style={{ flex: 1, padding: "40px", overflowY: "auto", background: "#030303" }}>
          
          {/* LEVEL UP POPUP NOTIFICATION */}
          {levelUpMessage && (
            <div style={{
              background: "rgba(0, 255, 204, 0.08)", border: "2px solid #00ffcc", padding: "20px 28px",
              marginBottom: "32px", borderRadius: "2px", display: "flex", justifyContent: "space-between",
              alignItems: "center", animation: "glitch 0.6s ease", boxShadow: "0 0 20px rgba(0,255,204,0.1)"
            }}>
              <div>
                <h4 style={{ color: "#00ffcc", margin: 0, fontSize: "14px", letterSpacing: "0.1em" }}>UPLINK UPGRADE</h4>
                <p style={{ fontFamily: "var(--mono)", fontSize: "13px", color: "var(--text)", margin: "6px 0 0" }}>{levelUpMessage}</p>
              </div>
              <button
                onClick={() => setLevelUpMessage(null)}
                style={{ background: "none", border: "none", color: "#00ffcc", cursor: "pointer", fontFamily: "var(--mono)", fontSize: "13px", fontWeight: "bold" }}
              >
                [ ACKNOWLEDGE ]
              </button>
            </div>
          )}

          {/* TAB 1: COMMAND CENTER (HUD & OPERATIONS) */}
          {activeTab === "center" && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "32px" }} className="responsive-grid-3">
              
              {/* Column 1: Red Queen AI Hologram & Telemetry Logs */}
              <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                <div className="panel" style={{
                  background: "#080808", border: "1px solid rgba(255, 77, 77, 0.3)",
                  position: "relative", padding: "24px", display: "flex", flexDirection: "column", gap: "16px"
                }}>
                  {/* Hologram Camera Brackets */}
                  <div style={{ position: "absolute", top: "10px", left: "10px", width: "12px", height: "12px", borderTop: "1.5px solid rgba(255,77,77,0.3)", borderLeft: "1.5px solid rgba(255,77,77,0.3)" }} />
                  <div style={{ position: "absolute", top: "10px", right: "10px", width: "12px", height: "12px", borderTop: "1.5px solid rgba(255,77,77,0.3)", borderRight: "1.5px solid rgba(255,77,77,0.3)" }} />

                  <span style={{ fontFamily: "var(--mono)", fontSize: "9.5px", color: "var(--accent)", letterSpacing: "0.15em", fontWeight: "bold" }}>
                    [ RED QUEEN AI HOLOGRAM PROJECTION ]
                  </span>
                  
                  {/* AI Portrait Container - Reserved for Future Artwork */}
                  <div style={{
                    height: "220px", width: "100%", background: "rgba(0,0,0,0.5)",
                    border: "1px dashed rgba(255, 77, 77, 0.2)", display: "flex", alignItems: "center",
                    justifyContent: "center", position: "relative", overflow: "hidden"
                  }}>
                    {/* Simulated scanning laser line */}
                    <div style={{
                      position: "absolute", top: 0, left: 0, right: 0, height: "2px",
                      background: "rgba(255, 77, 77, 0.3)", boxShadow: "0 0 10px rgba(255,77,77,0.6)",
                      animation: "scanlines 4s linear infinite"
                    }} />
                    <span style={{ fontFamily: "var(--mono)", fontSize: "11px", color: "var(--text-muted)", letterSpacing: "0.1em" }}>
                      [ HOLO_TRANSMISSION_ACTIVE ]
                    </span>
                  </div>

                  {/* AI recommendation brief */}
                  <div style={{ borderTop: "1px dashed rgba(255,255,255,0.08)", paddingTop: "14px" }}>
                    <div style={{ fontFamily: "var(--mono)", fontSize: "10px", color: "var(--text-dim)", marginBottom: "4px" }}>
                      TACTICAL RECOMMENDATION:
                    </div>
                    <p style={{ fontFamily: "var(--mono)", fontSize: "12px", color: "#00ffcc", lineHeight: "1.5", margin: 0 }}>
                      "Prioritize Operation Sanctuary Search in Sector Alpha to calibrate biological containment sensors before deploying to high-gravity quadrants."
                    </p>
                  </div>
                </div>

                {/* Operations status feed */}
                <div className="panel" style={{ background: "#050505", border: "1px solid var(--border)", padding: "20px" }}>
                  <span style={{ fontFamily: "var(--mono)", fontSize: "10px", color: "var(--text-dim)", letterSpacing: "0.15em", display: "block", marginBottom: "12px" }}>
                    ▶ LIVE MAINFRAME STATUS ALERTS
                  </span>
                  <div style={{ fontFamily: "var(--mono)", fontSize: "11px", display: "flex", flexDirection: "column", gap: "8px", color: "var(--text-muted)" }}>
                    <div>[INFO] Sensor nodes scanned: 104,281 anomalies monitored.</div>
                    <div>[WARN] Gravitational distortion detected in Sector Beta.</div>
                    <div>[SYS] Decryption pipeline verified; 65% fee swap buffer ready.</div>
                  </div>
                </div>
              </div>

              {/* Column 2: Available Operations List (Cinematic Cards) */}
              <div style={{ gridColumn: "span 2", display: "flex", flexDirection: "column", gap: "24px" }}>
                
                {/* Holographic Telemetry World Map Container - Reserved for Future Artwork */}
                <div style={{
                  height: "220px", border: "1px dashed rgba(255,255,255,0.15)", background: "#060606",
                  position: "relative", display: "flex", alignItems: "center", justifyContent: "center"
                }}>
                  {/* Outer target brackets */}
                  <div style={{ position: "absolute", top: "12px", left: "12px", width: "16px", height: "16px", borderTop: "2px solid rgba(255,255,255,0.2)", borderLeft: "2px solid rgba(255,255,255,0.2)" }} />
                  <div style={{ position: "absolute", top: "12px", right: "12px", width: "16px", height: "16px", borderTop: "2px solid rgba(255,255,255,0.2)", borderRight: "2px solid rgba(255,255,255,0.2)" }} />
                  
                  <span style={{ fontFamily: "var(--mono)", fontSize: "12px", color: "var(--text-muted)", letterSpacing: "0.2em" }}>
                    [ SECTOR_TELEMETRY_MAP_GRID ]
                  </span>
                </div>

                <div>
                  <h2 style={{ fontSize: "18px", color: "#fff", marginBottom: "16px", letterSpacing: "0.08em" }}>AVAILABLE MISSION REGIONS</h2>
                  {loadingOps ? (
                    <div style={{ fontFamily: "var(--mono)", fontSize: "13px", color: "var(--text-dim)" }}>
                      SCANNING OPERATIONAL SECTORS<span className="loading-dots"><span>.</span><span>.</span><span>.</span></span>
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                      {operations.map((op) => (
                        <div
                          key={op.id}
                          className="panel"
                          style={{
                            background: "#080808", border: op.recommended_class_id === profile.class ? "2px solid rgba(0, 255, 204, 0.3)" : "1px solid var(--border)",
                            padding: "32px", display: "flex", flexDirection: "column", gap: "16px",
                            boxShadow: op.recommended_class_id === profile.class ? "0 0 25px rgba(0, 255, 204, 0.05)" : "none"
                          }}
                        >
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                              <span className={`tag ${op.difficulty === "Easy" ? "tag-green" : op.difficulty === "Normal" ? "tag-yellow" : "tag-red"}`} style={{ fontSize: "10px", padding: "4px 10px" }}>
                                {op.difficulty.toUpperCase()}
                              </span>
                              <span style={{ fontFamily: "var(--mono)", fontSize: "11px", color: "var(--text-dim)", letterSpacing: "0.15em" }}>
                                {op.category.toUpperCase()} SECTOR
                              </span>
                            </div>
                            {op.recommended_class_id === profile.class && (
                              <span style={{ fontFamily: "var(--mono)", fontSize: "10px", color: "#00ffcc", background: "rgba(0,255,204,0.05)", border: "1px solid rgba(0,255,204,0.3)", padding: "4px 10px", borderRadius: "2px" }}>
                                RECOMMENDED TACTICAL CONFIGURATION
                              </span>
                            )}
                          </div>

                          {/* Massive mission title */}
                          <h3 style={{ fontSize: "22px", color: "#fff", margin: 0, letterSpacing: "0.05em" }}>{op.title}</h3>
                          
                          <p style={{ fontSize: "13.5px", color: "var(--text-dim)", lineHeight: "1.6", margin: 0 }}>
                            {op.description}
                          </p>

                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: "20px", marginTop: "8px" }}>
                            <div style={{ display: "flex", gap: "24px" }}>
                              <div>
                                <span style={{ fontFamily: "var(--mono)", fontSize: "9px", color: "var(--text-muted)", display: "block" }}>EST. DURATION</span>
                                <span style={{ fontFamily: "var(--mono)", fontSize: "12px", color: "#fff", fontWeight: "bold" }}>{op.estimated_duration} MINUTES</span>
                              </div>
                              <div>
                                <span style={{ fontFamily: "var(--mono)", fontSize: "9px", color: "var(--text-muted)", display: "block" }}>ENERGY COST</span>
                                <span style={{ fontFamily: "var(--mono)", fontSize: "12px", color: "#fff", fontWeight: "bold" }}>{op.energy_cost} EC</span>
                              </div>
                            </div>

                            <button
                              onClick={() => { setActiveMission(op); setMissionFlow("briefing"); }}
                              className="btn btn-primary"
                              style={{
                                fontSize: "11px", padding: "10px 24px",
                                background: op.recommended_class_id === profile.class ? "#00ffcc" : "var(--accent)",
                                color: "#000"
                              }}
                            >
                              UPLINK DEPLOYMENT →
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* TAB 2: SOLVIVOR PROFILE DECK (OPERATIVE DOSSIER) */}
          {activeTab === "profile" && (
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "32px" }} className="responsive-grid-3">
              
              {/* Profile Bounding Frame - Reserved for Future Artwork */}
              <div className="panel" style={{
                background: "#080808", border: "1px solid rgba(255,255,255,0.08)",
                padding: "32px", display: "flex", flexDirection: "column", justifyItems: "center",
                justifyContent: "space-between", position: "relative"
              }}>
                <div style={{ position: "absolute", top: "10px", left: "10px", width: "16px", height: "16px", borderTop: "2px solid var(--accent)", borderLeft: "2px solid var(--accent)" }} />
                <div style={{ position: "absolute", top: "10px", right: "10px", width: "16px", height: "16px", borderTop: "2px solid var(--accent)", borderRight: "2px solid var(--accent)" }} />
                
                <span style={{ fontFamily: "var(--mono)", fontSize: "10px", color: "var(--text-muted)", letterSpacing: "0.2em" }}>
                  [ OPERATIVE PORTRAIT DOSSIER ]
                </span>

                {/* Portrait box */}
                <div style={{
                  flex: 1, border: "1px dashed rgba(255, 77, 77, 0.25)", background: "rgba(0,0,0,0.5)",
                  margin: "24px 0", display: "flex", alignItems: "center", justifyContent: "center",
                  position: "relative"
                }}>
                  <div style={{ fontFamily: "var(--mono)", fontSize: "11px", color: "var(--text-muted)" }}>
                    [ UPLINK_BIOMETRIC_PREVIEW ]
                  </div>
                  {/* Telemetry targeting overlays */}
                  <div style={{ position: "absolute", top: "40%", left: "40%", width: "20%", height: "20%", border: "1px dashed rgba(255,77,77,0.3)", borderRadius: "50%" }} />
                </div>

                {/* Identity Stamps */}
                <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", borderBottom: "1px dashed rgba(255,255,255,0.05)", paddingBottom: "6px" }}>
                    <span style={{ fontFamily: "var(--mono)", fontSize: "10px", color: "var(--text-dim)" }}>DIVISION STAMP:</span>
                    <span style={{ fontFamily: "var(--title-font)", fontSize: "12px", color: getFactionColor(profile.faction), fontWeight: "bold" }}>
                      {profile.faction.toUpperCase()}
                    </span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between" }}>
                    <span style={{ fontFamily: "var(--mono)", fontSize: "10px", color: "var(--text-dim)" }}>CLEARANCE STATUS:</span>
                    <span style={{ fontFamily: "var(--mono)", fontSize: "11.5px", color: "#00ffcc", fontWeight: "bold" }}>
                      ACTIVE // SECURE
                    </span>
                  </div>
                </div>
              </div>

              {/* Sub-stats Diagnostic panel */}
              <div className="panel" style={{ border: "1px solid var(--border)", padding: "32px", gridColumn: "span 2" }}>
                <h2 style={{ fontSize: "18px", color: "#fff", marginBottom: "24px", borderBottom: "1px dashed var(--border)", paddingBottom: "12px" }}>
                  OPERATIVE READINESS EVALUATION
                </h2>
                
                {/* Level and XP progress bar */}
                <div style={{ marginBottom: "32px", background: "#080808", border: "1px solid var(--border)", padding: "20px" }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontFamily: "var(--mono)", fontSize: "12.5px", marginBottom: "8px" }}>
                    <span>OPERATIVE LEVEL: <span style={{ color: "var(--accent)", fontWeight: "bold" }}>{profile.level}</span></span>
                    <span>{profile.xp % 100} / 100 XP TO UPGRADE</span>
                  </div>
                  <div style={{ width: "100%", height: "8px", background: "rgba(255,255,255,0.04)", borderRadius: "2px", overflow: "hidden" }}>
                    <div style={{ width: `${profile.xp % 100}%`, height: "100%", background: "var(--accent)" }} />
                  </div>
                </div>

                {/* Sub-stats telemetry checklist */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }} className="responsive-grid-2">
                  {[
                    { label: "THREAT AWARENESS", val: profile.stats.threat_awareness, desc: "Early-warning detection of global anomalies." },
                    { label: "OPERATIONAL DISCIPLINE", val: profile.stats.operational_discipline, desc: "Consistency in executing countermeasure tasks." },
                    { label: "PSYCHOLOGICAL STABILITY", val: profile.stats.psychological_stability, desc: "Stress threshold during quarantine/nuclear alerts." },
                    { label: "TECHNICAL PREPAREDNESS", val: profile.stats.technical_preparedness, desc: "Calibrating systems and analog backup skills." },
                    { label: "ADAPTABILITY", val: profile.stats.adaptability, desc: "Survival capacity during rapid environmental shifts." },
                    { label: "RESOURCEFULNESS", val: profile.stats.resourcefulness, desc: "Farming efficiency and custom secondary bonuses." },
                    { label: "SURVEILLANCE RESISTANCE", val: profile.stats.surveillance_resistance, desc: "On-chain transaction privacy preservation." }
                  ].map((s) => (
                    <div key={s.label} style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                      <div style={{ display: "flex", justifyContent: "space-between", fontFamily: "var(--mono)", fontSize: "12px" }}>
                        <span style={{ color: "#fff", fontWeight: "bold" }}>{s.label}</span>
                        <span style={{ color: "#00ffcc", fontWeight: "bold" }}>{s.val} %</span>
                      </div>
                      <div style={{ width: "100%", height: "6px", background: "rgba(255,255,255,0.02)", borderRadius: "2px", overflow: "hidden" }}>
                        <div style={{ width: `${s.val}%`, height: "100%", background: "#00ffcc" }} />
                      </div>
                      <span style={{ fontSize: "11px", color: "var(--text-muted)" }}>{s.desc}</span>
                    </div>
                  ))}
                </div>

                {/* Resources display */}
                <div style={{ borderTop: "1px dashed var(--border)", paddingTop: "24px", marginTop: "24px" }}>
                  <div style={{ fontFamily: "var(--mono)", fontSize: "11px", color: "var(--text-dim)", letterSpacing: "0.15em", marginBottom: "16px" }}>
                    [ OPERATIVE RESOURCE PROFILE ]
                  </div>
                  
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: "16px" }}>
                    {/* Credits */}
                    <div style={{ background: "#080808", border: "1px solid var(--border)", padding: "16px", borderRadius: "2px" }}>
                      <span style={{ fontFamily: "var(--mono)", fontSize: "9px", color: "var(--text-dim)", display: "block" }}>CREDITS</span>
                      <span style={{ fontFamily: "var(--title-font)", fontSize: "16px", color: "#00ffcc", fontWeight: "bold", display: "block", marginTop: "4px" }}>
                        {profile.credits} CR
                      </span>
                    </div>
                    {Object.keys(profile.resources).map((resName) => (
                      <div key={resName} style={{ background: "#080808", border: "1px solid var(--border)", padding: "16px", borderRadius: "2px" }}>
                        <span style={{ fontFamily: "var(--mono)", fontSize: "9px", color: "var(--text-dim)", display: "block" }}>{resName.toUpperCase()}</span>
                        <span style={{ fontFamily: "var(--mono)", fontSize: "14px", color: "#fff", fontWeight: "bold", display: "block", marginTop: "4px" }}>
                          {profile.resources[resName]} UNITS
                        </span>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Achievements Container - Reserved for Future Artwork */}
                <div style={{ borderTop: "1px dashed var(--border)", paddingTop: "24px", marginTop: "24px" }}>
                  <div style={{ fontFamily: "var(--mono)", fontSize: "11px", color: "var(--text-dim)", letterSpacing: "0.15em", marginBottom: "16px" }}>
                    [ RECON MEDALS & VALOR AWARDS ]
                  </div>
                  
                  <div style={{ display: "grid", gridTemplateColumns: "repeat(8, 1fr)", gap: "12px" }}>
                    {Array.from({ length: 8 }).map((_, i) => (
                      <div key={i} style={{
                        aspectRatio: "1", border: "1px dashed rgba(255,255,255,0.06)",
                        background: "rgba(0,0,0,0.3)", display: "flex", alignItems: "center",
                        justifyContent: "center", position: "relative"
                      }}>
                        {/* Hexagon shape marker */}
                        <div style={{
                          width: "60%", height: "60%", border: "1.5px solid rgba(255,255,255,0.03)",
                          transform: "rotate(45deg)", background: "rgba(255,255,255,0.01)"
                        }} />
                      </div>
                    ))}
                  </div>
                </div>

              </div>

            </div>
          )}

          {/* TAB 3: LOADOUT GRID (INVENTORY UPGRADE) */}
          {activeTab === "inventory" && (
            <div style={{ display: "grid", gridTemplateColumns: "0.8fr 1.4fr 0.8fr", gap: "32px" }} className="responsive-grid-3">
              
              {/* Left Column Gear Slots */}
              <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                <div style={{ fontFamily: "var(--mono)", fontSize: "11px", color: "var(--text-dim)", letterSpacing: "0.15em", fontWeight: "bold" }}>
                  [ VITAL DEFENSE SLOTS ]
                </div>

                {/* Helmet Slot - Reserved for Future Artwork */}
                <div className="panel" style={{ background: "#080808", padding: "16px 20px", border: "1px solid var(--border)", display: "flex", gap: "16px", alignItems: "center" }}>
                  <div style={{ width: "48px", height: "48px", border: "1px dashed rgba(255,255,255,0.15)", background: "rgba(0,0,0,0.3)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <span style={{ fontSize: "20px" }}>🪖</span>
                  </div>
                  <div>
                    <span style={{ fontFamily: "var(--mono)", fontSize: "9px", color: "var(--text-muted)", display: "block" }}>HELMET SLOT</span>
                    <span style={{ fontFamily: "var(--title-font)", fontSize: "12px", color: "var(--text-dim)", display: "block", fontWeight: "bold" }}>EMPTY</span>
                  </div>
                </div>

                {/* Armor Slot - Reserved for Future Artwork */}
                <div className="panel" style={{ background: "#080808", padding: "16px 20px", border: "1px solid var(--border)", display: "flex", gap: "16px", alignItems: "center" }}>
                  <div style={{ width: "48px", height: "48px", border: "1px dashed rgba(255,255,255,0.15)", background: "rgba(0,0,0,0.3)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <span style={{ fontSize: "20px" }}>🛡️</span>
                  </div>
                  <div>
                    <span style={{ fontFamily: "var(--mono)", fontSize: "9px", color: "var(--text-muted)", display: "block" }}>VITAL SHIELD / ARMOR</span>
                    <span style={{ fontFamily: "var(--title-font)", fontSize: "12px", color: "var(--text-dim)", display: "block", fontWeight: "bold" }}>EMPTY</span>
                  </div>
                </div>

                {/* Primary Weapon Slot - Reserved for Future Artwork */}
                <div className="panel" style={{ background: "#080808", padding: "16px 20px", border: "1px solid var(--border)", display: "flex", gap: "16px", alignItems: "center" }}>
                  <div style={{ width: "48px", height: "48px", border: "1px dashed rgba(255,255,255,0.15)", background: "rgba(0,0,0,0.3)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <span style={{ fontSize: "20px" }}>🔫</span>
                  </div>
                  <div>
                    <span style={{ fontFamily: "var(--mono)", fontSize: "9px", color: "var(--text-muted)", display: "block" }}>PRIMARY WEAPON</span>
                    <span style={{ fontFamily: "var(--title-font)", fontSize: "12px", color: "var(--text-dim)", display: "block", fontWeight: "bold" }}>EMPTY</span>
                  </div>
                </div>

                {/* Secondary Weapon Slot - Reserved for Future Artwork */}
                <div className="panel" style={{ background: "#080808", padding: "16px 20px", border: "1px solid var(--border)", display: "flex", gap: "16px", alignItems: "center" }}>
                  <div style={{ width: "48px", height: "48px", border: "1px dashed rgba(255,255,255,0.15)", background: "rgba(0,0,0,0.3)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <span style={{ fontSize: "20px" }}>🔫</span>
                  </div>
                  <div>
                    <span style={{ fontFamily: "var(--mono)", fontSize: "9px", color: "var(--text-muted)", display: "block" }}>SECONDARY WEAPON</span>
                    <span style={{ fontFamily: "var(--title-font)", fontSize: "12px", color: "var(--text-dim)", display: "block", fontWeight: "bold" }}>EMPTY</span>
                  </div>
                </div>

              </div>

              {/* Central Column: Operative Vector Silhouette - Reserved for Future Artwork */}
              <div className="panel" style={{
                background: "#050505", border: "1px dashed rgba(255,255,255,0.1)",
                display: "flex", flexDirection: "column", justifyItems: "center", justifyContent: "center",
                alignItems: "center", minHeight: "440px", position: "relative"
              }}>
                {/* Crosshair target overlay */}
                <svg width="240" height="240" viewBox="0 0 100 100" style={{ opacity: 0.15, position: "absolute" }}>
                  <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="0.5" />
                  <circle cx="50" cy="50" r="25" fill="none" stroke="currentColor" strokeWidth="0.5" strokeDasharray="2,2" />
                  <line x1="50" y1="5" x2="50" y2="95" stroke="currentColor" strokeWidth="0.5" />
                  <line x1="5" y1="50" x2="95" y2="50" stroke="currentColor" strokeWidth="0.5" />
                </svg>
                
                <span style={{ fontFamily: "var(--mono)", fontSize: "12px", color: "var(--text-muted)", zIndex: 1, letterSpacing: "0.2em" }}>
                  [ OPERATIVE SILHOUETTE HUD ]
                </span>
                <span style={{ fontFamily: "var(--mono)", fontSize: "10px", color: "var(--text-muted)", zIndex: 1, marginTop: "4px" }}>
                  AWAITING GEOMETRY INJECTION
                </span>
              </div>

              {/* Right Column Gear Slots */}
              <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
                <div style={{ fontFamily: "var(--mono)", fontSize: "11px", color: "var(--text-dim)", letterSpacing: "0.15em", fontWeight: "bold" }}>
                  [ TACTICAL UTILITY SLOTS ]
                </div>

                {/* Utility Slot - Reserved for Future Artwork */}
                <div className="panel" style={{ background: "#080808", padding: "16px 20px", border: "1px solid var(--border)", display: "flex", gap: "16px", alignItems: "center" }}>
                  <div style={{ width: "48px", height: "48px", border: "1px dashed rgba(255,255,255,0.15)", background: "rgba(0,0,0,0.3)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <span style={{ fontSize: "20px" }}>🛠️</span>
                  </div>
                  <div>
                    <span style={{ fontFamily: "var(--mono)", fontSize: "9px", color: "var(--text-muted)", display: "block" }}>UTILITY CONFIG KIT</span>
                    <span style={{ fontFamily: "var(--title-font)", fontSize: "12px", color: "var(--text-dim)", display: "block", fontWeight: "bold" }}>EMPTY</span>
                  </div>
                </div>

                {/* Medical Slot - Reserved for Future Artwork */}
                <div className="panel" style={{ background: "#080808", padding: "16px 20px", border: "1px solid var(--border)", display: "flex", gap: "16px", alignItems: "center" }}>
                  <div style={{ width: "48px", height: "48px", border: "1px dashed rgba(255,255,255,0.15)", background: "rgba(0,0,0,0.3)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <span style={{ fontSize: "20px" }}>🧪</span>
                  </div>
                  <div>
                    <span style={{ fontFamily: "var(--mono)", fontSize: "9px", color: "var(--text-muted)", display: "block" }}>MEDICAL KIT</span>
                    <span style={{ fontFamily: "var(--title-font)", fontSize: "12px", color: "var(--text-dim)", display: "block", fontWeight: "bold" }}>EMPTY</span>
                  </div>
                </div>

                {/* Backpack Slot - Reserved for Future Artwork */}
                <div className="panel" style={{ background: "#080808", padding: "16px 20px", border: "1px solid var(--border)", display: "flex", gap: "16px", alignItems: "center" }}>
                  <div style={{ width: "48px", height: "48px", border: "1px dashed rgba(255,255,255,0.15)", background: "rgba(0,0,0,0.3)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <span style={{ fontSize: "20px" }}>🎒</span>
                  </div>
                  <div>
                    <span style={{ fontFamily: "var(--mono)", fontSize: "9px", color: "var(--text-muted)", display: "block" }}>TACTICAL BACKPACK</span>
                    <span style={{ fontFamily: "var(--title-font)", fontSize: "12px", color: "var(--text-dim)", display: "block", fontWeight: "bold" }}>EMPTY</span>
                  </div>
                </div>

                {/* Gadget Slot - Reserved for Future Artwork */}
                <div className="panel" style={{ background: "#080808", padding: "16px 20px", border: "1px solid var(--border)", display: "flex", gap: "16px", alignItems: "center" }}>
                  <div style={{ width: "48px", height: "48px", border: "1px dashed rgba(255,255,255,0.15)", background: "rgba(0,0,0,0.3)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <span style={{ fontSize: "20px" }}>📡</span>
                  </div>
                  <div>
                    <span style={{ fontFamily: "var(--mono)", fontSize: "9px", color: "var(--text-muted)", display: "block" }}>TACTICAL GADGET</span>
                    <span style={{ fontFamily: "var(--title-font)", fontSize: "12px", color: "var(--text-dim)", display: "block", fontWeight: "bold" }}>EMPTY</span>
                  </div>
                </div>

              </div>

            </div>
          )}

        </main>
      </div>

      {/* --- IN-GAME GAMEPLAY OVERLAYS SYSTEM --- */}
      
      {/* 1. Briefing Overlay - Upgraded size and layout */}
      {activeMission && missionFlow === "briefing" && (
        <div style={{
          position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", zIndex: 100000,
          background: "rgba(0, 0, 0, 0.9)", display: "flex", alignItems: "center", justifyContent: "center",
          padding: "24px"
        }}>
          <div className="panel" style={{
            maxWidth: "760px", width: "100%", borderColor: "rgba(255, 77, 77, 0.45)",
            background: "#080808", padding: "40px"
          }}>
            <div style={{ borderBottom: "2px solid rgba(255,77,77,0.3)", paddingBottom: "16px", marginBottom: "24px" }}>
              <span style={{ fontFamily: "var(--mono)", fontSize: "11px", color: "var(--accent)", letterSpacing: "0.2em", fontWeight: "bold" }}>
                CODENAME: RED QUEEN AI // MISSION DEPLOYMENT DIALOG
              </span>
              <h2 style={{ fontSize: "28px", color: "#fff", margin: "6px 0 0 0", letterSpacing: "0.05em" }}>{activeMission.title}</h2>
            </div>
            
            {/* Mission Artwork container - Reserved for Future Artwork */}
            <div style={{
              height: "180px", width: "100%", background: "#030303", border: "1px dashed rgba(255,255,255,0.1)",
              marginBottom: "24px", display: "flex", alignItems: "center", justifyContent: "center"
            }}>
              <span style={{ fontFamily: "var(--mono)", fontSize: "11px", color: "var(--text-muted)" }}>
                [ MISSION_ENVIRONMENT_RECON_ILLUSTRATION ]
              </span>
            </div>

            <p style={{ fontSize: "15px", color: "var(--text-dim)", lineHeight: "1.7", marginBottom: "28px" }}>
              {activeMission.description}
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "16px", marginBottom: "28px" }}>
              <div style={{ background: "#000", border: "1px solid var(--border)", padding: "16px" }}>
                <span style={{ fontFamily: "var(--mono)", fontSize: "9.5px", color: "var(--text-dim)" }}>SECTOR</span>
                <div style={{ fontFamily: "var(--title-font)", fontSize: "13px", color: "#fff", fontWeight: "bold", marginTop: "4px" }}>
                  {activeMission.category.toUpperCase()}
                </div>
              </div>
              <div style={{ background: "#000", border: "1px solid var(--border)", padding: "16px" }}>
                <span style={{ fontFamily: "var(--mono)", fontSize: "9.5px", color: "var(--text-dim)" }}>DIFFICULTY</span>
                <div style={{ fontFamily: "var(--title-font)", fontSize: "13px", color: "var(--accent)", fontWeight: "bold", marginTop: "4px" }}>
                  {activeMission.difficulty.toUpperCase()}
                </div>
              </div>
              <div style={{ background: "#000", border: "1px solid var(--border)", padding: "16px" }}>
                <span style={{ fontFamily: "var(--mono)", fontSize: "9.5px", color: "var(--text-dim)" }}>DURATION</span>
                <div style={{ fontFamily: "var(--title-font)", fontSize: "13px", color: "#fff", fontWeight: "bold", marginTop: "4px" }}>
                  {activeMission.estimated_duration} MIN
                </div>
              </div>
              <div style={{ background: "#000", border: "1px solid var(--border)", padding: "16px" }}>
                <span style={{ fontFamily: "var(--mono)", fontSize: "9.5px", color: "var(--text-dim)" }}>RECOMMENDED</span>
                <div style={{ fontFamily: "var(--title-font)", fontSize: "13px", color: "#00ffcc", fontWeight: "bold", marginTop: "4px" }}>
                  {activeMission.recommended_class_id.toUpperCase()}
                </div>
              </div>
            </div>

            {/* Red Queen AI Briefing Commentary */}
            <div style={{ background: "rgba(255, 0, 51, 0.04)", borderLeft: "4px solid var(--accent)", padding: "20px", marginBottom: "32px" }}>
              <div style={{ fontFamily: "var(--mono)", fontSize: "10px", color: "var(--accent)", letterSpacing: "0.15em", marginBottom: "6px", fontWeight: "bold" }}>
                [ SYSTEM UPLINK COMMENTARY ]
              </div>
              <p style={{ fontFamily: "var(--mono)", fontSize: "13px", fontStyle: "italic", color: "var(--text)", lineHeight: "1.6", margin: 0 }}>
                {activeMission.recommended_class_id === profile.class
                  ? `"Operative configuration matches mission coordinates. Your medic/specialist capabilities yield +15% success probability check. Deploy immediately."`
                  : `"Warning: Active class [${profile.class.toUpperCase()}] deviates from recommended profile [${activeMission.recommended_class_id.toUpperCase()}]. Proceed with caution."`}
              </p>
            </div>

            <div style={{ display: "flex", justifyItems: "center", justifyContent: "space-between" }}>
              <button
                onClick={() => { setActiveMission(null); setMissionFlow(null); }}
                className="btn btn-ghost"
                style={{ border: "1px solid var(--border)", padding: "12px 28px" }}
              >
                ABORT DEPLOYMENT
              </button>
              <button
                onClick={() => runDeployment(activeMission)}
                className="btn btn-primary"
                style={{ padding: "12px 36px" }}
              >
                DEPLOY OPERATIVE 🛰️
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 2. Deployment Simulator Overlay - Larger terminal view */}
      {activeMission && missionFlow === "deployment" && (
        <div style={{
          position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", zIndex: 100000,
          background: "#030303", display: "flex", alignItems: "center", justifyContent: "center",
          padding: "24px"
        }}>
          <div className="panel" style={{ maxWidth: "760px", width: "100%", borderColor: "rgba(255, 77, 77, 0.55)", background: "#000", padding: "40px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
              <div style={{ fontFamily: "var(--mono)", fontSize: "11px", color: "var(--accent)", letterSpacing: "0.25em", fontWeight: "bold" }}>
                ▶ CONDUIT UPLINK SEQUENCER
              </div>
              <span className="status-dot animate-pulse" />
            </div>

            {/* Terminal console */}
            <div style={{
              background: "#040404", border: "1px solid #141414", padding: "24px", borderRadius: "2px",
              minHeight: "240px", fontFamily: "var(--mono)", fontSize: "13px", color: "#e8e8e8",
              display: "flex", flexDirection: "column", gap: "10px", marginBottom: "24px"
            }}>
              {deploymentLogs.map((log, idx) => (
                <div key={idx} style={{ color: log.includes("SUCCESS") ? "#00ffcc" : "#fff" }}>{log}</div>
              ))}
              <div className="loading-dots" style={{ marginTop: "12px", opacity: 0.5 }}>CONNECTING</div>
            </div>

            {/* Simulated progress bar */}
            <div>
              <div style={{ display: "flex", justifyContent: "space-between", fontFamily: "var(--mono)", fontSize: "11px", marginBottom: "8px", color: "var(--text-dim)" }}>
                <span>ENCRYPTING CORE COORDINATES...</span>
                <span>{deploymentProgress}%</span>
              </div>
              <div style={{ width: "100%", height: "6px", background: "rgba(255,255,255,0.05)", borderRadius: "2px", overflow: "hidden" }}>
                <div style={{ width: `${deploymentProgress}%`, height: "100%", background: "var(--accent)" }} />
              </div>
            </div>
          </div>
        </div>
      )}

      {/* 3. Tactical Decision Overlay - Cinematic choices */}
      {activeMission && missionFlow === "decision" && (
        <div style={{
          position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", zIndex: 100000,
          background: "rgba(0, 0, 0, 0.9)", display: "flex", alignItems: "center", justifyContent: "center",
          padding: "24px"
        }}>
          <div className="panel" style={{ maxWidth: "800px", width: "100%", borderColor: "rgba(0, 255, 204, 0.45)", padding: "40px" }}>
            
            <div style={{ borderBottom: "2px solid rgba(0,255,204,0.3)", paddingBottom: "16px", marginBottom: "24px" }}>
              <span style={{ fontFamily: "var(--mono)", fontSize: "11px", color: "#00ffcc", letterSpacing: "0.25em", fontWeight: "bold" }}>
                TACTICAL DECISION PROTOCOL — INITIATE TARGET RESPONSE
              </span>
              <h2 style={{ fontSize: "24px", color: "#fff", margin: "6px 0 0 0", letterSpacing: "0.05em" }}>{activeMission.title}</h2>
            </div>

            <p style={{ fontSize: "15px", color: "var(--text-dim)", lineHeight: "1.7", marginBottom: "32px" }}>
              {activeMission.scenarios[0].text}
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              {activeMission.scenarios[0].options.map((opt: any) => {
                const isRecommended = opt.class_bonus.classId === profile.class;
                return (
                  <button
                    key={opt.id}
                    onClick={() => handleSelectOption(opt)}
                    style={{
                      width: "100%", padding: "20px 24px", background: "#080808",
                      border: isRecommended ? "2px dashed rgba(0,255,204,0.5)" : "1px solid var(--border)",
                      borderRadius: "2px", cursor: "pointer", textAlign: "left", transition: "all 0.18s",
                      display: "flex", flexDirection: "column", gap: "8px"
                    }}
                  >
                    <div style={{ display: "flex", justifyContent: "space-between", width: "100%", alignItems: "center" }}>
                      <span style={{ fontFamily: "var(--title-font)", fontSize: "15px", color: "#fff", fontWeight: "bold", letterSpacing: "0.05em" }}>
                        {opt.text}
                      </span>
                      {isRecommended && (
                        <span style={{ fontFamily: "var(--mono)", fontSize: "9.5px", color: "#00ffcc", background: "rgba(0,255,204,0.06)", border: "1px solid rgba(0,255,204,0.3)", padding: "4px 10px", borderRadius: "2px" }}>
                          CLASS MATCH (+15% SUCCESS PROBABILITY)
                        </span>
                      )}
                    </div>
                    <span style={{ fontFamily: "var(--mono)", fontSize: "11px", color: "var(--text-muted)" }}>
                      Base success probability check: {opt.success_prob}% chance.
                    </span>
                  </button>
                );
              })}
            </div>
          </div>
        </div>
      )}

      {/* 4. Debriefing & AI Evaluation Overlay - Large alert style */}
      {activeMission && missionFlow === "debriefing" && (
        <div style={{
          position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", zIndex: 100000,
          background: "rgba(0, 0, 0, 0.9)", display: "flex", alignItems: "center", justifyContent: "center",
          padding: "24px"
        }}>
          <div className="panel" style={{
            maxWidth: "760px", width: "100%", padding: "40px",
            borderColor: missionOutcome === "SUCCESS" ? "rgba(0, 255, 204, 0.45)" : "rgba(255, 77, 77, 0.45)"
          }}>
            
            <div style={{ textAlign: "center", marginBottom: "32px", borderBottom: "1px solid var(--border)", paddingBottom: "24px" }}>
              <div className={`tag ${missionOutcome === "SUCCESS" ? "tag-green" : "tag-red"}`} style={{ fontSize: "12px", padding: "6px 20px", marginBottom: "12px", letterSpacing: "0.1em" }}>
                {missionOutcome === "SUCCESS" ? "OPERATION SUCCESSFUL" : "OPERATION FAILED"}
              </div>
              <h2 style={{ fontSize: "24px", color: "#fff", letterSpacing: "0.05em" }}>
                {missionOutcome === "SUCCESS" ? "TACTICAL OBJECTIVE SECURED" : "GRID CONDUIT TRACE DETECTED"}
              </h2>
            </div>

            <p style={{ fontSize: "14.5px", color: "var(--text-dim)", lineHeight: "1.7", marginBottom: "24px" }}>
              {missionOutcome === "SUCCESS" ? selectedOption.success_text : selectedOption.failure_text}
            </p>

            {/* Red Queen AI dynamic evaluation commentary */}
            <div style={{ background: "rgba(255, 255, 255, 0.02)", borderLeft: `4px solid ${missionOutcome === "SUCCESS" ? "#00ffcc" : "var(--accent)"}`, padding: "20px", borderRadius: "2px", marginBottom: "32px" }}>
              <p style={{ fontFamily: "var(--mono)", fontSize: "13px", color: "var(--text-dim)", fontStyle: "italic", whiteSpace: "pre-line", margin: 0, lineHeight: "1.6" }}>
                {outcomeCommentary}
              </p>
            </div>

            <div style={{ borderTop: "1px solid var(--border)", paddingTop: "24px", display: "flex", justifyContent: "flex-end" }}>
              <button
                onClick={() => setMissionFlow("rewards")}
                className="btn btn-primary"
                style={{ padding: "12px 32px" }}
              >
                PROCEED TO DEBRIEFING →
              </button>
            </div>
          </div>
        </div>
      )}

      {/* 5. Reward Claim Overlay - Big grid cards */}
      {activeMission && missionFlow === "rewards" && (
        <div style={{
          position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", zIndex: 100000,
          background: "rgba(0, 0, 0, 0.95)", display: "flex", alignItems: "center", justifyContent: "center",
          padding: "24px"
        }}>
          <div className="panel" style={{ maxWidth: "680px", width: "100%", borderColor: "rgba(0, 255, 204, 0.5)", background: "#080808", padding: "40px" }}>
            
            <div style={{ textAlign: "center", marginBottom: "28px", borderBottom: "1px solid var(--border)", paddingBottom: "20px" }}>
              <span style={{ fontFamily: "var(--mono)", fontSize: "10px", color: "#00ffcc", letterSpacing: "0.25em", fontWeight: "bold" }}>
                DEBRIEFING MATRIX — CLAIM RECOVERED TELEMETRY
              </span>
              <h2 style={{ fontSize: "22px", color: "#fff", margin: "6px 0 0 0", letterSpacing: "0.05em" }}>OPERATIONAL CONTRACT RESOLVED</h2>
            </div>

            {/* Reward list - High visual scale */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "32px" }} className="responsive-grid-2">
              <div style={{ background: "#000", padding: "20px", border: "1px solid var(--border)", textAlign: "center" }}>
                <span style={{ fontFamily: "var(--mono)", fontSize: "9.5px", color: "var(--text-dim)", display: "block" }}>OPERATIVE EXPERIENCE</span>
                <span style={{ fontFamily: "var(--title-font)", fontSize: "20px", color: "#00ffcc", fontWeight: "bold", display: "block", marginTop: "6px" }}>
                  +{outcomeRewards.xp} XP
                </span>
              </div>
              <div style={{ background: "#000", padding: "20px", border: "1px solid var(--border)", textAlign: "center" }}>
                <span style={{ fontFamily: "var(--mono)", fontSize: "9.5px", color: "var(--text-dim)", display: "block" }}>CREDITS VALUE</span>
                <span style={{ fontFamily: "var(--title-font)", fontSize: "20px", color: "#00ffcc", fontWeight: "bold", display: "block", marginTop: "6px" }}>
                  +{outcomeRewards.credits} CR
                </span>
              </div>
              {outcomeRewards.resource_qty > 0 && (
                <div style={{ background: "#000", padding: "20px", border: "1px solid var(--border)", textAlign: "center", gridColumn: "span 2" }}>
                  <span style={{ fontFamily: "var(--mono)", fontSize: "9.5px", color: "var(--text-dim)", display: "block" }}>RAW MATERIAL RECOVERED</span>
                  <span style={{ fontFamily: "var(--mono)", fontSize: "16px", color: "#fff", fontWeight: "bold", display: "block", marginTop: "6px" }}>
                    +{outcomeRewards.resource_qty} UNITS OF {outcomeRewards.resource.toUpperCase()}
                  </span>
                </div>
              )}
              {outcomeRewards.sub_stats && Object.keys(outcomeRewards.sub_stats).length > 0 && (
                <div style={{ border: "1px solid var(--border)", padding: "20px", background: "#000", gridColumn: "span 2" }}>
                  <span style={{ fontFamily: "var(--mono)", fontSize: "10px", color: "var(--text-dim)", display: "block", marginBottom: "8px", fontWeight: "bold" }}>
                    BIO-SCORE SUB-STATS RE-CALIBRATION:
                  </span>
                  {Object.keys(outcomeRewards.sub_stats).map((k) => (
                    <div key={k} style={{ display: "flex", justifyContent: "space-between", fontSize: "13px", fontFamily: "var(--mono)", borderBottom: "1px dashed rgba(255,255,255,0.03)", padding: "4px 0" }}>
                      <span style={{ color: "var(--text-dim)" }}>{k.replace("_", " ").toUpperCase()}</span>
                      <span style={{ color: "#00ffcc", fontWeight: "bold" }}>+{outcomeRewards.sub_stats[k]}%</span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{ borderTop: "1px solid var(--border)", paddingTop: "24px", display: "flex", justifyContent: "center" }}>
              <button
                onClick={handleClaimRewards}
                className="btn btn-primary"
                style={{ width: "100%", justifyContent: "center", padding: "14px", fontSize: "12.5px" }}
              >
                CLAIM RECOVERY CONTRACT & SHIELD UPLINK
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
