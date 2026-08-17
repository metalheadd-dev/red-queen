"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  DAILY_ACTION_EVENT,
  DAILY_ACTION_STORAGE_KEY,
  DailyAction,
  formatActionAge,
  parseDailyAction,
} from "@/lib/daily-action";

interface DailyActionPanelProps {
  context?: "PULSE" | "PREPARE";
}

function readAction() {
  if (typeof window === "undefined") return null;
  return parseDailyAction(localStorage.getItem(DAILY_ACTION_STORAGE_KEY));
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
    const prompt = action
      ? action.status === "ACTIVE"
        ? `Help me complete my saved action: ${action.action} Ask what constraints matter, then make the task specific and safe.`
        : `I completed this action: ${action.action} Help me verify what counts as evidence, identify the next highest-impact gap, and give me one new action.`
      : "Use my context to identify the single highest-impact preparedness action I can complete today.";
    const params = new URLSearchParams({ mode: "PREPARE", focus: action?.focus || "HOUSEHOLD", prompt });
    if (action?.area) params.set("area", action.area);
    return `/terminal?${params.toString()}`;
  }, [action]);

  function markComplete() {
    if (!action || action.status === "COMPLETED") return;
    const completed: DailyAction = {
      ...action,
      status: "COMPLETED",
      completedAt: new Date().toISOString(),
    };
    localStorage.setItem(DAILY_ACTION_STORAGE_KEY, JSON.stringify(completed));
    window.dispatchEvent(new Event(DAILY_ACTION_EVENT));
  }

  if (!ready) return <section className="daily-action-panel is-loading" aria-busy="true" />;

  if (!action) {
    return (
      <section className={`daily-action-panel is-empty is-${context.toLowerCase()}`}>
        <div><span>MY ACTION PLAN</span><b>NO ACTION SAVED</b></div>
        <h2>Turn one Queen answer into something you finish.</h2>
        <p>Ask RED QUEEN for one practical action, then save it here. The plan stays on this device until account sync is enabled.</p>
        <Link href={continueHref}>CREATE TODAY&apos;S ACTION →</Link>
      </section>
    );
  }

  return (
    <section className={`daily-action-panel is-${context.toLowerCase()} ${action.status === "COMPLETED" ? "is-complete" : ""}`}>
      <div className="daily-action-head">
        <span>MY ACTION PLAN // {action.status}</span>
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
          {action.status === "ACTIVE" && <button type="button" onClick={markComplete}>MARK COMPLETE</button>}
          <Link href={continueHref}>{action.status === "ACTIVE" ? "CONTINUE WITH QUEEN" : "GET NEXT ACTION"}</Link>
        </div>
      </div>
      <footer>LOCAL PLAN · COMPLETION DOES NOT CHANGE BIO-SCORE UNTIL RED QUEEN EVALUATES EVIDENCE</footer>
    </section>
  );
}
