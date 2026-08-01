/**
 * Display formatters for the console. One implementation each, so a rupee
 * amount looks the same on the dashboard, a table and a detail page.
 *
 * Money arrives from the API as a **decimal string** ("14250.00"). It is
 * converted to a number only at the moment of display — never before, and
 * never for arithmetic (totals always come from the server).
 */

const inr = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  maximumFractionDigits: 0,
})

const inrExact = new Intl.NumberFormat('en-IN', {
  style: 'currency',
  currency: 'INR',
  minimumFractionDigits: 2,
})

const counts = new Intl.NumberFormat('en-IN')

/** "₹1,42,500" — headline amounts, tiles and axis labels. */
export function formatMoney(value: string | number | null | undefined): string {
  return inr.format(Number(value ?? 0))
}

/** "₹1,42,500.00" — line items and anything that must reconcile to the paise. */
export function formatMoneyExact(value: string | number | null | undefined): string {
  return inrExact.format(Number(value ?? 0))
}

/** Compact for tight spaces: ₹1.4L / ₹12.3K. */
export function formatMoneyShort(value: string | number | null | undefined): string {
  const amount = Number(value ?? 0)
  if (amount >= 10_000_000) return `₹${(amount / 10_000_000).toFixed(1)}Cr`
  if (amount >= 100_000) return `₹${(amount / 100_000).toFixed(1)}L`
  if (amount >= 1_000) return `₹${(amount / 1_000).toFixed(1)}K`
  return `₹${Math.round(amount)}`
}

export function formatCount(value: number | null | undefined): string {
  return counts.format(value ?? 0)
}

/** "1 Aug 2026" */
export function formatDate(value: string | Date | null | undefined): string {
  if (!value) return '—'
  return new Date(value).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
  })
}

/** "1 Aug 2026, 10:45 am" */
export function formatDateTime(value: string | Date | null | undefined): string {
  if (!value) return '—'
  return new Date(value).toLocaleString('en-IN', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

/** "3 hours ago" — falls back to a date past a week, where "ago" stops helping. */
export function formatRelative(value: string | Date | null | undefined): string {
  if (!value) return '—'
  const then = new Date(value).getTime()
  const seconds = Math.round((Date.now() - then) / 1000)
  if (seconds < 60) return 'Just now'
  const minutes = Math.round(seconds / 60)
  if (minutes < 60) return `${minutes} min ago`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `${hours} hr ago`
  const days = Math.round(hours / 24)
  if (days <= 7) return `${days} day${days === 1 ? '' : 's'} ago`
  return formatDate(value)
}

/** "12 Jul" — chart axis ticks. */
export function formatDayTick(isoDate: string): string {
  return new Date(`${isoDate}T00:00:00`).toLocaleDateString('en-IN', {
    day: 'numeric',
    month: 'short',
  })
}

/** "From ₹899" / "₹899 – ₹1,299" — a product's price range. */
export function formatPriceRange(min: string | null, max: string | null): string {
  if (min === null) return 'Not sellable'
  if (max === null || min === max) return formatMoney(min)
  return `${formatMoney(min)} – ${formatMoney(max)}`
}
