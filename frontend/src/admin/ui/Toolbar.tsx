import { useEffect, useState } from 'react'
import type { ReactNode } from 'react'

/**
 * Filter row above a table: search on the left, dropdowns on the right, all
 * on one line — the layout the dataviz/console convention expects, so an
 * admin never hunts for where filtering happens.
 */
export function Toolbar({ children }: { children: ReactNode }) {
  return (
    <div className="flex flex-wrap items-center gap-2 border-b border-line px-4 py-3">{children}</div>
  )
}

/**
 * Debounced search box. It owns the keystrokes and reports the settled value,
 * so a page never fires a request per character. `value` re-syncs it when the
 * URL changes underneath (back button, a deep link).
 */
export function SearchInput({
  value,
  onChange,
  placeholder = 'Search…',
  delay = 300,
}: {
  value: string
  onChange: (value: string) => void
  placeholder?: string
  delay?: number
}) {
  const [draft, setDraft] = useState(value)

  useEffect(() => setDraft(value), [value])

  useEffect(() => {
    if (draft === value) return
    const timer = setTimeout(() => onChange(draft), delay)
    return () => clearTimeout(timer)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- onChange identity is not stable across renders
  }, [draft, delay])

  return (
    <div className="relative min-w-0 flex-1 sm:max-w-xs">
      <svg
        viewBox="0 0 24 24"
        className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted"
        fill="none"
        stroke="currentColor"
        strokeWidth="2"
        aria-hidden
      >
        <circle cx="11" cy="11" r="7" />
        <path d="m20 20-3.5-3.5" strokeLinecap="round" />
      </svg>
      <input
        type="search"
        value={draft}
        onChange={(event) => setDraft(event.target.value)}
        placeholder={placeholder}
        className="w-full rounded-md border border-line bg-input py-2 pl-9 pr-3 text-sm text-fg placeholder:text-muted focus:border-brand focus:outline-none"
      />
    </div>
  )
}

/** Compact filter dropdown — label lives inside so the row stays one line. */
export function FilterSelect({
  label,
  value,
  onChange,
  options,
}: {
  label: string
  value: string
  onChange: (value: string) => void
  options: { value: string; label: string }[]
}) {
  return (
    <label className="flex items-center gap-1.5 text-sm">
      <span className="sr-only sm:not-sr-only sm:text-muted">{label}</span>
      <select
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="rounded-md border border-line bg-input px-2.5 py-2 text-sm text-fg focus:border-brand focus:outline-none"
      >
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </label>
  )
}

/**
 * Scrollable status tabs. Horizontal scroll here is deliberate — tabs must
 * stay on one line to read as a single axis of choice, unlike the wrapping
 * pill rows elsewhere in the product.
 */
export function Tabs<T extends string>({
  value,
  onChange,
  options,
}: {
  value: T
  onChange: (value: T) => void
  options: { value: T; label: string; count?: number }[]
}) {
  return (
    <div className="-mb-px flex gap-1 overflow-x-auto border-b border-line px-2">
      {options.map((option) => {
        const active = option.value === value
        return (
          <button
            key={option.value}
            type="button"
            onClick={() => onChange(option.value)}
            className={`whitespace-nowrap border-b-2 px-3 py-2.5 text-sm font-medium transition-colors ${
              active
                ? 'border-brand text-fg'
                : 'border-transparent text-muted hover:text-fg'
            }`}
          >
            {option.label}
            {option.count !== undefined ? (
              <span className="ml-1.5 text-xs text-muted">{option.count}</span>
            ) : null}
          </button>
        )
      })}
    </div>
  )
}
