import { useSearchParams } from 'react-router-dom'
import { SECTION_TITLES, type PublicSection } from '../../features/stores/storesApi'
import { usePublicStore } from '../../features/publicStore/PublicStoreLayout'
import { usePageTitle } from '../../../shared/usePageTitle'
import { ProductListing } from '../../features/publicStore/ProductListing'

/**
 * `/store/{storeSlug}/shop` — browse the whole catalog. Also the destination
 * for the header search (`?q=…`) and the homepage "View all" links
 * (`?section=featured|newArrivals|bestSellers`).
 *
 * One page serves all three because they are the same thing at a different
 * scope: the full store listing, sorted and filtered server-side. With `?q=`
 * it matches product name + description (respecting each product's "Hide from
 * Search" flag); with `?section=` it shows exactly the products the owner
 * flagged for that merchandising row; without either, everything shoppable.
 */
export function StoreShopPage() {
  const { store, skin } = usePublicStore()
  const [params] = useSearchParams()
  const q = params.get('q')?.trim() ?? ''

  // Unknown section values (hand-edited URLs) just mean "no section scope".
  const rawSection = params.get('section') ?? ''
  const section: PublicSection | undefined =
    rawSection in SECTION_TITLES ? (rawSection as PublicSection) : undefined

  const title = q
    ? `Results for “${q}”`
    : section
      ? SECTION_TITLES[section]
      : 'All Products'
  usePageTitle(
    q ? `Search “${q}”` : section ? SECTION_TITLES[section] : 'Shop',
    store.name,
  )

  return (
    <ProductListing
      store={store}
      skin={skin}
      title={title}
      trail={[{ label: q ? 'Search' : section ? SECTION_TITLES[section] : 'All Products' }]}
      q={q || undefined}
      section={q ? undefined : section}
    />
  )
}
