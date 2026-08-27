import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const DEFAULT_MARKET_ORIGIN = "https://x402-market.com";

function marketOrigin() {
  const raw = process.env.X402_MARKET_BASE_URL?.trim() || DEFAULT_MARKET_ORIGIN;
  try {
    const url = new URL(raw);
    if (url.protocol !== "https:" || url.username || url.password) return null;
    return url.origin;
  } catch {
    return null;
  }
}

function sanitizeQuery(value: unknown) {
  return typeof value === "string"
    ? value.replace(/[\r\n\t]/g, " ").replace(/\s+/g, " ").trim().slice(0, 120)
    : "";
}

export async function POST(request: NextRequest) {
  if (process.env.X402_MARKET_ENABLED?.trim().toLowerCase() === "false") {
    return NextResponse.json({ success: false, enabled: false, error: "Agent-market discovery is disabled." }, { status: 503 });
  }
  const origin = marketOrigin();
  if (!origin) return NextResponse.json({ success: false, enabled: false, error: "Agent-market provider URL is invalid." }, { status: 503 });

  const body = await request.json().catch(() => null) as Record<string, unknown> | null;
  const query = sanitizeQuery(body?.query);
  if (query.length < 2) return NextResponse.json({ success: false, error: "Enter a valid product query." }, { status: 400 });

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 8_000);
  try {
    const response = await fetch(`${origin}/api/v1/catalog/search`, {
      method: "POST",
      headers: { "Content-Type": "application/json", "User-Agent": "RED-QUEEN-Survival-Market/1.0" },
      body: JSON.stringify({
        query,
        listing_types: ["physical_product"],
        filters: { seller_verified_only: true },
        limit: 6,
        offset: 0,
      }),
      cache: "no-store",
      signal: controller.signal,
    });
    if (!response.ok) return NextResponse.json({ success: false, error: "The agent market did not return a usable catalog response." }, { status: 502 });
    const payload = await response.json() as { results?: unknown[]; count?: number };
    const results = Array.isArray(payload.results) ? payload.results.slice(0, 6) : [];
    return NextResponse.json({
      success: true,
      provider: "x402 Market",
      query,
      count: Number.isFinite(payload.count) ? payload.count : results.length,
      results,
      checkoutBoundary: "Discovery only. RED QUEEN did not open a shopping session, hold inventory, transmit an address or prepare a payment.",
    }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    const message = error instanceof Error && error.name === "AbortError"
      ? "Agent-market search timed out."
      : "Agent-market search is temporarily unavailable.";
    return NextResponse.json({ success: false, error: message }, { status: 502 });
  } finally {
    clearTimeout(timeout);
  }
}
