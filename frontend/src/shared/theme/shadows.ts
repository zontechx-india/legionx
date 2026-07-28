/**
 * Elevation / shadow tokens — anydesk design system (skillui).
 *
 * Source of truth: `skillui/DESIGN.md` §6 + `skillui/SKILL.md` (component CSS).
 * Depth is expressed through layered shadows. Do not create custom box-shadow
 * values outside these tokens, and never use blur/backdrop-blur effects.
 */

export const shadows = {
  none: 'none',
  /** Soft, even card elevation — no offset, so it sits equally on all four
   *  sides (cards, dropdowns, popovers, modals). Kept intentionally light. */
  floating: '0 0 12px 0 rgba(0, 0, 0, 0.06)',
  /** Red glow accent (`@keyframes glow-red` / `.any-glow-red`). */
  glowRed: 'rgba(239, 68, 59, 0.5) 0px 0px 60px 60px',
} as const

export type ShadowKey = keyof typeof shadows
