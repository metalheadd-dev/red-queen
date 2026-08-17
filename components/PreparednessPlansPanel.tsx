"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import {
  formatPlanReviewDate,
  PREPAREDNESS_PLANS_EVENT,
  PreparednessPlan,
  readPreparednessPlans,
  updatePreparednessPlanStep,
} from "@/lib/preparedness-plan";

function reviewState(plan: PreparednessPlan) {
  if (plan.status === "COMPLETED") return "PROTOCOL COMPLETE";
  const days = Math.ceil((new Date(plan.reviewAt).getTime() - Date.now()) / 86_400_000);
  if (days < 0) return "REVIEW OVERDUE";
  if (days === 0) return "REVIEW TODAY";
  return `REVIEW IN ${days}D`;
}

export default function PreparednessPlansPanel() {
  const [plans, setPlans] = useState<PreparednessPlan[]>([]);
  const [ready, setReady] = useState(false);

  const sync = useCallback(() => {
    setPlans(readPreparednessPlans(localStorage));
    setReady(true);
  }, []);

  useEffect(() => {
    sync();
    window.addEventListener("storage", sync);
    window.addEventListener(PREPAREDNESS_PLANS_EVENT, sync);
    return () => {
      window.removeEventListener("storage", sync);
      window.removeEventListener(PREPAREDNESS_PLANS_EVENT, sync);
    };
  }, [sync]);

  const active = useMemo(() => plans.filter((plan) => plan.status === "ACTIVE"), [plans]);
  const completed = plans.length - active.length;

  function toggleStep(planId: string, stepId: string, completedStep: boolean) {
    setPlans(updatePreparednessPlanStep(localStorage, planId, stepId, completedStep));
    window.dispatchEvent(new Event(PREPAREDNESS_PLANS_EVENT));
  }

  if (!ready) return <section className="preparedness-plans is-loading" aria-busy="true" />;

  return (
    <section className={`preparedness-plans${plans.length ? " has-plans" : " is-empty"}`}>
      <div className="prepare-section-heading">
        <div><span>QUEEN PROTOCOLS // SURVIVAL MEMORY</span><h2>Plans that stay alive after the conversation</h2></div>
        <strong>{active.length} ACTIVE · {completed} COMPLETE</strong>
      </div>

      {!plans.length ? (
        <div className="preparedness-plans-empty">
          <div>
            <strong>No persistent protocol yet.</strong>
            <p>Ask RED QUEEN for a blackout, outbreak, household or wallet-compromise plan. Save the structured protocol here and finish it step by step.</p>
          </div>
          <Link href="/terminal?mode=PREPARE&focus=HOUSEHOLD&prompt=Build%20a%20practical%20preparedness%20plan%20for%20my%20highest-impact%20household%20gap.%20Give%20me%20observable%20steps%20and%20a%20realistic%20review%20date.">BUILD FIRST PLAN →</Link>
        </div>
      ) : (
        <div className="preparedness-plan-list">
          {plans.slice(0, 6).map((plan) => {
            const completedSteps = plan.steps.filter((step) => step.completed).length;
            const progress = Math.round((completedSteps / plan.steps.length) * 100);
            const queenPrompt = `Review my saved preparedness plan “${plan.title}”. I completed ${completedSteps} of ${plan.steps.length} steps. Check whether the remaining assumptions are still valid and give me one next action.`;
            return (
              <article key={plan.id} className={plan.status === "COMPLETED" ? "is-complete" : ""}>
                <div className="preparedness-plan-head">
                  <div><span>{plan.area || "GLOBAL CONTEXT"} · {plan.grounding.replaceAll("_", " ")}</span><h3>{plan.title}</h3></div>
                  <b>{reviewState(plan)}</b>
                </div>
                <p>{plan.objective}</p>
                <div className="preparedness-plan-progress"><i style={{ width: `${progress}%` }} /></div>
                <small>{completedSteps}/{plan.steps.length} STEPS · REVIEW {formatPlanReviewDate(plan.reviewAt)}</small>
                <div className="preparedness-plan-steps">
                  {plan.steps.map((step) => (
                    <button
                      key={step.id}
                      type="button"
                      className={step.completed ? "checked" : ""}
                      aria-pressed={step.completed}
                      onClick={() => toggleStep(plan.id, step.id, !step.completed)}
                    >
                      <i>{step.completed ? "✓" : ""}</i><span>{step.text}</span>
                    </button>
                  ))}
                </div>
                <footer>
                  {plan.sourceLabel && plan.sourceUrl ? <a href={plan.sourceUrl} target="_blank" rel="noreferrer">SOURCE · {plan.sourceLabel} ↗</a> : <span>GENERAL PREPAREDNESS KNOWLEDGE</span>}
                  <Link href={`/terminal?${new URLSearchParams({ mode: "PREPARE", focus: plan.focus || "HOUSEHOLD", area: plan.area, prompt: queenPrompt }).toString()}`}>REVIEW WITH QUEEN →</Link>
                </footer>
              </article>
            );
          })}
        </div>
      )}
      <div className="preparedness-plans-contract">LOCAL PROGRESS IS A PRIVATE MEMORY AID. CHECKING A STEP DOES NOT AUTOMATICALLY CHANGE BIO-SCORE OR CLAIM INDEPENDENT VERIFICATION.</div>
    </section>
  );
}
