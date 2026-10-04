export type SurvivalLane = "HARDCORE" | "CO-OP" | "EXPLORATION" | "HORROR" | "WASTELAND";

export type SurvivalGame = {
  id: number;
  title: string;
  studio: string;
  lane: SurvivalLane;
  setting: string;
  note: string;
  signal: string;
  accent: string;
  genre?: string;
  tags?: string[];
};

// Editorial selection. Store links point to the game's official Steam listing.
// Prices, discounts and partnerships are intentionally not inferred here.
export const SURVIVAL_GAMES: readonly SurvivalGame[] = [
  { id: 883710, title: "Resident Evil 2", studio: "CAPCOM", lane: "HORROR", setting: "RACCOON CITY / 1998", note: "Survival horror where every bullet, door and detour matters.", signal: "SURVIVAL HORROR", accent: "#cb4051" },
  { id: 377160, title: "Fallout 4", studio: "Bethesda Game Studios", lane: "WASTELAND", setting: "THE COMMONWEALTH", note: "Explore the wasteland, rebuild a home and survive its threats.", signal: "POST-APOCALYPSE", accent: "#c4ac72" },
  { id: 108600, title: "Project Zomboid", studio: "The Indie Stone", lane: "HARDCORE", setting: "KENTUCKY / OUTBREAK", note: "Every supply run is a decision about how long you survive.", signal: "SYSTEMIC SURVIVAL", accent: "#b66147" },
  { id: 305620, title: "The Long Dark", studio: "Hinterland Studio", lane: "HARDCORE", setting: "CANADIAN WILDERNESS", note: "Cold, hunger and distance turn a quiet journey into a test.", signal: "WILDERNESS", accent: "#79a6ad" },
  { id: 892970, title: "Valheim", studio: "Iron Gate AB", lane: "CO-OP", setting: "THE TENTH WORLD", note: "Build a refuge together, then push beyond its walls.", signal: "CO-OP / BUILD", accent: "#aa8664" },
  { id: 322330, title: "Don't Starve Together", studio: "Klei Entertainment", lane: "CO-OP", setting: "THE CONSTANT", note: "A strange world where coordination is your best resource.", signal: "CO-OP / CRAFT", accent: "#c9aa75" },
  { id: 264710, title: "Subnautica", studio: "Unknown Worlds", lane: "EXPLORATION", setting: "PLANET 4546B", note: "Explore deeper, manage oxygen and build a way home.", signal: "OCEAN / DISCOVERY", accent: "#4da4aa" },
  { id: 1458140, title: "Pacific Drive", studio: "Ironwood Studios", lane: "EXPLORATION", setting: "OLYMPIC EXCLUSION ZONE", note: "Your car is shelter, equipment and the only exit.", signal: "ANOMALY / ROAD", accent: "#b99b7d" },
];

export const DEFAULT_SURVIVAL_TAGS: Record<number, string[]> = {
  883710: ["Survival Horror", "Zombies", "Singleplayer"],
  377160: ["Post-apocalyptic", "Open World", "RPG"],
  108600: ["Survival", "Zombies", "Sandbox"],
  305620: ["Survival", "Exploration", "Singleplayer"],
  892970: ["Survival", "Open World", "Co-op"],
  322330: ["Survival", "Crafting", "Co-op"],
  264710: ["Survival", "Exploration", "Underwater"],
  1458140: ["Survival", "Driving", "Exploration"],
};

export function catalogTags(game: SurvivalGame): string[] {
  return game.tags?.length ? game.tags : DEFAULT_SURVIVAL_TAGS[game.id] || [];
}

export function steamStoreUrl(id: number): string {
  return `https://store.steampowered.com/app/${id}/`;
}

export const GAMING_SAVED_KEY = "rq-gaming-saved-v1";

export function parseSavedGames(raw: string | null): number[] {
  if (!raw) return [];
  try {
    const ids = JSON.parse(raw);
    if (!Array.isArray(ids)) return [];
    return [...new Set(ids.filter((id): id is number => Number.isSafeInteger(id) && id > 0 && id <= 2_147_483_647))].slice(0, 500);
  } catch {
    return [];
  }
}
