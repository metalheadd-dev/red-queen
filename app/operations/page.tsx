"use client";
import { useState, useEffect, useRef } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { useAuth } from "@/components/AuthProvider";
import Link from "next/link";
import { DEFAULT_STATS, UserStats, calculateBioScore, getClearanceLevel } from "@/lib/progression";

// Game Types & Data imports
import { Sector, Mission, InventoryItem, OperativeProfile } from "@/lib/game/types";
import { INITIAL_SECTORS, INITIAL_MISSIONS, INITIAL_INVENTORY, SECTOR_CONNECTIONS } from "@/lib/game/data";
import {
  loadProfile,
  saveProfile,
  claimMissionRewards,
  loadInventory,
  saveInventory,
  loadEquippedGear,
  saveEquippedGear,
  DEFAULT_WORLD_STATE
} from "@/lib/game/service";

// Factions details list
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

// Classes details list
const CLASSES = [
  { id: "Assault", name: "Assault", desc: "Tactical combat specialization, heavy breach charges, and kinetic energy weapons.", preferred_gear: "Heavy Armor, Breach charges, Kinetic rifles", ability: "Overcharge Shield Grid" },
  { id: "Recon", name: "Recon", desc: "Stealth operations, zone scanning, target acquisition, and mapping surveillance grids.", preferred_gear: "Sensor array, Thermal cloak, Sniper rifle", ability: "Scan Grid Weaknesses" },
  { id: "Engineer", name: "Engineer", desc: "Structural defenses, generator calibration, and automated drone network sweeps.", preferred_gear: "Decoy swarm, Drone core, Power cutters", ability: "Repair Node Grid" },
  { id: "Medic", name: "Medic", desc: "Biological hazard containment, stim injection, and pathogen diagnostic treatment.", preferred_gear: "Stim injector, Gas filter, Medkit", ability: "Purify Bio-Toxins" },
  { id: "Scientist", name: "Scientist", desc: "Anomaly decoding, gravity wave analysis, and physical data decryption sweeps.", preferred_gear: "Gravity analyzer, Data pad, Shield scanner", ability: "Decode Anomalous Signals" },
  { id: "Specialist", name: "Specialist", desc: "Algorithmic routing, network signature security, and Sybil counter-measures.", preferred_gear: "Decoy keys, Multi-hop routers, Wasm shields", ability: "Overload Sybil Trackers" }
];

// Core roles mapping
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
  const [profile, setProfile] = useState<OperativeProfile | null>(null);
  
  // Onboarding step states
  const [onboardingStep, setOnboardingStep] = useState(1);
  const [selectedFaction, setSelectedFaction] = useState("");
  const [selectedClass, setSelectedClass] = useState("");
  const [selectedRole, setSelectedRole] = useState("");
  const [operativeName, setOperativeName] = useState("");

  // Reusable Data Models driven states
  const [sectors, setSectors] = useState<Sector[]>(INITIAL_SECTORS);
  const [missions, setMissions] = useState<Mission[]>(INITIAL_MISSIONS);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [equippedGear, setEquippedGear] = useState<Record<string, InventoryItem | null>>({});
  const [loadingOps, setLoadingOps] = useState(false);
  const [activeTab, setActiveTab] = useState<"center" | "profile" | "inventory">("center");

  // Map and Selected Sector selection
  const [selectedSectorId, setSelectedSectorId] = useState<string>("sec-alpha");
  const [selectedMapSector, setSelectedMapSector] = useState<string>("op-1-sanctuary-search");
  const [mapAlert, setMapAlert] = useState<string | null>(null);

  // Active Mission Simulation flow states
  const [activeMission, setActiveMission] = useState<Mission | null>(null);
  const [missionFlow, setMissionFlow] = useState<"briefing" | "deployment" | "connection" | "decision" | "debriefing" | "rewards" | null>(null);
  
  // Multi-event stages tracking
  const [currentEventIndex, setCurrentEventIndex] = useState(0);
  const [eventOutcomeText, setEventOutcomeText] = useState<string | null>(null);
  const [eventResolved, setEventResolved] = useState(false);
  const [cumulativeRewards, setCumulativeRewards] = useState({
    xp: 0,
    credits: 0,
    resources: {} as Record<string, number>,
    injury: 0,
    reputationBonus: 0
  });

  const [deploymentLogs, setDeploymentLogs] = useState<string[]>([]);
  const [deploymentProgress, setDeploymentProgress] = useState(0);
  const [selectedOption, setSelectedOption] = useState<any>(null);
  const [missionOutcome, setMissionOutcome] = useState<"SUCCESS" | "PARTIAL" | "FAILURE" | "CRITICAL_FAILURE" | null>(null);
  const [outcomeCommentary, setOutcomeCommentary] = useState("");
  const [levelUpMessage, setLevelUpMessage] = useState<string | null>(null);
  const [worldEventsMessage, setWorldEventsMessage] = useState<string | null>(null);

  // Connection logs
  const [connectionLogs, setConnectionLogs] = useState<string[]>([]);

  // Immersive AI console telemetry streaming log
  const [aiLogs, setAiLogs] = useState<string[]>([
    "[SYS] CORE SYNAPSE ENGAGED...",
    "[SYS] UPLINK STATUS // ONLINE // SECURE"
  ]);

  // Inventory Filtering & Sorting
  const [inventoryFilter, setInventoryFilter] = useState<string>("all");
  const [inventorySort, setInventorySort] = useState<string>("power-desc");
  const [inventorySearch, setInventorySearch] = useState<string>("");
  const [selectedInventoryItem, setSelectedInventoryItem] = useState<InventoryItem | null>(null);

  const aiLogsEndRef = useRef<HTMLDivElement>(null);

  // AI telemetry diagnostics simulator
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
      setAiLogs(prev => [...prev.slice(-30), line]);
    }, 5500);

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (aiLogsEndRef.current) {
      aiLogsEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [aiLogs]);

  // Load operative stats and inventory from services
  const loadGameData = () => {
    setLoading(true);
    const identifier = authIdentifier || (publicKey ? publicKey.toString() : "offline-operative");
    
    // Load profile
    const prof = loadProfile(identifier);
    setProfile(prof);

    // Load inventory & gear
    const inv = loadInventory(identifier, INITIAL_INVENTORY);
    setInventory(inv);

    const gear = loadEquippedGear(identifier);
    setEquippedGear(gear);
    
    setLoading(false);
  };

  useEffect(() => {
    loadGameData();
    
    setLoadingOps(true);
    setTimeout(() => {
      setLoadingOps(false);
    }, 400);
  }, [authIdentifier, publicKey]);

  // Handle Onboarding Completion
  const handleOnboardingSubmit = () => {
    if (!operativeName || !selectedFaction || !selectedClass || !selectedRole) return;
    
    const identifier = authIdentifier || (publicKey ? publicKey.toString() : "offline-operative");
    const initialProfile: OperativeProfile = {
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
      },
      completedMissions: [],
      reputation: 0,
      factionStanding: {
        vanguard: selectedFaction === "vanguard" ? 25 : 10,
        eclipse: selectedFaction === "eclipse" ? 25 : 0,
        helix: selectedFaction === "helix" ? 25 : 0,
        nomads: selectedFaction === "nomads" ? 25 : 0,
        citadel: selectedFaction === "citadel" ? 25 : 0,
        ghost: selectedFaction === "ghost" ? 25 : 0,
        aegis: selectedFaction === "aegis" ? 25 : 0,
        horizon: selectedFaction === "horizon" ? 25 : 0
      },
      achievements: [],
      missionHistory: [],
      sectorDiscoveries: ["sec-alpha", "sec-beta", "sec-delta"],
      health: 100,
      worldState: { ...DEFAULT_WORLD_STATE }
    };
    
    saveProfile(identifier, initialProfile);
    setProfile(initialProfile);
  };

  // Deployment sequences tickers
  const runDeployment = (op: Mission) => {
    setMissionFlow("deployment");
    setDeploymentProgress(0);
    setDeploymentLogs([]);
    setCurrentEventIndex(0);
    setEventResolved(false);
    setEventOutcomeText(null);
    setCumulativeRewards({
      xp: 0,
      credits: 0,
      resources: {},
      injury: 0,
      reputationBonus: 0
    });
    
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

  // Event Choice Handler
  const handleSelectOption = (choice: any) => {
    if (!profile || !activeMission) return;
    setSelectedOption(choice);
    
    let baseProb = choice.success_prob || 50;
    let matchingBonus = 0;
    
    if (choice.class_bonus?.classId === profile.class) {
      matchingBonus = choice.class_bonus.bonus || 15;
    }
    
    const finalChance = Math.min(95, baseProb + matchingBonus);
    const roll = Math.floor(Math.random() * 100) + 1;
    const success = roll <= finalChance;
    
    const reward = choice.effects;

    // Accumulate results
    setCumulativeRewards(prev => {
      const nextResources = { ...prev.resources };
      if (reward.resource) {
        nextResources[reward.resource] = (nextResources[reward.resource] || 0) + (success ? (reward.resourceQty || 1) : 0);
      }
      return {
        xp: prev.xp + (success ? reward.xp : Math.floor(reward.xp / 2)),
        credits: prev.credits + (success ? reward.credits : Math.floor(reward.credits / 3)),
        injury: prev.injury + (success ? 0 : (reward.injury || 0)),
        reputationBonus: prev.reputationBonus + (success ? (reward.reputationBonus || 0) : 0),
        resources: nextResources
      };
    });

    if (success) {
      setEventOutcomeText(`[SUCCESS] ${choice.success_text}`);
    } else {
      const damage = reward.injury || 0;
      setEventOutcomeText(`[FAILURE] ${choice.failure_text} (Health Impact: -${damage} HP)`);
      
      // Deduct health directly in local UI state
      setProfile(prev => {
        if (!prev) return null;
        return {
          ...prev,
          health: Math.max(10, prev.health - damage)
        };
      });
    }

    setEventResolved(true);
  };

  // Process next event or debriefing
  const handleNextEvent = () => {
    if (!activeMission || !profile) return;
    
    // Check if player died during choice
    if (profile.health <= 10) {
      setMissionOutcome("FAILURE");
      setMissionFlow("debriefing");
      setOutcomeCommentary(
        `[RED QUEEN AI WARNING]\n"Operative down. Vital bio-signals reached critical threshold. Automatic evacuation teleport triggered. Telemetry recovery failed."`
      );
      return;
    }

    if (currentEventIndex < activeMission.events.length - 1) {
      setCurrentEventIndex(prev => prev + 1);
      setEventOutcomeText(null);
      setEventResolved(false);
      setSelectedOption(null);
    } else {
      // Debriefing calculation
      const totalInjury = cumulativeRewards.injury;
      let finalOutcome: "SUCCESS" | "PARTIAL" | "FAILURE" | "CRITICAL_FAILURE" = "SUCCESS";
      
      if (totalInjury >= 50) {
        finalOutcome = "PARTIAL";
      }
      
      setMissionOutcome(finalOutcome);
      setMissionFlow("debriefing");
      setOutcomeCommentary(
        finalOutcome === "SUCCESS"
          ? `[RED QUEEN AI DEBRIEFING]\n"Target objective secured cleanly. Standing calibrators locked. All parameters green."`
          : `[RED QUEEN AI DEBRIEFING]\n"Objective achieved but with high stress parameters. Heavy biological impact registered."`
      );
    }
  };

  // Claim Rewards via service
  const handleClaimRewards = () => {
    if (!profile || !activeMission) return;
    const identifier = authIdentifier || (publicKey ? publicKey.toString() : "offline-operative");

    const unlocksSector = selectedOption?.effects?.unlocksSectorId;

    const { updatedProfile, levelUpMessage: lvlMsg, worldEventsMessage: wldMsg } = claimMissionRewards(
      profile,
      activeMission,
      missionOutcome || "SUCCESS",
      cumulativeRewards,
      unlocksSector
    );

    saveProfile(identifier, updatedProfile);
    setProfile(updatedProfile);
    
    setLevelUpMessage(lvlMsg);
    setWorldEventsMessage(wldMsg);

    // Reset Flow states
    setActiveMission(null);
    setMissionFlow(null);
    setSelectedOption(null);
    setMissionOutcome(null);
  };

  // Swapping inventory slots
  const handleEquip = (item: InventoryItem) => {
    if (!profile) return;
    const identifier = authIdentifier || (publicKey ? publicKey.toString() : "offline-operative");
    
    const slot = item.slot;
    if (slot === "None") return;

    const currentEquipped = equippedGear[slot];
    const newEquipped = { ...equippedGear, [slot]: item };
    
    let newInventory = inventory.map(i => {
      if (i.id === item.id) {
        return { ...i, qty: i.qty - 1 };
      }
      return i;
    }).filter(i => i.qty > 0);

    if (currentEquipped) {
      const existing = newInventory.find(i => i.id === currentEquipped.id);
      if (existing) {
        existing.qty += 1;
      } else {
        newInventory = [...newInventory, { ...currentEquipped, qty: 1 }];
      }
    }

    setEquippedGear(newEquipped);
    setInventory(newInventory);
    setSelectedInventoryItem(null);

    // Persist
    saveInventory(identifier, newInventory);
    saveEquippedGear(identifier, newEquipped);
  };

  const handleUnequip = (slotName: string) => {
    if (!profile) return;
    const identifier = authIdentifier || (publicKey ? publicKey.toString() : "offline-operative");
    
    const item = equippedGear[slotName];
    if (!item) return;

    const newEquipped = { ...equippedGear, [slotName]: null };
    
    let newInventory = [...inventory];
    const existing = newInventory.find(i => i.id === item.id);
    if (existing) {
      existing.qty += 1;
    } else {
      newInventory = [...newInventory, { ...item, qty: 1 }];
    }

    setEquippedGear(newEquipped);
    setInventory(newInventory);

    // Persist
    saveInventory(identifier, newInventory);
    saveEquippedGear(identifier, newEquipped);
  };

  // Use consumable Medkit/Stim
  const handleUseMedkit = (item: InventoryItem) => {
    if (!profile || profile.health >= 100) return;
    const identifier = authIdentifier || (publicKey ? publicKey.toString() : "offline-operative");

    const updatedProfile = {
      ...profile,
      health: Math.min(100, profile.health + 30)
    };

    let updatedInventory = inventory.map(i => {
      if (i.id === item.id) {
        return { ...i, qty: i.qty - 1 };
      }
      return i;
    }).filter(i => i.qty > 0);

    setProfile(updatedProfile);
    setInventory(updatedInventory);

    // Save state
    saveProfile(identifier, updatedProfile);
    saveInventory(identifier, updatedInventory);
    setSelectedInventoryItem(null);
    
    // Trigger confirm log
    setAiLogs(prev => [...prev, `[MEDKIT] MEDICAL UPLINK ENGAGED // BIO-HEALTH CALIBRATED TO ${updatedProfile.health} HP`]);
  };

  // Resolvers
  const getFactionColor = (facId: string) => {
    return FACTIONS.find(f => f.id === facId)?.color || "var(--accent)";
  };

  const profileStats = {
    ...DEFAULT_STATS,
    ...(profile?.stats || {})
  };
  const currentBioScore = calculateBioScore(profileStats);
  const clearanceTier = getClearanceLevel(currentBioScore);

  // Sector and Operations locks resolution
  const isMissionLocked = (mission: Mission) => {
    if (!profile) return true;
    
    const reqs = mission.unlockRequirements;
    if (reqs.level && profile.level < reqs.level) return true;
    if (reqs.bioScore && currentBioScore < reqs.bioScore) return true;
    if (reqs.completedMissionId && !profile.completedMissions.includes(reqs.completedMissionId)) return true;
    
    return false;
  };

  const getSectorCompletion = (sectorId: string) => {
    if (!profile) return 0;
    const sectorMissions = missions.filter(m => m.region === sectorId);
    if (sectorMissions.length === 0) return 0;
    const completedCount = sectorMissions.filter(m => profile.completedMissions.includes(m.id)).length;
    return Math.floor((completedCount / sectorMissions.length) * 100);
  };

  const getSectorStatus = (sector: Sector): "LOCKED" | "AVAILABLE" | "IN_PROGRESS" | "SECURED" | "DANGEROUS" | "CRITICAL" => {
    if (!profile) return "LOCKED";
    
    const isUnlocked = profile.worldState.unlockedSectors.includes(sector.id) || sector.id === "sec-alpha";
    if (!isUnlocked) return "LOCKED";

    const sectorMissions = missions.filter(m => m.region === sector.id);
    if (sectorMissions.length > 0 && sectorMissions.every(m => profile.completedMissions.includes(m.id))) {
      return "SECURED";
    }

    const hasAnyInProgress = sectorMissions.some(m => profile.completedMissions.includes(m.id));
    if (hasAnyInProgress) return "IN_PROGRESS";
    
    if (sector.threatLevel === "Severe" || sector.threatLevel === "High") {
      return "DANGEROUS";
    }
    
    return "AVAILABLE";
  };

  const getSortedMissions = () => {
    if (!profile) return [];
    
    return [...missions].sort((a, b) => {
      const aCompleted = profile.completedMissions.includes(a.id);
      const bCompleted = profile.completedMissions.includes(b.id);
      
      const aLocked = isMissionLocked(a);
      const bLocked = isMissionLocked(b);
      
      if (aLocked && !bLocked) return 1;
      if (!aLocked && bLocked) return -1;
      
      if (aCompleted && !bCompleted) return 1;
      if (!aCompleted && bCompleted) return -1;
      
      if (a.category === "critical" && b.category !== "critical") return -1;
      if (a.category !== "critical" && b.category === "critical") return 1;
      
      if (a.category === "normal" && b.category === "side") return -1;
      if (a.category === "side" && b.category === "normal") return 1;
      
      return a.id.localeCompare(b.id);
    });
  };

  const selectedSector = sectors.find(s => s.id === selectedSectorId);
  const selectedSectorMissions = missions.filter(m => m.region === selectedSectorId);
  const selectedOperation = missions.find(m => m.id === selectedMapSector);

  // Filter and Sort inventory items
  const filteredInventory = inventory
    .filter(item => {
      if (inventoryFilter === "weapon") return item.type === "weapon";
      if (inventoryFilter === "armor") return item.type === "armor" || item.slot === "Helmet";
      if (inventoryFilter === "consumable") return item.type === "consumable" || item.slot === "Utility" || item.slot === "Medkit";
      if (inventoryFilter === "material") return item.type === "material";
      return true;
    })
    .filter(item => {
      if (!inventorySearch) return true;
      return item.name.toLowerCase().includes(inventorySearch.toLowerCase()) || item.desc.toLowerCase().includes(inventorySearch.toLowerCase());
    })
    .sort((a, b) => {
      if (inventorySort === "power-desc") return b.power - a.power;
      if (inventorySort === "power-asc") return a.power - b.power;
      if (inventorySort === "name-asc") return a.name.localeCompare(b.name);
      
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
        alignItems: "center", justifyContent: "center", overflowY: "auto", padding: "20px 24px"
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
          
          /* Low-height laptop responsive overrides */
          @media (max-height: 800px) {
            .onboarding-panel {
              padding: 20px !important;
              max-height: 95vh !important;
              overflow-y: auto !important;
            }
            .onboarding-header {
              margin-bottom: 16px !important;
              padding-bottom: 12px !important;
            }
            .onboarding-header h1 {
              font-size: 24px !important;
            }
            .ops-grid-2 {
              gap: 8px !important;
            }
            .ops-grid-2 button {
              padding: 10px !important;
            }
            .holo-noise {
              min-height: 120px !important;
              margin: 10px 0 !important;
            }
            .class-ability {
              display: none !important;
            }
          }

          @media (max-width: 1200px) {
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

        <div className="panel onboarding-panel" style={{
          maxWidth: "1100px", width: "100%", position: "relative",
          background: "#060606", border: "2px solid rgba(255, 77, 77, 0.4)",
          boxShadow: "0 0 50px rgba(255, 77, 77, 0.12)", padding: "40px",
          display: "flex", flexDirection: "column"
        }}>
          {/* Corner brackets */}
          <div style={{ position: "absolute", top: "12px", left: "12px", width: "24px", height: "24px", borderTop: "3px solid var(--accent)", borderLeft: "3px solid var(--accent)" }} />
          <div style={{ position: "absolute", top: "12px", right: "12px", width: "24px", height: "24px", borderTop: "3px solid var(--accent)", borderRight: "3px solid var(--accent)" }} />
          <div style={{ position: "absolute", bottom: "12px", left: "12px", width: "24px", height: "24px", borderBottom: "3px solid var(--accent)", borderLeft: "3px solid var(--accent)" }} />
          <div style={{ position: "absolute", bottom: "12px", right: "12px", width: "24px", height: "24px", borderBottom: "3px solid var(--accent)", borderRight: "3px solid var(--accent)" }} />

          <div className="onboarding-header" style={{ textAlign: "center", borderBottom: "1px solid rgba(255,255,255,0.08)", paddingBottom: "24px", marginBottom: "32px" }}>
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
            <div style={{ maxHeight: "55vh", overflowY: "auto", paddingRight: "8px" }}>
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
                          <div className="class-ability" style={{ fontFamily: "var(--mono)", fontSize: "10.5px", color: "#00ffcc" }}>Ability: {c.ability}</div>
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
          grid-template-columns: 1.2fr 1.1fr 1.7fr;
          gap: 24px;
          width: 100%;
          height: 100%;
          overflow: hidden;
        }
        .holo-noise {
          background-image: linear-gradient(rgba(18, 16, 16, 0) 50%, rgba(0, 0, 0, 0.25) 50%), linear-gradient(90deg, rgba(255, 0, 0, 0.05), rgba(0, 255, 0, 0.02), rgba(0, 0, 255, 0.05));
          background-size: 100% 4px, 6px 100%;
        }
        
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
          transform-origin: 500px 300px;
        }
        
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
            HP: <span style={{ color: (profile?.health || 100) > 30 ? "#00ffcc" : "#ff4d4d", fontWeight: "bold" }}>{profile?.health || 100} / 100</span>
          </span>
          <span style={{ color: "rgba(255,255,255,0.15)", fontFamily: "var(--mono)", fontSize: "14px" }}>|</span>
          <span style={{ fontFamily: "var(--mono)", fontSize: "11.5px", color: "var(--text-dim)" }}>
            DISCIPLINE: <span style={{ color: "var(--accent)", fontWeight: "bold" }}>{profile?.class?.toUpperCase()}</span>
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
              localStorage.removeItem(`rq_ops_inventory:${identifier}`);
              localStorage.removeItem(`rq_ops_equipped:${identifier}`);
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
        <main style={{ flex: 1, padding: "20px", background: "#030303", display: "flex", flexDirection: "column", height: "100%", boxSizing: "border-box", overflow: "hidden" }}>
          
          {/* TAB 1: COMMAND CENTER (HUD & OPERATIONS) */}
          {/* TAB 1: COMMAND CENTER (HUD & OPERATIONS) */}
          {activeTab === "center" && (
            <div style={{ display: "grid", gridTemplateColumns: "250px 1fr 340px", gap: "16px", height: "100%", overflow: "hidden" }}>
              
              {/* LEFT COLUMN: THE WORLD IS ALIVE */}
              <div className="panel" style={{
                background: "#050505", border: "1px solid rgba(255, 77, 77, 0.25)",
                padding: "16px", display: "flex", flexDirection: "column", justifyItems: "center",
                justifyContent: "space-between", overflow: "hidden", position: "relative"
              }}>
                <div style={{ display: "flex", flexDirection: "column", gap: "12px", overflowY: "auto", paddingRight: "4px" }}>
                  <div style={{ fontFamily: "var(--mono)", fontSize: "9px", color: "var(--accent)", letterSpacing: "0.2em", fontWeight: "bold" }}>
                    03 // THE WORLD
                  </div>
                  
                  <h2 style={{ fontSize: "22px", fontFamily: "var(--title-font)", fontWeight: "900", color: "var(--accent)", letterSpacing: "0.02em", margin: "2px 0 0 0", lineHeight: "1.1" }}>
                    THE WORLD <br/><span style={{ color: "#fff" }}>IS ALIVE</span>
                  </h2>

                  <p style={{ fontSize: "11px", color: "var(--text-dim)", lineHeight: "1.4", margin: "4px 0" }}>
                    Explore a dangerous world divided into sectors. Every region has its own threats, resources, opportunities and secrets.
                  </p>

                  {/* Bullet indicators */}
                  <div style={{ display: "flex", flexDirection: "column", gap: "12px", marginTop: "8px" }}>
                    {[
                      { title: "DYNAMIC SECTORS", desc: "The situation changes. Outbreaks spread. New threats emerge.", icon: "☣️" },
                      { title: "VALUABLE RESOURCES", desc: "Scavenge, secure and manage critical resources to survive.", icon: "📦" },
                      { title: "STRATEGIC MISSIONS", desc: "Each mission affects the world. Your decisions shape the future.", icon: "🎯" },
                      { title: "FACTION INFLUENCE", desc: "Factions fight for control. Your reputation opens doors.", icon: "🤝" },
                      { title: "GLOBAL THREATS", desc: "From viruses to disasters. Humanity faces extinction vectors.", icon: "🚨" }
                    ].map((item, idx) => (
                      <div key={idx} style={{ display: "flex", gap: "8px" }}>
                        <span style={{ fontSize: "12px", filter: "drop-shadow(0 0 3px var(--accent))" }}>{item.icon}</span>
                        <div>
                          <h4 style={{ fontFamily: "var(--mono)", fontSize: "10px", color: "#fff", margin: 0, fontWeight: "bold" }}>{item.title}</h4>
                          <p style={{ fontSize: "9.5px", color: "var(--text-muted)", margin: "2px 0 0 0", lineHeight: "1.3" }}>{item.desc}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Bottom indicators */}
                <div style={{ borderTop: "1px dashed rgba(255,255,255,0.06)", paddingTop: "10px", display: "flex", flexDirection: "column", gap: "8px" }}>
                  <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px", fontFamily: "var(--mono)", fontSize: "9px" }}>
                    <div>
                      <span style={{ color: "var(--text-muted)", display: "block" }}>WORLD STATUS:</span>
                      <span style={{ color: "#ff4d4d", fontWeight: "bold" }}>UNSTABLE</span>
                    </div>
                    <div>
                      <span style={{ color: "var(--text-muted)", display: "block" }}>GLOBAL THREAT:</span>
                      <span style={{ color: "#ff4d4d", fontWeight: "bold" }}>SEVERE</span>
                    </div>
                  </div>
                  {/* Small wave simulator graphic */}
                  <div style={{ height: "20px", background: "rgba(255,0,0,0.04)", border: "1px solid rgba(255,0,0,0.1)", display: "flex", alignItems: "center", justifyContent: "center", position: "relative", overflow: "hidden" }}>
                    <div style={{ width: "100%", height: "2px", background: "var(--accent)", position: "absolute", opacity: 0.15 }} />
                    <span style={{ fontFamily: "var(--mono)", fontSize: "7.5px", color: "var(--accent-dim)" }}>[ BIOMETRICS SCAN STEADY ]</span>
                  </div>
                </div>
              </div>

              {/* CENTER COLUMN: MAP WINDOW */}
              <div className="panel holo-noise animate-pulse-slow" style={{
                position: "relative", background: "#050505", border: "2px solid rgba(255, 77, 77, 0.3)",
                boxShadow: "0 0 30px rgba(0, 0, 0, 0.9)", display: "flex", flexDirection: "column",
                justifyItems: "center", justifyContent: "space-between", padding: "12px", overflow: "hidden"
              }}>
                <div style={{ position: "absolute", top: "10px", left: "10px", width: "14px", height: "14px", borderTop: "2px solid var(--accent)", borderLeft: "2px solid var(--accent)" }} />
                <div style={{ position: "absolute", top: "10px", right: "10px", width: "14px", height: "14px", borderTop: "2px solid var(--accent)", borderRight: "2px solid var(--accent)" }} />
                <div style={{ position: "absolute", bottom: "10px", left: "10px", width: "14px", height: "14px", borderBottom: "2px solid var(--accent)", borderLeft: "2px solid var(--accent)" }} />
                <div style={{ position: "absolute", bottom: "10px", right: "10px", width: "14px", height: "14px", borderBottom: "2px solid var(--accent)", borderRight: "2px solid var(--accent)" }} />

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", zIndex: 1, borderBottom: "1px dashed rgba(255,255,255,0.06)", paddingBottom: "6px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ width: "6px", height: "6px", background: "#ff4d4d", borderRadius: "50%" }} className="animate-pulse" />
                    <span style={{ fontFamily: "var(--mono)", fontSize: "10px", color: "var(--accent)", letterSpacing: "0.2em", fontWeight: "bold" }}>
                      RED QUEEN Systems // TACTICAL MAP v2.8.7
                    </span>
                  </div>
                </div>

                <div style={{ flex: 1, position: "relative", margin: "6px 0", background: "rgba(0,0,0,0.65)", overflow: "hidden" }}>
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

                  <svg width="100%" height="100%" viewBox="0 0 1000 600" preserveAspectRatio="xMidYMid slice" style={{ position: "absolute", top: 0, left: 0 }}>
                    <defs>
                      <pattern id="map-grid-3" width="25" height="25" patternUnits="userSpaceOnUse">
                        <path d="M 25 0 L 0 0 0 25" fill="none" stroke="rgba(255,255,255,0.02)" strokeWidth="0.5"/>
                      </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#map-grid-3)" />

                    {/* Radar sweeps */}
                    <circle cx="500" cy="300" r="140" fill="none" stroke="rgba(255, 77, 77, 0.02)" strokeWidth="0.5" />
                    <circle cx="500" cy="300" r="280" fill="none" stroke="rgba(255, 77, 77, 0.01)" strokeWidth="0.5" />
                    <line className="map-scope-circle" x1="500" y1="300" x2="980" y2="300" stroke="rgba(255, 77, 77, 0.04)" strokeWidth="0.5" />

                    {/* Sector links and route nodes */}
                    {SECTOR_CONNECTIONS.map((conn, idx) => {
                      const fromUnlocked = profile?.worldState.unlockedSectors.includes(conn.from) || conn.from === "sec-alpha";
                      const toUnlocked = profile?.worldState.unlockedSectors.includes(conn.to) || conn.to === "sec-alpha";
                      const isLineActive = fromUnlocked && toUnlocked;
                      return (
                        <g key={idx}>
                          <line
                            x1={conn.x1} y1={conn.y1} x2={conn.x2} y2={conn.y2}
                            stroke={isLineActive ? "rgba(0, 255, 204, 0.25)" : "rgba(255, 255, 255, 0.05)"}
                            strokeWidth={isLineActive ? "2.5" : "1"}
                            strokeDasharray={isLineActive ? "none" : "5,5"}
                          />
                          {/* Dotted path circles on route midpoints */}
                          <circle cx={(conn.x1 + conn.x2) / 2} cy={(conn.y1 + conn.y2) / 2} r="3" fill={isLineActive ? "#00ffcc" : "#555"} opacity="0.6" />
                        </g>
                      );
                    })}

                    {/* Interactive SVG outline polygons representing territories */}
                    {sectors.map((sec) => {
                      const isUnlocked = profile?.worldState.unlockedSectors.includes(sec.id) || sec.id === "sec-alpha";
                      const isSelected = selectedSectorId === sec.id;
                      const status = getSectorStatus(sec);
                      const completion = getSectorCompletion(sec.id);

                      const colorMap = {
                        LOCKED: "rgba(45,45,45,0.2)",
                        AVAILABLE: "rgba(0, 255, 204, 0.02)",
                        IN_PROGRESS: "rgba(0, 255, 204, 0.05)",
                        SECURED: "rgba(0, 255, 204, 0.12)",
                        DANGEROUS: "rgba(240, 201, 41, 0.06)",
                        CRITICAL: "rgba(255, 77, 77, 0.15)"
                      };
                      const strokeColor = 
                        !isUnlocked ? "#333" :
                        status === "SECURED" ? "#00ffcc" :
                        status === "DANGEROUS" || status === "CRITICAL" ? "#ff4d4d" : "#f0c929";

                      return (
                        <g key={sec.id}>
                          <polygon
                            points={sec.points}
                            fill={isSelected ? "rgba(255, 77, 77, 0.15)" : colorMap[status] || "none"}
                            stroke={isSelected ? "var(--accent)" : strokeColor}
                            strokeWidth={isSelected ? "2.5" : "1.5"}
                            style={{ cursor: isUnlocked ? "pointer" : "not-allowed", transition: "all 0.18s" }}
                            onClick={() => {
                              if (!isUnlocked) {
                                setMapAlert(`SECTOR SYSTEM GATE LOCKED // PROGRESS CAMPAIGN TO DECRYPT`);
                                setTimeout(() => setMapAlert(null), 3500);
                              } else {
                                setSelectedSectorId(sec.id);
                                // select first mission in that sector
                                const sectorMissions = missions.filter(m => m.region === sec.id);
                                if (sectorMissions.length > 0) {
                                  setSelectedMapSector(sectorMissions[0].id);
                                }
                              }
                            }}
                          />
                          
                          {/* Immersive HUD Label Floating Card */}
                          <g style={{ pointerEvents: "none" }}>
                            {/* Card Border Background */}
                            <rect
                              x={sec.labelX - 60}
                              y={sec.labelY - 24}
                              width="120"
                              height="48"
                              rx="3"
                              fill="rgba(2,2,2,0.85)"
                              stroke={isSelected ? "var(--accent)" : isUnlocked ? "rgba(0,255,204,0.15)" : "rgba(255,255,255,0.05)"}
                              strokeWidth="1.5"
                            />
                            {/* Inner Faction Indicator Square */}
                            <rect
                              x={sec.labelX - 52}
                              y={sec.labelY - 16}
                              width="8"
                              height="8"
                              fill={strokeColor}
                            />
                            <text
                              x={sec.labelX + 8}
                              y={sec.labelY - 10}
                              fill="#fff"
                              fontSize="9.5px"
                              fontWeight="900"
                              fontFamily="var(--mono)"
                              textAnchor="middle"
                            >
                              {sec.name}
                            </text>
                            <text
                              x={sec.labelX}
                              y={sec.labelY + 8}
                              fill="rgba(255,255,255,0.6)"
                              fontSize="7.5px"
                              fontFamily="var(--mono)"
                              textAnchor="middle"
                            >
                              STABILITY: {completion}%
                            </text>
                            <text
                              x={sec.labelX}
                              y={sec.labelY + 18}
                              fill={strokeColor}
                              fontSize="7.5px"
                              fontFamily="var(--mono)"
                              textAnchor="middle"
                              fontWeight="bold"
                            >
                              {!isUnlocked ? "LOCKED" : `THREAT: ${sec.threatLevel.toUpperCase()}`}
                            </text>
                          </g>
                        </g>
                      );
                    })}
                  </svg>
                </div>

                {/* Legend bar at the bottom */}
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", zIndex: 1, fontFamily: "var(--mono)", fontSize: "9px", color: "var(--text-muted)", borderTop: "1px dashed rgba(255,255,255,0.06)", paddingTop: "6px" }}>
                  <div style={{ display: "flex", gap: "16px" }}>
                    <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                      <span style={{ width: "12px", height: "2px", background: "rgba(0,255,204,0.7)" }} /> SAFE ROUTE
                    </span>
                    <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                      <span style={{ width: "12px", height: "0", borderBottom: "2px dashed rgba(255,255,255,0.35)" }} /> RISKY ROUTE
                    </span>
                    <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                      ☣️ OUTBREAK
                    </span>
                    <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                      📦 RESOURCE NODE
                    </span>
                    <span style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                      🏰 STRONGHOLD
                    </span>
                  </div>
                  <span>GRID CONSOLE ONLINE</span>
                </div>
              </div>

              {/* RIGHT COLUMN: SECTOR OVERVIEW & MISSION BOARD */}
              <div className="panel" style={{
                background: "#050505", border: "1px solid rgba(255, 77, 77, 0.25)",
                padding: "16px", display: "flex", flexDirection: "column", justifyItems: "center",
                justifyContent: "space-between", overflow: "hidden", position: "relative"
              }}>
                {selectedSector ? (
                  <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px", flexShrink: 0 }}>
                      <div style={{ display: "flex", justifyItems: "center", justifyContent: "space-between", alignItems: "center" }}>
                        <span style={{ fontFamily: "var(--mono)", fontSize: "9.5px", color: "var(--accent)", letterSpacing: "0.15em", fontWeight: "bold" }}>
                          [ SECTOR BRIEFING ]
                        </span>
                        <span className={`tag ${getSectorStatus(selectedSector) === "SECURED" ? "tag-green" : "tag-red"}`} style={{ fontSize: "8.5px", padding: "2px 8px" }}>
                          {getSectorStatus(selectedSector).toUpperCase()}
                        </span>
                      </div>

                      <h3 style={{ fontSize: "18px", color: "#fff", margin: "2px 0", letterSpacing: "0.02em", borderBottom: "1px solid rgba(255,255,255,0.06)", paddingBottom: "4px" }}>
                        {selectedSector.name}
                      </h3>

                      <p style={{ fontSize: "11px", color: "var(--text-dim)", lineHeight: "1.4", margin: 0 }}>
                        {selectedSector.description}
                      </p>

                      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", fontSize: "10px", fontFamily: "var(--mono)", background: "#000", padding: "10px", border: "1px solid rgba(255,255,255,0.03)", marginTop: "4px" }}>
                        <div>
                          <span style={{ color: "var(--text-muted)" }}>THREAT:</span>
                          <div style={{ color: selectedSector.threatLevel === "Severe" ? "#ff4d4d" : "#f0c929", fontWeight: "bold", marginTop: "2px" }}>
                            {selectedSector.threatLevel.toUpperCase()}
                          </div>
                        </div>
                        <div>
                          <span style={{ color: "var(--text-muted)" }}>ANOMALY:</span>
                          <div style={{ color: "#fff", fontWeight: "bold", marginTop: "2px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                            {profile?.worldState.activeAnomalies[selectedSector.id]?.join(", ") || "None"}
                          </div>
                        </div>
                      </div>

                      {/* Faction standings list */}
                      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                        <span style={{ fontFamily: "var(--mono)", fontSize: "9px", color: "var(--text-muted)" }}>INFLUENCE INDEX:</span>
                        {Object.keys(profile?.worldState.factionInfluence[selectedSector.id] || {}).map((fid) => {
                          const score = profile?.worldState.factionInfluence[selectedSector.id]?.[fid] || 0;
                          const facColor = getFactionColor(fid);
                          const facName = FACTIONS.find(f => f.id === fid)?.name || fid.toUpperCase();
                          return (
                            <div key={fid}>
                              <div style={{ display: "flex", justifyItems: "center", justifyContent: "space-between", fontSize: "9px", fontFamily: "var(--mono)", color: facColor }}>
                                <span>{facName}</span>
                                <span>{score}%</span>
                              </div>
                              <div style={{ width: "100%", height: "3px", background: "rgba(255,255,255,0.03)", overflow: "hidden" }}>
                                <div style={{ width: `${score}%`, height: "100%", background: facColor }} />
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>

                    {/* Missions list section */}
                    <div style={{ flex: 1, overflowY: "auto", margin: "14px 0", borderTop: "1px dashed rgba(255,255,255,0.06)", paddingTop: "12px", display: "flex", flexDirection: "column", gap: "8px" }}>
                      <span style={{ fontFamily: "var(--mono)", fontSize: "9px", color: "var(--text-muted)" }}>OPERATIONS AVAILABLE:</span>
                      {selectedSectorMissions.map((op) => {
                        const isSelected = selectedMapSector === op.id;
                        const isLocked = isMissionLocked(op);
                        const isCompleted = profile?.completedMissions.includes(op.id);

                        return (
                          <div
                            key={op.id}
                            onClick={() => { if (!isLocked) setSelectedMapSector(op.id); }}
                            style={{
                              background: isCompleted ? "rgba(0,255,204,0.01)" : isSelected ? "rgba(255,77,77,0.04)" : "#0c0c0c",
                              border: isSelected ? "1.5px solid var(--accent)" : "1px solid var(--border)",
                              padding: "10px", borderRadius: "2px", cursor: isLocked ? "not-allowed" : "pointer",
                              opacity: isLocked ? 0.35 : 1, transition: "all 0.15s"
                            }}
                          >
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                              <span className={`tag ${op.difficulty === "Easy" ? "tag-green" : op.difficulty === "Normal" ? "tag-yellow" : "tag-red"}`} style={{ fontSize: "7.5px", padding: "1px 4px" }}>
                                {op.difficulty.toUpperCase()}
                              </span>
                              <span style={{ fontFamily: "var(--mono)", fontSize: "7.5px", color: "var(--text-muted)" }}>{op.duration}m</span>
                            </div>
                            <h4 style={{ fontSize: "11.5px", color: "#fff", margin: "4px 0 2px 0", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                              {op.title}
                            </h4>
                            {isLocked && <span style={{ fontFamily: "var(--mono)", fontSize: "8.5px", color: "var(--accent)" }}>GATE: Level {op.unlockRequirements.level || 1}</span>}
                          </div>
                        );
                      })}
                    </div>

                    {selectedOperation && selectedOperation.region === selectedSectorId && (
                      <button
                        onClick={() => { setActiveMission(selectedOperation); setMissionFlow("briefing"); }}
                        className="btn btn-primary"
                        style={{
                          width: "100%", justifyContent: "center", fontSize: "11.5px", padding: "10px", flexShrink: 0,
                          background: selectedOperation.recommendedClass === profile?.class ? "#00ffcc" : "var(--accent)",
                          color: "#000"
                        }}
                      >
                        DEPLOY TO SECTOR 🛰️
                      </button>
                    )}
                  </div>
                ) : (
                  /* DEFAULT STATS BRIEFING COL (when no sector selected) */
                  <div style={{ display: "flex", flexDirection: "column", height: "100%", justifyContent: "space-between" }}>
                    <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                      <span style={{ fontFamily: "var(--mono)", fontSize: "9px", color: "var(--accent)", letterSpacing: "0.2em", fontWeight: "bold" }}>
                        RED QUEEN: OPERATIONS
                      </span>
                      
                      <h3 style={{ fontSize: "16px", color: "#fff", margin: "2px 0 6px 0", letterSpacing: "0.02em", borderBottom: "1px solid rgba(255,255,255,0.06)", paddingBottom: "4px" }}>
                        YOUR DECISIONS CHANGE EVERYTHING.
                      </h3>

                      {/* Small teaser cards from reference image */}
                      <div style={{ display: "flex", flexDirection: "column", gap: "10px", marginTop: "4px" }}>
                        {[
                          { title: "SECURE SECTORS", desc: "Clear threats, stabilize regions and bring hope back to humanity.", icon: "🏢" },
                          { title: "STOP OUTBREAKS", desc: "Contain deadly outbreaks before they spread beyond control.", icon: "☣️" },
                          { title: "DISCOVER ANOMALIES", desc: "Uncover the truth behind anomalies and hidden technologies.", icon: "📡" },
                          { title: "SHAPE THE FUTURE", desc: "Every mission, every choice and every victory moves humanity forward.", icon: "🚀" }
                        ].map((card, idx) => (
                          <div key={idx} style={{ background: "#0c0c0c", border: "1px solid var(--border)", padding: "10px", display: "flex", gap: "10px", alignItems: "center" }}>
                            <span style={{ fontSize: "14px" }}>{card.icon}</span>
                            <div>
                              <h4 style={{ fontFamily: "var(--mono)", fontSize: "10.5px", color: "#fff", margin: 0, fontWeight: "bold" }}>{card.title}</h4>
                              <p style={{ fontSize: "9px", color: "var(--text-muted)", margin: "2.5px 0 0 0", lineHeight: "1.3" }}>{card.desc}</p>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>

                    <div style={{
                      background: "rgba(255, 0, 51, 0.05)", border: "1px solid var(--accent)", padding: "12px",
                      borderRadius: "2px", fontFamily: "var(--mono)", fontSize: "9.5px", color: "var(--accent)",
                      textAlign: "center", lineHeight: "1.4"
                    }} className="animate-flicker">
                      THE WORLD IS NOT STATIC. <br/>IT REACTS. IT ADAPTS. IT REMEMBERS.
                    </div>
                  </div>
                )}
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
                  justifyContent: "center", position: "relative", minHeight: "150px"
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

                {/* Identity Stamps & Reputation stats */}
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  <div style={{ display: "flex", justifyItems: "center", justifyContent: "space-between", borderBottom: "1px dashed rgba(255,255,255,0.05)", paddingBottom: "4px" }}>
                    <span style={{ fontFamily: "var(--mono)", fontSize: "9px", color: "var(--text-dim)" }}>FACTION ALLIANCE:</span>
                    <span style={{ fontFamily: "var(--title-font)", fontSize: "11px", color: getFactionColor(profile?.faction || ""), fontWeight: "bold" }}>
                      {profile?.faction?.toUpperCase()}
                    </span>
                  </div>
                  <div style={{ display: "flex", justifyItems: "center", justifyContent: "space-between", borderBottom: "1px dashed rgba(255,255,255,0.05)", paddingBottom: "4px" }}>
                    <span style={{ fontFamily: "var(--mono)", fontSize: "9px", color: "var(--text-dim)" }}>REPUTATION:</span>
                    <span style={{ fontFamily: "var(--mono)", fontSize: "10.5px", color: "#00ffcc", fontWeight: "bold" }}>
                      {profile?.reputation || 0} pts
                    </span>
                  </div>
                  <div style={{ display: "flex", justifyItems: "center", justifyContent: "space-between" }}>
                    <span style={{ fontFamily: "var(--mono)", fontSize: "9px", color: "var(--text-dim)" }}>DISCOVERIES:</span>
                    <span style={{ fontFamily: "var(--mono)", fontSize: "10.5px", color: "#fff" }}>
                      {profile?.sectorDiscoveries.length} sectors
                    </span>
                  </div>
                </div>
              </div>

              {/* Player stats and Factions standings scroll block */}
              <div className="panel" style={{ border: "1px solid var(--border)", padding: "24px", gridColumn: "span 2", display: "flex", flexDirection: "column", overflow: "hidden", height: "100%" }}>
                <h2 style={{ fontSize: "15px", color: "#fff", marginBottom: "16px", borderBottom: "1px dashed var(--border)", paddingBottom: "8px", flexShrink: 0 }}>
                  OPERATIVE PROGRESSION & STANDING MATRIX
                </h2>
                
                <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "16px" }}>
                  {/* Level & XP */}
                  <div style={{ background: "#080808", border: "1px solid var(--border)", padding: "12px" }}>
                    <div style={{ display: "flex", justifyItems: "center", justifyContent: "space-between", fontFamily: "var(--mono)", fontSize: "11px", marginBottom: "6px" }}>
                      <span>OPERATIVE LEVEL: <span style={{ color: "var(--accent)", fontWeight: "bold" }}>{profile?.level || 1}</span></span>
                      <span>{(profile?.xp || 0) % 100} / 100 XP TO UPGRADE</span>
                    </div>
                    <div style={{ width: "100%", height: "6px", background: "rgba(255,255,255,0.04)", borderRadius: "2px", overflow: "hidden" }}>
                      <div style={{ width: `${(profile?.xp || 0) % 100}%`, height: "100%", background: "var(--accent)" }} />
                    </div>
                  </div>

                  {/* sub-stats progress bars */}
                  <div className="ops-grid-2">
                    {[
                      { label: "THREAT AWARENESS", val: profileStats.threat_awareness },
                      { label: "OPERATIONAL DISCIPLINE", val: profileStats.operational_discipline },
                      { label: "PSYCHOLOGICAL STABILITY", val: profileStats.psychological_stability },
                      { label: "TECHNICAL PREPAREDNESS", val: profileStats.technical_preparedness },
                      { label: "ADAPTABILITY", val: profileStats.adaptability },
                      { label: "RESOURCEFULNESS", val: profileStats.resourcefulness },
                      { label: "SURVEILLANCE RESISTANCE", val: profileStats.surveillance_resistance }
                    ].map((s) => (
                      <div key={s.label} style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                        <div style={{ display: "flex", justifyItems: "center", justifyContent: "space-between", fontFamily: "var(--mono)", fontSize: "10px" }}>
                          <span style={{ color: "#fff", fontWeight: "bold" }}>{s.label}</span>
                          <span style={{ color: "#00ffcc", fontWeight: "bold" }}>{s.val}%</span>
                        </div>
                        <div style={{ width: "100%", height: "4px", background: "rgba(255,255,255,0.02)", borderRadius: "2px", overflow: "hidden" }}>
                          <div style={{ width: `${s.val}%`, height: "100%", background: "#00ffcc" }} />
                        </div>
                      </div>
                    ))}
                  </div>

                  {/* Faction Standings */}
                  <div style={{ borderTop: "1px dashed var(--border)", paddingTop: "14px" }}>
                    <div style={{ fontFamily: "var(--mono)", fontSize: "10px", color: "var(--text-dim)", letterSpacing: "0.15em", marginBottom: "10px" }}>
                      [ DIVISION FACTION TRUST PROFILE ]
                    </div>
                    
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                      {Object.keys(profile?.factionStanding || {}).map((fid) => {
                        const score = profile?.factionStanding?.[fid] || 0;
                        const facName = FACTIONS.find(f => f.id === fid)?.name || fid.toUpperCase();
                        const facColor = getFactionColor(fid);
                        return (
                          <div key={fid} style={{ background: "#080808", border: "1px solid rgba(255,255,255,0.02)", padding: "8px 12px" }}>
                            <div style={{ display: "flex", justifyItems: "center", justifyContent: "space-between", fontFamily: "var(--mono)", fontSize: "9.5px", marginBottom: "4px" }}>
                              <span style={{ color: facColor, fontWeight: "bold" }}>{facName}</span>
                              <span style={{ color: "#fff" }}>{score}/100</span>
                            </div>
                            <div style={{ width: "100%", height: "3px", background: "rgba(255,255,255,0.03)", borderRadius: "1px", overflow: "hidden" }}>
                              <div style={{ width: `${score}%`, height: "100%", background: facColor }} />
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Achievements Grid */}
                  <div style={{ borderTop: "1px dashed var(--border)", paddingTop: "14px" }}>
                    <div style={{ fontFamily: "var(--mono)", fontSize: "10px", color: "var(--text-dim)", letterSpacing: "0.15em", marginBottom: "10px" }}>
                      [ UNLOCKED DECORATIONS / ACHIEVEMENTS ]
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "8px" }}>
                      {[
                        { id: "FIRST_CONTACT", label: "FIRST CONTACT", icon: "⭐", desc: "Initiated satellite handshake logs." },
                        { id: "TACTICIAN", label: "TACTICIAN", icon: "🎯", desc: "Resolved 3 critical tactical nodes." },
                        { id: "SURVIVALIST", label: "SURVIVALIST", icon: "🧬", desc: "Reached clearance level 3." },
                        { id: "DIVISION_VETERAN", label: "VETERAN", icon: "🔥", desc: "Faction trust index exceeds 30." },
                        { id: "CARTOGRAPHER", label: "CARTOGRAPHER", icon: "🗺️", desc: "Mapped discoveries in 4 regions." }
                      ].map((ach) => {
                        const hasIt = profile?.achievements.includes(ach.id);
                        return (
                          <div
                            key={ach.id}
                            style={{
                              background: hasIt ? "rgba(0, 255, 204, 0.04)" : "#0c0c0c",
                              border: hasIt ? "1px solid #00ffcc" : "1px dashed rgba(255,255,255,0.04)",
                              padding: "10px 4px", textAlign: "center", opacity: hasIt ? 1 : 0.35, borderRadius: "2px"
                            }}
                            title={ach.desc}
                          >
                            <span style={{ fontSize: "18px" }}>{ach.icon}</span>
                            <span style={{ display: "block", fontFamily: "var(--mono)", fontSize: "8px", color: hasIt ? "#00ffcc" : "var(--text-muted)", marginTop: "4px" }}>
                              {ach.label}
                            </span>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Skill tree placeholder */}
                  <div style={{ borderTop: "1px dashed var(--border)", paddingTop: "14px" }}>
                    <div style={{ fontFamily: "var(--mono)", fontSize: "10px", color: "var(--text-dim)", letterSpacing: "0.15em", marginBottom: "8px" }}>
                      [ COGNITIVE SKILL TREE UPLINK ]
                    </div>
                    <div style={{ background: "#050505", border: "1px dashed rgba(255,77,77,0.15)", padding: "16px", textAlign: "center" }}>
                      <span style={{ fontFamily: "var(--mono)", fontSize: "10px", color: "var(--accent)", fontWeight: "bold", animation: "blink 2.2s infinite" }}>
                        SKILL TREE CHANNELS ENCRYPTED // AWAITING CLEARED SIGNAL TIER 4
                      </span>
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
                  { slot: "Backpack", icon: "🎒", label: "CARGO BACKPACK" },
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
                              onClick={() => handleUnequip(s.slot)}
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
                          Class Req: {selectedInventoryItem.classRequirement}
                        </span>
                        
                        <div style={{ display: "flex", gap: "8px" }}>
                          {selectedInventoryItem.slot === "Medkit" && selectedInventoryItem.type === "consumable" && (
                            <button
                              onClick={() => handleUseMedkit(selectedInventoryItem)}
                              style={{
                                background: "#00ffcc", color: "#000", border: "none",
                                padding: "4px 12px", fontFamily: "var(--mono)", fontSize: "9.5px",
                                fontWeight: "bold", cursor: "pointer", borderRadius: "2px"
                              }}
                            >
                              [ INJECT STIM (+30 HP) ]
                            </button>
                          )}
                          {selectedInventoryItem.slot !== "None" && selectedInventoryItem.slot !== "Medkit" && (
                            <button
                              onClick={() => handleEquip(selectedInventoryItem)}
                              style={{
                                background: "var(--accent)", color: "#000", border: "none",
                                padding: "4px 12px", fontFamily: "var(--mono)", fontSize: "9.5px",
                                fontWeight: "bold", cursor: "pointer", borderRadius: "2px"
                              }}
                            >
                              [ EQUIP GEAR ]
                            </button>
                          )}
                        </div>
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

      {/* --- IN-GAME OVERLAYS SYSTEM (MULTI-EVENT CAMPAIGN LOOP) --- */}
      
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
            
            <div className="holo-noise" style={{
              height: "140px", width: "100%", background: "#030303", border: "1px dashed rgba(255,255,255,0.15)",
              marginBottom: "24px", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center"
            }}>
              <span style={{ fontFamily: "var(--mono)", fontSize: "12px", color: "var(--accent)", fontWeight: "bold", letterSpacing: "0.15em", display: "block" }}>
                [ SYSTEM COORDINATES LOADED ]
              </span>
              <span style={{ fontFamily: "var(--mono)", fontSize: "9.5px", color: "var(--text-muted)", display: "block", marginTop: "4px" }}>
                DECENTRALIZED WAVE SYNC COMPLETE // {activeMission.events.length} TACTICAL PHALANXES
              </span>
            </div>

            <p style={{ fontSize: "15px", color: "var(--text-dim)", lineHeight: "1.7", marginBottom: "28px" }}>
              {activeMission.description}
            </p>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1fr", gap: "16px", marginBottom: "28px" }}>
              <div style={{ background: "#000", border: "1px solid var(--border)", padding: "16px" }}>
                <span style={{ fontFamily: "var(--mono)", fontSize: "9.5px", color: "var(--text-dim)" }}>SECTOR</span>
                <div style={{ fontFamily: "var(--title-font)", fontSize: "13px", color: "#fff", fontWeight: "bold", marginTop: "4px" }}>
                  {activeMission.region.toUpperCase()}
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
                  {activeMission.duration} MIN
                </div>
              </div>
              <div style={{ background: "#000", border: "1px solid var(--border)", padding: "16px" }}>
                <span style={{ fontFamily: "var(--mono)", fontSize: "9.5px", color: "var(--text-dim)" }}>RECOMMENDED</span>
                <div style={{ fontFamily: "var(--title-font)", fontSize: "13px", color: "#00ffcc", fontWeight: "bold", marginTop: "4px" }}>
                  {activeMission.recommendedClass.toUpperCase()}
                </div>
              </div>
            </div>

            {/* Red Queen AI Briefing Commentary */}
            <div style={{ background: "rgba(255, 0, 51, 0.04)", borderLeft: "4px solid var(--accent)", padding: "20px", marginBottom: "32px" }}>
              <div style={{ fontFamily: "var(--mono)", fontSize: "10px", color: "var(--accent)", letterSpacing: "0.15em", marginBottom: "6px", fontWeight: "bold" }}>
                [ SYSTEM UPLINK COMMENTARY ]
              </div>
              <p style={{ fontFamily: "var(--mono)", fontSize: "13px", fontStyle: "italic", color: "var(--text)", lineHeight: "1.6", margin: 0 }}>
                {activeMission.recommendedClass === profile?.class
                  ? `"Operative configuration matches mission coordinates. Your medic/specialist capabilities yield +15% success probability check. Deploy immediately."`
                  : `"Warning: Active class [${profile?.class?.toUpperCase()}] deviates from recommended profile [${activeMission.recommendedClass.toUpperCase()}]. Proceed with caution."`}
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

      {/* 3. Connection Handshake Overlay */}
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

            <div style={{ display: "flex", justifyItems: "center", gap: "10px", alignItems: "center" }}>
              <span style={{ width: "8px", height: "8px", background: "#00ffcc", borderRadius: "50%" }} className="animate-pulse" />
              <span style={{ fontFamily: "var(--mono)", fontSize: "11px", color: "var(--text-muted)" }}>
                TRANSMISSION COORDINATES RESOLVED. AWAITING DATA INJECTION.
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 4. Multi-Event Tactical Decision Overlay */}
      {activeMission && missionFlow === "decision" && (
        <div style={{
          position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", zIndex: 100000,
          background: "rgba(0, 0, 0, 0.9)", display: "flex", alignItems: "center", justifyContent: "center",
          padding: "24px"
        }}>
          <div className="panel" style={{ maxWidth: "800px", width: "100%", borderColor: "rgba(0, 255, 204, 0.45)", padding: "40px" }}>
            
            <div style={{ borderBottom: "2px solid rgba(0,255,204,0.3)", paddingBottom: "16px", marginBottom: "20px", display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
              <div>
                <span style={{ fontFamily: "var(--mono)", fontSize: "11px", color: "#00ffcc", letterSpacing: "0.25em", fontWeight: "bold" }}>
                  PHALANX EVENT {currentEventIndex + 1} OF {activeMission.events.length}
                </span>
                <h2 style={{ fontSize: "24px", color: "#fff", margin: "6px 0 0 0", letterSpacing: "0.05em" }}>
                  {activeMission.events[currentEventIndex]?.title || "DECISION EVENT"}
                </h2>
              </div>
              <span style={{ fontFamily: "var(--mono)", fontSize: "12px", color: "#ff4d4d", fontWeight: "bold" }}>
                BIO-HEALTH: {profile?.health}% HP
              </span>
            </div>

            <p style={{ fontSize: "15px", color: "var(--text-dim)", lineHeight: "1.7", marginBottom: "24px" }}>
              {activeMission.events[currentEventIndex]?.text}
            </p>

            {/* Event outcome resolution text */}
            {eventResolved && eventOutcomeText && (
              <div style={{
                background: "rgba(0,0,0,0.6)", border: "1px dashed rgba(0,255,204,0.3)", padding: "16px",
                marginBottom: "24px", fontFamily: "var(--mono)", fontSize: "13px", color: eventOutcomeText.includes("[SUCCESS]") ? "#00ffcc" : "#ff4d4d"
              }} className="animate-flicker">
                {eventOutcomeText}
              </div>
            )}

            <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              {!eventResolved ? (
                activeMission.events[currentEventIndex]?.options.map((opt) => {
                  const isRecommended = opt.class_bonus?.classId === profile?.class;
                  return (
                    <button
                      key={opt.id}
                      onClick={() => handleSelectOption(opt)}
                      style={{
                        width: "100%", padding: "16px 20px", background: "#080808",
                        border: isRecommended ? "2px dashed rgba(0,255,204,0.5)" : "1px solid var(--border)",
                        borderRadius: "2px", cursor: "pointer", textAlign: "left", transition: "all 0.18s",
                        display: "flex", flexDirection: "column", gap: "6px"
                      }}
                    >
                      <div style={{ display: "flex", justifyItems: "center", justifyContent: "space-between", width: "100%", alignItems: "center" }}>
                        <span style={{ fontFamily: "var(--title-font)", fontSize: "14.5px", color: "#fff", fontWeight: "bold" }}>
                          {opt.text}
                        </span>
                        {isRecommended && (
                          <span style={{ fontFamily: "var(--mono)", fontSize: "9px", color: "#00ffcc", background: "rgba(0,255,204,0.06)", border: "1px solid rgba(0,255,204,0.3)", padding: "2px 8px" }}>
                            CLASS BONUS (+15% SUCCESS)
                          </span>
                        )}
                      </div>
                    </button>
                  );
                })
              ) : (
                <button
                  onClick={handleNextEvent}
                  className="btn btn-primary"
                  style={{ width: "100%", justifyContent: "center", padding: "14px" }}
                >
                  PROCEED TO NEXT PHALANX CONDUIT →
                </button>
              )}
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
            borderColor: (missionOutcome === "SUCCESS" || missionOutcome === "PARTIAL") ? "rgba(0, 255, 204, 0.45)" : "rgba(255, 77, 77, 0.45)"
          }}>
            
            <div style={{ textAlign: "center", marginBottom: "32px", borderBottom: "1px solid var(--border)", paddingBottom: "24px" }}>
              <div className={`tag ${(missionOutcome === "SUCCESS" || missionOutcome === "PARTIAL") ? "tag-green" : "tag-red"}`} style={{ fontSize: "12px", padding: "6px 20px", marginBottom: "12px", letterSpacing: "0.1em" }}>
                {missionOutcome === "SUCCESS" ? "OPERATION SUCCESSFUL" : missionOutcome === "PARTIAL" ? "PARTIAL SUCCESS" : "OPERATION COMPROMISED"}
              </div>
              <h2 style={{ fontSize: "24px", color: "#fff", letterSpacing: "0.05em" }}>
                {(missionOutcome === "SUCCESS" || missionOutcome === "PARTIAL") ? "TACTICAL OBJECTIVE SECURED" : "GRID CONDUIT TRACE DETECTED"}
              </h2>
            </div>

            <div style={{ background: "rgba(255, 255, 255, 0.02)", borderLeft: `4px solid ${(missionOutcome === "SUCCESS" || missionOutcome === "PARTIAL") ? "#00ffcc" : "var(--accent)"}`, padding: "20px", borderRadius: "2px", marginBottom: "32px" }}>
              <p style={{ fontFamily: "var(--mono)", fontSize: "13px", color: "var(--text-dim)", fontStyle: "italic", whiteSpace: "pre-line", margin: 0, lineHeight: "1.6" }} className="animate-flicker">
                {outcomeCommentary}
              </p>
            </div>

            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <button
                onClick={() => setMissionFlow("rewards")}
                className="btn btn-primary"
                style={{ padding: "12px 32px", marginLeft: "auto" }}
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

            {/* Campaign world shifts notices */}
            {worldEventsMessage && (
              <div style={{
                background: "rgba(0, 255, 204, 0.05)", border: "1px solid #00ffcc", padding: "12px",
                marginBottom: "20px", fontFamily: "var(--mono)", fontSize: "11px", color: "#00ffcc", textAlign: "center"
              }}>
                {worldEventsMessage}
              </div>
            )}

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "32px" }} className="ops-grid-2">
              <div style={{ background: "#000", padding: "20px", border: "1px solid var(--border)", textAlign: "center" }}>
                <span style={{ fontFamily: "var(--mono)", fontSize: "9.5px", color: "var(--text-dim)", display: "block" }}>OPERATIVE EXPERIENCE</span>
                <span style={{ fontFamily: "var(--title-font)", fontSize: "20px", color: "#00ffcc", fontWeight: "bold", display: "block", marginTop: "6px" }}>
                  +{cumulativeRewards.xp || 0} XP
                </span>
              </div>
              <div style={{ background: "#000", padding: "20px", border: "1px solid var(--border)", textAlign: "center" }}>
                <span style={{ fontFamily: "var(--mono)", fontSize: "9.5px", color: "var(--text-dim)", display: "block" }}>CREDITS VALUE</span>
                <span style={{ fontFamily: "var(--title-font)", fontSize: "20px", color: "#00ffcc", fontWeight: "bold", display: "block", marginTop: "6px" }}>
                  +{cumulativeRewards.credits || 0} CR
                </span>
              </div>

              {Object.keys(cumulativeRewards.resources).length > 0 && (
                <div style={{ background: "#000", padding: "20px", border: "1px solid var(--border)", textAlign: "center", gridColumn: "span 2" }}>
                  <span style={{ fontFamily: "var(--mono)", fontSize: "9.5px", color: "var(--text-dim)", display: "block" }}>RAW MATERIAL RECOVERED</span>
                  {Object.keys(cumulativeRewards.resources).map(rk => (
                    <span key={rk} style={{ fontFamily: "var(--mono)", fontSize: "14px", color: "#fff", fontWeight: "bold", display: "block", marginTop: "4px" }}>
                      +{cumulativeRewards.resources[rk]} UNITS OF {rk.toUpperCase()}
                    </span>
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
                CLAIM RECOVERY CONTRACT & UPLINK TO MAP
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
