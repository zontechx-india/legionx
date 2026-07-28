import { call, callList, http } from '../../../shared/auth/http'
import type { ListMeta } from '../../../shared/auth/http'

/**
 * Marketplace discovery — the anonymous, platform-wide surface behind the
 * homepage (`/`): global search, the "New Stores" rail and the trust stats.
 * Backed by `/api/v1/public/*` (see docs/API.md).
 */

const PUBLIC = '/api/v1/public'

/** A store as a marketplace card needs it — branding only, never catalog. */
export interface MarketStore {
  id: string
  name: string
  slug: string
  logoUrl: string | null
  /** Stamped on first publish; drives the "New Stores" ordering. */
  publishedAt: string | null
}

export interface SearchStoreHit {
  id: string
  name: string
  slug: string
  logoUrl: string | null
}

/** Categories exist only inside a store, so a hit carries its owner. */
export interface SearchCategoryHit {
  id: string
  name: string
  slug: string
  parentName: string | null
  store: { name: string; slug: string }
}

export interface SearchProductHit {
  id: string
  name: string
  slug: string
  /** "From" price (cheapest sellable variant). Decimal on the wire. */
  price: string | null
  stockQuantity: number
  categoryName: string
  store: { name: string; slug: string }
  image: { url: string | null; altText: string | null } | null
}

/** Always grouped — stores, categories and products are never interleaved. */
export interface SearchResults {
  stores: SearchStoreHit[]
  categories: SearchCategoryHit[]
  products: SearchProductHit[]
}

export interface PlatformStats {
  stores: number
  products: number
}

export const discoveryApi = {
  /** Published stores, newest publish first (homepage "New Stores"). */
  async listStores(
    query: { page?: number; pageSize?: number } = {},
  ): Promise<{ items: MarketStore[]; meta: ListMeta }> {
    const params = new URLSearchParams()
    if (query.page) params.set('page', String(query.page))
    if (query.pageSize) params.set('pageSize', String(query.pageSize))
    const qs = params.toString()
    return callList<MarketStore>(
      http.get(`${PUBLIC}/stores${qs ? `?${qs}` : ''}`),
    )
  },

  /** Grouped global search; `q` needs 2+ characters. */
  async search(q: string, limit = 5): Promise<SearchResults> {
    const params = new URLSearchParams({ q, limit: String(limit) })
    return call<SearchResults>(http.get(`${PUBLIC}/search?${params}`))
  },

  /** Marketplace trust counters. */
  async stats(): Promise<PlatformStats> {
    return call<PlatformStats>(http.get(`${PUBLIC}/stats`))
  },
}
