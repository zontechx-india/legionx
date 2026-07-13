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
 * Customer login — passwordless OTP to email or phone.
 * Two steps: enter identifier → enter the 6-digit code.
 *
 * API integration is intentionally deferred. The two `// TODO(api)` points
 * below are where the backend calls go:
 *   - request code → POST /api/v1/auth/otp/request  { identifier }
 *   - verify code  → POST /api/v1/auth/otp/verify   { identifier, code }
 */
export function LoginPage() {
  const [step, setStep] = useState<'identifier' | 'otp'>('identifier')
  const [identifier, setIdentifier] = useState('')
  const [code, setCode] = useState('')

  function requestCode(e: React.FormEvent) {
    e.preventDefault()
    // TODO(api): send OTP to `identifier`, then advance.
    setStep('otp')
  }

  function verifyCode(e: React.FormEvent) {
    e.preventDefault()
    // TODO(api): verify `code` for `identifier`, then store token + redirect.
  }

  return (
    <AuthLayout
      hero={<StorefrontHero />}
      footer={
        <p className="text-xs text-gray-400">© Cricket Store · Terms · Privacy</p>
      }
    >
      <Brand
        badge="🏏"
        badgeClass="bg-blue-600"
        title="Cricket Store"
        subtitle="Sign in to continue shopping"
      />

      <AuthCard>
        {step === 'identifier' ? (
          <form className="space-y-4" onSubmit={requestCode}>
            <TextField
              label="Email or mobile number"
              placeholder="you@example.com or 98765 43210"
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              autoFocus
            />
            <PrimaryButton type="submit" disabled={!identifier.trim()}>
              Continue
            </PrimaryButton>
            <p className="text-center text-xs text-gray-500">
              We&apos;ll send a one-time code to verify it&apos;s you.
            </p>
          </form>
        ) : (
          <form className="space-y-4" onSubmit={verifyCode}>
            <p className="text-sm text-gray-600">
              Enter the 6-digit code sent to{' '}
              <span className="font-medium text-gray-900">{identifier}</span>
            </p>
            <TextField
              label="One-time code"
              inputMode="numeric"
              maxLength={6}
              placeholder="••••••"
              value={code}
              onChange={(e) => setCode(e.target.value.replace(/\D/g, ''))}
              autoFocus
            />
            <PrimaryButton type="submit" disabled={code.length < 6}>
              Verify &amp; sign in
            </PrimaryButton>
            <div className="flex items-center justify-between text-xs">
              <button
                type="button"
                className="text-gray-500 hover:text-gray-700"
                onClick={() => {
                  setCode('')
                  setStep('identifier')
                }}
              >
                ← Change
              </button>
              <button
                type="button"
                className="font-medium text-blue-600 hover:text-blue-700"
              >
                Resend code
              </button>
            </div>
          </form>
        )}
      </AuthCard>

      <p className="mt-4 text-center text-sm text-gray-600">
        No account needed — signing in verifies your email or phone.
      </p>
    </AuthLayout>
  )
}

/** Left marketing pane (lg+ only). */
function StorefrontHero() {
  return (
    <Hero
      accentClass="bg-gradient-to-br from-blue-600 to-blue-800"
      logo={<>🏏 Cricket Store</>}
    >
      {/* Decorative floating mock */}
      <div className="relative mx-auto my-10 h-56 w-full max-w-xs">
        <div className="absolute left-1/2 top-6 w-52 -translate-x-1/2 rounded-2xl bg-white p-4 text-gray-900 shadow-xl">
          <div className="mb-3 flex h-24 items-center justify-center rounded-xl bg-blue-50 text-4xl">
            🏏
          </div>
          <div className="text-sm font-semibold">MRF Genius</div>
          <div className="text-sm text-blue-700">₹4,999</div>
        </div>
        <div className="absolute -left-2 top-2 rounded-full bg-white px-3 py-1 text-xs font-medium text-emerald-600 shadow-lg">
          ✓ In stock
        </div>
        <div className="absolute -right-1 bottom-2 rounded-full bg-white px-3 py-1 text-xs font-medium text-blue-700 shadow-lg">
          🚚 Free delivery
        </div>
      </div>

      <div>
        <h2 className="text-4xl font-bold leading-tight">
          Gear up.
          <br />
          <span className="text-blue-200">Play your best.</span>
        </h2>
        <p className="mt-3 max-w-sm text-blue-100">
          Premium cricket bats delivered to your door. Cash on delivery
          available.
        </p>
      </div>
    </Hero>
  )
}
