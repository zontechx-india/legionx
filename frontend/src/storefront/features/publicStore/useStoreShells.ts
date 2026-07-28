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

// ---------------------------------------------------------------------------
// Last visited store — lets the multi-store /cart continue the theme of the
// store the visitor came from. Session-scoped on purpose: a new visit starts
// neutral rather than resurrecting last week's store.
// ---------------------------------------------------------------------------

// sessionStorage is per-tab and short-lived — a plain rename, no migration.
const LAST_STORE_KEY = 'uniemax.lastStore'

/** Called by `PublicStoreLayout` whenever a store page renders. */
export function rememberLastStore(slug: string) {
  try {
    sessionStorage.setItem(LAST_STORE_KEY, slug)
  } catch {
    /* storage blocked — cart simply stays neutral */
  }
}

export function lastVisitedStore(): string | null {
  try {
    return sessionStorage.getItem(LAST_STORE_KEY)
  } catch {
    return null
  }
}

/**
 * Which store should theme the /cart overview:
 *   one store in the cart      → that store (unambiguous);
 *   several stores             → the last-visited one when it's among them,
 *                                else the first group (stable, predictable);
 *   empty cart                 → the last-visited store, so a visitor who
 *                                just left a storefront stays in its world.
 */
export function cartThemeSlug(storeSlugs: string[]): string | null {
  if (storeSlugs.length === 1) return storeSlugs[0]!
  const last = lastVisitedStore()
  if (last && (storeSlugs.length === 0 || storeSlugs.includes(last))) {
    return last
  }
  return storeSlugs[0] ?? last
}
