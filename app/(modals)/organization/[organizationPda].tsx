import { useAuth } from '@/components/auth/auth-provider'
import { EventRow } from '@/components/event/EventRow'
import { LoadingScreen } from '@/components/ui/LoadingScreen'
import { Colors } from '@/constants/colors'
import { Fonts, LS, ls } from '@/constants/fonts'
import { Spacing } from '@/constants/spacing'
import { useEventsByOrg } from '@/hooks/api/use-events'
import { useOrganization } from '@/hooks/api/use-my-organizations'
import type { Event } from '@/lib/api/events'
import { Ionicons } from '@expo/vector-icons'
import { Image } from 'expo-image'
import { router, useLocalSearchParams } from 'expo-router'
import { useState } from 'react'
import { Linking, RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

const COLUMN_WIDTH = 320

function chunkArray<T>(arr: T[], size: number): T[][] {
  const chunks: T[][] = []
  for (let i = 0; i < arr.length; i += size) chunks.push(arr.slice(i, i + size))
  return chunks
}

export default function OrganizationDetailModal() {
  const { organizationPda } = useLocalSearchParams<{ organizationPda: string }>()
  const { data: org, isLoading, refetch: refetchOrg } = useOrganization(organizationPda)
  const { data: events = [], refetch: refetchEvents } = useEventsByOrg(organizationPda)
  const { walletAddress } = useAuth()
  const insets = useSafeAreaInsets()
  const [refreshing, setRefreshing] = useState(false)

  const isOwner = !!walletAddress && !!org && org.treasuryAddress === walletAddress

  async function handleRefresh() {
    setRefreshing(true)
    await Promise.all([refetchOrg(), refetchEvents()])
    setRefreshing(false)
  }

  if (isLoading) {
    return <LoadingScreen />
  }

  if (!org) {
    return (
      <View style={s.loading}>
        <Text style={s.errorText}>Organization not found.</Text>
      </View>
    )
  }

  const previewEvents = events.slice(0, 6)
  const eventChunks = chunkArray(previewEvents, 3)

  return (
    <View style={s.container}>
      <View style={[s.header, { paddingTop: insets.top + Spacing.xs }]}>
        <TouchableOpacity onPress={() => router.back()} style={s.iconBtn} hitSlop={8}>
          <Ionicons name="arrow-back" size={20} color={Colors.text1} />
        </TouchableOpacity>
        {isOwner && (
          <TouchableOpacity
            style={s.iconBtn}
            hitSlop={8}
            onPress={() => router.push({ pathname: '/(modals)/organization/edit-organization', params: { organizationPda } })}
          >
            <Ionicons name="create-outline" size={20} color={Colors.text1} />
          </TouchableOpacity>
        )}
      </View>

      <ScrollView
        style={s.scroll}
        contentContainerStyle={[s.scrollContent, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing}
            onRefresh={handleRefresh}
            tintColor={Colors.accent}
            colors={[Colors.accent]}
            progressBackgroundColor={Colors.bg}
          />
        }
      >
        {/* Identity */}
        <View style={s.identity}>
          {org.avatarUrl ? (
            <Image source={{ uri: org.avatarUrl }} style={s.avatar} contentFit="cover" />
          ) : (
            <View style={[s.avatar, s.avatarFallback]}>
              <Ionicons name="business-outline" size={32} color={Colors.text3} />
            </View>
          )}
          <Text style={s.name}>{org.name}</Text>
          {!!org.description && <Text style={s.description}>{org.description}</Text>}

          {/* Socials */}
          {(!!org.twitter || !!org.discord) && (
            <View style={s.socials}>
              {!!org.twitter && (
                <TouchableOpacity
                  style={s.socialBtn}
                  onPress={() => Linking.openURL(`https://twitter.com/${org.twitter.replace('@', '')}`)}
                  activeOpacity={0.7}
                >
                  <Ionicons name="logo-twitter" size={15} color={Colors.text2} />
                  <Text style={s.socialText}>{org.twitter.startsWith('@') ? org.twitter : `@${org.twitter}`}</Text>
                </TouchableOpacity>
              )}
              {!!org.discord && (
                <TouchableOpacity
                  style={s.socialBtn}
                  onPress={() =>
                    Linking.openURL(org.discord.startsWith('http') ? org.discord : `https://${org.discord}`)
                  }
                  activeOpacity={0.7}
                >
                  <Ionicons name="logo-discord" size={15} color={Colors.text2} />
                  <Text style={s.socialText}>{org.discord}</Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </View>

        {/* Stats */}
        <View style={s.statsRow}>
          <View style={s.statItem}>
            <Text style={s.statNum}>{events.length}</Text>
            <Text style={s.statLabel}>Events</Text>
          </View>
        </View>

        {/* Events */}
        <View style={s.section}>
          <View style={s.sectionHeader}>
            <Text style={s.sectionTitle}>Events</Text>
            <TouchableOpacity
              style={s.seeAllBtn}
              onPress={() =>
                router.push({
                  pathname: '/(modals)/events',
                  params: { type: 'organization', organizationPda, organizationName: org.name },
                })
              }
              hitSlop={8}
            >
              <Text style={s.seeAllText}>View All</Text>
              <Ionicons name="chevron-forward" size={14} color={Colors.text2} />
            </TouchableOpacity>
          </View>

          {events.length === 0 ? (
            <View style={s.emptyInline}>
              <Text style={s.emptyText}>No events yet.</Text>
            </View>
          ) : (
            <ScrollView
              horizontal
              showsHorizontalScrollIndicator={false}
              style={s.hScroll}
              contentContainerStyle={s.hScrollContent}
            >
              {eventChunks.map((chunk, ci) => (
                <View key={ci} style={s.column}>
                  {chunk.map((event: Event) => (
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
  errorText: { fontFamily: Fonts.body, fontSize: 14, color: Colors.text2 },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: Spacing.md },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.surface2,
    alignItems: 'center',
    justifyContent: 'center',
  },

  identity: { gap: Spacing.xs, marginBottom: Spacing.lg },
  avatar: { width: 80, height: 80, borderRadius: 20, marginBottom: Spacing.xs },
  avatarFallback: {
    backgroundColor: Colors.surface2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  name: {
    fontFamily: Fonts.display,
    fontSize: 28,
    color: Colors.text1,
    letterSpacing: ls(28, LS.displayTight),
    lineHeight: 34,
  },
  description: {
    fontFamily: Fonts.body,
    fontSize: 14,
    color: Colors.text2,
    lineHeight: 20,
    marginTop: 2,
  },
  socials: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm, marginTop: Spacing.xs },
  socialBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    backgroundColor: Colors.surface,
    borderRadius: 10,
  },
  socialText: { fontFamily: Fonts.mono, fontSize: 12, color: Colors.text2 },

  statsRow: {
    flexDirection: 'row',
    backgroundColor: Colors.surface,
    borderRadius: 16,
    padding: Spacing.md,
    marginBottom: Spacing.xl,
  },
  statItem: { flex: 1, alignItems: 'center', gap: 2 },
  statNum: { fontFamily: Fonts.display, fontSize: 22, color: Colors.text1, letterSpacing: ls(22, LS.display) },
  statLabel: { fontFamily: Fonts.mono, fontSize: 11, color: Colors.text3, letterSpacing: ls(11, LS.labelWide) },

  section: { marginBottom: Spacing.xl },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    justifyContent: 'space-between',
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    fontFamily: Fonts.display,
    fontSize: 20,
    color: Colors.text1,
    letterSpacing: ls(20, LS.displaySubtle),
  },
  seeAllBtn: { flexDirection: 'row', alignItems: 'center', gap: 2, paddingVertical: 4 },
  seeAllText: { fontFamily: Fonts.mono, fontSize: 13, color: Colors.text2 },

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
})
