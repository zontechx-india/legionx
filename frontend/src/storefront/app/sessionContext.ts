import { createContext, useContext } from 'react'
import type { Customer } from '../../shared/auth/authApi'

/**
 * Signed-in session for the authed storefront tree.
 *
 * `StorefrontApp` (the session gate) provides this once after login via
 * `<SessionProvider>`; every page/layout component reads it through
 * `useCustomerSession()` instead of prop drilling. The provider only ever
 * mounts with a real customer, so consumers never deal with "maybe signed
 * out" states.
 */
export interface CustomerSession {
  customer: Customer
  /** Revokes the session server-side; the gate drops back to the login page. */
  signOut: () => Promise<void> | void
}

export const SessionContext = createContext<CustomerSession | null>(null)

export function useCustomerSession(): CustomerSession {
  const ctx = useContext(SessionContext)
  if (!ctx) {
    throw new Error('useCustomerSession must be used inside <SessionProvider>')
  }
  return ctx
}
