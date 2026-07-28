import { useState } from 'react'
import { Link } from 'react-router-dom'
import { toApiError } from '../../../shared/auth/http'
import { ConfirmDialog } from '../../../shared/ui/ConfirmDialog'
import { ErrorNote, InfoNote } from '../../../shared/ui/form'
import { storesApi } from '../../features/stores/storesApi'
import type { ShippingMode } from '../../features/stores/storesApi'
import { useManagedStore } from '../../features/stores/useManagedStore'
import { CheckIcon, MapPinIcon, TruckIcon } from '../../layout/icons'

/**
 * Shipping section of Store Management — how customers RECEIVE orders:
 * the seller delivers, customers pick up from a business location, or both
 * (how customers PAY is the Payments section). Because the choice changes
 * the live checkout, picking a different option only *requests* the change —
 * a ConfirmDialog spells out the effect and nothing is saved until it is
 * accepted, so the selection always reflects saved state.
 */

const MODES: {
  mode: ShippingMode
  title: string
  description: string
  confirm: string
}[] = [
  {
    mode: 'DELIVERY',
    title: 'Delivery',
    description: 'You ship or deliver orders to the customer’s address.',
    confirm:
      'Customers will get their orders delivered. Store pickup will no longer be offered at checkout.',
  },
  {
    mode: 'PICKUP',
    title: 'Store Pickup',
    description:
      'Customers collect their orders from your business location — no delivery.',
    confirm:
      'Customers will collect orders from your store. Delivery will no longer be offered at checkout, so make sure your pickup address is set in Footer → Contact Information.',
  },
  {
    mode: 'BOTH',
    title: 'Both',
    description:
      'Customers choose between delivery and store pickup at checkout.',
    confirm:
      'Customers will choose between delivery and store pickup at checkout.',
  },
]

export function StoreShippingPage() {
  const { store, onStoreChange } = useManagedStore()
  const current = store.shipping.mode

  const [pending, setPending] = useState<ShippingMode | null>(null)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const confirmPending = async () => {
    if (!pending) return
    setBusy(true)
    setError(null)
    try {
      onStoreChange(await storesApi.updateShipping(store.id, pending))
      setPending(null)
    } catch (err) {
      setError(toApiError(err).message)
      setPending(null)
    } finally {
      setBusy(false)
    }
  }

  const pendingMode = MODES.find((m) => m.mode === pending)
  const pickupEnabled = current === 'PICKUP' || current === 'BOTH'
  const hasLocation = store.footer.locations.length > 0

  return (
    <div>
      <h2 className="font-body text-xl font-semibold tracking-normal text-fg">
        Shipping
      </h2>
      <p className="mt-1 text-sm text-muted">
        Choose how customers receive their orders. The change applies to your
        checkout immediately, so it asks for confirmation.
      </p>

      <div className="mt-5 max-w-2xl space-y-3">
        <ul className="space-y-2" role="radiogroup" aria-label="Fulfilment mode">
          {MODES.map(({ mode, title, description }) => {
            const selected = mode === current
            const Icon = mode === 'PICKUP' ? MapPinIcon : TruckIcon
            return (
              <li key={mode}>
                <button
                  type="button"
                  role="radio"
                  aria-checked={selected}
                  disabled={busy || pending !== null}
                  onClick={() => {
                    if (!selected) setPending(mode)
                  }}
                  className={`flex w-full items-center gap-4 rounded-lg border p-4 text-left transition disabled:cursor-not-allowed ${
                    selected
                      ? 'border-brand bg-brand/5'
                      : 'border-line hover:bg-surface-alt'
                  }`}
                >
                  <span
                    className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-md ${
                      selected ? 'bg-brand/10 text-brand' : 'bg-surface-alt text-muted'
                    }`}
                  >
                    <Icon className="h-4.5 w-4.5" />
                  </span>
                  <span className="min-w-0 flex-1">
                    <span className="block text-sm font-semibold text-fg">
                      {title}
                    </span>
                    <span className="mt-0.5 block text-sm text-muted">
                      {description}
                    </span>
                  </span>
                  <span
                    className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full border ${
                      selected
                        ? 'border-brand bg-brand text-brand-contrast'
                        : 'border-line'
                    }`}
                  >
                    {selected && <CheckIcon className="h-3 w-3" />}
                  </span>
                </button>
              </li>
            )
          })}
        </ul>

        {pickupEnabled && !hasLocation && (
          <InfoNote>
            Store pickup is enabled, but you haven't added a business location
            yet — add your pickup address in{' '}
            <Link
              to="../footer"
              className="font-semibold text-brand hover:underline"
            >
              Footer → Contact Information
            </Link>{' '}
            so customers know where to collect their orders.
          </InfoNote>
        )}

        {error && <ErrorNote>{error}</ErrorNote>}
      </div>

      <ConfirmDialog
        open={pending !== null}
        title={pendingMode ? `Switch to "${pendingMode.title}"?` : ''}
        description={pendingMode?.confirm ?? ''}
        confirmLabel="Switch"
        tone="neutral"
        busy={busy}
        onConfirm={() => void confirmPending()}
        onCancel={() => setPending(null)}
      />
    </div>
  )
}
