import { call, callList, http } from '../../shared/auth/http'
import type { ListMeta } from '../../shared/auth/http'
import type { Admin } from '../../shared/auth/authApi'

/**
 * Typed client for `/api/v1/admin/**` — the ONE place the console knows the
 * shape of the admin API. Pages call these functions; nothing else in the
 * admin app touches `http` directly.
 *
 * **Money arrives as a decimal string** ("14250.00"), never a number: the
 * backend serialises Prisma `Decimal` that way so no amount is ever rounded
 * by a float. Format it with `formatMoney()` (ui/format.ts) — don't do
 * arithmetic on it in the browser.
 */

const BASE = '/api/v1/admin'

// ---- Shared row shapes ----------------------------------------------------

export type OrderStatus =
  | 'PENDING'
  | 'CONFIRMED'
  | 'PACKED'
  | 'SHIPPED'
  | 'DELIVERED'
  | 'CANCELLED'
export type PaymentStatus = 'PENDING' | 'PAID' | 'FAILED' | 'REFUNDED'
export type PaymentMethod = 'ONLINE' | 'COD'
export type BankVerificationStatus = 'PENDING' | 'VERIFIED' | 'FAILED'

export interface OrderRow {
  id: string
  orderNumber: string
  status: OrderStatus
  storeId: string | null
  storeName: string
  storeSlug: string
  customerName: string | null
  customerPhone: string | null
  fulfilment: 'DELIVERY' | 'PICKUP'
  paymentMethod: PaymentMethod
  paymentStatus: PaymentStatus
  paymentRef: string | null
  total: string
  placedAt: string
  itemCount: number
}

export interface OrderDetail extends OrderRow {
  customerEmail: string | null
  addressLine: string | null
  pincode: string | null
  state: string | null
  country: string | null
  subtotal: string
  shippingCharge: string
  cfOrderId: string | null
  confirmedAt: string | null
  packedAt: string | null
  shippedAt: string | null
  deliveredAt: string | null
  cancelledAt: string | null
  cancelReason: string | null
  customer: { id: string; name: string | null; email: string | null; phone: string | null } | null
  store: { id: string; name: string; slug: string } | null
  items: {
    id: string
    productId: string | null
    productName: string
    variantName: string | null
    imageUrl: string | null
    unitPrice: string
    quantity: number
    lineTotal: string
  }[]
}

export interface StoreRow {
  id: string
  name: string
  slug: string
  logoUrl: string | null
  isPublished: boolean
  publishedAt: string | null
  suspendedAt: string | null
  suspendedReason: string | null
  createdAt: string
  owner: { id: string; name: string | null; email: string | null; phone: string | null }
  counts: { products: number; categories: number; orders: number }
  revenue: string
}

export interface BankAccount {
  id: string
  accountHolderName: string
  accountNumberLast4: string
  ifsc: string
  bankName: string
  branch: string
  upiId: string | null
  isPrimary: boolean
  verificationStatus: BankVerificationStatus
  verificationNote: string | null
  verifiedAt: string | null
  createdAt: string
}

export interface StoreDetail extends StoreRow {
  settings: {
    payments: { acceptOnlinePayment: boolean; acceptCod: boolean }
    shipping: { mode: 'DELIVERY' | 'PICKUP' | 'BOTH' }
    checkout: Record<string, boolean>
  }
  bankAccounts: BankAccount[]
  orderStatus: Partial<Record<OrderStatus, number>>
  recentOrders: Pick<
    OrderRow,
    'id' | 'orderNumber' | 'status' | 'customerName' | 'paymentMethod' | 'paymentStatus' | 'total' | 'placedAt'
  >[]
}

export interface CustomerRow {
  id: string
  name: string | null
  email: string | null
  phone: string | null
  avatarUrl: string | null
  emailVerifiedAt: string | null
  phoneVerifiedAt: string | null
  blockedAt: string | null
  blockedReason: string | null
  createdAt: string
  counts: { stores: number; orders: number; addresses: number }
  isSeller: boolean
}

export interface CustomerDetail extends CustomerRow {
  altPhone: string | null
  stores: {
    id: string
    name: string
    slug: string
    logoUrl: string | null
    isPublished: boolean
    suspendedAt: string | null
    createdAt: string
  }[]
  spend: { orders: number; total: string }
  recentOrders: Pick<
    OrderRow,
    'id' | 'orderNumber' | 'status' | 'storeName' | 'storeSlug' | 'paymentMethod' | 'paymentStatus' | 'total' | 'placedAt'
  >[]
  revokedSessions?: number
}

export interface ProductRow {
  id: string
  name: string
  slug: string
  isActive: boolean
  priceMin: string | null
  priceMax: string | null
  stockTotal: number
  isFeatured: boolean
  isBestSeller: boolean
  isNewArrival: boolean
  createdAt: string
  store: { id: string; name: string; slug: string; isPublished: boolean }
  category: { id: string; name: string }
  imageUrl: string | null
  variantCount: number
}

export interface ProductDetail extends ProductRow {
  description: string | null
  variants: {
    id: string
    name: string
    price: string
    stockQuantity: number
    isActive: boolean
    isDefault: boolean
  }[]
  media: { id: string; type: 'IMAGE' | 'VIDEO'; url: string | null; altText: string | null }[]
}

export interface AuditRow {
  id: string
  adminId: string
  adminEmail: string
  action: string
  entityType: string
  entityId: string
  meta: Record<string, unknown> | null
  ip: string | null
  userAgent: string | null
  createdAt: string
}

export interface Dashboard {
  range: { days: number; since: string }
  totals: {
    stores: number
    publishedStores: number
    draftStores: number
    customers: number
    sellers: number
    blockedCustomers: number
    products: number
    orders: number
    revenue: string
  }
  today: { orders: number; revenue: string }
  orderStatus: Record<
    'pending' | 'confirmed' | 'packed' | 'shipped' | 'delivered' | 'cancelled',
    number
  >
  payments: {
    paid: number
    pending: number
    failed: number
    refunded: number
    collected: string
    codRevenue: string
    onlineRevenue: string
  }
  series: { date: string; orders: number; revenue: string }[]
  topStores: {
    id: string
    name: string
    slug: string
    logoUrl: string | null
    orders: number
    revenue: string
  }[]
  topProducts: {
    id: string
    name: string
    storeName: string
    storeSlug: string
    unitsSold: number
    revenue: string
  }[]
  recentOrders: Pick<
    OrderRow,
    'id' | 'orderNumber' | 'status' | 'storeName' | 'storeSlug' | 'customerName' | 'paymentMethod' | 'paymentStatus' | 'total' | 'placedAt'
  >[]
  lowStock: { id: string; name: string; stockTotal: number; storeName: string; storeSlug: string }[]
  integrations: { paymentGateway: boolean; push: boolean }
}

export interface Paged<T> {
  items: T[]
  meta: ListMeta
}

/** Query params, with `undefined` entries dropped so URLs stay clean. */
type Params = Record<string, string | number | boolean | undefined>

const params = (input: Params) => ({
  params: Object.fromEntries(
    Object.entries(input).filter(([, value]) => value !== undefined && value !== ''),
  ),
})

// ---- Endpoints ------------------------------------------------------------

export const adminApi = {
  dashboard(days: number) {
    return call<Dashboard>(http.get(`${BASE}/dashboard`, params({ days })))
  },

  // Stores
  listStores(query: Params) {
    return callList<StoreRow>(http.get(`${BASE}/stores`, params(query)))
  },
  getStore(id: string) {
    return call<StoreDetail>(http.get(`${BASE}/stores/${id}`))
  },
  suspendStore(id: string, body: { suspended: boolean; reason?: string | null }) {
    return call<StoreDetail>(http.patch(`${BASE}/stores/${id}/suspend`, body))
  },
  verifyBankAccount(
    storeId: string,
    accountId: string,
    body: { status: BankVerificationStatus; note?: string | null },
  ) {
    return call<StoreDetail>(
      http.patch(`${BASE}/stores/${storeId}/bank-accounts/${accountId}/verification`, body),
    )
  },

  // Customers
  listCustomers(query: Params) {
    return callList<CustomerRow>(http.get(`${BASE}/customers`, params(query)))
  },
  getCustomer(id: string) {
    return call<CustomerDetail>(http.get(`${BASE}/customers/${id}`))
  },
  blockCustomer(id: string, body: { blocked: boolean; reason?: string | null }) {
    return call<CustomerDetail>(http.patch(`${BASE}/customers/${id}/block`, body))
  },

  // Orders & payments
  listOrders(query: Params) {
    return callList<OrderRow>(http.get(`${BASE}/orders`, params(query)))
  },
  getOrder(id: string) {
    return call<OrderDetail>(http.get(`${BASE}/orders/${id}`))
  },
  listPayments(query: Params) {
    return callList<OrderRow>(http.get(`${BASE}/payments`, params(query)))
  },

  // Catalog
  listProducts(query: Params) {
    return callList<ProductRow>(http.get(`${BASE}/catalog/products`, params(query)))
  },
  getProduct(id: string) {
    return call<ProductDetail>(http.get(`${BASE}/catalog/products/${id}`))
  },
  setProductVisibility(id: string, body: { isActive: boolean; reason?: string | null }) {
    return call<ProductDetail>(http.patch(`${BASE}/catalog/products/${id}/visibility`, body))
  },

  // Audit trail
  listAudit(query: Params) {
    return callList<AuditRow>(http.get(`${BASE}/audit`, params(query)))
  },

  // Admin accounts (SUPER_ADMIN only — the API enforces it)
  listAdmins() {
    return call<Admin[]>(http.get(`${BASE}/admins`))
  },
  createAdmin(body: { email: string; password: string; name?: string; role: 'ADMIN' | 'SUPER_ADMIN' }) {
    return call<Admin>(http.post(`${BASE}/admins`, body))
  },
  updateAdmin(id: string, body: { name?: string; role?: 'ADMIN' | 'SUPER_ADMIN'; isActive?: boolean }) {
    return call<Admin>(http.patch(`${BASE}/admins/${id}`, body))
  },
  resetAdminPassword(id: string, password: string) {
    return call<{ revokedSessions: number }>(http.post(`${BASE}/admins/${id}/password`, { password }))
  },

  // Broadcast (the feed itself lives in notificationsApi)
  broadcast(body: {
    audience: 'ADMINS' | 'CUSTOMERS' | 'SELLERS'
    title: string
    body: string
    url?: string | null
  }) {
    return call<{ recipients: number }>(http.post(`${BASE}/notifications/broadcast`, body))
  },
}
