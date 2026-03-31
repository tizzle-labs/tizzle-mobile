import { useAuth } from '@/components/auth/auth-provider'
import { Button } from '@/components/ui/Button'
import { Colors } from '@/constants/colors'
import { Fonts, LS, ls } from '@/constants/fonts'
import { Spacing } from '@/constants/spacing'
import { getMyProfile } from '@/lib/api/users'
import { showErrorFeedback } from '@/lib/app-feedback'
import BottomSheet, { BottomSheetView } from '@gorhom/bottom-sheet'
import { Image } from 'expo-image'
import { router } from 'expo-router'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { ScrollView, StyleSheet, Text, View } from 'react-native'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

const CARD_WIDTH = 160
const CARD_HEIGHT = 90
const CARD_GAP = 12

const CARDS_TOP = [
  { id: '1', label: 'BEACH PARTY', sublabel: 'DJ SET & LIGHT SHOW', bg: '#1a3a5c', accent: '#e8c547' },
  { id: '2', label: 'SUMMER25', sublabel: 'OPEN AIR FESTIVAL', bg: '#c0392b', accent: '#f39c12' },
  { id: '3', label: "LET'S RUN", sublabel: 'MORNING 5K', bg: '#1a5c2a', accent: '#caff00' },
  { id: '4', label: 'TECH TALK', sublabel: 'BUILDER MEETUP', bg: '#2c1a5c', accent: '#9945FF' },
  { id: '5', label: 'NIGHT MKT', sublabel: 'FOOD & CULTURE', bg: '#5c3a1a', accent: '#ff6b35' },
  { id: '6', label: 'HACKATHON', sublabel: '48H BUILD', bg: '#1a4a5c', accent: '#caff00' },
]

const CARDS_BOTTOM = [
  { id: '7', label: 'JAZZ NIGHT', sublabel: 'LIVE PERFORMANCE', bg: '#3a1a5c', accent: '#ff9ff3' },
  { id: '8', label: 'CRYPTO CON', sublabel: 'WEB3 SUMMIT', bg: '#1a5c4a', accent: '#00d2d3' },
  { id: '9', label: 'ART FAIR', sublabel: 'NFT GALLERY', bg: '#5c1a1a', accent: '#ffd32a' },
  { id: '10', label: 'MARATHON', sublabel: 'CITY RUN 10K', bg: '#1a2a5c', accent: '#ff6b6b' },
  { id: '11', label: 'FOOD FEST', sublabel: 'STREET EATS', bg: '#4a3a1a', accent: '#7bed9f' },
  { id: '12', label: 'GAME JAM', sublabel: '72H CHALLENGE', bg: '#1a4a3a', accent: '#eccc68' },
]

function EventCard({ label, sublabel, bg, accent }: (typeof CARDS_TOP)[0]) {
  return (
    <View style={[styles.card, { backgroundColor: bg }]}>
      <View style={[styles.cardAccentBar, { backgroundColor: accent }]} />
      <Text style={styles.cardSublabel}>{sublabel}</Text>
      <Text style={[styles.cardLabel, { color: accent }]}>{label}</Text>
    </View>
  )
}

function CardStrip({ reverse = false, cards }: { reverse?: boolean; cards: typeof CARDS_TOP }) {
  const scrollRef = useRef<ScrollView>(null)
  const positionRef = useRef(0)
  const totalWidth = cards.length * (CARD_WIDTH + CARD_GAP)

  // Start at middle copy so we can loop in both directions without glitch
  useEffect(() => {
    positionRef.current = totalWidth
    scrollRef.current?.scrollTo({ x: totalWidth, animated: false })
  }, [totalWidth])

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>
    const step = () => {
      if (reverse) {
        positionRef.current -= 0.4
        // reset to middle copy when reaching start of middle copy
        if (positionRef.current <= 0) positionRef.current = totalWidth
      } else {
        positionRef.current += 0.4
        // reset to middle copy when reaching end of middle copy
        if (positionRef.current >= totalWidth * 2) positionRef.current = totalWidth
      }
      scrollRef.current?.scrollTo({ x: positionRef.current, animated: false })
      timer = setTimeout(step, 16)
    }
    timer = setTimeout(step, 16)
    return () => clearTimeout(timer)
  }, [totalWidth, reverse])

  // 5 copies so middle copy always has neighbours on both sides
  const loopedCards = [...cards, ...cards, ...cards, ...cards, ...cards]

  return (
    <ScrollView
      ref={scrollRef}
      horizontal
      scrollEnabled={false}
      showsHorizontalScrollIndicator={false}
      contentContainerStyle={styles.stripContent}
    >
      {loopedCards.map((card, i) => (
        <EventCard key={`${card.id}-${i}`} {...card} />
      ))}
    </ScrollView>
  )
}

export default function SignIn() {
  const { signIn } = useAuth()
  const [loading, setLoading] = useState(false)
  const insets = useSafeAreaInsets()
  const bottomSheetRef = useRef<BottomSheet>(null)
  const snapPoints = useMemo(() => ['42%'], [])

  const handleSheetChange = useCallback((index: number) => {
    if (index === -1) bottomSheetRef.current?.snapToIndex(0)
  }, [])

  async function handleConnect() {
    setLoading(true)
    try {
      await signIn()
      try {
        const profile = await getMyProfile()
        router.replace(profile.name?.trim() ? '/(tabs)/explore' : '/onboarding')
      } catch {
        router.replace('/onboarding')
      }
    } catch (e: any) {
      const errorMessage = String(e?.message ?? '').toLowerCase()
      if (
        errorMessage.includes('reject') ||
        errorMessage.includes('cancel') ||
        errorMessage.includes('declin') ||
        errorMessage.includes('dismiss')
      ) {
        return
      }
      showErrorFeedback(e, 'Sign-In Failed', 'We could not verify your wallet right now.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <GestureHandlerRootView style={styles.container}>
      <Image
        source={require('../assets/images/sign-in-background.jpg')}
        style={styles.bgImage}
        contentFit="contain"
        contentPosition={{ top: '30%', left: '50%' }}
      />
      <View style={styles.cardsArea}>
        <Image source={require('../assets/images/tizzle-logo.png')} style={styles.logo} contentFit="contain" />
        <CardStrip cards={CARDS_TOP} />
        <CardStrip reverse cards={CARDS_BOTTOM} />
      </View>

      <BottomSheet
        ref={bottomSheetRef}
        index={0}
        snapPoints={snapPoints}
        onChange={handleSheetChange}
        enablePanDownToClose={false}
        enableDynamicSizing={false}
        enableOverDrag={false}
        animateOnMount={false}
        backgroundStyle={styles.sheetBg}
        handleIndicatorStyle={styles.handle}
        topInset={insets.top}
        maxDynamicContentSize={0}
      >
        <BottomSheetView style={[styles.sheetContent, { paddingBottom: insets.bottom + Spacing.lg }]}>
          <View style={styles.headline}>
            <Text style={styles.headlineMain}>Onchain events.</Text>
            <Text style={styles.headlineAccent}>Real attendance.</Text>
          </View>

          <Text style={styles.subtitle}>
            Discover events, collect proof of attendance, and build your onchain reputation.
          </Text>

          <View style={styles.footer}>
            <Button onPress={handleConnect} loading={loading}>
              Connect Wallet
            </Button>
            <Text style={styles.note}>Powered by Solana</Text>
          </View>
        </BottomSheetView>
      </BottomSheet>
    </GestureHandlerRootView>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  bgImage: {
    ...StyleSheet.absoluteFillObject,
    width: '100%',
    height: '100%',
  },
  cardsArea: { overflow: 'hidden', paddingTop: 60, alignItems: 'center', gap: CARD_GAP },
  logo: {
    width: 240,
    height: 80,
  },
  stripContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    paddingHorizontal: Spacing.md,
    gap: CARD_GAP,
  },
  card: {
    width: CARD_WIDTH,
    height: CARD_HEIGHT,
    borderRadius: 0,
    padding: 12,
    marginHorizontal: 4,
    justifyContent: 'flex-end',
    overflow: 'hidden',
    // 3D effect
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
    borderTopLeftRadius: 0,
    borderTopRightRadius: 0,
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
  sheetBg: {
    backgroundColor: Colors.surface,
    borderTopLeftRadius: 28,
    borderTopRightRadius: 28,
  },
  handle: {
    backgroundColor: Colors.border2,
    width: 36,
    height: 4,
  },
  sheetContent: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    gap: Spacing.md,
  },
  headline: { gap: 2 },
  headlineMain: {
    fontFamily: Fonts.display,
    fontSize: 36,
    color: Colors.text1,
    letterSpacing: ls(36, LS.displayTight),
    lineHeight: 42,
  },
  headlineAccent: {
    fontFamily: Fonts.display,
    fontSize: 36,
    color: Colors.accent,
    letterSpacing: ls(36, LS.displayTight),
    lineHeight: 42,
  },
  subtitle: {
    fontFamily: Fonts.body,
    fontSize: 14,
    color: Colors.text2,
    lineHeight: 20,
  },
  footer: { gap: 12, marginTop: Spacing.sm },
  note: {
    fontFamily: Fonts.mono,
    fontSize: 10,
    color: Colors.text3,
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: ls(10, LS.label),
  },
})
