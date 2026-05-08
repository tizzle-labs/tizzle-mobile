import { Colors } from '@/constants/colors'
import { Stack } from 'expo-router'

export default function ExploreLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, contentStyle: { backgroundColor: Colors.bg } }}>
      <Stack.Screen name="index" />
      <Stack.Screen name="events" options={{ animation: 'none' }} />
    </Stack>
  )
}
