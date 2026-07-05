"use client";
import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { useWalletModal } from "@solana/wallet-adapter-react-ui";
import { useAuth } from "@/components/AuthProvider";
import Link from "next/link";
import AccessGuard from "@/components/AccessGuard";
import OperationsManualView from "@/components/OperationsManualView";
import { mainframeAudio } from "@/lib/game/audio";
import { DEFAULT_STATS, UserStats, calculateBioScore, getClearanceLevel } from "@/lib/progression";

// Game Types & Data imports
import { Sector, Mission, InventoryItem, OperativeProfile, SectorState, WorldState } from "@/lib/game/types";
import { INITIAL_SECTORS, INITIAL_MISSIONS, INITIAL_INVENTORY, SECTOR_CONNECTIONS, CRAFTING_RECIPES, UPGRADE_RECIPES } from "@/lib/game/data";
import {
  loadProfile,
  DEFAULT_PROFILE,
  saveProfile,
  claimMissionRewards,
  loadInventory,
  saveInventory,
  loadEquippedGear,
  saveEquippedGear,
  DEFAULT_WORLD_STATE,
  DEFAULT_CAMPAIGN_STATS,
  generateAICommentary,
  craftItem,
  upgradeEquipment,
  RedQueenIntelligenceService
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

const getSectorColor = (sectorId: string) => {
  switch (sectorId) {
    case "sec-alpha": return "#00ff66";
    case "sec-beta": return "#ffcc00";
    case "sec-gamma": return "#0099ff";
    case "sec-delta": return "#ff3333";
    case "sec-epsilon": return "#b366ff";
    case "sec-zeta": return "#00ffff";
    case "sec-omega": return "#ffffff";
    default: return "var(--accent)";
  }
};

const hexToRgb = (hex: string): string => {
  const colors: Record<string, string> = {
    "#00ff66": "0, 255, 102",
    "#ffcc00": "255, 204, 0",
    "#0099ff": "0, 153, 255",
    "#ff3333": "255, 51, 51",
    "#b366ff": "179, 102, 255",
    "#00ffff": "0, 255, 255",
    "#ffffff": "255, 255, 255"
  };
  return colors[hex] || "255, 77, 77";
};

export default function OperationsPage() {
  const { publicKey } = useWallet();
  const { setVisible } = useWalletModal();
  const { authIdentifier, session } = useAuth();
  const identifier = authIdentifier || (publicKey ? publicKey.toString() : "offline-operative");

  // Access Control local states
  const [inviteCodeInput, setInviteCodeInput] = useState("");
  const [inviteError, setInviteError] = useState<string | null>(null);
  const [isActivatingInvite, setIsActivatingInvite] = useState(false);
  const [isRefreshingHolder, setIsRefreshingHolder] = useState(false);
  const [refreshError, setRefreshError] = useState<string | null>(null);

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
  const [reassignFaction, setReassignFaction] = useState("vanguard");
  const [reassignClass, setReassignClass] = useState("Assault");
  const [reassignRole, setReassignRole] = useState("Breach Specialist");

  // Reusable Data Models driven states
  const [sectors, setSectors] = useState<Sector[]>(INITIAL_SECTORS);
  const [missions, setMissions] = useState<Mission[]>(INITIAL_MISSIONS);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [equippedGear, setEquippedGear] = useState<Record<string, InventoryItem | null>>({});
  const [loadingOps, setLoadingOps] = useState(false);
  const [activeTab, setActiveTab] = useState<"center" | "profile" | "inventory" | "settings" | "manual">("center");
  const [completedOnboarding, setCompletedOnboarding] = useState<boolean>(true);
  const [gameplayOnboardingStep, setGameplayOnboardingStep] = useState<number>(1);

  // Mainframe Boot Sequence States & Hook
  const [booted, setBooted] = useState(false);
  const [bootLogs, setBootLogs] = useState<string[]>([]);

  useEffect(() => {
    const logs = [
      "CONNECTING TO RED QUEEN MAINFRAME...",
      "[OK] LOAD SECURE SUITE // V7.4.1",
      "[OK] LOAD SOUL REGISTRY: UMBRELLA-RED-QUEEN",
      "[OK] STABILIZE METADATA DEPIN DECK",
      "[OK] CHECK SOLANA TOKEN GATE CLEARANCE ($THREAT)",
      "[OK] CLEARANCE SECURED: LEVEL 5 ACCESS GRANTED",
      "LAUNCHING INTERACTIVE TACTICAL CONSOLE DECK..."
    ];
    let currentLogIndex = 0;
    const interval = setInterval(() => {
      if (currentLogIndex < logs.length) {
        const logLine = logs[currentLogIndex];
        setBootLogs(prev => [...prev, logLine]);
        try {
          mainframeAudio.playTick();
        } catch (e) {}
        currentLogIndex++;
      } else {
        clearInterval(interval);
        setTimeout(() => {
          setBooted(true);
          try {
            mainframeAudio.playSweep();
          } catch (e) {}
        }, 300);
      }
    }, 180);
    return () => clearInterval(interval);
  }, []);

  // Map and Selected Sector selection
  const [selectedSectorId, setSelectedSectorId] = useState<string>("sec-alpha");
  const [selectedMapSector, setSelectedMapSector] = useState<string>("op-1-sanctuary-search");
  const [mapAlert, setMapAlert] = useState<string | null>(null);
  const [globalEvents, setGlobalEvents] = useState<Array<{
    id: string;
    type: 'OUTBREAK' | 'STORM' | 'RESEARCH_SIGNAL' | 'EMERGENCY_BEACON' | 'CONFLICT';
    name: string;
    x: number;
    y: number;
    radius: number;
    color: string;
    details: string;
  }>>([
    {
      id: "evt-outbreak-delta",
      type: "OUTBREAK",
      name: "PATHOGEN SPIKE",
      x: 210,
      y: 350,
      radius: 40,
      color: "#ff4d4d",
      details: "Mutated bio-hazard bloom detected. Bio-Score evaluation locked."
    },
    {
      id: "evt-beacon-beta",
      type: "EMERGENCY_BEACON",
      name: "SOS UPLINK",
      x: 430,
      y: 130,
      radius: 20,
      color: "#f0c929",
      details: "Distress frequency active. Recommended level 2+."
    }
  ]);

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

  const dailyBriefing = useMemo(() => {
    if (!profile) return { title: "", content: "CALIBRATING TACTICAL INTERFACE...", warning: false };
    return RedQueenIntelligenceService.getDailyBriefing(profile, sectors, missions, inventory);
  }, [profile, sectors, missions, inventory]);

  const getHeaders = useCallback(() => {
    const headers: Record<string, string> = {
      "Content-Type": "application/json"
    };
    if (session?.access_token) {
      headers["Authorization"] = `Bearer ${session.access_token}`;
    } else if (typeof window !== "undefined" && publicKey) {
      const saved = localStorage.getItem(`rq_sol_sig:${publicKey.toString()}`);
      if (saved) {
        try {
          const { signature, message } = JSON.parse(saved);
          headers["X-Solana-PublicKey"] = publicKey.toString();
          headers["X-Solana-Signature"] = signature;
          headers["X-Solana-Message"] = message;
        } catch (e) {}
      }
    }
    return headers;
  }, [session, publicKey]);

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



  // Load operative stats and inventory from services
  // Load operative stats and inventory from services
  const loadGameData = async () => {
    setLoading(true);
    const identifier = authIdentifier || (publicKey ? publicKey.toString() : "offline-operative");
    
    // Grab any existing access_type from local cache before overwriting
    const cachedAccessType = (() => {
      if (typeof window === "undefined") return "None";
      const cached = localStorage.getItem(`rq_ops_profile:${identifier}`);
      if (!cached) return "None";
      try { return JSON.parse(cached)?.accessType || JSON.parse(cached)?.access_type || "None"; } catch { return "None"; }
    })();

    try {
      const headers = getHeaders();
      const res = await fetch(`/api/profile?wallet=${identifier}`, {
        headers
      });
      const data = await res.json();
      
      let loadedProfile: OperativeProfile | null = null;
      let loadedInventory: InventoryItem[] = [];
      
      if (data && data.profile) {
        const db = data.profile;
        
        // Self-heal sector states if needed
        const savedSectorStates = db.world_state?.sectorStates || {};
        const healedSectorStates: Record<string, SectorState> = {};
        Object.keys(DEFAULT_WORLD_STATE.sectorStates).forEach(sid => {
          const defaults = DEFAULT_WORLD_STATE.sectorStates[sid];
          const existing = savedSectorStates[sid] || {};
          healedSectorStates[sid] = {
            ...defaults,
            ...existing,
            unlockRequiredSector:  defaults.unlockRequiredSector,
            unlockRequiredLevel:   defaults.unlockRequiredLevel,
            unlockRequiredBioScore: defaults.unlockRequiredBioScore,
            unlockRequiredFaction: defaults.unlockRequiredFaction,
            stability:             typeof existing.stability === "number" ? existing.stability : (existing.completion || defaults.completion || 0),
            influence:             existing.influence || { ...(DEFAULT_WORLD_STATE.sectorStates[sid]?.influence || {}) },
            completedMissions:     Array.isArray(existing.completedMissions) ? existing.completedMissions : [],
            availableMissions:     Array.isArray(existing.availableMissions) ? existing.availableMissions : [...(defaults.availableMissions || [])],
            worldEvents:           Array.isArray(existing.worldEvents) ? existing.worldEvents : [...(defaults.worldEvents || [])],
            contamination:         typeof existing.contamination === "number" ? existing.contamination : (defaults.contamination !== undefined ? defaults.contamination : 15),
            availableResources:    Array.isArray(existing.availableResources) ? existing.availableResources : [...(defaults.availableResources || [])],
          };
        });
        
        const worldState: WorldState = {
          unlockedSectors:      Array.isArray(db.world_state?.unlockedSectors) ? db.world_state.unlockedSectors : DEFAULT_WORLD_STATE.unlockedSectors,
          activeAnomalies:      db.world_state?.activeAnomalies  || DEFAULT_WORLD_STATE.activeAnomalies,
          factionInfluence:     db.world_state?.factionInfluence || DEFAULT_WORLD_STATE.factionInfluence,
          globalAlerts:         Array.isArray(db.world_state?.globalAlerts) ? db.world_state.globalAlerts : DEFAULT_WORLD_STATE.globalAlerts,
          sectorStates:         healedSectorStates,
          activeEvents:         Array.isArray(db.world_state?.activeEvents) ? db.world_state.activeEvents : [...DEFAULT_WORLD_STATE.activeEvents],
          longestStreak:        typeof db.world_state?.longestStreak === "number" ? db.world_state.longestStreak : 0,
          dynamicMissions:      Array.isArray(db.world_state?.dynamicMissions) ? db.world_state.dynamicMissions : [],
          // CRITICAL: preserve completedOnboarding from DB so returning players skip intro
          completedOnboarding:  db.world_state?.completedOnboarding === true,
        };

        loadedProfile = {
          name: db.apocalyptic_name || "OPERATIVE",
          faction: db.faction || "None",
          class: db.class || "None",
          role: db.role || "None",
          level: typeof db.level === "number" ? db.level : 1,
          xp: typeof db.xp === "number" ? db.xp : 0,
          credits: typeof db.credits === "number" ? db.credits : 500,
          reputation: typeof db.reputation === "number" ? db.reputation : 0,
          resources: db.resources || { ...DEFAULT_PROFILE.resources },
          stats: db.stats || { ...DEFAULT_STATS },
          completedMissions: Array.isArray(db.completed_missions) ? db.completed_missions : [],
          factionStanding: db.faction_standing || { ...DEFAULT_PROFILE.factionStanding },
          achievements: Array.isArray(db.achievements) ? db.achievements : [],
          missionHistory: Array.isArray(db.mission_history) ? db.mission_history : [],
          sectorDiscoveries: Array.isArray(db.sector_discoveries) ? db.sector_discoveries : DEFAULT_PROFILE.sectorDiscoveries,
          health: typeof db.health === "number" ? db.health : 100,
          worldState,
          campaignStats: db.campaign_stats || { ...DEFAULT_CAMPAIGN_STATS },
          operationsArchive: Array.isArray(db.operations_archive) ? db.operations_archive : [],
          totalPlaytimeSeconds: typeof db.total_playtime_seconds === "number" ? db.total_playtime_seconds : 0,
          holderStatus: db.holder_status || "Civilian",
          holderTier: typeof db.holder_tier === "number" ? db.holder_tier : 0,
          verifiedBalance: typeof db.verified_balance === "number" ? db.verified_balance : 0,
          lastVerification: db.last_verification || null,
          // Preserve invite/admin access_type from DB OR local cache — never downgrade to None
          accessType: (() => {
            const dbType = db.access_type || "None";
            if (dbType === "Invite" || dbType === "Admin") return dbType;
            if (cachedAccessType === "Invite" || cachedAccessType === "Admin") return cachedAccessType;
            return dbType;
          })()
        };
        
        loadedInventory = Array.isArray(db.inventory) ? db.inventory : [];
      } else {
        const prof = loadProfile(identifier);
        const inv = loadInventory(identifier, INITIAL_INVENTORY);
        
        loadedProfile = {
          ...prof,
          holderStatus: prof.holderStatus || "Civilian",
          holderTier: prof.holderTier || 0,
          verifiedBalance: prof.verifiedBalance || 0,
          accessType: (() => {
            const cached = prof.accessType || "None";
            if (cached === "Invite" || cached === "Admin") return cached;
            if (typeof window !== "undefined") {
              const localGrant = localStorage.getItem(`rq_invite_grant:${identifier}`);
              if (localGrant === "Invite" || localGrant === "Admin") return localGrant;
            }
            return cached;
          })()
        };
        loadedInventory = inv;

        if (identifier !== "offline-operative") {
          await fetch("/api/profile", {
            method: "POST",
            headers: getHeaders(),
            body: JSON.stringify({
              wallet_address: identifier,
              username: loadedProfile.name || "Operative",
              level: loadedProfile.level,
              xp: loadedProfile.xp,
              health: loadedProfile.health,
              class: loadedProfile.class,
              role: loadedProfile.role,
              faction: loadedProfile.faction,
              credits: loadedProfile.credits,
              reputation: loadedProfile.reputation,
              resources: loadedProfile.resources,
              stats: loadedProfile.stats,
              world_state: loadedProfile.worldState,
              completed_missions: loadedProfile.completedMissions,
              sector_discoveries: loadedProfile.sectorDiscoveries,
              mission_history: loadedProfile.missionHistory,
              achievements: loadedProfile.achievements,
              campaign_stats: loadedProfile.campaignStats,
              operations_archive: loadedProfile.operationsArchive,
              inventory: loadedInventory,
              holder_status: loadedProfile.holderStatus,
              holder_tier: loadedProfile.holderTier,
              verified_balance: loadedProfile.verifiedBalance,
              access_type: loadedProfile.accessType
            })
          });
        }
      }

      setProfile(loadedProfile);
      setCompletedOnboarding(loadedProfile.worldState?.completedOnboarding || false);
      setInventory(loadedInventory);

      if (identifier !== "offline-operative") {
        fetch("/api/profile/verify-holder", {
          method: "POST",
          headers: getHeaders(),
          body: JSON.stringify({ wallet: identifier })
        })
          .then(vRes => vRes.json())
          .then(vData => {
            if (vData && vData.success) {
              setProfile(prev => {
                if (!prev) return null;
                return {
                  ...prev,
                  verifiedBalance: vData.verified_balance,
                  holderTier: vData.holder_tier,
                  holderStatus: vData.holder_status,
                  accessType: vData.access_type
                };
              });
            }
          })
          .catch(e => console.warn("Failed to auto-verify tokens on load:", e));
      }

    } catch (err) {
      console.error("Failed to load operations profile asynchronously:", err);
      const prof = loadProfile(identifier);
      const inv = loadInventory(identifier, INITIAL_INVENTORY);
      setProfile(prof);
      setCompletedOnboarding(prof.worldState?.completedOnboarding || false);
      setInventory(inv);
    } finally {
      setLoading(false);
    }
  };

  const finishOnboarding = () => {
    if (!profile) return;
    const identifier = authIdentifier || (publicKey ? publicKey.toString() : "offline-operative");
    const updatedWorldState = {
      ...profile.worldState,
      completedOnboarding: true
    };
    const updatedProfile = {
      ...profile,
      worldState: updatedWorldState
    };
    setProfile(updatedProfile);
    setCompletedOnboarding(true);
    
    // Save to local storage
    saveProfile(identifier, updatedProfile);
    
    setAiLogs(prev => [...prev, "[SYS] OPERATOR INITIALIZATION COMPLETE // CONNECTED TO RED QUEEN HUB"]);
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

  // Synchronize equippedGear state and save it whenever inventory is updated
  useEffect(() => {
    if (!profile) return;
    const derived: Record<string, InventoryItem | null> = {
      Helmet: null, Armor: null, Weapon: null, Utility: null, Medkit: null, Backpack: null, Gadget: null
    };
    inventory.forEach(item => {
      if (item.equipped && item.slot && item.slot !== "None") {
        derived[item.slot] = item;
      }
    });
    setEquippedGear(derived);
    
    const identifier = authIdentifier || (publicKey ? publicKey.toString() : "offline-operative");
    saveEquippedGear(identifier, derived);
  }, [inventory, !!profile, authIdentifier, publicKey]);

  // Synchronize player profile and inventory to Supabase on state change (with debounce)
  useEffect(() => {
    if (!profile) return;
    const identifier = authIdentifier || (publicKey ? publicKey.toString() : "offline-operative");
    if (identifier === "offline-operative") return;

    const syncData = async () => {
      try {
        const authHeaderToken = session?.access_token;
        await fetch("/api/profile", {
          method: "POST",
          headers: getHeaders(),
          body: JSON.stringify({
            wallet_address: identifier,
            username: profile.name || "Operative",
            level: profile.level,
            xp: profile.xp,
            health: profile.health,
            class: profile.class,
            role: profile.role,
            faction: profile.faction,
            credits: profile.credits,
            reputation: profile.reputation,
            resources: profile.resources,
            stats: profile.stats,
            world_state: profile.worldState,
            completed_missions: profile.completedMissions,
            sector_discoveries: profile.sectorDiscoveries,
            mission_history: profile.missionHistory,
            achievements: profile.achievements,
            campaign_stats: profile.campaignStats,
            operations_archive: profile.operationsArchive,
            inventory: inventory,
            holder_status: profile.holderStatus,
            holder_tier: profile.holderTier,
            verified_balance: profile.verifiedBalance,
            last_verification: profile.lastVerification,
            access_type: profile.accessType
          })
        });
      } catch (e) {
        console.error("Failed to auto-save game progress to Supabase:", e);
      }
    };

    const timer = setTimeout(syncData, 1000); // 1-second debounce
    return () => clearTimeout(timer);
  }, [profile, inventory, authIdentifier, publicKey, session]);

  // Handle Onboarding Completion
  const handleOnboardingSubmit = () => {
    if (!operativeName || !selectedFaction || !selectedClass || !selectedRole) return;
    
    const identifier = authIdentifier || (publicKey ? publicKey.toString() : "offline-operative");

    // Preserve existing access_type from profile or local cache
    const preservedAccessType = (() => {
      if (profile?.accessType && profile.accessType !== "None") return profile.accessType;
      if (typeof window === "undefined") return "None";
      
      const localGrant = localStorage.getItem(`rq_invite_grant:${identifier}`);
      if (localGrant === "Invite" || localGrant === "Admin") return localGrant;

      const cached = localStorage.getItem(`rq_ops_profile:${identifier}`);
      if (!cached) return "None";
      try { return JSON.parse(cached)?.accessType || JSON.parse(cached)?.access_type || "None"; } catch { return "None"; }
    })();

    // 1. Generate Starter Inventory & Equipment
    const startingInventory: InventoryItem[] = INITIAL_INVENTORY.map(item => {
      // Equip basic starter items by default
      if (item.id === "inv-basic-helmet" || item.id === "inv-basic-vest" || item.id === "inv-basic-rifle" || item.id === "inv-basic-backpack") {
        return { ...item, equipped: true };
      }
      return item;
    });

    const derivedEquipped: Record<string, InventoryItem | null> = {
      Helmet: startingInventory.find(i => i.id === "inv-basic-helmet") || null,
      Armor: startingInventory.find(i => i.id === "inv-basic-vest") || null,
      Weapon: startingInventory.find(i => i.id === "inv-basic-rifle") || null,
      Backpack: startingInventory.find(i => i.id === "inv-basic-backpack") || null,
      Utility: null,
      Medkit: null,
      Gadget: null
    };

    // 2. Initialize dynamic sector states so Sector Alpha is unlocked, status is AVAILABLE
    const healedSectorStates: Record<string, SectorState> = {};
    Object.keys(DEFAULT_WORLD_STATE.sectorStates).forEach(sid => {
      const defaults = DEFAULT_WORLD_STATE.sectorStates[sid];
      healedSectorStates[sid] = {
        ...defaults,
        status: sid === "sec-alpha" ? "AVAILABLE" : "LOCKED",
        isUnlocked: sid === "sec-alpha",
        stability: sid === "sec-alpha" ? 80 : 0,
        completedMissions: [],
        availableMissions: sid === "sec-alpha" ? ["op-1-sanctuary-search", "op-6-outpost-breach"] : [],
        worldEvents: [],
        contamination: sid === "sec-alpha" ? 25 : 15,
        availableResources: sid === "sec-alpha" ? ["Medical Supplies", "Credits"] : [],
      };
    });

    const initialWorldState: WorldState = {
      unlockedSectors: ["sec-alpha"],
      activeAnomalies: {
        "sec-alpha": ["Toxin Leak"]
      },
      factionInfluence: {
        "sec-alpha": { vanguard: 10 }
      },
      globalAlerts: ["VIRAL OUTBREAK SUSPECTED IN SEC-ALPHA // SIGNAL STEADY // UPLINK GREEN"],
      sectorStates: healedSectorStates,
      activeEvents: [],
      longestStreak: 0,
      dynamicMissions: [],
      completedOnboarding: true
    };

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
      sectorDiscoveries: ["sec-alpha"],
      health: 100,
      worldState: initialWorldState,
      campaignStats: { ...DEFAULT_CAMPAIGN_STATS },
      operationsArchive: [],
      totalPlaytimeSeconds: 0,
      // Always carry forward the verified invite/holder access type
      accessType: preservedAccessType,
      holderStatus: "Civilian",
      holderTier: 0,
      verifiedBalance: 0,
    };
    
    // Save to local storage
    saveProfile(identifier, initialProfile);
    saveInventory(identifier, startingInventory);
    saveEquippedGear(identifier, derivedEquipped);
    
    // Set react state
    setProfile(initialProfile);
    setInventory(startingInventory);
    setEquippedGear(derivedEquipped);
    setCompletedOnboarding(true);

    // Write permanent grant so AccessGuard never re-asks for access code
    if (preservedAccessType && preservedAccessType !== "None" && typeof window !== "undefined") {
      const rawWallet = publicKey ? publicKey.toString() : identifier;
      localStorage.setItem(`rq_invite_grant:${rawWallet}`, preservedAccessType);
    }

    // Immediately persist profile, inventory and access_type to DB so it survives reconnects
    if (identifier !== "offline-operative") {
      fetch("/api/profile", {
        method: "POST",
        headers: getHeaders(),
        body: JSON.stringify({
          wallet_address: identifier,
          username: initialProfile.name,
          level: initialProfile.level,
          xp: initialProfile.xp,
          health: initialProfile.health,
          class: initialProfile.class,
          role: initialProfile.role,
          faction: initialProfile.faction,
          credits: initialProfile.credits,
          reputation: initialProfile.reputation,
          resources: initialProfile.resources,
          stats: initialProfile.stats,
          world_state: initialProfile.worldState,
          completed_missions: initialProfile.completedMissions,
          sector_discoveries: initialProfile.sectorDiscoveries,
          mission_history: initialProfile.missionHistory,
          achievements: initialProfile.achievements,
          campaign_stats: initialProfile.campaignStats,
          operations_archive: initialProfile.operationsArchive,
          inventory: startingInventory,
          access_type: preservedAccessType,
        })
      }).catch(e => console.warn("Failed to persist initial profile to DB:", e));
    }
  };

  // Sync reassignment options when profile loads
  useEffect(() => {
    if (profile) {
      if (profile.faction && profile.faction !== "None") setReassignFaction(profile.faction);
      if (profile.class && profile.class !== "None") setReassignClass(profile.class);
      if (profile.role && profile.role !== "None") setReassignRole(profile.role);
    }
  }, [profile]);

  const handleConfirmReassignment = async () => {
    if (!profile) return;
    const identifier = authIdentifier || (publicKey ? publicKey.toString() : "offline-operative");
    
    const updatedProfile = {
      ...profile,
      faction: reassignFaction,
      class: reassignClass,
      role: reassignRole,
    };
    
    setProfile(updatedProfile);
    saveProfile(identifier, updatedProfile);
    
    setAiLogs(prev => [...prev, `[SYS] CONFIRMING REASSIGNMENT // FACTION: ${reassignFaction.toUpperCase()} // CLASS: ${reassignClass.toUpperCase()} // ROLE: ${reassignRole}`]);
    
    if (identifier !== "offline-operative") {
      try {
        const res = await fetch("/api/profile", {
          method: "POST",
          headers: getHeaders(),
          body: JSON.stringify({
            wallet_address: identifier,
            username: updatedProfile.name,
            level: updatedProfile.level,
            xp: updatedProfile.xp,
            health: updatedProfile.health,
            class: updatedProfile.class,
            role: updatedProfile.role,
            faction: updatedProfile.faction,
            credits: updatedProfile.credits,
            reputation: updatedProfile.reputation,
            resources: updatedProfile.resources,
            stats: updatedProfile.stats,
            world_state: updatedProfile.worldState,
            completed_missions: updatedProfile.completedMissions,
            sector_discoveries: updatedProfile.sectorDiscoveries,
            mission_history: updatedProfile.missionHistory,
            achievements: updatedProfile.achievements,
            campaign_stats: updatedProfile.campaignStats,
            operations_archive: updatedProfile.operationsArchive,
            inventory: inventory,
            access_type: updatedProfile.accessType,
          })
        });
        if (res.ok) {
          alert("REASSIGNMENT SUCCESSFUL // PROFILE SYNCHRONIZED WITH SUPABASE");
          loadGameData();
        } else {
          alert("Reassignment Error: Failed to save changes to Supabase.");
        }
      } catch (err) {
        console.error(err);
        alert("Reassignment Error: Connection failed.");
      }
    } else {
      alert("Offline Mode: Reassignment updated locally.");
    }
  };

  // Deployment sequences tickers
  const runDeployment = (op: Mission) => {
    const sector = sectors.find(s => s.id === op.region);
    if (!sector || getSectorStatus(sector) === "LOCKED") {
      alert("DEPLOYMENT COMPROMISED // TARGET ZONE SECURITY GATE IS OFFLINE");
      setActiveMission(null);
      setMissionFlow(null);
      return;
    }

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
        try { mainframeAudio.playTick(); } catch(e){}
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
        try { mainframeAudio.playTick(); } catch(e){}
        current++;
      } else {
        clearInterval(interval);
        setTimeout(() => {
          setMissionFlow("decision");
          try { mainframeAudio.playSweep(); } catch(e){}
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
      try { mainframeAudio.playSuccess(); } catch(e){}
    } else {
      const damage = reward.injury || 0;
      setEventOutcomeText(`[FAILURE] ${choice.failure_text} (Health Impact: -${damage} HP)`);
      try { mainframeAudio.playWarning(); } catch(e){}
      
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
      try { mainframeAudio.playWarning(); } catch(e){}
      setOutcomeCommentary(
        RedQueenIntelligenceService.getMissionDebriefing(
          profile,
          activeMission,
          "DEFEAT",
          cumulativeRewards.injury,
          cumulativeRewards.credits,
          Object.keys(cumulativeRewards.resources || {}).length
        )
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
        RedQueenIntelligenceService.getMissionDebriefing(
          profile,
          activeMission,
          finalOutcome === "SUCCESS" ? "SUCCESS" : "PARTIAL",
          cumulativeRewards.injury,
          cumulativeRewards.credits,
          Object.keys(cumulativeRewards.resources || {}).length
        )
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
    const { updatedProfile, levelUpMessage: lvlMsg, worldEventsMessage: wldMsg, lootedItems } = claimMissionRewards(
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

    // Save dynamic loot to inventory
    if (lootedItems && lootedItems.length > 0) {
      setInventory(prev => {
        const nextInv = [...prev];
        lootedItems.forEach(loot => {
          if (loot.type === "material" || loot.type === "consumable") {
            const existing = nextInv.find(item => item.id === loot.id);
            if (existing) {
              existing.qty += loot.qty;
              return;
            }
          }
          // Unique item ID mapping for equipment
          const newInst = {
            ...loot,
            id: (loot.type === "weapon" || loot.type === "armor") ? `${loot.id}-${Date.now()}-${Math.floor(Math.random() * 1000)}` : loot.id
          };
          nextInv.push(newInst);
        });
        saveInventory(identifier, nextInv);
        return nextInv;
      });
    }
    
    setLevelUpMessage(lvlMsg);
    setWorldEventsMessage(wldMsg);

    // Reset Flow states
    setActiveMission(null);
    setMissionFlow(null);
    setSelectedOption(null);
    setMissionOutcome(null);
  };

  const getItemMetadata = (item: InventoryItem) => {
    const baseId = item.id.replace(/-equipped$/, "");
    
    // Acquired From logic
    let acquiredFrom = "Operational Scavenge // Mission Rewards";
    if (item.type === "weapon" || item.type === "armor") {
      acquiredFrom = "Sector Operations // Faction Armoury";
    } else if (item.category === "Medical") {
      acquiredFrom = "Sector Alpha / Gamma Medical Depots";
    } else if (item.category === "Materials") {
      acquiredFrom = "Sectors Beta, Delta, Epsilon Scrap Hubs";
    }

    // Crafting Usage logic
    const craftedIn = CRAFTING_RECIPES.filter(r => 
      r.ingredients.some(ing => ing.itemId === baseId)
    ).map(r => r.name);
    
    const upgradedIn = UPGRADE_RECIPES.filter(r => 
      r.ingredients.some(ing => ing.itemId === baseId) || r.targetItemId === baseId
    ).map(r => r.name);

    const allUsages = Array.from(new Set([...craftedIn, ...upgradedIn]));
    const craftingUsage = allUsages.length > 0 ? allUsages.join(", ") : "None (End Item)";

    return {
      acquiredFrom,
      craftingUsage,
      category: item.category || item.type.toUpperCase(),
      slot: item.slot || "None",
      requiredLevel: item.itemLevel || 1,
      status: item.equipped ? "EQUIPPED" : "UNASSIGNED"
    };
  };

  const equipItemInInventory = (inv: InventoryItem[], itemIdToEquip: string, itemSlot: string, isEquippedAlready: boolean): InventoryItem[] => {
    let nextInv = inv.map(i => ({ ...i }));
    
    // 1. Unequip any item currently equipped in the same slot
    const currentEquippedIndex = nextInv.findIndex(i => i.equipped && i.slot === itemSlot);
    if (currentEquippedIndex !== -1) {
      const currentEquipped = nextInv[currentEquippedIndex];
      currentEquipped.equipped = false;
      const baseId = currentEquipped.id.replace(/-equipped$/, "");
      currentEquipped.id = baseId;
      
      // Check if we can merge it with an existing unequipped stack
      const existingUnequippedIndex = nextInv.findIndex(i => !i.equipped && i.id === baseId);
      if (existingUnequippedIndex !== -1 && existingUnequippedIndex !== currentEquippedIndex) {
        nextInv[existingUnequippedIndex].qty += currentEquipped.qty;
        nextInv.splice(currentEquippedIndex, 1);
      }
    }

    // 2. Equip the new item
    const targetIndex = nextInv.findIndex(i => i.id === itemIdToEquip && !i.equipped);
    if (targetIndex !== -1) {
      const targetItem = nextInv[targetIndex];
      if (targetItem.qty > 1) {
        // Split the stack
        targetItem.qty -= 1;
        const baseId = targetItem.id.replace(/-equipped$/, "");
        const equippedItem: InventoryItem = {
          ...targetItem,
          id: `${baseId}-equipped`,
          qty: 1,
          equipped: true,
        };
        nextInv.push(equippedItem);
      } else {
        // Just mark it as equipped
        targetItem.equipped = true;
        const baseId = targetItem.id.replace(/-equipped$/, "");
        targetItem.id = `${baseId}-equipped`;
      }
    }

    return nextInv;
  };

  const unequipItemInInventory = (inv: InventoryItem[], slotName: string): InventoryItem[] => {
    let nextInv = inv.map(i => ({ ...i }));
    const targetIndex = nextInv.findIndex(i => i.equipped && i.slot === slotName);
    if (targetIndex !== -1) {
      const targetItem = nextInv[targetIndex];
      targetItem.equipped = false;
      const baseId = targetItem.id.replace(/-equipped$/, "");
      targetItem.id = baseId;

      // Check if we can merge it with an existing unequipped stack
      const existingUnequippedIndex = nextInv.findIndex(i => !i.equipped && i.id === baseId);
      if (existingUnequippedIndex !== -1 && existingUnequippedIndex !== targetIndex) {
        nextInv[existingUnequippedIndex].qty += targetItem.qty;
        nextInv.splice(targetIndex, 1);
      }
    }
    return nextInv;
  };

  const updateSelectedAfterInventoryChange = (newInv: InventoryItem[], oldItem: InventoryItem | null, actionType: "equip" | "unequip" | "upgrade" | "use") => {
    if (!oldItem) return null;
    const baseId = oldItem.id.replace(/-equipped$/, "");
    
    if (actionType === "equip") {
      const found = newInv.find(i => i.equipped && i.id.replace(/-equipped$/, "") === baseId);
      return found || null;
    }
    
    if (actionType === "unequip") {
      const found = newInv.find(i => !i.equipped && i.id.replace(/-equipped$/, "") === baseId);
      return found || null;
    }

    if (actionType === "upgrade" || actionType === "use") {
      const found = newInv.find(i => i.id === oldItem.id);
      return found || null;
    }
    
    return null;
  };

  // Check if item meets class and faction reputation requirements
  const canEquipItem = (item: InventoryItem) => {
    if (!profile) return { can: false, reason: "No profile loaded" };

    // Slot compatibility checks
    if (item.type === "material") {
      return { can: false, reason: "Material items cannot be equipped" };
    }
    if (item.type === "consumable") {
      return { can: false, reason: "Consumable items cannot occupy equipment slots" };
    }
    if (!item.slot || item.slot === "None") {
      return { can: false, reason: "This item does not have a valid equipment slot" };
    }
    
    // Class check
    if (item.classRequirement && item.classRequirement !== "None" && item.classRequirement !== profile.class) {
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

    const newInventory = equipItemInInventory(inventory, item.id, slot, item.equipped || false);
    setInventory(newInventory);
    
    const updatedSelection = updateSelectedAfterInventoryChange(newInventory, item, "equip");
    setSelectedInventoryItem(updatedSelection);

    // Persist
    saveInventory(identifier, newInventory);
  };

  const handleUnequip = (slotName: string) => {
    if (!profile) return;
    const identifier = authIdentifier || (publicKey ? publicKey.toString() : "offline-operative");
    
    const newInventory = unequipItemInInventory(inventory, slotName);
    setInventory(newInventory);

    const updatedSelection = updateSelectedAfterInventoryChange(newInventory, selectedInventoryItem, "unequip");
    setSelectedInventoryItem(updatedSelection);

    // Persist
    saveInventory(identifier, newInventory);
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

  const getEffectiveStats = () => {
    const base = {
      ...DEFAULT_STATS,
      ...(profile?.stats || {})
    };
    if (equippedGear) {
      Object.values(equippedGear).forEach(item => {
        if (item && item.stats) {
          Object.entries(item.stats).forEach(([statName, val]) => {
            const key = statName.toLowerCase().replace(/_/g, "");
            let targetKey: keyof UserStats | null = null;
            if (key === "threatawareness" || key === "threatdetection" || key === "threat") targetKey = "threat_awareness";
            else if (key === "operationaldiscipline" || key === "discipline") targetKey = "operational_discipline";
            else if (key === "psychologicalstability" || key === "stability") targetKey = "psychological_stability";
            else if (key === "technicalpreparedness" || key === "preparedness") targetKey = "technical_preparedness";
            else if (key === "adaptability") targetKey = "adaptability";
            else if (key === "resourcefulness") targetKey = "resourcefulness";
            else if (key === "surveillanceresistance" || key === "stealth" || key === "obfuscate") targetKey = "surveillance_resistance";
            
            if (targetKey && base[targetKey] !== undefined) {
              const numericVal = typeof val === "number" ? val : parseFloat(String(val)) || 0;
              base[targetKey] = Math.min(100, Math.max(0, base[targetKey] + numericVal));
            }
          });
        }
      });
    }
    return base;
  };

  const getEffectiveTacticalStats = () => {
    const base = {
      maxHp: 100,
      armor: 0,
      resistance: 0,
      detection: 50,
      mobility: 100,
      capacity: 15,
      medEfficiency: 100,
      resEfficiency: 100
    };
    if (equippedGear) {
      Object.values(equippedGear).forEach(item => {
        if (item && item.stats) {
          Object.entries(item.stats).forEach(([statName, val]) => {
            const key = statName.toLowerCase().replace(/_/g, "");
            const numericVal = typeof val === "number" ? val : parseFloat(String(val)) || 0;
            if (key === "shield" || key === "mitigation" || key === "armor") {
              base.armor += numericVal;
            } else if (key === "filterefficiency" || key === "resistance") {
              base.resistance += numericVal;
            } else if (key === "threatdetection" || key === "detection" || key === "awareness") {
              base.detection += numericVal;
            } else if (key === "speed" || key === "mobility") {
              base.mobility += numericVal;
            } else if (key === "slots" || key === "loadcapacity") {
              base.capacity += numericVal;
            } else if (key === "heal" || key === "medicalefficiency" || key === "medefficiency") {
              base.medEfficiency += numericVal;
            } else if (key === "decryptspeed" || key === "researchefficiency" || key === "resefficiency") {
              base.resEfficiency += numericVal;
            }
          });
        }
      });
    }
    return base;
  };

  const profileStats = getEffectiveStats();
  const tacticalStats = getEffectiveTacticalStats();
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
  // Only show AFTER profile has loaded AND class/faction are genuinely missing AND intro story completed
  if (!loading && profile && completedOnboarding && (profile.class === "None" || profile.faction === "None" || !profile.class || !profile.faction)) {
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
  if (!booted) {
    return (
      <div style={{
        minHeight: "100vh",
        background: "#050505",
        color: "#00ffcc",
        fontFamily: "var(--mono)",
        padding: "40px",
        display: "flex",
        flexDirection: "column",
        justifyContent: "center",
        alignItems: "flex-start",
        gap: "12px",
        position: "relative",
        overflow: "hidden"
      }}>
        {/* CRT Scanline */}
        <div className="crt-scanlines" />
        
        {/* Terminal Header */}
        <div style={{ display: "flex", alignItems: "center", gap: "12px", marginBottom: "20px" }}>
          <div style={{ width: "12px", height: "12px", background: "#00ffcc", borderRadius: "50%", animation: "alert-blink 1.5s ease-in-out infinite" }} />
          <span style={{ fontSize: "16px", fontWeight: "bold", letterSpacing: "0.15em" }}>RED QUEEN SECURE BOOT MATRIX</span>
        </div>

        {/* Boot Logs */}
        <div style={{ display: "flex", flexDirection: "column", gap: "8px", maxWidth: "600px", width: "100%" }}>
          {bootLogs.map((log, idx) => (
            <div key={idx} style={{ fontSize: "14px", borderLeft: "2px solid #00ffcc", paddingLeft: "12px", color: (log && log.startsWith("[OK]")) ? "#00ffcc" : "#fff" }}>
              {log || ""}
            </div>
          ))}
          <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            <span style={{ color: "#00ffcc" }}>&gt;</span>
            <span style={{ width: "8px", height: "15px", background: "#00ffcc", animation: "alert-blink 1s steps(2, start) infinite" }} />
          </div>
        </div>
      </div>
    );
  }

  return (
    <AccessGuard>
      {!completedOnboarding && profile && (
        <div style={{
          position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", zIndex: 999999,
          background: "#020202", display: "flex", alignItems: "center", justifyContent: "center",
          padding: "40px", boxSizing: "border-box", overflowY: "auto"
        }}>
          {/* Retro scanlines */}
          <div className="crt-scanlines" />
          
          {/* Onboarding Panel card */}
          <div className="panel holo-noise animate-flicker" style={{
            maxWidth: "800px", width: "100%", background: "#050505", border: "2px solid var(--accent)",
            boxShadow: "0 0 40px rgba(255, 77, 77, 0.15)", borderRadius: "4px", padding: "40px",
            position: "relative", boxSizing: "border-box"
          }}>
            {/* Accent corners */}
            <div style={{ position: "absolute", top: "12px", left: "12px", width: "20px", height: "20px", borderTop: "3px solid var(--accent)", borderLeft: "3px solid var(--accent)" }} />
            <div style={{ position: "absolute", top: "12px", right: "12px", width: "20px", height: "20px", borderTop: "3px solid var(--accent)", borderRight: "3px solid var(--accent)" }} />
            <div style={{ position: "absolute", bottom: "12px", left: "12px", width: "20px", height: "20px", borderBottom: "3px solid var(--accent)", borderLeft: "3px solid var(--accent)" }} />
            <div style={{ position: "absolute", bottom: "12px", right: "12px", width: "20px", height: "20px", borderBottom: "3px solid var(--accent)", borderRight: "3px solid var(--accent)" }} />

            {/* Steps tracker indicator */}
            <div style={{ display: "flex", justifyContent: "center", gap: "10px", marginBottom: "30px" }}>
              {[1, 2, 3, 4].map(step => (
                <div key={step} style={{
                  width: "40px", height: "4px",
                  background: gameplayOnboardingStep >= step ? "var(--accent)" : "rgba(255,255,255,0.08)",
                  transition: "all 0.3s"
                }} />
              ))}
            </div>

            {gameplayOnboardingStep === 1 && (
              <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                <div style={{ borderBottom: "1px dashed rgba(255,255,255,0.1)", paddingBottom: "16px" }}>
                  <span style={{ fontFamily: "var(--mono)", fontSize: "11px", color: "var(--text-dim)", letterSpacing: "0.2em", display: "block", marginBottom: "6px" }}>
                    SOLVIVAL CORPORATION // AUTONOMOUS SURVIVAL NETWORK
                  </span>
                  <h1 style={{ fontFamily: "var(--title-font)", fontSize: "28px", color: "#fff", fontWeight: "900", letterSpacing: "0.1em", margin: 0 }}>
                    RED QUEEN INITIALIZATION
                  </h1>
                </div>

                <div style={{ fontFamily: "var(--mono)", fontSize: "13.5px", color: "rgba(255,255,255,0.85)", lineHeight: "1.8", display: "flex", flexDirection: "column", gap: "14px" }}>
                  <p style={{ margin: 0, color: "#00ffcc", fontWeight: "bold" }}>▶ Identity confirmed.</p>
                  <p style={{ margin: 0, color: "#00ffcc", fontWeight: "bold" }}>▶ Operator profile synchronized.</p>
                  <p style={{ margin: 0, color: "#00ffcc", fontWeight: "bold" }}>▶ Secure uplink established.</p>
                  <p style={{ margin: 0, marginTop: "10px" }}>
                    You are entering the <strong>RED QUEEN Operational Network</strong>.
                  </p>
                  <p style={{ margin: 0 }}>
                    This system monitors global threats, coordinates recovery operations and evaluates every decision made by active Operatives.
                  </p>
                  <p style={{ margin: 0, color: "var(--accent)", fontWeight: "bold" }}>
                    Your survival is no longer a personal matter. It is now part of humanity's recovery protocol.
                  </p>
                </div>

                <button
                  onClick={() => setGameplayOnboardingStep(2)}
                  className="btn btn-primary"
                  style={{
                    padding: "16px 24px", fontFamily: "var(--title-font)", fontSize: "14px", fontWeight: "bold",
                    background: "var(--accent)", color: "#000", border: "none", cursor: "pointer", letterSpacing: "0.1em",
                    marginTop: "20px"
                  }}
                >
                  INITIALIZE SYSTEM
                </button>
              </div>
            )}

            {gameplayOnboardingStep === 2 && (
              <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                <div style={{ borderBottom: "1px dashed rgba(255,255,255,0.1)", paddingBottom: "16px" }}>
                  <span style={{ fontFamily: "var(--mono)", fontSize: "11px", color: "var(--text-dim)", letterSpacing: "0.2em", display: "block", marginBottom: "6px" }}>
                    SIMULATION TELEMETRY ARCHIVES
                  </span>
                  <h1 style={{ fontFamily: "var(--title-font)", fontSize: "28px", color: "#fff", fontWeight: "900", letterSpacing: "0.1em", margin: 0 }}>
                    GLOBAL STATUS REPORT
                  </h1>
                </div>

                <div style={{ fontFamily: "var(--mono)", fontSize: "13.5px", color: "rgba(255,255,255,0.85)", lineHeight: "1.8", display: "flex", flexDirection: "column", gap: "14px" }}>
                  <p style={{ margin: 0 }}>
                    The world did not collapse overnight. Years of pandemics, infrastructure failures, environmental disasters and unidentified biological anomalies slowly pushed civilization beyond recovery.
                  </p>
                  <p style={{ margin: 0 }}>
                    Entire regions disappeared from communication. Governments lost operational control.
                  </p>
                  <p style={{ margin: 0 }}>
                    To coordinate humanity's survival, Solvival Corporation activated <strong>RED QUEEN</strong> — an autonomous strategic intelligence responsible for monitoring global threats and directing recovery operations.
                  </p>
                  <p style={{ margin: 0, color: "#00ffcc", fontWeight: "bold" }}>
                    Every successful mission restores another piece of the world. Every failed mission allows the threat to spread.
                  </p>
                </div>

                <div style={{ display: "flex", gap: "16px", marginTop: "20px" }}>
                  <button
                    onClick={() => setGameplayOnboardingStep(1)}
                    style={{
                      padding: "16px 24px", fontFamily: "var(--title-font)", fontSize: "14px", fontWeight: "bold",
                      background: "none", color: "var(--text-dim)", border: "1px solid var(--border)", cursor: "pointer",
                      letterSpacing: "0.1em"
                    }}
                  >
                    BACK
                  </button>
                  <button
                    onClick={() => setGameplayOnboardingStep(3)}
                    className="btn btn-primary"
                    style={{
                      flex: 1, padding: "16px 24px", fontFamily: "var(--title-font)", fontSize: "14px", fontWeight: "bold",
                      background: "var(--accent)", color: "#000", border: "none", cursor: "pointer", letterSpacing: "0.1em"
                    }}
                  >
                    CONTINUE
                  </button>
                </div>
              </div>
            )}

            {gameplayOnboardingStep === 3 && (
              <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                <div style={{ borderBottom: "1px dashed rgba(255,255,255,0.1)", paddingBottom: "16px" }}>
                  <span style={{ fontFamily: "var(--mono)", fontSize: "11px", color: "var(--text-dim)", letterSpacing: "0.2em", display: "block", marginBottom: "6px" }}>
                    OPERATOR CLEARANCE & ROLE DEFINITIONS
                  </span>
                  <h1 style={{ fontFamily: "var(--title-font)", fontSize: "28px", color: "#fff", fontWeight: "900", letterSpacing: "0.1em", margin: 0 }}>
                    OPERATIVE DOSSIER
                  </h1>
                </div>

                <div style={{ fontFamily: "var(--mono)", fontSize: "13.5px", color: "rgba(255,255,255,0.85)", lineHeight: "1.8", display: "flex", flexDirection: "column", gap: "14px" }}>
                  <p style={{ margin: 0 }}>
                    You are not a soldier. You are an <strong>Operative</strong>.
                  </p>
                  <p style={{ margin: 0 }}>
                    Your responsibility is to enter unstable sectors, recover strategic resources, contain anomalies, secure survivors and reconnect humanity's operational network.
                  </p>
                  <p style={{ margin: 0 }}>
                    RED QUEEN evaluates every operation. Your decisions permanently affect the campaign.
                  </p>
                  <p style={{ margin: 0, color: "#00ffcc", fontWeight: "bold" }}>
                    Every recovered sector brings civilization one step closer to rebuilding.
                  </p>
                </div>

                <div style={{ display: "flex", gap: "16px", marginTop: "20px" }}>
                  <button
                    onClick={() => setGameplayOnboardingStep(2)}
                    style={{
                      padding: "16px 24px", fontFamily: "var(--title-font)", fontSize: "14px", fontWeight: "bold",
                      background: "none", color: "var(--text-dim)", border: "1px solid var(--border)", cursor: "pointer",
                      letterSpacing: "0.1em"
                    }}
                  >
                    BACK
                  </button>
                  <button
                    onClick={() => setGameplayOnboardingStep(4)}
                    className="btn btn-primary"
                    style={{
                      flex: 1, padding: "16px 24px", fontFamily: "var(--title-font)", fontSize: "14px", fontWeight: "bold",
                      background: "var(--accent)", color: "#000", border: "none", cursor: "pointer", letterSpacing: "0.1em"
                    }}
                  >
                    MISSION PROTOCOL
                  </button>
                </div>
              </div>
            )}

            {gameplayOnboardingStep === 4 && (
              <div style={{ display: "flex", flexDirection: "column", gap: "24px" }}>
                <div style={{ borderBottom: "1px dashed rgba(255,255,255,0.1)", paddingBottom: "16px" }}>
                  <span style={{ fontFamily: "var(--mono)", fontSize: "11px", color: "var(--text-dim)", letterSpacing: "0.2em", display: "block", marginBottom: "6px" }}>
                    TACTICAL ENGAGEMENT MATRIX
                  </span>
                  <h1 style={{ fontFamily: "var(--title-font)", fontSize: "28px", color: "#fff", fontWeight: "900", letterSpacing: "0.1em", margin: 0 }}>
                    HOW TO PLAY
                  </h1>
                </div>

                {/* Cards Grid */}
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px" }}>
                  <div style={{ background: "#0c0c0c", border: "1px solid rgba(255,255,255,0.06)", padding: "16px", borderRadius: "2px" }}>
                    <div style={{ fontFamily: "var(--title-font)", fontSize: "12px", color: "var(--accent)", fontWeight: "bold", marginBottom: "6px" }}>
                      01 / SELECT A SECTOR
                    </div>
                    <p style={{ fontFamily: "var(--mono)", fontSize: "11px", color: "rgba(255,255,255,0.7)", margin: 0, lineHeight: "1.5" }}>
                      Choose an available operational sector from the Tactical Map. Each sector contains different threats, objectives and rewards.
                    </p>
                  </div>
                  
                  <div style={{ background: "#0c0c0c", border: "1px solid rgba(255,255,255,0.06)", padding: "16px", borderRadius: "2px" }}>
                    <div style={{ fontFamily: "var(--title-font)", fontSize: "12px", color: "var(--accent)", fontWeight: "bold", marginBottom: "6px" }}>
                      02 / REVIEW INTELLIGENCE
                    </div>
                    <p style={{ fontFamily: "var(--mono)", fontSize: "11px", color: "rgba(255,255,255,0.7)", margin: 0, lineHeight: "1.5" }}>
                      Study environmental conditions, faction activity, contamination and mission objectives before deployment.
                    </p>
                  </div>

                  <div style={{ background: "#0c0c0c", border: "1px solid rgba(255,255,255,0.06)", padding: "16px", borderRadius: "2px" }}>
                    <div style={{ fontFamily: "var(--title-font)", fontSize: "12px", color: "var(--accent)", fontWeight: "bold", marginBottom: "6px" }}>
                      03 / COMPLETE OPERATIONS
                    </div>
                    <p style={{ fontFamily: "var(--mono)", fontSize: "11px", color: "rgba(255,255,255,0.7)", margin: 0, lineHeight: "1.5" }}>
                      Finish mission objectives, survive the deployment and recover valuable resources.
                    </p>
                  </div>

                  <div style={{ background: "#0c0c0c", border: "1px solid rgba(255,255,255,0.06)", padding: "16px", borderRadius: "2px" }}>
                    <div style={{ fontFamily: "var(--title-font)", fontSize: "12px", color: "var(--accent)", fontWeight: "bold", marginBottom: "6px" }}>
                      04 / UPGRADE YOUR OPERATIVE
                    </div>
                    <p style={{ fontFamily: "var(--mono)", fontSize: "11px", color: "rgba(255,255,255,0.7)", margin: 0, lineHeight: "1.5" }}>
                      Earn XP, improve your equipment, increase your BIO-SCORE and unlock new sectors.
                    </p>
                  </div>
                </div>

                <div style={{ textAlign: "center", padding: "10px", background: "rgba(0, 255, 204, 0.05)", border: "1px dashed rgba(0, 255, 204, 0.3)", borderRadius: "2px", marginTop: "10px" }}>
                  <span style={{ fontFamily: "var(--mono)", fontSize: "11.5px", color: "#00ffcc", fontWeight: "bold" }}>
                    Every completed mission permanently changes the campaign world.
                  </span>
                </div>

                <div style={{ display: "flex", gap: "16px", marginTop: "20px" }}>
                  <button
                    onClick={() => setGameplayOnboardingStep(3)}
                    style={{
                      padding: "16px 24px", fontFamily: "var(--title-font)", fontSize: "14px", fontWeight: "bold",
                      background: "none", color: "var(--text-dim)", border: "1px solid var(--border)", cursor: "pointer",
                      letterSpacing: "0.1em"
                    }}
                  >
                    BACK
                  </button>
                  <button
                    onClick={finishOnboarding}
                    className="btn btn-primary"
                    style={{
                      flex: 1, padding: "16px 24px", fontFamily: "var(--title-font)", fontSize: "14px", fontWeight: "bold",
                      background: "var(--accent)", color: "#000", border: "none", cursor: "pointer", letterSpacing: "0.1em"
                    }}
                  >
                    ENTER COMMAND HUB
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      )}
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
            <span style={{ width: "10px", height: "10px", background: getFactionColor(profile?.faction || ""), borderRadius: "50%", boxShadow: `0 0 12px ${getFactionColor(profile?.faction || "")}` }} />
            <span style={{ fontFamily: "var(--title-font)", fontSize: "15px", fontWeight: "900", letterSpacing: "0.15em", color: "#fff" }}>
              {profile?.name} // {profile?.faction?.toUpperCase()}
            </span>
          </div>
          <span style={{ color: "rgba(255,255,255,0.15)", fontFamily: "var(--mono)", fontSize: "14px" }}>|</span>
          <span style={{ fontFamily: "var(--mono)", fontSize: "13px", color: "var(--text-dim)" }}>
            HP: <span style={{ color: (profile?.health || 100) > 30 ? "#00ffcc" : "#ff4d4d", fontWeight: "bold" }}>{profile?.health || 100} / 100</span>
          </span>
          <span style={{ color: "rgba(255,255,255,0.15)", fontFamily: "var(--mono)", fontSize: "14px" }}>|</span>
          <span style={{ fontFamily: "var(--mono)", fontSize: "13px", color: "var(--text-dim)" }}>
            DISCIPLINE: <span style={{ color: "var(--accent)", fontWeight: "bold" }}>{profile?.class?.toUpperCase()}</span>
          </span>
          <span style={{ color: "rgba(255,255,255,0.15)", fontFamily: "var(--mono)", fontSize: "14px" }}>|</span>
          <span style={{ fontFamily: "var(--mono)", fontSize: "13px", color: "var(--text-dim)" }}>
            CREDITS: <span style={{ color: "#f0c929", fontWeight: "bold" }}>{profile?.credits || 0} CR</span>
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "rgba(0, 255, 204, 0.06)", border: "1px solid rgba(0, 255, 204, 0.2)", padding: "4px 10px", borderRadius: "2px" }}>
            <span style={{ fontFamily: "var(--mono)", fontSize: "12px", color: "#00ffcc", fontWeight: "bold", letterSpacing: "0.05em" }}>BIO-SCORE: {currentBioScore}</span>
          </div>
          
          <div style={{ display: "flex", alignItems: "center", gap: "8px", background: "rgba(255, 77, 77, 0.06)", border: "1px solid rgba(255, 77, 77, 0.2)", padding: "4px 10px", borderRadius: "2px" }}>
            <span style={{ fontFamily: "var(--mono)", fontSize: "12px", color: "var(--accent)", fontWeight: "bold", letterSpacing: "0.05em" }}>CLEARANCE: {clearanceTier.label}</span>
          </div>

          <button
            onClick={async () => {
              if (!confirm("REASSIGNMENT: This will reset your Faction, Class, and Role. Your campaign progress will be preserved. Continue?")) return;
              const identifier = authIdentifier || (publicKey ? publicKey.toString() : "offline-operative");
              // Clear local cache
              localStorage.removeItem(`rq_ops_profile:${identifier}`);
              localStorage.removeItem(`rq_ops_inventory:${identifier}`);
              localStorage.removeItem(`rq_ops_equipped:${identifier}`);
              // Reset class/role/faction + completedOnboarding in DB so character creation re-runs
              try {
                await fetch("/api/profile", {
                  method: "POST",
                  headers: getHeaders(),
                  body: JSON.stringify({
                    wallet_address: identifier,
                    class: "None",
                    role: "None",
                    faction: "None",
                    world_state: { ...(profile?.worldState || {}), completedOnboarding: false },
                  })
                });
              } catch (e) { console.warn("Re-initialize DB reset failed:", e); }
              // Reset local React state — will trigger character creation screen
              if (profile) {
                const resetProfile = {
                  ...profile,
                  faction: "None",
                  class: "None",
                  role: "None",
                  worldState: { ...(profile.worldState || {}), completedOnboarding: false }
                };
                setProfile(resetProfile);
              }
              setCompletedOnboarding(false);
              setGameplayOnboardingStep(1);
              setActiveTab("center");
            }}
            className="btn btn-ghost"
            style={{ fontSize: "11px", padding: "4px 10px", borderColor: "rgba(255,0,0,0.2)", color: "#ff4d4d", cursor: "pointer", fontWeight: "bold" }}
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
          <div style={{ fontFamily: "var(--mono)", fontSize: "12px", color: "var(--text-dim)", letterSpacing: "0.2em", marginBottom: "6px", fontWeight: "bold" }}>
            ▶ OPERATIONAL DECKS
          </div>
          
          <button
            onClick={() => { setActiveTab("center"); try { mainframeAudio.playSweep(); } catch(e){} }}
            style={{
              width: "100%", padding: "12px 14px", border: "1px solid var(--border)",
              background: activeTab === "center" ? "rgba(255, 77, 77, 0.06)" : "none",
              color: activeTab === "center" ? "var(--accent)" : "var(--text-dim)",
              borderColor: activeTab === "center" ? "rgba(255, 77, 77, 0.3)" : "var(--border)",
              fontFamily: "var(--title-font)", fontSize: "13px", textAlign: "left", cursor: "pointer",
              transition: "all 0.18s", borderRadius: "2px", fontWeight: "bold", letterSpacing: "0.08em"
            }}
          >
            🛰️ COMMAND HUB
          </button>

          <button
            onClick={() => { setActiveTab("profile"); try { mainframeAudio.playSweep(); } catch(e){} }}
            style={{
              width: "100%", padding: "12px 14px", border: "1px solid var(--border)",
              background: activeTab === "profile" ? "rgba(255, 77, 77, 0.06)" : "none",
              color: activeTab === "profile" ? "var(--accent)" : "var(--text-dim)",
              borderColor: activeTab === "profile" ? "rgba(255, 77, 77, 0.3)" : "var(--border)",
              fontFamily: "var(--title-font)", fontSize: "13px", textAlign: "left", cursor: "pointer",
              transition: "all 0.18s", borderRadius: "2px", fontWeight: "bold", letterSpacing: "0.08em"
            }}
          >
            👤 OPERATIVE DOSSIER
          </button>

          <button
            onClick={() => { setActiveTab("inventory"); try { mainframeAudio.playSweep(); } catch(e){} }}
            style={{
              width: "100%", padding: "12px 14px", border: "1px solid var(--border)",
              background: activeTab === "inventory" ? "rgba(255, 77, 77, 0.06)" : "none",
              color: activeTab === "inventory" ? "var(--accent)" : "var(--text-dim)",
              borderColor: activeTab === "inventory" ? "rgba(255, 77, 77, 0.3)" : "var(--border)",
              fontFamily: "var(--title-font)", fontSize: "13px", textAlign: "left", cursor: "pointer",
              transition: "all 0.18s", borderRadius: "2px", fontWeight: "bold", letterSpacing: "0.08em"
            }}
          >
            📦 EQUIPMENT DECK
          </button>

          <button
            onClick={() => { setActiveTab("settings"); try { mainframeAudio.playSweep(); } catch(e){} }}
            style={{
              width: "100%", padding: "12px 14px", border: "1px solid var(--border)",
              background: activeTab === "settings" ? "rgba(255, 77, 77, 0.06)" : "none",
              color: activeTab === "settings" ? "var(--accent)" : "var(--text-dim)",
              borderColor: activeTab === "settings" ? "rgba(255, 77, 77, 0.3)" : "var(--border)",
              fontFamily: "var(--title-font)", fontSize: "13px", textAlign: "left", cursor: "pointer",
              transition: "all 0.18s", borderRadius: "2px", fontWeight: "bold", letterSpacing: "0.08em"
            }}
          >
            ⚙️ SETTINGS
          </button>

          <button
            onClick={() => { setActiveTab("manual"); try { mainframeAudio.playSweep(); } catch(e){} }}
            style={{
              width: "100%", padding: "12px 14px", border: "1px solid var(--border)",
              background: activeTab === "manual" ? "rgba(255, 77, 77, 0.06)" : "none",
              color: activeTab === "manual" ? "var(--accent)" : "var(--text-dim)",
              borderColor: activeTab === "manual" ? "rgba(255, 77, 77, 0.3)" : "var(--border)",
              fontFamily: "var(--title-font)", fontSize: "13px", textAlign: "left", cursor: "pointer",
              transition: "all 0.18s", borderRadius: "2px", fontWeight: "bold", letterSpacing: "0.08em"
            }}
          >
            📖 SYSTEM GUIDE
          </button>

          <div style={{ marginTop: "auto", borderTop: "1px solid rgba(255,255,255,0.06)", paddingTop: "16px" }}>
            <Link
              href="/"
              style={{
                display: "block", width: "100%", padding: "10px 12px", border: "1px solid var(--border)",
                background: "none", color: "var(--text-dim)", fontFamily: "var(--title-font)", fontSize: "12px",
                textDecoration: "none", textAlign: "center", borderRadius: "2px", fontWeight: "bold", letterSpacing: "0.08em"
              }}
            >
              ← DISCONNECT HUB
            </Link>
          </div>
        </aside>

        {/* Content Pane - Viewport bound game HUD structure */}
        <main style={{ flex: 1, padding: "20px", background: "#030303", display: "flex", flexDirection: "column", height: "100%", boxSizing: "border-box", overflowY: "auto" }}>
          
          {/* Critical Vitality Warning Banner */}
          {profile && profile.health < 30 && (
            <div style={{
              background: "rgba(255, 77, 77, 0.12)",
              border: "1px solid var(--accent)",
              padding: "8px 14px",
              marginBottom: "10px",
              borderRadius: "2px",
              fontFamily: "var(--mono)",
              fontSize: "10px",
              color: "var(--accent)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              boxShadow: "0 0 10px rgba(255, 77, 77, 0.15)",
              animation: "blink 1.6s infinite",
              flexShrink: 0
            }}>
              <span>⚠️ [WARNING: BIOMETRICS CRITICAL] Operative vital signal at {profile.health} HP. Cellular stabilization required.</span>
              <span style={{ fontWeight: "bold" }}>STABILIZATION HUB ENCRYPTED //</span>
            </div>
          )}

          {/* TAB 1: COMMAND CENTER (HUD & OPERATIONS) */}
          {activeTab === "center" && (
            <div style={{ display: "grid", gridTemplateColumns: "7.2fr 2.8fr", gap: "16px", width: "100%" }}>
              
              {/* LEFT COLUMN: HUD, MAP & TELEMETRY */}
              <div style={{ display: "flex", flexDirection: "column", gap: "16px", width: "100%" }}>
                
                {/* Global Status HUD */}
                <div className="panel holo-noise" style={{
                  display: "grid", gridTemplateColumns: "repeat(5, 1fr)", gap: "12px",
                  background: "rgba(8, 8, 8, 0.85)", border: "1px solid rgba(255, 77, 77, 0.15)",
                  padding: "10px 14px", borderRadius: "2px", fontFamily: "var(--mono)", fontSize: "9px"
                }}>
                  <div>
                    <span style={{ color: "rgba(255,255,255,0.65)", display: "block", fontSize: "10px", letterSpacing: "0.1em", fontWeight: "bold" }}>GLOBAL THREAT LEVEL</span>
                    <span style={{ color: "var(--accent)", fontWeight: "bold", fontSize: "13px", display: "inline-flex", alignItems: "center", gap: "4px", marginTop: "4px" }}>
                      <span style={{ width: "6px", height: "6px", background: "var(--accent)", borderRadius: "50%" }} className="animate-pulse" />
                      SEVERE // 78%
                    </span>
                  </div>
                  <div>
                    <span style={{ color: "rgba(255,255,255,0.65)", display: "block", fontSize: "10px", letterSpacing: "0.1em", fontWeight: "bold" }}>WORLD STABILITY</span>
                    <span style={{ color: "#ff4d4d", fontWeight: "bold", fontSize: "13px", display: "block", marginTop: "4px" }}>34% CRITICAL</span>
                  </div>
                  <div>
                    <span style={{ color: "rgba(255,255,255,0.65)", display: "block", fontSize: "10px", letterSpacing: "0.1em", fontWeight: "bold" }}>ACTIVE OUTBREAKS</span>
                    <span style={{ color: "#f0c929", fontWeight: "bold", fontSize: "13px", display: "block", marginTop: "4px" }}>3 SECTORS</span>
                  </div>
                  <div>
                    <span style={{ color: "rgba(255,255,255,0.65)", display: "block", fontSize: "10px", letterSpacing: "0.1em", fontWeight: "bold" }}>CRITICAL ALERTS</span>
                    <span style={{ color: "#00ffcc", fontWeight: "bold", fontSize: "12px", display: "block", marginTop: "4px", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                      ALPHA STABLE // DELTA ALERT
                    </span>
                  </div>
                  <div>
                    <span style={{ color: "rgba(255,255,255,0.65)", display: "block", fontSize: "10px", letterSpacing: "0.1em", fontWeight: "bold" }}>CAMPAIGN COMPLETE</span>
                    <span style={{ color: "#00ffcc", fontWeight: "bold", fontSize: "13px", display: "block", marginTop: "4px" }}>
                      {profile ? ((profile.completedMissions?.length || 0) / (missions?.length || 1) * 100).toFixed(1) : 0}%
                    </span>
                  </div>
                </div>

                {/* Interactive Map */}
                <div className="panel holo-noise" style={{
                  position: "relative", width: "100%", aspectRatio: "1.48", background: "#020202",
                  border: "2px solid rgba(255, 77, 77, 0.2)", boxShadow: "0 0 30px rgba(0, 0, 0, 0.9)",
                  display: "flex", flexDirection: "column", justifyItems: "center", justifyContent: "space-between",
                  overflow: "hidden"
                }}>
                  {/* Scanlines / Fog Overlay */}
                  <div className="scanline-overlay" />
                  <div style={{
                    position: "absolute", top: 0, left: 0, right: 0, bottom: 0,
                    background: "radial-gradient(circle at center, transparent 30%, rgba(2,2,2,0.9) 95%)",
                    pointerEvents: "none"
                  }} />

                  <div style={{ position: "absolute", top: "10px", left: "10px", width: "14px", height: "14px", borderTop: "2px solid var(--accent)", borderLeft: "2px solid var(--accent)", pointerEvents: "none" }} />
                  <div style={{ position: "absolute", top: "10px", right: "10px", width: "14px", height: "14px", borderTop: "2px solid var(--accent)", borderRight: "2px solid var(--accent)", pointerEvents: "none" }} />
                  <div style={{ position: "absolute", bottom: "10px", left: "10px", width: "14px", height: "14px", borderBottom: "2px solid var(--accent)", borderLeft: "2px solid var(--accent)", pointerEvents: "none" }} />
                  <div style={{ position: "absolute", bottom: "10px", right: "10px", width: "14px", height: "14px", borderBottom: "2px solid var(--accent)", borderRight: "2px solid var(--accent)", pointerEvents: "none" }} />

                  {/* Header info */}
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", zIndex: 1, borderBottom: "1px dashed rgba(255,255,255,0.06)", padding: "10px 14px", background: "rgba(5,5,5,0.7)" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <span style={{ width: "6px", height: "6px", background: "#ff4d4d", borderRadius: "50%" }} className="animate-pulse" />
                      <span style={{ fontFamily: "var(--mono)", fontSize: "12px", color: "var(--accent)", letterSpacing: "0.2em", fontWeight: "bold" }}>
                        OPERATIONAL NETWORK GRID
                      </span>
                    </div>
                    <span style={{ fontFamily: "var(--mono)", fontSize: "11.5px", color: "var(--text-dim)" }}>
                      GRID SYNCHRONIZATION: ONLINE // SELECT SECTOR
                    </span>
                  </div>

                  <div style={{ flex: 1, position: "relative" }}>
                    {mapAlert && (
                      <div style={{
                        position: "absolute", top: "12px", left: "50%", transform: "translateX(-50%)",
                        background: "rgba(255, 77, 77, 0.08)", border: "1px solid var(--accent)", padding: "8px 16px",
                        zIndex: 10, fontFamily: "var(--mono)", fontSize: "13px", color: "var(--accent)",
                        boxShadow: "0 0 15px rgba(255,77,77,0.15)", borderRadius: "2px"
                      }}>
                        {mapAlert}
                      </div>
                    )}

                    <svg width="100%" height="100%" viewBox="0 0 1000 600" preserveAspectRatio="xMidYMid meet" style={{ position: "absolute", top: 0, left: 0 }}>
                      <defs>
                        <style>{`
                          @keyframes scanline {
                            0% { transform: translateY(-100%); }
                            100% { transform: translateY(100%); }
                          }
                          @keyframes radar-pulse {
                            0% { r: 50; opacity: 0.1; }
                            50% { r: 250; opacity: 0.4; }
                            100% { r: 400; opacity: 0; }
                          }
                          @keyframes line-flow {
                            to { stroke-dashoffset: -20; }
                          }
                          @keyframes signal-ping {
                            0% { r: 2; opacity: 1; }
                            50% { r: 10; opacity: 0.5; }
                            100% { r: 18; opacity: 0; }
                          }
                          @keyframes scan-sweep {
                            0% { transform: translateX(0px); }
                            100% { transform: translateX(1000px); }
                          }
                          @keyframes slow-rotate {
                            0% { transform: rotate(0deg); }
                            100% { transform: rotate(360deg); }
                          }
                          .scanline-overlay {
                            background: linear-gradient(
                              to bottom,
                              rgba(255,255,255,0),
                              rgba(255,77,77,0.04) 50%,
                              rgba(255,255,255,0)
                            );
                            position: absolute;
                            top: 0; left: 0; right: 0; bottom: 0;
                            pointer-events: none;
                            animation: scanline 8s infinite linear;
                          }
                          .radar-glow {
                            animation: radar-pulse 6s infinite ease-out;
                          }
                          .progression-line {
                            stroke-dasharray: 6, 4;
                            animation: line-flow 1.5s infinite linear;
                          }
                          .threat-ping {
                            animation: signal-ping 2.5s infinite ease-out;
                          }
                          .sweeping-beam {
                            animation: scan-sweep 12s infinite linear;
                          }
                          .sector-poly {
                            transition: all 0.25s ease;
                          }
                          .sector-poly:hover {
                            fill-opacity: 0.22 !important;
                          }
                        `}</style>
                        
                        {/* Grid Pattern */}
                        <pattern id="map-grid-3" width="40" height="40" patternUnits="userSpaceOnUse">
                          <path d="M 40 0 L 0 0 0 40" fill="none" stroke="rgba(255, 77, 77, 0.03)" strokeWidth="0.5"/>
                        </pattern>
 
                        {/* Locked Hashed Pattern */}
                        <pattern id="lock-hatch" width="8" height="8" patternTransform="rotate(45 0 0)" patternUnits="userSpaceOnUse">
                          <rect width="8" height="8" fill="rgba(10, 10, 10, 0.45)" />
                          <line x1="0" y1="0" x2="0" y2="8" stroke="rgba(255, 255, 255, 0.09)" strokeWidth="1.5" />
                        </pattern>
 
                        {/* Glowing Filters */}
                        <filter id="glow-alpha" x="-20%" y="-20%" width="140%" height="140%">
                          <feGaussianBlur stdDeviation="5" result="blur"/>
                          <feMerge>
                            <feMergeNode in="blur"/>
                            <feMergeNode in="SourceGraphic"/>
                          </feMerge>
                        </filter>
                        <filter id="glow-beta" x="-20%" y="-20%" width="140%" height="140%">
                          <feGaussianBlur stdDeviation="5" result="blur"/>
                          <feMerge>
                            <feMergeNode in="blur"/>
                            <feMergeNode in="SourceGraphic"/>
                          </feMerge>
                        </filter>
                        <filter id="glow-gamma" x="-20%" y="-20%" width="140%" height="140%">
                          <feGaussianBlur stdDeviation="5" result="blur"/>
                          <feMerge>
                            <feMergeNode in="blur"/>
                            <feMergeNode in="SourceGraphic"/>
                          </feMerge>
                        </filter>
                        <filter id="glow-delta" x="-20%" y="-20%" width="140%" height="140%">
                          <feGaussianBlur stdDeviation="5" result="blur"/>
                          <feMerge>
                            <feMergeNode in="blur"/>
                            <feMergeNode in="SourceGraphic"/>
                          </feMerge>
                        </filter>
                        <filter id="glow-epsilon" x="-20%" y="-20%" width="140%" height="140%">
                          <feGaussianBlur stdDeviation="5" result="blur"/>
                          <feMerge>
                            <feMergeNode in="blur"/>
                            <feMergeNode in="SourceGraphic"/>
                          </feMerge>
                        </filter>
                        <filter id="glow-zeta" x="-20%" y="-20%" width="140%" height="140%">
                          <feGaussianBlur stdDeviation="5" result="blur"/>
                          <feMerge>
                            <feMergeNode in="blur"/>
                            <feMergeNode in="SourceGraphic"/>
                          </feMerge>
                        </filter>
                        <filter id="glow-omega" x="-20%" y="-20%" width="140%" height="140%">
                          <feGaussianBlur stdDeviation="5" result="blur"/>
                          <feMerge>
                            <feMergeNode in="blur"/>
                            <feMergeNode in="SourceGraphic"/>
                          </feMerge>
                        </filter>
                      </defs>
 
                      {/* Satellite map background - visibility increased by 30-40% */}
                      <image href="/tactical_satellite_map_bg.jpg" x="0" y="0" width="1000" height="600" opacity="0.55" style={{ filter: "brightness(0.9) contrast(1.15)" }} />
 
                      <rect width="100%" height="100%" fill="url(#map-grid-3)" />
 
                      {/* Radar sweep elements */}
                      <circle cx="500" cy="300" r="120" fill="none" stroke="rgba(255, 77, 77, 0.03)" strokeWidth="0.5" />
                      <circle cx="500" cy="300" r="260" fill="none" stroke="rgba(255, 77, 77, 0.02)" strokeWidth="0.5" />
                      <circle className="radar-glow" cx="500" cy="300" r="50" fill="none" stroke="rgba(255, 77, 77, 0.03)" strokeWidth="1" />
 
                      {/* Rotating Radar Sweep Line */}
                      <line
                        x1="500" y1="300" x2="500" y2="0"
                        stroke="rgba(255, 77, 77, 0.04)"
                        strokeWidth="1"
                        style={{
                          transformOrigin: "500px 300px",
                          animation: "slow-rotate 14s infinite linear",
                          pointerEvents: "none"
                        }}
                      />
 
                      {/* Scanning Sweep Beam */}
                      <line className="sweeping-beam" x1="0" y1="0" x2="0" y2="600" stroke="rgba(0, 255, 204, 0.15)" strokeWidth="1.5" style={{ pointerEvents: "none" }} />
 
                      {/* Blinking threat / telemetry pings */}
                      {[
                        { id: "ping-1", x: 240, y: 120 },
                        { id: "ping-2", x: 480, y: 240 },
                        { id: "ping-3", x: 720, y: 180 },
                        { id: "ping-4", x: 380, y: 480 },
                        { id: "ping-5", x: 810, y: 490 }
                      ].map((pt) => (
                        <g key={pt.id} style={{ pointerEvents: "none" }}>
                          <circle cx={pt.x} cy={pt.y} r="2.5" fill="#ff4d4d" />
                          <circle className="threat-ping" cx={pt.x} cy={pt.y} r="10" fill="none" stroke="#ff4d4d" strokeWidth="1" />
                        </g>
                      ))}
 
                      {/* Campaign progression animated connection lines */}
                      {[
                        { from: "sec-alpha", to: "sec-beta", x1: 160, y1: 140, x2: 390, y2: 105 },
                        { from: "sec-beta", to: "sec-delta", x1: 390, y1: 105, x2: 160, y2: 335 },
                        { from: "sec-beta", to: "sec-gamma", x1: 390, y1: 105, x2: 155, y2: 500 },
                        { from: "sec-delta", to: "sec-epsilon", x1: 160, y1: 335, x2: 415, y2: 300 },
                        { from: "sec-gamma", to: "sec-epsilon", x1: 155, y1: 500, x2: 415, y2: 300 },
                        { from: "sec-epsilon", to: "sec-zeta", x1: 415, y1: 300, x2: 680, y2: 135 },
                        { from: "sec-zeta", to: "sec-omega", x1: 680, y1: 135, x2: 660, y2: 500 }
                      ].map((conn, idx) => {
                        const fromUnlocked = profile?.worldState?.sectorStates?.[conn.from]
                          ? profile.worldState.sectorStates[conn.from].isUnlocked
                          : (profile?.worldState?.unlockedSectors?.includes(conn.from) || conn.from === "sec-alpha");
                        const toUnlocked = profile?.worldState?.sectorStates?.[conn.to]
                          ? profile.worldState.sectorStates[conn.to].isUnlocked
                          : (profile?.worldState?.unlockedSectors?.includes(conn.to) || conn.to === "sec-alpha");
                        const isLineActive = fromUnlocked && toUnlocked;
                        return (
                          <g key={idx}>
                            {/* Glow backdrop line */}
                            <line
                              x1={conn.x1} y1={conn.y1} x2={conn.x2} y2={conn.y2}
                              stroke={isLineActive ? "rgba(0, 255, 204, 0.12)" : "rgba(255, 255, 255, 0.02)"}
                              strokeWidth={isLineActive ? "4" : "1"}
                            />
                            {/* Inner flowing animated path */}
                            <line
                              className={isLineActive ? "progression-line" : ""}
                              x1={conn.x1} y1={conn.y1} x2={conn.x2} y2={conn.y2}
                              stroke={isLineActive ? "rgba(0, 255, 204, 0.75)" : "rgba(255, 255, 255, 0.12)"}
                              strokeWidth={isLineActive ? "1.5" : "1"}
                              strokeDasharray={isLineActive ? "6, 4" : "3, 3"}
                              style={{ 
                                filter: isLineActive ? "drop-shadow(0 0 3px rgba(0, 255, 204, 0.6))" : "none",
                              }}
                            />
                          </g>
                        );
                      })}
 
                      {/* Reusable Global Events Layer */}
                      {globalEvents.map((evt) => (
                        <g key={evt.id} style={{ cursor: "pointer" }} onClick={() => alert(`[GLOBAL EVENT] ${evt.name}\nType: ${evt.type}\nDetails: ${evt.details}`)}>
                          <circle cx={evt.x} cy={evt.y} r={evt.radius} fill="none" stroke={evt.color} strokeWidth="1" strokeDasharray="3,3" opacity="0.3">
                            <animate attributeName="r" values={`${evt.radius};${evt.radius + 8};${evt.radius}`} dur="3s" repeatCount="indefinite" />
                          </circle>
                          <circle cx={evt.x} cy={evt.y} r="5" fill={evt.color} />
                          <circle cx={evt.x} cy={evt.y} r="10" fill="none" stroke={evt.color} strokeWidth="1" opacity="0.6">
                            <animate attributeName="opacity" values="0.8;0.2;0.8" dur="2.5s" repeatCount="indefinite" />
                          </circle>
                          {/* Label backing card */}
                          <rect x={evt.x - 35} y={evt.y - 22} width="70" height="11" rx="1.5" fill="rgba(2,2,2,0.85)" stroke="rgba(255,255,255,0.06)" strokeWidth="0.5" />
                          <text x={evt.x} y={evt.y - 14} fill={evt.color} fontSize="6.5px" fontFamily="var(--mono)" textAnchor="middle" fontWeight="bold">
                            ⚠️ {evt.name}
                          </text>
                        </g>
                      ))}
 
                      {/* Irregular Sector Polygons */}
                      {sectors.map((sec) => {
                        const isUnlocked = profile?.worldState?.sectorStates?.[sec.id]
                          ? profile.worldState.sectorStates[sec.id].isUnlocked
                          : (profile?.worldState?.unlockedSectors?.includes(sec.id) || sec.id === "sec-alpha");
                        const isSelected = selectedSectorId === sec.id;
                        const status = getSectorStatus(sec);
                        const completion = getSectorCompletion(sec.id);
                        
                        const themeColor = getSectorColor(sec.id);
                        const glowFilter = `url(#glow-${sec.id.replace("sec-", "")})`;
 
                        const colorMap = {
                          LOCKED: "url(#lock-hatch)",
                          AVAILABLE: `rgba(${hexToRgb(themeColor)}, 0.10)`,
                          IN_PROGRESS: `rgba(${hexToRgb(themeColor)}, 0.12)`,
                          SECURED: `rgba(${hexToRgb(themeColor)}, 0.12)`,
                          DANGEROUS: `rgba(${hexToRgb(themeColor)}, 0.12)`,
                          CRITICAL: `rgba(${hexToRgb(themeColor)}, 0.14)`,
                          SAFE: `rgba(${hexToRgb(themeColor)}, 0.12)`,
                          ACTIVE: `rgba(${hexToRgb(themeColor)}, 0.10)`,
                          INFECTED: `rgba(${hexToRgb(themeColor)}, 0.15)`
                        };
 
                        const strokeColor = !isUnlocked ? `rgba(${hexToRgb(themeColor)}, 0.50)` : themeColor;
 
                        return (
                          <g key={sec.id}>
                            <polygon
                              points={sec.points}
                              className="sector-poly"
                              fill={isSelected ? `rgba(${hexToRgb(themeColor)}, 0.14)` : (isUnlocked ? colorMap[status] : "url(#lock-hatch)")}
                              stroke={isSelected ? "#ffffff" : strokeColor}
                              strokeWidth={isSelected ? "3" : "1.8"}
                              strokeDasharray={isUnlocked ? "none" : "5,4"}
                              style={{ 
                                cursor: "pointer", 
                                filter: isSelected ? glowFilter : "none",
                                transition: "all 0.25s ease"
                              }}
                              onClick={() => {
                                setSelectedSectorId(sec.id);
                                if (isUnlocked) {
                                  const sectorMissions = missions.filter(m => m.region === sec.id);
                                  const firstAvail = sectorMissions.find(m => !isMissionLocked(m) && !profile?.completedMissions.includes(m.id)) || sectorMissions[0];
                                  if (firstAvail) setSelectedMapSector(firstAvail.id);
                                }
                              }}
                            />
 
                            {/* Padlock inside locked sectors */}
                            {!isUnlocked && (
                              <g transform={`translate(${sec.labelX - 7}, ${sec.labelY - 26})`} style={{ pointerEvents: "none" }}>
                                <rect x="0" y="5" width="14" height="9" rx="1" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1" />
                                <path d="M3 5V3.5a4 4 0 0 1 8 0V5" fill="none" stroke="rgba(255,255,255,0.4)" strokeWidth="1" />
                              </g>
                            )}
 
                            {/* Text Backing Card for absolute readability */}
                            <rect
                              x={sec.labelX - 60}
                              y={sec.labelY - 12}
                              width="120"
                              height="32"
                              rx="2"
                              fill="rgba(2, 2, 2, 0.88)"
                              stroke={isSelected ? "rgba(255,255,255,0.3)" : "rgba(255, 255, 255, 0.12)"}
                              strokeWidth="0.75"
                              pointerEvents="none"
                            />
 
                            <text
                              x={sec.labelX}
                              y={sec.labelY}
                              fill={isSelected ? "#fff" : (isUnlocked ? "rgba(255,255,255,0.95)" : "rgba(255,255,255,0.65)")}
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
                              y={sec.labelY + 14}
                              fill={!isUnlocked ? "rgba(255,255,255,0.45)" : themeColor}
                              fontSize="9px"
                              fontFamily="var(--mono)"
                              textAnchor="middle"
                              pointerEvents="none"
                            >
                              {!isUnlocked ? "LOCKED" : `${completion}% ${status}`}
                            </text>
                          </g>
                        );
                      })}
                    </svg>
                  </div>

                  <div style={{ display: "flex", justifyContent: "space-between", zIndex: 1, fontFamily: "var(--mono)", fontSize: "11.5px", color: "var(--text-dim)", borderTop: "1px dashed rgba(255,255,255,0.06)", padding: "10px 14px", background: "rgba(5,5,5,0.7)" }}>
                    <span>ACTIVE TARGETS: {sectors.filter(s => profile?.worldState.unlockedSectors.includes(s.id) || s.id === "sec-alpha").length} / 7 ONLINE</span>
                    <span>INTEL SYNC: COMPLETE // UPLINK GREEN</span>
                  </div>
                </div>

                {/* Ticker Logs */}
                <div className="panel" style={{
                  background: "#080808", border: "1px solid rgba(255, 77, 77, 0.15)",
                  padding: "10px 14px", display: "flex", flexDirection: "column", gap: "6px",
                  height: "110px", overflow: "hidden"
                }}>
                  <div style={{ fontFamily: "var(--mono)", fontSize: "11px", color: "#ffffff", fontWeight: "bold", letterSpacing: "0.1em" }}>
                    [ RED QUEEN AI RADAR SCAN DATA LOGS ]
                  </div>
                  <div style={{ flex: 1, overflowY: "auto", fontFamily: "var(--mono)", fontSize: "11px", color: "#b0b0b0", display: "flex", flexDirection: "column", gap: "4px" }}>
                    {profile?.worldState.globalAlerts.map((log, idx) => (
                      <div key={idx} style={{ color: "#ff4d4d" }}>▶ {log}</div>
                    ))}
                    {aiLogs.map((log, idx) => (
                      <div key={`ai-${idx}`} style={{ color: log.includes("[WARN]") ? "#ff4d4d" : log.includes("[SYS]") ? "#00ffcc" : "#b0b0b0" }}>{log}</div>
                    ))}
                    <div ref={aiLogsEndRef} />
                  </div>
                </div>

              </div>

              {/* RIGHT COLUMN: UNIFIED SECTOR DETAILS & MISSIONS */}
              <div style={{ display: "flex", flexDirection: "column", gap: "16px", width: "100%" }}>
                
                {selectedSector ? (() => {
                  const sectorIsLocked = getSectorStatus(selectedSector) === "LOCKED";
                  const sectorState = profile?.worldState?.sectorStates?.[selectedSector.id];
                  const themeColor = getSectorColor(selectedSector.id);
                  const completion = getSectorCompletion(selectedSector.id);
                  const stability = sectorState?.stability ?? 0;
                  const contamination = sectorState?.contamination ?? 0;
                  const danger = sectorState?.dangerLevel ?? "Low";
                  const ownership = sectorState?.ownership ?? "Neutral";
                  const status = getSectorStatus(selectedSector);

                  return (
                    <div className="panel" style={{
                      background: "#080808", border: "1px solid var(--border)",
                      display: "flex", flexDirection: "column", height: "100%", overflow: "hidden",
                      boxShadow: "0 4px 20px rgba(0,0,0,0.8)"
                    }}>
                      
                      {/* FIXED HEADER: Name & Status */}
                      <div style={{ padding: "16px", borderBottom: "1px dashed rgba(255,255,255,0.06)", display: "flex", flexDirection: "column", gap: "6px" }}>
                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                          <span style={{ fontFamily: "var(--mono)", fontSize: "11.5px", color: "#ffffff", letterSpacing: "0.15em", fontWeight: "bold" }}>
                            [ SECTOR INTEL OVERVIEW ]
                          </span>
                          <span style={{ 
                            fontSize: "10.5px", padding: "2px 6px", fontFamily: "var(--mono)", fontWeight: "bold",
                            background: sectorIsLocked ? "rgba(255,77,77,0.1)" : `rgba(${hexToRgb(themeColor)}, 0.1)`, 
                            color: sectorIsLocked ? "#ff4d4d" : themeColor, 
                            border: sectorIsLocked ? "1px solid rgba(255,77,77,0.3)" : `1px solid rgba(${hexToRgb(themeColor)}, 0.3)`
                          }}>
                            {status.toUpperCase()}
                          </span>
                        </div>
                        <h3 style={{ fontSize: "20px", color: "#fff", margin: "4px 0 0 0", fontFamily: "var(--title-font)", fontWeight: "bold", letterSpacing: "0.02em" }}>
                          {selectedSector.name}
                        </h3>
                      </div>

                      {/* SCROLLABLE CONTENT BODY */}
                      <div style={{ flex: 1, overflowY: "auto", padding: "16px", display: "flex", flexDirection: "column", gap: "14px" }}>
                        
                        {/* 1. Description */}
                        <div>
                          <p style={{ fontSize: "13px", color: "rgba(255,255,255,0.85)", lineHeight: "1.6", margin: 0 }}>
                            {selectedSector.description}
                          </p>
                        </div>

                        {/* 2. Diagnostics Grid (Threat, Stability, Contamination, Influence) */}
                        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "8px" }}>
                          <div style={{ background: "#050505", border: "1px solid rgba(255,255,255,0.03)", padding: "8px", borderRadius: "2px" }}>
                            <span style={{ fontFamily: "var(--mono)", fontSize: "10px", color: "rgba(255,255,255,0.6)" }}>THREAT PROFILE</span>
                            <div style={{ fontFamily: "var(--mono)", fontSize: "12px", color: danger === "Severe" || danger === "High" ? "#ff4d4d" : "#f0c929", fontWeight: "bold", marginTop: "2px" }}>
                              {danger.toUpperCase()} ({selectedSector.threatType})
                            </div>
                          </div>
                          <div style={{ background: "#050505", border: "1px solid rgba(255,255,255,0.03)", padding: "8px", borderRadius: "2px" }}>
                            <span style={{ fontFamily: "var(--mono)", fontSize: "10px", color: "rgba(255,255,255,0.6)" }}>STABILITY</span>
                            <div style={{ fontFamily: "var(--mono)", fontSize: "12px", color: stability > 50 ? "#00ffcc" : "#ff4d4d", fontWeight: "bold", marginTop: "2px" }}>
                              {stability}%
                            </div>
                          </div>
                          <div style={{ background: "#050505", border: "1px solid rgba(255,255,255,0.03)", padding: "8px", borderRadius: "2px" }}>
                            <span style={{ fontFamily: "var(--mono)", fontSize: "10px", color: "rgba(255,255,255,0.6)" }}>CONTAMINATION</span>
                            <div style={{ fontFamily: "var(--mono)", fontSize: "12px", color: contamination < 40 ? "#00ffcc" : "#ff4d4d", fontWeight: "bold", marginTop: "2px" }}>
                              {contamination}%
                            </div>
                          </div>
                          <div style={{ background: "#050505", border: "1px solid rgba(255,255,255,0.03)", padding: "8px", borderRadius: "2px" }}>
                            <span style={{ fontFamily: "var(--mono)", fontSize: "10px", color: "rgba(255,255,255,0.6)" }}>INFLUENCE</span>
                            <div style={{ fontFamily: "var(--mono)", fontSize: "12px", color: "#00ffcc", fontWeight: "bold", marginTop: "2px" }}>
                              {ownership.toUpperCase()}
                            </div>
                          </div>
                        </div>

                        {/* Stabilization index progress bar */}
                        <div>
                          <div style={{ display: "flex", justifyContent: "space-between", fontFamily: "var(--mono)", fontSize: "11px", color: "var(--text-dim)", marginBottom: "4px" }}>
                            <span>STABILIZATION INDEX</span>
                            <span style={{ color: themeColor, fontWeight: "bold" }}>{completion}%</span>
                          </div>
                          <div style={{ height: "4px", background: "rgba(255,255,255,0.05)", borderRadius: "2px", overflow: "hidden" }}>
                            <div style={{ height: "100%", width: `${completion}%`, background: themeColor, transition: "width 0.4s ease-out" }} />
                          </div>
                        </div>

                        {/* 3. Resources */}
                        <div>
                          <span style={{ fontFamily: "var(--mono)", fontSize: "10px", color: "rgba(255,255,255,0.6)", display: "block", marginBottom: "4px", letterSpacing: "0.05em" }}>EXPECTED HARVEST PATHWAYS</span>
                          <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                            {selectedSector.availableResources.map((res, i) => (
                              <span key={i} style={{
                                fontSize: "11px", fontFamily: "var(--mono)", padding: "2px 6px",
                                background: "rgba(255,255,255,0.02)", border: "1px solid rgba(255,255,255,0.08)",
                                color: "#00ffcc", borderRadius: "2px"
                              }}>
                                ▷ {res.toUpperCase()}
                              </span>
                            ))}
                          </div>
                        </div>

                        {/* 4. Requirements checklist */}
                        <div>
                          <span style={{ fontFamily: "var(--mono)", fontSize: "10px", color: "rgba(255,255,255,0.6)", display: "block", marginBottom: "4px", letterSpacing: "0.05em" }}>AUTHORIZATION GATEWAY STATUS</span>
                          {(() => {
                            let sectorPrereqMet = true;
                            let sectorPrereqName = "";
                            if (sectorState?.unlockRequiredSector) {
                              sectorPrereqName = sectorState.unlockRequiredSector;
                              const reqSectorId = sectors.find(s => s.name.toLowerCase() === sectorState.unlockRequiredSector?.toLowerCase() || s.id === sectorState.unlockRequiredSector)?.id;
                              const reqSecState = reqSectorId ? profile?.worldState?.sectorStates?.[reqSectorId] : null;
                              sectorPrereqMet = reqSecState ? (reqSecState.status === "SECURED" || reqSecState.completion >= 100) : false;
                            }

                            let requiredLevel = 1;
                            if (selectedSector.id === "sec-alpha") requiredLevel = 1;
                            else if (selectedSector.id === "sec-beta") requiredLevel = 2;
                            else if (selectedSector.id === "sec-delta") requiredLevel = 3;
                            else requiredLevel = 4;
                            const levelPrereqMet = (profile?.level || 0) >= requiredLevel;

                            let requiredBioScore = 10;
                            if (selectedSector.id === "sec-alpha") requiredBioScore = 10;
                            else if (selectedSector.id === "sec-beta") requiredBioScore = 20;
                            else requiredBioScore = 35;
                            const currentBio = profile ? calculateBioScore(profile.stats) : 0;
                            const bioscorePrereqMet = currentBio >= requiredBioScore;

                            return (
                              <div style={{ display: "flex", flexDirection: "column", gap: "6px", background: "rgba(0,0,0,0.3)", padding: "10px", border: "1px solid rgba(255,255,255,0.02)", borderRadius: "2px" }}>
                                {sectorState?.unlockRequiredSector && (
                                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", fontFamily: "var(--mono)", borderBottom: "1px solid rgba(255,255,255,0.02)", paddingBottom: "4px" }}>
                                    <span style={{ color: "var(--text-dim)" }}>PREREQUISITE SECTOR:</span>
                                    <span style={{ color: sectorPrereqMet ? "#00ffcc" : "#ff4d4d", fontWeight: "bold" }}>
                                      {sectorPrereqName} {sectorPrereqMet ? "✓ MET" : "✗ LOCKED"}
                                    </span>
                                  </div>
                                )}
                                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", fontFamily: "var(--mono)", borderBottom: "1px solid rgba(255,255,255,0.02)", paddingBottom: "4px" }}>
                                  <span style={{ color: "var(--text-dim)" }}>OPERATIVE LEVEL REQ:</span>
                                  <span style={{ color: levelPrereqMet ? "#00ffcc" : "#ff4d4d", fontWeight: "bold" }}>
                                    Lvl {requiredLevel} {levelPrereqMet ? "✓ MET" : `✗ UNMET (Yours: Lvl ${profile?.level})`}
                                  </span>
                                </div>
                                <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", fontFamily: "var(--mono)" }}>
                                  <span style={{ color: "var(--text-dim)" }}>BIO-SCORE THRESHOLD:</span>
                                  <span style={{ color: bioscorePrereqMet ? "#00ffcc" : "#ff4d4d", fontWeight: "bold" }}>
                                    {requiredBioScore}%+ {bioscorePrereqMet ? "✓ MET" : `✗ UNMET (Yours: ${currentBio}%)`}
                                  </span>
                                </div>
                              </div>
                            );
                          })()}
                        </div>

                        {/* Divider */}
                        <div style={{ borderBottom: "1px dashed rgba(255,255,255,0.06)" }} />

                        {/* 5. Available Operations */}
                        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                          <span style={{ fontFamily: "var(--mono)", fontSize: "11.5px", color: "#ffffff", letterSpacing: "0.1em", fontWeight: "bold" }}>
                            [ AVAILABLE OPERATIONS ]
                          </span>

                          <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                            {(() => {
                              if (sectorIsLocked) {
                                return (
                                  <div style={{ display: "flex", flexDirection: "column", justifyItems: "center", justifyContent: "center", alignItems: "center", padding: "16px", textAlign: "center", background: "rgba(255,77,77,0.01)", border: "1px solid rgba(255,77,77,0.1)", borderRadius: "2px" }}>
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#ff4d4d" strokeWidth="1.5" style={{ marginBottom: "8px" }}>
                                      <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                                      <path d="M7 11V7a5 5 0 0 1 10 0v4" />
                                    </svg>
                                    <span style={{ fontFamily: "var(--mono)", fontSize: "11px", color: "#ff4d4d", textTransform: "uppercase", fontWeight: "bold" }}>
                                      ACCESS RESTRICTED
                                    </span>
                                    <span style={{ fontFamily: "var(--mono)", fontSize: "10.5px", color: "var(--text-dim)", marginTop: "4px" }}>
                                      Clear authorization requirements in gateway status to connect database.
                                    </span>
                                  </div>
                                );
                              }

                              return selectedSectorMissions.length > 0 ? (
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
                                        padding: "12px", borderRadius: "2px", cursor: isLocked ? "not-allowed" : "pointer",
                                        transition: "all 0.15s", display: "flex", gap: "10px", alignItems: "center",
                                        opacity: isLocked ? 0.35 : 1
                                      }}
                                    >
                                      <div style={{ flex: 1, minWidth: 0 }}>
                                        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                                          <span className={`tag ${op.difficulty === "Easy" ? "tag-green" : op.difficulty === "Normal" ? "tag-yellow" : "tag-red"}`} style={{ fontSize: "10px", padding: "1px 5px" }}>
                                            {op.difficulty.toUpperCase()}
                                          </span>
                                          <span style={{ fontFamily: "var(--mono)", fontSize: "10px", color: "var(--text-dim)" }}>
                                            {op.duration}m
                                          </span>
                                        </div>
                                        <h4 style={{ fontSize: "13.5px", color: "#fff", margin: "4px 0 2px 0", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                                          {op.title}
                                        </h4>
                                        <div style={{ display: "flex", justifyItems: "center", justifyContent: "space-between", fontSize: "10.5px", fontFamily: "var(--mono)", color: "var(--text-dim)" }}>
                                          <span>{op.category.toUpperCase()} MISSION</span>
                                          {isLocked && <span style={{ color: "var(--accent)" }}>REQ: Lvl {op.unlockRequirements.level || op.unlockRequirements.bioScore || 1}</span>}
                                        </div>
                                      </div>
                                    </div>
                                  );
                                })
                              ) : (
                                <div style={{ textAlign: "center", fontFamily: "var(--mono)", fontSize: "12px", color: "var(--text-dim)", marginTop: "10px" }}>
                                  NO OPERATIONS IN SECTOR
                                </div>
                              );
                            })()}
                          </div>
                        </div>
                      </div>

                      {/* FIXED FOOTER: Deploy Button */}
                      <div style={{ padding: "16px", borderTop: "1px solid rgba(255,255,255,0.06)", background: "rgba(5,5,5,0.8)" }}>
                        {sectorIsLocked ? (
                          <button
                            disabled
                            className="btn"
                            style={{
                              width: "100%", justifyContent: "center", fontSize: "13px", padding: "12px",
                              background: "rgba(255,77,77,0.05)", color: "#ff4d4d", border: "1px solid rgba(255,77,77,0.2)",
                              cursor: "not-allowed", opacity: 0.5, fontFamily: "var(--mono)", fontWeight: "bold"
                            }}
                          >
                            ACCESS DENIED // PREREQUISITES UNMET 🔒
                          </button>
                        ) : selectedOperation && selectedOperation.region === selectedSectorId ? (
                          <button
                            onClick={() => {
                              setActiveMission(selectedOperation);
                              setMissionFlow("briefing");
                            }}
                            className="btn btn-primary animate-pulse"
                            style={{
                              width: "100%", justifyContent: "center", fontSize: "13px", padding: "12px",
                              background: selectedOperation.recommendedClass === profile?.class ? "#00ffcc" : "var(--accent)",
                              color: "#000", fontWeight: "bold", border: "none", boxShadow: `0 0 15px rgba(${selectedOperation.recommendedClass === profile?.class ? "0,255,204" : "255,77,77"}, 0.35)`
                            }}
                          >
                            LAUNCH OPERATION: {selectedOperation.title.toUpperCase()} 🛰️
                          </button>
                        ) : (
                          <button
                            disabled
                            className="btn"
                            style={{
                              width: "100%", justifyContent: "center", fontSize: "13px", padding: "12px",
                              background: "rgba(255,255,255,0.02)", color: "var(--text-dim)", border: "1px solid var(--border)",
                              cursor: "not-allowed", fontFamily: "var(--mono)"
                            }}
                          >
                            SELECT OPERATION TO DEPLOY ▷
                          </button>
                        )}
                      </div>

                    </div>
                  );
                })() : (
                  <div className="panel" style={{ background: "#080808", border: "1px solid var(--border)", padding: "20px", textAlign: "center", color: "var(--text-dim)", fontFamily: "var(--mono)", fontSize: "13px" }}>
                    NO SECTOR SELECTED
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
                
                <span style={{ fontFamily: "var(--mono)", fontSize: "11.5px", color: "var(--text-muted)", letterSpacing: "0.2em" }}>
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
                    <div style={{ fontFamily: "var(--mono)", fontSize: "12.5px", color: "var(--accent)", fontWeight: "bold" }}>
                      [ BIOMETRIC ENVELOPE SECURED ]
                    </div>
                    <div style={{ fontFamily: "var(--mono)", fontSize: "11px", color: "var(--text-muted)", marginTop: "4px" }}>
                      RECONNAISSANCE IMAGERY PENDING
                    </div>
                  </div>
                </div>

                {/* Identity Stamps & Reputation stats */}
                <div style={{ display: "flex", flexDirection: "column", gap: "10px", overflowY: "auto", maxHeight: "350px", paddingRight: "4px" }}>
                  <div style={{ display: "flex", justifyItems: "center", justifyContent: "space-between", borderBottom: "1px dashed rgba(255,255,255,0.05)", paddingBottom: "6px" }}>
                    <span style={{ fontFamily: "var(--mono)", fontSize: "11.5px", color: "var(--text-dim)" }}>FACTION ALLIANCE:</span>
                    <span style={{ fontFamily: "var(--title-font)", fontSize: "13.5px", color: getFactionColor(profile?.faction || ""), fontWeight: "bold" }}>
                      {profile?.faction?.toUpperCase()}
                    </span>
                  </div>
                  <div style={{ display: "flex", justifyItems: "center", justifyContent: "space-between", borderBottom: "1px dashed rgba(255,255,255,0.05)", paddingBottom: "6px" }}>
                    <span style={{ fontFamily: "var(--mono)", fontSize: "11.5px", color: "var(--text-dim)" }}>REPUTATION:</span>
                    <span style={{ fontFamily: "var(--mono)", fontSize: "12.5px", color: "#00ffcc", fontWeight: "bold" }}>
                      {profile?.reputation || 0} pts
                    </span>
                  </div>
                  
                  {/* Playtime */}
                  <div style={{ display: "flex", justifyItems: "center", justifyContent: "space-between", borderBottom: "1px dashed rgba(255,255,255,0.05)", paddingBottom: "6px" }}>
                    <span style={{ fontFamily: "var(--mono)", fontSize: "11.5px", color: "var(--text-dim)" }}>CAMPAIGN PLAYTIME:</span>
                    <span style={{ fontFamily: "var(--mono)", fontSize: "12px", color: "#fff" }}>
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
                  <div style={{ display: "flex", justifyItems: "center", justifyContent: "space-between", borderBottom: "1px dashed rgba(255,255,255,0.05)", paddingBottom: "6px" }}>
                    <span style={{ fontFamily: "var(--mono)", fontSize: "11.5px", color: "var(--text-dim)" }}>CAMPAIGN SECURED:</span>
                    <span style={{ fontFamily: "var(--mono)", fontSize: "12px", color: "var(--accent)", fontWeight: "bold" }}>
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
                  <div style={{ display: "flex", justifyItems: "center", justifyContent: "space-between", borderBottom: "1px dashed rgba(255,255,255,0.05)", paddingBottom: "6px" }}>
                    <span style={{ fontFamily: "var(--mono)", fontSize: "11.5px", color: "var(--text-dim)" }}>OPERATIONS RECORD:</span>
                    <span style={{ fontFamily: "var(--mono)", fontSize: "12px", color: "#fff" }}>
                      {profile?.campaignStats?.operationsCompleted || 0} Successful / {profile?.campaignStats?.operationsFailed || 0} Failed
                    </span>
                  </div>

                  {/* Civilians & Anomalies */}
                  <div style={{ display: "flex", justifyItems: "center", justifyContent: "space-between", borderBottom: "1px dashed rgba(255,255,255,0.05)", paddingBottom: "6px" }}>
                    <span style={{ fontFamily: "var(--mono)", fontSize: "11.5px", color: "var(--text-dim)" }}>CIVILIANS EXTRACTED:</span>
                    <span style={{ fontFamily: "var(--mono)", fontSize: "12px", color: "#00ffcc", fontWeight: "bold" }}>
                      👥 {profile?.campaignStats?.civiliansExtracted || 0} survivors
                    </span>
                  </div>
                  <div style={{ display: "flex", justifyItems: "center", justifyContent: "space-between", borderBottom: "1px dashed rgba(255,255,255,0.05)", paddingBottom: "6px" }}>
                    <span style={{ fontFamily: "var(--mono)", fontSize: "11.5px", color: "var(--text-dim)" }}>ANOMALIES RECORDED:</span>
                    <span style={{ fontFamily: "var(--mono)", fontSize: "12px", color: "#f0c929", fontWeight: "bold" }}>
                      🌀 {profile?.campaignStats?.anomaliesDiscovered || 0} discovered
                    </span>
                  </div>
                  <div style={{ display: "flex", justifyItems: "center", justifyContent: "space-between", borderBottom: "1px dashed rgba(255,255,255,0.05)", paddingBottom: "6px" }}>
                    <span style={{ fontFamily: "var(--mono)", fontSize: "11.5px", color: "var(--text-dim)" }}>RESEARCH ACQUIRED:</span>
                    <span style={{ fontFamily: "var(--mono)", fontSize: "12.5px", color: "#a855f7", fontWeight: "bold" }}>
                      🔬 {profile?.campaignStats?.researchDataCollected || 0} points
                    </span>
                  </div>
                  
                  {/* Resources grid */}
                  <div style={{ marginTop: "6px", border: "1px solid rgba(255,255,255,0.05)", background: "rgba(0,0,0,0.3)", padding: "10px" }}>
                    <div style={{ fontFamily: "var(--mono)", fontSize: "10.5px", color: "var(--text-muted)", letterSpacing: "0.1em", borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: "4px", marginBottom: "8px" }}>
                      [ TOTAL DEPLOYMENT MATERIAL HARVEST ]
                    </div>
                    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px" }}>
                      {(() => {
                        const res = profile?.campaignStats?.totalResourcesRecovered || {};
                        const keys = ["Metal", "Electronics", "Medical Supplies", "Energy Cells", "Components"];
                        return keys.map(k => {
                          const val = res[k] || 0;
                          return (
                            <div key={k} style={{ display: "flex", justifyContent: "space-between", fontFamily: "var(--mono)", fontSize: "11px" }}>
                              <span style={{ color: "var(--text-dim)" }}>{k.toUpperCase()}:</span>
                              <span style={{ color: val > 0 ? "#00ffcc" : "var(--text-muted)", fontWeight: "bold" }}>{val}</span>
                            </div>
                          );
                        });
                      })()}
                    </div>
                  </div>
                  
                  {/* Tactical stats grid */}
                  <div style={{ marginTop: "10px", border: "1px solid rgba(255, 77, 77, 0.15)", background: "rgba(255, 77, 77, 0.01)", padding: "10px" }}>
                    <div style={{ fontFamily: "var(--mono)", fontSize: "10.5px", color: "var(--accent)", letterSpacing: "0.1em", borderBottom: "1px solid rgba(255, 77, 77, 0.15)", paddingBottom: "4px", marginBottom: "8px", fontWeight: "bold" }}>
                      [ ACTIVE TACTICAL MODULE METRICS ]
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                      {[
                        { label: "MAX VITALITY HP", val: `${tacticalStats.maxHp} HP`, bonus: tacticalStats.maxHp > 100 ? `(+${tacticalStats.maxHp - 100})` : "" },
                        { label: "SHIELD ARMOR", val: `${tacticalStats.armor}%`, bonus: tacticalStats.armor > 0 ? `(+${tacticalStats.armor}%)` : "", color: "#0ea5e9" },
                        { label: "FILTER RESISTANCE", val: `${tacticalStats.resistance}%`, bonus: tacticalStats.resistance > 0 ? `(+${tacticalStats.resistance}%)` : "", color: "#a855f7" },
                        { label: "THREAT DETECTION", val: `${tacticalStats.detection}m`, bonus: tacticalStats.detection > 50 ? `(+${tacticalStats.detection - 50}m)` : "", color: "#22c55e" },
                        { label: "SPEED MOBILITY", val: `${tacticalStats.mobility}%`, bonus: tacticalStats.mobility > 100 ? `(+${tacticalStats.mobility - 100}%)` : "", color: "#f0c929" },
                        { label: "CARGO CAPACITY", val: `${tacticalStats.capacity} slots`, bonus: tacticalStats.capacity > 15 ? `(+${tacticalStats.capacity - 15})` : "", color: "#00ffcc" },
                        { label: "MEDICAL EFFICIENCY", val: `${tacticalStats.medEfficiency}%`, bonus: tacticalStats.medEfficiency > 100 ? `(+${tacticalStats.medEfficiency - 100}%)` : "", color: "#ff4d4d" },
                        { label: "RESEARCH EFFICIENCY", val: `${tacticalStats.resEfficiency}%`, bonus: tacticalStats.resEfficiency > 100 ? `(+${tacticalStats.resEfficiency - 100}%)` : "", color: "#a855f7" }
                      ].map(stat => (
                        <div key={stat.label} style={{ display: "flex", justifyContent: "space-between", fontFamily: "var(--mono)", fontSize: "11px" }}>
                          <span style={{ color: "var(--text-dim)" }}>{stat.label}:</span>
                          <span style={{ color: stat.color || "#fff", fontWeight: "bold" }}>
                            {stat.val} <span style={{ color: "#22c55e", fontSize: "9.5px", marginLeft: "2px" }}>{stat.bonus}</span>
                          </span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Medical Stabilization Hub */}
                  <div style={{ marginTop: "10px", border: "1px solid rgba(0, 255, 204, 0.2)", background: "rgba(0, 255, 204, 0.02)", padding: "10px" }}>
                    <div style={{ fontFamily: "var(--mono)", fontSize: "10.5px", color: "#00ffcc", letterSpacing: "0.1em", borderBottom: "1px solid rgba(0, 255, 204, 0.2)", paddingBottom: "4px", marginBottom: "8px", fontWeight: "bold" }}>
                      [ MEDICAL STATION STABILIZATION HUB ]
                    </div>
                    <p style={{ fontFamily: "var(--mono)", fontSize: "10px", color: "var(--text-muted)", margin: "0 0 8px 0", lineHeight: "1.4" }}>
                      Restore biometric integrity index using Division credits.
                    </p>
                    <div style={{ display: "flex", gap: "8px" }}>
                      <button
                        onClick={() => {
                          if (!profile) return;
                          if (profile.health >= 100) {
                            setAiLogs(prev => [...prev, `[SYS] MEDICAL HUBLINK // BIOMETRICS OPTIMIZED`]);
                            return;
                          }
                          if (profile.credits < 25) {
                            setAiLogs(prev => [...prev, `[WARN] INSUFFICIENT DIVISION CREDITS // 25 CR REQUIRED`]);
                            return;
                          }
                          const iden = authIdentifier || (publicKey ? publicKey.toString() : "offline-operative");
                          const nextH = Math.min(100, profile.health + 30);
                          const updated = { ...profile, health: nextH, credits: profile.credits - 25 };
                          setProfile(updated);
                          saveProfile(iden, updated);
                          setAiLogs(prev => [...prev, `[SYS] CELLULAR STABILIZATION // HEALTH: ${profile.health}% → ${nextH}%`]);
                        }}
                        style={{
                          flex: 1, background: "transparent", border: "1px solid #00ffcc", color: "#00ffcc",
                          fontSize: "10.5px", padding: "6px", cursor: "pointer", fontFamily: "var(--mono)"
                        }}
                      >
                        [ STIM REGEN (+30 HP) // 25 CR ]
                      </button>
                      <button
                        onClick={() => {
                          if (!profile) return;
                          if (profile.health >= 100) {
                            setAiLogs(prev => [...prev, `[SYS] MEDICAL HUBLINK // BIOMETRICS OPTIMIZED`]);
                            return;
                          }
                          if (profile.credits < 75) {
                            setAiLogs(prev => [...prev, `[WARN] INSUFFICIENT DIVISION CREDITS // 75 CR REQUIRED`]);
                            return;
                          }
                          const iden = authIdentifier || (publicKey ? publicKey.toString() : "offline-operative");
                          const updated = { ...profile, health: 100, credits: profile.credits - 75 };
                          setProfile(updated);
                          saveProfile(iden, updated);
                          setAiLogs(prev => [...prev, `[SYS] FULL BIOMETRIC RESTORATION // HEALTH: 100% // CURED`]);
                        }}
                        style={{
                          flex: 1, background: "transparent", border: "1px solid #00ffcc", color: "#00ffcc",
                          fontSize: "10.5px", padding: "6px", cursor: "pointer", fontFamily: "var(--mono)"
                        }}
                      >
                        [ FULL CELL CURE (100% HP) // 75 CR ]
                      </button>
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
                                {rec.sectorId.replace("sec-", "SECTOR ").toUpperCase()} // {new Date(rec.timestamp).toLocaleDateString()} // Objectives: {rec.objectivesCompleted || 0}/{rec.objectivesTotal || 0} // Duration: {(() => {
                                  const totalSecs = rec.durationSeconds || 240;
                                  const m = Math.floor(totalSecs / 60);
                                  const s = totalSecs % 60;
                                  return `${m}m ${s}s`;
                                })()}
                              </div>
                              {rec.resourcesEarned && Object.entries(rec.resourcesEarned).filter(([_, q]) => (q as number) > 0).length > 0 && (
                                <div style={{ fontFamily: "var(--mono)", fontSize: "7.5px", color: "var(--accent)", marginTop: "2px" }}>
                                  LOOT EXTRACTED: {Object.entries(rec.resourcesEarned).filter(([_, q]) => (q as number) > 0).map(([r, qty]) => `+${qty} ${r}`).join(", ")}
                                </div>
                              )}
                              {rec.reputationChanges && Object.entries(rec.reputationChanges).length > 0 && (
                                <div style={{ fontFamily: "var(--mono)", fontSize: "7.5px", color: "rgba(255,255,255,0.4)", marginTop: "2px" }}>
                                  REPUTATION IMPACT: {Object.entries(rec.reputationChanges).map(([fid, delta]) => {
                                    const sign = (delta as number) > 0 ? "+" : "";
                                    return `${fid.toUpperCase()} (${sign}${delta})`;
                                  }).join(" // ")}
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

                  {/* Crafting & Upgrades Database (Milestone 2 Backend Validation) */}
                  <div style={{ borderTop: "1px dashed var(--border)", paddingTop: "14px", marginTop: "10px" }}>
                    <div style={{ fontFamily: "var(--mono)", fontSize: "10px", color: "var(--text-dim)", letterSpacing: "0.15em", marginBottom: "8px" }}>
                      [ SYNTHESIS & UPGRADES SCHEMATICS DATABASE ]
                    </div>
                    <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                      {/* Crafting Recipes */}
                      <div style={{ background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.04)", padding: "10px" }}>
                        <div style={{ fontFamily: "var(--mono)", fontSize: "8.5px", color: "var(--accent)", borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: "4px", marginBottom: "6px", fontWeight: "bold" }}>
                          SYNTHESIS RECIPES
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                          {CRAFTING_RECIPES.map(recipe => (
                            <div key={recipe.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", fontSize: "8.5px", fontFamily: "var(--mono)", borderBottom: "1px dotted rgba(255,255,255,0.03)", paddingBottom: "4px" }}>
                              <div style={{ flex: 1 }}>
                                <div style={{ color: "#fff", fontWeight: "bold" }}>{recipe.name.toUpperCase()}</div>
                                <div style={{ color: "var(--text-muted)", fontSize: "7.5px", marginTop: "2px" }}>{recipe.description}</div>
                                <div style={{ color: "var(--accent)", fontSize: "7.5px", marginTop: "2px" }}>
                                  INGREDIENTS: {recipe.ingredients.map(ing => {
                                    const name = INITIAL_INVENTORY.find(i => i.id === ing.itemId)?.name || ing.itemId;
                                    return `${ing.qty}x ${name}`;
                                  }).join(", ")}
                                </div>
                              </div>
                              <button 
                                onClick={() => {
                                  if (!profile) return;
                                  const iden = authIdentifier || (publicKey ? publicKey.toString() : "offline-operative");
                                  const res = craftItem(profile, inventory, recipe.id);
                                  if (res.success) {
                                    setInventory(res.updatedInventory);
                                    saveInventory(iden, res.updatedInventory);
                                    setAiLogs(prev => [...prev, `[CRAFT] ${res.message.toUpperCase()}`]);
                                  } else {
                                    setAiLogs(prev => [...prev, `[WARN] CRAFTING FAILED // ${res.message.toUpperCase()}`]);
                                  }
                                }}
                                style={{
                                  background: "transparent", border: "1px solid var(--accent)", color: "var(--accent)",
                                  fontSize: "7px", padding: "1px 5px", cursor: "pointer", fontFamily: "var(--mono)", marginLeft: "8px"
                                }}
                              >
                                [ SYNTHESIZE ]
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>

                      {/* Upgrade Recipes */}
                      <div style={{ background: "rgba(0,0,0,0.3)", border: "1px solid rgba(255,255,255,0.04)", padding: "10px" }}>
                        <div style={{ fontFamily: "var(--mono)", fontSize: "8.5px", color: "#f0c929", borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: "4px", marginBottom: "6px", fontWeight: "bold" }}>
                          CALIBRATION & UPGRADE SCHEMATICS
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                          {UPGRADE_RECIPES.map(recipe => (
                            <div key={recipe.id} style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", fontSize: "8.5px", fontFamily: "var(--mono)", borderBottom: "1px dotted rgba(255,255,255,0.03)", paddingBottom: "4px" }}>
                              <div style={{ flex: 1 }}>
                                <div style={{ color: "#fff", fontWeight: "bold" }}>{recipe.name.toUpperCase()}</div>
                                <div style={{ color: "var(--text-muted)", fontSize: "7.5px", marginTop: "2px" }}>{recipe.description}</div>
                                <div style={{ color: "#f0c929", fontSize: "7.5px", marginTop: "2px" }}>
                                  INGREDIENTS: {recipe.ingredients.map(ing => {
                                    const name = INITIAL_INVENTORY.find(i => i.id === ing.itemId)?.name || ing.itemId;
                                    return `${ing.qty}x ${name}`;
                                  }).join(", ")}
                                </div>
                              </div>
                              <button 
                                onClick={() => {
                                  if (!profile) return;
                                  const iden = authIdentifier || (publicKey ? publicKey.toString() : "offline-operative");
                                  const target = inventory.find(i => i.id === recipe.targetItemId || i.id.startsWith(recipe.targetItemId));
                                  if (!target) {
                                    setAiLogs(prev => [...prev, `[WARN] UPGRADE FAILED // TARGET EQUIPMENT NOT FOUND IN INVENTORY`]);
                                    return;
                                  }
                                  const res = upgradeEquipment(profile, inventory, recipe.id, target.id);
                                  if (res.success) {
                                    setInventory(res.updatedInventory);
                                    saveInventory(iden, res.updatedInventory);
                                    setAiLogs(prev => [...prev, `[UPGRADE] ${res.message.toUpperCase()}`]);
                                  } else {
                                    setAiLogs(prev => [...prev, `[WARN] UPGRADE FAILED // ${res.message.toUpperCase()}`]);
                                  }
                                }}
                                style={{
                                  background: "transparent", border: "1px solid #f0c929", color: "#f0c929",
                                  fontSize: "7px", padding: "1px 5px", cursor: "pointer", fontFamily: "var(--mono)", marginLeft: "8px"
                                }}
                              >
                                [ UPGRADE ]
                              </button>
                            </div>
                          ))}
                        </div>
                      </div>
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
                <div style={{ fontFamily: "var(--mono)", fontSize: "11.5px", color: "var(--text-dim)", letterSpacing: "0.15em", fontWeight: "bold", borderBottom: "1px dashed rgba(255,255,255,0.06)", paddingBottom: "4px" }}>
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
                        <span style={{ fontFamily: "var(--mono)", fontSize: "10px", color: "var(--text-muted)", display: "block" }}>{s.label}</span>
                        {item ? (
                          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                            <span style={{ fontFamily: "var(--title-font)", fontSize: "13px", color: "#fff", fontWeight: "bold", whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}>
                              {item.name}
                            </span>
                            <button
                              onClick={() => handleUnequip(s.slot)}
                              style={{
                                background: "none", border: "none", color: "#ff4d4d", cursor: "pointer",
                                fontSize: "11px", fontFamily: "var(--mono)", padding: 0
                              }}
                            >
                              [ REMOVE ]
                            </button>
                          </div>
                        ) : (
                          <span style={{ fontFamily: "var(--mono)", fontSize: "11.5px", color: "var(--accent)", display: "block", fontWeight: "bold", animation: "blink 1.8s infinite" }}>
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
                {!selectedInventoryItem ? (() => {
                  const eqSuggestions = profile ? RedQueenIntelligenceService.getEquipmentRecommendations(profile, inventory) : ["Analyzing loadout telemetry..."];
                  return (
                    <div style={{ display: "flex", flexDirection: "column", height: "100%", justifyContent: "center", alignItems: "stretch", width: "100%", gap: "16px" }}>
                      <div style={{ textAlign: "center", borderBottom: "1px dashed rgba(255,255,255,0.06)", paddingBottom: "12px" }}>
                        <span style={{ fontFamily: "var(--mono)", fontSize: "13px", color: "var(--accent)", fontWeight: "bold", letterSpacing: "0.2em", display: "block" }}>
                          [ BIOMETRIC RADAR GRID ]
                        </span>
                        <span style={{ fontFamily: "var(--mono)", fontSize: "11.5px", color: "var(--text-muted)", display: "block", marginTop: "4px" }}>
                          SIGNAL BOUND SECURED // SLOT DRAG INJECTION READY
                        </span>
                      </div>
                      
                      {/* Red Queen Loadout Audit Suggestions */}
                      <div style={{ background: "rgba(255, 77, 77, 0.02)", border: "1px solid rgba(255, 77, 77, 0.15)", padding: "12px", borderRadius: "2px" }}>
                        <div style={{ fontFamily: "var(--mono)", fontSize: "11.5px", color: "var(--accent)", letterSpacing: "0.1em", fontWeight: "bold", marginBottom: "8px" }}>
                          [ RED QUEEN LOADOUT AUDIT ]
                        </div>
                        <div style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                          {eqSuggestions.map((sug, idx) => (
                            <div key={idx} style={{ fontFamily: "var(--mono)", fontSize: "11.5px", color: sug.includes("optimal") ? "#00ffcc" : "#ffc72c", display: "flex", gap: "6px", alignItems: "flex-start", lineHeight: "1.4" }}>
                              <span>▶</span>
                              <span>{sug}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>
                  );
                })() : (() => {
                  const equippedItem = equippedGear[selectedInventoryItem.slot];
                  const isEquipped = selectedInventoryItem.equipped === true;
                  const itemColor = getRarityStyle(selectedInventoryItem.rarity).color;
                  
                  if (isEquipped) {
                    return (
                      <div style={{ display: "flex", flexDirection: "column", height: "100%", justifyContent: "space-between", gap: "12px", zIndex: 1 }}>
                        <div>
                          <div style={{ borderBottom: "1px dashed rgba(255,255,255,0.1)", paddingBottom: "8px", marginBottom: "8px" }}>
                            <span style={{ fontFamily: "var(--mono)", fontSize: "11.5px", color: "var(--text-dim)", letterSpacing: "0.1em" }}>
                              [ INSPECTING LOADOUT SLOTS // EQUIPPED ]
                            </span>
                            <h3 style={{ fontFamily: "var(--title-font)", fontSize: "17px", color: itemColor, margin: "4px 0 2px 0", fontWeight: "bold" }}>
                              {selectedInventoryItem.name}
                            </h3>
                            <span style={{ fontFamily: "var(--mono)", fontSize: "11.5px", color: "var(--text-muted)" }}>
                              {selectedInventoryItem.rarity.toUpperCase()} {selectedInventoryItem.slot.toUpperCase()} // LVL {selectedInventoryItem.itemLevel}
                            </span>
                          </div>

                          <div style={{ display: "flex", justifyContent: "space-between", background: "#0c0c0c", padding: "8px 12px", border: "1px solid var(--border)", marginBottom: "12px" }}>
                            <div>
                              <span style={{ fontFamily: "var(--mono)", fontSize: "10.5px", color: "var(--text-muted)" }}>RATING POWER</span>
                              <div style={{ fontFamily: "var(--mono)", fontSize: "16px", color: "#00ffcc", fontWeight: "bold" }}>
                                {selectedInventoryItem.power}
                              </div>
                            </div>
                            <div style={{ textAlign: "right" }}>
                              <span style={{ fontFamily: "var(--mono)", fontSize: "10.5px", color: "var(--text-muted)" }}>INTEGRITY QUALITY</span>
                              <div style={{ fontFamily: "var(--mono)", fontSize: "16px", color: "#fff", fontWeight: "bold" }}>
                                {selectedInventoryItem.quality}%
                              </div>
                            </div>
                          </div>

                          <p style={{ fontSize: "12.5px", color: "var(--text-muted)", lineHeight: "1.5", margin: "0 0 12px 0" }}>
                            {selectedInventoryItem.desc}
                          </p>

                          {(() => {
                            const meta = getItemMetadata(selectedInventoryItem);
                            return (
                              <div style={{ display: "flex", flexDirection: "column", gap: "6px", background: "#0c0c0c", border: "1px solid var(--border)", padding: "10px", margin: "10px 0", fontSize: "11.5px", fontFamily: "var(--mono)" }}>
                                <div style={{ display: "flex", justifyContent: "space-between" }}>
                                  <span style={{ color: "var(--text-muted)" }}>SLOT:</span>
                                  <span style={{ color: "#fff", fontWeight: "bold" }}>{meta.slot.toUpperCase()}</span>
                                </div>
                                <div style={{ display: "flex", justifyContent: "space-between" }}>
                                  <span style={{ color: "var(--text-muted)" }}>CATEGORY:</span>
                                  <span style={{ color: "#fff", fontWeight: "bold" }}>{meta.category.toUpperCase()}</span>
                                </div>
                                <div style={{ display: "flex", justifyContent: "space-between" }}>
                                  <span style={{ color: "var(--text-muted)" }}>RARITY:</span>
                                  <span style={{ color: itemColor, fontWeight: "bold" }}>{selectedInventoryItem.rarity.toUpperCase()}</span>
                                </div>
                                <div style={{ display: "flex", justifyContent: "space-between" }}>
                                  <span style={{ color: "var(--text-muted)" }}>REQUIRED LEVEL:</span>
                                  <span style={{ color: (profile?.level || 1) >= meta.requiredLevel ? "#00ffcc" : "#ff4d4d", fontWeight: "bold" }}>
                                    Lvl {meta.requiredLevel}
                                  </span>
                                </div>
                                <div style={{ display: "flex", justifyContent: "space-between" }}>
                                  <span style={{ color: "var(--text-muted)" }}>STATUS:</span>
                                  <span style={{ color: "#00ffcc", fontWeight: "bold" }}>EQUIPPED</span>
                                </div>
                                <div style={{ borderTop: "1px solid rgba(255,255,255,0.04)", marginTop: "4px", paddingTop: "4px" }} />
                                <div>
                                  <span style={{ color: "var(--text-muted)" }}>ACQUIRED FROM:</span>
                                  <div style={{ color: "#fff", marginTop: "2px" }}>{meta.acquiredFrom}</div>
                                </div>
                                <div style={{ marginTop: "4px" }}>
                                  <span style={{ color: "var(--text-muted)" }}>CRAFTING USAGE:</span>
                                  <div style={{ color: "#f0c929", marginTop: "2px" }}>{meta.craftingUsage}</div>
                                </div>
                              </div>
                            );
                          })()}

                          <div style={{ borderTop: "1px dashed rgba(255,255,255,0.06)", paddingTop: "8px" }}>
                            <span style={{ fontFamily: "var(--mono)", fontSize: "10.5px", color: "var(--text-muted)", display: "block", marginBottom: "6px" }}>STAT MODULE MATRIX</span>
                            <div style={{ display: "flex", flexDirection: "column", gap: "4px" }}>
                              {Object.entries(selectedInventoryItem.stats || {}).map(([key, val]) => (
                                <div key={key} style={{ display: "flex", justifyContent: "space-between", fontSize: "12px", fontFamily: "var(--mono)", padding: "2px 0" }}>
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
                              color: "var(--accent)", padding: "8px", fontFamily: "var(--mono)", fontSize: "12px",
                              fontWeight: "bold", cursor: "pointer", borderRadius: "2px"
                            }}
                          >
                            [ DISCONNECT GEAR ]
                          </button>
                          <button
                            onClick={() => setSelectedInventoryItem(null)}
                            style={{
                              flex: 1, background: "none", border: "1px solid var(--border)",
                              color: "var(--text-dim)", padding: "8px", fontFamily: "var(--mono)", fontSize: "12px",
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

                          <p style={{ fontSize: "10.5px", color: "var(--text-muted)", lineHeight: "1.4", margin: "4px 0 12px 0" }}>
                            {selectedInventoryItem.desc}
                          </p>

                          {(() => {
                            const meta = getItemMetadata(selectedInventoryItem);
                            return (
                              <div style={{ display: "flex", flexDirection: "column", gap: "5px", background: "#0c0c0c", border: "1px solid var(--border)", padding: "10px", margin: "10px 0", fontSize: "9px", fontFamily: "var(--mono)" }}>
                                <div style={{ display: "flex", justifyContent: "space-between" }}>
                                  <span style={{ color: "var(--text-muted)" }}>SLOT:</span>
                                  <span style={{ color: "#fff", fontWeight: "bold" }}>{meta.slot.toUpperCase()}</span>
                                </div>
                                <div style={{ display: "flex", justifyContent: "space-between" }}>
                                  <span style={{ color: "var(--text-muted)" }}>CATEGORY:</span>
                                  <span style={{ color: "#fff", fontWeight: "bold" }}>{meta.category.toUpperCase()}</span>
                                </div>
                                <div style={{ display: "flex", justifyContent: "space-between" }}>
                                  <span style={{ color: "var(--text-muted)" }}>RARITY:</span>
                                  <span style={{ color: itemColor, fontWeight: "bold" }}>{selectedInventoryItem.rarity.toUpperCase()}</span>
                                </div>
                                <div style={{ display: "flex", justifyContent: "space-between" }}>
                                  <span style={{ color: "var(--text-muted)" }}>REQUIRED LEVEL:</span>
                                  <span style={{ color: (profile?.level || 1) >= meta.requiredLevel ? "#00ffcc" : "#ff4d4d", fontWeight: "bold" }}>
                                    Lvl {meta.requiredLevel}
                                  </span>
                                </div>
                                <div style={{ display: "flex", justifyContent: "space-between" }}>
                                  <span style={{ color: "var(--text-muted)" }}>STATUS:</span>
                                  <span style={{ color: "var(--accent)", fontWeight: "bold" }}>UNASSIGNED</span>
                                </div>
                                <div style={{ borderTop: "1px solid rgba(255,255,255,0.04)", marginTop: "4px", paddingTop: "4px" }} />
                                <div>
                                  <span style={{ color: "var(--text-muted)" }}>ACQUIRED FROM:</span>
                                  <div style={{ color: "#fff", marginTop: "2px" }}>{meta.acquiredFrom}</div>
                                </div>
                                <div style={{ marginTop: "4px" }}>
                                  <span style={{ color: "var(--text-muted)" }}>CRAFTING USAGE:</span>
                                  <div style={{ color: "#f0c929", marginTop: "2px" }}>{meta.craftingUsage}</div>
                                </div>
                              </div>
                            );
                          })()}

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
                    const isSelected = selectedInventoryItem?.id === item.id && selectedInventoryItem?.equipped === item.equipped;
                    
                    return (
                      <button
                        key={item.id}
                        onClick={() => setSelectedInventoryItem(item)}
                        style={{
                          aspectRatio: "1", 
                          background: item.equipped ? "rgba(0, 255, 204, 0.08)" : rarityStyle.bg, 
                          border: isSelected 
                            ? "2px solid #fff" 
                            : item.equipped 
                              ? "2px solid var(--accent)" 
                              : rarityStyle.border,
                          cursor: "pointer", display: "flex", flexDirection: "column", alignItems: "center",
                          justifyContent: "center", position: "relative", padding: "4px", borderRadius: "2px"
                        }}
                      >
                        <span style={{ position: "absolute", top: "4px", right: "4px", width: "4px", height: "4px", borderRadius: "50%", background: rarityStyle.color }} />
                        
                        {item.equipped && (
                          <span style={{
                            position: "absolute", top: "2px", left: "4px", fontFamily: "var(--mono)",
                            fontSize: "7.5px", color: "var(--accent)", fontWeight: "bold", background: "rgba(0,0,0,0.85)",
                            padding: "0px 2px", border: "1px solid var(--accent)", borderRadius: "1px"
                          }}>
                            EQ
                          </span>
                        )}

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

          {activeTab === "settings" && (
            <div className="panel" style={{ border: "1px solid var(--border)", padding: "40px", height: "100%", overflowY: "auto" }}>
              <div style={{ borderBottom: "1px dashed var(--border)", paddingBottom: "16px", marginBottom: "24px" }}>
                <span style={{ fontFamily: "var(--mono)", fontSize: "11px", color: "var(--text-dim)", letterSpacing: "0.2em", display: "block", marginBottom: "6px" }}>
                  SYSTEM SETTINGS & RESET CONTROL
                </span>
                <h1 style={{ fontFamily: "var(--title-font)", fontSize: "28px", color: "#fff", fontWeight: "900", letterSpacing: "0.1em", margin: 0 }}>
                  OPERATIONAL CONTROL PANEL
                </h1>
              </div>

              <div style={{ maxWidth: "600px", display: "flex", flexDirection: "column", gap: "24px" }}>
                <div style={{ background: "rgba(255, 77, 77, 0.05)", border: "1px solid rgba(255, 77, 77, 0.2)", padding: "20px", borderRadius: "4px" }}>
                  <h3 style={{ fontFamily: "var(--title-font)", fontSize: "14px", color: "var(--accent)", margin: "0 0 10px 0", fontWeight: "bold" }}>
                    REPLAY SYSTEM ONBOARDING
                  </h3>
                  <p style={{ fontFamily: "var(--mono)", fontSize: "11.5px", color: "rgba(255,255,255,0.7)", margin: "0 0 16px 0", lineHeight: "1.6" }}>
                    Triggering this process will wipe the onboarding completion flag from your profile record (locally and on Supabase). You will be returned to Screen 1 of the RED QUEEN network initialization protocol immediately.
                  </p>
                  <button
                    onClick={async () => {
                      if (!profile) return;
                      const identifier = authIdentifier || (publicKey ? publicKey.toString() : "offline-operative");
                      const updatedWorldState = {
                        ...profile.worldState,
                        completedOnboarding: false
                      };
                      const updatedProfile = {
                        ...profile,
                        faction: "None",
                        class: "None",
                        role: "None",
                        worldState: updatedWorldState
                      };
                      // Persist to DB so it survives refresh
                      if (identifier !== "offline-operative") {
                        try {
                          await fetch("/api/profile", {
                            method: "POST",
                            headers: getHeaders(),
                            body: JSON.stringify({
                              wallet_address: identifier,
                              class: "None",
                              role: "None",
                              faction: "None",
                              world_state: updatedWorldState,
                            })
                          });
                        } catch (e) { console.warn("Failed to persist onboarding reset to DB:", e); }
                      }
                      setProfile(updatedProfile);
                      setCompletedOnboarding(false);
                      setGameplayOnboardingStep(1);
                      setActiveTab("center");
                      saveProfile(identifier, updatedProfile);
                      setAiLogs(prev => [...prev, "[SYS] ONBOARDING FLOW MANUALLY RE-INITIALIZED BY OPERATOR"]);
                    }}
                    style={{
                      background: "var(--accent)", color: "#000", border: "none", padding: "12px 20px",
                      fontFamily: "var(--title-font)", fontSize: "12px", fontWeight: "bold", cursor: "pointer",
                      borderRadius: "2px", letterSpacing: "0.05em"
                    }}
                  >
                    RESET & REPLAY ONBOARDING
                  </button>
                </div>

                <div style={{ background: "rgba(0, 255, 204, 0.03)", border: "1px solid rgba(0, 255, 204, 0.15)", padding: "20px", borderRadius: "4px" }}>
                  <h3 style={{ fontFamily: "var(--title-font)", fontSize: "14px", color: "#00ffcc", margin: "0 0 10px 0", fontWeight: "bold" }}>
                    OPERATIVE REASSIGNMENT MATRIX
                  </h3>
                  <p style={{ fontFamily: "var(--mono)", fontSize: "11.5px", color: "rgba(255,255,255,0.7)", margin: "0 0 16px 0", lineHeight: "1.6" }}>
                    Reassign your division alliance, operative class, and tactical role profile. All changes will sync to Supabase.
                  </p>
                  
                  {/* Faction Select */}
                  <div style={{ marginBottom: "12px" }}>
                    <label style={{ fontFamily: "var(--mono)", fontSize: "11px", color: "#888", display: "block", marginBottom: "4px" }}>CHOOSE DIVISION FACTION:</label>
                    <select 
                      value={reassignFaction} 
                      onChange={(e) => setReassignFaction(e.target.value)}
                      style={{ background: "#0c0c0c", color: "#fff", border: "1px solid var(--border)", padding: "8px 12px", fontFamily: "var(--mono)", fontSize: "12.5px", width: "100%" }}
                    >
                      {FACTIONS.map(f => <option key={f.id} value={f.id}>{f.name.toUpperCase()} - {f.desc}</option>)}
                    </select>
                  </div>

                  {/* Class Select */}
                  <div style={{ marginBottom: "12px" }}>
                    <label style={{ fontFamily: "var(--mono)", fontSize: "11px", color: "#888", display: "block", marginBottom: "4px" }}>CHOOSE OPERATIVE CLASS:</label>
                    <select 
                      value={reassignClass} 
                      onChange={(e) => {
                        setReassignClass(e.target.value);
                        // Auto recommend a role based on class
                        if (e.target.value === "Assault") setReassignRole("Breach Specialist");
                        else if (e.target.value === "Medic") setReassignRole("Field Medic");
                        else if (e.target.value === "Recon") setReassignRole("Recon Scout");
                        else if (e.target.value === "Specialist") setReassignRole("Tech Specialist");
                        else if (e.target.value === "Scientist") setReassignRole("Field Scientist");
                        else if (e.target.value === "Engineer") setReassignRole("Combat Engineer");
                      }}
                      style={{ background: "#0c0c0c", color: "#fff", border: "1px solid var(--border)", padding: "8px 12px", fontFamily: "var(--mono)", fontSize: "12.5px", width: "100%" }}
                    >
                      {CLASSES.map(c => <option key={c.id} value={c.id}>{c.name.toUpperCase()} - {c.desc}</option>)}
                    </select>
                  </div>

                  {/* Role Select */}
                  <div style={{ marginBottom: "16px" }}>
                    <label style={{ fontFamily: "var(--mono)", fontSize: "11px", color: "#888", display: "block", marginBottom: "4px" }}>CHOOSE TACTICAL ROLE:</label>
                    <select 
                      value={reassignRole} 
                      onChange={(e) => setReassignRole(e.target.value)}
                      style={{ background: "#0c0c0c", color: "#fff", border: "1px solid var(--border)", padding: "8px 12px", fontFamily: "var(--mono)", fontSize: "12.5px", width: "100%" }}
                    >
                      <option value="Breach Specialist">Breach Specialist</option>
                      <option value="Field Medic">Field Medic</option>
                      <option value="Recon Scout">Recon Scout</option>
                      <option value="Tech Specialist">Tech Specialist</option>
                      <option value="Field Scientist">Field Scientist</option>
                      <option value="Combat Engineer">Combat Engineer</option>
                    </select>
                  </div>

                  <button
                    onClick={handleConfirmReassignment}
                    style={{
                      background: "#00ffcc", color: "#000", border: "none", padding: "12px 20px",
                      fontFamily: "var(--title-font)", fontSize: "12px", fontWeight: "bold", cursor: "pointer",
                      borderRadius: "2px", letterSpacing: "0.05em"
                    }}
                  >
                    CONFIRM REASSIGNMENT & SYNC PROFILE
                  </button>
                </div>
              </div>
            </div>
          )}

          {activeTab === "manual" && (
            <div style={{ height: "100%", overflow: "hidden" }}>
              <OperationsManualView />
            </div>
          )}

        </main>
      </div>

      {/* --- IN-GAME OVERLAYS SYSTEM (MULTI-EVENT CAMPAIGN LOOP) --- */}
      
      {/* 1. Briefing Overlay */}
      {activeMission && missionFlow === "briefing" && (() => {
        const sector = sectors.find(s => s.id === activeMission.region);
        const sectorState = profile ? profile.worldState?.sectorStates?.[activeMission.region] : undefined;
        const briefing = (profile && sector) ? RedQueenIntelligenceService.getMissionBriefing(profile, sector, sectorState, activeMission, inventory) : { survivalProbability: 50, riskLevel: "Medium", advice: "" };
        const commentary = briefing.advice;
        const survivalChance = briefing.survivalProbability;
        const warnings = profile ? RedQueenIntelligenceService.getWarning(profile, activeMission, sectorState, inventory) : { hasWarning: false, warningMessage: null, alertType: "NONE" };
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
                <p style={{ fontFamily: "var(--mono)", fontSize: "11px", fontStyle: "italic", color: "var(--text)", lineHeight: "1.5", margin: 0, whiteSpace: "pre-wrap" }}>
                  {commentary}
                </p>
              </div>

              {/* Dynamic Warning System banner */}
              {warnings.hasWarning && (
                <div style={{
                  background: warnings.alertType === "CRITICAL" ? "rgba(255, 77, 77, 0.08)" : "rgba(240, 201, 41, 0.08)",
                  border: warnings.alertType === "CRITICAL" ? "1px solid #ff4d4d" : "1px solid #f0c929",
                  padding: "12px", display: "flex", gap: "10px", alignItems: "center"
                }}>
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none"
                    stroke={warnings.alertType === "CRITICAL" ? "#ff4d4d" : "#f0c929"} strokeWidth="2">
                    <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                    <line x1="12" y1="9" x2="12" y2="13" />
                    <line x1="12" y1="17" x2="12.01" y2="17" />
                  </svg>
                  <div>
                    <div style={{
                      fontFamily: "var(--mono)", fontSize: "10px",
                      color: warnings.alertType === "CRITICAL" ? "#ff4d4d" : "#f0c929", fontWeight: "bold"
                    }}>
                      [ {warnings.alertType} STATUS DETECTED ]
                    </div>
                    <div style={{ fontFamily: "var(--mono)", fontSize: "8.5px", color: "var(--text-muted)", marginTop: "2px" }}>
                      {warnings.warningMessage}
                    </div>
                  </div>
                </div>
              )}

              {/* Actions Footer */}
              <div style={{ display: "flex", justifyItems: "center", justifyContent: "space-between", marginTop: "6px" }}>
                <button
                  onClick={() => { setActiveMission(null); setMissionFlow(null); }}
                  className="btn btn-ghost"
                  style={{ border: "1px solid var(--border)", padding: "10px 24px", fontSize: "11px" }}
                >
                  ABORT DEPLOYMENT
                </button>
                {(() => {
                  const isHpRestricted = (profile?.health || 100) < 20 && (activeMission.difficulty === "Hard" || activeMission.difficulty === "Critical");
                  
                  const todayStr = new Date().toISOString().split("T")[0];
                  const deploymentsToday = (profile?.missionHistory || []).filter(h => h.timestamp && h.timestamp.startsWith(todayStr)).length;
                  const limit = (() => {
                    const tier = profile?.holderTier || 0;
                    if (tier === 1) return 4;
                    if (tier === 2) return 5;
                    if (tier === 3) return 6;
                    return 3;
                  })();
                  const limitReached = deploymentsToday >= limit && identifier !== "offline-operative";
                  const isBlocked = isHpRestricted || limitReached;

                  return (
                    <button
                      disabled={isBlocked}
                      onClick={() => {
                        if (isBlocked) return;
                        runDeployment(activeMission);
                      }}
                      className="btn btn-primary"
                      style={{
                        padding: "10px 32px",
                        fontSize: "11px",
                        background: isBlocked ? "rgba(255,255,255,0.05)" : "var(--accent)",
                        color: isBlocked ? "var(--text-dim)" : "#000",
                        border: isBlocked ? "1px solid rgba(255,255,255,0.05)" : "none",
                        cursor: isBlocked ? "not-allowed" : "pointer"
                      }}
                    >
                      {isHpRestricted ? "[ DEPLOYMENT REJECTED: HP CRITICAL ]" : limitReached ? `[ LIMIT REACHED (${deploymentsToday}/${limit}) ]` : "DEPLOY OPERATIVE 🛰️"}
                    </button>
                  );
                })()}
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
    </AccessGuard>
  );
}
