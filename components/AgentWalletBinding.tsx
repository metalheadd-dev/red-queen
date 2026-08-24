"use client";

import { useEffect, useState } from "react";
import dynamic from "next/dynamic";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import {
  Ed25519Program,
  LAMPORTS_PER_SOL,
  PublicKey,
  SYSVAR_INSTRUCTIONS_PUBKEY,
  Transaction,
} from "@solana/web3.js";

const WalletMultiButton = dynamic(
  () => import("@solana/wallet-adapter-react-ui").then((module) => module.WalletMultiButton),
  { ssr: false },
);

const MESSAGE_PREFIX = new TextEncoder().encode("8004_WALLET_SET:");
const SET_WALLET_DISCRIMINATOR = Uint8Array.from([154, 87, 251, 23, 51, 12, 4, 150]);

type WalletStatus = {
  bound: boolean;
  matchesProjectWallet: boolean;
  wallet: string;
  explorerUrl: string;
};

type PreparedMessage = {
  message: string;
  deadline: string;
  asset: string;
  owner: string;
  wallet: string;
  program: string;
  alreadyBound?: boolean;
};

type PreparedBinding = {
  transaction: string;
  blockhash: string;
  lastValidBlockHeight: number;
  signer: string;
  feePayer?: string;
  requiredSigners?: string[];
  deadline: string;
  asset: string;
  owner: string;
  wallet: string;
  program: string;
  alreadyBound?: boolean;
};

type VerifiedBinding = {
  wallet: string;
  signature: string;
  explorerUrl: string;
};

function compact(value: string) {
  if (!value) return "NOT SET";
  return `${value.slice(0, 8)}…${value.slice(-8)}`;
}

function decodeBase64(value: string) {
  return Uint8Array.from(atob(value), (character) => character.charCodeAt(0));
}

function encodeBase64(value: Uint8Array) {
  let binary = "";
  value.forEach((byte) => { binary += String.fromCharCode(byte); });
  return btoa(binary);
}

function concatBytes(...parts: Uint8Array[]) {
  const output = new Uint8Array(parts.reduce((total, part) => total + part.length, 0));
  let offset = 0;
  parts.forEach((part) => {
    output.set(part, offset);
    offset += part.length;
  });
  return output;
}

function deadlineBytes(deadline: bigint) {
  const bytes = new Uint8Array(8);
  let value = deadline;
  for (let index = 0; index < bytes.length; index += 1) {
    bytes[index] = Number(value & BigInt(255));
    value >>= BigInt(8);
  }
  return bytes;
}

function buildExpectedMessage(asset: string, wallet: string, owner: string, deadline: bigint) {
  return concatBytes(
    MESSAGE_PREFIX,
    new PublicKey(asset).toBytes(),
    new PublicKey(wallet).toBytes(),
    new PublicKey(owner).toBytes(),
    deadlineBytes(deadline),
  );
}

function bytesEqual(left: Uint8Array, right: Uint8Array) {
  return left.length === right.length && left.every((byte, index) => byte === right[index]);
}

function assertPreparedMessage(prepared: PreparedMessage, owner: string, asset: string, program: string) {
  if (prepared.owner !== owner || prepared.wallet !== owner || prepared.asset !== asset || prepared.program !== program) {
    throw new Error("Wallet proof returned unexpected identity parameters.");
  }
  const expected = buildExpectedMessage(asset, owner, owner, BigInt(prepared.deadline));
  const actual = decodeBase64(prepared.message);
  if (!bytesEqual(actual, expected)) {
    throw new Error("Wallet proof message does not match the canonical 8004 binding format.");
  }
  return actual;
}

function assertSafeTransaction(transaction: Transaction, prepared: PreparedBinding, owner: string, asset: string, program: string) {
  if (
    prepared.owner !== owner
    || prepared.wallet !== owner
    || prepared.asset !== asset
    || prepared.program !== program
    || prepared.signer !== owner
    || prepared.feePayer !== owner
  ) {
    throw new Error("Binding preflight returned an unexpected signer, wallet, asset or program.");
  }
  if (transaction.feePayer?.toBase58() !== owner || transaction.recentBlockhash !== prepared.blockhash) {
    throw new Error("The transaction does not match the approved fee payer or blockhash.");
  }

  const requiredSigners = new Set(transaction.signatures.map((item) => item.publicKey.toBase58()));
  if (requiredSigners.size !== 1 || !requiredSigners.has(owner)) {
    throw new Error("The binding transaction requested an unexpected signer.");
  }
  if (transaction.instructions.length !== 2) {
    throw new Error("A safe operational-wallet binding must contain exactly two instructions.");
  }

  const [proofInstruction, bindingInstruction] = transaction.instructions;
  if (!proofInstruction.programId.equals(Ed25519Program.programId) || bindingInstruction.programId.toBase58() !== program) {
    throw new Error("The transaction contains an unexpected instruction program.");
  }
  if (
    bindingInstruction.keys.length !== 4
    || bindingInstruction.keys[0].pubkey.toBase58() !== owner
    || !bindingInstruction.keys[0].isSigner
    || bindingInstruction.keys[2].pubkey.toBase58() !== asset
    || !bindingInstruction.keys[3].pubkey.equals(SYSVAR_INSTRUCTIONS_PUBKEY)
  ) {
    throw new Error("The registry instruction does not target the approved owner and Agent Asset.");
  }

  const expectedBindingData = concatBytes(
    SET_WALLET_DISCRIMINATOR,
    new PublicKey(owner).toBytes(),
    deadlineBytes(BigInt(prepared.deadline)),
  );
  if (!bytesEqual(bindingInstruction.data, expectedBindingData)) {
    throw new Error("The registry instruction attempts to bind an unexpected wallet or deadline.");
  }

  const expectedMessage = buildExpectedMessage(asset, owner, owner, BigInt(prepared.deadline));
  const proofData = proofInstruction.data;
  const embeddedMessage = proofData.slice(proofData.length - expectedMessage.length);
  if (!bytesEqual(embeddedMessage, expectedMessage)) {
    throw new Error("The on-chain Ed25519 proof does not match the message approved in the wallet.");
  }
}

export default function AgentWalletBinding({ owner, asset, program }: { owner: string; asset: string; program: string }) {
  const { connection } = useConnection();
  const { connected, publicKey, signMessage, signTransaction, wallet: selectedWallet } = useWallet();
  const [remoteStatus, setRemoteStatus] = useState<WalletStatus | null>(null);
  const [balance, setBalance] = useState<number | null>(null);
  const [accepted, setAccepted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("READING OPERATIONAL WALLET STATUS");
  const [error, setError] = useState("");
  const [result, setResult] = useState<VerifiedBinding | null>(null);
  const address = publicKey?.toBase58() || "";
  const isOwner = address === owner;
  const hasFeeBuffer = balance !== null && balance >= 0.005;
  const hasBoundWallet = Boolean(result || remoteStatus?.bound);
  const isApprovedBound = Boolean(result || (remoteStatus?.bound && remoteStatus.matchesProjectWallet));
  const selectedWalletName = selectedWallet?.adapter.name || "";
  const isPhantom = selectedWalletName.toLowerCase().includes("phantom");
  const canBind = connected && isOwner && hasFeeBuffer && accepted && Boolean(signMessage) && Boolean(signTransaction) && !busy && !hasBoundWallet && !isPhantom;

  useEffect(() => {
    let active = true;
    fetch("/api/agent/wallet", { cache: "no-store" })
      .then(async (response) => {
        const data = await response.json() as WalletStatus & { error?: string };
        if (!response.ok) throw new Error(data.error || "Operational wallet status is unavailable.");
        if (!active) return;
        setRemoteStatus(data);
        setStatus(data.bound
          ? data.matchesProjectWallet
            ? "OPERATIONAL WALLET VERIFIED ON SOLANA MAINNET"
            : "A DIFFERENT OPERATIONAL WALLET IS ALREADY BOUND"
          : "AGENT ASSET VERIFIED · OPERATIONAL WALLET NOT YET BOUND");
      })
      .catch((statusError) => {
        if (!active) return;
        setError(statusError instanceof Error ? statusError.message : "Operational wallet status is unavailable.");
        setStatus("NO WALLET BINDING ACTION AVAILABLE");
      });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    setAccepted(false);
    setError("");
    if (!address || !isOwner) {
      setBalance(null);
      return;
    }

    let active = true;
    connection.getBalance(publicKey!, "confirmed")
      .then((lamports) => {
        if (active) setBalance(lamports / LAMPORTS_PER_SOL);
      })
      .catch(() => {
        if (active) setBalance(null);
      });
    return () => { active = false; };
  }, [address, connection, isOwner, publicKey]);

  async function bindWallet() {
    if (!canBind || !publicKey || !signMessage || !signTransaction) return;
    setBusy(true);
    setError("");

    try {
      setStatus("PREPARING CANONICAL 8004 OWNERSHIP MESSAGE");
      const messageResponse = await fetch("/api/agent/wallet", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ owner: address, wallet: address }),
      });
      const preparedMessage = await messageResponse.json() as PreparedMessage & { error?: string };
      if (!messageResponse.ok) throw new Error(preparedMessage.error || "Wallet proof preflight failed.");
      if (preparedMessage.alreadyBound) {
        setRemoteStatus({ bound: true, matchesProjectWallet: true, wallet: address, explorerUrl: `https://explorer.solana.com/address/${asset}` });
        setStatus("OPERATIONAL WALLET WAS ALREADY VERIFIED");
        return;
      }

      const message = assertPreparedMessage(preparedMessage, owner, asset, program);
      setStatus("MESSAGE REVIEW REQUIRED · NO SOL OR TOKENS MOVE");
      const messageSignature = await signMessage(message);
      if (messageSignature.length !== 64) throw new Error("Wallet did not return a valid ownership proof.");

      setStatus("BUILDING THE OWNER-APPROVED 8004 TRANSACTION");
      const transactionResponse = await fetch("/api/agent/wallet", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          owner: address,
          wallet: address,
          deadline: preparedMessage.deadline,
          signature: encodeBase64(messageSignature),
        }),
      });
      const prepared = await transactionResponse.json() as PreparedBinding & { error?: string };
      if (!transactionResponse.ok) throw new Error(prepared.error || "Binding transaction preflight failed.");
      if (prepared.alreadyBound) {
        setRemoteStatus({ bound: true, matchesProjectWallet: true, wallet: address, explorerUrl: `https://explorer.solana.com/address/${asset}` });
        setStatus("OPERATIONAL WALLET WAS ALREADY VERIFIED");
        return;
      }

      const transaction = Transaction.from(decodeBase64(prepared.transaction));
      assertSafeTransaction(transaction, prepared, owner, asset, program);

      setStatus("SIMULATING EXACT INSTRUCTIONS · NO TRANSACTION SIGNATURE YET");
      const simulation = await connection.simulateTransaction(transaction);
      if (simulation.value.err) throw new Error("Binding simulation failed. The wallet was not asked to sign the transaction.");

      setStatus("TRANSACTION REVIEW REQUIRED · VERIFY 8004 PROGRAM AND NETWORK FEE");
      const signed = await signTransaction(transaction);
      const ownerSignature = signed.signatures.find((item) => item.publicKey.equals(publicKey));
      if (!ownerSignature?.signature) throw new Error("Wallet did not return the required transaction signature.");

      setStatus("APPROVED · SUBMITTING TO SOLANA MAINNET");
      const transactionSignature = await connection.sendRawTransaction(signed.serialize(), {
        skipPreflight: false,
        maxRetries: 3,
      });

      setStatus("TRANSACTION SENT · WAITING FOR CONFIRMATION");
      const confirmation = await connection.confirmTransaction({
        signature: transactionSignature,
        blockhash: prepared.blockhash,
        lastValidBlockHeight: prepared.lastValidBlockHeight,
      }, "confirmed");
      if (confirmation.value.err) throw new Error("Solana rejected the operational wallet binding.");

      setStatus("CONFIRMED · VERIFYING FINAL ON-CHAIN STATE");
      const verifyResponse = await fetch("/api/agent/wallet", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ signature: transactionSignature }),
      });
      const verified = await verifyResponse.json() as VerifiedBinding & { error?: string };
      if (!verifyResponse.ok) throw new Error(verified.error || "On-chain wallet verification failed.");

      setResult(verified);
      setRemoteStatus({ bound: true, matchesProjectWallet: true, wallet: verified.wallet, explorerUrl: `https://explorer.solana.com/address/${asset}` });
      setStatus("RED QUEEN OPERATIONAL WALLET VERIFIED ON SOLANA MAINNET");
    } catch (bindingError) {
      const message = bindingError instanceof Error ? bindingError.message : "Wallet binding failed or was rejected.";
      const phantomBlockedBinaryProof = message.toLowerCase().includes("cannot sign solana transactions using sign_message")
        || message.toLowerCase().includes("cannot sign solana transactions using sign message");
      setError(phantomBlockedBinaryProof
        ? "Phantom blocked the mandatory binary 8004 ownership proof as a possible transaction. No transaction was created. Registration is already complete; this optional wallet binding currently requires a compatible owner wallet such as Solflare."
        : message);
      setStatus("NO NEW OPERATIONAL WALLET BINDING RECORDED");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="agent-wallet-console">
      <div className="agent-wallet-console-head">
        <div><span>OPERATIONAL IDENTITY // OWNER CONTROL</span><strong>Bind RED QUEEN&apos;s agent wallet.</strong></div>
        <b>{hasBoundWallet ? "BOUND" : "NOT BOUND"}</b>
      </div>

      <p className="agent-wallet-explainer">This publishes one operational wallet on the 8004 Agent Asset. It does not grant RED QUEEN custody, transfer authority or automatic spending permission.</p>

      <div className="agent-registration-terms">
        <div><span>AGENT ASSET</span><code title={asset}>{compact(asset)}</code></div>
        <div><span>WALLET</span><code title={owner}>{compact(owner)}</code></div>
        <div><span>MESSAGE</span><code>FREE PROOF</code></div>
        <div><span>TRANSACTION</span><code>SEPARATE APPROVAL</code></div>
      </div>

      {isApprovedBound ? (
        <div className="agent-registration-result">
          <span>OPERATIONAL WALLET VERIFIED</span>
          <strong>{compact(result?.wallet || remoteStatus?.wallet || owner)}</strong>
          <p>The Agent Asset now exposes the approved RED QUEEN operational wallet on Solana mainnet.</p>
          <div>
            <button type="button" onClick={() => void navigator.clipboard.writeText(result?.wallet || remoteStatus?.wallet || owner)}>COPY WALLET</button>
            {result?.explorerUrl ? <a href={result.explorerUrl} target="_blank" rel="noreferrer">VIEW TRANSACTION ↗</a> : null}
            <a href={`https://explorer.solana.com/address/${asset}`} target="_blank" rel="noreferrer">VIEW AGENT ASSET ↗</a>
          </div>
        </div>
      ) : remoteStatus?.bound ? (
        <div className="agent-registration-blocked">
          <div><strong>DIFFERENT OPERATIONAL WALLET DETECTED</strong><p>Bound wallet: {compact(remoteStatus.wallet)}. This interface will not replace it automatically.</p></div>
          <a href={remoteStatus.explorerUrl} target="_blank" rel="noreferrer">VERIFY AGENT ASSET ↗</a>
        </div>
      ) : !connected ? (
        <div className="agent-registration-connect">
          <p>Connect the registered owner wallet. Nothing is signed until you explicitly start the two-step binding flow.</p>
          <WalletMultiButton />
        </div>
      ) : !isOwner ? (
        <div className="agent-registration-blocked">
          <strong>WRONG WALLET CONNECTED</strong>
          <p>Connected: {compact(address)}. Only {compact(owner)} can bind this Agent Asset.</p>
          <WalletMultiButton />
        </div>
      ) : (
        <>
          {isPhantom ? (
            <div className="agent-registration-blocked">
              <strong>PHANTOM COMPATIBILITY NOTICE</strong>
              <p>Phantom can reject the registry&apos;s mandatory binary proof as a transaction. RED QUEEN is already 8004 registered; wallet binding is optional and does not control indexer visibility. If Phantom blocks the proof, use the same owner account through a compatible signer such as Solflare. Never import or expose a seed phrase just to complete this step.</p>
            </div>
          ) : null}
          <label className="agent-registration-approval">
            <input type="checkbox" checked={accepted} onChange={(event) => setAccepted(event.target.checked)} disabled={busy} />
            <span>I verified the Agent Asset, owner wallet and 8004 program. I understand I will approve one free proof-message and then review a separate Solana mainnet transaction.</span>
          </label>
          <button className="agent-registration-submit" type="button" onClick={() => void bindWallet()} disabled={!canBind}>
            {busy
              ? "BINDING IN PROGRESS…"
              : isPhantom
                ? "SWITCH TO A COMPATIBLE OWNER WALLET"
                : !signMessage
                  ? "WALLET MESSAGE SIGNING REQUIRED"
                  : hasFeeBuffer
                    ? "BIND AGENT WALLET · TWO APPROVALS"
                    : "0.005 SOL FEE BUFFER REQUIRED"}
          </button>
        </>
      )}

      <div className={`agent-registration-status${error ? " is-error" : ""}`}><i />{error || status}</div>
      <small>NO SEED PHRASE · NO PRIVATE KEY · NO TOKEN APPROVAL · NO AUTOMATIC TRANSACTION · OWNER CAN REJECT EITHER STEP</small>
    </div>
  );
}
