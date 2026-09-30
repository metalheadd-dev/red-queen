import { isGamingConversationId, normalizeGamingContext, type GamingContext } from "./queen";
import type { RedQueenAgentResponse } from "../red-queen-agent";

export type GamingTurn = { id: string; conversation_id: string; prompt: string; response: RedQueenAgentResponse & { message: string }; context: GamingContext; created_at: string };

/** Fail closed on malformed storage, rather than dropping old records and replacing it. */
export function readGamingTurns(storage: Pick<Storage, "getItem">, key: string): GamingTurn[] {
  const parsed: unknown = JSON.parse(storage.getItem(key) || "[]");
  if (!Array.isArray(parsed)) throw new Error("Unreadable browser history");
  const valid = parsed.every(turn => Boolean(turn && typeof turn === "object"
    && isGamingConversationId(turn.id) && isGamingConversationId(turn.conversation_id)
    && typeof turn.prompt === "string" && typeof turn.created_at === "string" && Number.isFinite(Date.parse(turn.created_at))
    && turn.response && ["answer", "situation", "action", "uncertainty", "message"].every(field => typeof turn.response[field] === "string")
    && Array.isArray(turn.response.followUps) && turn.response.followUps.every((question: unknown) => typeof question === "string")
    && normalizeGamingContext(turn.context)));
  if (!valid) throw new Error("Unreadable browser history");
  return (parsed as GamingTurn[]).map(turn => ({ ...turn, context: normalizeGamingContext(turn.context)! }));
}

export function mergeGamingTurns(a: GamingTurn[], b: GamingTurn[]): GamingTurn[] {
  return Array.from(new Map([...a, ...b].map(turn => [turn.id, turn])).values())
    .sort((x, y) => x.created_at.localeCompare(y.created_at));
}

export type GamingDraft = { context: GamingContext; prompt: string; updatedAt: string };
export function gamingDraftKey(owner: string, conversationId: string): string {
  return `rq-gaming-draft-v1:${owner}:${conversationId}`;
}
export function readGamingDraft(storage: Pick<Storage, "getItem">, key: string): GamingDraft | null {
  const raw = storage.getItem(key);
  if (!raw) return null;
  const value = JSON.parse(raw);
  const context = normalizeGamingContext(value?.context);
  if (!context || typeof value.prompt !== "string" || value.prompt.length > 2000
    || !Number.isFinite(Date.parse(value.updatedAt))) throw new Error("Unreadable draft");
  return { context, prompt: value.prompt, updatedAt: value.updatedAt };
}

export function writeGamingDraft(storage: Pick<Storage, "getItem" | "setItem">, key: string, draft: GamingDraft): void {
  readGamingDraft(storage, key); // Preserve unreadable previous data rather than replacing it.
  storage.setItem(key, JSON.stringify(draft));
}

/** Import is a browser backup, not proof of identity, ownership or gameplay results. */
export function parseGamingBackup(raw: string): GamingTurn[] {
  if (raw.length > 10_000_000) throw new Error("Backup is too large (10 MB maximum).");
  const value = JSON.parse(raw);
  if (value?.version !== 1 || !Array.isArray(value.generations) || value.generations.length > 2000) throw new Error("Not a supported Gaming Queen backup.");
  const turns = readGamingTurns({ getItem: () => JSON.stringify(value.generations) }, "backup");
  return turns.map(turn => ({ ...turn, context: normalizeGamingContext(turn.context)! }));
}
