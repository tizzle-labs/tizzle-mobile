import { Button } from '@/components/ui/Button'
import { LoadingScreen } from '@/components/ui/LoadingScreen'
import { SOL_MINT, TokenAmount, formatTokenAmount } from '@/components/ui/TokenAmount'
import { WalletBalance } from '@/components/wallet/WalletBalance'
import { Colors } from '@/constants/colors'
import { Fonts, LS, ls } from '@/constants/fonts'
import { Spacing } from '@/constants/spacing'
import { useEventDetail } from '@/hooks/api/use-event-detail'
import { useRegisterEvent } from '@/hooks/api/use-register-event'
import { useWalletBalance } from '@/hooks/solana/use-wallet-balance'
import { showErrorFeedback } from '@/lib/app-feedback'
import { Ionicons } from '@expo/vector-icons'
import { Image } from 'expo-image'
import { router, useLocalSearchParams } from 'expo-router'
import { useState } from 'react'
import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

function fmtDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric', year: 'numeric' })
}
function fmtTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
}

export default function BuyTicketModal() {
  const { eventPda } = useLocalSearchParams<{ eventPda: string }>()
  const { data: event, isLoading } = useEventDetail(eventPda)
  const registerMutation = useRegisterEvent()
  const { data: balance } = useWalletBalance(event?.stakeTokenMint ?? SOL_MINT)
  const insets = useSafeAreaInsets()
  const [imageVisible, setImageVisible] = useState(false)

  if (isLoading || !event) {
    return <LoadingScreen />
  }

  const stakeNum = Number(event.stakeAmount) / Math.pow(10, event.stakeTokenDecimals)
  const hasEnoughBalance = (balance ?? 0) >= stakeNum
  const isSOL = event.stakeTokenMint === SOL_MINT

  async function handleDeposit() {
    if (!event) return
    try {
      const result = await registerMutation.mutateAsync({ event })
      router.replace(`/(modals)/tickets/${result.registrationPda}`)
    } catch (e) {
      showErrorFeedback(e, 'Registration Failed', 'We could not register this ticket.')
    }
  }

  return (
    <View style={s.container}>
      {/* Header */}
      <View style={[s.header, { paddingTop: insets.top + Spacing.sm }]}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn} hitSlop={12}>
          <Ionicons name="arrow-back" size={20} color={Colors.text1} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>GET TICKET</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView
        style={s.scroll}
        contentContainerStyle={[s.scrollContent, { paddingBottom: insets.bottom + 100 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Event card */}
        <View style={s.eventCard}>
          {!!event.imageUrl && (
            <Image
              source={{ uri: event.imageUrl }}
              style={[s.eventImage, !imageVisible && s.imageHidden]}
              contentFit="cover"
              onLoad={() => setImageVisible(true)}
              onError={() => setImageVisible(false)}
            />
          )}
          <View style={s.eventBody}>
            {/* Org badge */}
            {(event.organizationAvatarUrl || event.organizationName) && (
              <View style={s.orgBadge}>
                {!!event.organizationAvatarUrl && (
                  <Image source={{ uri: event.organizationAvatarUrl }} style={s.orgAvatar} contentFit="cover" />
                )}
                {!!event.organizationName && (
                  <Text style={s.orgName} numberOfLines={1}>
                    {event.organizationName}
                  </Text>
                )}
              </View>
            )}

            <Text style={s.eventTitle} numberOfLines={3}>
              {event.title}
            </Text>

            <View style={s.metaGrid}>
              <View style={s.metaRow}>
                <View style={s.metaIcon}>
                  <Ionicons name="calendar-outline" size={13} color={Colors.text3} />
                </View>
                <Text style={s.metaText}>{fmtDate(event.startTime)}</Text>
              </View>
              <View style={s.metaRow}>
                <View style={s.metaIcon}>
                  <Ionicons name="time-outline" size={13} color={Colors.text3} />
                </View>
                <Text style={s.metaText}>
                  {fmtTime(event.startTime)} – {fmtTime(event.endTime)}
                </Text>
              </View>
              {!!event.location && (
                <View style={s.metaRow}>
                  <View style={s.metaIcon}>
                    <Ionicons name="location-outline" size={13} color={Colors.text3} />
                  </View>
                  <Text style={s.metaText} numberOfLines={1}>
                    {event.location}
                  </Text>
                </View>
              )}
            </View>
          </View>
        </View>

        {/* Stake required */}
        <View style={s.card}>
          <Text style={s.cardLabel}>REQUIRED STAKE</Text>
          <View style={s.stakeAmount}>
            <TokenAmount
              amount={event.stakeAmount}
              mint={event.stakeTokenMint}
              symbol={event.stakeTokenSymbol}
              decimals={event.stakeTokenDecimals}
              size="lg"
            />
          </View>
          <View style={s.divider} />
          <View style={s.balanceRow}>
            <Text style={s.balanceLabel}>YOUR BALANCE</Text>
            <View style={s.balanceRight}>
              {!hasEnoughBalance && (
                <Ionicons name="warning-outline" size={12} color={Colors.error} style={{ marginRight: 4 }} />
              )}
              <WalletBalance mint={event.stakeTokenMint} symbol={event.stakeTokenSymbol} />
            </View>
          </View>
          {!isSOL && (
            <Text style={s.mintAddress} numberOfLines={1} ellipsizeMode="middle">
              {event.stakeTokenMint}
            </Text>
          )}
        </View>

        {/* Summary */}
        <View style={s.card}>
          <Text style={s.cardLabel}>TRANSACTION SUMMARY</Text>
          <View style={s.summaryRow}>
            <Text style={s.summaryKey}>Stake deposit</Text>
            <Text style={s.summaryVal}>
              {formatTokenAmount(event.stakeAmount, event.stakeTokenDecimals)} {event.stakeTokenSymbol}
            </Text>
          </View>
          <View style={s.divider} />
          <View style={s.summaryRow}>
            <Text style={s.summaryKey}>Network fee</Text>
            <Text style={s.summaryVal}>~0.000005 SOL</Text>
          </View>
          <View style={s.divider} />
          <View style={s.summaryRow}>
            <Text style={s.summaryKey}>Registered</Text>
            <Text style={s.summaryVal}>
              {event.totalRegistered} / {event.capacity}
            </Text>
          </View>
        </View>

        {/* Stake notice */}
        <View style={s.noticeRow}>
          <Ionicons name="shield-checkmark-outline" size={15} color={Colors.text3} />
          <Text style={s.noticeText}>
            Your stake is locked on-chain and returned after you check in. No-shows forfeit their stake.
          </Text>
        </View>

        {!hasEnoughBalance && (
          <View style={s.errorBanner}>
            <Ionicons name="warning-outline" size={14} color={Colors.error} />
            <Text style={s.errorText}>Insufficient {event.stakeTokenSymbol} balance to register</Text>
          </View>
        )}
      </ScrollView>

      {/* CTA */}
      <View style={[s.cta, { paddingBottom: insets.bottom + Spacing.sm }]}>
        <Button onPress={handleDeposit} disabled={!hasEnoughBalance} loading={registerMutation.isPending}>
          {registerMutation.isPending ? 'Confirming on Solana…' : 'Deposit & Register'}
        </Button>
      </View>
    </View>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.bg },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.surface2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerTitle: {
    fontFamily: Fonts.display,
    fontSize: 16,
    color: Colors.text1,
    letterSpacing: ls(16, LS.displaySubtle),
  },

  scroll: { flex: 1 },
  scrollContent: { padding: Spacing.md, gap: Spacing.md },

  // Event card
  eventCard: {
    backgroundColor: Colors.surface2,
    borderRadius: 16,
    overflow: 'hidden',
  },
  eventImage: {
    width: '100%',
    aspectRatio: 16 / 9,
  },
  imageHidden: { height: 0, aspectRatio: undefined },
  eventBody: {
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  orgBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  orgAvatar: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: Colors.surface,
  },
  orgName: {
    fontFamily: Fonts.body,
    fontSize: 12,
    color: Colors.text2,
  },
  eventTitle: {
    fontFamily: Fonts.display,
    fontSize: 24,
    color: Colors.text1,
    letterSpacing: ls(24, LS.displaySubtle),
    lineHeight: 30,
  },
  metaGrid: { gap: 6 },
  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  metaIcon: { width: 16, alignItems: 'center' },
  metaText: { fontFamily: Fonts.body, fontSize: 13, color: Colors.text1, flex: 1 },

  // Generic card
  card: {
    backgroundColor: Colors.surface2,
    borderRadius: 16,
    padding: Spacing.md,
    gap: Spacing.sm,
  },
  cardLabel: {
    fontFamily: Fonts.mono,
    fontSize: 9,
    color: Colors.text3,
    letterSpacing: ls(9, LS.labelWide),
    textTransform: 'uppercase',
  },
  stakeAmount: {
    paddingVertical: Spacing.xs,
  },
  divider: { height: 1, backgroundColor: Colors.border },

  // Balance row
  balanceRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  balanceLabel: {
    fontFamily: Fonts.mono,
    fontSize: 9,
    color: Colors.text3,
    letterSpacing: ls(9, LS.labelWide),
    textTransform: 'uppercase',
  },
  balanceRight: { flexDirection: 'row', alignItems: 'center' },
  mintAddress: { fontFamily: Fonts.mono, fontSize: 10, color: Colors.text3 },

  // Summary rows
  summaryRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingVertical: 2 },
  summaryKey: { fontFamily: Fonts.body, fontSize: 14, color: Colors.text2 },
  summaryVal: { fontFamily: Fonts.bodyMedium, fontSize: 14, color: Colors.text1 },

  // Notice
  noticeRow: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    gap: 8,
    paddingHorizontal: Spacing.xs,
  },
  noticeText: { flex: 1, fontFamily: Fonts.body, fontSize: 12, color: Colors.text3, lineHeight: 18 },

  // Error banner
  errorBanner: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: 'rgba(255,59,48,0.1)',
    borderRadius: 10,
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.md,
  },
  errorText: {
    fontFamily: Fonts.mono,
    fontSize: 11,
    color: Colors.error,
    letterSpacing: ls(11, LS.labelNarrow),
  },

  // CTA
  cta: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.bg,
  },
})
