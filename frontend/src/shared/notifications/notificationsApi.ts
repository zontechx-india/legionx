import { call, callList, http } from '../auth/http'
import type { ListMeta } from '../auth/http'

/**
 * Notification feed + push subscription client.
 *
 * Shared by both apps because the endpoints are identical — only the prefix
 * differs (`/api/v1/notifications` for a customer, `/api/v1/admin/...` for an
 * admin), and the server decides whose feed it is from the session. Create
 * one client per surface with `notificationsApi('admin' | 'customer')`.
 */

export type NotificationKind =
  | 'ORDER_PLACED'
  | 'ORDER_STATUS'
  | 'PAYMENT'
  | 'STORE'
  | 'ACCOUNT'
  | 'ANNOUNCEMENT'

export interface AppNotification {
  id: string
  kind: NotificationKind
  title: string
  body: string
  url: string | null
  data: Record<string, unknown> | null
  readAt: string | null
  createdAt: string
}

export interface PushDevice {
  id: string
  userAgent: string | null
  disabledAt: string | null
  createdAt: string
  lastUsedAt: string
}

/** The VAPID public key — public, unauthenticated, cached by the browser. */
export function getPushConfig() {
  return call<{ publicKey: string | null; enabled: boolean }>(
    http.get('/api/v1/public/push-config'),
  )
}

export function notificationsApi(surface: 'admin' | 'customer') {
  const base = surface === 'admin' ? '/api/v1/admin/notifications' : '/api/v1/notifications'

  return {
    list(query: { page?: number; pageSize?: number; unreadOnly?: boolean } = {}) {
      return callList<AppNotification>(http.get(base, { params: query })) as Promise<{
        items: AppNotification[]
        meta: ListMeta
      }>
    },
    unreadCount() {
      return call<{ unread: number; pushEnabled: boolean }>(http.get(`${base}/unread-count`))
    },
    markRead(id: string) {
      return call<{ id: string }>(http.post(`${base}/${id}/read`))
    },
    markAllRead() {
      return call<{ markedRead: number }>(http.post(`${base}/read-all`))
    },
    devices() {
      return call<PushDevice[]>(http.get(`${base}/devices`))
    },
    subscribe(subscription: PushSubscriptionJSON) {
      return call<{ subscribed: boolean }>(http.post(`${base}/subscribe`, subscription))
    },
    unsubscribe(endpoint: string) {
      return call<{ subscribed: boolean }>(http.post(`${base}/unsubscribe`, { endpoint }))
    },
  }
}

export type NotificationsClient = ReturnType<typeof notificationsApi>
