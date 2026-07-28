import { useLocation } from 'react-router-dom'
import { ACCOUNT_MENU_ITEMS, NAV_ITEMS } from '../app/navigation'

/**
 * Shared placeholder for routes that exist in the shell but aren't built
 * yet (Orders, Wishlist, Settings, Profile…). It titles itself from the
 * nav/account-menu config, so no per-page boilerplate is needed until the
 * real page lands.
 */
export function ComingSoonPage() {
  const { pathname } = useLocation()
  const item = [...NAV_ITEMS, ...ACCOUNT_MENU_ITEMS].find(
    (nav) => nav.to === pathname,
  )
  const title = item?.label ?? 'Coming soon'
  const Icon = item?.icon

  return (
    <div className="space-y-6">
      <header>
        <h1 className="font-heading text-2xl font-bold tracking-tight text-fg">
          {title}
        </h1>
      </header>

      <div className="flex flex-col items-center rounded-lg border border-line bg-surface px-6 py-16 text-center shadow-floating">
        {Icon && (
          <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-md bg-brand/10 text-brand">
            <Icon className="h-6 w-6" />
          </div>
        )}
        <p className="text-sm font-medium text-fg">
          {title} is coming soon
        </p>
        <p className="mt-1 max-w-sm text-sm text-muted">
          This section is part of the storefront roadmap and will be available
          in an upcoming release.
        </p>
      </div>
    </div>
  )
}
