import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { useCustomerSession } from '../app/sessionContext'

/**
 * Confirm-then-sign-out flow shared by every logout entry point
 * (sidebar profile section, top-bar account menu). The session is only
 * revoked after `confirm()` — `request()` merely opens the dialog.
 *
 * **Logging out always lands on the marketplace homepage.**
 *
 * The navigation happens BEFORE the session is revoked, and that order is
 * deliberate. Signing out from a guarded route (`/stores/motocore`, `/orders`
 * …) flips the session to guest while that route is still mounted, so
 * `RequireCustomer` sees a guest on a protected path and redirects to
 * `/login?next=/stores/motocore` — logout dumped the customer on a login
 * page, and signing back in returned them to the page they had just left.
 * Moving to `/` first means the guest state lands on a public route and the
 * guard never runs.
 *
 * `replace` so the page they logged out of is not one Back press away.
 */
export function useSignOutConfirm() {
  const { signOut } = useCustomerSession()
  const navigate = useNavigate()
  const [confirming, setConfirming] = useState(false)
  const [busy, setBusy] = useState(false)

  const confirm = async () => {
    setBusy(true)
    try {
      navigate('/', { replace: true })
      await signOut()
      // No cleanup needed on success: the session gate unmounts this tree.
    } catch {
      setBusy(false)
      setConfirming(false)
    }
  }

  return {
    confirming,
    busy,
    request: () => setConfirming(true),
    cancel: () => setConfirming(false),
    confirm,
  }
}
