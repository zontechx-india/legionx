import { useEffect, useRef, useState } from 'react'
import { Link, useSearchParams } from 'react-router-dom'
import { toApiError } from '../../../shared/auth/http'
import type { ListMeta } from '../../../shared/auth/http'
import { ErrorNote } from '../../../shared/ui/form'
import {
  formatPrice,
  sellerOrderApi,
} from '../../features/stores/storesApi'
import type {
  OrderStatus,
  SellerOrderSummary,
} from '../../features/stores/storesApi'
import { useManagedStore } from '../../features/stores/useManagedStore'
import { CartIcon, ChevronRightIcon, SearchIcon } from '../../layout/icons'
import {
  ORDER_STATUS_META,
  OrderStatusChip,
  formatOrderDate,
  paymentLabel,
} from './orderMeta'

/**
 * Orders section of Store Management — every order of the store, newest
 * first, filterable by lifecycle status (tabs, deep-linkable via ?status=
 * so the dashboard tiles can jump straight to a slice) and searchable by
 * order number / customer name / phone. Server-paginated with Load More;
 * a row opens the order's detail page where the status actions live.
 */

const PAGE_SIZE = 20

const STATUS_TABS: { key: OrderStatus | 'ALL'; label: string }[] = [
  { key: 'ALL', label: 'All' },
  ...(Object.keys(ORDER_STATUS_META) as OrderStatus[]).map((key) => ({
    key,
    label: ORDER_STATUS_META[key].label,
  })),
]

function isOrderStatus(value: string | null): value is OrderStatus {
  return value !== null && value in ORDER_STATUS_META
}

export function StoreOrdersPage() {
  const { store } = useManagedStore()
  const [params, setParams] = useSearchParams()
  const statusParam = params.get('status')
  const status: OrderStatus | 'ALL' = isOrderStatus(statusParam)
    ? statusParam
    : 'ALL'

  const [search, setSearch] = useState('')
  const [q, setQ] = useState('') // debounced
  const [orders, setOrders] = useState<SellerOrderSummary[] | null>(null)
  const [meta, setMeta] = useState<ListMeta | null>(null)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError] = useState<string | null>(null)
  // Out-of-order responses (fast typing, tab hopping) must never win.
  const requestSeq = useRef(0)

  useEffect(() => {
    const handle = setTimeout(() => setQ(search.trim()), 350)
    return () => clearTimeout(handle)
  }, [search])

  useEffect(() => {
    const seq = ++requestSeq.current
    setOrders(null)
    setMeta(null)
    setError(null)
    sellerOrderApi
      .list(store.id, {
        status: status === 'ALL' ? undefined : status,
        q: q || undefined,
        page: 1,
        pageSize: PAGE_SIZE,
      })
      .then(({ items, meta }) => {
        if (requestSeq.current !== seq) return
        setOrders(items)
        setMeta(meta)
      })
      .catch((err) => {
        if (requestSeq.current !== seq) return
        setError(toApiError(err).message)
      })
  }, [store.id, status, q])

  const loadMore = async () => {
    if (!meta || meta.page >= meta.totalPages || loadingMore) return
    const seq = requestSeq.current
    setLoadingMore(true)
    try {
      const next = await sellerOrderApi.list(store.id, {
        status: status === 'ALL' ? undefined : status,
        q: q || undefined,
        page: meta.page + 1,
        pageSize: PAGE_SIZE,
      })
      if (requestSeq.current !== seq) return
      setOrders((prev) => [...(prev ?? []), ...next.items])
      setMeta(next.meta)
    } catch (err) {
      if (requestSeq.current === seq) setError(toApiError(err).message)
    } finally {
      if (requestSeq.current === seq) setLoadingMore(false)
    }
  }

  const setStatus = (next: OrderStatus | 'ALL') => {
    setParams(
      (prev) => {
        const copy = new URLSearchParams(prev)
        if (next === 'ALL') copy.delete('status')
        else copy.set('status', next)
        return copy
      },
      { replace: true },
    )
  }

  return (
    <div>
      <h2 className="font-body text-xl font-semibold tracking-normal text-fg">
        Orders
      </h2>
      <p className="mt-1 text-sm text-muted">
        Confirm, pack, ship and complete your orders — open one to update its
        status.
      </p>

      {/* Status tabs + search */}
      <div className="mt-4 flex flex-wrap items-center gap-2">
        <div className="-mx-1 flex flex-1 gap-1.5 overflow-x-auto px-1 py-1">
          {STATUS_TABS.map(({ key, label }) => (
            <button
              key={key}
              type="button"
              onClick={() => setStatus(key)}
              className={`shrink-0 rounded-pill px-3.5 py-1.5 text-xs font-semibold transition ${
                status === key
                  ? 'bg-brand/10 text-brand'
                  : 'border border-line text-muted hover:bg-surface-alt hover:text-fg'
              }`}
            >
              {label}
            </button>
          ))}
        </div>
        <label className="relative block w-full sm:w-64">
          <SearchIcon className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
          <input
            type="search"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Order no. / customer / phone"
            className="h-10 w-full rounded-md border border-line bg-input pl-9 pr-3 text-sm text-fg placeholder:text-muted focus:outline-none focus:ring-2 focus:ring-accent"
          />
        </label>
      </div>

      {error && (
        <div className="mt-4">
          <ErrorNote>{error}</ErrorNote>
        </div>
      )}
      {orders === null && !error && (
        <p className="py-16 text-center text-sm text-muted">Loading orders…</p>
      )}

      {orders !== null && orders.length === 0 && (
        <div className="mt-4 flex flex-col items-center rounded-lg border border-line px-6 py-12 text-center">
          <div className="flex h-12 w-12 items-center justify-center rounded-md bg-surface-alt text-muted">
            <CartIcon className="h-6 w-6" />
          </div>
          <p className="mt-3 text-sm font-semibold text-fg">
            {q || status !== 'ALL' ? 'No matching orders' : 'No orders yet'}
          </p>
          <p className="mt-1 max-w-sm text-sm text-muted">
            {q || status !== 'ALL'
              ? 'Try a different status or search term.'
              : 'Share your store link — orders will show up here the moment customers place them.'}
          </p>
        </div>
      )}

      {orders !== null && orders.length > 0 && (
        <>
          <ul className="mt-4 divide-y divide-line rounded-lg border border-line">
            {orders.map((order) => (
              <li key={order.id}>
                <Link
                  to={order.id}
                  className="flex flex-wrap items-center gap-x-4 gap-y-1 px-4 py-3 transition hover:bg-surface-alt"
                >
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold text-fg">
                      {order.orderNumber}
                    </p>
                    <p className="mt-0.5 text-xs text-muted">
                      {formatOrderDate(order.placedAt)}
                      {order.customerName && <> · {order.customerName}</>} ·{' '}
                      {order.itemCount} item{order.itemCount === 1 ? '' : 's'}
                      {order.fulfilment === 'PICKUP' && <> · Pickup</>}
                    </p>
                  </div>
                  <span className="rounded-pill bg-surface-alt px-2.5 py-0.5 text-[11px] font-semibold text-muted">
                    {paymentLabel(order.paymentMethod, order.paymentStatus)}
                  </span>
                  <OrderStatusChip status={order.status} />
                  <span className="text-sm font-bold text-fg">
                    {formatPrice(order.total)}
                  </span>
                  <ChevronRightIcon className="h-4 w-4 shrink-0 text-muted" />
                </Link>
              </li>
            ))}
          </ul>

          {meta && meta.page < meta.totalPages && (
            <div className="mt-4 flex justify-center">
              <button
                type="button"
                onClick={() => void loadMore()}
                disabled={loadingMore}
                className="rounded-md border border-line px-5 py-2.5 text-sm font-semibold text-fg transition hover:bg-surface-alt disabled:cursor-not-allowed disabled:text-muted"
              >
                {loadingMore
                  ? 'Loading…'
                  : `Load more (${meta.total - orders.length} left)`}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  )
}
