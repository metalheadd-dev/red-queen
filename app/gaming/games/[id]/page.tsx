import Link from "next/link";
import { notFound } from "next/navigation";
import GamingCurrentPlayers from "@/components/GamingCurrentPlayers";
import { catalogTags, steamStoreUrl } from "@/lib/gaming/catalog";
import { getPublishedCatalog } from "@/lib/gaming/catalog-server";

export const dynamic = "force-dynamic";

export default async function GamingGamePage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const appId = Number(id);
  if (!Number.isSafeInteger(appId) || appId <= 0) notFound();
  const { games } = await getPublishedCatalog();
  const game = games.find(item => item.id === appId);
  if (!game) notFound();
  return <div className="gaming-page gaming-subpage"><header className="gaming-subhero"><div className="gaming-wrap"><nav className="gaming-breadcrumbs" aria-label="Breadcrumb"><Link href="/gaming">GAMING ROOM</Link><span>/</span><span>GAME FILE</span></nav><span className="gaming-kicker">RQ FILE / {game.lane}</span><h1>{game.title}</h1><p>{game.note}</p></div></header>
    <main className="gaming-wrap gaming-subcontent gaming-detail-layout"><section className="gaming-panel"><span className="gaming-kicker">SURVIVAL DOSSIER</span><h2>{game.setting}</h2><div className="gaming-detail-tags"><span>{game.genre || game.lane}</span>{catalogTags(game).map(tag => <span key={tag}>{tag}</span>)}</div><dl><div><dt>STUDIO</dt><dd>{game.studio}</dd></div><div><dt>RQ LANE</dt><dd>{game.lane}</dd></div><div><dt>STEAM APP ID</dt><dd>{game.id}</dd></div></dl><div className="gaming-panel-footer"><a className="gaming-button gaming-button-primary" href={steamStoreUrl(game.id)} target="_blank" rel="noopener noreferrer">OPEN ON STEAM ↗</a><Link className="gaming-button gaming-button-outline" href={`/gaming/queen?game=${game.id}`}>PLAN WITH QUEEN →</Link></div></section>
      <aside className="gaming-panel"><span className="gaming-kicker">PUBLIC STEAM SIGNAL</span><GamingCurrentPlayers appId={game.id} /><p>Current players are a Steam snapshot. They do not measure total owners, purchases or sales.</p><Link className="gaming-button gaming-button-outline" href="/gaming/profile">MY STEAM STATS ↗</Link></aside></main>
  </div>;
}
