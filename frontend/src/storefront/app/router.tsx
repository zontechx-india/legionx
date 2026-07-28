import { createBrowserRouter, Navigate } from 'react-router-dom'
import { AppLayout } from '../layout/AppLayout'
import { RequireCustomer } from './RequireCustomer'
import { LoginRoute } from '../pages/LoginRoute'

/**
 * Marketplace router — everything that is not the per-store shopping surface
 * (`/store`, `/cart`, `/checkout` live in `publicRouter.tsx`).
 *
 * Three tiers:
 *   1. PUBLIC pages — the marketplace homepage `/`, `/login`, and the footer
 *      info pages. They render for guests; session-aware bits adapt via
 *      `useMarketSession()`.
 *   2. The ACCOUNT subtree — wrapped in `<RequireCustomer>` (guests are
 *      redirected to /login?next=…), then in the existing `AppLayout` shell.
 *   3. Fallback — unknown paths go home.
 *
 * Every page is a `lazy` route, so each one is a separate chunk.
 */
export const router = createBrowserRouter([
  // ---- Public marketplace pages -------------------------------------------
  {
    path: '/',
    lazy: async () => ({
      Component: (await import('../pages/HomePage')).HomePage,
    }),
  },
  { path: '/login', element: <LoginRoute /> },
  // Footer links — real routes with a lightweight public placeholder, so a
  // shared link lands on "coming soon" rather than a 404/redirect.
  ...['about', 'privacy', 'terms', 'support', 'contact'].map((page) => ({
    path: `/${page}`,
    lazy: async () => ({
      Component: (await import('../pages/InfoComingSoonPage')).InfoComingSoonPage,
    }),
  })),

  // ---- Account subtree (signed-in customers only) --------------------------
  {
    element: <RequireCustomer />,
    children: [
      {
        element: <AppLayout />,
        children: [
          {
            path: 'orders',
            lazy: async () => ({
              Component: (await import('../pages/OrdersPage')).OrdersPage,
            }),
          },
          {
            path: 'profile',
            lazy: async () => ({
              Component: (await import('../pages/ProfilePage')).ProfilePage,
            }),
          },
          {
            path: 'addresses',
            lazy: async () => ({
              Component: (await import('../pages/AddressesPage')).AddressesPage,
            }),
          },
          // Store creation & management (a customer can own multiple stores)
          {
            path: 'stores',
            lazy: async () => ({
              Component: (await import('../pages/stores/StoresPage')).StoresPage,
            }),
          },
          {
            path: 'stores/new',
            lazy: async () => ({
              Component: (await import('../pages/stores/CreateStorePage')).CreateStorePage,
            }),
          },
          {
            path: 'stores/:storeSlug',
            lazy: async () => ({
              Component: (await import('../pages/stores/StoreManageLayout')).StoreManageLayout,
            }),
            children: [
              // Dashboard is the manage landing; Store Details lives at
              // /stores/{slug}/details.
              {
                index: true,
                lazy: async () => ({
                  Component: (await import('../pages/stores/StoreDashboardPage')).StoreDashboardPage,
                }),
              },
              {
                path: 'orders',
                lazy: async () => ({
                  Component: (await import('../pages/stores/StoreOrdersPage')).StoreOrdersPage,
                }),
              },
              {
                path: 'orders/:orderId',
                lazy: async () => ({
                  Component: (await import('../pages/stores/StoreOrderDetailPage')).StoreOrderDetailPage,
                }),
              },
              {
                path: 'details',
                lazy: async () => ({
                  Component: (await import('../pages/stores/StoreDetailsPage')).StoreDetailsPage,
                }),
              },
              {
                path: 'appearance',
                lazy: async () => ({
                  Component: (await import('../pages/stores/StoreAppearancePage')).StoreAppearancePage,
                }),
              },
              {
                path: 'homepage',
                lazy: async () => ({
                  Component: (await import('../pages/stores/StoreHomepagePage')).StoreHomepagePage,
                }),
              },
              {
                path: 'footer',
                lazy: async () => ({
                  Component: (await import('../pages/stores/StoreFooterPage')).StoreFooterPage,
                }),
              },
              {
                path: 'bank-accounts',
                lazy: async () => ({
                  Component: (await import('../pages/stores/StoreBankPage')).StoreBankPage,
                }),
              },
              {
                path: 'payments',
                lazy: async () => ({
                  Component: (await import('../pages/stores/StorePaymentsPage')).StorePaymentsPage,
                }),
              },
              {
                path: 'shipping',
                lazy: async () => ({
                  Component: (await import('../pages/stores/StoreShippingPage')).StoreShippingPage,
                }),
              },
              {
                path: 'checkout',
                lazy: async () => ({
                  Component: (await import('../pages/stores/StoreCheckoutPage')).StoreCheckoutPage,
                }),
              },
              {
                path: 'categories',
                lazy: async () => ({
                  Component: (await import('../pages/stores/StoreCategoriesPage')).StoreCategoriesPage,
                }),
              },
              {
                path: 'products',
                lazy: async () => ({
                  Component: (await import('../pages/stores/StoreProductsPage')).StoreProductsPage,
                }),
              },
            ],
          },
        ],
      },
    ],
  },

  // ---- Fallback -------------------------------------------------------------
  { path: '*', element: <Navigate to="/" replace /> },
])
