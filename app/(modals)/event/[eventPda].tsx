import { View, Text, ScrollView, StyleSheet, TouchableOpacity, ActivityIndicator, Dimensions } from 'react-native'
import { useLocalSearchParams, router } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Image } from 'expo-image'
import { Colors } from '@/constants/colors'
import { Fonts } from '@/constants/fonts'
import { Spacing } from '@/constants/spacing'
import { Button } from '@/components/ui/Button'
import { Badge } from '@/components/ui/Badge'
import { Card } from '@/components/ui/Card'
import { InfoGrid } from '@/components/ui/InfoGrid'
import { StakeChip } from '@/components/event/StakeChip'
import { EventStatusChip, deriveEventStatus } from '@/components/event/EventStatusChip'
import { useEventDetail } from '@/hooks/api/use-event-detail'
import { useMyRegistrations } from '@/hooks/api/use-my-registrations'

const { width } = Dimensions.get('window')

export default function EventDetailModal() {
  const { eventPda } = useLocalSearchParams<{ eventPda: string }>()
  const { data: event, isLoading } = useEventDetail(eventPda)
  const { data: myRegistrations } = useMyRegistrations()

  const isRegistered = myRegistrations?.some((r) => r.eventPda === eventPda)

  function handleGetTicket() {
    router.push(`/(modals)/buy-ticket/${eventPda}`)
  }

  if (isLoading || !event) {
    return (
      <View style={styles.loading}>
        <ActivityIndicator color={Colors.accent} />
      </View>
    )
  }

  const status = deriveEventStatus(event.startTime, event.endTime, event.unlockTime)

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
        </View>
      </ScrollView>

      {/* Pinned CTA */}
      <SafeAreaView edges={['bottom']} style={styles.ctaContainer}>
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
    color: Colors.text1,
    letterSpacing: 0.08,
    textTransform: 'uppercase',
    backgroundColor: 'rgba(0,0,0,0.5)',
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 2,
  },
  content: { padding: Spacing.md, gap: Spacing.md },
  statusRow: { flexDirection: 'row', gap: 8, flexWrap: 'wrap' },
  title: {
    fontFamily: Fonts.display,
    fontSize: 32,
    color: Colors.text1,
    letterSpacing: -0.03,
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
})
