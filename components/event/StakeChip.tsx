import { View, Text, StyleSheet } from 'react-native'
import { Colors } from '@/constants/colors'
import { Fonts, LS, ls } from '@/constants/fonts'
import { SOL_MINT, formatTokenAmount } from '@/components/ui/TokenAmount'

interface StakeChipProps {
  stakeAmount: string
  stakeTokenMint: string
  stakeTokenSymbol: string
  stakeTokenDecimals: number
}

export function StakeChip({ stakeAmount, stakeTokenMint, stakeTokenSymbol, stakeTokenDecimals }: StakeChipProps) {
  const isSOL = stakeTokenMint === SOL_MINT
  const display = formatTokenAmount(stakeAmount, stakeTokenDecimals)
  const bg = isSOL ? Colors.accent : Colors.chain
  const color = isSOL ? Colors.bg : Colors.text1
  return (
    <View style={[styles.chip, { backgroundColor: bg }]}>
      <Text style={[styles.label, { color }]}>
        STAKE {display} {stakeTokenSymbol}
      </Text>
    </View>
  )
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 2,
    alignSelf: 'flex-start',
  },
  label: {
    fontFamily: Fonts.mono,
    fontSize: 10,
    letterSpacing: ls(10, LS.label),
    textTransform: 'uppercase',
  },
})
