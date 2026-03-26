import { TouchableOpacity, Text, StyleSheet, ActivityIndicator, ViewStyle } from 'react-native'
import { Colors } from '@/constants/colors'
import { Fonts, LS, ls } from '@/constants/fonts'

type ButtonVariant = 'primary' | 'secondary' | 'ghost' | 'danger'

interface ButtonProps {
  onPress: () => void
  children: string
  variant?: ButtonVariant
  disabled?: boolean
  loading?: boolean
  style?: ViewStyle
  fullWidth?: boolean
}

export function Button({
  onPress,
  children,
  variant = 'primary',
  disabled,
  loading,
  style,
  fullWidth = true,
}: ButtonProps) {
  const isDisabled = disabled || loading
  return (
    <TouchableOpacity
      onPress={onPress}
      disabled={isDisabled}
      activeOpacity={0.8}
      style={[styles.base, styles[variant], isDisabled && styles.disabled, fullWidth && styles.fullWidth, style]}
    >
      {loading ? (
        <ActivityIndicator color={variant === 'primary' ? Colors.bg : Colors.text1} size="small" />
      ) : (
        <Text style={[styles.label, styles[`${variant}Label` as keyof typeof styles]]}>{children}</Text>
      )}
    </TouchableOpacity>
  )
}

const styles = StyleSheet.create({
  base: {
    paddingVertical: 14,
    paddingHorizontal: 28,
    borderRadius: 9999,
    alignItems: 'center',
    justifyContent: 'center',
    minHeight: 48,
  },
  fullWidth: { alignSelf: 'stretch' },
  primary: { backgroundColor: Colors.accent },
  secondary: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.2)',
  },
  ghost: { backgroundColor: 'transparent' },
  danger: {
    backgroundColor: 'transparent',
    borderWidth: 1,
    borderColor: 'rgba(255,59,48,0.3)',
  },
  disabled: { opacity: 0.4 },
  label: {
    fontFamily: Fonts.display,
    fontSize: 15,
    letterSpacing: ls(15, LS.displaySubtle),
  },
  primaryLabel: { color: Colors.bg },
  secondaryLabel: { color: Colors.text1 },
  ghostLabel: { color: Colors.text2 },
  dangerLabel: { color: Colors.error },
})
