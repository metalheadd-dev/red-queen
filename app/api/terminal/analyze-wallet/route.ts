import { readOnchainWalletSnapshot } from "@/lib/onchain";
import { isValidSolanaPublicKey } from "@/lib/solana";

export const dynamic = "force-dynamic";

const VECTOR_GUIDANCE: Record<string, { title: string; actions: string[] }> = {
  "WALLET-TRAIL": {
    title: "PUBLIC TRANSACTION EXPOSURE",
    actions: [
      "Separate public receiving activity from long-term storage and high-value signing authority.",
      "Review token approvals and recent transactions in a trusted explorer before signing again.",
      "Do not reuse a public wallet as proof of identity across unrelated Web2 services.",
    ],
  },
  "AI-PROFILING": {
    title: "WALLET-TO-IDENTITY CORRELATION",
    actions: [
      "Avoid posting the same public address beside personal email, phone, or location data.",
      "Use separate browser profiles for high-trust accounts and experimental dApps.",
      "Treat wallet signatures as durable identity signals even when no transaction is sent.",
    ],
  },
  "FEED-MANIP": {
    title: "SOCIAL SIGNAL MANIPULATION",
    actions: [
      "Verify token, airdrop, and emergency claims through the project's canonical channels.",
      "Never sign from an embedded social link before inspecting the domain and transaction simulation.",
      "Use a time delay for urgent financial claims designed to provoke immediate action.",
    ],
  },
  "DEEPFAKE-SE": {
    title: "IMPERSONATION RESILIENCE",
    actions: [
      "Establish an offline family or team verification phrase for urgent requests.",
      "Confirm wallet or fund requests over a second channel before acting.",
      "Hardware-wallet screens and transaction simulation take priority over voice or video instructions.",
    ],
  },
  "REPUTATION-X": {
    title: "COUNTERPARTY AND CONTRACT RISK",
    actions: [
      "Check the exact program, mint, amount, and destination before approving a transaction.",
      "Use a low-value sandbox wallet for unaudited programs and unfamiliar token claims.",
      "Consult a qualified compliance provider for sanctions or AML screening; RED QUEEN does not query one here.",
    ],
  },
  "META-LEAK": {
    title: "WEB2 / WEB3 METADATA SEPARATION",
    actions: [
      "Do not store seed phrases, private keys, or recovery screenshots in cloud notes or AI chats.",
      "Clear dormant wallet connections and revoke unnecessary site permissions.",
      "Keep exact location and personal recovery details outside wallet-linked browser sessions.",
    ],
  },
};

export async function POST(request: Request) {
  const { searchParams } = new URL(request.url);
  const vector = searchParams.get("vector") || "WALLET-TRAIL";
  const wallet = searchParams.get("wallet")?.trim() || "";
  const guidance = VECTOR_GUIDANCE[vector];

  if (!guidance) {
    return Response.json({ error: "Unsupported diagnostic vector." }, { status: 400 });
  }
  if (!isValidSolanaPublicKey(wallet)) {
    return Response.json({ error: "A valid public Solana address is required." }, { status: 400 });
  }

  try {
    const snapshot = await readOnchainWalletSnapshot(wallet);
    const masked = `${wallet.slice(0, 8)}…${wallet.slice(-8)}`;
    const report = `[RED QUEEN // EVIDENCE-BOUNDED WALLET TRIAGE]
TIMESTAMP: ${snapshot.updatedAt}
VECTOR: ${guidance.title}
TARGET: ${masked}
NETWORK: SOLANA MAINNET · ${snapshot.commitment.toUpperCase()}

OBSERVED ON-CHAIN FACTS
- SOL BALANCE: ${snapshot.solBalance.toFixed(4)} SOL
- $THREAT BALANCE: ${snapshot.threat.balance.toLocaleString()} across ${snapshot.threat.tokenAccounts} token account(s)
- $THREAT PROGRAM: ${snapshot.threat.program}
- OBSERVED SLOT: ${snapshot.slot}
- TRANSACTION REQUESTED: NO

ASSESSMENT LIMIT
RED QUEEN did not query private identity data, IP logs, exchange attribution, sanctions vendors, TRM, Chainalysis, Elliptic, or data-broker databases. No claim about identity, geography, AML status, or wallet reputation is made from this scan.

SAFE ACTIONS
${guidance.actions.map((action, index) => `${index + 1}. ${action}`).join("\n")}

NEXT ACTION
Review the connected address in a trusted Solana explorer and verify every active wallet connection before signing a new request.`;

    return Response.json({
      report,
      evidence: snapshot,
      grounding: "SOLANA_RPC",
      limitations: ["NO_PRIVATE_DATA", "NO_AML_VENDOR", "NO_GEOLOCATION", "NO_IDENTITY_INFERENCE"],
    });
  } catch (error) {
    console.error("Wallet triage RPC failure:", error);
    return Response.json({ error: "Solana RPC is temporarily unavailable. No synthetic report was generated." }, { status: 503 });
  }
}
