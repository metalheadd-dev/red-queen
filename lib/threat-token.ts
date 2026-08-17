export const THREAT_TOKEN_MINT = "3SBP25W239gQwTjTebshDcyNKBzM1J9ADRyqDqLQpump";

export interface ThreatClearance {
  tier: number;
  level: number;
  name: "CIVILIAN" | "SCOUT" | "ANALYST" | "SENTINEL" | "COMMAND";
  threshold: number;
  contextMessages: number;
  signalWatchSlots: number;
  responseDepth: "essential" | "standard" | "detailed" | "advanced" | "strategic";
  earnedXpMultiplier: number;
  description: string;
}

export const THREAT_CLEARANCE_LEVELS: ThreatClearance[] = [
  {
    tier: 0,
    level: 1,
    name: "CIVILIAN",
    threshold: 0,
    contextMessages: 6,
    signalWatchSlots: 2,
    responseDepth: "essential",
    earnedXpMultiplier: 1,
    description: "Public intelligence and essential actions.",
  },
  {
    tier: 1,
    level: 2,
    name: "SCOUT",
    threshold: 1,
    contextMessages: 10,
    signalWatchSlots: 3,
    responseDepth: "standard",
    earnedXpMultiplier: 1.05,
    description: "Expanded follow-up context and standard RED QUEEN analysis.",
  },
  {
    tier: 2,
    level: 3,
    name: "ANALYST",
    threshold: 100_000,
    contextMessages: 14,
    signalWatchSlots: 4,
    responseDepth: "detailed",
    earnedXpMultiplier: 1.1,
    description: "Detailed risk decomposition and a larger working context.",
  },
  {
    tier: 3,
    level: 4,
    name: "SENTINEL",
    threshold: 500_000,
    contextMessages: 18,
    signalWatchSlots: 5,
    responseDepth: "advanced",
    earnedXpMultiplier: 1.15,
    description: "Advanced diagnostics, longer context, and scenario comparison.",
  },
  {
    tier: 4,
    level: 5,
    name: "COMMAND",
    threshold: 1_000_000,
    contextMessages: 24,
    signalWatchSlots: 6,
    responseDepth: "strategic",
    earnedXpMultiplier: 1.2,
    description: "Maximum context depth and strategic RED QUEEN analysis.",
  },
];

export function getThreatClearance(balance: number): ThreatClearance {
  const safeBalance = Number.isFinite(balance) ? Math.max(0, balance) : 0;
  return [...THREAT_CLEARANCE_LEVELS]
    .reverse()
    .find((level) => safeBalance >= level.threshold) || THREAT_CLEARANCE_LEVELS[0];
}

export function getNextThreatClearance(balance: number): ThreatClearance | null {
  const current = getThreatClearance(balance);
  return THREAT_CLEARANCE_LEVELS.find((level) => level.tier === current.tier + 1) || null;
}
