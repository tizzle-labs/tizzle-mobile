import { View, StyleSheet, ViewStyle } from 'react-native'
import { Colors } from '@/constants/colors'

interface CardProps {
  children: React.ReactNode
  style?: ViewStyle
  variant?: 'default' | 'nested'
}

export function Card({ children, style, variant = 'default' }: CardProps) {
  return <View style={[styles.base, variant === 'nested' && styles.nested, style]}>{children}</View>
}

const styles = StyleSheet.create({
  base: {
    backgroundColor: Colors.surface,
    borderRadius: 4,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: 16,
  },
  nested: {
    backgroundColor: Colors.surface2,
    borderColor: Colors.border2,
  },
})
