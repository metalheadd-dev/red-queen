import "server-only";

import { randomUUID } from "crypto";
import { RED_QUEEN_AGENT_ID } from "@/lib/agent-identity-public";

const DEFAULT_MARKET_ORIGIN = "https://x402-market.com";

export type X402MarketDestination = {
  name: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postal_code: string;
  country: string;
  email?: string;
  phone?: string;
  delivery_notes?: string;
};

export type X402MarketCartItem = {
  listing_id: string;
  variant_id?: string;
  quantity: number;
};

export function x402MarketOrigin() {
  const raw = process.env.X402_MARKET_BASE_URL?.trim() || DEFAULT_MARKET_ORIGIN;
  const url = new URL(raw);
  if (url.protocol !== "https:" || url.username || url.password) throw new Error("Invalid x402 Market origin.");
  if (process.env.NODE_ENV === "production" && url.hostname !== "x402-market.com") {
    throw new Error("The production physical-goods merchant is not allowlisted.");
  }
  return url.origin;
}

export function cleanMarketId(value: unknown) {
  const result = typeof value === "string" ? value.trim() : "";
  return /^[A-Za-z0-9_-]{1,160}$/.test(result) ? result : "";
}

function cleanText(value: unknown, max: number) {
  return typeof value === "string"
    ? value.replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim().slice(0, max)
    : "";
}

export function parseMarketItems(value: unknown): X402MarketCartItem[] | null {
  if (!Array.isArray(value) || value.length < 1 || value.length > 12) return null;
  const items = value.map((entry) => {
    const record = entry && typeof entry === "object" ? entry as Record<string, unknown> : {};
    return {
      listing_id: cleanMarketId(record.listingId),
      variant_id: cleanMarketId(record.variantId) || undefined,
      quantity: Math.min(12, Math.max(1, Math.floor(Number(record.quantity) || 1))),
    };
  });
  return items.every((item) => item.listing_id) ? items : null;
}

export function parseMarketDestination(value: unknown): X402MarketDestination | null {
  const record = value && typeof value === "object" ? value as Record<string, unknown> : {};
  const destination: X402MarketDestination = {
    name: cleanText(record.name, 100),
    line1: cleanText(record.line1, 160),
    line2: cleanText(record.line2, 160) || undefined,
    city: cleanText(record.city, 100),
    state: cleanText(record.state, 100),
    postal_code: cleanText(record.postalCode, 24),
    country: cleanText(record.country, 2).toUpperCase(),
    email: cleanText(record.email, 160) || undefined,
    phone: cleanText(record.phone, 40) || undefined,
    delivery_notes: cleanText(record.deliveryNotes, 240) || undefined,
  };
  if (!destination.name || !destination.line1 || !destination.city || !destination.state || !destination.postal_code) return null;
  if (!/^[A-Z]{2}$/.test(destination.country)) return null;
  if (!destination.email && !destination.phone) return null;
  if (destination.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(destination.email)) return null;
  return destination;
}

export function marketHeaders(idempotencyKey?: string) {
  return {
    Accept: "application/json",
    "Content-Type": "application/json",
    "User-Agent": "RED-QUEEN-Physical-Buyer/1.0",
    "Agent-ID": RED_QUEEN_AGENT_ID,
    "Agent-Capabilities": "physical-product-search,cart,owner-approved-x402-checkout",
    ...(idempotencyKey ? { "Idempotency-Key": idempotencyKey } : {}),
  };
}

export async function marketFetch(path: string, init: RequestInit = {}) {
  if (!path.startsWith("/api/v1/")) throw new Error("x402 Market path is not allowlisted.");
  return fetch(`${x402MarketOrigin()}${path}`, {
    ...init,
    cache: "no-store",
    redirect: "error",
    signal: init.signal || AbortSignal.timeout(18_000),
  });
}

export async function readMarketJson(response: Response) {
  const text = await response.text().catch(() => "");
  if (!text) return null;
  try { return JSON.parse(text); } catch { return { message: text.slice(0, 1_000) }; }
}

export function marketIdempotency(prefix: string) {
  return `red-queen-${prefix}-${randomUUID()}`;
}

export function marketResponseError(payload: any, fallback: string) {
  return String(payload?.error || payload?.message || payload?.detail || fallback).slice(0, 500);
}

export function findMarketId(payload: any, key: "session" | "checkout") {
  const candidates = key === "session"
    ? [payload?.session_id, payload?.sessionId, payload?.session?.id, payload?.id]
    : [payload?.checkout_id, payload?.checkoutId, payload?.checkout?.id, payload?.id];
  return candidates.map(cleanMarketId).find(Boolean) || "";
}
