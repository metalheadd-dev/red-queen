import "server-only";

import { isValidSolanaPublicKey } from "@/lib/solana";

const DEFAULT_SP3ND_ORIGIN = "https://us-central1-sp3nddotshop-prod.cloudfunctions.net";
const ALLOWED_ENDPOINTS = new Set([
  "createPartnerCart",
  "createPartnerOrder",
  "getPartnerOrder",
  "getPartnerOrders",
  "selectPartnerOrderShippingOption",
  "payAgentOrder",
]);

const AMAZON_HOSTS = new Set([
  "amazon.com", "www.amazon.com", "amazon.co.uk", "www.amazon.co.uk", "amazon.ca", "www.amazon.ca",
  "amazon.de", "www.amazon.de", "amazon.fr", "www.amazon.fr", "amazon.es", "www.amazon.es",
  "amazon.it", "www.amazon.it", "amazon.nl", "www.amazon.nl", "amazon.com.be", "www.amazon.com.be",
  "amazon.pl", "www.amazon.pl", "amazon.se", "www.amazon.se", "amazon.com.br", "www.amazon.com.br",
  "amazon.com.mx", "www.amazon.com.mx", "amazon.com.au", "www.amazon.com.au", "amazon.in", "www.amazon.in",
  "amazon.co.jp", "www.amazon.co.jp", "amazon.sg", "www.amazon.sg", "amazon.ae", "www.amazon.ae",
  "amazon.sa", "www.amazon.sa", "amazon.eg", "www.amazon.eg", "amazon.com.tr", "www.amazon.com.tr",
  "amazon.co.za", "www.amazon.co.za",
]);

const EBAY_HOSTS = new Set([
  "ebay.com", "www.ebay.com", "ebay.ca", "www.ebay.ca", "ebay.co.uk", "www.ebay.co.uk",
  "ebay.de", "www.ebay.de", "ebay.fr", "www.ebay.fr", "ebay.it", "www.ebay.it",
  "ebay.es", "www.ebay.es", "ebay.com.au", "www.ebay.com.au",
]);

export const SP3ND_USDC_MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";

export type Sp3ndItem = { productUrl: string; quantity: number };

export type Sp3ndDestination = {
  name: string;
  line1: string;
  line2?: string;
  city: string;
  state: string;
  postalCode: string;
  country: string;
  email: string;
  phone?: string;
};

function cleanText(value: unknown, max: number) {
  return typeof value === "string"
    ? value.replace(/[\u0000-\u001f\u007f]/g, " ").replace(/\s+/g, " ").trim().slice(0, max)
    : "";
}

export function sp3ndOrigin() {
  const raw = process.env.SP3ND_BASE_URL?.trim() || DEFAULT_SP3ND_ORIGIN;
  const url = new URL(raw);
  if (url.protocol !== "https:" || url.username || url.password) throw new Error("The SP3ND origin is invalid.");
  if (process.env.NODE_ENV === "production" && url.hostname !== "us-central1-sp3nddotshop-prod.cloudfunctions.net") {
    throw new Error("The production SP3ND origin is not allowlisted.");
  }
  return url.origin;
}

function sp3ndCredentials() {
  return {
    apiKey: process.env.SP3ND_API_KEY?.trim() || "",
    apiSecret: process.env.SP3ND_API_SECRET?.trim() || "",
  };
}

export function sp3ndReadiness() {
  const credentials = sp3ndCredentials();
  return {
    ready: Boolean(credentials.apiKey && credentials.apiSecret),
    provider: "SP3ND",
    network: "Solana mainnet",
    asset: "USDC",
    capabilities: ["Amazon", "eBay", "server-priced cart", "manual quote", "x402 payment", "fulfillment tracking"],
  };
}

export function sp3ndProductUrl(value: unknown) {
  if (typeof value !== "string") return "";
  try {
    const url = new URL(value.trim());
    if (url.protocol !== "https:" || url.username || url.password) return "";
    const host = url.hostname.toLowerCase();
    const isEbay = EBAY_HOSTS.has(host);
    if (!AMAZON_HOSTS.has(host) && !isEbay) return "";
    url.hash = "";
    return url.toString().slice(0, 1_000);
  } catch {
    return "";
  }
}

export function parseSp3ndItems(value: unknown) {
  if (!Array.isArray(value) || value.length < 1 || value.length > 12) return null;
  const items = value.map((entry) => {
    const record = entry && typeof entry === "object" ? entry as Record<string, unknown> : {};
    return {
      productUrl: sp3ndProductUrl(record.productUrl),
      quantity: Math.min(12, Math.max(1, Math.floor(Number(record.quantity) || 1))),
    };
  });
  return items.every((entry) => entry.productUrl) ? items : null;
}

export function parseSp3ndDestination(value: unknown): Sp3ndDestination | null {
  const record = value && typeof value === "object" ? value as Record<string, unknown> : {};
  const destination: Sp3ndDestination = {
    name: cleanText(record.name, 100),
    line1: cleanText(record.line1, 160),
    line2: cleanText(record.line2, 160) || undefined,
    city: cleanText(record.city, 100),
    state: cleanText(record.state, 100),
    postalCode: cleanText(record.postalCode, 24),
    country: cleanText(record.country, 2).toUpperCase(),
    email: cleanText(record.email, 160),
    phone: cleanText(record.phone, 40) || undefined,
  };
  if (!destination.name || !destination.line1 || !destination.city || !destination.state || !destination.postalCode) return null;
  if (!/^[A-Z]{2}$/.test(destination.country)) return null;
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(destination.email)) return null;
  return destination;
}

export function parseSp3ndWallet(value: unknown) {
  const wallet = cleanText(value, 80);
  return isValidSolanaPublicKey(wallet) ? wallet : "";
}

export function cleanSp3ndId(value: unknown) {
  const result = cleanText(value, 180);
  return /^[A-Za-z0-9_-]+$/.test(result) ? result : "";
}

export function cleanSp3ndCheckoutKey(value: unknown) {
  const result = cleanText(value, 180);
  return /^[A-Za-z0-9:_-]{8,180}$/.test(result) ? result : "";
}

function countryName(code: string) {
  try { return new Intl.DisplayNames(["en"], { type: "region" }).of(code) || code; }
  catch { return code; }
}

export function sp3ndShippingAddress(destination: Sp3ndDestination) {
  return {
    name: destination.name,
    recipient: destination.name,
    address1: destination.line1,
    address2: destination.line2 || "",
    city: destination.city,
    state: destination.state,
    postalCode: destination.postalCode,
    country: countryName(destination.country),
    countryCode: destination.country,
    phone: destination.phone || "",
  };
}

export function sp3ndAuthHeaders(idempotencyKey?: string, paymentSignature?: string) {
  const credentials = sp3ndCredentials();
  if (!credentials.apiKey || !credentials.apiSecret) throw new Error("SP3ND partner credentials are not configured.");
  return {
    Accept: "application/json",
    "Content-Type": "application/json",
    "X-API-Key": credentials.apiKey,
    "X-API-Secret": credentials.apiSecret,
    ...(idempotencyKey ? { "Idempotency-Key": idempotencyKey } : {}),
    ...(paymentSignature ? { "PAYMENT-SIGNATURE": paymentSignature } : {}),
  };
}

export async function sp3ndFetch(endpoint: string, init: RequestInit = {}) {
  const url = new URL(endpoint, `${sp3ndOrigin()}/`);
  if (url.origin !== sp3ndOrigin() || !ALLOWED_ENDPOINTS.has(url.pathname.replace(/^\//, ""))) {
    throw new Error("The SP3ND endpoint is not allowlisted.");
  }
  return fetch(url, {
    ...init,
    cache: "no-store",
    redirect: "error",
    signal: init.signal || AbortSignal.timeout(18_000),
  });
}

export async function readSp3ndJson(response: Response) {
  const text = await response.text().catch(() => "");
  if (!text) return null;
  try { return JSON.parse(text); }
  catch { return { error: text.slice(0, 1_000) }; }
}

export function sp3ndError(payload: any, fallback: string) {
  return String(payload?.error || payload?.message || payload?.code || fallback).slice(0, 500);
}

export function sp3ndOrder(payload: any) {
  return payload?.order && typeof payload.order === "object" ? payload.order : payload;
}

export function sp3ndOrderId(payload: any) {
  const order = sp3ndOrder(payload);
  return cleanSp3ndId(order?.order_id || order?.id);
}

export function sp3ndPaymentGate(payload: any) {
  const order = sp3ndOrder(payload);
  const paymentReady = order?.payment_ready === true;
  const expiresAt = typeof order?.quote_expires_at === "string" ? Date.parse(order.quote_expires_at) : Number.POSITIVE_INFINITY;
  const quoteCurrent = Number.isFinite(expiresAt) ? expiresAt > Date.now() + 15_000 : true;
  const shippingOptions = Array.isArray(order?.shipping_options) ? order.shipping_options : [];
  const shippingSelected = shippingOptions.length === 0 || Boolean(order?.selected_shipping_option_id || order?.selected_shipping_option);
  return {
    paymentReady,
    quoteCurrent,
    shippingSelected,
    payable: paymentReady && quoteCurrent && shippingSelected,
  };
}
