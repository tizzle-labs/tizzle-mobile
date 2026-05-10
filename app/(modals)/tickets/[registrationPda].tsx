import { Button } from '@/components/ui/Button'
import { Colors } from '@/constants/colors'
import { Fonts, LS, ls } from '@/constants/fonts'
import { Spacing } from '@/constants/spacing'
import { useEventDetail } from '@/hooks/api/use-event-detail'
import { useMyRegistrations } from '@/hooks/api/use-my-registrations'
import { useCluster } from '@/components/cluster/cluster-provider'
import { ClusterNetwork } from '@/components/cluster/cluster-network'
import { useTicketLifecycle } from '@/hooks/api/use-ticket-lifecycle'
import { showErrorFeedback } from '@/lib/app-feedback'
import { Ionicons } from '@expo/vector-icons'
import { Image } from 'expo-image'
import { router, useLocalSearchParams } from 'expo-router'
import { ActivityIndicator, Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import QRCode from 'react-qr-code'

const NOTCH = 16

function formatDate(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
}

function formatTime(iso: string) {
  return new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
}

function shortenAddress(addr: string) {
  return !addr || addr.length < 10 ? addr : `${addr.slice(0, 6)}…${addr.slice(-4)}`
}

const STATUS_COLOR: Record<string, string> = {
  valid: Colors.accent,
  claimable: Colors.warning,
  'no-show': Colors.error,
  refunded: Colors.text2,
}

export default function TicketDetail() {
  const { registrationPda } = useLocalSearchParams<{ registrationPda: string }>()
  const { data: regs, isLoading: regsLoading } = useMyRegistrations()
  const reg = regs?.find((r) => r.registrationPda === registrationPda)
  const { data: ev, isLoading: eventLoading } = useEventDetail(reg?.eventPda ?? '')
  const { status, claimRefund, isClaimingRefund } = useTicketLifecycle(reg, ev)
  const { selectedCluster } = useCluster()
  const insets = useSafeAreaInsets()

  function getSolscanUrl(sig: string) {
    const param =
      selectedCluster.network === ClusterNetwork.Devnet ? '?cluster=devnet'
      : selectedCluster.network === ClusterNetwork.Testnet ? '?cluster=testnet'
      : ''
    return `https://solscan.io/tx/${sig}${param}`
  }

  if (regsLoading || eventLoading || !reg || !ev) {
    return (
      <View style={s.loading}>
        <ActivityIndicator color={Colors.accent} />
      </View>
    )
  }

  const stake = `${Number(reg.stakeAmount) / Math.pow(10, ev.stakeTokenDecimals)} ${ev.stakeTokenSymbol}`
  const statusColor = STATUS_COLOR[status] ?? Colors.text2

  async function handleClaim() {
    try {
      await claimRefund()
    } catch (e: any) {
      showErrorFeedback(e, 'Claim Failed', 'Could not claim your stake refund')
    }
  }

  return (
    <View style={s.container}>
      {/* Header — fixed outside scroll */}
      <View style={[s.header, { paddingTop: insets.top + Spacing.sm }]}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn} hitSlop={12}>
          <Ionicons name="arrow-back" size={20} color={Colors.text1} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Ticket Detail</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView
        style={s.scroll}
        contentContainerStyle={[s.scrollContent, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Ticket stub card */}
        <View style={s.ticket}>
          {/* QR section */}
          <View style={s.qrSection}>
            <View style={s.qrLabelRow}>
              <Ionicons name="scan-outline" size={13} color={Colors.text2} />
              <Text style={s.qrLabel}>SCAN TO CHECK IN</Text>
            </View>
            <View style={s.qrWrap}>
              <View style={s.qrBox}>
                <QRCode value={registrationPda} size={200} />
              </View>
              {reg.checkedIn && (
                <Image
                  source={require('../../../assets/images/check-in-stamp.png')}
                  style={s.stamp}
                  contentFit="contain"
                />
              )}
            </View>
          </View>

          {/* Perforated tear line */}
          <View style={s.tearLine}>
            <View style={s.notchLeft} />
            <View style={s.dashedLine}>
              {Array.from({ length: 40 }).map((_, i) => (
                <View key={i} style={s.dash} />
              ))}
            </View>
            <View style={s.notchRight} />
          </View>

          {/* Event info */}
          <View style={s.infoSection}>
            <Text style={s.eventTitle} numberOfLines={2}>
              {ev.title}
            </Text>

            <View style={s.infoDivider} />

            <View style={s.infoGrid}>
              <View style={s.infoCell}>
                <Text style={s.infoLabel}>DATE</Text>
                <Text style={s.infoValue}>{formatDate(ev.startTime)}</Text>
              </View>
              <View style={s.infoCell}>
                <Text style={s.infoLabel}>TIME</Text>
                <Text style={s.infoValue}>
                  {formatTime(ev.startTime)} – {formatTime(ev.endTime)}
                </Text>
              </View>
            </View>

            <View style={s.infoDivider} />

            <View style={s.infoGrid}>
              <View style={s.infoCell}>
                <Text style={s.infoLabel}>LOCATION</Text>
                <Text style={s.infoValue} numberOfLines={2}>
                  {ev.location || 'TBA'}
                </Text>
              </View>
              <View style={s.infoCell}>
                <Text style={s.infoLabel}>STATUS</Text>
                <Text style={[s.infoValue, { color: statusColor }]}>{status.replace('-', ' ').toUpperCase()}</Text>
              </View>
            </View>

            <View style={s.infoDivider} />

            <View style={s.infoGrid}>
              <View style={s.infoCell}>
                <Text style={s.infoLabel}>STAKED</Text>
                <Text style={s.infoValue}>{stake}</Text>
              </View>
              <View style={s.infoCell}>
                <Text style={s.infoLabel}>REGISTERED</Text>
                <Text style={s.infoValue}>{formatDate(reg.registeredAt)}</Text>
              </View>
            </View>

            {reg.checkedInAt && (
              <>
                <View style={s.infoDivider} />
                <View style={s.infoGrid}>
                  <View style={s.infoCell}>
                    <Text style={s.infoLabel}>CHECKED IN</Text>
                    <Text style={s.infoValue}>{formatDate(reg.checkedInAt)}</Text>
                  </View>
                </View>
              </>
            )}
          </View>

          {/* Stub footer */}
          <View style={s.stubFooter}>
            <View style={s.stubRow}>
              <Text style={s.stubLabel}>TX HASH</Text>
              <TouchableOpacity
                style={s.txHashBtn}
                onPress={() => Linking.openURL(getSolscanUrl(reg.transactionSignature))}
                hitSlop={8}
              >
                <Text style={s.stubValue}>{shortenAddress(reg.transactionSignature)}</Text>
                <Ionicons name="open-outline" size={12} color={Colors.text1} />
              </TouchableOpacity>
            </View>
          </View>
        </View>

        {/* Actions below card */}
        <View style={s.actions}>
          {status === 'claimable' && (
            <Button onPress={handleClaim} loading={isClaimingRefund}>
              {isClaimingRefund ? 'Claiming on Solana…' : 'Claim Stake'}
            </Button>
          )}
          {status === 'valid' && (
            <Text style={s.notice}>Your stake is locked on-chain until the event ends.</Text>
          )}
          {status === 'no-show' && (
            <Text style={s.notice}>You did not check in. Your staked amount has been forfeited.</Text>
          )}
          {status === 'refunded' && (
            <Text style={s.notice}>Your stake has been returned to your wallet.</Text>
          )}
        </View>
      </ScrollView>
    </View>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.bg },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: Spacing.md },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.md,
    backgroundColor: Colors.bg,
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
    fontSize: 18,
    color: Colors.text1,
    letterSpacing: ls(18, LS.displaySubtle),
  },

  // Ticket card
  ticket: {
    backgroundColor: Colors.surface2,
    borderRadius: 20,
    overflow: 'hidden',
  },

  // QR section
  qrSection: {
    alignItems: 'center',
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.lg,
    paddingHorizontal: Spacing.md,
    gap: Spacing.md,
  },
  qrLabelRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  qrLabel: {
    fontFamily: Fonts.mono,
    fontSize: 11,
    color: Colors.text2,
    letterSpacing: ls(11, LS.labelWide),
  },
  qrWrap: { position: 'relative', alignItems: 'center', justifyContent: 'center' },
  qrBox: { backgroundColor: '#FFFFFF', padding: 14, borderRadius: 14 },
  stamp: { position: 'absolute', width: 240, height: 240, opacity: 0.92, zIndex: 10 },

  // Perforated tear line
  tearLine: { flexDirection: 'row', alignItems: 'center', height: NOTCH, overflow: 'hidden' },
  notchLeft: {
    width: NOTCH,
    height: NOTCH,
    borderRadius: NOTCH / 2,
    backgroundColor: Colors.bg,
    marginLeft: -(NOTCH / 2),
    flexShrink: 0,
  },
  dashedLine: { flex: 1, flexDirection: 'row', gap: 5, overflow: 'hidden', alignItems: 'center' },
  dash: { width: 4, height: 1.5, backgroundColor: Colors.border2, flexShrink: 0 },
  notchRight: {
    width: NOTCH,
    height: NOTCH,
    borderRadius: NOTCH / 2,
    backgroundColor: Colors.bg,
    marginRight: -(NOTCH / 2),
    flexShrink: 0,
  },

  // Info section
  infoSection: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.md, paddingBottom: Spacing.lg, gap: Spacing.md },
  eventTitle: {
    fontFamily: Fonts.display,
    fontSize: 24,
    color: Colors.text1,
    letterSpacing: ls(24, LS.display),
    lineHeight: 30,
  },
  infoDivider: { height: 1, backgroundColor: Colors.border },
  infoGrid: { flexDirection: 'row', gap: Spacing.lg },
  infoCell: { flex: 1, gap: 5 },
  infoLabel: {
    fontFamily: Fonts.mono,
    fontSize: 9,
    color: Colors.text2,
    letterSpacing: ls(9, LS.labelWide),
  },
  infoValue: { fontFamily: Fonts.bodyMedium, fontSize: 14, color: Colors.text1, lineHeight: 20 },

  // Stub footer (below tear line)
  stubFooter: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.sm, paddingBottom: Spacing.md, gap: Spacing.sm },
  stubRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  stubLabel: {
    fontFamily: Fonts.mono,
    fontSize: 9,
    color: Colors.text3,
    letterSpacing: ls(9, LS.labelWide),
  },
  stubValue: { fontFamily: Fonts.mono, fontSize: 12, color: Colors.text1 },
  txHashBtn: { flexDirection: 'row', alignItems: 'center', gap: 5 },

  // Actions
  actions: { marginTop: Spacing.lg, gap: Spacing.md },
  notice: { fontFamily: Fonts.body, fontSize: 13, color: Colors.text3, textAlign: 'center', lineHeight: 20 },
})
