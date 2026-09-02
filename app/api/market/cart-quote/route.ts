import { NextResponse } from "next/server";
import {
  findMarketId,
  marketFetch,
  marketHeaders,
  marketIdempotency,
  marketResponseError,
  parseMarketDestination,
  parseMarketItems,
  readMarketJson,
  x402MarketOrigin,
} from "@/lib/x402-market";

export const dynamic = "force-dynamic";

async function cancelSession(sessionId: string) {
  await marketFetch(`/api/v1/sessions/${encodeURIComponent(sessionId)}`, {
    method: "DELETE",
    headers: marketHeaders(marketIdempotency("cancel")),
  }).catch(() => null);
}

export async function POST(request: Request) {
  const input = await request.json().catch(() => null) as Record<string, unknown> | null;
  const items = parseMarketItems(input?.items);
  const destination = parseMarketDestination(input?.destination);
  const ownerAuthorizedDestinationDisclosure = input?.ownerAuthorizedDestinationDisclosure === true;
  if (!items) return NextResponse.json({ success: false, error: "Select between 1 and 12 valid x402 Market offers." }, { status: 400 });
  if (!ownerAuthorizedDestinationDisclosure) {
    return NextResponse.json({
      success: false,
      error: "Owner authorization is required before a delivery destination can be relayed to the marketplace.",
    }, { status: 400 });
  }
  if (!destination) {
    return NextResponse.json({
      success: false,
      error: "A complete delivery destination and an email or phone number are required before inventory can be held.",
    }, { status: 400 });
  }

  let sessionId = "";
  try {
    const sessionResponse = await marketFetch("/api/v1/sessions", {
      method: "POST",
      headers: marketHeaders(marketIdempotency("session")),
      body: JSON.stringify({ destination }),
    });
    const sessionPayload = await readMarketJson(sessionResponse);
    if (!sessionResponse.ok) {
      return NextResponse.json({
        success: false,
        error: marketResponseError(sessionPayload, "The x402 shopping session could not be opened."),
        code: sessionPayload?.code,
        kycLink: sessionPayload?.kyc_link,
      }, { status: sessionResponse.status });
    }
    sessionId = findMarketId(sessionPayload, "session");
    if (!sessionId) throw new Error("The marketplace did not return a shopping-session identifier.");

    for (const item of items) {
      const cartResponse = await marketFetch(`/api/v1/sessions/${encodeURIComponent(sessionId)}/cart`, {
        method: "POST",
        headers: marketHeaders(marketIdempotency("cart")),
        body: JSON.stringify(item),
      });
      const cartPayload = await readMarketJson(cartResponse);
      if (!cartResponse.ok) throw new Error(marketResponseError(cartPayload, `The offer ${item.listing_id} could not be held.`));
    }

    const receiptResponse = await marketFetch(`/api/v1/sessions/${encodeURIComponent(sessionId)}/cart`, {
      method: "GET",
      headers: marketHeaders(),
    });
    const cartReceipt = await readMarketJson(receiptResponse);
    if (!receiptResponse.ok) throw new Error(marketResponseError(cartReceipt, "The marketplace cart receipt is unavailable."));

    const checkoutResponse = await marketFetch(`/api/v1/sessions/${encodeURIComponent(sessionId)}/checkout`, {
      method: "POST",
      headers: marketHeaders(marketIdempotency("checkout")),
      body: JSON.stringify({ destination }),
    });
    const checkout = await readMarketJson(checkoutResponse);
    if (!checkoutResponse.ok) {
      if (checkoutResponse.status === 403) {
        await cancelSession(sessionId);
        return NextResponse.json({
          success: false,
          error: marketResponseError(checkout, "The marketplace requires owner verification before purchase."),
          code: checkout?.code || "KYC_REQUIRED",
          kycLink: checkout?.kyc_link,
        }, { status: 403 });
      }
      throw new Error(marketResponseError(checkout, "The payable checkout could not be created."));
    }
    const checkoutId = findMarketId(checkout, "checkout");
    if (!checkoutId) throw new Error("The marketplace did not return a checkout identifier.");

    return NextResponse.json({
      success: true,
      provider: "x402 Market",
      sessionId,
      checkoutId,
      cart: cartReceipt,
      checkout,
      authorizationUrl: `${x402MarketOrigin()}/cart/${encodeURIComponent(checkoutId)}`,
      payment: {
        protocol: "x402",
        asset: "PYUSD",
        network: "Solana mainnet",
        approval: "A separate wallet signature is still required. No payment has been made.",
      },
      privacy: "The destination was relayed to x402 Market solely to calculate fulfillment and create this held checkout. RED QUEEN does not persist it.",
    }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    if (sessionId) await cancelSession(sessionId);
    return NextResponse.json({
      success: false,
      error: error instanceof Error ? error.message : "The x402 physical checkout is temporarily unavailable.",
    }, { status: 502, headers: { "Cache-Control": "private, no-store" } });
  }
}
