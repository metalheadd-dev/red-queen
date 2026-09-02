import { NextResponse } from "next/server";
import { cleanMarketId, marketFetch, marketHeaders, readMarketJson } from "@/lib/x402-market";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  context: { params: Promise<{ orderId: string }> },
) {
  const { orderId: rawOrderId } = await context.params;
  const orderId = cleanMarketId(rawOrderId);
  if (!orderId) return NextResponse.json({ error: "A valid order identifier is required." }, { status: 400 });
  try {
    const upstream = await marketFetch(`/api/v1/orders/${encodeURIComponent(orderId)}/tracking`, {
      method: "GET",
      headers: marketHeaders(),
    });
    const payload = await readMarketJson(upstream);
    return NextResponse.json(payload || { status: "PENDING" }, {
      status: upstream.status,
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch {
    return NextResponse.json({ error: "Tracking is temporarily unavailable." }, { status: 502 });
  }
}
