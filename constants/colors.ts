export const Colors = {
  bg: '#0A0A0A',
  surface: '#111111',
  surface2: '#1A1A1A',
  border: 'rgba(255,255,255,0.08)',
  border2: 'rgba(255,255,255,0.14)',
  accent: '#8FF363',
  text1: '#FFFFFF',
  text2: '#888888',
  text3: '#444444',
  error: '#FF3B30',
  warning: '#FFB800',
  success: '#34C759',
  chain: '#9945FF',
} as const

export type ColorKey = keyof typeof Colors
