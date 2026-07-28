import { useOutletContext } from 'react-router-dom'
import type { Store } from './storesApi'

/**
 * Outlet context passed by `StoreManageLayout` to its section pages —
 * the loaded store plus a callback to push saved updates back so the
 * layout header reflects them instantly.
 */
export interface ManagedStoreContext {
  store: Store
  onStoreChange: (store: Store) => void
}

export function useManagedStore() {
  return useOutletContext<ManagedStoreContext>()
}
