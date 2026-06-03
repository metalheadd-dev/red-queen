import { supabase } from "@/lib/supabase";
import { getHashedWallet } from "@/lib/crypto";

export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const wallet = searchParams.get("wallet");
  if (!wallet) return Response.json({ error: "wallet required" }, { status: 400 });
  if (!supabase) return Response.json({ error: "DB not configured" }, { status: 500 });

  // Security Check: Verify user owns the requested wallet profile if token is provided
  const authHeader = req.headers.get("Authorization");
  if (authHeader && authHeader.startsWith("Bearer ")) {
    const token = authHeader.split(" ")[1];
    const { data: { user }, error: authError } = await supabase.auth.getUser(token);
    if (!authError && user) {
      let authWallet = "";
      if (user.email) {
        authWallet = `email-auth:${user.id}`;
      } else {
        const web3Identity = user.identities?.find((id: any) => id.provider === "web3" || id.provider === "solana");
        authWallet = web3Identity?.identity_data?.sub || user.user_metadata?.wallet_address || "";
      }
      if (authWallet && authWallet !== wallet) {
        return Response.json({ error: "Access Denied: Wallet ownership mismatch" }, { status: 403 });
      }
    }
  }

  const hashedWallet = getHashedWallet(wallet);

  try {
    const { data, error } = await supabase
      .from("messages")
      .select("role, content, created_at")
      .eq("wallet_address", hashedWallet)
      .order("created_at", { ascending: true });

    if (error) {
      return Response.json({ error: error.message }, { status: 500 });
    }
    return Response.json({ history: data || [] });
  } catch (err: any) {
    return Response.json({ error: err.message }, { status: 500 });
  }
}
