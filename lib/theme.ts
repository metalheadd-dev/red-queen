export type RedQueenTheme = "dark" | "light";

export const THEME_STORAGE_KEY = "rq-theme-v1";
export const THEME_EVENT = "rq-theme-change";

export const MAP_STYLES: Record<RedQueenTheme, string> = {
  dark: "https://basemaps.cartocdn.com/gl/dark-matter-gl-style/style.json",
  light: "https://basemaps.cartocdn.com/gl/positron-gl-style/style.json",
};

export function readTheme(): RedQueenTheme {
  if (typeof window === "undefined") return "dark";
  return window.localStorage.getItem(THEME_STORAGE_KEY) === "light" ? "light" : "dark";
}
export function applyTheme(theme: RedQueenTheme) {
  if (typeof document === "undefined") return;
  document.documentElement.dataset.theme = theme;
  document.documentElement.style.colorScheme = theme;
}

export function persistTheme(theme: RedQueenTheme) {
  applyTheme(theme);
  window.localStorage.setItem(THEME_STORAGE_KEY, theme);
  window.dispatchEvent(new CustomEvent<RedQueenTheme>(THEME_EVENT, { detail: theme }));
}
