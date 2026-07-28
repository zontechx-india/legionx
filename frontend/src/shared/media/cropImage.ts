import type { Area } from 'react-easy-crop'

/**
 * Canvas-side of the crop flow: takes the pixel area react-easy-crop
 * reports and produces a compressed WebP blob of just that region. Only the
 * cropped (and size-capped) image is ever uploaded — the original file never
 * leaves the browser.
 */

/** Longest edge of an uploaded image — plenty for a storefront card/gallery. */
const MAX_EDGE = 1600
/** WebP quality — visually lossless for product photos at a fraction of the bytes. */
const QUALITY = 0.85

export function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const image = new Image()
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error('Could not read this image file.'))
    image.src = src
  })
}

/**
 * Crop `src` (an object URL) to `area` (pixels), scale down to MAX_EDGE if
 * needed, and encode as WebP.
 */
export async function cropToWebp(src: string, area: Area): Promise<Blob> {
  const image = await loadImage(src)

  const scale = Math.min(1, MAX_EDGE / Math.max(area.width, area.height))
  const width = Math.round(area.width * scale)
  const height = Math.round(area.height * scale)

  const canvas = document.createElement('canvas')
  canvas.width = width
  canvas.height = height
  const ctx = canvas.getContext('2d')
  if (!ctx) throw new Error('Canvas is not available in this browser.')

  ctx.drawImage(
    image,
    area.x,
    area.y,
    area.width,
    area.height,
    0,
    0,
    width,
    height,
  )

  const blob = await new Promise<Blob | null>((resolve) =>
    canvas.toBlob(resolve, 'image/webp', QUALITY),
  )
  if (!blob) throw new Error('Could not process this image.')
  return blob
}

/** "photo.HEIC" → "photo.webp" (the upload is always the WebP crop). */
export function webpName(filename: string): string {
  return `${filename.replace(/\.[^.]+$/, '') || 'image'}.webp`
}
