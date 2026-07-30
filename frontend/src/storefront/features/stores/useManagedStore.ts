import { useOutletContext } from 'react-router-dom'
import type { Store, StoreDashboard } from './storesApi'

/**
 * Outlet context passed by `StoreManageLayout` to its section pages —
 * the loaded store plus a callback to push saved updates back so the
 * layout header reflects them instantly.
 *
 * The **dashboard** lives here rather than on the Dashboard page because two
 * consumers need it: that page, and the Orders badge in the section nav. The
 * layout stays mounted across section navigation, so this is one request per
 * management session instead of one per visit to the Dashboard.
 */
export interface ManagedStoreContext {
  store: Store
  onStoreChange: (store: Store) => void
  /** Order counters + latest orders. `null` while loading or on failure. */
  dashboard: StoreDashboard | null
  dashboardError: string | null
  /**
   * Re-fetch the dashboard. Coalesces concurrent calls, so callers never
   * need to guard. Call it after anything that changes order state, so the
   * nav badge and the dashboard tiles stay truthful.
   */
  refreshDashboard: () => void
}

export function useManagedStore() {
  return useOutletContext<ManagedStoreContext>()
}
