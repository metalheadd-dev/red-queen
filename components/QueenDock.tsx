"use client";

import { useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import type { AgentMode, SurvivalContext } from "@/lib/survival-context";

type DockAction = { label: string; mode: AgentMode; prompt: string };

const dockContent: Array<{
  match: (pathname: string) => boolean;
  eyebrow: string;
  title: string;
  note: string;
  actions: DockAction[];
}> = [
  {
    match: (pathname) => pathname === "/",
    eyebrow: "DAILY PULSE",
    title: "I am watching the signal field.",
    note: "Ask what changed, what is verified, and what deserves your attention.",
    actions: [
      { label: "WHAT MATTERS NOW?", mode: "MONITOR", prompt: "Brief me on the verified signals that matter for my context right now. Separate facts, uncertainty, and one action." },
      { label: "GIVE ME ONE ACTION", mode: "PREPARE", prompt: "Based on my survival context, give me the single highest-impact preparedness action I can complete today." },
    ],
  },
  {
    match: (pathname) => pathname.startsWith("/survival-kit"),
    eyebrow: "PREPAREDNESS",
    title: "Readiness is built one action at a time.",
    note: "I can turn your gaps into a practical plan for today, 24 hours, or 72 hours.",
    actions: [
      { label: "PLAN MY NEXT STEP", mode: "PREPARE", prompt: "Use my readiness context to choose my most important gap and turn it into one specific action for today." },
      { label: "BUILD A 72H PLAN", mode: "PREPARE", prompt: "Build a concise 72-hour household resilience plan for my context. Prioritize the essentials and explain why." },
    ],
  },
  {
    match: (pathname) => pathname.startsWith("/threat-vector"),
    eyebrow: "THREAT LIBRARY",
    title: "A dossier is useful only when it changes a decision.",
    note: "I can translate a scenario into relevance, uncertainty, and safe next actions.",
    actions: [
      { label: "ANALYZE MY EXPOSURE", mode: "ANALYZE", prompt: "Help me assess which threat categories in the library are most relevant to my context, without sensationalism." },
      { label: "RUN A DECISION DRILL", mode: "SIMULATE", prompt: "Run one realistic survival decision drill based on a relevant threat. Wait for my answer before evaluating it." },
    ],
  },
  {
    match: (pathname) => pathname.startsWith("/operative"),
    eyebrow: "MY READINESS",
    title: "Your score is evidence, not decoration.",
    note: "Train a weak domain or add a practical preparedness action to your record.",
    actions: [
      { label: "TRAIN MY WEAKEST DOMAIN", mode: "SIMULATE", prompt: "Run a short decision drill for my weakest survival readiness domain. Score only the evidence in my answer." },
      { label: "IMPROVE MY BASELINE", mode: "PREPARE", prompt: "Help me improve my readiness baseline with one practical, measurable action." },
    ],
  },
];

const visibleCoreRoutes = ["/", "/terminal", "/survival-kit", "/threat-vector", "/operative"];

function buildHref(action: DockAction, area: string) {
  const query = new URLSearchParams({ mode: action.mode, prompt: action.prompt });
  if (area) query.set("area", area);
  return `/terminal?${query.toString()}`;
}

export default function QueenDock() {
  const pathname = usePathname();
  const [open, setOpen] = useState(false);
  const [area, setArea] = useState("");

  useEffect(() => {
    try {
      const context = JSON.parse(localStorage.getItem("rq-survival-context-v1") || "{}") as Partial<SurvivalContext>;
      setArea(typeof context.area === "string" ? context.area : "");
    } catch {
      setArea("");
    }
  }, [pathname]);

  useEffect(() => setOpen(false), [pathname]);

  const content = useMemo(
    () => dockContent.find((item) => item.match(pathname)) || dockContent[0],
    [pathname],
  );

  const isVisible = visibleCoreRoutes.some((route) => route === "/" ? pathname === "/" : pathname.startsWith(route));
  if (!isVisible || pathname.startsWith("/terminal")) return null;

  return (
    <aside className={`queen-dock${open ? " is-open" : ""}`} aria-label="Red Queen contextual assistant">
      {open && (
        <div className="queen-dock-panel">
          <div className="queen-dock-head">
            <div className="queen-dock-orb"><i /></div>
            <div><span>{content.eyebrow}</span><strong>RED QUEEN</strong></div>
            <button onClick={() => setOpen(false)} aria-label="Close Red Queen assistant">×</button>
          </div>
          <h2>{content.title}</h2>
          <p>{content.note}</p>
          {area && <small>CONTEXT LOCKED · {area.toUpperCase()}</small>}
          <div className="queen-dock-actions">
            {content.actions.map((action) => (
              <Link key={action.label} href={buildHref(action, area)}>{action.label}<span>→</span></Link>
            ))}
          </div>
          <Link href="/terminal" className="queen-dock-open-terminal">OPEN FULL QUEEN TERMINAL</Link>
        </div>
      )}
      <button className="queen-dock-trigger" onClick={() => setOpen((value) => !value)} aria-expanded={open}>
        <span className="queen-dock-orb"><i /></span>
        <span><strong>ASK RED QUEEN</strong><small>{area ? `${area} · CONTEXT READY` : "CONTEXTUAL SURVIVAL AI"}</small></span>
        <b>{open ? "×" : "↑"}</b>
      </button>
    </aside>
  );
}
