import { NextRequest, NextResponse } from "next/server";
import { createSteamReceipt, readSteamFlow, steamIdFromAssertion, steamLinkConfigured, STEAM_RECEIPT_COOKIE, STEAM_STATE_COOKIE, verifySteamAssertion } from "@/lib/gaming/steam-openid";

export const dynamic = "force-dynamic";

export async function GET(request: NextRequest) {
  const fail = (reason: string) => {
    const response = NextResponse.redirect(new URL(`/gaming/profile?steam=${reason}`, request.url));
    response.cookies.set(STEAM_STATE_COOKIE, "", { path: "/api/gaming/steam", maxAge: 0 });
    response.cookies.set(STEAM_RECEIPT_COOKIE, "", { path: "/api/gaming/steam", maxAge: 0 });
    response.headers.set("Cache-Control", "no-store");
    response.headers.set("Referrer-Policy", "no-referrer");
    return response;
  };
  if (!steamLinkConfigured()) return fail("unavailable");
  const state = request.nextUrl.searchParams.get("state");
  const userKey = readSteamFlow(request.cookies.get(STEAM_STATE_COOKIE)?.value, state);
  if (!state || !userKey) return fail("invalid");
  if (request.nextUrl.searchParams.get("openid.mode") === "cancel") return fail("cancelled");
  const expected = new URL("/api/gaming/steam/callback", request.nextUrl.origin);
  expected.searchParams.set("state", state);
  const steamId = steamIdFromAssertion(request.nextUrl.searchParams, expected.toString());
  if (!steamId) return fail("invalid");
  try {
    if (!await verifySteamAssertion(request.nextUrl.searchParams)) return fail("invalid");
  } catch { return fail("unavailable"); }
  const response = NextResponse.redirect(new URL("/gaming/profile?steam=ready", request.url));
  response.headers.set("Cache-Control", "no-store");
  response.headers.set("Referrer-Policy", "no-referrer");
  response.cookies.set(STEAM_STATE_COOKIE, "", { path: "/api/gaming/steam", maxAge: 0 });
  response.cookies.set(STEAM_RECEIPT_COOKIE, createSteamReceipt(steamId, userKey), {
    httpOnly: true, secure: request.nextUrl.protocol === "https:", sameSite: "strict", path: "/api/gaming/steam", maxAge: 180,
  });
  return response;
}
