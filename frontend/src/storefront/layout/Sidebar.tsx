import { NavLink } from 'react-router-dom'
import { AppLogoMark } from '../../shared/ui/AppLogo'
import { NAV_ITEMS } from '../app/navigation'
import { ProfileSection } from './ProfileSection'

/**
 * Storefront sidebar: brand on top, config-driven nav in the middle
 * (scrolls if it grows), profile + logout pinned to the bottom.
 *
 * Purely presentational — the responsive behavior (fixed rail vs. mobile
 * drawer) is decided by `AppLayout`. `collapsed` renders the icon-only
 * rail (labels hidden, tooltips via `title`); the drawer always passes
 * `collapsed={false}`.
 */
export function Sidebar({
  collapsed = false,
  onNavigate,
}: {
  collapsed?: boolean
  onNavigate?: () => void
}) {
  return (
    <div className="flex h-full flex-col bg-surface">
      <div
        className={`flex items-center gap-2.5 pb-4 pt-5 ${
          collapsed ? 'justify-center px-2' : 'px-5'
        }`}
      >
        <AppLogoMark className="h-9 w-9" />
        {!collapsed && (
          <span className="truncate font-heading text-base font-bold tracking-tight text-fg">
            Unie Max
          </span>
        )}
      </div>

      <nav
        className={`flex-1 space-y-0.5 overflow-y-auto py-2 ${
          collapsed ? 'px-2' : 'px-3'
        }`}
      >
        {NAV_ITEMS.map(({ label, to, icon: Icon, end }) => (
          <NavLink
            key={to}
            to={to}
            end={end}
            onClick={onNavigate}
            title={collapsed ? label : undefined}
            className={({ isActive }) =>
              `group flex items-center gap-3 rounded-md text-[15px] transition-colors ${
                collapsed ? 'justify-center px-0 py-3' : 'px-3 py-3'
              } ${
                isActive
                  ? 'bg-surface-alt font-semibold text-fg'
                  : 'font-medium text-muted hover:bg-surface-alt hover:text-fg'
              }`
            }
          >
            {({ isActive }) => (
              <>
                <Icon
                  className={`h-[22px] w-[22px] shrink-0 transition-colors ${
                    isActive
                      ? 'text-brand'
                      : 'text-muted group-hover:text-fg'
                  }`}
                />
                {!collapsed && label}
              </>
            )}
          </NavLink>
        ))}
      </nav>

      <ProfileSection collapsed={collapsed} />
    </div>
  )
}
