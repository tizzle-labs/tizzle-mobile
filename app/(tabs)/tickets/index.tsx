import { View, Text, FlatList, StyleSheet, TouchableOpacity, ActivityIndicator } from 'react-native'
import { router } from 'expo-router'
import { Colors } from '@/constants/colors'
import { Fonts, LS, ls } from '@/constants/fonts'
import { Spacing } from '@/constants/spacing'
import { ScreenHeader } from '@/components/layout/ScreenHeader'
import { Badge } from '@/components/ui/Badge'
import { useMyRegistrations } from '@/hooks/api/use-my-registrations'
import type { Registration } from '@/lib/api/registrations'
import type { TicketStatus } from '@/lib/ticket-status'

function ticketBadgeVariant(reg: Registration): TicketStatus {
  // Without event timing data, fall back to checked-in/refunded flags only
  if (reg.refunded) return 'refunded'
  if (reg.checkedIn) return 'used'
  return 'valid'
}

function TicketRow({ registration }: { registration: Registration }) {
  const badgeVariant = ticketBadgeVariant(registration)
  return (
    <TouchableOpacity
      style={styles.row}
      onPress={() => router.push(`/(tabs)/tickets/${registration.registrationPda}`)}
      activeOpacity={0.8}
    >
      <View style={styles.rowInfo}>
        <Text style={styles.rowPda} numberOfLines={1} ellipsizeMode="middle">
          {registration.registrationPda}
        </Text>
        <Text style={styles.rowDate}>
          {new Date(registration.registeredAt).toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric',
          })}
        </Text>
      </View>
      <Badge variant={badgeVariant} />
    </TouchableOpacity>
  )
}

export default function Tickets() {
  const { data: registrations, isLoading, refetch, isRefetching } = useMyRegistrations()

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
          renderItem={({ item }) => <TicketRow registration={item} />}
          onRefresh={refetch}
          refreshing={isRefetching ?? false}
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
  rowPda: { fontFamily: Fonts.mono, fontSize: 12, color: Colors.text1 },
  rowDate: {
    fontFamily: Fonts.mono,
    fontSize: 10,
    color: Colors.text3,
    textTransform: 'uppercase',
    letterSpacing: ls(10, LS.labelNarrow),
  },
  emptyText: { fontFamily: Fonts.body, fontSize: 15, color: Colors.text2 },
  exploreLink: { fontFamily: Fonts.mono, fontSize: 11, color: Colors.accent, letterSpacing: ls(11, LS.labelNarrow) },
})
