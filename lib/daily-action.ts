import type { RedQueenClientResponse } from "./red-queen-agent";

export const DAILY_ACTION_STORAGE_KEY = "rq-daily-action-v1";
export const DAILY_ACTIONS_STORAGE_KEY = "rq-daily-actions-v2";
export const DAILY_ACTION_EVENT = "rq-daily-action-updated";
const MAX_SAVED_ACTIONS = 30;

export type DailyActionStatus = "ACTIVE" | "COMPLETED";

export interface DailyAction {
  id: string;
  action: string;
  situation: string;
  area: string;
  focus: string;
  urgency: RedQueenClientResponse["urgency"];
  grounding: RedQueenClientResponse["grounding"];
  sourceLabel?: string;
  sourceUrl?: string;
  createdAt: string;
  completedAt?: string;
  status: DailyActionStatus;
}

export function parseDailyAction(value: string | null): DailyAction | null {
  if (!value) return null;
  try {
    const parsed = JSON.parse(value) as Partial<DailyAction>;
    if (!parsed.id || !parsed.action || !parsed.situation || !parsed.createdAt) return null;
    if (parsed.status !== "ACTIVE" && parsed.status !== "COMPLETED") return null;
    return {
      id: parsed.id,
      action: parsed.action,
      situation: parsed.situation,
      area: parsed.area || "",
      focus: parsed.focus || "",
      urgency: parsed.urgency || "PREPARE",
      grounding: parsed.grounding || "GENERAL_KNOWLEDGE",
      sourceLabel: parsed.sourceLabel,
      sourceUrl: parsed.sourceUrl,
      createdAt: parsed.createdAt,
      completedAt: parsed.completedAt,
      status: parsed.status,
    };
  } catch {
    return null;
  }
}

export function parseDailyActions(value: string | null): DailyAction[] {
  if (!value) return [];
  try {
    const parsed = JSON.parse(value);
    if (!Array.isArray(parsed)) return [];
    return parsed
      .map((item) => parseDailyAction(JSON.stringify(item)))
      .filter((item): item is DailyAction => Boolean(item))
      .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
      .slice(0, MAX_SAVED_ACTIONS);
  } catch {
    return [];
  }
}

export function readDailyActions(storage: Pick<Storage, "getItem" | "setItem">): DailyAction[] {
  const saved = parseDailyActions(storage.getItem(DAILY_ACTIONS_STORAGE_KEY));
  if (saved.length) return saved;

  const legacy = parseDailyAction(storage.getItem(DAILY_ACTION_STORAGE_KEY));
  if (!legacy) return [];
  storage.setItem(DAILY_ACTIONS_STORAGE_KEY, JSON.stringify([legacy]));
  return [legacy];
}

export function saveDailyAction(storage: Pick<Storage, "getItem" | "setItem">, action: DailyAction) {
  const current = readDailyActions(storage).filter((item) => item.id !== action.id);
  const next = [action, ...current].slice(0, MAX_SAVED_ACTIONS);
  storage.setItem(DAILY_ACTIONS_STORAGE_KEY, JSON.stringify(next));
  storage.setItem(DAILY_ACTION_STORAGE_KEY, JSON.stringify(action));
  return next;
}

export function updateDailyAction(
  storage: Pick<Storage, "getItem" | "setItem">,
  id: string,
  update: Partial<Pick<DailyAction, "status" | "completedAt">>,
) {
  const next = readDailyActions(storage).map((item) => item.id === id ? { ...item, ...update } : item);
  storage.setItem(DAILY_ACTIONS_STORAGE_KEY, JSON.stringify(next));
  const active = next.find((item) => item.status === "ACTIVE") || next[0];
  if (active) storage.setItem(DAILY_ACTION_STORAGE_KEY, JSON.stringify(active));
  return next;
}

export function getCurrentDailyAction(actions: DailyAction[]) {
  return actions.find((item) => item.status === "ACTIVE") || actions[0] || null;
}

export function createDailyAction(
  response: RedQueenClientResponse,
  context: { area?: string; focus?: string },
): DailyAction {
  const source = response.sources[0];
  const createdAt = new Date().toISOString();
  return {
    id: `rq-action-${Date.now()}`,
    action: response.action,
    situation: response.situation,
    area: context.area || "",
    focus: context.focus || "",
    urgency: response.urgency,
    grounding: response.grounding,
    sourceLabel: source?.label,
    sourceUrl: source?.url,
    createdAt,
    status: "ACTIVE",
  };
}

export function formatActionAge(createdAt: string) {
  const elapsed = Date.now() - new Date(createdAt).getTime();
  if (!Number.isFinite(elapsed) || elapsed < 60_000) return "SAVED JUST NOW";
  const minutes = Math.floor(elapsed / 60_000);
  if (minutes < 60) return `SAVED ${minutes}M AGO`;
  const hours = Math.floor(minutes / 60);
  if (hours < 24) return `SAVED ${hours}H AGO`;
  return `SAVED ${Math.floor(hours / 24)}D AGO`;
}
