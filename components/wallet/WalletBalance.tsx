import { Text, StyleSheet } from 'react-native'
import { Colors } from '@/constants/colors'
import { Fonts } from '@/constants/fonts'
import { useWalletBalance } from '@/hooks/solana/use-wallet-balance'

interface Props {
  mint: string
  symbol: string
}

export function WalletBalance({ mint, symbol }: Props) {
  const { data: balance } = useWalletBalance(mint)
  const display = balance !== undefined ? `${balance.toFixed(4)} ${symbol}` : '...'

  return <Text style={styles.balance}>Balance: {display}</Text>
}

const styles = StyleSheet.create({
  balance: {
    fontFamily: Fonts.body,
    fontSize: 13,
    color: Colors.text2,
  },
})
