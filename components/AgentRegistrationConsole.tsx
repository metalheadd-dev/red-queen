"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import {
  ComputeBudgetProgram,
  Keypair,
  LAMPORTS_PER_SOL,
  Transaction,
} from "@solana/web3.js";

const WalletMultiButton = dynamic(
  () => import("@solana/wallet-adapter-react-ui").then((module) => module.WalletMultiButton),
  { ssr: false },
);

type PreparedRegistration = {
  transaction: string;
  blockhash: string;
  lastValidBlockHeight: number;
  signer: string;
  feePayer?: string;
  requiredSigners?: string[];
  asset: string;
  owner: string;
  metadataUri: string;
  program: string;
  atomEnabled: false;
};

type VerifiedRegistration = {
  asset: string;
  signature: string;
  explorerUrl: string;
  next: {
    RED_QUEEN_AGENT_ASSET: string;
    RED_QUEEN_AGENT_REGISTRATION_TX: string;
  };
};

function compact(value: string) {
  return `${value.slice(0, 8)}…${value.slice(-8)}`;
}

function decodeBase64(value: string) {
  return Uint8Array.from(atob(value), (character) => character.charCodeAt(0));
}

function assertSafeTransaction(
  transaction: Transaction,
  prepared: PreparedRegistration,
  expectedOwner: string,
  expectedAsset: string,
  expectedMetadataUri: string,
  expectedProgram: string,
) {
  if (prepared.owner !== expectedOwner || prepared.signer !== expectedOwner || prepared.feePayer !== expectedOwner) {
    throw new Error("Registry preflight returned an unexpected signer or fee payer.");
  }
  if (prepared.asset !== expectedAsset || prepared.metadataUri !== expectedMetadataUri || prepared.program !== expectedProgram) {
    throw new Error("Registry preflight returned unexpected identity parameters.");
  }
  if (prepared.atomEnabled !== false) {
    throw new Error("ATOM must remain disabled for the initial registration.");
  }
  if (transaction.feePayer?.toBase58() !== expectedOwner || transaction.recentBlockhash !== prepared.blockhash) {
    throw new Error("The serialized transaction does not match the approved fee payer or blockhash.");
  }

  const requiredSigners = new Set(transaction.signatures.map((item) => item.publicKey.toBase58()));
  if (!requiredSigners.has(expectedOwner) || !requiredSigners.has(expectedAsset)) {
    throw new Error("The registration transaction is missing a required owner or Agent Asset signature.");
  }

  const allowedPrograms = new Set([
    expectedProgram,
    ComputeBudgetProgram.programId.toBase58(),
  ]);
  const unexpectedProgram = transaction.instructions.find(
    (instruction) => !allowedPrograms.has(instruction.programId.toBase58()),
  );
  if (unexpectedProgram) {
    throw new Error(`Unexpected instruction program: ${unexpectedProgram.programId.toBase58()}`);
  }
}

export default function AgentRegistrationConsole({
  owner,
  metadataUri,
  program,
}: {
  owner: string;
  metadataUri: string;
  program: string;
}) {
  const { connection } = useConnection();
  const { connected, publicKey, signTransaction } = useWallet();
  const [balance, setBalance] = useState<number | null>(null);
  const [accepted, setAccepted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("CONNECT THE PROJECT WALLET TO BEGIN PREFLIGHT");
  const [error, setError] = useState("");
  const [result, setResult] = useState<VerifiedRegistration | null>(null);
  const address = publicKey?.toBase58() || "";
  const isOwner = address === owner;
  const hasFeeBuffer = balance !== null && balance >= 0.02;
  const canRegister = connected && isOwner && hasFeeBuffer && accepted && Boolean(signTransaction) && !busy && !result;

  const balanceLabel = !connected || !isOwner
    ? "OWNER WALLET REQUIRED"
    : balance === null
      ? "READING SOL BALANCE"
      : `${balance.toLocaleString(undefined, { maximumFractionDigits: 4 })} SOL`;

  useEffect(() => {
    setAccepted(false);
    setResult(null);
    setError("");
    if (!address) {
      setBalance(null);
      setStatus("CONNECT THE PROJECT WALLET TO BEGIN PREFLIGHT");
      return;
    }
    if (!isOwner) {
      setBalance(null);
      setStatus("CONNECTED WALLET IS NOT THE RED QUEEN OWNER");
      return;
    }

    let active = true;
    setStatus("READING OWNER BALANCE ON SOLANA MAINNET");
    connection.getBalance(publicKey!, "confirmed")
      .then((lamports) => {
        if (!active) return;
        const sol = lamports / LAMPORTS_PER_SOL;
        setBalance(sol);
        setStatus(sol >= 0.02
          ? "OWNER VERIFIED · REGISTRATION PREFLIGHT READY"
          : "ADD AT LEAST 0.02 SOL BEFORE REGISTRATION");
      })
      .catch(() => {
        if (!active) return;
        setBalance(null);
        setStatus("SOLANA BALANCE CHECK FAILED · NO SIGNATURE AVAILABLE");
      });
    return () => { active = false; };
  }, [address, connection, isOwner, publicKey]);

  async function register() {
    if (!canRegister || !publicKey || !signTransaction) return;
    setBusy(true);
    setError("");
    setStatus("CHECKING FOR AN EXISTING RED QUEEN AGENT ASSET");

    try {
      const assetKeypair = Keypair.generate();
      const asset = assetKeypair.publicKey.toBase58();
      const response = await fetch("/api/agent/registry", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ owner: address, asset }),
      });
      const prepared = await response.json() as PreparedRegistration & { error?: string };
      if (!response.ok) throw new Error(prepared.error || "Registration preflight failed.");

      const transaction = Transaction.from(decodeBase64(prepared.transaction));
      assertSafeTransaction(transaction, prepared, owner, asset, metadataUri, program);

      setStatus("SIMULATING REGISTRATION · NO SIGNATURE REQUESTED");
      const simulationTransaction = Transaction.from(transaction.serialize({
        requireAllSignatures: false,
        verifySignatures: false,
      }));
      const simulation = await connection.simulateTransaction(simulationTransaction);
      if (simulation.value.err) {
        throw new Error("Registration simulation failed. Phantom was not asked to sign.");
      }

      setStatus("WALLET REVIEW REQUIRED · VERIFY 8004 PROGRAM AND FEE");
      const signed = await signTransaction(transaction);
      const ownerSignature = signed.signatures.find((item) => item.publicKey.equals(publicKey));
      if (!ownerSignature?.signature) {
        throw new Error("Phantom did not return the required owner signature.");
      }

      // Phantom must sign first so it can simulate the unsigned multi-signer request.
      // The ephemeral Agent Asset signature is added locally only after wallet approval.
      signed.partialSign(assetKeypair);
      setStatus("SIGNATURE APPROVED · SUBMITTING TO SOLANA MAINNET");
      const signature = await connection.sendRawTransaction(signed.serialize(), {
        skipPreflight: false,
        maxRetries: 3,
      });

      setStatus("TRANSACTION SENT · WAITING FOR CONFIRMATION");
      const confirmation = await connection.confirmTransaction({
        signature,
        blockhash: prepared.blockhash,
        lastValidBlockHeight: prepared.lastValidBlockHeight,
      }, "confirmed");
      if (confirmation.value.err) throw new Error("Solana rejected the registration transaction.");

      setStatus("CONFIRMED · VERIFYING OWNER, METADATA AND ATOM STATE");
      const verifyResponse = await fetch("/api/agent/registry", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ asset, signature }),
      });
      const verified = await verifyResponse.json() as VerifiedRegistration & { error?: string };
      if (!verifyResponse.ok) throw new Error(verified.error || "On-chain verification failed.");

      setResult(verified);
      setStatus("RED QUEEN AGENT ASSET VERIFIED ON SOLANA MAINNET");
    } catch (registrationError) {
      setError(registrationError instanceof Error ? registrationError.message : "Registration failed or was rejected.");
      setStatus("NO VERIFIED REGISTRATION RECORDED");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="agent-registration-console">
      <div className="agent-registration-console-head">
        <div><span>OWNER CONTROL // MAINNET</span><strong>Register the RED QUEEN Agent Asset.</strong></div>
        <b>{balanceLabel}</b>
      </div>

      <div className="agent-registration-terms">
        <div><span>OWNER</span><code title={owner}>{compact(owner)}</code></div>
        <div><span>PROGRAM</span><code title={program}>{compact(program)}</code></div>
        <div><span>METADATA</span><code>redqueen.space</code></div>
        <div><span>ATOM</span><code>OFF</code></div>
      </div>

      {!connected ? (
        <div className="agent-registration-connect">
          <p>Connect the project wallet. Connection is read-only until you press Register and approve the exact transaction in Phantom or Solflare.</p>
          <WalletMultiButton />
        </div>
      ) : !isOwner ? (
        <div className="agent-registration-blocked">
          <strong>WRONG WALLET CONNECTED</strong>
          <p>Connected: {compact(address)}. Only {compact(owner)} can create this Agent Asset.</p>
          <WalletMultiButton />
        </div>
      ) : result ? (
        <div className="agent-registration-result">
          <span>REGISTRATION CONFIRMED</span>
          <strong>{compact(result.asset)}</strong>
          <p>The owner, RED QUEEN metadata URI and ATOM OFF state were verified from confirmed mainnet state.</p>
          <div>
            <button type="button" onClick={() => void navigator.clipboard.writeText(result.asset)}>COPY AGENT ASSET</button>
            <button type="button" onClick={() => void navigator.clipboard.writeText(result.signature)}>COPY TRANSACTION</button>
            <a href={result.explorerUrl} target="_blank" rel="noreferrer">OPEN EXPLORER ↗</a>
          </div>
          <small>NEXT: SAVE RED_QUEEN_AGENT_ASSET AND RED_QUEEN_AGENT_REGISTRATION_TX IN VERCEL, THEN SET THE OPERATIONAL AGENT WALLET.</small>
        </div>
      ) : (
        <>
          <label className="agent-registration-approval">
            <input type="checkbox" checked={accepted} onChange={(event) => setAccepted(event.target.checked)} disabled={busy} />
            <span>I verified the owner, 8004 program, metadata URI and ATOM OFF state. I understand this creates a public Agent Asset on Solana mainnet and spends SOL for network fees and account rent.</span>
          </label>
          <button className="agent-registration-submit" type="button" onClick={() => void register()} disabled={!canRegister}>
            {busy ? "REGISTRATION IN PROGRESS…" : hasFeeBuffer ? "REGISTER RED QUEEN · REVIEW IN WALLET" : "0.02 SOL BUFFER REQUIRED"}
          </button>
        </>
      )}

      <div className={`agent-registration-status${error ? " is-error" : ""}`}><i />{error || status}</div>
      <small>NO SEED PHRASE · NO PROJECT PRIVATE KEY · NO AUTOMATIC SIGNATURE · NO USER DATA ON-CHAIN</small>
    </div>
  );
}
