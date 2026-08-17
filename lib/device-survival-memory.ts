import { getCurrentDailyAction, readDailyActions } from "./daily-action";
import { readPreparednessPlans } from "./preparedness-plan";
import { isSignalWatchType, parseSignalWatchMemory, SIGNAL_WATCH_STORAGE_KEY, SignalWatchType } from "./signal-watch";

export interface DevicePlanSummary {
  title: string;
  status: "ACTIVE" | "COMPLETED";
  completedSteps: number;
  totalSteps: number;
  reviewAt: string;
}

export interface DeviceSurvivalMemory {
  activeAction: string;
  plans: DevicePlanSummary[];
  preparednessChecks: number;
  signalWatch: {
    types: SignalWatchType[];
    localPriority: boolean;
    lastScanAt?: string;
  };
}

const EMPTY_MEMORY: DeviceSurvivalMemory = {
  activeAction: "",
  plans: [],
  preparednessChecks: 0,
  signalWatch: { types: [], localPriority: false },
};

function safeDate(value: unknown) {
  if (typeof value !== "string") return undefined;
  const date = new Date(value);
  return Number.isFinite(date.getTime()) ? date.toISOString() : undefined;
}

export function buildDeviceSurvivalMemory(storage: Pick<Storage, "getItem" | "setItem">): DeviceSurvivalMemory {
  const activeAction = getCurrentDailyAction(readDailyActions(storage));
  const plans = readPreparednessPlans(storage)
    .sort((a, b) => Number(a.status === "COMPLETED") - Number(b.status === "COMPLETED"))
    .slice(0, 4)
    .map((plan) => ({
      title: plan.title,
      status: plan.status,
      completedSteps: plan.steps.filter((step) => step.completed).length,
      totalSteps: plan.steps.length,
      reviewAt: plan.reviewAt,
    }));
  let preparednessChecks = 0;
  try {
    const checklist = JSON.parse(storage.getItem("rq-preparedness-checklist-v1") || "{}");
    preparednessChecks = Math.min(18, Object.values(checklist && typeof checklist === "object" ? checklist : {}).filter(Boolean).length);
  } catch {}
  const watch = parseSignalWatchMemory(storage.getItem(SIGNAL_WATCH_STORAGE_KEY));
  return {
    activeAction: activeAction?.status === "ACTIVE" ? activeAction.action.slice(0, 420) : "",
    plans,
    preparednessChecks,
    signalWatch: {
      types: watch.types,
      localPriority: watch.localPriority,
      lastScanAt: safeDate(watch.lastScanAt),
    },
  };
}

export function normalizeDeviceSurvivalMemory(value: unknown): DeviceSurvivalMemory {
  if (!value || typeof value !== "object") return EMPTY_MEMORY;
  const input = value as Record<string, unknown>;
  const rawPlans = Array.isArray(input.plans) ? input.plans : [];
  const plans = rawPlans.slice(0, 4).flatMap((item): DevicePlanSummary[] => {
    if (!item || typeof item !== "object") return [];
    const plan = item as Record<string, unknown>;
    const title = typeof plan.title === "string" ? plan.title.trim().slice(0, 100) : "";
    const reviewAt = safeDate(plan.reviewAt);
    if (!title || !reviewAt) return [];
    const totalSteps = Math.min(5, Math.max(2, Math.round(Number(plan.totalSteps) || 2)));
    const completedSteps = Math.min(totalSteps, Math.max(0, Math.round(Number(plan.completedSteps) || 0)));
    return [{
      title,
      status: plan.status === "COMPLETED" ? "COMPLETED" : "ACTIVE",
      completedSteps,
      totalSteps,
      reviewAt,
    }];
  });
  const rawWatch = input.signalWatch && typeof input.signalWatch === "object"
    ? input.signalWatch as Record<string, unknown>
    : {};
  const types = Array.isArray(rawWatch.types)
    ? rawWatch.types.filter((type): type is SignalWatchType => typeof type === "string" && isSignalWatchType(type)).slice(0, 6)
    : [];
  return {
    activeAction: typeof input.activeAction === "string" ? input.activeAction.trim().slice(0, 420) : "",
    plans,
    preparednessChecks: Math.min(18, Math.max(0, Math.round(Number(input.preparednessChecks) || 0))),
    signalWatch: {
      types,
      localPriority: rawWatch.localPriority === true,
      lastScanAt: safeDate(rawWatch.lastScanAt),
    },
  };
}

export function hasDeviceSurvivalMemory(memory: DeviceSurvivalMemory) {
  return Boolean(
    memory.activeAction
    || memory.plans.length
    || memory.preparednessChecks
    || memory.signalWatch.localPriority
    || memory.signalWatch.types.length,
  );
}
