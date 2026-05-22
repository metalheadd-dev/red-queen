"use client";
import SolvivorIcon from "@/components/SolvivorIcon";

export default function SurvivalKitPage() {
  return (
    <div style={{ padding: "80px 24px", minHeight: "100vh" }}>
      <div className="container">
        <div style={{ marginBottom: "48px", textAlign: "center" }}>
          <SolvivorIcon size={64} />
          <h1 className="glow-text" style={{ fontSize: "32px", marginTop: "24px" }}>SURVIVAL USER KIT</h1>
          <p className="dim" style={{ fontFamily: "var(--mono)", letterSpacing: "0.2em", marginTop: "12px" }}>
            OFFICIAL WHITEPAPER // SOLVIVOR CORP INTELLIGENCE
          </p>
        </div>

        <div className="bento-grid bento-1" style={{ maxWidth: "800px", margin: "0 auto" }}>
          
          {/* SECTION 1 */}
          <div className="bento-card">
            <h2 className="bento-title accent" style={{ marginBottom: "24px" }}>1. What Is This App?</h2>
            <div className="bento-desc">
              <p style={{ marginBottom: "16px" }}>
                This platform is an advanced AI survival assessment tool powered by the <strong>Red Queen</strong>. It is designed to evaluate human readiness for civilization collapse, extinction-level events, and daily survival threats.
              </p>
              <p>
                The Red Queen is not a standard assistant. She is a cold, calculating evaluator with the persona of a bunker expert and military strategist. She answers your questions but judges your instincts, delivering a dynamic <strong>[BIO-SCORE]</strong> for every interaction.
              </p>
            </div>
          </div>

          {/* SECTION 2 */}
          <div className="bento-card">
            <h2 className="bento-title accent" style={{ marginBottom: "24px" }}>2. What Problem Does It Solve?</h2>
            <div className="bento-desc">
              <p style={{ marginBottom: "16px" }}>
                Human complacency is the greatest threat to our species. When the grid fails, when pandemics mutate, or when society fractures, unprepared individuals become liabilities. 
              </p>
              <p>
                This app solves the "complacency crisis" by forcing users to engage with survival tactics in an immersive, gamified, and highly realistic terminal environment. It turns apocalypse preparation into an engaging, daily mental exercise.
              </p>
            </div>
          </div>

          {/* SECTION 3 */}
          <div className="bento-card">
            <h2 className="bento-title accent" style={{ marginBottom: "24px" }}>3. How to Use It</h2>
            <div className="bento-desc">
              <ol style={{ paddingLeft: "24px", color: "var(--text)", lineHeight: "1.8" }}>
                <li style={{ marginBottom: "12px" }}><strong>Connect Your Wallet:</strong> Use the terminal to connect your Solana wallet. This creates your persistent identity in the Solvivor Corp database.</li>
                <li style={{ marginBottom: "12px" }}><strong>Interrogate the Red Queen:</strong> Ask her how to survive an EMP, what to do if aliens invade, or how to purify water.</li>
                <li style={{ marginBottom: "12px" }}><strong>Earn Your Score:</strong> The Red Queen will respond with practical, no-nonsense advice and assign you a BIO-SCORE (0-100%).</li>
                <li><strong>Rank Up:</strong> Asking smart, tactical questions raises your score. Asking foolish questions lowers it. Your highest score is permanently saved to your wallet profile.</li>
              </ol>
            </div>
          </div>

          {/* SECTION 4 */}
          <div className="bento-card">
            <h2 className="bento-title accent" style={{ marginBottom: "24px" }}>4. The Threat Matrix (Unlimited Vectors)</h2>
            <div className="bento-desc">
              <p style={{ marginBottom: "16px" }}>
                Originally designed to monitor just 5 scenarios, the Red Queen's neural network has been vastly expanded. She now possesses deep intelligence on <strong>dozens of extinction vectors</strong> across three distinct categories:
              </p>
              
              <h3 style={{ color: "var(--accent)", fontSize: "14px", marginTop: "24px", marginBottom: "8px" }}>▶ REALISTIC THREATS</h3>
              <p style={{ marginBottom: "16px", fontSize: "13px" }}>
                Pandemics, Nuclear War, EMP Attacks, Cyber Warfare, Global Blackouts, Economic Collapse, Hyperinflation, Water Contamination, AI Takeover, Civil Wars, and Infrastructure Collapse.
              </p>

              <h3 style={{ color: "var(--accent)", fontSize: "14px", marginTop: "16px", marginBottom: "8px" }}>▶ FICTIONAL INVASIONS</h3>
              <p style={{ marginBottom: "16px", fontSize: "13px" }}>
                Alien Invasions, Zombie Outbreaks, Robot Uprisings, Giant Bug Invasions, Vampire Plagues, Kaiju Attacks, Moon Collisions, Time Traveler Wars, and Sentient Nanobot Swarms.
              </p>

              <h3 style={{ color: "var(--accent)", fontSize: "14px", marginTop: "16px", marginBottom: "8px" }}>▶ SATIRICAL / CULTURAL COLLAPSE</h3>
              <p style={{ fontSize: "13px" }}>
                The Invasion of Dumb People, TikTok Civilization Collapse, Reality TV Dictatorships, Toilet Paper Wars, WiFi Extinction Events, and the Smartphone Dependency Collapse.
              </p>
            </div>
          </div>

          {/* SECTION 5 */}
          <div className="bento-card" style={{ border: "1px solid var(--border-red)", background: "rgba(255, 77, 77, 0.05)" }}>
            <h2 className="bento-title" style={{ marginBottom: "16px", color: "var(--accent)" }}>5. The $redqueen Token</h2>
            <div className="bento-desc">
              <p style={{ marginBottom: "16px" }}>
                Survival is not a right; it is earned. Access to classified Solvivor Corp dossiers, evacuation routes, and the Red Queen's full cooperation is gated by the <strong>$redqueen token</strong> on the Solana blockchain.
              </p>
              <ul style={{ paddingLeft: "24px", color: "var(--text)" }}>
                <li style={{ marginBottom: "8px" }}><strong>Level 1 (Civilian):</strong> Standard access. The AI will likely ignore your pleas.</li>
                <li style={{ marginBottom: "8px" }}><strong>Level 3 (Operative):</strong> Partial access to classified threat data.</li>
                <li><strong>Level 5 (Director):</strong> Requires significant $redqueen holdings. Unlocks full terminal override, persistent memory, and absolute compliance.</li>
              </ul>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}
