// ======================================================
// RED QUEEN: OPERATIONS // TOKEN HOLDER & ECOSYSTEM CONFIGS
// ======================================================

// The mint address for the $THREAT token
export const THREAT_TOKEN_MINT = "AUCYMsSZXASMiXfjLNL26NF7sPehUA4ncEzTCx8MdSYg";

// Base limit of deployments per operative per calendar day
export const BASE_DAILY_DEPLOYMENTS = 3;

// Gating threshold for closed beta access (Tier 2 and above)
export const ACCESS_GATE_THRESHOLD = 1000000;

export interface HolderTierConfig {
  threshold: number;
  name: string;
  badge: string;
  xpBoost: number;
  extraDeployments: number;
  resourceChanceBoost: number;
  hasAccess: boolean;
}

export const HOLDER_TIER_1: HolderTierConfig = {
  threshold: 100000,
  name: "Scout / Operative",
  badge: "Holder Badge",
  xpBoost: 0.10, // +10% XP
  extraDeployments: 1, // +1 Daily Deployment
  resourceChanceBoost: 0.0,
  hasAccess: false
};

export const HOLDER_TIER_2: HolderTierConfig = {
  threshold: 1000000,
  name: "Director / Overseer",
  badge: "Elite Badge",
  xpBoost: 0.20, // +20% XP
  extraDeployments: 2, // +2 Daily Deployments
  resourceChanceBoost: 0.05, // +5% Resource Drop Chance
  hasAccess: true // Access to beta operations
};

export const HOLDER_TIER_3: HolderTierConfig = {
  threshold: 2500000,
  name: "Founder / General",
  badge: "Founder Badge",
  xpBoost: 0.25, // +25% XP
  extraDeployments: 3, // +3 Daily Deployments
  resourceChanceBoost: 0.10, // +10% Resource Drop Chance
  hasAccess: true // Access to beta operations
};

export const HOLDER_TIERS_MAP = {
  0: {
    threshold: 0,
    name: "Civilian",
    badge: "None",
    xpBoost: 0.0,
    extraDeployments: 0,
    resourceChanceBoost: 0.0,
    hasAccess: false
  },
  1: HOLDER_TIER_1,
  2: HOLDER_TIER_2,
  3: HOLDER_TIER_3
};

/**
 * Returns the holder tier metadata based on verified token balance.
 */
export function getTierForBalance(balance: number): { tier: number; config: HolderTierConfig | typeof HOLDER_TIERS_MAP[0] } {
  if (balance >= HOLDER_TIER_3.threshold) {
    return { tier: 3, config: HOLDER_TIER_3 };
  } else if (balance >= HOLDER_TIER_2.threshold) {
    return { tier: 2, config: HOLDER_TIER_2 };
  } else if (balance >= HOLDER_TIER_1.threshold) {
    return { tier: 1, config: HOLDER_TIER_1 };
  }
  return { tier: 0, config: HOLDER_TIERS_MAP[0] };
}
