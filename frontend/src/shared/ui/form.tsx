import type {
  ButtonHTMLAttributes,
  InputHTMLAttributes,
  ReactNode,
} from 'react'

/**
 * Shared, brand-neutral auth primitives.
 *
 * Layout (Facebook/Instagram style):
 *   - Laptop / desktop (lg+): split screen — marketing hero on the left,
 *     login panel on the right.
 *   - Tablet / mobile (< lg): the hero is hidden and the login panel is
 *     centered full-width.
 */

/** Full-page split layout. `hero` shows only on lg+; `children` is the panel. */
export function AuthLayout({
  hero,
  children,
  footer,
}: {
  hero: ReactNode
  children: ReactNode
  footer?: ReactNode
}) {
  return (
    <div className="min-h-screen w-full overflow-x-hidden bg-white lg:grid lg:grid-cols-[1.15fr_1fr]">
      <aside className="relative hidden overflow-hidden lg:flex lg:flex-col lg:justify-between lg:p-12">
        {hero}
      </aside>

      <main className="flex min-h-screen flex-col items-center justify-center px-4 py-10 sm:px-6">
        <div className="mx-auto w-full max-w-sm">
          {children}
          {footer && <div className="mt-8 text-center">{footer}</div>}
        </div>
      </main>
    </div>
  )
}

/** Colored hero pane content. `accentClass` sets the gradient background. */
export function Hero({
  accentClass,
  logo,
  children,
}: {
  accentClass: string
  logo: ReactNode
  children: ReactNode
}) {
  return (
    <div
      className={`flex h-full w-full flex-col justify-between rounded-3xl p-10 text-white ${accentClass}`}
    >
      <div className="flex items-center gap-2 text-lg font-semibold">{logo}</div>
      {children}
    </div>
  )
}

export function AuthCard({ children }: { children: ReactNode }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white px-8 py-9 shadow-sm">
      {children}
    </div>
  )
}

export function Brand({
  badge,
  badgeClass,
  title,
  subtitle,
}: {
  badge: ReactNode
  badgeClass: string
  title: string
  subtitle: string
}) {
  return (
    <div className="mb-6 text-center">
      <div
        className={`mx-auto mb-3 flex h-12 w-12 items-center justify-center rounded-full text-lg text-white ${badgeClass}`}
      >
        {badge}
      </div>
      <h1 className="text-xl font-semibold tracking-tight text-gray-900">
        {title}
      </h1>
      <p className="mt-1 text-sm text-gray-500">{subtitle}</p>
    </div>
  )
}

interface TextFieldProps extends InputHTMLAttributes<HTMLInputElement> {
  label: string
}

export function TextField({ label, ...props }: TextFieldProps) {
  return (
    <label className="block">
      <span className="mb-1.5 block text-sm font-medium text-gray-700">
        {label}
      </span>
      <input
        className="w-full rounded-md border border-gray-300 bg-gray-50 px-3 py-2.5 text-sm text-gray-900 outline-none transition placeholder:text-gray-400 focus:border-blue-500 focus:bg-white focus:ring-2 focus:ring-blue-100"
        {...props}
      />
    </label>
  )
}

export function PrimaryButton({
  children,
  className = '',
  ...props
}: ButtonHTMLAttributes<HTMLButtonElement>) {
  return (
    <button
      className={`w-full rounded-md bg-blue-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-blue-700 focus:ring-2 focus:ring-blue-200 disabled:cursor-not-allowed disabled:opacity-50 ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}
