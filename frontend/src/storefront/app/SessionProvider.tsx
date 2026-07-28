import { useMemo } from 'react'
import type { ReactNode } from 'react'
import { SessionContext } from './sessionContext'
import type { CustomerSession } from './sessionContext'

/** Provides the signed-in customer to the authed tree — see sessionContext.ts. */
export function SessionProvider({
  customer,
  signOut,
  children,
}: CustomerSession & { children: ReactNode }) {
  const value = useMemo(() => ({ customer, signOut }), [customer, signOut])
  return (
    <SessionContext.Provider value={value}>{children}</SessionContext.Provider>
  )
}
