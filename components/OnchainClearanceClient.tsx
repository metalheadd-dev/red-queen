"use client";

import { useCallback, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useWallet } from "@solana/wallet-adapter-react";
import { useAuth } from "./AuthProvider";

const WalletMultiButton = dynamic(
  () => import("@solana/wallet-adapter-react-ui").then((module) => module.WalletMultiButton),
  { ssr: false },
);

type OnchainSnapshot = {
  address: string;
  cluster: string;
  caip2: string;
  commitment: string;
  slot: number;
  rpcLatencyMs: number;
  solBalance: number;
  readOnly: boolean;
  transactionRequested: boolean;
  updatedAt: string;
  threat: {
    mint: string;
    balance: number;
    tokenAccounts: number;
    program: string;
    clearance: {
      tier: number;
      level: number;
      name: string;
      responseDepth: string;
      contextMessages: number;
      signalWatchSlots: number;
      comparisonSignals: number;
      earnedXpMultiplier: number;
    };
  };
};

function shortAddress(value: string) {
  return `${value.slice(0, 7)}…${value.slice(-7)}`;
}

export default function OnchainClearanceClient() {
  const { publicKey, connected } = useWallet();
  const { user, session, authIdentifier } = useAuth();
  const [snapshot, setSnapshot] = useState<OnchainSnapshot | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [verifyStatus, setVerifyStatus] = useState("");
  const [verifying, setVerifying] = useState(false);
  const address = publicKey?.toBase58() || "";
  const signedWalletSession = Boolean(user && session?.access_token && address && authIdentifier === address);

  const scanWallet = useCallback(async () => {
    if (!address) return;
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`/api/onchain/wallet?address=${encodeURIComponent(address)}`, { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "On-chain read failed.");
      setSnapshot(data);
    } catch (scanError) {
      setSnapshot(null);
      setError(scanError instanceof Error ? scanError.message : "On-chain read failed.");
    } finally {
      setLoading(false);
    }
  }, [address]);

  useEffect(() => {
    setSnapshot(null);
    setVerifyStatus("");
    if (address) void scanWallet();
  }, [address, scanWallet]);

  async function verifyAndSave() {
    if (!session?.access_token || !signedWalletSession) return;
    setVerifying(true);
    setVerifyStatus("VERIFYING OWNERSHIP SESSION + LIVE SPL BALANCE…");
    try {
      const response = await fetch("/api/profile/verify-holder", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({}),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Clearance verification failed.");
      setVerifyStatus(`${Number(data.verified_balance || 0).toLocaleString()} $THREAT · ${data.holder_status} · SAVED`);
      await scanWallet();
    } catch (verificationError) {
      setVerifyStatus(verificationError instanceof Error ? verificationError.message : "Clearance verification failed.");
    } finally {
      setVerifying(false);
    }
  }

  if (!connected || !address) {
    return (
      <section className="onchain-console is-disconnected">
        <div className="onchain-console-head"><span>LIVE WALLET PROOF</span><b>NO WALLET CONNECTED</b></div>
        <div className="onchain-connect-orb"><i /></div>
        <h2>Connect for a read-only Solana scan.</h2>
        <p>RED QUEEN will read the public address, SOL balance, `$THREAT` token accounts and current clearance. No signature or transaction is requested at this step.</p>
        <WalletMultiButton />
        <small>CONNECTION ≠ AUTHENTICATION ≠ PAYMENT</small>
      </section>
    );
  }

  return (
    <section className="onchain-console">
      <div className="onchain-console-head">
        <span>LIVE WALLET PROOF</span>
        <b className={error ? "is-error" : "is-live"}>{loading ? "READING MAINNET…" : error ? "RPC UNAVAILABLE" : "MAINNET · CONFIRMED"}</b>
      </div>

      <div className="onchain-identity-row">
        <div><span>CONNECTED ADDRESS</span><strong>{shortAddress(address)}</strong></div>
        <button onClick={() => void navigator.clipboard.writeText(address)}>COPY</button>
        <a href={`https://explorer.solana.com/address/${address}`} target="_blank" rel="noreferrer">EXPLORER ↗</a>
      </div>

      {error ? (
        <div className="onchain-console-error"><strong>NO CACHED CLEARANCE ACCEPTED</strong><p>{error}</p><button onClick={() => void scanWallet()}>RETRY SOLANA READ</button></div>
      ) : snapshot ? (
        <>
          <div className="onchain-balance-grid">
            <div><span>$THREAT BALANCE</span><strong>{snapshot.threat.balance.toLocaleString()}</strong><small>{snapshot.threat.tokenAccounts} TOKEN ACCOUNT{snapshot.threat.tokenAccounts === 1 ? "" : "S"}</small></div>
            <div><span>INTELLIGENCE CLEARANCE</span><strong>LVL {snapshot.threat.clearance.level}</strong><small>{snapshot.threat.clearance.name}</small></div>
            <div><span>SOL BALANCE</span><strong>{snapshot.solBalance.toLocaleString(undefined, { maximumFractionDigits: 4 })}</strong><small>PUBLIC ON-CHAIN VALUE</small></div>
          </div>
          <div className="onchain-proof-grid">
            <div><span>TOKEN PROGRAM</span><strong>{snapshot.threat.program}</strong></div>
            <div><span>FINALITY</span><strong>{snapshot.commitment.toUpperCase()}</strong></div>
            <div><span>OBSERVED SLOT</span><strong>{snapshot.slot.toLocaleString()}</strong></div>
            <div><span>RPC ROUNDTRIP</span><strong>{snapshot.rpcLatencyMs} MS</strong></div>
          </div>
          <div className="onchain-utility-result">
            <span>OBSERVED TIER CAPACITY</span>
            <p><strong>{snapshot.threat.clearance.contextMessages} messages</strong> of working context · <strong>{snapshot.threat.clearance.signalWatchSlots} signal watches</strong> · <strong>{snapshot.threat.clearance.comparisonSignals} verified signals</strong> per Queen synthesis · <strong>{snapshot.threat.clearance.responseDepth}</strong> analysis · <strong>×{snapshot.threat.clearance.earnedXpMultiplier.toFixed(2)}</strong> on genuinely earned XP.</p>
            <small>Personalized holder utility activates only after ownership verification.</small>
          </div>
        </>
      ) : (
        <div className="onchain-console-loading">QUERYING SOLANA RPC · AGGREGATING TOKEN ACCOUNTS</div>
      )}

      <div className="onchain-session-gate">
        <div>
          <span>{signedWalletSession ? "SIWS SESSION VERIFIED" : "READ-ONLY CONNECTION"}</span>
          <p>{signedWalletSession
            ? "This signed wallet session can persist the live clearance to My Readiness."
            : user
              ? "The connected wallet does not match this account session. It remains read-only."
              : "Sign one domain-bound message to prove ownership and save clearance. No transaction is sent."}</p>
        </div>
        {signedWalletSession ? (
          <button onClick={() => void verifyAndSave()} disabled={verifying || !snapshot}>{verifying ? "VERIFYING…" : "VERIFY & SAVE CLEARANCE"}</button>
        ) : user ? (
          <Link href="/operative">OPEN ACCOUNT STATUS</Link>
        ) : (
          <Link href="/login">SIGN IN WITH THIS WALLET</Link>
        )}
      </div>
      {verifyStatus && <div className="onchain-verify-status">{verifyStatus}</div>}
      <small className="onchain-mint-line">CANONICAL MINT · {snapshot?.threat.mint || "READING…"}</small>
    </section>
  );
}
