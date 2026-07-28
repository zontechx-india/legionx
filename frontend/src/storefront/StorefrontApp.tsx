import { RouterProvider } from 'react-router-dom'
import { customerAuth } from '../shared/auth/authApi'
import { useSession } from '../shared/auth/useSession'
import { MarketSessionProvider } from './app/marketSession'
import { router } from './app/router'
import { publicRouter } from './app/publicRouter'

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

  return (
    <MarketSessionProvider state={state} signedIn={signedIn} signOut={signOut}>
      <RouterProvider router={router} />
    </MarketSessionProvider>
  )
}
