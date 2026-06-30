import { DEFAULT_STATS, UserStats, calculateBioScore } from "../progression";
import {
  OperativeProfile, Mission, InventoryItem, WorldState, SectorState,
  DynamicCampaignEvent, Sector, CampaignStats, ArchiveMissionRecord, MissionObjective
} from "./types";
import { INITIAL_SECTORS, INITIAL_MISSIONS, INITIAL_INVENTORY, CRAFTING_RECIPES, UPGRADE_RECIPES } from "./data";

// ─── Faction Rival Map ─────────────────────────────────────────────────────────
// When you gain standing with faction A, its rival faction B loses standing.
const FACTION_RIVALS: Record<string, string> = {
  vanguard: "eclipse",
  eclipse:  "vanguard",
  helix:    "citadel",
  citadel:  "helix",
  nomads:   "aegis",
  aegis:    "nomads",
  ghost:    "horizon",
  horizon:  "ghost",
};

// ─── Difficulty-Based Sector Progress Points ───────────────────────────────────
const DIFFICULTY_PROGRESS: Record<string, number> = {
  Easy:   10,
  Normal: 15,
  Hard:   25,
};

// ─── Default Campaign Stats ───────────────────────────────────────────────────
export const DEFAULT_CAMPAIGN_STATS: CampaignStats = {
  operationsCompleted: 0,
  operationsFailed: 0,
  sectorsSecured: 0,
  researchDataCollected: 0,
  civiliansExtracted: 0,
  anomaliesDiscovered: 0,
  totalResourcesRecovered: {},
};

// ─── Default World State ──────────────────────────────────────────────────────
export const DEFAULT_WORLD_STATE: WorldState = {
  unlockedSectors: ["sec-alpha", "sec-beta", "sec-delta"],
  activeAnomalies: {
    "sec-alpha":   ["Toxin Leak"],
    "sec-beta":    ["Gravity Fluctuation"],
    "sec-delta":   ["Sentinel Probe Scan"],
    "sec-epsilon": ["Classified Lock"],
    "sec-zeta":    ["Quantum Freeze"],
  },
  factionInfluence: {
    "sec-alpha":   { vanguard: 40, helix: 20 },
    "sec-beta":    { nomads: 50, eclipse: 10 },
    "sec-delta":   { ghost: 60, aegis: 15 },
    "sec-epsilon": { citadel: 10 },
    "sec-zeta":    { horizon: 30 },
    "sec-gamma":   { helix: 45 },
    "sec-omega":   { vanguard: 20 },
  },
  globalAlerts: [
    "VIRAL OUTBREAK SUSPECTED IN SEC-ALPHA",
    "EM ANOMALY DETECTED IN SUBSTATION BETA",
    "SYBIL PORT TRACING COMMENCED IN DELTA",
  ],
  sectorStates: {
    "sec-alpha": {
      id: "sec-alpha", status: "INFECTED", dangerLevel: "Low",
      ownership: "Vanguard", completion: 20, isUnlocked: true,
      stability: 20,
      influence: { vanguard: 40, helix: 20 },
      completedMissions: [],
      availableMissions: ["op-1-sanctuary-search", "op-6-outpost-breach"],
      worldEvents: ["evt-initial-1"],
      contamination: 25,
      availableResources: ["Medical Supplies", "Credits"],
    },
    "sec-beta": {
      id: "sec-beta", status: "ACTIVE", dangerLevel: "Medium",
      ownership: "Nomads", completion: 0, isUnlocked: true,
      stability: 0,
      influence: { nomads: 50, eclipse: 10 },
      completedMissions: [],
      availableMissions: ["op-2-signal-recovery"],
      worldEvents: [],
      contamination: 15,
      availableResources: ["Electronics", "Credits"],
    },
    "sec-delta": {
      id: "sec-delta", status: "ACTIVE", dangerLevel: "High",
      ownership: "Ghost Division", completion: 0, isUnlocked: true,
      stability: 0,
      influence: { ghost: 60, aegis: 15 },
      completedMissions: [],
      availableMissions: ["op-3-sybil-breach"],
      worldEvents: [],
      contamination: 40,
      availableResources: ["Research Data", "Credits"],
    },
    "sec-epsilon": {
      id: "sec-epsilon", status: "LOCKED", dangerLevel: "Severe",
      ownership: "Citadel", completion: 0, isUnlocked: false,
      unlockRequiredSector: "Sector Alpha",
      unlockRequiredLevel: 2,
      stability: 0,
      influence: { citadel: 10 },
      completedMissions: [],
      availableMissions: ["op-4-server-raid"],
      worldEvents: [],
      contamination: 60,
      availableResources: ["Research Data", "Metal"],
    },
    "sec-zeta": {
      id: "sec-zeta", status: "LOCKED", dangerLevel: "Severe",
      ownership: "Horizon", completion: 0, isUnlocked: false,
      unlockRequiredSector: "Sector Gamma",
      unlockRequiredBioScore: 30,
      stability: 0,
      influence: { horizon: 30 },
      completedMissions: [],
      availableMissions: ["op-8-core-venting"],
      worldEvents: [],
      contamination: 85,
      availableResources: ["Deuterium Cells", "Research Data"],
    },
    "sec-gamma": {
      id: "sec-gamma", status: "LOCKED", dangerLevel: "Medium",
      ownership: "Helix", completion: 0, isUnlocked: false,
      unlockRequiredSector: "Sector Delta",
      unlockRequiredBioScore: 15,
      stability: 0,
      influence: { helix: 45 },
      completedMissions: [],
      availableMissions: ["op-5-satellite-hijack"],
      worldEvents: [],
      contamination: 50,
      availableResources: ["Titanite Scrap", "Credits"],
    },
    "sec-omega": {
      id: "sec-omega", status: "LOCKED", dangerLevel: "Severe",
      ownership: "Citadel", completion: 0, isUnlocked: false,
      unlockRequiredSector: "Sector Epsilon",
      unlockRequiredLevel: 5,
      unlockRequiredFaction: "Citadel (Standing ≥ 40)",
      stability: 0,
      influence: { vanguard: 20 },
      completedMissions: [],
      availableMissions: ["op-7-omega-nexus"],
      worldEvents: [],
      contamination: 90,
      availableResources: ["Energy Cells", "Credits"],
    },
  },
  activeEvents: [
    {
      id: "evt-initial-1",
      type: "Outbreak",
      title: "Atmospheric Pathogen Flareup",
      description: "Toxin density spikes detected around medical depots.",
      region: "sec-alpha",
      duration: 3,
    },
  ],
  longestStreak: 0,
  dynamicMissions: [],
};

// ─── Default Operative Profile ────────────────────────────────────────────────
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
    "Research Data": 1,
    Components: 5,
  },
  stats: { ...DEFAULT_STATS },
  completedMissions: [],
  reputation: 0,
  factionStanding: {
    vanguard: 10,
    eclipse:  0,
    helix:    0,
    nomads:   0,
    citadel:  0,
    ghost:    0,
    aegis:    0,
    horizon:  0,
  },
  achievements: [],
  missionHistory: [],
  sectorDiscoveries: ["sec-alpha", "sec-beta", "sec-delta"],
  health: 100,
  worldState: { ...DEFAULT_WORLD_STATE },
  // ── Sprint 7 ──────────────────────────────────────────────────────────────
  campaignStats: { ...DEFAULT_CAMPAIGN_STATS },
  operationsArchive: [],
  totalPlaytimeSeconds: 0,
};

// ─── Random Event Spawn ────────────────────────────────────────────────────────
export function spawnRandomEvent(worldState: WorldState): { event: DynamicCampaignEvent | null; alert: string | null } {
  const eventTypes: DynamicCampaignEvent["type"][] = [
    "Outbreak", "Supply Drop", "Signal Detected", "Civilian Distress",
    "Faction Conflict", "Unknown Anomaly", "Satellite Crash",
  ];

  const eventDetails: Record<string, { title: string; desc: string }> = {
    "Outbreak":           { title: "Atmospheric Bio-Hazard Outbreak",   desc: "Chemical/viral pathogen counts spiking above safe parameters." },
    "Supply Drop":        { title: "Ecosystem Supply Drop",             desc: "A cargo pod containing rare materials has landed in the region." },
    "Signal Detected":    { title: "Encrypted Signal Intercepted",      desc: "An unidentified telemetry transmission is broadcast from deep hubs." },
    "Civilian Distress":  { title: "Civilian Pod Distress Call",        desc: "Civilian shelter reporting firewall failure and breach threats." },
    "Faction Conflict":   { title: "Faction Skirmish",                  desc: "Tactical friction detected between security cells and rogue trackers." },
    "Unknown Anomaly":    { title: "Quantum Signature Anomaly",         desc: "Gravity drops and spatial compression faults detected." },
    "Satellite Crash":    { title: "Decayed Satellite Debris",          desc: "An orbital satellite has impacted, exposing classified memory logs." },
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
    duration: 3,
  };

  const alertMessage = `ALERT // ${randomType.toUpperCase()} DETECTED IN ${randomSectorId.replace("sec-", "").toUpperCase()}`;
  return { event: newEvent, alert: alertMessage };
}

export function spawnSpecificEvent(
  worldState: WorldState,
  sectorId: string,
  eventType?: DynamicCampaignEvent["type"]
): { event: DynamicCampaignEvent | null; alert: string | null } {
  const eventTypes: DynamicCampaignEvent["type"][] = [
    "Outbreak", "Supply Drop", "Signal Detected", "Civilian Distress",
    "Faction Conflict", "Unknown Anomaly", "Satellite Crash",
  ];

  const eventDetails: Record<string, { title: string; desc: string }> = {
    "Outbreak":           { title: "Atmospheric Bio-Hazard Outbreak",   desc: "Chemical/viral pathogen counts spiking above safe parameters." },
    "Supply Drop":        { title: "Ecosystem Supply Drop",             desc: "A cargo pod containing rare materials has landed in the region." },
    "Signal Detected":    { title: "Encrypted Signal Intercepted",      desc: "An unidentified telemetry transmission is broadcast from deep hubs." },
    "Civilian Distress":  { title: "Civilian Pod Distress Call",        desc: "Civilian shelter reporting firewall failure and breach threats." },
    "Faction Conflict":   { title: "Faction Skirmish",                  desc: "Tactical friction detected between security cells and rogue trackers." },
    "Unknown Anomaly":    { title: "Quantum Signature Anomaly",         desc: "Gravity drops and spatial compression faults detected." },
    "Satellite Crash":    { title: "Decayed Satellite Debris",          desc: "An orbital satellite has impacted, exposing classified memory logs." },
  };

  const type = eventType || eventTypes[Math.floor(Math.random() * eventTypes.length)];
  const info = eventDetails[type];

  const newEvent: DynamicCampaignEvent = {
    id: `evt-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
    type,
    title: info.title,
    description: info.desc,
    region: sectorId,
    duration: 3,
  };

  const alertMessage = `ALERT // ${type.toUpperCase()} DETECTED IN ${sectorId.replace("sec-", "").toUpperCase()}`;
  return { event: newEvent, alert: alertMessage };
}

export function evaluateSectorUnlock(profile: OperativeProfile, sectorState: SectorState): boolean {
  if (sectorState.isUnlocked) return true;

  // Check required sector
  if (sectorState.unlockRequiredSector) {
    const requiredSec = INITIAL_SECTORS.find(
      s => s.name.toLowerCase() === sectorState.unlockRequiredSector?.toLowerCase() || s.id === sectorState.unlockRequiredSector
    );
    if (requiredSec) {
      const reqState = profile.worldState?.sectorStates?.[requiredSec.id];
      const isSecured = reqState ? (reqState.status === "SECURED" || reqState.completion >= 100) : false;
      if (!isSecured) return false;
    }
  }

  // Check level
  if (sectorState.unlockRequiredLevel) {
    if (profile.level < sectorState.unlockRequiredLevel) return false;
  }

  // Check bio-score
  if (sectorState.unlockRequiredBioScore) {
    const bioScore = calculateBioScore(profile.stats);
    if (bioScore < sectorState.unlockRequiredBioScore) return false;
  }

  // Check faction standing
  if (sectorState.unlockRequiredFaction) {
    const match = sectorState.unlockRequiredFaction.match(/([a-zA-Z\s]+)\(Standing\s*≥\s*(\d+)\)/);
    if (match) {
      const factionName = match[1].trim();
      const requiredStanding = parseInt(match[2], 10);
      const factionId = factionName.toLowerCase();
      const currentStanding = (profile.factionStanding || {})[factionId] || 0;
      if (currentStanding < requiredStanding) return false;
    }
  }

  return true;
}

// ─── Dynamic Mission Generator ─────────────────────────────────────────────────
/**
 * Generates repeatable dynamic operations for a given sector based on its current state.
 */
export function generateDynamicMission(sectorId: string, sectorState: SectorState, profileLevel: number): Mission {
  const difficultyByDanger: Record<string, "Easy" | "Normal" | "Hard" | "Critical"> = {
    Low: "Easy", Medium: "Normal", High: "Hard", Severe: "Critical",
  };
  const difficulty = difficultyByDanger[sectorState.dangerLevel] || "Normal";

  const xpBase = 
    difficulty === "Easy" ? 20 : 
    difficulty === "Normal" ? 45 : 
    difficulty === "Hard" ? 80 : 160;

  const creditBase = 
    difficulty === "Easy" ? 35 : 
    difficulty === "Normal" ? 80 : 
    difficulty === "Hard" ? 150 : 300;

  const duration = 
    difficulty === "Easy" ? 4 : 
    difficulty === "Normal" ? 8 : 
    difficulty === "Hard" ? 15 : 25;

  const injuryOpt1 = 
    difficulty === "Easy" ? 10 : 
    difficulty === "Normal" ? 22 : 
    difficulty === "Hard" ? 40 : 70;

  const injuryOpt2 = 
    difficulty === "Easy" ? 5 : 
    difficulty === "Normal" ? 12 : 
    difficulty === "Hard" ? 25 : 45;

  // Reputation delta mapping
  const repDelta: Record<string, number> = {};
  if (difficulty === "Easy") {
    repDelta.vanguard = 5;
  } else if (difficulty === "Normal") {
    repDelta.vanguard = 10;
  } else if (difficulty === "Hard") {
    repDelta.vanguard = 15;
    repDelta.eclipse = -5;
  } else if (difficulty === "Critical") {
    repDelta.vanguard = 30;
    repDelta.eclipse = -15;
  }

  const resources = ["Metal", "Electronics", "Medical Supplies", "Energy Cells", "Components"];
  const resource = resources[Math.floor(Math.random() * resources.length)];

  const templates = [
    {
      suffix: "SWEEP", titleWord: "PERIMETER SWEEP",
      desc: `Clear rogue drone presence from ${sectorId.replace("sec-", "Sector ").toUpperCase()} supply corridors.`,
      story: `Automated defense drones have gone rogue in the sector's supply corridors. Clear the perimeter and restore safe passage for resource transports.`,
      primary: "Neutralize all rogue drones in supply corridor.",
      hazard: "Kinetic turret fire",
      threat: "Rogue autonomous drones",
    },
    {
      suffix: "RECON", titleWord: "RECON SWEEP",
      desc: `Conduct a reconnaissance sweep of ${sectorId.replace("sec-", "Sector ").toUpperCase()} to update threat intelligence.`,
      story: `Intelligence on this sector is outdated. Deploy and gather updated threat assessments, document anomalies, and report back to Command.`,
      primary: "Survey sector perimeter and document active threats.",
      hazard: "Environmental contamination",
      threat: "Surveillance detection, patrol units",
    },
    {
      suffix: "EXTRACT", titleWord: "RESOURCE EXTRACTION",
      desc: `Extract critical materials from ${sectorId.replace("sec-", "Sector ").toUpperCase()} before hostile factions claim them.`,
      story: `Rival factions have identified a resource cache in the area. Extract the supplies before they are seized and lost to enemy logistics networks.`,
      primary: "Secure and extract resource cache from contested zone.",
      hazard: "Rival faction patrols",
      threat: "Armed rival operatives, booby-trapped containers",
    },
  ];

  const template = templates[Math.floor(Math.random() * templates.length)];
  const now = Date.now();

  const objectives: MissionObjective[] = [
    { id: `dyn-obj-1-${now}`, description: template.primary, status: "PENDING", reward: `${xpBase} XP` },
    { id: `dyn-obj-2-${now}`, description: "Recover any secondary intel discovered during sweep", status: "PENDING", reward: `${Math.round(creditBase * 0.3)} CR` },
  ];
  if (difficulty === "Hard" || difficulty === "Critical") {
    objectives.push({ id: `dyn-obj-3-${now}`, description: "Decrypt sector telemetry node keychains", status: "PENDING", reward: "Components" });
  }
  if (difficulty === "Critical") {
    objectives.push({ id: `dyn-obj-4-${now}`, description: "Exfiltrate database host anomalies securely", status: "PENDING", reward: "Energy Cells" });
  }

  return {
    id: `dyn-${sectorId}-${template.suffix}-${now}`,
    title: `OPERATION ${template.titleWord} [${sectorId.replace("sec-", "").toUpperCase()}]`,
    description: template.desc,
    region: sectorId,
    difficulty,
    duration,
    recommendedClass: "Assault",
    rewards: { xp: xpBase, credits: creditBase, resource, resourceQty: difficulty === "Critical" ? 5 : difficulty === "Hard" ? 3 : 2 },
    unlockRequirements: { level: Math.max(1, profileLevel - 1) },
    category: "dynamic",
    story: template.story,
    primaryObjective: template.primary,
    secondaryObjectives: ["Recover any secondary intel discovered during sweep"],
    expectedThreat: template.threat,
    environmentalHazard: template.hazard,
    recommendedEquipment: "Standard tactical loadout",
    recommendedDivision: "Command Division",
    objectives,
    factionReputationDelta: repDelta,
    isRepeatable: true,
    events: [
      {
        id: `dyn-ev-1-${now}`,
        title: "CONTACT",
        text: "Hostile elements detected in the operational zone. Engage or evade.",
        options: [
          {
            id: `dyn-ev-opt1-${now}`,
            text: "Engage hostiles directly.",
            success_prob: difficulty === "Critical" ? 60 : difficulty === "Hard" ? 68 : 75,
            class_bonus: { classId: "Assault", bonus: 15 },
            success_text: "Contacts neutralized. Zone cleared.",
            failure_text: "Hostile fire landed hits before you could suppress them.",
            effects: { xp: Math.round(xpBase * 0.4), credits: Math.round(creditBase * 0.3), injury: injuryOpt1 },
          },
          {
            id: `dyn-ev-opt2-${now}`,
            text: "Evade and bypass using alternate route.",
            success_prob: difficulty === "Critical" ? 65 : difficulty === "Hard" ? 72 : 80,
            class_bonus: { classId: "Recon", bonus: 15 },
            success_text: "You bypassed the hostile patrol without incident.",
            failure_text: "The alternate route was also covered. Minor injury sustained.",
            effects: { xp: Math.round(xpBase * 0.3), credits: Math.round(creditBase * 0.2), injury: injuryOpt2 },
          },
        ],
      },
      {
        id: `dyn-ev-2-${now}`,
        title: "OBJECTIVE SECURED",
        text: "Primary objective is in range. Execute the final phase.",
        options: [
          {
            id: `dyn-ev-opt3-${now}`,
            text: "Execute primary objective.",
            success_prob: difficulty === "Critical" ? 70 : difficulty === "Hard" ? 78 : 85,
            success_text: "Objective completed successfully. Initiating extraction.",
            failure_text: "Unexpected complication. Partial success only.",
            effects: { xp: Math.round(xpBase * 0.6), credits: Math.round(creditBase * 0.7), reputationBonus: difficulty === "Critical" ? 15 : 5 },
          },
        ],
      },
    ],
  };
}

// ─── Campaign Completion Calculator ───────────────────────────────────────────
export function calculateCampaignCompletion(worldState: WorldState, totalSectors: number): number {
  if (!worldState.sectorStates || totalSectors === 0) return 0;
  const secured = Object.values(worldState.sectorStates).filter(s => s.status === "SECURED").length;
  return Math.round((secured / totalSectors) * 100);
}

// ─── AI Commentary Generator ──────────────────────────────────────────────────
export function generateAICommentary(profile: OperativeProfile, sector: Sector, sectorState: SectorState | undefined, mission: Mission): string {
  const factionId = mission.recommendedFaction?.toLowerCase() || "";
  const factionStanding = factionId ? (profile.factionStanding[factionId] || 0) : 0;
  const status = sectorState ? sectorState.status : "ACTIVE";
  const commentaries: string[] = [];

  if (profile.class === mission.recommendedClass) {
    commentaries.push(`Recon operative recommended. Operative class matches direct parameters.`);
  } else {
    commentaries.push(`Deployment parameters recommend a [${mission.recommendedClass.toUpperCase()}] class. Adjust tactical approach.`);
  }

  if (factionId && factionStanding > 20) {
    commentaries.push(`${mission.recommendedFaction} requests assistance. Relationship verified.`);
  }

  if (status === "CRITICAL") {
    commentaries.push(`Civilian survival probability decreased. Danger index critical.`);
  }

  if (mission.environmentalHazard && mission.environmentalHazard !== "None") {
    commentaries.push(`Radiation exceeds acceptable threshold. Calibrating containment shield.`);
  }

  if (commentaries.length === 0) return "Operations hub online. Commencing tactical briefing.";
  return commentaries[Math.floor(Math.random() * commentaries.length)];
}

// ─── Red Queen AI Integration Service Points ───
export class RedQueenIntelligenceService {
  /**
   * Generates a tactical daily briefing for the player based on global progression, threat levels, and active anomalies.
   */
  static getDailyBriefing(profile: OperativeProfile, sectors: Sector[]): { title: string; content: string; warning: boolean } {
    const activeSectorCount = sectors.filter(s => profile.worldState.unlockedSectors.includes(s.id) || s.id === "sec-alpha").length;
    const securedCount = Object.values(profile.worldState.sectorStates || {}).filter(s => s.status === "SECURED").length;
    const isCrisis = profile.health < 40;
    
    let content = `DAILY STRATEGIC BRIEFING:\nAll systems nominal. ${activeSectorCount} sectors are currently online. Faction standing calibration completed.`;
    if (securedCount > 0) {
      content += ` Campaign progression verified: ${securedCount} zones fully secured.`;
    }
    if (isCrisis) {
      content += ` OPERATIONAL ALERT: Operative vitality below threshold. Medical hub treatment strongly recommended before deployment.`;
    }

    return {
      title: `TACTICAL DIRECTIVE: MONITOR STATUS`,
      content,
      warning: isCrisis
    };
  }

  /**
   * Generates a detailed tactical analysis commentary for a mission briefing.
   */
  static getMissionBriefingCommentary(profile: OperativeProfile, sector: Sector, sectorState: SectorState | undefined, mission: Mission): string {
    return generateAICommentary(profile, sector, sectorState, mission);
  }

  /**
   * Generates a debriefing evaluation post-operation based on success and events completed.
   */
  static getMissionDebriefing(profile: OperativeProfile, mission: Mission, outcome: "SUCCESS" | "DEFEAT", eventsCompleted: number): string {
    if (outcome === "SUCCESS") {
      return `RED QUEEN AI DEBRIEFING:\n"Objective secured cleanly in ${mission.region.toUpperCase()}. Operations matrix parameters updated successfully. Well done, operative."`;
    } else {
      return `RED QUEEN AI DEBRIEFING:\n"Critical failure detected in ${mission.region.toUpperCase()} at event index ${eventsCompleted}. Bio-status recalibrating. Operative recovery required."`;
    }
  }

  /**
   * Evaluates operative's equipped items and recommends upgrades or swaps from inventory.
   */
  static getEquipmentRecommendations(profile: OperativeProfile, inventory: InventoryItem[]): string[] {
    const recommendations: string[] = [];
    const unequippedGears = inventory.filter(item => !item.equipped && (item.type === "weapon" || item.type === "armor"));
    
    const slots: ("Helmet" | "Armor" | "Weapon" | "Utility" | "Medkit" | "Backpack" | "Gadget")[] = 
      ["Helmet", "Armor", "Weapon", "Utility", "Medkit", "Backpack", "Gadget"];
      
    slots.forEach(slot => {
      const equipped = inventory.find(item => item.equipped && item.slot === slot);
      const better = unequippedGears
        .filter(item => item.slot === slot)
        .sort((a, b) => b.power - a.power)[0];
        
      if (better && (!equipped || better.power > equipped.power)) {
        recommendations.push(`UPGRADE DETECTED: [${better.name}] in inventory has higher rating than current slot configuration.`);
      }
    });

    if (recommendations.length === 0) {
      recommendations.push("Loadout metrics optimal. No immediate equipment shift recommended.");
    }
    return recommendations;
  }

  /**
   * Performs an analysis of the operative's BIO SCORE and suggests progression avenues.
   */
  static analyzeBioScore(profile: OperativeProfile): { bioScore: number; tier: string; suggestion: string } {
    const bioScore = calculateBioScore(profile.stats);
    let tier = "Tier I: Standard Operative";
    let suggestion = "Complete basic operations to increase Level and acquire better tactical gear.";
    
    if (bioScore >= 50) {
      tier = "Tier III: Elite Operative";
      suggestion = "Deploy to Critical regions and upgrade equipment sockets to maximum efficiency.";
    } else if (bioScore >= 25) {
      tier = "Tier II: Advanced Operative";
      suggestion = "Upgrade weapons and shields to bypass security locks in advanced sectors.";
    }

    return { bioScore, tier, suggestion };
  }

  /**
   * Generates a campaign completion report and highlights blocked/locked zones.
   */
  static analyzeCampaignStatus(profile: OperativeProfile, sectors: Sector[]): { completionRate: number; recommendation: string } {
    const total = sectors.length;
    const secured = Object.values(profile.worldState?.sectorStates || {}).filter(s => s.status === "SECURED").length;
    const rate = total > 0 ? Math.round((secured / total) * 100) : 0;
    
    let recommendation = "Securing Sector Alpha is the primary campaign gateway.";
    const lockedSectors = sectors.filter(s => {
      const state = profile.worldState?.sectorStates?.[s.id];
      return state ? !state.isUnlocked : s.id !== "sec-alpha";
    });

    if (lockedSectors.length > 0) {
      const nextOne = lockedSectors[0];
      recommendation = `Access block detected on ${nextOne.name}. Fulfill level/bio-score requirements detailed in the Sector Overview.`;
    } else {
      recommendation = "All sectors authorized. Secure remaining operations to claim global status.";
    }

    return { completionRate: rate, recommendation };
  }
}

// ─── Profile Loader (Self-Healing) ────────────────────────────────────────────
export function loadProfile(identifier: string): OperativeProfile {
  if (typeof window === "undefined") return { ...DEFAULT_PROFILE };

  const saved = localStorage.getItem(`rq_ops_profile:${identifier}`);
  if (!saved) return { ...DEFAULT_PROFILE };

  try {
    const parsed = JSON.parse(saved);

    // Self-heal sector states to include new unlock requirement fields
    const savedSectorStates: Record<string, SectorState> = parsed.worldState?.sectorStates || {};
    const healedSectorStates: Record<string, SectorState> = {};
    Object.keys(DEFAULT_WORLD_STATE.sectorStates).forEach(sid => {
      const defaults = DEFAULT_WORLD_STATE.sectorStates[sid];
      const existing = savedSectorStates[sid] || {};
      healedSectorStates[sid] = {
        ...defaults,
        ...existing,
        // Always preserve lock requirements from defaults (so they always show)
        unlockRequiredSector:  defaults.unlockRequiredSector,
        unlockRequiredLevel:   defaults.unlockRequiredLevel,
        unlockRequiredBioScore: defaults.unlockRequiredBioScore,
        unlockRequiredFaction: defaults.unlockRequiredFaction,
        // Add Sprint 7 campaign state fields
        stability:             typeof existing.stability === "number" ? existing.stability : (existing.completion || defaults.completion || 0),
        influence:             existing.influence || { ...(DEFAULT_WORLD_STATE.sectorStates[sid]?.influence || {}) },
        completedMissions:     Array.isArray(existing.completedMissions) ? existing.completedMissions : [],
        availableMissions:     Array.isArray(existing.availableMissions) ? existing.availableMissions : [...(defaults.availableMissions || [])],
        worldEvents:           Array.isArray(existing.worldEvents) ? existing.worldEvents : [...(defaults.worldEvents || [])],
        // Add Milestone 2 campaign state fields
        contamination:         typeof existing.contamination === "number" ? existing.contamination : (defaults.contamination !== undefined ? defaults.contamination : 15),
        availableResources:    Array.isArray(existing.availableResources) ? existing.availableResources : [...(defaults.availableResources || [])],
      };
    });
    // Also preserve any extra sector states that aren't in defaults
    Object.keys(savedSectorStates).forEach(sid => {
      if (!healedSectorStates[sid]) healedSectorStates[sid] = savedSectorStates[sid];
    });

    const worldState: WorldState = {
      unlockedSectors:  Array.isArray(parsed.worldState?.unlockedSectors) ? parsed.worldState.unlockedSectors : DEFAULT_WORLD_STATE.unlockedSectors,
      activeAnomalies:  parsed.worldState?.activeAnomalies  || DEFAULT_WORLD_STATE.activeAnomalies,
      factionInfluence: parsed.worldState?.factionInfluence || DEFAULT_WORLD_STATE.factionInfluence,
      globalAlerts:     Array.isArray(parsed.worldState?.globalAlerts) ? parsed.worldState.globalAlerts : DEFAULT_WORLD_STATE.globalAlerts,
      sectorStates:     healedSectorStates,
      activeEvents:     Array.isArray(parsed.worldState?.activeEvents) ? parsed.worldState.activeEvents : [...DEFAULT_WORLD_STATE.activeEvents],
      longestStreak:    typeof parsed.worldState?.longestStreak === "number" ? parsed.worldState.longestStreak : 0,
      dynamicMissions:  Array.isArray(parsed.worldState?.dynamicMissions) ? parsed.worldState.dynamicMissions : [],
    };

    // Self-heal campaign stats
    const campaignStats: CampaignStats = {
      ...DEFAULT_CAMPAIGN_STATS,
      ...(parsed.campaignStats || {}),
    };

    // Self-heal operations archive
    const operationsArchive: ArchiveMissionRecord[] = Array.isArray(parsed.operationsArchive)
      ? parsed.operationsArchive
      : [];

    const profile: OperativeProfile = {
      name:               parsed.name               || DEFAULT_PROFILE.name,
      faction:            parsed.faction             || DEFAULT_PROFILE.faction,
      class:              parsed.class               || DEFAULT_PROFILE.class,
      role:               parsed.role                || DEFAULT_PROFILE.role,
      level:              typeof parsed.level === "number"       ? parsed.level    : DEFAULT_PROFILE.level,
      xp:                 typeof parsed.xp === "number"          ? parsed.xp       : DEFAULT_PROFILE.xp,
      credits:            typeof parsed.credits === "number"     ? parsed.credits  : DEFAULT_PROFILE.credits,
      resources:          { ...DEFAULT_PROFILE.resources, ...(parsed.resources || {}) },
      stats:              { ...DEFAULT_STATS, ...(parsed.stats || {}) },
      completedMissions:  Array.isArray(parsed.completedMissions) ? parsed.completedMissions : [],
      reputation:         typeof parsed.reputation === "number"  ? parsed.reputation : DEFAULT_PROFILE.reputation,
      factionStanding:    { ...DEFAULT_PROFILE.factionStanding, ...(parsed.factionStanding || {}) },
      achievements:       Array.isArray(parsed.achievements) ? parsed.achievements : [],
      missionHistory:     Array.isArray(parsed.missionHistory) ? parsed.missionHistory : [],
      sectorDiscoveries:  Array.isArray(parsed.sectorDiscoveries) ? parsed.sectorDiscoveries : DEFAULT_PROFILE.sectorDiscoveries,
      health:             typeof parsed.health === "number" ? parsed.health : 100,
      worldState,
      campaignStats,
      operationsArchive,
      totalPlaytimeSeconds: typeof parsed.totalPlaytimeSeconds === "number" ? parsed.totalPlaytimeSeconds : 0,
    };

    // Auto-unlock sectors on load if requirements are met
    const finalUnlocked = new Set(profile.worldState.unlockedSectors);
    let changed = false;
    Object.keys(profile.worldState.sectorStates).forEach(sid => {
      const secState = profile.worldState.sectorStates[sid];
      if (!secState.isUnlocked) {
        if (evaluateSectorUnlock(profile, secState)) {
          secState.isUnlocked = true;
          if (secState.status === "LOCKED") secState.status = "ACTIVE";
          finalUnlocked.add(sid);
          changed = true;
        }
      }
    });
    if (changed) {
      profile.worldState.unlockedSectors = Array.from(finalUnlocked);
    }

    // Ensure active sectors have repeatable operations (no dead-ends)
    Object.keys(profile.worldState.sectorStates).forEach(sid => {
      const secState = profile.worldState.sectorStates[sid];
      if (secState.isUnlocked) {
        const staticMissions = INITIAL_MISSIONS.filter(m => m.region === sid && !profile.completedMissions.includes(m.id));
        const dynamicMissions = profile.worldState.dynamicMissions.filter(m => m.region === sid);
        
        if (staticMissions.length === 0 && dynamicMissions.length === 0) {
          const newDyn = generateDynamicMission(sid, secState, profile.level);
          profile.worldState.dynamicMissions.push(newDyn);
        }
      }
    });

    return profile;
  } catch (err) {
    console.error("Failed to load operations profile:", err);
    return { ...DEFAULT_PROFILE };
  }
}

// ─── Profile Saver ─────────────────────────────────────────────────────────────
export function saveProfile(identifier: string, profile: OperativeProfile): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(`rq_ops_profile:${identifier}`, JSON.stringify(profile));
}

// ─── Reusable Loot Drop Templates & Tables ──────────────────────────────────────
const LOOT_TEMPLATES = {
  Common: [
    { id: "inv-6", name: "Decoy Signature Key", slot: "Utility", power: 10, type: "consumable", category: "Tools", desc: "Injects synthetic user profiles to misdirect rogue Sybil trackers.", weight: 0.1, durability: 100, maxDurability: 100 },
    { id: "inv-9", name: "Modular Tactical Pack", slot: "Backpack", power: 15, type: "armor", category: "Armor", desc: "Extra load-bearing compartments reinforced with composite materials.", weight: 1.2, durability: 100, maxDurability: 100, upgradeSlots: 0, maxUpgradeSlots: 1 },
    { id: "inv-12", name: "Raw Titanite Scrap", slot: "None", power: 0, type: "material", category: "Materials", desc: "Scraped bulkhead alloys for crafting primary shield plates.", weight: 0.5 }
  ] as any[],
  Uncommon: [
    { id: "inv-3", name: "Advanced Stim Injector", slot: "Medkit", power: 25, type: "consumable", category: "Medical", desc: "Rapidly restores 30 HP and neutralizes bio-toxins.", weight: 0.2, durability: 100, maxDurability: 100 },
    { id: "inv-7", name: "Quantum Decryptor Pad", slot: "Gadget", power: 30, type: "weapon", category: "Tools", desc: "Processes localized sub-quantum key decryptions.", weight: 0.8, durability: 100, maxDurability: 100, upgradeSlots: 0, maxUpgradeSlots: 2 },
    { id: "mat-bio-sample", name: "Pathogen Biostrain Sample", slot: "None", power: 0, type: "material", category: "Materials", desc: "Biological sample containing pathogenetic material.", weight: 0.1 }
  ] as any[],
  Rare: [
    { id: "inv-1", name: "Kinetic Carbine V3", slot: "Weapon", power: 45, type: "weapon", category: "Weapons", desc: "Standard-issue kinetic assault carbine.", weight: 3.8, durability: 100, maxDurability: 100, upgradeSlots: 0, maxUpgradeSlots: 3, stats: { DPS: 48, Accuracy: "94%" } },
    { id: "inv-5", name: "C-4 Anomaly Breach Charge", slot: "Utility", power: 50, type: "consumable", category: "Tools", desc: "Heavy breach charge.", weight: 2.0, durability: 100, maxDurability: 100 },
    { id: "inv-11", name: "Deuterium Power Cell", slot: "None", power: 0, type: "material", category: "Materials", desc: "High-density plasma power cell.", weight: 0.3 },
    { id: "mat-encrypted-intel", name: "Encrypted Decryption Keyring", slot: "None", power: 0, type: "material", category: "Materials", desc: "Decentralized telemetry keyring.", weight: 0.05 }
  ] as any[],
  Epic: [
    { id: "inv-2", name: "Stealth Recon Cloak", slot: "Gadget", power: 65, type: "weapon", category: "Armor", desc: "Spectra bending camouflage cloak.", weight: 1.5, durability: 100, maxDurability: 100, upgradeSlots: 0, maxUpgradeSlots: 2, stats: { Stealth: "+30", Evade: "+12%" } },
    { id: "inv-8", name: "Helix Biosensor Helmet", slot: "Helmet", power: 75, type: "armor", category: "Armor", desc: "Helps monitor vital biosensors.", weight: 1.8, durability: 100, maxDurability: 100, upgradeSlots: 0, maxUpgradeSlots: 2, stats: { ThreatDetection: "+20" } }
  ] as any[],
  Legendary: [
    { id: "inv-4", name: "Volumetric Shield Core", slot: "Armor", power: 90, type: "armor", category: "Armor", desc: "Advanced shielding generator.", weight: 5.2, durability: 100, maxDurability: 100, upgradeSlots: 0, maxUpgradeSlots: 4, stats: { Shield: "+150", Mitigation: "20%" } }
  ] as any[]
};

export interface LootDropResult {
  items: InventoryItem[];
  resources: Record<string, number>;
  credits: number;
}

export function generateLootDrops(difficulty: string, dangerLevel: string, sectorId: string): LootDropResult {
  const diffMultiplier = 
    difficulty === "Critical" ? 3.5 : 
    difficulty === "Hard" ? 2.2 : 
    difficulty === "Normal" ? 1.5 : 1.0;

  // 1. Credits drop roll
  const baseCredits = Math.floor(Math.random() * 20) + 15;
  const credits = Math.round(baseCredits * diffMultiplier);

  // 2. Thematic resource rolls
  const resources: Record<string, number> = {};
  let thematicResources: string[] = ["Metal", "Components"];
  if (sectorId === "sec-alpha") thematicResources = ["Metal", "Components"];
  else if (sectorId === "sec-beta") thematicResources = ["Electronics", "Energy Cells"];
  else if (sectorId === "sec-gamma") thematicResources = ["Medical Supplies", "Research Data"];
  else if (sectorId === "sec-delta") thematicResources = ["Metal", "Electronics"];
  else if (sectorId === "sec-epsilon") thematicResources = ["Research Data", "Components"];
  else if (sectorId === "sec-zeta") thematicResources = ["Metal", "Components"];
  else if (sectorId === "sec-eta") thematicResources = ["Energy Cells", "Components"];

  // Quantity bundles: Easy=1, Normal=2, Hard=3, Critical=4
  const bundlesCount = difficulty === "Critical" ? 4 : difficulty === "Hard" ? 3 : difficulty === "Normal" ? 2 : 1;
  for (let i = 0; i < bundlesCount; i++) {
    const resName = thematicResources[Math.floor(Math.random() * thematicResources.length)];
    const baseQty = Math.floor(Math.random() * 3) + 1;
    resources[resName] = (resources[resName] || 0) + Math.round(baseQty * (diffMultiplier * 0.8 || 1));
  }

  // 3. Item drop roll
  const items: InventoryItem[] = [];
  const itemRoll = Math.random();
  let shouldDrop = false;
  let rarity: "Common" | "Uncommon" | "Rare" | "Epic" | "Legendary" = "Common";

  if (difficulty === "Critical") {
    shouldDrop = true;
    if (itemRoll < 0.15) rarity = "Legendary";
    else if (itemRoll < 0.45) rarity = "Epic";
    else rarity = "Rare";
  } else if (difficulty === "Hard") {
    shouldDrop = true;
    if (itemRoll < 0.05) rarity = "Legendary";
    else if (itemRoll < 0.20) rarity = "Epic";
    else if (itemRoll < 0.60) rarity = "Rare";
    else rarity = "Uncommon";
  } else if (difficulty === "Normal") {
    shouldDrop = itemRoll < 0.60;
    if (itemRoll < 0.02) rarity = "Epic";
    else if (itemRoll < 0.15) rarity = "Rare";
    else if (itemRoll < 0.50) rarity = "Uncommon";
    else rarity = "Common";
  } else {
    shouldDrop = itemRoll < 0.30;
    if (itemRoll < 0.05) rarity = "Rare";
    else if (itemRoll < 0.30) rarity = "Uncommon";
    else rarity = "Common";
  }

  if (shouldDrop) {
    const templates = LOOT_TEMPLATES[rarity] || LOOT_TEMPLATES.Common;
    let thematicTemplates = templates;
    if (sectorId === "sec-gamma") {
      thematicTemplates = templates.filter(t => t.category === "Medical" || t.id.includes("bio") || t.id.includes("stim"));
    } else if (sectorId === "sec-delta") {
      thematicTemplates = templates.filter(t => t.type === "weapon" || t.category === "Weapons");
    } else if (sectorId === "sec-alpha" || sectorId === "sec-zeta") {
      thematicTemplates = templates.filter(t => t.type === "armor" || t.category === "Armor");
    }

    if (thematicTemplates.length === 0) {
      thematicTemplates = templates;
    }

    const picked = thematicTemplates[Math.floor(Math.random() * thematicTemplates.length)];
    let qty = 1;
    if (picked.type === "material") {
      qty = Math.floor(Math.random() * 4) + 1;
    } else if (picked.type === "consumable") {
      qty = Math.floor(Math.random() * 2) + 1;
    }

    items.push({
      ...picked,
      id: `${picked.id}-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      qty,
      rarity,
      quality: Math.floor(Math.random() * 20) + 80,
      itemLevel: difficulty === "Critical" ? 25 : difficulty === "Hard" ? 20 : difficulty === "Normal" ? 12 : 5,
      classRequirement: picked.classRequirement || "None",
      stats: picked.stats || {},
      weight: picked.weight ?? 0.5,
      durability: picked.durability ?? 100,
      maxDurability: picked.maxDurability ?? 100,
    } as InventoryItem);
  }

  return { items, resources, credits };
}

// ─── Mission Reward Claim (Sprint 7: Full Campaign Engine) ────────────────────
/**
 * Claims mission outcome rewards. Applies:
 * - Difficulty-based sector progress (Easy +10%, Normal +15%, Hard +25%)
 * - Faction reputation gain and rival faction penalty
 * - Operations archive logging
 * - Campaign stats tracking
 * - Sector security → adjacent unlocks
 * - World event spawning
 */
export function claimMissionRewards(
  profile: OperativeProfile,
  mission: Mission,
  outcome: "SUCCESS" | "PARTIAL" | "FAILURE" | "CRITICAL_FAILURE",
  cumulativeRewards: { xp: number; credits: number; resources: Record<string, number>; injury: number; reputationBonus: number },
  unlockedSectorId?: string,
  objectivesCompleted?: number,
  objectivesTotal?: number,
  missionDurationSeconds?: number,
): { updatedProfile: OperativeProfile; levelUpMessage: string | null; worldEventsMessage: string | null; lootedItems: InventoryItem[] } {
  const updated = { ...profile };

  const xpGain      = cumulativeRewards.xp      || 0;
  let creditGain    = cumulativeRewards.credits  || 0;
  const repGain     = cumulativeRewards.reputationBonus || 0;
  const isSuccess   = outcome === "SUCCESS" || outcome === "PARTIAL";

  // ── 1. XP + Level ─────────────────────────────────────────────────────────
  const newXP    = updated.xp + xpGain;
  const newLevel = Math.floor(newXP / 100) + 1;
  let levelUpMessage: string | null = null;
  if (newLevel > updated.level) {
    levelUpMessage = `OPERATIVE LEVEL UP! Clearance level increased to Level ${newLevel}.`;
  }
  updated.xp    = newXP;
  updated.level = newLevel;

  const stats = { ...DEFAULT_STATS, ...updated.stats };
  stats.xp    = newXP;
  stats.level = newLevel;
  updated.stats = stats;

  // ── 2. Health ──────────────────────────────────────────────────────────────
  if (outcome === "FAILURE" || outcome === "CRITICAL_FAILURE") {
    updated.health = 10;
  } else {
    updated.health = Math.max(10, updated.health - cumulativeRewards.injury);
  }

  // ── 3. Credits + Resources ─────────────────────────────────────────────────
  const lootedItems: InventoryItem[] = [];
  if (isSuccess) {
    const sectorDanger = updated.worldState?.sectorStates?.[mission.region]?.dangerLevel || "Medium";
    const lootResult = generateLootDrops(mission.difficulty, sectorDanger, mission.region);
    
    creditGain += lootResult.credits;
    Object.entries(lootResult.resources).forEach(([resName, qty]) => {
      cumulativeRewards.resources[resName] = (cumulativeRewards.resources[resName] || 0) + qty;
    });

    if (lootResult.items && lootResult.items.length > 0) {
      lootedItems.push(...lootResult.items);
      lootResult.items.forEach(item => {
        const val = item.type === "material" ? item.qty : 1;
        cumulativeRewards.resources[item.name] = (cumulativeRewards.resources[item.name] || 0) + val;
      });
    }
  }

  updated.credits = (updated.credits || 0) + creditGain;
  const resources = { ...updated.resources };
  Object.entries(cumulativeRewards.resources || {}).forEach(([k, v]) => {
    resources[k] = (resources[k] || 0) + (v || 0);
  });
  // Mission base rewards on success
  if (isSuccess) {
    const baseResource = mission.rewards.resource;
    let baseQty      = mission.rewards.resourceQty || 0;
    
    // Check for active Supply Drop event in this region to double the resources
    const hasSupplyDrop = (updated.worldState?.activeEvents || []).some(
      evt => evt.region === mission.region && evt.type === "Supply Drop"
    );
    if (hasSupplyDrop) {
      baseQty *= 2;
    }
    
    if (baseResource && baseQty > 0) {
      resources[baseResource] = (resources[baseResource] || 0) + baseQty;
    }
  }
  updated.resources = resources;

  // ── 4. Completed Missions ──────────────────────────────────────────────────
  const completed = new Set(updated.completedMissions);
  if (isSuccess) completed.add(mission.id);
  updated.completedMissions = Array.from(completed);

  const sectors = new Set(updated.sectorDiscoveries);
  sectors.add(mission.region);
  updated.sectorDiscoveries = Array.from(sectors);

  // ── 5. Mission History ─────────────────────────────────────────────────────
  updated.missionHistory = [
    { missionId: mission.id, outcome: isSuccess ? "SUCCESS" : "FAILURE", timestamp: new Date().toISOString() },
    ...updated.missionHistory,
  ];

  // ── 6. Faction Standing (with rival penalty) ───────────────────────────────
  const factionId   = mission.recommendedFaction?.toLowerCase() || "";
  const standings   = { ...updated.factionStanding };

  if (factionId && standings[factionId] !== undefined) {
    const gain = outcome === "SUCCESS" ? 10 : outcome === "PARTIAL" ? 5 : 2;
    standings[factionId] = Math.min(100, standings[factionId] + gain);

    // Rival faction loses standing
    const rivalId = FACTION_RIVALS[factionId];
    if (rivalId && standings[rivalId] !== undefined) {
      const rivalLoss = isSuccess ? 5 : 2;
      standings[rivalId] = Math.max(0, standings[rivalId] - rivalLoss);
    }
  }

  // Apply custom factionReputationDelta from mission definition
  if (isSuccess && mission.factionReputationDelta) {
    Object.entries(mission.factionReputationDelta).forEach(([fid, delta]) => {
      if (standings[fid] !== undefined) {
        standings[fid] = Math.max(0, Math.min(100, standings[fid] + delta));
      }
    });
  }

  updated.factionStanding = standings;
  updated.reputation = Math.min(1000, updated.reputation + repGain);

  // ── 7. Campaign Stats ──────────────────────────────────────────────────────
  const cStats = { ...updated.campaignStats } as CampaignStats;
  if (isSuccess) {
    cStats.operationsCompleted = (cStats.operationsCompleted || 0) + 1;
    // Track resources recovered
    const rr = { ...(cStats.totalResourcesRecovered || {}) };
    Object.entries(cumulativeRewards.resources || {}).forEach(([k, v]) => {
      rr[k] = (rr[k] || 0) + (v || 0);
    });
    if (mission.rewards.resource) {
      let qty = mission.rewards.resourceQty || 0;
      const isSupplyDrop = (updated.worldState?.activeEvents || []).some(e => e.region === mission.region && e.type === "Supply Drop");
      if (isSupplyDrop) qty *= 2;
      rr[mission.rewards.resource] = (rr[mission.rewards.resource] || 0) + qty;
    }
    cStats.totalResourcesRecovered = rr;

    // Track research data collected
    if (mission.rewards.resource === "Research Data") {
      let qty = mission.rewards.resourceQty || 0;
      const isSupplyDrop = (updated.worldState?.activeEvents || []).some(e => e.region === mission.region && e.type === "Supply Drop");
      if (isSupplyDrop) qty *= 2;
      cStats.researchDataCollected = (cStats.researchDataCollected || 0) + qty;
    }
    const rDataGained = (cumulativeRewards.resources || {})["Research Data"] || 0;
    if (rDataGained > 0) {
      cStats.researchDataCollected = (cStats.researchDataCollected || 0) + rDataGained;
    }

    // Track anomalies discovered
    if (mission.title.toLowerCase().includes("anomaly") || mission.story.toLowerCase().includes("anomaly")) {
      cStats.anomaliesDiscovered = (cStats.anomaliesDiscovered || 0) + 1;
    }

    // Track civilians extracted
    if (mission.title.toLowerCase().includes("sanctuary") || mission.story.toLowerCase().includes("civilian") || mission.title.toLowerCase().includes("rescue")) {
      cStats.civiliansExtracted = (cStats.civiliansExtracted || 0) + 3; // Base 3 survivors
    }
    
    // Check if there is an active event that is civilian distress or anomaly and add extra rewards
    const sectorEvent = (updated.worldState?.activeEvents || []).find(evt => evt.region === mission.region);
    if (sectorEvent) {
      if (sectorEvent.type === "Civilian Distress") {
        cStats.civiliansExtracted = (cStats.civiliansExtracted || 0) + 5;
      } else if (sectorEvent.type === "Unknown Anomaly") {
        cStats.anomaliesDiscovered = (cStats.anomaliesDiscovered || 0) + 1;
      }
    }
  } else {
    cStats.operationsFailed = (cStats.operationsFailed || 0) + 1;
  }
  updated.campaignStats = cStats;

  // ── 8. Operations Archive ──────────────────────────────────────────────────
  const archiveEntry: ArchiveMissionRecord = {
    missionId:           mission.id,
    missionTitle:        mission.title,
    sectorId:            mission.region,
    outcome:             isSuccess ? (outcome === "SUCCESS" ? "SUCCESS" : "PARTIAL") : "FAILURE",
    timestamp:           new Date().toISOString(),
    xpEarned:            xpGain,
    creditsEarned:       creditGain,
    resourcesEarned:     { ...(cumulativeRewards.resources || {}) },
    objectivesCompleted: objectivesCompleted ?? 0,
    objectivesTotal:     objectivesTotal ?? mission.objectives?.length ?? 0,
    difficulty:          mission.difficulty,
    durationSeconds:     missionDurationSeconds ?? (mission.duration * 60),
    reputationChanges:   mission.factionReputationDelta ? { ...mission.factionReputationDelta } : {},
  };
  updated.operationsArchive = [archiveEntry, ...(updated.operationsArchive || [])].slice(0, 50);

  // ── 9. World Progression ───────────────────────────────────────────────────
  const worldState = { ...updated.worldState };

  if (!worldState.sectorStates) {
    worldState.sectorStates = { ...DEFAULT_WORLD_STATE.sectorStates };
  } else {
    worldState.sectorStates = { ...worldState.sectorStates };
  }

  worldState.activeEvents = Array.isArray(worldState.activeEvents) ? [...worldState.activeEvents] : [];
  worldState.dynamicMissions = Array.isArray(worldState.dynamicMissions) ? [...worldState.dynamicMissions] : [];

  const unlocked = new Set(worldState.unlockedSectors);
  const alerts = [...(worldState.globalAlerts || [])];
  let worldEventsMessage: string | null = null;

  if (isSuccess) {
    const regionId = mission.region;

    if (!worldState.sectorStates[regionId]) {
      worldState.sectorStates[regionId] = {
        id: regionId,
        status: "ACTIVE",
        dangerLevel: "Medium",
        ownership: mission.recommendedFaction || "None",
        completion: 0,
        isUnlocked: true,
        stability: 0,
        influence: {},
        completedMissions: [],
        availableMissions: [],
        worldEvents: [],
        contamination: 20,
        availableResources: ["Credits", "Components"],
      };
    }

    const currentSectorState = { ...worldState.sectorStates[regionId] };
    const oldCompletion = currentSectorState.completion;

    // Identify category-specific modifiers
    const titleLower = mission.title.toLowerCase();
    const isStory = mission.category === "critical";
    const isEmergency = titleLower.includes("emergency") || titleLower.includes("outbreak") || titleLower.includes("venting") || titleLower.includes("distress");
    const isRecon = titleLower.includes("recon") || titleLower.includes("beacon") || titleLower.includes("satellite");
    const isResearch = titleLower.includes("research") || titleLower.includes("sybil") || titleLower.includes("server") || titleLower.includes("data");
    const isSupply = titleLower.includes("supply") || titleLower.includes("recovery") || titleLower.includes("salvage");

    let compGain = mission.sectorProgressPoints ?? DIFFICULTY_PROGRESS[mission.difficulty] ?? 15;
    let stabGain = compGain;
    let contReduction = 5;

    if (isStory) {
      compGain = 25;
      stabGain = 20;
      contReduction = 15;
    } else if (isEmergency) {
      compGain = 15;
      stabGain = 25;
      contReduction = 35;
    } else if (isRecon) {
      compGain = 15;
      stabGain = 10;
      contReduction = 10;
      // Recon unlocks adjacent sector instantly
      const staticSector = INITIAL_SECTORS.find(s => s.id === regionId);
      if (staticSector?.connectedSectors) {
        staticSector.connectedSectors.forEach(connId => {
          if (worldState.sectorStates[connId] && !worldState.sectorStates[connId].isUnlocked) {
            worldState.sectorStates[connId].isUnlocked = true;
            if (worldState.sectorStates[connId].status === "LOCKED") {
              worldState.sectorStates[connId].status = "ACTIVE";
            }
            unlocked.add(connId);
          }
        });
      }
    } else if (isResearch) {
      compGain = 15;
      stabGain = 10;
      contReduction = 5;
    } else if (isSupply) {
      compGain = 15;
      stabGain = 15;
      contReduction = 5;
      // Supply improves available resources list
      const existingResources = currentSectorState.availableResources || [];
      const enriched = Array.from(new Set([...existingResources, "Energy Cells", "Components", "Biological Samples"]));
      currentSectorState.availableResources = enriched;
    }

    currentSectorState.completion = Math.min(100, oldCompletion + compGain);
    currentSectorState.stability = Math.min(100, (currentSectorState.stability || 0) + stabGain);
    currentSectorState.contamination = Math.max(0, (currentSectorState.contamination || 0) - contReduction);

    // Track completed missions in sector
    const secComp = new Set(currentSectorState.completedMissions || []);
    secComp.add(mission.id);
    currentSectorState.completedMissions = Array.from(secComp);

    // Remove from available if not repeatable
    if (!mission.isRepeatable) {
      currentSectorState.availableMissions = (currentSectorState.availableMissions || []).filter(id => id !== mission.id);
    }

    if (currentSectorState.completion >= 100 && currentSectorState.status !== "SECURED") {
      currentSectorState.completion = 100;
      currentSectorState.status = "SECURED";

      // Reduce danger on securing
      if      (currentSectorState.dangerLevel === "Severe") currentSectorState.dangerLevel = "High";
      else if (currentSectorState.dangerLevel === "High")   currentSectorState.dangerLevel = "Medium";
      else if (currentSectorState.dangerLevel === "Medium") currentSectorState.dangerLevel = "Low";

      // Increment campaign secured count
      cStats.sectorsSecured = (cStats.sectorsSecured || 0) + 1;
      updated.campaignStats = { ...cStats };

      // Unlock connected sectors
      const staticSector = INITIAL_SECTORS.find(s => s.id === regionId);
      if (staticSector?.connectedSectors) {
        staticSector.connectedSectors.forEach(connId => {
          unlocked.add(connId);
          if (!worldState.sectorStates[connId]) {
            const staticConn = INITIAL_SECTORS.find(s => s.id === connId);
            worldState.sectorStates[connId] = {
              id: connId, status: "ACTIVE",
              dangerLevel: (staticConn?.threatLevel as SectorState["dangerLevel"]) || "Medium",
              ownership: staticConn?.threatType || "None",
              completion: 0, isUnlocked: true,
              stability: 0,
              influence: {},
              completedMissions: [],
              availableMissions: staticConn ? INITIAL_MISSIONS.filter(m => m.region === connId).map(m => m.id) : [],
              worldEvents: [],
              contamination: 20,
              availableResources: staticConn?.availableResources || ["Credits", "Components"],
            };
          } else {
            const connState = { ...worldState.sectorStates[connId] };
            connState.isUnlocked = true;
            if (connState.status === "LOCKED") connState.status = "ACTIVE";
            worldState.sectorStates[connId] = connState;
          }
        });
      }

      worldEventsMessage = `GRID STABILITY SECURED // ${staticSector?.name?.toUpperCase() || "SECTOR"} SECURED // ADJACENT CHANNELS NOW ACCESSIBLE`;
    } else {
      worldEventsMessage = `SECTOR UPLINK INTEGRITY: ${oldCompletion}% → ${currentSectorState.completion}%`;
    }

    // Faction influence on sector level
    const influence = { ...worldState.factionInfluence };
    const sectorInf = { ...(currentSectorState.influence || {}) };
    if (factionId) {
      sectorInf[factionId] = Math.min(100, (sectorInf[factionId] || 0) + 15);
      // Rival faction loses influence
      const rivalId = FACTION_RIVALS[factionId];
      if (rivalId) sectorInf[rivalId] = Math.max(0, (sectorInf[rivalId] || 0) - 8);
      influence[mission.region] = sectorInf;
    }
    currentSectorState.influence = sectorInf;
    worldState.factionInfluence = influence;
    
    worldState.sectorStates[regionId] = currentSectorState;

    // Specific mission world effects
    const activeAnoms = { ...worldState.activeAnomalies };
    if (mission.id === "op-1-sanctuary-search") {
      activeAnoms["sec-alpha"] = [];
      unlocked.add("sec-epsilon");
      alerts.push("RADIATION STORM SPREADING TO EPSILON SILOS");
      worldEventsMessage = "GRID SHIFT // SANCTUARY SECURED // SECTOR EPSILON ONLINE";
      if (worldState.sectorStates["sec-epsilon"]) {
        worldState.sectorStates["sec-epsilon"] = {
          ...worldState.sectorStates["sec-epsilon"],
          isUnlocked: true, status: "ACTIVE",
        };
      }
    } else if (mission.id === "op-2-signal-recovery") {
      activeAnoms["sec-beta"] = [];
      alerts.push("VOLATILE PATHOGEN ANOMALY SPIKING IN GAMMA");
    }
    worldState.activeAnomalies = activeAnoms;

    // Resolve active event in this region on success
    const activeEventIdx = worldState.activeEvents.findIndex(evt => evt.region === regionId);
    if (activeEventIdx !== -1) {
      const resolvedEvent = worldState.activeEvents[activeEventIdx];
      worldState.activeEvents.splice(activeEventIdx, 1);
      
      // Remove event ID from sector level
      currentSectorState.worldEvents = (currentSectorState.worldEvents || []).filter(id => id !== resolvedEvent.id);
      
      const staticSector = INITIAL_SECTORS.find(s => s.id === regionId);
      alerts.push(`RESOLVED // ${resolvedEvent.type.toUpperCase()} NEUTRALIZED IN ${regionId.replace("sec-", "").toUpperCase()}`);
      
      if (currentSectorState.completion >= 100) {
        currentSectorState.status = "SECURED";
        currentSectorState.dangerLevel = "Low";
      } else {
        currentSectorState.status = "ACTIVE";
        currentSectorState.dangerLevel = (staticSector?.threatLevel as SectorState["dangerLevel"]) || "Medium";
      }
      worldEventsMessage = `EVENT RESOLVED // ${resolvedEvent.type.toUpperCase()} NEUTRALIZED // REGIONAL DANGER NORMALIZED`;
    }

    // Generate a dynamic mission for this sector after success
    const newDynMission = generateDynamicMission(regionId, currentSectorState, newLevel);
    
    // Add dynamic mission ID to sector's availableMissions list (removing old dyn- missions for this sector)
    const filteredAvailable = (currentSectorState.availableMissions || []).filter(id => !id.startsWith("dyn-"));
    currentSectorState.availableMissions = [...filteredAvailable, newDynMission.id];
    
    // Remove old dynamic missions for this sector (keep max 1 per sector)
    worldState.dynamicMissions = [
      ...worldState.dynamicMissions.filter(m => m.region !== regionId),
      newDynMission,
    ].slice(-12); // Keep at most 12 dynamic missions globally

    worldState.sectorStates[regionId] = currentSectorState;
  }

  // ── 10. Survival Streak ────────────────────────────────────────────────────
  let currentStreak = 0;
  for (const h of updated.missionHistory) {
    if (h.outcome === "SUCCESS") currentStreak++;
    else break;
  }
  worldState.longestStreak = Math.max(worldState.longestStreak || 0, currentStreak);

  // ── 11. Event Aging + New Event Spawn ─────────────────────────────────────
  worldState.activeEvents = worldState.activeEvents
    .map(evt => ({ ...evt, duration: evt.duration - 1 }))
    .filter(evt => evt.duration > 0);

  if (isSuccess) {
    // 30% chance of spawning new event in some other unlocked sector
    if (Math.random() < 0.30) {
      const otherSectors = worldState.unlockedSectors.filter(id => id !== mission.region);
      if (otherSectors.length > 0) {
        const targetId = otherSectors[Math.floor(Math.random() * otherSectors.length)];
        const { event, alert } = spawnSpecificEvent(worldState, targetId);
        if (event && alert) {
          worldState.activeEvents.push(event);
          alerts.push(alert);
          if (worldState.sectorStates[targetId]) {
            const tgtState = { ...worldState.sectorStates[targetId] };
            tgtState.status = event.type === "Outbreak" ? "INFECTED" : "ACTIVE";
            tgtState.dangerLevel = "Severe";
            
            // Add event ID to sector's worldEvents
            const tgtEvents = new Set(tgtState.worldEvents || []);
            tgtEvents.add(event.id);
            tgtState.worldEvents = Array.from(tgtEvents);
            
            worldState.sectorStates[targetId] = tgtState;
          }
        }
      }
    }
  } else {
    // Failure / Critical Failure: 60% chance of triggering event in current sector
    if (Math.random() < 0.60) {
      const hasExistingEvent = worldState.activeEvents.some(evt => evt.region === mission.region);
      if (!hasExistingEvent) {
        const type = Math.random() < 0.5 ? "Outbreak" : "Civilian Distress";
        const { event, alert } = spawnSpecificEvent(worldState, mission.region, type);
        if (event && alert) {
          worldState.activeEvents.push(event);
          alerts.push(alert);
          if (worldState.sectorStates[mission.region]) {
            const tgtState = { ...worldState.sectorStates[mission.region] };
            tgtState.status = type === "Outbreak" ? "INFECTED" : "ACTIVE";
            tgtState.dangerLevel = "Severe";
            
            // Add event ID to sector's worldEvents
            const tgtEvents = new Set(tgtState.worldEvents || []);
            tgtEvents.add(event.id);
            tgtState.worldEvents = Array.from(tgtEvents);
            
            worldState.sectorStates[mission.region] = tgtState;
          }
          worldEventsMessage = `ALERT // ${type.toUpperCase()} SPIKED IN ${mission.region.replace("sec-", "").toUpperCase()} DUE TO DEPLOYMENT FAILURE`;
        }
      }
    }
  }

  // ── 11.5 Auto-evaluate Sector Unlocks ─────────────────────────────────────────
  Object.keys(worldState.sectorStates).forEach(sectorId => {
    const secState = worldState.sectorStates[sectorId];
    if (!secState.isUnlocked) {
      const canUnlock = evaluateSectorUnlock(updated, secState);
      if (canUnlock) {
        secState.isUnlocked = true;
        if (secState.status === "LOCKED") {
          secState.status = "ACTIVE";
        }
        unlocked.add(sectorId);
        alerts.push(`SECTOR ACCESS GRANTED // ${sectorId.replace("sec-", "").toUpperCase()} DECRYPTED`);
        worldEventsMessage = `GRID DECRYPTED // ACCESS GRANTED TO ${sectorId.replace("sec-", "SECTOR ").toUpperCase()}`;
      }
    }
  });

  worldState.globalAlerts = alerts.slice(-6);
  worldState.unlockedSectors = Array.from(unlocked);
  updated.worldState = worldState;

  // ── 12. Achievements ───────────────────────────────────────────────────────
  const achievements = new Set(updated.achievements);
  if (updated.missionHistory.length >= 1)                                               achievements.add("FIRST_CONTACT");
  if (updated.missionHistory.filter(h => h.outcome === "SUCCESS").length >= 3)          achievements.add("TACTICIAN");
  if (newLevel >= 3)                                                                     achievements.add("SURVIVALIST");
  if (updated.sectorDiscoveries.length >= 4)                                            achievements.add("CARTOGRAPHER");
  if (updated.campaignStats.sectorsSecured >= 1)                                        achievements.add("PACIFIER");
  if (updated.campaignStats.operationsCompleted >= 10)                                  achievements.add("VETERAN");
  if (updated.factionStanding[factionId] >= 50)                                         achievements.add("ALLIED");
  updated.achievements = Array.from(achievements);

  return { updatedProfile: updated, levelUpMessage, worldEventsMessage, lootedItems };
}

// ─── Inventory Loaders ────────────────────────────────────────────────────────
export function loadInventory(identifier: string, defaultInventory: InventoryItem[]): InventoryItem[] {
  if (typeof window === "undefined") return defaultInventory;
  const saved = localStorage.getItem(`rq_ops_inventory:${identifier}`);
  if (!saved) return defaultInventory;
  try { return JSON.parse(saved); } catch { return defaultInventory; }
}

export function saveInventory(identifier: string, inventory: InventoryItem[]): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(`rq_ops_inventory:${identifier}`, JSON.stringify(inventory));
}

export function loadEquippedGear(identifier: string): Record<string, InventoryItem | null> {
  const defaultSlots = { Helmet: null, Armor: null, Weapon: null, Utility: null, Medkit: null, Backpack: null, Gadget: null };
  if (typeof window === "undefined") return defaultSlots;
  const saved = localStorage.getItem(`rq_ops_equipped:${identifier}`);
  if (!saved) return defaultSlots;
  try { return JSON.parse(saved); } catch { return defaultSlots; }
}

export function saveEquippedGear(identifier: string, equippedGear: Record<string, InventoryItem | null>): void {
  if (typeof window === "undefined") return;
  localStorage.setItem(`rq_ops_equipped:${identifier}`, JSON.stringify(equippedGear));
}

// ─── Crafting & Upgrade Mechanics Backend Foundation ──────────────────────────
export function craftItem(
  profile: OperativeProfile,
  inventory: InventoryItem[],
  recipeId: string
): { updatedProfile: OperativeProfile; updatedInventory: InventoryItem[]; success: boolean; message: string } {
  const recipe = CRAFTING_RECIPES.find(r => r.id === recipeId);
  if (!recipe) {
    return { updatedProfile: profile, updatedInventory: inventory, success: false, message: "Recipe not found." };
  }

  if (recipe.requiredLevel && profile.level < recipe.requiredLevel) {
    return { updatedProfile: profile, updatedInventory: inventory, success: false, message: `Requires Operative Level ${recipe.requiredLevel}.` };
  }

  const updatedProfile = { ...profile, resources: { ...profile.resources } };
  const nextInv = inventory.map(item => ({ ...item }));

  const isProfileResource = (itemId: string) => {
    return ["Metal", "Electronics", "Medical Supplies", "Energy Cells", "Research Data", "Components"].includes(itemId);
  };

  // Verify ingredients
  for (const ing of recipe.ingredients) {
    if (isProfileResource(ing.itemId)) {
      const available = updatedProfile.resources[ing.itemId] || 0;
      if (available < ing.qty) {
        return { updatedProfile: profile, updatedInventory: inventory, success: false, message: `Insufficient ${ing.itemId} resource.` };
      }
    } else {
      const invItem = nextInv.find(i => i.id === ing.itemId);
      if (!invItem || invItem.qty < ing.qty) {
        return { updatedProfile: profile, updatedInventory: inventory, success: false, message: `Insufficient ${ing.itemId} in inventory.` };
      }
    }
  }

  // Consume ingredients
  recipe.ingredients.forEach(ing => {
    if (isProfileResource(ing.itemId)) {
      updatedProfile.resources[ing.itemId] -= ing.qty;
    } else {
      const invItem = nextInv.find(i => i.id === ing.itemId)!;
      invItem.qty -= ing.qty;
    }
  });

  // Filter out exhausted materials/consumables
  const filteredInv = nextInv.filter(i => i.qty > 0 || i.type === "weapon" || i.type === "armor");

  // Get result template
  const template = INITIAL_INVENTORY.find(i => i.id === recipe.resultItemId);
  if (!template) {
    return { updatedProfile: profile, updatedInventory: filteredInv, success: false, message: "Result item template missing." };
  }

  // Add crafted item
  const isStackable = template.type === "material" || template.type === "consumable";
  const existing = filteredInv.find(i => i.id === template.id);
  if (isStackable && existing) {
    existing.qty += recipe.resultQty;
  } else {
    const newId = `${template.id}-crafted-${Date.now()}`;
    filteredInv.push({
      ...template,
      id: newId,
      qty: recipe.resultQty,
      quality: 100,
      durability: 100,
      maxDurability: 100,
      upgradeSlots: 0,
      maxUpgradeSlots: template.maxUpgradeSlots || 2
    });
  }

  return {
    updatedProfile: updatedProfile,
    updatedInventory: filteredInv,
    success: true,
    message: `Synthesized ${recipe.name} successfully.`
  };
}

export function upgradeEquipment(
  profile: OperativeProfile,
  inventory: InventoryItem[],
  upgradeRecipeId: string,
  targetItemInstanceId: string
): { updatedProfile: OperativeProfile; updatedInventory: InventoryItem[]; success: boolean; message: string } {
  const recipe = UPGRADE_RECIPES.find(r => r.id === upgradeRecipeId);
  if (!recipe) {
    return { updatedProfile: profile, updatedInventory: inventory, success: false, message: "Upgrade recipe not found." };
  }

  const nextInv = inventory.map(item => ({ ...item }));
  const targetItem = nextInv.find(i => i.id === targetItemInstanceId);
  if (!targetItem) {
    return { updatedProfile: profile, updatedInventory: inventory, success: false, message: "Selected item instance not found." };
  }

  if (targetItem.id !== recipe.targetItemId && !targetItem.id.startsWith(recipe.targetItemId)) {
    return { updatedProfile: profile, updatedInventory: inventory, success: false, message: "Recipe mismatch for this equipment." };
  }

  if ((targetItem.upgradeSlots || 0) >= (targetItem.maxUpgradeSlots || 3)) {
    return { updatedProfile: profile, updatedInventory: inventory, success: false, message: "Equipment has reached max upgrade slots." };
  }

  const updatedProfile = { ...profile, resources: { ...profile.resources } };

  const isProfileResource = (itemId: string) => {
    return ["Metal", "Electronics", "Medical Supplies", "Energy Cells", "Research Data", "Components"].includes(itemId);
  };

  // Verify ingredients
  for (const ing of recipe.ingredients) {
    if (isProfileResource(ing.itemId)) {
      const available = updatedProfile.resources[ing.itemId] || 0;
      if (available < ing.qty) {
        return { updatedProfile: profile, updatedInventory: inventory, success: false, message: `Insufficient ${ing.itemId} resource.` };
      }
    } else {
      const invItem = nextInv.find(i => i.id === ing.itemId);
      if (!invItem || invItem.qty < ing.qty) {
        return { updatedProfile: profile, updatedInventory: inventory, success: false, message: "Insufficient upgrade components." };
      }
    }
  }

  // Consume ingredients
  recipe.ingredients.forEach(ing => {
    if (isProfileResource(ing.itemId)) {
      updatedProfile.resources[ing.itemId] -= ing.qty;
    } else {
      const invItem = nextInv.find(i => i.id === ing.itemId)!;
      invItem.qty -= ing.qty;
    }
  });

  const filteredInv = nextInv.filter(i => i.qty > 0 || i.type === "weapon" || i.type === "armor");

  // Apply stat changes
  const upgraded = filteredInv.find(i => i.id === targetItemInstanceId)!;
  upgraded.upgradeSlots = (upgraded.upgradeSlots || 0) + 1;
  upgraded.power += recipe.powerIncrease;
  upgraded.stats = {
    ...upgraded.stats,
    ...recipe.statModifiers
  };

  return {
    updatedProfile: updatedProfile,
    updatedInventory: filteredInv,
    success: true,
    message: `Upgraded ${upgraded.name} (Socket ${upgraded.upgradeSlots}/${upgraded.maxUpgradeSlots}).`
  };
}
