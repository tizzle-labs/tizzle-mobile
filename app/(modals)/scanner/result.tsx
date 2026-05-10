import { ClusterNetwork } from '@/components/cluster/cluster-network'
import { useCluster } from '@/components/cluster/cluster-provider'
import { Colors } from '@/constants/colors'
import { Fonts, LS, ls } from '@/constants/fonts'
import { Spacing } from '@/constants/spacing'
import { Ionicons } from '@expo/vector-icons'
import { router, useLocalSearchParams } from 'expo-router'
import { Linking, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

function shortPda(pda: string) {
  return !pda || pda.length < 10 ? pda : `${pda.slice(0, 6)}…${pda.slice(-4)}`
}

export default function ScanResult() {
  const {
    status,
    registrationPda,
    checkedInAt,
    eventTitle,
    expectedEventPda,
    ticketEventPda,
    eventMatches,
    failureReason,
  } = useLocalSearchParams<{
    status: 'valid' | 'used' | 'error'
    registrationPda: string
    checkedInAt?: string
    eventTitle?: string
    expectedEventPda?: string
    ticketEventPda?: string
    eventMatches?: 'true' | 'false'
    failureReason?: string
  }>()

  const { selectedCluster } = useCluster()
  const isValid = status === 'valid'
  const isUsed = status === 'used'
  const matchesSelectedEvent = eventMatches !== 'false'

  const accentColor = isValid ? Colors.accent : isUsed ? Colors.error : Colors.warning
  const onBg = Colors.text1
  const onBgMuted = Colors.text2
  const cardBg = Colors.surface2
  const cardBorder = Colors.border

  function getSolscanUrl(pda: string) {
    const cluster =
      selectedCluster.network === ClusterNetwork.Devnet ? '?cluster=devnet'
      : selectedCluster.network === ClusterNetwork.Testnet ? '?cluster=testnet'
      : ''
    return `https://solscan.io/account/${pda}${cluster}`
  }

  const heading = isValid ? 'Check-in Confirmed' : isUsed ? 'Already Used' : 'Verification Failed'
  const iconName = isValid ? 'checkmark-circle' : isUsed ? 'close-circle' : 'warning'

  const formattedTime = checkedInAt
    ? new Date(checkedInAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' })
    : null

  return (
    <View style={[s.container, { backgroundColor: Colors.bg }]}>
      <SafeAreaView style={s.safe}>
        {/* Top bar */}
        <View style={s.topBar}>
          <TouchableOpacity onPress={() => router.back()} style={[s.closeBtn, { backgroundColor: cardBg, borderColor: cardBorder }]} hitSlop={12}>
            <Ionicons name="arrow-back" size={20} color={onBg} />
          </TouchableOpacity>
          <View style={[s.statusPill, { backgroundColor: cardBg, borderColor: cardBorder }]}>
            <Text style={[s.statusPillText, { color: onBg }]}>
              {isValid ? 'SCANNER' : isUsed ? 'SCANNER' : 'SCANNER'}
            </Text>
          </View>
        </View>

        {/* Main content */}
        <View style={s.body}>
          <Ionicons name={iconName} size={88} color={accentColor} />

          <View style={s.headingBlock}>
            <Text style={[s.heading, { color: onBg }]}>{heading}</Text>
            {eventTitle && (
              <Text style={[s.eventTitle, { color: onBgMuted }]} numberOfLines={2}>
                {eventTitle}
              </Text>
            )}
          </View>

          {/* Details card */}
          <View style={[s.card, { backgroundColor: cardBg, borderColor: cardBorder }]}>
            {formattedTime && (
              <View style={s.cardRow}>
                <Text style={[s.cardLabel, { color: onBgMuted }]}>TIME</Text>
                <Text style={[s.cardValue, { color: onBg }]}>{formattedTime}</Text>
              </View>
            )}

            {registrationPda && (
              <>
                {formattedTime && <View style={[s.cardDivider, { backgroundColor: cardBorder }]} />}
                <View style={s.cardRow}>
                  <Text style={[s.cardLabel, { color: onBgMuted }]}>TICKET</Text>
                  <TouchableOpacity
                    style={s.linkRow}
                    onPress={() => Linking.openURL(getSolscanUrl(registrationPda))}
                    hitSlop={8}
                  >
                    <Text style={[s.cardValue, { color: onBg }]}>{shortPda(registrationPda)}</Text>
                    <Ionicons name="open-outline" size={13} color={Colors.text2} />
                  </TouchableOpacity>
                </View>
              </>
            )}

            {!!expectedEventPda && (
              <>
                <View style={[s.cardDivider, { backgroundColor: cardBorder }]} />
                <View style={s.cardRow}>
                  <Text style={[s.cardLabel, { color: onBgMuted }]}>EVENT</Text>
                  {matchesSelectedEvent ? (
                    <View style={s.matchRow}>
                      <Ionicons name="checkmark-circle-outline" size={14} color={onBg} />
                      <Text style={[s.cardValue, { color: onBg }]}>Matched</Text>
                    </View>
                  ) : (
                    <View style={s.matchRow}>
                      <Ionicons name="alert-circle-outline" size={14} color={onBg} />
                      <Text style={[s.cardValue, { color: onBg }]}>Wrong event</Text>
                    </View>
                  )}
                </View>
                {!matchesSelectedEvent && ticketEventPda && (
                  <Text style={[s.cardSub, { color: onBgMuted }]} numberOfLines={1}>
                    Ticket belongs to: {shortPda(ticketEventPda)}
                  </Text>
                )}
              </>
            )}

            {failureReason && (
              <>
                <View style={[s.cardDivider, { backgroundColor: cardBorder }]} />
                <View style={s.cardRow}>
                  <Text style={[s.cardLabel, { color: onBgMuted }]}>REASON</Text>
                  <Text style={[s.cardValue, { color: onBg, flex: 1, textAlign: 'right' }]} numberOfLines={2}>
                    {failureReason}
                  </Text>
                </View>
              </>
            )}
          </View>
        </View>

        {/* Bottom action */}
        <TouchableOpacity
          style={[s.scanNextBtn, { backgroundColor: cardBg, borderColor: cardBorder }]}
          onPress={() => router.back()}
          activeOpacity={0.7}
        >
          <Ionicons name="scan-outline" size={18} color={onBg} />
          <Text style={[s.scanNextText, { color: onBg }]}>Scan Next</Text>
        </TouchableOpacity>
      </SafeAreaView>
    </View>
  )
}

const s = StyleSheet.create({
  container: { flex: 1 },
  safe: { flex: 1, paddingHorizontal: Spacing.md, paddingBottom: Spacing.lg, gap: Spacing.lg },

  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingTop: Spacing.sm,
  },
  closeBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
  },
  statusPill: {
    paddingHorizontal: 14,
    paddingVertical: 8,
    borderRadius: 20,
    borderWidth: 1,
  },
  statusPillText: {
    fontFamily: Fonts.mono,
    fontSize: 11,
    letterSpacing: ls(11, LS.labelWide),
  },

  body: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.lg,
  },
  headingBlock: { alignItems: 'center', gap: 6 },
  heading: {
    fontFamily: Fonts.display,
    fontSize: 32,
    letterSpacing: ls(32, LS.displayTight),
    textAlign: 'center',
    lineHeight: 38,
  },
  eventTitle: {
    fontFamily: Fonts.body,
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 22,
    maxWidth: 300,
  },

  card: {
    width: '100%',
    borderRadius: 16,
    borderWidth: 1,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  cardRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  cardLabel: {
    fontFamily: Fonts.mono,
    fontSize: 10,
    letterSpacing: ls(10, LS.labelWide),
  },
  cardValue: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 14,
  },
  cardSub: {
    fontFamily: Fonts.mono,
    fontSize: 11,
    textAlign: 'right',
  },
  cardDivider: { height: 1 },
  linkRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  matchRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },

  scanNextBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    paddingVertical: 14,
    borderRadius: 14,
    borderWidth: 1,
  },
  scanNextText: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 15,
  },
})
