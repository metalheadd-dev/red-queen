import { SURVIVAL_GAMES, type SurvivalGame } from "./catalog";

const STEAM_API = "https://api.steampowered.com";

export type SteamGame = {
  appId: number;
  title: string;
  minutesPlayed: number;
  minutesRecently: number | null;
  lastPlayedAt: number | null;
  survivalPick: boolean;
};

export type SteamProfile = {
  name: string;
  avatarUrl: string | null;
  profileUrl: string;
  visibility: "PUBLIC" | "PRIVATE" | "UNKNOWN";
  currentGame: string | null;
};

export type SteamDashboard = {
  profile: SteamProfile | null;
  games: SteamGame[];
  recentlyPlayed: SteamGame[];
  libraryVisibility: "VISIBLE" | "NONE_OR_PRIVATE";
  recentAvailable: boolean;
};

export type SteamAchievement = {
  id: string;
  name: string;
  description: string | null;
  unlocked: boolean;
  unlockedAt: number | null;
};

function nonnegativeInteger(value: unknown): number {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 ? Math.floor(value) : 0;
}

function optionalInteger(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) && value >= 0 ? Math.floor(value) : null;
}

function stringOrNull(value: unknown): string | null {
  return typeof value === "string" && value.trim() ? value.trim() : null;
}

async function steamJson(path: string, key: string, params: Record<string, string>): Promise<unknown> {
  const url = new URL(path, STEAM_API);
  url.searchParams.set("key", key);
  url.searchParams.set("format", "json");
  for (const [name, value] of Object.entries(params)) url.searchParams.set(name, value);
  const response = await fetch(url, { cache: "no-store", signal: AbortSignal.timeout(8000) });
  if (!response.ok) throw Object.assign(new Error("Steam Web API unavailable"), { status: response.status });
  return response.json();
}

type RawGame = { appid?: unknown; name?: unknown; playtime_forever?: unknown; playtime_2weeks?: unknown; rtime_last_played?: unknown };
type OwnedResponse = { response?: { games?: RawGame[] } };
type RecentResponse = { response?: { games?: RawGame[] } };
type SummaryResponse = { response?: { players?: Array<{ personaname?: unknown; avatarfull?: unknown; profileurl?: unknown; communityvisibilitystate?: unknown; gameextrainfo?: unknown }> } };
type AchievementResponse = { playerstats?: { success?: boolean; achievements?: Array<{ apiname?: unknown; name?: unknown; description?: unknown; achieved?: unknown; unlocktime?: unknown }> } };

function toGame(raw: RawGame, catalog: readonly SurvivalGame[], recentMinutes: number | null = null): SteamGame | null {
  const appId = Number(raw.appid);
  if (!Number.isSafeInteger(appId) || appId <= 0) return null;
  const curated = catalog.find(game => game.id === appId);
  if (!curated) return null;
  return {
    appId,
    title: curated.title,
    minutesPlayed: nonnegativeInteger(raw.playtime_forever),
    minutesRecently: recentMinutes ?? optionalInteger(raw.playtime_2weeks),
    lastPlayedAt: optionalInteger(raw.rtime_last_played),
    survivalPick: true,
  };
}

function profileFromResponse(value: SummaryResponse, steamId: string): SteamProfile | null {
  const player = value?.response?.players?.[0];
  if (!player) return null;
  const avatar = stringOrNull(player.avatarfull);
  const profileUrl = stringOrNull(player.profileurl);
  return {
    name: stringOrNull(player.personaname) || `Steam ${steamId}`,
    avatarUrl: avatar && /^https:\/\/(?:avatars\.steamstatic\.com|steamcdn-a\.akamaihd\.net)\//.test(avatar) ? avatar : null,
    profileUrl: profileUrl && /^https:\/\/steamcommunity\.com\//.test(profileUrl) ? profileUrl : `https://steamcommunity.com/profiles/${steamId}`,
    visibility: player.communityvisibilitystate === 3 ? "PUBLIC" : player.communityvisibilitystate === 1 ? "PRIVATE" : "UNKNOWN",
    currentGame: stringOrNull(player.gameextrainfo),
  };
}

export async function loadSteamDashboard(key: string, steamId: string, catalog: readonly SurvivalGame[] = SURVIVAL_GAMES): Promise<SteamDashboard> {
  const [owned, recent, summary] = await Promise.allSettled([
    steamJson("/IPlayerService/GetOwnedGames/v1/", key, { steamid: steamId, include_appinfo: "true", include_played_free_games: "true" }),
    steamJson("/IPlayerService/GetRecentlyPlayedGames/v1/", key, { steamid: steamId, count: "0" }),
    steamJson("/ISteamUser/GetPlayerSummaries/v2/", key, { steamids: steamId }),
  ]);
  if (owned.status === "rejected") throw new Error("Steam library unavailable");
  const ownedRaw = (owned.value as OwnedResponse)?.response?.games;
  const recentRaw = recent.status === "fulfilled" ? (recent.value as RecentResponse)?.response?.games : undefined;
  const recentMap = new Map((Array.isArray(recentRaw) ? recentRaw : []).map(game => [Number(game.appid), nonnegativeInteger(game.playtime_2weeks)]));
  const games = (Array.isArray(ownedRaw) ? ownedRaw : []).flatMap(raw => {
    const game = toGame(raw, catalog, recentMap.get(Number(raw.appid)) ?? null);
    return game ? [game] : [];
  }).sort((a, b) => b.minutesPlayed - a.minutesPlayed);
  const gameMap = new Map(games.map(game => [game.appId, game]));
  const recentlyPlayed = (Array.isArray(recentRaw) ? recentRaw : []).flatMap(raw => {
    const game = gameMap.get(Number(raw.appid)) || toGame(raw, catalog);
    return game ? [{ ...game, minutesRecently: nonnegativeInteger(raw.playtime_2weeks) }] : [];
  }).sort((a, b) => (b.minutesRecently || 0) - (a.minutesRecently || 0));
  return {
    profile: summary.status === "fulfilled" ? profileFromResponse(summary.value as SummaryResponse, steamId) : null,
    games,
    recentlyPlayed,
    libraryVisibility: games.length ? "VISIBLE" : "NONE_OR_PRIVATE",
    recentAvailable: recent.status === "fulfilled",
  };
}

export async function loadSteamAchievements(key: string, steamId: string, appId: number): Promise<SteamAchievement[] | null> {
  let result: AchievementResponse;
  try {
    result = await steamJson("/ISteamUserStats/GetPlayerAchievements/v1/", key, {
      steamid: steamId, appid: String(appId), l: "english",
    }) as AchievementResponse;
  } catch (error) {
    if (error && typeof error === "object" && "status" in error && [400, 403, 404].includes(Number(error.status))) return null;
    throw error;
  }
  const raw = result?.playerstats?.success && Array.isArray(result.playerstats.achievements)
    ? result.playerstats.achievements : null;
  if (!raw) return null;
  return raw.flatMap(item => {
    const id = stringOrNull(item.apiname);
    if (!id) return [];
    return [{
      id,
      name: stringOrNull(item.name) || id,
      description: stringOrNull(item.description),
      unlocked: item.achieved === 1 || item.achieved === true,
      unlockedAt: optionalInteger(item.unlocktime),
    }];
  });
}
