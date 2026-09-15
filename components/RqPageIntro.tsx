import Link from "next/link";

export default function RqPageIntro({ eyebrow, title, description, action }: { eyebrow: string; title: string; description: string; action?: { href: string; label: string } }) {
  return <header className="rq-page-intro"><div><span className="rq-kicker">RQ / {eyebrow}</span><h1>{title}</h1><p>{description}</p></div>{action && <Link href={action.href} className="rq-button rq-button-secondary">{action.label}<span>↗</span></Link>}</header>;
}
