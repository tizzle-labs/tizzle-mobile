import { EventCard } from '@/components/event/EventCard'
import { Colors } from '@/constants/colors'
import { Fonts, LS, ls } from '@/constants/fonts'
import { Spacing } from '@/constants/spacing'
import { useEvents } from '@/hooks/api/use-events'
import type { Event } from '@/lib/api/events'
import { Ionicons } from '@expo/vector-icons'
import { router } from 'expo-router'
import {
  ActivityIndicator,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

function openEvent(eventPda: string) {
  router.push(`/(modals)/event/${eventPda}`)
}

const CATEGORIES = ['All', 'Music', 'Sport', 'Art', 'Community', 'Tech']

export default function Explore() {
  const { data: events, isLoading, refetch, isRefetching } = useEvents()
  const insets = useSafeAreaInsets()

  const upcoming = events?.filter((e) => !e.isFeatured) ?? []
  const special = events?.filter((e) => e.isFeatured) ?? []

  return (
    <View style={styles.container}>
      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={Colors.accent} />
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[
            styles.scrollContent,
            { paddingTop: insets.top + Spacing.md, paddingBottom: insets.bottom + 80 },
          ]}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={Colors.accent} />}
        >
          {/* ── Greeting ── */}
          <View style={styles.greeting}>
            <View style={styles.greetingLeft}>
              <View style={styles.avatar}>
                <Ionicons name="person" size={20} color={Colors.text2} />
              </View>
              <View>
                <Text style={styles.greetingName}>Hey there 👋</Text>
                <Text style={styles.greetingSubtitle}>Find your next event</Text>
              </View>
            </View>
            <TouchableOpacity onPress={() => router.push('/(modals)/profile')} hitSlop={8} style={styles.profileBtn}>
              <Ionicons name="person-circle-outline" size={28} color={Colors.text2} />
            </TouchableOpacity>
          </View>

          {/* ── Search ── */}
          <View style={styles.searchBar}>
            <Ionicons name="search-outline" size={16} color={Colors.text3} />
            <TextInput
              style={styles.searchInput}
              placeholder="Search events, locations..."
              placeholderTextColor={Colors.text3}
              editable={false}
            />
          </View>

          {/* ── Categories ── */}
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={styles.categoriesRow}>
            {CATEGORIES.map((cat, i) => (
              <TouchableOpacity key={cat} style={[styles.categoryChip, i === 0 && styles.categoryChipActive]}>
                <Text style={[styles.categoryText, i === 0 && styles.categoryTextActive]}>{cat}</Text>
              </TouchableOpacity>
            ))}
          </ScrollView>

          {/* ── Upcoming Events ── */}
          {upcoming.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <View>
                  <Text style={styles.sectionTitle}>⚡ Upcoming Events</Text>
                  <Text style={styles.sectionSubtitle}>{"Don't miss what's next"}</Text>
                </View>
                <TouchableOpacity style={styles.seeAllBtn}>
                  <Text style={styles.seeAllText}>See All</Text>
                </TouchableOpacity>
              </View>
              <ScrollView
                horizontal
                showsHorizontalScrollIndicator={false}
                style={styles.gridScroll}
                contentContainerStyle={styles.gridRow}
              >
                {upcoming.map((event: Event) => (
                  <EventCard
                    key={event.eventPda}
                    event={event}
                    variant="grid"
                    onPress={() => openEvent(event.eventPda)}
                  />
                ))}
              </ScrollView>
            </View>
          )}

          {/* ── Special / Featured ── */}
          {special.length > 0 && (
            <View style={styles.section}>
              <View style={styles.sectionHeader}>
                <View>
                  <Text style={styles.sectionTitle}>🔥 Featured Events</Text>
                  <Text style={styles.sectionSubtitle}>Handpicked for you</Text>
                </View>
                <TouchableOpacity style={styles.seeAllBtn}>
                  <Text style={styles.seeAllText}>See All</Text>
                </TouchableOpacity>
              </View>
              {special.map((event: Event) => (
                <EventCard
                  key={event.eventPda}
                  event={event}
                  variant="compact"
                  onPress={() => openEvent(event.eventPda)}
                />
              ))}
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

  // greeting
  greeting: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  greetingLeft: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  avatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.surface2,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border2,
  },
  greetingName: {
    fontFamily: Fonts.display,
    fontSize: 17,
    color: Colors.text1,
    letterSpacing: ls(17, LS.displaySubtle),
  },
  greetingSubtitle: {
    fontFamily: Fonts.body,
    fontSize: 12,
    color: Colors.text2,
    marginTop: 1,
  },
  profileBtn: {},

  // search
  searchBar: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    paddingHorizontal: Spacing.md,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    marginBottom: Spacing.md,
  },
  searchInput: {
    flex: 1,
    fontFamily: Fonts.body,
    fontSize: 14,
    color: Colors.text1,
    padding: 0,
  },

  // categories
  categoriesRow: {
    gap: Spacing.sm,
    paddingBottom: Spacing.md,
  },
  categoryChip: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 7,
    borderRadius: 99,
    borderWidth: 1,
    borderColor: Colors.border2,
    backgroundColor: Colors.surface,
  },
  categoryChipActive: {
    backgroundColor: Colors.accent,
    borderColor: Colors.accent,
  },
  categoryText: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 13,
    color: Colors.text2,
  },
  categoryTextActive: { color: Colors.bg },

  // sections
  section: { marginBottom: Spacing.xl },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontFamily: Fonts.display,
    fontSize: 18,
    color: Colors.text1,
    letterSpacing: ls(18, LS.displaySubtle),
  },
  sectionSubtitle: {
    fontFamily: Fonts.body,
    fontSize: 12,
    color: Colors.text2,
    marginTop: 2,
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

  // grid
  gridRow: {
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
  gridScroll: {
    marginHorizontal: -Spacing.md,
  },

  // empty
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
})
