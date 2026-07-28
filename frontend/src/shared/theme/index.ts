/**
 * anydesk theme — reusable design-system constants (skillui).
 *
 * Single entry point for colors, typography, spacing, radius and shadows.
 * Import from here everywhere instead of hardcoding values:
 *
 *   import { theme } from '../../shared/theme'
 *   // or granular:
 *   import { colors, textStyles, spacing } from '../../shared/theme'
 *
 * Read `skillui/SKILL.md` before building UI. Every token traces back to the
 * design system — never invent colors, fonts, spacing, radii or shadows.
 */

export * from './colors'
export * from './typography'
export * from './spacing'
export * from './radius'
export * from './shadows'
export * from './mode'
export { ThemeProvider, useTheme } from './ThemeProvider'
export { ThemeToggle } from './ThemeToggle'

import { colors, palette } from './colors'
import {
  fontFamily,
  fontWeight,
  fontSize,
  lineHeight,
  letterSpacing,
  textStyles,
} from './typography'
import { spacing, spacingPx, space, BASE_UNIT } from './spacing'
import { radius, defaultRadius } from './radius'
import { shadows } from './shadows'

/** Aggregate theme object for a single import. */
export const theme = {
  colors,
  palette,
  font: {
    family: fontFamily,
    weight: fontWeight,
    size: fontSize,
    lineHeight,
    letterSpacing,
    styles: textStyles,
  },
  spacing,
  spacingPx,
  space,
  baseUnit: BASE_UNIT,
  radius,
  defaultRadius,
  shadows,
} as const

export type Theme = typeof theme
export default theme
