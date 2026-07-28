/**
 * Color tokens — anydesk design system (skillui).
 *
 * Source of truth: `skillui/tokens/colors.json`, `skillui/DESIGN.md`,
 * `skillui/SKILL.md` (component patterns) and `skillui/references/INTERACTIONS.md`.
 * Every value below traces back to the design system — never invent new colors.
 *
 * Accent decision: the live brand color is the red/orange `--primary` (#ef443b);
 * it drives CTAs / links. Blue #1863dc (the token-file "accent") is used for
 * focus rings and active states.
 */

/** Raw palette — the exact hex values extracted from the design system. */
export const palette = {
  black: '#000000', // background — darkest surface
  white: '#ffffff', // text-primary
  surface: '#2e2e2e', // cards, panels, modals
  border: '#1a1a1a', // dividers, card borders, outlines
  deep: '#101010', // extended — deep background layer / shadow color
  mist: '#d0d5d2', // extended — neutral light
  muted: '#8c8c8c', // component text-muted (badges, table headers, nav links)

  blue: '#1863dc', // accent — focus rings, active states
  info: '#0000ee', // informational highlights

  red: '#ef443b', // brand primary (--primary) / danger
  redHover: '#cd1a11', // link/CTA hover (rgb 205, 26, 17)
  redSoft: '#ff8e91', // --secondary
  orange: '#ff8a3d', // brand gradient end (warm orange, pairs with red)

  green: '#008000', // success
  amber: '#856404', // warning
} as const

/** Semantic roles — reference these from components, not the raw palette. */
export const colors = {
  /** Page / app background. */
  background: palette.black,
  /** Card and panel surfaces. */
  surface: palette.surface,
  /** Deepest layer (behind surfaces / shadow tone). */
  surfaceDeep: palette.deep,
  /** Dividers, card borders, outlines. */
  border: palette.border,

  text: {
    primary: palette.white,
    muted: palette.muted,
    /** For text placed on a light/accent surface. */
    inverse: palette.black,
  },

  /** Brand accent — CTAs, primary buttons, links. */
  brand: {
    primary: palette.red,
    primaryHover: palette.redHover,
    secondary: palette.redSoft,
  },

  /** Blue accent — focus rings, active nav, secondary emphasis. */
  accent: palette.blue,
  focusRing: palette.blue,

  status: {
    success: palette.green,
    warning: palette.amber,
    danger: palette.red,
    info: palette.info,
  },

  overlay: {
    /** Modal / dialog backdrop. */
    backdrop: 'rgba(0, 0, 0, 0.6)',
    /** Red glow effect (`.any-glow-red`). */
    glowRed: 'rgba(239, 68, 59, 0.5)',
  },
} as const

/**
 * Theme-flippable color schemes. Colors are the ONLY themeable axis —
 * spacing, typography, radius and shadows come from the skill and never change.
 *
 * `dark` is the default (the anydesk system is dark-native). `light` is derived
 * from the same design system, reusing the extended palette (#d0d5d2 borders,
 * #101010 text) so every value still traces back to skillui.
 *
 * Brand red and accent blue are identical across both themes.
 */
export const schemes = {
  dark: {
    bg: palette.black, //  #000000 page canvas
    surface: palette.surface, //  #2e2e2e cards / panels / modals
    surfaceAlt: palette.deep, //  #101010 deeper panels (sidebar, wells)
    inputBg: palette.black, //  inputs sit on the page color
    line: palette.border, //  #1a1a1a dividers / borders
    fg: palette.white, //  #ffffff primary text
    fgMuted: palette.muted, //  #8c8c8c secondary text
  },
  light: {
    bg: '#f5f5f5', //  light gray canvas
    surface: palette.white, //  #ffffff cards
    surfaceAlt: palette.white,
    inputBg: palette.white,
    line: palette.mist, //  #d0d5d2 (extended) borders
    fg: palette.deep, //  #101010 (extended) primary text
    fgMuted: palette.muted, //  #8c8c8c secondary text
  },
} as const

/** Colors shared by both themes (brand, accent, status, overlays). */
export const invariants = {
  brand: palette.red,
  brandHover: palette.redHover,
  brandContrast: palette.white,
  /** The signature red→orange brand gradient (AnyDesk primary-orange-gradient).
   *  Used for hero surfaces, brand marks and primary CTAs (app chrome only —
   *  per-store pages keep the owner's solid color). */
  brandGradient: `linear-gradient(135deg, ${palette.red} 0%, ${palette.orange} 100%)`,
  accent: palette.blue,
  success: palette.green,
  warning: palette.amber,
  danger: palette.red,
  info: palette.info,
  backdrop: 'rgba(0, 0, 0, 0.6)',
} as const

export type ThemeMode = keyof typeof schemes
export type Palette = typeof palette
export type Colors = typeof colors
