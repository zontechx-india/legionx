import { useState } from 'react'
import {
  AuthLayout,
  Hero,
  AuthCard,
  Brand,
  TextField,
  PrimaryButton,
} from '../../shared/ui/form'

/**
 * Admin login — email + password.
 *
 * API integration is intentionally deferred. The `// TODO(api)` point below is
 * where the backend call goes:
 *   - sign in → POST /api/v1/admin/auth/login  { email, password }
 *     → store the returned admin JWT, then redirect to the dashboard.
 */
export function LoginPage() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')

  function signIn(e: React.FormEvent) {
    e.preventDefault()
    // TODO(api): authenticate, store token, redirect to dashboard.
  }

  return (
    <AuthLayout
      hero={<AdminHero />}
      footer={
        <p className="text-xs text-gray-400">
          Authorized personnel only · admin.shop.example.com
        </p>
      }
    >
      <Brand
        badge="⚙"
        badgeClass="bg-gray-900"
        title="Admin Console"
        subtitle="Sign in to manage your store"
      />

      <AuthCard>
        <form className="space-y-4" onSubmit={signIn}>
          <TextField
            label="Email"
            type="email"
            placeholder="admin@store.com"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoFocus
          />
          <div>
            <TextField
              label="Password"
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
            />
            <div className="mt-1.5 text-right">
              <button
                type="button"
                className="text-xs font-medium text-blue-600 hover:text-blue-700"
              >
                Forgot password?
              </button>
            </div>
          </div>
          <PrimaryButton type="submit" disabled={!email.trim() || !password}>
            Sign in
          </PrimaryButton>
        </form>
      </AuthCard>
    </AuthLayout>
  )
}

/** Left marketing pane (lg+ only). */
function AdminHero() {
  const stats = [
    { label: 'Orders today', value: '128' },
    { label: 'Revenue', value: '₹4.8L' },
    { label: 'Low stock', value: '5' },
  ]

  return (
    <Hero
      accentClass="bg-gradient-to-br from-slate-800 to-slate-950"
      logo={<>⚙ Cricket Store Admin</>}
    >
      {/* Decorative dashboard mock */}
      <div className="my-10 space-y-3">
        <div className="grid grid-cols-3 gap-3">
          {stats.map((s) => (
            <div key={s.label} className="rounded-xl bg-white/10 p-3 backdrop-blur">
              <div className="text-lg font-bold text-white">{s.value}</div>
              <div className="text-[11px] text-slate-300">{s.label}</div>
            </div>
          ))}
        </div>
        <div className="rounded-xl bg-white/10 p-4 backdrop-blur">
          <div className="mb-2 text-xs text-slate-300">Sales this week</div>
          <div className="flex h-16 items-end gap-1.5">
            {[40, 65, 50, 80, 60, 90, 75].map((h, i) => (
              <div
                key={i}
                className="flex-1 rounded-t bg-blue-400/80"
                style={{ height: `${h}%` }}
              />
            ))}
          </div>
        </div>
      </div>

      <div>
        <h2 className="text-4xl font-bold leading-tight">
          Run your store
          <br />
          <span className="text-blue-300">from one place.</span>
        </h2>
        <p className="mt-3 max-w-sm text-slate-300">
          Products, orders, inventory, and shipping — all in one console.
        </p>
      </div>
    </Hero>
  )
}
