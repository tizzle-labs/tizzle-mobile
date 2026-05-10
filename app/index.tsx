import { LoadingScreen } from '@/components/ui/LoadingScreen'
import { useMyProfile } from '@/hooks/api/use-user-profile'
import { Redirect } from 'expo-router'

export default function Index() {
  const { data: profile, isLoading } = useMyProfile()

  if (isLoading) {
    return <LoadingScreen />
  }

  if (!profile?.username) {
    return <Redirect href="/onboarding" />
  }

  return <Redirect href="/(tabs)/explore" />
}
