export const dynamic = "force-dynamic";

export async function GET() {
  const configured = Boolean(process.env.JUPITER_API_KEY?.trim());
  return Response.json({
    available: configured,
    provider: "Jupiter Swap V2",
    mode: "ORDER + EXECUTE",
    network: "Solana Mainnet",
    referralConfigured: Boolean(process.env.JUPITER_REFERRAL_ACCOUNT?.trim()),
    reason: configured ? null : "JUPITER_API_KEY is not configured. $THREAT swap is disabled.",
  }, { headers: { "Cache-Control": "no-store" } });
}
