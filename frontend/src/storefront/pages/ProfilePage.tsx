import { useState } from 'react'
import { usePageTitle } from '../../shared/usePageTitle'
import { customerAuth } from '../../shared/auth/authApi'
import type { Customer } from '../../shared/auth/authApi'
import {
  TextField,
  PrimaryButton,
  ErrorNote,
  InfoNote,
  SuccessNote,
  PhoneIcon,
  ShieldIcon,
} from '../../shared/ui/form'
import { useCustomerSession } from '../app/sessionContext'
import { useMarketSession } from '../app/marketSession'
import { Avatar } from '../layout/Avatar'
import { CheckIcon, MailIcon, PhoneCallIcon } from '../layout/icons'

/**
 * My Profile (/profile) — the customer's own account details plus the
 * mobile-number linking flow (CONTEXT.md "Account Linking"): a number is
 * added HERE, verified by an SMS OTP, and then works as an OTP sign-in
 * method on the login page. A number can belong to exactly one account —
 * the backend answers 409 when it's already linked elsewhere — so once
 * linked the section becomes read-only (identifiers only change via the
 * verified linking flow, never a plain edit).
 */
export function ProfilePage() {
  usePageTitle('My Profile')

  const { customer } = useCustomerSession()
  // Linking changes the customer record; push the fresh copy into the
  // session state so the whole authed tree (menu, this page) updates.
  const { signedIn } = useMarketSession()
  const [linked, setLinked] = useState(false)

  return (
    <div className="mx-auto max-w-3xl">
      <h1 className="font-body text-2xl font-semibold tracking-normal text-fg">
        My Profile
      </h1>
      <p className="mt-1 text-sm text-muted">
        Your account details and how you sign in.
      </p>

      {/* ---- Identity ---------------------------------------------------- */}
      <div className="mt-5 flex items-center gap-4 rounded-lg border border-line bg-surface p-5">
        <Avatar customer={customer} className="h-16 w-16" />
        <div className="min-w-0">
          <p className="truncate text-lg font-semibold text-fg">
            {customer.name ?? 'Your account'}
          </p>
          <p className="text-sm text-muted">
            Member since{' '}
            {new Date(customer.createdAt).toLocaleDateString(undefined, {
              month: 'long',
              year: 'numeric',
            })}
          </p>
        </div>
      </div>

      {/* ---- Sign-in identifiers ----------------------------------------- */}
      <div className="mt-4 rounded-lg border border-line bg-surface p-5">
        <h2 className="text-base font-semibold text-fg">Sign-in details</h2>
        <p className="mt-0.5 text-xs text-muted">
          Each email and mobile number belongs to exactly one account. They are
          changed only through a verified linking flow — never edited directly.
        </p>

        {linked && (
          <div className="mt-3">
            <SuccessNote>
              Mobile number linked — you can now sign in with it using an OTP.
            </SuccessNote>
          </div>
        )}

        <div className="mt-4 divide-y divide-line">
          {/* Email */}
          <IdentifierRow
            icon={<MailIcon className="h-4 w-4" />}
            label="Email"
            value={customer.email}
            verified={Boolean(customer.emailVerifiedAt)}
            hint={
              customer.email
                ? 'Used to sign in with your password.'
                : 'No email on this account.'
            }
          />

          {/* Mobile number */}
          {customer.phone ? (
            <IdentifierRow
              icon={<PhoneCallIcon className="h-4 w-4" />}
              label="Mobile number"
              value={customer.phone}
              verified={Boolean(customer.phoneVerifiedAt)}
              hint="You can sign in with this number using a one-time code."
            />
          ) : (
            <LinkPhoneSection
              onLinked={(updated) => {
                setLinked(true)
                signedIn(updated)
              }}
            />
          )}

          {/* Alternate phone (contact only, not a sign-in method) */}
          {customer.altPhone && (
            <IdentifierRow
              icon={<PhoneCallIcon className="h-4 w-4" />}
              label="Alternate phone"
              value={customer.altPhone}
              hint="Contact number only — not used for sign-in."
            />
          )}
        </div>
      </div>
    </div>
  )
}

/* ------------------------------------------------------------------ */
/* One identifier row (email / phone)                                  */
/* ------------------------------------------------------------------ */

function IdentifierRow({
  icon,
  label,
  value,
  verified,
  hint,
  trailing,
}: {
  icon: React.ReactNode
  label: string
  value: string | null
  verified?: boolean
  hint?: string
  trailing?: React.ReactNode
}) {
  return (
    <div className="flex items-start gap-3 py-4 first:pt-0 last:pb-0">
      <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-surface-alt text-muted">
        {icon}
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-muted">{label}</p>
        <div className="mt-0.5 flex flex-wrap items-center gap-2">
          <p className="truncate text-sm font-medium text-fg">
            {value ?? '—'}
          </p>
          {verified && <VerifiedChip />}
        </div>
        {hint && <p className="mt-1 text-xs text-muted">{hint}</p>}
      </div>
      {trailing}
    </div>
  )
}

function VerifiedChip() {
  return (
    <span className="inline-flex items-center gap-1 rounded-pill bg-success/10 px-2 py-0.5 text-[11px] font-medium text-success">
      <CheckIcon className="h-3 w-3" />
      Verified
    </span>
  )
}

/* ------------------------------------------------------------------ */
/* Link a mobile number (SMS OTP)                                      */
/* ------------------------------------------------------------------ */

/**
 * Two-step linking against `POST /me/link/request` → `POST /me/link/verify`:
 * enter the number → an SMS code goes to it → entering the code links the
 * number (verified) and returns the updated customer. A number already
 * linked to ANOTHER account is rejected by the request call with a 409 —
 * surfaced here as the inline error.
 */
function LinkPhoneSection({ onLinked }: { onLinked: (customer: Customer) => void }) {
  const [step, setStep] = useState<'idle' | 'phone' | 'code'>('idle')
  const [phone, setPhone] = useState('')
  const [code, setCode] = useState('')
  const [devCode, setDevCode] = useState<string | undefined>()
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')

  // Matches the backend's loose E.164 rule (optional +, 7–15 digits).
  const cleaned = phone.replace(/[\s-]/g, '')
  const phoneValid = /^\+?[0-9]{7,15}$/.test(cleaned)

  async function requestCode(e?: React.FormEvent) {
    e?.preventDefault()
    setError('')
    setBusy(true)
    try {
      const sent = await customerAuth.linkRequest({ phone: cleaned })
      setDevCode(sent.devCode)
      setCode('')
      setStep('code')
    } catch (err) {
      setError((err as Error).message)
    } finally {
      setBusy(false)
    }
  }

  async function verify(e: React.FormEvent) {
    e.preventDefault()
    setError('')
    setBusy(true)
    try {
      const updated = await customerAuth.linkVerify({ phone: cleaned, code })
      onLinked(updated)
    } catch (err) {
      setError((err as Error).message)
      setBusy(false)
    }
  }

  return (
    <div className="flex items-start gap-3 py-4 first:pt-0 last:pb-0">
      <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-md bg-surface-alt text-muted">
        <PhoneCallIcon className="h-4 w-4" />
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-xs font-medium text-muted">Mobile number</p>

        {step === 'idle' && (
          <>
            <p className="mt-0.5 text-sm text-muted">
              No mobile number linked yet.
            </p>
            <p className="mt-1 text-xs text-muted">
              Link your number to also sign in with an SMS one-time code. A
              number can be linked to only one UnieMax account.
            </p>
            <button
              type="button"
              onClick={() => setStep('phone')}
              className="mt-3 inline-flex items-center gap-1.5 rounded-md border border-line bg-surface-alt px-3 py-1.5 text-sm font-medium text-fg transition hover:border-brand hover:text-brand"
            >
              <PhoneIcon />
              Link mobile number
            </button>
          </>
        )}

        {step === 'phone' && (
          <form className="mt-2 max-w-sm space-y-3" onSubmit={requestCode}>
            <TextField
              label="Mobile number"
              inputMode="tel"
              placeholder="9876543210"
              icon={<PhoneIcon />}
              value={phone}
              onChange={(e) => {
                setError('')
                setPhone(e.target.value)
              }}
              autoFocus
            />
            {error && <ErrorNote>{error}</ErrorNote>}
            <div className="flex items-center gap-3">
              <PrimaryButton type="submit" disabled={busy || !phoneValid}>
                {busy ? 'Sending…' : 'Send verification code'}
              </PrimaryButton>
              <button
                type="button"
                onClick={() => {
                  setError('')
                  setStep('idle')
                }}
                className="text-xs text-muted hover:text-fg"
              >
                Cancel
              </button>
            </div>
            <p className="text-xs text-muted">
              We&apos;ll text a code to this number to confirm it&apos;s yours.
            </p>
          </form>
        )}

        {step === 'code' && (
          <form className="mt-2 max-w-sm space-y-3" onSubmit={verify}>
            <p className="text-sm text-muted">
              Enter the code sent to{' '}
              <span className="font-medium text-fg">{cleaned}</span>
            </p>
            {devCode && <InfoNote>Dev mode — use code {devCode}</InfoNote>}
            <TextField
              label="Verification code"
              inputMode="numeric"
              maxLength={8}
              placeholder="Enter the code"
              icon={<ShieldIcon />}
              value={code}
              onChange={(e) => {
                setError('')
                setCode(e.target.value.replace(/\D/g, ''))
              }}
              autoFocus
              className="tracking-[0.3em]"
            />
            {error && <ErrorNote>{error}</ErrorNote>}
            {/* Real SMS codes are 4 digits (Message Central default); the dev
                fallback/bypass sends 6 — so gate at the backend's minimum. */}
            <PrimaryButton type="submit" disabled={busy || code.length < 4}>
              {busy ? 'Verifying…' : 'Verify & link number'}
            </PrimaryButton>
            <div className="flex items-center justify-between text-xs">
              <button
                type="button"
                className="text-muted hover:text-fg"
                onClick={() => {
                  setError('')
                  setCode('')
                  setStep('phone')
                }}
              >
                ← Change number
              </button>
              <button
                type="button"
                onClick={() => requestCode()}
                disabled={busy}
                className="font-medium text-brand hover:text-brand-hover disabled:text-muted"
              >
                Resend code
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
