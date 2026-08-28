import type { Metadata } from "next";
import Link from "next/link";
import { RED_QUEEN_AGENT_ID, RED_QUEEN_AGENT_ID_SHORT } from "@/lib/agent-identity-public";
import { X402_INTELLIGENCE_PRODUCTS } from "@/lib/intelligence-products";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "For Agents | RED QUEEN x402 Intelligence",
  description: "Discover and call RED QUEEN survival-intelligence resources through x402 on Solana.",
};

const machineEndpoints = [
  ["x402 discovery", "/.well-known/x402"],
  ["OpenAPI 3.1", "/openapi.json"],
  ["MCP server card", "/.well-known/mcp/server-card.json"],
  ["MCP transport", "/api/mcp/mcp"],
  ["Agent identity", "/.well-known/agent-registration.json"],
  ["Merchant reliability", "/api/reliability"],
] as const;

export default function ForAgentsPage() {
  const products = X402_INTELLIGENCE_PRODUCTS.filter(
    (product) => product.endpoint && product.status !== "RESEARCH",
  );

  return (
    <main className={styles.page}>
      <section className={styles.hero}>
        <div className={styles.grid} aria-hidden="true" />
        <div className={styles.heroInner}>
          <p className={styles.eyebrow}>RED QUEEN // MACHINE ACCESS</p>
          <h1>
            Survival intelligence.
            <span>Built for agents.</span>
          </h1>
          <p className={styles.lead}>
            Discover a resource, receive an exact USDC quote, settle on Solana and receive a
            structured result with its delivery receipt.
          </p>
          <div className={styles.actions}>
            <Link className="btn btn-primary" href="/.well-known/x402">
              INSPECT x402 CATALOG
            </Link>
            <Link className="btn btn-ghost" href="/openapi.json">
              OPEN API SCHEMA
            </Link>
          </div>
          <div className={styles.identity}>
            <strong>8004 REGISTERED</strong>
            <span>AGENT {RED_QUEEN_AGENT_ID_SHORT}</span>
            <span>SOLANA MAINNET</span>
          </div>
        </div>
      </section>

      <section className={styles.flow} aria-label="x402 request flow">
        {[
          ["01", "DISCOVER", "Read parameters and output schema."],
          ["02", "REQUEST", "Call the selected intelligence resource."],
          ["03", "PAY USDC", "Settle the exact x402 challenge on Solana."],
          ["04", "RECEIVE", "Get JSON output and a replay-safe receipt."],
        ].map(([number, title, body]) => (
          <article key={number}>
            <span>{number}</span>
            <h2>{title}</h2>
            <p>{body}</p>
          </article>
        ))}
      </section>

      <section className={styles.catalog}>
        <header>
          <p className={styles.eyebrow}>LIVE MERCHANT CATALOG</p>
          <h2>Pay for one declared output.</h2>
          <p>No subscription. No provider API key. Every operation declares its price and result before settlement.</p>
        </header>

        <div className={styles.productGrid}>
          {products.map((product) => (
            <article className={styles.product} key={product.id}>
              <div className={styles.productTop}>
                <span>{product.method || "GET"}</span>
                <strong>{product.price}</strong>
              </div>
              <h3>{product.name}</h3>
              <p>{product.value}</p>
              <dl>
                <div>
                  <dt>RESOURCE</dt>
                  <dd>{product.endpoint}</dd>
                </div>
                <div>
                  <dt>DELIVERS</dt>
                  <dd>{product.output}</dd>
                </div>
              </dl>
            </article>
          ))}
        </div>
      </section>

      <section className={styles.machine}>
        <div>
          <p className={styles.eyebrow}>DISCOVERY SURFACE</p>
          <h2>One merchant. Multiple protocols.</h2>
          <p>
            Bazaar metadata is embedded in each 402 challenge. The same resources are published
            for OpenAPI clients and through RED QUEEN&apos;s MCP endpoint.
          </p>
        </div>
        <div className={styles.endpointList}>
          {machineEndpoints.map(([label, href]) => (
            <Link href={href} key={href}>
              <span>{label}</span>
              <code>{href}</code>
              <b>↗</b>
            </Link>
          ))}
        </div>
      </section>

      <section className={styles.trust}>
        <div>
          <p className={styles.eyebrow}>TRUST BOUNDARY</p>
          <h2>Payment authorizes the declared operation. Nothing else.</h2>
        </div>
        <ul>
          <li>No custody or automatic spending authority.</li>
          <li>No seed phrase or private key is ever requested.</li>
          <li>Every retry is bound to one operation ID and payment fingerprint.</li>
          <li>Payment never creates XP, BIO-SCORE or survival competence.</li>
        </ul>
      </section>

      <section className={styles.final}>
        <div>
          <p className={styles.eyebrow}>RED QUEEN // INTELLIGENCE MERCHANT</p>
          <h2>Find the signal. Buy the missing evidence. Deliver the decision.</h2>
        </div>
        <div className={styles.actions}>
          <Link className="btn btn-primary" href="/onchain">
            OPEN HUMAN MARKET
          </Link>
          <Link className="btn btn-ghost" href={`/onchain#agent-identity`} title={RED_QUEEN_AGENT_ID}>
            VERIFY IDENTITY
          </Link>
        </div>
      </section>
    </main>
  );
}
