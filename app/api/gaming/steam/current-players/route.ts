import { getPublishedCatalog } from "@/lib/gaming/catalog-server";

type SteamCount = { response?: { result?: number; player_count?: number } };

export async function GET() {
  const { games } = await getPublishedCatalog();
  const counts = await Promise.all(games.map(async game => {
    const url = new URL("https://api.steampowered.com/ISteamUserStats/GetNumberOfCurrentPlayers/v1/");
    url.searchParams.set("appid", String(game.id));
    try {
      const response = await fetch(url, { next: { revalidate: 900 }, signal: AbortSignal.timeout(6000) });
      if (!response.ok) return { appId: game.id, players: null };
      const data = await response.json() as SteamCount;
      const value = data?.response?.player_count;
      return { appId: game.id, players: data?.response?.result === 1 && Number.isSafeInteger(value) && value! >= 0 ? value! : null };
    } catch {
      return { appId: game.id, players: null };
    }
  }));
  return Response.json({ counts, metric: "STEAM_CURRENT_PLAYERS" }, {
    headers: { "Cache-Control": "public, s-maxage=900, stale-while-revalidate=300" },
  });
}
