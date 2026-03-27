import { View, Text, StyleSheet } from 'react-native'
import { router } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useAuth } from '@/components/auth/auth-provider'
import { Button } from '@/components/ui/Button'
import { Colors } from '@/constants/colors'
import { Fonts, LS, ls } from '@/constants/fonts'
import { Spacing } from '@/constants/spacing'
import { getMyProfile } from '@/lib/api/users'
import { useState } from 'react'

export default function SignIn() {
  const { signIn } = useAuth()
  const [loading, setLoading] = useState(false)

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
    } catch (e) {
      console.error('Sign in failed', e)
    } finally {
      setLoading(false)
    }
  }

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.inner}>
        <View />
        <View style={styles.hero}>
          <Text style={styles.wordmark}>TIZZLE</Text>
          <Text style={styles.tagline}>On-chain event ticketing</Text>
        </View>
        <View style={styles.footer}>
          <Button onPress={handleConnect} loading={loading}>
            Connect Wallet
          </Button>
          <Text style={styles.note}>Powered by Solana</Text>
        </View>
      </SafeAreaView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  inner: { flex: 1, justifyContent: 'space-between', paddingHorizontal: Spacing.md },
  hero: { alignItems: 'center', gap: 12 },
  wordmark: {
    fontFamily: Fonts.display,
    fontSize: 72,
    color: Colors.text1,
    letterSpacing: ls(72, LS.display),
  },
  tagline: {
    fontFamily: Fonts.body,
    fontSize: 16,
    color: Colors.text2,
  },
  footer: { paddingBottom: Spacing.lg, gap: 12 },
  note: {
    fontFamily: Fonts.mono,
    fontSize: 10,
    color: Colors.text3,
    textAlign: 'center',
    textTransform: 'uppercase',
    letterSpacing: ls(10, LS.label),
  },
})
