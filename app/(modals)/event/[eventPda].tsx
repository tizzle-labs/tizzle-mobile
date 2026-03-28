import { EventStatusChip, deriveEventStatus } from '@/components/event/EventStatusChip'
import { StakeChip } from '@/components/event/StakeChip'
import { Badge } from '@/components/ui/Badge'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { InfoGrid } from '@/components/ui/InfoGrid'
import { Colors } from '@/constants/colors'
import { Fonts, LS, ls } from '@/constants/fonts'
import { Spacing } from '@/constants/spacing'
import { useAuth } from '@/components/auth/auth-provider'
import { useEventDetail } from '@/hooks/api/use-event-detail'
import { useWithdrawEarnings } from '@/hooks/api/use-withdraw-earnings'
import { showErrorFeedback } from '@/lib/app-feedback'
import { useMyRegistrations } from '@/hooks/api/use-my-registrations'
import { Image } from 'expo-image'
import { router, useLocalSearchParams } from 'expo-router'
import {
  ActivityIndicator,
  Dimensions,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

const { width } = Dimensions.get('window')

export default function EventDetailModal() {
  const { eventPda } = useLocalSearchParams<{ eventPda: string }>()
  const { data: event, isLoading } = useEventDetail(eventPda)
  const { data: myRegistrations } = useMyRegistrations()
  const { walletAddress } = useAuth()

  const isRegistered = myRegistrations?.some((r) => r.eventPda === eventPda)
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

  if (isLoading || !event) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={Colors.accent} />
      </View>
    )
  }

  const status = deriveEventStatus(event.startTime, event.endTime, event.unlockTime)
  const isGatekeeper = !!walletAddress && walletAddress === event.gatekeeperAddress

  const infoRows = [
    {
      label: 'Date',
      value: new Date(event.startTime).toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'long',
        day: 'numeric',
        year: 'numeric',
      }),
    },
    {
      label: 'Time',
      value: new Date(event.startTime).toLocaleTimeString('en-US', {
        hour: '2-digit',
        minute: '2-digit',
      }),
    },
    { label: 'Location', value: event.location },
    { label: 'Capacity', value: `${event.totalRegistered} / ${event.capacity}` },
    { label: 'Category', value: event.category },
  ]

  return (
    <View style={styles.container}>
      <ScrollView style={styles.scroll} showsVerticalScrollIndicator={false}>
        {/* Hero */}
        <View style={styles.heroContainer}>
          <Image source={{ uri: event.imageUrl }} style={styles.hero} contentFit="cover" />
          <SafeAreaView edges={['top']} style={styles.heroOverlay}>
            <TouchableOpacity onPress={() => router.back()} style={styles.backBtn}>
              <Text style={styles.backText}>← BACK</Text>
            </TouchableOpacity>
          </SafeAreaView>
        </View>

        {/* Content */}
        <View style={styles.content}>
          <View style={styles.statusRow}>
            <EventStatusChip status={status} />
            <StakeChip
              stakeAmount={event.stakeAmount}
              stakeTokenMint={event.stakeTokenMint}
              stakeTokenSymbol={event.stakeTokenSymbol}
              stakeTokenDecimals={event.stakeTokenDecimals}
            />
          </View>

          <Text style={styles.title}>{event.title}</Text>
          <Text style={styles.description}>{event.description}</Text>

          <Card style={styles.infoCard}>
            <InfoGrid rows={infoRows} />
          </Card>

          {isOrganizer && isEnded && (
            <Card>
              <Text style={styles.sectionLabel}>ORGANIZER SETTLEMENT</Text>
              <View style={styles.settlementRow}>
                <Text style={styles.settlementKey}>No-shows</Text>
                <Text style={styles.settlementValue}>{noShowCount}</Text>
              </View>
              {canWithdraw ? (
                <Button onPress={handleWithdraw} loading={isWithdrawing}>
                  {isWithdrawing ? 'Withdrawing…' : 'Withdraw Earnings'}
                </Button>
              ) : event?.organizerWithdrawn ? (
                <Text style={styles.settlementNote}>Earnings already withdrawn.</Text>
              ) : (
                <Text style={styles.settlementNote}>
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
            </Card>
          )}
        </View>
      </ScrollView>

      {/* Pinned CTA */}
      <SafeAreaView edges={['bottom']} style={styles.ctaContainer}>
        {isGatekeeper && (
          <Button onPress={handleScanTickets} variant="secondary" style={styles.scanButton}>
            Scan Tickets
          </Button>
        )}
        {isRegistered ? (
          <View style={styles.registeredBadge}>
            <Badge variant="valid" label="REGISTERED ✓" />
          </View>
        ) : status === 'Available' ? (
          <Button onPress={handleGetTicket}>Get Ticket</Button>
        ) : null}
      </SafeAreaView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.bg },
  scroll: { flex: 1 },
  heroContainer: { height: 280, position: 'relative' },
  hero: { width, height: 280 },
  heroOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
  },
  backBtn: { margin: Spacing.md, alignSelf: 'flex-start' },
  backText: {
    fontFamily: Fonts.mono,
    fontSize: 11,
    color: Colors.accent,
    letterSpacing: ls(11, LS.labelNarrow),
    textTransform: 'uppercase',
    backgroundColor: 'rgba(0,0,0,0.6)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 9999,
  },
  content: { padding: Spacing.md, gap: Spacing.md },
  statusRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  title: {
    fontFamily: Fonts.display,
    fontSize: 32,
    color: Colors.text1,
    letterSpacing: ls(32, LS.display),
    lineHeight: 38,
  },
  description: {
    fontFamily: Fonts.body,
    fontSize: 15,
    color: Colors.text2,
    lineHeight: 24,
  },
  infoCard: {},
  ctaContainer: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    backgroundColor: Colors.bg,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
  registeredBadge: {
    paddingVertical: Spacing.sm,
    alignItems: 'center',
  },
  scanButton: {
    marginBottom: Spacing.sm,
  },
  sectionLabel: {
    fontFamily: Fonts.mono,
    fontSize: 9,
    color: Colors.text3,
    letterSpacing: ls(9, LS.labelWide),
    textTransform: 'uppercase',
    marginBottom: Spacing.sm,
  },
  settlementRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: Spacing.sm,
  },
  settlementKey: {
    fontFamily: Fonts.body,
    fontSize: 14,
    color: Colors.text2,
  },
  settlementValue: {
    fontFamily: Fonts.mono,
    fontSize: 14,
    color: Colors.text1,
  },
  settlementNote: {
    fontFamily: Fonts.body,
    fontSize: 13,
    color: Colors.text3,
    marginTop: Spacing.sm,
    textAlign: 'center',
  },
})
