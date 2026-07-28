import { useCallback, useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { usePageTitle } from '../../shared/usePageTitle'
import { ThemeToggle } from '../../shared/theme/ThemeToggle'
import { AppLogoMark } from '../../shared/ui/AppLogo'
import { SessionProvider } from '../app/SessionProvider'
import { useMarketSession } from '../app/marketSession'
import { AccountMenu } from '../layout/AccountMenu'
import {
  BoxIcon,
  CartIcon,
  ChevronRightIcon,
  CloseIcon,
  GlobeIcon,
  PlusIcon,
  SearchIcon,
  StoreIcon,
  TagIcon,
} from '../layout/icons'
import { useCart } from '../features/cart/cart'
import { discoveryApi } from '../features/discovery/discoveryApi'
import type {
  MarketStore,
  PlatformStats,
  SearchResults,
} from '../features/discovery/discoveryApi'
import {
  rememberSearch,
  useRecentSearches,
  useRecentStores,
} from '../features/discovery/recentActivity'
import { storesApi, formatPrice } from '../features/stores/storesApi'
import type { Store } from '../features/stores/storesApi'

/**
 * Marketplace homepage (`/`) — the platform's public entry point. Not a
 * shopping page: it helps visitors find stores (global search, New Stores,
 * Recently Viewed), gives owners a shortcut to theirs, and sells the
 * "become a seller" story. Shopping happens inside `/store/{slug}`.
 *
 * Public by design: guests see everything except My Stores; the header
 * adapts (Sign in ↔ account menu) once the session probe resolves. Every
 * section loads independently — one failing API never blanks the page.
 */

const NEW_STORES_PAGE_SIZE = 12
const SEARCH_DEBOUNCE_MS = 300
const SEARCH_MIN_CHARS = 2

export function HomePage() {
  usePageTitle('Discover Stores')
  const { state } = useMarketSession()
  const authed = state.status === 'authed'

  // One fetch feeds both My Stores and the Become-a-Seller CTA label.
  const [myStores, setMyStores] = useState<Store[] | null>(null)
  useEffect(() => {
    if (!authed) {
      setMyStores(null)
      return
    }
    let cancelled = false
    storesApi
      .list()
      .then((stores) => {
        if (!cancelled) setMyStores(stores)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [authed])

  return (
    <div className="flex min-h-screen flex-col bg-bg">
      <MarketHeader />
      <main className="flex-1">
        <HeroSearch />
        {/* Full-bleed like the storefront: 1920px is a soft cap for ultrawides. */}
        <div className="mx-auto w-full max-w-[1920px] space-y-16 px-4 pb-16 sm:px-6 lg:px-10">
          <NewStoresSection />
          <RecentlyViewedSection />
          {authed && myStores && myStores.length > 0 && (
            <MyStoresSection stores={myStores} />
          )}
          <BecomeSellerSection ownsStores={(myStores?.length ?? 0) > 0} />
          <StatsSection />
        </div>
      </main>
      <MarketFooter />
    </div>
  )
}

// ---------------------------------------------------------------------------
// Header — brand · theme toggle · cart · session (Sign in / account menu)
// ---------------------------------------------------------------------------

function MarketHeader() {
  const { state, signOut } = useMarketSession()
  const items = useCart()
  const cartCount = items.reduce((sum, item) => sum + item.qty, 0)

  return (
    <header className="sticky top-0 z-20 border-b border-line bg-bg/90 backdrop-blur">
      <div className="mx-auto flex h-14 w-full max-w-[1920px] items-center gap-3 px-4 sm:px-6 lg:px-10">
        <Link to="/" className="flex items-center gap-2">
          <AppLogoMark className="h-8 w-8" />
          <span className="font-heading text-lg font-semibold text-fg">
            Unie Max
          </span>
        </Link>

        <div className="ml-auto flex items-center gap-1.5 sm:gap-2">
          <ThemeToggle />
          {/* Plain <a>: /cart lives in the public router (full page load). */}
          <a
            href="/cart"
            aria-label={`Cart${cartCount > 0 ? ` (${cartCount} items)` : ''}`}
            className="relative flex h-9 w-9 items-center justify-center rounded-md text-muted transition-colors hover:bg-surface-alt hover:text-fg"
          >
            <CartIcon className="h-5 w-5" />
            {cartCount > 0 && (
              <span className="absolute -right-0.5 -top-0.5 flex h-4 min-w-4 items-center justify-center rounded-pill bg-brand px-1 text-[10px] font-bold text-brand-contrast">
                {cartCount > 99 ? '99+' : cartCount}
              </span>
            )}
          </a>

          {state.status === 'loading' && (
            <div className="h-9 w-9 animate-pulse rounded-full bg-surface-alt" />
          )}
          {state.status === 'guest' && (
            <Link
              to="/login"
              className="rounded-md bg-brand-gradient px-4 py-2 text-sm font-semibold text-brand-contrast transition hover:opacity-90"
            >
              Sign in
            </Link>
          )}
          {state.status === 'authed' && (
            <SessionProvider customer={state.user} signOut={signOut}>
              <AccountMenu />
            </SessionProvider>
          )}
        </div>
      </div>
    </header>
  )
}

// ---------------------------------------------------------------------------
// Hero + global search
// ---------------------------------------------------------------------------

function HeroSearch() {
  return (
    <section className="px-4 pb-12 pt-14 text-center sm:px-6 sm:pb-16 sm:pt-20">
      {/* Display copy is select-none: a drag toward the search box otherwise
          highlights the headline, which reads as glitchy. The search input
          itself stays fully selectable. */}
      <p className="select-none text-xs font-semibold uppercase tracking-widest text-muted">
        Unie Max Marketplace
      </p>
      <h1 className="mx-auto mt-3 max-w-3xl select-none font-heading text-4xl font-bold text-fg sm:text-6xl sm:leading-none">
        Discover stores.{' '}
        <span className="text-brand-gradient">Shop anything.</span>
      </h1>
      <p className="mx-auto mt-4 max-w-xl select-none text-sm text-muted sm:text-base">
        Every store on the platform, one search away — or open your own in
        minutes.
      </p>
      <div className="mx-auto mt-8 max-w-2xl">
        <GlobalSearchBox />
      </div>
    </section>
  )
}

function GlobalSearchBox() {
  const [q, setQ] = useState('')
  const [focused, setFocused] = useState(false)
  const [results, setResults] = useState<SearchResults | null>(null)
  const [searching, setSearching] = useState(false)
  const [failed, setFailed] = useState(false)
  const requestId = useRef(0)
  const rootRef = useRef<HTMLDivElement>(null)
  const recent = useRecentSearches()

  const query = q.trim()
  const active = query.length >= SEARCH_MIN_CHARS

  // Debounced grouped search with an out-of-order guard (same idiom as
  // useProductQuery): only the latest request may write state.
  useEffect(() => {
    if (!active) {
      setResults(null)
      setSearching(false)
      setFailed(false)
      return
    }
    setSearching(true)
    const id = ++requestId.current
    const timer = window.setTimeout(() => {
      discoveryApi
        .search(query)
        .then((found) => {
          if (requestId.current !== id) return
          setResults(found)
          setFailed(false)
          setSearching(false)
        })
        .catch(() => {
          if (requestId.current !== id) return
          setFailed(true)
          setSearching(false)
        })
    }, SEARCH_DEBOUNCE_MS)
    return () => window.clearTimeout(timer)
  }, [query, active])

  // Outside tap / Escape close the panel (input blur alone would race the
  // result clicks).
  useEffect(() => {
    if (!focused) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setFocused(false)
    }
    const onPointerDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setFocused(false)
    }
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('pointerdown', onPointerDown)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('pointerdown', onPointerDown)
    }
  }, [focused])

  /** First hit in display order — the Enter target. */
  const firstHitUrl = useCallback((): string | null => {
    if (!results) return null
    const store = results.stores[0]
    if (store) return `/store/${store.slug}`
    const category = results.categories[0]
    if (category)
      return `/store/${category.store.slug}/category/${category.slug}`
    const product = results.products[0]
    if (product) return `/store/${product.store.slug}/product/${product.slug}`
    return null
  }, [results])

  const go = (url: string) => {
    rememberSearch(query)
    // Storefront pages live in the public router — a full navigation
    // crosses the router boundary exactly like the store header's cart link.
    window.location.href = url
  }

  const showPanel = focused && active

  return (
    <div ref={rootRef} className="relative text-left">
      <div className="flex items-center gap-3 rounded-pill border border-line bg-input px-5 py-3.5 shadow-floating transition-colors focus-within:border-accent">
        <SearchIcon className="h-5 w-5 shrink-0 text-muted" />
        <input
          value={q}
          onChange={(e) => setQ(e.target.value)}
          onFocus={() => setFocused(true)}
          onKeyDown={(e) => {
            if (e.key !== 'Enter') return
            const url = firstHitUrl()
            if (url) go(url)
          }}
          placeholder="Search stores, products, or categories..."
          aria-label="Search stores, products, or categories"
          className="w-full bg-transparent text-sm text-fg outline-none placeholder:text-muted sm:text-base"
        />
        {q && (
          <button
            type="button"
            aria-label="Clear search"
            onClick={() => setQ('')}
            className="shrink-0 rounded-full p-1 text-muted transition-colors hover:bg-surface-alt hover:text-fg"
          >
            <CloseIcon className="h-4 w-4" />
          </button>
        )}
      </div>

      {/* Recent searches — local only; hidden when there are none. */}
      {!active && recent.length > 0 && (
        <div className="mt-3 flex flex-wrap items-center justify-center gap-2">
          <span className="text-xs text-muted">Recent:</span>
          {recent.map((term) => (
            <button
              key={term}
              type="button"
              onClick={() => setQ(term)}
              className="rounded-pill border border-line bg-surface px-3 py-1 text-xs font-medium text-fg transition-colors hover:border-accent"
            >
              {term}
            </button>
          ))}
        </div>
      )}

      {showPanel && (
        <div className="absolute left-0 right-0 top-full z-30 mt-2 max-h-[70vh] overflow-y-auto rounded-lg border border-line bg-surface py-2 shadow-floating">
          {searching && !results && (
            <p className="px-5 py-4 text-sm text-muted">Searching…</p>
          )}
          {failed && (
            <p className="px-5 py-4 text-sm text-danger">
              Something went wrong. Please try again.
            </p>
          )}
          {results && !failed && (
            <SearchResultsPanel results={results} onPick={go} />
          )}
        </div>
      )}
    </div>
  )
}

function SearchResultsPanel({
  results,
  onPick,
}: {
  results: SearchResults
  onPick: (url: string) => void
}) {
  const empty =
    results.stores.length === 0 &&
    results.categories.length === 0 &&
    results.products.length === 0

  if (empty) {
    return (
      <p className="px-5 py-4 text-sm text-muted">
        No matching stores, products or categories found.
      </p>
    )
  }

  // Always grouped, never interleaved (spec's Search Requirements).
  return (
    <div className="divide-y divide-line">
      {results.stores.length > 0 && (
        <ResultGroup label="Stores">
          {results.stores.map((store) => (
            <ResultRow
              key={store.id}
              onPick={() => onPick(`/store/${store.slug}`)}
              icon={
                store.logoUrl ? (
                  <img
                    src={store.logoUrl}
                    alt=""
                    className="h-9 w-9 rounded-md object-cover"
                  />
                ) : (
                  <IconTile>
                    <StoreIcon className="h-4 w-4" />
                  </IconTile>
                )
              }
              title={store.name}
              subtitle={`/store/${store.slug}`}
            />
          ))}
        </ResultGroup>
      )}

      {results.categories.length > 0 && (
        <ResultGroup label="Categories">
          {results.categories.map((category) => (
            <ResultRow
              key={category.id}
              onPick={() =>
                onPick(
                  `/store/${category.store.slug}/category/${category.slug}`,
                )
              }
              icon={
                <IconTile>
                  <TagIcon className="h-4 w-4" />
                </IconTile>
              }
              title={
                category.parentName
                  ? `${category.parentName} › ${category.name}`
                  : category.name
              }
              subtitle={`in ${category.store.name}`}
            />
          ))}
        </ResultGroup>
      )}

      {results.products.length > 0 && (
        <ResultGroup label="Products">
          {results.products.map((product) => (
            <ResultRow
              key={product.id}
              onPick={() =>
                onPick(`/store/${product.store.slug}/product/${product.slug}`)
              }
              icon={
                product.image?.url ? (
                  <img
                    src={product.image.url}
                    alt={product.image.altText ?? ''}
                    className="h-9 w-9 rounded-md object-cover"
                  />
                ) : (
                  <IconTile>
                    <BoxIcon className="h-4 w-4" />
                  </IconTile>
                )
              }
              title={product.name}
              subtitle={`${product.categoryName} · ${product.store.name}`}
              trailing={
                product.price !== null ? (
                  <span className="text-sm font-semibold text-brand">
                    {formatPrice(product.price)}
                  </span>
                ) : undefined
              }
            />
          ))}
        </ResultGroup>
      )}
    </div>
  )
}

function ResultGroup({
  label,
  children,
}: {
  label: string
  children: React.ReactNode
}) {
  return (
    <div className="py-2">
      <p className="px-5 pb-1 pt-2 text-xs font-semibold uppercase tracking-widest text-muted">
        {label}
      </p>
      {children}
    </div>
  )
}

function ResultRow({
  icon,
  title,
  subtitle,
  trailing,
  onPick,
}: {
  icon: React.ReactNode
  title: string
  subtitle: string
  trailing?: React.ReactNode
  onPick: () => void
}) {
  return (
    <button
      type="button"
      onClick={onPick}
      className="flex w-full items-center gap-3 px-5 py-2.5 text-left transition-colors hover:bg-surface-alt"
    >
      <span className="shrink-0">{icon}</span>
      <span className="min-w-0 flex-1">
        <span className="block truncate text-sm font-medium text-fg">
          {title}
        </span>
        <span className="block truncate text-xs text-muted">{subtitle}</span>
      </span>
      {trailing ?? <ChevronRightIcon className="h-4 w-4 shrink-0 text-muted" />}
    </button>
  )
}

function IconTile({ children }: { children: React.ReactNode }) {
  return (
    <span className="flex h-9 w-9 items-center justify-center rounded-md bg-brand/10 text-brand">
      {children}
    </span>
  )
}

// ---------------------------------------------------------------------------
// Section scaffolding — heading row + independent load/error/skeleton states
// ---------------------------------------------------------------------------

function Section({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle?: string
  children: React.ReactNode
}) {
  return (
    <section>
      <div className="mb-5">
        <h2 className="font-heading text-2xl font-semibold text-fg sm:text-3xl">
          {title}
        </h2>
        {subtitle && <p className="mt-1 text-sm text-muted">{subtitle}</p>}
      </div>
      {children}
    </section>
  )
}

function SectionError({ onRetry }: { onRetry: () => void }) {
  return (
    <div className="flex flex-col items-center rounded-lg border border-line bg-surface px-6 py-10 text-center shadow-floating">
      <p className="text-sm font-medium text-fg">Something went wrong.</p>
      <p className="mt-1 text-sm text-muted">Please try again.</p>
      <button
        type="button"
        onClick={onRetry}
        className="mt-4 rounded-md border border-line bg-surface-alt px-5 py-2 text-sm font-semibold text-fg transition-colors hover:border-accent"
      >
        Retry
      </button>
    </div>
  )
}

/** Open-ended card grid — same column ramp as the storefront (2→3→4→5). */
const CARD_GRID =
  'grid grid-cols-2 gap-4 sm:gap-5 md:grid-cols-3 xl:grid-cols-4 2xl:grid-cols-5'

function CardSkeletons({ count }: { count: number }) {
  return (
    <div className={CARD_GRID}>
      {Array.from({ length: count }, (_, i) => (
        <div
          key={i}
          className="animate-pulse rounded-lg border border-line bg-surface p-6"
        >
          <div className="h-14 w-14 rounded-md bg-surface-alt" />
          <div className="mt-5 h-4 w-3/4 rounded bg-surface-alt" />
          <div className="mt-2 h-3 w-1/2 rounded bg-surface-alt" />
        </div>
      ))}
    </div>
  )
}

/** Store logo or the store glyph — cards never break on a missing logo. */
function StoreLogoTile({
  logoUrl,
  className = 'h-12 w-12',
}: {
  logoUrl: string | null
  className?: string
}) {
  if (logoUrl) {
    return (
      <img
        src={logoUrl}
        alt=""
        loading="lazy"
        className={`${className} rounded-md border border-line object-cover`}
      />
    )
  }
  return (
    <span
      className={`${className} flex items-center justify-center rounded-md bg-brand/10 text-brand`}
    >
      <StoreIcon className="h-5 w-5" />
    </span>
  )
}

// ---------------------------------------------------------------------------
// New Stores — newest published stores (the platform is young; this replaces
// Trending until real activity data exists)
// ---------------------------------------------------------------------------

function NewStoresSection() {
  const [stores, setStores] = useState<MarketStore[] | null>(null)
  const [failed, setFailed] = useState(false)
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let cancelled = false
    setFailed(false)
    setStores(null)
    discoveryApi
      .listStores({ pageSize: NEW_STORES_PAGE_SIZE })
      .then(({ items }) => {
        if (!cancelled) setStores(items)
      })
      .catch(() => {
        if (!cancelled) setFailed(true)
      })
    return () => {
      cancelled = true
    }
  }, [attempt])

  return (
    <Section
      title="New Stores"
      subtitle="Recently opened on the marketplace — take a look around."
    >
      {failed ? (
        <SectionError onRetry={() => setAttempt((n) => n + 1)} />
      ) : stores === null ? (
        <CardSkeletons count={4} />
      ) : stores.length === 0 ? (
        <div className="flex flex-col items-center rounded-lg border border-line bg-surface px-6 py-12 text-center shadow-floating">
          <IconTile>
            <StoreIcon className="h-4 w-4" />
          </IconTile>
          <p className="mt-3 text-sm font-medium text-fg">
            No stores have been published yet.
          </p>
          <p className="mt-1 text-sm text-muted">Be the first seller!</p>
          <CreateStoreLink className="mt-4 rounded-md bg-brand-gradient px-5 py-2 text-sm font-semibold text-brand-contrast transition hover:opacity-90">
            Create Store →
          </CreateStoreLink>
        </div>
      ) : (
        <div className={CARD_GRID}>
          {stores.map((store) => (
            <a
              key={store.id}
              href={`/store/${store.slug}`}
              className="group rounded-lg border border-line bg-surface p-5 shadow-floating transition hover:-translate-y-0.5 hover:border-accent sm:p-6"
            >
              <StoreLogoTile logoUrl={store.logoUrl} className="h-14 w-14" />
              <p className="mt-5 truncate text-base font-semibold text-fg">
                {store.name}
              </p>
              <p className="mt-1 flex items-center gap-1 truncate text-xs text-muted">
                <GlobeIcon className="h-3 w-3 shrink-0" />
                /store/{store.slug}
              </p>
              <p className="mt-4 text-sm font-semibold text-brand">
                Visit Store{' '}
                <span className="inline-block transition-transform group-hover:translate-x-0.5">
                  →
                </span>
              </p>
            </a>
          ))}
        </div>
      )}
    </Section>
  )
}

// ---------------------------------------------------------------------------
// Recently Viewed — local snapshots; hidden when empty
// ---------------------------------------------------------------------------

function RecentlyViewedSection() {
  const recent = useRecentStores()
  if (recent.length === 0) return null

  return (
    <Section title="Recently Viewed" subtitle="Pick up where you left off.">
      <div className="flex gap-4 overflow-x-auto pb-2">
        {recent.map((store) => (
          <a
            key={store.slug}
            href={`/store/${store.slug}`}
            className="flex w-64 shrink-0 items-center gap-3.5 rounded-lg border border-line bg-surface p-4 shadow-floating transition hover:-translate-y-0.5 hover:border-accent sm:w-72 sm:p-5"
          >
            <StoreLogoTile logoUrl={store.logoUrl} className="h-12 w-12" />
            <span className="min-w-0">
              <span className="block truncate text-base font-semibold text-fg">
                {store.name}
              </span>
              <span className="mt-0.5 block text-xs font-semibold text-brand">
                Visit again →
              </span>
            </span>
          </a>
        ))}
      </div>
    </Section>
  )
}

// ---------------------------------------------------------------------------
// My Stores — owners only (hidden entirely otherwise)
// ---------------------------------------------------------------------------

function MyStoresSection({ stores }: { stores: Store[] }) {
  return (
    <Section title="My Stores" subtitle="Jump straight into managing a store.">
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-4 sm:gap-5">
        {stores.map((store) => (
          <div
            key={store.id}
            className="flex items-center gap-4 rounded-lg border border-line bg-surface p-5 shadow-floating sm:p-6"
          >
            <StoreLogoTile logoUrl={store.logoUrl} className="h-14 w-14" />
            <div className="min-w-0 flex-1">
              {/* User-typed name → body face (convention). */}
              <p className="truncate font-body text-base font-semibold tracking-normal text-fg">
                {store.name}
              </p>
              <span
                className={`mt-1 inline-block rounded-pill px-2 py-0.5 text-[11px] font-semibold ${
                  store.isPublished
                    ? 'bg-success/10 text-success'
                    : 'bg-warning/10 text-warning'
                }`}
              >
                {store.isPublished ? 'Published' : 'Draft'}
              </span>
            </div>
            <Link
              to={`/stores/${store.slug}`}
              className="shrink-0 rounded-md border border-line px-3.5 py-2 text-sm font-semibold text-fg transition-colors hover:border-accent"
            >
              Manage
            </Link>
          </div>
        ))}

        <Link
          to="/stores/new"
          className="flex min-h-24 items-center justify-center gap-2 rounded-lg border border-dashed border-line p-5 text-sm font-semibold text-muted transition-colors hover:border-accent hover:text-fg"
        >
          <PlusIcon className="h-4 w-4" />
          Create New Store
        </Link>
      </div>
    </Section>
  )
}

// ---------------------------------------------------------------------------
// Become a Seller — the growth pitch (one of the largest sections by design)
// ---------------------------------------------------------------------------

function BecomeSellerSection({ ownsStores }: { ownsStores: boolean }) {
  return (
    <section className="relative overflow-hidden rounded-lg bg-brand-gradient px-6 py-14 text-center text-brand-contrast shadow-floating sm:px-10 sm:py-20">
      <div className="pointer-events-none absolute -left-16 -top-20 h-64 w-64 rounded-full bg-white/10" />
      <div className="pointer-events-none absolute -bottom-24 -right-12 h-56 w-56 rounded-full bg-white/10" />

      <p className="text-xs font-semibold uppercase tracking-widest text-brand-contrast/80">
        Become a Seller
      </p>
      <h2 className="mx-auto mt-3 max-w-2xl font-heading text-3xl font-bold sm:text-5xl">
        Start Selling Online
      </h2>
      <p className="mx-auto mt-3 max-w-xl text-sm text-brand-contrast/90 sm:text-base">
        Create your own professional online store in minutes. No technical
        knowledge required.
      </p>
      <CreateStoreLink className="mt-8 inline-block rounded-md bg-white px-8 py-3 text-sm font-bold text-black transition hover:bg-white/90">
        {ownsStores ? 'Create Another Store' : 'Create Store'}
      </CreateStoreLink>
    </section>
  )
}

/**
 * "Create a store" CTA that works for everyone: guests are routed through
 * /login with the creation page as the return destination.
 */
function CreateStoreLink({
  className,
  children,
}: {
  className?: string
  children: React.ReactNode
}) {
  const { state } = useMarketSession()
  const to =
    state.status === 'authed'
      ? '/stores/new'
      : `/login?next=${encodeURIComponent('/stores/new')}`
  return (
    <Link to={to} className={className}>
      {children}
    </Link>
  )
}

// ---------------------------------------------------------------------------
// Platform stats — trust counters (orders joins once the orders module lands)
// ---------------------------------------------------------------------------

function StatsSection() {
  const [stats, setStats] = useState<PlatformStats | null>(null)
  const [failed, setFailed] = useState(false)
  const [attempt, setAttempt] = useState(0)

  useEffect(() => {
    let cancelled = false
    setFailed(false)
    setStats(null)
    discoveryApi
      .stats()
      .then((data) => {
        if (!cancelled) setStats(data)
      })
      .catch(() => {
        if (!cancelled) setFailed(true)
      })
    return () => {
      cancelled = true
    }
  }, [attempt])

  // A brand-new marketplace showing "0 Stores" undermines the trust the
  // section exists to build — hide until there is something to show.
  if (stats && stats.stores === 0) return null

  return (
    <section className="rounded-lg border border-line bg-surface px-6 py-10 shadow-floating">
      {failed ? (
        <SectionError onRetry={() => setAttempt((n) => n + 1)} />
      ) : stats === null ? (
        <div className="flex animate-pulse items-center justify-center gap-16">
          {[0, 1].map((i) => (
            <div key={i} className="space-y-2 text-center">
              <div className="mx-auto h-9 w-20 rounded bg-surface-alt" />
              <div className="mx-auto h-3 w-16 rounded bg-surface-alt" />
            </div>
          ))}
        </div>
      ) : (
        <div className="flex items-center justify-center gap-12 sm:gap-20">
          <StatBlock value={stats.stores} label="Stores" />
          <div className="h-12 w-px bg-line" />
          <StatBlock value={stats.products} label="Products" />
        </div>
      )}
    </section>
  )
}

function StatBlock({ value, label }: { value: number; label: string }) {
  return (
    <div className="text-center">
      <p className="font-heading text-4xl font-bold text-fg sm:text-5xl">
        {value.toLocaleString('en-IN')}
      </p>
      <p className="mt-1 text-xs font-semibold uppercase tracking-widest text-muted">
        {label}
      </p>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Footer
// ---------------------------------------------------------------------------

const FOOTER_LINKS = [
  { label: 'About', to: '/about' },
  { label: 'Privacy Policy', to: '/privacy' },
  { label: 'Terms & Conditions', to: '/terms' },
  { label: 'Support', to: '/support' },
  { label: 'Contact', to: '/contact' },
] as const

function MarketFooter() {
  return (
    <footer className="border-t border-line bg-surface">
      <div className="mx-auto flex w-full max-w-[1920px] flex-col items-center gap-5 px-4 py-8 sm:px-6 lg:px-10">
        <nav className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2">
          {FOOTER_LINKS.map(({ label, to }) => (
            <Link
              key={to}
              to={to}
              className="text-sm text-muted transition-colors hover:text-fg"
            >
              {label}
            </Link>
          ))}
          <CreateStoreLink className="text-sm font-semibold text-brand transition hover:opacity-80">
            Become a Seller
          </CreateStoreLink>
        </nav>
        <p className="text-xs text-muted">
          © {new Date().getFullYear()} Unie Max · All rights reserved
        </p>
      </div>
    </footer>
  )
}
