export const Fonts = {
  display: 'ClashGrotesk-Semibold',
  body: 'DMSans-Regular',
  bodyMedium: 'DMSans-Medium',
  mono: 'GeistMono-Regular',
} as const

// Letter-spacing em values from DESIGN.md
export const LS = {
  displayTight: -0.04, // hero / large section headings
  display: -0.03, // section titles, card titles
  displaySubtle: -0.02, // smaller display text
  labelWide: 0.12, // mono uppercase labels (small)
  label: 0.1, // mono uppercase labels (standard)
  labelNarrow: 0.08, // mono uppercase labels (wider text)
} as const

/** Convert em letter-spacing to absolute points: ls(fontSize, LS.display) */
export function ls(fontSize: number, em: number): number {
  return fontSize * em
}
