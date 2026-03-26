import { Stack } from 'expo-router'
import { Colors } from '@/constants/colors'

export default function ModalLayout() {
  return (
    <Stack
      screenOptions={{
        headerShown: false,
        contentStyle: { backgroundColor: Colors.bg },
        presentation: 'modal',
      }}
    />
  )
}
