import { adminAuth } from '../shared/auth/authApi'
import { useSession } from '../shared/auth/useSession'
import { AppLogoFull } from '../shared/ui/AppLogo'
import { LoginPage } from './pages/LoginPage'
import { Dashboard } from './pages/Dashboard'

/**
 * Admin session gate — real cookie sessions.
 * On load it probes GET /admin/auth/me (rotating the refresh cookie once on
 * 401); while that's in flight a splash is shown, then login or dashboard.
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

  return <Dashboard admin={state.user} onSignOut={signOut} />
}
