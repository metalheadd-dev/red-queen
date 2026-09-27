import type { Metadata } from "next";
import IntelligenceProofLab from "@/components/IntelligenceProofLab";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "RQ Proof Protocol | RQ Corp",
  description: "Anchor and verify privacy-preserving hashes of important RED QUEEN outputs on Solana.",
};

export default function ProofProtocolPage() {
  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.grid} aria-hidden="true" />
        <div className={styles.heroCopy}>
          <p>RQ CORP / SOLANA / PROOF PROTOCOL V1</p>
          <h1>Make the result <span>verifiable.</span></h1>
          <div className={styles.lead}>Fingerprint an important Queen assessment, comparison, protocol or agent blueprint. Only its hash reaches Solana. The intelligence stays with you.</div>
          <ul><li>NO FULL REPORT ON-CHAIN</li><li>NO TOKEN REWARD FOR PAYING</li><li>ONE EXPLICIT WALLET APPROVAL</li></ul>
        </div>
      </section>
      <IntelligenceProofLab />
      <section className={styles.flywheel}>
        <p>RQ INTELLIGENCE FLYWHEEL</p>
        <div>{["SIGNAL", "QUEEN ASSESSMENT", "HASH PROOF", "AGENT POLICY", "NEW WATCH", "SOURCE DELTA"].map((item, index) => <article key={item}><span>{String(index + 1).padStart(2, "0")}</span><strong>{item}</strong>{index < 5 ? <b>→</b> : null}</article>)}</div>
        <small>Later the same proof ID can seed a simulation, community review or game event without exposing the private source artifact.</small>
      </section>
    </main>
  );
}
