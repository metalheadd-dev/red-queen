"use client";

import Link from "next/link";
import type { RedQueenClientResponse, RedQueenCommerceItem } from "@/lib/red-queen-agent";

interface AgentResponseCardProps {
  response: RedQueenClientResponse;
  onFollowUp: (question: string) => void;
  onStartReadiness?: () => void;
  onSaveAction?: () => void;
  onSavePlan?: () => void;
  actionSaved?: boolean;
  planSaved?: boolean;
}

const URGENCY_LABELS: Record<RedQueenClientResponse["urgency"], string> = {
  NONE: "NO IMMEDIATE THREAT",
  MONITOR: "MONITOR",
  PREPARE: "PREPARE",
  ACT_NOW: "ACT NOW",
};

const GROUNDING_LABELS: Record<RedQueenClientResponse["grounding"], string> = {
  GENERAL_KNOWLEDGE: "GENERAL KNOWLEDGE",
  VERIFIED_LIVE: "VERIFIED LIVE SIGNAL",
  SCENARIO_SIMULATION: "SCENARIO SIMULATION",
};

function ProcurementItem({ item, index }: { item: RedQueenCommerceItem; index: number }) {
  return (
    <article className="rq-procurement__item">
      <div className="rq-procurement__index">{String(index + 1).padStart(2, "0")}</div>
      <div className="rq-procurement__copy">
        <span>{item.category} · {item.priority}</span>
        <h4>{item.name}</h4>
        <strong>{item.quantity}</strong>
        <p>{item.why}</p>
        {item.cautions && <small>{item.cautions}</small>}
      </div>
      <a href={item.amazonUrl} target="_blank" rel="noopener noreferrer sponsored">
        SEARCH AMAZON ↗
      </a>
    </article>
  );
}

export default function AgentResponseCard({
  response,
  onFollowUp,
  onStartReadiness,
  onSaveAction,
  onSavePlan,
  actionSaved = false,
  planSaved = false,
}: AgentResponseCardProps) {
  const primaryCommerceItems = response.commerce?.items.slice(0, 4) ?? [];
  const additionalCommerceItems = response.commerce?.items.slice(4) ?? [];

  return (
    <div className="rq-response">
      <div className="rq-response__meta">
        <span className={`rq-signal rq-signal--${response.urgency.toLowerCase()}`}>
          {URGENCY_LABELS[response.urgency]}
        </span>
        <span className="rq-signal">{GROUNDING_LABELS[response.grounding]}</span>
        <span className="rq-signal">CONFIDENCE {response.confidence}</span>
        {response.memory.deviceContextLoaded && <span className="rq-signal rq-signal--memory">DEVICE CONTEXT LOADED</span>}
      </div>

      <div className="rq-response__situation">{response.situation}</div>

      {response.facts.length > 0 && (
        <div className="rq-facts">
          <span>VERIFIED FACTS</span>
          <ul>{response.facts.map((fact) => <li key={fact}>{fact}</li>)}</ul>
        </div>
      )}

      <span className="rq-section-label">QUEEN ASSESSMENT</span>
      <div className="rq-response__answer">{response.answer}</div>

      <div className="rq-uncertainty">
        <span>UNCERTAINTY</span>
        <p>{response.uncertainty}</p>
      </div>

      <div className="rq-action">
        <div>
          <span>NEXT BEST ACTION</span>
          {actionSaved ? (
            <Link href="/prepare">OPEN MY PLAN →</Link>
          ) : onSaveAction ? (
            <button type="button" onClick={onSaveAction} disabled={actionSaved}>
              SAVE TO MY PLAN
            </button>
          ) : null}
        </div>
        <strong>{response.action}</strong>
      </div>

      {response.plan && (
        <div className="rq-preparedness-plan">
          <div>
            <span>QUEEN PROTOCOL // {response.plan.steps.length} STEPS</span>
            {planSaved ? (
              <Link href="/prepare">OPEN SAVED PROTOCOL →</Link>
            ) : onSavePlan ? (
              <button type="button" onClick={onSavePlan}>SAVE FULL PLAN</button>
            ) : null}
          </div>
          <h3>{response.plan.title}</h3>
          <p>{response.plan.objective}</p>
          <ol>{response.plan.steps.map((step) => <li key={step}>{step}</li>)}</ol>
          <small>REVIEW IN {response.plan.reviewInDays} DAYS · LOCAL COMPLETION IS NOT AUTOMATIC BIO EVIDENCE</small>
        </div>
      )}

      {response.commerce && (
        <section className="rq-procurement" aria-label="RED QUEEN preparedness cart">
          <header className="rq-procurement__head">
            <div>
              <span>QUEEN PROCUREMENT // CART READY</span>
              <h3>{response.commerce.title}</h3>
              <p>{response.commerce.rationale}</p>
            </div>
            <strong>{response.commerce.items.length} ITEMS</strong>
          </header>

          <div className="rq-procurement__items">
            {primaryCommerceItems.map((item, index) => (
              <ProcurementItem key={item.id} item={item} index={index} />
            ))}
          </div>

          {additionalCommerceItems.length > 0 && (
            <details className="rq-procurement__more">
              <summary>SHOW {additionalCommerceItems.length} MORE RECOMMENDATIONS</summary>
              <div className="rq-procurement__items">
                {additionalCommerceItems.map((item, index) => (
                  <ProcurementItem key={item.id} item={item} index={index + primaryCommerceItems.length} />
                ))}
              </div>
            </details>
          )}

          <footer className="rq-procurement__foot">
            <div>
              <strong>REVIEW BEFORE PURCHASE</strong>
              <span>No seller selected · no address shared · no order placed</span>
            </div>
            <Link href={response.commerce.fullMarketUrl}>FIND x402 OFFERS &amp; CHECKOUT →</Link>
          </footer>
        </section>
      )}

      {response.sources.length > 0 && (
        <div className="rq-sources">
          <span>SOURCES LOCKED</span>
          {response.sources.map((source) => (
            <a key={source.url} href={source.url} target="_blank" rel="noopener noreferrer">
              {source.verified ? "VERIFIED · " : ""}{source.label} ↗
            </a>
          ))}
        </div>
      )}

      <div className={`rq-readiness ${response.readiness.applied ? "rq-readiness--applied" : ""}`}>
        <span>READINESS</span>
        <strong>
          {response.readiness.eligible
            ? `${response.readiness.xp >= 0 ? "+" : ""}${response.readiness.xp} XP${response.readiness.applied ? " APPLIED" : " // VERIFY TO SAVE"}`
            : "NO SCORE CHANGE"}
        </strong>
        <small>{response.readiness.reason}</small>
      </div>

      <div className="rq-followups">
        <span>CONTINUE ANALYSIS</span>
        <div>
          {response.followUps.map((question) => (
            <button key={question} type="button" onClick={() => onFollowUp(question)}>
              {question}
            </button>
          ))}
        </div>
      </div>

      {onStartReadiness && (
        <div className="rq-readiness-bridge">
          <div>
            <span>NEXT LOOP</span>
            <strong>Establish your readiness baseline</strong>
            <p>RED QUEEN will present one decision at a time. BIO changes only after your answer is evaluated.</p>
          </div>
          <button type="button" onClick={onStartReadiness}>START 3-MIN DRILL</button>
        </div>
      )}
    </div>
  );
}
