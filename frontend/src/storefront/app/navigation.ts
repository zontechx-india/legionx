import type { ComponentType } from 'react'
import {
  BagIcon,
  HeartIcon,
  HomeIcon,
  MapPinIcon,
  SettingsIcon,
  UserIcon,
} from '../layout/icons'

/**
 * Single source of truth for the storefront sidebar.
 *
 * Adding a page = one entry here + one route in `app/router.tsx`.
 * `end` marks routes that must match exactly (only "/" needs it, otherwise
 * it would stay highlighted on every child path).
 */
export interface NavItem {
  label: string
  to: string
  icon: ComponentType<{ className?: string }>
  end?: boolean
}

export const NAV_ITEMS: NavItem[] = [
  { label: 'Home', to: '/', icon: HomeIcon, end: true },
  { label: 'Orders', to: '/orders', icon: BagIcon },
  { label: 'Wishlist', to: '/wishlist', icon: HeartIcon },
  { label: 'Settings', to: '/settings', icon: SettingsIcon },
]

/**
 * Top-bar avatar dropdown (Flipkart-style "Your Account" menu).
 * Two rows are NOT listed here because they're dynamic actions rendered by
 * `AccountMenu` itself: the store row ("Create Store" / "My Store",
 * depending on whether the customer owns any) and Logout (needs the
 * confirm-dialog flow).
 */
export const ACCOUNT_MENU_ITEMS: NavItem[] = [
  { label: 'My Profile', to: '/profile', icon: UserIcon },
  { label: 'Orders', to: '/orders', icon: BagIcon },
  { label: 'Saved Addresses', to: '/addresses', icon: MapPinIcon },
  { label: 'Favourites', to: '/wishlist', icon: HeartIcon },
]
