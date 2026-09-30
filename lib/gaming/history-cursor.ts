import { isGamingConversationId } from "./queen";

export type GamingHistoryCursor = { createdAt: string; id: string };
export function encodeGamingCursor(row: { created_at: string; id: string }): string {
  return Buffer.from(JSON.stringify({ createdAt: new Date(row.created_at).toISOString(), id: row.id })).toString("base64url");
}
export function decodeGamingCursor(value: string | null): GamingHistoryCursor | null {
  if (!value || value.length > 200 || !/^[A-Za-z0-9_-]+$/.test(value)) return null;
  try {
    const parsed = JSON.parse(Buffer.from(value, "base64url").toString("utf8"));
    if (!parsed || !isGamingConversationId(parsed.id) || typeof parsed.createdAt !== "string"
      || !Number.isFinite(Date.parse(parsed.createdAt))) return null;
    return { id: parsed.id.toLowerCase(), createdAt: new Date(parsed.createdAt).toISOString() };
  } catch { return null; }
}
