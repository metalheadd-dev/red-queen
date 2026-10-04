import { getPublishedCatalog } from "@/lib/gaming/catalog-server";

type SteamCount = { response?: { result?: number; player_count?: number } };

export async function GET(request: Request) {
  const raw = new URL(request.url).searchParams.get("ids") || "";
  const ids = raw.split(",").map(Number);
  if (!raw || ids.length > 24 || ids.some(id => !Number.isSafeInteger(id) || id <= 0)) {
    return Response.json({ error: "Request 1–24 valid Steam App IDs." }, { status: 400 });
  }
  const { games } = await getPublishedCatalog();
  const allowed = new Set(games.map(game => game.id));
  const counts = await Promise.all([...new Set(ids)].filter(id => allowed.has(id)).map(async id => {
    const url = new URL("https://api.steampowered.com/ISteamUserStats/GetNumberOfCurrentPlayers/v1/");
    url.searchParams.set("appid", String(id));
    try {
      const response = await fetch(url, { next: { revalidate: 900 }, signal: AbortSignal.timeout(6000) });
      if (!response.ok) return { appId: id, players: null };
      const data = await response.json() as SteamCount;
      const value = data?.response?.player_count;
      return { appId: id, players: data?.response?.result === 1 && Number.isSafeInteger(value) && value! >= 0 ? value! : null };
    } catch {
      return { appId: id, players: null };
    }
  }));
  return Response.json({ counts, metric: "STEAM_CURRENT_PLAYERS" }, {
    headers: { "Cache-Control": "public, s-maxage=900, stale-while-revalidate=300" },
  });
}
