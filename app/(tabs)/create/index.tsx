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
import { updateEvent } from '@/lib/api/events'
import { uploadEventImage } from '@/lib/api/storage'
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

  const [eventTitle, setEventTitle] = useState('')
  const [eventDesc, setEventDesc] = useState('')
  const [location, setLocation] = useState('')
  const [capacity, setCapacity] = useState('100')
  const [stakeAmount, setStakeAmount] = useState('0.1')
  const [imageUri, setImageUri] = useState<string | null>(null)
  const [isUploading, setIsUploading] = useState(false)
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
      startTime,
      endTime,
      unlockTime: new Date(endTime.getTime() + 7 * 24 * 60 * 60 * 1000),
    }
    try {
      const result = await createEvent.mutateAsync(input)

      if (imageUri) {
        setIsUploading(true)
        try {
          const uploaded = await uploadEventImage(imageUri, result.eventPda)
          await updateEvent(result.eventPda, { imageUrl: uploaded.url })
        } catch (e) {
          showErrorFeedback(e, 'Image Upload Failed', 'Event was created but the image could not be uploaded.')
        } finally {
          setIsUploading(false)
        }
      }

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

  const isBusy = createEvent.isPending || isUploading

  return (
    <View style={styles.container}>
      <ScreenHeader title="CREATE EVENT" />
      <ScrollView contentContainerStyle={styles.scrollContent}>
        <Text style={styles.orgLabel}>ORG: {org.name}</Text>
        <Card>
          {/* Image picker */}
          <TouchableOpacity style={styles.imagePicker} onPress={pickImage} activeOpacity={0.7}>
            {imageUri ? (
              <Image source={{ uri: imageUri }} style={styles.imagePreview} contentFit="cover" />
            ) : (
              <View style={styles.imagePlaceholder}>
                <Text style={styles.imagePlaceholderIcon}>＋</Text>
                <Text style={styles.imagePlaceholderText}>ADD EVENT PHOTO</Text>
                <Text style={styles.imagePlaceholderHint}>16:9 recommended</Text>
              </View>
            )}
          </TouchableOpacity>

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
          <TouchableOpacity style={styles.fieldGroup} onPress={() => openPicker('startTime')} activeOpacity={0.7}>
            <Text style={styles.fieldLabel}>START TIME</Text>
            <Text style={styles.dateValue}>{formatDateTime(startTime)}</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.fieldGroup} onPress={() => openPicker('endTime')} activeOpacity={0.7}>
            <Text style={styles.fieldLabel}>END TIME</Text>
            <Text style={styles.dateValue}>{formatDateTime(endTime)}</Text>
          </TouchableOpacity>
          {endTime <= startTime && <Text style={styles.fieldError}>END TIME MUST BE AFTER START TIME</Text>}
          <View style={styles.fieldGroup}>
            <Text style={styles.fieldLabel}>UNLOCK TIME</Text>
            <Text style={[styles.dateValue, styles.dateValueMuted]}>
              {formatDateTime(new Date(endTime.getTime() + 7 * 24 * 60 * 60 * 1000))}
            </Text>
            <Text style={styles.unlockHint}>STAKE RELEASED 7 DAYS AFTER EVENT ENDS</Text>
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
          loading={isBusy}
          disabled={!eventTitle.trim() || !location.trim() || endTime <= startTime}
        >
          {isUploading ? 'Uploading image…' : createEvent.isPending ? 'Minting on Solana…' : 'Mint on Solana'}
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
  imagePicker: {
    marginBottom: Spacing.md,
    borderRadius: 8,
    overflow: 'hidden',
  },
  imagePreview: {
    width: '100%',
    aspectRatio: 16 / 9,
    borderRadius: 8,
  },
  imagePlaceholder: {
    width: '100%',
    aspectRatio: 16 / 9,
    borderWidth: 1,
    borderColor: Colors.border2,
    borderStyle: 'dashed',
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
  },
  imagePlaceholderIcon: {
    fontSize: 24,
    color: Colors.text3,
  },
  imagePlaceholderText: {
    fontFamily: Fonts.mono,
    fontSize: 9,
    color: Colors.text3,
    letterSpacing: ls(9, LS.labelWide),
  },
  imagePlaceholderHint: {
    fontFamily: Fonts.mono,
    fontSize: 9,
    color: Colors.text3,
    letterSpacing: ls(9, LS.label),
    opacity: 0.5,
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
  dateValue: {
    fontFamily: Fonts.body,
    fontSize: 16,
    color: Colors.text1,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border2,
    paddingVertical: 8,
  },
  dateValueMuted: { color: Colors.text2 },
  fieldError: {
    fontFamily: Fonts.mono,
    fontSize: 9,
    color: Colors.error,
    letterSpacing: ls(9, LS.labelWide),
    textTransform: 'uppercase',
    marginTop: -8,
  },
  unlockHint: {
    fontFamily: Fonts.mono,
    fontSize: 9,
    color: Colors.text3,
    letterSpacing: ls(9, LS.labelWide),
    marginTop: 4,
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
