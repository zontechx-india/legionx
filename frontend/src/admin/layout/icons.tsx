/**
 * Inline stroke icons for the console shell. Inlined rather than imported
 * from an icon package: the shell needs six glyphs, and a dependency for six
 * paths costs more than it saves.
 */

const BASE = 'h-5 w-5'

function Icon({ children, className = BASE }: { children: React.ReactNode; className?: string }) {
  return (
    <svg
      viewBox="0 0 24 24"
      className={className}
      fill="none"
      stroke="currentColor"
      strokeWidth="1.8"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden
    >
      {children}
    </svg>
  )
}

export const MenuIcon = () => (
  <Icon>
    <path d="M4 7h16M4 12h16M4 17h16" />
  </Icon>
)

export const CloseIcon = () => (
  <Icon>
    <path d="m6 6 12 12M18 6 6 18" />
  </Icon>
)

export const BellIcon = () => (
  <Icon>
    <path d="M18 8a6 6 0 0 0-12 0c0 6-2 7-2 7h16s-2-1-2-7" />
    <path d="M13.7 20a2 2 0 0 1-3.4 0" />
  </Icon>
)

export const LogoutIcon = () => (
  <Icon className="h-4 w-4">
    <path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4" />
    <path d="m16 17 5-5-5-5M21 12H9" />
  </Icon>
)

export const BackIcon = () => (
  <Icon className="h-4 w-4">
    <path d="m15 18-6-6 6-6" />
  </Icon>
)

export const ExternalIcon = () => (
  <Icon className="h-3.5 w-3.5">
    <path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6" />
    <path d="M15 3h6v6M10 14 21 3" />
  </Icon>
)
