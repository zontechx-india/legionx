import { useState } from 'react'
import type { Admin } from '../../shared/auth/authApi'
import { AppLogoMark } from '../../shared/ui/AppLogo'
import { PrimaryButton } from '../../shared/ui/form'

/** Placeholder shown after a real admin sign-in. */
export function Dashboard({
  admin,
  onSignOut,
}: {
  admin: Admin
  onSignOut: () => Promise<void> | void
}) {
  const [busy, setBusy] = useState(false)

  return (
    <div className="flex min-h-screen items-center justify-center bg-bg px-4">
      <div className="w-full max-w-sm rounded-lg border border-line bg-surface px-8 py-10 text-center shadow-floating">
        <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center">
          <AppLogoMark className="h-14 w-14" />
        </div>
        <h1 className="text-xl font-semibold text-fg font-heading">
          {admin.name ?? admin.email}
        </h1>
        <p className="mt-2 text-sm text-muted">
          {admin.email} · <span className="font-medium">{admin.role}</span>
        </p>
        <p className="mt-3 text-sm text-muted">
          The console (dashboard, products, orders, inventory, shipping) comes
          next.
        </p>
        <div className="mt-6">
          <PrimaryButton
            disabled={busy}
            onClick={async () => {
              setBusy(true)
              try {
                await onSignOut()
              } finally {
                setBusy(false)
              }
            }}
          >
            {busy ? 'Signing out…' : 'Sign out'}
          </PrimaryButton>
        </div>
      </div>
    </div>
  )
}
