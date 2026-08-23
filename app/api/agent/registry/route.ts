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

export async function POST(request: NextRequest) {
  const runtime = getRedQueenAgentRuntime();
  if (runtime.registered) {
    return noStore({
      success: false,
      error: "RED QUEEN already has a configured Agent Asset.",
      asset: runtime.asset,
    }, 409);
  }

  const body = await request.json().catch(() => ({})) as Record<string, unknown>;
  const owner = typeof body.owner === "string" ? body.owner.trim() : "";
  const asset = typeof body.asset === "string" ? body.asset.trim() : "";

  if (owner !== runtime.owner) {
    return noStore({ success: false, error: "Only the configured RED QUEEN project wallet can prepare this registration." }, 403);
  }
  if (!isValidSolanaPublicKey(asset)) {
    return noStore({ success: false, error: "A valid locally generated Agent Asset public key is required." }, 400);
  }

  try {
    const sdk = getSdk();
    const ownerKey = new PublicKey(owner);
    const existing = await sdk.getAgentsByOwner(ownerKey);
    const existingRedQueen = existing.find((agent) => agent.account.agent_uri === runtime.metadataUri);

    if (existingRedQueen) {
      return noStore({
        success: false,
        error: "An Agent Asset with the RED QUEEN metadata URI already exists for this owner. No duplicate transaction was prepared.",
        asset: existingRedQueen.account.getAssetPublicKey().toBase58(),
      }, 409);
    }

    const prepared = await sdk.registerAgent(runtime.metadataUri, {
      skipSend: true,
      signer: ownerKey,
      feePayer: ownerKey,
      assetPubkey: new PublicKey(asset),
      atomEnabled: false,
    });

    if (!("transaction" in prepared)) {
      return noStore({
        success: false,
        error: prepared.error || "The 8004 SDK did not prepare a registration transaction.",
      }, 503);
    }

    return noStore({
      success: true,
      transaction: prepared.transaction,
      blockhash: prepared.blockhash,
      lastValidBlockHeight: prepared.lastValidBlockHeight,
      signer: prepared.signer,
      feePayer: prepared.feePayer,
      requiredSigners: prepared.requiredSigners,
      asset: prepared.asset.toBase58(),
      owner,
      metadataUri: runtime.metadataUri,
      program: RED_QUEEN_AGENT_REGISTRY_PROGRAM,
      atomEnabled: false,
      network: "SOLANA MAINNET",
    });
  } catch (error) {
    console.error("Agent registration preparation failed:", error);
    return noStore({
      success: false,
      error: "Registry preflight could not verify mainnet state or prepare a transaction. No signature was requested.",
    }, 503);
  }
}

export async function PUT(request: NextRequest) {
  const runtime = getRedQueenAgentRuntime();
  const body = await request.json().catch(() => ({})) as Record<string, unknown>;
  const asset = typeof body.asset === "string" ? body.asset.trim() : "";
  const signature = typeof body.signature === "string" ? body.signature.trim() : "";

  if (!isValidSolanaPublicKey(asset) || signature.length < 64) {
    return noStore({ success: false, error: "A valid Agent Asset and transaction signature are required." }, 400);
  }

  try {
    const sdk = getSdk();
    const connection = new Connection(getRpcUrl(), "confirmed");
    const statuses = await connection.getSignatureStatuses([signature], { searchTransactionHistory: true });
    const status = statuses.value[0];
    if (!status || status.err || !status.confirmationStatus || status.confirmationStatus === "processed") {
      return noStore({ success: false, error: "The registration transaction is not confirmed on Solana mainnet." }, 409);
    }

    const account = await sdk.loadAgent(new PublicKey(asset));
    if (!account) {
      return noStore({ success: false, error: "The confirmed transaction did not resolve to an 8004 Agent Asset." }, 404);
    }

    const owner = account.getOwnerPublicKey().toBase58();
    const verified = owner === runtime.owner
      && account.agent_uri === runtime.metadataUri
      && !account.isAtomEnabled();

    if (!verified) {
      return noStore({ success: false, error: "On-chain owner, metadata URI, or ATOM state does not match the approved RED QUEEN package." }, 409);
    }

    return noStore({
      success: true,
      verified: true,
      asset,
      signature,
      owner,
      metadataUri: account.agent_uri,
      atomEnabled: account.isAtomEnabled(),
      explorerUrl: `https://explorer.solana.com/address/${asset}`,
      next: {
        RED_QUEEN_AGENT_ASSET: asset,
        RED_QUEEN_AGENT_REGISTRATION_TX: signature,
      },
    });
  } catch (error) {
    console.error("Agent registration verification failed:", error);
    return noStore({ success: false, error: "The registration could not be verified from confirmed mainnet state." }, 503);
  }
}
