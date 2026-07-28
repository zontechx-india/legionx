import { useEffect, useRef, useState } from 'react'
import { Link } from 'react-router-dom'
import { ConfirmDialog } from '../../shared/ui/ConfirmDialog'
import { ACCOUNT_MENU_ITEMS } from '../app/navigation'
import { useCustomerSession } from '../app/sessionContext'
import { storesApi } from '../features/stores/storesApi'
import { Avatar } from './Avatar'
import { ChevronDownIcon, LogoutIcon, StoreIcon } from './icons'
import { useSignOutConfirm } from './useSignOutConfirm'

/**
 * Top-bar account dropdown (Flipkart-style "Your Account" menu).
 *
 *   - Opens on hover (desktop) — a short close delay bridges the gap
 *     between trigger and panel — and toggles on click/tap (touch).
 *   - Closes on item click, Escape, or an outside tap.
 *   - Nav items come from `ACCOUNT_MENU_ITEMS`; Logout is a separate
 *     action row that runs the shared confirm-dialog flow.
 */
export function AccountMenu() {
  const { customer } = useCustomerSession()
  const signOutFlow = useSignOutConfirm()
  const [open, setOpen] = useState(false)
  const rootRef = useRef<HTMLDivElement>(null)
  const closeTimer = useRef<number | undefined>(undefined)

  // Store row: "Create Store" when the customer owns none, "My Store"
  // otherwise. Refreshed every time the menu opens so it flips right after
  // a store is created. `null` = not known yet (treated like "My Store" —
  // /stores handles the empty case gracefully anyway).
  const [hasStores, setHasStores] = useState<boolean | null>(null)
  const checkedStores = useRef(false)
  useEffect(() => {
    if (!open && checkedStores.current) return // once on mount, then per open
    checkedStores.current = true
    let cancelled = false
    storesApi
      .list()
      .then((stores) => {
        if (!cancelled) setHasStores(stores.length > 0)
      })
      .catch(() => {})
    return () => {
      cancelled = true
    }
  }, [open])

  const openNow = () => {
    window.clearTimeout(closeTimer.current)
    setOpen(true)
  }
  const closeSoon = () => {
    window.clearTimeout(closeTimer.current)
    closeTimer.current = window.setTimeout(() => setOpen(false), 150)
  }

  useEffect(() => () => window.clearTimeout(closeTimer.current), [])

  // Escape / outside tap close the panel (needed for touch, where there
  // is no mouseleave).
  useEffect(() => {
    if (!open) return
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') setOpen(false)
    }
    const onPointerDown = (e: PointerEvent) => {
      if (!rootRef.current?.contains(e.target as Node)) setOpen(false)
    }
    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('pointerdown', onPointerDown)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('pointerdown', onPointerDown)
    }
  }, [open])

  const name = customer.name ?? 'Customer'
  const contact = customer.email ?? customer.phone ?? ''

  return (
    <div
      ref={rootRef}
      className="relative"
      onMouseEnter={openNow}
      onMouseLeave={closeSoon}
    >
      <button
        type="button"
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={() => setOpen((o) => !o)}
        className="flex items-center gap-2 rounded-full py-1 pl-1 pr-2 transition-colors hover:bg-surface-alt sm:pl-3"
      >
        <span className="hidden text-sm font-medium text-fg sm:block">
          {name}
        </span>
        <Avatar customer={customer} className="h-9 w-9" />
        <ChevronDownIcon
          className={`hidden h-3.5 w-3.5 text-muted transition-transform sm:block ${
            open ? 'rotate-180' : ''
          }`}
        />
      </button>

      {open && (
        // pt-2 keeps the hover unbroken between the trigger and the panel.
        <div className="absolute right-0 top-full z-30 pt-2">
          <div
            role="menu"
            className="w-64 overflow-hidden rounded-lg border border-line bg-surface py-2 shadow-floating"
          >
            <div className="flex items-center gap-3 px-4 pb-3 pt-2">
              <Avatar customer={customer} className="h-10 w-10" />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-fg">
                  {name}
                </p>
                {contact && (
                  <p className="truncate text-xs text-muted">{contact}</p>
                )}
              </div>
            </div>
            <div className="mx-2 border-t border-line" />

            <div className="py-1">
              <Link
                to={hasStores === false ? '/stores/new' : '/stores'}
                role="menuitem"
                onClick={() => setOpen(false)}
                className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-fg transition-colors hover:bg-surface-alt"
              >
                <StoreIcon className="h-[18px] w-[18px] text-muted" />
                {hasStores === false ? 'Create Store' : 'My Store'}
              </Link>
              {ACCOUNT_MENU_ITEMS.map(({ label, to, icon: Icon }) => (
                <Link
                  key={label}
                  to={to}
                  role="menuitem"
                  onClick={() => setOpen(false)}
                  className="flex items-center gap-3 px-4 py-2.5 text-sm font-medium text-fg transition-colors hover:bg-surface-alt"
                >
                  <Icon className="h-[18px] w-[18px] text-muted" />
                  {label}
                </Link>
              ))}
            </div>
            <div className="mx-2 border-t border-line" />

            <button
              type="button"
              role="menuitem"
              onClick={() => {
                setOpen(false)
                signOutFlow.request()
              }}
              className="flex w-full items-center gap-3 px-4 py-2.5 text-sm font-medium text-danger transition-colors hover:bg-danger/10"
            >
              <LogoutIcon className="h-[18px] w-[18px]" />
              Logout
            </button>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={signOutFlow.confirming}
        title="Sign out?"
        description="You'll need to sign in again to access your account."
        confirmLabel="Sign out"
        busy={signOutFlow.busy}
        onConfirm={signOutFlow.confirm}
        onCancel={signOutFlow.cancel}
      />
    </div>
  )
}
