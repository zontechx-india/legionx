import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { cart, useCartQty } from '../cart/cart'
import { cartUrl } from '../stores/storesApi'
import { CartIcon, CheckIcon, MinusIcon, PlusIcon } from '../../layout/icons'
import { stockLevel } from './catalog'
import type { Skin } from './storeTheme'

/** How long the "Added to cart" toast stays up. */
const TOAST_MS = 4000

/**
 * Add-to-cart control shared by product cards (simple products) and the
 * options sheet (a chosen variant). Swaps between an "Add" button and a
 * stock-capped quantity stepper based on the live cart. Identity is
 * store + product + variant (null for a plain product), matching the cart's
 * own line key.
 *
 * The first add pops a short **"Added to cart — View cart"** toast, closing
 * the feedback loop (the stepper swap alone was too quiet); stepper
 * increments stay silent.
 */
export function AddToCartControl({
  storeSlug,
  storeName,
  productId,
  productSlug,
  variantId,
  name,
  variantName,
  imageUrl = null,
  price,
  stock,
  skin,
  compact = false,
  block = false,
}: {
  storeSlug: string
  storeName: string
  productId: string
  /** Product URL slug — snapshotted so the cart can link back + revalidate. */
  productSlug: string
  variantId: string | null
  name: string
  variantName: string | null
  /** Cover-image URL — snapshotted so cart lines can show a thumbnail. */
  imageUrl?: string | null
  /** Decimal string as served by the API (variant price when applicable). */
  price: string
  stock: number
  skin: Skin
  /** Shorter label ("Add") for tight rows. */
  compact?: boolean
  /** Fill the container width (grid cards, sheet). */
  block?: boolean
}) {
  const qty = useCartQty(storeSlug, productId, variantId)
  const [added, setAdded] = useState(false)
  const toastTimer = useRef<number | undefined>(undefined)
  useEffect(() => () => window.clearTimeout(toastTimer.current), [])

  const showToast = () => {
    setAdded(true)
    window.clearTimeout(toastTimer.current)
    toastTimer.current = window.setTimeout(() => setAdded(false), TOAST_MS)
  }

  if (stock <= 0) {
    return (
      <span
        className={`inline-flex h-9 items-center justify-center rounded-md bg-surface-alt px-3 text-xs font-semibold text-muted ${
          block ? 'w-full' : ''
        }`}
      >
        Out of stock
      </span>
    )
  }

  if (qty === 0) {
    return (
      <>
        <button
          type="button"
          onClick={() => {
            cart.add({
              productId,
              productSlug,
              variantId,
              storeSlug,
              storeName,
              name,
              variantName,
              imageUrl,
              price,
              stockQuantity: stock,
            })
            showToast()
          }}
          className={`inline-flex h-9 items-center justify-center gap-1.5 rounded-md px-3.5 text-xs font-bold transition ${skin.cta} ${
            block ? 'w-full' : ''
          }`}
        >
          <CartIcon className="h-4 w-4" />
          {compact ? 'Add' : 'Add to Cart'}
        </button>
        {added && <AddedToast name={name} storeSlug={storeSlug} />}
      </>
    )
  }

  return (
    <>
    {added && <AddedToast name={name} storeSlug={storeSlug} />}
    <span
      className={`inline-flex h-9 items-center justify-between overflow-hidden rounded-md border ${skin.border} ${skin.chip} ${
        block ? 'w-full' : ''
      }`}
    >
      <button
        type="button"
        aria-label="Decrease quantity"
        onClick={() => cart.setQty(storeSlug, productId, variantId, qty - 1)}
        className={`flex h-full w-9 shrink-0 items-center justify-center transition hover:opacity-70 ${skin.text}`}
      >
        <MinusIcon className="h-3.5 w-3.5" />
      </button>
      <span className="min-w-8 text-center text-sm font-bold text-brand">
        {qty}
      </span>
      <button
        type="button"
        aria-label="Increase quantity"
        disabled={qty >= stock}
        onClick={() => cart.setQty(storeSlug, productId, variantId, qty + 1)}
        className={`flex h-full w-9 shrink-0 items-center justify-center transition hover:opacity-70 disabled:text-muted ${skin.text}`}
      >
        <PlusIcon className="h-3.5 w-3.5" />
      </button>
    </span>
    </>
  )
}

/**
 * "Added to cart" confirmation — fixed bottom-center flyout with the path to
 * the cart. App-styled (not store-themed): like the draft banner, it is
 * chrome talking to the visitor, not part of the store's design.
 */
function AddedToast({ name, storeSlug }: { name: string; storeSlug: string }) {
  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-6 left-1/2 z-50 flex w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 items-center gap-3 rounded-lg border border-line bg-surface px-4 py-3 shadow-floating"
    >
      <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-success/15 text-success">
        <CheckIcon className="h-4 w-4" />
      </span>
      <p className="min-w-0 flex-1 truncate text-sm font-semibold text-fg">
        Added to cart
        <span className="block truncate text-xs font-normal text-muted">
          {name}
        </span>
      </p>
      <Link
        // ?from= keeps the cart in this store's theme (see cartUrl).
        to={cartUrl(storeSlug)}
        className="shrink-0 rounded-md border border-line px-3 py-2 text-xs font-bold text-brand transition hover:bg-surface-alt"
      >
        View cart
      </Link>
    </div>
  )
}

/** In Stock / Low Stock / Out of Stock pill driven by total stock. */
export function StockBadge({ stock }: { stock: number }) {
  const level = stockLevel(stock)
  if (level === 'out') {
    return (
      <span className="rounded-full bg-surface-alt px-2 py-0.5 text-[11px] font-semibold text-muted">
        Out of Stock
      </span>
    )
  }
  if (level === 'low') {
    return (
      <span className="rounded-full bg-warning/15 px-2 py-0.5 text-[11px] font-semibold text-warning">
        Low Stock
      </span>
    )
  }
  return (
    <span className="rounded-full bg-success/15 px-2 py-0.5 text-[11px] font-semibold text-success">
      In Stock
    </span>
  )
}
