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
import { StyleSheet, Text, View } from 'react-native'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

const PHRASES = [
  'discover events.',
  'connect with people.',
  'get your tickets.',
  'experience more.',
]

function TypewriterText() {
  const [text, setText] = useState('')
  const [phraseIndex, setPhraseIndex] = useState(0)
  const [isDeleting, setIsDeleting] = useState(false)
  const [cursorVisible, setCursorVisible] = useState(true)

  useEffect(() => {
    const blink = setInterval(() => setCursorVisible((v) => !v), 500)
    return () => clearInterval(blink)
  }, [])

  useEffect(() => {
    const phrase = PHRASES[phraseIndex]
    if (!isDeleting && text === phrase) {
      const t = setTimeout(() => setIsDeleting(true), 1800)
      return () => clearTimeout(t)
    }
    const delay = isDeleting ? 40 : 75
    const t = setTimeout(() => {
      if (isDeleting) {
        setText((prev) => prev.slice(0, -1))
        if (text.length === 1) {
          setIsDeleting(false)
          setPhraseIndex((i) => (i + 1) % PHRASES.length)
        }
      } else {
        setText(phrase.slice(0, text.length + 1))
      }
    }, delay)
    return () => clearTimeout(t)
  }, [text, isDeleting, phraseIndex])

  return (
    <Text style={styles.typewriter}>
      {text}
      <Text style={[styles.cursor, { opacity: cursorVisible ? 1 : 0 }]}>|</Text>
    </Text>
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
        router.replace(profile.username?.trim() ? '/(tabs)/explore' : '/onboarding')
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
        source={require('../assets/images/onboarding-background.png')}
        style={styles.bgImage}
        contentFit="cover"
        contentPosition={{ top: '40%', left: '5%' }}
      />
      <View style={[styles.logoWrap, { paddingTop: insets.top + Spacing.xl }]}>
        <Image source={require('../assets/images/tizzle-logo.png')} style={styles.logo} contentFit="contain" />
      </View>

      <View style={styles.typewriterContainer} pointerEvents="none">
        <TypewriterText />
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
  container: { flex: 1, backgroundColor: '#000' },
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
  typewriterContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: '42%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  typewriter: {
    fontFamily: Fonts.display,
    fontSize: 26,
    color: Colors.text1,
    letterSpacing: ls(26, LS.displayTight),
    textAlign: 'center',
  },
  cursor: { color: Colors.accent },
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
