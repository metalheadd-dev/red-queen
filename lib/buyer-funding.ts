import "server-only";

import { PublicKey } from "@solana/web3.js";
import { getAssociatedTokenAddressSync, TOKEN_PROGRAM_ID } from "@solana/spl-token";
import { getSolanaRpcUrls } from "@/lib/solana";

const USDC_MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v";

export async function checkBuyerFunding(buyerAddress: string) {
  const account = getAssociatedTokenAddressSync(new PublicKey(USDC_MINT), new PublicKey(buyerAddress)).toBase58();
  // Check the same canonical token account used by the x402 SVM client.
  for (const rpcUrl of getSolanaRpcUrls().slice(0, 3)) {
    try {
      const rpc = async (method: string, params: unknown[] = []) => {
        const response = await fetch(rpcUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
          cache: "no-store",
          redirect: "error",
          signal: AbortSignal.timeout(4_000),
        });
        if (!response.ok) throw new Error("RPC unavailable");
        const payload = await response.json();
        if (payload.error || !("result" in payload)) throw new Error("RPC rejected lookup");
        return payload.result;
      };
      const [genesis, accountInfo] = await Promise.all([
        rpc("getGenesisHash"),
        rpc("getAccountInfo", [account, { encoding: "jsonParsed", commitment: "confirmed" }]),
      ]);
      if (typeof genesis !== "string" || !genesis.startsWith("5eykt4UsFv8P8NJdTREpY1vzqKqZKvdp")) continue;
      if (!accountInfo || !("value" in accountInfo)) continue;
      const value = accountInfo.value;
      const info = value?.data?.parsed?.info;
      if (value && (value.owner !== TOKEN_PROGRAM_ID.toBase58() || info?.mint !== USDC_MINT || info?.owner !== buyerAddress)) continue;
      const amount = value === null ? "0" : info?.tokenAmount?.amount;
      if (typeof amount !== "string" || !/^\d+$/.test(amount)) continue;
      const ready = BigInt(amount) >= BigInt(30_000) && (value === null || info.state === "initialized");
      return {
        ready,
        reason: ready ? null : "Queen's data-buying wallet needs at least 0.03 spendable USDC. Your wallet has not been charged.",
      };
    } catch {
      // Do not expose RPC URLs: configured URLs may contain provider credentials.
    }
  }
  return { ready: false, reason: "Queen's data-buying balance could not be verified. Please retry; no payment was requested." };
}
