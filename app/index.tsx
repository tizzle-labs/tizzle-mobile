import { useMyProfile } from '@/hooks/api/use-user-profile'
import { Redirect } from 'expo-router'
import { ActivityIndicator, View } from 'react-native'
import { Colors } from '@/constants/colors'

export default function Index() {
  const { data: profile, isLoading } = useMyProfile()

  if (isLoading) {
    return (
      <View style={{ flex: 1, backgroundColor: Colors.bg, alignItems: 'center', justifyContent: 'center' }}>
        <ActivityIndicator color={Colors.accent} />
      </View>
    )
  }

  if (!profile?.username) {
    return <Redirect href="/onboarding" />
  }

  return <Redirect href="/(tabs)/explore" />
}
