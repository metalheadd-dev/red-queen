import Link from "next/link";

type MobileCommandAction = {
  href: string;
  label: string;
  tone?: "primary" | "secondary";
};

type MobileCommandHeaderProps = {
  eyebrow: string;
  title: string;
  description: string;
  status: string;
  actions: MobileCommandAction[];
  steps?: string[];
};

export default function MobileCommandHeader({
  eyebrow,
  title,
  description,
  status,
  actions,
  steps = [],
}: MobileCommandHeaderProps) {
  return (
    <section className="mobile-command-header" aria-label={`${title} quick start`}>
      <div className="mobile-command-status"><i />{status}</div>
      <span>{eyebrow}</span>
      <h1>{title}</h1>
      <p>{description}</p>
      <div className="mobile-command-actions">
        {actions.map((action) => (
          <Link
            key={`${action.href}-${action.label}`}
            href={action.href}
            className={action.tone === "secondary" ? "is-secondary" : "is-primary"}
          >
            {action.label}<b>→</b>
          </Link>
        ))}
      </div>
      {steps.length > 0 && (
        <div className="mobile-command-steps" aria-label="Product flow">
          {steps.map((step, index) => <span key={step}><b>0{index + 1}</b>{step}</span>)}
        </div>
      )}
    </section>
  );
}
