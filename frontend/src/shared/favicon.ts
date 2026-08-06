/**
 * Runtime favicon control. The default tab icon is the UnieMax mark
 * (`/app_logo.png`, wired in both HTML entries); a store page swaps it for
 * the store's own logo while the visitor is inside that store and restores
 * the default on the way out.
 */

const DEFAULT_HREF = '/app_logo.png'
const DEFAULT_TYPE = 'image/png'

function iconLink(): HTMLLinkElement {
  let link = document.head.querySelector<HTMLLinkElement>('link[rel="icon"]')
  if (!link) {
    link = document.createElement('link')
    link.rel = 'icon'
    document.head.appendChild(link)
  }
  return link
}

/**
 * Use `url` as the tab icon. Passing null/undefined keeps (or restores) the
 * app default, so callers can hand it a store's `logoUrl` verbatim.
 */
export function setFavicon(url: string | null | undefined): void {
  const link = iconLink()
  if (url) {
    // Store logos are WebP; drop the type hint and let the browser sniff.
    link.removeAttribute('type')
    link.href = url
  } else {
    link.type = DEFAULT_TYPE
    link.href = DEFAULT_HREF
  }
}

/** Back to the UnieMax favicon. */
export function resetFavicon(): void {
  setFavicon(null)
}
