import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import {
  publicStoreApi,
  storeCategoryUrl,
  storeShopUrl,
  type PublicCategory,
  type PublicProduct,
  type PublicSection,
  type PublicStore,
  type PublicStoreHome,
} from '../../features/stores/storesApi'
import { usePublicStore } from '../../features/publicStore/PublicStoreLayout'
import { usePageTitle } from '../../../shared/usePageTitle'
import { ProductCard } from '../../features/publicStore/ProductCard'
import {
  EmptyCatalog,
  GridSkeleton,
  SectionHeading,
} from '../../features/publicStore/ListingControls'
import { ChevronRightIcon, TagIcon } from '../../layout/icons'
import type { Skin } from '../../features/publicStore/storeTheme'

/** Products shown per homepage row — exactly one row on desktop. */
const ROW_SIZE = 4

/**
 * `/store/{storeSlug}` — the storefront homepage.
 *
 * It *introduces* the store rather than dumping a filtered product grid:
 * hero, featured categories, then the owner's merchandising sections.
 * Browsing happens on the category pages; discovery happens here and through
 * search.
 *
 * Each product row shows a single row's worth (4) with a "View all" link
 * into the Shop page scoped to that section (`?section=…`), so the homepage
 * stays a summary and never leaves an orphan card stranded on a second row.
 * Rows are strictly flag-driven — a section with nothing flagged renders
 * nothing (there is deliberately no fallback).
 */
export function StoreHomePage() {
  const { store, skin } = usePublicStore()
  usePageTitle(store.name)
  const [home, setHome] = useState<PublicStoreHome | null | undefined>(undefined)

  useEffect(() => {
    let cancelled = false
    setHome(undefined)
    publicStoreApi
      .getHome(store.slug)
      .then((data) => {
        if (!cancelled) setHome(data)
      })
      .catch(() => {
        if (!cancelled) setHome(null)
      })
    return () => {
      cancelled = true
    }
  }, [store.slug])

  if (store.categories.length === 0) {
    return <EmptyCatalog storeName={store.name} skin={skin} />
  }

  if (home === undefined) {
    return (
      <div className="space-y-14 sm:space-y-16">
        <Hero store={store} skin={skin} />
        <GridSkeleton skin={skin} />
      </div>
    )
  }

  if (home === null) {
    return (
      <div className="space-y-14 sm:space-y-16">
        <Hero store={store} skin={skin} />
        <p className={`py-10 text-center text-sm ${skin.muted}`}>
          Could not load this store's products. Please refresh.
        </p>
      </div>
    )
  }

  // Render sections in the ORDER the owner arranged. Each section renders only
  // when enabled AND non-empty, so disabling or emptying one just skips it.
  return (
    <div className="space-y-14 sm:space-y-16">
      {home.sections
        .filter((section) => section.enabled)
        .map((section) => (
          <HomeSection
            key={section.key}
            sectionKey={section.key}
            store={store}
            home={home}
            skin={skin}
          />
        ))}
    </div>
  )
}

/** Renders one homepage section by key. Empty content → nothing. */
function HomeSection({
  sectionKey,
  store,
  home,
  skin,
}: {
  sectionKey: PublicStoreHome['sections'][number]['key']
  store: PublicStore
  home: PublicStoreHome
  skin: Skin
}) {
  switch (sectionKey) {
    case 'hero':
      return <Hero store={store} skin={skin} />
    case 'categories':
      return (
        <FeaturedCategories
          store={store}
          categories={home.featuredCategories}
          skin={skin}
        />
      )
    case 'featured':
      return (
        <ProductRow
          store={store}
          title="Featured Products"
          section="featured"
          products={home.featured}
          skin={skin}
        />
      )
    case 'newArrivals':
      return (
        <ProductRow
          store={store}
          title="New Arrivals"
          section="newArrivals"
          products={home.newArrivals}
          skin={skin}
        />
      )
    case 'bestSellers':
      return (
        <ProductRow
          store={store}
          title="Best Sellers"
          section="bestSellers"
          products={home.bestSellers}
          skin={skin}
        />
      )
  }
}

/**
 * Hero banner. A single owner-authored banner slot; the carousel with
 * multiple slides, imagery and CTAs arrives with the banners feature.
 */
function Hero({ store, skin }: { store: PublicStore; skin: Skin }) {
  const productCount = store.categories.reduce(
    (sum, c) => sum + c.productCount,
    0,
  )

  return (
    <section
      className={`relative overflow-hidden rounded-3xl border ${skin.border} ${skin.surface}`}
    >
      {/* Brand wash — keeps the hero from reading as an empty white box. */}
      <div
        aria-hidden
        className="pointer-events-none absolute inset-0 opacity-[0.07]"
        style={{
          background:
            'radial-gradient(120% 120% at 85% 15%, var(--brand) 0%, transparent 60%)',
        }}
      />
      <div className="relative flex flex-col items-start gap-5 px-6 py-14 sm:px-12 sm:py-20">
        {/* Wide-tracked eyebrow (prototype: "UNIE MAX · SPORTS FACTORY"). */}
        <span className="text-xs font-semibold uppercase tracking-[0.35em] text-brand">
          Welcome
        </span>
        {/* Prototype hero scale: Oswald 700, near-flush leading. */}
        <h1
          className={`max-w-3xl font-heading text-4xl font-bold leading-none sm:text-6xl ${skin.text}`}
        >
          {store.name}
        </h1>
        <p className={`max-w-lg text-sm sm:text-base ${skin.muted}`}>
          Browse our full range — {productCount}{' '}
          {productCount === 1 ? 'product' : 'products'} across{' '}
          {store.categories.length}{' '}
          {store.categories.length === 1 ? 'category' : 'categories'}, delivered
          to your door.
        </p>
        <Link
          to={storeShopUrl(store.slug)}
          className={`mt-1 inline-flex h-12 items-center gap-1.5 rounded-md px-7 text-sm font-bold transition ${skin.cta}`}
        >
          Start Shopping
          <ChevronRightIcon className="h-4 w-4" />
        </Link>
      </div>
    </section>
  )
}

function FeaturedCategories({
  store,
  categories,
  skin,
}: {
  store: PublicStore
  categories: PublicCategory[]
  skin: Skin
}) {
  if (categories.length === 0) return null
  return (
    <section>
      <SectionHeading title="Shop by Category" skin={skin} />
      <ul className="mt-5 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
        {categories.map((category) => (
          <li key={category.id}>
            <Link
              to={storeCategoryUrl(store.slug, category.slug)}
              className={`flex h-full flex-col items-center justify-center rounded-2xl border px-4 py-8 text-center metal-lift ${skin.border} ${skin.surface}`}
            >
              <span
                className={`flex h-14 w-14 items-center justify-center rounded-full ${skin.cta}`}
              >
                <TagIcon className="h-6 w-6" />
              </span>
              <span
                className={`mt-4 font-heading text-lg font-medium ${skin.text}`}
              >
                {category.name}
              </span>
              {category.subcategories.length > 0 && (
                <span className={`mt-1 line-clamp-1 text-xs ${skin.muted}`}>
                  {category.subcategories.map((s) => s.name).join(' · ')}
                </span>
              )}
              <span className="mt-2 text-xs font-bold text-brand">
                {category.productCount}{' '}
                {category.productCount === 1 ? 'product' : 'products'}
              </span>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}

/**
 * One merchandising row — capped at a single row of cards, with "View all"
 * (into the Shop page scoped to THIS section, not the whole catalog) when the
 * section holds more. Renders nothing when empty.
 */
function ProductRow({
  store,
  title,
  section,
  products,
  skin,
}: {
  store: PublicStore
  title: string
  section: PublicSection
  products: PublicProduct[]
  skin: Skin
}) {
  if (products.length === 0) return null
  return (
    <section>
      <SectionHeading
        title={title}
        action={
          products.length > ROW_SIZE
            ? { label: 'View all', to: storeShopUrl(store.slug, { section }) }
            : undefined
        }
        skin={skin}
      />
      <ul className="mt-5 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
        {products.slice(0, ROW_SIZE).map((product) => (
          <ProductCard
            key={product.id}
            store={store}
            product={product}
            skin={skin}
          />
        ))}
      </ul>
    </section>
  )
}
