"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  DAILY_ACTION_EVENT,
  DailyAction,
  formatActionAge,
  getCurrentDailyAction,
  readDailyActions,
  updateDailyAction,
} from "@/lib/daily-action";

interface DailyActionPanelProps {
  context?: "PULSE" | "PREPARE";
}

function readAction() {
  if (typeof window === "undefined") return null;
  return getCurrentDailyAction(readDailyActions(localStorage));
}

export default function DailyActionPanel({ context = "PULSE" }: DailyActionPanelProps) {
  const [action, setAction] = useState<DailyAction | null>(null);
  const [ready, setReady] = useState(false);

  const syncAction = useCallback(() => {
    setAction(readAction());
    setReady(true);
  }, []);

  useEffect(() => {
    syncAction();
    window.addEventListener("storage", syncAction);
    window.addEventListener(DAILY_ACTION_EVENT, syncAction);
    return () => {
      window.removeEventListener("storage", syncAction);
      window.removeEventListener(DAILY_ACTION_EVENT, syncAction);
    };
  }, [syncAction]);

  const continueHref = useMemo(() => {
    const needsReview = action?.status === "COMPLETED" && !action.reviewedAt;
    const prompt = action
      ? action.status === "ACTIVE"
        ? `Help me complete my saved action: ${action.action} Ask what constraints matter, then make the task specific and safe.`
        : needsReview
          ? `I marked this action complete: ${action.action} Audit the evidence before awarding readiness. Ask me one concrete question about what I actually did, what I can verify, and what remains uncertain. Do not treat this message alone as proof.`
          : `RED QUEEN already reviewed my completed action: ${action.action} Identify the next highest-impact gap and give me one new practical action.`
      : "Use my context to identify the single highest-impact preparedness action I can complete today.";
    const params = new URLSearchParams({ mode: "PREPARE", focus: action?.focus || "HOUSEHOLD", prompt });
    if (action?.area) params.set("area", action.area);
    if (needsReview) params.set("action", action.id);
    return `/red-queen?${params.toString()}`;
  }, [action]);

  function markComplete() {
    if (!action || action.status === "COMPLETED") return;
    const completed: DailyAction = {
      ...action,
      status: "COMPLETED",
      completedAt: new Date().toISOString(),
    };
    updateDailyAction(localStorage, action.id, { status: "COMPLETED", completedAt: completed.completedAt });
    window.dispatchEvent(new Event(DAILY_ACTION_EVENT));
  }

  if (!ready) return <section className="daily-action-panel is-loading" aria-busy="true" />;

  if (!action) {
    return (
      <section className={`daily-action-panel is-empty is-${context.toLowerCase()}`}>
        <div><span>MY ACTION PLAN</span><b>NO ACTION SAVED</b></div>
        <h2>Turn one Queen answer into something you finish.</h2>
        <p>Ask RED QUEEN for one practical action, then save it here. Your active and completed actions stay in Survival Memory on this device.</p>
        <Link href={continueHref}>CREATE TODAY&apos;S ACTION →</Link>
      </section>
    );
  }

  return (
    <section className={`daily-action-panel is-${context.toLowerCase()} ${action.status === "COMPLETED" ? "is-complete" : ""}`}>
      <div className="daily-action-head">
        <span>MY ACTION PLAN // {action.reviewedAt ? "QUEEN REVIEWED" : action.status}</span>
        <b>{formatActionAge(action.createdAt)}</b>
      </div>
      <div className="daily-action-body">
        <div>
          <small>{action.area || "GLOBAL CONTEXT"} · {action.urgency.replaceAll("_", " ")} · {action.grounding.replaceAll("_", " ")}</small>
          <h2>{action.action}</h2>
          <p>{action.situation}</p>
          {action.sourceLabel && action.sourceUrl && (
            <a href={action.sourceUrl} target="_blank" rel="noreferrer">VERIFIED SOURCE · {action.sourceLabel} ↗</a>
          )}
        </div>
        <div className="daily-action-controls">
          {action.status === "ACTIVE" && <button type="button" onClick={markComplete}>MARK COMPLETE LOCALLY</button>}
          <Link href={continueHref}>
            {action.status === "ACTIVE" ? "CONTINUE WITH QUEEN" : action.reviewedAt ? "GET NEXT ACTION" : "REVIEW EVIDENCE WITH QUEEN"}
          </Link>
        </div>
      </div>
      <footer>
        {action.reviewedAt
          ? `QUEEN REVIEWED · ${action.reviewApplied ? `BIO SAVED${typeof action.reviewBioScore === "number" ? ` AT ${action.reviewBioScore}%` : ""}` : "EVALUATION NOT SAVED TO AN ACCOUNT"}`
          : "LOCAL PLAN · COMPLETION DOES NOT CHANGE BIO-SCORE UNTIL RED QUEEN EVALUATES EVIDENCE"}
      </footer>
    </section>
  );
}
