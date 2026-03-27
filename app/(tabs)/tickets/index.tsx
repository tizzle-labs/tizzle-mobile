import { View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native'
import { router } from 'expo-router'
import { Colors } from '@/constants/colors'
import { Fonts, LS, ls } from '@/constants/fonts'
import { Spacing } from '@/constants/spacing'
import { ScreenHeader } from '@/components/layout/ScreenHeader'
import { Badge } from '@/components/ui/Badge'
import { useEvents } from '@/hooks/api/use-events'
import { useMyRegistrations } from '@/hooks/api/use-my-registrations'
import type { Event } from '@/lib/api/events'
import type { Registration } from '@/lib/api/registrations'
import { deriveTicketStatus, type TicketStatus } from '@/lib/ticket-status'
import { useMemo } from 'react'

function ticketBadgeVariant(reg: Registration, event?: Event): TicketStatus {
  if (!event) {
    if (reg.refunded) return 'refunded'
    if (reg.checkedIn) return 'used'
    return 'valid'
  }

  return deriveTicketStatus(reg, event)
}

function formatTicketDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
  })
}

function formatTicketTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-US', {
    hour: '2-digit',
    minute: '2-digit',
  })
}

function TicketRow({ registration, event }: { registration: Registration; event?: Event }) {
  const badgeVariant = ticketBadgeVariant(registration, event)
  return (
    <TouchableOpacity
      style={styles.row}
      onPress={() => router.push(`/(tabs)/tickets/${registration.registrationPda}`)}
      activeOpacity={0.8}
    >
      <View style={styles.rowInfo}>
        <Text style={styles.rowTitle} numberOfLines={1}>
          {event?.title ?? 'Untitled Event'}
        </Text>
        <Text style={styles.rowMeta} numberOfLines={1}>
          {event?.location ?? 'Location unavailable'}
        </Text>
        <Text style={styles.rowDate}>
          {event
            ? `${formatTicketDate(event.startTime)} · ${formatTicketTime(event.startTime)}`
            : formatTicketDate(registration.registeredAt)}
        </Text>
        <Text style={styles.rowPda} numberOfLines={1} ellipsizeMode="middle">
          {registration.registrationPda}
        </Text>
      </View>
      <Badge variant={badgeVariant} />
    </TouchableOpacity>
  )
}

export default function Tickets() {
  const { data: registrations, isLoading, refetch, isRefetching } = useMyRegistrations()
  const { data: events, refetch: refetchEvents, isRefetching: isRefetchingEvents } = useEvents()
  const eventsByPda = useMemo(() => new Map((events ?? []).map((event) => [event.eventPda, event])), [events])

  return (
    <View style={styles.container}>
      <ScreenHeader title="MY TICKETS" />
      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={Colors.accent} />
        </View>
      ) : (
        <FlatList
          data={registrations}
          keyExtractor={(item) => item.registrationPda}
          renderItem={({ item }) => <TicketRow registration={item} event={eventsByPda.get(item.eventPda)} />}
          onRefresh={() => {
            void Promise.all([refetch(), refetchEvents()])
          }}
          refreshing={(isRefetching ?? false) || (isRefetchingEvents ?? false)}
          ListEmptyComponent={
            <View style={styles.center}>
              <Text style={styles.emptyText}>No tickets yet.</Text>
              <TouchableOpacity onPress={() => router.push('/(tabs)/explore')}>
                <Text style={styles.exploreLink}>Explore events →</Text>
              </TouchableOpacity>
            </View>
          }
        />
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center', paddingTop: 80, gap: 12 },
  row: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  rowInfo: { flex: 1, gap: 4, marginRight: Spacing.sm },
  rowTitle: {
    fontFamily: Fonts.display,
    fontSize: 16,
    color: Colors.text1,
    letterSpacing: ls(16, LS.displaySubtle),
  },
  rowMeta: {
    fontFamily: Fonts.body,
    fontSize: 13,
    color: Colors.text2,
  },
  rowPda: { fontFamily: Fonts.mono, fontSize: 12, color: Colors.text1 },
  rowDate: {
    fontFamily: Fonts.mono,
    fontSize: 10,
    color: Colors.accent,
    textTransform: 'uppercase',
    letterSpacing: ls(10, LS.labelNarrow),
  },
  emptyText: { fontFamily: Fonts.body, fontSize: 15, color: Colors.text2 },
  exploreLink: { fontFamily: Fonts.mono, fontSize: 11, color: Colors.accent, letterSpacing: ls(11, LS.labelNarrow) },
})
