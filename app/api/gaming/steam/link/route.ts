import { NextRequest, NextResponse } from "next/server";
import { getAuthIdentifier } from "@/lib/auth-helpers";
import { getHashedWallet } from "@/lib/crypto";
import { supabase } from "@/lib/supabase";
import { readSteamReceipt, STEAM_RECEIPT_COOKIE } from "@/lib/gaming/steam-openid";

export const dynamic = "force-dynamic";

async function owner(request: NextRequest) {
  const identity = await getAuthIdentifier(request);
  return identity ? getHashedWallet(identity) : null;
}

function unavailable(error?: { code?: string; message?: string } | null) {
  const missing = error?.code === "42P01" || /gaming_steam_links/i.test(error?.message || "");
  return NextResponse.json({ error: missing ? "Steam connection is being prepared. Please try again later." : "Steam linking is temporarily unavailable." }, { status: missing ? 503 : 500 });
}

export async function GET(request: NextRequest) {
  const userKey = await owner(request);
  if (!userKey) return NextResponse.json({ error: "Sign in to Red Queen first." }, { status: 401 });
  if (!supabase) return NextResponse.json({ available: false, steamId: null, message: "Steam linking is not configured." });
  const { data, error } = await supabase.from("gaming_steam_links").select("steam_id").eq("user_key", userKey).maybeSingle();
  if (error) return unavailable(error);
  return NextResponse.json({ available: true, steamId: data?.steam_id || null }, { headers: { "Cache-Control": "no-store" } });
}

export async function POST(request: NextRequest) {
  const userKey = await owner(request);
  if (!userKey) return NextResponse.json({ error: "Sign in to Red Queen first." }, { status: 401 });
  if (!supabase) return unavailable();
  const steamId = readSteamReceipt(request.cookies.get(STEAM_RECEIPT_COOKIE)?.value, userKey);
  if (!steamId) return NextResponse.json({ error: "Steam verification expired. Connect again." }, { status: 400 });
  const { data: existing, error: existingError } = await supabase.from("gaming_steam_links").select("steam_id").eq("user_key", userKey).maybeSingle();
  if (existingError) return unavailable(existingError);
  if (existing?.steam_id && existing.steam_id !== steamId) return NextResponse.json({ error: "Disconnect the current Steam account before linking another." }, { status: 409 });
  const { data: claimed, error: claimedError } = await supabase.from("gaming_steam_links").select("user_key").eq("steam_id", steamId).maybeSingle();
  if (claimedError) return unavailable(claimedError);
  if (claimed && claimed.user_key !== userKey) return NextResponse.json({ error: "This Steam account is linked to another RQ account." }, { status: 409 });
  // Insert only: two simultaneous callbacks must never overwrite an existing link.
  const { error } = await supabase.from("gaming_steam_links").insert({ user_key: userKey, steam_id: steamId });
  if (error) {
    if (error.code !== "23505") return unavailable(error);
    const { data: current, error: currentError } = await supabase.from("gaming_steam_links").select("steam_id").eq("user_key", userKey).maybeSingle();
    if (currentError) return unavailable(currentError);
    if (current?.steam_id !== steamId) return NextResponse.json({ error: current ? "Disconnect the current Steam account before linking another." : "This Steam account is linked to another RQ account." }, { status: 409 });
  }
  const response = NextResponse.json({ steamId }, { headers: { "Cache-Control": "no-store" } });
  response.cookies.set(STEAM_RECEIPT_COOKIE, "", { path: "/api/gaming/steam", maxAge: 0 });
  return response;
}

export async function DELETE(request: NextRequest) {
  const userKey = await owner(request);
  if (!userKey) return NextResponse.json({ error: "Sign in to Red Queen first." }, { status: 401 });
  if (!supabase) return unavailable();
  const { error } = await supabase.from("gaming_steam_links").delete().eq("user_key", userKey);
  if (error) return unavailable(error);
  const response = NextResponse.json({ disconnected: true }, { headers: { "Cache-Control": "no-store" } });
  response.cookies.set(STEAM_RECEIPT_COOKIE, "", { path: "/api/gaming/steam", maxAge: 0 });
  return response;
}
