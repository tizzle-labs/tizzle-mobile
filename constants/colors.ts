export const Colors = {
  bg: '#0A0A0A',
  surface: '#111111',
  surface2: '#161616',
  border: '#1E1E1E',
  border2: '#2A2A2A',
  accent: '#CAFF00',
  text1: '#FFFFFF',
  text2: '#888888',
  text3: '#444444',
  error: '#FF3B30',
  warning: '#FFB800',
  chain: '#9945FF',
} as const

export type ColorKey = keyof typeof Colors
