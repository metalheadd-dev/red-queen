import { NextRequest, NextResponse } from "next/server";
import { Connection, PublicKey } from "@solana/web3.js";
import { SolanaSDK } from "8004-solana";
import {
  getRedQueenAgentRuntime,
  RED_QUEEN_AGENT_REGISTRY_PROGRAM,
} from "@/lib/agent-registry";
import { MAINNET_RPC_URLS, isValidSolanaPublicKey } from "@/lib/solana";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const WALLET_MESSAGE_PREFIX = Buffer.from("8004_WALLET_SET:");
const WALLET_MESSAGE_TTL_SECONDS = 180;

function getRpcUrl() {
  return process.env.SOLANA_RPC_URL?.trim()
    || process.env.NEXT_PUBLIC_SOLANA_RPC_URL?.trim()
    || MAINNET_RPC_URLS[0];
}

function getSdk() {
  return new SolanaSDK({
    cluster: "mainnet-beta",
    rpcUrl: getRpcUrl(),
    useIndexer: true,
    indexerFallback: true,
  });
}

function noStore(data: Record<string, unknown>, status = 200) {
  return NextResponse.json(data, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
}

function buildWalletMessage(asset: PublicKey, wallet: PublicKey, owner: PublicKey, deadline: bigint) {
  const deadlineBytes = Buffer.alloc(8);
  deadlineBytes.writeBigUInt64LE(deadline);
  return Buffer.concat([
    WALLET_MESSAGE_PREFIX,
    asset.toBuffer(),
    wallet.toBuffer(),
    owner.toBuffer(),
    deadlineBytes,
  ]);
}

async function loadVerifiedAgent() {
  const runtime = getRedQueenAgentRuntime();
  if (!runtime.registered || !isValidSolanaPublicKey(runtime.asset)) {
    throw new Error("RED QUEEN Agent Asset is not configured.");
  }

  const asset = new PublicKey(runtime.asset);
  const account = await getSdk().loadAgent(asset);
  if (!account) throw new Error("RED QUEEN Agent Asset was not found on Solana mainnet.");
  if (account.getOwnerPublicKey().toBase58() !== runtime.owner || account.agent_uri !== runtime.metadataUri) {
    throw new Error("On-chain owner or metadata URI does not match the approved RED QUEEN identity.");
  }

  return { runtime, asset, account };
}

async function getValidatorTime(connection: Connection) {
  const slot = await connection.getSlot("confirmed");
  const blockTime = await connection.getBlockTime(slot);
  if (!blockTime) throw new Error("Validator clock is unavailable.");
  return blockTime;
}

export async function GET() {
  try {
    const { runtime, account } = await loadVerifiedAgent();
    const wallet = account.getAgentWalletPublicKey()?.toBase58() || "";
    return noStore({
      success: true,
      registered: true,
      bound: Boolean(wallet),
      matchesProjectWallet: wallet === runtime.owner,
      asset: runtime.asset,
      owner: runtime.owner,
      wallet,
      program: RED_QUEEN_AGENT_REGISTRY_PROGRAM,
      explorerUrl: `https://explorer.solana.com/address/${runtime.asset}`,
    });
  } catch (error) {
    return noStore({
      success: false,
      error: error instanceof Error ? error.message : "Agent wallet status is unavailable.",
    }, 503);
  }
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => ({})) as Record<string, unknown>;
  const owner = typeof body.owner === "string" ? body.owner.trim() : "";
  const wallet = typeof body.wallet === "string" ? body.wallet.trim() : "";

  try {
    const { runtime, asset, account } = await loadVerifiedAgent();
    if (owner !== runtime.owner || wallet !== runtime.owner) {
      return noStore({
        success: false,
        error: "This release only allows the configured RED QUEEN owner wallet to become the operational wallet.",
      }, 403);
    }

    const existingWallet = account.getAgentWalletPublicKey()?.toBase58() || "";
    if (existingWallet === wallet) {
      return noStore({ success: true, alreadyBound: true, wallet, asset: runtime.asset });
    }
    if (existingWallet && existingWallet !== wallet) {
      return noStore({ success: false, error: "A different operational wallet is already bound. No replacement was prepared." }, 409);
    }

    const connection = new Connection(getRpcUrl(), "confirmed");
    const validatorTime = await getValidatorTime(connection);
    const deadline = BigInt(validatorTime + WALLET_MESSAGE_TTL_SECONDS);
    const message = buildWalletMessage(asset, new PublicKey(wallet), new PublicKey(owner), deadline);

    return noStore({
      success: true,
      message: message.toString("base64"),
      deadline: deadline.toString(),
      asset: runtime.asset,
      owner,
      wallet,
      program: RED_QUEEN_AGENT_REGISTRY_PROGRAM,
      network: "SOLANA MAINNET",
    });
  } catch (error) {
    console.error("Agent wallet message preparation failed:", error);
    return noStore({ success: false, error: "Agent wallet preflight failed. No signature was requested." }, 503);
  }
}

export async function PUT(request: NextRequest) {
  const body = await request.json().catch(() => ({})) as Record<string, unknown>;
  const owner = typeof body.owner === "string" ? body.owner.trim() : "";
  const wallet = typeof body.wallet === "string" ? body.wallet.trim() : "";
  const deadlineText = typeof body.deadline === "string" ? body.deadline.trim() : "";
  const signatureText = typeof body.signature === "string" ? body.signature.trim() : "";

  try {
    const { runtime, asset, account } = await loadVerifiedAgent();
    if (owner !== runtime.owner || wallet !== runtime.owner) {
      return noStore({ success: false, error: "Only the configured RED QUEEN owner wallet can bind this identity." }, 403);
    }
    if (!/^\d+$/.test(deadlineText)) {
      return noStore({ success: false, error: "A valid message deadline is required." }, 400);
    }

    const deadline = BigInt(deadlineText);
    const signature = Buffer.from(signatureText, "base64");
    if (signature.length !== 64) {
      return noStore({ success: false, error: "The operational wallet message signature must be exactly 64 bytes." }, 400);
    }

    const connection = new Connection(getRpcUrl(), "confirmed");
    const validatorTime = await getValidatorTime(connection);
    if (deadline <= BigInt(validatorTime) || deadline > BigInt(validatorTime + 300)) {
      return noStore({ success: false, error: "The signed binding message expired or exceeded the 8004 five-minute safety window." }, 409);
    }

    const existingWallet = account.getAgentWalletPublicKey()?.toBase58() || "";
    if (existingWallet === wallet) {
      return noStore({ success: true, alreadyBound: true, wallet, asset: runtime.asset });
    }
    if (existingWallet) {
      return noStore({ success: false, error: "A different operational wallet is already bound. No replacement was prepared." }, 409);
    }

    const prepared = await getSdk().setAgentWallet(
      asset,
      new PublicKey(wallet),
      new Uint8Array(signature),
      deadline,
      {
        skipSend: true,
        signer: new PublicKey(owner),
        feePayer: new PublicKey(owner),
      },
    );

    if (!("transaction" in prepared)) {
      return noStore({ success: false, error: prepared.error || "The 8004 SDK did not prepare a binding transaction." }, 503);
    }

    return noStore({
      success: true,
      transaction: prepared.transaction,
      blockhash: prepared.blockhash,
      lastValidBlockHeight: prepared.lastValidBlockHeight,
      signer: prepared.signer,
      feePayer: prepared.feePayer,
      requiredSigners: prepared.requiredSigners,
      deadline: deadline.toString(),
      asset: runtime.asset,
      owner,
      wallet,
      program: RED_QUEEN_AGENT_REGISTRY_PROGRAM,
      network: "SOLANA MAINNET",
    });
  } catch (error) {
    console.error("Agent wallet transaction preparation failed:", error);
    return noStore({ success: false, error: "The signed message could not be converted into a safe 8004 transaction." }, 503);
  }
}

export async function PATCH(request: NextRequest) {
  const body = await request.json().catch(() => ({})) as Record<string, unknown>;
  const signature = typeof body.signature === "string" ? body.signature.trim() : "";
  if (signature.length < 64) {
    return noStore({ success: false, error: "A valid Solana transaction signature is required." }, 400);
  }

  try {
    const connection = new Connection(getRpcUrl(), "confirmed");
    const statuses = await connection.getSignatureStatuses([signature], { searchTransactionHistory: true });
    const status = statuses.value[0];
    if (!status || status.err || !status.confirmationStatus || status.confirmationStatus === "processed") {
      return noStore({ success: false, error: "The binding transaction is not confirmed on Solana mainnet." }, 409);
    }

    const { runtime, account } = await loadVerifiedAgent();
    const wallet = account.getAgentWalletPublicKey()?.toBase58() || "";
    if (wallet !== runtime.owner) {
      return noStore({ success: false, error: "Confirmed state does not bind the approved RED QUEEN operational wallet." }, 409);
    }

    return noStore({
      success: true,
      verified: true,
      asset: runtime.asset,
      owner: runtime.owner,
      wallet,
      signature,
      explorerUrl: `https://explorer.solana.com/tx/${signature}`,
    });
  } catch (error) {
    console.error("Agent wallet verification failed:", error);
    return noStore({ success: false, error: "Operational wallet binding could not be verified from mainnet state." }, 503);
  }
}
