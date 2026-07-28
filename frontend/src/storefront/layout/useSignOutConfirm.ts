import { useState } from 'react'
import { useCustomerSession } from '../app/sessionContext'

/**
 * Confirm-then-sign-out flow shared by every logout entry point
 * (sidebar profile section, top-bar account menu). The session is only
 * revoked after `confirm()` — `request()` merely opens the dialog.
 */
export function useSignOutConfirm() {
  const { signOut } = useCustomerSession()
  const [confirming, setConfirming] = useState(false)
  const [busy, setBusy] = useState(false)

  const confirm = async () => {
    setBusy(true)
    try {
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
