import { View, Text, StyleSheet } from 'react-native'
import { Colors } from '@/constants/colors'
import { Fonts } from '@/constants/fonts'

type BadgeVariant = 'valid' | 'used' | 'upcoming' | 'onchain' | 'ended' | 'available' | 'ongoing' | 'settlement' | 'closed'

const CONFIG: Record<BadgeVariant, { bg: string; color: string; label: string }> = {
  valid:      { bg: Colors.accent,   color: Colors.bg,    label: 'VALID' },
  used:       { bg: Colors.error,    color: Colors.text1, label: 'USED' },
  upcoming:   { bg: Colors.surface2, color: Colors.text2, label: 'UPCOMING' },
  onchain:    { bg: Colors.chain,    color: Colors.text1, label: 'ON-CHAIN' },
  ended:      { bg: Colors.warning,  color: Colors.bg,    label: 'ENDED' },
  available:  { bg: Colors.accent,   color: Colors.bg,    label: 'AVAILABLE' },
  ongoing:    { bg: Colors.accent,   color: Colors.bg,    label: 'ONGOING' },
  settlement: { bg: Colors.warning,  color: Colors.bg,    label: 'SETTLEMENT' },
  closed:     { bg: Colors.surface2, color: Colors.text3, label: 'CLOSED' },
}

interface BadgeProps {
  variant: BadgeVariant
  label?: string
}

export function Badge({ variant, label }: BadgeProps) {
  const c = CONFIG[variant]
  return (
    <View style={[styles.base, { backgroundColor: c.bg }]}>
      <Text style={[styles.label, { color: c.color }]}>{label ?? c.label}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  base: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 2,
    alignSelf: 'flex-start',
  },
  label: {
    fontFamily: Fonts.mono,
    fontSize: 9,
    letterSpacing: 0.1,
    textTransform: 'uppercase',
  },
})
