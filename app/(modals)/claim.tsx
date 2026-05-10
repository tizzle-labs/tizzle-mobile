import { Button } from '@/components/ui/Button'
import { Divider } from '@/components/ui/Divider'
import { Colors } from '@/constants/colors'
import { Fonts, LS, ls } from '@/constants/fonts'
import { Spacing } from '@/constants/spacing'
import { useEvents } from '@/hooks/api/use-events'
import { useMyRegistrations } from '@/hooks/api/use-my-registrations'
import { useTicketLifecycle } from '@/hooks/api/use-ticket-lifecycle'
import type { Event } from '@/lib/api/events'
import type { Registration } from '@/lib/api/registrations'
import { showErrorFeedback } from '@/lib/app-feedback'
import { deriveTicketStatus } from '@/lib/ticket-status'
import { Ionicons } from '@expo/vector-icons'
import { Image } from 'expo-image'
import { router } from 'expo-router'
import { useEffect, useMemo, useState } from 'react'
import { ActivityIndicator, FlatList, RefreshControl, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

const PAGE_SIZE = 10


function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function UnclaimCard({ registration: reg, event }: { registration: Registration; event: Event }) {
  const { claimRefund, isClaimingRefund } = useTicketLifecycle(reg, event)
  const stake = `${Number(reg.stakeAmount) / Math.pow(10, event.stakeTokenDecimals)} ${event.stakeTokenSymbol}`

  async function handleClaim() {
    try {
      await claimRefund()
    } catch (e: any) {
      showErrorFeedback(e, 'Claim Failed', 'Could not claim your stake refund')
    }
  }

  return (
    <TouchableOpacity style={s.card} onPress={() => router.push(`/(modals)/event/${event.eventPda}`)} activeOpacity={0.85}>
      <View style={s.cardRow}>
        <View style={s.cardImg}>
          {event.imageUrl ? (
            <Image source={{ uri: event.imageUrl }} style={StyleSheet.absoluteFillObject} contentFit="cover" />
          ) : (
            <Ionicons name="calendar-outline" size={24} color={Colors.border2} />
          )}
        </View>
        <View style={s.cardInfo}>
          <Text style={s.cardTitle} numberOfLines={1}>{event.title}</Text>
          <View style={s.cardMeta}>
            <Ionicons name="wallet-outline" size={11} color={Colors.text2} />
            <Text style={[s.cardMetaText, { color: Colors.text1 }]}>{stake}</Text>
          </View>
          <View style={s.cardMeta}>
            <Ionicons name="time-outline" size={11} color={Colors.text2} />
            <Text style={[s.cardMetaText, { color: Colors.text1 }]}>{fmtDate(event.endTime)}</Text>
          </View>
        </View>
      </View>
      <Button onPress={handleClaim} loading={isClaimingRefund} disabled={isClaimingRefund}>
        {isClaimingRefund ? 'Claiming on Solana…' : 'Claim Stake'}
      </Button>
    </TouchableOpacity>
  )
}

function ClaimedCard({ registration: reg, event }: { registration: Registration; event: Event }) {
  const stake = `${Number(reg.stakeAmount) / Math.pow(10, event.stakeTokenDecimals)} ${event.stakeTokenSymbol}`

  return (
    <TouchableOpacity style={s.card} onPress={() => router.push(`/(modals)/event/${event.eventPda}`)} activeOpacity={0.85}>
      <View style={s.cardRow}>
        <View style={s.cardImg}>
          {event.imageUrl ? (
            <Image source={{ uri: event.imageUrl }} style={StyleSheet.absoluteFillObject} contentFit="cover" />
          ) : (
            <Ionicons name="calendar-outline" size={24} color={Colors.border2} />
          )}
        </View>
        <View style={s.cardInfo}>
          <Text style={s.cardTitle} numberOfLines={1}>{event.title}</Text>
          <View style={s.cardMeta}>
            <Ionicons name="wallet-outline" size={11} color={Colors.text2} />
            <Text style={[s.cardMetaText, { color: Colors.text1 }]}>{stake}</Text>
          </View>
          {reg.refundedAt && (
            <View style={s.cardMeta}>
              <Ionicons name="checkmark-circle-outline" size={11} color={Colors.success} />
              <Text style={[s.cardMetaText, { color: Colors.success }]}>Claimed {fmtDate(reg.refundedAt)}</Text>
            </View>
          )}
        </View>
        <View style={s.claimedBadge}>
          <Text style={s.claimedBadgeText}>CLAIMED</Text>
        </View>
      </View>
    </TouchableOpacity>
  )
}

type Tab = 'unclaim' | 'claimed'

export default function ClaimScreen() {
  const insets = useSafeAreaInsets()
  const [tab, setTab] = useState<Tab>('unclaim')
  const [page, setPage] = useState(1)

  const { data: registrations, isLoading: regsLoading, refetch, isRefetching } = useMyRegistrations()
  const { data: events, isLoading: eventsLoading, refetch: refetchEvents, isRefetching: isRefetchingEvents } = useEvents()

  const eventsByPda = useMemo(
    () => new Map((events ?? []).map((e) => [e.eventPda, e])),
    [events],
  )

  const { unclaimList, claimedList } = useMemo(() => {
    if (!registrations) return { unclaimList: [], claimedList: [] }
    const pairs = registrations
      .map((r) => ({ reg: r, event: eventsByPda.get(r.eventPda) }))
      .filter((p): p is { reg: Registration; event: Event } => !!p.event)

    return {
      unclaimList: pairs.filter(({ reg, event }) => deriveTicketStatus(reg, event) === 'claimable'),
      claimedList: pairs.filter(({ reg }) => reg.refunded),
    }
  }, [registrations, eventsByPda])

  const activeList = tab === 'unclaim' ? unclaimList : claimedList

  useEffect(() => setPage(1), [tab])

  const pagedList = activeList.slice(0, page * PAGE_SIZE)
  const hasMore = pagedList.length < activeList.length
  const isLoading = regsLoading || eventsLoading

  return (
    <View style={[s.container, { paddingTop: insets.top + Spacing.sm }]}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn} hitSlop={12}>
          <Ionicons name="arrow-back" size={20} color={Colors.text1} />
        </TouchableOpacity>
        <Text style={s.title}>Claim</Text>
        <View style={{ width: 38 }} />
      </View>

      {/* Tabs */}
      <View style={s.tabs}>
        <TouchableOpacity
          style={[s.tab, tab === 'unclaim' && s.tabActive]}
          onPress={() => setTab('unclaim')}
          activeOpacity={0.7}
        >
          <Text style={[s.tabText, tab === 'unclaim' && s.tabTextActive]}>
            Unclaim{unclaimList.length > 0 ? ` (${unclaimList.length})` : ''}
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[s.tab, tab === 'claimed' && s.tabActive]}
          onPress={() => setTab('claimed')}
          activeOpacity={0.7}
        >
          <Text style={[s.tabText, tab === 'claimed' && s.tabTextActive]}>Claimed</Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      {isLoading ? (
        <View style={s.center}>
          <ActivityIndicator color={Colors.accent} />
        </View>
      ) : (
        <FlatList
          data={pagedList}
          keyExtractor={(item) => item.reg.registrationPda}
          contentContainerStyle={[s.list, { paddingBottom: insets.bottom + 40 }]}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={isRefetching || isRefetchingEvents}
              onRefresh={() => { void Promise.all([refetch(), refetchEvents()]) }}
              tintColor={Colors.accent}
              colors={[Colors.accent]}
              progressBackgroundColor={Colors.bg}
            />
          }
          onEndReached={() => { if (hasMore) setPage((p) => p + 1) }}
          onEndReachedThreshold={0.3}
          ListFooterComponent={
            hasMore
              ? <ActivityIndicator color={Colors.accent} style={s.footerLoader} />
              : pagedList.length > 0 ? <Divider /> : null
          }
          renderItem={({ item }) =>
            tab === 'unclaim' ? (
              <UnclaimCard registration={item.reg} event={item.event} />
            ) : (
              <ClaimedCard registration={item.reg} event={item.event} />
            )
          }
          ListEmptyComponent={
            <View style={s.empty}>
              <Ionicons name="gift-outline" size={40} color={Colors.text3} />
              <Text style={s.emptyTitle}>
                {tab === 'unclaim' ? 'No claimable stakes' : 'No claimed history'}
              </Text>
              <Text style={s.emptyBody}>
                {tab === 'unclaim'
                  ? 'Check in to an event and wait for the unlock time to claim your stake.'
                  : 'Your claimed stakes will appear here.'}
              </Text>
            </View>
          }
        />
      )}
    </View>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.surface2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontFamily: Fonts.display,
    fontSize: 18,
    color: Colors.text1,
    letterSpacing: ls(18, LS.displaySubtle),
  },

  // Tabs
  tabs: {
    flexDirection: 'row',
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.sm,
    gap: Spacing.xs,
  },
  tab: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm - 2,
    borderRadius: 20,
    backgroundColor: Colors.surface2,
  },
  tabActive: {
    backgroundColor: Colors.accent,
  },
  tabText: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 13,
    color: Colors.text2,
  },
  tabTextActive: {
    color: Colors.bg,
  },

  // List
  list: { paddingHorizontal: Spacing.md, gap: Spacing.md, paddingTop: Spacing.xs },
  footerLoader: { paddingVertical: Spacing.lg },

  // Cards
  card: {
    backgroundColor: Colors.surface2,
    borderRadius: 16,
    overflow: 'hidden',
    padding: Spacing.md,
    gap: Spacing.md,
  },
  cardRow: { flexDirection: 'row', gap: Spacing.md, alignItems: 'flex-start' },
  cardImg: {
    width: 64,
    height: 64,
    borderRadius: 10,
    backgroundColor: Colors.surface,
    overflow: 'hidden',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  cardInfo: { flex: 1, gap: 5 },
  cardTitle: {
    fontFamily: Fonts.display,
    fontSize: 15,
    color: Colors.text1,
    letterSpacing: ls(15, LS.displaySubtle),
    lineHeight: 20,
  },
  cardMeta: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  cardMetaText: { fontFamily: Fonts.mono, fontSize: 11, color: Colors.text2 },

  claimedBadge: {
    backgroundColor: Colors.surface,
    borderRadius: 6,
    paddingHorizontal: 8,
    paddingVertical: 4,
    alignSelf: 'flex-start',
  },
  claimedBadgeText: {
    fontFamily: Fonts.mono,
    fontSize: 9,
    color: Colors.success,
    letterSpacing: ls(9, LS.labelWide),
  },

  // Empty
  empty: { alignItems: 'center', paddingTop: 80, gap: Spacing.sm, paddingHorizontal: Spacing.xl },
  emptyTitle: {
    fontFamily: Fonts.display,
    fontSize: 18,
    color: Colors.text2,
    letterSpacing: ls(18, LS.displaySubtle),
    marginTop: Spacing.sm,
  },
  emptyBody: { fontFamily: Fonts.body, fontSize: 13, color: Colors.text3, textAlign: 'center', lineHeight: 20 },
})
