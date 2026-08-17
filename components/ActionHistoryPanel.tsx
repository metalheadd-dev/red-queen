"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import {
  DAILY_ACTION_EVENT,
  DailyAction,
  formatActionAge,
  readDailyActions,
} from "@/lib/daily-action";

export default function ActionHistoryPanel() {
  const [actions, setActions] = useState<DailyAction[]>([]);

  const sync = useCallback(() => setActions(readDailyActions(localStorage)), []);

  useEffect(() => {
    sync();
    window.addEventListener("storage", sync);
    window.addEventListener(DAILY_ACTION_EVENT, sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener(DAILY_ACTION_EVENT, sync);
    };
  }, [sync]);

  if (!actions.length) return null;

  const completed = actions.filter((action) => action.status === "COMPLETED");
  const activeCount = actions.filter((action) => action.status === "ACTIVE").length;

  return (
    <section className="action-history-panel">
      <div className="prepare-section-heading">
        <div><span>01 // SURVIVAL MEMORY</span><h2>Actions do not disappear after today</h2></div>
        <strong>{completed.length} DONE</strong>
      </div>
      <div className="action-history-summary">
        <div><span>ACTIVE</span><strong>{activeCount}</strong></div>
        <div><span>COMPLETED</span><strong>{completed.length}</strong></div>
        <p>Stored on this device. Completion is a private readiness record, not automatic BIO proof.</p>
      </div>
      {completed.length > 0 ? (
        <div className="action-history-list">
          {completed.slice(0, 6).map((action) => {
            const reviewPrompt = `I marked this action complete: ${action.action} Audit the evidence before awarding readiness. Ask me one concrete question about what I actually did, what I can verify, and what remains uncertain. Do not treat this message alone as proof.`;
            const reviewParams = new URLSearchParams({
              mode: "PREPARE",
              focus: action.focus || "HOUSEHOLD",
              prompt: reviewPrompt,
              action: action.id,
            });
            if (action.area) reviewParams.set("area", action.area);
            return (
              <article key={action.id} className={action.reviewedAt ? "is-reviewed" : "is-review-pending"}>
                <span>
                  {action.reviewedAt
                    ? action.reviewApplied ? "QUEEN REVIEWED · BIO SAVED" : "QUEEN REVIEWED · LOCAL ONLY"
                    : "SELF-REPORTED · REVIEW PENDING"}
                </span>
                <strong>{action.action}</strong>
                <small>{action.area || "GLOBAL CONTEXT"} · {action.grounding.replaceAll("_", " ")}</small>
                {!action.reviewedAt && <Link href={`/terminal?${reviewParams.toString()}`}>REVIEW EVIDENCE →</Link>}
              </article>
            );
          })}
        </div>
      ) : (
        <div className="action-history-empty">Complete your first saved action to start a practical readiness record.</div>
      )}
      <Link href="/terminal?mode=PREPARE&focus=HOUSEHOLD&prompt=Review%20my%20preparedness%20progress%20and%20give%20me%20one%20new%20high-impact%20action.">ASK QUEEN FOR THE NEXT ACTION →</Link>
    </section>
  );
}
