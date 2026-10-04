import { z } from "zod";
import { checkAdmin } from "@/lib/auth-helpers";
import { SURVIVAL_GAMES } from "@/lib/gaming/catalog";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";
const headers = { "Cache-Control": "private, no-store" };

const entry = z.object({
  appId: z.number().int().positive().max(2_147_483_647),
  title: z.string().trim().min(2).max(120),
  studio: z.string().trim().min(2).max(120),
  lane: z.enum(["HARDCORE", "CO-OP", "EXPLORATION", "HORROR", "WASTELAND"]),
  genre: z.string().trim().min(2).max(80),
  tags: z.array(z.string().trim().min(2).max(40)).max(12),
  setting: z.string().trim().min(2).max(120),
  note: z.string().trim().min(10).max(400),
  signal: z.string().trim().min(2).max(80),
  accent: z.string().regex(/^#[0-9a-fA-F]{6}$/),
  isPublished: z.boolean(),
});

async function access(request: Request) {
  if (!await checkAdmin(request)) return Response.json({ error: "Administrator access required." }, { status: 403, headers });
  if (!supabase) return Response.json({ error: "Database is not configured." }, { status: 503, headers });
  return null;
}

export async function GET(request: Request) {
  const denied = await access(request);
  if (denied) return denied;
  const { data, error } = await supabase!.from("gaming_catalog_entries").select("*").order("created_at", { ascending: false });
  return error ? Response.json({ error: "Gaming catalog table is unavailable. Apply its migration." }, { status: 503, headers })
    : Response.json({ entries: data }, { headers });
}

async function save(request: Request, update: boolean) {
  const denied = await access(request);
  if (denied) return denied;
  let parsed;
  try { parsed = entry.safeParse(await request.json()); }
  catch { return Response.json({ error: "Invalid JSON." }, { status: 400, headers }); }
  if (!parsed.success) return Response.json({ error: "Check the App ID, title, genre, tags and description." }, { status: 400, headers });
  const game = parsed.data;
  if (SURVIVAL_GAMES.some(builtIn => builtIn.id === game.appId)) return Response.json({ error: "This title is already in the built-in RQ catalog." }, { status: 409, headers });
  const row = {
    app_id: game.appId, title: game.title, studio: game.studio,
    lane: game.lane, genre: game.genre, tags: [...new Set(game.tags)],
    setting: game.setting, note: game.note, signal: game.signal,
    accent: game.accent, is_published: game.isPublished,
    updated_at: new Date().toISOString(),
  };
  const result = update
    ? await supabase!.from("gaming_catalog_entries").update(row).eq("app_id", game.appId).select().maybeSingle()
    : await supabase!.from("gaming_catalog_entries").insert(row).select().single();
  if (result.error) return Response.json({ error: result.error.code === "23505" ? "This Steam App ID is already in the catalog." : "Could not save game. Check the catalog migration." }, { status: result.error.code === "23505" ? 409 : 503, headers });
  if (!result.data) return Response.json({ error: "Game not found." }, { status: 404, headers });
  return Response.json({ entry: result.data }, { headers });
}

export async function POST(request: Request) { return save(request, false); }
export async function PATCH(request: Request) { return save(request, true); }
