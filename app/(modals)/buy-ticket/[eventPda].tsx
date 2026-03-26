import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { InfoGrid } from '@/components/ui/InfoGrid'
import { SOL_MINT, TokenAmount, formatTokenAmount } from '@/components/ui/TokenAmount'
import { WalletBalance } from '@/components/wallet/WalletBalance'
import { Colors } from '@/constants/colors'
import { Fonts, LS, ls } from '@/constants/fonts'
import { Spacing } from '@/constants/spacing'
import { useEventDetail } from '@/hooks/api/use-event-detail'
import { useRegisterEvent } from '@/hooks/api/use-register-event'
import { useWalletBalance } from '@/hooks/solana/use-wallet-balance'
import { router, useLocalSearchParams } from 'expo-router'
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

export default function BuyTicketModal() {
  const { eventPda } = useLocalSearchParams<{ eventPda: string }>()
  const { data: event, isLoading } = useEventDetail(eventPda)
  const registerMutation = useRegisterEvent()
  const { data: balance } = useWalletBalance(event?.stakeTokenMint ?? SOL_MINT)

  if (isLoading || !event) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={Colors.accent} />
      </View>
    )
  }

  const stakeNum = Number(event.stakeAmount) / Math.pow(10, event.stakeTokenDecimals)
  const hasEnoughBalance = (balance ?? 0) >= stakeNum
  const isSOL = event.stakeTokenMint === SOL_MINT

  async function handleDeposit() {
    try {
      const result = await registerMutation.mutateAsync({ event })
      router.replace(`/(tabs)/tickets/${result.registrationPda}`)
    } catch (e) {
      console.error('Registration failed', e)
    }
  }

  const infoRows = [
    { label: 'Event', value: event.title },
    {
      label: 'Date',
      value: new Date(event.startTime).toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        year: 'numeric',
      }),
    },
  ]

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']}>
        <View style={styles.header}>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.backText}>← BACK</Text>
          </TouchableOpacity>
          <Text style={styles.headerTitle}>GET TICKET</Text>
          <View style={{ width: 48 }} />
        </View>
      </SafeAreaView>

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent}>
        <Card>
          <InfoGrid rows={infoRows} />
        </Card>

        <Card style={styles.stakeCard}>
          <Text style={styles.stakeLabel}>REQUIRED STAKE</Text>
          <TokenAmount
            amount={event.stakeAmount}
            mint={event.stakeTokenMint}
            symbol={event.stakeTokenSymbol}
            decimals={event.stakeTokenDecimals}
            size="lg"
          />
          <WalletBalance mint={event.stakeTokenMint} symbol={event.stakeTokenSymbol} />
          {!isSOL && (
            <Text style={styles.mintAddress} numberOfLines={1} ellipsizeMode="middle">
              Mint: {event.stakeTokenMint}
            </Text>
          )}
        </Card>

        <Card variant="nested">
          <InfoGrid
            rows={[
              {
                label: 'Stake amount',
                value: `${formatTokenAmount(event.stakeAmount, event.stakeTokenDecimals)} ${event.stakeTokenSymbol}`,
              },
              { label: 'Network fee', value: '~0.000005 SOL' },
            ]}
          />
        </Card>

        {!hasEnoughBalance && (
          <Text style={styles.insufficientText}>Insufficient {event.stakeTokenSymbol} balance</Text>
        )}
      </ScrollView>

      <SafeAreaView edges={['bottom']} style={styles.cta}>
        <Button onPress={handleDeposit} disabled={!hasEnoughBalance} loading={registerMutation.isPending}>
          {registerMutation.isPending ? 'Confirming on Solana…' : 'Deposit & Register'}
        </Button>
      </SafeAreaView>
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
  backText: {
    fontFamily: Fonts.mono,
    fontSize: 11,
    color: Colors.text2,
    letterSpacing: ls(11, LS.labelNarrow),
    textTransform: 'uppercase',
  },
  headerTitle: {
    fontFamily: Fonts.display,
    fontSize: 16,
    color: Colors.text1,
    letterSpacing: ls(16, LS.displaySubtle),
  },
  scroll: { flex: 1 },
  scrollContent: { padding: Spacing.md, gap: Spacing.md, paddingBottom: Spacing.lg },
  stakeCard: { gap: 10 },
  stakeLabel: {
    fontFamily: Fonts.mono,
    fontSize: 9,
    color: Colors.text3,
    letterSpacing: ls(9, LS.labelWide),
    textTransform: 'uppercase',
  },
  mintAddress: {
    fontFamily: Fonts.mono,
    fontSize: 10,
    color: Colors.text3,
  },
  insufficientText: {
    fontFamily: Fonts.mono,
    fontSize: 11,
    color: Colors.error,
    textAlign: 'center',
    letterSpacing: ls(11, LS.labelNarrow),
    textTransform: 'uppercase',
  },
  cta: {
    padding: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
  },
})
