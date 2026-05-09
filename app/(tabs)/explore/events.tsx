import { EventRow } from '@/components/event/EventRow'
import { Colors } from '@/constants/colors'
import { Fonts, LS, ls } from '@/constants/fonts'
import { Spacing } from '@/constants/spacing'
import { useInfiniteEvents } from '@/hooks/api/use-events'
import type { Event } from '@/lib/api/events'
import { Ionicons } from '@expo/vector-icons'
import { router, useLocalSearchParams } from 'expo-router'
import { useCallback, useEffect } from 'react'
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

export default function EventsScreen() {
  const insets = useSafeAreaInsets()
  const { type } = useLocalSearchParams<{ type: EventListType }>()
  const meta = SCREEN_META[type ?? 'for-you']

  const { data, fetchNextPage, hasNextPage, isFetchingNextPage, isLoading, refetch, isRefetching } = useInfiniteEvents(
    meta.sortBy,
  )

  const events: Event[] = data?.pages.flatMap((page) => page) ?? []

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

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      handleBack()
      return true
    })
    return () => sub.remove()
  }, [handleBack])

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
          <View style={styles.headerSpacer} />
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
            contentContainerStyle={[styles.listContent, { paddingBottom: insets.bottom + 80 }]}
            showsVerticalScrollIndicator={false}
            onEndReached={() => {
              if (hasNextPage && !isFetchingNextPage) fetchNextPage()
            }}
            onEndReachedThreshold={0.4}
            refreshing={isRefetching}
            onRefresh={refetch}
            ListFooterComponent={
              isFetchingNextPage ? <ActivityIndicator color={Colors.accent} style={styles.footerLoader} /> : null
            }
            ListEmptyComponent={
              <View style={styles.empty}>
                <Ionicons name="calendar-outline" size={40} color={Colors.text3} />
                <Text style={styles.emptyText}>No events yet.</Text>
              </View>
            }
          />
        )}
      </Animated.View>
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
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    backgroundColor: Colors.bg,
  },
  backBtn: {
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
})
