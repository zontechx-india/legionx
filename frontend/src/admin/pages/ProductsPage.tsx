import { useState } from 'react'
import { adminApi } from '../features/adminApi'
import type { ProductRow } from '../features/adminApi'
import { useAdminList } from '../features/useAdminQuery'
import { ConfirmDialog } from '../../shared/ui/ConfirmDialog'
import { Button, Card, Chip, PageHeader, TextArea } from '../ui/primitives'
import { DataTable, Pagination } from '../ui/DataTable'
import type { Column } from '../ui/DataTable'
import { SearchInput, Tabs, Toolbar } from '../ui/Toolbar'
import { ActiveChip } from '../ui/statusMeta'
import { formatCount, formatPriceRange } from '../ui/format'

/**
 * The catalog across every store — inventory oversight plus the one
 * moderation lever the platform holds.
 *
 * The console does NOT edit a seller's product: name, price and stock are
 * theirs. It can only **hide** a listing that breaks the rules, which flips
 * the very same `isActive` flag the seller toggles — one visibility rule in
 * the system, not two that can contradict each other.
 *
 * Hiding always asks for a reason, because the seller is told what happened
 * the moment it does, and "your product was hidden" with no explanation is
 * a support ticket by construction.
 */

const TABS = [
  { value: '', label: 'All' },
  { value: 'ACTIVE', label: 'Visible' },
  { value: 'DISABLED', label: 'Hidden' },
  { value: 'LOW_STOCK', label: 'Low stock' },
  { value: 'OUT_OF_STOCK', label: 'Out of stock' },
] as const

export default function ProductsPage() {
  const list = useAdminList<ProductRow>((query) => adminApi.listProducts(query), {
    keys: ['q', 'status', 'storeId'],
  })
  const [target, setTarget] = useState<ProductRow | null>(null)
  const [reason, setReason] = useState('')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const submit = async () => {
    if (!target) return
    setBusy(true)
    setError(null)
    try {
      await adminApi.setProductVisibility(target.id, {
        isActive: !target.isActive,
        reason: reason.trim() || null,
      })
      setTarget(null)
      setReason('')
      list.refresh()
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not update the product')
    } finally {
      setBusy(false)
    }
  }

  const columns: Column<ProductRow>[] = [
    {
      header: 'Product',
      primary: true,
      cell: (product) => (
        <div className="flex min-w-0 items-center gap-2.5">
          {product.imageUrl ? (
            <img
              src={product.imageUrl}
              alt=""
              className="h-9 w-9 shrink-0 rounded-md border border-line object-cover"
              loading="lazy"
            />
          ) : (
            <span className="h-9 w-9 shrink-0 rounded-md bg-surface-alt" aria-hidden />
          )}
          <div className="min-w-0">
            <p className="truncate font-medium text-fg">{product.name}</p>
            <p className="truncate text-xs text-muted">{product.category.name}</p>
          </div>
        </div>
      ),
    },
    {
      header: 'Store',
      cell: (product) => <span className="truncate text-sm">{product.store.name}</span>,
    },
    {
      header: 'Price',
      cell: (product) => (
        <span className="text-sm">{formatPriceRange(product.priceMin, product.priceMax)}</span>
      ),
    },
    {
      header: 'Stock',
      className: 'text-right',
      cell: (product) =>
        product.stockTotal === 0 ? (
          <Chip tone="danger">Out of stock</Chip>
        ) : product.stockTotal <= 5 ? (
          <Chip tone="warning">{product.stockTotal} left</Chip>
        ) : (
          <span className="text-sm">{formatCount(product.stockTotal)}</span>
        ),
    },
    {
      header: 'Options',
      hideOnMobile: true,
      cell: (product) => (
        <span className="text-sm text-muted">
          {product.variantCount > 0 ? `${product.variantCount} variants` : 'Single'}
        </span>
      ),
    },
    { header: 'Visibility', cell: (product) => <ActiveChip isActive={product.isActive} /> },
    {
      header: '',
      className: 'text-right',
      hideOnMobile: true,
      cell: (product) => (
        <Button
          variant={product.isActive ? 'danger' : 'secondary'}
          onClick={(event) => {
            event.stopPropagation()
            setTarget(product)
            setReason('')
            setError(null)
          }}
        >
          {product.isActive ? 'Hide' : 'Restore'}
        </Button>
      ),
    },
  ]

  return (
    <>
      <PageHeader
        title="Products"
        subtitle="Seller listings across every store — inventory and moderation"
      />

      <Card padded={false}>
        <Tabs
          value={list.filters['status'] ?? ''}
          onChange={(value) => list.setFilter('status', value)}
          options={[...TABS]}
        />
        <Toolbar>
          <SearchInput
            value={list.filters['q'] ?? ''}
            onChange={(value) => list.setFilter('q', value)}
            placeholder="Product or store name…"
          />
        </Toolbar>

        <DataTable
          rows={list.rows}
          columns={columns}
          rowKey={(product) => product.id}
          loading={list.loading}
          error={list.error}
          onRetry={list.refresh}
          empty={{ title: 'No products match these filters' }}
        />
        <Pagination
          page={list.meta.page}
          totalPages={list.meta.totalPages}
          total={list.meta.total}
          onPage={list.setPage}
          busy={list.loading}
        />
      </Card>

      <ConfirmDialog
        open={target !== null}
        busy={busy}
        title={target?.isActive ? 'Hide this product?' : 'Restore this product?'}
        tone={target?.isActive ? 'danger' : 'neutral'}
        confirmLabel={target?.isActive ? 'Hide product' : 'Restore product'}
        description={
          <div className="space-y-3">
            <p>
              {target?.isActive ? (
                <>
                  <strong className="text-fg">{target?.name}</strong> will disappear from{' '}
                  {target?.store.name} immediately, and the seller will be notified.
                </>
              ) : (
                <>
                  <strong className="text-fg">{target?.name}</strong> will be visible on{' '}
                  {target?.store.name} again.
                </>
              )}
            </p>
            {target?.isActive ? (
              <TextArea
                label="Reason for the seller"
                value={reason}
                onChange={(event) => setReason(event.target.value)}
                placeholder="e.g. Listing images don't match the product"
                maxLength={300}
              />
            ) : null}
            {error ? <p className="text-sm text-danger">{error}</p> : null}
          </div>
        }
        onCancel={() => setTarget(null)}
        onConfirm={() => void submit()}
      />
    </>
  )
}
