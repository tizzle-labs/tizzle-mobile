import { Colors } from '@/constants/colors'
import { Fonts, LS, ls } from '@/constants/fonts'
import { Spacing } from '@/constants/spacing'
import { useEvents } from '@/hooks/api/use-events'
import { useMyRegistrations } from '@/hooks/api/use-my-registrations'
import type { Event } from '@/lib/api/events'
import type { Registration } from '@/lib/api/registrations'
import { deriveTicketStatus, type TicketStatus } from '@/lib/ticket-status'
import { Ionicons } from '@expo/vector-icons'
import { router } from 'expo-router'
import { useMemo } from 'react'
import {
  ActivityIndicator,
  Dimensions,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

const { width: SCREEN_W } = Dimensions.get('window')
const CARD_W = SCREEN_W - Spacing.md * 2

// ─── helpers ────────────────────────────────────────────────────────────────

function ticketStatus(reg: Registration, event?: Event): TicketStatus {
  if (!event) {
    if (reg.refunded) return 'refunded'
    if (reg.checkedIn) return 'used'
    return 'valid'
  }
  return deriveTicketStatus(reg, event)
}

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
}

function shortPda(pda: string) {
  return `${pda.slice(0, 4)}…${pda.slice(-4)}`
}

const STATUS_COLOR: Record<TicketStatus, string> = {
  valid: Colors.accent,
  used: Colors.error,
  claimable: Colors.chain,
  refunded: Colors.success,
  'no-show': Colors.warning,
  cancelled: Colors.text3,
}

// ─── TicketCard ──────────────────────────────────────────────────────────────

function TicketCard({ registration, event, index }: { registration: Registration; event?: Event; index: number }) {
  const status = ticketStatus(registration, event)
  const accentColor = STATUS_COLOR[status]

  // Alternate card accent colors for visual variety
  const cardColors = ['#1A1A2E', '#16213E', '#0F3460', '#1A1A1A']
  const cardBg = cardColors[index % cardColors.length]

  return (
    <TouchableOpacity
      style={[styles.card, { backgroundColor: cardBg }]}
      onPress={() => router.push(`/(tabs)/tickets/${registration.registrationPda}`)}
      activeOpacity={0.85}
    >
      {/* Left accent strip */}
      <View style={[styles.cardStrip, { backgroundColor: accentColor }]} />

      {/* Main content */}
      <View style={styles.cardBody}>
        <View style={styles.cardTop}>
          <View style={styles.cardTitleBlock}>
            <Text style={styles.cardTitle} numberOfLines={1}>
              {event?.title ?? 'Untitled Event'}
            </Text>
            <Text style={styles.cardLocation} numberOfLines={1}>
              {event?.location ?? 'Location unavailable'}
            </Text>
          </View>
          {/* Status pill */}
          <View style={[styles.statusPill, { backgroundColor: accentColor + '22', borderColor: accentColor + '55' }]}>
            <Text style={[styles.statusText, { color: accentColor }]}>{status.toUpperCase()}</Text>
          </View>
        </View>

        {/* Perforated divider */}
        <View style={styles.perfRow}>
          <View style={[styles.perfCircle, styles.perfLeft]} />
          <View style={styles.perfDash} />
          <View style={[styles.perfCircle, styles.perfRight]} />
        </View>

        {/* Bottom info row */}
        <View style={styles.cardBottom}>
          <View style={styles.cardInfoCol}>
            <Text style={styles.cardInfoLabel}>DATE</Text>
            <Text style={styles.cardInfoValue}>
              {event ? fmtDate(event.startTime) : fmtDate(registration.registeredAt)}
            </Text>
          </View>
          {event && (
            <View style={styles.cardInfoCol}>
              <Text style={styles.cardInfoLabel}>TIME</Text>
              <Text style={styles.cardInfoValue}>{fmtTime(event.startTime)}</Text>
            </View>
          )}
          <View style={[styles.cardInfoCol, styles.cardInfoRight]}>
            <Text style={styles.cardInfoLabel}>REF</Text>
            <Text style={[styles.cardInfoValue, styles.cardPda]}>{shortPda(registration.registrationPda)}</Text>
          </View>
        </View>
      </View>

      {/* Barcode stub */}
      <View style={styles.cardStub}>
        <View style={styles.barcodeLines}>
          {Array.from({ length: 12 }).map((_, i) => (
            <View
              key={i}
              style={[
                styles.barcodeLine,
                { width: i % 3 === 0 ? 3 : 1.5, backgroundColor: Colors.text3 + (i % 2 === 0 ? 'CC' : '66') },
              ]}
            />
          ))}
        </View>
        <Ionicons name="chevron-forward" size={14} color={Colors.text3} style={{ marginTop: 8 }} />
      </View>
    </TouchableOpacity>
  )
}

// ─── Screen ──────────────────────────────────────────────────────────────────

export default function Tickets() {
  const { data: registrations, isLoading, refetch, isRefetching } = useMyRegistrations()
  const { data: events, refetch: refetchEvents, isRefetching: isRefetchingEvents } = useEvents()
  const insets = useSafeAreaInsets()

  const eventsByPda = useMemo(() => new Map((events ?? []).map((e) => [e.eventPda, e])), [events])

  const onRefresh = () => {
    void Promise.all([refetch(), refetchEvents()])
  }
  const refreshing = (isRefetching ?? false) || (isRefetchingEvents ?? false)

  return (
    <View style={styles.container}>
      {/* ── Hero header ── */}
      <View style={[styles.hero, { paddingTop: insets.top + Spacing.sm }]}>
        <Text style={styles.heroBg} numberOfLines={1} allowFontScaling={false}>
          TCKTS
        </Text>
        <View style={styles.heroContent}>
          <View>
            <Text style={styles.heroLabel}>YOUR COLLECTION</Text>
            <Text style={styles.heroTitle}>My Tickets</Text>
          </View>
          <View style={styles.heroCount}>
            <Text style={styles.heroCountNum}>{registrations?.length ?? 0}</Text>
            <Text style={styles.heroCountLabel}>total</Text>
          </View>
        </View>
      </View>

      {/* ── List ── */}
      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={Colors.accent} />
        </View>
      ) : (
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 80 }]}
          showsVerticalScrollIndicator={false}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} tintColor={Colors.accent} />}
        >
          {registrations && registrations.length > 0 ? (
            <>
              <View style={styles.sectionHeader}>
                <Text style={styles.sectionLabel}>ALL TICKETS</Text>
                <View style={styles.sectionLine} />
              </View>
              {registrations.map((reg, i) => (
                <TicketCard
                  key={reg.registrationPda}
                  registration={reg}
                  event={eventsByPda.get(reg.eventPda)}
                  index={i}
                />
              ))}
            </>
          ) : (
            <View style={styles.empty}>
              <Ionicons name="ticket-outline" size={48} color={Colors.text3} />
              <Text style={styles.emptyTitle}>No tickets yet</Text>
              <Text style={styles.emptyBody}>Register for an event to see your tickets here.</Text>
              <TouchableOpacity style={styles.exploreBtn} onPress={() => router.push('/(tabs)/explore')}>
                <Text style={styles.exploreBtnText}>Explore Events</Text>
                <Ionicons name="arrow-forward" size={14} color={Colors.bg} />
              </TouchableOpacity>
            </View>
          )}
        </ScrollView>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },

  // ── Hero ──
  hero: {
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.lg,
    overflow: 'hidden',
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  heroBg: {
    position: 'absolute',
    bottom: -12,
    right: -8,
    fontFamily: Fonts.display,
    fontSize: 96,
    color: Colors.text1,
    opacity: 0.04,
    letterSpacing: ls(96, LS.displayTight),
  },
  heroContent: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginTop: Spacing.sm,
  },
  heroLabel: {
    fontFamily: Fonts.mono,
    fontSize: 10,
    color: Colors.accent,
    letterSpacing: ls(10, LS.labelWide),
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  heroTitle: {
    fontFamily: Fonts.display,
    fontSize: 34,
    color: Colors.text1,
    letterSpacing: ls(34, LS.display),
    lineHeight: 38,
  },
  heroCount: {
    alignItems: 'center',
    backgroundColor: Colors.surface2,
    borderRadius: 12,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border2,
  },
  heroCountNum: {
    fontFamily: Fonts.display,
    fontSize: 24,
    color: Colors.accent,
    letterSpacing: ls(24, LS.display),
  },
  heroCountLabel: {
    fontFamily: Fonts.mono,
    fontSize: 9,
    color: Colors.text3,
    letterSpacing: ls(9, LS.labelWide),
    textTransform: 'uppercase',
  },

  // ── Scroll ──
  scroll: { flex: 1 },
  scrollContent: { paddingTop: Spacing.md },

  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    marginBottom: Spacing.md,
  },
  sectionLabel: {
    fontFamily: Fonts.mono,
    fontSize: 10,
    color: Colors.text3,
    letterSpacing: ls(10, LS.labelWide),
    textTransform: 'uppercase',
  },
  sectionLine: { flex: 1, height: 1, backgroundColor: Colors.border },

  // ── Ticket Card ──
  card: {
    flexDirection: 'row',
    width: CARD_W,
    marginHorizontal: Spacing.md,
    marginBottom: Spacing.md,
    borderRadius: 16,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border2,
  },
  cardStrip: { width: 4 },
  cardBody: { flex: 1, padding: Spacing.md },
  cardTop: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    justifyContent: 'space-between',
    gap: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  cardTitleBlock: { flex: 1 },
  cardTitle: {
    fontFamily: Fonts.display,
    fontSize: 17,
    color: Colors.text1,
    letterSpacing: ls(17, LS.displaySubtle),
    marginBottom: 3,
  },
  cardLocation: {
    fontFamily: Fonts.body,
    fontSize: 12,
    color: Colors.text2,
  },
  statusPill: {
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 99,
    borderWidth: 1,
  },
  statusText: {
    fontFamily: Fonts.mono,
    fontSize: 9,
    letterSpacing: ls(9, LS.label),
  },

  // perforated divider
  perfRow: {
    flexDirection: 'row',
    alignItems: 'center',
    marginVertical: Spacing.sm,
  },
  perfCircle: {
    width: 12,
    height: 12,
    borderRadius: 6,
    backgroundColor: Colors.bg,
  },
  perfLeft: { marginLeft: -Spacing.md - 6 },
  perfRight: { marginRight: -Spacing.md - 6 },
  perfDash: {
    flex: 1,
    height: 1,
    borderStyle: 'dashed',
    borderWidth: 1,
    borderColor: Colors.border2,
    marginHorizontal: Spacing.xs,
  },

  cardBottom: {
    flexDirection: 'row',
    gap: Spacing.md,
  },
  cardInfoCol: { gap: 2 },
  cardInfoRight: { marginLeft: 'auto' },
  cardInfoLabel: {
    fontFamily: Fonts.mono,
    fontSize: 9,
    color: Colors.text3,
    letterSpacing: ls(9, LS.labelWide),
    textTransform: 'uppercase',
  },
  cardInfoValue: {
    fontFamily: Fonts.mono,
    fontSize: 11,
    color: Colors.text1,
  },
  cardPda: { color: Colors.text2 },

  // barcode stub
  cardStub: {
    width: 36,
    backgroundColor: 'rgba(255,255,255,0.03)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.md,
    borderLeftWidth: 1,
    borderLeftColor: Colors.border,
  },
  barcodeLines: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 2,
    height: 48,
  },
  barcodeLine: {
    height: '100%',
    borderRadius: 1,
  },

  // ── Center / Empty ──
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  empty: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingTop: 80,
    gap: Spacing.sm,
    paddingHorizontal: Spacing.xl,
  },
  emptyTitle: {
    fontFamily: Fonts.display,
    fontSize: 22,
    color: Colors.text1,
    letterSpacing: ls(22, LS.display),
    marginTop: Spacing.sm,
  },
  emptyBody: {
    fontFamily: Fonts.body,
    fontSize: 14,
    color: Colors.text2,
    textAlign: 'center',
    lineHeight: 20,
  },
  exploreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    backgroundColor: Colors.accent,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm + 2,
    borderRadius: 99,
    marginTop: Spacing.sm,
  },
  exploreBtnText: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 13,
    color: Colors.bg,
  },
})
