import { View, Text, StyleSheet } from 'react-native'
import { Colors } from '@/constants/colors'
import { Fonts } from '@/constants/fonts'

export interface InfoRow {
  label: string
  value: string
  mono?: boolean
}

interface InfoGridProps {
  rows: InfoRow[]
}

export function InfoGrid({ rows }: InfoGridProps) {
  return (
    <View style={styles.container}>
      {rows.map((row, i) => (
        <View key={i} style={styles.row}>
          <Text style={styles.label}>{row.label.toUpperCase()}</Text>
          <Text
            style={[styles.value, row.mono && styles.monoValue]}
            numberOfLines={1}
            ellipsizeMode="middle"
          >
            {row.value}
          </Text>
        </View>
      ))}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { gap: 10 },
  row: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: 8,
  },
  label: {
    fontFamily: Fonts.mono,
    fontSize: 9,
    color: Colors.text3,
    letterSpacing: 0.1,
    textTransform: 'uppercase',
    flexShrink: 0,
  },
  value: {
    fontFamily: Fonts.body,
    fontSize: 13,
    color: Colors.text2,
    flex: 1,
    textAlign: 'right',
  },
  monoValue: {
    fontFamily: Fonts.mono,
    fontSize: 11,
  },
})
