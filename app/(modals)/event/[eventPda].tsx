import { useAuth } from '@/components/auth/auth-provider'
import { EventStatusChip, deriveEventStatus } from '@/components/event/EventStatusChip'
import { StakeChip } from '@/components/event/StakeChip'
import { Button } from '@/components/ui/Button'
import { Colors } from '@/constants/colors'
import { Fonts, LS, ls } from '@/constants/fonts'
import { Spacing } from '@/constants/spacing'
import { useEventDetail } from '@/hooks/api/use-event-detail'
import { useMyRegistrations } from '@/hooks/api/use-my-registrations'
import { useWithdrawEarnings } from '@/hooks/api/use-withdraw-earnings'
import { showErrorFeedback } from '@/lib/app-feedback'
import { Ionicons } from '@expo/vector-icons'
import BottomSheet, { BottomSheetScrollView } from '@gorhom/bottom-sheet'
import { Image } from 'expo-image'
import { router, useLocalSearchParams } from 'expo-router'
import { useMemo, useRef } from 'react'
import { ActivityIndicator, Dimensions, Share, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

const { width, height } = Dimensions.get('window')
const HERO_H = height * 0.48

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric', year: 'numeric' })
}
function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
}
function shortAddr(addr: string) {
  return !addr || addr.length < 10 ? addr : `${addr.slice(0, 4)}…${addr.slice(-4)}`
}

export default function EventDetailModal() {
  const { eventPda } = useLocalSearchParams<{ eventPda: string }>()
  const { data: event, isLoading } = useEventDetail(eventPda)
  const { data: myRegistrations } = useMyRegistrations()
  const { walletAddress } = useAuth()
  const insets = useSafeAreaInsets()
  const bottomSheetRef = useRef<BottomSheet>(null)
  const snapPoints = useMemo(() => ['55%', '90%'], [])

  const isRegistered = myRegistrations?.some((r) => r.eventPda === eventPda)
  const myRegistration = myRegistrations?.find((r) => r.eventPda === eventPda)
  const { canWithdraw, withdrawEarnings, isWithdrawing } = useWithdrawEarnings(event)
  const isOrganizer = !!walletAddress && !!event && walletAddress === event.organizerAddress
  const isEnded = !!event && Date.now() >= new Date(event.endTime).getTime()
  const noShowCount = event ? Math.max(0, event.totalRegistered - event.totalCheckedIn) : 0

  function handleGetTicket() {
    router.push(`/(modals)/buy-ticket/${eventPda}`)
  }
  function handleScanTickets() {
    router.push(`/(modals)/scanner/${eventPda}`)
  }
  async function handleWithdraw() {
    try {
      await withdrawEarnings()
    } catch (e: any) {
      showErrorFeedback(e, 'Withdrawal Failed', 'Could not withdraw earnings')
    }
  }
  async function handleShare() {
    try {
      await Share.share({ message: `Check out ${event?.title} on Tizzle!` })
    } catch {}
  }

  if (isLoading || !event) {
    return (
      <View style={s.loading}>
        <ActivityIndicator color={Colors.accent} />
      </View>
    )
  }

  const status = deriveEventStatus(event.startTime, event.endTime, event.unlockTime)
  const isGatekeeper = !!walletAddress && walletAddress === event.gatekeeperAddress

  return (
    <GestureHandlerRootView style={s.container}>
      {/* ── Hero image (full screen behind sheet) ── */}
      <Image source={{ uri: event.imageUrl }} style={s.hero} contentFit="cover" />

      {/* ── Floating back + share buttons ── */}
      <View style={[s.floatRow, { top: insets.top + Spacing.sm }]}>
        <TouchableOpacity onPress={() => router.back()} style={s.floatBtn} hitSlop={8}>
          <Ionicons name="arrow-back" size={20} color={Colors.text1} />
        </TouchableOpacity>
        <TouchableOpacity onPress={handleShare} style={s.floatBtn} hitSlop={8}>
          <Ionicons name="share-outline" size={20} color={Colors.text1} />
        </TouchableOpacity>
      </View>

      {/* ── Bottom Sheet ── */}
      <BottomSheet
        ref={bottomSheetRef}
        index={0}
        snapPoints={snapPoints}
        enablePanDownToClose={false}
        enableOverDrag={false}
        backgroundStyle={s.sheetBg}
        handleIndicatorStyle={s.handle}
      >
        <BottomSheetScrollView
          contentContainerStyle={[s.sheetContent, { paddingBottom: insets.bottom + 100 }]}
          showsVerticalScrollIndicator={false}
        >
          {/* Title + status */}
          <View style={s.titleRow}>
            <Text style={s.title} numberOfLines={3}>
              {event.title}
            </Text>
            <EventStatusChip status={status} />
          </View>

          {/* Date + time */}
          <View style={s.metaRow}>
            <Ionicons name="calendar-outline" size={13} color={Colors.text3} />
            <Text style={s.metaText}>{fmtDate(event.startTime)}</Text>
            <Text style={s.metaDot}>·</Text>
            <Ionicons name="time-outline" size={13} color={Colors.text3} />
            <Text style={s.metaText}>
              {fmtTime(event.startTime)} - {fmtTime(event.endTime)}
            </Text>
          </View>

          {/* Location */}
          <View style={s.metaRow}>
            <Ionicons name="location-outline" size={13} color={Colors.text3} />
            <Text style={s.metaText} numberOfLines={1}>
              {event.location || 'Location TBA'}
            </Text>
          </View>

          {/* Maps placeholder */}
          {/* TODO: Integrate real maps once map library is set up */}
          <View style={s.mapPlaceholder}>
            <Ionicons name="map-outline" size={24} color={Colors.text3} />
            <Text style={s.mapText}>Map coming soon</Text>
          </View>

          {/* Venue placeholder */}
          {/* TODO: Replace with real venue image once backend provides venueImageUrl field */}
          <View style={s.section}>
            <Text style={s.sectionTitle}>Venue</Text>
            <View style={s.venuePlaceholder}>
              <Ionicons name="business-outline" size={28} color={Colors.text3} />
              <Text style={s.venueText}>{event.location || 'Venue TBA'}</Text>
            </View>
          </View>

          {/* Description */}
          {/* Stake info */}
          <View style={s.section}>
            <Text style={s.sectionTitle}>Details</Text>
            <View style={s.detailGrid}>
              <View style={s.detailItem}>
                <Text style={s.detailLabel}>CAPACITY</Text>
                <Text style={s.detailValue}>
                  {event.totalRegistered} / {event.capacity}
                </Text>
              </View>
              <View style={s.detailItem}>
                <Text style={s.detailLabel}>CATEGORY</Text>
                <Text style={s.detailValue}>{event.category || '—'}</Text>
              </View>
              <View style={s.detailItem}>
                <Text style={s.detailLabel}>STAKE</Text>
                <StakeChip
                  stakeAmount={event.stakeAmount}
                  stakeTokenMint={event.stakeTokenMint}
                  stakeTokenSymbol={event.stakeTokenSymbol}
                  stakeTokenDecimals={event.stakeTokenDecimals}
                />
              </View>
            </View>
          </View>

          {/* Organization */}
          <View style={s.section}>
            <Text style={s.sectionTitle}>Organizer</Text>
            <View style={s.orgRow}>
              <View style={s.orgAvatar}>
                <Ionicons name="business-outline" size={16} color={Colors.text2} />
              </View>
              <View style={s.orgInfo}>
                <Text style={s.orgName}>{shortAddr(event.organizerAddress)}</Text>
                <Text style={s.orgSub}>Event Organizer</Text>
              </View>
            </View>
          </View>

          {/* Description */}
          {!!event.description && (
            <View style={s.section}>
              <Text style={s.sectionTitle}>About</Text>
              <Text style={s.description}>{event.description}</Text>
            </View>
          )}

          {/* Organizer settlement */}
          {isOrganizer && isEnded && (
            <View style={s.section}>
              <Text style={s.sectionTitle}>Settlement</Text>
              <View style={s.settlementRow}>
                <Text style={s.detailLabel}>NO-SHOWS</Text>
                <Text style={s.detailValue}>{noShowCount}</Text>
              </View>
              {canWithdraw ? (
                <Button onPress={handleWithdraw} loading={isWithdrawing}>
                  {isWithdrawing ? 'Withdrawing…' : 'Withdraw Earnings'}
                </Button>
              ) : event?.organizerWithdrawn ? (
                <Text style={s.notice}>Earnings already withdrawn.</Text>
              ) : (
                <Text style={s.notice}>
                  Available after{' '}
                  {event
                    ? new Date(event.unlockTime).toLocaleDateString('en-US', {
                        month: 'short',
                        day: 'numeric',
                        year: 'numeric',
                      })
                    : '—'}
                </Text>
              )}
            </View>
          )}
        </BottomSheetScrollView>
      </BottomSheet>

      {/* ── Pinned CTA ── */}
      <View style={[s.cta, { paddingBottom: insets.bottom + Spacing.sm }]}>
        {isGatekeeper && (
          <Button onPress={handleScanTickets} variant="secondary" style={{ marginBottom: Spacing.sm }}>
            Scan Tickets
          </Button>
        )}
        {isRegistered ? (
          <TouchableOpacity
            style={s.showTicketBtn}
            onPress={() => router.push(`/(modals)/tickets/${myRegistration?.registrationPda}`)}
            activeOpacity={0.8}
          >
            <Text style={s.showTicketText}>Show My Ticket</Text>
            <Ionicons name="ticket-outline" size={18} color={Colors.accent} />
          </TouchableOpacity>
        ) : status === 'Available' ? (
          <Button onPress={handleGetTicket}>Register</Button>
        ) : null}
      </View>
    </GestureHandlerRootView>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.bg },
  hero: { position: 'absolute', top: 0, left: 0, width, height: HERO_H },

  floatRow: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    zIndex: 10,
  },
  floatBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },

  sheetBg: { backgroundColor: Colors.surface, borderTopLeftRadius: 28, borderTopRightRadius: 28 },
  handle: { backgroundColor: Colors.border2, width: 36, height: 4 },
  sheetContent: { paddingHorizontal: Spacing.md, paddingTop: Spacing.md, gap: Spacing.md },

  titleRow: { flexDirection: 'row', alignItems: 'flex-start', justifyContent: 'space-between', gap: Spacing.sm },
  title: {
    flex: 1,
    fontFamily: Fonts.display,
    fontSize: 26,
    color: Colors.text1,
    letterSpacing: ls(26, LS.display),
    lineHeight: 32,
  },

  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  metaText: { fontFamily: Fonts.body, fontSize: 13, color: Colors.text2 },
  metaDot: { color: Colors.text3, fontSize: 13 },

  mapPlaceholder: {
    height: 120,
    backgroundColor: Colors.surface2,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  mapText: { fontFamily: Fonts.body, fontSize: 13, color: Colors.text3 },

  section: { gap: Spacing.sm },
  sectionTitle: {
    fontFamily: Fonts.display,
    fontSize: 16,
    color: Colors.text1,
    letterSpacing: ls(16, LS.displaySubtle),
  },

  venuePlaceholder: {
    height: 140,
    backgroundColor: Colors.surface2,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  venueText: { fontFamily: Fonts.body, fontSize: 13, color: Colors.text3 },

  orgRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.md },
  orgAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.surface2,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border2,
  },
  orgInfo: { gap: 2 },
  orgName: { fontFamily: Fonts.display, fontSize: 15, color: Colors.text1, letterSpacing: ls(15, LS.displaySubtle) },
  orgSub: { fontFamily: Fonts.body, fontSize: 12, color: Colors.text3 },

  description: { fontFamily: Fonts.body, fontSize: 14, color: Colors.text2, lineHeight: 22 },

  detailGrid: { gap: Spacing.sm },
  detailItem: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  detailLabel: { fontFamily: Fonts.mono, fontSize: 9, color: Colors.text3, letterSpacing: ls(9, LS.labelWide) },
  detailValue: { fontFamily: Fonts.bodyMedium, fontSize: 13, color: Colors.text1 },

  settlementRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  notice: { fontFamily: Fonts.body, fontSize: 13, color: Colors.text3, textAlign: 'center' },

  cta: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    backgroundColor: Colors.surface,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  showTicketBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
  },
  showTicketText: {
    fontFamily: Fonts.display,
    fontSize: 18,
    color: Colors.accent,
    letterSpacing: ls(18, LS.displaySubtle),
  },
})
