import { NextResponse } from "next/server";
import { cleanSp3ndId, readSp3ndJson, sp3ndAuthHeaders, sp3ndError, sp3ndFetch, sp3ndOrder, sp3ndPaymentGate } from "@/lib/sp3nd";

export const dynamic = "force-dynamic";

export async function POST(request: Request, context: { params: Promise<{ orderId: string }> }) {
  const orderId = cleanSp3ndId((await context.params).orderId);
  const input = await request.json().catch(() => null) as Record<string, unknown> | null;
  const shippingOptionId = cleanSp3ndId(input?.shippingOptionId);
  if (!orderId || !shippingOptionId || input?.ownerAuthorizedShippingSelection !== true) {
    return NextResponse.json({ success: false, error: "Owner approval and an exact current shipping option are required." }, { status: 400 });
  }
  try {
    const response = await sp3ndFetch("selectPartnerOrderShippingOption", {
      method: "POST",
      headers: sp3ndAuthHeaders(),
      body: JSON.stringify({ order_id: orderId, shipping_option_id: shippingOptionId }),
    });
    const payload = await readSp3ndJson(response);
    if (!response.ok) return NextResponse.json({ success: false, error: sp3ndError(payload, "SP3ND rejected the shipping option."), code: payload?.code }, { status: response.status });
    const order = sp3ndOrder(payload);
    return NextResponse.json({ success: true, provider: "SP3ND", orderId, order, gate: sp3ndPaymentGate(order) }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "SP3ND shipping selection is unavailable." }, { status: 502 });
  }
}
