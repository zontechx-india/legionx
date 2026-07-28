import { useEffect, useState } from 'react'
import { CloseIcon } from '../../layout/icons'
import { activeFilterCount, NO_FILTERS, type CatalogFilters } from './catalog'
import type { Skin } from './storeTheme'

/**
 * Filter panel — a right slide-over on desktop, a bottom sheet on mobile.
 * Live filters (Availability, Price Range) are derived from the catalog we
 * already have; Brand / Rating / Discount are future filters, shown disabled so
 * the layout is ready for them without a redesign. Edits are held in a draft
 * and committed on Apply (or Clear), so partial price typing never thrashes the
 * grid.
 */
export function FilterPanel({
  open,
  onClose,
  filters,
  onApply,
  skin,
}: {
  open: boolean
  onClose: () => void
  filters: CatalogFilters
  onApply: (filters: CatalogFilters) => void
  skin: Skin
}) {
  const [draft, setDraft] = useState<CatalogFilters>(filters)

  // Re-seed the draft each time the panel opens.
  useEffect(() => {
    if (open) setDraft(filters)
  }, [open, filters])

  useEffect(() => {
    if (!open) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onClose])

  if (!open) return null

  const apply = () => {
    onApply(draft)
    onClose()
  }
  const clear = () => {
    setDraft(NO_FILTERS)
    onApply(NO_FILTERS)
    onClose()
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-end sm:items-stretch"
      role="dialog"
      aria-modal="true"
      aria-label="Filters"
    >
      <button
        type="button"
        aria-label="Close filters"
        onClick={onClose}
        className="absolute inset-0 bg-[var(--overlay)]"
      />
      <div
        className={`relative z-10 flex max-h-[85vh] w-full flex-col overflow-hidden rounded-t-2xl border ${skin.border} ${skin.surface} shadow-floating sm:h-full sm:max-h-none sm:w-80 sm:rounded-none sm:border-y-0 sm:border-r-0`}
      >
        {/* Header */}
        <div
          className={`flex items-center justify-between border-b ${skin.border} p-4`}
        >
          <h2 className={`font-heading text-base font-bold ${skin.text}`}>
            Filters
          </h2>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close"
            className={`flex h-8 w-8 items-center justify-center rounded-full transition hover:bg-surface-alt ${skin.muted}`}
          >
            <CloseIcon className="h-4 w-4" />
          </button>
        </div>

        {/* Body */}
        <div className="min-h-0 flex-1 space-y-6 overflow-y-auto p-4">
          {/* Availability */}
          <section>
            <h3 className={`text-xs font-bold uppercase tracking-wide ${skin.muted}`}>
              Availability
            </h3>
            <label className="mt-2.5 flex cursor-pointer items-center gap-2.5">
              <input
                type="checkbox"
                checked={draft.inStockOnly}
                onChange={(e) =>
                  setDraft((d) => ({ ...d, inStockOnly: e.target.checked }))
                }
                className="h-4 w-4 accent-[var(--brand)]"
              />
              <span className={`text-sm ${skin.text}`}>In stock only</span>
            </label>
          </section>

          {/* Price range */}
          <section>
            <h3 className={`text-xs font-bold uppercase tracking-wide ${skin.muted}`}>
              Price Range
            </h3>
            <div className="mt-2.5 flex items-center gap-2">
              <PriceInput
                label="Min"
                value={draft.minPrice}
                placeholder="Min"
                onChange={(v) => setDraft((d) => ({ ...d, minPrice: v }))}
                skin={skin}
              />
              <span className={skin.muted}>–</span>
              <PriceInput
                label="Max"
                value={draft.maxPrice}
                placeholder="Max"
                onChange={(v) => setDraft((d) => ({ ...d, maxPrice: v }))}
                skin={skin}
              />
            </div>
          </section>

          {/* Future filters — wired-ready, disabled for now */}
          <section>
            <h3 className={`text-xs font-bold uppercase tracking-wide ${skin.muted}`}>
              More filters
            </h3>
            <ul className={`mt-2.5 space-y-2 text-sm ${skin.muted}`}>
              {['Brand', 'Rating', 'Discount'].map((label) => (
                <li key={label} className="flex items-center justify-between">
                  <span>{label}</span>
                  <span className="rounded-full bg-surface-alt px-2 py-0.5 text-[10px] font-semibold uppercase tracking-wide">
                    Soon
                  </span>
                </li>
              ))}
            </ul>
          </section>
        </div>

        {/* Footer actions */}
        <div className={`flex items-center gap-3 border-t ${skin.border} p-4`}>
          <button
            type="button"
            onClick={clear}
            disabled={activeFilterCount(draft) === 0}
            className={`h-10 flex-1 rounded-md border text-sm font-semibold transition disabled:opacity-40 ${skin.border} ${skin.chip} ${skin.text}`}
          >
            Clear all
          </button>
          <button
            type="button"
            onClick={apply}
            className={`h-10 flex-1 rounded-md text-sm font-bold transition ${skin.cta}`}
          >
            Apply
          </button>
        </div>
      </div>
    </div>
  )
}

function PriceInput({
  label,
  value,
  placeholder,
  onChange,
  skin,
}: {
  label: string
  value: number | null
  placeholder: string
  onChange: (value: number | null) => void
  skin: Skin
}) {
  return (
    <label className="min-w-0 flex-1">
      <span className="sr-only">{label} price</span>
      <input
        type="number"
        inputMode="numeric"
        min={0}
        value={value ?? ''}
        placeholder={placeholder}
        onChange={(e) => {
          const raw = e.target.value.trim()
          onChange(raw === '' ? null : Math.max(0, Number(raw)))
        }}
        className={`h-10 w-full rounded-md border px-3 text-sm outline-none transition-colors placeholder:text-muted focus:border-brand ${skin.border} bg-surface-alt ${skin.text}`}
      />
    </label>
  )
}
