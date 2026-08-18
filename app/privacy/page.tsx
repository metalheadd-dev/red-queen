import Link from "next/link";

const OPENAI_DATA_CONTROLS = "https://platform.openai.com/docs/models/default-usage-policies-by-endpoint";
const SUPABASE_PRIVACY = "https://supabase.com/privacy";
const SOLANA_TRANSACTIONS = "https://solana.com/docs/intro/quick-start/writing-to-network";

export default function PrivacyPage() {
  return (
    <div className="legal-page">
      <div className="container legal-shell">
        <header className="legal-hero">
          <div>
            <span>RED QUEEN // TRUST PROTOCOL 01</span>
            <h1>Privacy, without fog.</h1>
            <p>
              RED QUEEN needs context to be useful, not your secrets. This page explains what stays on your
              device, what can be stored with an account, and what leaves the terminal when you invoke an
              external service.
            </p>
          </div>
          <aside>
            <span>QUEEN DIRECTIVE</span>
            <strong>Give her context. Keep control.</strong>
            <p>Never enter a seed phrase, private key, exact home address, or confidential operational data.</p>
          </aside>
        </header>

        <div className="legal-meta">
          <span>LAST UPDATED // AUGUST 18, 2026</span>
          <span>PLAIN-LANGUAGE PRODUCT NOTICE</span>
        </div>

        <main className="legal-grid">
          <section className="legal-card legal-card-wide">
            <span>01 // TWO MEMORY LAYERS</span>
            <h2>Your device and your account are different systems.</h2>
            <div className="legal-split">
              <article>
                <b>DEVICE MEMORY</b>
                <p>
                  Broad-area context, onboarding state, preparedness checklists, saved daily actions, Queen
                  protocols, Signal Watch choices, and a generated Queen Visage are stored in your browser when
                  those features are used. They do not automatically follow you to another device.
                </p>
              </article>
              <article>
                <b>ACCOUNT MEMORY</b>
                <p>
                  If you sign in, Supabase may store your account identifier, profile, conversation history,
                  readiness evidence, BIO-SCORE records, and recent holder verification needed for gated
                  features. Your public SOLvivor Network preference is also stored with the account. Signing out ends the session; it does not erase browser memory or existing account
                  records.
                </p>
              </article>
            </div>
          </section>

          <section className="legal-card">
            <span>02 // CONTEXT</span>
            <h2>What RED QUEEN may process.</h2>
            <ul>
              <li>Email address or public Solana wallet used to authenticate.</li>
              <li>Broad city or region, survival priorities, prompts, and answers you choose to provide.</li>
              <li>Preparedness progress, saved protocols, conversation history, and evidence-based scores.</li>
              <li>Public token balances and transaction data required for holder or payment verification.</li>
              <li>Basic technical and abuse-prevention data needed to keep the service reliable.</li>
              <li>For guest AI quotas, a salted network-identifier hash, request count, and 24-hour reset time. Guest prompts and responses are not stored in the account message table.</li>
            </ul>
          </section>

          <section className="legal-card">
            <span>03 // PURPOSE</span>
            <h2>Why the context is used.</h2>
            <ul>
              <li>Prioritize signals that may matter to your chosen area and concerns.</li>
              <li>Generate survival analysis, action plans, and preparedness guidance.</li>
              <li>Restore account history and verify earned readiness evidence.</li>
              <li>Publish an apocalyptic alias, earned XP, level, BIO-SCORE, and broad activity band only when you opt into the SOLvivor readiness board.</li>
              <li>Confirm $THREAT holder access without taking custody of assets.</li>
              <li>Prevent abuse, diagnose failures, and operate paid intelligence requests.</li>
            </ul>
          </section>

          <section className="legal-card legal-card-wide">
            <span>04 // QUEEN AGENT + VISAGE</span>
            <h2>AI requests leave the browser only when you ask the Queen to act.</h2>
            <p>
              Prompts and relevant context are sent to the configured AI provider to moderate and generate a
              response. RED QUEEN currently uses OpenAI APIs when configured and requests non-persistent response
              state where supported. OpenAI states that API inputs and outputs are not used to train its models by
              default; provider abuse-monitoring and retention rules may still apply. Review the current{" "}
              <a href={OPENAI_DATA_CONTROLS}>OpenAI API data controls</a>.
            </p>
            <p>
              When you invoke Queen, a bounded Device Survival Memory snapshot may accompany the prompt so she can
              avoid repeating your active action and recognize plan progress. It can include one active action, up
              to four plan summaries, baseline completion count, and Signal Watch categories. RED QUEEN does not
              transmit your entire browser storage.
            </p>
            <p>
              Queen Visage is optional and reserved for verified $THREAT holders. When you press Generate, the
              selected portrait is sent to the configured image model for that generation request. The generated
              image is returned to your browser and stored locally; RED QUEEN does not add the source portrait or
              generated result to your Supabase profile. Provider-side processing rules still apply.
            </p>
          </section>

          <section className="legal-card">
            <span>05 // MAP + CHAIN READS</span>
            <h2>External infrastructure sees only what the feature needs.</h2>
            <p>
              Setting Local View sends the city or region you enter to the configured geocoder, currently
              OpenStreetMap Nominatim by default. Public Solana RPC providers receive public-chain queries such as
              wallet and token-balance reads. Supabase provides authentication and account storage; see its{" "}
              <a href={SUPABASE_PRIVACY}>privacy notice</a>.
            </p>
          </section>

          <section className="legal-card">
            <span>06 // x402 RECEIPTS</span>
            <h2>Onchain payments are explicit and public.</h2>
            <p>
              An x402 operation is requested only after a wallet approval. The configured facilitator and Solana
              infrastructure process the payment request and proof. A settled transaction has a public signature
              that can be inspected onchain. RED QUEEN may store the operation ID, product, request and payment
              fingerprints, payer, settlement proof, and delivered output to prevent duplicate charges and restore
              the receipt. Learn how <a href={SOLANA_TRANSACTIONS}>Solana transactions</a> work.
            </p>
          </section>

          <section className="legal-card legal-card-wide legal-control-card">
            <span>07 // YOUR CONTROLS</span>
            <h2>You decide what the Queen remembers.</h2>
            <div className="legal-control-grid">
              <p><b>DO NOT SHARE</b> Seed phrases, private keys, exact addresses, passwords, or confidential files.</p>
              <p><b>REMOVE LOCALLY</b> Use in-product Remove controls where available or clear this site&apos;s browser storage.</p>
              <p><b>SEPARATE APPROVAL</b> Connecting or signing in with a wallet never authorizes a payment.</p>
              <p><b>PUBLIC BOARD OPT-IN</b> Existing and new accounts remain private until you join. Leaving removes your profile from the public board.</p>
              <p><b>NO DATA BROKERS</b> Solvival Corp does not sell or rent identity data, wallet addresses, or Queen conversations.</p>
            </div>
          </section>
        </main>

        <footer className="legal-return">
          <Link href="/">← RETURN TO PULSE</Link>
          <Link href="/terms">READ TERMS →</Link>
        </footer>
      </div>
    </div>
  );
}
