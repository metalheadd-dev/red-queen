import { z } from "zod";
import { checkAdmin } from "@/lib/auth-helpers";
import { SURVIVAL_GAMES } from "@/lib/gaming/catalog";
import { FOCUS_TAGS, findSteamGames, getSteamTags } from "@/lib/gaming/steam-import";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";
const headers = { "Cache-Control": "private, no-store" };
const requestSchema = z.object({
  tagIds: z.array(z.number().int().positive()).min(1).max(4),
  page: z.number().int().min(0).max(20),
  action: z.enum(["preview", "import"]),
});

export async function GET(request: Request) {
  if (!await checkAdmin(request)) return Response.json({ error: "Administrator access required." }, { status: 403, headers });
  try { return Response.json({ tags: await getSteamTags(), focusTagIds: FOCUS_TAGS }, { headers }); }
  catch { return Response.json({ error: "Steam tags are temporarily unavailable." }, { status: 502, headers }); }
}

export async function POST(request: Request) {
  if (!await checkAdmin(request)) return Response.json({ error: "Administrator access required." }, { status: 403, headers });
  let parsed;
  try { parsed = requestSchema.safeParse(await request.json()); }
  catch { return Response.json({ error: "Invalid JSON." }, { status: 400, headers }); }
  if (!parsed.success) return Response.json({ error: "Select up to four tags and a valid result page." }, { status: 400, headers });
  const { tagIds, page, action } = parsed.data;
  if (new Set(tagIds).size !== tagIds.length || !tagIds.some(id => FOCUS_TAGS.includes(id as typeof FOCUS_TAGS[number]))) {
    return Response.json({ error: "Include a Survival, Survival Horror or Open World Survival Craft tag." }, { status: 400, headers });
  }
  if (action === "import" && !supabase) return Response.json({ error: "Database is not configured." }, { status: 503, headers });
  try {
    const tags = await getSteamTags();
    const known = new Set(tags.map(tag => tag.id));
    if (tagIds.some(id => !known.has(id))) return Response.json({ error: "Unknown Steam tag." }, { status: 400, headers });
    const result = await findSteamGames(tagIds, page, tags);
    if (action === "preview") return Response.json(result, { headers });

    const builtIn = new Set(SURVIVAL_GAMES.map(game => game.id));
    const rows = result.games.filter(game => !builtIn.has(game.appId)).map(game => ({
      app_id: game.appId, title: game.title, studio: game.studio, lane: game.lane,
      genre: game.genre, tags: game.tags, setting: game.setting, note: game.note,
      signal: game.signal, accent: game.accent, is_published: game.isPublished,
    }));
    if (rows.length === 0) return Response.json({ added: 0, skipped: result.games.length, total: result.total }, { headers });
    // DO NOTHING on conflicts keeps manually edited and previously hidden rows intact.
    const { data, error } = await supabase!.from("gaming_catalog_entries")
      .upsert(rows, { onConflict: "app_id", ignoreDuplicates: true }).select("app_id");
    if (error) return Response.json({ error: "Could not import games. Check the gaming catalog migration." }, { status: 503, headers });
    const added = data?.length ?? 0;
    return Response.json({ added, skipped: result.games.length - added, total: result.total }, { headers });
  } catch {
    return Response.json({ error: "Steam search is temporarily unavailable. Try this page again later." }, { status: 502, headers });
  }
}
