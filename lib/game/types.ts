import { UserStats } from "../progression";

export interface WorldState {
  unlockedSectors: string[];
  activeAnomalies: Record<string, string[]>; // sectorId -> anomalies
  factionInfluence: Record<string, Record<string, number>>; // sectorId -> Faction ID -> percentage (0-100)
  globalAlerts: string[];
}

export interface Sector {
  id: string;
  name: string;
  difficulty: "Easy" | "Normal" | "Hard";
  threatLevel: "Low" | "Medium" | "High" | "Severe";
  threatType: string;
  availableResources: string[];
  description: string;
  points: string; // SVG polygon points
  labelX: number; // coordinates for map label placement
  labelY: number;
}

export interface MissionChoice {
  id: string;
  text: string;
  success_prob: number;
  class_bonus?: { classId: string; bonus: number };
  success_text: string;
  failure_text: string;
  effects: {
    xp: number;
    credits: number;
    resource?: string;
    resourceQty?: number;
    injury?: number; // HP subtracted (positive number, e.g., 20 means subtract 20 HP)
    reputationBonus?: number;
    unlocksSectorId?: string; // sector ID unlocked on choice success
  };
}

export interface MissionEvent {
  id: string;
  title: string;
  text: string;
  options: MissionChoice[];
}

export interface Mission {
  id: string;
  title: string;
  description: string;
  region: string; // Sector ID
  difficulty: "Easy" | "Normal" | "Hard";
  duration: number;
  recommendedClass: string;
  recommendedFaction?: string;
  rewards: { xp: number; credits: number; resource: string; resourceQty: number };
  unlockRequirements: { level?: number; bioScore?: number; completedMissionId?: string };
  category: "critical" | "normal" | "side";
  events: MissionEvent[];
}

export interface InventoryItem {
  id: string;
  name: string;
  rarity: "Common" | "Uncommon" | "Rare" | "Epic" | "Legendary";
  quality: number; // Quality percentage (e.g., 100% = Pristine)
  slot: "Helmet" | "Armor" | "Weapon" | "Utility" | "Medkit" | "Backpack" | "Gadget" | "None";
  classRequirement: string;
  power: number;
  desc: string;
  qty: number;
  type: "weapon" | "armor" | "consumable" | "material" | "quest";
}

export interface OperativeProfile {
  name: string;
  faction: string;
  class: string;
  role: string;
  level: number;
  xp: number;
  credits: number;
  resources: Record<string, number>;
  stats: UserStats;
  completedMissions: string[];
  reputation: number;
  factionStanding: Record<string, number>; // Faction ID -> standing score (0-100)
  achievements: string[];
  missionHistory: { missionId: string; outcome: "SUCCESS" | "FAILURE"; timestamp: string }[];
  sectorDiscoveries: string[];
  health: number; // Operative Health (0-100)
  worldState: WorldState; // Global Evolving campaign world
}
