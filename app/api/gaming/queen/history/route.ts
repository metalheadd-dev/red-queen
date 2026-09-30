import { getAuthIdentifier } from "@/lib/auth-helpers";
import { getHashedWallet } from "@/lib/crypto";
import { isGamingConversationId } from "@/lib/gaming/queen";
import { decodeGamingCursor, encodeGamingCursor } from "@/lib/gaming/history-cursor";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";
const headers = { "Cache-Control": "private, no-store" };

export async function GET(req: Request) {
  const owner = await getAuthIdentifier(req);
  if (!owner) return Response.json({ error: "Sign in to load account gaming history." }, { status: 401, headers });
  const params = new URL(req.url).searchParams;
  const conversation = params.get("conversation");
  const cursor = decodeGamingCursor(params.get("cursor"));
  if (params.has("cursor") && !cursor) return Response.json({ error: "Invalid history cursor." }, { status: 400, headers });
  if (conversation && !isGamingConversationId(conversation)) return Response.json({ error: "Invalid conversation." }, { status: 400, headers });
  if (!supabase) return Response.json({ error: "Account gaming history is unavailable." }, { status: 503, headers });
  let query = supabase.from("gaming_queen_generations")
    .select("id, conversation_id, prompt, response, context, created_at")
    .eq("user_key", getHashedWallet(owner));
  if (conversation) query = query.eq("conversation_id", conversation.toLowerCase());
  if (cursor) query = query.or(`created_at.lt.${cursor.createdAt},and(created_at.eq.${cursor.createdAt},id.lt.${cursor.id})`);
  const { data, error } = await query.order("created_at", { ascending: false }).order("id", { ascending: false }).limit(101);
  if (error) return Response.json({ error: "Account gaming history is unavailable. Your browser copy remains accessible." }, { status: 503, headers });
  const page = (data || []).slice(0, 100);
  return Response.json({ generations: [...page].reverse(), nextCursor: (data?.length || 0) > 100 ? encodeGamingCursor(page[page.length - 1]) : null }, { headers });
}
