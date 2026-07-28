/**
 * React binding for the theme mode. Provides the current mode + setters to the
 * tree and keeps `data-theme` on <html> in sync. Default is dark.
 */
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  type ReactNode,
} from 'react'
import {
  applyThemeMode,
  getStoredMode,
  setStoredMode,
  type ThemeMode,
} from './mode'

interface ThemeContextValue {
  mode: ThemeMode
  setMode: (mode: ThemeMode) => void
  toggle: () => void
}

const ThemeContext = createContext<ThemeContextValue | null>(null)

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [mode, setModeState] = useState<ThemeMode>(getStoredMode)

  const setMode = useCallback((next: ThemeMode) => {
    setStoredMode(next)
    setModeState(next)
  }, [])

  const toggle = useCallback(() => {
    setModeState((prev) => {
      const next = prev === 'dark' ? 'light' : 'dark'
      setStoredMode(next)
      applyThemeMode(next)
      return next
    })
  }, [])

  const value = useMemo(
    () => ({ mode, setMode, toggle }),
    [mode, setMode, toggle],
  )

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme(): ThemeContextValue {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used within <ThemeProvider>')
  return ctx
}
