import { Colors } from '@/constants/colors'
import { useEffect, useRef } from 'react'
import { Animated, View } from 'react-native'

function usePulse() {
  const opacity = useRef(new Animated.Value(0.25)).current
  useEffect(() => {
    Animated.loop(
      Animated.sequence([
        Animated.timing(opacity, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(opacity, { toValue: 0.25, duration: 900, useNativeDriver: true }),
      ]),
    ).start()
  }, [opacity])
  return opacity
}

export function PulsingIcon({ size = 48 }: { size?: number }) {
  const opacity = usePulse()
  return (
    <Animated.Image
      source={require('../../assets/images/tizzle-logo-icon.png')}
      style={{ width: size, height: size, opacity }}
      resizeMode="contain"
    />
  )
}

export function LoadingScreen() {
  return (
    <View style={{ flex: 1, backgroundColor: Colors.bg, alignItems: 'center', justifyContent: 'center' }}>
      <PulsingIcon size={64} />
    </View>
  )
}
