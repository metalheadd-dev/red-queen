"use client";

import Link from "next/link";
import { useCallback, useEffect, useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import "./admin-gaming.css";

type Entry = {
  app_id: number; title: string; studio: string; lane: string; genre: string;
  tags: string[]; setting: string; note: string; signal: string;
  accent: string; is_published: boolean;
};
type SteamTag = { id: number; name: string };
type SteamPreview = { games: (Entry & { appId: number })[]; total: number };
const focusTagIds = [1662, 3978, 1100689];

const empty: Entry = {
  app_id: 0, title: "", studio: "", lane: "HARDCORE", genre: "Survival",
  tags: [], setting: "SURVIVAL / STEAM", note: "", signal: "SURVIVAL",
  accent: "#cb4051", is_published: true,
};

export default function AdminGamingPage() {
  const { session, loading } = useAuth();
  const [entries, setEntries] = useState<Entry[]>([]);
  const [form, setForm] = useState<Entry>(empty);
  const [tagInput, setTagInput] = useState("");
  const [editing, setEditing] = useState(false);
  const [status, setStatus] = useState("");
  const [saving, setSaving] = useState(false);
  const [steamTags, setSteamTags] = useState<SteamTag[]>([]);
  const [focusTag, setFocusTag] = useState(1662);
  const [extraTags, setExtraTags] = useState<number[]>([]);
  const [tagSearch, setTagSearch] = useState("");
  const [steamPage, setSteamPage] = useState(0);
  const [preview, setPreview] = useState<SteamPreview | null>(null);
  const [importBusy, setImportBusy] = useState(false);
  const [importStatus, setImportStatus] = useState("");

  const load = useCallback(async () => {
    if (!session?.access_token) return;
    const response = await fetch("/api/admin/gaming-catalog", {
      headers: { Authorization: `Bearer ${session.access_token}` }, cache: "no-store",
    });
    const data = await response.json();
    if (!response.ok) throw new Error(data.error || "Catalog unavailable.");
    setEntries(data.entries || []);
  }, [session?.access_token]);

  useEffect(() => {
    if (!session?.access_token) return;
    let cancelled = false;
    void load().catch(error => { if (!cancelled) setStatus(error.message); });
    return () => { cancelled = true; };
  }, [load, session?.access_token]);

  useEffect(() => {
    if (!session?.access_token) return;
    let cancelled = false;
    void fetch("/api/admin/gaming-catalog/steam-import", {
      headers: { Authorization: `Bearer ${session.access_token}` }, cache: "no-store",
    }).then(async response => {
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Steam tags unavailable.");
      if (!cancelled) setSteamTags(data.tags || []);
    }).catch(error => { if (!cancelled) setImportStatus(error.message); });
    return () => { cancelled = true; };
  }, [session?.access_token]);

  async function steamImport(action: "preview" | "import") {
    if (!session?.access_token || importBusy) return;
    setImportBusy(true); setImportStatus("");
    try {
      const response = await fetch("/api/admin/gaming-catalog/steam-import", {
        method: "POST",
        headers: { Authorization: `Bearer ${session.access_token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ tagIds: [focusTag, ...extraTags], page: steamPage, action }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Steam import unavailable.");
      if (action === "preview") {
        setPreview(data);
        setImportStatus(`${data.games.length} games on this page · ${data.total} matching Steam results.`);
      } else {
        await load();
        setImportStatus(`Added ${data.added} games. Skipped ${data.skipped} already present or built-in titles. Open the next Steam results page for more.`);
      }
    } catch (error) { setImportStatus(error instanceof Error ? error.message : "Steam import unavailable."); }
    finally { setImportBusy(false); }
  }

  function edit(entry: Entry) {
    setForm(entry); setTagInput(entry.tags.join(", ")); setEditing(true); setStatus("");
    window.scrollTo({ top: 0, behavior: "smooth" });
  }

  async function save(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!session?.access_token || saving) return;
    setSaving(true); setStatus("");
    try {
      const tags = [...new Set(tagInput.split(",").map(tag => tag.trim()).filter(Boolean))];
      const response = await fetch("/api/admin/gaming-catalog", {
        method: editing ? "PATCH" : "POST",
        headers: { Authorization: `Bearer ${session.access_token}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          appId: form.app_id, title: form.title, studio: form.studio, lane: form.lane,
          genre: form.genre, tags, setting: form.setting, note: form.note,
          signal: form.signal, accent: form.accent, isPublished: form.is_published,
        }),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.error || "Could not save game.");
      await load();
      setForm(empty); setTagInput(""); setEditing(false);
      setStatus("Game saved. Published entries will appear in the Gaming Room shortly.");
    } catch (error) { setStatus(error instanceof Error ? error.message : "Could not save game."); }
    finally { setSaving(false); }
  }

  return <main className="admin-gaming-page">
    <div className="admin-gaming-wrap"><Link href="/admin">← COMMAND CONTROL</Link><span className="admin-gaming-kicker">RQ / GAMING CATALOG</span><h1>SURVIVAL GAMES.</h1><p>Add Steam titles that fit our survival direction. Genre and tags are RED QUEEN editorial labels; they are not automatically copied from Steam.</p>
      {loading ? <p>Checking session…</p> : !session ? <p>Sign in with an administrator account.</p> : <>
        <section className="admin-gaming-import" aria-labelledby="admin-steam-import-title">
          <h2 id="admin-steam-import-title">IMPORT BY STEAM TAGS</h2>
          <p>Choose a survival tag, then narrow it with up to three more Steam tags. Steam matches the selected tags together. Preview each page before adding it. Existing games and your edits are preserved.</p>
          <div className="admin-gaming-import-fields">
            <label>Survival direction<select value={focusTag} onChange={event => { const id = Number(event.target.value); setFocusTag(id); setExtraTags(extraTags.filter(value => value !== id)); setSteamPage(0); setPreview(null); }}>
              {focusTagIds.map(id => <option key={id} value={id}>{steamTags.find(tag => tag.id === id)?.name || `Steam tag ${id}`}</option>)}
            </select></label>
            <label>Find another Steam tag<input value={tagSearch} onChange={event => setTagSearch(event.target.value)} placeholder="Zombies, Co-op, Post-apocalyptic…" /></label>
          </div>
          {tagSearch.trim() && <div className="admin-gaming-tag-results" aria-label="Matching Steam tags">
            {steamTags.filter(tag => tag.name.toLowerCase().includes(tagSearch.trim().toLowerCase()) && tag.id !== focusTag && !extraTags.includes(tag.id)).slice(0, 12).map(tag =>
              <button type="button" key={tag.id} disabled={extraTags.length >= 3} onClick={() => { setExtraTags([...extraTags, tag.id]); setTagSearch(""); setSteamPage(0); setPreview(null); }}>+ {tag.name}</button>)}
          </div>}
          <div className="admin-gaming-selected-tags">{extraTags.map(id => <button type="button" key={id} onClick={() => { setExtraTags(extraTags.filter(value => value !== id)); setSteamPage(0); setPreview(null); }} aria-label={`Remove ${steamTags.find(tag => tag.id === id)?.name || id} tag`}>{steamTags.find(tag => tag.id === id)?.name || id} ×</button>)}</div>
          <div className="admin-gaming-actions">
            <button type="button" disabled={importBusy || steamTags.length === 0} onClick={() => void steamImport("preview")}>{importBusy ? "LOADING…" : "PREVIEW STEAM GAMES"}</button>
            <button type="button" disabled={importBusy || !preview?.games.length} onClick={() => void steamImport("import")}>ADD THIS PAGE ({preview?.games.length || 0})</button>
            <button type="button" disabled={importBusy || steamPage === 0} onClick={() => { setSteamPage(steamPage - 1); setPreview(null); }}>← PREVIOUS</button>
            <button type="button" disabled={importBusy || !preview || (steamPage + 1) * 30 >= preview.total || steamPage >= 20} onClick={() => { setSteamPage(steamPage + 1); setPreview(null); }}>NEXT PAGE →</button>
          </div>
          <p className="admin-gaming-import-page">Steam results page {steamPage + 1} · up to 30 results per page. Added games appear in the public room; you can edit or hide them below.</p>
          <p role="status" className="admin-gaming-status">{importStatus}</p>
          {preview && <div className="admin-gaming-preview"><h3>PREVIEW / PAGE {steamPage + 1}</h3>
            {preview.games.length === 0 ? <p>No importable games on this page. Try another page or tag combination.</p> : preview.games.map(game =>
              <div key={game.appId}><strong>{game.title}</strong><span>{game.studio} · {game.genre} · {game.tags.join(" + ")}</span><small>{entries.some(entry => entry.app_id === game.appId) ? "ALREADY ADDED" : "READY TO ADD"}</small></div>)}
          </div>}
        </section>
        <form onSubmit={save} className="admin-gaming-form"><h2>{editing ? `EDIT / ${form.title}` : "ADD A GAME"}</h2><div className="admin-gaming-fields">
          <label>Steam App ID<input type="number" min="1" max="2147483647" required disabled={editing} value={form.app_id || ""} onChange={event => setForm({ ...form, app_id: Number(event.target.value) })} /></label>
          <label>Title<input required minLength={2} maxLength={120} value={form.title} onChange={event => setForm({ ...form, title: event.target.value })} /></label>
          <label>Studio<input required minLength={2} maxLength={120} value={form.studio} onChange={event => setForm({ ...form, studio: event.target.value })} /></label>
          <label>RQ lane<select value={form.lane} onChange={event => setForm({ ...form, lane: event.target.value })}>{["HARDCORE", "CO-OP", "EXPLORATION", "HORROR", "WASTELAND"].map(value => <option key={value}>{value}</option>)}</select></label>
          <label>Genre<input required minLength={2} maxLength={80} value={form.genre} onChange={event => setForm({ ...form, genre: event.target.value })} placeholder="Survival Horror" /></label>
          <label>Tags (comma separated, up to 12)<input value={tagInput} onChange={event => setTagInput(event.target.value)} placeholder="Survival, Zombies, Co-op" /></label>
          <label>World / setting<input required minLength={2} maxLength={120} value={form.setting} onChange={event => setForm({ ...form, setting: event.target.value })} /></label>
          <label>Short signal<input required minLength={2} maxLength={80} value={form.signal} onChange={event => setForm({ ...form, signal: event.target.value })} /></label>
          <label>Accent color<input type="color" value={form.accent} onChange={event => setForm({ ...form, accent: event.target.value })} /></label>
          <label className="admin-gaming-wide">Editorial note<textarea required minLength={10} maxLength={400} value={form.note} onChange={event => setForm({ ...form, note: event.target.value })} placeholder="Why does this game belong in the RQ survival room?" /></label>
          <label className="admin-gaming-publish"><input type="checkbox" checked={form.is_published} onChange={event => setForm({ ...form, is_published: event.target.checked })} /> Published in Gaming Room</label>
        </div><div className="admin-gaming-actions"><button type="submit" disabled={saving}>{saving ? "SAVING…" : editing ? "SAVE CHANGES" : "ADD GAME"}</button>{editing && <button type="button" onClick={() => { setForm(empty); setTagInput(""); setEditing(false); }}>CANCEL EDIT</button>}</div></form>
        <p role="status" className="admin-gaming-status">{status}</p>
        <section className="admin-gaming-list"><h2>ADDED GAMES ({entries.length})</h2>{entries.length === 0 && <p>No added games yet. The eight built-in survival picks remain in the public room.</p>}{entries.map(entry => <article key={entry.app_id}><div><strong>{entry.title}</strong><span>{entry.genre} · {entry.lane} · {entry.is_published ? "PUBLISHED" : "HIDDEN"}</span><small>{entry.tags.join(" · ") || "No tags"}</small></div><button type="button" onClick={() => edit(entry)}>EDIT</button></article>)}</section>
      </>}
    </div>
  </main>;
}
