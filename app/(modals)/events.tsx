import { EventRow } from '@/components/event/EventRow'
import { Button } from '@/components/ui/Button'
import { Divider } from '@/components/ui/Divider'
import { Colors } from '@/constants/colors'
import { EVENT_CATEGORIES } from '@/constants/event-categories'
import { Fonts, LS, ls } from '@/constants/fonts'
import { Spacing } from '@/constants/spacing'
import { eventKeys, useInfiniteEvents, useInfiniteForYouEvents } from '@/hooks/api/use-events'
import { useUpdateProfile } from '@/hooks/api/use-update-profile'
import { useMyProfile } from '@/hooks/api/use-user-profile'
import type { Event } from '@/lib/api/events'
import { Ionicons } from '@expo/vector-icons'
import BottomSheet, { BottomSheetScrollView } from '@gorhom/bottom-sheet'
import { useQueryClient } from '@tanstack/react-query'
import { router, useFocusEffect, useLocalSearchParams } from 'expo-router'
import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import {
  ActivityIndicator,
  BackHandler,
  Dimensions,
  FlatList,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from 'react-native'
import Animated, {
  Easing,
  FadeIn,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

const W = Dimensions.get('window').width

type EventListType = 'for-you' | 'recently-added'

const SCREEN_META: Record<EventListType, { title: string; subtitle: string; sortBy: 'created_at' | 'start_time' }> = {
  'for-you': {
    title: 'For You',
    subtitle: 'Based on your interests',
    sortBy: 'created_at',
  },
  'recently-added': {
    title: 'Recently Added',
    subtitle: 'Fresh on the platform',
    sortBy: 'start_time',
  },
}

// ─── Interests bottom sheet ───────────────────────────────────────────────────

function InterestsSheet({
  sheetRef,
  currentInterests,
  onSaved,
}: {
  sheetRef: React.RefObject<BottomSheet | null>
  currentInterests: string[]
  onSaved: () => void
}) {
  const { mutateAsync: updateProfile, isPending } = useUpdateProfile()
  const [selected, setSelected] = useState<string[]>(currentInterests)
  const insets = useSafeAreaInsets()

  useEffect(() => {
    setSelected(currentInterests)
  }, [currentInterests])

  function toggleCategory(label: string) {
    setSelected((prev) => (prev.includes(label) ? prev.filter((c) => c !== label) : [...prev, label]))
  }

  async function handleSave() {
    await updateProfile({ interests: selected })
    sheetRef.current?.close()
    onSaved()
  }

  const canSave = selected.length >= 2

  return (
    <BottomSheet
      ref={sheetRef}
      index={-1}
      snapPoints={['78%']}
      enablePanDownToClose
      enableDynamicSizing={false}
      backgroundStyle={styles.sheetBg}
      handleIndicatorStyle={styles.handle}
      topInset={insets.top}
    >
      <BottomSheetScrollView
        contentContainerStyle={[styles.sheetContent, { paddingBottom: insets.bottom + Spacing.xl }]}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.sheetHeader}>
          <Text style={styles.sheetTitle}>Your Interests</Text>
          <Text style={styles.sheetSubtitle}>Update to personalize your For You feed.</Text>
        </View>

        <View style={styles.categoryGrid}>
          {EVENT_CATEGORIES.map((cat) => {
            const active = selected.includes(cat.label)
            return (
              <TouchableOpacity
                key={cat.label}
                style={[styles.categoryChip, active && styles.categoryChipActive]}
                onPress={() => toggleCategory(cat.label)}
                activeOpacity={0.75}
              >
                <Text style={styles.categoryIcon}>{cat.icon}</Text>
                <Text style={[styles.categoryLabel, active && styles.categoryLabelActive]}>{cat.label}</Text>
              </TouchableOpacity>
            )
          })}
        </View>

        <View style={styles.selectedCount}>
          <Text style={styles.selectedCountText}>
            {selected.length < 2 ? `Select ${2 - selected.length} more` : `${selected.length} selected`}
          </Text>
        </View>

        <Button onPress={handleSave} disabled={!canSave} loading={isPending}>
          Save Interests
        </Button>
      </BottomSheetScrollView>
    </BottomSheet>
  )
}

// ─── Main screen ──────────────────────────────────────────────────────────────

export default function EventsScreen() {
  const insets = useSafeAreaInsets()
  const { type } = useLocalSearchParams<{ type: EventListType }>()
  const meta = SCREEN_META[type ?? 'for-you']
  const queryClient = useQueryClient()

  const allEventsQuery = useInfiniteEvents(meta.sortBy)
  const forYouQuery = useInfiniteForYouEvents()
  const query = type === 'for-you' ? forYouQuery : allEventsQuery

  const { fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, refetch, isRefetching } = query
  const events: Event[] = query.data?.pages.flatMap((page) => page) ?? []

  const { data: profile } = useMyProfile()
  const currentInterests = useMemo(() => (profile?.interests ?? []) as string[], [profile?.interests])

  const sheetRef = useRef<BottomSheet>(null)

  // Slide animation for the container (enter + exit)
  const translateX = useSharedValue(W)
  const opacity = useSharedValue(1)

  useEffect(() => {
    translateX.value = withTiming(0, { duration: 280, easing: Easing.out(Easing.cubic) })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  const slideStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
    opacity: opacity.value,
  }))

  const handleBack = useCallback(() => {
    translateX.value = withTiming(W * 0.35, { duration: 220, easing: Easing.in(Easing.cubic) })
    opacity.value = withTiming(0, { duration: 220, easing: Easing.in(Easing.cubic) }, (finished) => {
      if (finished) runOnJS(router.back)()
    })
  }, [translateX, opacity])

  useFocusEffect(
    useCallback(() => {
      const sub = BackHandler.addEventListener('hardwareBackPress', () => {
        handleBack()
        return true
      })
      return () => sub.remove()
    }, [handleBack]),
  )

  function handleInterestsSaved() {
    queryClient.invalidateQueries({ queryKey: eventKeys.forYou })
  }

  return (
    <Animated.View style={[styles.container, { paddingTop: insets.top }, slideStyle]}>
      <Animated.View entering={FadeIn.duration(320)} style={styles.inner}>
        <View style={styles.header}>
          <TouchableOpacity onPress={handleBack} style={styles.backBtn} hitSlop={8}>
            <Ionicons name="chevron-back" size={22} color={Colors.text1} />
          </TouchableOpacity>
          <View style={styles.headerCenter}>
            <Text style={styles.headerTitle}>{meta.title}</Text>
            <Text style={styles.headerSubtitle}>{meta.subtitle}</Text>
          </View>
          {type === 'for-you' ? (
            <TouchableOpacity style={styles.optionsBtn} hitSlop={8} onPress={() => sheetRef.current?.snapToIndex(0)}>
              <Ionicons name="options-outline" size={22} color={Colors.text1} />
            </TouchableOpacity>
          ) : (
            <View style={styles.headerSpacer} />
          )}
        </View>

        {isLoading ? (
          <View style={styles.center}>
            <ActivityIndicator color={Colors.accent} />
          </View>
        ) : (
          <FlatList
            data={events}
            keyExtractor={(item) => item.eventPda}
            renderItem={({ item }) => (
              <EventRow event={item} onPress={() => router.push(`/(modals)/event/${item.eventPda}`)} />
            )}
            contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + Spacing.lg }]}
            showsVerticalScrollIndicator={false}
            onEndReached={() => {
              if (hasNextPage && !isFetchingNextPage) fetchNextPage()
            }}
            onEndReachedThreshold={0.4}
            refreshing={isRefetching}
            onRefresh={refetch}
            ListFooterComponent={
              isFetchingNextPage ? (
                <ActivityIndicator color={Colors.accent} style={styles.footerLoader} />
              ) : events.length > 0 ? (
                <Divider />
              ) : null
            }
            ListEmptyComponent={
              <View style={styles.empty}>
                <Ionicons name="calendar-outline" size={40} color={Colors.text3} />
                <Text style={styles.emptyText}>No events for your interests yet.</Text>
              </View>
            }
          />
        )}
      </Animated.View>

      {type === 'for-you' && (
        <InterestsSheet sheetRef={sheetRef} currentInterests={currentInterests} onSaved={handleInterestsSaved} />
      )}
    </Animated.View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  inner: { flex: 1 },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.bg,
  },
  backBtn: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  optionsBtn: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerTitle: {
    fontFamily: Fonts.display,
    fontSize: 18,
    color: Colors.text1,
    letterSpacing: ls(18, LS.displaySubtle),
  },
  headerSubtitle: {
    fontFamily: Fonts.body,
    fontSize: 12,
    color: Colors.text2,
    marginTop: 1,
  },
  headerSpacer: { width: 38 },

  listContent: { paddingHorizontal: Spacing.md, paddingTop: Spacing.xs },
  footerLoader: { paddingVertical: Spacing.lg },

  empty: { alignItems: 'center', justifyContent: 'center', paddingTop: 80, gap: Spacing.sm },
  emptyText: { fontFamily: Fonts.body, fontSize: 15, color: Colors.text2 },

  // Interests sheet
  sheetBg: { backgroundColor: Colors.surface, borderTopLeftRadius: 28, borderTopRightRadius: 28 },
  handle: { backgroundColor: Colors.border2, width: 36, height: 4 },
  sheetContent: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.sm, gap: Spacing.lg },
  sheetHeader: { gap: 6 },
  sheetTitle: {
    fontFamily: Fonts.display,
    fontSize: 28,
    color: Colors.text1,
    letterSpacing: ls(28, LS.displayTight),
  },
  sheetSubtitle: { fontFamily: Fonts.body, fontSize: 14, color: Colors.text2, lineHeight: 20 },
  categoryGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: Spacing.sm },
  categoryChip: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 99,
    backgroundColor: Colors.surface2,
  },
  categoryChipActive: { backgroundColor: Colors.accent },
  categoryIcon: { fontSize: 16 },
  categoryLabel: { fontFamily: Fonts.bodyMedium, fontSize: 13, color: Colors.text2 },
  categoryLabelActive: { color: Colors.bg },
  selectedCount: { alignItems: 'center' },
  selectedCountText: { fontFamily: Fonts.mono, fontSize: 11, color: Colors.text3, letterSpacing: ls(11, LS.labelWide) },
})
