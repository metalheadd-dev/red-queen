import { NextRequest, NextResponse } from "next/server";
import { withFriendlyX402 } from "@/lib/x402";
import { readWalletSecuritySnapshot } from "@/lib/onchain";
import { isValidSolanaPublicKey } from "@/lib/solana";

const svmAddress = process.env.SVM_ADDRESS || "";
const network = (process.env.SVM_NETWORK || "solana:5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp") as any;

const handler = async (request: NextRequest) => {
  const address = request.nextUrl.searchParams.get("address")?.trim() || "";
  if (!isValidSolanaPublicKey(address)) {
    return NextResponse.json({ success: false, error: "A valid Solana public address is required." }, { status: 400 });
  }

  try {
    const snapshot = await readWalletSecuritySnapshot(address);
    const maskedAddress = `${address.slice(0, 8)}…${address.slice(-8)}`;
    return NextResponse.json({
      success: true,
      timestamp: snapshot.updatedAt,
      clearance: "PAID OUTPUT // x402 SETTLED",
      audit: {
        wallet: maskedAddress,
        network: "Solana Mainnet",
        observedSlot: snapshot.slot,
        status: snapshot.status,
        headline: snapshot.summary.activeDelegates > 0
          ? `${snapshot.summary.activeDelegates} active token delegate approval${snapshot.summary.activeDelegates === 1 ? " requires" : "s require"} review.`
          : "No active positive-balance token delegates were observed.",
        surface: snapshot.summary,
        delegates: snapshot.delegates,
        frozenAccounts: snapshot.frozenAccounts,
        externalCloseAuthorities: snapshot.externalCloseAuthorities,
        assessment: snapshot.guidance,
        nextAction: snapshot.summary.activeDelegates > 0
          ? "Open Wallet Lockdown, verify each mint, token account, delegate and approved amount, then simulate only the revocations you understand."
          : snapshot.summary.emptyAccounts > 0
            ? "Review empty token accounts in a trusted wallet. Closing eligible accounts may reclaim rent, but RED QUEEN does not prepare that transaction in this release."
            : "No authority change is justified by this snapshot. Continue verifying every transaction simulation before signing.",
        trustBoundary: "This audit reads public RPC state only. It does not identify malware, infer wallet ownership, label a delegate as malicious, or request a signature.",
        limitations: snapshot.limitations,
      },
    });
  } catch (error) {
    console.error("Paid wallet exposure audit failed:", error);
    return NextResponse.json({
      success: false,
      error: "Required Solana authority data is unavailable. No synthetic wallet audit was delivered.",
      syntheticData: false,
    }, { status: 503 });
  }
};

export const GET = withFriendlyX402(handler, {
  productId: "wallet-exposure-audit",
  preflight: async (request: NextRequest) => isValidSolanaPublicKey(request.nextUrl.searchParams.get("address")?.trim())
    ? null
    : NextResponse.json({ error: "A valid Solana public address is required. No payment was requested." }, { status: 400 }),
  accepts: {
    scheme: "exact",
    price: "$0.02",
    network,
    payTo: svmAddress,
  },
  description: "Evidence-bounded Solana token authority and delegate exposure audit.",
  mimeType: "application/json",
  serviceName: "RED QUEEN Intelligence",
  tags: ["solana", "wallet-security", "delegates", "x402"],
  iconUrl: "https://redqueen.space/token-image.png",
});
