import { Colors } from '@/constants/colors'
import { Spacing } from '@/constants/spacing'
import { Image } from 'expo-image'
import { StyleSheet, View } from 'react-native'

interface DividerProps {
  marginVertical?: number
}

export function Divider({ marginVertical = Spacing.lg }: DividerProps) {
  return (
    <View style={[styles.container, { marginVertical }]}>
      <View style={styles.line} />
      <Image source={require('@/assets/images/tizzle-logo-icon.png')} style={styles.logo} contentFit="contain" />
      <View style={styles.line} />
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: Spacing.md,
    gap: Spacing.sm,
  },
  line: {
    width: 20,
    height: 1,
    backgroundColor: Colors.border,
  },
  logo: {
    width: 32,
    height: 32,
    opacity: 0.25,
  },
})
