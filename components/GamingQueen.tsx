"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import AgentAnswerReport from "@/components/AgentAnswerReport";
import { useSavedGames } from "@/components/useSavedGames";
import { SURVIVAL_GAMES, steamStoreUrl, type SurvivalGame } from "@/lib/gaming/catalog";
import { isGamingConversationId, type GamingContext, type GamingIntent } from "@/lib/gaming/queen";
import { gamingDraftKey, readGamingDraft, writeGamingDraft, readGamingTurns, parseGamingBackup, mergeGamingTurns as mergeTurns, type GamingTurn as Turn } from "@/lib/gaming/queen-history";

const INTENTS: Array<{ id: GamingIntent; label: string; prompt: string }> = [
  { id: "DISCOVER", label: "FIND MY GAME", prompt: "Choose up to three survival games from this room that fit my preferences. Explain the tradeoffs and your first pick." },
  { id: "START", label: "PLAN MY START", prompt: "Help me plan my opening session in the selected game. Give me a short checklist and one priority, respecting my spoiler preference." },
  { id: "DEBRIEF", label: "REVIEW MY RUN", prompt: "Help me review my last run in the selected game. Ask what happened, what I tried and which decision I want to improve before drawing conclusions." },
  { id: "CHALLENGE", label: "PRACTICE CHALLENGE", prompt: "Suggest one informal practice challenge in the selected game that fits my session length. Explain an objective I can track myself, without official points or prizes." },
];
function readTurns(key: string): Turn[] {
  return readGamingTurns(localStorage, key);
}

export default function GamingQueen() {
  const { user, session, loading: authLoading } = useAuth();
  const { saved, loaded: savedLoaded } = useSavedGames();
  const storageKey = `rq-gaming-queen-v1:${user?.id || "guest"}`;
  const owner = user?.id || "guest";
  const [context, setContext] = useState<GamingContext | null>(null);
  const [catalog, setCatalog] = useState<SurvivalGame[]>([...SURVIVAL_GAMES]);
  const [turns, setTurns] = useState<Turn[]>([]);
  const [input, setInput] = useState("");
  const [working, setWorking] = useState(false);
  const [pendingPrompt, setPendingPrompt] = useState("");
  const [feedback, setFeedback] = useState("");
  const [storageNotice, setStorageNotice] = useState("");
  const [accountNotice, setAccountNotice] = useState("");
  const [accountLoading, setAccountLoading] = useState(false);
  const [readyKey, setReadyKey] = useState("");
  const [needsLogin, setNeedsLogin] = useState(false);
  const [historyCursor, setHistoryCursor] = useState<string | null>(null);
  const [conversationCursor, setConversationCursor] = useState<string | null>(null);
  const [loadingOlder, setLoadingOlder] = useState(false);
  const [draftReadyId, setDraftReadyId] = useState("");
  const [briefOpen, setBriefOpen] = useState(true);
  const restoredDraft = useRef(false);
  const request = useRef<AbortController | null>(null);
  const activeKey = useRef(storageKey);
  const transcript = useRef<HTMLDivElement>(null);
  const visibleTurns = readyKey === storageKey ? turns.filter(turn => turn.conversation_id === context?.conversationId) : [];
  const conversations = readyKey === storageKey ? Array.from(new Map([...turns].reverse().map(turn => [turn.conversation_id, turn])).values()) : [];
  const historyBusy = working || loadingOlder || accountLoading || authLoading;

  useEffect(() => {
    let cancelled = false;
    fetch("/api/gaming/catalog").then(response => response.json()).then(data => {
      if (cancelled || !Array.isArray(data.games)) return;
      setCatalog(data.games);
      const requestedId = Number(new URLSearchParams(window.location.search).get("game"));
      if (data.games.some((game: SurvivalGame) => game.id === requestedId)) {
        setContext(current => current && current.gameIds.length === 0 ? { ...current, gameIds: [requestedId] } : current);
      }
    }).catch(() => {});
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    const compact = window.matchMedia("(max-width:700px)");
    const sync = () => setBriefOpen(!compact.matches);
    sync(); compact.addEventListener("change", sync);
    return () => compact.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (authLoading) return;
    activeKey.current = storageKey;
    request.current?.abort();
    setWorking(false); setPendingPrompt(""); setFeedback(""); setNeedsLogin(false); setStorageNotice("");
    setLoadingOlder(false); setHistoryCursor(null); setConversationCursor(null);
    let local: Turn[] = [];
    try { local = readTurns(storageKey); }
    catch { setStorageNotice("Browser history could not be read. Existing data will be preserved; export new replies before leaving."); }
    setTurns(local);
    const params = new URLSearchParams(window.location.search);
    const conversationId = isGamingConversationId(params.get("conversation")) ? params.get("conversation")!.toLowerCase() : crypto.randomUUID();
    const previous = [...local].reverse().find(turn => turn.conversation_id === conversationId);
    const game = SURVIVAL_GAMES.find(game => game.id === Number(params.get("game")));
    let next: GamingContext = previous?.context || { conversationId, intent: "DISCOVER", gameIds: game ? [game.id] : [], party: "SOLO", intensity: "BALANCED", minutes: 60, spoilers: false };
    let draftInput = "";
    restoredDraft.current = false;
    setDraftReadyId("");
    try {
      const draft = readGamingDraft(localStorage, gamingDraftKey(owner, conversationId));
      if (draft && draft.context.conversationId === conversationId) { next = draft.context; draftInput = draft.prompt; restoredDraft.current = true; }
      const handoff = owner !== "guest" ? readGamingDraft(sessionStorage, `rq-gaming-handoff-v1:${conversationId}`) : null;
      if (handoff?.context.conversationId === conversationId && !draft) {
        next = handoff.context; draftInput = handoff.prompt; restoredDraft.current = true;
        const guest = readTurns("rq-gaming-queen-v1:guest").filter(turn => turn.conversation_id === conversationId);
        local = mergeTurns(guest, local);
        setTurns(local);
        localStorage.setItem(storageKey, JSON.stringify(mergeTurns(guest, readTurns(storageKey))));
      }
      setDraftReadyId(conversationId);
    } catch { setStorageNotice("A saved draft could not be read. It will not be replaced. You can still send and export a conversation."); }
    setInput(draftInput);
    setContext(next);
    params.set("conversation", conversationId);
    window.history.replaceState(null, "", `/gaming/queen?${params}`);
    setReadyKey(storageKey);
    return () => { request.current?.abort(); };
  }, [authLoading, storageKey, owner]);

  useEffect(() => {
    if (!context || readyKey !== storageKey || draftReadyId !== context.conversationId || authLoading) return;
    try { writeGamingDraft(localStorage, gamingDraftKey(owner, context.conversationId), { context, prompt: input, updatedAt: new Date().toISOString() }); }
    catch { setStorageNotice("Your draft could not be saved. Existing data is preserved; copy your message before leaving."); }
  }, [context, input, storageKey, readyKey, draftReadyId, owner, authLoading]);

  useEffect(() => {
    if (!session?.access_token || readyKey !== storageKey) { setAccountNotice(""); setAccountLoading(false); return; }
    const controller = new AbortController();
    setAccountLoading(true);
    const requestedId = new URLSearchParams(window.location.search).get("conversation");
    const urls = ["/api/gaming/queen/history", ...(isGamingConversationId(requestedId) ? [`/api/gaming/queen/history?conversation=${requestedId}`] : [])];
    void Promise.all(urls.map(async url => {
      const response = await fetch(url, { headers: { Authorization: `Bearer ${session.access_token}` }, cache: "no-store", signal: controller.signal });
      return { ok: response.ok, data: await response.json() };
    }))
      .then(results => {
        if (controller.signal.aborted) return;
        if (results.some(result => !result.ok)) { setAccountNotice("Account history is unavailable. Browser copies and export remain usable."); return; }
        const remote = results.reduce<Turn[]>((all, result) => mergeTurns(all, Array.isArray(result.data.generations) ? result.data.generations : []), []);
        setHistoryCursor(results[0].data.nextCursor || null);
        setConversationCursor(results[1]?.data.nextCursor || null);
        setTurns(current => mergeTurns(current, remote));
        try { localStorage.setItem(storageKey, JSON.stringify(mergeTurns(readTurns(storageKey), remote))); }
        catch { setStorageNotice("Could not save a browser copy. Existing data is preserved; use export to keep replies."); }
        setAccountNotice("Account history loaded. This conversation link is private to your account.");
        setContext(current => {
          const last = [...remote].reverse().find(turn => turn.conversation_id === current?.conversationId);
          return last && !restoredDraft.current ? last.context : current;
        });
      }).catch(() => { if (!controller.signal.aborted) setAccountNotice("Account history could not be reached. Browser copies remain usable."); })
      .finally(() => { if (!controller.signal.aborted) setAccountLoading(false); });
    return () => controller.abort();
  }, [session?.access_token, storageKey, readyKey]);

  useEffect(() => {
    const sync = (event: StorageEvent) => {
      if (event.key !== storageKey) return;
      try { setTurns(current => mergeTurns(current, readTurns(storageKey))); }
      catch { setStorageNotice("Browser history changed but could not be read. Existing data is preserved."); }
    };
    window.addEventListener("storage", sync);
    return () => window.removeEventListener("storage", sync);
  }, [storageKey]);

  const lastVisibleId = visibleTurns[visibleTurns.length - 1]?.id;
  useEffect(() => { transcript.current?.scrollTo({ top: transcript.current.scrollHeight, behavior: "instant" }); }, [lastVisibleId, working]);

  function chooseIntent(intent: GamingIntent) {
    if (!context || working) return;
    restoredDraft.current = true;
    setContext({ ...context, intent });
    setInput(INTENTS.find(item => item.id === intent)!.prompt);
  }
  function updateBrief(patch: Partial<GamingContext>) {
    restoredDraft.current = true;
    setContext(current => current && ({ ...current, ...patch }));
  }
  function openConversation(id: string) {
    if (historyBusy || !context) return;
    const latest = [...turns].reverse().find(turn => turn.conversation_id === id);
    let next = latest?.context || { ...context, conversationId: id };
    let draftInput = "";
    setDraftReadyId(""); restoredDraft.current = false;
    try {
      const draft = readGamingDraft(localStorage, gamingDraftKey(owner, id));
      if (draft && draft.context.conversationId === id) { next = draft.context; draftInput = draft.prompt; restoredDraft.current = true; }
      setDraftReadyId(id);
    } catch { setStorageNotice("The existing draft is unreadable and will be preserved."); }
    setContext(next);
    setInput(draftInput); setFeedback(""); setConversationCursor(null);
    window.history.replaceState(null, "", `/gaming/queen?conversation=${id}`);
    if (session?.access_token) void loadHistoryPage(id, null);
  }
  async function loadHistoryPage(conversation: string | null, cursor: string | null) {
    if (!session?.access_token || loadingOlder) return;
    const key = storageKey;
    setLoadingOlder(true);
    try {
      const query = new URLSearchParams();
      if (conversation) query.set("conversation", conversation);
      if (cursor) query.set("cursor", cursor);
      const response = await fetch(`/api/gaming/queen/history?${query}`, { headers: { Authorization: `Bearer ${session.access_token}` }, cache: "no-store" });
      const data = await response.json();
      if (!response.ok) throw new Error("Earlier history could not be loaded. Try again.");
      if (activeKey.current !== key) return;
      const remote: Turn[] = data.generations || [];
      setTurns(current => mergeTurns(current, remote));
      if (conversation) {
        setConversationCursor(data.nextCursor || null);
        if (!cursor) setContext(current => current?.conversationId === conversation && !restoredDraft.current && remote.length ? remote[remote.length - 1].context : current);
      } else setHistoryCursor(data.nextCursor || null);
      try { localStorage.setItem(key, JSON.stringify(mergeTurns(readTurns(key), remote))); }
      catch { setStorageNotice("Browser history could not be saved. Account history remains available; use export for a copy."); }
    } catch (error) { if (activeKey.current === key) setFeedback(error instanceof Error ? error.message : "History is unavailable."); }
    finally { if (activeKey.current === key) setLoadingOlder(false); }
  }
  function prepareLogin() {
    if (!context) return;
    try { sessionStorage.setItem(`rq-gaming-handoff-v1:${context.conversationId}`, JSON.stringify({ context, prompt: input, updatedAt: new Date().toISOString() })); }
    catch { setStorageNotice("Your browser cannot preserve the sign-in draft. Copy your message before signing in."); }
  }
  async function send() {
    if (!context || working || accountLoading || loadingOlder || readyKey !== storageKey || !input.trim() || needsLogin) return;
    const prompt = input.trim();
    const key = storageKey;
    const controller = new AbortController();
    request.current = controller;
    setWorking(true); setPendingPrompt(prompt); setFeedback("");
    try {
      const messages = visibleTurns.flatMap(turn => [{ role: "user", content: turn.prompt }, { role: "assistant", content: turn.response.message }]);
      const response = await fetch("/api/chat", {
        method: "POST", headers: { "Content-Type": "application/json", ...(session?.access_token ? { Authorization: `Bearer ${session.access_token}` } : {}) },
        signal: controller.signal,
        body: JSON.stringify({ gaming: context, messages: [...messages.slice(-10), { role: "user", content: prompt }] }),
      });
      const data = await response.json();
      if (!response.ok) {
        if (response.status === 403) { setNeedsLogin(true); throw new Error("Guest access is used up. Sign in to continue with Queen."); }
        throw new Error(response.status === 503 ? "Queen is not connected yet. Your draft is still here; try again when the service is available." : "Queen could not complete this reply. Your draft is still here; try again.");
      }
      if (!data.gaming?.generationId || typeof data.answer !== "string") throw new Error("The reply could not be read. Please try again.");
      const turn: Turn = { id: data.gaming.generationId, conversation_id: data.gaming.conversationId, prompt, response: data, context: data.gaming.context, created_at: data.gaming.createdAt };
      if (controller.signal.aborted || activeKey.current !== key) return;
      setTurns(current => mergeTurns(current, [turn])); setInput("");
      try { localStorage.setItem(key, JSON.stringify(mergeTurns(readTurns(key), [turn]))); }
      catch { setStorageNotice("Could not save a browser copy. Existing data is preserved; export this conversation before leaving."); }
      setAccountNotice(data.gaming.accountSaved ? "Reply saved to your account. Browser copy attempted; check any storage warning below." : "This reply is not saved to an account. Keep the browser copy or export it.");
    } catch (error) {
      if (!controller.signal.aborted && activeKey.current === key) setFeedback(error instanceof Error ? error.message : "Queen could not be reached. Try again.");
    } finally {
      if (!controller.signal.aborted && activeKey.current === key) { setWorking(false); setPendingPrompt(""); }
    }
  }
  function exportConversation() {
    if (historyBusy || conversationCursor || !visibleTurns.length) return;
    const blob = new Blob([JSON.stringify({ version: 1, conversation: context, generations: visibleTurns }, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const anchor = document.createElement("a"); anchor.href = url; anchor.download = `red-queen-gaming-${context?.conversationId}.json`; anchor.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
  }
  async function importBackup(file: File | undefined) {
    if (!file || historyBusy || readyKey !== storageKey) return;
    const key = storageKey;
    try {
      if (file.size > 10_000_000) throw new Error("Backup is too large (10 MB maximum).");
      const imported = parseGamingBackup(await file.text());
      if (activeKey.current !== key) return;
      // Existing records win on duplicate IDs; importing never replaces them.
      const merged = mergeTurns(imported, mergeTurns(readTurns(key), turns));
      localStorage.setItem(key, JSON.stringify(merged));
      setTurns(merged);
      setFeedback(`${imported.length} backup replies imported into this browser. Existing replies are preserved; this does not verify game results or save imported replies to an account.`);
    } catch (error) { setFeedback(error instanceof Error ? error.message : "Backup could not be imported. Existing data is preserved."); }
  }

  return <div className="gaming-page gaming-subpage">
    <nav className="gaming-local-nav" aria-label="Gaming Room navigation"><div className="gaming-wrap"><Link href="/gaming">ROOM HOME</Link><Link href="/gaming/queen" aria-current="page">ASK THE QUEEN</Link><Link href="/gaming/contests">COMPETITIONS</Link><Link href="/gaming/profile">MY STATION</Link></div></nav>
    <header className="gaming-subhero"><div className="gaming-wrap"><span className="gaming-eyebrow"><i /> RED QUEEN / YOUR SURVIVAL COMPANION</span><h1>YOUR NEXT MOVE.</h1><p><span className="gaming-copy-long">Choose a world. Plan your first night. Tell me where the run fell apart. I will help you find the next decision worth making.</span><span className="gaming-copy-short">Pick a game. Plan a run. Ask Queen.</span></p></div></header>
    <div className="gaming-wrap gaming-subcontent">
      <div className="gaming-queen-layout">
        <aside className="gaming-panel gaming-queen-brief" aria-label="Gaming preferences"><details className="gaming-brief-disclosure" open={briefOpen} onToggle={event => setBriefOpen(event.currentTarget.open)}><summary>Session settings <small>{context?.gameIds.length || 0} games · {context?.minutes || 60} min · {context?.spoilers ? "Spoilers allowed" : "No spoilers"}</small></summary><span className="gaming-kicker">SESSION BRIEF</span><h2>Set the scene.</h2>
          <fieldset disabled={!context || working || accountLoading || authLoading}>
            <label>PLAYING WITH<select aria-label="Playing with" value={context?.party || "SOLO"} onChange={event => updateBrief({ party: event.target.value as GamingContext["party"] })}><option value="SOLO">Just me</option><option value="TEAM">A team</option></select></label>
            <label>INTENSITY<select aria-label="Game intensity" value={context?.intensity || "BALANCED"} onChange={event => updateBrief({ intensity: event.target.value as GamingContext["intensity"] })}><option value="RELAXED">Room to explore</option><option value="BALANCED">Balanced pressure</option><option value="HARDCORE">Make it unforgiving</option></select></label>
            <label>SESSION LENGTH<select aria-label="Session length" value={context?.minutes || 60} onChange={event => updateBrief({ minutes: Number(event.target.value) as GamingContext["minutes"] })}><option value={30}>30 minutes</option><option value={60}>One hour</option><option value={120}>Two hours</option></select></label>
            <span className="gaming-kicker">GAME CONTEXT / UP TO 3</span>
            <div className="gaming-queen-games">{catalog.map(game => <label key={game.id}><input type="checkbox" checked={context?.gameIds.includes(game.id) || false} disabled={!context?.gameIds.includes(game.id) && (context?.gameIds.length || 0) >= 3} onChange={event => context && updateBrief({ gameIds: event.target.checked ? [...context.gameIds, game.id] : context.gameIds.filter(id => id !== game.id) })} />{game.title}</label>)}</div>
            <button type="button" className="gaming-queen-text-button" disabled={!savedLoaded || !saved.length} onClick={() => updateBrief({ gameIds: saved.slice(0, 3) })}>USE MY SAVED PICKS ({Math.min(3, saved.length)})</button>
            <label className="gaming-queen-spoilers"><input type="checkbox" checked={context?.spoilers || false} onChange={event => updateBrief({ spoilers: event.target.checked })} />Allow spoilers</label>
            {session?.access_token && <label className="gaming-queen-spoilers"><input type="checkbox" checked={context?.useSteamStats || false} onChange={event => updateBrief({ useSteamStats: event.target.checked })} />Use my visible RQ Steam games (requires Steam link)</label>}
          </fieldset>
          <p className="gaming-editorial-note">Your brief and message are sent when you ask. If you enable Steam context, Queen also receives names and playtime for visible RQ catalog games. Steam ID, achievements and the rest of your library are excluded. Selected games alone are interests, not proof of ownership.</p>
          {context?.gameIds.map(id => { const game = catalog.find(game => game.id === id); return game ? <a className="gaming-queen-store" key={id} href={steamStoreUrl(id)} target="_blank" rel="noopener noreferrer">{game.title} ON STEAM ↗</a> : null; })}
        </details></aside>
        <section className="gaming-panel gaming-queen-chat" aria-labelledby="gaming-queen-title"><div className="gaming-queen-chat-head"><div><span className="gaming-kicker">QUEEN CHANNEL</span><h2 id="gaming-queen-title">I am listening.</h2></div><span className="gaming-state">{working ? "● THINKING" : "GAME ADVICE"}</span></div>
          <div className="gaming-queen-intents" role="group" aria-label="Queen gaming tasks">{INTENTS.map(item => <button type="button" key={item.id} disabled={!context || working || accountLoading} aria-pressed={context?.intent === item.id} onClick={() => chooseIntent(item.id)}>{item.label}</button>)}</div>
          <div className="gaming-queen-transcript" ref={transcript} role="log" aria-label="Gaming conversation" aria-live="polite" aria-busy={working}>
            {conversationCursor && <button type="button" className="gaming-button gaming-button-outline" disabled={loadingOlder || working} onClick={() => void loadHistoryPage(context!.conversationId, conversationCursor)}>{loadingOlder ? "LOADING…" : "LOAD EARLIER REPLIES ↑"}</button>}
            {!visibleTurns.length && !working && <div className="gaming-queen-welcome"><span>YOUR WORLD. YOUR DECISIONS.</span><p><span className="gaming-copy-long">Tell me what you enjoy, or choose a game and describe your run. Start with a task above; you can edit it before sending.</span><span className="gaming-copy-short">Choose a task above or describe your run.</span></p><small>No spoilers by default. No wallet required.</small></div>}
            {visibleTurns.map(turn => <div className="gaming-queen-turn" key={turn.id}><article className="gaming-queen-user"><b>YOU</b><p>{turn.prompt}</p></article><article className="gaming-queen-answer"><b>RED QUEEN</b><p>{turn.response.situation}</p><p>{turn.response.answer}</p><div className="gaming-queen-next"><strong>NEXT MOVE</strong><p>{turn.response.action}</p></div><small>{turn.response.uncertainty}</small><div className="gaming-queen-followups">{turn.response.followUps.map((question, index) => <button type="button" key={index} disabled={working} onClick={() => setInput(question)}>{question}</button>)}</div><AgentAnswerReport surface="GAMING" generationId={turn.id} prompt={turn.prompt} reply={turn.response.message} /></article></div>)}
            {working && <div className="gaming-queen-turn"><article className="gaming-queen-user"><b>YOU</b><p>{pendingPrompt}</p></article><p role="status">Queen is considering your next move…</p></div>}
          </div>
          <form onSubmit={event => { event.preventDefault(); void send(); }}><label htmlFor="gaming-queen-message" className="gaming-kicker">YOUR MESSAGE</label><textarea id="gaming-queen-message" maxLength={2000} rows={4} value={input} onChange={event => { restoredDraft.current = true; setInput(event.target.value); }} placeholder="What would you like to play, or what happened in your last run?" disabled={working || authLoading} /><div className="gaming-queen-compose-actions"><small>{input.length} / 2000</small><button type="submit" className="gaming-button gaming-button-primary" disabled={!context || !input.trim() || working || accountLoading || authLoading || needsLogin}>{working ? "THINKING…" : "ASK RED QUEEN →"}</button></div></form>
          {feedback && <p className="gaming-profile-feedback" role="alert">{feedback}</p>}{needsLogin && <Link className="gaming-button gaming-button-outline" onClick={prepareLogin} href={`/login?next=${encodeURIComponent(`/gaming/queen?conversation=${context?.conversationId}`)}`}>SIGN IN TO CONTINUE ↗</Link>}
          <p className="gaming-editorial-note" role="status">{accountLoading ? "Loading your account history…" : accountNotice || "Replies are kept in this browser. Sign in for account history when available."}</p>
          {storageNotice && <p className="gaming-profile-feedback" role="status">{storageNotice}</p>}
        </section>
      </div>
      <section className="gaming-panel gaming-queen-history" aria-labelledby="gaming-history-title">
        <div className="gaming-queen-chat-head"><div><span className="gaming-kicker">YOUR CONVERSATIONS</span><h2 id="gaming-history-title">Keep the lesson.</h2></div>
          <div className="gaming-panel-footer">
            <button type="button" className="gaming-button gaming-button-outline" disabled={!visibleTurns.length || historyBusy || Boolean(conversationCursor)} onClick={exportConversation}>EXPORT CONVERSATION ↓</button>
            <label className="gaming-button gaming-button-outline gaming-backup-upload">IMPORT BACKUP ↑<input type="file" accept="application/json,.json" aria-label="Import Gaming Queen backup" disabled={historyBusy || readyKey !== storageKey} onChange={event => { void importBackup(event.target.files?.[0]); event.target.value = ""; }} /></label>
            <button type="button" className="gaming-button gaming-button-outline" disabled={!context || historyBusy} onClick={() => openConversation(crypto.randomUUID())}>NEW CONVERSATION +</button>
          </div>
        </div>
        <p>New conversations preserve previous replies. Account links require your sign-in; guest history stays in this browser. Export a copy to keep it elsewhere. Imported backups stay in this browser.{conversationCursor ? " Load earlier replies before exporting the complete conversation." : ""}</p>
        <div className="gaming-queen-history-links">{conversations.map(turn => <button type="button" key={turn.conversation_id} disabled={historyBusy} aria-pressed={turn.conversation_id === context?.conversationId} onClick={() => openConversation(turn.conversation_id)}>{turn.prompt.slice(0, 85)}<small>{new Date(turn.created_at).toLocaleDateString()}</small></button>)}</div>
        {historyCursor && <button type="button" className="gaming-button gaming-button-outline" disabled={historyBusy} onClick={() => void loadHistoryPage(null, historyCursor)}>{loadingOlder ? "LOADING…" : "LOAD OLDER CONVERSATIONS ↓"}</button>}
      </section>
      <section className="gaming-next" aria-label="Queen and the community"><Link href="/gaming/contests"><span className="gaming-kicker">SEASON HOST / PLANNED</span><strong>Rules before rewards.</strong><p>Queen can explain the preseason. Official challenges and results will come from published rules and server verification.</p><b>VIEW SEASON STATUS ↗</b></Link><Link href="/gaming"><span className="gaming-kicker">ROOK / THE ROOM'S MASCOT</span><strong>Find your next world.</strong><p>Our raven watches the room. Queen helps you choose where to go next.</p><b>BACK TO THE CATALOG ↗</b></Link></section>
    </div>
  </div>;
}
