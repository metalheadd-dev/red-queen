"use client";

import { useEffect, useState } from "react";
import { applyTheme, persistTheme, readTheme, THEME_EVENT, type RedQueenTheme } from "@/lib/theme";

type ThemeToggleProps = {
  compact?: boolean;
};

export default function ThemeToggle({ compact = false }: ThemeToggleProps) {
  const [theme, setTheme] = useState<RedQueenTheme>("dark");

  useEffect(() => {
    const current = readTheme();
    setTheme(current);
    applyTheme(current);

    const syncTheme = (event: Event) => {
      const next = (event as CustomEvent<RedQueenTheme>).detail;
      if (next === "dark" || next === "light") setTheme(next);
    };
    window.addEventListener(THEME_EVENT, syncTheme);
    return () => window.removeEventListener(THEME_EVENT, syncTheme);
  }, []);

  const nextTheme = theme === "dark" ? "light" : "dark";
  const activeLabel = theme === "dark" ? "BLACK SITE" : "WHITE ROOM";

  return (
    <button
      type="button"
      className={`theme-toggle${compact ? " is-compact" : ""}`}
      onClick={() => {
        persistTheme(nextTheme);
        setTheme(nextTheme);
      }}
      aria-label={`Switch to ${nextTheme === "light" ? "WHITE ROOM light" : "BLACK SITE dark"} theme`}
      aria-pressed={theme === "light"}
      title={`ACTIVE THEME // ${activeLabel}`}
    >
      <span className="theme-toggle-symbol" aria-hidden="true">{theme === "dark" ? "◐" : "◑"}</span>
      {!compact && <span><small>DISPLAY MODE</small><strong>{activeLabel}</strong></span>}
    </button>
  );
}
