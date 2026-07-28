import { Link, useSearchParams } from 'react-router-dom'
import { groupByStore, useCart } from '../../features/cart/cart'
import type { CartStoreGroup } from '../../features/cart/cart'
import { useCartRevalidation } from '../../features/cart/useCartRevalidation'
import { storeVars } from '../../features/publicStore/storeTheme'
import { useStoreShells } from '../../features/publicStore/useStoreShells'
import { formatPrice, storeHomeUrl } from '../../features/stores/storesApi'
import type { PublicStore } from '../../features/stores/storesApi'
import { usePageTitle } from '../../../shared/usePageTitle'
import { ArrowLeftIcon, CartIcon, ChevronRightIcon } from '../../layout/icons'
import { CartLine } from './CartLine'
import { StoreLogo } from './StoreLogo'

/** How many lines a store group shows before collapsing behind "View all". */
const PREVIEW_LINES = 3

/**
 * Shopping cart (/cart) — public like the store pages themselves (the cart
 * is client-side, so no sign-in is needed). Items are **grouped by store**;
 * a store with many items previews the first few and links to its dedicated
 * page (/cart/{storeSlug}) for the full list.
 *
 * Styling matches the storefront treatment (full-width shell, flat surfaces
 * + borders, Oswald headings) and **continues the theme of the store the
 * visitor opened the cart from** — carried explicitly as `?from={slug}` by
 * every cart link inside a store (see `cartUrl`), regardless of which
 * stores' items are inside. Opened from the marketplace (homepage — plain
 * /cart, no `from`) it renders the neutral palette that follows the
 * visitor's light/dark toggle. The context lives in the URL, never in
 * storage: back/forward, refresh and multiple tabs restore it correctly.
 * Each store group carries its own logo, "Continue shopping" path and
 * per-store "Place Order" button.
 *
 * On mount the cart **revalidates**: prices/stock are re-fetched and synced,
 * so stale add-time snapshots correct themselves before checkout exists.
 */
export function CartPage() {
  usePageTitle('Your Cart')
  const items = useCart()
  const revalidation = useCartRevalidation()
  const groups = groupByStore(items)
  // The store this cart visit came from (?from=slug, set by every cart link
  // inside a store) — its theme wraps the page; absent → neutral.
  const [searchParams] = useSearchParams()
  const fromSlug = searchParams.get('from')
  // Shells for every store in the cart (logos) + the theme source.
  const shells = useStoreShells([
    ...groups.map((g) => g.storeSlug),
    ...(fromSlug ? [fromSlug] : []),
  ])
  const themeShell = fromSlug ? shells[fromSlug] : undefined
  const total = groups.reduce((sum, g) => sum + g.subtotal, 0)
  const count = groups.reduce((sum, g) => sum + g.itemCount, 0)

  return (
    <div
      className="flex min-h-screen flex-col bg-bg text-fg"
      style={themeShell ? storeVars(themeShell.theme) : undefined}
    >
      <CartTopBar />

      <main className="mx-auto w-full max-w-[1920px] flex-1 px-4 py-6 sm:px-6 sm:py-8 lg:px-10">
        <h1 className="font-heading text-2xl font-semibold sm:text-3xl">
          Your Cart
        </h1>
        <p className="mt-1 text-sm text-muted">
          {count === 0
            ? 'Nothing here yet.'
            : `${count} item${count === 1 ? '' : 's'} from ${groups.length} store${groups.length === 1 ? '' : 's'}.`}
        </p>
        <RevalidationNote {...revalidation} />

        {groups.length === 0 ? (
          <EmptyCart />
        ) : (
          <div className="mt-6 items-start gap-6 lg:grid lg:grid-cols-[minmax(0,1fr)_360px]">
            <div className="space-y-5">
              {groups.map((group) => (
                <StoreGroupCard
                  key={group.storeSlug}
                  group={group}
                  shell={shells[group.storeSlug]}
                />
              ))}
            </div>

            {/* Order summary — sticky beside the list on desktop. */}
            <div className="mt-6 rounded-xl border border-line bg-surface p-5 lg:sticky lg:top-20 lg:mt-0">
              <h2 className="font-heading text-lg font-semibold">
                Order Summary
              </h2>
              <div className="mt-4 flex items-center justify-between border-t border-line pt-4">
                <span className="text-sm font-semibold text-muted">
                  Total ({count} item{count === 1 ? '' : 's'})
                </span>
                <span className="text-lg font-bold">{formatPrice(total)}</span>
              </div>
              <p className="mt-2 text-xs text-muted">
                Orders are placed per store — checkout is coming soon.
              </p>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}

/** Sticky chrome matching the storefront shell (app palette, flat). */
function CartTopBar() {
  return (
    <header className="sticky top-0 z-40 border-b border-line bg-bg">
      <div className="mx-auto flex max-w-[1920px] items-center gap-3 px-4 py-3 sm:px-6 lg:px-10">
        <button
          type="button"
          onClick={() => window.history.back()}
          aria-label="Go back"
          className="flex h-10 w-10 items-center justify-center rounded-full text-muted transition hover:bg-surface-alt"
        >
          <ArrowLeftIcon className="h-5 w-5" />
        </button>
        <span className="flex items-center gap-2 font-heading text-lg font-semibold">
          <CartIcon className="h-5 w-5" />
          Cart
        </span>
      </div>
    </header>
  )
}

/** Amber note shown when revalidation corrected any stale line. */
export function RevalidationNote({
  checking,
  changed,
}: {
  checking: boolean
  changed: number
}) {
  if (checking) {
    return (
      <p className="mt-2 text-xs text-muted" aria-live="polite">
        Checking current prices and stock…
      </p>
    )
  }
  if (changed === 0) return null
  return (
    <p className="mt-2 text-xs font-semibold text-warning" aria-live="polite">
      Prices or availability changed since you added{' '}
      {changed === 1 ? 'an item' : 'some items'} — the cart has been updated.
    </p>
  )
}

function StoreGroupCard({
  group,
  shell,
}: {
  group: CartStoreGroup
  shell: PublicStore | null | undefined
}) {
  const preview = group.items.slice(0, PREVIEW_LINES)
  const hiddenCount = group.items.length - preview.length
  const canOrder = group.itemCount > 0

  return (
    <section className="overflow-hidden rounded-xl border border-line bg-surface">
      {/* Store header — logo + the "back to store" path for this group. */}
      <div className="flex flex-wrap items-center gap-3 border-b border-line px-5 py-4">
        <StoreLogo shell={shell} name={group.storeName} />
        <div className="min-w-0 flex-1">
          <Link
            to={storeHomeUrl(group.storeSlug)}
            className="block truncate text-sm font-bold hover:text-brand hover:underline"
          >
            {group.storeName}
          </Link>
          <p className="text-xs text-muted">
            {group.itemCount} item{group.itemCount === 1 ? '' : 's'}
          </p>
        </div>
        <span className="shrink-0 text-sm font-bold">
          {formatPrice(group.subtotal)}
        </span>
        <Link
          to={storeHomeUrl(group.storeSlug)}
          className="hidden shrink-0 items-center gap-1 rounded-md border border-line px-3 py-2 text-xs font-semibold text-muted transition hover:bg-surface-alt hover:text-fg sm:flex"
        >
          Continue shopping
          <ChevronRightIcon className="h-3.5 w-3.5" />
        </Link>
        {/* Orders are placed per store → each group has its own CTA. */}
        {canOrder ? (
          <Link
            to={`/checkout/${group.storeSlug}`}
            className="metal-cta shrink-0 rounded-md px-3.5 py-2 text-xs font-bold text-cta-contrast transition"
          >
            Place Order
          </Link>
        ) : (
          <span
            title="No available items from this store"
            className="shrink-0 cursor-not-allowed rounded-md bg-surface-alt px-3.5 py-2 text-xs font-bold text-muted"
          >
            Place Order
          </span>
        )}
      </div>

      {/* Item preview */}
      <ul className="divide-y divide-line px-5">
        {preview.map((item) => (
          <CartLine
            key={`${item.storeSlug}:${item.productId}:${item.variantId ?? ''}`}
            item={item}
          />
        ))}
      </ul>

      {hiddenCount > 0 && (
        <Link
          to={`/cart/${group.storeSlug}`}
          className="flex items-center justify-center gap-1 border-t border-line py-3 text-sm font-semibold text-muted transition hover:bg-surface-alt hover:text-fg"
        >
          View {hiddenCount} more item{hiddenCount === 1 ? '' : 's'}
          <ChevronRightIcon className="h-4 w-4" />
        </Link>
      )}
    </section>
  )
}

function EmptyCart() {
  return (
    <div className="mt-6 flex flex-col items-center rounded-xl border border-line bg-surface px-6 py-16 text-center">
      <div className="flex h-14 w-14 items-center justify-center rounded-lg bg-surface-alt text-muted">
        <CartIcon className="h-7 w-7" />
      </div>
      <h2 className="mt-4 font-heading text-lg font-semibold">
        Your cart is empty
      </h2>
      <p className="mt-1.5 max-w-sm text-sm text-muted">
        Open a store link and add products — they'll show up here, grouped
        by store.
      </p>
    </div>
  )
}

