/**
 * Spacing tokens — anydesk design system (skillui).
 *
 * Source of truth: `skillui/tokens/spacing.json` + `skillui/DESIGN.md` §5.
 * Base grid is 4px — every margin, padding, gap, width and height must be a
 * multiple of it. Never use arbitrary spacing values.
 */

/** The 4px base grid unit. */
export const BASE_UNIT = 4 as const

/** Named scale extracted from the design system (px string values). */
export const spacing = {
  xs: '4px',
  sm: '8px',
  md: '10px',
  lg: '12px',
  xl: '16px',
  '2xl': '20px',
  '3xl': '30px',
  '4xl': '32px',
  '5xl': '128px',
  '6xl': '140px',
} as const

/** Numeric (px) form of the same scale, for arithmetic or RN-style consumers. */
export const spacingPx = {
  xs: 4,
  sm: 8,
  md: 10,
  lg: 12,
  xl: 16,
  '2xl': 20,
  '3xl': 30,
  '4xl': 32,
  '5xl': 128,
  '6xl': 140,
} as const

/**
 * Grid helper — returns `n × 4px`.
 * `space(4)` → "16px". Keeps ad-hoc spacing on the 4px grid.
 */
export const space = (multiplier: number): string => `${multiplier * BASE_UNIT}px`

/** Semantic guidance (DESIGN.md §5 "Spacing as Meaning") for reference. */
export const spacingIntent = {
  /** Tight — related items within a group (icon + label). */
  tight: spacing.sm,
  /** Medium — between groups within a section. */
  group: spacing.xl,
  /** Wide — between distinct sections. */
  section: spacing['4xl'],
  /** Vast — major page section breaks. */
  major: spacing['5xl'],
} as const

export type SpacingKey = keyof typeof spacing
