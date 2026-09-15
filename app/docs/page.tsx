import type { Metadata } from "next";
import Link from "next/link";
import RqPageIntro from "@/components/RqPageIntro";

export const metadata: Metadata = { title: "How RQ works | RQ", description: "Start with Red Queen. Understand threats, build a plan and find useful supplies. A plain-language guide to RQ." };

const questions = [
  { id: "start", title: "What is RQ? Who is Red Queen?", answer: "RQ is the app. Red Queen is your AI survival agent and the character at the heart of its world. She helps you understand threats, think through decisions and prepare. The atmosphere is dark. The instructions should be clear." },
  { id: "account", title: "Do I need an account or a wallet?", answer: "You can explore threats, start chatting and build your checklist without either. An account saves your conversations and evaluated progress. A wallet is needed only for optional Solana features and paid requests. Connecting one does not approve a payment." },
  { id: "x402", title: "What am I paying for?", answer: "Intelligence reports are optional, one-off requests. Choose an operation, review what you will receive and approve its displayed USDC price. Some reports use additional external data. Queen shows those providers, shared information and costs before purchase. You can inspect your result and receipt afterward. There is no recurring subscription in this flow." },
  { id: "survival-market", title: "How do I buy physical supplies?", answer: "Describe your threat, household and constraints to Queen or use the Shop. Review your suggested kit first. Search links help you find products; they do not place an order. For supported Amazon or eBay products, the separate SP3ND checkout flow reviews product links, delivery details and a quoted total before you approve a purchase. Building a kit never spends money. Available checkout options depend on provider and destination." },
  { id: "readiness", title: "What are XP, BIO and checklist progress?", answer: "Your checklist is a private reminder stored in this browser. XP records eligible evaluated participation. BIO is Queen’s estimate based on evaluated decisions and preparedness evidence, not a professional certification or guarantee of safety. Buying reports and simply chatting do not raise it." },
  { id: "token", title: "Do I have to own $THREAT?", answer: "No. $THREAT is optional. Verified holdings can expand conversation capacity, watch slots and other published benefits. Holdings do not prove preparedness. USDC is used separately for paid intelligence requests." },
  { id: "fiction", title: "Can I prepare for a fictional apocalypse?", answer: "Yes. Ask about a zombie outbreak or a favourite survival game. Fiction is clearly labelled and kept separate from live events. Queen can use the scenario to practise practical decisions about shelter, supplies and teamwork." },
  { id: "privacy", title: "What happens to my introduction answers?", answer: "Your optional name or alias, broad location, household size and interests stay on this device. Starting the first conversation puts those answers into a draft you can review and edit before sending. Never put a seed phrase, private key or delivery address in chat. Shipping details belong only in a reviewed checkout." },
  { id: "sources", title: "Can I rely on this in an emergency?", answer: "RQ is decision support, not an emergency service. Check source links and timestamps. Live feeds can be incomplete or unavailable. Follow local authorities and emergency services for immediate danger." },
  { id: "agents", title: "Can other AI agents use Queen?", answer: "Yes. The developer section documents her public tools and paid endpoints. Agents can discover available operations, review a price and request a result through x402 on Solana. The registered agent remains Red Queen." },
];
export default function GuidePage() {
  return <div className="rq-experience rq-product-page rq-guide"><div className="rq-shell">
    <RqPageIntro eyebrow="HOW RQ WORKS" title="Start with a question." description="You don’t need to understand every feature. Tell Queen what you’re facing. She’ll help you choose the next step." action={{ href: "/red-queen", label: "Talk to Red Queen" }} />
    <div className="rq-guide-steps">
      <Link href="/red-queen"><span className="rq-kicker">01 / ASK</span><h2>Tell her what’s wrong.</h2><p>A threat, a concern or a “what if”. Queen asks for the context she needs.</p></Link>
      <Link href="/prepare"><span className="rq-kicker">02 / PLAN</span><h2>Choose a useful action.</h2><p>Turn the conversation into practical next steps for you and your household.</p></Link>
      <Link href="/shop"><span className="rq-kicker">03 / EQUIP</span><h2>Get what you need.</h2><p>Build a kit, review the items and choose whether to buy them.</p></Link>
    </div>
    <section className="rq-guide-faq" aria-labelledby="rq-questions"><h2 id="rq-questions">A few things worth knowing.</h2>
      {questions.map(q => <details key={q.id} id={q.id}><summary>{q.title}<span>+</span></summary><p>{q.answer}</p></details>)}
    </section>
    <div className="rq-product-footnote"><Link href="/for-agents">Developer & agent documentation ↗</Link><Link href="/privacy">Privacy controls ↗</Link><Link href="/community">Meet the world of RQ ↗</Link></div>
  </div></div>;
}
