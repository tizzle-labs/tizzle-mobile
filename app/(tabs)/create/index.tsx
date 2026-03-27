import { ScreenHeader } from '@/components/layout/ScreenHeader'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { SOL_MINT } from '@/components/ui/TokenAmount'
import { Colors } from '@/constants/colors'
import { Fonts, LS, ls } from '@/constants/fonts'
import { Spacing } from '@/constants/spacing'
import { useCreateEvent, type CreateEventInput } from '@/hooks/api/use-create-event'
import { useCreateOrganization } from '@/hooks/api/use-create-organization'
import { useMyOrganizations } from '@/hooks/api/use-my-organizations'
import { showErrorFeedback } from '@/lib/app-feedback'
import { useState } from 'react'
import { ActivityIndicator, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native'

interface SuccessData {
  txHash: string
  eventTitle: string
  eventPda: string
  capacity: number
}

export default function Create() {
  const { data: orgs, isLoading: orgsLoading } = useMyOrganizations()
  const createOrg = useCreateOrganization()
  const createEvent = useCreateEvent()

  const [orgName, setOrgName] = useState('')
  const [orgDesc, setOrgDesc] = useState('')

  const [eventTitle, setEventTitle] = useState('')
  const [eventDesc, setEventDesc] = useState('')
  const [location, setLocation] = useState('')
  const [capacity, setCapacity] = useState('100')
  const [stakeAmount, setStakeAmount] = useState('0.1')
  const [successData, setSuccessData] = useState<SuccessData | null>(null)

  if (orgsLoading) {
    return (
      <View style={styles.container}>
        <ScreenHeader title="CREATE" />
        <View style={styles.center}>
          <ActivityIndicator color={Colors.accent} />
        </View>
      </View>
    )
  }

  const org = orgs?.[0]

  if (successData) {
    return (
      <View style={styles.container}>
        <ScreenHeader title="CREATE" />
        <View style={styles.successContent}>
          <Text style={styles.successHeading}>TICKETS{'\n'}MINTED</Text>
          <Card style={styles.successCard}>
            <Text style={styles.successEventTitle}>{successData.eventTitle}</Text>
            <Text style={styles.successLabel}>TRANSACTION HASH</Text>
            <Text style={styles.successHash} numberOfLines={2}>
              {successData.txHash}
            </Text>
            <Text style={styles.successLabel}>CAPACITY</Text>
            <Text style={styles.successValue}>{successData.capacity} tickets</Text>
          </Card>
          <Button onPress={() => setSuccessData(null)}>Create Another</Button>
        </View>
      </View>
    )
  }

  if (!org) {
    return (
      <View style={styles.container}>
        <ScreenHeader title="CREATE" />
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <Text style={styles.sectionTitle}>CREATE ORGANIZATION</Text>
          <Text style={styles.sectionDesc}>You need an organization before hosting events.</Text>
          <Card>
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>ORG NAME</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Tizzle Events"
                placeholderTextColor={Colors.text3}
                value={orgName}
                onChangeText={setOrgName}
              />
            </View>
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>DESCRIPTION</Text>
              <TextInput
                style={[styles.input, styles.multiline]}
                placeholder="What does your org do?"
                placeholderTextColor={Colors.text3}
                value={orgDesc}
                onChangeText={setOrgDesc}
                multiline
                numberOfLines={3}
              />
            </View>
          </Card>
          <Button
            onPress={async () => {
              try {
                await createOrg.mutateAsync({ name: orgName, description: orgDesc })
              } catch (e) {
                showErrorFeedback(e, 'Organization Creation Failed', 'We could not create your organization.')
              }
            }}
            loading={createOrg.isPending}
            disabled={!orgName.trim()}
          >
            Create Organization on Solana
          </Button>
        </ScrollView>
      </View>
    )
  }

  const now = new Date()
  const defaultStart = new Date(now.getTime() + 24 * 60 * 60 * 1000)
  const defaultEnd = new Date(defaultStart.getTime() + 3 * 60 * 60 * 1000)
  const defaultUnlock = new Date(defaultEnd.getTime() + 7 * 24 * 60 * 60 * 1000)

  async function handleCreateEvent() {
    if (!org) return
    const input: CreateEventInput = {
      organizationPda: org.organizationPda,
      title: eventTitle,
      description: eventDesc,
      imageUrl: '',
      location,
      category: 'Music',
      capacity: parseInt(capacity) || 100,
      stakeAmountSol: parseFloat(stakeAmount) || 0.1,
      stakeTokenMint: SOL_MINT,
      stakeTokenSymbol: 'SOL',
      stakeTokenDecimals: 9,
      startTime: defaultStart,
      endTime: defaultEnd,
      unlockTime: defaultUnlock,
    }
    try {
      const result = await createEvent.mutateAsync(input)
      setSuccessData({
        txHash: result.signature,
        eventTitle: result.event.title,
        eventPda: result.eventPda,
        capacity: result.event.capacity,
      })
    } catch (e) {
      showErrorFeedback(e, 'Event Creation Failed', 'We could not mint this event right now.')
    }
  }

  return (
    <View style={styles.container}>
      <ScreenHeader title="CREATE EVENT" />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.orgLabel}>ORG: {org.name}</Text>
        <Card>
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>EVENT TITLE</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Solana Devnet Rave"
              placeholderTextColor={Colors.text3}
              value={eventTitle}
              onChangeText={setEventTitle}
            />
          </View>
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>DESCRIPTION</Text>
            <TextInput
              style={[styles.input, styles.multiline]}
              placeholder="Describe the event…"
              placeholderTextColor={Colors.text3}
              value={eventDesc}
              onChangeText={setEventDesc}
              multiline
              numberOfLines={3}
            />
          </View>
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>LOCATION</Text>
            <TextInput
              style={styles.input}
              placeholder="e.g. Online / City, Country"
              placeholderTextColor={Colors.text3}
              value={location}
              onChangeText={setLocation}
            />
          </View>
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>CAPACITY</Text>
            <TextInput
              style={styles.input}
              placeholder="100"
              placeholderTextColor={Colors.text3}
              value={capacity}
              onChangeText={setCapacity}
              keyboardType="number-pad"
            />
          </View>
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>STAKE AMOUNT (SOL)</Text>
            <TextInput
              style={styles.input}
              placeholder="0.1"
              placeholderTextColor={Colors.text3}
              value={stakeAmount}
              onChangeText={setStakeAmount}
              keyboardType="decimal-pad"
            />
          </View>
        </Card>
        <Button
          onPress={handleCreateEvent}
          loading={createEvent.isPending}
          disabled={!eventTitle.trim() || !location.trim()}
        >
          {createEvent.isPending ? 'Minting on Solana…' : 'Mint on Solana'}
        </Button>
      </ScrollView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scrollContent: { padding: Spacing.md, gap: Spacing.md },
  sectionTitle: {
    fontFamily: Fonts.display,
    fontSize: 24,
    color: Colors.text1,
    letterSpacing: ls(24, LS.display),
  },
  sectionDesc: {
    fontFamily: Fonts.body,
    fontSize: 14,
    color: Colors.text2,
    lineHeight: 22,
  },
  orgLabel: {
    fontFamily: Fonts.mono,
    fontSize: 10,
    color: Colors.text3,
    letterSpacing: ls(10, LS.label),
    textTransform: 'uppercase',
  },
  fieldGroup: { gap: 6, marginBottom: Spacing.md },
  fieldLabel: {
    fontFamily: Fonts.mono,
    fontSize: 9,
    color: Colors.text3,
    letterSpacing: ls(9, LS.labelWide),
    textTransform: 'uppercase',
  },
  input: {
    fontFamily: Fonts.body,
    fontSize: 16,
    color: Colors.text1,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border2,
    paddingVertical: 8,
  },
  multiline: { minHeight: 72, textAlignVertical: 'top' },
  successContent: { flex: 1, padding: Spacing.md, gap: Spacing.lg, justifyContent: 'center' },
  successHeading: {
    fontFamily: Fonts.display,
    fontSize: 56,
    color: Colors.accent,
    letterSpacing: ls(56, LS.displayTight),
    lineHeight: 62,
  },
  successCard: { gap: 10 },
  successEventTitle: {
    fontFamily: Fonts.display,
    fontSize: 20,
    color: Colors.text1,
    letterSpacing: ls(20, LS.displaySubtle),
    marginBottom: 8,
  },
  successLabel: {
    fontFamily: Fonts.mono,
    fontSize: 9,
    color: Colors.text3,
    letterSpacing: ls(9, LS.labelWide),
    textTransform: 'uppercase',
  },
  successHash: { fontFamily: Fonts.mono, fontSize: 11, color: Colors.text2 },
  successValue: { fontFamily: Fonts.body, fontSize: 15, color: Colors.text1 },
})
