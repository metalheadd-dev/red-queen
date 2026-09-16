import Link from "next/link";
export default function Footer() {
  return <footer className="footer rq-footer"><div className="rq-shell"><div><Link className="rq-wordmark" href="/">RQ<span>/</span></Link><p>Stay informed. Adapt. SOLvive.</p><small>SURVIVAL ECOSYSTEM · SOLANA · x402</small></div><nav aria-label="Footer navigation"><Link href="/reports">x402 intelligence</Link><Link href="/docs">How it works</Link><Link href="/community">The world of RQ</Link><Link href="/for-agents">For agents</Link><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link></nav><p className="rq-footer-note"><span>RQ / RED QUEEN ONLINE</span> Red Queen helps you prepare. Follow local authorities during an emergency.</p></div></footer>;
}
