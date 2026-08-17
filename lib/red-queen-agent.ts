import { z } from "zod";

export const RED_QUEEN_RESPONSE_SCHEMA = z.object({
  situation: z.string().min(1).max(320),
  facts: z.array(z.string().min(1).max(260)).max(4),
  answer: z.string().min(1).max(1400),
  uncertainty: z.string().min(1).max(360),
  action: z.string().min(1).max(420),
  urgency: z.enum(["NONE", "MONITOR", "PREPARE", "ACT_NOW"]),
  confidence: z.enum(["LOW", "MEDIUM", "HIGH"]),
  grounding: z.enum(["GENERAL_KNOWLEDGE", "VERIFIED_LIVE", "SCENARIO_SIMULATION"]),
  usesLiveContext: z.boolean(),
  followUps: z.array(z.string().min(1).max(140)).min(2).max(3),
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

export interface RedQueenClientResponse extends RedQueenAgentResponse {
  message: string;
  sources: RedQueenSource[];
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
    readinessMultiplier: number;
  };
  memory: {
    persistent: boolean;
    identity: string;
  };
}

export function formatAgentMessage(response: RedQueenAgentResponse) {
  const facts = response.facts.length ? `\n\nVERIFIED FACTS:\n${response.facts.map((fact) => `- ${fact}`).join("\n")}` : "";
  const readiness = response.readiness.eligible
    ? `\n\nREADINESS: ${response.readiness.xp >= 0 ? "+" : ""}${response.readiness.xp} XP · ${response.readiness.reason}`
    : "";
  return `${response.situation}${facts}\n\nQUEEN ASSESSMENT: ${response.answer}\n\nUNCERTAINTY: ${response.uncertainty}\n\nNEXT ACTION: ${response.action}${readiness}`;
}
