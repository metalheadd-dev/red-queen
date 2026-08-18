"use client";

import dynamic from "next/dynamic";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useWallet } from "@solana/wallet-adapter-react";
import { VersionedTransaction } from "@solana/web3.js";
import { useAuth } from "@/components/AuthProvider";
import { formatRawAmount, THREAT_SWAP_INPUTS, ThreatSwapInputSymbol } from "@/lib/jupiter";
import { THREAT_TOKEN_MINT } from "@/lib/threat-token";

const WalletMultiButton = dynamic(
  () => import("@solana/wallet-adapter-react-ui").then((module) => module.WalletMultiButton),
  { ssr: false },
);

type SwapOrder = {
  inputSymbol: ThreatSwapInputSymbol;
  inputAmount: string;
  outputAmount: string;
  outputDecimals: number;
  otherAmountThreshold: string | null;
  router: string;
  mode: string;
  priceImpactPct: string | number | null;
  platformFee: { amount?: string; feeBps?: number; feeMint?: string } | null;
  feeBps: number;
  feeMint: string | null;
  referral: { enabled: boolean; feeBps: number; routingTradeoff?: string };
  requestId: string;
  transaction: string;
  lastValidBlockHeight: string | number | null;
  expiresAt: string | null;
  safety: { note: string };
};

function bytesToBase64(bytes: Uint8Array) {
  let binary = "";
  for (let offset = 0; offset < bytes.length; offset += 0x8000) binary += String.fromCharCode(...bytes.subarray(offset, offset + 0x8000));
  return btoa(binary);
}

export default function ThreatSwapClient() {
  const { publicKey, connected, signTransaction } = useWallet();
  const { user, session, authIdentifier } = useAuth();
  const [available, setAvailable] = useState<boolean | null>(null);
  const [reason, setReason] = useState("Checking Jupiter Swap V2…");
  const [inputSymbol, setInputSymbol] = useState<ThreatSwapInputSymbol>("SOL");
  const [amount, setAmount] = useState("0.05");
  const [order, setOrder] = useState<SwapOrder | null>(null);
  const [accepted, setAccepted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("");
  const [error, setError] = useState("");
  const [signature, setSignature] = useState("");
  const [achievement, setAchievement] = useState("");
  const address = publicKey?.toBase58() || "";
  const signedWalletSession = Boolean(user && session?.access_token && authIdentifier === address);

  useEffect(() => {
    fetch("/api/onchain/swap/threat/status", { cache: "no-store" })
      .then(async (response) => response.json())
      .then((data) => { setAvailable(data.available === true); setReason(data.available ? "Jupiter order + execute ready" : data.reason || "Swap unavailable"); })
      .catch(() => { setAvailable(false); setReason("Jupiter health check failed"); });
  }, []);

  useEffect(() => {
    setOrder(null);
    setAccepted(false);
    setSignature("");
    setError("");
    setStatus("");
  }, [address, amount, inputSymbol]);

  async function requestOrder() {
    if (!address) return;
    setBusy(true);
    setError("");
    setOrder(null);
    setAccepted(false);
    setStatus("ASKING JUPITER ROUTERS FOR AN EXECUTABLE ORDER…");
    try {
      const response = await fetch("/api/onchain/swap/threat/order", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inputSymbol, amount, taker: address }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Jupiter order failed.");
      setOrder(data);
      setStatus("ORDER READY · REVIEW OUTPUT, FEES AND CANONICAL MINT");
      try {
        const wire = Uint8Array.from(atob(data.transaction), (character) => character.charCodeAt(0));
        VersionedTransaction.deserialize(wire);
      } catch {
        throw new Error("Jupiter returned an unreadable transaction. Do not sign it.");
      }
    } catch (orderError) {
      setError(orderError instanceof Error ? orderError.message : "Jupiter order failed.");
      setStatus("");
    } finally {
      setBusy(false);
    }
  }

  async function claimSwapAchievement(transactionSignature: string) {
    if (!signedWalletSession || !session?.access_token) {
      setAchievement("Sign in with this wallet before swapping if you want the one-time ONCHAIN INITIATE record saved.");
      return;
    }
    setAchievement("VERIFYING FIRST SAFE SWAP ON SOLANA…");
    const response = await fetch("/api/onchain/swap/threat/claim", {
      method: "POST",
      headers: { "Content-Type": "application/json", Authorization: `Bearer ${session.access_token}` },
      body: JSON.stringify({ signature: transactionSignature }),
    });
    const data = await response.json();
    if (!response.ok) {
      setAchievement(data.error || "Swap confirmed, but the achievement could not be saved yet.");
      return;
    }
    setAchievement(data.alreadyClaimed
      ? "ONCHAIN INITIATE was already recorded for this SOLvivor."
      : `ONCHAIN INITIATE UNLOCKED · +${data.achievement?.protocol_xp || 25} PROTOCOL XP · BIO UNCHANGED`);
  }

  async function executeSwap() {
    if (!order || !publicKey || !signTransaction || !accepted) return;
    setBusy(true);
    setError("");
    setStatus("AWAITING YOUR WALLET APPROVAL…");
    try {
      const wire = Uint8Array.from(atob(order.transaction), (character) => character.charCodeAt(0));
      const transaction = VersionedTransaction.deserialize(wire);
      const signed = await signTransaction(transaction) as VersionedTransaction;
      setStatus("SIGNED · JUPITER IS LANDING THE TRANSACTION…");
      const response = await fetch("/api/onchain/swap/threat/execute", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          requestId: order.requestId,
          signedTransaction: bytesToBase64(signed.serialize()),
          lastValidBlockHeight: order.lastValidBlockHeight,
        }),
      });
      const data = await response.json();
      if (!response.ok || !data.success || !data.signature) throw new Error(data.error || "Jupiter did not confirm the swap.");
      setSignature(data.signature);
      setStatus(`SWAP CONFIRMED · ${data.signature.slice(0, 8)}…${data.signature.slice(-8)}`);
      await claimSwapAchievement(data.signature);
    } catch (swapError) {
      setError(swapError instanceof Error ? swapError.message : "Wallet rejected or the swap failed.");
      setStatus("");
    } finally {
      setBusy(false);
    }
  }

  const inputConfig = THREAT_SWAP_INPUTS[inputSymbol];
  const output = order?.outputAmount ? formatRawAmount(order.outputAmount, order.outputDecimals, 4) : "—";
  const minimumOutput = order?.otherAmountThreshold ? formatRawAmount(order.otherAmountThreshold, order.outputDecimals, 4) : null;

  return (
    <section className="threat-swap" id="buy-threat">
      <div className="threat-swap-copy">
        <span>JUPITER SWAP V2 // CANONICAL $THREAT ROUTE</span>
        <h2>Enter the network.<br /><em>Buy $THREAT.</em></h2>
        <p>RED QUEEN locks the output mint to the canonical $THREAT address, requests a fresh executable Jupiter order, and shows the expected output before your wallet can sign.</p>
        <div className="threat-swap-rules"><span>NO CUSTODY</span><span>NO HIDDEN SIGNATURE</span><span>NO XP BY VOLUME</span></div>
        <code>{THREAT_TOKEN_MINT}</code>
      </div>

      <div className="threat-swap-console">
        <header><span>SWAP CONTROL</span><strong className={available ? "is-live" : ""}>{available === null ? "CHECKING" : available ? "JUPITER READY" : "DISABLED"}</strong></header>
        <small>{reason}</small>
        {!connected ? <div className="threat-swap-connect"><p>Connect a wallet to request a live quote. Connection alone cannot execute a swap.</p><WalletMultiButton /></div> : <>
          <div className="threat-swap-input-row">
            <label><span>YOU PAY</span><input value={amount} inputMode="decimal" onChange={(event) => setAmount(event.target.value)} /></label>
            <div role="group" aria-label="Swap input asset"><button type="button" className={inputSymbol === "SOL" ? "active" : ""} onClick={() => setInputSymbol("SOL")}>SOL</button><button type="button" className={inputSymbol === "USDC" ? "active" : ""} onClick={() => setInputSymbol("USDC")}>USDC</button></div>
          </div>
          <small>Allowed range: {inputConfig.minimum}–{inputConfig.maximum} {inputSymbol}</small>
          {!order ? <button className="threat-swap-primary" type="button" onClick={() => void requestOrder()} disabled={busy || available !== true}>{busy ? "REQUESTING ORDER…" : "GET LIVE JUPITER ORDER"}</button> : <div className="threat-swap-order">
            <div><span>EXPECTED OUTPUT</span><strong>{output} $THREAT</strong><small>{minimumOutput ? `ORDER THRESHOLD ${minimumOutput}` : "JUPITER MANAGED SLIPPAGE"}</small></div>
            <dl>
              <div><dt>ROUTER</dt><dd>{order.router}</dd></div>
              <div><dt>MODE</dt><dd>{order.mode.toUpperCase()}</dd></div>
              <div><dt>PRICE IMPACT</dt><dd>{order.priceImpactPct === null ? "NOT REPORTED" : `${order.priceImpactPct}%`}</dd></div>
              <div><dt>FEE</dt><dd>{order.feeBps || 0} BPS{order.referral.enabled ? " · INTEGRATOR" : ""}</dd></div>
            </dl>
            {order.referral.enabled && <p className="threat-swap-fee-warning">Integrator fee is enabled at {order.referral.feeBps} bps and may restrict RFQ routing. It is disclosed before approval.</p>}
            <label className="threat-swap-consent"><input type="checkbox" checked={accepted} onChange={(event) => setAccepted(event.target.checked)} /><span>I verified the canonical mint, expected output and fee. I will still inspect the final wallet simulation.</span></label>
            <div className="threat-swap-actions"><button type="button" onClick={() => setOrder(null)} disabled={busy}>REFRESH ORDER</button><button type="button" className="primary" onClick={() => void executeSwap()} disabled={busy || !accepted}>{busy ? "EXECUTING…" : "SIGN & SWAP"}</button></div>
          </div>}
        </>}
        {status && <div className="threat-swap-status">{status}</div>}
        {error && <div className="threat-swap-error">{error}</div>}
        {signature && <a className="threat-swap-signature" href={`https://explorer.solana.com/tx/${signature}`} target="_blank" rel="noreferrer">VIEW CONFIRMED SWAP ↗</a>}
        {achievement && <div className="threat-swap-achievement"><strong>{achievement}</strong><small>Protocol XP is separate from survival XP and never changes BIO-SCORE.</small></div>}
        {!signedWalletSession && connected && <p className="threat-swap-signin"><Link href="/login">SIGN IN WITH THIS WALLET</Link> before swapping to record the one-time ONCHAIN INITIATE achievement.</p>}
      </div>
    </section>
  );
}
