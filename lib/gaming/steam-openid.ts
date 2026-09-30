import { createHmac, randomBytes, timingSafeEqual } from "node:crypto";

export const STEAM_OPENID_URL = "https://steamcommunity.com/openid/login";
export const STEAM_STATE_COOKIE = "rq_steam_state";
export const STEAM_RECEIPT_COOKIE = "rq_steam_receipt";
const STEAM_ID_PATTERN = /^https?:\/\/steamcommunity\.com\/openid\/id\/([0-9]{17})$/;

export function steamLinkConfigured(): boolean {
  return Boolean(process.env.SUPABASE_SERVICE_ROLE_KEY && process.env.NEXT_PUBLIC_SUPABASE_URL);
}

export function steamOpenIdUrl(origin: string, state: string): string {
  const callback = new URL("/api/gaming/steam/callback", origin);
  callback.searchParams.set("state", state);
  const url = new URL(STEAM_OPENID_URL);
  url.searchParams.set("openid.ns", "http://specs.openid.net/auth/2.0");
  url.searchParams.set("openid.mode", "checkid_setup");
  url.searchParams.set("openid.return_to", callback.toString());
  url.searchParams.set("openid.realm", origin);
  url.searchParams.set("openid.claimed_id", "http://specs.openid.net/auth/2.0/identifier_select");
  url.searchParams.set("openid.identity", "http://specs.openid.net/auth/2.0/identifier_select");
  return url.toString();
}

export function steamIdFromAssertion(params: URLSearchParams, expectedReturnTo: string): string | null {
  for (const field of ["ns", "mode", "op_endpoint", "return_to", "claimed_id", "identity", "signed", "sig"])
    if (params.getAll(`openid.${field}`).length !== 1) return null;
  const signed = new Set((params.get("openid.signed") || "").split(","));
  if (!["op_endpoint", "return_to", "claimed_id", "identity"].every((field) => signed.has(field))) return null;
  if (params.get("openid.ns") !== "http://specs.openid.net/auth/2.0"
    || params.get("openid.mode") !== "id_res"
    || params.get("openid.op_endpoint") !== STEAM_OPENID_URL
    || params.get("openid.return_to") !== expectedReturnTo) return null;
  const claimed = params.get("openid.claimed_id") || "";
  if (claimed !== params.get("openid.identity")) return null;
  return STEAM_ID_PATTERN.exec(claimed)?.[1] || null;
}

export async function verifySteamAssertion(params: URLSearchParams): Promise<boolean> {
  const body = new URLSearchParams();
  for (const [key, value] of params) if (key.startsWith("openid.")) body.set(key, value);
  body.set("openid.mode", "check_authentication");
  const response = await fetch(STEAM_OPENID_URL, {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body,
    cache: "no-store",
    signal: AbortSignal.timeout(10_000),
  });
  return response.ok && /^is_valid:true\r?$/m.test(await response.text());
}

function receiptKey(): string | null {
  return process.env.SUPABASE_SERVICE_ROLE_KEY || null;
}

function sign(kind: string, payload: string, secret: string): string {
  return createHmac("sha256", secret).update(`rq-steam-${kind}-v1:${payload}`).digest("hex");
}

function verifiedParts(value: string | undefined, kind: string, count: number): string[] | null {
  const secret = receiptKey();
  if (!secret || !value) return null;
  const parts = value.split(".");
  if (parts.length !== count + 1) return null;
  const signature = parts.pop() || "";
  if (!/^[0-9a-f]{64}$/.test(signature)) return null;
  const expected = sign(kind, parts.join("."), secret);
  return timingSafeEqual(Buffer.from(signature, "hex"), Buffer.from(expected, "hex")) ? parts : null;
}

export function createSteamFlow(userKey: string): { nonce: string; cookie: string } {
  const secret = receiptKey();
  if (!secret || !/^[0-9a-f]{64}$/.test(userKey)) throw new Error("Steam link is not configured");
  const nonce = randomBytes(24).toString("hex");
  const payload = `${nonce}.${userKey}.${Date.now() + 600_000}`;
  return { nonce, cookie: `${payload}.${sign("flow", payload, secret)}` };
}

export function readSteamFlow(cookie: string | undefined, nonce: string | null): string | null {
  const parts = verifiedParts(cookie, "flow", 3);
  if (!parts || !nonce || parts[0] !== nonce || !/^[0-9a-f]{48}$/.test(nonce)
    || !/^[0-9a-f]{64}$/.test(parts[1]) || !/^[0-9]{13}$/.test(parts[2])
    || Number(parts[2]) < Date.now()) return null;
  return parts[1];
}

export function createSteamReceipt(steamId: string, userKey: string): string {
  const secret = receiptKey();
  if (!secret || !/^[0-9]{17}$/.test(steamId) || !/^[0-9a-f]{64}$/.test(userKey)) throw new Error("Steam link is not configured");
  const payload = `${steamId}.${userKey}.${Date.now() + 180_000}.${randomBytes(16).toString("hex")}`;
  return `${payload}.${sign("link", payload, secret)}`;
}

export function readSteamReceipt(receipt: string | undefined, userKey: string): string | null {
  const parts = verifiedParts(receipt, "link", 4);
  if (!parts) return null;
  const [steamId, owner, expiry, nonce] = parts;
  if (!/^[0-9]{17}$/.test(steamId) || owner !== userKey || !/^[0-9]{13}$/.test(expiry)
    || !/^[0-9a-f]{32}$/.test(nonce) || Number(expiry) < Date.now()) return null;
  return steamId;
}
