/**
 * UnieMax brand mark — the single master logo `public/app_logo.png`
 * (UM monogram), also used as the tab icon in both HTML entries.
 *
 * `AppLogoMark` is the square UM monogram for headers, sidebars and brand
 * badges; `AppLogoFull` is the larger variant for splash screens and
 * heroes. Both scale via `className`.
 */

export function AppLogoMark({ className = 'h-9 w-9' }: { className?: string }) {
  return (
    <img
      src="/app_logo.png"
      alt="UnieMax"
      draggable={false}
      className={`shrink-0 select-none object-contain ${className}`}
    />
  )
}

export function AppLogoFull({ className = 'w-40' }: { className?: string }) {
  return (
    <img
      src="/app_logo.png"
      alt="UnieMax"
      draggable={false}
      className={`select-none object-contain ${className}`}
    />
  )
}
