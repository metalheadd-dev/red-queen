import { DEFAULT_STATS, UserStats } from "../progression";
import { OperativeProfile, Mission, InventoryItem, WorldState, SectorState, DynamicCampaignEvent, Sector } from "./types";
import { INITIAL_SECTORS } from "./data";

export const DEFAULT_WORLD_STATE: WorldState = {
  unlockedSectors: ["sec-alpha", "sec-beta", "sec-delta"],
  activeAnomalies: {
    "sec-alpha": ["Toxin Leak"],
    "sec-beta": ["Gravity Fluctuation"],
    "sec-delta": ["Sentinel Probe scan"],
    "sec-epsilon": ["Classified Lock"],
    "sec-zeta": ["Quantum Freeze"]
  },
  factionInfluence: {
    "sec-alpha": { vanguard: 40, helix: 20 },
    "sec-beta": { nomads: 50, eclipse: 10 },
    "sec-delta": { ghost: 60, aegis: 15 },
    "sec-epsilon": { citadel: 10 },
    "sec-zeta": { horizon: 30 },
    "sec-gamma": { helix: 45 },
    "sec-omega": { vanguard: 20 }
  },
  globalAlerts: [
    "VIRAL OUTBREAK SUSPECTED IN SEC-ALPHA",
    "EM ANOMALY DETECTED IN SUBSTATION BETA",
    "SYBIL PORT TRACING COMMENCED IN DELTA"
  ],
  sectorStates: {
    "sec-alpha": { id: "sec-alpha", status: "INFECTED", dangerLevel: "Low", ownership: "Vanguard", completion: 20, isUnlocked: true },
    "sec-beta": { id: "sec-beta", status: "ACTIVE", dangerLevel: "Medium", ownership: "Nomads", completion: 0, isUnlocked: true },
    "sec-delta": { id: "sec-delta", status: "ACTIVE", dangerLevel: "High", ownership: "Ghost Division", completion: 0, isUnlocked: true },
    "sec-epsilon": { id: "sec-epsilon", status: "LOCKED", dangerLevel: "Severe", ownership: "Citadel", completion: 0, isUnlocked: false },
    "sec-zeta": { id: "sec-zeta", status: "LOCKED", dangerLevel: "Severe", ownership: "Horizon", completion: 0, isUnlocked: false },
    "sec-gamma": { id: "sec-gamma", status: "LOCKED", dangerLevel: "Medium", ownership: "Helix", completion: 0, isUnlocked: false },
    "sec-omega": { id: "sec-omega", status: "LOCKED", dangerLevel: "Severe", ownership: "Citadel", completion: 0, isUnlocked: false }
  },
  activeEvents: [
    { id: "evt-initial-1", type: "Outbreak", title: "Atmospheric Pathogen Flareup", description: "Toxin density spikes detected around medical depots.", region: "sec-alpha", duration: 3 }
  ],
  longestStreak: 0
};

export const DEFAULT_PROFILE: OperativeProfile = {
  name: "OPERATIVE",
  faction: "vanguard",
  class: "Assault",
  role: "Breach Specialist",
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
  stats: { ...DEFAULT_STATS },
  completedMissions: [],
  reputation: 0,
  factionStanding: {
    vanguard: 10,
    eclipse: 0,
    helix: 0,
    nomads: 0,
    citadel: 0,
    ghost: 0,
    aegis: 0,
    horizon: 0
  },
  achievements: [],
  missionHistory: [],
  sectorDiscoveries: ["sec-alpha", "sec-beta", "sec-delta"],
  health: 100,
  worldState: { ...DEFAULT_WORLD_STATE }
};

/**
 * Spawns a random campaign event in unlocked sectors.
 */
export function spawnRandomEvent(worldState: WorldState): { event: DynamicCampaignEvent | null; alert: string | null } {
  const eventTypes: DynamicCampaignEvent["type"][] = [
    "Outbreak", "Supply Drop", "Signal Detected", "Civilian Distress", "Faction Conflict", "Unknown Anomaly", "Satellite Crash"
  ];
  
  const eventDetails = {
    "Outbreak": { title: "Atmospheric Bio-Hazard Outbreak", desc: "Chemical/viral pathogen counts spiking above safe parameters." },
    "Supply Drop": { title: "Ecosystem Supply Drop", desc: "A cargo pod containing rare materials has landed in the region." },
    "Signal Detected": { title: "Encrypted Signal Intercepted", desc: "An unidentified telemetry transmission is broadcast from deep hubs." },
    "Civilian Distress": { title: "Civilian Pod Distress Call", desc: "Civilian shelter reporting firewall failure and breach threats." },
    "Faction Conflict": { title: "Faction Skirmish", desc: "Tactical friction detected between security cells and rogue trackers." },
    "Unknown Anomaly": { title: "Quantum Signature Anomaly", desc: "Gravity drops and spatial compression faults detected." },
    "Satellite Crash": { title: "Decayed Satellite Debris", desc: "An orbital satellite has impacted, exposing classified memory logs." }
  };

  const unlocked = worldState.unlockedSectors;
  if (unlocked.length === 0) return { event: null, alert: null };

  const randomSectorId = unlocked[Math.floor(Math.random() * unlocked.length)];
  const randomType = eventTypes[Math.floor(Math.random() * eventTypes.length)];
  const info = eventDetails[randomType];

  const newEvent: DynamicCampaignEvent = {
    id: `evt-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    type: randomType,
    title: info.title,
    description: info.desc,
    region: randomSectorId,
    duration: 3
  };

  const alertMessage = `ALERT // ${randomType.toUpperCase()} DETECTED IN ${randomSectorId.replace("sec-", "").toUpperCase()}`;
  return { event: newEvent, alert: alertMessage };
}

/**
 * Generates custom AI commentary based on active profile stats, standings, sector danger, and mission specifications.
 */
export function generateAICommentary(profile: OperativeProfile, sector: Sector, sectorState: SectorState | undefined, mission: Mission): string {
  const factionId = mission.recommendedFaction?.toLowerCase() || "";
  const factionStanding = factionId ? (profile.factionStanding[factionId] || 0) : 0;
  const status = sectorState ? sectorState.status : "ACTIVE";
  
  const commentaries: string[] = [];

  // 1. Class recommendation matching
  if (profile.class === mission.recommendedClass) {
    commentaries.push(`Recon operative recommended. Operative class matches direct parameters.`);
  } else {
    commentaries.push(`Deployment parameters recommend a [${mission.recommendedClass.toUpperCase()}] class. Adjust tactical approach.`);
  }

  // 2. Faction relationship matching
  if (factionId && factionStanding > 20) {
    commentaries.push(`${mission.recommendedFaction} requests assistance. Relationship verified.`);
  }

  // 3. Danger level and Sector Status
  if (status === "CRITICAL") {
    commentaries.push(`Civilian survival probability decreased. Danger index critical.`);
  }
  
  if (mission.environmentalHazard && mission.environmentalHazard !== "None") {
    commentaries.push(`Radiation exceeds acceptable threshold. Calibrating containment shield.`);
  }

  if (commentaries.length === 0) {
    return "Operations hub online. Commencing tactical briefing.";
  }
  return commentaries[Math.floor(Math.random() * commentaries.length)];
}

/**
 * Loads an Operative Profile from local storage, merging and healing missing keys dynamically.
 */
export function loadProfile(identifier: string): OperativeProfile {
  if (typeof window === "undefined") return { ...DEFAULT_PROFILE };
  
  const saved = localStorage.getItem(`rq_ops_profile:${identifier}`);
  if (!saved) return { ...DEFAULT_PROFILE };

  try {
    const parsed = JSON.parse(saved);
    
    // Self-healing / default merging logic
    const worldState: WorldState = parsed.worldState ? {
      unlockedSectors: Array.isArray(parsed.worldState.unlockedSectors) ? parsed.worldState.unlockedSectors : DEFAULT_WORLD_STATE.unlockedSectors,
      activeAnomalies: parsed.worldState.activeAnomalies || DEFAULT_WORLD_STATE.activeAnomalies,
      factionInfluence: parsed.worldState.factionInfluence || DEFAULT_WORLD_STATE.factionInfluence,
      globalAlerts: Array.isArray(parsed.worldState.globalAlerts) ? parsed.worldState.globalAlerts : DEFAULT_WORLD_STATE.globalAlerts,
      sectorStates: parsed.worldState.sectorStates || { ...DEFAULT_WORLD_STATE.sectorStates },
      activeEvents: Array.isArray(parsed.worldState.activeEvents) ? parsed.worldState.activeEvents : [...DEFAULT_WORLD_STATE.activeEvents],
      longestStreak: typeof parsed.worldState.longestStreak === "number" ? parsed.worldState.longestStreak : 0
    } : { ...DEFAULT_WORLD_STATE };

    const profile: OperativeProfile = {
      name: parsed.name || DEFAULT_PROFILE.name,
      faction: parsed.faction || DEFAULT_PROFILE.faction,
      class: parsed.class || DEFAULT_PROFILE.class,
      role: parsed.role || DEFAULT_PROFILE.role,
      level: typeof parsed.level === "number" ? parsed.level : DEFAULT_PROFILE.level,
      xp: typeof parsed.xp === "number" ? parsed.xp : DEFAULT_PROFILE.xp,
      credits: typeof parsed.credits === "number" ? parsed.credits : DEFAULT_PROFILE.credits,
      resources: { ...DEFAULT_PROFILE.resources, ...(parsed.resources || {}) },
      stats: { ...DEFAULT_STATS, ...(parsed.stats || {}) },
      completedMissions: Array.isArray(parsed.completedMissions) ? parsed.completedMissions : [],
      reputation: typeof parsed.reputation === "number" ? parsed.reputation : DEFAULT_PROFILE.reputation,
      factionStanding: { ...DEFAULT_PROFILE.factionStanding, ...(parsed.factionStanding || {}) },
      achievements: Array.isArray(parsed.achievements) ? parsed.achievements : [],
      missionHistory: Array.isArray(parsed.missionHistory) ? parsed.missionHistory : [],
      sectorDiscoveries: Array.isArray(parsed.sectorDiscoveries) ? parsed.sectorDiscoveries : DEFAULT_PROFILE.sectorDiscoveries,
      health: typeof parsed.health === "number" ? parsed.health : 100,
      worldState: worldState
    };

    return profile;
  } catch (err) {
    console.error("Failed to load operations profile:", err);
    return { ...DEFAULT_PROFILE };
  }
}

/**
 * Saves an Operative Profile to local storage.
 */
export function saveProfile(identifier: string, profile: OperativeProfile): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(`rq_ops_profile:${identifier}`, JSON.stringify(profile));
}

/**
 * Claims mission outcome rewards, updates statistics, increments levels, and triggers world progression shifts.
 */
export function claimMissionRewards(
  profile: OperativeProfile,
  mission: Mission,
  outcome: "SUCCESS" | "PARTIAL" | "FAILURE" | "CRITICAL_FAILURE",
  cumulativeRewards: { xp: number; credits: number; resources: Record<string, number>; injury: number; reputationBonus: number },
  unlockedSectorId?: string
): { updatedProfile: OperativeProfile; levelUpMessage: string | null; worldEventsMessage: string | null } {
  const updated = { ...profile };
  
  const xpGain = cumulativeRewards.xp || 0;
  const creditGain = cumulativeRewards.credits || 0;
  const reputationGain = cumulativeRewards.reputationBonus || 0;

  // 1. Calculate XP and Level progression
  const newXP = updated.xp + xpGain;
  const newLevel = Math.floor(newXP / 100) + 1;
  let levelUpMessage: string | null = null;
  if (newLevel > updated.level) {
    levelUpMessage = `OPERATIVE LEVEL UP! Clearance level increased to Level ${newLevel}.`;
  }
  
  updated.xp = newXP;
  updated.level = newLevel;

  // Update base stats
  const stats = { ...DEFAULT_STATS, ...updated.stats };
  stats.xp = newXP;
  stats.level = newLevel;
  updated.stats = stats;

  // 2. Adjust operative health (ensure health bounds 0-100)
  const isDead = outcome === "FAILURE" || outcome === "CRITICAL_FAILURE";
  if (isDead) {
    updated.health = 10; // set low health on evac failure
  } else {
    updated.health = Math.max(10, updated.health - cumulativeRewards.injury);
  }

  // 3. Update resources & credits
  updated.credits = (updated.credits || 0) + creditGain;
  const resources = { ...updated.resources };
  Object.keys(cumulativeRewards.resources || {}).forEach((k) => {
    resources[k] = (resources[k] || 0) + (cumulativeRewards.resources[k] || 0);
  });
  updated.resources = resources;

  // 4. Update Mission completion records
  const completed = new Set(updated.completedMissions);
  if (outcome === "SUCCESS" || outcome === "PARTIAL") {
    completed.add(mission.id);
  }
  updated.completedMissions = Array.from(completed);

  // Discover region sector if not already discovered
  const sectors = new Set(updated.sectorDiscoveries);
  sectors.add(mission.region);
  updated.sectorDiscoveries = Array.from(sectors);

  // 5. Append to Mission History
  updated.missionHistory = [
    {
      missionId: mission.id,
      outcome: (outcome === "SUCCESS" || outcome === "PARTIAL") ? "SUCCESS" : "FAILURE",
      timestamp: new Date().toISOString()
    },
    ...updated.missionHistory
  ];

  // 6. Update Standing
  const factionId = mission.recommendedFaction?.toLowerCase();
  const standings = { ...updated.factionStanding };
  if (factionId && standings[factionId] !== undefined) {
    const standingBonus = outcome === "SUCCESS" ? 10 : outcome === "PARTIAL" ? 5 : 2;
    standings[factionId] = Math.min(100, standings[factionId] + standingBonus);
  }
  updated.factionStanding = standings;
  updated.reputation = Math.min(1000, updated.reputation + reputationGain);

  // 7. World Progression Shifts & Dynamic Sector State Updates
  const worldState = { ...updated.worldState };
  
  if (!worldState.sectorStates) {
    worldState.sectorStates = { ...DEFAULT_WORLD_STATE.sectorStates };
  } else {
    worldState.sectorStates = { ...worldState.sectorStates };
  }
  
  if (!worldState.activeEvents) {
    worldState.activeEvents = [];
  } else {
    worldState.activeEvents = [...worldState.activeEvents];
  }

  const unlocked = new Set(worldState.unlockedSectors);
  let worldEventsMessage: string | null = null;

  if (outcome === "SUCCESS" || outcome === "PARTIAL") {
    const regionId = mission.region;
    if (!worldState.sectorStates[regionId]) {
      worldState.sectorStates[regionId] = {
        id: regionId,
        status: "ACTIVE",
        dangerLevel: "Medium",
        ownership: mission.recommendedFaction || "None",
        completion: 0,
        isUnlocked: true
      };
    }
    
    const currentSectorState = { ...worldState.sectorStates[regionId] };
    const oldCompletion = currentSectorState.completion;
    currentSectorState.completion = Math.min(100, currentSectorState.completion + 20);
    
    if (currentSectorState.completion === 100 && currentSectorState.status !== "SECURED") {
      currentSectorState.status = "SECURED";
      if (currentSectorState.dangerLevel === "Severe") currentSectorState.dangerLevel = "High";
      else if (currentSectorState.dangerLevel === "High") currentSectorState.dangerLevel = "Medium";
      else if (currentSectorState.dangerLevel === "Medium") currentSectorState.dangerLevel = "Low";
      else if (currentSectorState.dangerLevel === "Low") currentSectorState.dangerLevel = "Low";
      
      const staticSector = INITIAL_SECTORS.find(s => s.id === regionId);
      if (staticSector && staticSector.connectedSectors) {
        staticSector.connectedSectors.forEach(connId => {
          unlocked.add(connId);
          if (!worldState.sectorStates[connId]) {
            const staticConn = INITIAL_SECTORS.find(s => s.id === connId);
            worldState.sectorStates[connId] = {
              id: connId,
              status: "ACTIVE",
              dangerLevel: staticConn ? staticConn.threatLevel : "Medium",
              ownership: staticConn ? staticConn.threatType : "None",
              completion: 0,
              isUnlocked: true
            };
          } else {
            const connState = { ...worldState.sectorStates[connId] };
            connState.isUnlocked = true;
            if (connState.status === "LOCKED") {
              connState.status = "ACTIVE";
            }
            worldState.sectorStates[connId] = connState;
          }
        });
      }
      
      worldEventsMessage = `GRID STABILITY SECURED // ${staticSector?.name || "SECTOR"} STABLE // NEIGHBORING CHANNELS ONLINE`;
    } else {
      worldEventsMessage = `SECTOR UPLINK INTEGRITY INCREASING: ${oldCompletion}% → ${currentSectorState.completion}%`;
    }
    
    worldState.sectorStates[regionId] = currentSectorState;

    const influence = { ...worldState.factionInfluence };
    if (influence[mission.region] && factionId) {
      const sectorInf = { ...influence[mission.region] };
      const currentInfluence = sectorInf[factionId] || 0;
      sectorInf[factionId] = Math.min(100, currentInfluence + 15);
      influence[mission.region] = sectorInf;
    }
    worldState.factionInfluence = influence;

    const activeAnoms = { ...worldState.activeAnomalies };
    const alerts = [...worldState.globalAlerts];

    if (mission.id === "op-1-sanctuary-search") {
      activeAnoms["sec-alpha"] = [];
      unlocked.add("sec-epsilon");
      alerts.push("RADIATION STORM SPREADING TO EPSILON SILOS");
      worldEventsMessage = "GRID SHIFT // SANCTUARY SECURED // SECTOR EPSILON ONLINE";
      
      if (worldState.sectorStates["sec-epsilon"]) {
        worldState.sectorStates["sec-epsilon"] = {
          ...worldState.sectorStates["sec-epsilon"],
          isUnlocked: true,
          status: "ACTIVE"
        };
      }
    } else if (mission.id === "op-2-signal-recovery") {
      activeAnoms["sec-beta"] = [];
      alerts.push("VOLATILE PATHOGEN ANOMALY SPIKING IN GAMMA");
    }

    worldState.activeAnomalies = activeAnoms;
    worldState.globalAlerts = alerts.slice(-6);
  }

  // Calculate survival streak
  let currentStreak = 0;
  for (let i = 0; i < updated.missionHistory.length; i++) {
    if (updated.missionHistory[i].outcome === "SUCCESS") {
      currentStreak++;
    } else {
      break;
    }
  }
  worldState.longestStreak = Math.max(worldState.longestStreak || 0, currentStreak);

  // Campaign dynamic events duration aging
  worldState.activeEvents = worldState.activeEvents
    .map(evt => ({ ...evt, duration: evt.duration - 1 }))
    .filter(evt => evt.duration > 0);

  // Spawn new event (40% success trigger chance)
  if (outcome === "SUCCESS" && Math.random() < 0.40) {
    const { event, alert } = spawnRandomEvent(worldState);
    if (event && alert) {
      worldState.activeEvents.push(event);
      worldState.globalAlerts.push(alert);
      worldState.globalAlerts = worldState.globalAlerts.slice(-6);
      
      const targetSecId = event.region;
      if (worldState.sectorStates[targetSecId]) {
        worldState.sectorStates[targetSecId] = {
          ...worldState.sectorStates[targetSecId],
          status: "INFECTED",
          dangerLevel: "Severe"
        };
      }
    }
  }

  worldState.unlockedSectors = Array.from(unlocked);
  updated.worldState = worldState;

  // 8. Achievements check
  const achievements = new Set(updated.achievements);
  if (updated.missionHistory.length >= 1) achievements.add("FIRST_CONTACT");
  if (updated.missionHistory.filter(h => h.outcome === "SUCCESS").length >= 3) achievements.add("TACTICIAN");
  if (newLevel >= 3) achievements.add("SURVIVALIST");
  if (updated.sectorDiscoveries.length >= 4) achievements.add("CARTOGRAPHER");
  updated.achievements = Array.from(achievements);

  return { updatedProfile: updated, levelUpMessage, worldEventsMessage };
}

/**
 * Loads inventory items list from localStorage or falls back to defaults.
 */
export function loadInventory(identifier: string, defaultInventory: InventoryItem[]): InventoryItem[] {
  if (typeof window === "undefined") return defaultInventory;
  const saved = localStorage.getItem(`rq_ops_inventory:${identifier}`);
  if (!saved) return defaultInventory;
  try {
    return JSON.parse(saved);
  } catch (e) {
    return defaultInventory;
  }
}

/**
 * Saves inventory items list to localStorage.
 */
export function saveInventory(identifier: string, inventory: InventoryItem[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(`rq_ops_inventory:${identifier}`, JSON.stringify(inventory));
}

/**
 * Loads equipped gear slots mapping from localStorage or falls back to empty default slots.
 */
export function loadEquippedGear(identifier: string): Record<string, InventoryItem | null> {
  const defaultSlots = {
    Helmet: null,
    Armor: null,
    Weapon: null,
    Utility: null,
    Medkit: null,
    Backpack: null,
    Gadget: null
  };
  if (typeof window === "undefined") return defaultSlots;
  const saved = localStorage.getItem(`rq_ops_equipped:${identifier}`);
  if (!saved) return defaultSlots;
  try {
    return JSON.parse(saved);
  } catch (e) {
    return defaultSlots;
  }
}

/**
 * Saves equipped gear slots mapping to localStorage.
 */
export function saveEquippedGear(identifier: string, equippedGear: Record<string, InventoryItem | null>): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(`rq_ops_equipped:${identifier}`, JSON.stringify(equippedGear));
}

