import type { RedQueenClientResponse } from "./red-queen-agent";

export const PREPAREDNESS_PLANS_STORAGE_KEY = "rq-preparedness-plans-v1";
export const PREPAREDNESS_PLANS_EVENT = "rq-preparedness-plans-updated";
const MAX_PLANS = 12;

export type PreparednessPlanStatus = "ACTIVE" | "COMPLETED";

export interface PreparednessPlanStep {
  id: string;
  text: string;
  completed: boolean;
  completedAt?: string;
}

export interface PreparednessPlan {
  id: string;
  title: string;
  objective: string;
  area: string;
  focus: string;
  grounding: RedQueenClientResponse["grounding"];
  sourceLabel?: string;
  sourceUrl?: string;
  createdAt: string;
  updatedAt: string;
  reviewAt: string;
  completedAt?: string;
  status: PreparednessPlanStatus;
  steps: PreparednessPlanStep[];
}

function parseStep(value: unknown): PreparednessPlanStep | null {
  if (!value || typeof value !== "object") return null;
  const step = value as Partial<PreparednessPlanStep>;
  if (typeof step.id !== "string" || typeof step.text !== "string" || !step.text.trim()) return null;
  return {
    id: step.id,
    text: step.text.trim().slice(0, 220),
    completed: step.completed === true,
    completedAt: typeof step.completedAt === "string" ? step.completedAt : undefined,
  };
}

function safeSourceUrl(value: unknown) {
  if (typeof value !== "string") return undefined;
  try {
    const url = new URL(value);
    return url.protocol === "https:" || url.protocol === "http:" ? url.toString() : undefined;
  } catch {
    return undefined;
  }
}

export function parsePreparednessPlan(value: unknown): PreparednessPlan | null {
  if (!value || typeof value !== "object") return null;
  const plan = value as Partial<PreparednessPlan>;
  const steps = Array.isArray(plan.steps) ? plan.steps.map(parseStep).filter((step): step is PreparednessPlanStep => Boolean(step)) : [];
  if (
    typeof plan.id !== "string"
    || typeof plan.title !== "string"
    || typeof plan.objective !== "string"
    || typeof plan.createdAt !== "string"
    || typeof plan.reviewAt !== "string"
    || steps.length < 2
    || Number.isNaN(new Date(plan.createdAt).getTime())
    || Number.isNaN(new Date(plan.reviewAt).getTime())
  ) return null;
  return {
    id: plan.id,
    title: plan.title.trim().slice(0, 100),
    objective: plan.objective.trim().slice(0, 280),
    area: typeof plan.area === "string" ? plan.area.slice(0, 80) : "",
    focus: typeof plan.focus === "string" ? plan.focus.slice(0, 80) : "",
    grounding: plan.grounding === "VERIFIED_LIVE" || plan.grounding === "SCENARIO_SIMULATION" ? plan.grounding : "GENERAL_KNOWLEDGE",
    sourceLabel: typeof plan.sourceLabel === "string" ? plan.sourceLabel : undefined,
    sourceUrl: safeSourceUrl(plan.sourceUrl),
    createdAt: plan.createdAt,
    updatedAt: typeof plan.updatedAt === "string" ? plan.updatedAt : plan.createdAt,
    reviewAt: plan.reviewAt,
    completedAt: typeof plan.completedAt === "string" ? plan.completedAt : undefined,
    status: plan.status === "COMPLETED" ? "COMPLETED" : "ACTIVE",
    steps: steps.slice(0, 5),
  };
}

export function readPreparednessPlans(storage: Pick<Storage, "getItem">): PreparednessPlan[] {
  try {
    const parsed = JSON.parse(storage.getItem(PREPAREDNESS_PLANS_STORAGE_KEY) || "[]");
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map(parsePreparednessPlan)
      .filter((plan): plan is PreparednessPlan => Boolean(plan))
      .sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime())
      .slice(0, MAX_PLANS);
  } catch {
    return [];
  }
}

export function writePreparednessPlans(storage: Pick<Storage, "setItem">, plans: PreparednessPlan[]) {
  storage.setItem(PREPAREDNESS_PLANS_STORAGE_KEY, JSON.stringify(plans.slice(0, MAX_PLANS)));
}

export function createPreparednessPlan(
  response: RedQueenClientResponse,
  context: { area?: string; focus?: string },
): PreparednessPlan | null {
  if (!response.plan) return null;
  const createdAt = new Date();
  const source = response.sources[0];
  const id = `rq-plan-${createdAt.getTime()}`;
  return {
    id,
    title: response.plan.title,
    objective: response.plan.objective,
    area: context.area || "",
    focus: context.focus || "",
    grounding: response.grounding,
    sourceLabel: source?.label,
    sourceUrl: source?.url,
    createdAt: createdAt.toISOString(),
    updatedAt: createdAt.toISOString(),
    reviewAt: new Date(createdAt.getTime() + response.plan.reviewInDays * 86_400_000).toISOString(),
    status: "ACTIVE",
    steps: response.plan.steps.map((text, index) => ({ id: `${id}-step-${index + 1}`, text, completed: false })),
  };
}

export function savePreparednessPlan(
  storage: Pick<Storage, "getItem" | "setItem">,
  plan: PreparednessPlan,
) {
  const plans = readPreparednessPlans(storage).filter((item) => item.id !== plan.id);
  const next = [plan, ...plans].slice(0, MAX_PLANS);
  writePreparednessPlans(storage, next);
  return next;
}

export function updatePreparednessPlanStep(
  storage: Pick<Storage, "getItem" | "setItem">,
  planId: string,
  stepId: string,
  completed: boolean,
) {
  const now = new Date().toISOString();
  const next = readPreparednessPlans(storage).map((plan) => {
    if (plan.id !== planId) return plan;
    const steps = plan.steps.map((step) => step.id === stepId
      ? { ...step, completed, completedAt: completed ? now : undefined }
      : step);
    const allComplete = steps.every((step) => step.completed);
    return {
      ...plan,
      steps,
      updatedAt: now,
      status: allComplete ? "COMPLETED" as const : "ACTIVE" as const,
      completedAt: allComplete ? now : undefined,
    };
  });
  writePreparednessPlans(storage, next);
  return next;
}

export function formatPlanReviewDate(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "REVIEW DATE UNAVAILABLE";
  return new Intl.DateTimeFormat("en", { month: "short", day: "numeric", year: "numeric" }).format(date).toUpperCase();
}
