import type { OrderStatus } from '../../features/stores/storesApi'

/**
 * Presentation of the order lifecycle, shared by the seller's Dashboard,
 * Orders list and Order detail so a status always looks the same everywhere.
 */

export const ORDER_STATUS_META: Record<
  OrderStatus,
  { label: string; chip: string }
> = {
  PENDING: { label: 'Pending', chip: 'bg-warning/10 text-warning' },
  CONFIRMED: { label: 'Confirmed', chip: 'bg-accent/10 text-accent' },
  PACKED: { label: 'Packed', chip: 'bg-accent/10 text-accent' },
  SHIPPED: { label: 'Shipped', chip: 'bg-brand/10 text-brand' },
  DELIVERED: { label: 'Delivered', chip: 'bg-success/10 text-success' },
  CANCELLED: { label: 'Cancelled', chip: 'bg-surface-alt text-muted' },
}

export function OrderStatusChip({ status }: { status: OrderStatus }) {
  const meta = ORDER_STATUS_META[status] ?? ORDER_STATUS_META.PENDING
  return (
    <span
      className={`rounded-pill px-2.5 py-0.5 text-[11px] font-semibold ${meta.chip}`}
    >
      {meta.label}
    </span>
  )
}

/** One line summarizing how (and whether) the order is paid. */
export function paymentLabel(
  method: 'ONLINE' | 'COD',
  status: 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED',
): string {
  if (status === 'REFUNDED') return 'Refunded'
  if (status === 'FAILED') return 'Payment failed'
  if (method === 'ONLINE') {
    return status === 'PAID' ? 'Paid online' : 'Payment pending'
  }
  return status === 'PAID' ? 'Paid · COD' : 'Cash on Delivery'
}

export function formatOrderDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

export function formatOrderDateTime(iso: string): string {
  return new Date(iso).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}
