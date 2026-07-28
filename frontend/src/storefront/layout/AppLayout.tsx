import { Suspense, useState } from 'react'
import { Outlet } from 'react-router-dom'
import { ThemeToggle } from '../../shared/theme'
import { AppLogoMark } from '../../shared/ui/AppLogo'
import { AccountMenu } from './AccountMenu'
import { Sidebar } from './Sidebar'
import { CloseIcon, MenuIcon, SearchIcon } from './icons'

const COLLAPSED_KEY = 'storefront.sidebarCollapsed'

/**
 * Authed storefront shell — Facebook/Instagram-style chrome:
 * soft gray canvas, white sidebar rail, sticky white top bar.
 *
 *   - lg+  : fixed sidebar on the left — the top-bar hamburger toggles it
 *            between full width (264px) and an icon-only rail (72px); the
 *            choice is remembered in localStorage.
 *   - < lg : the same hamburger opens the sidebar as a slide-in drawer.
 *
 * Pages render into <Outlet/>; they are lazy-loaded by the router, so the
 * Suspense fallback here covers per-page chunk loads.
 */
export function AppLayout() {
  const [drawerOpen, setDrawerOpen] = useState(false)
  const [collapsed, setCollapsed] = useState(
    () => localStorage.getItem(COLLAPSED_KEY) === '1',
  )

  // One button, two jobs: collapse the rail on desktop, open the drawer
  // on mobile (where the rail is hidden anyway).
  const handleMenuClick = () => {
    if (window.matchMedia('(min-width: 1024px)').matches) {
      setCollapsed((value) => {
        localStorage.setItem(COLLAPSED_KEY, value ? '0' : '1')
        return !value
      })
    } else {
      setDrawerOpen(true)
    }
  }

  return (
    <div className="min-h-screen bg-bg">
      {/* Desktop sidebar (expanded or icon-only rail) */}
      <aside
        className={`fixed inset-y-0 left-0 z-30 hidden border-r border-line transition-[width] duration-200 lg:block ${
          collapsed ? 'w-[72px]' : 'w-64'
        }`}
      >
        <Sidebar collapsed={collapsed} />
      </aside>

      {/* Mobile drawer */}
      {drawerOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-[var(--overlay)]"
            onMouseDown={() => setDrawerOpen(false)}
          />
          <div className="absolute inset-y-0 left-0 w-72 max-w-[85vw] shadow-floating">
            <Sidebar onNavigate={() => setDrawerOpen(false)} />
            <button
              type="button"
              aria-label="Close menu"
              onClick={() => setDrawerOpen(false)}
              className="absolute right-3 top-4 flex h-9 w-9 items-center justify-center rounded-full text-muted transition-colors hover:bg-surface-alt hover:text-fg"
            >
              <CloseIcon className="h-5 w-5" />
            </button>
          </div>
        </div>
      )}

      <div
        className={`transition-[margin] duration-200 ${
          collapsed ? 'lg:ml-[72px]' : 'lg:ml-64'
        }`}
      >
        {/* Top bar: hamburger (drawer on mobile, collapse on lg+), search, avatar */}
        <header className="sticky top-0 z-20 flex h-14 items-center gap-3 border-b border-line bg-surface px-4 sm:px-6">
          <button
            type="button"
            aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
            onClick={handleMenuClick}
            className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-fg transition-colors hover:bg-surface-alt"
          >
            <MenuIcon className="h-5 w-5" />
          </button>
          <span className="flex items-center gap-2 font-heading text-sm font-bold tracking-tight text-fg md:hidden">
            <AppLogoMark className="h-7 w-7" />
            Unie Max
          </span>

          {/* Catalog search lands later — the field is part of the shell UI. */}
          <div className="relative hidden max-w-md flex-1 md:block">
            <SearchIcon className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-muted" />
            <input
              type="search"
              placeholder="Search products…"
              className="h-10 w-full rounded-full border border-line bg-surface-alt pl-10 pr-4 text-sm text-fg outline-none transition-colors placeholder:text-muted focus:border-accent"
            />
          </div>

          <div className="ml-auto flex items-center gap-2">
            <ThemeToggle />
            <AccountMenu />
          </div>
        </header>

        {/* Full-width like the storefront — soft cap for ultrawides only.
            Form-heavy pages constrain themselves (max-w-xl etc.). */}
        <main className="px-3 py-4 sm:px-5 lg:px-8">
          <div className="mx-auto w-full max-w-[1920px]">
            <Suspense
              fallback={
                <div className="flex h-64 items-center justify-center text-sm text-muted">
                  Loading…
                </div>
              }
            >
              <Outlet />
            </Suspense>
          </div>
        </main>
      </div>
    </div>
  )
}
