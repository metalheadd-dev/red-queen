export const RQ_AGENT_DRAFTS_KEY = "rq-agent-blueprints-v1";

export const RQ_AGENT_MODULES = [
  "THREAT_GRAPH",
  "SIGNAL_WATCH",
  "PREPAREDNESS",
  "WALLET_SAFETY",
  "COMMERCE_SCOUT",
  "SCENARIO_ENGINE",
] as const;

export type RqAgentModule = typeof RQ_AGENT_MODULES[number];
export type RqAgentArchetype = "SENTINEL" | "ANALYST" | "QUARTERMASTER" | "SCENARIO_CONTROLLER";
export type RqAgentMemory = "NONE" | "DEVICE_ONLY" | "PRIVATE_ACCOUNT";

const RQ_AGENT_ARCHETYPES: RqAgentArchetype[] = ["SENTINEL", "ANALYST", "QUARTERMASTER", "SCENARIO_CONTROLLER"];
const RQ_AGENT_MEMORIES: RqAgentMemory[] = ["NONE", "DEVICE_ONLY", "PRIVATE_ACCOUNT"];

export type AgentCapacity = {
  slots: number;
  modules: number;
  canDraftBudget: boolean;
  canPrepareRegistryPackage: boolean;
};

export type RqAgentBlueprint = {
  schema: "rq-agent-blueprint-v1";
  id: string;
  name: string;
  archetype: RqAgentArchetype;
  directive: string;
  broadArea: string;
  modules: RqAgentModule[];
  memory: RqAgentMemory;
  paymentPolicy: {
    enabled: boolean;
    dailyCapUsdc: number;
    approval: "EVERY_OPERATION";
  };
  queenOversight: "REQUIRED";
  irreversibleActions: "DENIED";
  holderTierObserved: number;
  status: "LOCAL_DRAFT";
  createdAt: string;
};

export function getAgentCapacity(tier: number): AgentCapacity {
  if (tier >= 4) return { slots: 8, modules: 6, canDraftBudget: true, canPrepareRegistryPackage: true };
  if (tier >= 3) return { slots: 4, modules: 6, canDraftBudget: true, canPrepareRegistryPackage: false };
  if (tier >= 2) return { slots: 2, modules: 4, canDraftBudget: true, canPrepareRegistryPackage: false };
  if (tier >= 1) return { slots: 1, modules: 3, canDraftBudget: false, canPrepareRegistryPackage: false };
  return { slots: 1, modules: 2, canDraftBudget: false, canPrepareRegistryPackage: false };
}

function clean(value: unknown, max: number) {
  return typeof value === "string" ? value.replace(/[<>]/g, "").trim().slice(0, max) : "";
}

export function buildAgentBlueprint(input: {
  name: unknown;
  archetype: RqAgentArchetype;
  directive: unknown;
  broadArea: unknown;
  modules: RqAgentModule[];
  memory: RqAgentMemory;
  dailyCapUsdc: number;
  holderTierObserved: number;
  id?: string;
  createdAt?: string;
}): RqAgentBlueprint {
  const capacity = getAgentCapacity(input.holderTierObserved);
  const name = clean(input.name, 42);
  const directive = clean(input.directive, 360);
  const broadArea = clean(input.broadArea, 80);
  if (name.length < 2 || directive.length < 12) throw new Error("Agent name and a bounded directive are required.");
  if (!RQ_AGENT_ARCHETYPES.includes(input.archetype)) throw new Error("Unsupported agent archetype.");
  if (!RQ_AGENT_MEMORIES.includes(input.memory)) throw new Error("Unsupported memory boundary.");
  const modules = Array.from(new Set(input.modules)).filter((module) => RQ_AGENT_MODULES.includes(module)).slice(0, capacity.modules);
  if (!modules.length) throw new Error("Select at least one agent module.");
  const requestedCap = Number.isFinite(input.dailyCapUsdc) ? Math.max(0, Math.min(input.dailyCapUsdc, 5)) : 0;
  const dailyCapUsdc = capacity.canDraftBudget ? requestedCap : 0;
  return {
    schema: "rq-agent-blueprint-v1",
    id: input.id || crypto.randomUUID(),
    name,
    archetype: input.archetype,
    directive,
    broadArea,
    modules,
    memory: input.memory,
    paymentPolicy: { enabled: dailyCapUsdc > 0, dailyCapUsdc, approval: "EVERY_OPERATION" },
    queenOversight: "REQUIRED",
    irreversibleActions: "DENIED",
    holderTierObserved: Math.max(0, Math.min(4, Math.floor(input.holderTierObserved || 0))),
    status: "LOCAL_DRAFT",
    createdAt: input.createdAt || new Date().toISOString(),
  };
}

export function parseAgentBlueprints(value: string | null): RqAgentBlueprint[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) return [];
    return parsed.flatMap((item): RqAgentBlueprint[] => {
      if (!item || typeof item !== "object") return [];
      const raw = item as Partial<RqAgentBlueprint>;
      if (raw.schema !== "rq-agent-blueprint-v1" || raw.status !== "LOCAL_DRAFT") return [];
      try {
        return [buildAgentBlueprint({
          name: raw.name,
          archetype: raw.archetype || "SENTINEL",
          directive: raw.directive,
          broadArea: raw.broadArea,
          modules: Array.isArray(raw.modules) ? raw.modules : [],
          memory: raw.memory || "DEVICE_ONLY",
          dailyCapUsdc: Number(raw.paymentPolicy?.dailyCapUsdc || 0),
          holderTierObserved: Number(raw.holderTierObserved || 0),
          id: raw.id,
          createdAt: raw.createdAt,
        })];
      } catch { return []; }
    }).slice(0, 8);
  } catch { return []; }
}
