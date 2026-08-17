export const THREAT_TOKEN_MINT = "3SBP25W239gQwTjTebshDcyNKBzM1J9ADRyqDqLQpump";

export interface ThreatClearance {
  tier: number;
  level: number;
  name: "CIVILIAN" | "SCOUT" | "OPERATIVE" | "OVERSEER" | "DIRECTOR";
  threshold: number;
  contextMessages: number;
  responseDepth: "essential" | "standard" | "detailed" | "advanced" | "strategic";
  readinessMultiplier: number;
  description: string;
}

export const THREAT_CLEARANCE_LEVELS: ThreatClearance[] = [
  {
    tier: 0,
    level: 1,
    name: "CIVILIAN",
    threshold: 0,
    contextMessages: 6,
    responseDepth: "essential",
    readinessMultiplier: 1,
    description: "Public intelligence and essential actions.",
  },
  {
    tier: 1,
    level: 2,
    name: "SCOUT",
    threshold: 1,
    contextMessages: 10,
    responseDepth: "standard",
    readinessMultiplier: 1.05,
    description: "Persistent context and expanded follow-up analysis.",
  },
  {
    tier: 2,
    level: 3,
    name: "OPERATIVE",
    threshold: 100_000,
    contextMessages: 14,
    responseDepth: "detailed",
    readinessMultiplier: 1.1,
    description: "Deeper risk decomposition and faster readiness progression.",
  },
  {
    tier: 3,
    level: 4,
    name: "OVERSEER",
    threshold: 500_000,
    contextMessages: 18,
    responseDepth: "advanced",
    readinessMultiplier: 1.15,
    description: "Advanced diagnostics, longer context, and scenario comparison.",
  },
  {
    tier: 4,
    level: 5,
    name: "DIRECTOR",
    threshold: 1_000_000,
    contextMessages: 24,
    responseDepth: "strategic",
    readinessMultiplier: 1.2,
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
