import { SURVIVAL_GAMES, type SurvivalGame, type SurvivalLane } from "./catalog";
import { supabase } from "@/lib/supabase";

type Row = {
  app_id: number; title: string; studio: string; lane: SurvivalLane;
  genre: string; tags: string[]; setting: string; note: string;
  signal: string; accent: string; is_published: boolean;
};

export function rowToGame(row: Row): SurvivalGame {
  return {
    id: row.app_id, title: row.title, studio: row.studio, lane: row.lane,
    genre: row.genre, tags: row.tags, setting: row.setting,
    note: row.note, signal: row.signal, accent: row.accent,
  };
}

export async function getPublishedCatalog(): Promise<{ games: SurvivalGame[]; dynamicAvailable: boolean }> {
  if (!supabase) return { games: [...SURVIVAL_GAMES], dynamicAvailable: false };
  const { data, error } = await supabase.from("gaming_catalog_entries")
    .select("app_id,title,studio,lane,genre,tags,setting,note,signal,accent,is_published")
    .eq("is_published", true).order("created_at", { ascending: true });
  if (error) return { games: [...SURVIVAL_GAMES], dynamicAvailable: false };
  const builtIn = new Set(SURVIVAL_GAMES.map(game => game.id));
  return { games: [...SURVIVAL_GAMES, ...(data as Row[]).filter(row => !builtIn.has(row.app_id)).map(rowToGame)], dynamicAvailable: true };
}
