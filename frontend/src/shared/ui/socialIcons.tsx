/**
 * Social-platform brand glyphs (filled, single-color — they inherit
 * `currentColor` so they follow any theme). Same no-external-assets
 * convention as the other inline icon sets.
 *
 * `SOCIAL_META` maps a platform key to its display label + icon; the keys
 * match `FooterSocialKey` in the storefront's stores API structurally, so
 * either side can index it without a cross-app import.
 */

import type { ComponentType } from 'react'

function Svg({
  className = 'h-5 w-5',
  children,
}: {
  className?: string
  children: React.ReactNode
}) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
    >
      {children}
    </svg>
  )
}

export function FacebookIcon({ className }: { className?: string }) {
  return (
    <Svg className={className}>
      <path d="M13.5 21v-7.6h2.55l.38-2.96H13.5V8.55c0-.86.24-1.44 1.47-1.44h1.56V4.46c-.27-.04-1.2-.12-2.28-.12-2.26 0-3.8 1.38-3.8 3.9v2.2H7.9v2.96h2.55V21h3.05Z" />
    </Svg>
  )
}

export function InstagramIcon({ className }: { className?: string }) {
  return (
    <Svg className={className}>
      <path d="M12 4.2c2.54 0 2.84.01 3.84.06.93.04 1.43.2 1.77.33.44.17.76.38 1.09.71.33.33.54.65.71 1.09.13.34.29.84.33 1.77.05 1 .06 1.3.06 3.84s-.01 2.84-.06 3.84c-.04.93-.2 1.43-.33 1.77-.17.44-.38.76-.71 1.09-.33.33-.65.54-1.09.71-.34.13-.84.29-1.77.33-1 .05-1.3.06-3.84.06s-2.84-.01-3.84-.06c-.93-.04-1.43-.2-1.77-.33a2.93 2.93 0 0 1-1.09-.71 2.93 2.93 0 0 1-.71-1.09c-.13-.34-.29-.84-.33-1.77-.05-1-.06-1.3-.06-3.84s.01-2.84.06-3.84c.04-.93.2-1.43.33-1.77.17-.44.38-.76.71-1.09.33-.33.65-.54 1.09-.71.34-.13.84-.29 1.77-.33 1-.05 1.3-.06 3.84-.06ZM12 2.4c-2.6 0-2.93.01-3.95.06-1.02.05-1.72.21-2.33.45-.63.24-1.16.57-1.7 1.1-.53.54-.86 1.07-1.1 1.7-.24.61-.4 1.31-.45 2.33-.05 1.02-.06 1.35-.06 3.96s.01 2.94.06 3.96c.05 1.02.21 1.72.45 2.33.24.63.57 1.16 1.1 1.7.54.53 1.07.86 1.7 1.1.61.24 1.31.4 2.33.45 1.02.05 1.35.06 3.95.06s2.93-.01 3.95-.06c1.02-.05 1.72-.21 2.33-.45a4.7 4.7 0 0 0 1.7-1.1c.53-.54.86-1.07 1.1-1.7.24-.61.4-1.31.45-2.33.05-1.02.06-1.35.06-3.96s-.01-2.94-.06-3.96c-.05-1.02-.21-1.72-.45-2.33a4.7 4.7 0 0 0-1.1-1.7 4.7 4.7 0 0 0-1.7-1.1c-.61-.24-1.31-.4-2.33-.45-1.02-.05-1.35-.06-3.95-.06Zm0 4.67a4.93 4.93 0 1 0 0 9.86 4.93 4.93 0 0 0 0-9.86Zm0 8.13a3.2 3.2 0 1 1 0-6.4 3.2 3.2 0 0 1 0 6.4Zm6.28-8.32a1.15 1.15 0 1 1-2.3 0 1.15 1.15 0 0 1 2.3 0Z" />
    </Svg>
  )
}

export function YouTubeIcon({ className }: { className?: string }) {
  return (
    <Svg className={className}>
      <path d="M21.6 7.2a2.5 2.5 0 0 0-1.76-1.77C18.28 5 12 5 12 5s-6.28 0-7.84.43A2.5 2.5 0 0 0 2.4 7.2 26.2 26.2 0 0 0 2 12c0 1.62.13 3.24.4 4.8a2.5 2.5 0 0 0 1.76 1.77C5.72 19 12 19 12 19s6.28 0 7.84-.43a2.5 2.5 0 0 0 1.76-1.77c.27-1.56.4-3.18.4-4.8 0-1.62-.13-3.24-.4-4.8ZM10 15.2V8.8l5.2 3.2-5.2 3.2Z" />
    </Svg>
  )
}

export function WhatsAppIcon({ className }: { className?: string }) {
  return (
    <Svg className={className}>
      <path d="M12.04 2.4a9.56 9.56 0 0 0-8.15 14.56L2.4 21.6l4.76-1.44a9.56 9.56 0 1 0 4.88-17.76Zm0 17.5a7.9 7.9 0 0 1-4.03-1.1l-.29-.17-2.82.85.86-2.75-.19-.3a7.94 7.94 0 1 1 6.47 3.46Zm4.36-5.95c-.24-.12-1.41-.7-1.63-.78-.22-.08-.38-.12-.54.12-.16.24-.62.78-.76.94-.14.16-.28.18-.52.06a6.53 6.53 0 0 1-1.92-1.19 7.2 7.2 0 0 1-1.33-1.65c-.14-.24-.02-.37.1-.49.11-.11.24-.28.36-.42.12-.14.16-.24.24-.4.08-.16.04-.3-.02-.42-.06-.12-.54-1.3-.74-1.78-.2-.47-.4-.4-.54-.41h-.46c-.16 0-.42.06-.64.3-.22.24-.84.82-.84 2s.86 2.32.98 2.48c.12.16 1.7 2.6 4.12 3.64.58.25 1.03.4 1.38.51.58.18 1.1.16 1.52.1.46-.07 1.41-.58 1.61-1.14.2-.56.2-1.04.14-1.14-.06-.1-.22-.16-.46-.28Z" />
    </Svg>
  )
}

export function XIcon({ className }: { className?: string }) {
  return (
    <Svg className={className}>
      <path d="M17.7 3h2.9l-6.36 7.27L21.75 21h-5.86l-4.59-6-5.25 6H3.14l6.8-7.78L2.55 3h6.01l4.15 5.49L17.7 3Zm-1.02 16.26h1.61L7.68 4.65H5.95l10.73 14.61Z" />
    </Svg>
  )
}

export function LinkedInIcon({ className }: { className?: string }) {
  return (
    <Svg className={className}>
      <path d="M6.94 8.5H3.56V21h3.38V8.5ZM5.25 3a1.97 1.97 0 1 0 0 3.94A1.97 1.97 0 0 0 5.25 3ZM20.44 13.72c0-3.28-1.75-4.8-4.09-4.8-1.88 0-2.72 1.03-3.19 1.76V8.5H9.78V21h3.38v-6.98c0-1.52.28-3 2.17-3 1.86 0 1.73 1.73 1.73 3.1V21h3.38v-7.28Z" />
    </Svg>
  )
}

export function TelegramIcon({ className }: { className?: string }) {
  return (
    <Svg className={className}>
      <path d="M21.9 4.6 18.6 19.9c-.25 1.08-.9 1.34-1.82.84l-5.03-3.71-2.43 2.34c-.27.27-.5.5-1.01.5l.36-5.13 9.33-8.43c.4-.36-.09-.56-.63-.2L5.83 13.35l-4.96-1.55c-1.08-.34-1.1-1.08.22-1.6L20.5 3.05c.9-.34 1.68.2 1.4 1.55Z" />
    </Svg>
  )
}

export function PinterestIcon({ className }: { className?: string }) {
  return (
    <Svg className={className}>
      <path d="M12 2.4a9.6 9.6 0 0 0-3.5 18.54c-.08-.76-.16-1.92.03-2.75l1.13-4.78s-.29-.58-.29-1.42c0-1.34.78-2.34 1.74-2.34.82 0 1.22.62 1.22 1.36 0 .82-.53 2.06-.8 3.2-.23.96.48 1.74 1.42 1.74 1.7 0 3.01-1.8 3.01-4.39 0-2.3-1.65-3.9-4-3.9a4.15 4.15 0 0 0-4.33 4.16c0 .82.32 1.7.71 2.18a.29.29 0 0 1 .07.28l-.27 1.08c-.04.18-.14.21-.32.13-1.2-.56-1.95-2.3-1.95-3.72 0-3.02 2.2-5.8 6.33-5.8 3.33 0 5.91 2.37 5.91 5.54 0 3.3-2.08 5.96-4.97 5.96-.97 0-1.89-.5-2.2-1.1l-.6 2.28c-.21.83-.8 1.88-1.19 2.52A9.6 9.6 0 1 0 12 2.4Z" />
    </Svg>
  )
}

export interface SocialIconProps {
  className?: string
}

/** Display label + glyph per platform, keyed like `FooterSocialKey`. */
export const SOCIAL_META: Record<
  | 'facebook'
  | 'instagram'
  | 'youtube'
  | 'whatsapp'
  | 'x'
  | 'linkedin'
  | 'telegram'
  | 'pinterest',
  { label: string; Icon: ComponentType<SocialIconProps> }
> = {
  facebook: { label: 'Facebook', Icon: FacebookIcon },
  instagram: { label: 'Instagram', Icon: InstagramIcon },
  youtube: { label: 'YouTube', Icon: YouTubeIcon },
  whatsapp: { label: 'WhatsApp', Icon: WhatsAppIcon },
  x: { label: 'X (Twitter)', Icon: XIcon },
  linkedin: { label: 'LinkedIn', Icon: LinkedInIcon },
  telegram: { label: 'Telegram', Icon: TelegramIcon },
  pinterest: { label: 'Pinterest', Icon: PinterestIcon },
}
