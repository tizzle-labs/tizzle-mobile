import { Colors } from '@/constants/colors'
import { Fonts } from '@/constants/fonts'
import { isCreateFormDirty, triggerCreateDiscard } from '@/lib/create-dirty-store'
import { Ionicons } from '@expo/vector-icons'
import * as Haptics from 'expo-haptics'
import { Tabs } from 'expo-router'
import { StyleSheet, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

export default function TabLayout() {
  const insets = useSafeAreaInsets()

  const handleTabPress = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light)
  }

  function guardedTabPress(e: any, destination: string) {
    handleTabPress()
    if (isCreateFormDirty()) {
      e.preventDefault()
      triggerCreateDiscard(destination)
    }
  }

  return (
    <>
    <View style={{ position: 'absolute', bottom: 0, left: 0, right: 0, height: insets.bottom, backgroundColor: Colors.surface2 }} />
    <Tabs
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          position: 'absolute',
          backgroundColor: 'transparent',
          borderTopWidth: 0,
          paddingBottom: (insets.bottom || 8) + 6,
          paddingTop: 8,
          height: 60 + (insets.bottom || 8) + 6,
        },
        tabBarBackground: () => <View style={[StyleSheet.absoluteFill, { backgroundColor: Colors.surface2 }]} />,
        tabBarActiveTintColor: Colors.accent,
        tabBarInactiveTintColor: Colors.text2,
        tabBarLabelStyle: {
          fontFamily: Fonts.bodyMedium,
          fontSize: 12,
          marginTop: 4,
        },
      }}
    >
      <Tabs.Screen
        name="explore"
        options={{
          title: 'Explore',
          tabBarIcon: ({ color }) => <Ionicons name="compass-outline" size={28} color={color} />,
        }}
        listeners={{ tabPress: (e) => guardedTabPress(e, '/(tabs)/explore') }}
      />
      <Tabs.Screen
        name="tickets/index"
        options={{
          title: 'Tickets',
          tabBarIcon: ({ color }) => <Ionicons name="ticket-outline" size={28} color={color} />,
        }}
        listeners={{ tabPress: (e) => guardedTabPress(e, '/(tabs)/tickets') }}
      />
      <Tabs.Screen
        name="create/index"
        options={{
          title: 'Create',
          tabBarIcon: ({ color }) => <Ionicons name="add-circle-outline" size={28} color={color} />,
        }}
        listeners={{ tabPress: handleTabPress }}
      />
      <Tabs.Screen name="tickets/[registrationPda]" options={{ href: null }} />
    </Tabs>
    </>
  )
}
