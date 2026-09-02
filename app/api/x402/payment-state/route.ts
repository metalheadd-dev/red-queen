import { getAssociatedTokenAddress } from "@solana/spl-token";
import { PublicKey } from "@solana/web3.js";
import { USDC_MINT } from "@/lib/jupiter";
import { SOLANA_MAINNET_CAIP2 } from "@/lib/onchain";
import { isValidSolanaPublicKey, withWorkingConnection } from "@/lib/solana";

export const dynamic = "force-dynamic";

type PaymentStateRequest = {
  wallet?: string;
  asset?: string;
  payTo?: string;
  network?: string;
  amount?: string;
};

export async function POST(request: Request) {
  let input: PaymentStateRequest;
  try {
    input = await request.json();
  } catch {
    return Response.json({ error: "A valid payment-state request is required." }, { status: 400 });
  }

  const wallet = input.wallet?.trim() || "";
  const asset = input.asset?.trim() || "";
  const payTo = input.payTo?.trim() || "";
  const network = input.network?.trim() || "";
  const amount = input.amount?.trim() || "";

  if (!isValidSolanaPublicKey(wallet) || !isValidSolanaPublicKey(payTo)) {
    return Response.json({ error: "Valid payer and recipient addresses are required." }, { status: 400 });
  }
  if (network !== SOLANA_MAINNET_CAIP2 || asset !== USDC_MINT) {
    return Response.json({ error: "Only canonical USDC on Solana mainnet is supported." }, { status: 400 });
  }
  if (!/^\d+$/.test(amount) || BigInt(amount) <= BigInt(0)) {
    return Response.json({ error: "A valid exact payment amount is required." }, { status: 400 });
  }

  const owner = new PublicKey(wallet);
  const mint = new PublicKey(asset);
  const recipient = new PublicKey(payTo);

  try {
    const { result } = await withWorkingConnection(async (connection) => {
      const [lamports, accounts, mintInfo, latestBlockhash] = await Promise.all([
        connection.getBalance(owner, "confirmed"),
        connection.getParsedTokenAccountsByOwner(owner, { mint }, "confirmed"),
        connection.getParsedAccountInfo(mint, "confirmed"),
        connection.getLatestBlockhash("confirmed"),
      ]);
      return { lamports, accounts: accounts.value, mintInfo, latestBlockhash };
    }, false, 8_000);

    const spendableAccounts = result.accounts
      .map((account) => ({
        publicKey: account.pubkey.toBase58(),
        amount: BigInt((account.account.data as any)?.parsed?.info?.tokenAmount?.amount || "0"),
      }))
      .sort((left, right) => left.amount === right.amount ? 0 : left.amount > right.amount ? -1 : 1);
    const source = spendableAccounts.find((account) => account.amount >= BigInt(amount)) || spendableAccounts[0];
    const parsedMint = result.mintInfo.value?.data;
    const decimals = parsedMint && typeof parsedMint === "object" && "parsed" in parsedMint
      ? Number((parsedMint as any).parsed?.info?.decimals ?? 6)
      : 6;
    const destinationAccount = await getAssociatedTokenAddress(mint, recipient);

    return Response.json({
      network,
      asset,
      lamports: result.lamports,
      sourceAccount: source?.publicKey || null,
      tokenAmount: source?.amount.toString() || "0",
      destinationAccount: destinationAccount.toBase58(),
      decimals,
      blockhash: result.latestBlockhash.blockhash,
      lastValidBlockHeight: result.latestBlockhash.lastValidBlockHeight,
    }, { headers: { "Cache-Control": "no-store" } });
  } catch (error) {
    console.error("x402 payment-state RPC check failed:", error);
    return Response.json({
      error: "Solana RPC is temporarily unavailable. No payment was prepared.",
    }, { status: 503, headers: { "Cache-Control": "no-store" } });
  }
}
