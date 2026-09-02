import { NextResponse } from "next/server";
import { cleanSp3ndId, readSp3ndJson, sp3ndAuthHeaders, sp3ndError, sp3ndFetch, sp3ndOrder, sp3ndPaymentGate } from "@/lib/sp3nd";

export const dynamic = "force-dynamic";

export async function GET(_request: Request, context: { params: Promise<{ orderId: string }> }) {
  const orderId = cleanSp3ndId((await context.params).orderId);
  if (!orderId) return NextResponse.json({ success: false, error: "A valid SP3ND order identifier is required." }, { status: 400 });
  try {
    const response = await sp3ndFetch(`getPartnerOrder?order_id=${encodeURIComponent(orderId)}`, { headers: sp3ndAuthHeaders() });
    const payload = await readSp3ndJson(response);
    if (!response.ok) return NextResponse.json({ success: false, error: sp3ndError(payload, "SP3ND order status is unavailable."), code: payload?.code }, { status: response.status });
    const order = sp3ndOrder(payload);
    return NextResponse.json({ success: true, provider: "SP3ND", orderId, order, gate: sp3ndPaymentGate(order) }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "SP3ND order status is unavailable." }, { status: 502 });
  }
}
