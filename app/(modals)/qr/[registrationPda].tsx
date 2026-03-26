import { View, Text, StyleSheet, Animated, TouchableOpacity } from 'react-native'
import { useRef, useEffect } from 'react'
import { useLocalSearchParams, router } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import QRCode from 'react-qr-code'
import { Colors } from '@/constants/colors'
import { Fonts } from '@/constants/fonts'
import { Spacing } from '@/constants/spacing'

export default function QRModal() {
  const { registrationPda } = useLocalSearchParams<{ registrationPda: string }>()
  const scanY = useRef(new Animated.Value(0)).current

  useEffect(() => {
    const anim = Animated.loop(
      Animated.sequence([
        Animated.timing(scanY, { toValue: 1, duration: 2000, useNativeDriver: true }),
        Animated.timing(scanY, { toValue: 0, duration: 2000, useNativeDriver: true }),
      ])
    )
    anim.start()
    return () => anim.stop()
  }, [scanY])

  const translateY = scanY.interpolate({
    inputRange: [0, 1],
    outputRange: [0, 200],
  })

  return (
    <TouchableOpacity style={styles.container} onPress={() => router.back()} activeOpacity={1}>
      <SafeAreaView style={styles.inner}>
        <Text style={styles.label}>SCAN TO CHECK IN</Text>
        <View style={styles.qrWrapper}>
          <View style={styles.qrBackground}>
            <QRCode value={registrationPda} size={220} />
          </View>
          <Animated.View
            pointerEvents="none"
            style={[styles.scanLine, { transform: [{ translateY }] }]}
          />
        </View>
        <Text style={styles.pda} numberOfLines={1} ellipsizeMode="middle">
          {registrationPda}
        </Text>
        <Text style={styles.dismiss}>Tap to dismiss</Text>
      </SafeAreaView>
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg, alignItems: 'center', justifyContent: 'center' },
  inner: { alignItems: 'center', gap: Spacing.lg, paddingHorizontal: Spacing.xl },
  label: {
    fontFamily: Fonts.mono, fontSize: 10, color: Colors.accent,
    letterSpacing: 0.12, textTransform: 'uppercase',
  },
  qrWrapper: {
    position: 'relative', width: 240, height: 240,
    alignItems: 'center', justifyContent: 'center', overflow: 'hidden',
  },
  qrBackground: {
    backgroundColor: Colors.text1, padding: 10, borderRadius: 4,
  },
  scanLine: {
    position: 'absolute', left: 0, right: 0, height: 2,
    backgroundColor: Colors.accent,
    shadowColor: Colors.accent,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.9, shadowRadius: 8, elevation: 8,
  },
  pda: { fontFamily: Fonts.mono, fontSize: 11, color: Colors.text3, maxWidth: 280 },
  dismiss: { fontFamily: Fonts.body, fontSize: 13, color: Colors.text3 },
})
