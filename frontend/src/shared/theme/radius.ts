/**
 * Border-radius tokens — anydesk design system (skillui).
 *
 * Source of truth: `skillui/SKILL.md` / `skillui/DESIGN.md` §5.
 * Allowed scale only: 2px, 3.2px, 4px, 6px, 50px. Default is 4px. `full` (9999px)
 * is the pill/badge shape from the component patterns. Never use arbitrary radii.
 */

export const radius = {
  xs: '2px',
  sm: '3.2px',
  /** Default radius — cards, buttons, inputs. */
  md: '4px',
  lg: '6px',
  /** Large rounded (modals — SKILL.md §Modal). */
  pill: '50px',
  /** Fully rounded — badges / chips (`border-radius: 9999px`). */
  full: '9999px',
} as const

/** The default when none is specified. */
export const defaultRadius = radius.md

export type RadiusKey = keyof typeof radius
