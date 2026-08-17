"use client";

import type { RedQueenClientResponse } from "@/lib/red-queen-agent";

interface AgentResponseCardProps {
  response: RedQueenClientResponse;
  onFollowUp: (question: string) => void;
  onStartReadiness?: () => void;
  onSaveAction?: () => void;
  actionSaved?: boolean;
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

export default function AgentResponseCard({
  response,
  onFollowUp,
  onStartReadiness,
  onSaveAction,
  actionSaved = false,
}: AgentResponseCardProps) {
  return (
    <div className="rq-response">
      <div className="rq-response__meta">
        <span className={`rq-signal rq-signal--${response.urgency.toLowerCase()}`}>
          {URGENCY_LABELS[response.urgency]}
        </span>
        <span className="rq-signal">{GROUNDING_LABELS[response.grounding]}</span>
        <span className="rq-signal">CONFIDENCE {response.confidence}</span>
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
          {onSaveAction && (
            <button type="button" onClick={onSaveAction} disabled={actionSaved}>
              {actionSaved ? "SAVED TO MY PLAN" : "SAVE TO MY PLAN"}
            </button>
          )}
        </div>
        <strong>{response.action}</strong>
      </div>

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
            ? `${response.readiness.xp >= 0 ? "+" : ""}${response.readiness.xp} XP${response.readiness.applied ? " APPLIED" : " — VERIFY TO SAVE"}`
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
