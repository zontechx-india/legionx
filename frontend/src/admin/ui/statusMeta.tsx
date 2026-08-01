import { Chip } from './primitives'
import type { ChipTone } from './primitives'
import type {
  BankVerificationStatus,
  OrderStatus,
  PaymentMethod,
  PaymentStatus,
} from '../features/adminApi'

/**
 * One label + tone per domain state, defined once.
 *
 * Every status in the console renders through here, so "Shipped" is the same
 * word and the same color on the dashboard, the orders table and an order
 * page. Tones follow the reserved status meanings — green = settled, amber =
 * waiting on someone, red = failed/cancelled — and each chip always shows its
 * label, so the color is a second signal rather than the only one.
 */

interface Meta {
  label: string
  tone: ChipTone
}

const ORDER_STATUS: Record<OrderStatus, Meta> = {
  PENDING: { label: 'Pending', tone: 'warning' },
  CONFIRMED: { label: 'Confirmed', tone: 'info' },
  PACKED: { label: 'Packed', tone: 'info' },
  SHIPPED: { label: 'Shipped', tone: 'brand' },
  DELIVERED: { label: 'Delivered', tone: 'success' },
  CANCELLED: { label: 'Cancelled', tone: 'danger' },
}

const PAYMENT_STATUS: Record<PaymentStatus, Meta> = {
  PENDING: { label: 'Payment pending', tone: 'warning' },
  PAID: { label: 'Paid', tone: 'success' },
  FAILED: { label: 'Payment failed', tone: 'danger' },
  REFUNDED: { label: 'Refunded', tone: 'neutral' },
}

const BANK_STATUS: Record<BankVerificationStatus, Meta> = {
  PENDING: { label: 'Pending verification', tone: 'warning' },
  VERIFIED: { label: 'Verified', tone: 'success' },
  FAILED: { label: 'Verification failed', tone: 'danger' },
}

export const orderStatusLabel = (status: OrderStatus) => ORDER_STATUS[status].label

export function OrderStatusChip({ status }: { status: OrderStatus }) {
  const meta = ORDER_STATUS[status]
  return <Chip tone={meta.tone}>{meta.label}</Chip>
}

export function PaymentChip({
  status,
  method,
}: {
  status: PaymentStatus
  method: PaymentMethod
}) {
  // A pending COD order isn't "waiting for a payment" — the money arrives at
  // the door — so it reads as the plan it is, not as a problem.
  if (status === 'PENDING' && method === 'COD') return <Chip>Pay on delivery</Chip>
  const meta = PAYMENT_STATUS[status]
  return (
    <Chip tone={meta.tone}>
      {meta.label}
      {status === 'PAID' ? ` · ${method === 'COD' ? 'Cash' : 'Online'}` : ''}
    </Chip>
  )
}

export function BankStatusChip({ status }: { status: BankVerificationStatus }) {
  const meta = BANK_STATUS[status]
  return <Chip tone={meta.tone}>{meta.label}</Chip>
}

/** Published / Draft / Suspended — suspension outranks the publish flag. */
export function StoreStatusChip({
  isPublished,
  suspendedAt,
}: {
  isPublished: boolean
  suspendedAt: string | null
}) {
  if (suspendedAt) return <Chip tone="danger">Suspended</Chip>
  return isPublished ? <Chip tone="success">Published</Chip> : <Chip>Draft</Chip>
}

export function ActiveChip({ isActive }: { isActive: boolean }) {
  return isActive ? <Chip tone="success">Visible</Chip> : <Chip tone="danger">Hidden</Chip>
}
