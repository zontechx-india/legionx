import { createContext, useContext, useMemo } from 'react'
import type { ReactNode } from 'react'
import type { Customer } from '../../shared/auth/authApi'
import type { SessionState } from '../../shared/auth/useSession'

/**
 * The WHOLE session state (loading / guest / authed) for the marketplace
 * tree — unlike `sessionContext.ts`, which only ever exists once a customer
 * is signed in.
 *
 * Why two contexts: the homepage (`/`) is public — it renders for guests and
 * signed-in customers alike, and merely *adapts* (account menu vs. Sign in,
 * My Stores section vs. nothing). So the router now always mounts, and the
 * gate's session state travels down through this context. Authed-only
 * subtrees are wrapped in `<RequireCustomer>`, which narrows this state to
 * the guaranteed-signed-in `SessionProvider` the existing pages consume.
 */
export interface MarketSession {
  state: SessionState<Customer>
  /** Call after a successful login/register with the returned customer. */
  signedIn: (user: Customer) => void
  /** Revokes the session server-side and drops the state to guest. */
  signOut: () => Promise<void> | void
}

const MarketSessionContext = createContext<MarketSession | null>(null)

export function useMarketSession(): MarketSession {
  const ctx = useContext(MarketSessionContext)
  if (!ctx) {
    throw new Error('useMarketSession must be used inside <MarketSessionProvider>')
  }
  return ctx
}

export function MarketSessionProvider({
  state,
  signedIn,
  signOut,
  children,
}: MarketSession & { children: ReactNode }) {
  const value = useMemo(
    () => ({ state, signedIn, signOut }),
    [state, signedIn, signOut],
  )
  return (
    <MarketSessionContext.Provider value={value}>
      {children}
    </MarketSessionContext.Provider>
  )
}
