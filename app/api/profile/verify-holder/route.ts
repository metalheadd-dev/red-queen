import { supabase } from "@/lib/supabase";
import { getAuthIdentifier, checkAdmin } from "@/lib/auth-helpers";
import { getHashedWallet } from "@/lib/crypto";
import { Connection, PublicKey } from "@solana/web3.js";
import { getAssociatedTokenAddress } from "@solana/spl-token";
import { THREAT_TOKEN_MINT, getThreatClearance } from "@/lib/threat-token";

export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  // Parse request body for fallback params
  const body = await req.json().catch(() => ({}));
  const customWallet = body.custom_wallet;
  // Get active session
  const authIdentifier = await getAuthIdentifier(req);
  if (!authIdentifier) {
    return Response.json({ error: "Unauthorized session" }, { status: 401 });
  }
  if (!supabase) return Response.json({ error: "DB not configured" }, { status: 500 });

  const isAdmin = await checkAdmin(req);
  const targetIdentifier = (isAdmin && customWallet) ? customWallet : authIdentifier;
  const hashedWallet = getHashedWallet(targetIdentifier);

  try {
    // 1. Fetch player details to get linked wallet if email-auth is active
    const { data: userProfile, error: fetchErr } = await supabase
      .from("users")
      .select("*")
      .eq("wallet_address", hashedWallet)
      .single();

    if (fetchErr || !userProfile) {
      return Response.json({ error: "Profile not found" }, { status: 404 });
    }

    // Determine raw public key to query on Solana
    let rawWallet = "";
    if (targetIdentifier.startsWith("email-auth:")) {
      rawWallet = userProfile.linked_wallet_address || "";
    } else {
      rawWallet = targetIdentifier;
    }

    let tokenBalance = 0;
    let errorLog = null;

    if (rawWallet) {
      try {
        const rpcUrl = process.env.SOLANA_RPC_URL || "https://solana-rpc.publicnode.com";
        const connection = new Connection(rpcUrl, "confirmed");
        const walletPubkey = new PublicKey(rawWallet);
        const mintPubkey = new PublicKey(THREAT_TOKEN_MINT);
        const ata = await getAssociatedTokenAddress(mintPubkey, walletPubkey);
        
        const balanceResponse = await connection.getTokenAccountBalance(ata);
        tokenBalance = balanceResponse.value.uiAmount || 0;
      } catch (e: any) {
        console.warn("Solana token query failed. Falling back to 0 or cached:", e);
        errorLog = e.message || String(e);
        // Default to cached balance if query fails to avoid lockouts during RPC downtime
        tokenBalance = Number(userProfile.verified_balance || 0);
      }
    }

    // 2. Map verified balance to Tier benefits
    const clearance = getThreatClearance(tokenBalance);

    // 3. Determine if they unlock access via holdings
    let newAccessType = userProfile.access_type || "None";
    if (newAccessType !== "Invite" && newAccessType !== "Admin") {
      if (clearance.tier >= 2) {
        newAccessType = "Holder";
      } else {
        if (newAccessType === "Holder") {
          newAccessType = "None";
        }
      }
    }

    // 4. Update operative records in Supabase
    const { data: updatedUser, error: updateErr } = await supabase
      .from("users")
      .update({
        verified_balance: tokenBalance,
        holder_tier: clearance.tier,
        holder_status: clearance.name,
        last_verification: new Date().toISOString(),
        access_type: newAccessType
      })
      .eq("wallet_address", hashedWallet)
      .select()
      .single();

    if (updateErr) {
      return Response.json({ error: updateErr.message }, { status: 500 });
    }

    return Response.json({
      success: true,
      verified_balance: tokenBalance,
      holder_tier: clearance.tier,
      holder_status: clearance.name,
      clearance_level: clearance.level,
      response_depth: clearance.responseDepth,
      readiness_multiplier: clearance.readinessMultiplier,
      access_type: newAccessType,
      errorLog
    });
  } catch (err: any) {
    console.error("Holder verification handler failed:", err);
    return Response.json({ error: err.message || "Internal error" }, { status: 500 });
  }
}
