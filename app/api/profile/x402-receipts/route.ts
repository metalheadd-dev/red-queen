import { getAuthIdentifier } from "@/lib/auth-helpers";
import { isValidSolanaPublicKey } from "@/lib/solana";
import { listX402ReceiptsForPayer } from "@/lib/x402-operations";

export const dynamic = "force-dynamic";

export async function GET(request: Request) {
  const identity = await getAuthIdentifier(request);
  if (!identity) {
    return Response.json({ error: "A verified session is required." }, { status: 401 });
  }
  if (!isValidSolanaPublicKey(identity)) {
    return Response.json({
      receipts: [],
      walletSessionRequired: true,
      message: "Sign in with the paying Solana wallet to view its private RED QUEEN receipt history.",
    });
  }

  try {
    const receipts = await listX402ReceiptsForPayer(identity);
    return Response.json({ receipts, walletSessionRequired: false }, {
      headers: { "Cache-Control": "private, no-store" },
    });
  } catch (error) {
    return Response.json({
      error: error instanceof Error ? error.message : "x402 receipt history is unavailable.",
    }, { status: 503 });
  }
}
