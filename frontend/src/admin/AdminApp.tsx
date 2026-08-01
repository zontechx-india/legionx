import { BrowserRouter } from 'react-router-dom'
import { adminAuth } from '../shared/auth/authApi'
import { useSession } from '../shared/auth/useSession'
import { ThemeProvider } from '../shared/theme/ThemeProvider'
import { AppLogoFull } from '../shared/ui/AppLogo'
import { AdminSessionProvider } from './app/adminSession'
import { AdminRouter } from './app/router'
import { LoginPage } from './pages/LoginPage'

/**
 * Admin session gate.
 *
 * On load it probes `GET /admin/auth/me` (rotating the refresh cookie once on
 * 401); while that's in flight a splash shows, then either the login page or
 * the console. Tokens live in httpOnly cookies — the console never holds a
 * credential in JS.
 *
 * `basename="/admin"`: this build is served at the `/admin` path of the same
 * origin as the storefront, so its client-side routes are `/admin/orders`
 * and so on. nginx returns `admin.html` for every path under `/admin`
 * (`try_files $uri /admin.html`), which is what makes a deep link work.
 */
export function AdminApp() {
  const { state, signedIn, signOut } = useSession(adminAuth)

  if (state.status === 'loading') {
    return (
      <div className="flex min-h-screen items-center justify-center bg-bg">
        <AppLogoFull className="w-40 animate-pulse" />
      </div>
    )
  }

  if (state.status === 'guest') {
    return <LoginPage onSignedIn={signedIn} />
  }

  return (
    <ThemeProvider>
      <BrowserRouter basename="/admin">
        <AdminSessionProvider admin={state.user} onSignedOut={() => void signOut()}>
          <AdminRouter />
        </AdminSessionProvider>
      </BrowserRouter>
    </ThemeProvider>
  )
}
