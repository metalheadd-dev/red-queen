"use client";
import UmbrellaIcon from "@/components/UmbrellaIcon";

export default function SurvivalKitPage() {
  return (
    <div style={{ padding: "80px 24px", minHeight: "100vh" }}>
      <div className="container">
        <div style={{ marginBottom: "48px", textAlign: "center" }}>
          <UmbrellaIcon size={64} />
          <h1 className="glow-text" style={{ fontSize: "32px", marginTop: "24px" }}>SURVIVAL USER KIT</h1>
          <p className="dim" style={{ fontFamily: "var(--mono)", letterSpacing: "0.2em", marginTop: "12px" }}>
            OFFICIAL WHITEPAPER // RED QUEEN INTELLIGENCE
          </p>
        </div>

        <div className="bento-grid bento-1" style={{ maxWidth: "800px", margin: "0 auto" }}>
          <div className="bento-card">
            <h2 className="bento-title accent" style={{ marginBottom: "24px" }}>1. The Red Queen Protocol</h2>
            <div className="bento-desc">
              <p style={{ marginBottom: "16px" }}>
                The Red Queen is an advanced survival artificial intelligence tasked with assessing human readiness for extinction-level events. She is not your assistant; she is your evaluator.
              </p>
              <p style={{ marginBottom: "16px" }}>
                Her core directive is to monitor global threats, analyze user responses, and assign a <strong>BIO-SCORE</strong> reflecting your probability of survival.
              </p>
              <ul style={{ paddingLeft: "24px", marginTop: "16px", color: "var(--text)" }}>
                <li><strong>Realistic Threats:</strong> Pandemics, Nuclear War, EMPs, AI Takeover, Climate Collapse.</li>
                <li><strong>Classified Threats:</strong> T-Virus outbreaks, Xenomorph incursions, MK-Omega.</li>
              </ul>
            </div>
          </div>

          <div className="bento-card">
            <h2 className="bento-title accent" style={{ marginBottom: "24px" }}>2. BIO-SCORE Economics</h2>
            <div className="bento-desc">
              <p style={{ marginBottom: "16px" }}>
                Every interaction with the Red Queen is judged. Asking foolish questions lowers your score. Demonstrating tactical awareness increases it.
              </p>
              <table className="clearance-table" style={{ width: "100%", marginTop: "16px" }}>
                <thead>
                  <tr>
                    <th>Score Range</th>
                    <th>Classification</th>
                    <th>AI Tone</th>
                  </tr>
                </thead>
                <tbody>
                  <tr>
                    <td>0-20%</td>
                    <td>Terminal Liability</td>
                    <td>Maximum Contempt</td>
                  </tr>
                  <tr>
                    <td>21-60%</td>
                    <td>Average Civilian</td>
                    <td>Cold / Dismissive</td>
                  </tr>
                  <tr>
                    <td>61-100%</td>
                    <td>Elite Survivor</td>
                    <td>Tactical Respect</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>

          <div className="bento-card">
            <h2 className="bento-title accent" style={{ marginBottom: "24px" }}>3. $redqueen Token Utility</h2>
            <div className="bento-desc">
              <p style={{ marginBottom: "16px" }}>
                Survival is not a right; it is earned. Access to classified Umbrella Corporation dossiers, evacuation routes, and the Red Queen's full cooperation is gated by the <strong>$redqueen token</strong> on the Solana blockchain.
              </p>
              <ul style={{ paddingLeft: "24px", color: "var(--text)" }}>
                <li style={{ marginBottom: "8px" }}><strong>Level 1 (Civilian):</strong> Standard access. The AI will likely ignore your pleas.</li>
                <li style={{ marginBottom: "8px" }}><strong>Level 3 (Operative):</strong> Partial access to classified threat data.</li>
                <li><strong>Level 5 (Director):</strong> Requires significant $redqueen holdings. Unlocks full terminal override, persistent memory, and absolute compliance.</li>
              </ul>
              <p style={{ marginTop: "24px", fontFamily: "var(--mono)", color: "var(--accent)", fontSize: "12px" }}>
                [ CONNECT YOUR WALLET IN THE TERMINAL TO VERIFY CLEARANCE ]
              </p>
            </div>
          </div>

          <div className="bento-card" style={{ border: "1px solid var(--border-red)", background: "rgba(255, 77, 77, 0.05)" }}>
            <h2 className="bento-title" style={{ marginBottom: "16px", color: "var(--accent)" }}>4. Database & Persistence</h2>
            <div className="bento-desc">
              <p>
                To maintain your BIO-SCORE and clearance levels across sessions, the Red Queen utilizes a secure, decentralized logging infrastructure. Once a wallet is connected, your survival data is permanently etched into the mainframe. 
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
