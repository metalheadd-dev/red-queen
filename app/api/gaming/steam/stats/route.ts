import { getAuthIdentifier } from "@/lib/auth-helpers";
import { getHashedWallet } from "@/lib/crypto";
import { loadSteamDashboard } from "@/lib/gaming/steam-stats";
import { getPublishedCatalog } from "@/lib/gaming/catalog-server";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";
const headers = { "Cache-Control": "private, no-store" };

export async function GET(request: Request) {
  const identity = await getAuthIdentifier(request);
  if (!identity) return Response.json({ error: "Sign in to view your Steam games." }, { status: 401, headers });
  if (!supabase) return Response.json({ error: "Steam connection is unavailable." }, { status: 503, headers });
  const { data, error } = await supabase.from("gaming_steam_links")
    .select("steam_id")
    .eq("user_key", getHashedWallet(identity))
    .maybeSingle();
  if (error) return Response.json({ error: "Steam connection is unavailable." }, { status: 503, headers });
  if (!data?.steam_id) return Response.json({ error: "Connect Steam first." }, { status: 409, headers });
  const key = process.env.STEAM_WEB_API_KEY;
  if (!key) return Response.json({ error: "Steam game stats are not configured yet." }, { status: 503, headers });
  try {
    const { games: catalog } = await getPublishedCatalog();
    const dashboard = await loadSteamDashboard(key, data.steam_id, catalog);
    return Response.json(dashboard, { headers });
  } catch {
    return Response.json({ error: "Steam game stats could not be loaded. Try again later." }, { status: 502, headers });
  }
}
