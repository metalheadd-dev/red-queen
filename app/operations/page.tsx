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
  DEFAULT_WORLD_STATE,
  DEFAULT_CAMPAIGN_STATS,
  generateAICommentary
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

  // Helper to map sector name to its ID
  const getSectorIdByName = (name: string) => {
    if (!name) return null;
    const lower = name.toLowerCase();
    if (lower.includes("alpha")) return "sec-alpha";
    if (lower.includes("beta")) return "sec-beta";
    if (lower.includes("delta")) return "sec-delta";
    if (lower.includes("epsilon")) return "sec-epsilon";
    if (lower.includes("zeta")) return "sec-zeta";
    if (lower.includes("gamma")) return "sec-gamma";
    if (lower.includes("omega")) return "sec-omega";
    return null;
  };

  // Helper to parse and check faction clearance standing
  const checkFactionClearance = (factionStr: string) => {
    if (!profile) return { met: false, current: 0, required: 0, factionName: "Unknown" };
    const lower = factionStr.toLowerCase();
    let factionId = "citadel"; // default fallback
    let fName = "CITADEL";
    if (lower.includes("vanguard")) { factionId = "vanguard"; fName = "VANGUARD"; }
    else if (lower.includes("helix")) { factionId = "helix"; fName = "HELIX"; }
    else if (lower.includes("nomads")) { factionId = "nomads"; fName = "NOMADS"; }
    else if (lower.includes("eclipse")) { factionId = "eclipse"; fName = "ECLIPSE"; }
    else if (lower.includes("ghost")) { factionId = "ghost"; fName = "GHOST DIVISION"; }
    else if (lower.includes("aegis")) { factionId = "aegis"; fName = "AEGIS"; }
    else if (lower.includes("horizon")) { factionId = "horizon"; fName = "HORIZON"; }

    const match = factionStr.match(/\d+/);
    const reqStanding = match ? parseInt(match[0]) : 30;
    const currentStanding = profile.factionStanding?.[factionId] || 0;
    return {
      met: currentStanding >= reqStanding,
      current: currentStanding,
      required: reqStanding,
      factionName: fName,
    };
  };
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

  // Playtime tracker — persists every 60 seconds while profile is active
  useEffect(() => {
    if (!profile) return;
    const identifier = authIdentifier || (publicKey ? publicKey.toString() : "offline-operative");
    const interval = setInterval(() => {
      setProfile(prev => {
        if (!prev) return null;
        const updated = { ...prev, totalPlaytimeSeconds: (prev.totalPlaytimeSeconds || 0) + 60 };
        saveProfile(identifier, updated);
        return updated;
      });
    }, 60000);
    return () => clearInterval(interval);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [!!profile, authIdentifier]);

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
      worldState: { ...DEFAULT_WORLD_STATE },
      campaignStats: { ...DEFAULT_CAMPAIGN_STATS },
      operationsArchive: [],
      totalPlaytimeSeconds: 0,
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

    // Check active events in region for success chance or reward multipliers
    const activeEvents = profile.worldState?.activeEvents || [];
    const regionalEvent = activeEvents.find(evt => evt.region === activeMission.region);
    
    let eventSuccessModifier = 0;
    let resourceMultiplier = 1;

    if (regionalEvent) {
      if (regionalEvent.type === "Outbreak") {
        eventSuccessModifier = -15; // 15% penalty to survival chance during an Outbreak
      } else if (regionalEvent.type === "Supply Drop") {
        resourceMultiplier = 2; // Double resource rewards on Supply Drop
      }
    }
    
    const finalChance = Math.max(10, Math.min(95, baseProb + matchingBonus + eventSuccessModifier));
    const roll = Math.floor(Math.random() * 100) + 1;
    const success = roll <= finalChance;
    
    const reward = choice.effects;

    // Accumulate results
    setCumulativeRewards(prev => {
      const nextResources = { ...prev.resources };
      if (reward.resource) {
        const qty = (reward.resourceQty || 1) * resourceMultiplier;
        nextResources[reward.resource] = (nextResources[reward.resource] || 0) + (success ? qty : 0);
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

    const eventsCompleted = Math.min(currentEventIndex + 1, activeMission.events?.length || 1);
    const eventsTotal = activeMission.events?.length || 1;
    const { updatedProfile, levelUpMessage: lvlMsg, worldEventsMessage: wldMsg } = claimMissionRewards(
      profile,
      activeMission,
      missionOutcome || "SUCCESS",
      cumulativeRewards,
      unlocksSector,
      eventsCompleted,
      eventsTotal
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

  // Check if item meets class and faction reputation requirements
  const canEquipItem = (item: InventoryItem) => {
    if (!profile) return { can: false, reason: "No profile loaded" };
    
    // Class check
    if (item.classRequirement !== "None" && item.classRequirement !== profile.class) {
      return { can: false, reason: `Requires Class: ${item.classRequirement}` };
    }

    // Faction standing check
    if (item.factionRequirement) {
      const standing = profile.factionStanding?.[item.factionRequirement] || 0;
      const reqStanding = item.factionStandingRequirement || 0;
      if (standing < reqStanding) {
        return { 
          can: false, 
          reason: `Requires ${item.factionRequirement.toUpperCase()} standing of ${reqStanding} (Current: ${standing})` 
        };
      }
    }

    return { can: true };
  };

  // Swapping inventory slots
  const handleEquip = (item: InventoryItem) => {
    if (!profile) return;
    const identifier = authIdentifier || (publicKey ? publicKey.toString() : "offline-operative");
    
    const check = canEquipItem(item);
    if (!check.can) {
      alert(`EQUIP ERROR: ${check.reason}`);
      return;
    }
    
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

  const totalDeployments = profile?.missionHistory?.length || 0;
  const successfulDeployments = profile?.missionHistory?.filter(h => h.outcome === "SUCCESS").length || 0;
  const successRate = totalDeployments > 0 ? Math.round((successfulDeployments / totalDeployments) * 100) : 0;
  
  let currentStreak = 0;
  if (profile?.missionHistory) {
    for (let i = 0; i < profile.missionHistory.length; i++) {
      if (profile.missionHistory[i].outcome === "SUCCESS") {
        currentStreak++;
      } else {
        break;
      }
    }
  }
  const longestStreak = profile?.worldState?.longestStreak || 0;

  // Sector and Operations locks resolution
  const isMissionLocked = (mission: Mission) => {
    if (!profile) return true;
    
    const reqs = mission.unlockRequirements;
    if (reqs.level && profile.level < reqs.level) return true;
    if (reqs.bioScore && currentBioScore < reqs.bioScore) return true;
    if (reqs.completedMissionId && !profile.completedMissions.includes(reqs.completedMissionId)) return true;
    
    return false;
  };

  const getSurvivalChance = (mission: Mission) => {
    if (!profile) return 0;
    
    // Base survival chance based on difficulty
    let base = 50;
    if (mission.difficulty === "Easy") base = 70;
    else if (mission.difficulty === "Normal") base = 55;
    else if (mission.difficulty === "Hard") base = 40;

    // 1. Recommended Class Match (+15%)
    const classBonus = profile.class === mission.recommendedClass ? 15 : 0;

    // 2. Faction Standing Match (+15% max)
    const factionId = mission.recommendedFaction || profile.faction;
    const factionStandingValue = profile.factionStanding?.[factionId] || 0;
    const factionBonus = Math.floor(15 * (factionStandingValue / 100));

    // 3. Level Difference
    const recLevel = mission.unlockRequirements?.level || 1;
    const levelDiff = profile.level - recLevel;
    const levelBonus = levelDiff >= 0 
      ? Math.min(10, levelDiff * 2) 
      : Math.max(-25, levelDiff * 5);

    // 4. Recommended Gear Match (+15%)
    let gearMatch = false;
    if (mission.recommendedEquipment) {
      const reqTerms = mission.recommendedEquipment.toLowerCase().split(/[\s,]+/);
      Object.values(equippedGear || {}).forEach(item => {
        if (item && item.name) {
          const itemNameLower = item.name.toLowerCase();
          if (reqTerms.some(term => term.length > 2 && itemNameLower.includes(term))) {
            gearMatch = true;
          }
        }
      });
    }
    const gearBonus = gearMatch ? 15 : 0;

    // Calculate final probability, clamped between 5% and 99%
    const total = base + classBonus + factionBonus + levelBonus + gearBonus;
    return Math.max(5, Math.min(99, total));
  };

  const getSectorCompletion = (sectorId: string) => {
    if (!profile) return 0;
    return profile.worldState?.sectorStates?.[sectorId]?.completion ?? 0;
  };

  const getSectorStatus = (sector: Sector): "LOCKED" | "AVAILABLE" | "IN_PROGRESS" | "SECURED" | "DANGEROUS" | "CRITICAL" | "SAFE" | "ACTIVE" | "INFECTED" => {
    if (!profile) return "LOCKED";
    const state = profile.worldState?.sectorStates?.[sector.id];
    if (!state) {
      return sector.id === "sec-alpha" ? "AVAILABLE" : "LOCKED";
    }
    if (!state.isUnlocked) return "LOCKED";
    return state.status;
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
        alignItems: "center", justifyContent: "flex-start", overflowY: "auto", padding: "20px 24px"
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
          display: "flex", flexDirection: "column", marginTop: "auto", marginBottom: "auto"
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
          {activeTab === "center" && (
            <div style={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
              
              {/* TOP SECTION: EVOLVING WORLD MAP WITH SVG SHAPES */}
              <div className="panel holo-noise animate-pulse-slow" style={{
                position: "relative", padding: "12px", height: "55%", minHeight: "300px", background: "#050505",
                border: "2px solid rgba(255, 77, 77, 0.3)", boxShadow: "0 0 30px rgba(0, 0, 0, 0.9)",
                display: "flex", flexDirection: "column", justifyItems: "center", justifyContent: "space-between",
                marginBottom: "16px", flexShrink: 0
              }}>
                <div style={{ position: "absolute", top: "10px", left: "10px", width: "14px", height: "14px", borderTop: "2px solid var(--accent)", borderLeft: "2px solid var(--accent)" }} />
                <div style={{ position: "absolute", top: "10px", right: "10px", width: "14px", height: "14px", borderTop: "2px solid var(--accent)", borderRight: "2px solid var(--accent)" }} />
                <div style={{ position: "absolute", bottom: "10px", left: "10px", width: "14px", height: "14px", borderBottom: "2px solid var(--accent)", borderLeft: "2px solid var(--accent)" }} />
                <div style={{ position: "absolute", bottom: "10px", right: "10px", width: "14px", height: "14px", borderBottom: "2px solid var(--accent)", borderRight: "2px solid var(--accent)" }} />

                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", zIndex: 1, borderBottom: "1px dashed rgba(255,255,255,0.06)", paddingBottom: "6px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ width: "6px", height: "6px", background: "#ff4d4d", borderRadius: "50%" }} className="animate-pulse" />
                    <span style={{ fontFamily: "var(--mono)", fontSize: "10px", color: "var(--accent)", letterSpacing: "0.2em", fontWeight: "bold" }}>
                      CAMPAIGN WORLD MAP OVERVIEW
                    </span>
                  </div>
                  <span style={{ fontFamily: "var(--mono)", fontSize: "9px", color: "var(--text-muted)" }}>
                    GRID SWEEPS: CONTINUOUS // SELECT SECTOR TO VIEW INTEL
                  </span>
                </div>

                <div style={{ flex: 1, position: "relative", margin: "6px 0", background: "rgba(0,0,0,0.6)", overflow: "hidden" }}>
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
                      <style>{`
                        @keyframes pulse-warning {
                          0% { opacity: 0.45; }
                          50% { opacity: 1; }
                          100% { opacity: 0.45; }
                        }
                        .pulsing-alert {
                          animation: pulse-warning 1.4s infinite ease-in-out;
                        }
                      `}</style>
                      <pattern id="map-grid-2" width="20" height="20" patternUnits="userSpaceOnUse">
                        <path d="M 20 0 L 0 0 0 20" fill="none" stroke="rgba(255,255,255,0.015)" strokeWidth="0.5"/>
                      </pattern>
                    </defs>
                    <rect width="100%" height="100%" fill="url(#map-grid-2)" />

                    {/* Radar sweeps */}
                    <circle cx="500" cy="300" r="100" fill="none" stroke="rgba(255, 77, 77, 0.02)" strokeWidth="0.5" />
                    <circle cx="500" cy="300" r="220" fill="none" stroke="rgba(255, 77, 77, 0.01)" strokeWidth="0.5" />
                    
                    {/* Scanning radar sweep lines */}
                    <line className="map-scope-circle" x1="500" y1="300" x2="950" y2="300" stroke="rgba(255, 77, 77, 0.04)" strokeWidth="0.5" />

                    {/* Operational Sector links */}
                    {SECTOR_CONNECTIONS.map((conn, idx) => {
                      const fromUnlocked = profile?.worldState?.sectorStates?.[conn.from]
                        ? profile.worldState.sectorStates[conn.from].isUnlocked
                        : (profile?.worldState?.unlockedSectors?.includes(conn.from) || conn.from === "sec-alpha");
                      const toUnlocked = profile?.worldState?.sectorStates?.[conn.to]
                        ? profile.worldState.sectorStates[conn.to].isUnlocked
                        : (profile?.worldState?.unlockedSectors?.includes(conn.to) || conn.to === "sec-alpha");
                      const isLineActive = fromUnlocked && toUnlocked;
                      return (
                        <line
                          key={idx}
                          x1={conn.x1} y1={conn.y1} x2={conn.x2} y2={conn.y2}
                          stroke={isLineActive ? "rgba(0, 255, 204, 0.25)" : "rgba(255, 255, 255, 0.05)"}
                          strokeWidth={isLineActive ? "2" : "1"}
                          strokeDasharray="4,4"
                        />
                      );
                    })}

                    {/* Interactive SVG outline polygons representing territories */}
                    {sectors.map((sec) => {
                      const isUnlocked = profile?.worldState?.sectorStates?.[sec.id]
                        ? profile.worldState.sectorStates[sec.id].isUnlocked
                        : (profile?.worldState?.unlockedSectors?.includes(sec.id) || sec.id === "sec-alpha");
                      const isSelected = selectedSectorId === sec.id;
                      const status = getSectorStatus(sec);
                      const completion = getSectorCompletion(sec.id);
                      const ownership = profile?.worldState?.sectorStates?.[sec.id]?.ownership || "Neutral";
                      const activeEvent = profile?.worldState?.activeEvents?.find(evt => evt.region === sec.id);

                      const colorMap = {
                        LOCKED: "rgba(60,60,60,0.15)",
                        AVAILABLE: "rgba(240, 201, 41, 0.04)",
                        IN_PROGRESS: "rgba(0, 255, 204, 0.04)",
                        SECURED: "rgba(0, 255, 204, 0.08)",
                        DANGEROUS: "rgba(255, 77, 77, 0.06)",
                        CRITICAL: "rgba(255, 77, 77, 0.12)",
                        SAFE: "rgba(0, 255, 204, 0.08)",
                        ACTIVE: "rgba(240, 201, 41, 0.04)",
                        INFECTED: "rgba(255, 77, 77, 0.15)"
                      };
                      const strokeColor = 
                        !isUnlocked ? "#333333" :
                        (status === "SECURED" || status === "SAFE") ? "#00ffcc" :
                        (status === "DANGEROUS" || status === "CRITICAL" || status === "INFECTED") ? "#ff4d4d" : "#f0c929";

                      return (
                        <g key={sec.id}>
                          <polygon
                            points={sec.points}
                            fill={isSelected ? "rgba(255, 77, 77, 0.15)" : colorMap[status] || "none"}
                            stroke={isSelected ? "var(--accent)" : strokeColor}
                            strokeWidth={isSelected ? "2.5" : "1.5"}
                            style={{ cursor: "pointer", transition: "all 0.18s" }}
                            onClick={() => {
                              setSelectedSectorId(sec.id);
                              if (isUnlocked) {
                                const sectorMissions = missions.filter(m => m.region === sec.id);
                                const firstAvail = sectorMissions.find(m => !isMissionLocked(m) && !profile?.completedMissions.includes(m.id)) || sectorMissions[0];
                                if (firstAvail) setSelectedMapSector(firstAvail.id);
                              }
                            }}
                          />
                          
                          {/* Pulsing Warning caution icon overlay for sectors experiencing active events */}
                          {isUnlocked && activeEvent && (
                            <g className="pulsing-alert" pointerEvents="all">
                              <text
                                x={sec.labelX}
                                y={sec.labelY - 14}
                                fill="#ff4d4d"
                                fontSize="14px"
                                textAnchor="middle"
                                style={{ cursor: "help" }}
                              >
                                ⚠️
                                <title>{`[ACTIVE EVENT] ${activeEvent.title}\n${activeEvent.description}`}</title>
                              </text>
                            </g>
                          )}

                          <text
                            x={sec.labelX}
                            y={sec.labelY}
                            fill={isSelected ? "#fff" : "rgba(255,255,255,0.7)"}
                            fontSize="11px"
                            fontWeight="bold"
                            fontFamily="var(--mono)"
                            textAnchor="middle"
                            pointerEvents="none"
                          >
                            {sec.name}
                          </text>
                          <text
                            x={sec.labelX}
                            y={sec.labelY + 12}
                            fill={strokeColor}
                            fontSize="8.5px"
                            fontFamily="var(--mono)"
                            textAnchor="middle"
                            pointerEvents="none"
                          >
                            {!isUnlocked ? "LOCKED 🔒" : `${completion}% SECURED`}
                          </text>

                          {/* Faction Ownership Text Overlay */}
                          {isUnlocked && (
                            <text
                              x={sec.labelX}
                              y={sec.labelY + 22}
                              fill="rgba(255, 255, 255, 0.4)"
                              fontSize="7px"
                              fontFamily="var(--mono)"
                              textAnchor="middle"
                              pointerEvents="none"
                            >
                              {ownership.toUpperCase()}
                            </text>
                          )}
                        </g>
                      );
                    })}
                  </svg>
                </div>

                <div style={{ display: "flex", justifyContent: "space-between", zIndex: 1, fontFamily: "var(--mono)", fontSize: "9.5px", color: "var(--text-muted)", borderTop: "1px dashed rgba(255,255,255,0.06)", paddingTop: "6px" }}>
                  <span>ACTIVE SECTORS: {sectors.filter(s => profile?.worldState.unlockedSectors.includes(s.id) || s.id === "sec-alpha").length} ONLINE</span>
                  <span>CAMPAIGN PROGRESS INTEGRATION LOGS [ENGAGED]</span>
                </div>
              </div>

              {/* BOTTOM SECTION: 3-COLUMN CONTROL DECK WITH SECTOR OVERVIEW */}
              <div style={{ flex: 1, display: "grid", gridTemplateColumns: "1fr 1.3fr 1.3fr", gap: "16px", overflow: "hidden", minHeight: "180px" }}>
                
                {/* Col 1: Hologram Console & Global alerts */}
                <div className="panel" style={{
                  background: "#080808", border: "1px solid rgba(255, 77, 77, 0.25)",
                  position: "relative", padding: "12px", display: "flex", flexDirection: "column", gap: "8px",
                  overflow: "hidden"
                }}>
                  <span style={{ fontFamily: "var(--mono)", fontSize: "9px", color: "var(--accent)", letterSpacing: "0.15em", fontWeight: "bold" }}>
                    [ RED QUEEN AI DISPATCH SYSTEM ]
                  </span>
                  
                  <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                    <div className="holo-noise animate-flicker" style={{
                      height: "64px", width: "64px", background: "rgba(0,0,0,0.6)",
                      border: "1px dashed rgba(255, 77, 77, 0.2)", display: "flex",
                      alignItems: "center", justifyContent: "center", flexShrink: 0
                    }}>
                      <span style={{ fontFamily: "var(--mono)", fontSize: "8px", color: "var(--accent)", fontWeight: "bold" }}>
                        [ CORE ]
                      </span>
                    </div>

                    <div style={{ flex: 1 }}>
                      <span style={{ fontFamily: "var(--mono)", fontSize: "8px", color: "var(--text-muted)", display: "block" }}>
                        CAMPAIGN STATUS BRIEFING
                      </span>
                      <p style={{ fontFamily: "var(--mono)", fontSize: "10.5px", color: "#00ffcc", lineHeight: "1.3", margin: "2px 0 0 0" }}>
                        "Sectors outline mapped. Deploy stim-packs in inventory if health falls to critical levels."
                      </p>
                    </div>
                  </div>

                  {/* Scrollable diagnostic log terminal */}
                  <div style={{
                    flex: 1, background: "#040404", border: "1px solid #141414", padding: "8px",
                    fontFamily: "var(--mono)", fontSize: "9px", color: "#666", overflowY: "auto",
                    display: "flex", flexDirection: "column", gap: "4px"
                  }}>
                    {profile?.worldState.globalAlerts.map((log, idx) => (
                      <div key={idx} style={{ color: "#ff4d4d" }}>▶ {log}</div>
                    ))}
                    {aiLogs.map((log, idx) => (
                      <div key={`ai-${idx}`} style={{ color: log.includes("[WARN]") ? "#ff4d4d" : log.includes("[SYS]") ? "#00ffcc" : "#666" }}>{log}</div>
                    ))}
                    <div ref={aiLogsEndRef} />
                  </div>
                </div>

                {/* Col 2: Sector Overview panel (intelligence profile) */}
                <div className="panel" style={{
                  background: "#080808", border: "1px solid var(--border)",
                  padding: "14px", display: "flex", flexDirection: "column", gap: "10px", overflow: "hidden"
                }}>
                  {selectedSector ? (() => {
                    const sectorIsLocked = getSectorStatus(selectedSector) === "LOCKED";
                    const sectorState = profile?.worldState?.sectorStates?.[selectedSector.id];

                    if (sectorIsLocked) {
                      return (
                        <div style={{ display: "flex", flexDirection: "column", height: "100%", gap: "8px" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <span style={{ fontFamily: "var(--mono)", fontSize: "9px", color: "var(--text-dim)", letterSpacing: "0.15em", fontWeight: "bold" }}>
                              [ SECTOR INTEL OVERVIEW ]
                            </span>
                            <span className="tag tag-red" style={{ fontSize: "8px", padding: "2px 6px" }}>LOCKED 🔒</span>
                          </div>

                          <h3 style={{ fontSize: "16px", color: "rgba(255,255,255,0.4)", margin: "2px 0 4px 0", borderBottom: "1px solid rgba(255,255,255,0.06)", paddingBottom: "4px" }}>
                            {selectedSector.name}
                          </h3>

                          <p style={{ fontSize: "10px", color: "var(--text-muted)", lineHeight: "1.4", margin: 0 }}>
                            {selectedSector.description}
                          </p>

                          <div style={{ background: "rgba(255, 77, 77, 0.02)", border: "1px solid rgba(255, 77, 77, 0.15)", padding: "12px", marginTop: "8px", borderRadius: "3px" }}>
                            <style>{`
                              @keyframes lock-pulse {
                                0% { transform: scale(1); filter: drop-shadow(0 0 3px rgba(255, 77, 77, 0.4)); }
                                50% { transform: scale(1.05); filter: drop-shadow(0 0 10px rgba(255, 77, 77, 0.7)); }
                                100% { transform: scale(1); filter: drop-shadow(0 0 3px rgba(255, 77, 77, 0.4)); }
                              }
                            `}</style>
                            
                            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="#ff4d4d" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" style={{ margin: "8px auto 16px auto", display: "block", animation: "lock-pulse 2.5s infinite ease-in-out" }}>
                              <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                              <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                              <circle cx="12" cy="16" r="1.5" />
                            </svg>

                            <div style={{ fontFamily: "var(--mono)", fontSize: "9.5px", color: "#ff4d4d", fontWeight: "bold", marginBottom: "10px", letterSpacing: "0.1em", textAlign: "center" }}>
                              [ SECURITY ACCESS BLOCKED ]
                            </div>
                            
                            <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                              {sectorState?.unlockRequiredSector && (() => {
                                const reqSectorId = getSectorIdByName(sectorState.unlockRequiredSector);
                                const reqSecState = profile?.worldState?.sectorStates?.[reqSectorId || ""];
                                const met = reqSecState?.status === "SECURED";
                                return (
                                  <div style={{ display: "flex", justifyContent: "space-between", fontFamily: "var(--mono)", fontSize: "9px", borderBottom: "1px solid rgba(255,255,255,0.04)", paddingBottom: "6px" }}>
                                    <span style={{ color: "var(--text-muted)" }}>SECURE PRE-REQ:</span>
                                    <span 
                                      style={{ 
                                        color: met ? "#00ffcc" : "#f0c929", 
                                        fontWeight: "bold", 
                                        textDecoration: reqSectorId ? "underline" : "none", 
                                        cursor: reqSectorId ? "pointer" : "default" 
                                      }}
                                      title={reqSectorId ? "Click to view sector details" : ""}
                                      onClick={() => {
                                        if (reqSectorId) setSelectedSectorId(reqSectorId);
                                      }}
                                    >
                                      {sectorState.unlockRequiredSector} {reqSectorId && "🔍"} {met ? "✓ SECURED" : "✗ INCOMPLETE"}
                                    </span>
                                  </div>
                                );
                              })()}
                              {sectorState?.unlockRequiredLevel && (
                                <div style={{ display: "flex", justifyContent: "space-between", fontFamily: "var(--mono)", fontSize: "9px", borderBottom: "1px solid rgba(255,255,255,0.04)", paddingBottom: "6px" }}>
                                  <span style={{ color: "var(--text-muted)" }}>MIN LEVEL:</span>
                                  <span style={{ color: (profile?.level || 1) >= sectorState.unlockRequiredLevel ? "#00ffcc" : "#ff4d4d", fontWeight: "bold" }}>
                                    Lvl {sectorState.unlockRequiredLevel}{" "}
                                    {(profile?.level || 1) >= sectorState.unlockRequiredLevel ? "✓ MET" : `✗ UNMET (Yours: ${profile?.level || 1})`}
                                  </span>
                                </div>
                              )}
                              {sectorState?.unlockRequiredBioScore && (
                                <div style={{ display: "flex", justifyContent: "space-between", fontFamily: "var(--mono)", fontSize: "9px", borderBottom: "1px solid rgba(255,255,255,0.04)", paddingBottom: "6px" }}>
                                  <span style={{ color: "var(--text-muted)" }}>MIN BIO-SCORE:</span>
                                  <span style={{ color: currentBioScore >= sectorState.unlockRequiredBioScore ? "#00ffcc" : "#ff4d4d", fontWeight: "bold" }}>
                                    {sectorState.unlockRequiredBioScore}{" "}
                                    {currentBioScore >= sectorState.unlockRequiredBioScore ? "✓ MET" : `✗ UNMET (Yours: ${currentBioScore})`}
                                  </span>
                                </div>
                              )}
                              {sectorState?.unlockRequiredFaction && (() => {
                                const clearance = checkFactionClearance(sectorState.unlockRequiredFaction);
                                return (
                                  <div style={{ display: "flex", justifyContent: "space-between", fontFamily: "var(--mono)", fontSize: "9px" }}>
                                    <span style={{ color: "var(--text-muted)" }}>CLEARANCE:</span>
                                    <span style={{ color: clearance.met ? "#00ffcc" : "#ff4d4d", fontWeight: "bold" }}>
                                      {clearance.factionName} ({clearance.required}){" "}
                                      {clearance.met ? "✓ MET" : `✗ UNMET (Yours: ${clearance.current})`}
                                    </span>
                                  </div>
                                );
                              })()}
                              {!sectorState?.unlockRequiredSector && !sectorState?.unlockRequiredLevel && !sectorState?.unlockRequiredBioScore && !sectorState?.unlockRequiredFaction && (
                                <span style={{ fontFamily: "var(--mono)", fontSize: "9px", color: "var(--text-muted)", textAlign: "center", display: "block" }}>
                                  Complete regional campaign milestones to authorize access.
                                </span>
                              )}
                            </div>
                          </div>

                          <div style={{ marginTop: "auto", fontFamily: "var(--mono)", fontSize: "8.5px", color: "var(--text-muted)", borderTop: "1px solid rgba(255,255,255,0.04)", paddingTop: "6px" }}>
                            THREAT CLASS: <span style={{ color: "#ff4d4d", fontWeight: "bold" }}>{selectedSector.threatLevel.toUpperCase()}</span>
                            {" // "}<span>RESOURCES: {selectedSector.availableResources.join(", ")}</span>
                          </div>
                        </div>
                      );
                    }

                    return (
                      <div style={{ display: "flex", flexDirection: "column", height: "100%", justifyContent: "space-between" }}>
                        
                        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <span style={{ fontFamily: "var(--mono)", fontSize: "9px", color: "var(--text-dim)", letterSpacing: "0.15em", fontWeight: "bold" }}>
                              [ SECTOR INTEL OVERVIEW ]
                            </span>
                            <span className={`tag ${getSectorStatus(selectedSector) === "SECURED" ? "tag-green" : "tag-red"}`} style={{ fontSize: "8px", padding: "2px 6px" }}>
                              {getSectorStatus(selectedSector).toUpperCase()}
                            </span>
                          </div>

                          <h3 style={{ fontSize: "16px", color: "#fff", margin: "2px 0 4px 0", borderBottom: "1px solid rgba(255,255,255,0.06)", paddingBottom: "4px" }}>
                            {selectedSector.name}
                          </h3>

                          <p style={{ fontSize: "10.5px", color: "var(--text-dim)", lineHeight: "1.4", margin: 0, height: "45px", overflowY: "auto" }}>
                            {selectedSector.description}
                          </p>

                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", fontSize: "9.5px", fontFamily: "var(--mono)", background: "#0c0c0c", padding: "8px", border: "1px solid rgba(255,255,255,0.03)" }}>
                            <div>
                              <span style={{ color: "var(--text-muted)" }}>THREAT RATIO:</span>
                              <div style={{ color: selectedSector.threatLevel === "Severe" ? "#ff4d4d" : "#f0c929", fontWeight: "bold", marginTop: "2px" }}>
                                {selectedSector.threatLevel.toUpperCase()}
                              </div>
                            </div>
                            <div>
                              <span style={{ color: "var(--text-muted)" }}>ANOMALIES:</span>
                              <div style={{ color: "#fff", fontWeight: "bold", marginTop: "2px", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                {profile?.worldState.activeAnomalies[selectedSector.id]?.join(", ") || "None"}
                              </div>
                            </div>
                          </div>

                          {/* Faction Presence indicators */}
                          <div style={{ display: "flex", flexDirection: "column", gap: "4px", marginTop: "4px" }}>
                            <span style={{ fontFamily: "var(--mono)", fontSize: "8.5px", color: "var(--text-muted)" }}>FACTION INFLUENCE INDEX:</span>
                            {Object.keys(profile?.worldState.factionInfluence[selectedSector.id] || {}).map((fid) => {
                              const score = profile?.worldState.factionInfluence[selectedSector.id]?.[fid] || 0;
                              const facName = FACTIONS.find(f => f.id === fid)?.name || fid.toUpperCase();
                              const facColor = getFactionColor(fid);
                              return (
                                <div key={fid}>
                                  <div style={{ display: "flex", justifyItems: "center", justifyContent: "space-between", fontSize: "8.5px", fontFamily: "var(--mono)", color: facColor }}>
                                    <span>{facName}</span>
                                    <span>{score}%</span>
                                  </div>
                                  <div style={{ width: "100%", height: "3px", background: "rgba(255,255,255,0.03)", borderRadius: "1px", overflow: "hidden" }}>
                                    <div style={{ width: `${score}%`, height: "100%", background: facColor }} />
                                  </div>
                                </div>
                              );
                            })}
                          </div>
                        </div>

                        <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "6px", display: "flex", justifyItems: "center", justifyContent: "space-between", alignItems: "center" }}>
                          <span style={{ fontFamily: "var(--mono)", fontSize: "9px", color: "var(--text-dim)" }}>
                            RESOURCES: {selectedSector.availableResources.join(", ")}
                          </span>
                        </div>

                      </div>
                    );
                  })() : (
                    <div style={{ display: "flex", justifyItems: "center", justifyContent: "center", alignItems: "center", height: "100%" }}>
                      <span style={{ fontFamily: "var(--mono)", fontSize: "10px", color: "var(--text-muted)" }}>AWAITING SECTOR INTERACTION...</span>
                    </div>
                  )}
                </div>

                {/* Col 3: Available Operations list inside selected Sector */}
                <div className="panel" style={{
                  background: "#080808", border: "1px solid var(--border)",
                  padding: "14px", display: "flex", flexDirection: "column", gap: "10px", overflow: "hidden"
                }}>
                  <div style={{ borderBottom: "1px dashed rgba(255,255,255,0.06)", paddingBottom: "4px" }}>
                    <span style={{ fontFamily: "var(--mono)", fontSize: "9px", color: "var(--text-dim)", letterSpacing: "0.1em", fontWeight: "bold" }}>
                      [ AVAILABLE OPERATIONS ]
                    </span>
                  </div>

                  <div style={{ flex: 1, overflowY: "auto", display: "flex", flexDirection: "column", gap: "8px", paddingRight: "4px" }}>
                    {selectedSectorMissions.length > 0 ? (
                      selectedSectorMissions.map((op) => {
                        const isSelected = selectedMapSector === op.id;
                        const isLocked = isMissionLocked(op);
                        const isCompleted = profile?.completedMissions.includes(op.id);
                        
                        return (
                          <div
                            key={op.id}
                            onClick={() => {
                              if (!isLocked) setSelectedMapSector(op.id);
                            }}
                            style={{
                              background: isCompleted 
                                ? "rgba(0, 255, 204, 0.02)" 
                                : isSelected 
                                ? "rgba(255, 77, 77, 0.04)" 
                                : isLocked 
                                ? "rgba(255,255,255,0.01)" 
                                : "#0c0c0c",
                              border: isSelected 
                                ? "1.5px solid var(--accent)" 
                                : isCompleted 
                                ? "1px solid rgba(0, 255, 204, 0.2)" 
                                : "1px solid var(--border)",
                              padding: "10px", borderRadius: "2px", cursor: isLocked ? "not-allowed" : "pointer",
                              transition: "all 0.15s", display: "flex", gap: "10px", alignItems: "center",
                              opacity: isLocked ? 0.35 : 1
                            }}
                          >
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                <span className={`tag ${op.difficulty === "Easy" ? "tag-green" : op.difficulty === "Normal" ? "tag-yellow" : "tag-red"}`} style={{ fontSize: "8px", padding: "1px 5px" }}>
                                  {op.difficulty.toUpperCase()}
                                </span>
                                <span style={{ fontFamily: "var(--mono)", fontSize: "8px", color: "var(--text-muted)" }}>
                                  {op.duration}m
                                </span>
                              </div>
                              <h4 style={{ fontSize: "11px", color: "#fff", margin: "4px 0 2px 0", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                {op.title}
                              </h4>
                              <div style={{ display: "flex", justifyItems: "center", justifyContent: "space-between", fontSize: "8px", fontFamily: "var(--mono)", color: "var(--text-muted)" }}>
                                <span>{op.category.toUpperCase()} MISSION</span>
                                {isLocked && <span style={{ color: "var(--accent)" }}>REQ: Lvl {op.unlockRequirements.level || op.unlockRequirements.bioScore || 1}</span>}
                              </div>
                            </div>
                          </div>
                        );
                      })
                    ) : (
                      <div style={{ textAlign: "center", fontFamily: "var(--mono)", fontSize: "10px", color: "var(--text-muted)", marginTop: "20px" }}>
                        NO OPERATIONS IN SECTOR
                      </div>
                    )}
                  </div>

                  {selectedOperation && selectedOperation.region === selectedSectorId && (
                    <button
                      onClick={() => { setActiveMission(selectedOperation); setMissionFlow("briefing"); }}
                      className="btn btn-primary"
                      style={{
                        width: "100%", justifyContent: "center", fontSize: "11px", padding: "8px",
                        background: selectedOperation.recommendedClass === profile?.class ? "#00ffcc" : "var(--accent)",
                        color: "#000"
                      }}
                    >
                      DEPLOY TO SECTOR 🛰️
                    </button>
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
                <div style={{ display: "flex", flexDirection: "column", gap: "6px", overflowY: "auto", maxHeight: "350px", paddingRight: "4px" }}>
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
                  
                  {/* Playtime */}
                  <div style={{ display: "flex", justifyItems: "center", justifyContent: "space-between", borderBottom: "1px dashed rgba(255,255,255,0.05)", paddingBottom: "4px" }}>
                    <span style={{ fontFamily: "var(--mono)", fontSize: "9px", color: "var(--text-dim)" }}>CAMPAIGN PLAYTIME:</span>
                    <span style={{ fontFamily: "var(--mono)", fontSize: "10px", color: "#fff" }}>
                      {(() => {
                        const s = profile?.totalPlaytimeSeconds || 0;
                        const hours = Math.floor(s / 3600);
                        const minutes = Math.floor((s % 3600) / 60);
                        const seconds = s % 60;
                        return `${hours}h ${minutes}m ${seconds}s`;
                      })()}
                    </span>
                  </div>

                  {/* Campaign Completion */}
                  <div style={{ display: "flex", justifyItems: "center", justifyContent: "space-between", borderBottom: "1px dashed rgba(255,255,255,0.05)", paddingBottom: "4px" }}>
                    <span style={{ fontFamily: "var(--mono)", fontSize: "9px", color: "var(--text-dim)" }}>CAMPAIGN SECURED:</span>
                    <span style={{ fontFamily: "var(--mono)", fontSize: "10px", color: "var(--accent)", fontWeight: "bold" }}>
                      {(() => {
                        if (!profile?.worldState?.sectorStates) return "0%";
                        const sectors = Object.values(profile.worldState.sectorStates);
                        const securedCount = sectors.filter(s => s.status === "SECURED").length;
                        const pct = Math.round((securedCount / 7) * 100);
                        return `${pct}% (${securedCount}/7 Sectors)`;
                      })()}
                    </span>
                  </div>

                  {/* Deployments & Outcomes */}
                  <div style={{ display: "flex", justifyItems: "center", justifyContent: "space-between", borderBottom: "1px dashed rgba(255,255,255,0.05)", paddingBottom: "4px" }}>
                    <span style={{ fontFamily: "var(--mono)", fontSize: "9px", color: "var(--text-dim)" }}>OPERATIONS RECORD:</span>
                    <span style={{ fontFamily: "var(--mono)", fontSize: "10px", color: "#fff" }}>
                      {profile?.campaignStats?.operationsCompleted || 0} Successful / {profile?.campaignStats?.operationsFailed || 0} Failed
                    </span>
                  </div>

                  {/* Civilians & Anomalies */}
                  <div style={{ display: "flex", justifyItems: "center", justifyContent: "space-between", borderBottom: "1px dashed rgba(255,255,255,0.05)", paddingBottom: "4px" }}>
                    <span style={{ fontFamily: "var(--mono)", fontSize: "9px", color: "var(--text-dim)" }}>CIVILIANS EXTRACTED:</span>
                    <span style={{ fontFamily: "var(--mono)", fontSize: "10px", color: "#00ffcc", fontWeight: "bold" }}>
                      👥 {profile?.campaignStats?.civiliansExtracted || 0} survivors
                    </span>
                  </div>
                  <div style={{ display: "flex", justifyItems: "center", justifyContent: "space-between", borderBottom: "1px dashed rgba(255,255,255,0.05)", paddingBottom: "4px" }}>
                    <span style={{ fontFamily: "var(--mono)", fontSize: "9px", color: "var(--text-dim)" }}>ANOMALIES RECORDED:</span>
                    <span style={{ fontFamily: "var(--mono)", fontSize: "10px", color: "#f0c929", fontWeight: "bold" }}>
                      🌀 {profile?.campaignStats?.anomaliesDiscovered || 0} discovered
                    </span>
                  </div>
                  <div style={{ display: "flex", justifyItems: "center", justifyContent: "space-between", borderBottom: "1px dashed rgba(255,255,255,0.05)", paddingBottom: "4px" }}>
                    <span style={{ fontFamily: "var(--mono)", fontSize: "9px", color: "var(--text-dim)" }}>RESEARCH ACQUIRED:</span>
                    <span style={{ fontFamily: "var(--mono)", fontSize: "10.5px", color: "#a855f7", fontWeight: "bold" }}>
                      🔬 {profile?.campaignStats?.researchDataCollected || 0} points
                    </span>
                  </div>
                  
                  {/* Resources grid */}
                  <div style={{ marginTop: "4px", border: "1px solid rgba(255,255,255,0.05)", background: "rgba(0,0,0,0.3)", padding: "8px" }}>
                    <div style={{ fontFamily: "var(--mono)", fontSize: "8px", color: "var(--text-muted)", letterSpacing: "0.1em", borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: "4px", marginBottom: "6px" }}>
                      [ TOTAL DEPLOYMENT MATERIAL HARVEST ]
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4px" }}>
                      {(() => {
                        const res = profile?.campaignStats?.totalResourcesRecovered || {};
                        const keys = ["Metal", "Electronics", "Medical Supplies", "Energy Cells", "Components"];
                        return keys.map(k => {
                          const val = res[k] || 0;
                          return (
                            <div key={k} style={{ display: "flex", justifyContent: "space-between", fontFamily: "var(--mono)", fontSize: "8.5px" }}>
                              <span style={{ color: "var(--text-dim)" }}>{k.toUpperCase()}:</span>
                              <span style={{ color: val > 0 ? "#00ffcc" : "var(--text-muted)", fontWeight: "bold" }}>{val}</span>
                            </div>
                          );
                        });
                      })()}
                    </div>
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

                  {/* Campaign Statistics */}
                  <div style={{ borderTop: "1px dashed var(--border)", paddingTop: "14px" }}>
                    <div style={{ fontFamily: "var(--mono)", fontSize: "10px", color: "var(--text-dim)", letterSpacing: "0.15em", marginBottom: "10px" }}>
                      [ CAMPAIGN STATISTICS OVERVIEW ]
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px" }}>
                      {([
                        { label: "OPS COMPLETED",  val: profile?.campaignStats?.operationsCompleted || 0,      color: "#00ffcc" },
                        { label: "OPS FAILED",      val: profile?.campaignStats?.operationsFailed || 0,         color: "#ff4d4d" },
                        { label: "SECTORS SECURED", val: profile?.campaignStats?.sectorsSecured || 0,           color: "#f0c929" },
                        { label: "RESEARCH DATA",   val: profile?.campaignStats?.researchDataCollected || 0,    color: "#a855f7" },
                        { label: "PLAYTIME (MIN)",  val: Math.floor((profile?.totalPlaytimeSeconds || 0) / 60), color: "#0ea5e9" },
                        { label: "ARCHIVE RECORDS", val: profile?.operationsArchive?.length || 0,               color: "#fff"    },
                      ] as { label: string; val: number; color: string }[]).map((stat) => (
                        <div key={stat.label} style={{ background: "#080808", border: "1px solid rgba(255,255,255,0.04)", padding: "8px 10px" }}>
                          <div style={{ fontFamily: "var(--mono)", fontSize: "8px", color: "var(--text-muted)", marginBottom: "2px" }}>{stat.label}</div>
                          <div style={{ fontFamily: "var(--mono)", fontSize: "16px", color: stat.color, fontWeight: "bold" }}>{stat.val}</div>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Operations Archive */}
                  {(profile?.operationsArchive?.length || 0) > 0 && (
                    <div style={{ borderTop: "1px dashed var(--border)", paddingTop: "14px" }}>
                      <div style={{ fontFamily: "var(--mono)", fontSize: "10px", color: "var(--text-dim)", letterSpacing: "0.15em", marginBottom: "10px" }}>
                        [ OPERATIONS ARCHIVE — LAST 10 RECORDS ]
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                        {profile?.operationsArchive?.slice(0, 10).map((rec, idx) => (
                          <div key={idx} style={{
                            background: "#0a0a0a",
                            border: `1px solid ${rec.outcome === "SUCCESS" ? "rgba(0,255,204,0.15)" : rec.outcome === "PARTIAL" ? "rgba(240,201,41,0.15)" : "rgba(255,77,77,0.15)"}`,
                            padding: "8px 12px", display: "flex", justifyContent: "space-between", alignItems: "center", borderRadius: "2px"
                          }}>
                            <div>
                              <div style={{ fontFamily: "var(--mono)", fontSize: "9.5px", color: "#fff", fontWeight: "bold" }}>{rec.missionTitle}</div>
                              <div style={{ fontFamily: "var(--mono)", fontSize: "8px", color: "var(--text-muted)", marginTop: "2px" }}>
                                {rec.sectorId.replace("sec-", "SECTOR ").toUpperCase()} // {new Date(rec.timestamp).toLocaleDateString()} // Objectives: {rec.objectivesCompleted || 0}/{rec.objectivesTotal || 0}
                              </div>
                              {rec.resourcesEarned && Object.entries(rec.resourcesEarned).filter(([_, q]) => (q as number) > 0).length > 0 && (
                                <div style={{ fontFamily: "var(--mono)", fontSize: "7.5px", color: "var(--accent)", marginTop: "2px" }}>
                                  LOOT EXTRACTED: {Object.entries(rec.resourcesEarned).filter(([_, q]) => (q as number) > 0).map(([r, qty]) => `+${qty} ${r}`).join(", ")}
                                </div>
                              )}
                            </div>
                            <div style={{ textAlign: "right" }}>
                              <span className={`tag ${rec.outcome === "SUCCESS" ? "tag-green" : rec.outcome === "PARTIAL" ? "tag-yellow" : "tag-red"}`} style={{ fontSize: "8px", padding: "1px 5px" }}>
                                {rec.outcome}
                              </span>
                              <div style={{ fontFamily: "var(--mono)", fontSize: "8.5px", color: "var(--text-muted)", marginTop: "3px" }}>
                                +{rec.xpEarned} XP // +{rec.creditsEarned} CR
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

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
              <div className="loadout-center-silhouette panel holo-noise" style={{
                background: "#050505", border: "1px dashed rgba(255,255,255,0.1)",
                display: "flex", flexDirection: "column", justifyItems: "center", justifyContent: "flex-start",
                alignItems: "stretch", position: "relative", height: "100%", padding: "16px", overflowY: "auto"
              }}>
                {!selectedInventoryItem ? (
                  <div style={{ display: "flex", flexDirection: "column", height: "100%", justifyContent: "center", alignItems: "center", width: "100%" }}>
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
                ) : (() => {
                  const equippedItem = equippedGear[selectedInventoryItem.slot];
                  const isEquipped = equippedItem?.id === selectedInventoryItem.id;
                  const itemColor = getRarityStyle(selectedInventoryItem.rarity).color;
                  
                  if (isEquipped) {
                    return (
                      <div style={{ display: "flex", flexDirection: "column", height: "100%", justifyContent: "space-between", gap: "12px", zIndex: 1 }}>
                        <div>
                          <div style={{ borderBottom: "1px dashed rgba(255,255,255,0.1)", paddingBottom: "8px", marginBottom: "8px" }}>
                            <span style={{ fontFamily: "var(--mono)", fontSize: "8.5px", color: "var(--text-dim)", letterSpacing: "0.1em" }}>
                              [ INSPECTING LOADOUT SLOTS // EQUIPPED ]
                            </span>
                            <h3 style={{ fontFamily: "var(--title-font)", fontSize: "16px", color: itemColor, margin: "4px 0 2px 0", fontWeight: "bold" }}>
                              {selectedInventoryItem.name}
                            </h3>
                            <span style={{ fontFamily: "var(--mono)", fontSize: "9px", color: "var(--text-muted)" }}>
                              {selectedInventoryItem.rarity.toUpperCase()} {selectedInventoryItem.slot.toUpperCase()} // LVL {selectedInventoryItem.itemLevel}
                            </span>
                          </div>

                          <div style={{ display: "flex", justifyContent: "space-between", background: "#0c0c0c", padding: "8px 12px", border: "1px solid var(--border)", marginBottom: "12px" }}>
                            <div>
                              <span style={{ fontFamily: "var(--mono)", fontSize: "8px", color: "var(--text-muted)" }}>RATING POWER</span>
                              <div style={{ fontFamily: "var(--mono)", fontSize: "14px", color: "#00ffcc", fontWeight: "bold" }}>
                                {selectedInventoryItem.power}
                              </div>
                            </div>
                            <div style={{ textAlign: "right" }}>
                              <span style={{ fontFamily: "var(--mono)", fontSize: "8px", color: "var(--text-muted)" }}>INTEGRITY QUALITY</span>
                              <div style={{ fontFamily: "var(--mono)", fontSize: "14px", color: "#fff", fontWeight: "bold" }}>
                                {selectedInventoryItem.quality}%
                              </div>
                            </div>
                          </div>

                          <p style={{ fontSize: "10.5px", color: "var(--text-muted)", lineHeight: "1.4", margin: "0 0 12px 0" }}>
                            {selectedInventoryItem.desc}
                          </p>

                          <div style={{ borderTop: "1px dashed rgba(255,255,255,0.06)", paddingTop: "8px" }}>
                            <span style={{ fontFamily: "var(--mono)", fontSize: "8px", color: "var(--text-muted)", display: "block", marginBottom: "6px" }}>STAT MODULE MATRIX</span>
                            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                              {Object.entries(selectedInventoryItem.stats || {}).map(([key, val]) => (
                                <div key={key} style={{ display: "flex", justifyContent: "space-between", fontSize: "10px", fontFamily: "var(--mono)", padding: "2px 0" }}>
                                  <span style={{ color: "var(--text-dim)", textTransform: "uppercase" }}>{key}</span>
                                  <span style={{ color: "#fff", fontWeight: "bold" }}>{val}</span>
                                </div>
                              ))}
                            </div>
                          </div>
                        </div>

                        <div style={{ display: "flex", gap: "10px", marginTop: "auto", borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "12px" }}>
                          <button
                            onClick={() => { handleUnequip(selectedInventoryItem.slot); setSelectedInventoryItem(null); }}
                            style={{
                              flex: 1, background: "rgba(255, 77, 77, 0.1)", border: "1px solid var(--accent)",
                              color: "var(--accent)", padding: "8px", fontFamily: "var(--mono)", fontSize: "10px",
                              fontWeight: "bold", cursor: "pointer", borderRadius: "2px"
                            }}
                          >
                            [ DISCONNECT GEAR ]
                          </button>
                          <button
                            onClick={() => setSelectedInventoryItem(null)}
                            style={{
                              flex: 1, background: "none", border: "1px solid var(--border)",
                              color: "var(--text-dim)", padding: "8px", fontFamily: "var(--mono)", fontSize: "10px",
                              fontWeight: "bold", cursor: "pointer", borderRadius: "2px"
                            }}
                          >
                            [ RETURN ]
                          </button>
                        </div>
                      </div>
                    );
                  } else {
                    const powerShift = selectedInventoryItem.power - (equippedItem?.power || 0);
                    const qualityShift = selectedInventoryItem.quality - (equippedItem?.quality || 0);
                    const allKeys = Array.from(new Set([
                      ...Object.keys(equippedItem?.stats || {}),
                      ...Object.keys(selectedInventoryItem.stats || {})
                    ]));

                    return (
                      <div style={{ display: "flex", flexDirection: "column", height: "100%", justifyContent: "space-between", gap: "12px", zIndex: 1 }}>
                        <div>
                          <div style={{ borderBottom: "1px dashed rgba(255,255,255,0.1)", paddingBottom: "8px", marginBottom: "8px" }}>
                            <span style={{ fontFamily: "var(--mono)", fontSize: "8.5px", color: "var(--text-dim)", letterSpacing: "0.1em" }}>
                              [ TACTICAL LOADOUT SHIFT COMPARISON ]
                            </span>
                            <h3 style={{ fontFamily: "var(--title-font)", fontSize: "15px", color: itemColor, margin: "4px 0 2px 0", fontWeight: "bold" }}>
                              {selectedInventoryItem.name}
                            </h3>
                            <span style={{ fontFamily: "var(--mono)", fontSize: "9px", color: "var(--text-muted)" }}>
                              COMPARE SLOTS: {selectedInventoryItem.slot.toUpperCase()} // LEVEL {selectedInventoryItem.itemLevel}
                            </span>
                          </div>

                          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px", marginBottom: "12px" }}>
                            <div style={{ background: "rgba(255,255,255,0.01)", border: "1px dashed rgba(255,255,255,0.05)", padding: "6px 8px" }}>
                              <span style={{ fontFamily: "var(--mono)", fontSize: "7.5px", color: "var(--text-dim)" }}>ACTIVE EQUIPPED</span>
                              {equippedItem ? (
                                <div style={{ marginTop: "2px" }}>
                                  <div style={{ fontSize: "10px", color: getRarityStyle(equippedItem.rarity).color, fontWeight: "bold", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                    {equippedItem.name}
                                  </div>
                                  <div style={{ fontSize: "9.5px", color: "#fff", fontFamily: "var(--mono)" }}>
                                    PWR: {equippedItem.power}
                                  </div>
                                </div>
                              ) : (
                                <div style={{ fontSize: "9.5px", color: "var(--text-muted)", fontStyle: "italic", marginTop: "2px" }}>
                                  [ EMPTY SLOT ]
                                </div>
                              )}
                            </div>

                            <div style={{ background: "rgba(0, 255, 204, 0.02)", border: "1px solid rgba(0, 255, 204, 0.15)", padding: "6px 8px" }}>
                              <span style={{ fontFamily: "var(--mono)", fontSize: "7.5px", color: "#00ffcc" }}>NEW INSPECTED</span>
                              <div style={{ marginTop: "2px" }}>
                                <div style={{ fontSize: "10px", color: itemColor, fontWeight: "bold", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                  {selectedInventoryItem.name}
                                </div>
                                <div style={{ fontSize: "9.5px", color: "#fff", fontFamily: "var(--mono)" }}>
                                  PWR: {selectedInventoryItem.power}
                                </div>
                              </div>
                            </div>
                          </div>

                          <div style={{ display: "flex", flexDirection: "column", gap: "6px", background: "#0c0c0c", border: "1px solid var(--border)", padding: "8px 12px", marginBottom: "12px" }}>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                              <span style={{ fontFamily: "var(--mono)", fontSize: "9px", color: "var(--text-muted)" }}>POWER DIFFERENCE:</span>
                              <span style={{
                                fontFamily: "var(--mono)", fontSize: "11px", fontWeight: "bold",
                                color: powerShift > 0 ? "#22c55e" : powerShift < 0 ? "#ff4d4d" : "var(--text-dim)"
                              }}>
                                {powerShift > 0 ? `+${powerShift}` : powerShift} PWR
                              </span>
                            </div>
                            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                              <span style={{ fontFamily: "var(--mono)", fontSize: "9px", color: "var(--text-muted)" }}>INTEGRITY SHIFT:</span>
                              <span style={{
                                fontFamily: "var(--mono)", fontSize: "10px", fontWeight: "bold",
                                color: qualityShift > 0 ? "#22c55e" : qualityShift < 0 ? "#ff4d4d" : "var(--text-dim)"
                              }}>
                                {equippedItem ? `${equippedItem.quality}%` : "0%"} → {selectedInventoryItem.quality}% ({qualityShift > 0 ? `+${qualityShift}` : qualityShift}%)
                              </span>
                            </div>
                          </div>

                          <div style={{ borderTop: "1px dashed rgba(255,255,255,0.06)", paddingTop: "8px" }}>
                            <span style={{ fontFamily: "var(--mono)", fontSize: "8px", color: "var(--text-muted)", display: "block", marginBottom: "6px" }}>STAT DIFFERENTIAL MATRIX</span>
                            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                              {allKeys.map(key => {
                                const valEquippedRaw = equippedItem?.stats?.[key];
                                const valSelectedRaw = selectedInventoryItem.stats?.[key];

                                const valEquipped = typeof valEquippedRaw === "number" ? valEquippedRaw : parseFloat(String(valEquippedRaw || "")) || 0;
                                const valSelected = typeof valSelectedRaw === "number" ? valSelectedRaw : parseFloat(String(valSelectedRaw || "")) || 0;
                                
                                const isNumber = (typeof valEquippedRaw === "number" || !isNaN(parseFloat(String(valEquippedRaw)))) && 
                                                 (typeof valSelectedRaw === "number" || !isNaN(parseFloat(String(valSelectedRaw))));
                                
                                const shift = valSelected - valEquipped;

                                return (
                                  <div key={key} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", fontSize: "10px", fontFamily: "var(--mono)", padding: "2px 0" }}>
                                    <span style={{ color: "var(--text-dim)", textTransform: "uppercase" }}>{key}</span>
                                    <div style={{ display: "flex", gap: "8px", alignItems: "center" }}>
                                      <span style={{ color: "var(--text-muted)" }}>{valEquippedRaw ?? "—"}</span>
                                      <span style={{ color: "var(--text-dim)" }}>→</span>
                                      <span style={{ color: "#fff", fontWeight: "bold" }}>{valSelectedRaw ?? "—"}</span>
                                      {isNumber && shift !== 0 && (
                                        <span style={{ color: shift > 0 ? "#22c55e" : "#ff4d4d", fontSize: "8.5px", fontWeight: "bold" }}>
                                          ({shift > 0 ? `+${shift}` : shift})
                                        </span>
                                      )}
                                    </div>
                                  </div>
                                );
                              })}
                            </div>
                          </div>
                        </div>

                        <div style={{ display: "flex", gap: "10px", marginTop: "auto", borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "12px" }}>
                          {(() => {
                            const check = canEquipItem(selectedInventoryItem);
                            return (
                              <button
                                disabled={!check.can}
                                onClick={() => { handleEquip(selectedInventoryItem); setSelectedInventoryItem(null); }}
                                style={{
                                  flex: 1, 
                                  background: check.can ? "var(--accent)" : "rgba(255,255,255,0.05)", 
                                  border: "none",
                                  color: check.can ? "#000" : "var(--text-dim)", 
                                  padding: "8px", 
                                  fontFamily: "var(--mono)", 
                                  fontSize: "9px",
                                  fontWeight: "bold", 
                                  cursor: check.can ? "pointer" : "not-allowed", 
                                  borderRadius: "2px"
                                }}
                              >
                                {check.can ? "[ EQUIP GEAR ]" : `[ LOCKED: ${check.reason} ]`}
                              </button>
                            );
                          })()}
                          <button
                            onClick={() => setSelectedInventoryItem(null)}
                            style={{
                              flex: 1, background: "none", border: "1px solid var(--border)",
                              color: "var(--text-dim)", padding: "8px", fontFamily: "var(--mono)", fontSize: "10px",
                              fontWeight: "bold", cursor: "pointer", borderRadius: "2px"
                            }}
                          >
                            [ CANCEL ]
                          </button>
                        </div>
                      </div>
                    );
                  }
                })()}
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

                      <div style={{ display: "flex", flexDirection: "column", gap: "4px", borderTop: "1px solid rgba(255,255,255,0.04)", paddingTop: "6px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span style={{ 
                            fontFamily: "var(--mono)", fontSize: "8px", 
                            color: profile?.class === selectedInventoryItem.classRequirement || selectedInventoryItem.classRequirement === "None" ? "var(--text-dim)" : "#ff4d4d" 
                          }}>
                            Class Req: {selectedInventoryItem.classRequirement}
                          </span>
                          {selectedInventoryItem.factionRequirement && (
                            <span style={{ 
                              fontFamily: "var(--mono)", fontSize: "8px", 
                              color: (profile?.factionStanding?.[selectedInventoryItem.factionRequirement] || 0) >= (selectedInventoryItem.factionStandingRequirement || 0) ? "var(--text-dim)" : "#ff4d4d" 
                            }}>
                              Rep Req: {selectedInventoryItem.factionRequirement.toUpperCase()} ({selectedInventoryItem.factionStandingRequirement})
                            </span>
                          )}
                        </div>
                        
                        <div style={{ display: "flex", gap: "8px", justifyContent: "flex-end", marginTop: "2px" }}>
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
                          {selectedInventoryItem.slot !== "None" && selectedInventoryItem.slot !== "Medkit" && (() => {
                            const check = canEquipItem(selectedInventoryItem);
                            return (
                              <button
                                disabled={!check.can}
                                onClick={() => handleEquip(selectedInventoryItem)}
                                style={{
                                  background: check.can ? "var(--accent)" : "rgba(255,255,255,0.05)",
                                  color: check.can ? "#000" : "var(--text-dim)",
                                  border: "none",
                                  padding: "4px 12px",
                                  fontFamily: "var(--mono)",
                                  fontSize: "9.5px",
                                  fontWeight: "bold",
                                  cursor: check.can ? "pointer" : "not-allowed",
                                  borderRadius: "2px"
                                }}
                              >
                                {check.can ? "[ EQUIP GEAR ]" : `[ LOCKED: ${check.reason} ]`}
                              </button>
                            );
                          })()}
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
      {activeMission && missionFlow === "briefing" && (() => {
        const sector = sectors.find(s => s.id === activeMission.region);
        const sectorState = profile ? profile.worldState?.sectorStates?.[activeMission.region] : undefined;
        const commentary = profile && sector ? generateAICommentary(profile, sector, sectorState, activeMission) : "";
        const survivalChance = getSurvivalChance(activeMission);
        return (
          <div style={{
            position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", zIndex: 100000,
            background: "rgba(0, 0, 0, 0.93)", display: "flex", alignItems: "center", justifyContent: "center",
            padding: "24px"
          }}>
            <div className="panel" style={{
              maxWidth: "840px", width: "100%", maxHeight: "92vh", overflowY: "auto",
              borderColor: "rgba(255, 77, 77, 0.45)", background: "#080808", padding: "30px",
              display: "flex", flexDirection: "column", gap: "16px"
            }}>
              <div style={{ borderBottom: "2px solid rgba(255,77,77,0.3)", paddingBottom: "12px", display: "flex", justifyContent: "space-between", alignItems: "flex-end" }}>
                <div>
                  <span style={{ fontFamily: "var(--mono)", fontSize: "10px", color: "var(--accent)", letterSpacing: "0.2em", fontWeight: "bold" }}>
                    CODENAME: RED QUEEN AI // MISSION DEPLOYMENT DIALOG
                  </span>
                  <h2 style={{ fontSize: "24px", color: "#fff", margin: "4px 0 0 0", letterSpacing: "0.05em" }}>{activeMission.title}</h2>
                </div>
                <div style={{ fontFamily: "var(--mono)", fontSize: "10px", color: "var(--text-muted)", paddingBottom: "2px" }}>
                  PHALANX SYNC ACTIVE
                </div>
              </div>

              {/* 5-Column Stats Grid */}
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr 1.2fr 1.2fr", gap: "12px" }}>
                <div style={{ background: "#000", border: "1px solid var(--border)", padding: "10px" }}>
                  <span style={{ fontFamily: "var(--mono)", fontSize: "8.5px", color: "var(--text-dim)" }}>SECTOR</span>
                  <div style={{ fontFamily: "var(--title-font)", fontSize: "12px", color: "#fff", fontWeight: "bold", marginTop: "2px" }}>
                    {activeMission.region.toUpperCase()}
                  </div>
                </div>
                <div style={{ background: "#000", border: "1px solid var(--border)", padding: "10px" }}>
                  <span style={{ fontFamily: "var(--mono)", fontSize: "8.5px", color: "var(--text-dim)" }}>DIFFICULTY</span>
                  <div style={{ fontFamily: "var(--title-font)", fontSize: "12px", color: "var(--accent)", fontWeight: "bold", marginTop: "2px" }}>
                    {activeMission.difficulty.toUpperCase()}
                  </div>
                </div>
                <div style={{ background: "#000", border: "1px solid var(--border)", padding: "10px" }}>
                  <span style={{ fontFamily: "var(--mono)", fontSize: "8.5px", color: "var(--text-dim)" }}>DURATION</span>
                  <div style={{ fontFamily: "var(--title-font)", fontSize: "12px", color: "#fff", fontWeight: "bold", marginTop: "2px" }}>
                    {activeMission.duration} MIN
                  </div>
                </div>
                <div style={{ background: "#000", border: "1px solid var(--border)", padding: "10px" }}>
                  <span style={{ fontFamily: "var(--mono)", fontSize: "8.5px", color: "var(--text-dim)" }}>REC. CLASS</span>
                  <div style={{ fontFamily: "var(--title-font)", fontSize: "12px", color: "#00ffcc", fontWeight: "bold", marginTop: "2px" }}>
                    {activeMission.recommendedClass.toUpperCase()}
                  </div>
                </div>
                <div style={{ background: "rgba(0, 255, 204, 0.03)", border: "1px solid rgba(0, 255, 204, 0.25)", padding: "10px" }}>
                  <span style={{ fontFamily: "var(--mono)", fontSize: "8.5px", color: "rgba(0, 255, 204, 0.8)" }}>SURVIVAL CHANCE</span>
                  <div style={{ fontFamily: "var(--mono)", fontSize: "13px", color: survivalChance >= 75 ? "#00ffcc" : survivalChance >= 50 ? "#f0c929" : "#ff4d4d", fontWeight: "bold", marginTop: "2px" }}>
                    {survivalChance}% EST.
                  </div>
                </div>
              </div>

              {/* 2-Column Details Layout */}
              <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "16px" }}>
                {/* Left Column: Dossier Story & Objectives */}
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  <div style={{ background: "#040404", border: "1px solid rgba(255,255,255,0.03)", padding: "14px" }}>
                    <span style={{ fontFamily: "var(--mono)", fontSize: "9px", color: "var(--text-dim)", letterSpacing: "0.12em", display: "block", marginBottom: "6px" }}>
                      OPERATIONAL ANOMALY DOSSIER / STORY
                    </span>
                    <p style={{ fontSize: "11px", color: "var(--text-muted)", lineHeight: "1.5", margin: 0 }}>
                      {activeMission.story || activeMission.description}
                    </p>
                  </div>

                  <div style={{ background: "#040404", border: "1px solid rgba(255,255,255,0.03)", padding: "14px" }}>
                    <span style={{ fontFamily: "var(--mono)", fontSize: "9px", color: "var(--text-dim)", letterSpacing: "0.12em", display: "block", marginBottom: "6px" }}>
                      CHECKLIST OBJECTIVES
                    </span>
                    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                      {activeMission.objectives?.map((obj) => (
                        <div key={obj.id} style={{ display: "flex", alignItems: "flex-start", gap: "6px", fontSize: "10.5px", fontFamily: "var(--mono)" }}>
                          <span style={{ color: obj.status === "COMPLETED" ? "#22c55e" : obj.status === "FAILED" ? "#ff4d4d" : "var(--accent)", fontWeight: "bold" }}>
                            [{obj.status === "COMPLETED" ? "✔ RESOLVED" : obj.status === "FAILED" ? "✘ FAILED" : "▢ PENDING"}]
                          </span>
                          <div style={{ display: "flex", flexDirection: "column", flex: 1 }}>
                            <span style={{ color: "#fff" }}>{obj.description}</span>
                            <span style={{ fontSize: "8.5px", color: "var(--text-muted)", marginTop: "1px" }}>
                              REWARD: <span style={{ color: "var(--accent)" }}>{obj.reward}</span>
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                {/* Right Column: Hazards & Recommendations */}
                <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                  <div style={{ background: "#040404", border: "1px solid rgba(255,255,255,0.03)", padding: "14px" }}>
                    <span style={{ fontFamily: "var(--mono)", fontSize: "9px", color: "var(--text-dim)", letterSpacing: "0.12em", display: "block", marginBottom: "6px" }}>
                      ENVIRONMENTAL hazard MATRIX
                    </span>
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      <div>
                        <span style={{ fontFamily: "var(--mono)", fontSize: "8px", color: "var(--text-muted)" }}>HAZARDS</span>
                        <div style={{ fontSize: "11px", color: "#ff4d4d", fontFamily: "var(--mono)", marginTop: "1px" }}>
                          ⚡ {activeMission.environmentalHazard || "None Detected"}
                        </div>
                      </div>
                      <div>
                        <span style={{ fontFamily: "var(--mono)", fontSize: "8px", color: "var(--text-muted)" }}>EXPECTED THREATS</span>
                        <div style={{ fontSize: "11px", color: "#fff", fontFamily: "var(--mono)", marginTop: "1px" }}>
                          👾 {activeMission.expectedThreat || "Standard Hostiles"}
                        </div>
                      </div>
                    </div>
                  </div>

                  <div style={{ background: "#040404", border: "1px solid rgba(255,255,255,0.03)", padding: "14px" }}>
                    <span style={{ fontFamily: "var(--mono)", fontSize: "9px", color: "var(--text-dim)", letterSpacing: "0.12em", display: "block", marginBottom: "6px" }}>
                      SUPPORT SPECS & GEAR REQUIREMENTS
                    </span>
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      <div>
                        <span style={{ fontFamily: "var(--mono)", fontSize: "8px", color: "var(--text-muted)" }}>RECOMMENDED DIVISION</span>
                        <div style={{ fontSize: "11px", color: "#00ffcc", fontFamily: "var(--mono)", marginTop: "1px" }}>
                          🛡️ {activeMission.recommendedDivision || "Any"}
                        </div>
                      </div>
                      <div>
                        <span style={{ fontFamily: "var(--mono)", fontSize: "8px", color: "var(--text-muted)" }}>RECOMMENDED EQUIPMENT</span>
                        <div style={{ fontSize: "11px", color: "#fff", fontFamily: "var(--mono)", marginTop: "1px" }}>
                          ⚙️ {activeMission.recommendedEquipment || "None Required"}
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Rewards Panel */}
              <div style={{ background: "#060606", border: "1px solid rgba(255, 255, 255, 0.05)", padding: "12px" }}>
                <span style={{ fontFamily: "var(--mono)", fontSize: "9px", color: "var(--text-dim)", letterSpacing: "0.12em", display: "block", marginBottom: "6px" }}>
                  ESTIMATED DEPLOYMENT REWARDS
                </span>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1.2fr", gap: "10px" }}>
                  <div style={{ background: "#000", border: "1px solid rgba(255,255,255,0.04)", padding: "8px" }}>
                    <span style={{ fontFamily: "var(--mono)", fontSize: "8px", color: "var(--text-muted)" }}>CREDITS</span>
                    <div style={{ fontFamily: "var(--mono)", fontSize: "12px", color: "#f0c929", fontWeight: "bold", marginTop: "1px" }}>
                      {activeMission.rewards.credits} CR
                    </div>
                  </div>
                  <div style={{ background: "#000", border: "1px solid rgba(255,255,255,0.04)", padding: "8px" }}>
                    <span style={{ fontFamily: "var(--mono)", fontSize: "8px", color: "var(--text-muted)" }}>EXPERIENCE</span>
                    <div style={{ fontFamily: "var(--mono)", fontSize: "12px", color: "#a855f7", fontWeight: "bold", marginTop: "1px" }}>
                      +{activeMission.rewards.xp} XP
                    </div>
                  </div>
                  <div style={{ background: "#000", border: "1px solid rgba(255,255,255,0.04)", padding: "8px" }}>
                    <span style={{ fontFamily: "var(--mono)", fontSize: "8px", color: "var(--text-muted)" }}>RESOURCE DROP</span>
                    <div style={{ fontFamily: "var(--mono)", fontSize: "12px", color: "#00ffcc", fontWeight: "bold", marginTop: "1px" }}>
                      {activeMission.rewards.resourceQty}x {activeMission.rewards.resource}
                    </div>
                  </div>
                </div>
              </div>

              {/* Red Queen AI Briefing Commentary */}
              <div style={{ background: "rgba(255, 0, 51, 0.04)", borderLeft: "4px solid var(--accent)", padding: "14px" }}>
                <div style={{ fontFamily: "var(--mono)", fontSize: "9px", color: "var(--accent)", letterSpacing: "0.12em", marginBottom: "4px", fontWeight: "bold" }}>
                  [ RED QUEEN AI COMM LINK UPLINK ]
                </div>
                <p style={{ fontFamily: "var(--mono)", fontSize: "11px", fontStyle: "italic", color: "var(--text)", lineHeight: "1.5", margin: 0 }}>
                  {commentary}
                </p>
              </div>

              {/* Actions Footer */}
              <div style={{ display: "flex", justifyItems: "center", justifyContent: "space-between", marginTop: "6px" }}>
                <button
                  onClick={() => { setActiveMission(null); setMissionFlow(null); }}
                  className="btn btn-ghost"
                  style={{ border: "1px solid var(--border)", padding: "10px 24px", fontSize: "11px" }}
                >
                  ABORT DEPLOYMENT
                </button>
                <button
                  onClick={() => runDeployment(activeMission)}
                  className="btn btn-primary"
                  style={{ padding: "10px 32px", fontSize: "11px" }}
                >
                  DEPLOY OPERATIVE 🛰️
                </button>
              </div>
            </div>
          </div>
        );
      })()}

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
