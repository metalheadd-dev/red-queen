import type { SurvivalLane } from "./catalog";

const STORE = "https://store.steampowered.com";
export const FOCUS_TAGS = [1662, 3978, 1100689] as const; // Survival, Survival Horror, Open World Survival Craft
export const IMPORT_PAGE_SIZE = 30;

export type SteamTag = { id: number; name: string };
export type SteamImportGame = {
  appId: number; title: string; studio: string; lane: SurvivalLane;
  genre: string; tags: string[]; setting: string; note: string;
  signal: string; accent: string; isPublished: boolean;
};

async function storeJson(url: URL): Promise<unknown> {
  const response = await fetch(url, {
    headers: { Accept: "application/json" },
    signal: AbortSignal.timeout(10000),
    next: { revalidate: 3600 },
  });
  if (!response.ok) throw new Error(`Steam Store returned ${response.status}`);
  return response.json();
}

export async function getSteamTags(): Promise<SteamTag[]> {
  const raw = await storeJson(new URL("/tagdata/populartags/english", STORE));
  if (!Array.isArray(raw)) throw new Error("Steam tag list is unavailable");
  return raw.filter((item): item is { tagid: number; name: string } =>
    !!item && Number.isSafeInteger(item.tagid) && item.tagid > 0 && typeof item.name === "string" && item.name.length > 0,
  ).map(item => ({ id: item.tagid, name: item.name }));
}

export function parseSearchRows(html: string): { appId: number; tagIds: number[] }[] {
  const seen = new Set<number>();
  return [...html.matchAll(/<a\b[^>]*\bdata-ds-appid="(\d+)"[^>]*\bdata-ds-tagids="(\[[^"<>]*\])"[^>]*>/g)]
    .flatMap(match => {
      const appId = Number(match[1]);
      if (!Number.isSafeInteger(appId) || appId <= 0 || appId > 2_147_483_647 || seen.has(appId)) return [];
      let tagIds: number[];
      try { tagIds = JSON.parse(match[2]); }
      catch { return []; }
      if (!Array.isArray(tagIds) || !tagIds.every(id => Number.isSafeInteger(id) && id > 0)) return [];
      seen.add(appId);
      return [{ appId, tagIds }];
    });
}

function textOnly(value: unknown): string {
  return typeof value === "string" ? value.replace(/<[^>]*>/g, " ")
    .replace(/&amp;/g, "&").replace(/&quot;/g, '"').replace(/&#(?:39|x27);/gi, "'")
    .replace(/&nbsp;/g, " ").replace(/\s+/g, " ").trim() : "";
}

function laneFor(tags: readonly number[]): SurvivalLane {
  if (tags.includes(3978) || tags.includes(1667)) return "HORROR";
  if (tags.includes(3835)) return "WASTELAND";
  if (tags.includes(1685) || tags.includes(3843)) return "CO-OP";
  if (tags.includes(1695)) return "EXPLORATION";
  return "HARDCORE";
}

export async function findSteamGames(tagIds: number[], page: number, knownTags: SteamTag[]): Promise<{ games: SteamImportGame[]; total: number }> {
  const search = new URL("/search/results/", STORE);
  search.searchParams.set("query", "");
  search.searchParams.set("start", String(page * IMPORT_PAGE_SIZE));
  search.searchParams.set("count", String(IMPORT_PAGE_SIZE));
  search.searchParams.set("dynamic_data", "");
  search.searchParams.set("sort_by", "_ASC");
  search.searchParams.set("supportedlang", "english");
  search.searchParams.set("tags", tagIds.join(","));
  search.searchParams.set("infinite", "1");
  const result = await storeJson(search) as { success?: number; results_html?: string; total_count?: number };
  if (result.success !== 1 || typeof result.results_html !== "string") throw new Error("Steam search is unavailable");
  const rows = parseSearchRows(result.results_html);
  const names = new Map(knownTags.map(tag => [tag.id, tag.name]));
  const accent: Record<SurvivalLane, string> = {
    HARDCORE: "#b66147", "CO-OP": "#aa8664", EXPLORATION: "#4da4aa", HORROR: "#cb4051", WASTELAND: "#c4ac72",
  };
  // Bound concurrency and requests: the Store details endpoint handles one App ID per request.
  const games: SteamImportGame[] = [];
  for (let offset = 0; offset < rows.length; offset += 5) {
    const batch = await Promise.all(rows.slice(offset, offset + 5).map(async ({ appId, tagIds: gameTags }) => {
      try {
        // Steam search applies the requested tags; data-ds-tagids contains only a short display subset.
        const url = new URL("/api/appdetails", STORE);
        url.searchParams.set("appids", String(appId));
        url.searchParams.set("l", "english");
        const raw = await storeJson(url) as Record<string, { success?: boolean; data?: Record<string, unknown> }>;
        const details = raw[String(appId)]?.data;
        if (!raw[String(appId)]?.success || details?.type !== "game") return null;
        const title = textOnly(details.name).slice(0, 120);
        const studio = Array.isArray(details.developers) ? textOnly(details.developers[0]).slice(0, 120) : "";
        const genres = Array.isArray(details.genres) ? details.genres as { description?: unknown }[] : [];
        const genre = genres.map(item => textOnly(item.description)).find(value => value && !["Indie", "Early Access", "Casual"].includes(value))?.slice(0, 80) || names.get(tagIds[0]) || "Survival";
        const note = textOnly(details.short_description).slice(0, 400);
        if (title.length < 2 || studio.length < 2 || note.length < 10) return null;
        const lane = laneFor(gameTags);
        const labels = [...new Set([...tagIds, ...gameTags].map(id => names.get(id)).filter((name): name is string => !!name))].slice(0, 12);
        return {
          appId, title, studio, lane, genre, tags: labels.slice(0, 12),
          setting: "STEAM / SURVIVAL", note, signal: labels[0]?.slice(0, 80) || "SURVIVAL",
          accent: accent[lane], isPublished: true,
        } satisfies SteamImportGame;
      } catch { return null; }
    }));
    games.push(...batch.filter(game => game !== null));
  }
  return { games, total: Number.isSafeInteger(result.total_count) ? result.total_count! : rows.length };
}
