import { useAuth } from '@/components/auth/auth-provider'
import { SolanaLogo } from '@/components/ui/SolanaLogo'
import { Colors } from '@/constants/colors'
import { Fonts, LS, ls } from '@/constants/fonts'
import { Spacing } from '@/constants/spacing'
import { useWalletAssets } from '@/hooks/solana/use-wallet-assets'
import { formatSol } from '@/lib/format'
import { Ionicons } from '@expo/vector-icons'
import * as Clipboard from 'expo-clipboard'
import { router } from 'expo-router'
import { useState } from 'react'
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

function shortAddr(addr: string) {
  return addr.length < 10 ? addr : `${addr.slice(0, 6)}…${addr.slice(-4)}`
}

export default function WalletScreen() {
  const insets = useSafeAreaInsets()
  const { walletAddress } = useAuth()
  const { data: assets, isLoading, refetch, isRefetching } = useWalletAssets()
  const [copied, setCopied] = useState(false)

  async function handleCopy() {
    if (!walletAddress) return
    await Clipboard.setStringAsync(walletAddress)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <View style={[s.container, { paddingTop: insets.top + Spacing.sm }]}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn} hitSlop={12}>
          <Ionicons name="arrow-back" size={20} color={Colors.text1} />
        </TouchableOpacity>
        <Text style={s.title}>Wallet & Tokens</Text>
        <TouchableOpacity onPress={() => refetch()} style={s.backBtn} hitSlop={12} disabled={isRefetching}>
          <Ionicons name="refresh-outline" size={20} color={isRefetching ? Colors.text3 : Colors.text1} />
        </TouchableOpacity>
      </View>

      <ScrollView
        style={s.scroll}
        contentContainerStyle={[s.scrollContent, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* Wallet Address Card */}
        <View style={s.card}>
          <View style={s.cardIconRow}>
            <View style={s.walletIconWrap}>
              <Ionicons name="wallet-outline" size={20} color={Colors.accent} />
            </View>
            <Text style={s.cardLabel}>Wallet Address</Text>
          </View>
          <TouchableOpacity style={s.addrRow} onPress={handleCopy} activeOpacity={0.7}>
            <Text style={s.addr} numberOfLines={1} ellipsizeMode="middle">
              {walletAddress ?? '—'}
            </Text>
            <Ionicons
              name={copied ? 'checkmark-outline' : 'copy-outline'}
              size={16}
              color={copied ? Colors.accent : Colors.text3}
            />
          </TouchableOpacity>
        </View>

        {/* SOL Balance */}
        <View style={s.solCard}>
          <View style={s.solTop}>
            <Text style={s.solLabel}>SOL Balance</Text>
            {isLoading || isRefetching ? (
              <ActivityIndicator size="small" color={Colors.accent} />
            ) : null}
          </View>
          <View style={s.solBalanceRow}>
            <SolanaLogo size={32} />
            <Text style={s.solAmount}>
              {isLoading ? '—' : formatSol(assets?.sol ?? 0)}
            </Text>
          </View>
        </View>

        {/* SPL Tokens */}
        <Text style={s.sectionLabel}>Tokens</Text>
        <View style={s.tokenList}>
          {isLoading ? (
            <View style={s.center}>
              <ActivityIndicator color={Colors.accent} />
            </View>
          ) : !assets?.tokens.length ? (
            <View style={s.emptyTokens}>
              <Ionicons name="layers-outline" size={28} color={Colors.text3} />
              <Text style={s.emptyText}>No SPL tokens found</Text>
            </View>
          ) : (
            assets.tokens.map((token, i) => (
              <View key={token.mint} style={[s.tokenRow, i < assets.tokens.length - 1 && s.tokenDivider]}>
                <View style={s.tokenIcon}>
                  <Text style={s.tokenIconText}>{token.symbol.slice(0, 2)}</Text>
                </View>
                <View style={s.tokenInfo}>
                  <Text style={s.tokenSymbol}>{token.symbol}</Text>
                  <Text style={s.tokenMint} numberOfLines={1}>{shortAddr(token.mint)}</Text>
                </View>
                <Text style={s.tokenBalance}>{token.balance.toLocaleString()}</Text>
              </View>
            ))
          )}
        </View>
      </ScrollView>
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
    marginBottom: Spacing.sm,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.surface2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: { fontFamily: Fonts.display, fontSize: 18, color: Colors.text1, letterSpacing: ls(18, LS.displaySubtle) },

  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: Spacing.md, gap: Spacing.md },

  card: {
    backgroundColor: Colors.surface2,
    borderRadius: 16,
    padding: Spacing.md,
    gap: Spacing.xs,
  },
  cardIconRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginBottom: 2 },
  walletIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: Colors.bg,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cardLabel: { fontFamily: Fonts.mono, fontSize: 11, color: Colors.text3, letterSpacing: ls(11, LS.labelWide), textTransform: 'uppercase' },
  addrRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm },
  addr: { flex: 1, fontFamily: Fonts.mono, fontSize: 12, color: Colors.text1 },

  solCard: {
    backgroundColor: Colors.surface2,
    borderRadius: 16,
    padding: Spacing.md,
  },
  solTop: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginBottom: Spacing.sm },
  solLabel: { fontFamily: Fonts.mono, fontSize: 11, color: Colors.text3, letterSpacing: ls(11, LS.labelWide), textTransform: 'uppercase' },
  solBalanceRow: { flexDirection: 'row', alignItems: 'center', gap: Spacing.sm, marginTop: 4 },
  solAmount: { fontFamily: Fonts.display, fontSize: 40, color: Colors.chain, letterSpacing: ls(40, LS.displayTight), lineHeight: 46 },

  sectionLabel: {
    fontFamily: Fonts.mono,
    fontSize: 11,
    color: Colors.text3,
    letterSpacing: ls(11, LS.labelWide),
    textTransform: 'uppercase',
    paddingHorizontal: Spacing.xs,
    marginTop: Spacing.xs,
  },

  tokenList: {
    backgroundColor: Colors.surface2,
    borderRadius: 16,
    overflow: 'hidden',
  },
  tokenRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: 13,
    gap: Spacing.md,
  },
  tokenDivider: { borderBottomWidth: 1, borderBottomColor: Colors.border },
  tokenIcon: {
    width: 36,
    height: 36,
    borderRadius: 18,
    backgroundColor: Colors.surface2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  tokenIconText: { fontFamily: Fonts.display, fontSize: 12, color: Colors.text2 },
  tokenInfo: { flex: 1 },
  tokenSymbol: { fontFamily: Fonts.bodyMedium, fontSize: 14, color: Colors.text1 },
  tokenMint: { fontFamily: Fonts.mono, fontSize: 11, color: Colors.text3 },
  tokenBalance: { fontFamily: Fonts.display, fontSize: 15, color: Colors.text1, letterSpacing: ls(15, LS.displaySubtle) },

  center: { paddingVertical: Spacing.xl, alignItems: 'center' },
  emptyTokens: {
    paddingVertical: Spacing.xl,
    alignItems: 'center',
    gap: Spacing.sm,
  },
  emptyText: { fontFamily: Fonts.body, fontSize: 13, color: Colors.text3 },
})
