import { Button } from '@/components/ui/Button'
import { Colors } from '@/constants/colors'
import { Fonts, LS, ls } from '@/constants/fonts'
import { Spacing } from '@/constants/spacing'
import { useUpdateProfile } from '@/hooks/api/use-update-profile'
import { showErrorFeedback } from '@/lib/app-feedback'
import { router } from 'expo-router'
import { useState } from 'react'
import { StyleSheet, Text, TextInput, View } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'

export default function Onboarding() {
  const [name, setName] = useState('')
  const { mutateAsync: updateProfile, isPending: loading } = useUpdateProfile()

  async function handleContinue() {
    if (!name.trim()) {
      router.replace('/(tabs)/explore')
      return
    }
    try {
      await updateProfile({ name: name.trim() })
    } catch (e) {
      showErrorFeedback(e, 'Profile Update Failed', 'We could not save your display name.')
    }
    router.replace('/(tabs)/explore')
  }

  function handleSkip() {
    router.replace('/(tabs)/explore')
  }

  return (
    <View style={styles.container}>
      <SafeAreaView style={styles.inner}>
        <View style={styles.content}>
          <Text style={styles.heading}>WHAT SHOULD WE{'\n'}CALL YOU?</Text>
          <TextInput
            style={styles.input}
            placeholder="Display name"
            placeholderTextColor={Colors.text3}
            value={name}
            onChangeText={setName}
            autoFocus
            maxLength={30}
          />
        </View>
        <View style={styles.footer}>
          <Button onPress={handleContinue} loading={loading}>
            Continue
          </Button>
          <Button onPress={handleSkip} variant="ghost">
            Skip for now
          </Button>
        </View>
      </SafeAreaView>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  inner: {
    flex: 1,
    paddingHorizontal: Spacing.md,
    justifyContent: 'space-between',
    paddingTop: Spacing['2xl'],
  },
  content: { gap: Spacing.lg },
  heading: {
    fontFamily: Fonts.display,
    fontSize: 36,
    color: Colors.text1,
    letterSpacing: ls(36, LS.display),
    lineHeight: 44,
  },
  input: {
    fontFamily: Fonts.body,
    fontSize: 18,
    color: Colors.text1,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border2,
    paddingVertical: 12,
  },
  footer: { paddingBottom: Spacing.lg, gap: 8 },
})
