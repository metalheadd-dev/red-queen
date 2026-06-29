import { DEFAULT_STATS, UserStats } from "../progression";
import { OperativeProfile, Mission, InventoryItem } from "./types";

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
  sectorDiscoveries: ["sec-alpha", "sec-beta"]
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
      sectorDiscoveries: Array.isArray(parsed.sectorDiscoveries) ? parsed.sectorDiscoveries : DEFAULT_PROFILE.sectorDiscoveries
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
 * Claims mission outcome rewards, updates statistics, increments levels, and unlocks achievements.
 */
export function claimMissionRewards(
  profile: OperativeProfile,
  mission: Mission,
  isSuccess: boolean,
  outcomeRewards: any
): { updatedProfile: OperativeProfile; levelUpMessage: string | null } {
  const updated = { ...profile };
  
  const xpGain = outcomeRewards?.xp || 0;
  const creditGain = outcomeRewards?.credits || 0;
  const resourceName = outcomeRewards?.resource;
  const resourceQty = outcomeRewards?.resource_qty || 0;

  // 1. Calculate XP and Level progression
  const newXP = updated.xp + xpGain;
  const newLevel = Math.floor(newXP / 100) + 1;
  let levelUpMessage: string | null = null;
  if (newLevel > updated.level) {
    levelUpMessage = `OPERATIVE LEVEL UP! Clearance level increased to Level ${newLevel}.`;
  }
  
  updated.xp = newXP;
  updated.level = newLevel;

  // 2. Calibrate sub-stats
  const stats = { ...DEFAULT_STATS, ...updated.stats };
  stats.xp = newXP;
  stats.level = newLevel;

  if (outcomeRewards?.sub_stats) {
    Object.keys(outcomeRewards.sub_stats).forEach((k) => {
      const key = k as keyof UserStats;
      if (stats[key] !== undefined) {
        stats[key] = Math.min(100, stats[key] + (outcomeRewards.sub_stats[key] || 0));
      }
    });
  }
  updated.stats = stats;

  // 3. Update resources & credits
  updated.credits = (updated.credits || 0) + creditGain;
  const resources = { ...updated.resources };
  if (resourceName && resourceQty > 0) {
    resources[resourceName] = (resources[resourceName] || 0) + resourceQty;
  }
  updated.resources = resources;

  // 4. Update Mission completion records & discoveries
  const completed = new Set(updated.completedMissions);
  if (isSuccess) {
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
      outcome: isSuccess ? "SUCCESS" : "FAILURE",
      timestamp: new Date().toISOString()
    },
    ...updated.missionHistory
  ];

  // 6. Update Faction standing & reputation
  const factionId = mission.recommendedFaction?.toLowerCase();
  const standings = { ...updated.factionStanding };
  if (factionId && standings[factionId] !== undefined) {
    // Standard standing bonus of +10 on success, +3 on failure
    const standingBonus = isSuccess ? 10 : 3;
    standings[factionId] = Math.min(100, standings[factionId] + standingBonus);
  }
  updated.factionStanding = standings;
  updated.reputation = Math.min(1000, updated.reputation + (isSuccess ? 15 : 5));

  // 7. Check for Achievements unlock
  const achievements = new Set(updated.achievements);
  
  if (updated.missionHistory.length >= 1) {
    achievements.add("FIRST_CONTACT"); // Completed first mission
  }
  if (updated.missionHistory.filter(h => h.outcome === "SUCCESS").length >= 3) {
    achievements.add("TACTICIAN"); // 3 successful operations
  }
  if (newLevel >= 3) {
    achievements.add("SURVIVALIST"); // clearance level 3
  }
  if (factionId && standings[factionId] >= 30) {
    achievements.add("DIVISION_VETERAN"); // faction standing >= 30
  }
  if (updated.sectorDiscoveries.length >= 4) {
    achievements.add("CARTOGRAPHER"); // Discovered 4 sectors
  }

  updated.achievements = Array.from(achievements);

  return { updatedProfile: updated, levelUpMessage };
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
