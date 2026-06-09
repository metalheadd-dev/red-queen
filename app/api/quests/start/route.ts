import { supabase } from "@/lib/supabase";
import { getAuthIdentifier } from "@/lib/auth-helpers";
import { getHashedWallet } from "@/lib/crypto";
import { isValidSolanaPublicKey } from "@/lib/solana";

export async function POST(req: Request) {
  if (!supabase) return Response.json({ error: "DB not configured" }, { status: 500 });

  const authId = await getAuthIdentifier(req);
  if (!authId) {
    return Response.json({ error: "Unauthorized: Active session required" }, { status: 401 });
  }

  try {
    const { targetId, type } = await req.json();
    if (!targetId || !type || !["task", "bounty"].includes(type)) {
      return Response.json({ error: "Invalid targetId or type parameters" }, { status: 400 });
    }

    const hashedWallet = getHashedWallet(authId);

    // 1. Check if user already started/completed this item
    const { data: existing, error: checkErr } = await supabase
      .from("user_quests")
      .select("id, status")
      .eq("wallet_address", hashedWallet)
      .eq("target_id", targetId)
      .single();

    if (checkErr && checkErr.code !== "PGRST116") {
      throw new Error(checkErr.message);
    }

    if (existing) {
      return Response.json({ error: `Quest already initialized. Status: ${existing.status}` }, { status: 400 });
    }

    // 2. Resolve user's raw Solana public key for token checks
    let rawWallet: string | null = null;
    if (isValidSolanaPublicKey(authId)) {
      rawWallet = authId;
    } else if (authId.startsWith("email-auth:")) {
      const { data: userData } = await supabase
        .from("users")
        .select("linked_wallet_address")
        .eq("wallet_address", hashedWallet)
        .single();
      
      if (userData && userData.linked_wallet_address) {
        rawWallet = userData.linked_wallet_address;
      }
    }

    // 3. Create the quest log
    const { data, error: insertErr } = await supabase
      .from("user_quests")
      .insert({
        wallet_address: hashedWallet,
        raw_wallet: rawWallet,
        type,
        target_id: targetId,
        status: "active"
      })
      .select()
      .single();

    if (insertErr) throw new Error(insertErr.message);

    return Response.json({ success: true, quest: data });
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
