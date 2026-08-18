import { NextRequest, NextResponse } from "next/server";
import { getAuthIdentifier } from "@/lib/auth-helpers";
import { getHashedWallet } from "@/lib/crypto";
import { THREAT_TOKEN_MINT } from "@/lib/threat-token";
import { getWorkingConnection, isValidSolanaPublicKey } from "@/lib/solana";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

const ACHIEVEMENT_ID = "ONCHAIN_INITIATE_V1";
const PROTOCOL_XP = 25;

function accountKeyValue(value: any) {
  if (typeof value === "string") return value;
  if (value?.pubkey?.toBase58) return value.pubkey.toBase58();
  if (value?.pubkey) return String(value.pubkey);
  if (value?.toBase58) return value.toBase58();
  return String(value || "");
}

export async function POST(request: NextRequest) {
  const identity = await getAuthIdentifier(request);
  if (!identity || !isValidSolanaPublicKey(identity)) {
    return NextResponse.json({ error: "Sign in with the same Solana wallet that completed the swap to claim the achievement." }, { status: 401 });
  }
  if (!supabase) return NextResponse.json({ error: "Achievement storage is not configured." }, { status: 503 });
  const body = await request.json().catch(() => ({})) as Record<string, unknown>;
  const signature = typeof body.signature === "string" ? body.signature.trim() : "";
  if (!/^[1-9A-HJ-NP-Za-km-z]{64,100}$/.test(signature)) return NextResponse.json({ error: "A valid Solana transaction signature is required." }, { status: 400 });

  const hashedWallet = getHashedWallet(identity);
  const { data: existing, error: existingError } = await supabase
    .from("onchain_achievements")
    .select("achievement_id, transaction_signature, protocol_xp, metadata, created_at")
    .eq("wallet_address", hashedWallet)
    .eq("achievement_id", ACHIEVEMENT_ID)
    .maybeSingle();
  if (existingError && (existingError.code === "42P01" || /onchain_achievements/i.test(existingError.message || ""))) {
    return NextResponse.json({ error: "On-chain achievement migration is not applied yet." }, { status: 503 });
  }
  if (existingError) return NextResponse.json({ error: "Achievement ledger is temporarily unavailable." }, { status: 503 });
  if (existing) return NextResponse.json({ success: true, alreadyClaimed: true, achievement: existing });

  try {
    const connection = await getWorkingConnection(false);
    const transaction = await connection.getParsedTransaction(signature, {
      commitment: "confirmed",
      maxSupportedTransactionVersion: 0,
    });
    if (!transaction || transaction.meta?.err) return NextResponse.json({ error: "The swap is not confirmed successfully on Solana Mainnet." }, { status: 422 });
    const signerPresent = transaction.transaction.message.accountKeys.some((entry: any) => (
      accountKeyValue(entry) === identity && entry?.signer === true
    ));
    if (!signerPresent) return NextResponse.json({ error: "The signed-in wallet is not a signer of this transaction." }, { status: 403 });

    const balanceFor = (balances: any[] | null | undefined) => (balances || [])
      .filter((balance) => balance.mint === THREAT_TOKEN_MINT && balance.owner === identity)
      .reduce((total, balance) => total + BigInt(balance.uiTokenAmount?.amount || "0"), BigInt(0));
    const before = balanceFor(transaction.meta?.preTokenBalances);
    const after = balanceFor(transaction.meta?.postTokenBalances);
    const delta = after - before;
    if (delta <= BigInt(0)) return NextResponse.json({ error: "This transaction did not increase the signed-in wallet's canonical $THREAT balance." }, { status: 422 });

    const { data, error } = await supabase.from("onchain_achievements").insert({
      wallet_address: hashedWallet,
      achievement_id: ACHIEVEMENT_ID,
      transaction_signature: signature,
      protocol_xp: PROTOCOL_XP,
      metadata: {
        mint: THREAT_TOKEN_MINT,
        rawThreatReceived: delta.toString(),
        slot: transaction.slot,
        blockTime: transaction.blockTime,
        rule: "ONE_TIME_CANONICAL_THREAT_ACQUISITION_PROOF",
        affectsBioScore: false,
        affectsSurvivalXp: false,
      },
    }).select("achievement_id, transaction_signature, protocol_xp, metadata, created_at").single();
    if (error) {
      if (error.code === "23505") return NextResponse.json({ error: "This achievement or transaction has already been claimed." }, { status: 409 });
      if (error.code === "42P01") return NextResponse.json({ error: "On-chain achievement migration is not applied yet." }, { status: 503 });
      throw error;
    }
    return NextResponse.json({
      success: true,
      alreadyClaimed: false,
      achievement: data,
      explanation: "+25 Protocol XP records first verified Solana participation. It does not change BIO-SCORE, readiness domains or survival leaderboard XP.",
    });
  } catch (error) {
    console.error("$THREAT swap achievement verification failed:", error);
    return NextResponse.json({ error: "The confirmed swap could not be verified against the canonical $THREAT mint." }, { status: 503 });
  }
}
