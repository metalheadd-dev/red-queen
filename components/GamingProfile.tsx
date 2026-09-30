"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { useSavedGames } from "@/components/useSavedGames";
import { steamStoreUrl, SURVIVAL_GAMES } from "@/lib/gaming/catalog";

type SteamStatus = { available: boolean; steamId: string | null; message?: string };

export default function GamingProfile() {
  const { user } = useAuth();
  return <GamingProfileContent key={user?.id || "guest"} />;
}

function GamingProfileContent() {
  const { user, session, loading } = useAuth();
  const { saved, loaded: savedLoaded, notice, removeSaved } = useSavedGames();
  const [steam, setSteam] = useState<SteamStatus | null>(null);
  const [working, setWorking] = useState(false);
  const [feedback, setFeedback] = useState("");
  const completing = useRef(false);
  const savedGames = useMemo(() => SURVIVAL_GAMES.filter((game) => saved.includes(game.id)), [saved]);

  useEffect(() => {
    const reason = new URLSearchParams(window.location.search).get("steam");
    if (reason && reason !== "ready") {
      setFeedback(reason === "cancelled" ? "Steam sign-in was cancelled. You can connect again whenever you are ready." : reason === "unavailable" ? "Steam could not be reached. Try again later." : "Steam sign-in could not be verified. Please try again.");
      window.history.replaceState(null, "", "/gaming/profile");
    }
  }, []);

  useEffect(() => {
    if (!session?.access_token) { setSteam(null); return; }
    let cancelled = false;
    const token = session.access_token;
    async function load() {
      try {
        const response = await fetch("/api/gaming/steam/link", { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" });
        const data = await response.json();
        if (!cancelled) setSteam(response.ok ? data : { available: false, steamId: null, message: data.error || "Steam connection is unavailable." });
      } catch { if (!cancelled) setSteam({ available: false, steamId: null, message: "Steam connection is unavailable." }); }
    }
    void load();
    return () => { cancelled = true; };
  }, [session?.access_token]);

  useEffect(() => {
    if (!session?.access_token || !steam || !steam.available || completing.current || !window.location.search.includes("steam=ready")) return;
    if (steam.steamId) { window.history.replaceState(null, "", "/gaming/profile"); return; }
    completing.current = true;
    const token = session.access_token;
    async function complete() {
      setWorking(true);
      try {
        const response = await fetch("/api/gaming/steam/link", { method: "POST", headers: { Authorization: `Bearer ${token}` } });
        const data = await response.json();
        if (response.ok) { setSteam({ available: true, steamId: data.steamId }); setFeedback("Steam account connected."); }
        else setFeedback(data.error || "Could not complete Steam connection.");
      } catch { setFeedback("Could not complete Steam connection."); }
      finally { setWorking(false); window.history.replaceState(null, "", "/gaming/profile"); completing.current = false; }
    }
    void complete();
  }, [session?.access_token, steam]);

  async function connect() {
    if (!session?.access_token || working) return;
    setWorking(true); setFeedback("");
    try {
      const response = await fetch("/api/gaming/steam/start", { method: "POST", headers: { Authorization: `Bearer ${session.access_token}` } });
      const data = await response.json();
      if (!response.ok || !data.url) throw new Error(data.error || "Could not start Steam sign-in.");
      window.location.assign(data.url);
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : "Could not start Steam sign-in.");
      setWorking(false);
    }
  }

  async function unlink() {
    if (!session?.access_token || !steam?.steamId) return;
    setWorking(true); setFeedback("");
    try {
      const response = await fetch("/api/gaming/steam/link", { method: "DELETE", headers: { Authorization: `Bearer ${session.access_token}` } });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not disconnect Steam.");
      setSteam({ available: true, steamId: null }); setFeedback("Steam account disconnected.");
    } catch (error) { setFeedback(error instanceof Error ? error.message : "Could not disconnect Steam."); }
    finally { setWorking(false); }
  }

  return <div className="gaming-page gaming-subpage"><header className="gaming-subhero"><div className="gaming-wrap"><nav className="gaming-breadcrumbs" aria-label="Breadcrumb"><Link href="/gaming">GAMING ROOM</Link><span>/</span><span>MY STATION</span></nav><span className="gaming-kicker">RQ / PLAYER STATION</span><h1>YOUR SURVIVAL SIGNAL.</h1><p>Connect your Steam identity and keep a short list of games to explore. Your saved list stays in this browser and does not change your Steam wishlist.</p></div></header>
    <div className="gaming-wrap gaming-subcontent"><div className="gaming-panel-grid"><section className="gaming-panel" aria-labelledby="steam-connect-title"><span className="gaming-kicker">01 / STEAM IDENTITY</span><h2 id="steam-connect-title">CONNECT TO THE ROOM.</h2><div className="gaming-profile-status">
      {loading || (user && !steam) ? <p>CHECKING YOUR STATION...</p> : !user ? <><strong>RQ SIGN-IN REQUIRED</strong><p>Sign in to Red Queen first. Steam connection will then attach to your private account.</p><Link href="/login?next=%2Fgaming%2Fprofile" className="gaming-button gaming-button-primary">SIGN IN TO RQ ↗</Link></> : !steam?.available ? <><strong>CONNECTION UNAVAILABLE</strong><p>{steam?.message || "The Steam connection is not configured yet."}</p></> : steam.steamId ? <><strong>STEAM CONNECTED</strong><code>{steam.steamId}</code><small>Only the account owner can see this linked Steam ID here. We do not import your library or achievements.</small><a href={`https://steamcommunity.com/profiles/${steam.steamId}`} target="_blank" rel="noopener noreferrer">OPEN MY STEAM PROFILE ↗</a><button type="button" className="gaming-button gaming-button-outline" onClick={() => void unlink()} disabled={working}>DISCONNECT STEAM</button></> : <><strong>READY TO LINK</strong><p>Steam will verify your identity through its official sign-in page. RED QUEEN receives your Steam ID, not your password.</p><button type="button" onClick={() => void connect()} disabled={working} className="gaming-button gaming-button-primary">{working ? "CONNECTING..." : "CONNECT WITH STEAM ↗"}</button></>}
      {feedback && <p className="gaming-profile-feedback" role="status">{feedback}</p>}
    </div></section>
    <section className="gaming-panel" aria-labelledby="saved-games-title"><span className="gaming-kicker">02 / THIS BROWSER</span><h2 id="saved-games-title">SAVED GAMES.</h2>{!savedLoaded ? <p>LOADING YOUR SAVED LIST...</p> : savedGames.length ? <div className="gaming-saved-list">{savedGames.map((game) => <div className="gaming-saved-row" key={game.id}><a href={steamStoreUrl(game.id)} target="_blank" rel="noopener noreferrer">{game.title}<span>↗</span></a><button type="button" onClick={() => removeSaved(game.id)} aria-label={`Remove ${game.title} from saved games`}>REMOVE</button></div>)}</div> : <p>No games saved yet. Explore the curated list and press “Save +” on a title you want to revisit.</p>}{notice && <p className="gaming-profile-feedback" role="status">{notice}</p>}<div className="gaming-panel-footer"><Link href="/gaming#gaming-catalog" className="gaming-button gaming-button-outline">BROWSE THE CATALOG ↗</Link></div></section></div>
      <div className="gaming-chain" style={{ marginTop: 35 }}><div><span className="gaming-kicker">03 / FUTURE SEASONS</span><h2>PLAY FIRST. PROVE LATER.</h2><p>Linking Steam does not enroll you in a contest, disclose your game history or make an onchain transaction. Each season will state its own rules before entries open.</p></div><Link href="/gaming/contests" className="gaming-button gaming-button-outline">VIEW THE SEASON BOARD ↗</Link></div>
    </div>
  </div>;
}
