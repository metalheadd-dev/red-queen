"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import type { ThreatGraph } from "@/lib/threat-graph";
import { caseChange, parseThreatCases, saveThreatCase, THREAT_CASEBOOK_KEY, type SavedThreatCase } from "@/lib/threat-casebook";
import styles from "./ThreatCaseDesk.module.css";

export default function ThreatCaseDesk({ available }: { available: ThreatGraph[] }) {
  const [saved, setSaved] = useState<SavedThreatCase[]>([]);
  const [current, setCurrent] = useState<ThreatGraph[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [checking, setChecking] = useState(false);
  const [checkError, setCheckError] = useState("");

  useEffect(() => {
    try { setSaved(parseThreatCases(localStorage.getItem(THREAT_CASEBOOK_KEY))); } catch { setSaved([]); }
    setLoaded(true);
  }, []);

  useEffect(() => {
    if (!loaded || !saved.length) { setCurrent([]); return; }
    const controller = new AbortController();
    setChecking(true); setCheckError("");
    fetch(`/api/threat-graph?ids=${encodeURIComponent(saved.map((item) => item.id).join(","))}`, { cache: "no-store", signal: controller.signal })
      .then(async (response) => { if (!response.ok) throw new Error("Source check unavailable"); return response.json(); })
      .then((data) => { if (!controller.signal.aborted) setCurrent(Array.isArray(data.graphs) ? data.graphs : []); })
      .catch(() => { if (!controller.signal.aborted) setCheckError("Could not reach the source grid. Case status is unknown, not safe."); })
      .finally(() => { if (!controller.signal.aborted) setChecking(false); });
    return () => controller.abort();
  }, [loaded, saved]);

  function persist(next: SavedThreatCase[]) {
    try { localStorage.setItem(THREAT_CASEBOOK_KEY, JSON.stringify(next)); setSaved(next); }
    catch { setCheckError("This browser could not save the case. Check available storage or private-browsing settings."); }
  }

  return <section className={styles.desk} aria-label="Saved threat cases">
    <div className={styles.heading}><div><span>RQ CORP / CASE DESK</span><h2>Follow a signal. Pay only if you need depth.</h2><p>Keep up to six source-backed cases on this device. Open the page again to check for a source revision. This is not background monitoring.</p></div><strong>{loaded ? saved.length : "·"}/6 FILES</strong></div>
    {!!available.length && <div className={styles.candidates}>{available.slice(0, 8).map((graph) => <div key={graph.signalId}>
      <span>{graph.kind.replaceAll("_", " ")} · {graph.status}</span><strong>{graph.name}</strong>
      <button type="button" disabled={!loaded || graph.status !== "CURRENT" || saved.some((item) => item.id === graph.signalId)} onClick={() => persist(saveThreatCase(saved, graph))}>
        {saved.some((item) => item.id === graph.signalId) ? "FOLLOWING" : graph.status !== "CURRENT" ? "SOURCE TOO OLD" : "SAVE CASE +"}
      </button>
    </div>)}</div>}
    {!!saved.length && <div className={styles.files}><h3>My case files</h3>{saved.map((entry) => {
      const graph = current.find((item) => item.signalId === entry.id);
      const state = checkError || checking ? "CHECKING" : caseChange(entry, graph);
      return <article key={entry.id}>
        <div><span className={state === "UPDATED" ? styles.updated : ""}>{state.replaceAll("_", " ")}</span><strong>{entry.name}</strong><small>LAST REVIEWED {entry.savedAt}</small></div>
        <p>{state === "UPDATED" ? "The source record changed since your last review. Inspect the free evidence first." : state === "UNCHANGED" ? "No new source revision. You do not need to buy the same dossier again." : state === "STALE" ? "The source record is outside its freshness window. No paid dossier is offered." : state === "NOT_IN_FEED" ? "The record is no longer in the reachable source window. This is not an all-clear." : "Checking current source availability..."}</p>
        <div className={styles.actions}>
          <Link href={`/threat-graph?id=${encodeURIComponent(entry.id)}`}>OPEN EVIDENCE ↗</Link>
          {state === "UPDATED" && graph && <><button type="button" onClick={() => persist(saveThreatCase(saved, graph))}>MARK REVIEWED</button><Link href={`/reports?product=incident&signalId=${encodeURIComponent(entry.id)}`}>OPTIONAL DOSSIER · 0.02 USDC ↗</Link></>}
          <button type="button" onClick={() => persist(saved.filter((item) => item.id !== entry.id))}>REMOVE</button>
        </div>
      </article>;
    })}</div>}
    {!saved.length && loaded && <p className={styles.empty}>No cases saved yet. Choose one verified, current signal above.</p>}
    {checkError && <p className={styles.error} role="status">{checkError}</p>}
    <small className={styles.boundary}>Free source facts and emergency guidance remain available without payment. Saving a case never connects a wallet or authorizes a transaction.</small>
  </section>;
}
