import { Colors } from '@/constants/colors'
import { Fonts, LS, ls } from '@/constants/fonts'
import { StyleSheet, Text, View } from 'react-native'

export type EventStatus = 'Available' | 'Ongoing' | 'Ended' | 'Settlement' | 'Closed'

export function deriveEventStatus(startTime: string, endTime: string, unlockTime: string): EventStatus {
  const now = Date.now()
  const start = new Date(startTime).getTime()
  const end = new Date(endTime).getTime()
  const unlock = new Date(unlockTime).getTime()
  if (now >= unlock) return 'Settlement'
  if (now >= end) return 'Ended'
  if (now >= start) return 'Ongoing'
  return 'Available'
}

const STATUS_STYLES: Record<EventStatus, { bg: string; color: string }> = {
  Available: { bg: Colors.accent, color: Colors.bg },
  Ongoing: { bg: Colors.accent, color: Colors.bg },
  Ended: { bg: Colors.warning, color: Colors.bg },
  Settlement: { bg: Colors.warning, color: Colors.bg },
  Closed: { bg: Colors.surface2, color: Colors.text3 },
}

interface EventStatusChipProps {
  status: EventStatus
}

export function EventStatusChip({ status }: EventStatusChipProps) {
  const s = STATUS_STYLES[status]
  return (
    <View style={[styles.chip, { backgroundColor: s.bg }]}>
      <Text style={[styles.label, { color: s.color }]}>{status.toUpperCase()}</Text>
    </View>
  )
}

const styles = StyleSheet.create({
  chip: {
    paddingHorizontal: 7,
    paddingVertical: 3,
    borderRadius: 2,
    alignSelf: 'flex-start',
  },
  label: {
    fontFamily: Fonts.mono,
    fontSize: 9,
    letterSpacing: ls(9, LS.label),
    textTransform: 'uppercase',
  },
})
