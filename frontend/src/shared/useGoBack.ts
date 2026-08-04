import { useCallback } from 'react'
import { useNavigate } from 'react-router-dom'

/**
 * A back control that **returns** instead of navigating forward.
 *
 * A back arrow written as `<Link to={whereICameFrom}>` PUSHES a new history
 * entry, so the page it left stays ahead in the stack: cart → checkout →
 * (link) cart → (browser back) checkout → … Users get stuck ping-ponging
 * between the two pages, which is exactly what a back control must never do.
 *
 * So: step back when there is somewhere to step back to, and fall back to a
 * sensible path (replacing, not pushing) when there isn't — a link opened in
 * a fresh tab, or a URL typed directly.
 *
 * `idx` is React Router's own history-position counter (it stamps it into
 * `history.state`); `0` means this entry is the first of the session.
 *
 * NOTE: after a **full page load** the counter restarts at 0 even though the
 * browser could still go back — so a page reached by a plain `<a href>` (the
 * store header's cart button) should keep using `window.history.back()`
 * rather than this hook.
 */
export function useGoBack(fallback: string) {
  const navigate = useNavigate()
  return useCallback(() => {
    const idx = (window.history.state as { idx?: number } | null)?.idx ?? 0
    if (idx > 0) navigate(-1)
    else navigate(fallback, { replace: true })
  }, [navigate, fallback])
}
