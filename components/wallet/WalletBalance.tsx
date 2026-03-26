import { Text, StyleSheet } from 'react-native'
import { Colors } from '@/constants/colors'
import { Fonts } from '@/constants/fonts'

interface WalletBalanceProps {
  mint: string
  symbol: string
}

// Placeholder — useWalletBalance hook is implemented in Task 6
export function WalletBalance({ symbol }: WalletBalanceProps) {
  return (
    <Text style={styles.text}>Balance: — {symbol}</Text>
  )
}

const styles = StyleSheet.create({
  text: {
    fontFamily: Fonts.mono,
    fontSize: 11,
    color: Colors.text3,
  },
})
