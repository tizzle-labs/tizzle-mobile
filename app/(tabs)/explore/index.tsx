import { deriveEventStatus, EventStatusChip } from '@/components/event/EventStatusChip'
import { Colors } from '@/constants/colors'
import { Fonts, LS, ls } from '@/constants/fonts'
import { Spacing } from '@/constants/spacing'
import { useEvents } from '@/hooks/api/use-events'
import type { Event } from '@/lib/api/events'
import { Ionicons } from '@expo/vector-icons'
import { Image } from 'expo-image'
import { router } from 'expo-router'
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

function openEvent(eventPda: string) {
  router.push(`/(modals)/event/${eventPda}`)
}

function formatEventDate(iso: string): string {
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

function shortAddress(addr: string): string {
  if (!addr || addr.length < 8) return addr
  return `${addr.slice(0, 4)}...${addr.slice(-4)}`
}

// TODO: Replace with real user preference categories from user profile/preference API
const USER_PREFERRED_CATEGORIES = ['Tech', 'Community', 'Music']

function chunkArray<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = []
  for (let i = 0; i < arr.length; i += size) chunks.push(arr.slice(i, i + size))
  return chunks
}

const BROWSE_CATEGORIES = [
  { label: 'Tech', icon: '🤖' },
  { label: 'AI', icon: '🧠' },
  { label: 'Climate', icon: '🌿' },
  { label: 'Fitness', icon: '🏃' },
  { label: 'Food & Drink', icon: '🍜' },
  { label: 'Arts & Culture', icon: '🎨' },
  { label: 'Wellness', icon: '🧘' },
  { label: 'Music', icon: '🎵' },
  { label: 'Community', icon: '🤝' },
  { label: 'Sport', icon: '⚽' },
]

const COLUMN_WIDTH = 320

function ForYouCard({ event, onPress }: { event: Event; onPress: () => void }) {
  return <RecentEventRow event={event} onPress={onPress} />
}

function RecentEventRow({ event, onPress }: { event: Event; onPress: () => void }) {
  const status = deriveEventStatus(event.startTime, event.endTime, event.unlockTime)
  return (
    <TouchableOpacity style={styles.recentRow} onPress={onPress} activeOpacity={0.75}>
      <Image source={{ uri: event.imageUrl }} style={styles.recentThumb} contentFit="cover" />
      <View style={styles.recentInfo}>
        <View style={styles.recentTop}>
          <View style={styles.fyOrgAvatar}>
            <Ionicons name="business-outline" size={10} color={Colors.text3} />
          </View>
          <Text style={[styles.fyOrgName, { flex: 1 }]} numberOfLines={1}>
            {shortAddress(event.organizerAddress)}
          </Text>
          <EventStatusChip status={status} />
        </View>
        <Text style={styles.recentTitle} numberOfLines={2}>
          {event.title}
        </Text>
        <View style={styles.fyDateRow}>
          <Ionicons name="time-outline" size={11} color={Colors.text3} />
          <Text style={styles.fyDate}>{formatEventDate(event.startTime)}</Text>
        </View>
      </View>
    </TouchableOpacity>
  )
}

export default function Explore() {
  const { data: events, isLoading, refetch, isRefetching } = useEvents()
  const insets = useSafeAreaInsets()

  // TODO: Filter by user preferred categories once preference API is available
  const preferredEvents =
    events?.filter((e) => USER_PREFERRED_CATEGORIES.some((cat) => e.category?.toLowerCase() === cat.toLowerCase())) ??
    []
  const forYouEvents = preferredEvents.length > 0 ? preferredEvents : (events ?? [])

  // Chunk into groups of 3 for columnar horizontal scroll
  const forYouChunks = chunkArray(forYouEvents, 3)

  // TODO: Replace startTime sort with real createdAt field once backend provides it
  const recentEvents = [...(events ?? [])]
    .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())
    .slice(0, 12)
  const recentChunks = chunkArray(recentEvents, 3)

  return (
    <View style={styles.container}>
      {/* ── Sticky Header ── */}
      <View style={[styles.header, { paddingTop: insets.top + Spacing.sm }]}>
        <TouchableOpacity onPress={() => router.push('/(modals)/profile')} style={styles.avatarBtn}>
          <Ionicons name="person" size={18} color={Colors.text2} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Explore</Text>
        <TouchableOpacity hitSlop={8} style={styles.searchBtn}>
          <Ionicons name="search-outline" size={22} color={Colors.text1} />
        </TouchableOpacity>
      </View>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={Colors.accent} />
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 80 }]}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={Colors.accent} />}
        >
          {/* ── For You ── */}
          <View style={styles.section}>
            <View style={styles.sectionHeader}>
              <View>
                {/* TODO: Update subtitle to reflect actual user preference label once API is ready */}
                <Text style={styles.sectionTitle}>For You</Text>
                <Text style={styles.sectionSubtitle}>Based on your interests</Text>
              </View>
              <TouchableOpacity style={styles.seeAllBtn}>
                <Text style={styles.seeAllText}>See All</Text>
              </TouchableOpacity>
            </View>
            {forYouEvents.length === 0 ? (
              <View style={styles.emptyInline}>
                <Text style={styles.emptyInlineText}>No events for your interests yet.</Text>
              </View>
            ) : (
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.fyScroll}
                contentContainerStyle={styles.fyScrollContent}
              >
                {forYouChunks.map((chunk, ci) => (
                  <View key={ci} style={styles.fyColumn}>
                    {chunk.map((event) => (
                      <ForYouCard key={event.eventPda} event={event} onPress={() => openEvent(event.eventPda)} />
                    ))}
                  </View>
                ))}
              </ScrollView>
            )}
          </View>

          {/* ── Discover Categories ── */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Discover Categories</Text>
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={styles.catScroll}
              contentContainerStyle={styles.catScrollContent}
            >
              <View style={styles.catRows}>
                <View style={styles.catRow}>
                  {BROWSE_CATEGORIES.slice(0, 5).map((cat) => (
                    <TouchableOpacity key={cat.label} style={styles.categoryTile} activeOpacity={0.7}>
                      <Text style={styles.categoryTileIcon}>{cat.icon}</Text>
                      <Text style={styles.categoryTileLabel}>{cat.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
                <View style={styles.catRow}>
                  {BROWSE_CATEGORIES.slice(5).map((cat) => (
                    <TouchableOpacity key={cat.label} style={styles.categoryTile} activeOpacity={0.7}>
                      <Text style={styles.categoryTileIcon}>{cat.icon}</Text>
                      <Text style={styles.categoryTileLabel}>{cat.label}</Text>
                    </TouchableOpacity>
                  ))}
                </View>
              </View>
            </ScrollView>
          </View>

          {/* ── Recently Added ── */}
          {/* TODO: Replace startTime sort with real createdAt field once backend provides it */}
          {recentChunks.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <View>
                  <Text style={styles.sectionTitle}>Recently Added</Text>
                  <Text style={styles.sectionSubtitle}>Fresh on the platform</Text>
                </View>
                <TouchableOpacity style={styles.seeAllBtn}>
                  <Text style={styles.seeAllText}>See All</Text>
                </TouchableOpacity>
              </View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.fyScroll}
                contentContainerStyle={styles.fyScrollContent}
              >
                {recentChunks.map((chunk, ci) => (
                  <View key={ci} style={styles.fyColumn}>
                    {chunk.map((event) => (
                      <RecentEventRow key={event.eventPda} event={event} onPress={() => openEvent(event.eventPda)} />
                    ))}
                  </View>
                ))}
              </ScrollView>
            </View>
          )}

          {events?.length === 0 && (
            <View style={styles.empty}>
              <Ionicons name="calendar-outline" size={40} color={Colors.text3} />
              <Text style={styles.emptyText}>No events yet.</Text>
            </View>
          )}
        </ScrollView>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: Spacing.md },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.sm,
    backgroundColor: Colors.bg,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  avatarBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.surface2,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border2,
  },
  headerTitle: {
    fontFamily: Fonts.display,
    fontSize: 18,
    color: Colors.text1,
    letterSpacing: ls(18, LS.displaySubtle),
  },
  searchBtn: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },

  section: { marginBottom: Spacing.xl },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontFamily: Fonts.display,
    fontSize: 20,
    color: Colors.text1,
    letterSpacing: ls(20, LS.displaySubtle),
    marginBottom: 2,
  },
  sectionSubtitle: {
    fontFamily: Fonts.body,
    fontSize: 12,
    color: Colors.text2,
  },
  seeAllBtn: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: 5,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border2,
  },
  seeAllText: {
    fontFamily: Fonts.mono,
    fontSize: 10,
    color: Colors.text2,
    letterSpacing: ls(10, LS.labelNarrow),
  },

  // For You
  fyScroll: { marginHorizontal: -Spacing.md },
  fyScrollContent: { paddingHorizontal: Spacing.md, gap: Spacing.md },
  fyColumn: { gap: 0, width: COLUMN_WIDTH },
  fyCard: {
    width: COLUMN_WIDTH,
    borderRadius: 12,
    overflow: 'hidden',
    backgroundColor: Colors.surface,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  fyImage: { width: '100%', height: 130 },
  fyStatusBadge: { position: 'absolute', top: Spacing.sm, right: Spacing.sm },
  fyBody: { padding: Spacing.sm, gap: 5 },
  fyOrg: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  fyOrgAvatar: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: Colors.surface2,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border2,
  },
  fyOrgName: {
    fontFamily: Fonts.mono,
    fontSize: 10,
    color: Colors.text3,
  },
  fyTitle: {
    fontFamily: Fonts.display,
    fontSize: 14,
    color: Colors.text1,
    letterSpacing: ls(14, LS.displaySubtle),
    lineHeight: 18,
  },
  fyDateRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  fyDate: {
    fontFamily: Fonts.mono,
    fontSize: 10,
    color: Colors.text3,
  },

  // Categories
  catScroll: { marginHorizontal: -Spacing.md, marginTop: Spacing.sm },
  catScrollContent: { paddingHorizontal: Spacing.md },
  catRows: { gap: Spacing.sm },
  catRow: { flexDirection: 'row', gap: Spacing.sm },
  categoryTile: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 7,
    paddingHorizontal: 14,
    paddingVertical: 11,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border2,
    backgroundColor: Colors.surface,
  },
  categoryTileIcon: { fontSize: 18 },
  categoryTileLabel: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 13,
    color: Colors.text1,
  },

  // Recently Added
  recentRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    alignItems: 'flex-start',
  },
  recentThumb: {
    width: 80,
    height: 80,
    borderRadius: 10,
    backgroundColor: Colors.surface2,
  },
  recentInfo: { flex: 1, gap: 5 },
  recentTop: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  recentTitle: {
    fontFamily: Fonts.display,
    fontSize: 15,
    color: Colors.text1,
    letterSpacing: ls(15, LS.displaySubtle),
    lineHeight: 20,
  },

  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
    gap: Spacing.sm,
  },
  emptyText: {
    fontFamily: Fonts.body,
    fontSize: 15,
    color: Colors.text2,
  },
  emptyInline: {
    paddingVertical: Spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    backgroundColor: Colors.surface,
  },
  emptyInlineText: {
    fontFamily: Fonts.body,
    fontSize: 13,
    color: Colors.text3,
  },
})
