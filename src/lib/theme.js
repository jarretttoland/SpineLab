/**
 * Theme system — light / dark / gold.
 * Tailwind darkMode: ["class"] toggles the `dark` class on <html>.
 * Gold theme applies the `gold` class on <html>.
 * User preference persisted in localStorage.
 *
 * Themes: "light" | "dark" | "gold"
 */

const STORAGE_KEY = "spinelab_theme";

export function getTheme() {
  return localStorage.getItem(STORAGE_KEY) || "light";
}

export function setTheme(theme) {
  localStorage.setItem(STORAGE_KEY, theme);
  applyTheme(theme);
}

export function applyTheme(theme) {
  const root = document.documentElement;

  // Clear all theme classes first
  root.classList.remove("dark", "gold");

  if (theme === "dark") {
    root.classList.add("dark");
  } else if (theme === "gold") {
    root.classList.add("gold");
  }
  // "light" = no class needed (default :root vars)
}

/** Call once at app startup — before React renders. */
export function initTheme() {
  applyTheme(getTheme());
}
