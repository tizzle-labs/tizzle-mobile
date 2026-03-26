import { View, Text, StyleSheet } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { Colors } from '@/constants/colors'
import { Fonts, LS, ls } from '@/constants/fonts'
import { Spacing } from '@/constants/spacing'

interface ScreenHeaderProps {
  title: string
  right?: React.ReactNode
}

export function ScreenHeader({ title, right }: ScreenHeaderProps) {
  return (
    <SafeAreaView edges={['top']} style={styles.safe}>
      <View style={styles.container}>
        <Text style={styles.title}>{title}</Text>
        {right && <View>{right}</View>}
      </View>
    </SafeAreaView>
  )
}

const styles = StyleSheet.create({
  safe: { backgroundColor: Colors.bg },
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    paddingBottom: Spacing.sm,
  },
  title: {
    fontFamily: Fonts.display,
    fontSize: 28,
    color: Colors.text1,
    letterSpacing: ls(28, LS.display),
  },
})
