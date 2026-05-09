import { Button } from '@/components/ui/Button'
import { Colors } from '@/constants/colors'
import { EVENT_CATEGORIES } from '@/constants/event-categories'
import { Fonts, LS, ls } from '@/constants/fonts'
import { Spacing } from '@/constants/spacing'
import { useUpdateProfile } from '@/hooks/api/use-update-profile'
import { checkUsernameAvailable } from '@/lib/api/users'
import { showErrorFeedback } from '@/lib/app-feedback'
import { Ionicons } from '@expo/vector-icons'
import BottomSheet, { BottomSheetScrollView, BottomSheetTextInput } from '@gorhom/bottom-sheet'
import { Image } from 'expo-image'
import { router } from 'expo-router'
import { useEffect, useMemo, useRef, useState } from 'react'
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import Animated, { FadeIn, FadeOut } from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

// ─── Moving cards ─────────────────────────────────────────────────────────────

const CARD_WIDTH = 160
const CARD_HEIGHT = 90
const CARD_GAP = 12

const CARDS_A = [
  { id: '1', label: 'TECH TALK', sublabel: 'BUILDER MEETUP', bg: '#2c1a5c', accent: '#9945FF' },
  { id: '2', label: 'JAZZ NIGHT', sublabel: 'LIVE PERFORMANCE', bg: '#3a1a5c', accent: '#ff9ff3' },
  { id: '3', label: 'BEACH PARTY', sublabel: 'DJ SET & LIGHT SHOW', bg: '#1a3a5c', accent: '#e8c547' },
  { id: '4', label: 'HACKATHON', sublabel: '48H BUILD', bg: '#1a4a5c', accent: '#caff00' },
  { id: '5', label: 'ART FAIR', sublabel: 'NFT GALLERY', bg: '#5c1a1a', accent: '#ffd32a' },
  { id: '6', label: 'FOOD FEST', sublabel: 'STREET EATS', bg: '#4a3a1a', accent: '#7bed9f' },
]

const CARDS_B = [
  { id: '7', label: 'CRYPTO CON', sublabel: 'WEB3 SUMMIT', bg: '#1a5c4a', accent: '#00d2d3' },
  { id: '8', label: 'MARATHON', sublabel: 'CITY RUN 10K', bg: '#1a2a5c', accent: '#ff6b6b' },
  { id: '9', label: 'SUMMER25', sublabel: 'OPEN AIR FESTIVAL', bg: '#c0392b', accent: '#f39c12' },
  { id: '10', label: 'GAME JAM', sublabel: '72H CHALLENGE', bg: '#1a4a3a', accent: '#eccc68' },
  { id: '11', label: "LET'S RUN", sublabel: 'MORNING 5K', bg: '#1a5c2a', accent: '#caff00' },
  { id: '12', label: 'NIGHT MKT', sublabel: 'FOOD & CULTURE', bg: '#5c3a1a', accent: '#ff6b35' },
]

function EventCard({ label, sublabel, bg, accent }: (typeof CARDS_A)[0]) {
  return (
    <View style={[cs.card, { backgroundColor: bg }]}>
      <View style={[cs.cardAccentBar, { backgroundColor: accent }]} />
      <Text style={cs.cardSublabel}>{sublabel}</Text>
      <Text style={[cs.cardLabel, { color: accent }]}>{label}</Text>
    </View>
  )
}

function CardStrip({ reverse = false, cards }: { reverse?: boolean; cards: typeof CARDS_A }) {
  const scrollRef = useRef<ScrollView>(null)
  const positionRef = useRef(0)
  const totalWidth = cards.length * (CARD_WIDTH + CARD_GAP)

  useEffect(() => {
    positionRef.current = totalWidth
    scrollRef.current?.scrollTo({ x: totalWidth, animated: false })
  }, [totalWidth])

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>
    const step = () => {
      if (reverse) {
        positionRef.current -= 0.4
        if (positionRef.current <= 0) positionRef.current = totalWidth
      } else {
        positionRef.current += 0.4
        if (positionRef.current >= totalWidth * 2) positionRef.current = totalWidth
      }
      scrollRef.current?.scrollTo({ x: positionRef.current, animated: false })
      timer = setTimeout(step, 16)
    }
    timer = setTimeout(step, 16)
    return () => clearTimeout(timer)
  }, [totalWidth, reverse])

  const looped = [...cards, ...cards, ...cards, ...cards, ...cards]

  return (
    <ScrollView
      ref={scrollRef}
      horizontal
      scrollEnabled={false}
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={cs.stripContent}
    >
      {looped.map((card, i) => (
        <EventCard key={`${card.id}-${i}`} {...card} />
      ))}
    </ScrollView>
  )
}

// ─── Username step ────────────────────────────────────────────────────────────

type UsernameStatus = 'idle' | 'checking' | 'available' | 'taken'

function UsernameStep({
  username,
  onChangeUsername,
  usernameStatus,
  onNext,
}: {
  username: string
  onChangeUsername: (v: string) => void
  usernameStatus: UsernameStatus
  onNext: () => void
}) {
  const canNext = username.trim().length >= 3 && usernameStatus === 'available'

  return (
    <Animated.View entering={FadeIn.duration(220)} exiting={FadeOut.duration(150)} style={s.stepWrap}>
      <View style={s.stepHeader}>
        <Text style={s.stepTitle}>Pick a username.</Text>
        <Text style={s.stepSubtitle}>This is how others will find you on Tizzle.</Text>
      </View>

      <View style={s.inputWrap}>
        <View style={s.inputRow}>
          <Text style={s.inputPrefix}>@</Text>
          <BottomSheetTextInput
            style={s.input}
            placeholder="your-handle"
            placeholderTextColor={Colors.text3}
            autoCapitalize="none"
            autoCorrect={false}
            autoFocus
            value={username}
            onChangeText={onChangeUsername}
            maxLength={24}
          />
          <View style={s.inputStatus}>
            {usernameStatus === 'checking' && <ActivityIndicator size="small" color={Colors.text3} />}
            {usernameStatus === 'available' && <Ionicons name="checkmark-circle" size={20} color="#22C55E" />}
            {usernameStatus === 'taken' && <Ionicons name="close-circle" size={20} color={Colors.error} />}
          </View>
        </View>
        <View style={s.inputUnderline} />
        {usernameStatus === 'taken' && <Text style={s.inputError}>Username already taken</Text>}
        {username.trim().length > 0 && username.trim().length < 3 && (
          <Text style={s.inputError}>At least 3 characters required</Text>
        )}
        {usernameStatus === 'available' && <Text style={s.inputOk}>Username is available ✓</Text>}
      </View>

      <Button onPress={onNext} disabled={!canNext}>
        Continue
      </Button>
    </Animated.View>
  )
}

// ─── Interests step ───────────────────────────────────────────────────────────

function InterestsStep({
  selected,
  onToggle,
  onFinish,
  loading,
}: {
  selected: string[]
  onToggle: (label: string) => void
  onFinish: () => void
  loading: boolean
}) {
  const canFinish = selected.length >= 2

  return (
    <Animated.View entering={FadeIn.duration(220)} style={s.stepWrap}>
      <View style={s.stepHeader}>
        <Text style={s.stepTitle}>What are you{'\n'}into?</Text>
        <Text style={s.stepSubtitle}>Pick at least 2 to personalize your feed.</Text>
      </View>

      <View style={s.categoryGrid}>
        {EVENT_CATEGORIES.map((cat) => {
          const active = selected.includes(cat.label)
          return (
            <TouchableOpacity
              key={cat.label}
              style={[s.categoryChip, active && s.categoryChipActive]}
              onPress={() => onToggle(cat.label)}
              activeOpacity={0.75}
            >
              <Text style={s.categoryIcon}>{cat.icon}</Text>
              <Text style={[s.categoryLabel, active && s.categoryLabelActive]}>{cat.label}</Text>
            </TouchableOpacity>
          )
        })}
      </View>

      <View style={s.selectedCount}>
        <Text style={s.selectedCountText}>
          {selected.length < 2 ? `Select ${2 - selected.length} more` : `${selected.length} selected`}
        </Text>
      </View>

      <Button onPress={onFinish} disabled={!canFinish} loading={loading}>
        Let&apos;s go
      </Button>
    </Animated.View>
  )
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function Onboarding() {
  const insets = useSafeAreaInsets()
  const { mutateAsync: updateProfile, isPending: saving } = useUpdateProfile()
  const bottomSheetRef = useRef<BottomSheet>(null)

  const [step, setStep] = useState<1 | 2>(1)
  const [username, setUsername] = useState('')
  const [usernameStatus, setUsernameStatus] = useState<UsernameStatus>('idle')
  const [selected, setSelected] = useState<string[]>([])
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const snapPoints = useMemo(() => (step === 1 ? ['52%'] : ['78%']), [step])

  useEffect(() => {
    bottomSheetRef.current?.snapToIndex(0)
  }, [step])

  function handleUsernameChange(value: string) {
    const stripped = value.replace(/\s/g, '')
    setUsername(stripped)
    if (debounceRef.current) clearTimeout(debounceRef.current)
    const trimmed = stripped.trim()
    if (!trimmed || trimmed.length < 3) {
      setUsernameStatus('idle')
      return
    }
    setUsernameStatus('checking')
    debounceRef.current = setTimeout(async () => {
      try {
        const available = await checkUsernameAvailable(trimmed)
        setUsernameStatus(available ? 'available' : 'taken')
      } catch {
        setUsernameStatus('idle')
      }
    }, 500)
  }

  function toggleCategory(label: string) {
    setSelected((prev) => (prev.includes(label) ? prev.filter((c) => c !== label) : [...prev, label]))
  }

  async function handleFinish() {
    try {
      await updateProfile({ username: username.trim(), interests: selected })
      router.replace('/(tabs)/explore')
    } catch (e) {
      showErrorFeedback(e, 'Setup Failed', 'Could not save your profile. Please try again.')
    }
  }

  return (
    <GestureHandlerRootView style={s.container}>
      <View style={s.bg}>
        <Image
          source={require('../assets/images/onboarding-background.png')}
          style={s.bgImage}
          contentFit="cover"
          contentPosition={{ top: '40%', left: '5%' }}
        />
        {/* Logo */}
        <View style={[s.logoWrap, { paddingTop: insets.top + Spacing.xl }]}>
          <Image source={require('../assets/images/tizzle-logo.png')} style={s.logo} contentFit="contain" />
        </View>

        {/* Moving cards */}
        <View style={s.cardsArea} pointerEvents="none">
          <CardStrip cards={CARDS_A} />
          <CardStrip reverse cards={CARDS_B} />
        </View>

        <BottomSheet
          ref={bottomSheetRef}
          index={0}
          snapPoints={snapPoints}
          enablePanDownToClose={false}
          enableDynamicSizing={false}
          enableOverDrag={false}
          keyboardBehavior="extend"
          keyboardBlurBehavior="restore"
          animateOnMount
          backgroundStyle={s.sheetBg}
          handleIndicatorStyle={s.handle}
          topInset={insets.top}
        >
          <BottomSheetScrollView
            contentContainerStyle={[s.sheetContent, { paddingBottom: insets.bottom + Spacing.xl }]}
            keyboardShouldPersistTaps="handled"
            showsVerticalScrollIndicator={false}
          >
            {/* Step dots */}
            <View style={s.dots}>
              <View style={[s.dot, step === 1 && s.dotActive]} />
              <View style={[s.dot, step === 2 && s.dotActive]} />
            </View>

            {step === 1 ? (
              <UsernameStep
                username={username}
                onChangeUsername={handleUsernameChange}
                usernameStatus={usernameStatus}
                onNext={() => setStep(2)}
              />
            ) : (
              <InterestsStep selected={selected} onToggle={toggleCategory} onFinish={handleFinish} loading={saving} />
            )}
          </BottomSheetScrollView>
        </BottomSheet>
      </View>
    </GestureHandlerRootView>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  bg: { flex: 1 },
  bgImage: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    transform: [{ translateY: -20 }, { scale: 1 }],
  },

  logoWrap: { alignItems: 'center' },
  logo: { width: 200, height: 68 },
  cardsArea: {
    position: 'absolute',
    left: 0,
    right: 0,
    bottom: '55%',
    gap: CARD_GAP,
    overflow: 'hidden',
  },

  sheetBg: { backgroundColor: Colors.surface, borderTopLeftRadius: 28, borderTopRightRadius: 28 },
  handle: { backgroundColor: Colors.border2, width: 36, height: 4 },
  sheetContent: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.sm, gap: Spacing.lg },

  dots: { flexDirection: 'row', gap: 6, justifyContent: 'center', marginBottom: Spacing.xs },
  dot: { width: 6, height: 6, borderRadius: 3, backgroundColor: Colors.border2 },
  dotActive: { width: 20, backgroundColor: Colors.accent },

  stepWrap: { gap: Spacing.lg },
  stepHeader: { gap: 6 },
  stepTitle: {
    fontFamily: Fonts.display,
    fontSize: 32,
    color: Colors.text1,
    letterSpacing: ls(32, LS.displayTight),
    lineHeight: 38,
  },
  stepSubtitle: { fontFamily: Fonts.body, fontSize: 14, color: Colors.text2, lineHeight: 20 },

  inputWrap: { gap: 8 },
  inputRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  inputPrefix: {
    fontFamily: Fonts.display,
    fontSize: 24,
    color: Colors.text3,
    letterSpacing: ls(24, LS.displayTight),
  },
  input: {
    flex: 1,
    fontFamily: Fonts.display,
    fontSize: 24,
    color: Colors.text1,
    letterSpacing: ls(24, LS.displayTight),
    paddingVertical: 8,
  },
  inputStatus: { width: 24, alignItems: 'center' },
  inputUnderline: { height: 1, backgroundColor: Colors.border2 },
  inputError: { fontFamily: Fonts.mono, fontSize: 11, color: Colors.error },
  inputOk: { fontFamily: Fonts.mono, fontSize: 11, color: '#22C55E' },

  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 99,
    backgroundColor: Colors.surface2,
  },
  categoryChipActive: { backgroundColor: Colors.accent },
  categoryIcon: { fontSize: 16 },
  categoryLabel: { fontFamily: Fonts.bodyMedium, fontSize: 13, color: Colors.text2 },
  categoryLabelActive: { color: Colors.bg },

  selectedCount: { alignItems: 'center' },
  selectedCountText: { fontFamily: Fonts.mono, fontSize: 11, color: Colors.text3, letterSpacing: ls(11, LS.labelWide) },
})

const cs = StyleSheet.create({
  card: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: 14,
    padding: 12,
    marginHorizontal: 4,
    justifyContent: 'flex-end',
    overflow: 'hidden',
    borderRightWidth: 4,
    borderBottomWidth: 4,
    borderRightColor: 'rgba(0,0,0,0.4)',
    borderBottomColor: 'rgba(0,0,0,0.4)',
    borderTopWidth: 1,
    borderLeftWidth: 1,
    borderTopColor: 'rgba(255,255,255,0.15)',
    borderLeftColor: 'rgba(255,255,255,0.15)',
  },
  cardAccentBar: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: 4,
    borderTopLeftRadius: 14,
    borderTopRightRadius: 14,
  },
  cardSublabel: {
    fontFamily: Fonts.mono,
    fontSize: 8,
    color: 'rgba(255,255,255,0.6)',
    textTransform: 'uppercase',
    letterSpacing: ls(8, LS.label),
    marginBottom: 4,
  },
  cardLabel: {
    fontFamily: Fonts.display,
    fontSize: 16,
    letterSpacing: ls(16, LS.display),
  },
  stripContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: Spacing.md,
    gap: CARD_GAP,
  },
})
