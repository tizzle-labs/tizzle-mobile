import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, Alert } from 'react-native'
import { useLocalSearchParams, router } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Colors } from '@/constants/colors'
import { Fonts, LS, ls } from '@/constants/fonts'
import { Spacing } from '@/constants/spacing'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { TicketArtifact } from '@/components/ui/TicketArtifact'
import { SolanaStatusBadge } from '@/components/ui/SolanaStatusBadge'
import { Badge } from '@/components/ui/Badge'
import { InfoGrid } from '@/components/ui/InfoGrid'
import { useMyRegistrations } from '@/hooks/api/use-my-registrations'
import { useEventDetail } from '@/hooks/api/use-event-detail'
import { useTicketLifecycle } from '@/hooks/api/use-ticket-lifecycle'

export default function TicketDetail() {
  const { registrationPda } = useLocalSearchParams<{ registrationPda: string }>()
  const { data: registrations, isLoading: regLoading } = useMyRegistrations()
  const registration = registrations?.find((r) => r.registrationPda === registrationPda)

  const { data: event, isLoading: eventLoading } = useEventDetail(registration?.eventPda ?? '')
  const { status, claimRefund, isClaimingRefund } = useTicketLifecycle(registration, event)

  if (regLoading || eventLoading || !registration) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={Colors.accent} />
      </View>
    )
  }

  const onChainRows = [
    { label: 'Registration PDA', value: registration.registrationPda, mono: true },
    { label: 'Tx Hash', value: registration.transactionSignature, mono: true },
    {
      label: 'Staked',
      value: event
        ? `${Number(registration.stakeAmount) / Math.pow(10, event.stakeTokenDecimals)} ${event.stakeTokenSymbol}`
        : registration.stakeAmount,
    },
    {
      label: 'Registered',
      value: new Date(registration.registeredAt).toLocaleString(),
    },
    ...(registration.checkedInAt
      ? [{ label: 'Checked In', value: new Date(registration.checkedInAt).toLocaleString() }]
      : []),
    ...(registration.refundedAt
      ? [{ label: 'Refunded', value: new Date(registration.refundedAt).toLocaleString() }]
      : []),
  ]

  async function handleClaimRefund() {
    try {
      await claimRefund()
    } catch (e: any) {
      Alert.alert('Claim Failed', e?.message ?? 'Something went wrong')
    }
  }

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.back}>← TICKETS</Text>
          </TouchableOpacity>
          <Badge variant={status} />
        </View>
      </SafeAreaView>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <TicketArtifact
          eventTitle={event?.title ?? 'Loading…'}
          eventDate={
            event
              ? new Date(event.startTime).toLocaleDateString('en-US', {
                  weekday: 'short',
                  month: 'long',
                  day: 'numeric',
                })
              : ''
          }
          location={event?.location ?? ''}
          registrationPda={registrationPda}
        >
          <SolanaStatusBadge />
        </TicketArtifact>

        <Card>
          <InfoGrid rows={onChainRows} />
        </Card>

        {status === 'valid' && (
          <>
            <Button onPress={() => router.push(`/(modals)/qr/${registrationPda}`)}>Show QR</Button>
            <View style={styles.cancelNote}>
              <Text style={styles.cancelText}>
                Tickets cannot be cancelled — your stake is locked on-chain until the event ends.
              </Text>
            </View>
          </>
        )}

        {status === 'claimable' && (
          <Button onPress={handleClaimRefund} loading={isClaimingRefund}>
            {isClaimingRefund ? 'Claiming on Solana…' : 'Claim Stake'}
          </Button>
        )}

        {status === 'no-show' && (
          <Card style={styles.noticeCard}>
            <Text style={styles.noticeText}>
              You did not check in to this event. Your staked amount has been forfeited.
            </Text>
          </Card>
        )}

        {status === 'refunded' && (
          <Card style={styles.noticeCard}>
            <Text style={styles.noticeText}>Your stake has been successfully returned to your wallet.</Text>
          </Card>
        )}
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  back: {
    fontFamily: Fonts.mono,
    fontSize: 11,
    color: Colors.accent,
    letterSpacing: ls(11, LS.labelNarrow),
    textTransform: 'uppercase',
  },
  scroll: { flex: 1 },
  scrollContent: { padding: Spacing.md, gap: Spacing.md },
  cancelNote: {
    paddingHorizontal: Spacing.sm,
    paddingVertical: Spacing.xs,
  },
  cancelText: {
    fontFamily: Fonts.body,
    fontSize: 13,
    color: Colors.text3,
    textAlign: 'center',
    lineHeight: 20,
  },
  noticeCard: { padding: Spacing.md },
  noticeText: {
    fontFamily: Fonts.body,
    fontSize: 14,
    color: Colors.text2,
    lineHeight: 22,
    textAlign: 'center',
  },
})
