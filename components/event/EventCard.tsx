import { Colors } from '@/constants/colors'
import { Fonts, LS, ls } from '@/constants/fonts'
import { Spacing } from '@/constants/spacing'
import type { Event } from '@/lib/api/events'
import { Ionicons } from '@expo/vector-icons'
import { Image } from 'expo-image'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { EventStatusChip, deriveEventStatus } from './EventStatusChip'

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
  variant?: 'featured' | 'compact' | 'grid'
}

export function EventCard({ event, onPress, variant = 'compact' }: EventCardProps) {
  const status = deriveEventStatus(event.startTime, event.endTime, event.unlockTime)

  if (variant === 'featured') {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.9} style={styles.featured}>
        {event.imageUrl ? (
        <Image source={{ uri: event.imageUrl }} style={StyleSheet.absoluteFillObject} contentFit="cover" />
      ) : (
        <View style={[StyleSheet.absoluteFillObject, styles.imageFallback]}>
          <Ionicons name="calendar-outline" size={48} color={Colors.border2} />
        </View>
      )}
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

  if (variant === 'grid') {
    return (
      <TouchableOpacity onPress={onPress} activeOpacity={0.85} style={styles.grid}>
        {event.imageUrl ? (
          <Image source={{ uri: event.imageUrl }} style={styles.gridImage} contentFit="cover" />
        ) : (
          <View style={[styles.gridImage, styles.imageFallback]}>
            <Ionicons name="calendar-outline" size={32} color={Colors.border2} />
          </View>
        )}
        <View style={styles.gridOverlay}>
          <EventStatusChip status={status} />
        </View>
        <View style={styles.gridInfo}>
          <Text style={styles.gridTitle} numberOfLines={1}>
            {event.title}
          </Text>
          <Text style={styles.gridDate}>{formatEventDate(event.startTime)}</Text>
        </View>
      </TouchableOpacity>
    )
  }

  return (
    <TouchableOpacity onPress={onPress} activeOpacity={0.75} style={styles.compact}>
      {event.imageUrl ? (
        <Image source={{ uri: event.imageUrl }} style={styles.thumb} contentFit="cover" />
      ) : (
        <View style={[styles.thumb, styles.imageFallback]}>
          <Ionicons name="calendar-outline" size={24} color={Colors.border2} />
        </View>
      )}
      <View style={styles.compactInfo}>
        <Text style={styles.compactDate}>{formatEventDate(event.startTime)}</Text>
        <Text style={styles.compactTitle} numberOfLines={1}>
          {event.title}
        </Text>
        <EventStatusChip status={status} />
      </View>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  imageFallback: { backgroundColor: Colors.surface2, alignItems: 'center', justifyContent: 'center' },
  featured: {
    aspectRatio: 16 / 9,
    borderRadius: 12,
    overflow: 'hidden',
    marginHorizontal: Spacing.md,
    backgroundColor: Colors.surface2,
  },
  featuredOverlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.5)',
    padding: Spacing.md,
    justifyContent: 'space-between',
  },
  featuredBottom: { gap: 6 },
  featuredTitle: {
    fontFamily: Fonts.display,
    fontSize: 28,
    color: Colors.text1,
    letterSpacing: ls(28, LS.display),
    lineHeight: 32,
  },
  featuredDate: {
    fontFamily: Fonts.mono,
    fontSize: 11,
    color: Colors.accent,
    textTransform: 'uppercase',
    letterSpacing: ls(11, LS.labelNarrow),
  },
  compact: {
    flexDirection: 'row',
    gap: Spacing.md,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    alignItems: 'center',
  },
  thumb: {
    width: 64,
    height: 64,
    borderRadius: 8,
    backgroundColor: Colors.surface2,
  },
  compactInfo: { flex: 1, gap: 4 },
  compactDate: {
    fontFamily: Fonts.mono,
    fontSize: 10,
    color: Colors.accent,
    textTransform: 'uppercase',
    letterSpacing: ls(10, LS.labelNarrow),
  },
  compactTitle: {
    fontFamily: Fonts.display,
    fontSize: 17,
    color: Colors.text1,
    letterSpacing: ls(17, LS.displaySubtle),
  },
  grid: {
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: Colors.surface2,
    width: 160,
  },
  gridImage: {
    width: '100%',
    height: 200,
  },
  gridOverlay: {
    position: 'absolute',
    top: Spacing.sm,
    left: Spacing.sm,
  },
  gridInfo: {
    padding: Spacing.sm,
    gap: 3,
  },
  gridTitle: {
    fontFamily: Fonts.display,
    fontSize: 15,
    color: Colors.text1,
    letterSpacing: ls(15, LS.displaySubtle),
  },
  gridDate: {
    fontFamily: Fonts.mono,
    fontSize: 10,
    color: Colors.accent,
    textTransform: 'uppercase',
    letterSpacing: ls(10, LS.labelNarrow),
  },
})
