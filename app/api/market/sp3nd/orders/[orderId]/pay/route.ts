import { NextResponse } from "next/server";
import {
  cleanSp3ndId,
  readSp3ndJson,
  sp3ndAuthHeaders,
  sp3ndError,
  sp3ndFetch,
  sp3ndOrder,
  sp3ndPaymentGate,
} from "@/lib/sp3nd";

export const dynamic = "force-dynamic";

function relayPaymentHeaders(upstream: Response, operationId: string) {
  const headers = new Headers({
    "Cache-Control": "private, no-store",
    "X-Operation-Id": operationId,
    "X-Physical-Checkout-Provider": "sp3nd",
  });
  for (const name of ["payment-required", "x-payment-required", "payment-response", "x-payment-response"]) {
    const value = upstream.headers.get(name);
    if (value) headers.set(name, value);
  }
  return headers;
}

export async function POST(request: Request, context: { params: Promise<{ orderId: string }> }) {
  const orderId = cleanSp3ndId((await context.params).orderId);
  const operationId = request.headers.get("x-operation-id")?.trim() || crypto.randomUUID();
  const paymentSignature = request.headers.get("payment-signature") || "";
  if (!orderId) return NextResponse.json({ success: false, error: "A valid SP3ND order identifier is required." }, { status: 400 });

  try {
    const currentResponse = await sp3ndFetch(`getPartnerOrder?order_id=${encodeURIComponent(orderId)}`, { headers: sp3ndAuthHeaders() });
    const currentPayload = await readSp3ndJson(currentResponse);
    if (!currentResponse.ok) return NextResponse.json({ success: false, error: sp3ndError(currentPayload, "SP3ND order status is unavailable."), code: currentPayload?.code }, { status: currentResponse.status });
    const gate = sp3ndPaymentGate(sp3ndOrder(currentPayload));
    if (!gate.payable) {
      return NextResponse.json({
        success: false,
        code: gate.quoteCurrent ? "ORDER_NOT_PAYMENT_READY" : "QUOTE_EXPIRED",
        error: gate.shippingSelected ? "The SP3ND order is not ready for payment. Refresh its status." : "Select one of the current shipping options before payment.",
        order: sp3ndOrder(currentPayload),
        gate,
      }, { status: 409, headers: { "Cache-Control": "private, no-store" } });
    }

    const upstream = await sp3ndFetch("payAgentOrder", {
      method: "POST",
      headers: sp3ndAuthHeaders(undefined, paymentSignature || undefined),
      body: JSON.stringify({ order_id: orderId }),
    });
    const payload = await readSp3ndJson(upstream);
    return NextResponse.json(payload || { success: upstream.ok }, {
      status: upstream.status,
      headers: relayPaymentHeaders(upstream, operationId),
    });
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "SP3ND payment is unavailable. No order was reported as paid." }, { status: 502 });
  }
}
