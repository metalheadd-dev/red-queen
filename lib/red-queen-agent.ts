import { z } from "zod";

export const RED_QUEEN_RESPONSE_SCHEMA = z.object({
  threat: z.object({
    classification: z.enum(["REAL", "FICTIONAL", "AMBIGUOUS"]),
    label: z.string().min(1).max(120),
    summary: z.string().min(1).max(320),
    location: z.string().min(1).max(120),
    timeframe: z.enum(["CURRENT", "DEVELOPING", "HYPOTHETICAL", "UNKNOWN"]),
  }),
  situation: z.string().min(1).max(320),
  facts: z.array(z.string().min(1).max(260)).max(4),
  answer: z.string().min(1).max(1400),
  uncertainty: z.string().min(1).max(360),
  action: z.string().min(1).max(420),
  urgency: z.enum(["NONE", "MONITOR", "PREPARE", "ACT_NOW"]),
  confidence: z.enum(["LOW", "MEDIUM", "HIGH"]),
  grounding: z.enum(["GENERAL_KNOWLEDGE", "VERIFIED_LIVE", "SCENARIO_SIMULATION"]),
  usesLiveContext: z.boolean(),
  sourceStatus: z.object({
    freshness: z.enum(["LIVE", "RECENT", "DATED", "NOT_AVAILABLE", "NOT_APPLICABLE"]),
    observedAt: z.string().max(80),
    note: z.string().min(1).max(240),
  }),
  priorities: z.array(z.object({
    title: z.string().min(1).max(100),
    reason: z.string().min(1).max(220),
    timing: z.enum(["NOW", "NEXT_24_HOURS", "NEXT_72_HOURS", "LATER"]),
  })).min(1).max(4),
  followUps: z.array(z.string().min(1).max(140)).min(2).max(3),
  plan: z.object({
    title: z.string().min(1).max(100),
    objective: z.string().min(1).max(280),
    steps: z.array(z.string().min(1).max(220)).min(2).max(5),
    reviewInDays: z.number().int().min(1).max(365),
  }).nullable(),
  procurement: z.object({
    title: z.string().min(1).max(100),
    focus: z.enum(["LOCAL_THREATS", "BLACKOUT", "HOUSEHOLD", "DIGITAL_SECURITY", "HEALTH"]),
    people: z.number().int().min(1).max(12),
    constraints: z.string().max(320),
    rationale: z.string().min(1).max(260),
  }).nullable(),
  loadout: z.object({
    needed: z.boolean(),
    owned: z.array(z.string().min(1).max(140)).max(12),
    missing: z.array(z.object({
      category: z.string().min(1).max(60),
      item: z.string().min(1).max(140),
      priority: z.enum(["ESSENTIAL", "CONTEXTUAL"]),
      reason: z.string().min(1).max(220),
    })).max(10),
    verify: z.array(z.string().min(1).max(160)).max(6),
    doNotBuy: z.array(z.string().min(1).max(180)).max(8),
    budgetNote: z.string().min(1).max(240),
  }).nullable(),
  optionalAction: z.object({
    type: z.enum(["NONE", "SAVE_PLAN", "BUILD_CART", "CHECK_SOURCES", "OPEN_LIVE_MAP", "CONTACT_OFFICIAL_SERVICES"]),
    label: z.string().min(1).max(120),
    reason: z.string().min(1).max(240),
    requiresApproval: z.boolean(),
  }),
  readiness: z.object({
    eligible: z.boolean(),
    xp: z.number().int().min(-5).max(20),
    reason: z.string().min(1).max(220),
    gains: z.object({
      threat_awareness: z.number().int().min(-2).max(3),
      operational_discipline: z.number().int().min(-2).max(3),
      psychological_stability: z.number().int().min(-2).max(3),
      technical_preparedness: z.number().int().min(-2).max(3),
      adaptability: z.number().int().min(-2).max(3),
      resourcefulness: z.number().int().min(-2).max(3),
      surveillance_resistance: z.number().int().min(-2).max(3),
    }),
  }),
});

export type RedQueenAgentResponse = z.infer<typeof RED_QUEEN_RESPONSE_SCHEMA>;

export interface RedQueenSource {
  label: string;
  url: string;
  verified: boolean;
}

export interface RedQueenCommerceItem {
  id: string;
  category: string;
  name: string;
  quantity: string;
  priority: "ESSENTIAL" | "CONTEXTUAL";
  why: string;
  cautions?: string;
  amazonUrl: string;
  x402Offer?: {
    listingId: string;
    title: string;
    price: string;
    currency: string;
    availability: string;
    seller: string;
    verified: boolean;
    detailUrl: string;
  };
  amazonProduct?: {
    asin: string;
    title: string;
    url: string;
    imageUrl: string | null;
    price: string | null;
    availability: string | null;
    marketplace: string;
    provider: "Amazon Creators API";
  };
}

export interface RedQueenCommerceCart {
  status: "CART_READY";
  title: string;
  rationale: string;
  area: string;
  people: number;
  constraints?: string;
  items: RedQueenCommerceItem[];
  fullMarketUrl: string;
  retailerMode: "AGENTIC_PHYSICAL_COMMERCE";
  checkoutBoundary: string;
}

export interface RedQueenClientResponse extends RedQueenAgentResponse {
  message: string;
  sources: RedQueenSource[];
  commerce: RedQueenCommerceCart | null;
  readiness: RedQueenAgentResponse["readiness"] & {
    applied: boolean;
    totalXp: number;
    bioScore: number;
    level: number;
  };
  clearance: {
    tier: number;
    level: number;
    name: string;
    balance: number;
    verified: boolean;
    responseDepth: string;
    contextMessages: number;
    comparisonSignals: number;
    earnedXpMultiplier: number;
  };
  memory: {
    persistent: boolean;
    identity: string;
    deviceContextLoaded: boolean;
  };
}

export function formatAgentMessage(response: RedQueenAgentResponse) {
  const facts = response.facts.length
    ? response.facts.map((fact) => `- ${fact}`).join("\n")
    : "- No verified live facts attached.";
  const priorities = response.priorities
    .map((priority, index) => `${index + 1}. [${priority.timing}] ${priority.title}: ${priority.reason}`)
    .join("\n");
  const plan = response.plan
    ? `${response.plan.title}\n${response.plan.steps.map((step, index) => `${index + 1}. ${step}`).join("\n")}\nReview in ${response.plan.reviewInDays} days.`
    : "No multi-step plan is required for this response.";
  const loadout = response.loadout
    ? [
        response.loadout.owned.length ? `OWNED: ${response.loadout.owned.join(", ")}` : "OWNED: Nothing confirmed.",
        response.loadout.missing.length
          ? `MISSING:\n${response.loadout.missing.map((item) => `- [${item.priority}] ${item.item}: ${item.reason}`).join("\n")}`
          : "MISSING: No purchase gap identified.",
        response.loadout.verify.length ? `VERIFY FIRST: ${response.loadout.verify.join("; ")}` : "",
        response.loadout.doNotBuy.length ? `DO NOT BUY: ${response.loadout.doNotBuy.join("; ")}` : "",
        `BUDGET: ${response.loadout.budgetNote}`,
      ].filter(Boolean).join("\n")
    : "No physical loadout is needed for this response.";
  const readiness = response.readiness.eligible
    ? `\n\nREADINESS: ${response.readiness.xp >= 0 ? "+" : ""}${response.readiness.xp} XP · ${response.readiness.reason}`
    : "";
  const optionalAction = response.optionalAction.type === "NONE"
    ? "No optional action proposed."
    : `${response.optionalAction.label}: ${response.optionalAction.reason}${response.optionalAction.requiresApproval ? " Separate approval required." : ""}`;
  return `THREAT\n[${response.threat.classification}] ${response.threat.label}\n${response.threat.summary}\nLocation: ${response.threat.location} · Timeframe: ${response.threat.timeframe}\n\nASSESSMENT\n${response.situation}\n${facts}\n${response.answer}\nUncertainty: ${response.uncertainty}\nSource freshness: ${response.sourceStatus.freshness} · ${response.sourceStatus.note}\n\nPRIORITIES\n${priorities}\n\nPLAN\nImmediate action: ${response.action}\n${plan}\n\nLOADOUT\n${loadout}\n\nOPTIONAL ACTION\n${optionalAction}${readiness}`;
}
