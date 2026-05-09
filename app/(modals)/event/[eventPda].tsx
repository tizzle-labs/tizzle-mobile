import { useAuth } from '@/components/auth/auth-provider'
import { EventMap } from '@/components/event/EventMap'
import { EventStatusChip, deriveEventStatus } from '@/components/event/EventStatusChip'
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
import { useMemo, useRef, useState } from 'react'
import {
  ActivityIndicator,
  Dimensions,
  LayoutChangeEvent,
  Linking,
  Share,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
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
  const [ctaHeight, setCtaHeight] = useState(100)

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
  const stakeDisplay = (Number(event.stakeAmount) / Math.pow(10, event.stakeTokenDecimals)).toString()

  return (
    <GestureHandlerRootView style={s.container}>
      <Image source={{ uri: event.imageUrl }} style={s.hero} contentFit="cover" />

      <View style={[s.floatRow, { top: insets.top + Spacing.sm }]}>
        <TouchableOpacity onPress={() => router.back()} style={s.floatBtn} hitSlop={8}>
          <Ionicons name="arrow-back" size={20} color={Colors.text1} />
        </TouchableOpacity>
        <TouchableOpacity onPress={handleShare} style={s.floatBtn} hitSlop={8}>
          <Ionicons name="share-outline" size={20} color={Colors.text1} />
        </TouchableOpacity>
      </View>

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
          contentContainerStyle={[s.sheetContent, { paddingBottom: ctaHeight + Spacing.md }]}
          showsVerticalScrollIndicator={false}
        >
          {/* Title + status */}
          <View style={s.titleRow}>
            <Text style={s.title} numberOfLines={3}>
              {event.title}
            </Text>
            <EventStatusChip status={status} />
          </View>

          {/* Org inline under title */}
          <View style={s.orgInlineRow}>
            {event.organizationAvatarUrl ? (
              <Image source={{ uri: event.organizationAvatarUrl }} style={s.orgInlineAvatar} contentFit="cover" />
            ) : (
              <View style={s.orgInlineAvatarFallback}>
                <Ionicons name="business-outline" size={11} color={Colors.text3} />
              </View>
            )}
            <Text style={s.orgInlineName} numberOfLines={1}>
              {event.organizationName ?? shortAddr(event.organizerAddress)}
            </Text>
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

          {/* Map */}
          {event.latitude && event.longitude ? (
            <EventMap latitude={event.latitude} longitude={event.longitude} locationText={event.location} />
          ) : (
            <TouchableOpacity
              style={s.mapPlaceholder}
              activeOpacity={0.7}
              onPress={() => Linking.openURL(`https://maps.google.com/?q=${encodeURIComponent(event.location)}`)}
            >
              <Ionicons name="map-outline" size={24} color={Colors.text3} />
              <Text style={s.mapText}>Open in Maps</Text>
            </TouchableOpacity>
          )}

          {/* Venue — only shown if venueImageUrl exists */}
          {!!event.venueImageUrl && (
            <View style={s.section}>
              <Text style={s.sectionTitle}>Venue</Text>
              <Image source={{ uri: event.venueImageUrl }} style={s.venueImage} contentFit="cover" />
            </View>
          )}

          {/* Details */}
          <View style={s.section}>
            <Text style={s.sectionTitle}>Details</Text>
            <View style={s.detailGrid}>
              <View style={s.detailRow}>
                <View style={s.detailCard}>
                  <Text style={s.detailLabel}>CAPACITY</Text>
                  <Text style={s.detailValue}>
                    {event.totalRegistered} / {event.capacity}
                  </Text>
                  <Text style={s.detailSub}>registered</Text>
                </View>
                <View style={s.detailCard}>
                  <Text style={s.detailLabel}>CATEGORY</Text>
                  <Text style={s.detailValue}>{event.category || '—'}</Text>
                  <Text style={s.detailSub}>type</Text>
                </View>
              </View>
              <View style={s.detailCardWide}>
                <Text style={s.detailLabel}>STAKE REQUIRED</Text>
                <Text style={s.stakeValue}>
                  {stakeDisplay} {event.stakeTokenSymbol}
                </Text>
                <Text style={s.detailSub}>locked on-chain · returned after check-in</Text>
              </View>
            </View>
          </View>

          {/* About */}
          {!!event.description && (
            <View style={s.section}>
              <Text style={s.sectionTitle}>About</Text>
              <Text style={s.description}>{event.description}</Text>
            </View>
          )}

          {/* Settlement */}
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
                  {new Date(event.unlockTime).toLocaleDateString('en-US', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric',
                  })}
                </Text>
              )}
            </View>
          )}
        </BottomSheetScrollView>
      </BottomSheet>

      {/* Pinned CTA */}
      <View
        style={[s.cta, { paddingBottom: insets.bottom + Spacing.sm }]}
        onLayout={(e: LayoutChangeEvent) => setCtaHeight(e.nativeEvent.layout.height)}
      >
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
          <Button onPress={handleGetTicket}>Get Ticket</Button>
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

  orgInlineRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  orgInlineAvatar: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Colors.surface2,
    borderWidth: 1,
    borderColor: Colors.border2,
  },
  orgInlineAvatarFallback: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Colors.surface2,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border2,
  },
  orgInlineName: { fontFamily: Fonts.bodyMedium, fontSize: 13, color: Colors.text2, flex: 1 },

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

  venueImage: { width: '100%', height: 180, borderRadius: 12 },

  detailGrid: { gap: Spacing.sm },
  detailRow: { flexDirection: 'row', gap: Spacing.sm },
  detailCard: {
    flex: 1,
    backgroundColor: Colors.surface2,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    gap: 4,
  },
  detailCardWide: {
    backgroundColor: Colors.surface2,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    gap: 4,
  },
  detailLabel: {
    fontFamily: Fonts.mono,
    fontSize: 10,
    color: Colors.text3,
    letterSpacing: ls(10, LS.labelWide),
    textTransform: 'uppercase',
  },
  detailValue: {
    fontFamily: Fonts.display,
    fontSize: 18,
    color: Colors.text1,
    letterSpacing: ls(18, LS.displaySubtle),
  },
  detailSub: { fontFamily: Fonts.body, fontSize: 11, color: Colors.text3 },
  stakeValue: {
    fontFamily: Fonts.display,
    fontSize: 28,
    color: Colors.accent,
    letterSpacing: ls(28, LS.displayTight),
    lineHeight: 34,
  },

  description: { fontFamily: Fonts.body, fontSize: 14, color: Colors.text2, lineHeight: 22 },

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
