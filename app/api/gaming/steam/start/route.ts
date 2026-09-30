import { NextRequest, NextResponse } from "next/server";
import { getAuthIdentifier } from "@/lib/auth-helpers";
import { getHashedWallet } from "@/lib/crypto";
import { supabase } from "@/lib/supabase";
import { createSteamFlow, steamLinkConfigured, steamOpenIdUrl, STEAM_RECEIPT_COOKIE, STEAM_STATE_COOKIE } from "@/lib/gaming/steam-openid";

export const dynamic = "force-dynamic";

export async function POST(request: NextRequest) {
  const identity = await getAuthIdentifier(request);
  if (!identity) return NextResponse.json({ error: "Sign in to Red Queen first." }, { status: 401 });
  if (!steamLinkConfigured() || !supabase) return NextResponse.json({ error: "Steam connection is temporarily unavailable." }, { status: 503 });
  const userKey = getHashedWallet(identity);
  const { data, error } = await supabase.from("gaming_steam_links").select("steam_id").eq("user_key", userKey).maybeSingle();
  if (error) return NextResponse.json({ error: "Steam connection is being prepared. Please try again later." }, { status: 503 });
  if (data) return NextResponse.json({ error: "Steam is already connected. Disconnect it before linking another account." }, { status: 409 });
  const { nonce, cookie } = createSteamFlow(userKey);
  const response = NextResponse.json({ url: steamOpenIdUrl(request.nextUrl.origin, nonce) }, { headers: { "Cache-Control": "no-store" } });
  response.cookies.set(STEAM_STATE_COOKIE, cookie, {
    httpOnly: true, secure: request.nextUrl.protocol === "https:", sameSite: "lax", path: "/api/gaming/steam", maxAge: 600,
  });
  response.cookies.set(STEAM_RECEIPT_COOKIE, "", { path: "/api/gaming/steam", maxAge: 0 });
  return response;
}
