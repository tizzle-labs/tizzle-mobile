import { deriveEventStatus } from '@/components/event/EventStatusChip'
import { Colors } from '@/constants/colors'
import { Fonts, LS, ls } from '@/constants/fonts'
import { Spacing } from '@/constants/spacing'
import type { Event } from '@/lib/api/events'
import { Ionicons } from '@expo/vector-icons'
import { Image } from 'expo-image'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'

export function formatEventDate(iso: string): string {
  const date = new Date(iso)
  const now = new Date()
  const tomorrow = new Date(now)
  tomorrow.setDate(now.getDate() + 1)
  const isToday = date.toDateString() === now.toDateString()
  const isTomorrow = date.toDateString() === tomorrow.toDateString()
  const time = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
  if (isToday) return `Today, ${time}`
  if (isTomorrow) return `Tomorrow, ${time}`
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + `, ${time}`
}

export function shortAddress(addr: string): string {
  if (!addr || addr.length < 8) return addr
  return `${addr.slice(0, 4)}...${addr.slice(-4)}`
}

interface EventRowProps {
  event: Event
  onPress: () => void
}

export function EventRow({ event, onPress }: EventRowProps) {
  const status = deriveEventStatus(event.startTime, event.endTime, event.unlockTime)
  const statusColor = status === 'Available' || status === 'Ongoing' ? Colors.accent : Colors.warning

  return (
    <TouchableOpacity style={styles.row} onPress={onPress} activeOpacity={0.75}>
      {event.imageUrl ? (
        <Image source={{ uri: event.imageUrl }} style={styles.thumb} contentFit="cover" />
      ) : (
        <View style={[styles.thumb, styles.thumbFallback]}>
          <Ionicons name="calendar-outline" size={28} color={Colors.border2} />
        </View>
      )}
      <View style={styles.info}>
        <View style={styles.top}>
          {event.organizationAvatarUrl ? (
            <Image source={{ uri: event.organizationAvatarUrl }} style={styles.orgAvatar} contentFit="cover" />
          ) : (
            <View style={styles.orgAvatarFallback}>
              <Ionicons name="business-outline" size={10} color={Colors.text3} />
            </View>
          )}
          <Text style={styles.orgName} numberOfLines={1}>
            {event.organizationName ?? shortAddress(event.organizerAddress)}
          </Text>
        </View>
        <Text style={styles.title} numberOfLines={2}>
          {event.title}
        </Text>
        <View style={styles.bottom}>
          <View style={styles.dateRow}>
            <Ionicons name="time-outline" size={11} color={Colors.text3} />
            <Text style={styles.dateText}>{formatEventDate(event.startTime)}</Text>
          </View>
          <Text style={[styles.statusText, { color: statusColor }]}>{status.toUpperCase()}</Text>
        </View>
      </View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  row: {
    flexDirection: 'row',
    gap: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    alignItems: 'flex-start',
  },
  thumb: { width: 80, height: 80, borderRadius: 10, backgroundColor: Colors.surface2 },
  thumbFallback: { alignItems: 'center', justifyContent: 'center' },
  info: { flex: 1, gap: 5 },
  top: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  bottom: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: {
    fontFamily: Fonts.display,
    fontSize: 15,
    color: Colors.text1,
    letterSpacing: ls(15, LS.displaySubtle),
    lineHeight: 20,
  },
  orgAvatar: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: Colors.surface2,
    borderWidth: 1,
    borderColor: Colors.border2,
  },
  orgAvatarFallback: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: Colors.surface2,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border2,
  },
  orgName: { fontFamily: Fonts.mono, fontSize: 12, color: Colors.text1, flex: 1 },
  dateRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  dateText: { fontFamily: Fonts.mono, fontSize: 12, color: Colors.text1 },
  statusText: { fontFamily: Fonts.mono, fontSize: 10, letterSpacing: ls(10, LS.labelNarrow) },
})
