import { BottomSheet, type BottomSheetRef } from '@/components/ui/BottomSheet'
import { Button } from '@/components/ui/Button'
import { SOL_MINT } from '@/components/ui/TokenAmount'
import { Colors } from '@/constants/colors'
import { EVENT_CATEGORIES } from '@/constants/event-categories'
import { setDescriptionCallback } from '@/lib/description-callback-store'
import { setLocationCallback } from '@/lib/location-callback-store'
import { Fonts, LS, ls } from '@/constants/fonts'
import { Spacing } from '@/constants/spacing'
import { PLATFORM_FEE_SOL, useCreateEvent, type CreateEventInput } from '@/hooks/api/use-create-event'
import { useCreateOrganization } from '@/hooks/api/use-create-organization'
import { useMyOrganizations } from '@/hooks/api/use-my-organizations'
import { showErrorFeedback } from '@/lib/app-feedback'
import { Ionicons } from '@expo/vector-icons'
import { BottomSheetTextInput } from '@gorhom/bottom-sheet'
import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker'
import * as Clipboard from 'expo-clipboard'
import { Image } from 'expo-image'
import * as ImagePicker from 'expo-image-picker'
import { router } from 'expo-router'
import { useRef, useState } from 'react'
import {
  ActivityIndicator,
  KeyboardAvoidingView,
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
import { useSafeAreaInsets } from 'react-native-safe-area-context'

// ─── Helpers ─────────────────────────────────────────────────────────────────

function formatDate(d: Date) {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  return `${days[d.getDay()]}, ${months[d.getMonth()]} ${d.getDate()}`
}

function formatTime(d: Date) {
  let h = d.getHours()
  const m = String(d.getMinutes()).padStart(2, '0')
  const ampm = h >= 12 ? 'PM' : 'AM'
  h = h % 12 || 12
  return `${h}:${m} ${ampm}`
}

// ─── Types ────────────────────────────────────────────────────────────────────

type PickerField = 'startTime' | 'endTime'
type PickerChip = 'date' | 'time'
type TokenMode = 'sol' | 'spl'
type FeeMode = 'free' | 'paid'

interface SuccessData {
  txHash: string
  eventTitle: string
  eventPda: string
  capacity: number
}

// ─── Component ───────────────────────────────────────────────────────────────

export default function Create() {
  const insets = useSafeAreaInsets()
  const { data: orgs, isLoading: orgsLoading } = useMyOrganizations()
  const createOrg = useCreateOrganization()
  const createEvent = useCreateEvent()

  // ── Org form ──────────────────────────────────────────────────────────────
  const [orgName, setOrgName] = useState('')
  const [orgDesc, setOrgDesc] = useState('')
  const [orgTwitter, setOrgTwitter] = useState('')
  const [orgDiscord, setOrgDiscord] = useState('')
  const [orgImageUri, setOrgImageUri] = useState<string | null>(null)

  // ── Event form ────────────────────────────────────────────────────────────
  const [eventTitle, setEventTitle] = useState('')
  const [description, setDescription] = useState('')
  const [location, setLocation] = useState('')
  const [category, setCategory] = useState<string | null>(null)
  const [eventImageUri, setEventImageUri] = useState<string | null>(null)
  const [venueImageUri, setVenueImageUri] = useState<string | null>(null)
  const [gatekeeperAddress, setGatekeeperAddress] = useState('')
  const [successData, setSuccessData] = useState<SuccessData | null>(null)

  // ── Stake token ───────────────────────────────────────────────────────────
  const [tokenMode, setTokenMode] = useState<TokenMode>('sol')
  const [splMint, setSplMint] = useState('')
  const [splSymbol, setSplSymbol] = useState('')
  const [splDecimals, setSplDecimals] = useState('6')

  // ── Ticket settings ───────────────────────────────────────────────────────
  const [feeMode, setFeeMode] = useState<FeeMode>('free')
  const [stakeAmount, setStakeAmount] = useState('0.1')
  const [hostFeePercent, setHostFeePercent] = useState('10')
  const [capacityValue, setCapacityValue] = useState('')

  // ── Date/time ─────────────────────────────────────────────────────────────
  const [startTime, setStartTime] = useState(() => new Date(Date.now() + 24 * 60 * 60 * 1000))
  const [endTime, setEndTime] = useState(() => new Date(Date.now() + 27 * 60 * 60 * 1000))
  const [pickerField, setPickerField] = useState<PickerField>('startTime')
  const [pickerChip, setPickerChip] = useState<PickerChip>('date')
  const [pickerVisible, setPickerVisible] = useState(false)
  const [tempDate, setTempDate] = useState(new Date())

  // ── Sheet refs ────────────────────────────────────────────────────────────
  const categorySheetRef = useRef<BottomSheetRef>(null)
  const stakeSheetRef = useRef<BottomSheetRef>(null)
  const feeSheetRef = useRef<BottomSheetRef>(null)
  const unlockInfoSheetRef = useRef<BottomSheetRef>(null)

  // ── Input refs ────────────────────────────────────────────────────────────
  const gatekeeperRef = useRef<TextInput>(null)
  const capacityRef = useRef<TextInput>(null)

  // ── Derived ───────────────────────────────────────────────────────────────
  const unlockTime = new Date(endTime.getTime() + 7 * 24 * 60 * 60 * 1000)
  const stakeTokenMint = tokenMode === 'sol' ? SOL_MINT : splMint
  const stakeTokenSymbol = tokenMode === 'sol' ? 'SOL' : splSymbol
  const stakeTokenDecimals = tokenMode === 'sol' ? 9 : parseInt(splDecimals) || 6
  const capacity = parseInt(capacityValue) || 10000
  const platformFeeTotal = (PLATFORM_FEE_SOL * capacity).toFixed(4)
  const timeError = endTime <= startTime
  const splValid = tokenMode === 'sol' || (splMint.trim().length > 0 && splSymbol.trim().length > 0)
  const canSubmit = eventTitle.trim().length > 0 && location.trim().length > 0 && !timeError && splValid

  // ── Helpers ───────────────────────────────────────────────────────────────

  function resetEventForm() {
    setEventTitle('')
    setDescription('')
    setLocation('')
    setCategory(null)
    setEventImageUri(null)
    setVenueImageUri(null)
    setGatekeeperAddress('')
    setTokenMode('sol')
    setSplMint('')
    setSplSymbol('')
    setSplDecimals('6')
    setFeeMode('free')
    setStakeAmount('0.1')
    setHostFeePercent('10')
    setCapacityValue('')
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
      else if (target === 'venue') setVenueImageUri(result.assets[0].uri)
      else setEventImageUri(result.assets[0].uri)
    }
  }

  function openPicker(field: PickerField, chip: PickerChip) {
    setPickerField(field)
    setPickerChip(chip)
    setTempDate(new Date(field === 'startTime' ? startTime : endTime))
    setPickerVisible(true)
  }

  function commitPickerValue(field: PickerField, chip: PickerChip, selected: Date) {
    const current = field === 'startTime' ? startTime : endTime
    const updated = new Date(current)
    if (chip === 'date') {
      updated.setFullYear(selected.getFullYear(), selected.getMonth(), selected.getDate())
    } else {
      updated.setHours(selected.getHours(), selected.getMinutes(), 0, 0)
    }
    if (field === 'startTime') {
      setStartTime(updated)
      if (updated >= endTime) setEndTime(new Date(updated.getTime() + 3 * 60 * 60 * 1000))
    } else {
      setEndTime(updated)
    }
  }

  function handlePickerChange(_: DateTimePickerEvent, selected?: Date) {
    if (!selected) {
      setPickerVisible(false)
      return
    }
    if (Platform.OS === 'android') {
      setPickerVisible(false)
      commitPickerValue(pickerField, pickerChip, selected)
    } else {
      setTempDate(selected)
    }
  }

  async function handleCreateEvent() {
    if (!org) return
    const input: CreateEventInput = {
      organizationPda: org.organizationPda,
      title: eventTitle.trim(),
      description: description.trim() || undefined,
      imageUri: eventImageUri ?? undefined,
      venueImageUri: venueImageUri ?? undefined,
      location: location.trim(),
      category: category ?? 'others',
      capacity,
      stakeAmount: parseFloat(stakeAmount) || 0.1,
      stakeTokenMint,
      stakeTokenSymbol,
      stakeTokenDecimals,
      hostFeeEnabled: feeMode === 'paid',
      hostFeePercent: feeMode === 'paid' ? parseInt(hostFeePercent) || 0 : 0,
      startTime,
      endTime,
      unlockTime: new Date(endTime.getTime() + 7 * 24 * 60 * 60 * 1000),
      gatekeeperAddress: gatekeeperAddress.trim() || undefined,
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

  // ── Loading ───────────────────────────────────────────────────────────────

  if (orgsLoading) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Create Event</Text>
        </View>
        <View style={styles.center}>
          <ActivityIndicator color={Colors.accent} />
        </View>
      </View>
    )
  }

  const org = orgs?.[0]

  // ── Success ───────────────────────────────────────────────────────────────

  if (successData) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Create Event</Text>
        </View>
        <ScrollView contentContainerStyle={styles.successContent} showsVerticalScrollIndicator={false}>
          <Text style={styles.successHeading}>TICKETS{'\n'}MINTED</Text>
          <View style={styles.successCard}>
            <Text style={styles.successEventTitle}>{successData.eventTitle}</Text>
            <View style={styles.successDivider} />
            <View style={styles.successRow}>
              <Text style={styles.successLabel}>CAPACITY</Text>
              <Text style={styles.successValue}>
                {successData.capacity >= 10000 ? 'Unlimited' : `${successData.capacity} tickets`}
              </Text>
            </View>
            <View style={styles.successDivider} />
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
                  <Ionicons name="copy-outline" size={15} color={Colors.text2} />
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

  // ── Create Org ────────────────────────────────────────────────────────────

  if (!org) {
    return (
      <View style={[styles.container, { paddingTop: insets.top }]}>
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Create Event</Text>
        </View>
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
                <Ionicons name="business-outline" size={32} color={Colors.text2} />
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
                placeholderTextColor={Colors.text2}
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
                placeholderTextColor={Colors.text2}
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
                placeholderTextColor={Colors.text2}
                autoCapitalize="none"
                autoCorrect={false}
                value={orgTwitter}
                onChangeText={setOrgTwitter}
                maxLength={50}
              />
            </View>
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>DISCORD</Text>
              <TextInput
                style={styles.input}
                placeholder="discord.gg/yourserver"
                placeholderTextColor={Colors.text2}
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

  // ── Event Form ────────────────────────────────────────────────────────────

  const selectedCategory = EVENT_CATEGORIES.find((c) => c.label === category)
  const tokenLabel = tokenMode === 'sol' ? 'SOL' : splSymbol ? splSymbol : 'SPL Token'
  const stakeLabel = `${stakeAmount} ${tokenLabel}`
  const feeLabel = feeMode === 'free' ? 'Free' : `${hostFeePercent}%`

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Create Event</Text>
        <View style={styles.headerOrg}>
          {org.avatarUrl ? (
            <Image source={{ uri: org.avatarUrl }} style={styles.headerOrgAvatar} contentFit="cover" />
          ) : (
            <View style={styles.headerOrgAvatarFallback}>
              <Ionicons name="business-outline" size={10} color={Colors.text2} />
            </View>
          )}
          <Text style={styles.headerOrgName} numberOfLines={1}>
            {org.name}
          </Text>
          <Ionicons name="chevron-down" size={14} color={Colors.text2} />
        </View>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        <ScrollView
          style={styles.scroll}
          contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + 120 }]}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          {/* ── Event Cover Image ─────────────────────────────────────────── */}
          <TouchableOpacity style={styles.imagePicker} onPress={() => pickImage('event')} activeOpacity={0.85}>
            {eventImageUri ? (
              <Image source={{ uri: eventImageUri }} style={styles.imagePreview} contentFit="cover" />
            ) : (
              <View style={styles.imagePlaceholder}>
                <Ionicons name="image-outline" size={32} color={Colors.text2} />
                <Text style={styles.imagePlaceholderText}>Add Event Cover</Text>
              </View>
            )}
          </TouchableOpacity>

          {/* ── Event Name ───────────────────────────────────────────────── */}
          <View style={styles.card}>
            <TextInput
              style={styles.titleInput}
              placeholder="Event Name"
              placeholderTextColor={Colors.text2}
              value={eventTitle}
              onChangeText={setEventTitle}
              maxLength={80}
            />
          </View>

          {/* ── Date & Time ──────────────────────────────────────────────── */}
          <View style={styles.card}>
            {/* Start */}
            <View style={styles.dtRow}>
              <View style={styles.dtLeft}>
                <View style={styles.dtDotFilled} />
                <Text style={styles.dtLabel}>Start</Text>
              </View>
              <View style={styles.dtChips}>
                <TouchableOpacity
                  style={styles.dtChip}
                  onPress={() => openPicker('startTime', 'date')}
                  activeOpacity={0.7}
                >
                  <Ionicons name="calendar-outline" size={13} color={Colors.text2} />
                  <Text style={styles.dtChipText}>{formatDate(startTime)}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.dtChip}
                  onPress={() => openPicker('startTime', 'time')}
                  activeOpacity={0.7}
                >
                  <Ionicons name="time-outline" size={13} color={Colors.text2} />
                  <Text style={styles.dtChipText}>{formatTime(startTime)}</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.dtConnectorRow}>
              <View style={styles.dtConnectorSpacer} />
              <View style={styles.dtConnectorLine} />
            </View>

            {/* End */}
            <View style={styles.dtRow}>
              <View style={styles.dtLeft}>
                <View style={[styles.dtDotEmpty, timeError && styles.dtDotError]} />
                <Text style={[styles.dtLabel, timeError && styles.dtLabelError]}>End</Text>
              </View>
              <View style={styles.dtChips}>
                <TouchableOpacity
                  style={[styles.dtChip, timeError && styles.dtChipError]}
                  onPress={() => openPicker('endTime', 'date')}
                  activeOpacity={0.7}
                >
                  <Ionicons name="calendar-outline" size={13} color={timeError ? Colors.error : Colors.text2} />
                  <Text style={[styles.dtChipText, timeError && styles.dtChipTextError]}>{formatDate(endTime)}</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={[styles.dtChip, timeError && styles.dtChipError]}
                  onPress={() => openPicker('endTime', 'time')}
                  activeOpacity={0.7}
                >
                  <Ionicons name="time-outline" size={13} color={timeError ? Colors.error : Colors.text2} />
                  <Text style={[styles.dtChipText, timeError && styles.dtChipTextError]}>{formatTime(endTime)}</Text>
                </TouchableOpacity>
              </View>
            </View>

            <View style={styles.dtConnectorRow}>
              <View style={styles.dtConnectorSpacer} />
              <View style={styles.dtConnectorLine} />
            </View>

            {/* Unlock — read-only, auto endTime + 7 days */}
            <View style={styles.dtRow}>
              <View style={styles.dtLeft}>
                <Ionicons name="lock-open-outline" size={12} color={Colors.text2} />
                <Text style={styles.dtLabelDim}>Unlock</Text>
                <TouchableOpacity onPress={() => unlockInfoSheetRef.current?.present()} hitSlop={8} activeOpacity={0.6}>
                  <Ionicons name="help-circle-outline" size={14} color={Colors.text2} />
                </TouchableOpacity>
              </View>
              <Text style={styles.dtReadOnly}>
                {formatDate(unlockTime)} · {formatTime(unlockTime)}
              </Text>
            </View>
          </View>

          {/* ── Location ─────────────────────────────────────────────────── */}
          <TouchableOpacity
            style={styles.card}
            activeOpacity={0.7}
            onPress={() => {
              setLocationCallback((selected) => setLocation(selected))
              router.push('/(modals)/location-search')
            }}
          >
            <View style={styles.iconRow}>
              <Ionicons name="location-outline" size={18} color={Colors.text2} style={styles.rowIcon} />
              <Text style={[styles.rowInput, !location && { color: Colors.text2 }]} numberOfLines={1}>
                {location || 'Choose Location'}
              </Text>
              {location ? (
                <TouchableOpacity
                  hitSlop={8}
                  activeOpacity={0.7}
                  onPress={(e) => {
                    e.stopPropagation()
                    setLocation('')
                  }}
                >
                  <Ionicons name="close-circle" size={16} color={Colors.text2} />
                </TouchableOpacity>
              ) : (
                <Ionicons name="chevron-forward" size={16} color={Colors.text2} />
              )}
            </View>
          </TouchableOpacity>

          {/* ── Description ──────────────────────────────────────────────── */}
          <TouchableOpacity
            style={styles.card}
            activeOpacity={0.7}
            onPress={() => {
              setDescriptionCallback((html) => setDescription(html), description)
              router.push('/(modals)/event-description')
            }}
          >
            <View style={styles.iconRow}>
              <Ionicons
                name="reorder-three-outline"
                size={18}
                color={Colors.text2}
                style={[styles.rowIcon, styles.rowIconTop]}
              />
              {description ? (
                <Text style={styles.descPreview} numberOfLines={3}>
                  {description.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()}
                </Text>
              ) : (
                <Text style={[styles.descInput, { color: Colors.text2 }]}>Add Description</Text>
              )}
              <Ionicons name="chevron-forward" size={16} color={Colors.text2} style={styles.rowIconTop} />
            </View>
          </TouchableOpacity>

          {/* ── Venue Photo ──────────────────────────────────────────────── */}
          <TouchableOpacity style={styles.card} onPress={() => pickImage('venue')} activeOpacity={0.85}>
            <View style={styles.iconRow}>
              <Ionicons name="business-outline" size={18} color={Colors.text2} style={styles.rowIcon} />
              {venueImageUri ? (
                <>
                  <Image source={{ uri: venueImageUri }} style={styles.venueThumbnail} contentFit="cover" />
                  <TouchableOpacity
                    onPress={(e) => {
                      e.stopPropagation()
                      setVenueImageUri(null)
                    }}
                    hitSlop={8}
                  >
                    <Ionicons name="close-circle" size={20} color={Colors.text2} />
                  </TouchableOpacity>
                </>
              ) : (
                <>
                  <Text style={styles.rowPlaceholder}>Add Venue Photo</Text>
                  <Ionicons name="chevron-forward" size={16} color={Colors.text2} />
                </>
              )}
            </View>
          </TouchableOpacity>

          {/* ── Ticketing ────────────────────────────────────────────────── */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Ticketing</Text>
            <View style={styles.card}>
              {/* Stake */}
              <TouchableOpacity
                style={styles.iconRow}
                onPress={() => stakeSheetRef.current?.present()}
                activeOpacity={0.7}
              >
                <Ionicons name="wallet-outline" size={18} color={Colors.text2} style={styles.rowIcon} />
                <Text style={styles.rowLabel}>Stake</Text>
                <View style={styles.rowRight}>
                  <Text style={styles.rowValue}>{stakeLabel}</Text>
                  <Ionicons name="chevron-forward" size={16} color={Colors.text2} />
                </View>
              </TouchableOpacity>

              <View style={styles.cardDivider} />

              {/* Host Fee */}
              <TouchableOpacity
                style={styles.iconRow}
                onPress={() => feeSheetRef.current?.present()}
                activeOpacity={0.7}
              >
                <Ionicons name="cash-outline" size={18} color={Colors.text2} style={styles.rowIcon} />
                <Text style={styles.rowLabel}>Host Fee</Text>
                <View style={styles.rowRight}>
                  <Text style={styles.rowValue}>{feeLabel}</Text>
                  <Ionicons name="chevron-forward" size={16} color={Colors.text2} />
                </View>
              </TouchableOpacity>

              <View style={styles.cardDivider} />

              {/* Capacity */}
              <TouchableOpacity style={styles.iconRow} onPress={() => capacityRef.current?.focus()} activeOpacity={1}>
                <Ionicons name="people-outline" size={18} color={Colors.text2} style={styles.rowIcon} />
                <Text style={styles.rowLabel}>Capacity</Text>
                <TextInput
                  ref={capacityRef}
                  style={styles.capacityInput}
                  value={capacityValue}
                  onChangeText={setCapacityValue}
                  placeholder="e.g. 500"
                  placeholderTextColor={Colors.text2}
                  keyboardType="number-pad"
                  maxLength={5}
                  returnKeyType="done"
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* ── Options ──────────────────────────────────────────────────── */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>Options</Text>
            <View style={styles.card}>
              {/* Category */}
              <TouchableOpacity
                style={styles.iconRow}
                onPress={() => categorySheetRef.current?.present()}
                activeOpacity={0.7}
              >
                <Ionicons name="grid-outline" size={18} color={Colors.text2} style={styles.rowIcon} />
                <Text style={styles.rowLabel}>Category</Text>
                <View style={styles.rowRight}>
                  <Text style={styles.rowValue} numberOfLines={1} ellipsizeMode="tail">
                    {selectedCategory ? `${selectedCategory.icon} ${selectedCategory.label}` : '🌐 Others'}
                  </Text>
                  <Ionicons name="chevron-expand" size={16} color={Colors.text2} />
                </View>
              </TouchableOpacity>

              <View style={styles.cardDivider} />

              {/* Gatekeeper Address */}
              <TouchableOpacity style={styles.iconRow} onPress={() => gatekeeperRef.current?.focus()} activeOpacity={1}>
                <Ionicons name="key-outline" size={18} color={Colors.text2} style={styles.rowIcon} />
                <TextInput
                  ref={gatekeeperRef}
                  style={styles.rowInput}
                  placeholder="Gatekeeper Address (default: you)"
                  placeholderTextColor={Colors.text2}
                  value={gatekeeperAddress}
                  onChangeText={setGatekeeperAddress}
                  autoCapitalize="none"
                  autoCorrect={false}
                  returnKeyType="done"
                />
              </TouchableOpacity>
            </View>
          </View>

          {/* Platform fee note */}
          <Text style={styles.feeNote}>
            Platform fee: {PLATFORM_FEE_SOL} SOL × {capacityValue || '10,000'} = {platformFeeTotal} SOL
          </Text>

          {/* Create button */}
          <Button
            onPress={handleCreateEvent}
            loading={createEvent.isPending}
            disabled={!canSubmit || createEvent.isPending}
          >
            {createEvent.isPending ? 'Creating on Solana…' : 'Create'}
          </Button>
        </ScrollView>
      </KeyboardAvoidingView>

      {/* ── Category Sheet ───────────────────────────────────────────────── */}
      <BottomSheet ref={categorySheetRef} title="Category" scrollable snapPoints={['70%']}>
        {EVENT_CATEGORIES.map((cat) => (
          <TouchableOpacity
            key={cat.label}
            style={[styles.categoryRow, category === cat.label && styles.categoryRowActive]}
            onPress={() => {
              setCategory(cat.label)
              categorySheetRef.current?.dismiss()
            }}
            activeOpacity={0.7}
          >
            <Text style={styles.categoryIcon}>{cat.icon}</Text>
            <Text style={[styles.categoryRowLabel, category === cat.label && styles.categoryRowLabelActive]}>
              {cat.label}
            </Text>
            {category === cat.label && <Ionicons name="checkmark" size={18} color={Colors.accent} />}
          </TouchableOpacity>
        ))}
        <TouchableOpacity
          style={styles.categoryRow}
          onPress={() => {
            setCategory(null)
            categorySheetRef.current?.dismiss()
          }}
          activeOpacity={0.7}
        >
          <Text style={styles.categoryIcon}>🌐</Text>
          <Text style={[styles.categoryRowLabel, category === null && styles.categoryRowLabelActive]}>Others</Text>
          {category === null && <Ionicons name="checkmark" size={18} color={Colors.accent} />}
        </TouchableOpacity>
      </BottomSheet>

      {/* ── Stake Sheet ──────────────────────────────────────────────────── */}
      <BottomSheet ref={stakeSheetRef} title="Stake" scrollable snapPoints={['70%']}>
        <Text style={styles.sheetFieldLabel}>TOKEN</Text>
        <View style={[styles.feeTabs, { marginTop: 8 }]}>
          <TouchableOpacity
            style={[styles.feeTab, tokenMode === 'sol' && styles.feeTabActive]}
            onPress={() => setTokenMode('sol')}
            activeOpacity={0.7}
          >
            <Text style={[styles.feeTabText, tokenMode === 'sol' && styles.feeTabTextActive]}>SOL</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.feeTab, tokenMode === 'spl' && styles.feeTabActive]}
            onPress={() => setTokenMode('spl')}
            activeOpacity={0.7}
          >
            <Text style={[styles.feeTabText, tokenMode === 'spl' && styles.feeTabTextActive]}>SPL Token</Text>
          </TouchableOpacity>
        </View>

        {tokenMode === 'spl' && (
          <View style={[styles.feeFields, { marginTop: Spacing.sm }]}>
            <View style={styles.fieldGroup}>
              <Text style={styles.sheetFieldLabel}>MINT ADDRESS</Text>
              <BottomSheetTextInput
                style={styles.input}
                placeholder="e.g. EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"
                placeholderTextColor={Colors.text2}
                value={splMint}
                onChangeText={setSplMint}
                autoCapitalize="none"
                autoCorrect={false}
              />
            </View>
            <View style={styles.fieldGroup}>
              <Text style={styles.sheetFieldLabel}>SYMBOL</Text>
              <BottomSheetTextInput
                style={styles.input}
                placeholder="e.g. USDC"
                placeholderTextColor={Colors.text2}
                value={splSymbol}
                onChangeText={setSplSymbol}
                autoCapitalize="characters"
                autoCorrect={false}
                maxLength={10}
              />
            </View>
            <View style={styles.fieldGroup}>
              <Text style={styles.sheetFieldLabel}>DECIMALS</Text>
              <BottomSheetTextInput
                style={styles.input}
                placeholder="6"
                placeholderTextColor={Colors.text2}
                value={splDecimals}
                onChangeText={setSplDecimals}
                keyboardType="number-pad"
                maxLength={2}
              />
            </View>
          </View>
        )}

        <View style={[styles.sheetDivider, { marginVertical: Spacing.md }]} />

        <View style={styles.fieldGroup}>
          <Text style={styles.sheetFieldLabel}>AMOUNT ({tokenLabel})</Text>
          <BottomSheetTextInput
            style={styles.input}
            placeholder="0.1"
            placeholderTextColor={Colors.text2}
            value={stakeAmount}
            onChangeText={setStakeAmount}
            keyboardType="decimal-pad"
          />
        </View>

        <View style={{ marginTop: Spacing.md }}>
          <Button onPress={() => stakeSheetRef.current?.dismiss()}>Done</Button>
        </View>
      </BottomSheet>

      {/* ── Host Fee Sheet ───────────────────────────────────────────────── */}
      <BottomSheet ref={feeSheetRef} title="Host Fee" scrollable snapPoints={['55%']}>
        <View style={styles.feeTabs}>
          <TouchableOpacity
            style={[styles.feeTab, feeMode === 'free' && styles.feeTabActive]}
            onPress={() => setFeeMode('free')}
            activeOpacity={0.7}
          >
            <Text style={[styles.feeTabText, feeMode === 'free' && styles.feeTabTextActive]}>Free</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[styles.feeTab, feeMode === 'paid' && styles.feeTabActive]}
            onPress={() => setFeeMode('paid')}
            activeOpacity={0.7}
          >
            <Text style={[styles.feeTabText, feeMode === 'paid' && styles.feeTabTextActive]}>Paid</Text>
          </TouchableOpacity>
        </View>

        {feeMode === 'free' ? (
          <Text style={[styles.feeDesc, { marginTop: Spacing.sm }]}>
            Attendees stake {stakeAmount} {tokenLabel} as a commitment deposit. The full amount is returned when they
            check in.
          </Text>
        ) : (
          <View style={[styles.feeFields, { marginTop: Spacing.sm }]}>
            <View style={styles.fieldGroup}>
              <Text style={styles.sheetFieldLabel}>HOST FEE % (1–100)</Text>
              <BottomSheetTextInput
                style={styles.input}
                placeholder="10"
                placeholderTextColor={Colors.text2}
                value={hostFeePercent}
                onChangeText={setHostFeePercent}
                keyboardType="number-pad"
                maxLength={3}
              />
            </View>
            <Text style={styles.feeDesc}>
              Attendees stake {stakeAmount} {tokenLabel}. You keep {hostFeePercent}% when they check in — attendees
              receive the remaining {100 - (parseInt(hostFeePercent) || 0)}%.
            </Text>
          </View>
        )}

        <View style={{ marginTop: Spacing.md }}>
          <Button onPress={() => feeSheetRef.current?.dismiss()}>Done</Button>
        </View>
      </BottomSheet>

      {/* ── Unlock Info Sheet ────────────────────────────────────────────── */}
      <BottomSheet ref={unlockInfoSheetRef} title="What is Unlock?" dynamicSizing>
        <Text style={styles.infoText}>
          The <Text style={styles.infoHighlight}>Unlock Date</Text> is automatically set to{' '}
          <Text style={styles.infoHighlight}>7 days after the event ends</Text>. It marks when staked funds become
          eligible for settlement.
        </Text>
        <Text style={styles.infoText}>
          After the event, Tizzle enters a settlement window. Attendees who checked in receive their stake back (minus
          any host fee). No-shows forfeit their stake.
        </Text>
        <Text style={styles.infoText}>
          The 7-day buffer gives organizers time to finalize attendance records before funds are released on-chain.
        </Text>
        <View style={styles.infoRow}>
          <Ionicons name="time-outline" size={16} color={Colors.accent} />
          <Text style={styles.infoCaption}>Unlock = End Date + 7 days (automatic)</Text>
        </View>
      </BottomSheet>

      {/* ── Date picker (Android) ────────────────────────────────────────── */}
      {pickerVisible && Platform.OS === 'android' && (
        <DateTimePicker value={tempDate} mode={pickerChip} onChange={handlePickerChange} />
      )}

      {/* ── Date picker (iOS) ────────────────────────────────────────────── */}
      {Platform.OS === 'ios' && (
        <Modal visible={pickerVisible} transparent animationType="slide">
          <View style={styles.pickerOverlay}>
            <View style={styles.pickerContainer}>
              <DateTimePicker
                value={tempDate}
                mode={pickerChip}
                display="spinner"
                onChange={handlePickerChange}
                textColor={Colors.text1}
              />
              <Button
                onPress={() => {
                  commitPickerValue(pickerField, pickerChip, tempDate)
                  setPickerVisible(false)
                }}
              >
                Done
              </Button>
            </View>
          </View>
        </Modal>
      )}
    </View>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: Spacing.md, paddingTop: Spacing.md, gap: Spacing.sm },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  headerTitle: {
    fontFamily: Fonts.display,
    fontSize: 18,
    color: Colors.text1,
    letterSpacing: ls(18, LS.displaySubtle),
  },
  headerOrg: { flexDirection: 'row', alignItems: 'center', gap: 6, maxWidth: 140 },
  headerOrgAvatar: { width: 24, height: 24, borderRadius: 12 },
  headerOrgAvatarFallback: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: Colors.surface2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerOrgName: { fontFamily: Fonts.bodyMedium, fontSize: 13, color: Colors.text2, flex: 1 },

  // Event cover image
  imagePicker: { borderRadius: 16, overflow: 'hidden' },
  imagePreview: { width: '100%', aspectRatio: 1 },
  imagePlaceholder: {
    width: '100%',
    aspectRatio: 1,
    backgroundColor: Colors.surface2,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  imagePlaceholderText: { fontFamily: Fonts.bodyMedium, fontSize: 14, color: Colors.text2 },

  // Card
  card: {
    backgroundColor: Colors.surface2,
    borderRadius: 16,
    paddingHorizontal: Spacing.md,
  },
  cardDivider: { height: 1, backgroundColor: Colors.border, marginLeft: 42 },

  // Title input
  titleInput: {
    fontFamily: Fonts.display,
    fontSize: 22,
    color: Colors.text1,
    letterSpacing: ls(22, LS.displaySubtle),
    paddingVertical: 18,
  },

  // DateTime
  dtRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, gap: 10 },
  dtLeft: { flexDirection: 'row', alignItems: 'center', gap: 6, minWidth: 76 },
  dtDotFilled: { width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.text2 },
  dtDotEmpty: {
    width: 10,
    height: 10,
    borderRadius: 5,
    borderWidth: 2,
    borderColor: Colors.text2,
    backgroundColor: 'transparent',
  },
  dtDotError: { borderColor: Colors.error },
  dtConnectorRow: { flexDirection: 'row', alignItems: 'center', height: 10 },
  dtConnectorSpacer: { width: 4 },
  dtConnectorLine: {
    width: 0,
    height: 10,
    borderLeftWidth: 2,
    borderLeftColor: Colors.border2,
    borderStyle: 'dashed',
    marginLeft: 3,
  },
  dtLabel: { fontFamily: Fonts.bodyMedium, fontSize: 14, color: Colors.text2 },
  dtLabelDim: { fontFamily: Fonts.bodyMedium, fontSize: 14, color: Colors.text2 },
  dtLabelError: { color: Colors.error },
  dtReadOnly: { flex: 1, fontFamily: Fonts.body, fontSize: 13, color: Colors.text2, textAlign: 'right' },
  dtChips: { flexDirection: 'row', gap: 6, flex: 1, justifyContent: 'flex-end' },
  dtChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 5,
    backgroundColor: Colors.surface,
    borderRadius: 8,
    paddingHorizontal: 10,
    paddingVertical: 7,
  },
  dtChipError: { backgroundColor: 'rgba(255,59,48,0.15)' },
  dtChipText: { fontFamily: Fonts.bodyMedium, fontSize: 12, color: Colors.text1 },
  dtChipTextError: { color: Colors.error },

  // Icon rows
  iconRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    gap: 12,
    minHeight: 54,
  },
  rowIcon: { width: 18 },
  rowIconTop: { alignSelf: 'flex-start', marginTop: 2 },
  rowLabel: { flex: 1, fontFamily: Fonts.body, fontSize: 15, color: Colors.text2 },
  rowInput: { flex: 1, fontFamily: Fonts.body, fontSize: 15, color: Colors.text1, paddingVertical: 0 },
  rowPlaceholder: { flex: 1, fontFamily: Fonts.body, fontSize: 15, color: Colors.text2 },
  descInput: {
    flex: 1,
    fontFamily: Fonts.body,
    fontSize: 15,
    paddingVertical: 0,
  },
  descPreview: {
    flex: 1,
    fontFamily: Fonts.body,
    fontSize: 15,
    color: Colors.text1,
    paddingVertical: 0,
  },
  rowRight: { flexDirection: 'row', alignItems: 'center', gap: 4, flexShrink: 1, maxWidth: '60%' },
  rowValue: { fontFamily: Fonts.body, fontSize: 15, color: Colors.text1, flexShrink: 1 },
  switch: { marginLeft: 'auto' },

  // Venue thumbnail
  venueThumbnail: { flex: 1, height: 52, borderRadius: 8 },

  // Capacity inline input
  capacityInput: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 15,
    color: Colors.accent,
    textAlign: 'right',
    minWidth: 60,
    paddingVertical: 0,
  },

  // Section
  section: { gap: 8 },
  sectionLabel: { fontFamily: Fonts.body, fontSize: 15, color: Colors.text2, paddingLeft: 4 },

  // Fee note
  feeNote: {
    fontFamily: Fonts.mono,
    fontSize: 10,
    color: Colors.text2,
    letterSpacing: ls(10, LS.labelNarrow),
    textAlign: 'center',
  },

  // Category rows (inside BottomSheet)
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 14,
    gap: 14,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  categoryRowActive: { backgroundColor: 'transparent' },
  categoryIcon: { fontSize: 20, width: 24, textAlign: 'center' },
  categoryRowLabel: { flex: 1, fontFamily: Fonts.body, fontSize: 15, color: Colors.text2 },
  categoryRowLabelActive: { color: Colors.text1 },

  // Fee / token tabs (inside BottomSheet)
  feeTabs: { flexDirection: 'row', gap: 8 },
  feeTab: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: 'center',
    backgroundColor: Colors.surface,
  },
  feeTabActive: { backgroundColor: Colors.accent },
  feeTabText: { fontFamily: Fonts.bodyMedium, fontSize: 14, color: Colors.text2 },
  feeTabTextActive: { color: Colors.bg },
  feeDesc: { fontFamily: Fonts.body, fontSize: 13, color: Colors.text2, lineHeight: 20 },
  feeFields: { gap: Spacing.md },
  sheetDivider: { height: 1, backgroundColor: Colors.border },

  // Common field
  fieldGroup: { gap: 6 },
  fieldLabel: {
    fontFamily: Fonts.mono,
    fontSize: 9,
    color: Colors.text2,
    letterSpacing: ls(9, LS.labelWide),
    textTransform: 'uppercase',
  },
  sheetFieldLabel: {
    fontFamily: Fonts.mono,
    fontSize: 12,
    color: Colors.text2,
    letterSpacing: ls(12, LS.labelNarrow),
    textTransform: 'uppercase',
    marginBottom: 4,
  },
  input: {
    fontFamily: Fonts.body,
    fontSize: 15,
    color: Colors.text1,
    backgroundColor: Colors.surface,
    borderRadius: 10,
    paddingVertical: 12,
    paddingHorizontal: Spacing.sm,
  },
  multiline: { minHeight: 64, textAlignVertical: 'top' },

  // iOS date picker
  pickerOverlay: { flex: 1, backgroundColor: 'rgba(0,0,0,0.7)', justifyContent: 'flex-end' },
  pickerContainer: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    padding: Spacing.md,
    paddingBottom: Spacing.xl,
    gap: Spacing.md,
  },

  // Create org flow
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
    color: Colors.text2,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },
  orgFields: { gap: Spacing.md, marginBottom: Spacing.lg },
  orgNote: {
    fontFamily: Fonts.mono,
    fontSize: 9,
    color: Colors.text2,
    textAlign: 'center',
    letterSpacing: ls(9, LS.labelWide),
    marginTop: Spacing.sm,
  },

  // Success
  successContent: { flexGrow: 1, padding: Spacing.md, gap: Spacing.xl, justifyContent: 'center', paddingBottom: 80 },
  successHeading: {
    fontFamily: Fonts.display,
    fontSize: 56,
    color: Colors.accent,
    letterSpacing: ls(56, LS.displayTight),
    lineHeight: 62,
  },
  successCard: {
    backgroundColor: Colors.surface2,
    borderRadius: 16,
    paddingHorizontal: Spacing.md,
  },
  successDivider: { height: 1, backgroundColor: Colors.border },
  successRow: { paddingVertical: Spacing.md, gap: 8 },
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
    color: Colors.text2,
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
    minHeight: 44,
  },
  successHash: { flex: 1, fontFamily: Fonts.mono, fontSize: 13, color: Colors.text2 },
  txLinkBtn: {
    width: 44,
    height: 44,
    borderRadius: 10,
    backgroundColor: Colors.surface2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  successActions: { gap: Spacing.md },

  // Unlock info sheet
  infoText: {
    fontFamily: Fonts.body,
    fontSize: 14,
    color: Colors.text2,
    lineHeight: 22,
    marginBottom: Spacing.md,
  },
  infoHighlight: {
    fontFamily: Fonts.bodyMedium,
    color: Colors.text1,
  },
  infoRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    backgroundColor: Colors.surface2,
    borderRadius: 10,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    marginTop: Spacing.xs,
  },
  infoCaption: {
    fontFamily: Fonts.mono,
    fontSize: 11,
    color: Colors.accent,
    letterSpacing: ls(11, LS.labelNarrow),
  },
})
