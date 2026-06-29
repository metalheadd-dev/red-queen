import { DEFAULT_STATS, UserStats } from "../progression";
import { OperativeProfile, Mission, InventoryItem, WorldState } from "./types";

export const DEFAULT_WORLD_STATE: WorldState = {
  unlockedSectors: ["sec-alpha", "sec-beta", "sec-delta", "sec-gamma"],
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
  ]
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
 * Loads an Operative Profile from local storage, merging and healing missing keys dynamically.
 */
export function loadProfile(identifier: string): OperativeProfile {
  if (typeof window === "undefined") return { ...DEFAULT_PROFILE };
  
  const saved = localStorage.getItem(`rq_ops_profile:${identifier}`);
  if (!saved) return { ...DEFAULT_PROFILE };

  try {
    const parsed = JSON.parse(saved);
    
    // Self-healing / default merging logic
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
      worldState: parsed.worldState ? parsed.worldState : { ...DEFAULT_WORLD_STATE }
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

  // 7. World Progression Shifts
  const worldState = { ...updated.worldState };
  const unlocked = new Set(worldState.unlockedSectors);
  let worldEventsMessage: string | null = null;

  if (outcome === "SUCCESS" || outcome === "PARTIAL") {
    // Check if mission rewards unlocked a new sector
    if (unlockedSectorId) {
      unlocked.add(unlockedSectorId);
      const newSecName = unlockedSectorId.replace("sec-", "").toUpperCase();
      worldEventsMessage = `GRID FREQUENCY LOCKED // NEW SECTOR UNLOCKED: SECTOR ${newSecName}`;
    }

    // Shift faction influence in this sector
    const influence = { ...worldState.factionInfluence };
    if (influence[mission.region] && factionId) {
      const sectorInf = { ...influence[mission.region] };
      const currentInfluence = sectorInf[factionId] || 0;
      sectorInf[factionId] = Math.min(100, currentInfluence + 15);
      influence[mission.region] = sectorInf;
    }
    worldState.factionInfluence = influence;

    // Dynamically spawn/clear anomalies & global alerts on successes
    const activeAnoms = { ...worldState.activeAnomalies };
    const alerts = [...worldState.globalAlerts];

    if (mission.id === "op-1-sanctuary-search") {
      // Clear toxin leak in alpha, unlock Epsilon, trigger radiation alarm
      activeAnoms["sec-alpha"] = [];
      unlocked.add("sec-epsilon");
      alerts.push("RADIATION STORM SPREADING TO EPSILON SILOS");
      worldEventsMessage = "GRID SHIFT // SANCTUARY SECURED // SECTOR EPSILON ONLINE";
    } else if (mission.id === "op-2-signal-recovery") {
      // Clear anomaly in beta
      activeAnoms["sec-beta"] = [];
      alerts.push("VOLATILE PATHOGEN ANOMALY SPIKING IN GAMMA");
    }

    worldState.activeAnomalies = activeAnoms;
    worldState.globalAlerts = alerts.slice(-6); // keep last 6 alerts
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
