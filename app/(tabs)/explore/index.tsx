import { EventCard } from '@/components/event/EventCard'
import { ScreenHeader } from '@/components/layout/ScreenHeader'
import { Colors } from '@/constants/colors'
import { Fonts, LS, ls } from '@/constants/fonts'
import { Spacing } from '@/constants/spacing'
import { useEvents } from '@/hooks/api/use-events'
import type { Event } from '@/lib/api/events'
import { Ionicons } from '@expo/vector-icons'
import { router } from 'expo-router'
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'

function openEvent(eventPda: string) {
  router.push(`/(modals)/event/${eventPda}`)
}

export default function Explore() {
  const { data: events, isLoading, refetch, isRefetching } = useEvents()

  const featured = events?.find((e) => e.isFeatured) ?? events?.[0]
  const upcoming = events?.filter((e) => e.eventPda !== featured?.eventPda) ?? []

  return (
    <View style={styles.container}>
      <ScreenHeader
        title="EXPLORE"
        right={
          <TouchableOpacity onPress={() => router.push('/(modals)/profile')}>
            <Ionicons name="person-circle-outline" size={26} color={Colors.text2} />
          </TouchableOpacity>
        }
      />
      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={Colors.accent} />
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={isRefetching} onRefresh={refetch} tintColor={Colors.accent} />}
        >
          {featured && (
            <View style={styles.section}>
              <EventCard event={featured} variant="featured" onPress={() => openEvent(featured.eventPda)} />
            </View>
          )}

          {upcoming.length > 0 && (
            <View style={styles.upcomingSection}>
              <Text style={styles.sectionLabel}>UPCOMING</Text>
              {upcoming.map((event: Event) => (
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
            <View style={styles.center}>
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
  section: { marginBottom: Spacing.lg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80 },
  upcomingSection: { marginTop: Spacing.sm },
  sectionLabel: {
    fontFamily: Fonts.mono,
    fontSize: 10,
    color: Colors.text3,
    letterSpacing: ls(10, LS.labelWide),
    textTransform: 'uppercase',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  emptyText: {
    fontFamily: Fonts.body,
    fontSize: 15,
    color: Colors.text2,
  },
})
