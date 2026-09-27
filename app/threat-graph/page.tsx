import type { Metadata } from "next";
import Link from "next/link";
import { fetchSignalGrid, findVerifiedSignalsByIds } from "@/lib/signal-engine";
import { buildThreatGraph } from "@/lib/threat-graph";
import ThreatCaseDesk from "@/components/ThreatCaseDesk";
import styles from "./threat-graph.module.css";

export const metadata: Metadata = {
  title: "Threat Graph | RQ Corp",
  description: "Trace verified signals to their primary sources, freshness, potential exposure and practical next checks.",
};
export const dynamic = "force-dynamic";

export default async function ThreatGraphPage({ searchParams }: { searchParams: Promise<{ id?: string }> }) {
  const params = await searchParams;
  const id = typeof params.id === "string" && /^[a-z0-9._:-]{1,140}$/i.test(params.id) ? params.id : "";
  const now = new Date();
  const grid = id ? null : await fetchSignalGrid();
  const signals = id ? await findVerifiedSignalsByIds([id]) : grid!.signals.slice(0, 24);
  const graphs = signals.flatMap((signal) => {
    const graph = buildThreatGraph(signal, now);
    return graph ? [graph] : [];
  }).slice(0, id ? 1 : 8);
  return <main className={styles.page}>
    <div className={styles.frame}>
      <div className={styles.eyebrow}>RQ CORP / RED QUEEN INTELLIGENCE / THREAT GRAPH V1</div>
      <h1>Follow the <em>evidence.</em></h1>
      <p className={styles.lead}>A verified report is the start of an assessment, not proof that you are personally at risk. This chain separates source facts from possible exposure and recommended checks.</p>
      <div className={styles.controls}><Link href="/pulse#signal-watch">← SIGNAL WATCH</Link><Link href="/red-queen">ASK RED QUEEN →</Link></div>
      <p className={styles.coverage}>SCAN {now.toISOString()} · {grid ? `${grid.coverage.online}/${grid.coverage.total} SOURCES REACHABLE` : "SELECTED SIGNAL"} · {graphs.length} CHAINS · NO LIVE MATCH DOES NOT MEAN SAFE</p>
      {graphs.length ? graphs.map((graph) => <article className={styles.card} key={graph.signalId}>
        <div className={styles.cardTop}><span>{graph.kind.replaceAll("_", " ")}</span><span className={graph.status === "CURRENT" ? styles.current : styles.stale}>{graph.status}</span></div>
        <h2>{graph.name}</h2>
        <p className={styles.timestamp}>OBSERVED {graph.observedAt} · SOURCE UPDATED {graph.updatedAt} · RQ SOURCE SCORE {graph.confidence}/100 · REVIEW AFTER {graph.expiresAt}</p>
        <ol className={styles.chain}>{graph.nodes.map((node) => <li key={node.id}><span>{node.stage}</span><p>{node.label}</p><small>{node.verified ? "SOURCE-BACKED" : "INFERENCE / GUIDANCE"}</small></li>)}</ol>
        <p className={styles.caveat}>{graph.caveat}</p>
        <a className={styles.source} href={graph.sourceUrl} target="_blank" rel="noopener noreferrer">OPEN PRIMARY SOURCE ↗</a>
        {graph.status === "CURRENT" && <div className={styles.paidOption}><p>Need a portable decision record? The source chain above is free. Queen can package this incident with uncertainty, practical steps, export and a Solana receipt.</p><Link href={`/reports?product=incident&signalId=${encodeURIComponent(graph.signalId)}`}>REVIEW OPTIONAL DOSSIER · 0.02 USDC →</Link></div>}
      </article>) : <div className={styles.empty}>No matching current-source record was returned. The feed may be delayed, offline or outside coverage. Check the primary authority before making a decision.</div>}
      <ThreatCaseDesk available={graphs} />
    </div>
  </main>;
}
