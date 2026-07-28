import { useEffect, useState } from 'react'
import { publicStoreApi } from '../stores/storesApi'
import type { PublicStore } from '../stores/storesApi'

/**
 * Store shells (branding + theme + logo) for the cart/checkout pages, keyed
 * by slug. Cart items only snapshot the store *name*, so pages that want the
 * store's logo or theme fetch the shell — cached per session (module map),
 * so navigating cart ↔ checkout never refetches, and a slug that fails
 * (unpublished/deleted store, network) resolves to `null` quietly: the page
 * simply renders without logo/theme.
 *
 *   undefined → still loading · null → unavailable · PublicStore → ready
 */

const cache = new Map<string, Promise<PublicStore | null>>()

function fetchShell(slug: string): Promise<PublicStore | null> {
  let pending = cache.get(slug)
  if (!pending) {
    pending = publicStoreApi.getBySlug(slug).catch(() => null)
    cache.set(slug, pending)
  }
  return pending
}

export function useStoreShells(
  slugs: string[],
): Record<string, PublicStore | null | undefined> {
  // Stable key so effect deps don't churn with array identity.
  const key = [...new Set(slugs)].sort().join('\n')
  const [shells, setShells] = useState<Record<string, PublicStore | null>>({})

  useEffect(() => {
    let cancelled = false
    for (const slug of key ? key.split('\n') : []) {
      void fetchShell(slug).then((shell) => {
        if (cancelled) return
        setShells((prev) =>
          prev[slug] === shell ? prev : { ...prev, [slug]: shell },
        )
      })
    }
    return () => {
      cancelled = true
    }
  }, [key])

  return shells
}

/** Single-store convenience for the per-store cart and checkout pages. */
export function useStoreShell(slug: string): PublicStore | null | undefined {
  return useStoreShells(slug ? [slug] : [])[slug]
}

// NOTE: /cart themes itself by the store the visitor OPENED it from, carried
// explicitly in the URL as `?from={slug}` by every cart link inside a store
// (`cartUrl` in storesApi.ts). Opened from the marketplace (plain /cart) it
// stays neutral. The context deliberately lives in the URL and NOT in
// storage: a sessionStorage "last visited store" heuristic existed here once
// and was removed — ambient tracking breaks on back/forward-cache restores
// (effects don't re-run) and multiple tabs, while a URL param survives all
// of that as part of browser history.
