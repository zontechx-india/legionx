/**
 * Theme-mode controller (no React) — applies dark/light to <html>.
 *
 * Dark is the default. The choice is persisted to localStorage and reflected as
 * `data-theme` on the document root, which is what the CSS variables in
 * `index.css` key off. Call `initThemeMode()` once, as early as possible, before
 * React renders (done in each app's `main.tsx`) to avoid a flash.
 */
import type { ThemeMode } from './colors'

export type { ThemeMode }

const STORAGE_KEY = 'uniemax-theme'
export const DEFAULT_MODE: ThemeMode = 'dark'

export function getStoredMode(): ThemeMode {
  try {
    const value = localStorage.getItem(STORAGE_KEY)
    if (value === 'dark' || value === 'light') return value
  } catch {
    /* localStorage unavailable (SSR/private mode) — fall through */
  }
  return DEFAULT_MODE
}

export function applyThemeMode(mode: ThemeMode): void {
  const root = document.documentElement
  root.dataset.theme = mode
  root.style.colorScheme = mode
}

export function setStoredMode(mode: ThemeMode): void {
  try {
    localStorage.setItem(STORAGE_KEY, mode)
  } catch {
    /* ignore persistence failure */
  }
  applyThemeMode(mode)
}

/** Idempotent bootstrap — safe to call before render. */
export function initThemeMode(): ThemeMode {
  const mode = getStoredMode()
  applyThemeMode(mode)
  return mode
}
