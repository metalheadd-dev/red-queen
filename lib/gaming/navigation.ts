import { isGamingConversationId } from "./queen";
import { SURVIVAL_GAMES } from "./catalog";

/** Only known local destinations survive an authentication round trip. */
export function gamingReturnPath(value: unknown): string | null {
  if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("//") || value.includes("\\")) return null;
  const url = new URL(value, "https://redqueen.invalid");
  if (url.origin !== "https://redqueen.invalid") return null;
  if (url.pathname === "/gaming/profile") return "/gaming/profile";
  if (url.pathname !== "/gaming/queen") return null;
  const query = new URLSearchParams();
  const id = url.searchParams.get("conversation");
  if (isGamingConversationId(id)) query.set("conversation", id.toLowerCase());
  const game = Number(url.searchParams.get("game"));
  if (SURVIVAL_GAMES.some(item => item.id === game)) query.set("game", String(game));
  return `/gaming/queen${query.size ? `?${query}` : ""}`;
}
