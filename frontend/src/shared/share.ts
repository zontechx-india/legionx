/**
 * Share / copy-link helpers used by the owner's Share Store panel and the
 * public storefront's share buttons.
 *
 * `shareOrCopy` prefers the native share sheet (mobile); without one it
 * copies the URL so the caller can show a "Link copied" confirmation.
 */

export async function copyToClipboard(text: string): Promise<void> {
  if (navigator.clipboard?.writeText) {
    await navigator.clipboard.writeText(text)
    return
  }
  // Insecure-context fallback (e.g. plain-http LAN preview).
  const area = document.createElement('textarea')
  area.value = text
  area.style.position = 'fixed'
  area.style.opacity = '0'
  document.body.appendChild(area)
  area.select()
  document.execCommand('copy')
  area.remove()
}

export type ShareOutcome = 'shared' | 'copied' | 'failed'

export async function shareOrCopy(data: {
  title: string
  url: string
}): Promise<ShareOutcome> {
  if (navigator.share) {
    try {
      await navigator.share(data)
      return 'shared'
    } catch (err) {
      // Dismissing the sheet is not a failure — and needs no fallback copy.
      if ((err as DOMException | null)?.name === 'AbortError') return 'shared'
      // Anything else (unsupported payload…) → fall through to copying.
    }
  }
  try {
    await copyToClipboard(data.url)
    return 'copied'
  } catch {
    return 'failed'
  }
}
