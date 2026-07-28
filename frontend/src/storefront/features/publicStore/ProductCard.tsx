import { Link } from 'react-router-dom'
import {
  formatPrice,
  storeProductUrl,
  type PublicProduct,
  type PublicStore,
} from '../stores/storesApi'
import { BoxIcon } from '../../layout/icons'
import { StockBadge } from './CartControls'
import type { Skin } from './storeTheme'

/**
 * Product listing card — used by every grid on the storefront (category page,
 * search results, homepage sections, related products).
 *
 * The **whole card is one link** to the product page: there is no Add to Cart
 * here. Buying happens on the product page, where the customer can see the
 * full detail and pick an option — which also keeps every card the same shape
 * whether or not the product has variants, so a grid of thousands stays
 * uniform and scannable.
 *
 * Hover lifts the card and paints an evenly-spread halo (`metal-lift`).
 */
export function ProductCard({
  store,
  product,
  skin,
}: {
  store: PublicStore
  product: PublicProduct
  skin: Skin
}) {
  return (
    <li className={`group ${skin.border}`}>
      <Link
        to={storeProductUrl(store.slug, product.slug)}
        className={`flex h-full flex-col overflow-hidden rounded-xl border metal-lift ${skin.border} ${skin.surface}`}
      >
        {/* Image slot — inset rather than edge-to-edge so it reads as a
            product frame, not a grey slab. Lazy-loaded cover image (first by
            display order); the icon remains the no-photo state. */}
        <div className="p-3 pb-0">
          <div
            className={`flex aspect-square items-center justify-center overflow-hidden rounded-lg ${skin.well}`}
          >
            {product.image?.url ? (
              <img
                src={product.image.url}
                alt={product.image.altText ?? product.name}
                loading="lazy"
                decoding="async"
                className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
              />
            ) : (
              <BoxIcon className="h-12 w-12 transition-transform duration-300 group-hover:scale-110" />
            )}
          </div>
        </div>

        <div className="flex flex-1 flex-col gap-1.5 p-4">
          <span
            className={`text-[11px] font-semibold uppercase tracking-wide ${skin.muted}`}
          >
            {product.category.name}
          </span>

          {/* Prototype card title: condensed display face at lg, medium
              weight — bold Oswald at this size reads cramped. */}
          <h3
            className={`line-clamp-2 font-heading text-lg font-medium leading-tight transition-colors group-hover:text-brand ${skin.text}`}
          >
            {product.name}
          </h3>

          <PriceLabel product={product} />

          <div className="mt-auto flex flex-wrap items-center gap-2 pt-2">
            <StockBadge stock={product.stockQuantity} />
            <VariantCount count={product.variantCount} />
          </div>
        </div>
      </Link>
    </li>
  )
}

/** "From ₹X" when options exist, a plain price otherwise. */
export function PriceLabel({ product }: { product: PublicProduct }) {
  if (product.price === null) return null
  return (
    <span className="font-heading text-lg font-bold text-brand sm:text-xl">
      {product.variantCount > 0 && (
        <span className="text-xs font-semibold text-muted">From </span>
      )}
      {formatPrice(product.price)}
    </span>
  )
}

/** Muted "N Variants Available" line — never the options themselves. */
export function VariantCount({ count }: { count: number }) {
  if (count === 0) return null
  return (
    <span className="text-[11px] font-semibold text-muted">
      {count} Variant{count === 1 ? '' : 's'} Available
    </span>
  )
}

/**
 * Responsive product grid. 2 columns on mobile per the spec, up to 5 on very
 * wide screens — the layout is full-bleed, so the extra tier keeps cards
 * generous without letting them balloon.
 */
export function ProductGrid({
  store,
  products,
  skin,
}: {
  store: PublicStore
  products: PublicProduct[]
  skin: Skin
}) {
  return (
    <ul className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4 2xl:grid-cols-5">
      {products.map((product) => (
        <ProductCard
          key={product.id}
          store={store}
          product={product}
          skin={skin}
        />
      ))}
    </ul>
  )
}
