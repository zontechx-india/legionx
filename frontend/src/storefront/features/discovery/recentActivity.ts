import { useSyncExternalStore } from 'react'

/**
 * Client-side "continue where you left off" memory for the marketplace
 * homepage — recent searches and recently viewed stores. Pure localStorage
 * (the spec is explicit: no backend for either), exposed through
 * `useSyncExternalStore` so every consumer re-renders on writes and
 * cross-tab changes, same idiom as the cart store.
 */

const SEARCHES_KEY = 'uniemax.recentSearches'
const STORES_KEY = 'uniemax.recentStores'
const MAX_SEARCHES = 8
const MAX_STORES = 12

/** What a "recently viewed" card needs — a snapshot, never refetched. */
export interface RecentStore {
  slug: string
  name: string
  logoUrl: string | null
}

// --- tiny persisted-list store (shared by both lists) -----------------------

interface LocalList<T> {
  read(): T[]
  write(items: T[]): void
  subscribe(onChange: () => void): () => void
  useList(): T[]
}

function createLocalList<T>(key: string, sanitize: (raw: unknown) => T[]): LocalList<T> {
  let cached: T[] = load()
  const listeners = new Set<() => void>()

  function load(): T[] {
    try {
      return sanitize(JSON.parse(localStorage.getItem(key) ?? '[]'))
    } catch {
      return []
    }
  }

  function emit() {
    for (const listener of listeners) listener()
  }

  // Cross-tab: the storage event only fires in OTHER tabs.
  if (typeof window !== 'undefined') {
    window.addEventListener('storage', (e) => {
      if (e.key !== key) return
      cached = load()
      emit()
    })
  }

  return {
    read: () => cached,
    write(items: T[]) {
      cached = items
      try {
        localStorage.setItem(key, JSON.stringify(items))
      } catch {
        /* storage blocked — the in-memory copy still works this session */
      }
      emit()
    },
    subscribe(onChange: () => void) {
      listeners.add(onChange)
      return () => listeners.delete(onChange)
    },
    useList() {
      // eslint-disable-next-line react-hooks/rules-of-hooks -- stable per created store
      return useSyncExternalStore(this.subscribe, this.read, () => cached)
    },
  }
}

const searches = createLocalList<string>(SEARCHES_KEY, (raw) =>
  Array.isArray(raw)
    ? raw.filter((s): s is string => typeof s === 'string' && s.length > 0)
    : [],
)

const stores = createLocalList<RecentStore>(STORES_KEY, (raw) =>
  Array.isArray(raw)
    ? raw.filter(
        (s): s is RecentStore =>
          !!s &&
          typeof s === 'object' &&
          typeof (s as RecentStore).slug === 'string' &&
          typeof (s as RecentStore).name === 'string',
      )
    : [],
)

// --- recent searches ---------------------------------------------------------

/** Most recent first, deduped case-insensitively, capped. */
export function rememberSearch(query: string) {
  const q = query.trim()
  if (q.length < 2) return
  const rest = searches
    .read()
    .filter((s) => s.toLowerCase() !== q.toLowerCase())
  searches.write([q, ...rest].slice(0, MAX_SEARCHES))
}

export function useRecentSearches(): string[] {
  return searches.useList()
}

// --- recently viewed stores ---------------------------------------------------

/** Called by `PublicStoreLayout` whenever a storefront shell loads. */
export function rememberStoreVisit(store: RecentStore) {
  const rest = stores.read().filter((s) => s.slug !== store.slug)
  stores.write(
    [{ slug: store.slug, name: store.name, logoUrl: store.logoUrl }, ...rest].slice(
      0,
      MAX_STORES,
    ),
  )
}

export function useRecentStores(): RecentStore[] {
  return stores.useList()
}
