import { Divider } from '@/components/ui/Divider'
import { LoadingScreen } from '@/components/ui/LoadingScreen'
import { Colors } from '@/constants/colors'
import { Fonts, LS, ls } from '@/constants/fonts'
import { Spacing } from '@/constants/spacing'
import { useEvents } from '@/hooks/api/use-events'
import { useMyRegistrations } from '@/hooks/api/use-my-registrations'
import type { Event } from '@/lib/api/events'
import type { Registration } from '@/lib/api/registrations'
import { deriveTicketStatus, type TicketStatus } from '@/lib/ticket-status'
import { Ionicons } from '@expo/vector-icons'
import { Image } from 'expo-image'
import { router, useFocusEffect } from 'expo-router'
import { useCallback, useEffect, useMemo, useState } from 'react'
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

const PAGE_SIZE = 10

type Tab = 'all' | 'upcoming' | 'past'


const UPCOMING_STATUSES: TicketStatus[] = ['valid']
const PAST_STATUSES: TicketStatus[] = ['used', 'claimable', 'refunded', 'no-show', 'cancelled']

function ticketStatus(reg: Registration, event?: Event): TicketStatus {
  if (!event) {
    if (reg.refunded) return 'refunded'
    if (reg.checkedIn) return 'used'
    return 'valid'
  }
  return deriveTicketStatus(reg, event)
}

function fmtDate(iso: string) {
  const d = new Date(iso),
    now = new Date(),
    tmr = new Date(now)
  tmr.setDate(now.getDate() + 1)
  if (d.toDateString() === now.toDateString()) return 'Today'
  if (d.toDateString() === tmr.toDateString()) return 'Tomorrow'
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}
function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
}

const STATUS_META: Record<TicketStatus, { color: string; label: string }> = {
  valid: { color: Colors.accent, label: 'VALID' },
  used: { color: Colors.warning, label: 'USED' },
  claimable: { color: Colors.chain, label: 'CLAIM' },
  refunded: { color: Colors.success, label: 'REFUNDED' },
  'no-show': { color: Colors.error, label: 'NO-SHOW' },
  cancelled: { color: Colors.text3, label: 'CANCELLED' },
}

function TicketCard({ registration: reg, event }: { registration: Registration; event?: Event }) {
  const status = ticketStatus(reg, event)
  const m = STATUS_META[status]
  return (
    <TouchableOpacity
      style={s.ticket}
      onPress={() => router.push(`/(modals)/tickets/${reg.registrationPda}`)}
      activeOpacity={0.85}
    >
      {reg.checkedIn && (
        <Image source={require('../../../assets/images/check-in-stamp.png')} style={s.stamp} contentFit="contain" />
      )}
      {/* Top section */}
      <View style={s.ticketTop}>
        <View style={s.ticketImg}>
          {event?.imageUrl ? (
            <Image source={{ uri: event.imageUrl }} style={StyleSheet.absoluteFillObject} contentFit="cover" />
          ) : (
            <Ionicons name="calendar-outline" size={26} color={Colors.border2} />
          )}
        </View>
        <View style={s.ticketInfo}>
          <Text style={s.ticketTitle} numberOfLines={2}>
            {event?.title ?? 'Untitled Event'}
          </Text>
          <View style={s.metaRow}>
            <Ionicons name="calendar-outline" size={11} color={Colors.text2} />
            <Text style={s.metaText}>
              {event ? `${fmtDate(event.startTime)}, ${fmtTime(event.startTime)}` : fmtDate(reg.registeredAt)}
            </Text>
          </View>
          <View style={s.metaRow}>
            <Ionicons name="location-outline" size={11} color={Colors.text2} />
            <Text style={s.metaText} numberOfLines={1}>
              {event?.location ?? 'Location TBA'}
            </Text>
          </View>
        </View>
        <Text style={[s.statusLabel, { color: m.color }]}>{m.label}</Text>
      </View>

      {/* Tear line */}
      <View style={s.tearRow}>
        <View style={s.notchL} />
        <View style={s.tearDash}>
          {Array.from({ length: 40 }).map((_, i) => (
            <View key={i} style={s.dash} />
          ))}
        </View>
        <View style={s.notchR} />
      </View>

      {/* Stub */}
      <View style={s.stub}>
        <View style={s.refBlock}>
          <Text style={s.refLabel}>REGISTERED</Text>
          <Text style={s.refVal}>{fmtDate(reg.registeredAt)}</Text>
        </View>
        <Ionicons name="chevron-forward" size={16} color={Colors.text3} />
      </View>
    </TouchableOpacity>
  )
}

export default function Tickets() {
  const { data: registrations, isLoading, refetch, isRefetching } = useMyRegistrations()
  const { data: events, refetch: refetchEvents, isRefetching: isRefetchingEvents } = useEvents()
  const insets = useSafeAreaInsets()
  const [tab, setTab] = useState<Tab>('all')
  const [page, setPage] = useState(1)

  useEffect(() => setPage(1), [tab])

  const eventsByPda = useMemo(() => new Map((events ?? []).map((e) => [e.eventPda, e])), [events])

  useFocusEffect(
    useCallback(() => {
      refetch()
      refetchEvents()
    }, [refetch, refetchEvents]),
  )

  const onRefresh = () => {
    void Promise.all([refetch(), refetchEvents()])
  }
  const refreshing = (isRefetching ?? false) || (isRefetchingEvents ?? false)

  const { allList, upcomingList, pastList } = useMemo(() => {
    const regs = registrations ?? []
    const all = regs.map((r) => ({ reg: r, event: eventsByPda.get(r.eventPda), status: ticketStatus(r, eventsByPda.get(r.eventPda)) }))
    return {
      allList: all,
      upcomingList: all.filter((r) => UPCOMING_STATUSES.includes(r.status)),
      pastList: all.filter((r) => PAST_STATUSES.includes(r.status)),
    }
  }, [registrations, eventsByPda])

  const activeList = tab === 'all' ? allList : tab === 'upcoming' ? upcomingList : pastList
  const pagedList = activeList.slice(0, page * PAGE_SIZE)
  const hasMore = pagedList.length < activeList.length

  const emptyConfig = {
    all: { icon: 'ticket-outline' as const, title: 'No tickets yet', body: 'Register for an event to see your tickets here.', showExplore: true },
    upcoming: { icon: 'calendar-outline' as const, title: 'No upcoming tickets', body: 'Register for an upcoming event to see your tickets here.', showExplore: true },
    past: { icon: 'time-outline' as const, title: 'No past tickets', body: 'Your attended and missed event tickets will appear here.', showExplore: false },
  }

  return (
    <View style={s.container}>
      {isLoading ? (
        <LoadingScreen />
      ) : (
        <>
          {/* Sticky header + tabs */}
          <View style={[s.top, { paddingTop: insets.top + Spacing.sm }]}>
            <View style={s.header}>
              <Text style={s.headerTitle}>My Tickets</Text>
              <TouchableOpacity onPress={() => router.push('/(modals)/claim')} style={s.claimBtn}>
                <Text style={s.claimBtnText}>Claim</Text>
              </TouchableOpacity>
            </View>
            <View style={s.tabs}>
              <TouchableOpacity style={[s.tab, tab === 'all' && s.tabActive]} onPress={() => setTab('all')} activeOpacity={0.7}>
                <Text style={[s.tabText, tab === 'all' && s.tabTextActive]}>All</Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.tab, tab === 'upcoming' && s.tabActive]} onPress={() => setTab('upcoming')} activeOpacity={0.7}>
                <Text style={[s.tabText, tab === 'upcoming' && s.tabTextActive]}>
                  Upcoming{upcomingList.length > 0 ? ` (${upcomingList.length})` : ''}
                </Text>
              </TouchableOpacity>
              <TouchableOpacity style={[s.tab, tab === 'past' && s.tabActive]} onPress={() => setTab('past')} activeOpacity={0.7}>
                <Text style={[s.tabText, tab === 'past' && s.tabTextActive]}>Past</Text>
              </TouchableOpacity>
            </View>
          </View>

          <FlatList
            data={pagedList}
            keyExtractor={(item) => item.reg.registrationPda}
            style={s.scroll}
            contentContainerStyle={[s.scrollContent, { paddingBottom: insets.bottom + 80 }]}
            showsVerticalScrollIndicator={false}
            refreshControl={
              <RefreshControl
                refreshing={refreshing}
                onRefresh={onRefresh}
                tintColor={Colors.accent}
                colors={[Colors.accent]}
                progressBackgroundColor={Colors.bg}
              />
            }
            onEndReached={() => { if (hasMore) setPage((p) => p + 1) }}
            onEndReachedThreshold={0.3}
            ItemSeparatorComponent={() => <View style={{ height: Spacing.md }} />}
            renderItem={({ item }) => <TicketCard registration={item.reg} event={item.event} />}
            ListFooterComponent={
              hasMore
                ? <ActivityIndicator color={Colors.accent} style={s.footerLoader} />
                : pagedList.length > 0 ? <Divider /> : null
            }
            ListEmptyComponent={
              <View style={s.empty}>
                <Ionicons name={emptyConfig[tab].icon} size={44} color={Colors.text3} />
                <Text style={s.emptyTitle}>{emptyConfig[tab].title}</Text>
                <Text style={s.emptyBody}>{emptyConfig[tab].body}</Text>
                {emptyConfig[tab].showExplore && (
                  <TouchableOpacity style={s.exploreBtn} onPress={() => router.push('/(tabs)/explore')}>
                    <Text style={s.exploreBtnText}>Explore Events</Text>
                    <Ionicons name="arrow-forward" size={14} color={Colors.bg} />
                  </TouchableOpacity>
                )}
              </View>
            }
          />
        </>
      )}
    </View>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  top: { paddingHorizontal: Spacing.md, backgroundColor: Colors.bg },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: Spacing.md, paddingTop: Spacing.xs },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  claimBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Colors.accent,
    paddingHorizontal: Spacing.md,
    paddingVertical: 7,
    borderRadius: 20,
  },
  claimBtnText: {
    fontFamily: Fonts.display,
    fontSize: 14,
    color: Colors.bg,
  },
  headerTitle: {
    fontFamily: Fonts.display,
    fontSize: 18,
    color: Colors.text1,
    letterSpacing: ls(18, LS.displaySubtle),
  },

  // Tabs
  tabs: {
    flexDirection: 'row',
    gap: Spacing.xs,
    paddingBottom: Spacing.sm,
  },
  tab: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm - 2,
    borderRadius: 20,
    backgroundColor: Colors.surface2,
  },
  tabActive: { backgroundColor: Colors.accent },
  tabText: { fontFamily: Fonts.bodyMedium, fontSize: 13, color: Colors.text2 },
  tabTextActive: { color: Colors.bg },

  footerLoader: { paddingVertical: Spacing.lg },
  ticket: { backgroundColor: Colors.surface2, borderRadius: 16, overflow: 'hidden' },
  stamp: { position: 'absolute', top: 8, right: 8, width: 100, height: 100, opacity: 0.9, zIndex: 10 },
  ticketTop: { flexDirection: 'row', padding: Spacing.md, gap: Spacing.md, alignItems: 'flex-start' },
  ticketImg: {
    width: 68,
    height: 68,
    borderRadius: 10,
    backgroundColor: Colors.surface,
    flexShrink: 0,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
  },
  ticketInfo: { flex: 1, gap: 4, minWidth: 0 },
  ticketTitle: {
    fontFamily: Fonts.display,
    fontSize: 15,
    color: Colors.text1,
    letterSpacing: ls(15, LS.displaySubtle),
    lineHeight: 19,
  },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontFamily: Fonts.bodyMedium, fontSize: 11, color: Colors.text1, flex: 1 },
  statusLabel: {
    fontFamily: Fonts.mono,
    fontSize: 9,
    letterSpacing: ls(9, LS.label),
    flexShrink: 0,
    marginTop: 2,
  },
  tearRow: { flexDirection: 'row', alignItems: 'center', height: 14, overflow: 'hidden' },
  notchL: { width: 14, height: 14, borderRadius: 7, backgroundColor: Colors.bg, marginLeft: -7, flexShrink: 0 },
  notchR: { width: 14, height: 14, borderRadius: 7, backgroundColor: Colors.bg, marginRight: -7, flexShrink: 0 },
  tearDash: { flex: 1, flexDirection: 'row', gap: 5, overflow: 'hidden', alignItems: 'center' },
  dash: { width: 4, height: 1.5, backgroundColor: Colors.border2, flexShrink: 0 },
  stub: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 4,
    gap: Spacing.md,
  },
  refBlock: { flex: 1, gap: 2 },
  refLabel: {
    fontFamily: Fonts.mono,
    fontSize: 8,
    color: Colors.text2,
    letterSpacing: ls(8, LS.labelWide),
    textTransform: 'uppercase',
  },
  refVal: { fontFamily: Fonts.mono, fontSize: 11, color: Colors.text1 },
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
  emptyBody: { fontFamily: Fonts.body, fontSize: 14, color: Colors.text2, textAlign: 'center', lineHeight: 20 },
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
  exploreBtnText: { fontFamily: Fonts.bodyMedium, fontSize: 13, color: Colors.bg },
})
