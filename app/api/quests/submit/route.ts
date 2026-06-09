import { supabase } from "@/lib/supabase";
import { getAuthIdentifier } from "@/lib/auth-helpers";
import { getHashedWallet } from "@/lib/crypto";

export async function POST(req: Request) {
  if (!supabase) return Response.json({ error: "DB not configured" }, { status: 500 });

  const authId = await getAuthIdentifier(req);
  if (!authId) {
    return Response.json({ error: "Unauthorized: Active session required" }, { status: 401 });
  }

  try {
    const { questId, proofLink } = await req.json();
    if (!questId || !proofLink) {
      return Response.json({ error: "questId and proofLink are required" }, { status: 400 });
    }

    const hashedWallet = getHashedWallet(authId);

    // 1. Verify that this quest belongs to the authenticated user
    const { data: quest, error: queryErr } = await supabase
      .from("user_quests")
      .select("id, wallet_address, status")
      .eq("id", questId)
      .single();

    if (queryErr) throw new Error(queryErr.message);

    if (quest.wallet_address !== hashedWallet) {
      return Response.json({ error: "Access Denied: Quest owner mismatch" }, { status: 403 });
    }

    if (quest.status === "completed") {
      return Response.json({ error: "Quest is already completed" }, { status: 400 });
    }

    // 2. Update status and save proof
    const { data, error: updateErr } = await supabase
      .from("user_quests")
      .update({
        status: "pending",
        proof_link: proofLink,
        submitted_at: new Date().toISOString()
      })
      .eq("id", questId)
      .select()
      .single();

    if (updateErr) throw new Error(updateErr.message);

    return Response.json({ success: true, quest: data });
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
