import { useAuth } from '@/components/auth/auth-provider'
import { EventRow } from '@/components/event/EventRow'
import { Colors } from '@/constants/colors'
import { Fonts, LS, ls } from '@/constants/fonts'
import { Spacing } from '@/constants/spacing'
import { useEvents, useEventsByOrg } from '@/hooks/api/use-events'
import { useMyOrganizations } from '@/hooks/api/use-my-organizations'
import { useMyRegistrations } from '@/hooks/api/use-my-registrations'
import { useMyProfile } from '@/hooks/api/use-user-profile'
import type { Event } from '@/lib/api/events'
import { Ionicons } from '@expo/vector-icons'
import { Image } from 'expo-image'
import { router } from 'expo-router'
import { useMemo, useState } from 'react'
import { ActivityIndicator, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

const COLUMN_WIDTH = 320

function chunkArray<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = []
  for (let i = 0; i < arr.length; i += size) chunks.push(arr.slice(i, i + size))
  return chunks
}

function shortAddr(addr: string) {
  return !addr || addr.length < 10 ? addr : `${addr.slice(0, 4)}...${addr.slice(-4)}`
}

export default function ProfileModal() {
  const { walletAddress } = useAuth()
  const { data: profile, isLoading, refetch: refetchProfile } = useMyProfile()
  const { data: registrations, refetch: refetchRegistrations } = useMyRegistrations()
  const { data: events, refetch: refetchEvents } = useEvents()
  const { data: orgs, refetch: refetchOrgs } = useMyOrganizations()
  const { data: myEvents, refetch: refetchMyEvents } = useEventsByOrg(orgs?.[0]?.organizationPda)
  const insets = useSafeAreaInsets()
  const [refreshing, setRefreshing] = useState(false)

  async function handleRefresh() {
    setRefreshing(true)
    await Promise.all([refetchProfile(), refetchRegistrations(), refetchEvents(), refetchOrgs(), refetchMyEvents()])
    setRefreshing(false)
  }

  const eventsByPda = useMemo(() => new Map((events ?? []).map((e) => [e.eventPda, e])), [events])

  const attendedCount = registrations?.filter((r) => r.checkedIn).length ?? 0
  const hostedCount = myEvents?.length ?? 0

  const historyEvents = useMemo(() => {
    return (registrations ?? []).map((r) => eventsByPda.get(r.eventPda)).filter((e): e is Event => !!e)
  }, [registrations, eventsByPda])
  const historyChunks = chunkArray(historyEvents.slice(0, 6), 3)

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
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} tintColor={Colors.accent} colors={[Colors.accent]} progressBackgroundColor={Colors.bg} />
        }
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
          <TouchableOpacity
            style={s.statItem}
            activeOpacity={orgs?.[0] ? 0.6 : 1}
            onPress={() => {
              if (orgs?.[0]) router.push({ pathname: '/(modals)/events', params: { type: 'organization', organizationPda: orgs[0].organizationPda, organizationName: orgs[0].name } })
            }}
          >
            <Text style={s.statNum}>{hostedCount}</Text>
            <Text style={s.statLabel}>Hosted</Text>
          </TouchableOpacity>
          <View style={s.statDivider} />
          <View style={s.statItem}>
            <Text style={s.statNum}>{attendedCount}</Text>
            <Text style={s.statLabel}>Attended</Text>
          </View>
          <View style={s.statDivider} />
          <TouchableOpacity
            style={s.statItem}
            activeOpacity={0.6}
            onPress={() => router.navigate('/(tabs)/tickets')}
          >
            <Text style={s.statNum}>{registrations?.length ?? 0}</Text>
            <Text style={s.statLabel}>Tickets</Text>
          </TouchableOpacity>
        </View>
        {/* ── Organization ── */}
        {orgs?.[0] && (
          <View style={s.section}>
            <View style={s.sectionHeader}>
              <Text style={s.sectionTitle}>Organization</Text>
            </View>
            <TouchableOpacity
              style={s.orgCard}
              onPress={() => router.push(`/(modals)/organization/${orgs[0].organizationPda}`)}
              activeOpacity={0.75}
            >
              {orgs[0].avatarUrl ? (
                <Image source={{ uri: orgs[0].avatarUrl }} style={s.orgCardAvatar} contentFit="cover" />
              ) : (
                <View style={[s.orgCardAvatar, s.orgCardAvatarFallback]}>
                  <Ionicons name="business-outline" size={18} color={Colors.text3} />
                </View>
              )}
              <View style={s.orgCardInfo}>
                <Text style={s.orgCardName} numberOfLines={1}>{orgs[0].name}</Text>
                {!!orgs[0].description && (
                  <Text style={s.orgCardDesc} numberOfLines={1}>{orgs[0].description}</Text>
                )}
              </View>
              <Ionicons name="chevron-forward" size={16} color={Colors.text2} />
            </TouchableOpacity>
          </View>
        )}
        {/* ── Badges ── */}
        {/* TODO: Replace with real badges once backend provides badge/achievement API */}
        <View style={s.section}>
          <View style={s.sectionHeader}>
            <Text style={s.sectionTitle}>Badges</Text>
          </View>
          <View style={s.badgesPlaceholder}>
            <Ionicons name="ribbon-outline" size={24} color={Colors.text3} />
            <Text style={s.placeholderText}>Badges coming soon</Text>
          </View>
        </View>
        {/* ── Event History ── */}
        <View style={s.section}>
          <View style={s.sectionHeader}>
            <Text style={s.sectionTitle}>Event History</Text>
            <TouchableOpacity
              style={s.seeAllBtn}
              onPress={() => router.push({ pathname: '/(modals)/events', params: { type: 'history' } })}
              hitSlop={8}
            >
              <Text style={s.seeAllText}>View All</Text>
              <Ionicons name="chevron-forward" size={14} color={Colors.text2} />
            </TouchableOpacity>
          </View>
          {historyEvents.length === 0 ? (
            <View style={s.emptyInline}>
              <Text style={s.emptyText}>No events attended yet.</Text>
            </View>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={s.hScroll}
              contentContainerStyle={s.hScrollContent}
            >
              {historyChunks.map((chunk, ci) => (
                <View key={ci} style={s.column}>
                  {chunk.map((event) => (
                    <EventRow
                      key={event.eventPda}
                      event={event}
                      onPress={() => router.push(`/(modals)/event/${event.eventPda}`)}
                    />
                  ))}
                </View>
              ))}
            </ScrollView>
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
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
  },
  sectionTitle: {
    fontFamily: Fonts.display,
    fontSize: 20,
    color: Colors.text1,
    letterSpacing: ls(20, LS.displaySubtle),
  },
  seeAllBtn: { flexDirection: 'row', alignItems: 'center', gap: 2, paddingVertical: 4 },
  seeAllText: { fontFamily: Fonts.mono, fontSize: 13, color: Colors.text2 },

  orgCard: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: Spacing.md,
  },
  orgCardAvatar: { width: 48, height: 48, borderRadius: 12 },
  orgCardAvatarFallback: {
    backgroundColor: Colors.surface2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  orgCardInfo: { flex: 1, gap: 2 },
  orgCardName: {
    fontFamily: Fonts.display,
    fontSize: 16,
    color: Colors.text1,
    letterSpacing: ls(16, LS.displaySubtle),
  },
  orgCardDesc: { fontFamily: Fonts.body, fontSize: 13, color: Colors.text2 },

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

  hScroll: { marginHorizontal: -Spacing.md },
  hScrollContent: { paddingHorizontal: Spacing.md, gap: Spacing.md },
  column: { width: COLUMN_WIDTH },

  emptyInline: {
    paddingVertical: Spacing.lg,
    alignItems: 'center',
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
