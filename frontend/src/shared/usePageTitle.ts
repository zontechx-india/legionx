import { useEffect } from 'react'

const APP_NAME = 'Unie Max'

/**
 * Per-page `document.title` (IMPROVEMENTS item: every page shared one SPA
 * title). Pass the most specific part first — undefined/empty parts are
 * skipped, so loading states can pass `undefined` and refine once data
 * arrives: `usePageTitle(product?.name, store.name)`.
 *
 * SPA-only: crawlers that don't run JS still see the static title; real
 * OG/meta tags wait for SSR/prerender.
 */
export function usePageTitle(...parts: (string | undefined | null)[]) {
  const title = parts.filter(Boolean).join(' · ')
  useEffect(() => {
    document.title = title ? `${title} · ${APP_NAME}` : APP_NAME
  }, [title])
}
