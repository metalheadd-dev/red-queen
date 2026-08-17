import { isValidSolanaPublicKey } from "@/lib/solana";
import { readOnchainWalletSnapshot } from "@/lib/onchain";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const address = new URL(request.url).searchParams.get("address")?.trim() || "";
  if (!isValidSolanaPublicKey(address)) {
    return Response.json({ error: "A valid Solana public address is required." }, { status: 400 });
  }

  try {
    const snapshot = await readOnchainWalletSnapshot(address);
    return Response.json(snapshot, {
      headers: {
        "Cache-Control": "public, max-age=10, stale-while-revalidate=30",
      },
    });
  } catch (error) {
    console.error("On-chain wallet snapshot failed:", error);
    return Response.json(
      { error: "Solana RPC is temporarily unavailable. No cached balance was used." },
      { status: 503 },
    );
  }
}
