import { useCallback } from 'react'
import { RouterProvider } from 'react-router-dom'
import { customerAuth } from '../shared/auth/authApi'
import { useSession } from '../shared/auth/useSession'
import { MarketSessionProvider } from './app/marketSession'
import { router } from './app/router'
import { publicRouter } from './app/publicRouter'
import { cart } from './features/cart/cart'

/**
 * Storefront root.
 *
 * Two surfaces, decided once per full page load:
 *
 *  - The SHOPPING surface — `/store/...`, `/cart...`, `/checkout/...`,
 *    `/order/...` (confirmation) — is fully anonymous and mounts
 *    `app/publicRouter.tsx` immediately, without even probing the session
 *    (no auth round-trip on a shared store link).
 *
 *  - Everything else mounts the MARKETPLACE router (`app/router.tsx`). The
 *    homepage `/` is public: it renders instantly for guests and merely
 *    adapts once the cookie-session probe (GET /auth/me, one refresh retry
 *    on 401) resolves. Sign-in is a route (`/login`), and the account
 *    subtree is wrapped in `<RequireCustomer>` which redirects guests there
 *    with a `?next=` return path.
 */
const PUBLIC_PATH = /^\/(store|cart|checkout|order)(\/|$)/

export function StorefrontApp() {
  if (PUBLIC_PATH.test(window.location.pathname)) {
    return <RouterProvider router={publicRouter} />
  }
  return <MarketplaceApp />
}

function MarketplaceApp() {
  const { state, signedIn, signOut } = useSession(customerAuth)

  /**
   * Logging out empties the cart as well as the session.
   *
   * The cart is device-local (localStorage, no server copy — public store
   * pages are anonymous), so signing out otherwise leaves the previous
   * customer's basket sitting there for whoever uses the browser next. It
   * runs in `finally`: `useSession.signOut` drops to guest even when the
   * revoke request fails, and a locally-signed-out account must not keep a
   * cart either.
   *
   * Only an EXPLICIT logout gets here. An expired session (the 401 path out
   * of checkout) redirects to `/login` without calling this, so the cart
   * survives to be paid for after signing back in.
   */
  const signOutAndClearCart = useCallback(async () => {
    try {
      await signOut()
    } finally {
      cart.clear()
    }
  }, [signOut])

  return (
    <MarketSessionProvider
      state={state}
      signedIn={signedIn}
      signOut={signOutAndClearCart}
    >
      <RouterProvider router={router} />
    </MarketSessionProvider>
  )
}
