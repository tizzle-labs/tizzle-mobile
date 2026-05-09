import { useAuth } from '@/components/auth/auth-provider'
import { deriveEventStatus } from '@/components/event/EventStatusChip'
import { Colors } from '@/constants/colors'
import { Fonts, LS, ls } from '@/constants/fonts'
import { Spacing } from '@/constants/spacing'
import { useEvents } from '@/hooks/api/use-events'
import { useMyRegistrations } from '@/hooks/api/use-my-registrations'
import { useMyProfile } from '@/hooks/api/use-user-profile'
import type { Event } from '@/lib/api/events'
import { Ionicons } from '@expo/vector-icons'
import { Image } from 'expo-image'
import { router } from 'expo-router'
import { useMemo } from 'react'
import { ActivityIndicator, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

function formatEventDate(iso: string): string {
  const date = new Date(iso)
  const now = new Date()
  const tomorrow = new Date(now)
  tomorrow.setDate(now.getDate() + 1)
  const time = date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
  if (date.toDateString() === now.toDateString()) return `Today, ${time}`
  if (date.toDateString() === tomorrow.toDateString()) return `Tomorrow, ${time}`
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + `, ${time}`
}

function shortAddr(addr: string) {
  return !addr || addr.length < 10 ? addr : `${addr.slice(0, 4)}...${addr.slice(-4)}`
}

function HistoryEventRow({ event, onPress }: { event: Event; onPress: () => void }) {
  const status = deriveEventStatus(event.startTime, event.endTime, event.unlockTime)
  const statusColor = status === 'Available' || status === 'Ongoing' ? Colors.accent : Colors.warning
  return (
    <TouchableOpacity style={s.eventRow} onPress={onPress} activeOpacity={0.75}>
      <Image source={{ uri: event.imageUrl }} style={s.eventThumb} contentFit="cover" />
      <View style={s.eventInfo}>
        <View style={s.eventTopRow}>
          {event.organizationAvatarUrl ? (
            <Image source={{ uri: event.organizationAvatarUrl }} style={s.orgAvatarImg} contentFit="cover" />
          ) : (
            <View style={s.orgAvatar}>
              <Ionicons name="business-outline" size={10} color={Colors.text3} />
            </View>
          )}
          <Text style={s.orgName} numberOfLines={1}>
            {event.organizationName ?? shortAddr(event.organizerAddress)}
          </Text>
        </View>
        <Text style={s.eventTitle} numberOfLines={2}>
          {event.title}
        </Text>
        <View style={s.eventBottomRow}>
          <View style={s.eventDateRow}>
            <Ionicons name="time-outline" size={11} color={Colors.text3} />
            <Text style={s.eventDate}>{formatEventDate(event.startTime)}</Text>
          </View>
          <Text style={[s.statusText, { color: statusColor }]}>{status.toUpperCase()}</Text>
        </View>
      </View>
    </TouchableOpacity>
  )
}

export default function ProfileModal() {
  const { walletAddress } = useAuth()
  const { data: profile, isLoading } = useMyProfile()
  const { data: registrations } = useMyRegistrations()
  const { data: events } = useEvents()
  const insets = useSafeAreaInsets()

  const eventsByPda = useMemo(() => new Map((events ?? []).map((e) => [e.eventPda, e])), [events])

  const attendedCount = registrations?.filter((r) => r.checkedIn).length ?? 0
  // TODO: Replace with real hosted events count once organizer API is available
  const hostedCount = 0

  // History: events the user has registered for
  const historyEvents = useMemo(() => {
    return (registrations ?? []).map((r) => eventsByPda.get(r.eventPda)).filter((e): e is Event => !!e)
  }, [registrations, eventsByPda])

  const displayName = profile?.name || profile?.username || shortAddr(walletAddress ?? '')
  const joinedDate = 'Mar 2025' // TODO: Replace with real joinedAt field once backend provides it

  if (isLoading) {
    return (
      <View style={s.loading}>
        <ActivityIndicator color={Colors.accent} />
      </View>
    )
  }

  return (
    <View style={s.container}>
      <ScrollView
        style={s.scroll}
        contentContainerStyle={[
          s.scrollContent,
          { paddingTop: insets.top + Spacing.sm, paddingBottom: insets.bottom + 40 },
        ]}
        showsVerticalScrollIndicator={false}
      >
        {/* ── Header ── */}
        <View style={s.header}>
          <TouchableOpacity onPress={() => router.back()} style={s.iconBtn} hitSlop={8}>
            <Ionicons name="arrow-back" size={20} color={Colors.text1} />
          </TouchableOpacity>
          <View style={{ flex: 1 }} />
          <TouchableOpacity onPress={() => router.push('/(modals)/settings')} style={s.iconBtn} hitSlop={8}>
            <Ionicons name="settings-outline" size={20} color={Colors.text1} />
          </TouchableOpacity>
        </View>
        {/* ── Avatar + Identity ── */}
        <View style={s.identity}>
          <View style={s.avatarWrap}>
            {profile?.avatarUrl ? (
              <Image source={{ uri: profile.avatarUrl }} style={s.avatar} contentFit="cover" />
            ) : (
              <View style={[s.avatar, s.avatarFallback]}>
                <Ionicons name="person" size={32} color={Colors.text3} />
              </View>
            )}
          </View>
          <View style={s.nameRow}>
            <Text style={s.displayName}>{displayName}</Text>
            {/* TODO: Show verified badge once backend provides isVerified field */}
          </View>
          {profile?.username && <Text style={s.username}>@{profile.username}</Text>}
          {profile?.bio && <Text style={s.bio}>{profile.bio}</Text>}
          <View style={s.joinedRow}>
            <Ionicons name="calendar-outline" size={12} color={Colors.text3} />
            <Text style={s.joinedText}>Joined {joinedDate}</Text>
          </View>
        </View>
        {/* ── Stats ── */}
        <View style={s.statsRow}>
          <View style={s.statItem}>
            <Text style={s.statNum}>{hostedCount}</Text>
            <Text style={s.statLabel}>Hosted</Text>
          </View>
          <View style={s.statDivider} />
          <View style={s.statItem}>
            <Text style={s.statNum}>{attendedCount}</Text>
            <Text style={s.statLabel}>Attended</Text>
          </View>
          <View style={s.statDivider} />
          <View style={s.statItem}>
            <Text style={s.statNum}>{registrations?.length ?? 0}</Text>
            <Text style={s.statLabel}>Tickets</Text>
          </View>
        </View>
        {/* ── Badges ── */}
        {/* TODO: Replace with real badges once backend provides badge/achievement API */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Badges</Text>
          <View style={s.badgesPlaceholder}>
            <Ionicons name="ribbon-outline" size={24} color={Colors.text3} />
            <Text style={s.placeholderText}>Badges coming soon</Text>
          </View>
        </View>
        {/* ── Event History ── */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Event History</Text>
          {historyEvents.length > 0 ? (
            historyEvents.map((event) => (
              <HistoryEventRow
                key={event.eventPda}
                event={event}
                onPress={() => router.push(`/(modals)/event/${event.eventPda}`)}
              />
            ))
          ) : (
            <View style={s.emptyInline}>
              <Text style={s.emptyText}>No events attended yet.</Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.bg },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: Spacing.md },

  header: { flexDirection: 'row', alignItems: 'center', marginBottom: Spacing.lg },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.surface2,
    alignItems: 'center',
    justifyContent: 'center',
  },

  identity: { gap: Spacing.xs, marginBottom: Spacing.lg },
  avatarWrap: { marginBottom: Spacing.sm },
  avatar: { width: 80, height: 80, borderRadius: 40 },
  avatarFallback: {
    backgroundColor: Colors.surface2,
    borderWidth: 1,
    borderColor: Colors.border2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  nameRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  displayName: {
    fontFamily: Fonts.display,
    fontSize: 28,
    color: Colors.text1,
    letterSpacing: ls(28, LS.displayTight),
    lineHeight: 34,
  },
  username: { fontFamily: Fonts.mono, fontSize: 13, color: Colors.text3 },
  bio: { fontFamily: Fonts.body, fontSize: 14, color: Colors.text2, lineHeight: 20, marginTop: 2 },
  joinedRow: { flexDirection: 'row', alignItems: 'center', gap: 5, marginTop: 4 },
  joinedText: { fontFamily: Fonts.body, fontSize: 12, color: Colors.text3 },

  statsRow: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: Spacing.md,
    marginBottom: Spacing.xl,
  },
  statItem: { flex: 1, alignItems: 'center', gap: 2 },
  statNum: { fontFamily: Fonts.display, fontSize: 22, color: Colors.text1, letterSpacing: ls(22, LS.display) },
  statLabel: { fontFamily: Fonts.mono, fontSize: 11, color: Colors.text3, letterSpacing: ls(11, LS.labelWide) },
  statDivider: { width: 1, height: 32, backgroundColor: Colors.border2 },

  section: { marginBottom: Spacing.xl, gap: Spacing.md },
  sectionTitle: {
    fontFamily: Fonts.display,
    fontSize: 18,
    color: Colors.text1,
    letterSpacing: ls(18, LS.displaySubtle),
  },

  badgesPlaceholder: {
    height: 80,
    backgroundColor: Colors.surface,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
    flexDirection: 'row',
  },
  placeholderText: { fontFamily: Fonts.body, fontSize: 13, color: Colors.text3 },

  eventRow: {
    flexDirection: 'row',
    gap: Spacing.md,
    paddingVertical: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    alignItems: 'flex-start',
  },
  eventThumb: { width: 80, height: 80, borderRadius: 10, backgroundColor: Colors.surface2 },
  eventInfo: { flex: 1, gap: 5 },
  eventTopRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  orgAvatar: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: Colors.surface2,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border2,
  },
  orgAvatarImg: {
    width: 18,
    height: 18,
    borderRadius: 9,
    backgroundColor: Colors.surface2,
    borderWidth: 1,
    borderColor: Colors.border2,
  },
  orgName: { fontFamily: Fonts.mono, fontSize: 12, color: Colors.text1, flex: 1 },
  eventTitle: {
    fontFamily: Fonts.display,
    fontSize: 15,
    color: Colors.text1,
    letterSpacing: ls(15, LS.displaySubtle),
    lineHeight: 20,
  },
  eventBottomRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  eventDateRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  eventDate: { fontFamily: Fonts.mono, fontSize: 12, color: Colors.text1 },
  statusText: { fontFamily: Fonts.mono, fontSize: 10, letterSpacing: ls(10, LS.labelNarrow) },

  emptyInline: {
    paddingVertical: Spacing.lg,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    borderRadius: 12,
    backgroundColor: Colors.surface,
  },
  emptyText: { fontFamily: Fonts.body, fontSize: 13, color: Colors.text3 },

  signOutBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    paddingVertical: Spacing.md,
    marginTop: Spacing.sm,
  },
  signOutText: { fontFamily: Fonts.bodyMedium, fontSize: 14, color: Colors.error },
})
