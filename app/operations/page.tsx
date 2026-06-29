"use client";
import { useState, useEffect, useRef } from "react";
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

// Initial Mock Inventory Items
const INITIAL_INVENTORY = [
  { id: "inv-1", name: "Kinetic Carbine V3", type: "weapon", slot: "Weapon", rarity: "Rare", power: 45, class_requirement: "Assault", desc: "Short-stroke piston rifle caliber tailored for anomaly breach parameters.", qty: 1 },
  { id: "inv-2", name: "Stealth Recon Cloak", type: "gadget", slot: "Gadget", rarity: "Epic", power: 65, class_requirement: "Recon", desc: "Bends electromagnetic spectra to match surrounding quadrant visual noise.", qty: 1 },
  { id: "inv-3", name: "Advanced Stim Injector", type: "consumable", slot: "Medkit", rarity: "Uncommon", power: 25, class_requirement: "Medic", desc: "Rapidly neutralizes biological toxins and speeds metabolic repair.", qty: 5 },
  { id: "inv-4", name: "Volumetric Shield Core", type: "armor", slot: "Armor", rarity: "Legendary", power: 90, class_requirement: "Scientist", desc: "Projects a gravity displacement barrier to deflect analog projectiles.", qty: 1 },
  { id: "inv-5", name: "C-4 Anomaly Breach Charge", type: "consumable", slot: "Utility", rarity: "Rare", power: 50, class_requirement: "Assault", desc: "Heavy thermite detonation device capable of punching through node shields.", qty: 3 },
  { id: "inv-6", name: "Decoy Signature Key", type: "consumable", slot: "Utility", rarity: "Common", power: 10, class_requirement: "Specialist", desc: "Injects synthetic user profiles to misdirect rogue Sybil trackers.", qty: 8 },
  { id: "inv-7", name: "Quantum Decryptor Pad", type: "gadget", slot: "Gadget", rarity: "Uncommon", power: 30, class_requirement: "Scientist", desc: "Processes localized sub-quantum key decryptions via custom WASM modules.", qty: 1 },
  { id: "inv-8", name: "Helix Biosensor Helmet", type: "helmet", slot: "Helmet", rarity: "Epic", power: 75, class_requirement: "Medic", desc: "Monitors oxygen filtration levels and identifies regional pathogen clusters.", qty: 1 },
  { id: "inv-9", name: "Modular Tactical Pack", type: "backpack", slot: "Backpack", rarity: "Common", power: 15, class_requirement: "Engineer", desc: "Extra load-bearing compartments reinforced with composite materials.", qty: 1 },
  { id: "inv-10", name: "Kevlar Node Mesh Jacket", type: "armor", slot: "Armor", rarity: "Common", power: 22, class_requirement: "Engineer", desc: "Reinforced under-armor offering basic protection against thermal loops.", qty: 1 },
  { id: "inv-11", name: "Deuterium Power Cell", type: "material", slot: "None", rarity: "Rare", power: 0, class_requirement: "None", desc: "High-density plasma power pack for calibrating transmitters.", qty: 12 },
  { id: "inv-12", name: "Raw Titanite Scrap", type: "material", slot: "None", rarity: "Common", power: 0, class_requirement: "None", desc: "Scraped bulkhead alloys for crafting primary shield plates.", qty: 25 },
  { id: "inv-13", name: "Sybil Decoy Router", type: "gadget", slot: "Gadget", rarity: "Epic", power: 70, class_requirement: "Specialist", desc: "Establishes multi-hop non-custodial transaction relay connections.", qty: 1 },
  { id: "inv-14", name: "Portable Gravity Analyzer", type: "utility", slot: "Utility", rarity: "Rare", power: 55, class_requirement: "Scientist", desc: "Measures localized gravity-well contractions and warns of grid implosions.", qty: 1 }
];

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

  // Selection state on the Tactical Map
  const [selectedMapSector, setSelectedMapSector] = useState<string>("op-1-sanctuary-search");
  const [mapAlert, setMapAlert] = useState<string | null>(null);

  // Mission State
  const [activeMission, setActiveMission] = useState<any>(null);
  const [missionFlow, setMissionFlow] = useState<"briefing" | "deployment" | "connection" | "decision" | "debriefing" | "rewards" | null>(null);
  const [deploymentLogs, setDeploymentLogs] = useState<string[]>([]);
  const [deploymentProgress, setDeploymentProgress] = useState(0);
  const [selectedOption, setSelectedOption] = useState<any>(null);
  const [missionOutcome, setMissionOutcome] = useState<"SUCCESS" | "FAILURE" | null>(null);
  const [outcomeCommentary, setOutcomeCommentary] = useState("");
  const [outcomeRewards, setOutcomeRewards] = useState<any>(null);
  const [levelUpMessage, setLevelUpMessage] = useState<string | null>(null);

  // Connection handshaking sequence logs
  const [connectionLogs, setConnectionLogs] = useState<string[]>([]);

  // Immersive AI Console Diagnostic stream logs
  const [aiLogs, setAiLogs] = useState<string[]>([
    "[SYS] CORE SYNAPSE ENGAGED...",
    "[SYS] UPLINK STATUS // ONLINE // SECURE"
  ]);

  // Inventory System States
  const [inventory, setInventory] = useState<any[]>(INITIAL_INVENTORY);
  const [equippedGear, setEquippedGear] = useState<Record<string, any>>({
    Helmet: null,
    Armor: null,
    Weapon: null,
    Utility: null,
    Medkit: null,
    Backpack: null,
    Gadget: null
  });
  const [inventoryFilter, setInventoryFilter] = useState<string>("all");
  const [inventorySort, setInventorySort] = useState<string>("power-desc");
  const [inventorySearch, setInventorySearch] = useState<string>("");
  const [selectedInventoryItem, setSelectedInventoryItem] = useState<any>(null);

  const aiLogsEndRef = useRef<HTMLDivElement>(null);

  // Continuous background diagnostic log updater to make the console feel alive
  useEffect(() => {
    const aiLogPool = [
      "[DB] SCANNING ANOMALOUS ENCRYPT NODES...",
      "[SYS] ADAPTABILITY INDEX STEADY AT 68%",
      "[TACTICAL] SCANNING SECTOR ALPHA FIREWALLS...",
      "[ORACLE] THREAT METRIC IN SECTOR DELTA STABILIZED...",
      "[SYS] CLEANING TRANSACTIONS THROUGH DEC DECOYS...",
      "[UPLINK] SIGNAL ENVELOPE SHIELDING SECURED AT 98%",
      "[WARN] BEACON EMISSION ANOMALY DETECTED IN SECTOR BETA...",
      "[SYS] DECRYPTING ENVELOPE ROUTING KEY...",
      "[DB] RED QUEEN SYNAPSE CORE RE-CALIBRATING..."
    ];

    const interval = setInterval(() => {
      const line = aiLogPool[Math.floor(Math.random() * aiLogPool.length)];
      setAiLogs(prev => [...prev.slice(-30), line]); // Cap logs array at 30
    }, 5500);

    return () => clearInterval(interval);
  }, []);

  // Auto-scroll AI logs
  useEffect(() => {
    if (aiLogsEndRef.current) {
      aiLogsEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [aiLogs]);

  // Load operative stats from client persistence with safety guards to prevent crashes
  const fetchOperationsProfile = () => {
    setLoading(true);
    const identifier = authIdentifier || (publicKey ? publicKey.toString() : "offline-operative");
    
    // Check localStorage
    const saved = localStorage.getItem(`rq_ops_profile:${identifier}`);
    if (saved) {
      try {
        const parsed = JSON.parse(saved);
        // Ensure stats and resources are populated safely to avoid render errors
        if (!parsed.stats) parsed.stats = { ...DEFAULT_STATS };
        if (!parsed.resources) parsed.resources = { Metal: 5, Electronics: 3, "Medical Supplies": 2, "Energy Cells": 2, "Research Data": 1 };
        setProfile(parsed);
      } catch (e) {
        console.error("Failed to parse saved profile:", e);
        setProfile(null);
      }
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
      credits: 150,
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

  // Deployment logs generator - Fixed closure variables
  const runDeployment = (op: any) => {
    setMissionFlow("deployment");
    setDeploymentProgress(0);
    setDeploymentLogs([]);
    
    const logSteps = [
      `[SYS_INIT] CONNECTING TO SATELLITE NETWORK ROUTE...`,
      `[SHIELD] ESTABLISHING DECENTRALIZED DATA TUNNEL...`,
      `[ORACLE] SCANNING REGION THREAT MATRIX FOR: ${op.title}...`,
      `[UPLINK] OPERATIVE BIOMETRICS VERIFIED: CLASS [${profile?.class?.toUpperCase()}]`,
      `[TACTICAL] COMMENCING TRANSIT TO ZONE CONDUIT...`,
      `[SUCCESS] DEPLOYMENT ZONE SECURED. INTERFACE ENGAGED.`
    ];

    let currentStep = 0;
    const interval = setInterval(() => {
      if (currentStep < logSteps.length) {
        const logLine = logSteps[currentStep];
        setDeploymentLogs(prev => [...prev, logLine]);
        setDeploymentProgress(Math.floor(((currentStep + 1) / logSteps.length) * 100));
        currentStep++;
      } else {
        clearInterval(interval);
        setTimeout(() => {
          runConnectionSequence();
        }, 500);
      }
    }, 450);
  };

  // Run the Connection Handshake step - Fixed closure variables
  const runConnectionSequence = () => {
    setMissionFlow("connection");
    setConnectionLogs([]);
    
    const connSteps = [
      `[HANDSHAKE] SHIELD NODE PROTOCOLS CONNECTED.`,
      `[DECRYPT] AUTHORIZING $THREAT SECURE GATE CLEARANCE...`,
      `[INTEGRITY] TRANSMISSION SIGNATURE METADATA: SECURE.`,
      `[ONLINE] CONNECTION COMPLETED. LOADOUT READY FOR INJECTION.`
    ];

    let current = 0;
    const interval = setInterval(() => {
      if (current < connSteps.length) {
        const connLine = connSteps[current];
        setConnectionLogs(prev => [...prev, connLine]);
        current++;
      } else {
        clearInterval(interval);
        setTimeout(() => {
          setMissionFlow("decision");
        }, 800);
      }
    }, 600);
  };

  // Process Option Choice
  const handleSelectOption = (option: any) => {
    if (!option) return;
    setSelectedOption(option);
    
    // Calculate success probability
    let baseProb = option.success_prob || 50;
    let matchingBonus = 0;
    
    // Class match check
    if (option.class_bonus?.classId === profile?.class) {
      matchingBonus = option.class_bonus.bonus || 15;
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
        xp: Math.floor((option.stat_gains?.xp || 20) / 2),
        credits: Math.floor((option.stat_gains?.credits || 50) / 3),
        resource: option.stat_gains?.resource || "Metal",
        resource_qty: 0,
        sub_stats: {}
      });
    }

    setMissionFlow("debriefing");
  };

  // Claim Rewards and Update Stats
  const handleClaimRewards = () => {
    if (!profile) return;
    const identifier = authIdentifier || (publicKey ? publicKey.toString() : "offline-operative");
    
    const currentStats = {
      ...DEFAULT_STATS,
      ...(profile?.stats || {})
    };
    const xpGain = outcomeRewards?.xp || 0;
    const creditGain = outcomeRewards?.credits || 0;
    const resourceName = outcomeRewards?.resource;
    const resourceQty = outcomeRewards?.resource_qty || 0;
    
    const newXP = currentStats.xp + xpGain;
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

    if (outcomeRewards?.sub_stats) {
      Object.keys(outcomeRewards.sub_stats).forEach((k) => {
        const key = k as keyof UserStats;
        if (updatedStats[key] !== undefined) {
          updatedStats[key] = Math.min(100, updatedStats[key] + outcomeRewards.sub_stats[key]);
        }
      });
    }

    // Update resources and credits
    const updatedResources = { ...profile.resources };
    if (resourceName && resourceQty > 0) {
      updatedResources[resourceName] = (updatedResources[resourceName] || 0) + resourceQty;
    }

    const updatedProfile = {
      ...profile,
      level: newLevel,
      xp: newXP,
      credits: (profile.credits || 0) + creditGain,
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

  // Interactive RPG Inventory actions
  const handleEquipItem = (item: any) => {
    if (!item || item.slot === "None") return;
    
    // Setup target slot
    const slotName = item.slot;
    const currentlyEquipped = equippedGear[slotName];
    
    // Update equipped state
    setEquippedGear(prev => ({
      ...prev,
      [slotName]: item
    }));
    
    // Remove equipped item from inventory list, and put unequipped item back
    setInventory(prev => {
      const filtered = prev.filter(i => i.id !== item.id);
      if (currentlyEquipped) {
        return [...filtered, currentlyEquipped];
      }
      return filtered;
    });
    
    setSelectedInventoryItem(null);
  };

  const handleUnequipItem = (slotName: string) => {
    const item = equippedGear[slotName];
    if (!item) return;
    
    // Remove from slot
    setEquippedGear(prev => ({
      ...prev,
      [slotName]: null
    }));
    
    // Return to inventory
    setInventory(prev => [...prev, item]);
  };

  const getFactionColor = (facId: string) => {
    return FACTIONS.find(f => f.id === facId)?.color || "var(--accent)";
  };

  // Safe Stats and Bio Score resolution
  const profileStats = {
    ...DEFAULT_STATS,
    ...(profile?.stats || {})
  };
  const currentBioScore = calculateBioScore(profileStats);
  const clearanceTier = getClearanceLevel(currentBioScore);

  // Selected operation detail resolution
  const selectedOperation = operations.find(o => o.id === selectedMapSector);

  // Filter and Sort inventory
  const filteredInventory = inventory
    .filter(item => {
      // Tab category filter
      if (inventoryFilter === "weapon") return item.type === "weapon";
      if (inventoryFilter === "armor") return item.type === "armor" || item.slot === "Helmet";
      if (inventoryFilter === "consumable") return item.type === "consumable" || item.slot === "Utility" || item.slot === "Medkit";
      if (inventoryFilter === "material") return item.type === "material";
      return true;
    })
    .filter(item => {
      // Search input text match
      if (!inventorySearch) return true;
      return item.name.toLowerCase().includes(inventorySearch.toLowerCase()) || item.desc.toLowerCase().includes(inventorySearch.toLowerCase());
    })
    .sort((a, b) => {
      // Sort logic
      if (inventorySort === "power-desc") return b.power - a.power;
      if (inventorySort === "power-asc") return a.power - b.power;
      if (inventorySort === "name-asc") return a.name.localeCompare(b.name);
      
      // Rarity weight sorting helper
      const rarityWeight = (rarity: string) => {
        if (rarity === "Legendary") return 5;
        if (rarity === "Epic") return 4;
        if (rarity === "Rare") return 3;
        if (rarity === "Uncommon") return 2;
        return 1;
      };
      if (inventorySort === "rarity-desc") return rarityWeight(b.rarity) - rarityWeight(a.rarity);
      return 0;
    });

  // Get Rarity Tier CSS Styles
  const getRarityStyle = (rarity: string) => {
    if (rarity === "Legendary") return { border: "1px solid #eab308", color: "#eab308", bg: "rgba(234, 179, 8, 0.08)" };
    if (rarity === "Epic") return { border: "1px solid #a855f7", color: "#a855f7", bg: "rgba(168, 85, 247, 0.08)" };
    if (rarity === "Rare") return { border: "1px solid #3b82f6", color: "#3b82f6", bg: "rgba(59, 130, 246, 0.08)" };
    if (rarity === "Uncommon") return { border: "1px solid #22c55e", color: "#22c55e", bg: "rgba(34, 197, 94, 0.08)" };
    return { border: "1px solid #a8a8a8", color: "#a8a8a8", bg: "rgba(168, 168, 168, 0.05)" };
  };

  if (loading) {
    return (
      <div style={{
        position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", zIndex: 99999,
        background: "#030303", display: "flex", flexDirection: "column", gap: "16px",
        alignItems: "center", justifyContent: "center", fontFamily: "var(--mono)",
        border: "3px solid var(--accent-dim)"
      }}>
        <div style={{ width: "50px", height: "50px", border: "3px solid rgba(255, 77, 77, 0.1)", borderTopColor: "var(--accent)", borderRadius: "50%", animation: "spin 1s linear infinite" }} />
        <span style={{ fontSize: "14px", letterSpacing: "0.1em", fontWeight: "bold", color: "var(--accent)" }}>
          INITIALIZING SECURE LINK COORDINATES<span>.</span><span>.</span><span>.</span>
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
        <style>{`
          .ops-grid-3 {
            display: grid;
            grid-template-columns: repeat(3, 1fr);
            gap: 32px;
            width: 100%;
          }
          .ops-grid-2-large {
            display: grid;
            grid-template-columns: 1.3fr 0.7fr;
            gap: 40px;
            width: 100%;
          }
          .ops-grid-2 {
            display: grid;
            grid-template-columns: repeat(2, 1fr);
            gap: 14px;
          }
          
          .holo-noise {
            background-image: linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.06), rgba(0, 255, 0, 0.02), rgba(0, 0, 255, 0.06));
            background-size: 100% 4px, 6px 100%;
          }
          .animate-flicker {
            animation: holo-flicker 3s infinite;
          }
          .animate-pulse-slow {
            animation: scanner-pulse 4s ease-in-out infinite;
          }
          .animate-pulse-red {
            animation: alert-blink 2s ease-in-out infinite;
          }

          @keyframes holo-flicker {
            0%, 100% { opacity: 0.98; }
            5% { opacity: 0.92; }
            8% { opacity: 0.98; }
            45% { opacity: 0.98; }
            46% { opacity: 0.85; }
            47% { opacity: 0.98; }
          }
          @keyframes scanner-pulse {
            0%, 100% { opacity: 0.15; transform: scale(0.99); }
            50% { opacity: 0.35; transform: scale(1.01); }
          }
          @keyframes alert-blink {
            0%, 100% { opacity: 1; border-color: rgba(255, 77, 77, 0.4); }
            50% { opacity: 0.45; border-color: rgba(255, 77, 77, 0.15); }
          }
          
          @media (max-width: 1366px) {
            .ops-grid-3 {
              grid-template-columns: repeat(2, 1fr) !important;
            }
            .ops-grid-2-large {
              grid-template-columns: 1fr !important;
            }
          }
          @media (max-width: 1024px) {
            .ops-grid-3 {
              grid-template-columns: 1fr !important;
            }
            .ops-grid-2 {
              grid-template-columns: 1fr !important;
            }
          }
        `}</style>

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
            <div className="tag tag-red animate-pulse-red" style={{ marginBottom: "12px", fontSize: "11px", letterSpacing: "0.2em", border: "1px solid" }}>
              CRITICAL NOTICE: SECURITY ACCESS VERIFICATION PENDING
            </div>
            <h1 style={{ fontSize: "36px", color: "#fff", letterSpacing: "0.1em" }}>INITIALIZE SOLVIVOR PROFILE</h1>
            <p style={{ fontFamily: "var(--mono)", fontSize: "13px", color: "var(--text-dim)", marginTop: "8px" }}>
              Configure your tactical profile to link with Red Queen's global defense operations network.
            </p>
          </div>

          <div className="ops-grid-2-large">
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
                    <div className="ops-grid-2">
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
                    <div className="ops-grid-2">
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

            {/* Right Interactive Preview Panel */}
            <div style={{
              background: "#080808", border: "1px solid rgba(255,255,255,0.05)",
              padding: "24px", display: "flex", flexDirection: "column", justifyItems: "center",
              justifyContent: "space-between", position: "relative"
            }}>
              <div style={{ fontFamily: "var(--mono)", fontSize: "10px", color: "var(--text-muted)", letterSpacing: "0.2em" }}>
                [ PREVIEW SYSTEM DOSSIER ]
              </div>

              {/* Faction / Class Artwork container */}
              <div className="holo-noise" style={{
                flex: 1, display: "flex", flexDirection: "column", alignItems: "center",
                justifyContent: "center", margin: "24px 0", minHeight: "220px",
                border: "1px dashed rgba(255, 77, 77, 0.25)", background: "rgba(0,0,0,0.3)",
                position: "relative"
              }}>
                <div style={{ position: "absolute", top: "10px", left: "10px", width: "12px", height: "12px", borderTop: "1.5px solid rgba(255,255,255,0.15)", borderLeft: "1.5px solid rgba(255,255,255,0.15)" }} />
                <div style={{ position: "absolute", top: "10px", right: "10px", width: "12px", height: "12px", borderTop: "1.5px solid rgba(255,255,255,0.15)", borderRight: "1.5px solid rgba(255,255,255,0.15)" }} />
                <div style={{ position: "absolute", bottom: "10px", left: "10px", width: "12px", height: "12px", borderBottom: "1.5px solid rgba(255,255,255,0.15)", borderLeft: "1.5px solid rgba(255,255,255,0.15)" }} />
                <div style={{ position: "absolute", bottom: "10px", right: "10px", width: "12px", height: "12px", borderBottom: "1.5px solid rgba(255,255,255,0.15)", borderRight: "1.5px solid rgba(255,255,255,0.15)" }} />
                
                {selectedFactionDetails ? (
                  <div style={{ textAlign: "center", padding: "16px", zIndex: 1 }} className="animate-flicker">
                    <div style={{
                      width: "64px", height: "64px", border: `2px dashed ${selectedFactionDetails.color}`,
                      borderRadius: "50%", margin: "0 auto 16px auto", display: "flex", alignItems: "center",
                      justifyContent: "center", background: "rgba(0,0,0,0.4)"
                    }}>
                      <span style={{ color: selectedFactionDetails.color, fontSize: "28px" }}>🛡️</span>
                    </div>
                    <div style={{ fontFamily: "var(--title-font)", fontSize: "16px", color: "#fff", fontWeight: "bold" }}>
                      {selectedFactionDetails.name.toUpperCase()} DIVISION
                    </div>
                    <p style={{ fontSize: "12px", color: "var(--text-dim)", marginTop: "8px", fontStyle: "italic" }}>
                      "{selectedFactionDetails.ideology}"
                    </p>
                  </div>
                ) : (
                  <div style={{ textAlign: "center", zIndex: 1, padding: "16px" }}>
                    <div style={{ fontFamily: "var(--mono)", fontSize: "11px", color: "var(--accent)", fontWeight: "bold", animation: "blink 1.5s infinite" }}>
                      [ FACTION TELEMETRY OFFLINE ]
                    </div>
                    <div style={{ fontFamily: "var(--mono)", fontSize: "9px", color: "var(--text-muted)", marginTop: "6px" }}>
                      AWAITING SATELLITE HANDSHAKE
                    </div>
                  </div>
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
      background: "#020202", display: "flex", flexDirection: "column", overflow: "hidden"
    }}>
      <style>{`
        .ops-grid-3 {
          display: grid;
          grid-template-columns: repeat(3, 1fr);
          gap: 20px;
          width: 100%;
          height: 100%;
        }
        .ops-grid-2 {
          display: grid;
          grid-template-columns: repeat(2, 1fr);
          gap: 20px;
        }
        .ops-grid-2-large {
          display: grid;
          grid-template-columns: 1.2fr 0.8fr;
          gap: 24px;
          width: 100%;
        }
        .ops-grid-3-loadout {
          display: grid;
          grid-template-columns: 1fr 1.1fr 1.9fr;
          gap: 24px;
          width: 100%;
          height: 100%;
          overflow: hidden;
        }
        .holo-noise {
          background-image: linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.05), rgba(0, 255, 0, 0.02), rgba(0, 0, 255, 0.05));
          background-size: 100% 4px, 6px 100%;
        }
        
        /* CRT scanline effect */
        .crt-scanlines {
          position: fixed;
          top: 0; left: 0; width: 100vw; height: 100vh;
          background: linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.15) 50%);
          background-size: 100% 3px;
          z-index: 999999;
          pointer-events: none;
          opacity: 0.4;
        }
        
        .animate-flicker {
          animation: holo-flicker 4s infinite;
        }
        .animate-pulse-slow {
          animation: scanner-pulse 5s ease-in-out infinite;
        }
        .animate-pulse-red {
          animation: alert-blink 2.5s ease-in-out infinite;
        }
        
        @keyframes holo-flicker {
          0%, 100% { opacity: 0.98; }
          40% { opacity: 0.98; }
          41% { opacity: 0.75; }
          42% { opacity: 0.98; }
          75% { opacity: 0.98; }
          76% { opacity: 0.8; }
          78% { opacity: 0.98; }
        }
        @keyframes scanner-pulse {
          0%, 100% { opacity: 0.15; transform: scale(0.99); }
          50% { opacity: 0.3; transform: scale(1.01); }
        }
        @keyframes alert-blink {
          0%, 100% { opacity: 1; border-color: rgba(255, 77, 77, 0.4); }
          50% { opacity: 0.45; border-color: rgba(255, 77, 77, 0.15); }
        }
        
        @keyframes map-scope-spin {
          from { transform: rotate(0deg); }
          to { transform: rotate(360deg); }
        }
        .map-scope-circle {
          animation: map-scope-spin 20s linear infinite;
          transform-origin: 50px 50px;
        }
        .map-pulse-node {
          animation: map-node-pulse 2s infinite;
        }
        @keyframes map-node-pulse {
          0%, 100% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.2); opacity: 0.5; }
        }

        /* Responsive overrides for smaller layouts */
        @media (max-width: 1440px) {
          .ops-grid-3-loadout {
            grid-template-columns: 1fr 1.2fr 1.8fr !important;
          }
        }
        @media (max-width: 1200px) {
          .ops-grid-3-loadout {
            grid-template-columns: 1.2fr 1.8fr !important;
          }
          .loadout-center-silhouette {
            display: none !important;
          }
        }
        @media (max-width: 1024px) {
          .ops-grid-3-loadout {
            grid-template-columns: 1fr !important;
          }
        }
      `}</style>

      {/* Global scanlines layer */}
      <div className="crt-scanlines" />

      {/* Top Status Bar HUD */}
      <header style={{
        height: "54px", borderBottom: "2px solid rgba(255, 77, 77, 0.25)", background: "#060606",
        padding: "0 24px", display: "flex", alignItems: "center", justifyItems: "center",
        justifyContent: "space-between", flexShrink: 0, zIndex: 1000
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "24px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ width: "10px", height: "10px", background: getFactionColor(profile?.faction), borderRadius: "50%", boxShadow: `0 0 12px ${getFactionColor(profile?.faction)}` }} />
            <span style={{ fontFamily: "var(--title-font)", fontSize: "14px", fontWeight: "900", letterSpacing: "0.15em", color: "#fff" }}>
              {profile?.name} // {profile?.faction?.toUpperCase()}
            </span>
          </div>
          <span style={{ color: "rgba(255,255,255,0.15)", fontFamily: "var(--mono)", fontSize: "14px" }}>|</span>
          <span style={{ fontFamily: "var(--mono)", fontSize: "11.5px", color: "var(--text-dim)" }}>
            CLASS: <span style={{ color: "var(--accent)", fontWeight: "bold" }}>{profile?.class?.toUpperCase()}</span>
          </span>
          <span style={{ color: "rgba(255,255,255,0.15)", fontFamily: "var(--mono)", fontSize: "14px" }}>|</span>
          <span style={{ fontFamily: "var(--mono)", fontSize: "11.5px", color: "var(--text-dim)" }}>
            ROLE: <span style={{ color: "#00ffcc", fontWeight: "bold" }}>{profile?.role?.toUpperCase()}</span>
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "rgba(0, 255, 204, 0.06)", border: "1px solid rgba(0, 255, 204, 0.2)", padding: "4px 10px", borderRadius: "2px" }}>
            <span style={{ fontFamily: "var(--mono)", fontSize: "10px", color: "#00ffcc", fontWeight: "bold", letterSpacing: "0.05em" }}>BIO-SCORE: {currentBioScore}</span>
          </div>
          
          <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "rgba(255, 77, 77, 0.06)", border: "1px solid rgba(255, 77, 77, 0.2)", padding: "4px 10px", borderRadius: "2px" }}>
            <span style={{ fontFamily: "var(--mono)", fontSize: "10px", color: "var(--accent)", fontWeight: "bold", letterSpacing: "0.05em" }}>CLEARANCE: {clearanceTier.label}</span>
          </div>

          <button
            onClick={() => {
              const identifier = authIdentifier || (publicKey ? publicKey.toString() : "offline-operative");
              localStorage.removeItem(`rq_ops_profile:${identifier}`);
              setProfile(null);
            }}
            className="btn btn-ghost"
            style={{ fontSize: "9px", padding: "4px 10px", borderColor: "rgba(255,0,0,0.2)", color: "#ff4d4d", cursor: "pointer", fontWeight: "bold" }}
          >
            [ RE-INITIALIZE ]
          </button>
        </div>
      </header>

      {/* Main Container Layout */}
      <div style={{ display: "flex", flex: 1, overflow: "hidden", position: "relative" }}>
        
        {/* Navigation Sidebar */}
        <aside style={{
          width: "200px", borderRight: "1px solid var(--border)", background: "#060606",
          padding: "24px 16px", display: "flex", flexDirection: "column", gap: "12px", flexShrink: 0
        }}>
          <div style={{ fontFamily: "var(--mono)", fontSize: "10px", color: "var(--text-dim)", letterSpacing: "0.2em", marginBottom: "6px", fontWeight: "bold" }}>
            ▶ OPERATIONAL DECKS
          </div>
          
          <button
            onClick={() => setActiveTab("center")}
            style={{
              width: "100%", padding: "12px 14px", border: "1px solid var(--border)",
              background: activeTab === "center" ? "rgba(255, 77, 77, 0.06)" : "none",
              color: activeTab === "center" ? "var(--accent)" : "var(--text-dim)",
              borderColor: activeTab === "center" ? "rgba(255, 77, 77, 0.3)" : "var(--border)",
              fontFamily: "var(--title-font)", fontSize: "11px", textAlign: "left", cursor: "pointer",
              transition: "all 0.18s", borderRadius: "2px", fontWeight: "bold", letterSpacing: "0.08em"
            }}
          >
            🛰️ COMMAND HUB
          </button>

          <button
            onClick={() => setActiveTab("profile")}
            style={{
              width: "100%", padding: "12px 14px", border: "1px solid var(--border)",
              background: activeTab === "profile" ? "rgba(255, 77, 77, 0.06)" : "none",
              color: activeTab === "profile" ? "var(--accent)" : "var(--text-dim)",
              borderColor: activeTab === "profile" ? "rgba(255, 77, 77, 0.3)" : "var(--border)",
              fontFamily: "var(--title-font)", fontSize: "11px", textAlign: "left", cursor: "pointer",
              transition: "all 0.18s", borderRadius: "2px", fontWeight: "bold", letterSpacing: "0.08em"
            }}
          >
            👤 OPERATIVE DOSSIER
          </button>

          <button
            onClick={() => setActiveTab("inventory")}
            style={{
              width: "100%", padding: "12px 14px", border: "1px solid var(--border)",
              background: activeTab === "inventory" ? "rgba(255, 77, 77, 0.06)" : "none",
              color: activeTab === "inventory" ? "var(--accent)" : "var(--text-dim)",
              borderColor: activeTab === "inventory" ? "rgba(255, 77, 77, 0.3)" : "var(--border)",
              fontFamily: "var(--title-font)", fontSize: "11px", textAlign: "left", cursor: "pointer",
              transition: "all 0.18s", borderRadius: "2px", fontWeight: "bold", letterSpacing: "0.08em"
            }}
          >
            📦 EQUIPMENT DECK
          </button>

          <div style={{ marginTop: "auto", borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "16px" }}>
            <Link
              href="/"
              style={{
                display: "block", width: "100%", padding: "10px 12px", border: "1px solid var(--border)",
                background: "none", color: "var(--text-dim)", fontFamily: "var(--title-font)", fontSize: "10px",
                textDecoration: "none", textAlign: "center", borderRadius: "2px", fontWeight: "bold", letterSpacing: "0.08em"
              }}
            >
              ← DISCONNECT HUB
            </Link>
          </div>
        </aside>

        {/* Content Pane - Viewport bound game HUD structure */}
        <main style={{ flex: 1, padding: "24px", background: "#030303", display: "flex", flexDirection: "column", height: "100%", boxSizing: "border-box", overflow: "hidden" }}>
          
          {/* TAB 1: COMMAND CENTER (HUD & OPERATIONS) */}
          {activeTab === "center" && (
            <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
              
              {/* TOP SECTION: MASSIVE GLOBAL TACTICAL MAP (52% height) */}
              <div className="panel holo-noise animate-pulse-slow" style={{
                position: "relative", padding: "16px", height: "50%", minHeight: "280px", background: "#050505",
                border: "2px solid rgba(255, 77, 77, 0.3)", boxShadow: "0 0 30px rgba(0, 0, 0, 0.9)",
                display: "flex", flexDirection: "column", justifyItems: "center", justifyContent: "space-between",
                marginBottom: "20px", flexShrink: 0
              }}>
                {/* Visual Corner Brackets */}
                <div style={{ position: "absolute", top: "10px", left: "10px", width: "14px", height: "14px", borderTop: "2px solid var(--accent)", borderLeft: "2px solid var(--accent)" }} />
                <div style={{ position: "absolute", top: "10px", right: "10px", width: "14px", height: "14px", borderTop: "2px solid var(--accent)", borderRight: "2px solid var(--accent)" }} />
                <div style={{ position: "absolute", bottom: "10px", left: "10px", width: "14px", height: "14px", borderBottom: "2px solid var(--accent)", borderLeft: "2px solid var(--accent)" }} />
                <div style={{ position: "absolute", bottom: "10px", right: "10px", width: "14px", height: "14px", borderBottom: "2px solid var(--accent)", borderRight: "2px solid var(--accent)" }} />

                {/* Map telemetry header */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", zIndex: 1, borderBottom: "1px dashed rgba(255,255,255,0.06)", paddingBottom: "10px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ width: "6px", height: "6px", background: "#ff4d4d", borderRadius: "50%" }} className="animate-pulse" />
                    <span style={{ fontFamily: "var(--mono)", fontSize: "10px", color: "var(--accent)", letterSpacing: "0.2em", fontWeight: "bold" }}>
                      RED QUEEN GLOBAL TACTICAL RADAR GRID
                    </span>
                  </div>
                  <span style={{ fontFamily: "var(--mono)", fontSize: "10px", color: "var(--text-muted)" }}>
                    MAP_UPLINK_STATUS: SECURE // SCANNING...
                  </span>
                </div>

                {/* Interactive Map SVG Canvas */}
                <div style={{ flex: 1, position: "relative", margin: "10px 0", background: "rgba(0,0,0,0.6)" }}>
                  
                  {/* Transient message banner if sector locked clicked */}
                  {mapAlert && (
                    <div style={{
                      position: "absolute", top: "12px", left: "50%", transform: "translateX(-50%)",
                      background: "rgba(255, 77, 77, 0.08)", border: "1px solid var(--accent)", padding: "8px 16px",
                      zIndex: 10, fontFamily: "var(--mono)", fontSize: "11px", color: "var(--accent)",
                      boxShadow: "0 0 15px rgba(255,77,77,0.15)", borderRadius: "2px"
                    }}>
                      {mapAlert}
                    </div>
                  )}

                  <svg width="100%" height="100%" viewBox="0 0 100 100" preserveAspectRatio="none" style={{ position: "absolute", top: 0, left: 0 }}>
                    <defs>
                      <pattern id="map-grid" width="10" height="10" patternUnits="userSpaceOnUse">
                        <path d="M 10 0 L 0 0 0 10" fill="none" stroke="rgba(255,255,255,0.015)" strokeWidth="0.5"/>
                      </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#map-grid)" />

                    {/* Radar sweeps */}
                    <circle cx="50" cy="50" r="30" fill="none" stroke="rgba(255, 77, 77, 0.03)" strokeWidth="0.5" />
                    <circle cx="50" cy="50" r="45" fill="none" stroke="rgba(255, 77, 77, 0.02)" strokeWidth="0.5" />
                    <circle cx="50" cy="50" r="15" fill="none" stroke="rgba(255, 77, 77, 0.04)" strokeWidth="0.5" />
                    
                    {/* Scanning radar sweep lines */}
                    <line className="map-scope-circle" x1="50" y1="50" x2="95" y2="50" stroke="rgba(255, 77, 77, 0.06)" strokeWidth="0.5" />
                    
                    {/* Connecting operational links */}
                    <line x1="25" y1="35" x2="50" y2="60" stroke="rgba(0, 255, 204, 0.05)" strokeWidth="0.5" strokeDasharray="1,1" />
                    <line x1="50" y1="60" x2="75" y2="30" stroke="rgba(0, 255, 204, 0.05)" strokeWidth="0.5" strokeDasharray="1,1" />
                    <line x1="25" y1="35" x2="75" y2="30" stroke="rgba(0, 255, 204, 0.05)" strokeWidth="0.5" strokeDasharray="1,1" />
                  </svg>

                  {/* INTERACTIVE NODES */}
                  
                  {/* Node 1: Sector Alpha */}
                  <div style={{ position: "absolute", left: "25%", top: "35%", transform: "translate(-50%, -50%)", zIndex: 5 }}>
                    <button
                      onClick={() => setSelectedMapSector("op-1-sanctuary-search")}
                      style={{
                        background: "none", border: "none", padding: 0, cursor: "pointer",
                        display: "flex", flexDirection: "column", alignItems: "center"
                      }}
                    >
                      <span className="map-pulse-node" style={{
                        width: "12px", height: "12px", background: "#00ffcc", borderRadius: "50%",
                        border: selectedMapSector === "op-1-sanctuary-search" ? "3px solid #fff" : "2px solid #00ffcc",
                        boxShadow: "0 0 10px #00ffcc"
                      }} />
                      <span style={{
                        fontFamily: "var(--mono)", fontSize: "9px", color: selectedMapSector === "op-1-sanctuary-search" ? "#fff" : "var(--text-dim)",
                        marginTop: "4px", background: "rgba(0,0,0,0.8)", padding: "1px 4px", border: "1px solid rgba(255,255,255,0.06)"
                      }}>
                        SECTOR ALPHA
                      </span>
                    </button>
                  </div>

                  {/* Node 2: Sector Beta */}
                  <div style={{ position: "absolute", left: "50%", top: "60%", transform: "translate(-50%, -50%)", zIndex: 5 }}>
                    <button
                      onClick={() => setSelectedMapSector("op-2-signal-recovery")}
                      style={{
                        background: "none", border: "none", padding: 0, cursor: "pointer",
                        display: "flex", flexDirection: "column", alignItems: "center"
                      }}
                    >
                      <span className="map-pulse-node" style={{
                        width: "12px", height: "12px", background: "#f0c929", borderRadius: "50%",
                        border: selectedMapSector === "op-2-signal-recovery" ? "3px solid #fff" : "2px solid #f0c929",
                        boxShadow: "0 0 10px #f0c929"
                      }} />
                      <span style={{
                        fontFamily: "var(--mono)", fontSize: "9px", color: selectedMapSector === "op-2-signal-recovery" ? "#fff" : "var(--text-dim)",
                        marginTop: "4px", background: "rgba(0,0,0,0.8)", padding: "1px 4px", border: "1px solid rgba(255,255,255,0.06)"
                      }}>
                        SECTOR BETA
                      </span>
                    </button>
                  </div>

                  {/* Node 3: Sector Delta */}
                  <div style={{ position: "absolute", left: "75%", top: "30%", transform: "translate(-50%, -50%)", zIndex: 5 }}>
                    <button
                      onClick={() => setSelectedMapSector("op-3-sybil-breach")}
                      style={{
                        background: "none", border: "none", padding: 0, cursor: "pointer",
                        display: "flex", flexDirection: "column", alignItems: "center"
                      }}
                    >
                      <span className="map-pulse-node" style={{
                        width: "12px", height: "12px", background: "#ff4d4d", borderRadius: "50%",
                        border: selectedMapSector === "op-3-sybil-breach" ? "3px solid #fff" : "2px solid #ff4d4d",
                        boxShadow: "0 0 10px #ff4d4d"
                      }} />
                      <span style={{
                        fontFamily: "var(--mono)", fontSize: "9px", color: selectedMapSector === "op-3-sybil-breach" ? "#fff" : "var(--text-dim)",
                        marginTop: "4px", background: "rgba(0,0,0,0.8)", padding: "1px 4px", border: "1px solid rgba(255,255,255,0.06)"
                      }}>
                        SECTOR DELTA
                      </span>
                    </button>
                  </div>

                  {/* Node 4: Sector Epsilon (Locked) */}
                  <div style={{ position: "absolute", left: "20%", top: "75%", transform: "translate(-50%, -50%)", zIndex: 5 }}>
                    <button
                      onClick={() => {
                        setMapAlert("ACCESS DENIED // RECON SENSORS OFFLINE // BIO-SCORE REQUIRED: 40");
                        setTimeout(() => setMapAlert(null), 3000);
                      }}
                      style={{
                        background: "none", border: "none", padding: 0, cursor: "pointer",
                        display: "flex", flexDirection: "column", alignItems: "center", opacity: 0.35
                      }}
                    >
                      <span style={{ width: "10px", height: "10px", background: "#555", borderRadius: "50%", border: "1.5px solid #222" }} />
                      <span style={{ fontFamily: "var(--mono)", fontSize: "8.5px", color: "var(--text-muted)", marginTop: "4px" }}>
                        LOCKED
                      </span>
                    </button>
                  </div>

                  {/* Node 5: Sector Gamma (Locked) */}
                  <div style={{ position: "absolute", left: "85%", top: "70%", transform: "translate(-50%, -50%)", zIndex: 5 }}>
                    <button
                      onClick={() => {
                        setMapAlert("ACCESS DENIED // SIGNAL ENCRYPTION BLOCKED // LEVEL REQUIRED: 5");
                        setTimeout(() => setMapAlert(null), 3000);
                      }}
                      style={{
                        background: "none", border: "none", padding: 0, cursor: "pointer",
                        display: "flex", flexDirection: "column", alignItems: "center", opacity: 0.35
                      }}
                    >
                      <span style={{ width: "10px", height: "10px", background: "#555", borderRadius: "50%", border: "1.5px solid #222" }} />
                      <span style={{ fontFamily: "var(--mono)", fontSize: "8.5px", color: "var(--text-muted)", marginTop: "4px" }}>
                        LOCKED
                      </span>
                    </button>
                  </div>

                </div>

                {/* Map footer coordinates */}
                <div style={{ display: "flex", justifyContent: "space-between", zIndex: 1, fontFamily: "var(--mono)", fontSize: "9.5px", color: "var(--text-muted)", borderTop: "1px dashed rgba(255,255,255,0.06)", paddingTop: "10px" }}>
                  <span>ACTIVE SECTORS: 3 ONLINE // 2 OFFLINE</span>
                  <span>DEC. GRID SYSTEM SWAP BUFFER [ONLINE]</span>
                </div>
              </div>

              {/* BOTTOM SECTION: 3-COLUMN CONTROL DECK (50% height) */}
              <div style={{ flex: 1, display: "grid", gridTemplateColumns: "1fr 1.3fr 1.3fr", gap: "20px", overflow: "hidden", minHeight: "200px" }}>
                
                {/* Col 1: Red Queen AI Console & Live Diagnostic log */}
                <div className="panel" style={{
                  background: "#080808", border: "1px solid rgba(255, 77, 77, 0.25)",
                  position: "relative", padding: "16px", display: "flex", flexDirection: "column", gap: "12px",
                  overflow: "hidden"
                }}>
                  <span style={{ fontFamily: "var(--mono)", fontSize: "9px", color: "var(--accent)", letterSpacing: "0.15em", fontWeight: "bold" }}>
                    [ RED QUEEN HOLOGRAM CONSOLE ]
                  </span>
                  
                  <div style={{ display: "flex", gap: "12px", alignItems: "center" }}>
                    <div className="holo-noise animate-flicker" style={{
                      height: "80px", width: "80px", background: "rgba(0,0,0,0.6)",
                      border: "1px dashed rgba(255, 77, 77, 0.2)", display: "flex",
                      alignItems: "center", justifyContent: "center", position: "relative",
                      overflow: "hidden", flexShrink: 0
                    }}>
                      {/* Scanning sweeping bar */}
                      <div style={{
                        position: "absolute", top: 0, left: 0, width: "100%", height: "2px",
                        background: "rgba(255,77,77,0.4)", animation: "scanlines-scrolling 2s linear infinite"
                      }} />
                      <span style={{ fontFamily: "var(--mono)", fontSize: "8.5px", color: "var(--accent)", fontWeight: "bold" }}>
                        [ AI CORE ]
                      </span>
                    </div>

                    <div style={{ flex: 1 }}>
                      <span style={{ fontFamily: "var(--mono)", fontSize: "8px", color: "var(--text-muted)", display: "block" }}>
                        DISPATCH UPLINK RECOMMENDATION
                      </span>
                      <p style={{ fontFamily: "var(--mono)", fontSize: "11px", color: "#00ffcc", lineHeight: "1.4", margin: "2px 0 0 0" }}>
                        "Select active sector coordinates from the scroll deck or map above to decrypt."
                      </p>
                    </div>
                  </div>

                  {/* Scrollable diagnostic log terminal */}
                  <div style={{
                    flex: 1, background: "#040404", border: "1px solid #141414", padding: "10px",
                    fontFamily: "var(--mono)", fontSize: "9px", color: "#666", overflowY: "auto",
                    display: "flex", flexDirection: "column", gap: "4px"
                  }}>
                    {aiLogs.map((log, idx) => (
                      <div key={idx} style={{ color: log.includes("[WARN]") ? "#ff4d4d" : log.includes("[SYS]") ? "#00ffcc" : "#666" }}>{log}</div>
                    ))}
                    <div ref={aiLogsEndRef} />
                  </div>
                </div>

                {/* Col 2: Mission Browser Scroll-deck */}
                <div className="panel" style={{
                  background: "#080808", border: "1px solid var(--border)",
                  padding: "16px", display: "flex", flexDirection: "column", gap: "12px", overflow: "hidden"
                }}>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderBottom: "1px dashed rgba(255,255,255,0.06)", paddingBottom: "6px" }}>
                    <span style={{ fontFamily: "var(--mono)", fontSize: "9px", color: "var(--text-dim)", letterSpacing: "0.15em", fontWeight: "bold" }}>
                      [ AVAILABLE OPERATIONS BROWSER ]
                    </span>
                    <span style={{ fontFamily: "var(--mono)", fontSize: "8.5px", color: "var(--text-muted)" }}>
                      COUNT: {operations.length}
                    </span>
                  </div>

                  <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "10px", paddingRight: "4px" }}>
                    {loadingOps ? (
                      <div style={{ textAlign: "center", fontFamily: "var(--mono)", fontSize: "11px", color: "var(--text-muted)", marginTop: "24px" }}>
                        DECRYPTING REGIONAL CONDUITS...
                      </div>
                    ) : (
                      operations.map((op) => {
                        const isSelected = selectedMapSector === op.id;
                        return (
                          <div
                            key={op.id}
                            onClick={() => setSelectedMapSector(op.id)}
                            style={{
                              background: isSelected ? "rgba(255, 77, 77, 0.04)" : "#0c0c0c",
                              border: isSelected ? "1.5px solid var(--accent)" : "1px solid var(--border)",
                              padding: "12px", borderRadius: "2px", cursor: "pointer", transition: "all 0.15s",
                              display: "flex", gap: "12px", alignItems: "center"
                            }}
                          >
                            {/* Mission Card Artwork placeholder */}
                            <div className="holo-noise" style={{
                              width: "50px", height: "50px", background: "rgba(0,0,0,0.5)",
                              border: isSelected ? "1px dashed var(--accent)" : "1px dashed rgba(255,255,255,0.1)",
                              display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0
                            }}>
                              <span style={{ fontSize: "14px" }}>🛰️</span>
                            </div>

                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <span className={`tag ${op.difficulty === "Easy" ? "tag-green" : op.difficulty === "Normal" ? "tag-yellow" : "tag-red"}`} style={{ fontSize: "8px", padding: "1px 5px" }}>
                                  {op.difficulty.toUpperCase()}
                                </span>
                                <span style={{ fontFamily: "var(--mono)", fontSize: "8px", color: "var(--text-muted)" }}>
                                  {op.estimated_duration}m
                                </span>
                              </div>
                              <h4 style={{ fontSize: "11.5px", color: "#fff", margin: "4px 0 2px 0", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                {op.title}
                              </h4>
                              <span style={{ fontFamily: "var(--mono)", fontSize: "8.5px", color: "var(--text-muted)", display: "block" }}>
                                REGION: {op.category.toUpperCase()}
                              </span>
                            </div>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>

                {/* Col 3: Selected Mission Dossier detail card */}
                <div className="panel" style={{
                  background: "#080808", border: "1px solid var(--border)",
                  padding: "16px", display: "flex", flexDirection: "column", gap: "10px", overflow: "hidden"
                }}>
                  {selectedOperation ? (
                    <div style={{ display: "flex", flexDirection: "column", height: "100%", justifyContent: "space-between" }}>
                      
                      <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span style={{ fontFamily: "var(--mono)", fontSize: "9px", color: "var(--text-dim)", letterSpacing: "0.1em" }}>
                            [ TARGET ANOMALY PROFILE ]
                          </span>
                          <span className={`tag ${selectedOperation.difficulty === "Easy" ? "tag-green" : selectedOperation.difficulty === "Normal" ? "tag-yellow" : "tag-red"}`} style={{ fontSize: "8px", padding: "2px 6px" }}>
                            {selectedOperation.difficulty.toUpperCase()}
                          </span>
                        </div>
                        
                        <h3 style={{ fontSize: "15px", color: "#fff", margin: 0, borderBottom: "1px solid rgba(255,255,255,0.06)", paddingBottom: "6px" }}>
                          {selectedOperation.title}
                        </h3>
                        
                        <p style={{ fontSize: "11px", color: "var(--text-dim)", lineHeight: "1.4", margin: 0, height: "60px", overflowY: "auto" }}>
                          {selectedOperation.description}
                        </p>

                        <div style={{ background: "#0c0c0c", border: "1px solid rgba(255,255,255,0.03)", padding: "8px", display: "flex", flexDirection: "column", gap: "4px" }}>
                          <div style={{ display: "flex", justifyItems: "center", justifyContent: "space-between", fontSize: "10px", fontFamily: "var(--mono)" }}>
                            <span style={{ color: "var(--text-muted)" }}>RECOMMENDED CLASS:</span>
                            <span style={{ color: "#00ffcc", fontWeight: "bold" }}>{selectedOperation.recommended_class_id.toUpperCase()}</span>
                          </div>
                          <div style={{ display: "flex", justifyItems: "center", justifyContent: "space-between", fontSize: "10px", fontFamily: "var(--mono)" }}>
                            <span style={{ color: "var(--text-muted)" }}>THREAT RATING:</span>
                            <span style={{ color: selectedOperation.difficulty === "Hard" ? "#ff4d4d" : "#f0c929", fontWeight: "bold" }}>
                              {selectedOperation.difficulty === "Easy" ? "LOW" : selectedOperation.difficulty === "Normal" ? "MEDIUM" : "CRITICAL"}
                            </span>
                          </div>
                        </div>
                      </div>

                      <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "10px", display: "flex", justifyItems: "center", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontFamily: "var(--mono)", fontSize: "9px", color: "var(--text-muted)" }}>
                          EST. TIME: {selectedOperation.estimated_duration} MIN
                        </span>
                        
                        <button
                          onClick={() => { setActiveMission(selectedOperation); setMissionFlow("briefing"); }}
                          className="btn btn-primary"
                          style={{
                            fontSize: "10px", padding: "6px 14px",
                            background: selectedOperation.recommended_class_id === profile?.class ? "#00ffcc" : "var(--accent)",
                            color: "#000"
                          }}
                        >
                          LAUNCH BRIEFING →
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: "flex", flexDirection: "column", justifyItems: "center", justifyContent: "center", alignItems: "center", height: "100%", textAlign: "center" }}>
                      <span style={{ fontFamily: "var(--mono)", fontSize: "11px", color: "var(--text-muted)" }}>
                        [ NO TACTICAL SECTOR SELECTED ]
                      </span>
                      <p style={{ fontSize: "10px", color: "var(--text-muted)", marginTop: "4px" }}>
                        Select coordinates from the Operations Browser or map above.
                      </p>
                    </div>
                  )}
                </div>

              </div>

            </div>
          )}

          {/* TAB 2: SOLVIVOR PROFILE DECK */}
          {activeTab === "profile" && (
            <div className="ops-grid-3">
              
              {/* Profile Bounding Frame */}
              <div className="panel" style={{
                background: "#080808", border: "1px solid rgba(255,255,255,0.08)",
                padding: "24px", display: "flex", flexDirection: "column", justifyItems: "center",
                justifyContent: "space-between", position: "relative", height: "100%"
              }}>
                <div style={{ position: "absolute", top: "10px", left: "10px", width: "14px", height: "14px", borderTop: "2px solid var(--accent)", borderLeft: "2px solid var(--accent)" }} />
                <div style={{ position: "absolute", top: "10px", right: "10px", width: "14px", height: "14px", borderTop: "2px solid var(--accent)", borderRight: "2px solid var(--accent)" }} />
                <div style={{ position: "absolute", bottom: "10px", left: "10px", width: "14px", height: "14px", borderBottom: "2px solid var(--accent)", borderLeft: "2px solid var(--accent)" }} />
                <div style={{ position: "absolute", bottom: "10px", right: "10px", width: "14px", height: "14px", borderBottom: "2px solid var(--accent)", borderRight: "2px solid var(--accent)" }} />
                
                <span style={{ fontFamily: "var(--mono)", fontSize: "9px", color: "var(--text-muted)", letterSpacing: "0.2em" }}>
                  [ OPERATIVE PORTRAIT DOSSIER ]
                </span>

                {/* Portrait box */}
                <div className="holo-noise" style={{
                  flex: 1, border: "1px dashed rgba(255, 77, 77, 0.2)", background: "rgba(0,0,0,0.5)",
                  margin: "16px 0", display: "flex", flexDirection: "column", alignItems: "center",
                  justifyContent: "center", position: "relative", minHeight: "180px"
                }}>
                  <div style={{ position: "absolute", top: "40%", left: "40%", width: "20%", height: "20%", border: "1px dashed rgba(255,77,77,0.25)", borderRadius: "50%" }} />
                  
                  <div style={{ zIndex: 1, textAlign: "center" }} className="animate-flicker">
                    <div style={{ fontFamily: "var(--mono)", fontSize: "10px", color: "var(--accent)", fontWeight: "bold" }}>
                      [ BIOMETRIC ENVELOPE SECURED ]
                    </div>
                    <div style={{ fontFamily: "var(--mono)", fontSize: "8.5px", color: "var(--text-muted)", marginTop: "4px" }}>
                      RECONNAISSANCE IMAGERY PENDING
                    </div>
                  </div>
                </div>

                {/* Identity Stamps */}
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  <div style={{ display: "flex", justifyItems: "center", justifyContent: "space-between", borderBottom: "1px dashed rgba(255,255,255,0.05)", paddingBottom: "4px" }}>
                    <span style={{ fontFamily: "var(--mono)", fontSize: "9px", color: "var(--text-dim)" }}>DIVISION STAMP:</span>
                    <span style={{ fontFamily: "var(--title-font)", fontSize: "11px", color: getFactionColor(profile?.faction), fontWeight: "bold" }}>
                      {profile?.faction?.toUpperCase()}
                    </span>
                  </div>
                  <div style={{ display: "flex", justifyItems: "center", justifyContent: "space-between" }}>
                    <span style={{ fontFamily: "var(--mono)", fontSize: "9px", color: "var(--text-dim)" }}>CLEARANCE STATUS:</span>
                    <span style={{ fontFamily: "var(--mono)", fontSize: "10.5px", color: "#00ffcc", fontWeight: "bold" }}>
                      ACTIVE // SECURE
                    </span>
                  </div>
                </div>
              </div>

              {/* Sub-stats Diagnostic panel */}
              <div className="panel" style={{ border: "1px solid var(--border)", padding: "24px", gridColumn: "span 2", display: "flex", flexDirection: "column", overflow: "hidden", height: "100%" }}>
                <h2 style={{ fontSize: "15px", color: "#fff", marginBottom: "16px", borderBottom: "1px dashed var(--border)", paddingBottom: "8px", flexShrink: 0 }}>
                  OPERATIVE READINESS EVALUATION
                </h2>
                
                <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "16px" }}>
                  {/* Level and XP progress bar */}
                  <div style={{ background: "#080808", border: "1px solid var(--border)", padding: "12px" }}>
                    <div style={{ display: "flex", justifyItems: "center", justifyContent: "space-between", fontFamily: "var(--mono)", fontSize: "11px", marginBottom: "6px" }}>
                      <span>OPERATIVE LEVEL: <span style={{ color: "var(--accent)", fontWeight: "bold" }}>{profile?.level || 1}</span></span>
                      <span>{(profile?.xp || 0) % 100} / 100 XP TO UPGRADE</span>
                    </div>
                    <div style={{ width: "100%", height: "6px", background: "rgba(255,255,255,0.04)", borderRadius: "2px", overflow: "hidden" }}>
                      <div style={{ width: `${(profile?.xp || 0) % 100}%`, height: "100%", background: "var(--accent)" }} />
                    </div>
                  </div>

                  {/* Sub-stats telemetry checklist */}
                  <div className="ops-grid-2">
                    {[
                      { label: "THREAT AWARENESS", val: profileStats.threat_awareness, desc: "Early-warning detection of global anomalies." },
                      { label: "OPERATIONAL DISCIPLINE", val: profileStats.operational_discipline, desc: "Consistency in executing countermeasure tasks." },
                      { label: "PSYCHOLOGICAL STABILITY", val: profileStats.psychological_stability, desc: "Stress threshold during quarantine/nuclear alerts." },
                      { label: "TECHNICAL PREPAREDNESS", val: profileStats.technical_preparedness, desc: "Calibrating systems and analog backup skills." },
                      { label: "ADAPTABILITY", val: profileStats.adaptability, desc: "Survival capacity during rapid environmental shifts." },
                      { label: "RESOURCEFULNESS", val: profileStats.resourcefulness, desc: "Farming efficiency and custom secondary bonuses." },
                      { label: "SURVEILLANCE RESISTANCE", val: profileStats.surveillance_resistance, desc: "On-chain transaction privacy preservation." }
                    ].map((s) => (
                      <div key={s.label} style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                        <div style={{ display: "flex", justifyItems: "center", justifyContent: "space-between", fontFamily: "var(--mono)", fontSize: "10.5px" }}>
                          <span style={{ color: "#fff", fontWeight: "bold" }}>{s.label}</span>
                          <span style={{ color: "#00ffcc", fontWeight: "bold" }}>{s.val} %</span>
                        </div>
                        <div style={{ width: "100%", height: "4px", background: "rgba(255,255,255,0.02)", borderRadius: "2px", overflow: "hidden" }}>
                          <div style={{ width: `${s.val}%`, height: "100%", background: "#00ffcc" }} />
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Resources display */}
                  <div style={{ borderTop: "1px dashed var(--border)", paddingTop: "14px" }}>
                    <div style={{ fontFamily: "var(--mono)", fontSize: "10px", color: "var(--text-dim)", letterSpacing: "0.15em", marginBottom: "10px" }}>
                      [ OPERATIVE RESOURCE PROFILE ]
                    </div>
                    
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(120px, 1fr))", gap: "10px" }}>
                      <div style={{ background: "#080808", border: "1px solid var(--border)", padding: "10px", borderRadius: "2px" }}>
                        <span style={{ fontFamily: "var(--mono)", fontSize: "8px", color: "var(--text-dim)", display: "block" }}>CREDITS</span>
                        <span style={{ fontFamily: "var(--title-font)", fontSize: "13px", color: "#00ffcc", fontWeight: "bold", display: "block", marginTop: "2px" }}>
                          {profile?.credits || 0} CR
                        </span>
                      </div>
                      {Object.keys(profile?.resources || {}).map((resName) => (
                        <div key={resName} style={{ background: "#080808", border: "1px solid var(--border)", padding: "10px", borderRadius: "2px" }}>
                          <span style={{ fontFamily: "var(--mono)", fontSize: "8px", color: "var(--text-dim)", display: "block" }}>{resName.toUpperCase()}</span>
                          <span style={{ fontFamily: "var(--mono)", fontSize: "12px", color: "#fff", fontWeight: "bold", display: "block", marginTop: "2px" }}>
                            {profile?.resources?.[resName]} UNITS
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

            </div>
          )}

          {/* TAB 3: LOADOUT GRID (INVENTORY UPGRADE) */}
          {activeTab === "inventory" && (
            <div className="ops-grid-3-loadout">
              
              {/* Left Column: Equipped Gear Slots */}
              <div style={{ display: "flex", flexDirection: "column", gap: "10px", overflowY: "auto", paddingRight: "4px" }}>
                <div style={{ fontFamily: "var(--mono)", fontSize: "9px", color: "var(--text-dim)", letterSpacing: "0.15em", fontWeight: "bold", borderBottom: "1px dashed rgba(255,255,255,0.06)", paddingBottom: "4px" }}>
                  [ EQUIPPED GEAR ]
                </div>

                {[
                  { slot: "Helmet", icon: "🪖", label: "HELMET CORE" },
                  { slot: "Armor", icon: "🛡️", label: "VITAL SHIELD / CORE" },
                  { slot: "Weapon", icon: "🔫", label: "PRIMARY WEAPON" },
                  { slot: "Utility", icon: "🛠️", label: "TACTICAL UTILITY" },
                  { slot: "Medkit", icon: "🧪", label: "MEDICAL LOAD" },
                  { slot: "Backpack", icon: "🎒", label: "CARGO BAG" },
                  { slot: "Gadget", icon: "📡", label: "TELEMETRY GADGET" }
                ].map((s) => {
                  const item = equippedGear[s.slot];
                  const rarityStyle = item ? getRarityStyle(item.rarity) : null;
                  
                  return (
                    <div
                      key={s.slot}
                      style={{
                        background: "#080808", padding: "10px 14px",
                        border: item ? rarityStyle?.border : "1px dashed rgba(255,255,255,0.1)",
                        display: "flex", gap: "12px", alignItems: "center", borderRadius: "2px",
                        position: "relative"
                      }}
                    >
                      <div className="holo-noise" style={{
                        width: "36px", height: "36px", border: "1px solid rgba(255,255,255,0.1)",
                        background: item ? rarityStyle?.bg : "rgba(0,0,0,0.4)", display: "flex",
                        alignItems: "center", justifyContent: "center", borderRadius: "2px", flexShrink: 0
                      }}>
                        <span style={{ fontSize: "16px", color: item ? rarityStyle?.color : "rgba(255,255,255,0.2)" }}>{s.icon}</span>
                      </div>
                      
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <span style={{ fontFamily: "var(--mono)", fontSize: "8px", color: "var(--text-muted)", display: "block" }}>{s.label}</span>
                        {item ? (
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <span style={{ fontFamily: "var(--title-font)", fontSize: "11px", color: "#fff", fontWeight: "bold", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                              {item.name}
                            </span>
                            <button
                              onClick={() => handleUnequipItem(s.slot)}
                              style={{
                                background: "none", border: "none", color: "#ff4d4d", cursor: "pointer",
                                fontSize: "9px", fontFamily: "var(--mono)", padding: 0
                              }}
                            >
                              [ REMOVE ]
                            </button>
                          </div>
                        ) : (
                          <span style={{ fontFamily: "var(--mono)", fontSize: "9px", color: "var(--accent)", display: "block", fontWeight: "bold", animation: "blink 1.8s infinite" }}>
                            SLOT EMPTY // UPLINK PENDING
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Center Column: Operative Vector Silhouette */}
              <div className="loadout-center-silhouette panel holo-noise animate-pulse-slow" style={{
                background: "#050505", border: "1px dashed rgba(255,255,255,0.1)",
                display: "flex", flexDirection: "column", justifyItems: "center", justifyContent: "center",
                alignItems: "center", position: "relative", height: "100%"
              }}>
                <svg width="180" height="180" viewBox="0 0 100 100" style={{ opacity: 0.15, position: "absolute" }}>
                  <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="0.5" />
                  <circle cx="50" cy="50" r="25" fill="none" stroke="currentColor" strokeWidth="0.5" strokeDasharray="2,2" />
                  <line x1="50" y1="5" x2="50" y2="95" stroke="currentColor" strokeWidth="0.5" />
                  <line x1="5" y1="50" x2="95" y2="50" stroke="currentColor" strokeWidth="0.5" />
                </svg>
                
                <div style={{ zIndex: 1, textAlign: "center" }} className="animate-flicker">
                  <span style={{ fontFamily: "var(--mono)", fontSize: "11px", color: "var(--accent)", fontWeight: "bold", letterSpacing: "0.2em", display: "block" }}>
                    [ BIOMETRIC RADAR GRID ]
                  </span>
                  <span style={{ fontFamily: "var(--mono)", fontSize: "9px", color: "var(--text-muted)", display: "block", marginTop: "4px" }}>
                    SIGNAL BOUND SECURED // SLOT DRAG INJECTION READY
                  </span>
                </div>
              </div>

              {/* Right Column: Complete RPG Inventory grid */}
              <div className="panel" style={{
                background: "#080808", border: "1px solid var(--border)",
                padding: "16px", display: "flex", flexDirection: "column", gap: "12px", overflow: "hidden", height: "100%"
              }}>
                {/* Inventory Filter Tabs */}
                <div style={{ display: "flex", gap: "4px", flexShrink: 0, borderBottom: "1px solid rgba(255,255,255,0.06)", paddingBottom: "8px" }}>
                  {[
                    { id: "all", label: "ALL" },
                    { id: "weapon", label: "WEAPONS" },
                    { id: "armor", label: "ARMOR" },
                    { id: "consumable", label: "CONSUMABLES" },
                    { id: "material", label: "MATERIALS" }
                  ].map(tab => (
                    <button
                      key={tab.id}
                      onClick={() => { setInventoryFilter(tab.id); setSelectedInventoryItem(null); }}
                      style={{
                        background: inventoryFilter === tab.id ? "var(--accent)" : "none",
                        color: inventoryFilter === tab.id ? "#000" : "var(--text-dim)",
                        border: "1px solid",
                        borderColor: inventoryFilter === tab.id ? "var(--accent)" : "var(--border)",
                        padding: "6px 12px", fontFamily: "var(--mono)", fontSize: "9px", fontWeight: "bold",
                        cursor: "pointer", transition: "all 0.15s", borderRadius: "2px"
                      }}
                    >
                      {tab.label}
                    </button>
                  ))}
                </div>

                {/* Search & Sort utility controls */}
                <div style={{ display: "flex", gap: "10px", flexShrink: 0 }}>
                  <input
                    type="text"
                    placeholder="Search inventory..."
                    value={inventorySearch}
                    onChange={(e) => { setInventorySearch(e.target.value); setSelectedInventoryItem(null); }}
                    style={{
                      flex: 1, background: "#0c0c0c", border: "1px solid var(--border)",
                      padding: "6px 10px", fontFamily: "var(--mono)", fontSize: "10px", color: "#fff",
                      outline: "none"
                    }}
                  />
                  <select
                    value={inventorySort}
                    onChange={(e) => { setInventorySort(e.target.value); setSelectedInventoryItem(null); }}
                    style={{
                      background: "#0c0c0c", border: "1px solid var(--border)", color: "var(--text-dim)",
                      padding: "6px 10px", fontFamily: "var(--mono)", fontSize: "10px", outline: "none", cursor: "pointer"
                    }}
                  >
                    <option value="power-desc">POWER (HIGH-LOW)</option>
                    <option value="power-asc">POWER (LOW-HIGH)</option>
                    <option value="rarity-desc">RARITY (LEGENDARY-COMMON)</option>
                    <option value="name-asc">NAME (A-Z)</option>
                  </select>
                </div>

                {/* Scrollable grid representing RPG item slots */}
                <div style={{ flex: 1, overflowY: "auto", display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(64px, 1fr))", gap: "8px", alignContent: "start", paddingRight: "4px" }}>
                  {filteredInventory.map((item) => {
                    const rarityStyle = getRarityStyle(item.rarity);
                    const isSelected = selectedInventoryItem?.id === item.id;
                    
                    return (
                      <button
                        key={item.id}
                        onClick={() => setSelectedInventoryItem(item)}
                        style={{
                          aspectRatio: "1", background: rarityStyle.bg, border: isSelected ? "2px solid #fff" : rarityStyle.border,
                          cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center",
                          justifyContent: "center", position: "relative", padding: "4px", borderRadius: "2px"
                        }}
                      >
                        {/* Rarity Color dot */}
                        <span style={{ position: "absolute", top: "4px", right: "4px", width: "4px", height: "4px", borderRadius: "50%", background: rarityStyle.color }} />
                        
                        <span style={{ fontSize: "18px" }}>
                          {item.type === "weapon" ? "🔫" : item.slot === "Helmet" ? "🪖" : item.type === "armor" ? "🛡️" : item.type === "material" ? "📦" : "🧪"}
                        </span>
                        
                        <span style={{
                          fontFamily: "var(--mono)", fontSize: "8.5px", color: "rgba(255,255,255,0.7)",
                          marginTop: "4px", whiteSpace: "nowrap", overflow: "hidden", width: "100%", textOverflow: "ellipsis"
                        }}>
                          {item.name.split(" ")[0]}
                        </span>

                        {/* Quantity stack count */}
                        {item.qty > 1 && (
                          <span style={{
                            position: "absolute", bottom: "2px", right: "4px", fontFamily: "var(--mono)",
                            fontSize: "8.5px", color: "#fff", fontWeight: "bold", background: "rgba(0,0,0,0.7)",
                            padding: "1px 3px", borderRadius: "2px"
                          }}>
                            {item.qty}
                          </span>
                        )}
                      </button>
                    );
                  })}
                  {/* Fill visual slots */}
                  {Array.from({ length: Math.max(0, 16 - filteredInventory.length) }).map((_, i) => (
                    <div key={`empty-${i}`} style={{
                      aspectRatio: "1", border: "1px dashed rgba(255,255,255,0.04)",
                      background: "rgba(0,0,0,0.1)", borderRadius: "2px"
                    }} />
                  ))}
                </div>

                {/* Selected Item Interactive Tooltip Panel */}
                <div style={{
                  height: "110px", background: "#0c0c0c", border: "1px solid var(--border)",
                  padding: "10px 14px", flexShrink: 0, display: "flex", flexDirection: "column",
                  justifyContent: "space-between", position: "relative"
                }}>
                  {selectedInventoryItem ? (
                    <div style={{ display: "flex", flexDirection: "column", height: "100%", justifyContent: "space-between" }}>
                      <div>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span style={{
                            fontFamily: "var(--title-font)", fontSize: "12px",
                            color: getRarityStyle(selectedInventoryItem.rarity).color, fontWeight: "bold"
                          }}>
                            {selectedInventoryItem.name}
                          </span>
                          <span style={{ fontFamily: "var(--mono)", fontSize: "9px", color: "#00ffcc" }}>
                            {selectedInventoryItem.power > 0 ? `POWER: ${selectedInventoryItem.power}` : "MATERIAL"}
                          </span>
                        </div>
                        <p style={{ fontSize: "10px", color: "var(--text-muted)", margin: "4px 0 0 0", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                          {selectedInventoryItem.desc}
                        </p>
                      </div>

                      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", borderTop: "1px solid rgba(255,255,255,0.04)", paddingTop: "6px" }}>
                        <span style={{ fontFamily: "var(--mono)", fontSize: "8.5px", color: "var(--text-dim)" }}>
                          Class Req: {selectedInventoryItem.class_requirement}
                        </span>
                        
                        {selectedInventoryItem.slot !== "None" ? (
                          <button
                            onClick={() => handleEquipItem(selectedInventoryItem)}
                            style={{
                              background: "var(--accent)", color: "#000", border: "none",
                              padding: "4px 12px", fontFamily: "var(--mono)", fontSize: "9.5px",
                              fontWeight: "bold", cursor: "pointer", borderRadius: "2px"
                            }}
                          >
                            [ EQUIP GEAR ]
                          </button>
                        ) : (
                          <span style={{ fontFamily: "var(--mono)", fontSize: "9px", color: "var(--text-muted)", fontStyle: "italic" }}>
                            NON-EQUIPPABLE
                          </span>
                        )}
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", textAlign: "center" }}>
                      <span style={{ fontFamily: "var(--mono)", fontSize: "10px", color: "var(--text-muted)" }}>
                        [ SELECT AN ITEM TO INSPECT STATS ]
                      </span>
                    </div>
                  )}
                </div>

              </div>

            </div>
          )}

        </main>
      </div>

      {/* --- IN-GAME GAMEPLAY OVERLAYS SYSTEM --- */}
      
      {/* 1. Briefing Overlay */}
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
            
            {/* Mission Artwork container - Art Container Frame */}
            <div className="holo-noise" style={{
              height: "180px", width: "100%", background: "#030303", border: "1px dashed rgba(255,255,255,0.15)",
              marginBottom: "24px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center"
            }}>
              <span style={{ fontFamily: "var(--mono)", fontSize: "12px", color: "var(--accent)", fontWeight: "bold", letterSpacing: "0.15em", display: "block" }}>
                [ MISSION SECTOR PROFILE LOCKED ]
              </span>
              <span style={{ fontFamily: "var(--mono)", fontSize: "9.5px", color: "var(--text-muted)", display: "block", marginTop: "4px" }}>
                AWAITING SATELLITE RECONNAISSANCE IMAGERY
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
                {activeMission.recommended_class_id === profile?.class
                  ? `"Operative configuration matches mission coordinates. Your medic/specialist capabilities yield +15% success probability check. Deploy immediately."`
                  : `"Warning: Active class [${profile?.class?.toUpperCase()}] deviates from recommended profile [${activeMission.recommended_class_id.toUpperCase()}]. Proceed with caution."`}
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

      {/* 2. Deployment Simulator Overlay */}
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

      {/* 3. Connection Sequence Overlay */}
      {activeMission && missionFlow === "connection" && (
        <div style={{
          position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", zIndex: 100000,
          background: "#030303", display: "flex", alignItems: "center", justifyContent: "center",
          padding: "24px"
        }}>
          <div className="panel" style={{ maxWidth: "760px", width: "100%", borderColor: "rgba(0, 255, 204, 0.55)", background: "#000", padding: "40px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "24px" }}>
              <div style={{ fontFamily: "var(--mono)", fontSize: "11px", color: "#00ffcc", letterSpacing: "0.25em", fontWeight: "bold" }}>
                ▶ SATELLITE HANDSHAKE PROTOCOL
              </div>
              <span className="status-dot animate-pulse" style={{ background: "#00ffcc", boxShadow: "0 0 10px #00ffcc" }} />
            </div>

            {/* Handshake terminals */}
            <div className="holo-noise" style={{
              background: "#040404", border: "1px solid #141414", padding: "32px", borderRadius: "2px",
              minHeight: "240px", fontFamily: "var(--mono)", fontSize: "14px", color: "#00ffcc",
              display: "flex", flexDirection: "column", gap: "14px", marginBottom: "24px",
              justifyContent: "center"
            }}>
              {connectionLogs.map((log, idx) => (
                <div key={idx} className="animate-flicker" style={{ textShadow: "0 0 8px rgba(0,255,204,0.4)" }}>{log}</div>
              ))}
              {connectionLogs.length < 4 && (
                <div className="loading-dots" style={{ opacity: 0.5 }}>DECRYPTING NODE SECURITY KEY</div>
              )}
            </div>

            {/* Visual alert */}
            <div style={{ display: "flex", justifyItems: "center", gap: "10px", alignItems: "center" }}>
              <span style={{ width: "8px", height: "8px", background: "#00ffcc", borderRadius: "50%" }} className="animate-pulse" />
              <span style={{ fontFamily: "var(--mono)", fontSize: "11px", color: "var(--text-muted)" }}>
                TRANSMISSION COORDINATES RESOLVED. AWAITING FINAL HANDSHAKE SIGNATURES.
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 4. Tactical Decision Overlay */}
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
              {activeMission.scenarios?.[0]?.text || "Tactical coordinates loaded. Awaiting response."}
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              {activeMission.scenarios?.[0]?.options?.map((opt: any) => {
                const isRecommended = opt.class_bonus?.classId === profile?.class;
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
                    <div style={{ display: "flex", justifyItems: "center", justifyContent: "space-between", width: "100%", alignItems: "center" }}>
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

      {/* 5. Debriefing Overlay */}
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
              {missionOutcome === "SUCCESS" ? selectedOption?.success_text : selectedOption?.failure_text}
            </p>

            <div style={{ background: "rgba(255, 255, 255, 0.02)", borderLeft: `4px solid ${missionOutcome === "SUCCESS" ? "#00ffcc" : "var(--accent)"}`, padding: "20px", borderRadius: "2px", marginBottom: "32px" }}>
              <p style={{ fontFamily: "var(--mono)", fontSize: "13px", color: "var(--text-dim)", fontStyle: "italic", whiteSpace: "pre-line", margin: 0, lineHeight: "1.6" }} className="animate-flicker">
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

      {/* 6. Reward Claim Overlay */}
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

            {/* Reward list */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "32px" }} className="ops-grid-2">
              <div style={{ background: "#000", padding: "20px", border: "1px solid var(--border)", textAlign: "center" }}>
                <span style={{ fontFamily: "var(--mono)", fontSize: "9.5px", color: "var(--text-dim)", display: "block" }}>OPERATIVE EXPERIENCE</span>
                <span style={{ fontFamily: "var(--title-font)", fontSize: "20px", color: "#00ffcc", fontWeight: "bold", display: "block", marginTop: "6px" }}>
                  +{outcomeRewards?.xp || 0} XP
                </span>
              </div>
              <div style={{ background: "#000", padding: "20px", border: "1px solid var(--border)", textAlign: "center" }}>
                <span style={{ fontFamily: "var(--mono)", fontSize: "9.5px", color: "var(--text-dim)", display: "block" }}>CREDITS VALUE</span>
                <span style={{ fontFamily: "var(--title-font)", fontSize: "20px", color: "#00ffcc", fontWeight: "bold", display: "block", marginTop: "6px" }}>
                  +{outcomeRewards?.credits || 0} CR
                </span>
              </div>
              
              <div style={{ background: "#000", border: "1px dashed rgba(255,255,255,0.06)", padding: "16px", gridColumn: "span 2", display: "flex", justifyItems: "center", justifyContent: "center", alignItems: "center" }}>
                <span style={{ fontFamily: "var(--mono)", fontSize: "11px", color: "var(--text-muted)" }}>
                  [ REWARD_SHAPE_EMBLEM_LOCKED ]
                </span>
              </div>

              {outcomeRewards?.resource_qty > 0 && (
                <div style={{ background: "#000", padding: "20px", border: "1px solid var(--border)", textAlign: "center", gridColumn: "span 2" }}>
                  <span style={{ fontFamily: "var(--mono)", fontSize: "9.5px", color: "var(--text-dim)", display: "block" }}>RAW MATERIAL RECOVERED</span>
                  <span style={{ fontFamily: "var(--mono)", fontSize: "16px", color: "#fff", fontWeight: "bold", display: "block", marginTop: "6px" }}>
                    +{outcomeRewards?.resource_qty || 0} UNITS OF {outcomeRewards?.resource?.toUpperCase() || "RESOURCES"}
                  </span>
                </div>
              )}
              {outcomeRewards?.sub_stats && Object.keys(outcomeRewards?.sub_stats || {}).length > 0 && (
                <div style={{ border: "1px solid var(--border)", padding: "20px", background: "#000", gridColumn: "span 2" }}>
                  <span style={{ fontFamily: "var(--mono)", fontSize: "10px", color: "var(--text-dim)", display: "block", marginBottom: "8px", fontWeight: "bold" }}>
                    BIO-SCORE SUB-STATS RE-CALIBRATION:
                  </span>
                  {Object.keys(outcomeRewards?.sub_stats || {}).map((k) => (
                    <div key={k} style={{ display: "flex", justifyItems: "center", justifyContent: "space-between", fontSize: "13px", fontFamily: "var(--mono)", borderBottom: "1px dashed rgba(255,255,255,0.03)", padding: "4px 0" }}>
                      <span style={{ color: "var(--text-dim)" }}>{k.replace("_", " ").toUpperCase()}</span>
                      <span style={{ color: "#00ffcc", fontWeight: "bold" }}>+{outcomeRewards?.sub_stats?.[k]}%</span>
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
