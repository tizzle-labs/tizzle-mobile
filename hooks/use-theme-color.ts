import { Colors } from '@/constants/colors'
import { useColorScheme } from '@/hooks/use-color-scheme'

type ThemeColorName = 'background' | 'text' | 'border'

const colorMap: Record<ThemeColorName, keyof typeof Colors> = {
  background: 'bg',
  text: 'text1',
  border: 'border',
}

export function useThemeColor(props: { light?: string; dark?: string }, colorName: ThemeColorName) {
  const theme = useColorScheme() ?? 'dark'
  const colorFromProps = props[theme]

  if (colorFromProps) {
    return colorFromProps
  }

  return Colors[colorMap[colorName]]
}
