import { useRef, useState } from 'react'
import { toApiError } from '../../../shared/auth/http'
import { ImageCropDialog } from '../../../shared/media/ImageCropDialog'
import {
  acceptAttr,
  ruleHint,
  useMediaConfig,
  validateFile,
} from '../../../shared/media/mediaConfig'
import { ConfirmDialog } from '../../../shared/ui/ConfirmDialog'
import { ErrorNote } from '../../../shared/ui/form'
import { storeCatalogApi } from '../../features/stores/storesApi'
import type {
  StoreProduct,
  StoreProductMediaItem,
} from '../../features/stores/storesApi'
import { ImageIcon, PlusIcon, TrashIcon } from '../../layout/icons'

/** Mirror of the backend limits (also enforced server-side). */
const MAX_IMAGES = 8

/**
 * Media panel of a product row — up to 8 images (drag to reorder, the FIRST
 * one is the cover) and one optional video. Flow per image:
 * pick/drop → validate (size/type from the server's media config) → crop
 * (1:1) → upload as WebP with a progress bar; failures stay in the list with
 * a Retry that reuses the already-cropped blob. Videos skip the crop.
 * Every mutation returns the full parent product, so the page swaps one row.
 */
export function ProductMediaManager({
  storeId,
  product,
  onProductChange,
}: {
  storeId: string
  product: StoreProduct
  onProductChange: (product: StoreProduct) => void
}) {
  const config = useMediaConfig()
  const imageInputRef = useRef<HTMLInputElement>(null)
  const videoInputRef = useRef<HTMLInputElement>(null)
  const replaceImageInputRef = useRef<HTMLInputElement>(null)

  const images = product.media.filter((m) => m.type === 'IMAGE')
  const video = product.media.find((m) => m.type === 'VIDEO') ?? null

  const [error, setError] = useState<string | null>(null)
  /** Files picked but not yet cropped — the dialog walks this queue. */
  const [cropQueue, setCropQueue] = useState<File[]>([])
  /** Image id a picked file will REPLACE (null = new upload). */
  const [replaceTarget, setReplaceTarget] = useState<string | null>(null)
  const [uploads, setUploads] = useState<PendingUpload[]>([])
  const [toDelete, setToDelete] = useState<StoreProductMediaItem | null>(null)
  const [deleting, setDeleting] = useState(false)
  const [altFor, setAltFor] = useState<StoreProductMediaItem | null>(null)
  const [dragId, setDragId] = useState<string | null>(null)

  /** Uploads run one at a time so product snapshots never race each other. */
  const chain = useRef(Promise.resolve())

  const patchUpload = (id: string, patch: Partial<PendingUpload>) =>
    setUploads((list) =>
      list.map((u) => (u.id === id ? { ...u, ...patch } : u)),
    )

  const runUpload = (item: PendingUpload) => {
    chain.current = chain.current.then(async () => {
      patchUpload(item.id, { status: 'uploading', progress: 0, error: undefined })
      try {
        const updated = item.replaceId
          ? await storeCatalogApi.replaceProductMediaFile(
              storeId,
              product.id,
              item.replaceId,
              item.blob,
              item.filename,
              (fraction) => patchUpload(item.id, { progress: fraction }),
            )
          : await storeCatalogApi.addProductMedia(
              storeId,
              product.id,
              item.blob,
              item.filename,
              (fraction) => patchUpload(item.id, { progress: fraction }),
            )
        onProductChange(updated)
        setUploads((list) => list.filter((u) => u.id !== item.id))
      } catch (err) {
        patchUpload(item.id, {
          status: 'failed',
          error: toApiError(err).message,
        })
      }
    })
  }

  const startUpload = (
    blob: Blob,
    filename: string,
    replaceId: string | null,
  ) => {
    const item: PendingUpload = {
      id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
      filename,
      blob,
      replaceId,
      status: 'uploading',
      progress: 0,
    }
    setUploads((list) => [...list, item])
    runUpload(item)
  }

  // ---- picking ------------------------------------------------------------

  const pickImages = (files: FileList | null) => {
    if (!files || !config) return
    setError(null)
    const room = MAX_IMAGES - images.length - uploads.filter((u) => !u.replaceId).length
    const picked = [...files]
    if (picked.length > room) {
      setError(
        room <= 0
          ? `This product already has the maximum of ${MAX_IMAGES} images.`
          : `Only ${room} more image${room === 1 ? '' : 's'} can be added (max ${MAX_IMAGES}).`,
      )
      if (room <= 0) return
    }
    const accepted: File[] = []
    for (const file of picked.slice(0, Math.max(room, 0))) {
      const problem = validateFile(file, config.image)
      if (problem) return setError(problem)
      accepted.push(file)
    }
    setReplaceTarget(null)
    setCropQueue((queue) => [...queue, ...accepted])
  }

  const pickReplacementImage = (file: File | undefined) => {
    if (!file || !config || !replaceTarget) return
    setError(null)
    const problem = validateFile(file, config.image)
    if (problem) return setError(problem)
    setCropQueue([file])
  }

  const pickVideo = (file: File | undefined, replaceId: string | null) => {
    if (!file || !config) return
    setError(null)
    const problem = validateFile(file, config.video)
    if (problem) return setError(problem)
    // Videos are uploaded as-is (no crop).
    startUpload(file, file.name, replaceId)
  }

  // ---- crop dialog ----------------------------------------------------------

  const cropped = (blob: Blob, filename: string) => {
    startUpload(blob, filename, replaceTarget)
    setReplaceTarget(null)
    setCropQueue((queue) => queue.slice(1))
  }

  // ---- reorder --------------------------------------------------------------

  const commitOrder = async (ordered: StoreProductMediaItem[]) => {
    setError(null)
    // Optimistic: paint the new order immediately, revert on failure.
    const optimistic = {
      ...product,
      media: [...ordered, ...(video ? [video] : [])],
    }
    onProductChange(optimistic)
    try {
      onProductChange(
        await storeCatalogApi.reorderProductMedia(
          storeId,
          product.id,
          ordered.map((m) => m.id),
        ),
      )
    } catch (err) {
      onProductChange(product)
      setError(toApiError(err).message)
    }
  }

  const move = (index: number, delta: number) => {
    const target = index + delta
    if (target < 0 || target >= images.length) return
    const next = [...images]
    const [item] = next.splice(index, 1)
    next.splice(target, 0, item!)
    void commitOrder(next)
  }

  const dropOn = (targetId: string) => {
    if (!dragId || dragId === targetId) return
    const from = images.findIndex((m) => m.id === dragId)
    const to = images.findIndex((m) => m.id === targetId)
    if (from < 0 || to < 0) return
    const next = [...images]
    const [item] = next.splice(from, 1)
    next.splice(to, 0, item!)
    void commitOrder(next)
  }

  // ---- delete ---------------------------------------------------------------

  const confirmDelete = async () => {
    if (!toDelete) return
    setDeleting(true)
    setError(null)
    try {
      onProductChange(
        await storeCatalogApi.deleteProductMedia(
          storeId,
          product.id,
          toDelete.id,
        ),
      )
      setToDelete(null)
    } catch (err) {
      setError(toApiError(err).message)
      setToDelete(null)
    } finally {
      setDeleting(false)
    }
  }

  return (
    <div className="border-t border-line bg-surface-alt/40 px-4 py-4">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-xs font-bold uppercase tracking-wide text-muted">
          Photos & video
        </p>
        <p className="text-[11px] text-muted">
          {config
            ? `Images: ${ruleHint(config.image)} · Video: ${ruleHint(config.video)}`
            : 'Loading upload rules…'}
        </p>
      </div>

      {/* Image grid — drag (or ‹ ›) to reorder; the first image is the cover. */}
      <ul className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
        {images.map((item, index) => (
          <li
            key={item.id}
            draggable
            onDragStart={() => setDragId(item.id)}
            onDragEnd={() => setDragId(null)}
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault()
              dropOn(item.id)
            }}
            className={`group relative aspect-square overflow-hidden rounded-md border bg-surface ${
              dragId === item.id ? 'border-accent opacity-60' : 'border-line'
            }`}
          >
            {item.url && (
              <img
                src={item.url}
                alt={item.altText ?? `Product image ${index + 1}`}
                loading="lazy"
                className="h-full w-full cursor-grab object-cover"
              />
            )}
            {index === 0 && (
              <span className="absolute left-1 top-1 rounded-sm bg-brand px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-brand-contrast">
                Cover
              </span>
            )}

            {/* Hover / focus toolbar */}
            <div className="absolute inset-x-0 bottom-0 flex items-center justify-center gap-0.5 bg-black/55 py-1 opacity-0 transition group-hover:opacity-100 group-focus-within:opacity-100">
              <TileButton
                label={`Move ${item.altText ?? 'image'} left`}
                disabled={index === 0}
                onClick={() => move(index, -1)}
              >
                ‹
              </TileButton>
              <TileButton
                label="Set alt text"
                onClick={() => setAltFor(item)}
              >
                Alt
              </TileButton>
              <TileButton
                label="Replace image"
                onClick={() => {
                  setReplaceTarget(item.id)
                  replaceImageInputRef.current?.click()
                }}
              >
                ⇄
              </TileButton>
              <TileButton
                label="Delete image"
                onClick={() => setToDelete(item)}
              >
                <TrashIcon className="h-3 w-3" />
              </TileButton>
              <TileButton
                label={`Move ${item.altText ?? 'image'} right`}
                disabled={index === images.length - 1}
                onClick={() => move(index, 1)}
              >
                ›
              </TileButton>
            </div>
          </li>
        ))}

        {/* In-flight uploads */}
        {uploads
          .filter((u) => !u.replaceId || u.status === 'failed')
          .map((item) => (
            <li
              key={item.id}
              className={`flex aspect-square flex-col items-center justify-center gap-1.5 rounded-md border px-1 text-center ${
                item.status === 'failed'
                  ? 'border-danger/50 bg-danger/5'
                  : 'border-dashed border-line bg-surface'
              }`}
            >
              {item.status === 'failed' ? (
                <>
                  <p className="line-clamp-2 text-[10px] text-danger">
                    {item.error ?? 'Upload failed'}
                  </p>
                  <div className="flex gap-1">
                    <button
                      type="button"
                      onClick={() => runUpload(item)}
                      className="rounded-sm bg-brand px-1.5 py-0.5 text-[10px] font-bold text-brand-contrast"
                    >
                      Retry
                    </button>
                    <button
                      type="button"
                      onClick={() =>
                        setUploads((list) =>
                          list.filter((u) => u.id !== item.id),
                        )
                      }
                      className="rounded-sm border border-line px-1.5 py-0.5 text-[10px] font-semibold text-muted"
                    >
                      Discard
                    </button>
                  </div>
                </>
              ) : (
                <>
                  <p className="w-full truncate px-1 text-[10px] text-muted">
                    {item.filename}
                  </p>
                  <div className="h-1 w-4/5 overflow-hidden rounded-pill bg-surface-alt">
                    <div
                      className="h-full rounded-pill bg-brand transition-[width]"
                      style={{ width: `${Math.round(item.progress * 100)}%` }}
                    />
                  </div>
                </>
              )}
            </li>
          ))}

        {/* Add tile — multi-select and drag-and-drop both work. */}
        {images.length + uploads.filter((u) => !u.replaceId).length <
          MAX_IMAGES && (
          <li
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault()
              pickImages(e.dataTransfer.files)
            }}
          >
            <button
              type="button"
              onClick={() => imageInputRef.current?.click()}
              disabled={!config}
              className="flex aspect-square w-full flex-col items-center justify-center gap-1 rounded-md border-2 border-dashed border-line text-muted transition hover:border-accent hover:text-fg disabled:cursor-not-allowed"
            >
              <PlusIcon className="h-4 w-4" />
              <span className="text-[10px] font-semibold">
                Add ({images.length}/{MAX_IMAGES})
              </span>
            </button>
          </li>
        )}
      </ul>
      <p className="mt-2 text-[11px] text-muted">
        Drag to reorder — the first image is the cover your customers see on
        listings. Drop files on the + tile to upload several at once.
      </p>

      {/* Video — one slot: upload, replace or delete. No crop. */}
      <div className="mt-4 flex flex-wrap items-center gap-3">
        <p className="text-xs font-bold uppercase tracking-wide text-muted">
          Video
        </p>
        {video?.url ? (
          <>
            <video
              src={video.url}
              controls
              preload="metadata"
              className="h-20 rounded-md border border-line bg-black"
            />
            <button
              type="button"
              onClick={() => videoInputRef.current?.click()}
              className="h-8 rounded-md border border-line bg-surface px-3 text-xs font-semibold text-fg transition hover:bg-surface-alt"
            >
              Replace
            </button>
            <button
              type="button"
              onClick={() => setToDelete(video)}
              className="h-8 rounded-md px-2.5 text-xs font-semibold text-danger transition hover:bg-danger/10"
            >
              Delete
            </button>
          </>
        ) : uploads.some((u) => u.replaceId === null && isVideoName(u.filename)) ? null : (
          <button
            type="button"
            onClick={() => videoInputRef.current?.click()}
            disabled={!config}
            className="inline-flex h-8 items-center gap-1.5 rounded-md border border-dashed border-line px-3 text-xs font-semibold text-muted transition hover:border-accent hover:text-fg disabled:cursor-not-allowed"
          >
            <ImageIcon className="h-3.5 w-3.5" />
            Add a video
          </button>
        )}
      </div>

      {error && (
        <div className="mt-3">
          <ErrorNote>{error}</ErrorNote>
        </div>
      )}

      {/* Hidden pickers */}
      <input
        ref={imageInputRef}
        type="file"
        multiple
        accept={config ? acceptAttr(config.image) : 'image/*'}
        className="hidden"
        onChange={(e) => {
          pickImages(e.target.files)
          e.target.value = ''
        }}
      />
      <input
        ref={replaceImageInputRef}
        type="file"
        accept={config ? acceptAttr(config.image) : 'image/*'}
        className="hidden"
        onChange={(e) => {
          pickReplacementImage(e.target.files?.[0])
          e.target.value = ''
        }}
      />
      <input
        ref={videoInputRef}
        type="file"
        accept={config ? acceptAttr(config.video) : 'video/*'}
        className="hidden"
        onChange={(e) => {
          pickVideo(e.target.files?.[0], video?.id ?? null)
          e.target.value = ''
        }}
      />

      {/* Crop-before-upload — walks the picked queue one file at a time. */}
      {cropQueue[0] && (
        <ImageCropDialog
          file={cropQueue[0]}
          aspect={1}
          title={
            replaceTarget
              ? 'Crop replacement image'
              : `Crop image${cropQueue.length > 1 ? ` (${cropQueue.length} left)` : ''}`
          }
          onCancel={() => {
            setCropQueue((queue) => queue.slice(1))
            setReplaceTarget(null)
          }}
          onCropped={cropped}
        />
      )}

      {altFor && (
        <AltTextDialog
          item={altFor}
          storeId={storeId}
          productId={product.id}
          onClose={() => setAltFor(null)}
          onProductChange={onProductChange}
        />
      )}

      <ConfirmDialog
        open={toDelete !== null}
        title={toDelete?.type === 'VIDEO' ? 'Delete video?' : 'Delete image?'}
        description={
          toDelete?.type === 'VIDEO'
            ? 'The video will be removed from this product.'
            : 'The image will be removed from this product. If it was the cover, the next image becomes the cover.'
        }
        confirmLabel="Delete"
        busy={deleting}
        onConfirm={confirmDelete}
        onCancel={() => setToDelete(null)}
      />
    </div>
  )
}

interface PendingUpload {
  id: string
  filename: string
  blob: Blob
  /** Media id being replaced, or null for a fresh upload. */
  replaceId: string | null
  status: 'uploading' | 'failed'
  progress: number
  error?: string
}

function isVideoName(filename: string): boolean {
  return /\.(mp4|webm|mov)$/i.test(filename)
}

function TileButton({
  label,
  disabled,
  onClick,
  children,
}: {
  label: string
  disabled?: boolean
  onClick: () => void
  children: React.ReactNode
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={label}
      title={label}
      className="flex h-6 min-w-6 items-center justify-center rounded-sm px-1 text-[10px] font-bold text-white transition hover:bg-white/20 disabled:opacity-30"
    >
      {children}
    </button>
  )
}

/** Small dialog for the optional alt text (accessibility) of one image. */
function AltTextDialog({
  item,
  storeId,
  productId,
  onClose,
  onProductChange,
}: {
  item: StoreProductMediaItem
  storeId: string
  productId: string
  onClose: () => void
  onProductChange: (product: StoreProduct) => void
}) {
  const [value, setValue] = useState(item.altText ?? '')
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const save = async () => {
    setBusy(true)
    setError(null)
    try {
      onProductChange(
        await storeCatalogApi.updateProductMediaAlt(
          storeId,
          productId,
          item.id,
          value.trim() || null,
        ),
      )
      onClose()
    } catch (err) {
      setError(toApiError(err).message)
      setBusy(false)
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      role="dialog"
      aria-modal="true"
      aria-label="Image alt text"
    >
      <div className="w-full max-w-sm rounded-lg bg-surface p-5 shadow-floating">
        <h3 className="font-body text-lg font-semibold tracking-normal text-fg">Image alt text</h3>
        <p className="mt-1 text-xs text-muted">
          Describes the image for screen readers and when it cannot load.
          Leave empty to clear.
        </p>
        {item.url && (
          <img
            src={item.url}
            alt=""
            className="mt-3 h-24 w-24 rounded-md border border-line object-cover"
          />
        )}
        <input
          value={value}
          onChange={(e) => setValue(e.target.value)}
          maxLength={200}
          placeholder="e.g. Red cricket bat, front view"
          autoFocus
          className="mt-3 h-10 w-full rounded-md border border-line bg-input px-3 text-sm text-fg outline-none transition placeholder:text-muted focus:border-accent"
        />
        {error && <p className="mt-2 text-sm text-danger">{error}</p>}
        <div className="mt-4 flex justify-end gap-3">
          <button
            type="button"
            onClick={onClose}
            disabled={busy}
            className="h-9 rounded-md border border-line bg-surface px-3.5 text-sm font-semibold text-fg transition hover:bg-surface-alt disabled:text-muted"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={save}
            disabled={busy}
            className="h-9 rounded-md bg-brand-gradient px-4 text-sm font-semibold text-brand-contrast transition hover:opacity-90 disabled:bg-none disabled:bg-line disabled:text-muted"
          >
            {busy ? 'Saving…' : 'Save'}
          </button>
        </div>
      </div>
    </div>
  )
}
