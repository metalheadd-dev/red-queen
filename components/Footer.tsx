import Link from "next/link";
import RqWordmark from "./RqWordmark";
import RqBootReplay from "./RqBootReplay";
export default function Footer() {
  return <footer className="footer rq-footer"><div className="rq-shell"><div><Link href="/" aria-label="RQ Corp home"><RqWordmark corp /></Link><p>Stay informed. Adapt. SOLvive.</p><small>SURVIVAL ECOSYSTEM · SOLANA · x402</small><RqBootReplay /></div><nav aria-label="Footer navigation"><Link href="/reports">x402 intelligence</Link><Link href="/docs">How it works</Link><Link href="/community">The world of RQ</Link><Link href="/gaming">Gaming Room</Link><Link href="/for-agents">For agents</Link><Link href="/privacy">Privacy</Link><Link href="/terms">Terms</Link></nav><p className="rq-footer-note"><span>RQ CORP / RED QUEEN</span> Red Queen helps you prepare. Follow local authorities during an emergency.</p></div></footer>;
}
