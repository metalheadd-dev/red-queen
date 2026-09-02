import { NextResponse } from "next/server";
import {
  cleanSp3ndCheckoutKey,
  cleanSp3ndId,
  parseSp3ndDestination,
  parseSp3ndWallet,
  readSp3ndJson,
  sp3ndAuthHeaders,
  sp3ndError,
  sp3ndFetch,
  sp3ndOrder,
  sp3ndOrderId,
  sp3ndPaymentGate,
  sp3ndShippingAddress,
} from "@/lib/sp3nd";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const input = await request.json().catch(() => null) as Record<string, unknown> | null;
  const cartId = cleanSp3ndId(input?.cartId);
  const checkoutKey = cleanSp3ndCheckoutKey(input?.checkoutKey);
  const userWallet = parseSp3ndWallet(input?.userWallet);
  const destination = parseSp3ndDestination(input?.destination);
  if (!cartId || !checkoutKey || !userWallet || !destination) {
    return NextResponse.json({ success: false, error: "Cart, stable checkout key, connected wallet, email and complete destination are required." }, { status: 400 });
  }
  if (input?.ownerAuthorizedDestinationDisclosure !== true) {
    return NextResponse.json({ success: false, error: "Owner authorization is required before the destination can be sent to SP3ND." }, { status: 400 });
  }

  try {
    const response = await sp3ndFetch("createPartnerOrder", {
      method: "POST",
      headers: sp3ndAuthHeaders(checkoutKey),
      body: JSON.stringify({
        cart_id: cartId,
        idempotency_key: checkoutKey,
        user_wallet: userWallet,
        customer_email: destination.email,
        shipping_address: sp3ndShippingAddress(destination),
      }),
    });
    const payload = await readSp3ndJson(response);
    if (!response.ok) return NextResponse.json({ success: false, error: sp3ndError(payload, "SP3ND could not create the order."), code: payload?.code }, { status: response.status });
    const order = sp3ndOrder(payload);
    const orderId = sp3ndOrderId(payload);
    if (!orderId) throw new Error("SP3ND returned no order identifier.");
    return NextResponse.json({
      success: true,
      provider: "SP3ND",
      orderId,
      order,
      gate: sp3ndPaymentGate(order),
      privacy: "The delivery destination was sent directly to SP3ND for this order. RED QUEEN does not persist it.",
    }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "SP3ND order creation is unavailable." }, { status: 502 });
  }
}
