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
import { Ionicons } from '@expo/vector-icons'
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker'
import { Image } from 'expo-image'
import * as ImagePicker from 'expo-image-picker'
import { useState } from 'react'
import {
  ActivityIndicator,
  Modal,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'

interface SuccessData {
  txHash: string
  eventTitle: string
  eventPda: string
  capacity: number
}

type PickerField = 'startTime' | 'endTime'

function formatDateTime(date: Date): string {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const h = String(date.getHours()).padStart(2, '0')
  const m = String(date.getMinutes()).padStart(2, '0')
  return `${days[date.getDay()]}, ${months[date.getMonth()]} ${date.getDate()} ${date.getFullYear()} · ${h}:${m}`
}

export default function Create() {
  const { data: orgs, isLoading: orgsLoading } = useMyOrganizations()
  const createOrg = useCreateOrganization()
  const createEvent = useCreateEvent()

  const [orgName, setOrgName] = useState('')
  const [orgDesc, setOrgDesc] = useState('')
  const [orgTwitter, setOrgTwitter] = useState('')
  const [orgDiscord, setOrgDiscord] = useState('')

  const [eventTitle, setEventTitle] = useState('')
  const [eventDesc, setEventDesc] = useState('')
  const [location, setLocation] = useState('')
  const [capacity, setCapacity] = useState('100')
  const [stakeAmount, setStakeAmount] = useState('0.1')
  const [imageUri, setImageUri] = useState<string | null>(null)
  const [successData, setSuccessData] = useState<SuccessData | null>(null)

  const [startTime, setStartTime] = useState(() => new Date(Date.now() + 24 * 60 * 60 * 1000))
  const [endTime, setEndTime] = useState(() => new Date(Date.now() + 27 * 60 * 60 * 1000))

  const [pickerField, setPickerField] = useState<PickerField>('startTime')
  const [pickerMode, setPickerMode] = useState<'date' | 'time'>('date')
  const [pickerVisible, setPickerVisible] = useState(false)
  const [tempDate, setTempDate] = useState(new Date())

  async function pickImage() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (status !== 'granted') {
      showErrorFeedback(null, 'Permission Required', 'Allow photo library access to add an event image.')
      return
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [16, 9],
      quality: 0.8,
    })
    if (!result.canceled) setImageUri(result.assets[0].uri)
  }

  function openPicker(field: PickerField) {
    const current = field === 'startTime' ? startTime : endTime
    setPickerField(field)
    setPickerMode('date')
    setTempDate(current)
    setPickerVisible(true)
  }

  function commitValue(field: PickerField, newDate: Date) {
    if (field === 'startTime') {
      setStartTime(newDate)
      if (newDate >= endTime) setEndTime(new Date(newDate.getTime() + 3 * 60 * 60 * 1000))
    } else {
      setEndTime(newDate)
    }
  }

  function handlePickerChange(_: DateTimePickerEvent, selected?: Date) {
    if (!selected) {
      setPickerVisible(false)
      return
    }
    if (Platform.OS === 'android') {
      setPickerVisible(false)
      if (pickerMode === 'date') {
        const current = pickerField === 'startTime' ? startTime : endTime
        const merged = new Date(current)
        merged.setFullYear(selected.getFullYear(), selected.getMonth(), selected.getDate())
        setTempDate(merged)
        setTimeout(() => {
          setPickerMode('time')
          setPickerVisible(true)
        }, 100)
      } else {
        const final = new Date(tempDate)
        final.setHours(selected.getHours(), selected.getMinutes(), 0, 0)
        commitValue(pickerField, final)
      }
    } else {
      setTempDate(selected)
    }
  }

  function handleIosDone() {
    commitValue(pickerField, tempDate)
    setPickerVisible(false)
  }

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
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          {/* Header */}
          <View style={styles.createOrgHeader}>
            <Text style={styles.createOrgTitle}>Create Organization</Text>
            <Text style={styles.createOrgSubtitle}>You need an organization before hosting events on Tizzle.</Text>
          </View>
          {/* Avatar picker */}
          <TouchableOpacity style={styles.orgAvatarPicker} onPress={pickImage} activeOpacity={0.7}>
            {imageUri ? (
              <Image source={{ uri: imageUri }} style={styles.orgAvatarImg} contentFit="cover" />
            ) : (
              <View style={styles.orgAvatarFallback}>
                <Ionicons name="business-outline" size={32} color={Colors.text3} />
              </View>
            )}
            <View style={styles.orgAvatarBadge}>
              <Text style={styles.orgAvatarBadgeText}>+</Text>
            </View>
          </TouchableOpacity>
          <Text style={styles.orgAvatarHint}>Organization logo (optional)</Text>
          {/* Fields */}
          <View style={styles.orgFields}>
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>ORGANIZATION NAME *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Tizzle Events"
                placeholderTextColor={Colors.text3}
                value={orgName}
                onChangeText={setOrgName}
                maxLength={50}
              />
            </View>
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>DESCRIPTION</Text>
              <TextInput
                style={[styles.input, styles.multiline]}
                placeholder="What does your organization do?"
                placeholderTextColor={Colors.text3}
                value={orgDesc}
                onChangeText={setOrgDesc}
                multiline
                numberOfLines={4}
                maxLength={200}
                textAlignVertical="top"
              />
            </View>
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>X / TWITTER USERNAME</Text>
              <TextInput
                style={styles.input}
                placeholder="@yourhandle"
                placeholderTextColor={Colors.text3}
                autoCapitalize="none"
                autoCorrect={false}
                value={orgTwitter}
                onChangeText={setOrgTwitter}
                maxLength={50}
              />
            </View>
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>DISCORD SERVER / USERNAME</Text>
              <TextInput
                style={styles.input}
                placeholder="discord.gg/yourserver"
                placeholderTextColor={Colors.text3}
                autoCapitalize="none"
                autoCorrect={false}
                value={orgDiscord}
                onChangeText={setOrgDiscord}
                maxLength={100}
              />
            </View>
          </View>
          <Button
            onPress={async () => {
              try {
                await createOrg.mutateAsync({
                  name: orgName.trim(),
                  description: orgDesc.trim(),
                  avatarUrl: undefined, // TODO: upload imageUri and pass avatarUrl
                  twitter: orgTwitter.trim() || undefined,
                  discord: orgDiscord.trim() || undefined,
                })
              } catch (e) {
                showErrorFeedback(e, 'Organization Creation Failed', 'We could not create your organization.')
              }
            }}
            loading={createOrg.isPending}
            disabled={!orgName.trim()}
          >
            {createOrg.isPending ? 'Creating on Solana…' : 'Create Organization'}
          </Button>
          <Text style={styles.orgNote}>This will create an on-chain organization on Solana.</Text>
        </ScrollView>
      </View>
    )
  }

  async function handleCreateEvent() {
    if (!org) return
    const input: CreateEventInput = {
      organizationPda: org.organizationPda,
      title: eventTitle,
      description: eventDesc,
      imageUri: imageUri ?? undefined,
      location,
      category: 'Music',
      capacity: parseInt(capacity) || 100,
      stakeAmountSol: parseFloat(stakeAmount) || 0.1,
      stakeTokenMint: SOL_MINT,
      stakeTokenSymbol: 'SOL',
      stakeTokenDecimals: 9,
      startTime,
      endTime,
      unlockTime: new Date(endTime.getTime() + 7 * 24 * 60 * 60 * 1000),
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
      <ScreenHeader title="Create Event" />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Org badge */}
        <View style={styles.orgBadge}>
          <Ionicons name="business-outline" size={12} color={Colors.accent} />
          <Text style={styles.orgLabel}>{org.name}</Text>
        </View>

        {/* Image picker */}
        <TouchableOpacity style={styles.imagePicker} onPress={pickImage} activeOpacity={0.8}>
          {imageUri ? (
            <Image source={{ uri: imageUri }} style={styles.imagePreview} contentFit="cover" />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Ionicons name="image-outline" size={28} color={Colors.text3} />
              <Text style={styles.imagePlaceholderText}>Add Cover Photo</Text>
              <Text style={styles.imagePlaceholderHint}>16:9 recommended</Text>
            </View>
          )}
        </TouchableOpacity>

        {/* Basic info */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Event Info</Text>
          <View style={styles.card}>
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>TITLE *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Solana Builder Meetup"
                placeholderTextColor={Colors.text3}
                value={eventTitle}
                onChangeText={setEventTitle}
                maxLength={80}
              />
            </View>
            <View style={styles.divider} />
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
                textAlignVertical="top"
              />
            </View>
            <View style={styles.divider} />
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>LOCATION *</Text>
              <TextInput
                style={styles.input}
                placeholder="e.g. Jakarta / Online"
                placeholderTextColor={Colors.text3}
                value={location}
                onChangeText={setLocation}
              />
            </View>
          </View>
        </View>

        {/* Date & Time */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Date & Time</Text>
          <View style={styles.card}>
            <TouchableOpacity style={styles.fieldGroup} onPress={() => openPicker('startTime')} activeOpacity={0.7}>
              <Text style={styles.fieldLabel}>START</Text>
              <View style={styles.dateRow}>
                <Ionicons name="calendar-outline" size={14} color={Colors.text3} />
                <Text style={styles.dateValue}>{formatDateTime(startTime)}</Text>
              </View>
            </TouchableOpacity>
            <View style={styles.divider} />
            <TouchableOpacity style={styles.fieldGroup} onPress={() => openPicker('endTime')} activeOpacity={0.7}>
              <Text style={styles.fieldLabel}>END</Text>
              <View style={styles.dateRow}>
                <Ionicons name="calendar-outline" size={14} color={Colors.text3} />
                <Text style={[styles.dateValue, endTime <= startTime && styles.dateValueError]}>
                  {formatDateTime(endTime)}
                </Text>
              </View>
            </TouchableOpacity>
            {endTime <= startTime && <Text style={styles.fieldError}>End time must be after start time</Text>}
            <View style={styles.divider} />
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>UNLOCK (AUTO)</Text>
              <View style={styles.dateRow}>
                <Ionicons name="lock-open-outline" size={14} color={Colors.text3} />
                <Text style={[styles.dateValue, styles.dateValueMuted]}>
                  {formatDateTime(new Date(endTime.getTime() + 7 * 24 * 60 * 60 * 1000))}
                </Text>
              </View>
              <Text style={styles.unlockHint}>Stake released 7 days after event ends</Text>
            </View>
          </View>
        </View>

        {/* Capacity & Stake */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ticket Settings</Text>
          <View style={styles.card}>
            <View style={styles.fieldRow}>
              <View style={[styles.fieldGroup, { flex: 1 }]}>
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
              <View style={styles.fieldRowDivider} />
              <View style={[styles.fieldGroup, { flex: 1 }]}>
                <Text style={styles.fieldLabel}>STAKE (SOL)</Text>
                <TextInput
                  style={styles.input}
                  placeholder="0.1"
                  placeholderTextColor={Colors.text3}
                  value={stakeAmount}
                  onChangeText={setStakeAmount}
                  keyboardType="decimal-pad"
                />
              </View>
            </View>
          </View>
        </View>

        <Button
          onPress={handleCreateEvent}
          loading={createEvent.isPending}
          disabled={!eventTitle.trim() || !location.trim() || endTime <= startTime}
        >
          {createEvent.isPending ? 'Creating on Solana…' : 'Create Event'}
        </Button>
      </ScrollView>

      {pickerVisible && Platform.OS === 'android' && (
        <DateTimePicker
          value={pickerMode === 'date' ? (pickerField === 'startTime' ? startTime : endTime) : tempDate}
          mode={pickerMode}
          onChange={handlePickerChange}
        />
      )}
      {Platform.OS === 'ios' && (
        <Modal visible={pickerVisible} transparent animationType="slide">
          <View style={styles.pickerOverlay}>
            <View style={styles.pickerContainer}>
              <DateTimePicker
                value={tempDate}
                mode="datetime"
                display="spinner"
                onChange={handlePickerChange}
                textColor={Colors.text1}
              />
              <Button onPress={handleIosDone}>Done</Button>
            </View>
          </View>
        </Modal>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scrollContent: { padding: Spacing.md, gap: Spacing.lg, paddingBottom: 160 },

  orgBadge: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  orgLabel: { fontFamily: Fonts.mono, fontSize: 11, color: Colors.accent, letterSpacing: ls(11, LS.labelNarrow) },

  imagePicker: { borderRadius: 16, overflow: 'hidden', marginBottom: Spacing.xs },
  imagePreview: { width: '100%', aspectRatio: 16 / 9 },
  imagePlaceholder: {
    width: '100%',
    aspectRatio: 16 / 9,
    borderWidth: 1,
    borderColor: Colors.border2,
    borderStyle: 'dashed',
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.surface,
  },
  imagePlaceholderText: { fontFamily: Fonts.bodyMedium, fontSize: 14, color: Colors.text2 },
  imagePlaceholderHint: {
    fontFamily: Fonts.mono,
    fontSize: 9,
    color: Colors.text3,
    letterSpacing: ls(9, LS.labelWide),
  },

  section: { gap: Spacing.sm },
  sectionTitle: {
    fontFamily: Fonts.display,
    fontSize: 18,
    color: Colors.text1,
    letterSpacing: ls(18, LS.displaySubtle),
  },

  card: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
  },
  divider: { height: 1, backgroundColor: Colors.border },

  fieldGroup: { paddingVertical: Spacing.md, gap: 6 },
  fieldLabel: {
    fontFamily: Fonts.mono,
    fontSize: 9,
    color: Colors.text3,
    letterSpacing: ls(9, LS.labelWide),
    textTransform: 'uppercase',
  },
  input: { fontFamily: Fonts.body, fontSize: 15, color: Colors.text1, paddingVertical: 0 },
  multiline: { minHeight: 64, textAlignVertical: 'top' },

  dateRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  dateValue: { fontFamily: Fonts.body, fontSize: 15, color: Colors.text1 },
  dateValueMuted: { color: Colors.text2 },
  dateValueError: { color: Colors.error },
  fieldError: {
    fontFamily: Fonts.mono,
    fontSize: 9,
    color: Colors.error,
    letterSpacing: ls(9, LS.labelWide),
    paddingBottom: Spacing.sm,
  },
  unlockHint: {
    fontFamily: Fonts.mono,
    fontSize: 9,
    color: Colors.text3,
    letterSpacing: ls(9, LS.labelWide),
    marginTop: 2,
  },

  fieldRow: { flexDirection: 'row', alignItems: 'flex-start' },
  fieldRowDivider: { width: 1, backgroundColor: Colors.border, alignSelf: 'stretch', marginVertical: Spacing.md },
  sectionDesc: {
    fontFamily: Fonts.body,
    fontSize: 14,
    color: Colors.text2,
    lineHeight: 22,
  },
  createOrgHeader: { gap: 6, marginBottom: Spacing.lg },
  createOrgTitle: { fontFamily: Fonts.display, fontSize: 28, color: Colors.text1, letterSpacing: ls(28, LS.display) },
  createOrgSubtitle: { fontFamily: Fonts.body, fontSize: 14, color: Colors.text2, lineHeight: 20 },
  orgAvatarPicker: { alignSelf: 'center', position: 'relative', marginBottom: Spacing.xs },
  orgAvatarImg: { width: 88, height: 88, borderRadius: 44 },
  orgAvatarFallback: {
    width: 88,
    height: 88,
    borderRadius: 44,
    backgroundColor: Colors.surface2,
    borderWidth: 1,
    borderColor: Colors.border2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  orgAvatarBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.bg,
  },
  orgAvatarBadgeText: { color: Colors.bg, fontSize: 16, fontFamily: Fonts.display, lineHeight: 20 },
  orgAvatarHint: {
    fontFamily: Fonts.body,
    fontSize: 12,
    color: Colors.text3,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  orgFields: { gap: Spacing.md, marginBottom: Spacing.lg },
  orgNote: {
    fontFamily: Fonts.mono,
    fontSize: 9,
    color: Colors.text3,
    textAlign: 'center',
    letterSpacing: ls(9, LS.labelWide),
    marginTop: Spacing.sm,
  },
  pickerOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  pickerContainer: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 16,
    borderTopRightRadius: 16,
    padding: Spacing.md,
    paddingBottom: Spacing.xl,
  },
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
