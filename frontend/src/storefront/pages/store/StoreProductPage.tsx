import { useEffect, useState } from 'react'
import { Link, useParams } from 'react-router-dom'
import {
  formatPrice,
  publicStoreApi,
  storeCategoryUrl,
  storeProductUrl,
  type PublicProductDetail,
  type PublicStoreVariant,
} from '../../features/stores/storesApi'
import {
  StorePageShell,
  usePublicStore,
} from '../../features/publicStore/PublicStoreLayout'
import { usePageTitle } from '../../../shared/usePageTitle'
import { ProductGrid } from '../../features/publicStore/ProductCard'
import { ShareButton } from '../../features/publicStore/ShareButton'
import {
  AddToCartControl,
  StockBadge,
} from '../../features/publicStore/CartControls'
import {
  Breadcrumb,
  SectionHeading,
  type Crumb,
} from '../../features/publicStore/ListingControls'
import { BoxIcon } from '../../layout/icons'

/**
 * `/store/{storeSlug}/product/{productSlug}` — full product detail.
 *
 * This is the **only** place variants are rendered. Listings deliberately show
 * just a count ("4 Variants Available"), because a store with large variant
 * matrices would otherwise blow up the grid; the customer picks Colour /
 * Storage / Size / RAM here, and price, stock and the cart line all follow the
 * selected option.
 */
export function StoreProductPage() {
  const { store, skin } = usePublicStore()
  const { productSlug = '' } = useParams()
  const [product, setProduct] = useState<
    PublicProductDetail | null | undefined
  >(undefined)
  usePageTitle(product?.name, store.name)

  useEffect(() => {
    let cancelled = false
    setProduct(undefined)
    publicStoreApi
      .getProduct(store.slug, productSlug)
      .then((found) => {
        if (!cancelled) setProduct(found)
      })
      .catch(() => {
        if (!cancelled) setProduct(null)
      })
    return () => {
      cancelled = true
    }
  }, [store.slug, productSlug])

  if (product === undefined) {
    return (
      <StorePageShell>
        <p className={`py-16 text-center text-sm ${skin.muted}`}>Loading…</p>
      </StorePageShell>
    )
  }

  if (product === null) {
    return (
      <StorePageShell>
        <div className="py-16 text-center">
          <h1 className={`font-heading text-lg font-bold ${skin.text}`}>
            Product not found
          </h1>
          <p className={`mt-2 text-sm ${skin.muted}`}>
            It may be out of stock or no longer available.
          </p>
          <Link
            to={`/store/${store.slug}`}
            className={`mt-5 inline-flex h-10 items-center rounded-md px-5 text-sm font-bold ${skin.cta}`}
          >
            Back to store
          </Link>
        </div>
      </StorePageShell>
    )
  }

  return (
    <ProductDetail key={product.id} product={product} />
  )
}

function ProductDetail({ product }: { product: PublicProductDetail }) {
  const { store, skin } = usePublicStore()
  // A simple product has no options; its price/stock come from the product.
  const [variant, setVariant] = useState<PublicStoreVariant | null>(
    () => firstSellable(product.variants),
  )

  const price = variant ? variant.price : (product.price ?? '0')
  const stock = variant ? variant.stockQuantity : product.stockQuantity

  const trail: Crumb[] = [
    ...(product.category.parent
      ? [
          {
            label: product.category.parent.name,
            to: storeCategoryUrl(store.slug, product.category.parent.slug),
          },
        ]
      : []),
    {
      label: product.category.name,
      to: storeCategoryUrl(store.slug, product.category.slug),
    },
    { label: product.name },
  ]

  return (
    <StorePageShell>
      <Breadcrumb
        storeSlug={store.slug}
        storeName={store.name}
        trail={trail}
        skin={skin}
      />

      <div className="grid gap-6 lg:grid-cols-2 lg:gap-10">
        <MediaGallery product={product} />


        <div>
          <div className="flex items-start justify-between gap-3">
            <h1
              className={`font-heading text-3xl font-semibold leading-tight sm:text-4xl ${skin.text}`}
            >
              {product.name}
            </h1>
            {/* Share this product — permanent public URL, opens directly. */}
            <ShareButton
              title={`${product.name} · ${store.name}`}
              url={`${window.location.origin}${storeProductUrl(store.slug, product.slug)}`}
              skin={skin}
              ariaLabel="Share this product"
            />
          </div>

          <div className="mt-3 flex flex-wrap items-center gap-3">
            <span className="text-2xl font-bold text-brand">
              {formatPrice(price)}
            </span>
            <StockBadge stock={stock} />
          </div>

          {product.description && (
            <p className={`mt-4 whitespace-pre-line text-sm ${skin.muted}`}>
              {product.description}
            </p>
          )}

          {/* Variant picker — the reason this page exists. */}
          {product.variants.length > 0 && (
            <div className="mt-6">
              <p
                className={`text-xs font-bold uppercase tracking-wide ${skin.muted}`}
              >
                Choose an option
              </p>
              <div className="mt-2.5 flex flex-wrap gap-2">
                {product.variants.map((option) => {
                  const selected = option.id === variant?.id
                  const out = option.stockQuantity <= 0
                  return (
                    <button
                      key={option.id}
                      type="button"
                      onClick={() => setVariant(option)}
                      aria-pressed={selected}
                      className={`rounded-md border px-3.5 py-2 text-sm font-semibold transition-colors ${
                        selected
                          ? `border-brand ${skin.cta}`
                          : `${skin.border} ${skin.chip} ${skin.text}`
                      } ${out && !selected ? 'opacity-40' : ''}`}
                    >
                      {option.name}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          <div className="mt-6 max-w-xs">
            <AddToCartControl
              storeSlug={store.slug}
              storeName={store.name}
              productId={product.id}
              productSlug={product.slug}
              variantId={variant?.id ?? null}
              name={product.name}
              variantName={variant?.name ?? null}
              imageUrl={
                product.media.find((m) => m.type === 'IMAGE')?.url ?? null
              }
              price={price}
              stock={stock}
              skin={skin}
              block
            />
          </div>

          <dl className={`mt-8 border-t pt-4 text-sm ${skin.border}`}>
            <div className="flex justify-between py-1.5">
              <dt className={skin.muted}>Category</dt>
              <dd>
                <Link
                  to={storeCategoryUrl(store.slug, product.category.slug)}
                  className="font-semibold text-brand hover:underline"
                >
                  {product.category.name}
                </Link>
              </dd>
            </div>
            {product.variants.length > 0 && (
              <div className="flex justify-between py-1.5">
                <dt className={skin.muted}>Options</dt>
                <dd className={`font-semibold ${skin.text}`}>
                  {product.variants.length}
                </dd>
              </div>
            )}
          </dl>
        </div>
      </div>

      {product.related.length > 0 && (
        <section className="mt-12">
          <SectionHeading title="Related Products" skin={skin} />
          <div className="mt-4">
            <ProductGrid store={store} products={product.related} skin={skin} />
          </div>
        </section>
      )}
    </StorePageShell>
  )
}

/** Prefer the first in-stock option; fall back to the first (or none). */
function firstSellable(
  variants: PublicStoreVariant[],
): PublicStoreVariant | null {
  if (variants.length === 0) return null
  return variants.find((v) => v.stockQuantity > 0) ?? variants[0]!
}

/**
 * Gallery — main viewer plus a thumbnail strip when there is more than one
 * item. Images and the optional video share the strip (the video thumb shows
 * a play glyph); the empty state keeps the icon frame so cardless products
 * still render a stable layout. Thumbs are lazy-loaded.
 */
function MediaGallery({ product }: { product: PublicProductDetail }) {
  const { skin } = usePublicStore()
  const media = product.media
  const [activeId, setActiveId] = useState<string | null>(
    media[0]?.id ?? null,
  )
  const active = media.find((m) => m.id === activeId) ?? media[0] ?? null

  if (!active?.url) {
    return (
      <div
        className={`flex aspect-square items-center justify-center rounded-xl border ${skin.border} ${skin.well}`}
      >
        <BoxIcon className="h-20 w-20" />
      </div>
    )
  }

  return (
    <div>
      <div
        className={`flex aspect-square items-center justify-center overflow-hidden rounded-xl border ${skin.border} ${skin.well}`}
      >
        {active.type === 'VIDEO' ? (
          <video
            key={active.id}
            src={active.url}
            controls
            playsInline
            preload="metadata"
            className="h-full w-full bg-black object-contain"
          />
        ) : (
          <img
            src={active.url}
            alt={active.altText ?? product.name}
            decoding="async"
            className="h-full w-full object-cover"
          />
        )}
      </div>

      {media.length > 1 && (
        <ul className="mt-3 flex gap-2 overflow-x-auto pb-1">
          {media.map((item) => (
            <li key={item.id} className="shrink-0">
              <button
                type="button"
                onClick={() => setActiveId(item.id)}
                aria-label={
                  item.type === 'VIDEO'
                    ? 'Play product video'
                    : (item.altText ?? 'Show image')
                }
                aria-pressed={item.id === active.id}
                className={`relative block h-16 w-16 overflow-hidden rounded-md border transition ${
                  item.id === active.id
                    ? 'border-brand'
                    : `${skin.border} opacity-70 hover:opacity-100`
                }`}
              >
                {item.type === 'VIDEO' ? (
                  <span
                    className={`flex h-full w-full items-center justify-center ${skin.well}`}
                  >
                    {/* Play glyph — the strip never autoloads video frames. */}
                    <svg viewBox="0 0 24 24" className="h-6 w-6 fill-current">
                      <path d="M8 5.5v13l11-6.5-11-6.5z" />
                    </svg>
                  </span>
                ) : (
                  item.url && (
                    <img
                      src={item.url}
                      alt=""
                      loading="lazy"
                      decoding="async"
                      className="h-full w-full object-cover"
                    />
                  )
                )}
              </button>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}
