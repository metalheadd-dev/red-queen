"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { GAMING_SAVED_KEY, parseSavedGames } from "@/lib/gaming/catalog";

const SAVED_EVENT = "rq-gaming-saved-changed";

export function useSavedGames() {
  const [saved, setSaved] = useState<number[]>([]);
  const [loaded, setLoaded] = useState(false);
  const [notice, setNotice] = useState("");
  const current = useRef<number[]>([]);

  useEffect(() => {
    const sync = () => {
      try {
        current.current = parseSavedGames(localStorage.getItem(GAMING_SAVED_KEY));
        setSaved(current.current);
      } catch { setNotice("Browser storage is unavailable. Changes will last for this visit only."); }
      setLoaded(true);
    };
    const storage = (event: StorageEvent) => {
      if (event.key === GAMING_SAVED_KEY || event.key === null) sync();
    };
    sync();
    window.addEventListener("storage", storage);
    window.addEventListener(SAVED_EVENT, sync);
    return () => {
      window.removeEventListener("storage", storage);
      window.removeEventListener(SAVED_EVENT, sync);
    };
  }, []);

  const update = useCallback((id: number, removeOnly = false) => {
    const next = current.current.includes(id)
      ? current.current.filter((item) => item !== id)
      : removeOnly ? current.current : [...current.current, id];
    current.current = next;
    setSaved(next);
    try {
      localStorage.setItem(GAMING_SAVED_KEY, JSON.stringify(next));
      setNotice("");
      window.dispatchEvent(new Event(SAVED_EVENT));
    } catch { setNotice("Saved for this visit only. Browser storage is unavailable."); }
  }, []);

  return { saved, loaded, notice, toggleSaved: update, removeSaved: (id: number) => update(id, true) };
}
