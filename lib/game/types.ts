import { UserStats } from "../progression";

export interface Sector {
  id: string;
  name: string;
  status: "LOCKED" | "AVAILABLE" | "COMPLETED" | "DANGEROUS";
  difficulty: "Easy" | "Normal" | "Hard";
  rewards: string[];
  description: string;
  completionPercentage: number;
  x: string; // absolute positioning left%
  y: string; // absolute positioning top%
}

export interface Option {
  id: string;
  text: string;
  success_prob: number;
  class_bonus?: { classId: string; bonus: number };
  success_text: string;
  failure_text: string;
  stat_gains: {
    xp: number;
    credits: number;
    resource: string;
    resource_qty: number;
    sub_stats: Partial<UserStats>;
  };
}

export interface Scenario {
  text: string;
  options: Option[];
}

export interface Mission {
  id: string;
  title: string;
  description: string;
  region: string; // links to Sector ID
  difficulty: "Easy" | "Normal" | "Hard";
  duration: number;
  recommendedClass: string;
  recommendedFaction?: string;
  rewards: { xp: number; credits: number; resource: string; resourceQty: number };
  completionState: "LOCKED" | "AVAILABLE" | "COMPLETED";
  unlockRequirements: { level?: number; bioScore?: number; completedMissionId?: string };
  category: "critical" | "normal" | "side";
  scenarios: Scenario[];
}

export interface InventoryItem {
  id: string;
  name: string;
  rarity: "Common" | "Uncommon" | "Rare" | "Epic" | "Legendary";
  quality: number; // Quality percentage (e.g. 100% = Pristine)
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
  factionStanding: Record<string, number>; // Faction ID -> standing score (e.g. 0-100)
  achievements: string[];
  missionHistory: { missionId: string; outcome: "SUCCESS" | "FAILURE"; timestamp: string }[];
  sectorDiscoveries: string[];
}
