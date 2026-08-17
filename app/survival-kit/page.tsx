"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import DailyActionPanel from "@/components/DailyActionPanel";
import {
  PREPAREDNESS_CHECKLIST,
  PREPAREDNESS_DOMAINS,
  PREPAREDNESS_PROTOCOLS,
  PreparednessDomain,
} from "@/lib/preparedness";
import { AgentMode, sanitizeArea } from "@/lib/survival-context";
import { THREAT_CLEARANCE_LEVELS } from "@/lib/threat-token";

const CHECKLIST_STORAGE_KEY = "rq-preparedness-checklist-v1";
const CONTEXT_STORAGE_KEY = "rq-survival-context-v1";

function formatTokenThreshold(threshold: number) {
  if (threshold === 0) return "PUBLIC";
  if (threshold >= 1_000_000) return `${threshold / 1_000_000}M+ $THREAT`;
  if (threshold >= 1_000) return `${threshold / 1_000}K+ $THREAT`;
  return `${threshold}+ $THREAT`;
}

export default function SurvivalKitPage() {
  const [completed, setCompleted] = useState<Record<string, boolean>>({});
  const [area, setArea] = useState("");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(CHECKLIST_STORAGE_KEY) || "{}");
      if (saved && typeof saved === "object") setCompleted(saved);
    } catch {
      setCompleted({});
    }

    try {
      const context = JSON.parse(localStorage.getItem(CONTEXT_STORAGE_KEY) || "{}");
      setArea(sanitizeArea(typeof context.area === "string" ? context.area : ""));
    } catch {
      setArea("");
    }
    setReady(true);
  }, []);

  const completedCount = PREPAREDNESS_CHECKLIST.filter((item) => completed[item.id]).length;
  const progress = Math.round((completedCount / PREPAREDNESS_CHECKLIST.length) * 100);
  const nextItem = PREPAREDNESS_CHECKLIST.find((item) => !completed[item.id]);

  const domainProgress = useMemo(() => {
    return PREPAREDNESS_DOMAINS.map((domain) => {
      const items = PREPAREDNESS_CHECKLIST.filter((item) => item.domain === domain.id);
      const done = items.filter((item) => completed[item.id]).length;
      return { ...domain, done, total: items.length };
    });
  }, [completed]);

  function toggleItem(id: string) {
    setCompleted((current) => {
      const next = { ...current, [id]: !current[id] };
      localStorage.setItem(CHECKLIST_STORAGE_KEY, JSON.stringify(next));
      return next;
    });
  }

  function persistArea() {
    const safeArea = sanitizeArea(area);
    setArea(safeArea);
    try {
      const saved = JSON.parse(localStorage.getItem(CONTEXT_STORAGE_KEY) || "{}");
      const sameArea = sanitizeArea(typeof saved.area === "string" ? saved.area : "") === safeArea;
      localStorage.setItem(CONTEXT_STORAGE_KEY, JSON.stringify({ ...saved, area: safeArea, location: sameArea ? saved.location : undefined }));
    } catch {
      localStorage.setItem(CONTEXT_STORAGE_KEY, JSON.stringify({ area: safeArea, focus: "HOUSEHOLD", mode: "PREPARE" }));
    }
  }

  function terminalHref(prompt: string, mode: AgentMode = "PREPARE", focus = "HOUSEHOLD") {
    const params = new URLSearchParams({ mode, focus, prompt });
    if (area) params.set("area", area);
    return `/terminal?${params.toString()}`;
  }

  const nextActionPrompt = nextItem
    ? `Help me close this preparedness gap: ${nextItem.title}. Evidence of completion: ${nextItem.evidence} I have completed ${completedCount} of ${PREPAREDNESS_CHECKLIST.length} local baseline checks. Adapt one safe action to my context.`
    : "Audit my completed preparedness baseline. Find the weakest assumption and give me one realistic maintenance action.";

  return (
    <div className="prepare-page">
      <header className="prepare-hero">
        <div className="container prepare-hero-grid">
          <div>
            <span className="pulse-eyebrow">PREPARE // PRACTICAL READINESS</span>
            <h1>Turn intelligence into <em>something done.</em></h1>
            <p>
              Build a realistic household baseline, launch a response protocol, and ask RED QUEEN to adapt the next action to your situation.
            </p>
            <div className="prepare-hero-actions">
              <Link className="btn btn-primary" href={terminalHref(nextActionPrompt)}>ASK QUEEN FOR NEXT ACTION</Link>
              <Link className="btn btn-ghost" href="/threat-vector">OPEN THREAT LIBRARY</Link>
            </div>
          </div>

          <div className="prepare-status-panel">
            <div className="prepare-status-heading">
              <span>LOCAL BASELINE</span>
              <strong>{ready ? `${progress}%` : "--"}</strong>
            </div>
            <div className="prepare-progress" aria-label={`${progress}% of local baseline checked`}>
              <span style={{ width: `${progress}%` }} />
            </div>
            <p>{completedCount}/{PREPAREDNESS_CHECKLIST.length} checks marked on this device.</p>
            <div className="prepare-area">
              <span>CONTEXT</span>
              <input
                value={area}
                onChange={(event) => setArea(event.target.value)}
                onBlur={persistArea}
                onKeyDown={(event) => { if (event.key === "Enter") event.currentTarget.blur(); }}
                maxLength={80}
                placeholder="City or region only"
                aria-label="Broad city or region context"
              />
              <small>Never enter an exact address.</small>
            </div>
          </div>
        </div>
      </header>

      <div className="container prepare-main">
        <section className="prepare-trust-strip">
          <strong>SELF-CHECK ≠ BIO-SCORE</strong>
          <p>Checklist progress stays in this browser. It becomes readiness evidence only after an evaluated Queen drill or verified action.</p>
          <Link href={terminalHref(PREPAREDNESS_PROTOCOLS[5].prompt, "SIMULATE")}>RUN READINESS DRILL →</Link>
        </section>

        <DailyActionPanel context="PREPARE" />

        <section className="prepare-next-action">
          <div className="queen-core queen-core-small"><span /></div>
          <div>
            <span>BASELINE // NEXT OPEN GAP</span>
            <h2>{nextItem ? nextItem.title : "Audit the baseline you completed"}</h2>
            <p>{nextItem?.evidence || "A completed list is only useful if the assumptions still match your household and local risks."}</p>
          </div>
          <Link href={terminalHref(nextActionPrompt)}>ASK QUEEN TO ADAPT →</Link>
        </section>

        <div className="prepare-layout">
          <section className="prepare-checklist" aria-labelledby="baseline-title">
            <div className="prepare-section-heading">
              <div>
                <span>01 // HOUSEHOLD BASELINE</span>
                <h2 id="baseline-title">Evidence you can actually check</h2>
              </div>
              <strong>{completedCount}/{PREPAREDNESS_CHECKLIST.length}</strong>
            </div>

            <div className="prepare-domain-summary">
              {domainProgress.map((domain) => (
                <div key={domain.id} className={domain.done === domain.total ? "complete" : ""}>
                  <span>{domain.shortLabel}</span>
                  <strong>{domain.done}/{domain.total}</strong>
                </div>
              ))}
            </div>

            <div className="prepare-domain-list">
              {PREPAREDNESS_DOMAINS.map((domain) => (
                <PreparednessDomainBlock
                  key={domain.id}
                  domain={domain.id}
                  completed={completed}
                  onToggle={toggleItem}
                />
              ))}
            </div>
          </section>

          <aside className="prepare-protocols" aria-labelledby="protocols-title">
            <div className="prepare-section-heading">
              <div>
                <span>02 // RESPONSE PROTOCOLS</span>
                <h2 id="protocols-title">Start from the situation</h2>
              </div>
            </div>
            <p className="prepare-section-intro">Each protocol opens RED QUEEN in the correct mode with a focused first request.</p>

            <div className="prepare-protocol-list">
              {PREPAREDNESS_PROTOCOLS.map((protocol) => (
                <Link
                  key={protocol.id}
                  href={terminalHref(protocol.prompt, protocol.mode, protocol.id === "wallet" ? "DIGITAL_SECURITY" : "HOUSEHOLD")}
                >
                  <span>{protocol.mode}</span>
                  <strong>{protocol.label}</strong>
                  <p>{protocol.description}</p>
                  <b>OPEN WITH QUEEN →</b>
                </Link>
              ))}
            </div>
          </aside>
        </div>

        <section className="prepare-system-loop">
          <div className="prepare-section-heading">
            <div>
              <span>03 // HOW READINESS WORKS</span>
              <h2>One loop, three different signals</h2>
            </div>
          </div>
          <div className="prepare-loop-grid">
            <div><span>01</span><strong>Local checklist</strong><p>A private memory aid stored on this device. It is not proof and never awards XP.</p></div>
            <div><span>02</span><strong>Queen action</strong><p>A contextual plan that turns a gap into one safe task you can complete.</p></div>
            <div><span>03</span><strong>Evaluated evidence</strong><p>A decision drill or demonstrated action may update BIO and earned XP.</p></div>
          </div>
        </section>

        <section className="prepare-token-utility">
          <div>
            <span className="pulse-eyebrow">$THREAT // INTELLIGENCE CLEARANCE</span>
            <h2>Safety basics stay public. Tokens deepen the system.</h2>
            <p>$THREAT expands Queen context and analysis depth and modestly multiplies XP that was genuinely earned. Holdings never manufacture readiness or replace evidence.</p>
          </div>
          <div className="prepare-tier-list">
            {THREAT_CLEARANCE_LEVELS.map((tier) => (
              <div key={tier.tier}>
                <span>LVL {tier.level}</span>
                <strong>{tier.name}</strong>
                <em>{formatTokenThreshold(tier.threshold)}</em>
                <p>{tier.description}</p>
                <b>{tier.contextMessages} context messages · ×{tier.earnedXpMultiplier.toFixed(2)} earned XP</b>
              </div>
            ))}
          </div>
        </section>
      </div>
    </div>
  );
}

function PreparednessDomainBlock({
  domain,
  completed,
  onToggle,
}: {
  domain: PreparednessDomain;
  completed: Record<string, boolean>;
  onToggle: (id: string) => void;
}) {
  const definition = PREPAREDNESS_DOMAINS.find((item) => item.id === domain)!;
  const items = PREPAREDNESS_CHECKLIST.filter((item) => item.domain === domain);

  return (
    <div className="prepare-domain-block">
      <div>
        <span>{definition.shortLabel}</span>
        <strong>{definition.label}</strong>
        <p>{definition.description}</p>
      </div>
      <div className="prepare-check-items">
        {items.map((item) => (
          <button
            key={item.id}
            type="button"
            aria-pressed={Boolean(completed[item.id])}
            className={completed[item.id] ? "checked" : ""}
            onClick={() => onToggle(item.id)}
          >
            <i aria-hidden="true">{completed[item.id] ? "✓" : ""}</i>
            <span><strong>{item.title}</strong><small>{item.evidence}</small></span>
          </button>
        ))}
      </div>
    </div>
  );
}
