import { NextResponse } from "next/server";
import {
  cleanMarketId,
  marketFetch,
  marketHeaders,
  marketIdempotency,
  readMarketJson,
} from "@/lib/x402-market";

export const dynamic = "force-dynamic";

export async function POST(
  request: Request,
  context: { params: Promise<{ checkoutId: string }> },
) {
  const { checkoutId: rawCheckoutId } = await context.params;
  const checkoutId = cleanMarketId(rawCheckoutId);
  if (!checkoutId) return NextResponse.json({ error: "A valid checkout identifier is required." }, { status: 400 });

  const operationId = request.headers.get("x-operation-id")?.trim() || marketIdempotency("payment");
  const payment = request.headers.get("payment-signature") || request.headers.get("x-payment");
  const headers: Record<string, string> = marketHeaders(operationId);
  if (payment) headers["X-PAYMENT"] = payment;

  try {
    const upstream = await marketFetch(`/api/v1/cart-checkout/${encodeURIComponent(checkoutId)}/confirm`, {
      method: "POST",
      headers,
      body: "{}",
    });
    const payload = await readMarketJson(upstream);
    const responseHeaders = new Headers({
      "Cache-Control": "private, no-store",
      "X-Operation-Id": operationId,
      "X-Physical-Checkout-Provider": "x402-market",
    });
    for (const name of ["payment-required", "x-payment-required", "payment-response", "x-payment-response"]) {
      const value = upstream.headers.get(name);
      if (value) responseHeaders.set(name, value);
    }
    return NextResponse.json(payload || { success: upstream.ok }, {
      status: upstream.status,
      headers: responseHeaders,
    });
  } catch {
    return NextResponse.json({
      error: "x402 Market did not answer the checkout confirmation request. No order was reported as created.",
    }, { status: 502, headers: { "Cache-Control": "private, no-store" } });
  }
}
