import { ConfirmDialog } from '../../shared/ui/ConfirmDialog'
import { useCustomerSession } from '../app/sessionContext'
import { Avatar } from './Avatar'
import { LogoutIcon } from './icons'
import { useSignOutConfirm } from './useSignOutConfirm'

/**
 * Pinned to the bottom of the sidebar: the signed-in customer (avatar,
 * name, contact) plus a logout button. Logout always goes through a
 * confirmation dialog — the session is only revoked after "Sign out"
 * is confirmed.
 */
export function ProfileSection({ collapsed = false }: { collapsed?: boolean }) {
  const { customer } = useCustomerSession()
  const signOutFlow = useSignOutConfirm()

  const name = customer.name ?? 'Customer'
  const contact = customer.email ?? customer.phone ?? ''

  return (
    <div className="border-t border-line p-3">
      <div
        className={`flex items-center gap-3 rounded-md p-2 ${
          collapsed ? 'flex-col gap-2' : ''
        }`}
      >
        <Avatar customer={customer} className="h-10 w-10" />

        {!collapsed && (
          <div className="min-w-0 flex-1">
            <p className="truncate text-sm font-semibold text-fg">
              {name}
            </p>
            {contact && (
              <p className="truncate text-xs text-muted">{contact}</p>
            )}
          </div>
        )}

        <button
          type="button"
          title="Sign out"
          aria-label="Sign out"
          onClick={signOutFlow.request}
          className="flex h-9 w-9 shrink-0 items-center justify-center rounded-full text-muted transition-colors hover:bg-danger/10 hover:text-danger"
        >
          <LogoutIcon className="h-5 w-5" />
        </button>
      </div>

      <ConfirmDialog
        open={signOutFlow.confirming}
        title="Sign out?"
        description="You'll need to sign in again to access your account."
        confirmLabel="Sign out"
        busy={signOutFlow.busy}
        onConfirm={signOutFlow.confirm}
        onCancel={signOutFlow.cancel}
      />
    </div>
  )
}
