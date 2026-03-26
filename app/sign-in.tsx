import { router } from 'expo-router'
import { useAuth } from '@/components/auth/auth-provider'
import { AppText } from '@/components/app-text'
import { AppView } from '@/components/app-view'
import { AppConfig } from '@/constants/app-config'
import { SafeAreaView } from 'react-native-safe-area-context'
import { View } from 'react-native'
import { Image } from 'expo-image'
import { Button } from '@react-navigation/elements'

export default function SignIn() {
  const { signIn } = useAuth()
  return (
    <AppView
      style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'stretch',
      }}
    >
      <SafeAreaView
        style={{
          flex: 1,
          justifyContent: 'space-between',
        }}
      >
        {/* Dummy view to push the next view to the center. */}
        <View />
        <View style={{ alignItems: 'center', gap: 16 }}>
          <AppText type="title">{AppConfig.name}</AppText>
          <Image source={require('../assets/images/icon.png')} style={{ width: 128, height: 128 }} />
        </View>
        <View style={{ marginBottom: 16 }}>
          <Button
            variant="filled"
            style={{ marginHorizontal: 16 }}
            onPress={async () => {
              try {
                await signIn()
                router.replace('/')
              } catch (e) {
                console.warn('Sign in failed:', e)
              }
            }}
          >
            Connect
          </Button>
        </View>
      </SafeAreaView>
    </AppView>
  )
}
