import { getAuthIdentifier } from "@/lib/auth-helpers";
import { getHashedWallet } from "@/lib/crypto";
import { prepareDelegateRevocation } from "@/lib/onchain";
import { isValidSolanaPublicKey } from "@/lib/solana";
import { supabase } from "@/lib/supabase";

export const dynamic = "force-dynamic";

export async function POST(request: Request) {
  if (process.env.WALLET_LOCKDOWN_ENABLED !== "true") {
    return Response.json({ error: "Wallet Lockdown transaction preparation is not enabled in this environment." }, { status: 503 });
  }
  const authIdentifier = await getAuthIdentifier(request);
  if (!authIdentifier) {
    return Response.json({ error: "A verified wallet session is required before preparing a transaction." }, { status: 401 });
  }
  if (!supabase) {
    return Response.json({ error: "Profile storage is unavailable." }, { status: 503 });
  }

  const body = await request.json().catch(() => ({}));
  const tokenAccounts = Array.isArray(body.tokenAccounts)
    ? body.tokenAccounts.filter((value: unknown): value is string => typeof value === "string" && isValidSolanaPublicKey(value)).slice(0, 8)
    : [];
  if (tokenAccounts.length === 0) {
    return Response.json({ error: "Select at least one valid delegated token account." }, { status: 400 });
  }

  const { data: profile, error: profileError } = await supabase
    .from("users")
    .select("linked_wallet_address")
    .eq("wallet_address", getHashedWallet(authIdentifier))
    .maybeSingle();
  if (profileError) {
    return Response.json({ error: "Wallet ownership could not be verified." }, { status: 503 });
  }
  const wallet = authIdentifier.startsWith("email-auth:")
    ? profile?.linked_wallet_address || ""
    : authIdentifier;
  if (!isValidSolanaPublicKey(wallet)) {
    return Response.json({ error: "Sign in with the wallet being protected before preparing a revocation." }, { status: 403 });
  }

  try {
    const prepared = await prepareDelegateRevocation(wallet, tokenAccounts);
    if (!prepared.simulation.ok) {
      return Response.json({
        error: "The unsigned revocation transaction failed simulation and will not be offered for signing.",
        simulation: prepared.simulation,
      }, { status: 409 });
    }
    return Response.json(prepared, { headers: { "Cache-Control": "private, no-store" } });
  } catch (error) {
    return Response.json({
      error: error instanceof Error ? error.message : "Delegate revocation could not be prepared.",
    }, { status: 400 });
  }
}
