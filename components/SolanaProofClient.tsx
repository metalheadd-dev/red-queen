"use client";

import { useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import styles from "./SolanaProofClient.module.css";

interface PaymentStatus { available: boolean; checkedAt: string; network: string; facilitator: string; reason: string | null }
interface Receipt { operation_id: string; product_id: string; status: string; network: string; price: string; transaction_signature: string | null; delivered_at: string }

export default function SolanaProofClient() {
  const { session } = useAuth();
  const [status, setStatus] = useState<PaymentStatus | null>(null);
  const [receipts, setReceipts] = useState<Receipt[]>([]);
  const [message, setMessage] = useState("Sign in with the paying wallet to see private payment receipts.");

  useEffect(() => {
    let active = true;
    fetch("/api/x402/status", { cache: "no-store" })
      .then((response) => response.json())
      .then((data) => { if (active) setStatus(data); })
      .catch(() => { if (active) setStatus({ available: false, checkedAt: "", network: "", facilitator: "", reason: "Status check unavailable" }); });
    return () => { active = false; };
  }, []);

  useEffect(() => {
    const token = session?.access_token;
    if (!token) { setReceipts([]); setMessage("Sign in with the paying wallet to see private payment receipts."); return; }
    let active = true;
    fetch("/api/profile/x402-receipts", { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" })
      .then(async (response) => { const data = await response.json(); if (!response.ok) throw new Error(data.error || "Receipt lookup unavailable"); return data; })
      .then((data) => {
        if (!active) return;
        setReceipts(Array.isArray(data.receipts) ? data.receipts : []);
        setMessage(data.walletSessionRequired ? "This session is not the paying Solana wallet. Sign in with that wallet to view its receipts." : "No payment receipts found for this wallet yet.");
      })
      .catch((error) => { if (active) { setReceipts([]); setMessage(error instanceof Error ? error.message : "Receipt lookup unavailable"); } });
    return () => { active = false; };
  }, [session?.access_token]);

  return <section className={styles.panel} id="solana-proof" aria-label="Solana payment proof">
    <div className={styles.head}><span>RQ CORP / SOLANA PROOF</span><h2>Every paid operation leaves a trace.</h2><p>Service readiness is not a payment. A receipt below appears only after an operation was delivered and stored for your paying wallet.</p></div>
    <div className={styles.status}><span>PAYMENT RAIL</span><strong className={status?.available ? styles.online : styles.offline}>{status === null ? "CHECKING" : status.available ? "READY" : "UNAVAILABLE"}</strong><small>{status?.network || "SOLANA NETWORK PENDING"} · {status?.checkedAt || "NOT CHECKED"}</small>{status?.reason && <p>{status.reason}</p>}</div>
    <div className={styles.receipts}><h3>My receipts</h3>{receipts.length ? <ol>{receipts.map((receipt) => {
      const signature = receipt.transaction_signature;
      const explorer = signature && /^[1-9A-HJ-NP-Za-km-z]{80,90}$/.test(signature)
        ? `https://explorer.solana.com/tx/${signature}` : null;
      return <li key={receipt.operation_id}><div><b>{receipt.product_id.replaceAll("_", " ")}</b><span>{receipt.price} · {receipt.network}</span></div><small>DELIVERED {receipt.delivered_at} · OP {receipt.operation_id}</small>{explorer ? <a href={explorer} target="_blank" rel="noopener noreferrer">VERIFY ON SOLANA ↗</a> : <em>ON-CHAIN SIGNATURE NOT STORED</em>}</li>;
    })}</ol> : <p>{message}</p>}</div>
    <small className={styles.boundary}>Private receipts are not published. We do not put your preparedness profile, location or conversation on-chain.</small>
  </section>;
}
