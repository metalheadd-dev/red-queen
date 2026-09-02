import { NextResponse } from "next/server";
import {
  parseSp3ndItems,
  parseSp3ndWallet,
  readSp3ndJson,
  sp3ndAuthHeaders,
  sp3ndError,
  sp3ndFetch,
  sp3ndReadiness,
} from "@/lib/sp3nd";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const input = await request.json().catch(() => null) as Record<string, unknown> | null;
  const items = parseSp3ndItems(input?.items);
  const userWallet = parseSp3ndWallet(input?.userWallet);
  const country = typeof input?.country === "string" ? input.country.trim().toUpperCase().slice(0, 2) : "";
  const postalCode = typeof input?.postalCode === "string" ? input.postalCode.trim().slice(0, 24) : "";
  if (!sp3ndReadiness().ready) return NextResponse.json({ success: false, error: "SP3ND partner credentials are not configured." }, { status: 503 });
  if (!items) return NextResponse.json({ success: false, error: "Provide between 1 and 12 exact Amazon or eBay product URLs." }, { status: 400 });
  if (!userWallet) return NextResponse.json({ success: false, error: "Connect a valid Solana wallet before creating the cart." }, { status: 400 });
  if (!/^[A-Z]{2}$/.test(country) || !postalCode || input?.ownerAuthorizedDestinationDisclosure !== true) {
    return NextResponse.json({ success: false, error: "Owner approval, destination country and postal code are required for server pricing." }, { status: 400 });
  }

  try {
    const response = await sp3ndFetch("createPartnerCart", {
      method: "POST",
      headers: sp3ndAuthHeaders(),
      body: JSON.stringify({
        ship_to_country: country,
        ship_to_postal_code: postalCode,
        user_wallet: userWallet,
        items: items.map((entry) => ({ product_url: entry.productUrl, quantity: entry.quantity })),
      }),
    });
    const payload = await readSp3ndJson(response);
    if (!response.ok) return NextResponse.json({ success: false, error: sp3ndError(payload, "SP3ND could not price this cart."), code: payload?.code }, { status: response.status });
    const cart = payload?.cart || payload;
    const cartId = typeof cart?.cart_id === "string" ? cart.cart_id : typeof cart?.id === "string" ? cart.id : "";
    if (!cartId) throw new Error("SP3ND returned no cart identifier.");
    return NextResponse.json({
      success: true,
      provider: "SP3ND",
      cartId,
      cart,
      expiresAt: cart?.expires_at || null,
      boundary: "SP3ND resolved product and provisional commerce values. No order or payment has been created.",
    }, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    return NextResponse.json({ success: false, error: error instanceof Error ? error.message : "SP3ND cart pricing is unavailable." }, { status: 502 });
  }
}
