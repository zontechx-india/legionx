import { useEffect, useState } from 'react'
import Cropper from 'react-easy-crop'
import type { Area } from 'react-easy-crop'
import { cropToWebp, webpName } from './cropImage'

/**
 * Crop-before-upload dialog. Every image goes through here so the storefront
 * stays visually consistent: the aspect ratio is fixed by the caller (1:1 for
 * product images and logos), the user frames the subject, and ONLY the
 * cropped, WebP-compressed result is uploaded — never the original file.
 */
export function ImageCropDialog({
  file,
  aspect = 1,
  title = 'Crop image',
  busy = false,
  onCancel,
  onCropped,
}: {
  /** The picked file (already validated for type/size). */
  file: File
  /** Fixed aspect ratio, width / height. */
  aspect?: number
  title?: string
  /** True while the caller is uploading the previous confirmation. */
  busy?: boolean
  onCancel: () => void
  /** Receives the cropped WebP blob + a filename for the multipart part. */
  onCropped: (blob: Blob, filename: string) => void
}) {
  // The object URL is created INSIDE the effect (not useMemo) so that
  // StrictMode's mount → cleanup → mount cycle recreates it after the
  // cleanup revokes it — a memoized URL would stay revoked and the cropper
  // would render a black box.
  const [src, setSrc] = useState<string | null>(null)
  useEffect(() => {
    const url = URL.createObjectURL(file)
    setSrc(url)
    return () => URL.revokeObjectURL(url)
  }, [file])

  const [crop, setCrop] = useState({ x: 0, y: 0 })
  const [zoom, setZoom] = useState(1)
  const [area, setArea] = useState<Area | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [processing, setProcessing] = useState(false)

  const confirm = async () => {
    if (!area || !src) return
    setError(null)
    setProcessing(true)
    try {
      const blob = await cropToWebp(src, area)
      onCropped(blob, webpName(file.name))
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Could not crop the image.')
    } finally {
      setProcessing(false)
    }
  }

  const working = processing || busy

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4"
      role="dialog"
      aria-modal="true"
      aria-label={title}
    >
      <div className="w-full max-w-lg rounded-lg bg-surface p-5 shadow-floating">
        <h3 className="text-base font-bold text-fg">{title}</h3>
        <p className="mt-1 text-xs text-muted">
          Drag to position, pinch or use the slider to zoom. Only the cropped
          area is uploaded.
        </p>

        <div className="relative mt-4 h-72 overflow-hidden rounded-md bg-black/80 sm:h-80">
          {src && (
            <Cropper
              image={src}
              crop={crop}
              zoom={zoom}
              aspect={aspect}
              onCropChange={setCrop}
              onZoomChange={setZoom}
              onCropComplete={(_, pixels) => setArea(pixels)}
            />
          )}
        </div>

        <label className="mt-4 flex items-center gap-3">
          <span className="text-xs font-medium text-muted">Zoom</span>
          <input
            type="range"
            min={1}
            max={4}
            step={0.05}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
            className="w-full accent-[var(--brand)]"
            aria-label="Zoom"
          />
        </label>

        {error && <p className="mt-3 text-sm text-danger">{error}</p>}

        <div className="mt-5 flex justify-end gap-3">
          <button
            type="button"
            onClick={onCancel}
            disabled={working}
            className="h-10 rounded-md border border-line bg-surface px-4 text-sm font-semibold text-fg transition hover:bg-surface-alt disabled:cursor-not-allowed disabled:text-muted"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={confirm}
            disabled={working || !area}
            className="h-10 rounded-md bg-brand-gradient px-5 text-sm font-semibold text-brand-contrast transition hover:opacity-90 disabled:cursor-not-allowed disabled:bg-none disabled:bg-line disabled:text-muted"
          >
            {working ? 'Working…' : 'Crop & Upload'}
          </button>
        </div>
      </div>
    </div>
  )
}
