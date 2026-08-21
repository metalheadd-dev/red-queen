import Link from "next/link";

export default function TermsPage() {
  return (
    <div className="legal-page">
      <div className="container legal-shell">
        <header className="legal-hero">
          <div>
            <span>RED QUEEN // TRUST PROTOCOL 02</span>
            <h1>Clear terms for a dangerous world.</h1>
            <p>
              RED QUEEN is survival intelligence: verified signals, practical preparation, and AI-assisted
              reasoning. She helps you think and act. She does not replace emergency services or professional
              judgment.
            </p>
          </div>
          <aside>
            <span>SOLVIVOR COMPACT</span>
            <strong>Intelligence is the last line of defense.</strong>
            <p>Verify critical information. Protect your keys. Approve only actions you understand.</p>
          </aside>
        </header>

        <div className="legal-meta">
          <span>LAST UPDATED // AUGUST 18, 2026</span>
          <span>PLAIN-LANGUAGE PRODUCT TERMS</span>
        </div>

        <main className="legal-grid">
          <section className="legal-card">
            <span>01 // ACCESS</span>
            <h2>Who may use the terminal.</h2>
            <p>
              You must be at least 18 and legally able to accept these terms. You are responsible for complying
              with laws that apply where you live and for securing the email, wallet, and device used to access
              RED QUEEN.
            </p>
          </section>

          <section className="legal-card">
            <span>02 // ACCEPTABLE USE</span>
            <h2>Use intelligence to reduce harm.</h2>
            <p>
              Do not use the service to harm others, evade lawful authorities, compromise infrastructure, spread
              knowingly false emergency information, bypass access controls, or interfere with RED QUEEN and its
              data providers. Do not upload content you lack permission to process.
            </p>
          </section>

          <section className="legal-card legal-card-wide legal-warning">
            <span>03 // SURVIVAL LIMIT</span>
            <h2>RED QUEEN is not an emergency authority.</h2>
            <p>
              Threat feeds can be delayed, incomplete, duplicated, misclassified, or unavailable. AI output can
              also be wrong. In an active emergency, follow local authorities and emergency services. Verify
              medical, legal, financial, security, and life-safety decisions with qualified professionals and
              authoritative local sources.
            </p>
          </section>

          <section className="legal-card">
            <span>04 // $THREAT</span>
            <h2>Access utility, not competence.</h2>
            <p>
              RED QUEEN may verify public $THREAT holdings to unlock context depth, Signal Watch capacity, usage
              allowances, and threshold-gated creative features such as Queen Visage at 500,000 $THREAT. Holdings never create BIO-SCORE, prove survival
              competence, guarantee service availability, or promise financial value, yield, or rewards.
            </p>
          </section>

          <section className="legal-card">
            <span>05 // WALLET</span>
            <h2>Identity is not payment consent.</h2>
            <p>
              Connecting a wallet or signing in with Solana does not transfer funds and does not authorize future
              transactions. RED QUEEN never needs your private key or seed phrase. Your wallet presents each
              transaction for approval, and you remain responsible for checking the network, asset, amount, and
              recipient before signing.
            </p>
          </section>

          <section className="legal-card legal-card-wide">
            <span>06 // x402 COMPUTE</span>
            <h2>Pay for a declared output, not a vague promise.</h2>
            <p>
              Paid x402 operations show a price and intended output before approval. Settlement uses USDC on the
              displayed Solana network and may involve a third-party facilitator. Network fees, wallet behavior,
              facilitator availability, and chain finality are outside RED QUEEN&apos;s direct control. A request can
              fail before settlement; the platform is designed to gate payment when settlement or receipt storage
              is unavailable and to bind a delivered output to its operation receipt.
            </p>
          </section>

          <section className="legal-card">
            <span>07 // CONTENT + IDENTITY</span>
            <h2>Keep rights to what you submit.</h2>
            <p>
              You keep your rights in prompts and portraits you provide. You grant the service and its configured
              providers the limited permission needed to process them and return the requested output. Do not
              submit another person&apos;s portrait without permission. Generated content may not be unique.
            </p>
          </section>

          <section className="legal-card">
            <span>08 // AVAILABILITY</span>
            <h2>The system will evolve.</h2>
            <p>
              Features, sources, models, token thresholds, prices, and integrations may change, pause, or be
              discontinued. We may restrict access to protect users, providers, or the platform. Material terms
              changes should be reflected by a new date on this page.
            </p>
          </section>

          <section className="legal-card">
            <span>09 // SOLVIVOR NETWORK</span>
            <h2>Public readiness is always opt-in.</h2>
            <p>
              The community board ranks earned XP and displays evidence-based BIO-SCORE under your chosen
              apocalyptic alias. It does not display your email or wallet. You may leave the board from your
              profile. Rankings are a platform progression signal, not certification, financial value, or proof
              that someone can safely manage a real emergency.
            </p>
          </section>

          <section className="legal-card legal-card-wide">
            <span>10 // RESPONSIBILITY + APPLICABLE LAW</span>
            <h2>Use RED QUEEN as decision support.</h2>
            <p>
              The service is provided on an as-available basis to the extent permitted by law. You remain
              responsible for actions taken from its information and for losses caused by sharing credentials,
              approving the wrong transaction, or ignoring authoritative warnings. These terms do not remove
              consumer rights or other rights that cannot legally be waived, and your use remains subject to
              applicable law. No universal arbitration agreement is created by this page.
            </p>
          </section>
        </main>

        <footer className="legal-return">
          <Link href="/privacy">← READ PRIVACY</Link>
          <Link href="/">RETURN TO PULSE →</Link>
        </footer>
      </div>
    </div>
  );
}
