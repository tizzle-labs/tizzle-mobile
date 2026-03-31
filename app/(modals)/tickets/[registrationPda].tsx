import { Button } from '@/components/ui/Button'
import { Colors } from '@/constants/colors'
import { Fonts, LS, ls } from '@/constants/fonts'
import { Spacing } from '@/constants/spacing'
import { useEventDetail } from '@/hooks/api/use-event-detail'
import { useMyRegistrations } from '@/hooks/api/use-my-registrations'
import { useTicketLifecycle } from '@/hooks/api/use-ticket-lifecycle'
import { showErrorFeedback } from '@/lib/app-feedback'
import { Ionicons } from '@expo/vector-icons'
import { Image } from 'expo-image'
import { router, useLocalSearchParams } from 'expo-router'
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import QRCode from 'react-qr-code'
const TBG = '#f0efeb',
  TT = '#1A1200',
  N = 16
function fd(iso: string) {
  const d = new Date(iso),
    n = new Date(),
    t = new Date(n)
  t.setDate(n.getDate() + 1)
  if (d.toDateString() === n.toDateString()) return 'Today'
  if (d.toDateString() === t.toDateString()) return 'Tomorrow'
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric', year: 'numeric' })
}
function ft(iso: string) {
  return new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
}
function sa(a: string) {
  return !a || a.length < 10 ? a : `${a.slice(0, 6)}…${a.slice(-4)}`
}
export default function TicketDetail() {
  const { registrationPda } = useLocalSearchParams<{ registrationPda: string }>()
  const { data: regs, isLoading: rl } = useMyRegistrations()
  const reg = regs?.find((r) => r.registrationPda === registrationPda)
  const { data: ev, isLoading: el } = useEventDetail(reg?.eventPda ?? '')
  const { status, claimRefund, isClaimingRefund } = useTicketLifecycle(reg, ev)
  const ins = useSafeAreaInsets()
  if (rl || el || !reg || !ev)
    return (
      <View style={s.ld}>
        <ActivityIndicator color={Colors.accent} />
      </View>
    )
  const stake = `${Number(reg.stakeAmount) / Math.pow(10, ev.stakeTokenDecimals)} ${ev.stakeTokenSymbol}`
  async function claim() {
    try {
      await claimRefund()
    } catch (e: any) {
      showErrorFeedback(e, 'Claim Failed', 'Could not claim your stake refund')
    }
  }
  return (
    <View style={s.c}>
      <ScrollView
        style={s.sc}
        contentContainerStyle={[s.scc, { paddingTop: ins.top + Spacing.sm, paddingBottom: ins.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={s.hd}>
          <TouchableOpacity onPress={() => router.back()} style={s.bb} hitSlop={12}>
            <Ionicons name="arrow-back" size={20} color={Colors.text1} />
          </TouchableOpacity>
          <Text style={s.ht}>Ticket Detail</Text>
          <View style={{ width: 38 }} />
        </View>
        <View style={s.tk}>
          <View style={s.qrs}>
            <Text style={s.qrl}>SCAN TO CHECK IN</Text>
            <View style={s.qrWrap}>
              <View style={s.qrb}>
                <QRCode value={registrationPda} size={180} />
              </View>
              {reg.checkedIn && (
                <Image
                  source={require('../../../assets/images/check-in-stamp.png')}
                  style={s.stamp}
                  contentFit="contain"
                />
              )}
            </View>
            <Text style={s.qrp}>{sa(registrationPda)}</Text>
          </View>
          <View style={s.is}>
            <Text style={s.et} numberOfLines={2}>
              {ev.title}
            </Text>
            <View style={s.ig}>
              <View style={s.ic}>
                <Text style={s.il}>DATE</Text>
                <Text style={s.iv}>{fd(ev.startTime)}</Text>
              </View>
              <View style={s.ic}>
                <Text style={s.il}>TIME</Text>
                <Text style={s.iv}>
                  {ft(ev.startTime)} - {ft(ev.endTime)}
                </Text>
              </View>
            </View>
            <View style={s.ig}>
              <View style={s.ic}>
                <Text style={s.il}>LOCATION</Text>
                <Text style={s.iv} numberOfLines={2}>
                  {ev.location || 'TBA'}
                </Text>
              </View>
              <View style={s.ic}>
                <Text style={s.il}>STATUS</Text>
                <Text style={s.iv}>{status.toUpperCase()}</Text>
              </View>
            </View>
            <View style={s.ig}>
              <View style={s.ic}>
                <Text style={s.il}>STAKED</Text>
                <Text style={s.iv}>{stake}</Text>
              </View>
              <View style={s.ic}>
                <Text style={s.il}>REGISTERED</Text>
                <Text style={s.iv}>{fd(reg.registeredAt)}</Text>
              </View>
            </View>
            {reg.checkedInAt && (
              <View style={s.ig}>
                <View style={s.ic}>
                  <Text style={s.il}>CHECKED IN</Text>
                  <Text style={s.iv}>{fd(reg.checkedInAt)}</Text>
                </View>
              </View>
            )}
          </View>
          <View style={s.tr}>
            <View style={s.nl} />
            <View style={s.td} />
            <View style={s.nr} />
          </View>
          <View style={s.ss}>
            <View style={s.sr}>
              <Text style={s.sl}>TX HASH</Text>
              <Text style={s.sv}>{sa(reg.transactionSignature)}</Text>
            </View>
            <View style={s.sr}>
              <Text style={s.sl}>ON-CHAIN</Text>
              <View style={s.cb}>
                <View style={s.cd} />
                <Text style={s.ct}>VERIFIED</Text>
              </View>
            </View>
          </View>
        </View>
        <View style={s.ac}>
          {status === 'claimable' && (
            <Button onPress={claim} loading={isClaimingRefund}>
              {isClaimingRefund ? 'Claiming on Solana…' : 'Claim Stake'}
            </Button>
          )}
          {status === 'valid' && <Text style={s.nt}>Your stake is locked on-chain until the event ends.</Text>}
          {status === 'no-show' && (
            <Text style={s.nt}>You did not check in. Your staked amount has been forfeited.</Text>
          )}
          {status === 'refunded' && <Text style={s.nt}>Your stake has been returned to your wallet.</Text>}
        </View>
      </ScrollView>
    </View>
  )
}
const s = StyleSheet.create({
  c: { flex: 1, backgroundColor: Colors.bg },
  ld: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.bg },
  sc: { flex: 1 },
  scc: { paddingHorizontal: Spacing.md },
  hd: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  bb: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.surface2,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  ht: { fontFamily: Fonts.display, fontSize: 18, color: Colors.text1, letterSpacing: ls(18, LS.displaySubtle) },
  tk: { backgroundColor: TBG, borderRadius: 20, overflow: 'visible' },
  stamp: { position: 'absolute', width: 220, height: 220, opacity: 0.92, zIndex: 10 },
  qrWrap: { position: 'relative', alignItems: 'center', justifyContent: 'center' },
  qrs: {
    alignItems: 'center',
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
    paddingHorizontal: Spacing.md,
    gap: Spacing.sm,
  },
  qrl: { fontFamily: Fonts.mono, fontSize: 10, color: TT, letterSpacing: ls(10, LS.labelWide), opacity: 0.6 },
  qrb: { backgroundColor: '#FFFFFF', padding: 12, borderRadius: 12 },
  qrp: { fontFamily: Fonts.mono, fontSize: 10, color: TT, opacity: 0.5 },
  tr: { flexDirection: 'row', alignItems: 'center', height: N, overflow: 'hidden' },
  nl: { width: N, height: N, borderRadius: N / 2, backgroundColor: Colors.bg, marginLeft: -(N / 2), flexShrink: 0 },
  nr: { width: N, height: N, borderRadius: N / 2, backgroundColor: Colors.bg, marginRight: -(N / 2), flexShrink: 0 },
  td: { flex: 1, borderStyle: 'dashed', borderWidth: 1, height: 0 },
  is: { paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, gap: Spacing.md },
  et: {
    fontFamily: Fonts.display,
    fontSize: 22,
    color: TT,
    letterSpacing: ls(22, LS.display),
    lineHeight: 28,
    marginBottom: Spacing.xs,
  },
  ig: { flexDirection: 'row', gap: Spacing.lg },
  ic: { flex: 1, gap: 2 },
  il: { fontFamily: Fonts.mono, fontSize: 8, color: TT, opacity: 0.5, letterSpacing: ls(8, LS.labelWide) },
  iv: { fontFamily: Fonts.bodyMedium, fontSize: 13, color: TT, lineHeight: 18 },
  ss: { paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md, gap: Spacing.sm },
  sr: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  sl: { fontFamily: Fonts.mono, fontSize: 8, color: TT, opacity: 0.5, letterSpacing: ls(8, LS.labelWide) },
  sv: { fontFamily: Fonts.mono, fontSize: 11, color: TT, opacity: 0.7 },
  cb: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  cd: { width: 5, height: 5, borderRadius: 3, backgroundColor: '#2E7D32' },
  ct: { fontFamily: Fonts.mono, fontSize: 9, color: '#2E7D32', letterSpacing: ls(9, LS.label) },
  ac: { marginTop: Spacing.lg, gap: Spacing.md },
  nt: { fontFamily: Fonts.body, fontSize: 13, color: Colors.text3, textAlign: 'center', lineHeight: 20 },
})
