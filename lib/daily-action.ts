import type { RedQueenClientResponse } from "./red-queen-agent";

export const DAILY_ACTION_STORAGE_KEY = "rq-daily-action-v1";
export const DAILY_ACTION_EVENT = "rq-daily-action-updated";

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
