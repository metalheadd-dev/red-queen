import { PublicKey } from "@solana/web3.js";
import { supabase } from "@/lib/supabase";
import { getAuthIdentifier, checkAdmin } from "@/lib/auth-helpers";
import { getHashedWallet } from "@/lib/crypto";
import { isValidSolanaPublicKey } from "@/lib/solana";
import { readThreatBalance, SOLANA_CLUSTER } from "@/lib/onchain";
import { THREAT_TOKEN_MINT, getThreatClearance } from "@/lib/threat-token";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  const body = await request.json().catch(() => ({}));
  const customWallet = typeof body.custom_wallet === "string" ? body.custom_wallet.trim() : "";
  const authIdentifier = await getAuthIdentifier(request);

  if (!authIdentifier) {
    return Response.json({ error: "A verified account session is required." }, { status: 401 });
  }
  if (!supabase) {
    return Response.json({ error: "Profile storage is not configured." }, { status: 500 });
  }

  const isAdmin = customWallet ? await checkAdmin(request) : false;
  if (customWallet && !isAdmin) {
    return Response.json({ error: "Admin authorization is required for a custom wallet scan." }, { status: 403 });
  }

  const targetIdentifier = isAdmin && customWallet ? customWallet : authIdentifier;
  const hashedIdentifier = getHashedWallet(targetIdentifier);
  const { data: profile, error: profileError } = await supabase
    .from("users")
    .select("wallet_address, linked_wallet_address")
    .eq("wallet_address", hashedIdentifier)
    .maybeSingle();

  if (profileError) {
    return Response.json({ error: profileError.message }, { status: 500 });
  }

  const rawWallet = targetIdentifier.startsWith("email-auth:")
    ? profile?.linked_wallet_address || ""
    : targetIdentifier;

  if (!isValidSolanaPublicKey(rawWallet)) {
    return Response.json(
      { error: "No verified Solana wallet is linked to this account." },
      { status: 400 },
    );
  }

  let tokenBalance: number;
  try {
    tokenBalance = await readThreatBalance(new PublicKey(rawWallet));
  } catch (error) {
    console.error("$THREAT verification RPC failure:", error);
    return Response.json(
      { error: "Solana RPC is temporarily unavailable. Cached holdings were not accepted." },
      { status: 503 },
    );
  }

  const clearance = getThreatClearance(tokenBalance);
  const verifiedAt = new Date().toISOString();
  const verificationRecord = {
      wallet_address: hashedIdentifier,
      verified_balance: tokenBalance,
      holder_tier: clearance.tier,
      holder_status: clearance.name,
      last_verification: verifiedAt,
  };
  const verificationQuery = profile
    ? supabase.from("users").update(verificationRecord).eq("wallet_address", hashedIdentifier)
    : supabase.from("users").upsert(verificationRecord, { onConflict: "wallet_address" });
  const { error: updateError } = await verificationQuery;

  if (updateError) {
    return Response.json({ error: updateError.message }, { status: 500 });
  }

  return Response.json({
    success: true,
    wallet: rawWallet,
    network: SOLANA_CLUSTER,
    mint: THREAT_TOKEN_MINT,
    verified_at: verifiedAt,
    verified_balance: tokenBalance,
    holder_tier: clearance.tier,
    holder_status: clearance.name,
    clearance_level: clearance.level,
    response_depth: clearance.responseDepth,
    context_messages: clearance.contextMessages,
    signal_watch_slots: clearance.signalWatchSlots,
    comparison_signals: clearance.comparisonSignals,
    earned_xp_multiplier: clearance.earnedXpMultiplier,
    source: "SOLANA_RPC",
    cached: false,
  });
}
