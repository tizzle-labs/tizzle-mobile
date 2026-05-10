import { EventRow } from '@/components/event/EventRow'
import { BottomSheet, type BottomSheetRef } from '@/components/ui/BottomSheet'
import { Divider } from '@/components/ui/Divider'
import { Colors } from '@/constants/colors'
import { EVENT_CATEGORIES } from '@/constants/event-categories'
import { Fonts, LS, ls } from '@/constants/fonts'
import { Spacing } from '@/constants/spacing'
import { type SearchStatusFilter, useSearchEvents } from '@/hooks/api/use-search-events'
import { Ionicons } from '@expo/vector-icons'
import { router } from 'expo-router'
import { useEffect, useRef, useState } from 'react'
import {
  ActivityIndicator,
  FlatList,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

type SortBy = 'created_at' | 'start_time'

const SORT_OPTIONS: { label: string; sub: string; value: SortBy }[] = [
  { label: 'Newest First', sub: 'Recently created events', value: 'created_at' },
  { label: 'Soonest First', sub: 'Events happening soon', value: 'start_time' },
]

const STATUS_OPTIONS: { label: string; value: SearchStatusFilter }[] = [
  { label: 'All Status', value: null },
  { label: 'Available', value: 'Available' },
  { label: 'Ongoing', value: 'Ongoing' },
  { label: 'Ended', value: 'Ended' },
]

function OptionRow({
  label,
  sub,
  active,
  onPress,
}: {
  label: string
  sub?: string
  active: boolean
  onPress: () => void
}) {
  return (
    <TouchableOpacity style={s.optionRow} onPress={onPress} activeOpacity={0.7}>
      <View style={s.optionLabel}>
        <Text style={[s.optionText, active && s.optionTextActive]}>{label}</Text>
        {sub && <Text style={s.optionSub}>{sub}</Text>}
      </View>
      {active && <Ionicons name="checkmark" size={18} color={Colors.accent} />}
    </TouchableOpacity>
  )
}

export default function SearchScreen() {
  const insets = useSafeAreaInsets()
  const filterSheetRef = useRef<BottomSheetRef>(null)
  const sortSheetRef = useRef<BottomSheetRef>(null)

  const [query, setQuery] = useState('')
  const [debouncedQuery, setDebouncedQuery] = useState('')
  const [category, setCategory] = useState<string | null>(null)
  const [statusFilter, setStatusFilter] = useState<SearchStatusFilter>(null)
  const [sortBy, setSortBy] = useState<SortBy>('created_at')

  useEffect(() => {
    const t = setTimeout(() => setDebouncedQuery(query), 350)
    return () => clearTimeout(t)
  }, [query])

  const hasSearchIntent = debouncedQuery.trim().length > 0 || category !== null || statusFilter !== null
  const hasActiveFilters = category !== null || statusFilter !== null
  const hasActiveSort = sortBy !== 'created_at'

  const { events, isPending, isFetchingNextPage, fetchNextPage, hasNextPage } = useSearchEvents({
    query: debouncedQuery,
    category,
    statusFilter,
    sortBy,
  })

  return (
    <View style={[s.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn} hitSlop={12}>
          <Ionicons name="arrow-back" size={20} color={Colors.text1} />
        </TouchableOpacity>

        <View style={s.inputWrap}>
          <Ionicons name="search-outline" size={16} color={Colors.text3} />
          <TextInput
            style={s.input}
            placeholder="Search events, orgs, locations…"
            placeholderTextColor={Colors.text3}
            value={query}
            onChangeText={setQuery}
            autoFocus
            autoCapitalize="none"
            autoCorrect={false}
            returnKeyType="search"
            scrollEnabled={false}
          />
          {query.length > 0 && (
            <TouchableOpacity onPress={() => setQuery('')} hitSlop={8}>
              <Ionicons name="close-circle" size={16} color={Colors.text3} />
            </TouchableOpacity>
          )}
        </View>

        {/* Filter icon */}
        <TouchableOpacity
          style={s.iconBtn}
          onPress={() => filterSheetRef.current?.present()}
          hitSlop={8}
        >
          <Ionicons name="funnel-outline" size={20} color={hasActiveFilters ? Colors.accent : Colors.text1} />
          {hasActiveFilters && <View style={s.activeDot} />}
        </TouchableOpacity>

        {/* Sort icon */}
        <TouchableOpacity
          style={s.iconBtn}
          onPress={() => sortSheetRef.current?.present()}
          hitSlop={8}
        >
          <Ionicons name="swap-vertical-outline" size={20} color={hasActiveSort ? Colors.accent : Colors.text1} />
          {hasActiveSort && <View style={s.activeDot} />}
        </TouchableOpacity>
      </View>

      {/* Content */}
      {!hasSearchIntent ? (
        <View style={s.idle}>
          <Ionicons name="search-outline" size={40} color={Colors.text3} />
          <Text style={s.idleTitle}>Search Events</Text>
          <Text style={s.idleSub}>Search by event name, organization, or location</Text>
        </View>
      ) : isPending ? (
        <View style={s.center}>
          <ActivityIndicator color={Colors.accent} />
        </View>
      ) : (
        <FlatList
          data={events}
          keyExtractor={(item) => item.eventPda}
          renderItem={({ item }) => (
            <EventRow event={item} onPress={() => router.push(`/(modals)/event/${item.eventPda}`)} />
          )}
          contentContainerStyle={[s.list, { paddingBottom: insets.bottom + 40 }]}
          keyboardShouldPersistTaps="handled"
          onEndReached={() => {
            if (hasNextPage && !isFetchingNextPage) fetchNextPage()
          }}
          onEndReachedThreshold={0.3}
          ListHeaderComponent={
            events.length > 0 ? (
              <Text style={s.resultCount}>
                {events.length} result{events.length !== 1 ? 's' : ''}
              </Text>
            ) : null
          }
          ListFooterComponent={
            isFetchingNextPage ? (
              <ActivityIndicator color={Colors.accent} style={s.footerLoader} />
            ) : events.length > 0 ? (
              <Divider />
            ) : null
          }
          ListEmptyComponent={
            <View style={s.empty}>
              <Ionicons name="calendar-outline" size={40} color={Colors.text3} />
              <Text style={s.emptyTitle}>No events found</Text>
              <Text style={s.emptySub}>
                {debouncedQuery ? `No results for "${debouncedQuery}"` : 'Try adjusting your filters'}
              </Text>
            </View>
          }
        />
      )}

      {/* Filter bottom sheet */}
      <BottomSheet ref={filterSheetRef} title="Filter" scrollable snapPoints={['75%']}>
        <Text style={s.sheetSection}>Status</Text>
        {STATUS_OPTIONS.map((opt) => (
          <OptionRow
            key={String(opt.value)}
            label={opt.label}
            active={statusFilter === opt.value}
            onPress={() => setStatusFilter(opt.value)}
          />
        ))}

        <Text style={[s.sheetSection, { marginTop: Spacing.lg }]}>Category</Text>
        <OptionRow
          label="All Categories"
          active={category === null}
          onPress={() => setCategory(null)}
        />
        {EVENT_CATEGORIES.map((cat) => (
          <OptionRow
            key={cat.label}
            label={`${cat.icon}  ${cat.label}`}
            active={category === cat.label}
            onPress={() => setCategory(cat.label)}
          />
        ))}

        <TouchableOpacity
          style={s.resetBtn}
          onPress={() => { setStatusFilter(null); setCategory(null) }}
          activeOpacity={0.7}
        >
          <Ionicons name="refresh-outline" size={15} color={Colors.text2} />
          <Text style={s.resetText}>Reset Filters</Text>
        </TouchableOpacity>
      </BottomSheet>

      {/* Sort bottom sheet */}
      <BottomSheet ref={sortSheetRef} title="Sort by" dynamicSizing>
        {SORT_OPTIONS.map((opt) => (
          <OptionRow
            key={opt.value}
            label={opt.label}
            sub={opt.sub}
            active={sortBy === opt.value}
            onPress={() => setSortBy(opt.value)}
          />
        ))}

        <TouchableOpacity
          style={s.resetBtn}
          onPress={() => setSortBy('created_at')}
          activeOpacity={0.7}
        >
          <Ionicons name="refresh-outline" size={15} color={Colors.text2} />
          <Text style={s.resetText}>Reset Sort</Text>
        </TouchableOpacity>
      </BottomSheet>
    </View>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },

  // Header
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.surface2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  inputWrap: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.surface2,
    borderRadius: 12,
    paddingHorizontal: Spacing.sm,
    height: 48,
  },
  input: {
    flex: 1,
    fontFamily: Fonts.body,
    fontSize: 15,
    color: Colors.text1,
    paddingVertical: 0,
  },
  iconBtn: {
    width: 38,
    height: 38,
    alignItems: 'center',
    justifyContent: 'center',
    alignSelf: 'center',
  },
  activeDot: {
    position: 'absolute',
    top: 6,
    right: 6,
    width: 7,
    height: 7,
    borderRadius: 4,
    backgroundColor: Colors.accent,
    borderWidth: 1.5,
    borderColor: Colors.bg,
  },

  divider: { height: 1, backgroundColor: Colors.border },

  // Idle state
  idle: {
    alignItems: 'center',
    paddingTop: 80,
    gap: Spacing.sm,
    paddingHorizontal: Spacing.xl,
  },
  idleTitle: {
    fontFamily: Fonts.display,
    fontSize: 20,
    color: Colors.text2,
    letterSpacing: ls(20, LS.displaySubtle),
  },
  idleSub: {
    fontFamily: Fonts.body,
    fontSize: 13,
    color: Colors.text3,
    textAlign: 'center',
    lineHeight: 20,
  },

  // List
  list: { paddingHorizontal: Spacing.md },
  resultCount: {
    fontFamily: Fonts.mono,
    fontSize: 11,
    color: Colors.text3,
    letterSpacing: ls(11, LS.labelWide),
    paddingTop: Spacing.md,
    paddingBottom: Spacing.sm,
  },
  footerLoader: { paddingVertical: Spacing.lg },

  // Empty
  empty: { alignItems: 'center', justifyContent: 'center', paddingTop: 80, gap: Spacing.sm },
  emptyTitle: {
    fontFamily: Fonts.display,
    fontSize: 18,
    color: Colors.text2,
    letterSpacing: ls(18, LS.displaySubtle),
  },
  emptySub: {
    fontFamily: Fonts.body,
    fontSize: 13,
    color: Colors.text3,
    textAlign: 'center',
    maxWidth: 260,
    lineHeight: 20,
  },

  // Sheet content
  sheetSection: {
    fontFamily: Fonts.mono,
    fontSize: 10,
    color: Colors.text3,
    letterSpacing: ls(10, LS.labelWide),
    marginBottom: Spacing.sm,
  },
  optionRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingVertical: Spacing.sm + 2,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  optionLabel: { gap: 2 },
  optionText: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 15,
    color: Colors.text2,
  },
  optionTextActive: { color: Colors.text1 },
  optionSub: {
    fontFamily: Fonts.body,
    fontSize: 12,
    color: Colors.text3,
  },
  resetBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.xs,
    marginTop: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  resetText: {
    fontFamily: Fonts.bodyMedium,
    fontSize: 14,
    color: Colors.text2,
  },
})
