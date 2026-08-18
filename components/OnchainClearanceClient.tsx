"use client";

import { useCallback, useEffect, useState } from "react";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import { VersionedTransaction } from "@solana/web3.js";
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

type DelegateExposure = {
  tokenAccount: string;
  mint: string;
  program: "SPL TOKEN" | "TOKEN-2022";
  state: string;
  balance: string;
  decimals: number;
  delegate: string;
  delegatedAmount: string;
};

type SecuritySnapshot = {
  status: "CLEAR" | "REVIEW";
  lockdownEnabled: boolean;
  summary: {
    tokenAccounts: number;
    activeDelegates: number;
    frozenAccounts: number;
    emptyAccounts: number;
    externalCloseAuthorities: number;
  };
  delegates: DelegateExposure[];
  guidance: string;
  updatedAt: string;
};

type PreparedLockdown = {
  transaction: string;
  blockhash: string;
  lastValidBlockHeight: number;
  statement: string;
  simulation: { ok: boolean; error: unknown; unitsConsumed: number | null; logs: string[] };
  revocations: DelegateExposure[];
};

function shortAddress(value: string) {
  return `${value.slice(0, 7)}…${value.slice(-7)}`;
}

export default function OnchainClearanceClient() {
  const { connection } = useConnection();
  const { publicKey, connected, sendTransaction } = useWallet();
  const { user, session, authIdentifier } = useAuth();
  const [snapshot, setSnapshot] = useState<OnchainSnapshot | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [verifyStatus, setVerifyStatus] = useState("");
  const [verifying, setVerifying] = useState(false);
  const [security, setSecurity] = useState<SecuritySnapshot | null>(null);
  const [securityStatus, setSecurityStatus] = useState("");
  const [selectedDelegates, setSelectedDelegates] = useState<string[]>([]);
  const [preparedLockdown, setPreparedLockdown] = useState<PreparedLockdown | null>(null);
  const [lockdownBusy, setLockdownBusy] = useState(false);
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

  const scanSecurity = useCallback(async () => {
    if (!address) return;
    setSecurityStatus("READING SPL + TOKEN-2022 AUTHORITIES…");
    setPreparedLockdown(null);
    try {
      const response = await fetch(`/api/onchain/wallet/security?address=${encodeURIComponent(address)}`, { cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Wallet authority scan failed.");
      setSecurity(data);
      setSelectedDelegates(data.delegates.slice(0, 8).map((item: DelegateExposure) => item.tokenAccount));
      setSecurityStatus(data.delegates.length
        ? `${data.delegates.length} ACTIVE DELEGATE APPROVAL${data.delegates.length === 1 ? "" : "S"} REQUIRE REVIEW`
        : "NO ACTIVE POSITIVE-BALANCE DELEGATES OBSERVED");
    } catch (scanError) {
      setSecurity(null);
      setSelectedDelegates([]);
      setSecurityStatus(scanError instanceof Error ? scanError.message : "Wallet authority scan failed.");
    }
  }, [address]);

  useEffect(() => {
    setSnapshot(null);
    setVerifyStatus("");
    if (address) {
      void scanWallet();
      void scanSecurity();
    }
  }, [address, scanSecurity, scanWallet]);

  function toggleDelegate(tokenAccount: string) {
    setPreparedLockdown(null);
    setSelectedDelegates((current) => current.includes(tokenAccount)
      ? current.filter((item) => item !== tokenAccount)
      : current.length < 8 ? [...current, tokenAccount] : current);
  }

  async function previewLockdown() {
    if (!session?.access_token || !signedWalletSession || selectedDelegates.length === 0) return;
    setLockdownBusy(true);
    setPreparedLockdown(null);
    setSecurityStatus("SIMULATING REVOCATION · NO SIGNATURE REQUESTED…");
    try {
      const response = await fetch("/api/onchain/wallet/lockdown/prepare", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ tokenAccounts: selectedDelegates }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Lockdown simulation failed.");
      setPreparedLockdown(data);
      setSecurityStatus(`SIMULATION PASSED · ${data.revocations.length} REVOCATION${data.revocations.length === 1 ? "" : "S"} READY FOR REVIEW`);
    } catch (error) {
      setSecurityStatus(error instanceof Error ? error.message : "Lockdown simulation failed.");
    } finally {
      setLockdownBusy(false);
    }
  }

  async function executeLockdown() {
    if (!preparedLockdown || !publicKey) return;
    setLockdownBusy(true);
    setSecurityStatus("AWAITING YOUR WALLET APPROVAL…");
    try {
      const bytes = Uint8Array.from(atob(preparedLockdown.transaction), (character) => character.charCodeAt(0));
      const transaction = VersionedTransaction.deserialize(bytes);
      const signature = await sendTransaction(transaction, connection, { skipPreflight: false });
      setSecurityStatus("TRANSACTION SENT · WAITING FOR CONFIRMATION…");
      await connection.confirmTransaction({
        signature,
        blockhash: preparedLockdown.blockhash,
        lastValidBlockHeight: preparedLockdown.lastValidBlockHeight,
      }, "confirmed");
      setPreparedLockdown(null);
      setSecurityStatus(`LOCKDOWN CONFIRMED · ${signature.slice(0, 8)}…${signature.slice(-8)}`);
      await scanSecurity();
    } catch (error) {
      setSecurityStatus(error instanceof Error ? error.message : "Wallet rejected or the transaction failed.");
    } finally {
      setLockdownBusy(false);
    }
  }

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

      <div className={`wallet-lockdown${security?.status === "REVIEW" ? " needs-review" : ""}`}>
        <div className="wallet-lockdown-head">
          <div><span>WALLET INTELLIGENCE // AUTHORITY SCAN</span><strong>{security?.status === "REVIEW" ? "REVIEW ACTIVE AUTHORITIES" : "SPL AUTHORITY SURFACE"}</strong></div>
          <button type="button" onClick={() => void scanSecurity()} disabled={lockdownBusy}>RESCAN</button>
        </div>
        {security ? (
          <>
            <div className="wallet-lockdown-metrics">
              <div><span>TOKEN ACCOUNTS</span><strong>{security.summary.tokenAccounts}</strong></div>
              <div><span>ACTIVE DELEGATES</span><strong>{security.summary.activeDelegates}</strong></div>
              <div><span>FROZEN</span><strong>{security.summary.frozenAccounts}</strong></div>
              <div><span>EMPTY ACCOUNTS</span><strong>{security.summary.emptyAccounts}</strong></div>
            </div>
            <p>{security.guidance}</p>
            {security.delegates.length > 0 && (
              <div className="wallet-delegate-list">
                {security.delegates.map((delegate) => (
                  <label key={delegate.tokenAccount}>
                    <input
                      type="checkbox"
                      checked={selectedDelegates.includes(delegate.tokenAccount)}
                      onChange={() => toggleDelegate(delegate.tokenAccount)}
                      disabled={lockdownBusy || !security.lockdownEnabled}
                    />
                    <span><strong>{shortAddress(delegate.mint)}</strong><small>{delegate.program} · BALANCE {delegate.balance} · APPROVED {delegate.delegatedAmount}</small></span>
                    <code>{shortAddress(delegate.delegate)}</code>
                  </label>
                ))}
              </div>
            )}
            {security.delegates.length > 0 && (
              <div className="wallet-lockdown-actions">
                {!signedWalletSession ? (
                  <Link href="/login">SIGN IN WITH THIS WALLET TO CONTINUE</Link>
                ) : !security.lockdownEnabled ? (
                  <span>REVOCATION PREVIEW IS FEATURE-GATED UNTIL MAINNET QA IS ENABLED.</span>
                ) : (
                  <>
                    <button type="button" onClick={() => void previewLockdown()} disabled={lockdownBusy || selectedDelegates.length === 0}>1. SIMULATE SELECTED REVOCATIONS</button>
                    <button type="button" className="danger" onClick={() => void executeLockdown()} disabled={lockdownBusy || !preparedLockdown?.simulation.ok}>2. REVIEWED · REVOKE IN WALLET</button>
                  </>
                )}
              </div>
            )}
            {preparedLockdown && (
              <div className="wallet-lockdown-preview"><strong>SIMULATION PASSED · {preparedLockdown.simulation.unitsConsumed?.toLocaleString() || "—"} COMPUTE UNITS</strong><p>{preparedLockdown.statement}</p><small>No token transfer instruction is included. Your wallet must still show and approve the final transaction.</small></div>
            )}
          </>
        ) : <p>Connect and scan a public wallet to inspect token authorities.</p>}
        {securityStatus && <small className="wallet-lockdown-status">{securityStatus}</small>}
      </div>
      <small className="onchain-mint-line">CANONICAL MINT · {snapshot?.threat.mint || "READING…"}</small>
    </section>
  );
}
