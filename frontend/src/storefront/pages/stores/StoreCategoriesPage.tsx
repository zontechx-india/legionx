import { useEffect, useState } from 'react'
import type { FormEvent } from 'react'
import { Link } from 'react-router-dom'
import { toApiError } from '../../../shared/auth/http'
import { ConfirmDialog } from '../../../shared/ui/ConfirmDialog'
import { ErrorNote, Select } from '../../../shared/ui/form'
import { storeCatalogApi } from '../../features/stores/storesApi'
import type { StoreCategory } from '../../features/stores/storesApi'
import { useManagedStore } from '../../features/stores/useManagedStore'
import {
  CheckIcon,
  ChevronDownIcon,
  CloseIcon,
  PencilIcon,
  PlusIcon,
  StarIcon,
  TagIcon,
  TrashIcon,
} from '../../layout/icons'
import { ActiveSwitch } from './ActiveSwitch'

/**
 * Categories section of the store manage page — first step of the
 * hierarchy Store → Category → Subcategory (optional) → Product →
 * Variants. Products can only be added once at least one category exists.
 * A category can optionally live inside a parent (one level only); the
 * list renders roots with their subcategories nested beneath.
 */
export function StoreCategoriesPage() {
  const { store } = useManagedStore()

  const [categories, setCategories] = useState<StoreCategory[] | null>(null)
  const [name, setName] = useState('')
  const [parentId, setParentId] = useState('')
  const [error, setError] = useState<string | null>(null)
  const [busy, setBusy] = useState(false)
  const [toDelete, setToDelete] = useState<StoreCategory | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [togglingId, setTogglingId] = useState<string | null>(null)

  // Which roots are expanded. Long catalogs collapse by default so the list
  // stays scannable; the choice is remembered per store.
  const expandKey = `storefront.categories.expanded.${store.id}`
  const [expanded, setExpanded] = useState<Set<string>>(() => {
    try {
      const raw = localStorage.getItem(`storefront.categories.expanded.${store.id}`)
      return new Set<string>(raw ? (JSON.parse(raw) as string[]) : [])
    } catch {
      return new Set<string>()
    }
  })

  const persistExpanded = (next: Set<string>) => {
    setExpanded(next)
    try {
      localStorage.setItem(expandKey, JSON.stringify([...next]))
    } catch {
      /* storage unavailable — expansion just won't persist */
    }
  }

  const toggleExpanded = (rootId: string) => {
    const next = new Set(expanded)
    if (next.has(rootId)) next.delete(rootId)
    else next.add(rootId)
    persistExpanded(next)
  }

  useEffect(() => {
    let cancelled = false
    storeCatalogApi
      .listCategories(store.id)
      .then((list) => {
        if (!cancelled) setCategories(list)
      })
      .catch((err) => {
        if (!cancelled) {
          setCategories([])
          setError(toApiError(err).message)
        }
      })
    return () => {
      cancelled = true
    }
  }, [store.id])

  const roots = (categories ?? []).filter((c) => c.parentId === null)
  const childrenOf = (rootId: string) =>
    (categories ?? []).filter((c) => c.parentId === rootId)

  const nestedRoots = roots.filter((root) => childrenOf(root.id).length > 0)
  const allExpanded =
    nestedRoots.length > 0 && nestedRoots.every((root) => expanded.has(root.id))

  const toggleAll = () =>
    persistExpanded(
      allExpanded ? new Set<string>() : new Set(nestedRoots.map((r) => r.id)),
    )

  const add = async (e: FormEvent) => {
    e.preventDefault()
    if (!name.trim()) return setError('Please enter a category name.')

    setError(null)
    setBusy(true)
    try {
      const category = await storeCatalogApi.createCategory(
        store.id,
        name.trim(),
        parentId || undefined,
      )
      setCategories((list) => [...(list ?? []), category])
      setName('')
      // Reveal the new subcategory instead of hiding it in a collapsed parent.
      if (category.parentId) {
        persistExpanded(new Set(expanded).add(category.parentId))
      }
    } catch (err) {
      setError(toApiError(err).message)
    } finally {
      setBusy(false)
    }
  }

  /** Inline rename. Returns false so the row keeps edit mode open on failure. */
  const rename = async (
    category: StoreCategory,
    nextName: string,
  ): Promise<boolean> => {
    const trimmed = nextName.trim()
    if (!trimmed) {
      setError('Category name cannot be empty.')
      return false
    }
    if (trimmed === category.name) return true // no-op, just close the editor

    setError(null)
    try {
      const updated = await storeCatalogApi.renameCategory(
        store.id,
        category.id,
        trimmed,
      )
      setCategories((list) =>
        (list ?? []).map((c) => (c.id === updated.id ? updated : c)),
      )
      return true
    } catch (err) {
      setError(toApiError(err).message)
      return false
    }
  }

  const toggleActive = async (category: StoreCategory, next: boolean) => {
    setError(null)
    setTogglingId(category.id)
    try {
      const updated = await storeCatalogApi.setCategoryActive(
        store.id,
        category.id,
        next,
      )
      setCategories((list) =>
        (list ?? []).map((c) => (c.id === updated.id ? updated : c)),
      )
    } catch (err) {
      setError(toApiError(err).message)
    } finally {
      setTogglingId(null)
    }
  }

  /**
   * Feature a root category in the storefront homepage's "Featured
   * Categories" row. With none featured the homepage falls back to showing
   * every top-level category, so this is curation rather than a requirement.
   */
  const toggleFeatured = async (category: StoreCategory, next: boolean) => {
    setError(null)
    // Optimistic — a star should flip instantly.
    setCategories((list) =>
      (list ?? []).map((c) =>
        c.id === category.id ? { ...c, isFeatured: next } : c,
      ),
    )
    try {
      const updated = await storeCatalogApi.setCategoryFeatured(
        store.id,
        category.id,
        next,
      )
      setCategories((list) =>
        (list ?? []).map((c) => (c.id === updated.id ? updated : c)),
      )
    } catch (err) {
      setError(toApiError(err).message)
      setCategories((list) =>
        (list ?? []).map((c) => (c.id === category.id ? category : c)),
      )
    }
  }

  const confirmDelete = async () => {
    if (!toDelete) return
    setDeleting(true)
    try {
      await storeCatalogApi.deleteCategory(store.id, toDelete.id)
      setCategories((list) => (list ?? []).filter((c) => c.id !== toDelete.id))
      setToDelete(null)
    } catch (err) {
      setError(toApiError(err).message)
      setToDelete(null)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div>
      <h2 className="font-body text-xl font-semibold tracking-normal text-fg">
        Categories
      </h2>
      <p className="mt-1 text-sm text-muted">
        Categories organize your catalog — optionally nested one level deep
        (e.g. Electronics → Mobiles). Add at least one, then you can start
        adding products.
      </p>

      {/* Add form */}
      <form
        onSubmit={add}
        className="mt-4 flex max-w-2xl flex-col gap-3 sm:flex-row"
        noValidate
      >
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="e.g. Cricket Bats"
          maxLength={60}
          className="h-11 w-full rounded-md border border-line bg-input px-4 text-sm text-fg outline-none transition-all placeholder:text-muted focus:border-accent"
        />
        <Select
          value={parentId}
          onChange={(e) => setParentId(e.target.value)}
          aria-label="Parent category"
          className="h-11"
          containerClassName="w-full sm:w-56 sm:shrink-0"
        >
          <option value="">Top-level category</option>
          {roots.map((root) => (
            <option key={root.id} value={root.id}>
              Inside “{root.name}”
            </option>
          ))}
        </Select>
        <button
          type="submit"
          disabled={busy}
          className="inline-flex h-11 shrink-0 items-center justify-center gap-1.5 rounded-md bg-brand-gradient px-4 text-sm font-semibold text-brand-contrast shadow-floating transition hover:opacity-90 disabled:cursor-not-allowed disabled:bg-none disabled:bg-line disabled:text-muted"
        >
          <PlusIcon className="h-4 w-4" />
          {busy ? 'Adding…' : 'Add'}
        </button>
      </form>

      {error && (
        <div className="mt-4 max-w-md">
          <ErrorNote>{error}</ErrorNote>
        </div>
      )}

      {/* Nested list: roots with their subcategories indented */}
      <div className="mt-4">
        {categories === null ? (
          <p className="text-sm text-muted">Loading categories…</p>
        ) : categories.length === 0 ? (
          <div className="flex flex-col items-center rounded-lg bg-surface-alt px-6 py-12 text-center">
            <div className="flex h-12 w-12 items-center justify-center rounded-md bg-surface text-brand shadow-floating">
              <TagIcon className="h-6 w-6" />
            </div>
            <p className="mt-4 text-sm font-medium text-fg">
              No categories yet
            </p>
            <p className="mt-1 max-w-sm text-sm text-muted">
              Add your first category above — products can only be added
              once a category exists.
            </p>
          </div>
        ) : (
          <>
            {nestedRoots.length > 0 && (
              <div className="mb-2 flex justify-end">
                <button
                  type="button"
                  onClick={toggleAll}
                  className="text-xs font-semibold text-muted transition-colors hover:text-fg"
                >
                  {allExpanded ? 'Collapse all' : 'Expand all'}
                </button>
              </div>
            )}
            <ul className="divide-y divide-line rounded-lg border border-line">
              {roots.map((root) => {
                const subs = childrenOf(root.id)
                const isExpanded = expanded.has(root.id)
                return (
                  <li key={root.id}>
                    <CategoryRow
                      category={root}
                      toggling={togglingId === root.id}
                      expandable={subs.length > 0}
                      isExpanded={isExpanded}
                      onToggleExpand={() => toggleExpanded(root.id)}
                      onToggle={(next) => toggleActive(root, next)}
                      onToggleFeatured={(next) => toggleFeatured(root, next)}
                      onDelete={() => setToDelete(root)}
                      onRename={(next) => rename(root, next)}
                    />
                    {isExpanded &&
                      subs.map((sub) => (
                        <CategoryRow
                          key={sub.id}
                          category={sub}
                          isSub
                          toggling={togglingId === sub.id}
                          onToggle={(next) => toggleActive(sub, next)}
                          onDelete={() => setToDelete(sub)}
                          onRename={(next) => rename(sub, next)}
                        />
                      ))}
                  </li>
                )
              })}
            </ul>
          </>
        )}
      </div>

      {categories !== null && categories.length > 0 && (
        <p className="mt-4 text-sm text-muted">
          Ready to sell?{' '}
          <Link
            to="../products"
            className="font-semibold text-brand hover:text-brand-hover"
          >
            Add products →
          </Link>
        </p>
      )}

      <ConfirmDialog
        open={toDelete !== null}
        title={toDelete?.parentId ? 'Delete subcategory?' : 'Delete category?'}
        description={
          toDelete ? (
            <>
              <span className="font-medium text-fg">{toDelete.name}</span>{' '}
              will be removed. Categories that still contain products or
              subcategories can't be deleted.
            </>
          ) : null
        }
        confirmLabel="Delete"
        busy={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setToDelete(null)}
      />
    </div>
  )
}

function CategoryRow({
  category,
  isSub = false,
  toggling,
  expandable = false,
  isExpanded = false,
  onToggleExpand,
  onToggle,
  onToggleFeatured,
  onDelete,
  onRename,
}: {
  category: StoreCategory
  isSub?: boolean
  toggling: boolean
  /** Root rows with subcategories get the expand/collapse chevron. */
  expandable?: boolean
  isExpanded?: boolean
  onToggleExpand?: () => void
  onToggle: (next: boolean) => void
  /** Root rows only — features the category on the storefront homepage. */
  onToggleFeatured?: (next: boolean) => void
  onDelete: () => void
  /** Resolves true when the rename succeeded (closes the editor). */
  onRename: (name: string) => Promise<boolean>
}) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState(category.name)
  const [saving, setSaving] = useState(false)

  const startEdit = () => {
    setDraft(category.name)
    setEditing(true)
  }
  const cancelEdit = () => {
    setDraft(category.name)
    setEditing(false)
  }
  const save = async () => {
    setSaving(true)
    const done = await onRename(draft)
    setSaving(false)
    if (done) setEditing(false)
  }

  const meta: string[] = [
    `${category.productCount} ${category.productCount === 1 ? 'product' : 'products'}`,
  ]
  if (!isSub && category.subcategoryCount > 0) {
    meta.push(
      `${category.subcategoryCount} ${category.subcategoryCount === 1 ? 'subcategory' : 'subcategories'}`,
    )
  }

  return (
    // Root content starts at 48px (pl-4 + the 20px chevron slot + 12px gap), so
    // subcategories need to clear that before their own indent reads as nested.
    <div
      className={`flex items-center gap-3 py-3 pr-4 ${isSub ? 'pl-18' : 'pl-4'}`}
    >
      {/* Expand/collapse — a fixed-width slot keeps every row aligned. */}
      {!isSub && (
        <div className="w-5 shrink-0">
          {expandable && (
            <button
              type="button"
              onClick={onToggleExpand}
              aria-expanded={isExpanded}
              aria-label={`${isExpanded ? 'Collapse' : 'Expand'} ${category.name}`}
              className="flex h-5 w-5 items-center justify-center rounded-sm text-muted transition-colors hover:text-fg"
            >
              <ChevronDownIcon
                className={`h-4 w-4 transition-transform ${
                  isExpanded ? '' : '-rotate-90'
                }`}
              />
            </button>
          )}
        </div>
      )}

      <div
        className={`flex shrink-0 items-center justify-center rounded-md ${
          isSub ? 'h-7 w-7' : 'h-9 w-9'
        } ${
          category.isActive
            ? 'bg-brand/10 text-brand'
            : 'bg-surface-alt text-muted'
        }`}
      >
        <TagIcon className={isSub ? 'h-3.5 w-3.5' : 'h-4 w-4'} />
      </div>

      {editing ? (
        <div className="flex min-w-0 flex-1 items-center gap-2">
          <input
            value={draft}
            onChange={(e) => setDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                e.preventDefault()
                void save()
              } else if (e.key === 'Escape') {
                e.preventDefault()
                cancelEdit()
              }
            }}
            maxLength={60}
            autoFocus
            aria-label={`Rename ${category.name}`}
            className="h-9 w-full min-w-0 rounded-md border border-line bg-input px-3 text-sm text-fg outline-none focus:border-accent"
          />
          <button
            type="button"
            onClick={() => void save()}
            disabled={saving}
            aria-label="Save name"
            className="rounded-md p-2 text-success transition hover:bg-success/10 disabled:text-muted"
          >
            <CheckIcon className="h-4 w-4" />
          </button>
          <button
            type="button"
            onClick={cancelEdit}
            disabled={saving}
            aria-label="Cancel rename"
            className="rounded-md p-2 text-muted transition hover:bg-surface-alt hover:text-fg disabled:text-muted"
          >
            <CloseIcon className="h-4 w-4" />
          </button>
        </div>
      ) : (
        <>
          <div className="min-w-0 flex-1">
            <p
              className={`truncate text-sm font-semibold ${
                category.isActive ? 'text-fg' : 'text-muted'
              }`}
            >
              {category.name}
              {isSub && (
                <span className="ml-1.5 rounded-sm bg-surface-alt px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted">
                  Sub
                </span>
              )}
            </p>
            <p className="text-xs text-muted">
              {meta.join(' · ')}
              {!category.isActive && (
                <span className="ml-1.5 rounded-sm bg-surface-alt px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-muted">
                  Disabled
                </span>
              )}
            </p>
          </div>
          {/* Featuring only applies to top-level categories — the homepage
              row shows roots, never subcategories. */}
          {!isSub && onToggleFeatured && (
            <button
              type="button"
              onClick={() => onToggleFeatured(!category.isFeatured)}
              aria-pressed={category.isFeatured}
              title={
                category.isFeatured
                  ? 'Featured on the storefront homepage'
                  : 'Feature on the storefront homepage'
              }
              aria-label={`${category.isFeatured ? 'Unfeature' : 'Feature'} ${category.name}`}
              className={`rounded-md p-2 transition hover:bg-surface-alt ${
                category.isFeatured
                  ? 'text-brand'
                  : 'text-muted hover:text-fg'
              }`}
            >
              <StarIcon className="h-4 w-4" filled={category.isFeatured} />
            </button>
          )}
          <button
            type="button"
            onClick={startEdit}
            className="rounded-md p-2 text-muted transition hover:bg-surface-alt hover:text-fg"
            aria-label={`Rename ${category.name}`}
          >
            <PencilIcon className="h-4 w-4" />
          </button>
          <ActiveSwitch
            checked={category.isActive}
            disabled={toggling}
            label={`${category.isActive ? 'Disable' : 'Enable'} ${category.name}`}
            onChange={onToggle}
          />
          <button
            type="button"
            onClick={onDelete}
            className="rounded-md p-2 text-muted transition hover:bg-danger/10 hover:text-danger"
            aria-label={`Delete ${category.name}`}
          >
            <TrashIcon className="h-4 w-4" />
          </button>
        </>
      )}
    </div>
  )
}
