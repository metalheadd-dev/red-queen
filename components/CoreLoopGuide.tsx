import Link from "next/link";

export type CoreLoopStep = "pulse" | "queen" | "prepare" | "profile";

type CoreLoopGuideProps = {
  current?: CoreLoopStep;
  eyebrow?: string;
  title: string;
  description: string;
  actionHref: string;
  actionLabel: string;
  accessNote?: string;
};

const STEPS: Array<{ id: CoreLoopStep; index: string; verb: string; label: string; href: string }> = [
  { id: "pulse", index: "01", verb: "LOOK", label: "Choose context", href: "/" },
  { id: "queen", index: "02", verb: "ASK", label: "Understand", href: "/red-queen" },
  { id: "prepare", index: "03", verb: "ACT", label: "Complete a step", href: "/prepare" },
  { id: "profile", index: "04", verb: "TRACK", label: "Review progress", href: "/profile" },
];

export default function CoreLoopGuide({
  current,
  eyebrow = "YOUR SURVIVAL LOOP",
  title,
  description,
  actionHref,
  actionLabel,
  accessNote,
}: CoreLoopGuideProps) {
  return (
    <section className="core-loop-guide" aria-label="RED QUEEN product path">
      <nav className="core-loop-steps" aria-label="Core survival loop">
        {STEPS.map((step) => (
          <Link key={step.id} href={step.href} className={current === step.id ? "is-current" : ""} aria-current={current === step.id ? "step" : undefined}>
            <small>{step.index}</small>
            <span><strong>{step.verb}</strong><b>{step.label}</b></span>
          </Link>
        ))}
      </nav>
      <div className="core-loop-next">
        <div>
          <span>{eyebrow}</span>
          <strong>{title}</strong>
          <p>{description}</p>
          {accessNote && <small>{accessNote}</small>}
        </div>
        <Link href={actionHref}>{actionLabel} <b>→</b></Link>
      </div>
    </section>
  );
}
