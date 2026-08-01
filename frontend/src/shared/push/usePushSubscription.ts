import { useCallback, useEffect, useState } from 'react'
import { getPushConfig } from '../notifications/notificationsApi'
import type { NotificationsClient } from '../notifications/notificationsApi'

/**
 * Browser push subscription, as a hook.
 *
 * The whole Web Push handshake in one place:
 *   1. is push even possible here (service workers + Push API + a VAPID key)?
 *   2. register `/push-sw.js`
 *   3. ask permission — only ever from a user gesture, never on page load
 *   4. `pushManager.subscribe()` and hand the subscription to our API
 *
 * Every failure mode resolves to a state the UI can explain rather than a
 * thrown error: unsupported browser, permission denied (which JS cannot undo
 * — the user must reset it in site settings), or push not configured on the
 * server.
 */

export type PushState =
  | 'checking'
  | 'unsupported'
  | 'unconfigured'
  | 'denied'
  | 'off'
  | 'on'

/**
 * VAPID keys travel as base64url; `subscribe()` wants raw bytes.
 * Typed as `ArrayBuffer` (not `Uint8Array`) because `applicationServerKey`
 * requires a buffer backed by a plain ArrayBuffer, which the generic
 * `Uint8Array` type no longer guarantees.
 */
function urlBase64ToBuffer(base64: string): ArrayBuffer {
  const padded = (base64 + '='.repeat((4 - (base64.length % 4)) % 4))
    .replace(/-/g, '+')
    .replace(/_/g, '/')
  const raw = atob(padded)
  const bytes = new Uint8Array(new ArrayBuffer(raw.length))
  for (let index = 0; index < raw.length; index += 1) bytes[index] = raw.charCodeAt(index)
  return bytes.buffer
}

const supported =
  typeof navigator !== 'undefined' &&
  'serviceWorker' in navigator &&
  typeof window !== 'undefined' &&
  'PushManager' in window &&
  'Notification' in window

export function usePushSubscription(api: NotificationsClient) {
  const [state, setState] = useState<PushState>('checking')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    let cancelled = false
    if (!supported) {
      setState('unsupported')
      return
    }
    void (async () => {
      try {
        const config = await getPushConfig()
        if (cancelled) return
        if (!config.enabled || !config.publicKey) return setState('unconfigured')
        if (Notification.permission === 'denied') return setState('denied')

        const registration = await navigator.serviceWorker.getRegistration('/push-sw.js')
        const existing = await registration?.pushManager.getSubscription()
        if (!cancelled) setState(existing ? 'on' : 'off')
      } catch {
        // A failed probe is not a failed feature — offer the button anyway.
        if (!cancelled) setState('off')
      }
    })()
    return () => {
      cancelled = true
    }
  }, [])

  const enable = useCallback(async () => {
    setBusy(true)
    setError(null)
    try {
      const config = await getPushConfig()
      if (!config.enabled || !config.publicKey) {
        setState('unconfigured')
        return
      }
      // Must follow a user gesture; browsers reject a silent request.
      const permission = await Notification.requestPermission()
      if (permission !== 'granted') {
        setState(permission === 'denied' ? 'denied' : 'off')
        return
      }

      const registration = await navigator.serviceWorker.register('/push-sw.js')
      await navigator.serviceWorker.ready
      const subscription =
        (await registration.pushManager.getSubscription()) ??
        (await registration.pushManager.subscribe({
          // Web Push requires a visible notification for every message; the
          // browser refuses to subscribe without this promise.
          userVisibleOnly: true,
          applicationServerKey: urlBase64ToBuffer(config.publicKey),
        }))

      await api.subscribe(subscription.toJSON() as PushSubscriptionJSON)
      setState('on')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not enable notifications')
    } finally {
      setBusy(false)
    }
  }, [api])

  const disable = useCallback(async () => {
    setBusy(true)
    setError(null)
    try {
      const registration = await navigator.serviceWorker.getRegistration('/push-sw.js')
      const subscription = await registration?.pushManager.getSubscription()
      if (subscription) {
        // Tell the server first: a browser-side unsubscribe that we never
        // hear about leaves a dead row we would keep pushing to.
        await api.unsubscribe(subscription.endpoint)
        await subscription.unsubscribe()
      }
      setState('off')
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not turn notifications off')
    } finally {
      setBusy(false)
    }
  }, [api])

  return { state, error, busy, enable, disable }
}
