import Link from "next/link";

export default function LicensePage() {
  return (
    <div className="legal-page">
      <div className="container legal-shell">
        <header className="legal-hero">
          <div>
            <span>RED QUEEN // TRUST PROTOCOL 03</span>
            <h1>Use the system. Respect its boundaries.</h1>
            <p>
              This notice separates access to the hosted RED QUEEN product from permission to reuse its source,
              artwork, writing, or third-party components.
            </p>
          </div>
          <aside>
            <span>CURRENT SOURCE STATUS</span>
            <strong>No project-wide open-source license is published.</strong>
            <p>Publicly visible source code is not automatically permission to copy, sell, or redistribute it.</p>
          </aside>
        </header>

        <div className="legal-meta">
          <span>LAST UPDATED // AUGUST 17, 2026</span>
          <span>HOSTED PRODUCT + SOURCE NOTICE</span>
        </div>

        <main className="legal-grid">
          <section className="legal-card">
            <span>01 // HOSTED ACCESS</span>
            <h2>A limited right to use the product.</h2>
            <p>
              Subject to the Terms, you may access RED QUEEN for personal threat awareness, preparedness,
              research, and evaluation. This permission does not transfer ownership of the product, brand assets,
              source code, intelligence writing, or platform design.
            </p>
          </section>

          <section className="legal-card">
            <span>02 // SOURCE CODE</span>
            <h2>Repository visibility is not a reuse license.</h2>
            <p>
              The current repository does not include a project-wide LICENSE file. Unless a specific file says
              otherwise, no permission is granted to redistribute, sublicense, or commercially reuse original
              RED QUEEN code or assets. A future license may change this status prospectively.
            </p>
          </section>

          <section className="legal-card legal-card-wide">
            <span>03 // PERMITTED PRODUCT USE</span>
            <h2>What a SOLvivor may do.</h2>
            <div className="legal-control-grid">
              <p><b>ANALYZE</b> Ask Queen for source-aware survival reasoning and practical preparedness guidance.</p>
              <p><b>PREPARE</b> Build local checklists, save protocols, and use public threat dossiers for personal readiness.</p>
              <p><b>VERIFY</b> Connect a Solana wallet for authentication or public holder proof without giving RED QUEEN custody.</p>
              <p><b>PAY EXPLICITLY</b> Approve a clearly priced x402 operation only when the payment rail is available and understood.</p>
            </div>
          </section>

          <section className="legal-card">
            <span>04 // SYSTEM INTEGRITY</span>
            <h2>Do not abuse the network.</h2>
            <p>
              Do not bypass access or payment controls, extract credentials, disrupt providers, manipulate
              readiness evidence, impersonate other users, remove source attribution, or use automated traffic in
              a way that degrades the service. Security research requires prior authorization where applicable.
            </p>
          </section>

          <section className="legal-card">
            <span>05 // THIRD-PARTY CODE</span>
            <h2>Dependencies keep their own licenses.</h2>
            <p>
              RED QUEEN uses open-source packages, public data providers, maps, AI APIs, and Solana infrastructure.
              Their software, data, names, and services remain governed by their own licenses and terms. This
              project notice does not replace or expand those permissions.
            </p>
          </section>

          <section className="legal-card legal-card-wide legal-warning">
            <span>06 // NO HIDDEN WALLET AUTHORITY</span>
            <h2>A product license never grants transaction consent.</h2>
            <p>
              Accepting this notice, opening the site, connecting a wallet, or signing an authentication message
              does not authorize RED QUEEN to move assets. Any supported payment or transaction requires its own
              wallet approval with visible network, recipient, asset, and amount information.
            </p>
          </section>
        </main>

        <footer className="legal-return">
          <Link href="/terms">← READ TERMS</Link>
          <Link href="/copyright">READ COPYRIGHT →</Link>
        </footer>
      </div>
    </div>
  );
}
