"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { useSavedGames } from "@/components/useSavedGames";
import { steamStoreUrl, SURVIVAL_GAMES, type SurvivalGame } from "@/lib/gaming/catalog";
import type { SteamAchievement, SteamDashboard, SteamGame } from "@/lib/gaming/steam-stats";

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
  const [catalog, setCatalog] = useState<SurvivalGame[]>([...SURVIVAL_GAMES]);
  const completing = useRef(false);
  const savedGames = useMemo(() => catalog.filter((game) => saved.includes(game.id)), [saved, catalog]);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/gaming/catalog").then(response => response.json()).then(data => {
      if (!cancelled && Array.isArray(data.games)) setCatalog(data.games);
    }).catch(() => {});
    return () => { cancelled = true; };
  }, []);

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
      {loading || (user && !steam) ? <p>CHECKING YOUR STATION...</p> : !user ? <><strong>RQ SIGN-IN REQUIRED</strong><p>Sign in to Red Queen first. Steam connection will then attach to your private account.</p><Link href="/login?next=%2Fgaming%2Fprofile" className="gaming-button gaming-button-primary">SIGN IN TO RQ ↗</Link></> : !steam?.available ? <><strong>CONNECTION UNAVAILABLE</strong><p>{steam?.message || "The Steam connection is not configured yet."}</p></> : steam.steamId ? <><strong>STEAM CONNECTED</strong><code>{steam.steamId}</code><small>Only your RQ account can see your Steam games here. Steam controls which library and activity details are visible.</small><a href={`https://steamcommunity.com/profiles/${steam.steamId}`} target="_blank" rel="noopener noreferrer">OPEN MY STEAM PROFILE ↗</a><button type="button" className="gaming-button gaming-button-outline" onClick={() => void unlink()} disabled={working}>DISCONNECT STEAM</button></> : <><strong>READY TO LINK</strong><p>Steam will verify your identity through its official sign-in page. RED QUEEN receives your Steam ID, not your password.</p><button type="button" onClick={() => void connect()} disabled={working} className="gaming-button gaming-button-primary">{working ? "CONNECTING..." : "CONNECT WITH STEAM ↗"}</button></>}
      {feedback && <p className="gaming-profile-feedback" role="status">{feedback}</p>}
    </div></section>
    <section className="gaming-panel" aria-labelledby="saved-games-title"><span className="gaming-kicker">02 / THIS BROWSER</span><h2 id="saved-games-title">SAVED GAMES.</h2>{!savedLoaded ? <p>LOADING YOUR SAVED LIST...</p> : savedGames.length ? <div className="gaming-saved-list">{savedGames.map((game) => <div className="gaming-saved-row" key={game.id}><a href={steamStoreUrl(game.id)} target="_blank" rel="noopener noreferrer">{game.title}<span>↗</span></a><button type="button" onClick={() => removeSaved(game.id)} aria-label={`Remove ${game.title} from saved games`}>REMOVE</button></div>)}</div> : <p>No games saved yet. Explore the curated list and press “Save +” on a title you want to revisit.</p>}{notice && <p className="gaming-profile-feedback" role="status">{notice}</p>}<div className="gaming-panel-footer"><Link href="/gaming#gaming-catalog" className="gaming-button gaming-button-outline">BROWSE THE CATALOG ↗</Link></div></section></div>
      {steam?.steamId && session?.access_token && <SteamLibrary key={steam.steamId} token={session.access_token} />}
      <div className="gaming-chain" style={{ marginTop: 35 }}><div><span className="gaming-kicker">04 / FUTURE SEASONS</span><h2>PLAY FIRST. PROVE LATER.</h2><p>Linking Steam does not enroll you in a contest, disclose your game history or make an onchain transaction. Each season will state its own rules before entries open.</p></div><Link href="/gaming/contests" className="gaming-button gaming-button-outline">VIEW THE SEASON BOARD ↗</Link></div>
    </div>
  </div>;
}

function hours(minutes: number): string {
  return (minutes / 60).toLocaleString(undefined, { maximumFractionDigits: 1 });
}

function SteamLibrary({ token }: { token: string }) {
  const [dashboard, setDashboard] = useState<SteamDashboard | null>(null);
  const [error, setError] = useState("");
  const [refresh, setRefresh] = useState(0);
  const [filter, setFilter] = useState<"ALL" | "RECENT">("ALL");
  const [query, setQuery] = useState("");
  const [shown, setShown] = useState(20);
  const [selected, setSelected] = useState<SteamGame | null>(null);
  const [achievements, setAchievements] = useState<SteamAchievement[] | null>(null);
  const [achievementError, setAchievementError] = useState("");
  const [achievementLoading, setAchievementLoading] = useState(false);
  const achievementRequest = useRef(0);

  useEffect(() => {
    let cancelled = false;
    async function load() {
      try {
        const response = await fetch("/api/gaming/steam/stats", { headers: { Authorization: `Bearer ${token}` }, cache: "no-store" });
        const data = await response.json();
        if (!cancelled) {
          if (!response.ok) throw new Error(data.error || "Steam data could not be loaded.");
          setDashboard(data as SteamDashboard);
          setError("");
        }
      } catch (cause) {
        if (!cancelled) setError(cause instanceof Error ? cause.message : "Steam data could not be loaded.");
      }
    }
    void load();
    return () => { cancelled = true; };
  }, [token, refresh]);

  const filtered = useMemo(() => {
    if (!dashboard) return [];
    const source = filter === "RECENT" ? dashboard.recentlyPlayed : dashboard.games;
    return source.filter(game => game.title.toLowerCase().includes(query.trim().toLowerCase()));
  }, [dashboard, filter, query]);

  async function showAchievements(game: SteamGame) {
    const requestId = ++achievementRequest.current;
    setSelected(game);
    setAchievements(null);
    setAchievementError("");
    setAchievementLoading(true);
    try {
      const response = await fetch(`/api/gaming/steam/achievements?appid=${game.appId}`, {
        headers: { Authorization: `Bearer ${token}` }, cache: "no-store",
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Achievements could not be loaded.");
      if (requestId === achievementRequest.current) setAchievements(data.achievements);
    } catch (cause) {
      if (requestId === achievementRequest.current) setAchievementError(cause instanceof Error ? cause.message : "Achievements could not be loaded.");
    } finally { if (requestId === achievementRequest.current) setAchievementLoading(false); }
  }

  return <section className="gaming-panel gaming-steam-library" aria-labelledby="steam-library-title">
    <div className="gaming-steam-heading"><div><span className="gaming-kicker">03 / YOUR STEAM DATA</span><h2 id="steam-library-title">PLAYER INTEL.</h2></div><button type="button" className="gaming-button gaming-button-outline" onClick={() => { achievementRequest.current++; setSelected(null); setDashboard(null); setError(""); setRefresh(value => value + 1); }}>REFRESH STEAM ↻</button></div>
    {!dashboard && !error && <p role="status">Loading visible Steam games...</p>}
    {error && <p role="alert">{error}</p>}
    {dashboard && <>
      {dashboard.profile && <div className="gaming-steam-identity"><div><strong>{dashboard.profile.name}</strong><span>{dashboard.profile.currentGame ? `PLAYING ${dashboard.profile.currentGame}` : `STEAM PROFILE ${dashboard.profile.visibility}`}</span></div><a href={dashboard.profile.profileUrl} target="_blank" rel="noopener noreferrer">VIEW ON STEAM ↗</a></div>}
      <div className="gaming-steam-metrics"><div><strong>{dashboard.games.length}</strong><span>RQ GAMES IN YOUR LIBRARY</span></div><div><strong>{hours(dashboard.games.reduce((sum, game) => sum + game.minutesPlayed, 0))} h</strong><span>TIME IN RQ GAMES</span></div><div><strong>{dashboard.recentlyPlayed.length}</strong><span>RECENT RQ GAMES</span></div></div>
      {dashboard.libraryVisibility === "NONE_OR_PRIVATE" ? <p>No RED QUEEN catalog games are visible in your Steam library. Your game details may be private, or none of our selected games are there. Check Steam Profile → Privacy Settings → Game details if you want to show playtime here.</p> : <>
        <div className="gaming-steam-controls"><div role="group" aria-label="Steam game filter">{(["ALL", "RECENT"] as const).map(value => <button type="button" key={value} aria-pressed={filter === value} onClick={() => { setFilter(value); setShown(20); setSelected(null); }}>{value === "RECENT" ? "RECENT" : "MY SURVIVAL GAMES"}</button>)}</div><label><span className="sr-only">Search your survival games</span><input value={query} onChange={event => { setQuery(event.target.value); setShown(20); }} placeholder="Search survival games" /></label></div>
        {filter === "RECENT" && !dashboard.recentAvailable && <p>Recent activity is temporarily unavailable from Steam.</p>}
        {filtered.length ? <div className="gaming-steam-list">{filtered.slice(0, shown).map(game => <div className="gaming-steam-game" key={game.appId}><div><strong>{game.title}</strong><span>{hours(game.minutesPlayed)} h total{game.minutesRecently !== null ? ` · ${hours(game.minutesRecently)} h / 2 weeks` : ""}</span></div><div><button type="button" onClick={() => void showAchievements(game)}>ACHIEVEMENTS</button><a href={steamStoreUrl(game.appId)} target="_blank" rel="noopener noreferrer" aria-label={`Open ${game.title} on Steam`}>↗</a></div></div>)}</div> : <p>No games match this view.</p>}
        {filtered.length > shown && <button type="button" className="gaming-button gaming-button-outline gaming-steam-more" onClick={() => setShown(value => value + 20)}>SHOW MORE ({filtered.length - shown} LEFT)</button>}
      </>}
      {selected && <div className="gaming-steam-achievements" role="region" aria-label={`${selected.title} achievements`}><div className="gaming-steam-detail-head"><div><span className="gaming-kicker">STEAM ACHIEVEMENTS</span><h3>{selected.title}</h3></div><button type="button" onClick={() => { achievementRequest.current++; setSelected(null); }} aria-label="Close achievements">CLOSE ×</button></div>
        {achievementLoading && <p>Loading achievements...</p>}
        {achievementError && <p role="alert">{achievementError}</p>}
        {!achievementLoading && !achievementError && achievements === null && <p>Steam did not provide achievements for this game. They may be unavailable or private.</p>}
        {achievements && <><p>{achievements.filter(item => item.unlocked).length} / {achievements.length} unlocked</p><div className="gaming-steam-achievement-list">{achievements.map(item => <div key={item.id} className={item.unlocked ? "is-unlocked" : ""}><strong>{item.name}</strong><span>{item.description || (item.unlocked ? "Unlocked" : "Locked")}</span></div>)}</div></>}
      </div>}
      <small className="gaming-steam-disclosure">Steam controls visibility. These figures come from its Web API when you open or refresh this page. RED QUEEN does not persist your library, playtime or achievements.</small>
    </>}
  </section>;
}
