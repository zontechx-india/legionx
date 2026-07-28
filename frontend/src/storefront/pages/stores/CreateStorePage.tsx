import { useState } from 'react'
import { Link, useNavigate } from 'react-router-dom'
import type { FormEvent } from 'react'
import { toApiError } from '../../../shared/auth/http'
import { ErrorNote, TextField } from '../../../shared/ui/form'
import { storesApi } from '../../features/stores/storesApi'
import { ArrowLeftIcon, ImageIcon } from '../../layout/icons'

/**
 * Create Store — deliberately minimal to reduce friction: just the name.
 * The image slot is a placeholder until S3 upload is integrated; the API
 * already accepts an optional logoUrl, so wiring it later is UI-only.
 */
export function CreateStorePage() {
  const navigate = useNavigate()

  const [name, setName] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  const submit = async (e: FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return setError('Please enter a store name.')

    setError(null)
    setBusy(true)
    try {
      const store = await storesApi.create({ name: name.trim() })
      navigate(`/stores/${store.slug}`)
    } catch (err) {
      setError(toApiError(err).message)
      setBusy(false)
    }
  }

  return (
    <div className="mx-auto max-w-lg">
      <Link
        to="/stores"
        className="inline-flex items-center gap-1.5 text-sm font-medium text-muted transition hover:text-fg"
      >
        <ArrowLeftIcon className="h-4 w-4" />
        Back to stores
      </Link>

      <div className="mt-3 rounded-lg bg-surface p-5 shadow-floating sm:p-6">
        <h1 className="text-xl font-bold tracking-tight text-fg">
          Create Your Store
        </h1>
        <p className="mt-1 text-sm text-muted">
          Just a name to get started — you can customize everything else
          afterwards.
        </p>

        <form onSubmit={submit} className="mt-6 space-y-5" noValidate>
          <TextField
            label="Store name"
            placeholder="e.g. Anwin's Sports Hub"
            value={name}
            onChange={(e) => setName(e.target.value)}
            maxLength={60}
            autoFocus
          />

          {/* Logo slot — becomes a real upload once S3 is integrated. */}
          <div>
            <span className="mb-2 block text-sm font-medium text-muted">
              Store logo <span className="font-normal text-muted">(optional)</span>
            </span>
            <div className="flex items-center gap-4">
              <div className="flex h-20 w-20 shrink-0 items-center justify-center rounded-md border-2 border-dashed border-line bg-surface-alt text-muted">
                <ImageIcon className="h-7 w-7" />
              </div>
              <p className="text-xs text-muted">
                Logo upload is coming soon — you'll be able to add it from
                the store settings.
              </p>
            </div>
          </div>

          {error && <ErrorNote>{error}</ErrorNote>}

          <button
            type="submit"
            disabled={busy}
            className="h-12 w-full rounded-md bg-brand-gradient px-4 text-sm font-semibold text-brand-contrast shadow-floating transition hover:opacity-90 disabled:cursor-not-allowed disabled:bg-none disabled:bg-line disabled:text-muted"
          >
            {busy ? 'Creating…' : 'Create Store'}
          </button>
        </form>
      </div>
    </div>
  )
}
