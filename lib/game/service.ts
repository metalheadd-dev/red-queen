import { DEFAULT_STATS, UserStats, calculateBioScore } from "../progression";
import {
  OperativeProfile, Mission, InventoryItem, WorldState, SectorState,
  DynamicCampaignEvent, Sector, CampaignStats, ArchiveMissionRecord
} from "./types";
import { INITIAL_SECTORS, INITIAL_MISSIONS } from "./data";

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
    },
    "sec-beta": {
      id: "sec-beta", status: "ACTIVE", dangerLevel: "Medium",
      ownership: "Nomads", completion: 0, isUnlocked: true,
      stability: 0,
      influence: { nomads: 50, eclipse: 10 },
      completedMissions: [],
      availableMissions: ["op-2-signal-recovery"],
      worldEvents: [],
    },
    "sec-delta": {
      id: "sec-delta", status: "ACTIVE", dangerLevel: "High",
      ownership: "Ghost Division", completion: 0, isUnlocked: true,
      stability: 0,
      influence: { ghost: 60, aegis: 15 },
      completedMissions: [],
      availableMissions: ["op-3-sybil-breach"],
      worldEvents: [],
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
  const difficultyByDanger: Record<string, "Easy" | "Normal" | "Hard"> = {
    Low: "Easy", Medium: "Normal", High: "Normal", Severe: "Hard",
  };
  const difficulty = difficultyByDanger[sectorState.dangerLevel] || "Normal";
  const xpBase = difficulty === "Easy" ? 20 : difficulty === "Normal" ? 40 : 65;
  const creditBase = difficulty === "Easy" ? 35 : difficulty === "Normal" ? 80 : 130;

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

  return {
    id: `dyn-${sectorId}-${template.suffix}-${now}`,
    title: `OPERATION ${template.titleWord} [${sectorId.replace("sec-", "").toUpperCase()}]`,
    description: template.desc,
    region: sectorId,
    difficulty,
    duration: difficulty === "Easy" ? 4 : difficulty === "Normal" ? 8 : 12,
    recommendedClass: "Assault",
    rewards: { xp: xpBase, credits: creditBase, resource, resourceQty: difficulty === "Hard" ? 3 : 2 },
    unlockRequirements: { level: Math.max(1, profileLevel - 1) },
    category: "dynamic",
    story: template.story,
    primaryObjective: template.primary,
    secondaryObjectives: ["Recover any secondary intel discovered during sweep"],
    expectedThreat: template.threat,
    environmentalHazard: template.hazard,
    recommendedEquipment: "Standard tactical loadout",
    recommendedDivision: "Command Division",
    objectives: [
      { id: `dyn-obj-1-${now}`, description: template.primary, status: "PENDING", reward: `${xpBase} XP` },
      { id: `dyn-obj-2-${now}`, description: "Recover any secondary intel discovered during sweep", status: "PENDING", reward: `${Math.round(creditBase * 0.3)} CR` },
    ],
    factionReputationDelta: {},
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
            success_prob: 75,
            class_bonus: { classId: "Assault", bonus: 15 },
            success_text: "Contacts neutralized. Zone cleared.",
            failure_text: "Hostile fire landed hits before you could suppress them.",
            effects: { xp: Math.round(xpBase * 0.4), credits: Math.round(creditBase * 0.3), injury: 20 },
          },
          {
            id: `dyn-ev-opt2-${now}`,
            text: "Evade and bypass using alternate route.",
            success_prob: 80,
            class_bonus: { classId: "Recon", bonus: 15 },
            success_text: "You bypassed the hostile patrol without incident.",
            failure_text: "The alternate route was also covered. Minor injury sustained.",
            effects: { xp: Math.round(xpBase * 0.3), credits: Math.round(creditBase * 0.2), injury: 10 },
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
            success_prob: 85,
            success_text: "Objective completed successfully. Initiating extraction.",
            failure_text: "Unexpected complication. Partial success only.",
            effects: { xp: Math.round(xpBase * 0.6), credits: Math.round(creditBase * 0.7), reputationBonus: 5 },
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
): { updatedProfile: OperativeProfile; levelUpMessage: string | null; worldEventsMessage: string | null } {
  const updated = { ...profile };

  const xpGain      = cumulativeRewards.xp      || 0;
  const creditGain  = cumulativeRewards.credits  || 0;
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
      };
    }

    const currentSectorState = { ...worldState.sectorStates[regionId] };
    const oldCompletion = currentSectorState.completion;

    // Difficulty-scaled progress
    const progressGain = mission.sectorProgressPoints ?? DIFFICULTY_PROGRESS[mission.difficulty] ?? 15;
    currentSectorState.completion = Math.min(100, oldCompletion + progressGain);
    currentSectorState.stability = Math.min(100, (currentSectorState.stability || 0) + progressGain);

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

  return { updatedProfile: updated, levelUpMessage, worldEventsMessage };
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
