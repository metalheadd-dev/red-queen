import type { Metadata } from "next";
import Link from "next/link";
import IntelligenceOperationsClient from "@/components/IntelligenceOperationsClient";
import RqPageIntro from "@/components/RqPageIntro";
export const metadata: Metadata = { title: "Intelligence reports | RQ", description: "Get a focused report from Red Queen. Clear prices, sources and a practical next step." };
export default async function ReportsPage({ searchParams }: { searchParams: Promise<{ product?: string }> }) {
  const { product } = await searchParams;
  return <div className="rq-experience rq-product-page"><div className="rq-shell onchain-main"><RqPageIntro eyebrow="x402 INTELLIGENCE / SOLANA" title="A clearer picture. A better next move." description="Choose one operation. Red Queen prepares a focused result with sources and a receipt. Pay once in USDC, with the exact price shown before wallet approval." action={{ href: "/red-queen", label: "Not sure? Ask Red Queen" }} /><IntelligenceOperationsClient initialProduct={product} /><div className="rq-product-footnote"><p>Just exploring? Start with a free conversation or the live map.</p><Link href="/for-agents">Use these reports in your AI agent ↗</Link></div></div></div>;
}
