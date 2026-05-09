import { useAuth } from '@/components/auth/auth-provider'
import { Colors } from '@/constants/colors'
import { Fonts, LS, ls } from '@/constants/fonts'
import { Spacing } from '@/constants/spacing'
import { useMyProfile } from '@/hooks/api/use-user-profile'
import { Ionicons } from '@expo/vector-icons'
import { Image } from 'expo-image'
import { router } from 'expo-router'
import { Linking, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

function SettingRow({
  icon,
  iconBg,
  label,
  onPress,
  external = false,
  danger = false,
  showChevron = true,
}: {
  icon: string
  iconBg: string
  label: string
  onPress: () => void
  external?: boolean
  danger?: boolean
  showChevron?: boolean
}) {
  return (
    <TouchableOpacity style={s.row} onPress={onPress} activeOpacity={0.7}>
      <View style={[s.rowIcon, { backgroundColor: iconBg }]}>
        <Ionicons name={icon as any} size={16} color="#fff" />
      </View>
      <Text style={[s.rowLabel, danger && s.rowLabelDanger]}>{label}</Text>
      {showChevron && (
        <Ionicons name={external ? 'arrow-forward-outline' : 'chevron-forward'} size={16} color={Colors.text3} />
      )}
    </TouchableOpacity>
  )
}

function SectionLabel({ label }: { label: string }) {
  return <Text style={s.sectionLabel}>{label}</Text>
}

function Group({ children }: { children: React.ReactNode }) {
  return <View style={s.group}>{children}</View>
}

function Divider() {
  return <View style={s.divider} />
}

export default function SettingsScreen() {
  const insets = useSafeAreaInsets()
  const { walletAddress, signOut } = useAuth()
  const { data: profile } = useMyProfile()

  const displayName = profile?.name || profile?.username || 'Anonymous'
  const username = profile?.username
    ? `@${profile.username}`
    : walletAddress
      ? `${walletAddress.slice(0, 6)}…${walletAddress.slice(-4)}`
      : ''

  async function handleSignOut() {
    await signOut()
    router.replace('/sign-in')
  }

  return (
    <View style={[s.container, { paddingTop: insets.top + Spacing.sm }]}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn} hitSlop={12}>
          <Ionicons name="arrow-back" size={20} color={Colors.text1} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Settings</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView
        style={s.scroll}
        contentContainerStyle={[s.scrollContent, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Profile card ── */}
        <Group>
          <TouchableOpacity style={s.profileRow} onPress={() => router.back()} activeOpacity={0.7}>
            <View style={s.profileAvatar}>
              {profile?.avatarUrl ? (
                <Image source={{ uri: profile.avatarUrl }} style={s.avatarImg} contentFit="cover" />
              ) : (
                <Ionicons name="person" size={22} color={Colors.text3} />
              )}
            </View>
            <View style={s.profileInfo}>
              <Text style={s.profileName}>{displayName}</Text>
              <Text style={s.profileUsername}>{username}</Text>
            </View>
            <Ionicons name="chevron-forward" size={16} color={Colors.text3} />
          </TouchableOpacity>
          <Divider />
          <SettingRow
            icon="create-outline"
            iconBg={Colors.surface2}
            label="Edit Profile"
            onPress={() => router.push('/(modals)/edit-profile')}
          />
        </Group>

        {/* ── Account ── */}
        <Group>
          <SettingRow
            icon="person-circle-outline"
            iconBg="#3A3A8C"
            label="Account Settings"
            onPress={() => router.push('/(modals)/account-settings')}
          />
          <Divider />
          <SettingRow
            icon="wallet-outline"
            iconBg="#6B21A8"
            label="Wallet & Tokens"
            onPress={() => router.push('/(modals)/wallet')}
          />
        </Group>

        {/* ── Preferences ── */}
        <SectionLabel label="Preferences" />
        <Group>
          <SettingRow
            icon="shield-checkmark-outline"
            iconBg="#15803D"
            label="Permissions"
            onPress={() => router.push('/(modals)/permissions')}
          />
        </Group>

        {/* ── Resources ── */}
        <SectionLabel label="Resources" />
        <Group>
          <SettingRow
            icon="help-circle-outline"
            iconBg="#0369A1"
            label="Help"
            onPress={() => Linking.openURL('https://tizzle.app/help')}
            external
          />
          <Divider />
          <SettingRow
            icon="logo-twitter"
            iconBg="#000000"
            label="X / Twitter"
            onPress={() => Linking.openURL('https://x.com/tizzleai')}
            external
          />
        </Group>

        {/* ── Disconnect ── */}
        <Group>
          <SettingRow
            icon="log-out-outline"
            iconBg={Colors.error}
            label="Disconnect Wallet"
            onPress={handleSignOut}
            danger
            showChevron={false}
          />
        </Group>
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
  headerTitle: {
    fontFamily: Fonts.display,
    fontSize: 18,
    color: Colors.text1,
    letterSpacing: ls(18, LS.displaySubtle),
  },

  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: Spacing.md, gap: Spacing.sm },

  sectionLabel: {
    fontFamily: Fonts.mono,
    fontSize: 11,
    color: Colors.text3,
    letterSpacing: ls(11, LS.labelWide),
    textTransform: 'uppercase',
    paddingHorizontal: Spacing.xs,
    marginTop: Spacing.sm,
  },

  group: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    overflow: 'hidden',
  },

  divider: { height: 1, backgroundColor: Colors.border },

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: 13,
    gap: Spacing.md,
  },
  rowIcon: { width: 32, height: 32, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
  rowLabel: { flex: 1, fontFamily: Fonts.body, fontSize: 15, color: Colors.text1 },
  rowLabelDanger: { color: Colors.error },

  profileRow: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    gap: Spacing.md,
  },
  profileAvatar: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: Colors.surface2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarImg: { width: 44, height: 44, borderRadius: 22 },
  profileInfo: { flex: 1, gap: 2 },
  profileName: {
    fontFamily: Fonts.display,
    fontSize: 16,
    color: Colors.text1,
    letterSpacing: ls(16, LS.displaySubtle),
  },
  profileUsername: { fontFamily: Fonts.mono, fontSize: 12, color: Colors.text3 },
})
