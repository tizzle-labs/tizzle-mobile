import { useAuth } from '@/components/auth/auth-provider'
import { Colors } from '@/constants/colors'
import { Fonts, LS, ls } from '@/constants/fonts'
import { Spacing } from '@/constants/spacing'
import { Ionicons } from '@expo/vector-icons'
import { router } from 'expo-router'
import { StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

export default function WalletScreen() {
  const insets = useSafeAreaInsets()
  const { walletAddress } = useAuth()

  return (
    <View style={[s.container, { paddingTop: insets.top + Spacing.sm }]}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn} hitSlop={12}>
          <Ionicons name="arrow-back" size={20} color={Colors.text1} />
        </TouchableOpacity>
        <Text style={s.title}>Wallet & Tokens</Text>
        <View style={{ width: 38 }} />
      </View>
      <View style={s.body}>
        <Ionicons name="wallet-outline" size={48} color={Colors.text3} />
        <Text style={s.addr}>{walletAddress ? `${walletAddress.slice(0, 8)}…${walletAddress.slice(-8)}` : '—'}</Text>
        <Text style={s.emptyTitle}>Token Balances</Text>
        {/* TODO: Fetch and display SOL + SPL token balances from wallet */}
        <Text style={s.emptyBody}>SOL and SPL token balances will appear here.</Text>
      </View>
    </View>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.surface2,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border2,
  },
  title: { fontFamily: Fonts.display, fontSize: 18, color: Colors.text1, letterSpacing: ls(18, LS.displaySubtle) },
  body: { flex: 1, alignItems: 'center', justifyContent: 'center', gap: Spacing.sm, paddingHorizontal: Spacing.xl },
  addr: { fontFamily: Fonts.mono, fontSize: 12, color: Colors.text3 },
  emptyTitle: {
    fontFamily: Fonts.display,
    fontSize: 22,
    color: Colors.text1,
    letterSpacing: ls(22, LS.display),
    marginTop: Spacing.sm,
  },
  emptyBody: { fontFamily: Fonts.body, fontSize: 14, color: Colors.text2, textAlign: 'center', lineHeight: 20 },
})
