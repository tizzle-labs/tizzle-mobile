import { ScreenHeader } from '@/components/layout/ScreenHeader'
import { Button } from '@/components/ui/Button'
import { SOL_MINT } from '@/components/ui/TokenAmount'
import { Colors } from '@/constants/colors'
import { Fonts, LS, ls } from '@/constants/fonts'
import { Spacing } from '@/constants/spacing'
import { PLATFORM_FEE_SOL, useCreateEvent, type CreateEventInput } from '@/hooks/api/use-create-event'
import { useCreateOrganization } from '@/hooks/api/use-create-organization'
import { useMyOrganizations } from '@/hooks/api/use-my-organizations'
import { showErrorFeedback } from '@/lib/app-feedback'
import { Ionicons } from '@expo/vector-icons'
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker'
import * as Clipboard from 'expo-clipboard'
import { Image } from 'expo-image'
import * as ImagePicker from 'expo-image-picker'
import { router } from 'expo-router'
import { useState } from 'react'
import {
  ActivityIndicator,
  Linking,
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
type StakeMode = 'SOL' | 'SPL'
type FeeMode = 'free' | 'fee'

const CATEGORIES = ['Music', 'Tech', 'Art', 'Sports', 'Gaming', 'Education', 'Community', 'Other']

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

  // Org form
  const [orgName, setOrgName] = useState('')
  const [orgDesc, setOrgDesc] = useState('')
  const [orgTwitter, setOrgTwitter] = useState('')
  const [orgDiscord, setOrgDiscord] = useState('')
  const [orgImageUri, setOrgImageUri] = useState<string | null>(null)

  // Event form
  const [eventTitle, setEventTitle] = useState('')
  const [eventDesc, setEventDesc] = useState('')
  const [location, setLocation] = useState('')
  const [category, setCategory] = useState('Music')
  const [capacity, setCapacity] = useState('100')
  const [eventImageUri, setEventImageUri] = useState<string | null>(null)
  const [venueImageUri, setVenueImageUri] = useState<string | null>(null)
  const [successData, setSuccessData] = useState<SuccessData | null>(null)

  // Stake settings
  const [stakeMode, setStakeMode] = useState<StakeMode>('SOL')
  const [stakeAmount, setStakeAmount] = useState('0.1')
  const [splMint, setSplMint] = useState('')
  const [splSymbol, setSplSymbol] = useState('')
  const [splDecimals, setSplDecimals] = useState('6')

  // Host fee
  const [feeMode, setFeeMode] = useState<FeeMode>('free')
  const [hostFeePercent, setHostFeePercent] = useState('10')

  // Date/time
  const [startTime, setStartTime] = useState(() => new Date(Date.now() + 24 * 60 * 60 * 1000))
  const [endTime, setEndTime] = useState(() => new Date(Date.now() + 27 * 60 * 60 * 1000))
  const [pickerField, setPickerField] = useState<PickerField>('startTime')
  const [pickerMode, setPickerMode] = useState<'date' | 'time'>('date')
  const [pickerVisible, setPickerVisible] = useState(false)
  const [tempDate, setTempDate] = useState(new Date())

  function resetEventForm() {
    setEventTitle('')
    setEventDesc('')
    setLocation('')
    setCategory('Music')
    setCapacity('100')
    setEventImageUri(null)
    setVenueImageUri(null)
    setStakeMode('SOL')
    setStakeAmount('0.1')
    setSplMint('')
    setSplSymbol('')
    setSplDecimals('6')
    setFeeMode('free')
    setHostFeePercent('10')
    setStartTime(new Date(Date.now() + 24 * 60 * 60 * 1000))
    setEndTime(new Date(Date.now() + 27 * 60 * 60 * 1000))
    setSuccessData(null)
  }

  async function pickImage(target: 'org' | 'event' | 'venue') {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (status !== 'granted') {
      showErrorFeedback(null, 'Permission Required', 'Allow photo library access to add an image.')
      return
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    })
    if (!result.canceled) {
      if (target === 'org') setOrgImageUri(result.assets[0].uri)
      else if (target === 'event') setEventImageUri(result.assets[0].uri)
      else setVenueImageUri(result.assets[0].uri)
    }
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
        <ScrollView contentContainerStyle={styles.successContent} showsVerticalScrollIndicator={false}>
          <Text style={styles.successHeading}>TICKETS{'\n'}MINTED</Text>

          <View style={styles.successCard}>
            <Text style={styles.successEventTitle}>{successData.eventTitle}</Text>

            <View style={styles.successDivider} />

            {/* Capacity */}
            <View style={styles.successRow}>
              <Text style={styles.successLabel}>CAPACITY</Text>
              <Text style={styles.successValue}>{successData.capacity} tickets</Text>
            </View>

            <View style={styles.successDivider} />

            {/* Transaction hash — copyable + open in explorer */}
            <View style={styles.successRow}>
              <Text style={styles.successLabel}>TRANSACTION</Text>
              <View style={styles.txActions}>
                <TouchableOpacity
                  style={styles.txHashBtn}
                  onPress={() => Clipboard.setStringAsync(successData.txHash)}
                  activeOpacity={0.7}
                >
                  <Text style={styles.successHash} numberOfLines={1}>
                    {successData.txHash.slice(0, 8)}…{successData.txHash.slice(-8)}
                  </Text>
                  <Ionicons name="copy-outline" size={15} color={Colors.text3} />
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.txLinkBtn}
                  onPress={() => Linking.openURL(`https://solscan.io/tx/${successData.txHash}?cluster=devnet`)}
                  activeOpacity={0.7}
                >
                  <Ionicons name="open-outline" size={16} color={Colors.accent} />
                </TouchableOpacity>
              </View>
            </View>
          </View>

          <View style={styles.successActions}>
            <Button onPress={() => router.push(`/(modals)/event/${successData.eventPda}`)}>View Event</Button>
            <Button onPress={resetEventForm} variant="secondary">
              Create Another
            </Button>
          </View>
        </ScrollView>
      </View>
    )
  }

  if (!org) {
    return (
      <View style={styles.container}>
        <ScreenHeader title="CREATE" />
        <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
          <View style={styles.createOrgHeader}>
            <Text style={styles.createOrgTitle}>Create Organization</Text>
            <Text style={styles.createOrgSubtitle}>You need an organization before hosting events on Tizzle.</Text>
          </View>
          <TouchableOpacity style={styles.orgAvatarPicker} onPress={() => pickImage('org')} activeOpacity={0.7}>
            {orgImageUri ? (
              <Image source={{ uri: orgImageUri }} style={styles.orgAvatarImg} contentFit="cover" />
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
                  imageUri: orgImageUri ?? undefined,
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
      title: eventTitle.trim(),
      description: eventDesc.trim(),
      imageUri: eventImageUri ?? undefined,
      venueImageUri: venueImageUri ?? undefined,
      location: location.trim(),
      category,
      capacity: parseInt(capacity) || 100,
      stakeAmount: parseFloat(stakeAmount) || 0.1,
      stakeTokenMint: stakeMode === 'SOL' ? SOL_MINT : splMint.trim(),
      stakeTokenSymbol: stakeMode === 'SOL' ? 'SOL' : splSymbol.trim(),
      stakeTokenDecimals: stakeMode === 'SOL' ? 9 : parseInt(splDecimals) || 6,
      hostFeeEnabled: feeMode === 'fee',
      hostFeePercent: feeMode === 'fee' ? parseInt(hostFeePercent) || 0 : 0,
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

  const splValid = stakeMode === 'SOL' || (splMint.trim().length > 30 && splSymbol.trim().length > 0)
  const feeValid = feeMode === 'free' || (parseInt(hostFeePercent) > 0 && parseInt(hostFeePercent) <= 100)
  const canSubmit = eventTitle.trim() && location.trim() && endTime > startTime && splValid && feeValid

  return (
    <View style={styles.container}>
      <ScreenHeader title="Create Event" />
      <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        <View style={styles.orgBadge}>
          {org.avatarUrl ? (
            <Image source={{ uri: org.avatarUrl }} style={styles.orgBadgeAvatar} contentFit="cover" />
          ) : (
            <View style={styles.orgBadgeAvatarFallback}>
              <Ionicons name="business-outline" size={10} color={Colors.text3} />
            </View>
          )}
          <Text style={styles.orgLabel}>{org.name}</Text>
        </View>

        {/* Cover image */}
        <TouchableOpacity style={styles.imagePicker} onPress={() => pickImage('event')} activeOpacity={0.8}>
          {eventImageUri ? (
            <Image source={{ uri: eventImageUri }} style={styles.imagePreview} contentFit="cover" />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Ionicons name="image-outline" size={28} color={Colors.text3} />
              <Text style={styles.imagePlaceholderText}>Add Event Image</Text>
              <Text style={styles.imagePlaceholderHint}>1:1 recommended</Text>
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
            <View style={styles.divider} />
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>CATEGORY</Text>
              <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.categoryScroll}>
                {CATEGORIES.map((cat) => (
                  <TouchableOpacity
                    key={cat}
                    style={[styles.categoryChip, category === cat && styles.categoryChipActive]}
                    onPress={() => setCategory(cat)}
                    activeOpacity={0.7}
                  >
                    <Text style={[styles.categoryChipText, category === cat && styles.categoryChipTextActive]}>
                      {cat}
                    </Text>
                  </TouchableOpacity>
                ))}
              </ScrollView>
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

        {/* Venue Image */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Venue Photo</Text>
          <TouchableOpacity style={styles.venuePickerBtn} onPress={() => pickImage('venue')} activeOpacity={0.8}>
            {venueImageUri ? (
              <Image source={{ uri: venueImageUri }} style={styles.venuePreview} contentFit="cover" />
            ) : (
              <View style={styles.venuePlaceholder}>
                <Ionicons name="business-outline" size={24} color={Colors.text3} />
                <Text style={styles.imagePlaceholderText}>Add Venue Photo</Text>
                <Text style={styles.imagePlaceholderHint}>Optional</Text>
              </View>
            )}
          </TouchableOpacity>
        </View>

        {/* Ticket Settings */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Ticket Settings</Text>
          <View style={styles.card}>
            {/* Capacity */}
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
            <View style={styles.divider} />
            {/* Stake token tabs */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>STAKE TOKEN</Text>
              <View style={styles.stakeTabs}>
                <TouchableOpacity
                  style={[styles.stakeTab, stakeMode === 'SOL' && styles.stakeTabActive]}
                  onPress={() => setStakeMode('SOL')}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.stakeTabText, stakeMode === 'SOL' && styles.stakeTabTextActive]}>SOL</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.stakeTab, stakeMode === 'SPL' && styles.stakeTabActive]}
                  onPress={() => setStakeMode('SPL')}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.stakeTabText, stakeMode === 'SPL' && styles.stakeTabTextActive]}>SPL Token</Text>
                </TouchableOpacity>
              </View>
            </View>
            <View style={styles.divider} />
            {/* Stake amount */}
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>
                STAKE AMOUNT {stakeMode === 'SOL' ? '(SOL)' : `(${splSymbol || 'TOKEN'})`}
              </Text>
              <TextInput
                style={styles.input}
                placeholder={stakeMode === 'SOL' ? '0.1' : '10'}
                placeholderTextColor={Colors.text3}
                value={stakeAmount}
                onChangeText={setStakeAmount}
                keyboardType="decimal-pad"
              />
            </View>
            {/* SPL-only fields */}
            {stakeMode === 'SPL' && (
              <>
                <View style={styles.divider} />
                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>TOKEN MINT ADDRESS *</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"
                    placeholderTextColor={Colors.text3}
                    value={splMint}
                    onChangeText={setSplMint}
                    autoCapitalize="none"
                    autoCorrect={false}
                  />
                </View>
                <View style={styles.divider} />
                <View style={styles.fieldRow}>
                  <View style={[styles.fieldGroup, { flex: 2 }]}>
                    <Text style={styles.fieldLabel}>TOKEN SYMBOL *</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="e.g. USDC"
                      placeholderTextColor={Colors.text3}
                      value={splSymbol}
                      onChangeText={setSplSymbol}
                      autoCapitalize="characters"
                      maxLength={10}
                    />
                  </View>
                  <View style={styles.fieldRowDivider} />
                  <View style={[styles.fieldGroup, { flex: 1 }]}>
                    <Text style={styles.fieldLabel}>DECIMALS</Text>
                    <TextInput
                      style={styles.input}
                      placeholder="6"
                      placeholderTextColor={Colors.text3}
                      value={splDecimals}
                      onChangeText={setSplDecimals}
                      keyboardType="number-pad"
                      maxLength={2}
                    />
                  </View>
                </View>
              </>
            )}
          </View>
        </View>

        {/* Host Fee */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Host Fee</Text>
          <View style={styles.card}>
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>TICKET TYPE</Text>
              <View style={styles.stakeTabs}>
                <TouchableOpacity
                  style={[styles.stakeTab, feeMode === 'free' && styles.stakeTabActive]}
                  onPress={() => setFeeMode('free')}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.stakeTabText, feeMode === 'free' && styles.stakeTabTextActive]}>Free</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.stakeTab, feeMode === 'fee' && styles.stakeTabActive]}
                  onPress={() => setFeeMode('fee')}
                  activeOpacity={0.7}
                >
                  <Text style={[styles.stakeTabText, feeMode === 'fee' && styles.stakeTabTextActive]}>With Fee</Text>
                </TouchableOpacity>
              </View>
            </View>
            {feeMode === 'fee' && (
              <>
                <View style={styles.divider} />
                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>HOST FEE PERCENT (1–100)</Text>
                  <TextInput
                    style={styles.input}
                    placeholder="e.g. 10"
                    placeholderTextColor={Colors.text3}
                    value={hostFeePercent}
                    onChangeText={setHostFeePercent}
                    keyboardType="number-pad"
                    maxLength={3}
                  />
                </View>
                <View style={styles.divider} />
                <View style={styles.fieldGroup}>
                  <Text style={styles.fieldLabel}>WHAT THIS MEANS</Text>
                  <Text style={styles.feeNote}>
                    {parseInt(hostFeePercent) || 0}% of each attendee{"'"}s stake will go to you as host fee. The rest
                    is returned to attendees who check in.
                  </Text>
                </View>
              </>
            )}
            <View style={styles.divider} />
            <View style={styles.platformFeeRow}>
              <View style={styles.platformFeeLeft}>
                <Text style={styles.fieldLabel}>PLATFORM FEE</Text>
                <Text style={styles.platformFeeFormula}>
                  {PLATFORM_FEE_SOL} SOL × {parseInt(capacity) || 100} tickets
                </Text>
              </View>
              <View style={styles.platformFeeRight}>
                <Text style={styles.platformFeeTotal}>
                  {(PLATFORM_FEE_SOL * (parseInt(capacity) || 100)).toFixed(4)}
                </Text>
                <Text style={styles.platformFeeUnit}>SOL</Text>
              </View>
            </View>
          </View>
        </View>

        <Button onPress={handleCreateEvent} loading={createEvent.isPending} disabled={!canSubmit}>
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

  orgBadge: { flexDirection: 'row', alignItems: 'center', gap: 8 },
  orgBadgeAvatar: { width: 24, height: 24, borderRadius: 12, backgroundColor: Colors.surface2 },
  orgBadgeAvatarFallback: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.surface2,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border2,
  },
  orgLabel: { fontFamily: Fonts.bodyMedium, fontSize: 14, color: Colors.text1 },

  imagePicker: { borderRadius: 16, overflow: 'hidden', marginBottom: Spacing.xs },
  imagePreview: { width: '100%', aspectRatio: 1 },
  imagePlaceholder: {
    width: '100%',
    aspectRatio: 1,
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

  categoryScroll: { marginTop: 4 },
  categoryChip: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1,
    borderColor: Colors.border2,
    marginRight: 8,
    backgroundColor: Colors.surface2,
  },
  categoryChipActive: { backgroundColor: Colors.accent, borderColor: Colors.accent },
  categoryChipText: {
    fontFamily: Fonts.mono,
    fontSize: 10,
    color: Colors.text2,
    letterSpacing: ls(10, LS.labelNarrow),
  },
  categoryChipTextActive: { color: Colors.bg },

  stakeTabs: { flexDirection: 'row', gap: 8, marginTop: 4 },
  stakeTab: {
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
    borderWidth: 1,
    borderColor: Colors.border2,
    backgroundColor: Colors.surface2,
  },
  stakeTabActive: { backgroundColor: Colors.accent, borderColor: Colors.accent },
  stakeTabText: { fontFamily: Fonts.mono, fontSize: 11, color: Colors.text2, letterSpacing: ls(11, LS.labelNarrow) },
  stakeTabTextActive: { color: Colors.bg },

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

  venuePickerBtn: { borderRadius: 12, overflow: 'hidden' },
  venuePreview: { width: '100%', aspectRatio: 16 / 9, borderRadius: 12 },
  venuePlaceholder: {
    width: '100%',
    aspectRatio: 16 / 9,
    borderWidth: 1,
    borderColor: Colors.border2,
    borderStyle: 'dashed',
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
    backgroundColor: Colors.surface,
  },
  feeNote: { fontFamily: Fonts.body, fontSize: 13, color: Colors.text2, lineHeight: 20 },
  platformFeeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.md,
  },
  platformFeeLeft: { gap: 3 },
  platformFeeFormula: { fontFamily: Fonts.body, fontSize: 13, color: Colors.text3 },
  platformFeeRight: { flexDirection: 'row', alignItems: 'baseline', gap: 4 },
  platformFeeTotal: {
    fontFamily: Fonts.display,
    fontSize: 20,
    color: Colors.text1,
    letterSpacing: ls(20, LS.displaySubtle),
  },
  platformFeeUnit: { fontFamily: Fonts.mono, fontSize: 11, color: Colors.text3 },
  successContent: { flexGrow: 1, padding: Spacing.md, gap: Spacing.xl, justifyContent: 'center', paddingBottom: 80 },
  successHeading: {
    fontFamily: Fonts.display,
    fontSize: 56,
    color: Colors.accent,
    letterSpacing: ls(56, LS.displayTight),
    lineHeight: 62,
  },
  successCard: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    overflow: 'hidden',
  },
  successDivider: { height: 1, backgroundColor: Colors.border },
  successRow: {
    paddingVertical: Spacing.md,
    gap: 8,
  },
  successEventTitle: {
    fontFamily: Fonts.display,
    fontSize: 22,
    color: Colors.text1,
    letterSpacing: ls(22, LS.displaySubtle),
    paddingVertical: Spacing.md,
  },
  successLabel: {
    fontFamily: Fonts.mono,
    fontSize: 9,
    color: Colors.text3,
    letterSpacing: ls(9, LS.labelWide),
    textTransform: 'uppercase',
  },
  successValue: { fontFamily: Fonts.body, fontSize: 15, color: Colors.text1 },
  txActions: { flexDirection: 'row', alignItems: 'center', gap: 10 },
  txHashBtn: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.surface2,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: Colors.border2,
    minHeight: 44,
  },
  successHash: { flex: 1, fontFamily: Fonts.mono, fontSize: 13, color: Colors.text2 },
  txLinkBtn: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: Colors.surface2,
    borderWidth: 1,
    borderColor: Colors.border2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successActions: { gap: Spacing.md },
})
