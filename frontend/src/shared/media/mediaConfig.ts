import { useEffect, useState } from 'react'
import { call, http } from '../auth/http'

/**
 * Upload rules (max sizes + allowed types) as configured on the BACKEND —
 * fetched once from /api/v1/public/media-config so the hints shown next to
 * upload fields and the client-side pre-upload validation can never drift
 * from what the server actually enforces.
 */

export interface MediaRule {
  maxMB: number
  contentTypes: string[]
}

export interface MediaConfig {
  image: MediaRule
  video: MediaRule
  logo: MediaRule
}

/** Mirror of the backend defaults — used only if the config fetch fails. */
const FALLBACK: MediaConfig = {
  image: {
    maxMB: 5,
    contentTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/avif'],
  },
  video: {
    maxMB: 50,
    contentTypes: ['video/mp4', 'video/webm', 'video/quicktime'],
  },
  logo: {
    maxMB: 2,
    contentTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/avif'],
  },
}

let cached: Promise<MediaConfig> | null = null

export function getMediaConfig(): Promise<MediaConfig> {
  cached ??= call<MediaConfig>(http.get('/api/v1/public/media-config')).catch(
    () => FALLBACK,
  )
  return cached
}

/** The config, or null while loading (rules arrive within one round-trip). */
export function useMediaConfig(): MediaConfig | null {
  const [config, setConfig] = useState<MediaConfig | null>(null)
  useEffect(() => {
    let cancelled = false
    getMediaConfig().then((loaded) => {
      if (!cancelled) setConfig(loaded)
    })
    return () => {
      cancelled = true
    }
  }, [])
  return config
}

/** Pre-upload validation — returns a user-facing error message, or null. */
export function validateFile(file: File, rule: MediaRule): string | null {
  const type = file.type.toLowerCase()
  if (!rule.contentTypes.includes(type)) {
    return `"${file.name}" is not a supported format. Use ${formatTypes(rule.contentTypes)}.`
  }
  if (file.size > rule.maxMB * 1024 * 1024) {
    return `"${file.name}" is too large — the maximum is ${rule.maxMB} MB.`
  }
  return null
}

const TYPE_LABELS: Record<string, string> = {
  'image/jpeg': 'JPG',
  'image/png': 'PNG',
  'image/webp': 'WebP',
  'image/avif': 'AVIF',
  'video/mp4': 'MP4',
  'video/webm': 'WebM',
  'video/quicktime': 'MOV',
}

/** "image/jpeg,image/png" → "JPG, PNG" (for hint lines). */
export function formatTypes(types: string[]): string {
  return types.map((t) => TYPE_LABELS[t] ?? t).join(', ')
}

/** `accept` attribute value for a file input. */
export function acceptAttr(rule: MediaRule): string {
  return rule.contentTypes.join(',')
}

/** The standard hint line under an upload control. */
export function ruleHint(rule: MediaRule): string {
  return `${formatTypes(rule.contentTypes)} · max ${rule.maxMB} MB`
}
