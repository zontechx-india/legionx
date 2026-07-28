import { useEffect, useRef } from 'react'
import type { ReactNode } from 'react'

/**
 * Accessible confirmation dialog (no portal/deps needed — it renders as a
 * fixed overlay above everything).
 *
 *   - Escape or a backdrop click cancels (disabled while `busy`).
 *   - Focus lands on the cancel button when the dialog opens.
 *   - `busy` locks both buttons for async confirms (e.g. a logout request).
 */
export function ConfirmDialog({
  open,
  title,
  description,
  confirmLabel = 'Confirm',
  cancelLabel = 'Cancel',
  tone = 'danger',
  busy = false,
  onConfirm,
  onCancel,
}: {
  open: boolean
  title: string
  description: ReactNode
  confirmLabel?: string
  cancelLabel?: string
  /** `danger` = red confirm (destructive), `neutral` = dark confirm. */
  tone?: 'danger' | 'neutral'
  busy?: boolean
  onConfirm: () => void
  onCancel: () => void
}) {
  const cancelRef = useRef<HTMLButtonElement>(null)

  useEffect(() => {
    if (!open) return
    cancelRef.current?.focus()
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !busy) onCancel()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [open, busy, onCancel])

  if (!open) return null

  const confirmClass =
    tone === 'danger'
      ? 'bg-brand text-brand-contrast hover:bg-brand-hover'
      : 'bg-fg text-bg hover:opacity-90'

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-[var(--overlay)] p-4 sm:items-center"
      onMouseDown={() => {
        if (!busy) onCancel()
      }}
    >
      <div
        role="dialog"
        aria-modal="true"
        aria-labelledby="confirm-dialog-title"
        className="w-full max-w-sm rounded-lg border border-line bg-surface p-6 shadow-floating"
        onMouseDown={(e) => e.stopPropagation()}
      >
        <h2
          id="confirm-dialog-title"
          className="font-heading text-base font-semibold text-fg"
        >
          {title}
        </h2>
        <div className="mt-2 text-sm text-muted">{description}</div>

        <div className="mt-6 grid grid-cols-2 gap-3">
          <button
            ref={cancelRef}
            type="button"
            disabled={busy}
            onClick={onCancel}
            className="h-11 rounded-md border border-line bg-surface text-sm font-semibold text-fg transition-colors hover:bg-surface-alt disabled:cursor-not-allowed disabled:text-muted"
          >
            {cancelLabel}
          </button>
          <button
            type="button"
            disabled={busy}
            onClick={onConfirm}
            className={`h-11 rounded-md text-sm font-semibold transition-colors disabled:cursor-not-allowed disabled:bg-line disabled:text-muted ${confirmClass}`}
          >
            {busy ? 'Please wait…' : confirmLabel}
          </button>
        </div>
      </div>
    </div>
  )
}
