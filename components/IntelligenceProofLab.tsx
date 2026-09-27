"use client";

import { useEffect, useMemo, useState } from "react";
import dynamic from "next/dynamic";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import {
  PublicKey,
  TransactionInstruction,
  TransactionMessage,
  VersionedTransaction,
} from "@solana/web3.js";
import {
  buildIntelligenceProofMemo,
  normalizeProofDraft,
  parseIntelligenceProofMemo,
  parseProofHistory,
  RQ_PROOF_DRAFT_KEY,
  RQ_PROOF_HISTORY_KEY,
  RQ_PROOF_MAX_CONTENT,
  RQ_PROOF_TYPES,
  type RqProofRecord,
  type RqProofType,
} from "@/lib/intelligence-proof";
import styles from "@/app/proofs/page.module.css";

const WalletMultiButton = dynamic(
  () => import("@solana/wallet-adapter-react-ui").then((module) => module.WalletMultiButton),
  { ssr: false },
);

const MEMO_PROGRAM = new PublicKey("MemoSq4gqABAXKb96qnH8TysNcWxMyWCqXgDLGmfcHr");

function short(value: string) {
  return value.length > 20 ? `${value.slice(0, 9)}…${value.slice(-9)}` : value;
}

async function sha256(value: string) {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value));
  return Array.from(new Uint8Array(digest), (byte) => byte.toString(16).padStart(2, "0")).join("");
}

export default function IntelligenceProofLab() {
  const { connection } = useConnection();
  const { connected, publicKey, sendTransaction } = useWallet();
  const [title, setTitle] = useState("RED QUEEN assessment");
  const [type, setType] = useState<RqProofType>("QUEEN_ASSESSMENT");
  const [content, setContent] = useState("");
  const [hash, setHash] = useState("");
  const [accepted, setAccepted] = useState(false);
  const [busy, setBusy] = useState(false);
  const [status, setStatus] = useState("PASTE OR IMPORT AN IMPORTANT RQ RESULT");
  const [history, setHistory] = useState<RqProofRecord[]>([]);
  const [verifySignature, setVerifySignature] = useState("");
  const [verifyContent, setVerifyContent] = useState("");
  const [verifyStatus, setVerifyStatus] = useState("");

  useEffect(() => {
    setHistory(parseProofHistory(localStorage.getItem(RQ_PROOF_HISTORY_KEY)));
    const draft = normalizeProofDraft(JSON.parse(sessionStorage.getItem(RQ_PROOF_DRAFT_KEY) || "null"));
    if (draft) {
      setTitle(draft.title);
      setType(draft.type);
      setContent(draft.content);
      setStatus("RQ RESULT IMPORTED LOCALLY · REVIEW BEFORE HASHING");
      sessionStorage.removeItem(RQ_PROOF_DRAFT_KEY);
    }
  }, []);

  useEffect(() => {
    let active = true;
    if (content.trim().length < 8) {
      setHash("");
      return;
    }
    void sha256(content.trim()).then((next) => { if (active) setHash(next); });
    return () => { active = false; };
  }, [content]);

  const previewMemo = useMemo(() => {
    if (!hash) return "";
    try { return buildIntelligenceProofMemo({ hash, type, anchoredAt: new Date().toISOString() }); }
    catch { return ""; }
  }, [hash, type]);

  async function anchorProof() {
    if (!publicKey || !hash || !accepted || busy) return;
    setBusy(true);
    setStatus("SIMULATING HASH-ONLY MEMO · NO CONTENT LEAVES THIS DEVICE");
    try {
      const anchoredAt = new Date().toISOString();
      const memo = buildIntelligenceProofMemo({ hash, type, anchoredAt });
      const latest = await connection.getLatestBlockhash("confirmed");
      const instruction = new TransactionInstruction({
        programId: MEMO_PROGRAM,
        keys: [{ pubkey: publicKey, isSigner: true, isWritable: false }],
        data: Buffer.from(memo, "utf8"),
      });
      const message = new TransactionMessage({
        payerKey: publicKey,
        recentBlockhash: latest.blockhash,
        instructions: [instruction],
      }).compileToV0Message();
      const transaction = new VersionedTransaction(message);
      const simulation = await connection.simulateTransaction(transaction, {
        sigVerify: false,
        replaceRecentBlockhash: true,
        commitment: "confirmed",
      });
      if (simulation.value.err) throw new Error("Solana simulation rejected the proof transaction.");

      setStatus("WALLET REVIEW REQUIRED · ONE MEMO · NETWORK FEE ONLY");
      const signature = await sendTransaction(transaction, connection, { skipPreflight: false, maxRetries: 3 });
      setStatus("PROOF SENT · WAITING FOR CONFIRMATION");
      const confirmation = await connection.confirmTransaction({
        signature,
        blockhash: latest.blockhash,
        lastValidBlockHeight: latest.lastValidBlockHeight,
      }, "confirmed");
      if (confirmation.value.err) throw new Error("Solana rejected the proof transaction.");

      const record: RqProofRecord = {
        id: crypto.randomUUID(), title: title.trim().slice(0, 100), type, hash, memo,
        signature, wallet: publicKey.toBase58(), anchoredAt,
      };
      const next = [record, ...history].slice(0, 20);
      localStorage.setItem(RQ_PROOF_HISTORY_KEY, JSON.stringify(next));
      setHistory(next);
      setAccepted(false);
      setStatus("PROOF CONFIRMED · CONTENT REMAINS OFF-CHAIN");
    } catch (error) {
      setStatus(error instanceof Error ? error.message : "Proof transaction failed or was rejected.");
    } finally {
      setBusy(false);
    }
  }

  async function verifyProof() {
    const signature = verifySignature.trim();
    const value = verifyContent.trim();
    if (signature.length < 64 || value.length < 8) return;
    setVerifyStatus("READING CONFIRMED SOLANA TRANSACTION…");
    try {
      const [expectedHash, transaction] = await Promise.all([
        sha256(value),
        connection.getParsedTransaction(signature, { commitment: "confirmed", maxSupportedTransactionVersion: 0 }),
      ]);
      if (!transaction || transaction.meta?.err) throw new Error("Confirmed transaction was not found.");
      const memos = transaction.transaction.message.instructions.flatMap((instruction) => {
        if (!("parsed" in instruction) || instruction.program !== "spl-memo") return [];
        return [String(instruction.parsed)];
      });
      const matched = memos.map(parseIntelligenceProofMemo).find((proof) => proof?.hash === expectedHash);
      setVerifyStatus(matched
        ? `VERIFIED MATCH · ${matched.type} · ${matched.anchoredAt}`
        : "NO MATCH · THIS CONTENT DOES NOT MATCH AN RQ_PROOF_V1 MEMO IN THAT TRANSACTION");
    } catch (error) {
      setVerifyStatus(error instanceof Error ? error.message : "Proof verification failed.");
    }
  }

  return (
    <div className={styles.lab}>
      <section className={styles.builder}>
        <div className={styles.sectionHead}><span>01 // BUILD PRIVATE FINGERPRINT</span><strong>Content stays in this browser.</strong></div>
        <label>ARTIFACT TITLE<input value={title} maxLength={100} onChange={(event) => setTitle(event.target.value)} /></label>
        <label>ARTIFACT TYPE<select value={type} onChange={(event) => setType(event.target.value as RqProofType)}>{RQ_PROOF_TYPES.map((item) => <option key={item}>{item}</option>)}</select></label>
        <label>RQ RESULT OR BLUEPRINT<textarea value={content} maxLength={RQ_PROOF_MAX_CONTENT} onChange={(event) => setContent(event.target.value)} placeholder="Paste the exact Red Queen result you want to fingerprint." /></label>
        <div className={styles.hashBox}><span>SHA-256</span><code>{hash || "WAITING FOR CONTENT"}</code><small>The title and full result are not included in the transaction.</small></div>
        <div className={styles.memoPreview}><span>PUBLIC MEMO PREVIEW</span><code>{previewMemo || "RQ_PROOF_V1|sha256:…"}</code></div>
        {!connected ? <WalletMultiButton /> : (
          <>
            <label className={styles.consent}><input type="checkbox" checked={accepted} onChange={(event) => setAccepted(event.target.checked)} /><span>I understand this proves that my wallet anchored this hash at a time. It does not prove the assessment is true, complete or safe.</span></label>
            <button className={styles.primary} type="button" disabled={!hash || title.trim().length < 2 || !accepted || busy} onClick={() => void anchorProof()}>{busy ? "PROCESSING…" : "ANCHOR HASH ON SOLANA"}</button>
          </>
        )}
        <p className={styles.status}>{status}</p>
      </section>

      <aside className={styles.boundary}>
        <div className={styles.sectionHead}><span>PUBLIC / PRIVATE BOUNDARY</span><strong>Proof, not surveillance.</strong></div>
        <div><span>PUBLIC ON SOLANA</span><p>Wallet, transaction time, protocol version, artifact type and SHA-256 hash.</p></div>
        <div><span>STAYS OFF-CHAIN</span><p>Full Queen response, location, household, plan, title, sources and personal context.</p></div>
        <div><span>PROVES</span><p>A wallet anchored one exact opaque artifact version at a specific time.</p></div>
        <div><span>DOES NOT PROVE</span><p>Truth, safety, source quality, identity, ownership of facts or future outcomes.</p></div>
      </aside>

      <section className={styles.verify}>
        <div className={styles.sectionHead}><span>02 // VERIFY</span><strong>Recompute locally. Compare on-chain.</strong></div>
        <label>TRANSACTION SIGNATURE<input value={verifySignature} onChange={(event) => setVerifySignature(event.target.value)} placeholder="Solana signature" /></label>
        <label>ORIGINAL CONTENT<textarea value={verifyContent} onChange={(event) => setVerifyContent(event.target.value)} placeholder="Paste the exact original artifact." /></label>
        <button type="button" onClick={() => void verifyProof()} disabled={verifySignature.trim().length < 64 || verifyContent.trim().length < 8}>VERIFY HASH</button>
        {verifyStatus && <p className={styles.status}>{verifyStatus}</p>}
      </section>

      <section className={styles.history}>
        <div className={styles.sectionHead}><span>DEVICE HISTORY</span><strong>{history.length} anchored proof{history.length === 1 ? "" : "s"}</strong></div>
        {history.length ? history.map((record) => <article key={record.id}><div><span>{record.type}</span><strong>{record.title}</strong><small>{new Date(record.anchoredAt).toLocaleString()} · {short(record.wallet)}</small></div><code>{short(record.hash)}</code><a href={`https://explorer.solana.com/tx/${record.signature}`} target="_blank" rel="noreferrer">EXPLORER ↗</a></article>) : <p>No proof has been anchored from this device.</p>}
      </section>
    </div>
  );
}
