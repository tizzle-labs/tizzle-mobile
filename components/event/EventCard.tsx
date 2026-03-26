import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { Image } from 'expo-image'
import { Colors } from '@/constants/colors'
import { Fonts, LS, ls } from '@/constants/fonts'
import { Spacing } from '@/constants/spacing'
import { EventStatusChip, deriveEventStatus } from './EventStatusChip'
import type { Event } from '@/lib/api/events'

function formatEventDate(iso: string): string {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

interface EventCardProps {
  event: Event
  onPress: () => void
  variant?: 'featured' | 'compact'
}

export function EventCard({ event, onPress, variant = 'compact' }: EventCardProps) {
  const status = deriveEventStatus(event.startTime, event.endTime, event.unlockTime)

  if (variant === 'featured') {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.9} style={styles.featured}>
        <Image source={{ uri: event.imageUrl }} style={StyleSheet.absoluteFillObject} contentFit="cover" />
        <View style={styles.featuredOverlay}>
          <EventStatusChip status={status} />
          <View style={styles.featuredBottom}>
            <Text style={styles.featuredTitle} numberOfLines={2}>
              {event.title}
            </Text>
            <Text style={styles.featuredDate}>{formatEventDate(event.startTime)}</Text>
          </View>
        </View>
      </TouchableOpacity>
    )
  }

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.8} style={styles.compact}>
      <Image source={{ uri: event.imageUrl }} style={styles.thumb} contentFit="cover" />
      <View style={styles.compactInfo}>
        <Text style={styles.compactTitle} numberOfLines={1}>
          {event.title}
        </Text>
        <Text style={styles.compactDate}>{formatEventDate(event.startTime)}</Text>
        <EventStatusChip status={status} />
      </View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  featured: {
    height: 240,
    borderRadius: 10,
    overflow: 'hidden',
    marginHorizontal: Spacing.md,
    backgroundColor: Colors.surface2,
  },
  featuredOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.55)',
    padding: Spacing.md,
    justifyContent: 'space-between',
  },
  featuredBottom: { gap: 4 },
  featuredTitle: {
    fontFamily: Fonts.display,
    fontSize: 24,
    color: Colors.text1,
    letterSpacing: ls(24, LS.display),
  },
  featuredDate: {
    fontFamily: Fonts.mono,
    fontSize: 10,
    color: Colors.accent,
    textTransform: 'uppercase',
    letterSpacing: ls(10, LS.labelNarrow),
  },
  compact: {
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    alignItems: 'center',
  },
  thumb: {
    width: 56,
    height: 56,
    borderRadius: 8,
    backgroundColor: Colors.surface2,
  },
  compactInfo: { flex: 1, gap: 5 },
  compactTitle: {
    fontFamily: Fonts.display,
    fontSize: 15,
    color: Colors.text1,
    letterSpacing: ls(15, LS.displaySubtle),
  },
  compactDate: {
    fontFamily: Fonts.mono,
    fontSize: 10,
    color: Colors.text2,
    textTransform: 'uppercase',
    letterSpacing: ls(10, LS.labelNarrow),
  },
})
