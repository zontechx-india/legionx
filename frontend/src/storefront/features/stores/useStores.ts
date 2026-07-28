import { useEffect, useState } from 'react'
import { storesApi } from './storesApi'
import type { Store } from './storesApi'

/**
 * Data hooks for the stores feature. The backend scopes everything to the
 * signed-in customer via the session cookie, so no ids need threading.
 */

/** The customer's store list. `stores === null` while loading. */
export function useStores() {
  const [stores, setStores] = useState<Store[] | null>(null)

  useEffect(() => {
    let cancelled = false
    storesApi
      .list()
      .then((list) => {
        if (!cancelled) setStores(list)
      })
      .catch(() => {
        if (!cancelled) setStores([])
      })
    return () => {
      cancelled = true
    }
  }, [])

  return { stores }
}

/**
 * A single store by id. `undefined` = loading, `null` = not found (or not
 * owned by this customer — the backend treats both as 404).
 */
export function useStore(storeId: string | undefined) {
  const [store, setStore] = useState<Store | null | undefined>(undefined)

  useEffect(() => {
    let cancelled = false
    const lookup = storeId ? storesApi.get(storeId) : Promise.resolve(null)
    lookup
      .then((found) => {
        if (!cancelled) setStore(found)
      })
      .catch(() => {
        if (!cancelled) setStore(null)
      })
    return () => {
      cancelled = true
    }
  }, [storeId])

  return { store, setStore }
}
