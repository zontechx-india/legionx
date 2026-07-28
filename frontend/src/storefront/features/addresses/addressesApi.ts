import { call, http } from '../../../shared/auth/http'

/**
 * Customer address book — typed client for /api/v1/addresses (cookie-authed,
 * customer-scoped). A customer keeps up to 10 addresses; exactly one is
 * PRIMARY (the default checkout suggestion — first saved address is primary
 * automatically, and deleting the primary promotes the oldest remaining).
 * Checkout lists these as selectable suggestions.
 */

export interface CustomerAddress {
  id: string
  /** Optional list label — "Home", "Work"… */
  label: string | null
  name: string
  phone: string
  /** Optional: only some stores collect email at checkout. */
  email: string | null
  addressLine: string
  pincode: string
  state: string
  country: string
  isPrimary: boolean
  createdAt: string
  updatedAt: string
}

export interface AddressInput {
  label: string | null
  name: string
  phone: string
  email: string | null
  addressLine: string
  pincode: string
  state: string
  country: string
}

const ADDRESSES = '/api/v1/addresses'

export const addressesApi = {
  /** Primary first, then oldest first. 401 for guests — callers catch it. */
  async list(): Promise<CustomerAddress[]> {
    return call<CustomerAddress[]>(http.get(ADDRESSES))
  },

  async create(
    input: AddressInput & { isPrimary?: boolean },
  ): Promise<CustomerAddress> {
    return call<CustomerAddress>(http.post(ADDRESSES, input))
  },

  async update(
    addressId: string,
    patch: Partial<AddressInput> & { isPrimary?: true },
  ): Promise<CustomerAddress> {
    return call<CustomerAddress>(http.patch(`${ADDRESSES}/${addressId}`, patch))
  },

  /** Promote to primary (the only way to demote the current one). */
  async setPrimary(addressId: string): Promise<CustomerAddress> {
    return this.update(addressId, { isPrimary: true })
  },

  async remove(addressId: string): Promise<void> {
    await call(http.delete(`${ADDRESSES}/${addressId}`))
  },
}

/** "12/4 MG Road, Kochi — Kerala 682016, India" — the one-line list form. */
export function formatAddressLine(address: CustomerAddress): string {
  return `${address.addressLine} — ${address.state} ${address.pincode}, ${address.country}`
}
