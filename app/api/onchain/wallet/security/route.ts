import { isValidSolanaPublicKey } from "@/lib/solana";
import { readWalletSecuritySnapshot } from "@/lib/onchain";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const address = new URL(request.url).searchParams.get("address")?.trim() || "";
  if (!isValidSolanaPublicKey(address)) {
    return Response.json({ error: "A valid Solana public address is required." }, { status: 400 });
  }

  try {
    const snapshot = await readWalletSecuritySnapshot(address);
    return Response.json({
      ...snapshot,
      lockdownEnabled: process.env.WALLET_LOCKDOWN_ENABLED === "true",
    }, {
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch (error) {
    console.error("Wallet security scan failed:", error);
    return Response.json(
      { error: "Solana token-authority data is temporarily unavailable. No cached safety claim was used." },
      { status: 503 },
    );
  }
}
