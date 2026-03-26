import { Text, StyleSheet, TextStyle } from 'react-native'
import { Colors } from '@/constants/colors'
import { Fonts, LS, ls } from '@/constants/fonts'

export const SOL_MINT = '11111111111111111111111111111111'

interface TokenAmountProps {
  amount: string
  mint: string
  symbol: string
  decimals: number
  size?: 'sm' | 'md' | 'lg'
  style?: TextStyle
}

export function formatTokenAmount(amount: string, decimals: number): string {
  const num = Number(amount) / Math.pow(10, decimals)
  if (num === 0) return '0'
  if (num < 0.01) return num.toFixed(6).replace(/\.?0+$/, '')
  return num.toFixed(2).replace(/\.?0+$/, '')
}

export function TokenAmount({ amount, mint, symbol, decimals, size = 'md', style }: TokenAmountProps) {
  const isSOL = mint === SOL_MINT
  const color = isSOL ? Colors.accent : Colors.chain
  const fontSize = { sm: 14, md: 20, lg: 36 }[size]
  return (
    <Text style={[styles.base, { color, fontSize, letterSpacing: ls(fontSize, LS.display) }, style]}>
      {formatTokenAmount(amount, decimals)} {symbol}
    </Text>
  )
}

const styles = StyleSheet.create({
  base: {
    fontFamily: Fonts.display,
  },
})
