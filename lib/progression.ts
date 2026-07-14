export interface UserStats {
  xp: number;
  level: number;
  threat_awareness: number;
  operational_discipline: number;
  psychological_stability: number;
  technical_preparedness: number;
  adaptability: number;
  resourcefulness: number;
  surveillance_resistance: number;
}

export const DEFAULT_STATS: UserStats = {
  xp: 0,
  level: 1,
  threat_awareness: 0,
  operational_discipline: 0,
  psychological_stability: 0,
  technical_preparedness: 0,
  adaptability: 0,
  resourcefulness: 0,
  surveillance_resistance: 0
};

export const CLEARANCE_LEVELS = [
  { level: 1, label: "CIVILIAN", minScore: 0, maxScore: 20, color: "#e8e8e8" },
  { level: 2, label: "OBSERVER", minScore: 21, maxScore: 40, color: "#f0c929" },
  { level: 3, label: "OPERATIVE", minScore: 41, maxScore: 60, color: "#00ffcc" },
  { level: 4, label: "ANALYST", minScore: 61, maxScore: 80, color: "#a855f7" },
  { level: 5, label: "DIRECTOR", minScore: 81, maxScore: 100, color: "#ff0033" }
];

export function getClearanceLevel(bioScore: number) {
  for (const tier of CLEARANCE_LEVELS) {
    if (bioScore >= tier.minScore && bioScore <= tier.maxScore) {
      return tier;
    }
  }
  return CLEARANCE_LEVELS[0]; // fallback
}

/**
 * Calculates the overall BIO SCORE (0-100) based on sub-stats.
 */
export function calculateBioScore(stats?: UserStats): number {
  if (!stats) return 0;
  const sum = 
    (stats.threat_awareness || 0) + 
    (stats.operational_discipline || 0) + 
    (stats.psychological_stability || 0) + 
    (stats.technical_preparedness || 0) + 
    (stats.adaptability || 0) + 
    (stats.resourcefulness || 0) + 
    (stats.surveillance_resistance || 0);
  const avg = Math.floor(sum / 7);
  return Math.min(100, Math.max(0, avg));
}

/**
 * Serializes stats and adds it to the user's scenario array.
 */
export function getStatsFromScenarios(scenarios: string[] | null | undefined): UserStats {
  if (!scenarios || !Array.isArray(scenarios)) return { ...DEFAULT_STATS };
  
  const statsString = scenarios.find(s => s.startsWith("__STATS__:"));
  if (!statsString) return { ...DEFAULT_STATS };

  try {
    const rawJson = statsString.replace("__STATS__:", "");
    const parsed = JSON.parse(rawJson);
    return {
      xp: typeof parsed.xp === 'number' ? parsed.xp : 0,
      level: typeof parsed.level === 'number' ? parsed.level : 1,
      threat_awareness: typeof parsed.threat_awareness === 'number' ? parsed.threat_awareness : 0,
      operational_discipline: typeof parsed.operational_discipline === 'number' ? parsed.operational_discipline : 0,
      psychological_stability: typeof parsed.psychological_stability === 'number' ? parsed.psychological_stability : 0,
      technical_preparedness: typeof parsed.technical_preparedness === 'number' ? parsed.technical_preparedness : 0,
      adaptability: typeof parsed.adaptability === 'number' ? parsed.adaptability : 0,
      resourcefulness: typeof parsed.resourcefulness === 'number' ? parsed.resourcefulness : 0,
      surveillance_resistance: typeof parsed.surveillance_resistance === 'number' ? parsed.surveillance_resistance : 0
    };
  } catch (err) {
    console.error("Failed to parse serialized stats:", err);
    return { ...DEFAULT_STATS };
  }
}

/**
 * Updates stats in scenarios array and returns the updated scenarios array.
 */
export function updateStatsInScenarios(scenarios: string[] | null | undefined, stats: UserStats): string[] {
  const cleanScenarios = (scenarios || []).filter(s => !s.startsWith("__STATS__:"));
  const statsString = `__STATS__:${JSON.stringify(stats)}`;
  return [...cleanScenarios, statsString];
}

/**
 * Removes the stats string from scenarios for normal UI display.
 */
export function getCleanScenarios(scenarios: string[] | null | undefined): string[] {
  if (!scenarios) return [];
  return scenarios.filter(s => !s.startsWith("__STATS__:"));
}

/**
 * Parses stats from AI output block
 * Format expected:
 * [BIO-SCORE: +X XP | STATS: Threat Awareness +Y, Operational Discipline +Z, ...]
 */
export function parseStatsFromAI(aiOutput: string): { xpGain: number; gains: Partial<UserStats> } | null {
  const match = aiOutput.match(/\[BIO-SCORE:\s*([+-]?\d+)\s*XP\s*\|\s*STATS:\s*(.*?)\]/i);
  if (!match) return null;

  const xpGain = parseInt(match[1]) || 0;
  const statsPart = match[2];
  const gains: Partial<UserStats> = {};

  // Map AI text names to object properties
  const fieldMapping: Record<string, keyof UserStats> = {
    "threat awareness": "threat_awareness",
    "operational discipline": "operational_discipline",
    "psychological stability": "psychological_stability",
    "technical preparedness": "technical_preparedness",
    "adaptability": "adaptability",
    "resourcefulness": "resourcefulness",
    "surveillance resistance": "surveillance_resistance"
  };

  const pairs = statsPart.split(",");
  for (const pair of pairs) {
    const parts = pair.trim().split(/\s+([+-]\d+)/);
    if (parts.length >= 2) {
      const name = parts[0].trim().toLowerCase();
      const val = parseInt(parts[1]) || 0;
      const prop = fieldMapping[name];
      if (prop) {
        gains[prop] = val;
      }
    }
  }

  return { xpGain, gains };
}

/**
 * Applies stat gains and levels up the user if threshold reached.
 * Also handles inactivity decay.
 */
export function applyStatGains(current: UserStats, xpGain: number, gains: Partial<UserStats>, lastInteraction?: string): UserStats {
  const updated = { ...current };

  // 1. Apply decay if inactive (e.g. -1 to preparedness per 24 hours of inactivity)
  if (lastInteraction) {
    try {
      const lastDate = new Date(lastInteraction);
      const diffTime = Math.abs(Date.now() - lastDate.getTime());
      const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24));
      if (diffDays > 0) {
        // Decay Technical Preparedness by 1 point per day, minimum 0
        updated.technical_preparedness = Math.max(0, updated.technical_preparedness - diffDays);
      }
    } catch (e) {
      console.error("Decay logic date parse error:", e);
    }
  }

  // 2. Add gains (capped between 0 and 100)
  const addVal = (curr: number, add: number | undefined) => {
    if (add === undefined) return curr;
    return Math.min(100, Math.max(0, curr + add));
  };

  updated.threat_awareness = addVal(updated.threat_awareness, gains.threat_awareness);
  updated.operational_discipline = addVal(updated.operational_discipline, gains.operational_discipline);
  updated.psychological_stability = addVal(updated.psychological_stability, gains.psychological_stability);
  updated.technical_preparedness = addVal(updated.technical_preparedness, gains.technical_preparedness);
  updated.adaptability = addVal(updated.adaptability, gains.adaptability);
  updated.resourcefulness = addVal(updated.resourcefulness, gains.resourcefulness);
  updated.surveillance_resistance = addVal(updated.surveillance_resistance, gains.surveillance_resistance);

  // 3. Update XP and Level
  updated.xp = Math.max(0, updated.xp + xpGain);
  // Level = floor(XP / 100) + 1
  updated.level = Math.floor(updated.xp / 100) + 1;

  return updated;
}

export function getXpMultiplier(params: {
  tokenBalance: number;
  level: number;
  pulseTier: number; // 0 = no tier, 1 = 7-day, 2 = 30-day, 3 = 100-day
}): { total: number; breakdown: { token: number; clearance: number; pulse: number } } {
  const tokenMultiplier = params.tokenBalance > 0 ? 2.0 : 1.0;
  
  const level = params.level || 1;
  const clearanceMultiplier = 
    level >= 5 ? 2.0 : 
    level >= 4 ? 1.75 : 
    level >= 3 ? 1.5 : 
    level >= 2 ? 1.25 : 
    1.0;
    
  let pulseMultiplier = 1.0;
  if (params.pulseTier === 1) pulseMultiplier = 1.1;
  else if (params.pulseTier === 2) pulseMultiplier = 1.25;
  else if (params.pulseTier === 3) pulseMultiplier = 1.5;

  return {
    total: tokenMultiplier * clearanceMultiplier * pulseMultiplier,
    breakdown: {
      token: tokenMultiplier,
      clearance: clearanceMultiplier,
      pulse: pulseMultiplier
    }
  };
}
