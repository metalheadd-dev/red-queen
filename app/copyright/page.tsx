import Link from "next/link";

export default function CopyrightPage() {
  return (
    <div className="legal-page">
      <div className="container legal-shell">
        <header className="legal-hero">
          <div>
            <span>RED QUEEN // TRUST PROTOCOL 04</span>
            <h1>Original work, credited intelligence.</h1>
            <p>
              RED QUEEN combines original product work with public facts, attributed data, third-party
              infrastructure, user inputs, and AI-assisted outputs. Those layers do not all have the same owner.
            </p>
          </div>
          <aside>
            <span>ATTRIBUTION DIRECTIVE</span>
            <strong>Facts are not ours to own.</strong>
            <p>The Queen preserves source links because survival intelligence without provenance is only rumor.</p>
          </aside>
        </header>

        <div className="legal-meta">
          <span>LAST UPDATED // AUGUST 17, 2026</span>
          <span>OWNERSHIP + ATTRIBUTION NOTICE</span>
        </div>

        <main className="legal-grid">
          <section className="legal-card">
            <span>01 // PROJECT MATERIAL</span>
            <h2>What may be original RED QUEEN work.</h2>
            <p>
              Original interface code, product copy, preparedness structures, normalized signal logic, custom
              visual assets, and brand presentation may be protected where the project owns or is licensed to use
              them. This notice does not claim rights that the project does not hold.
            </p>
          </section>

          <section className="legal-card">
            <span>02 // PUBLIC INTELLIGENCE</span>
            <h2>Sources retain their data and identity.</h2>
            <p>
              USGS, NASA EONET, GDACS, NOAA SWPC, CISA KEV, WHO DON, Official Solana Status, OpenStreetMap, and
              other named providers retain their respective data rights, names, marks, terms, and attribution
              requirements. RED QUEEN normalization does not convert public facts into exclusive project property.
            </p>
          </section>

          <section className="legal-card legal-card-wide">
            <span>03 // YOUR MATERIAL</span>
            <h2>Your prompts and portraits remain yours.</h2>
            <p>
              You keep the rights you have in content you submit. You give RED QUEEN and its configured providers
              only the limited permission required to process the request, return the result, maintain the feature
              you selected, and protect the service as described in the Terms and Privacy notice. This page does
              not grant a perpetual license to train models on private conversations.
            </p>
          </section>

          <section className="legal-card">
            <span>04 // AI OUTPUT</span>
            <h2>Generated results may not be unique.</h2>
            <p>
              AI-generated reports, text, and Queen Visage images may resemble outputs produced for others and may
              contain elements that are not eligible for exclusive protection. You are responsible for reviewing
              an output before publishing or using it commercially.
            </p>
          </section>

          <section className="legal-card">
            <span>05 // COMMUNITY</span>
            <h2>Contribution is not automatic surrender.</h2>
            <p>
              Drafting a field note or lore idea with Queen does not transfer it to the project. If RED QUEEN later
              accepts community submissions for publication, the submission flow must state the requested display
              license and attribution terms before a contributor sends the work.
            </p>
          </section>

          <section className="legal-card legal-card-wide legal-control-card">
            <span>06 // MARKS + REFERENCES</span>
            <h2>No unverified registration claim.</h2>
            <p>
              This page does not claim that RED QUEEN, SOLvival, SOLvivor, Solvival Corp, or related marks are
              registered. Third-party names and marks remain the property of their respective owners. Brand
              clearance and jurisdiction-specific registrations should be reviewed separately before a commercial
              launch or major campaign.
            </p>
          </section>
        </main>

        <footer className="legal-return">
          <Link href="/license">← READ LICENSE</Link>
          <Link href="/">RETURN TO PULSE →</Link>
        </footer>
      </div>
    </div>
  );
}
