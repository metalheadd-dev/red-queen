import type { Metadata } from "next";
import Link from "next/link";
import IntelligenceOperationsClient from "@/components/IntelligenceOperationsClient";
import RqPageIntro from "@/components/RqPageIntro";
export const metadata: Metadata = { title: "Intelligence reports | RQ", description: "Get a focused report from Red Queen. Clear prices, sources and a practical next step." };
export default function ReportsPage() {
  return <div className="rq-experience rq-product-page"><div className="rq-shell onchain-main"><RqPageIntro eyebrow="INTELLIGENCE REPORTS" title="A clearer picture. A better next move." description="Choose what you need to understand. Queen prepares a focused report with sources. Pay once in USDC, with the price shown before approval." action={{ href: "/red-queen", label: "Not sure? Ask Queen" }} /><IntelligenceOperationsClient /><div className="rq-product-footnote"><p>Just exploring? Start with a free conversation or the live map.</p><Link href="/for-agents">Use these reports in your AI agent ↗</Link></div></div></div>;
}
