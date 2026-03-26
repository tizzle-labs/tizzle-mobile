import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  ActivityIndicator,
} from 'react-native'
import { router } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Colors } from '@/constants/colors'
import { Fonts } from '@/constants/fonts'
import { Spacing } from '@/constants/spacing'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { InfoGrid } from '@/components/ui/InfoGrid'
import { useAuth } from '@/components/auth/auth-provider'
import { useMyProfile } from '@/hooks/api/use-user-profile'
import { useMyRegistrations } from '@/hooks/api/use-my-registrations'

export default function ProfileModal() {
  const { walletAddress, signOut } = useAuth()
  const { data: profile, isLoading } = useMyProfile()
  const { data: registrations } = useMyRegistrations()

  async function handleSignOut() {
    await signOut()
    router.replace('/sign-in')
  }

  const statsRows = [
    { label: 'Tickets', value: String(registrations?.length ?? 0) },
    {
      label: 'Check-ins',
      value: String(registrations?.filter((r) => r.checkedIn).length ?? 0),
    },
  ]

  const profileRows = walletAddress
    ? [{ label: 'Wallet', value: walletAddress, mono: true }]
    : []

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.title}>PROFILE</Text>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.closeText}>✕</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={Colors.accent} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.nameSection}>
            <Text style={styles.displayName}>
              {profile?.name ?? profile?.username ?? 'Anonymous'}
            </Text>
          </View>

          <Card>
            <InfoGrid rows={profileRows} />
          </Card>

          <Card variant="nested">
            <Text style={styles.statsLabel}>STATS</Text>
            <InfoGrid rows={statsRows} />
          </Card>

          <Button onPress={handleSignOut} variant="secondary">
            Disconnect Wallet
          </Button>
        </ScrollView>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  title: {
    fontFamily: Fonts.display,
    fontSize: 22,
    color: Colors.text1,
    letterSpacing: -0.03,
  },
  closeText: {
    fontFamily: Fonts.mono,
    fontSize: 16,
    color: Colors.text2,
  },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scrollContent: { padding: Spacing.md, gap: Spacing.md },
  nameSection: { paddingVertical: Spacing.sm },
  displayName: {
    fontFamily: Fonts.display,
    fontSize: 36,
    color: Colors.text1,
    letterSpacing: -0.04,
  },
  statsLabel: {
    fontFamily: Fonts.mono,
    fontSize: 9,
    color: Colors.text3,
    letterSpacing: 0.12,
    textTransform: 'uppercase',
    marginBottom: 10,
  },
})
