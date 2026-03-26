import { View, Text, StyleSheet, TouchableOpacity } from 'react-native'
import { useLocalSearchParams, router } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Colors } from '@/constants/colors'
import { Fonts } from '@/constants/fonts'
import { Spacing } from '@/constants/spacing'

export default function ScanResult() {
  const { status, registrationPda, checkedInAt } = useLocalSearchParams<{
    status: 'valid' | 'used' | 'error'
    registrationPda: string
    checkedInAt?: string
  }>()

  const isValid = status === 'valid'
  const isUsed = status === 'used'
  const bgColor = isValid ? Colors.accent : isUsed ? Colors.error : Colors.warning
  const textColor = isValid ? Colors.bg : Colors.text1

  return (
    <TouchableOpacity
      style={[styles.container, { backgroundColor: bgColor }]}
      onPress={() => router.back()}
      activeOpacity={1}
    >
      <SafeAreaView style={styles.inner}>
        <View style={styles.content}>
          <Text style={[styles.icon, { color: textColor }]}>{isValid ? '✓' : '✗'}</Text>
          <Text style={[styles.heading, { color: textColor }]}>
            {isValid ? 'CHECK-IN CONFIRMED' : isUsed ? 'ALREADY USED' : 'VERIFICATION FAILED'}
          </Text>

          {registrationPda && (
            <Text style={[styles.pda, { color: isValid ? Colors.bg : Colors.text2 }]} numberOfLines={2}>
              {registrationPda}
            </Text>
          )}

          {checkedInAt && (
            <Text style={[styles.timestamp, { color: isValid ? Colors.bg : Colors.text2 }]}>
              {new Date(checkedInAt).toLocaleTimeString('en-US', {
                hour: '2-digit',
                minute: '2-digit',
                second: '2-digit',
              })}
            </Text>
          )}

          {isUsed && (
            <View style={styles.usedBadge}>
              <Text style={styles.usedBadgeText}>USED</Text>
            </View>
          )}
        </View>

        <Text style={[styles.dismiss, { color: isValid ? Colors.bg : Colors.text2 }]}>Tap to scan next</Text>
      </SafeAreaView>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  inner: { flex: 1, padding: Spacing.xl, justifyContent: 'space-between' },
  content: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.md },
  icon: {
    fontFamily: Fonts.display,
    fontSize: 96,
    lineHeight: 100,
  },
  heading: {
    fontFamily: Fonts.display,
    fontSize: 28,
    letterSpacing: -0.04,
    textAlign: 'center',
    lineHeight: 34,
  },
  pda: {
    fontFamily: Fonts.mono,
    fontSize: 11,
    textAlign: 'center',
    maxWidth: 280,
  },
  timestamp: {
    fontFamily: Fonts.mono,
    fontSize: 20,
    letterSpacing: 0.08,
  },
  usedBadge: {
    backgroundColor: 'rgba(0,0,0,0.2)',
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: 2,
  },
  usedBadgeText: {
    fontFamily: Fonts.mono,
    fontSize: 12,
    color: Colors.text1,
    letterSpacing: 0.12,
    textTransform: 'uppercase',
  },
  dismiss: {
    fontFamily: Fonts.body,
    fontSize: 13,
    textAlign: 'center',
  },
})
