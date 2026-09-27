import type { Metadata } from "next";
import AgentStudioPrototype from "@/components/AgentStudioPrototype";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "Agent Studio | RQ Corp",
  description: "Design bounded personal agents under RED QUEEN oversight.",
};

export default function AgentsPage() {
  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.grid} aria-hidden="true" />
        <div className={styles.heroInner}>
          <p>RQ CORP / AGENT STUDIO / EXPERIMENT 01</p>
          <h1>Build beneath <span>the Queen.</span></h1>
          <div className={styles.lead}>Create a narrow agent blueprint with explicit tools, memory and payment boundaries. Red Queen remains the final intelligence and security layer.</div>
          <div className={styles.state}><strong>PROTOTYPE</strong><span>LOCAL BLUEPRINTS</span><span>NO AUTONOMOUS SPENDING</span><span>NO DEPLOYMENT YET</span></div>
        </div>
      </section>
      <section className={styles.flywheel}>
        <header><span>NON-GAME ECOSYSTEM LOOP</span><h2>Useful work creates the next useful action.</h2></header>
        <div>{[
          ["01", "OBSERVE", "Threat Graph or Signal Watch finds a source-backed revision."],
          ["02", "ASSESS", "Queen turns evidence into a bounded decision and plan."],
          ["03", "PROVE", "The user may anchor only the artifact hash on Solana."],
          ["04", "DELEGATE", "A personal agent watches the approved subject and permissions."],
          ["05", "TRANSACT", "Fresh evidence or a plan update can be purchased through x402."],
          ["06", "RETURN", "The new result becomes another revision, proof or simulation seed."],
        ].map(([number,title,body]) => <article key={number}><span>{number}</span><strong>{title}</strong><p>{body}</p></article>)}</div>
      </section>
      <AgentStudioPrototype />
      <section className={styles.phases}>
        <div><span>LIVE NOW</span><strong>Blueprint + holder capacity + proof handoff</strong><p>Design, save and export locally. Read current `$THREAT` clearance. Anchor an optional hash through the Proof Protocol.</p></div>
        <div><span>NEXT</span><strong>Bounded simulation</strong><p>Run one blueprint against mock signals with no background jobs, external calls or payment authority.</p></div>
        <div><span>LATER</span><strong>8004 registration + hosted runtime</strong><p>Only after server enforcement, quotas, audit logs, deletion, abuse controls and explicit x402 approvals exist.</p></div>
      </section>
    </main>
  );
}
