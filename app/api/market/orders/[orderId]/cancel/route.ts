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
  context: { params: Promise<{ orderId: string }> },
) {
  const { orderId: rawOrderId } = await context.params;
  const orderId = cleanMarketId(rawOrderId);
  if (!orderId) return NextResponse.json({ error: "A valid order identifier is required." }, { status: 400 });
  const operationId = request.headers.get("x-operation-id")?.trim() || marketIdempotency("cancel-order");
  try {
    const upstream = await marketFetch(`/api/v1/orders/${encodeURIComponent(orderId)}/cancel`, {
      method: "POST",
      headers: marketHeaders(operationId),
      body: "{}",
    });
    const payload = await readMarketJson(upstream);
    return NextResponse.json(payload || { success: upstream.ok }, {
      status: upstream.status,
      headers: { "Cache-Control": "private, no-store", "X-Operation-Id": operationId },
    });
  } catch {
    return NextResponse.json({ error: "The marketplace did not answer the cancellation request." }, { status: 502 });
  }
}
