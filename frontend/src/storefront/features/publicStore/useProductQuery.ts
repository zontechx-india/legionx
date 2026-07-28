import { useCallback, useEffect, useRef, useState } from 'react'
import {
  publicStoreApi,
  type PublicProduct,
  type PublicProductQuery,
} from '../stores/storesApi'

/** Products fetched per batch (Load More / infinite scroll). */
export const PAGE_SIZE = 24

/** Debounce applied to the free-text query so typing doesn't spam the API. */
const SEARCH_DEBOUNCE_MS = 300

/**
 * How long a cached listing stays served without a refetch. Short on purpose:
 * long enough to cover product-page → back navigation (the painful case),
 * short enough that catalog edits show up on the next real visit.
 */
const CACHE_TTL_MS = 5 * 60_000
/** Bounded so a long browse session can't hoard product pages forever. */
const CACHE_MAX_ENTRIES = 30

interface CacheEntry {
  products: PublicProduct[]
  total: number
  page: number
  at: number
}

/**
 * Session-lifetime listing cache keyed by store + full query. Restoring from
 * it renders synchronously, which is what lets the router's scroll
 * restoration land on the right position after back-navigation (async
 * refetches used to reset every listing to page 1 / scroll 0).
 */
const listingCache = new Map<string, CacheEntry>()

function readCache(key: string): CacheEntry | undefined {
  const entry = listingCache.get(key)
  if (!entry) return undefined
  if (Date.now() - entry.at > CACHE_TTL_MS) {
    listingCache.delete(key)
    return undefined
  }
  return entry
}

function writeCache(key: string, entry: CacheEntry) {
  listingCache.delete(key) // re-insert to refresh Map insertion order (LRU)
  listingCache.set(key, entry)
  if (listingCache.size > CACHE_MAX_ENTRIES) {
    const oldest = listingCache.keys().next().value
    if (oldest !== undefined) listingCache.delete(oldest)
  }
}

export interface ProductQueryResult {
  products: PublicProduct[]
  total: number
  loading: boolean
  /** True only for the first page — lets pages show a skeleton vs a spinner. */
  initialLoading: boolean
  error: string | null
  hasMore: boolean
  loadMore: () => void
}

/**
 * Server-paginated product listing.
 *
 * Every filter/sort/search change resets to page 1 and refetches; Load More
 * appends the next page. Nothing is filtered client-side — the API returns
 * exactly one page — which is what lets a store with thousands of products
 * stay fast.
 *
 * Results are kept in a short-TTL session cache: coming *back* to a listing
 * (product page → back) restores every loaded page and the scroll position
 * instantly instead of refetching page 1 from scratch.
 *
 * Responses are guarded by a request counter so a slow page-1 response can
 * never overwrite a newer one (the classic out-of-order fetch bug).
 */
export function useProductQuery(
  storeSlug: string,
  query: PublicProductQuery,
): ProductQueryResult {
  // Serialised so effects re-run on *value* changes, not object identity.
  const key = JSON.stringify({ storeSlug, ...query })

  const [cached] = useState(() => readCache(key))
  const [products, setProducts] = useState<PublicProduct[]>(
    cached?.products ?? [],
  )
  const [total, setTotal] = useState(cached?.total ?? 0)
  const [page, setPage] = useState(cached?.page ?? 1)
  const [loading, setLoading] = useState(!cached)
  const [error, setError] = useState<string | null>(null)

  const requestId = useRef(0)
  // Set whenever state was just hydrated from the cache — the next fetch
  // effect run is skipped (the data on screen IS the data for this key/page).
  const skipFetch = useRef(cached !== undefined)
  const productsRef = useRef(products)
  productsRef.current = products

  // Query change (not mount): restart from the cache or from page 1.
  const lastKey = useRef(key)
  useEffect(() => {
    if (lastKey.current === key) return
    lastKey.current = key
    const entry = readCache(key)
    skipFetch.current = entry !== undefined
    setProducts(entry?.products ?? [])
    setTotal(entry?.total ?? 0)
    setPage(entry?.page ?? 1)
    setLoading(entry === undefined)
    setError(null)
  }, [key])

  useEffect(() => {
    if (skipFetch.current) {
      skipFetch.current = false
      return
    }
    const id = ++requestId.current
    const debounce = query.q ? SEARCH_DEBOUNCE_MS : 0
    setLoading(true)

    const timer = setTimeout(() => {
      publicStoreApi
        .listProducts(storeSlug, { ...query, page, pageSize: PAGE_SIZE })
        .then(({ items, meta }) => {
          if (id !== requestId.current) return // superseded by a newer query
          const merged = page === 1 ? items : [...productsRef.current, ...items]
          setProducts(merged)
          setTotal(meta.total)
          setError(null)
          writeCache(key, {
            products: merged,
            total: meta.total,
            page,
            at: Date.now(),
          })
        })
        .catch((err: unknown) => {
          if (id !== requestId.current) return
          setProducts([])
          setTotal(0)
          setError(err instanceof Error ? err.message : 'Could not load products')
        })
        .finally(() => {
          if (id === requestId.current) setLoading(false)
        })
    }, debounce)

    return () => clearTimeout(timer)
    // `key` covers every field of `query`; `page` advances pagination.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key, page])

  const loadMore = useCallback(() => setPage((p) => p + 1), [])

  return {
    products,
    total,
    loading,
    initialLoading: loading && products.length === 0,
    error,
    hasMore: products.length < total,
    loadMore,
  }
}
