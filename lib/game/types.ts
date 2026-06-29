import { UserStats } from "../progression";

// ─── Campaign Statistics ──────────────────────────────────────────────────────
export interface CampaignStats {
  operationsCompleted: number;
  operationsFailed: number;
  sectorsSecured: number;
  researchDataCollected: number;
  civiliansExtracted: number;
  anomaliesDiscovered: number;
  totalResourcesRecovered: Record<string, number>;
}

// ─── Operations Archive Record ────────────────────────────────────────────────
export interface ArchiveMissionRecord {
  missionId: string;
  missionTitle: string;
  sectorId: string;
  outcome: "SUCCESS" | "PARTIAL" | "FAILURE";
  timestamp: string;
  xpEarned: number;
  creditsEarned: number;
  resourcesEarned: Record<string, number>;
  objectivesCompleted: number;
  objectivesTotal: number;
  difficulty: string;
  durationSeconds: number;
  reputationChanges?: Record<string, number>;
}

// ─── Sector State (Dynamic, Persisted) ───────────────────────────────────────
export interface SectorState {
  id: string;
  status: "SAFE" | "ACTIVE" | "INFECTED" | "CRITICAL" | "LOCKED" | "SECURED" | "DANGEROUS" | "IN_PROGRESS" | "AVAILABLE";
  dangerLevel: "Low" | "Medium" | "High" | "Severe";
  ownership: string;
  completion: number;   // 0-100 campaign progress for this sector
  isUnlocked: boolean;
  // Unlock requirement display labels (shown to player on locked sector)
  unlockRequiredSector?: string;  // Human-readable name of sector to secure first
  unlockRequiredLevel?: number;
  unlockRequiredBioScore?: number;
  unlockRequiredFaction?: string; // Faction name with required standing
  // ─── Campaign State persistence (Sprint 7 additions) ───
  stability: number;                    // 0-100 stability percentage
  influence: Record<string, number>;    // factionId -> influence percentage
  completedMissions: string[];          // list of completed mission IDs in this sector
  availableMissions: string[];          // list of currently available mission IDs in this sector
  worldEvents: string[];                // list of active event IDs in this sector
  contamination: number;                // 0-100 contamination level
  availableResources: string[];         // resources scavengable in this sector
}

// ─── Dynamic Campaign Event ───────────────────────────────────────────────────
export interface DynamicCampaignEvent {
  id: string;
  type: "Outbreak" | "Supply Drop" | "Signal Detected" | "Civilian Distress" | "Faction Conflict" | "Unknown Anomaly" | "Satellite Crash";
  title: string;
  description: string;
  region: string;       // Sector ID
  duration: number;     // Number of missions/turns active
  rewards?: { xp?: number; credits?: number; resource?: string; resourceQty?: number };
}

// ─── World State (Persistent Campaign World) ──────────────────────────────────
export interface WorldState {
  unlockedSectors: string[];
  activeAnomalies: Record<string, string[]>;          // sectorId -> anomaly list
  factionInfluence: Record<string, Record<string, number>>; // sectorId -> factionId -> %
  globalAlerts: string[];
  sectorStates: Record<string, SectorState>;
  activeEvents: DynamicCampaignEvent[];
  longestStreak: number;
  dynamicMissions: Mission[];  // Auto-generated repeatable operations
}

// ─── Sector (Static Definition) ──────────────────────────────────────────────
export interface Sector {
  id: string;
  name: string;
  difficulty: "Easy" | "Normal" | "Hard";
  threatLevel: "Low" | "Medium" | "High" | "Severe";
  threatType: string;
  availableResources: string[];
  description: string;
  points: string;       // SVG polygon points
  labelX: number;
  labelY: number;
  connectedSectors: string[];
}

// ─── Mission Choice ───────────────────────────────────────────────────────────
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
    injury?: number;
    reputationBonus?: number;
    unlocksSectorId?: string;
  };
}

// ─── Mission Event ────────────────────────────────────────────────────────────
export interface MissionEvent {
  id: string;
  title: string;
  text: string;
  options: MissionChoice[];
}

// ─── Mission Objective ────────────────────────────────────────────────────────
export interface MissionObjective {
  id: string;
  description: string;
  status: "PENDING" | "COMPLETED" | "FAILED";
  reward: string;
}

// ─── Mission ──────────────────────────────────────────────────────────────────
export interface Mission {
  id: string;
  title: string;
  description: string;
  region: string;       // Sector ID
  difficulty: "Easy" | "Normal" | "Hard";
  duration: number;
  recommendedClass: string;
  recommendedFaction?: string;
  rewards: { xp: number; credits: number; resource: string; resourceQty: number };
  unlockRequirements: { 
    level?: number; 
    bioScore?: number; 
    completedMissionId?: string;
    requiredFaction?: string;           // Faction ID required to unlock this operation
    requiredFactionStanding?: number;   // Faction standing required to unlock this operation
  };
  category: "critical" | "normal" | "side" | "dynamic";
  events: MissionEvent[];
  story: string;
  primaryObjective: string;
  secondaryObjectives: string[];
  expectedThreat: string;
  environmentalHazard: string;
  recommendedEquipment: string;
  recommendedDivision: string;
  objectives: MissionObjective[];
  // Faction reputation changes on SUCCESS: positive = gain, negative = loss
  factionReputationDelta?: Record<string, number>;
  // Override difficulty-based sector progress points
  sectorProgressPoints?: number;
  // Repeatable missions can be run multiple times
  isRepeatable?: boolean;
}

// ─── Inventory Item ───────────────────────────────────────────────────────────
export interface InventoryItem {
  id: string;
  name: string;
  rarity: "Common" | "Uncommon" | "Rare" | "Epic" | "Legendary";
  quality: number;
  slot: "Helmet" | "Armor" | "Weapon" | "Utility" | "Medkit" | "Backpack" | "Gadget" | "None";
  classRequirement: string;
  factionRequirement?: string;         // Faction ID required to equip
  factionStandingRequirement?: number; // Faction standing required to equip
  power: number;
  desc: string;
  qty: number;
  type: "weapon" | "armor" | "consumable" | "material" | "quest";
  itemLevel: number;
  stats: Record<string, string | number>;
  category: "Weapons" | "Armor" | "Medical" | "Tools" | "Materials" | "Mission Items";
  // ─── Milestone 2 Survival Parameters ───
  weight?: number;                      // weight in kg
  durability?: number;                  // current durability (0-100)
  maxDurability?: number;               // max durability
  upgradeSlots?: number;                // current upgrades applied
  maxUpgradeSlots?: number;             // max upgrade sockets
}

// ─── Crafting Recipe Definition ────────────────────────────────────────────────
export interface CraftingRecipe {
  id: string;
  name: string;
  description: string;
  resultItemId: string;
  resultQty: number;
  ingredients: { itemId: string; qty: number }[];
  requiredLevel?: number;
  requiredFactionRep?: { factionId: string; standing: number };
}

// ─── Equipment Upgrade Recipe ──────────────────────────────────────────────────
export interface UpgradeRecipe {
  id: string;
  name: string;
  description: string;
  targetItemId: string;                 // target item template ID
  ingredients: { itemId: string; qty: number }[];
  statModifiers: Record<string, number | string>; // stats added on upgrade
  powerIncrease: number;
}

// ─── Operative Profile (Persistent Player State) ─────────────────────────────
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
  factionStanding: Record<string, number>;  // factionId -> 0-100
  achievements: string[];
  missionHistory: { missionId: string; outcome: "SUCCESS" | "FAILURE"; timestamp: string }[];
  sectorDiscoveries: string[];
  health: number;
  worldState: WorldState;
  // ── Sprint 7 Additions ──────────────────────────────────────────────────
  campaignStats: CampaignStats;
  operationsArchive: ArchiveMissionRecord[];
  totalPlaytimeSeconds: number;
}
