import { useEffect, useRef, useState } from 'react'
import { ImageCropDialog } from '../../../shared/media/ImageCropDialog'
import {
  acceptAttr,
  ruleHint,
  useMediaConfig,
  validateFile,
} from '../../../shared/media/mediaConfig'
import { ErrorNote } from '../../../shared/ui/form'
import { CloseIcon, PlusIcon } from '../../layout/icons'

/** Mirror of the backend limit (also enforced server-side). */
export const MAX_NEW_PRODUCT_PHOTOS = 8

/**
 * A photo picked and cropped in the Add Product form but not yet uploaded —
 * the product it belongs to does not exist yet.
 */
export interface PendingPhoto {
  id: string
  /** Cropped 1:1 WebP, ready for the multipart upload. */
  blob: Blob
  filename: string
  /** Object URL for the local thumbnail — revoked when the photo is dropped. */
  previewUrl: string
}

/**
 * Photo picker for the **Add Product** form.
 *
 * Media uploads need a product id (`POST …/products/:productId/media`), so at
 * add time there is nothing to upload to yet. Files are therefore validated
 * and cropped **locally** here and held as blobs; `AddProductForm` uploads
 * them right after the product is created — the same deferred-upload shape
 * `CreateStorePage` uses for a new store's logo.
 *
 * Deliberately smaller than `ProductMediaManager`: pick, drop, set the cover,
 * remove. Reordering beyond the cover, alt text and the video live in the
 * row's Photos & video panel, which owns real media rows once the product
 * exists.
 */
export function NewProductPhotos({
  photos,
  onChange,
  disabled = false,
}: {
  photos: PendingPhoto[]
  onChange: (photos: PendingPhoto[]) => void
  /** True while the form is submitting — picking more would be ignored. */
  disabled?: boolean
}) {
  const config = useMediaConfig()
  const inputRef = useRef<HTMLInputElement>(null)
  const [error, setError] = useState<string | null>(null)
  /** Files picked but not yet cropped — the dialog walks this queue. */
  const [cropQueue, setCropQueue] = useState<File[]>([])

  /**
   * Revoke every preview URL when the form goes away (submitted or
   * cancelled). A ref, because the cleanup must see the LAST list, not the
   * one captured when the effect first ran.
   */
  const latest = useRef(photos)
  latest.current = photos
  useEffect(
    () => () => {
      for (const photo of latest.current) URL.revokeObjectURL(photo.previewUrl)
    },
    [],
  )

  const pick = (files: FileList | null) => {
    if (!files || !config || disabled) return
    setError(null)
    const room = MAX_NEW_PRODUCT_PHOTOS - photos.length - cropQueue.length
    const picked = [...files]
    if (room <= 0) {
      return setError(
        `You can add up to ${MAX_NEW_PRODUCT_PHOTOS} photos here — more can be added after the product is created.`,
      )
    }
    if (picked.length > room) {
      setError(
        `Only ${room} more photo${room === 1 ? '' : 's'} can be added (max ${MAX_NEW_PRODUCT_PHOTOS}).`,
      )
    }
    const accepted: File[] = []
    for (const file of picked.slice(0, room)) {
      const problem = validateFile(file, config.image)
      if (problem) return setError(problem)
      accepted.push(file)
    }
    setCropQueue((queue) => [...queue, ...accepted])
  }

  const cropped = (blob: Blob, filename: string) => {
    onChange([
      ...photos,
      {
        id: `${Date.now()}-${Math.random().toString(36).slice(2)}`,
        blob,
        filename,
        previewUrl: URL.createObjectURL(blob),
      },
    ])
    setCropQueue((queue) => queue.slice(1))
  }

  const remove = (photo: PendingPhoto) => {
    URL.revokeObjectURL(photo.previewUrl)
    onChange(photos.filter((p) => p.id !== photo.id))
  }

  /** Promote to first — the first photo is the cover on every listing. */
  const makeCover = (photo: PendingPhoto) =>
    onChange([photo, ...photos.filter((p) => p.id !== photo.id)])

  return (
    <div>
      <div className="mb-2 flex flex-wrap items-baseline justify-between gap-2">
        <span className="text-sm font-medium text-muted">
          Photos <span className="font-normal">(optional)</span>
        </span>
        <span className="text-[11px] text-muted">
          {config ? ruleHint(config.image) : 'Loading upload rules…'}
        </span>
      </div>

      <ul className="grid grid-cols-3 gap-2 sm:grid-cols-4 md:grid-cols-6">
        {photos.map((photo, index) => (
          <li
            key={photo.id}
            className="group relative aspect-square overflow-hidden rounded-md border border-line bg-surface"
          >
            <img
              src={photo.previewUrl}
              alt=""
              className="h-full w-full object-cover"
            />
            {index === 0 && (
              <span className="absolute left-1 top-1 rounded-sm bg-brand px-1.5 py-0.5 text-[9px] font-bold uppercase tracking-wide text-brand-contrast">
                Cover
              </span>
            )}
            {/* Always visible, not hover-revealed: this grid is used on
                phones too, where there is no hover to reveal anything. */}
            <button
              type="button"
              onClick={() => remove(photo)}
              disabled={disabled}
              aria-label={`Remove photo ${index + 1}`}
              className="absolute right-1 top-1 flex h-5 w-5 items-center justify-center rounded-full bg-black/60 text-white transition hover:bg-danger disabled:cursor-not-allowed"
            >
              <CloseIcon className="h-3 w-3" />
            </button>
            {index > 0 && (
              <button
                type="button"
                onClick={() => makeCover(photo)}
                disabled={disabled}
                className="absolute inset-x-0 bottom-0 bg-black/55 py-1 text-[10px] font-semibold text-white transition hover:bg-black/75 disabled:cursor-not-allowed"
              >
                Make cover
              </button>
            )}
          </li>
        ))}

        {photos.length + cropQueue.length < MAX_NEW_PRODUCT_PHOTOS && (
          <li
            onDragOver={(e) => e.preventDefault()}
            onDrop={(e) => {
              e.preventDefault()
              pick(e.dataTransfer.files)
            }}
          >
            <button
              type="button"
              onClick={() => inputRef.current?.click()}
              disabled={!config || disabled}
              className="flex aspect-square w-full flex-col items-center justify-center gap-1 rounded-md border-2 border-dashed border-line text-muted transition hover:border-accent hover:text-fg disabled:cursor-not-allowed"
            >
              <PlusIcon className="h-4 w-4" />
              <span className="text-[10px] font-semibold">
                Add ({photos.length}/{MAX_NEW_PRODUCT_PHOTOS})
              </span>
            </button>
          </li>
        )}
      </ul>

      <p className="mt-2 text-[11px] text-muted">
        The first photo is the cover customers see on listings. Photos upload
        once the product is created — you can add a video and reorder them
        afterwards.
      </p>

      {error && (
        <div className="mt-2">
          <ErrorNote>{error}</ErrorNote>
        </div>
      )}

      <input
        ref={inputRef}
        type="file"
        accept={config ? acceptAttr(config.image) : 'image/*'}
        multiple
        hidden
        onChange={(e) => {
          pick(e.target.files)
          e.target.value = ''
        }}
      />

      {cropQueue[0] && (
        <ImageCropDialog
          file={cropQueue[0]}
          aspect={1}
          title="Crop product photo"
          onCancel={() => setCropQueue((queue) => queue.slice(1))}
          onCropped={cropped}
        />
      )}
    </div>
  )
}
