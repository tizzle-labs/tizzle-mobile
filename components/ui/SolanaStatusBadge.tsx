import { View, Text, StyleSheet } from 'react-native'
import { Colors } from '@/constants/colors'
import { Fonts } from '@/constants/fonts'

export function SolanaStatusBadge() {
  return (
    <View style={styles.container}>
      <View style={styles.dot} />
      <Text style={styles.label}>ON-CHAIN VERIFIED</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    backgroundColor: 'rgba(153, 69, 255, 0.12)',
    borderRadius: 2,
    paddingHorizontal: 8,
    paddingVertical: 5,
    alignSelf: 'flex-start',
    borderWidth: 1,
    borderColor: Colors.chain,
  },
  dot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: Colors.chain,
  },
  label: {
    fontFamily: Fonts.mono,
    fontSize: 9,
    color: Colors.chain,
    letterSpacing: 0.1,
    textTransform: 'uppercase',
  },
})
