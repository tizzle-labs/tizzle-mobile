import { EventMap } from '@/components/event/EventMap'
import { Button } from '@/components/ui/Button'
import { Colors } from '@/constants/colors'
import { EVENT_CATEGORIES } from '@/constants/event-categories'
import { Fonts, LS, ls } from '@/constants/fonts'
import { Spacing } from '@/constants/spacing'
import { confirmEventCreation, getEventPreview } from '@/lib/event-preview-store'
import { Ionicons } from '@expo/vector-icons'
import BottomSheet, { BottomSheetScrollView } from '@gorhom/bottom-sheet'
import { Image } from 'expo-image'
import { router } from 'expo-router'
import { useMemo, useRef, useState, useCallback } from 'react'
import { Dimensions, LayoutChangeEvent, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { GestureHandlerRootView } from 'react-native-gesture-handler'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

const { width, height } = Dimensions.get('window')
const HERO_H = height * 0.48

function fmtDate(d: Date) {
  return d.toLocaleDateString('en-US', { weekday: 'short', month: 'long', day: 'numeric', year: 'numeric' })
}
function fmtTime(d: Date) {
  return d.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
}
function stripHtml(html: string) {
  return html.replace(/<[^>]*>/g, ' ').replace(/\s+/g, ' ').trim()
}

export default function EventPreview() {
  const insets = useSafeAreaInsets()
  const data = getEventPreview()
  const bottomSheetRef = useRef<BottomSheet>(null)
  const snapPoints = useMemo(() => ['55%', '90%'], [])
  const [ctaHeight, setCtaHeight] = useState(100)
  const [isCreating, setIsCreating] = useState(false)

  const handleCreate = useCallback(async () => {
    setIsCreating(true)
    const success = await confirmEventCreation()
    if (success) {
      router.back()
    } else {
      setIsCreating(false)
    }
  }, [])

  if (!data) {
    router.back()
    return null
  }

  const categoryEntry = EVENT_CATEGORIES.find((c) => c.label === data.category)
  const categoryDisplay = categoryEntry ? `${categoryEntry.icon} ${categoryEntry.label}` : '🌐 Others'
  const capacityDisplay = data.capacity >= 10000 ? 'Unlimited' : `${data.capacity}`
  const descriptionText = stripHtml(data.description)

  return (
    <GestureHandlerRootView style={s.container}>
      {/* Hero */}
      {data.imageUri ? (
        <Image source={{ uri: data.imageUri }} style={s.hero} contentFit="cover" />
      ) : (
        <View style={s.heroPlaceholder} />
      )}

      {/* Floating back */}
      <View style={[s.floatRow, { top: insets.top + Spacing.sm }]}>
        <TouchableOpacity onPress={() => router.back()} style={s.floatBtn} hitSlop={8}>
          <Ionicons name="arrow-back" size={20} color={Colors.text1} />
        </TouchableOpacity>
        <View style={[s.floatBtn, s.draftBadge]}>
          <Text style={s.draftText}>PREVIEW</Text>
        </View>
      </View>

      <BottomSheet
        ref={bottomSheetRef}
        index={0}
        snapPoints={snapPoints}
        enablePanDownToClose={false}
        enableOverDrag={false}
        backgroundStyle={s.sheetBg}
        handleIndicatorStyle={s.handle}
      >
        <BottomSheetScrollView
          contentContainerStyle={[s.sheetContent, { paddingBottom: ctaHeight + Spacing.md }]}
          showsVerticalScrollIndicator={false}
        >
          {/* Title */}
          <Text style={s.title} numberOfLines={3}>
            {data.title}
          </Text>

          {/* Org */}
          <View style={s.orgInlineRow}>
            {data.organizationAvatarUrl ? (
              <Image source={{ uri: data.organizationAvatarUrl }} style={s.orgInlineAvatar} contentFit="cover" />
            ) : (
              <View style={s.orgInlineAvatarFallback}>
                <Ionicons name="business-outline" size={11} color={Colors.text3} />
              </View>
            )}
            <Text style={s.orgInlineName} numberOfLines={1}>
              {data.organizationName}
            </Text>
          </View>

          {/* Date + time */}
          <View style={s.metaRow}>
            <Ionicons name="calendar-outline" size={16} color={Colors.text3} />
            <Text style={s.metaText}>{fmtDate(data.startTime)}</Text>
            <Text style={s.metaDot}>·</Text>
            <Ionicons name="time-outline" size={16} color={Colors.text3} />
            <Text style={s.metaText}>
              {fmtTime(data.startTime)} - {fmtTime(data.endTime)}
            </Text>
          </View>

          {/* Location */}
          <View style={[s.metaRow, { alignItems: 'flex-start' }]}>
            <Ionicons name="location-outline" size={16} color={Colors.text3} style={{ marginTop: 2 }} />
            <View style={{ flex: 1 }}>
              <Text style={s.metaText}>{data.location}</Text>
              {!!data.locationDetail && <Text style={s.metaSubText}>{data.locationDetail}</Text>}
            </View>
          </View>

          {/* Map */}
          {data.latitude && data.longitude ? (
            <EventMap latitude={data.latitude} longitude={data.longitude} locationText={data.location} />
          ) : (
            <View style={s.mapPlaceholder}>
              <Ionicons name="map-outline" size={24} color={Colors.text3} />
              <Text style={s.mapText}>Map unavailable</Text>
            </View>
          )}

          {/* Venue */}
          {!!data.venueImageUri && (
            <View style={s.section}>
              <Text style={s.sectionTitle}>Venue</Text>
              <Image source={{ uri: data.venueImageUri }} style={s.venueImage} contentFit="cover" />
            </View>
          )}

          {/* Details */}
          <View style={s.section}>
            <Text style={s.sectionTitle}>Details</Text>
            <View style={s.detailGrid}>
              <View style={s.detailRow}>
                <View style={s.detailCard}>
                  <Text style={s.detailLabel}>CAPACITY</Text>
                  <Text style={s.detailValue}>{capacityDisplay}</Text>
                  <Text style={s.detailSub}>tickets</Text>
                </View>
                <View style={s.detailCard}>
                  <Text style={s.detailLabel}>CATEGORY</Text>
                  <Text style={s.detailValue}>{categoryDisplay}</Text>
                </View>
              </View>
              <View style={s.detailCardWide}>
                <Text style={s.detailLabel}>STAKE REQUIRED</Text>
                <Text style={s.stakeValue}>
                  {data.stakeAmount} {data.stakeTokenSymbol}
                </Text>
                <Text style={s.detailSub}>
                  {data.hostFeeEnabled
                    ? `${data.hostFeePercent}% host fee · remainder returned after check-in`
                    : 'locked on-chain · returned after check-in'}
                </Text>
              </View>
            </View>
          </View>

          {/* About */}
          {!!descriptionText && (
            <View style={s.section}>
              <Text style={s.sectionTitle}>About</Text>
              <Text style={s.description}>{descriptionText}</Text>
            </View>
          )}
        </BottomSheetScrollView>
      </BottomSheet>

      {/* Pinned CTA */}
      <View
        style={[s.cta, { paddingBottom: insets.bottom + Spacing.sm }]}
        onLayout={(e: LayoutChangeEvent) => setCtaHeight(e.nativeEvent.layout.height)}
      >
        <Button variant="secondary" onPress={() => router.back()} disabled={isCreating}>
          Back
        </Button>
        <Button onPress={handleCreate} loading={isCreating} disabled={isCreating}>
          {isCreating ? 'Creating on Solana…' : 'Create Event'}
        </Button>
      </View>
    </GestureHandlerRootView>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  hero: { position: 'absolute', top: 0, left: 0, width, height: HERO_H },
  heroPlaceholder: { position: 'absolute', top: 0, left: 0, width, height: HERO_H, backgroundColor: Colors.surface2 },

  floatRow: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    zIndex: 10,
  },
  floatBtn: {
    height: 38,
    borderRadius: 19,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 12,
  },
  draftBadge: { paddingHorizontal: 14 },
  draftText: {
    fontFamily: Fonts.mono,
    fontSize: 11,
    color: Colors.accent,
    letterSpacing: ls(11, LS.labelNarrow),
  },

  sheetBg: { backgroundColor: Colors.surface, borderTopLeftRadius: 28, borderTopRightRadius: 28 },
  handle: { backgroundColor: Colors.border2, width: 36, height: 4 },
  sheetContent: { paddingHorizontal: Spacing.md, paddingTop: Spacing.md, gap: Spacing.md },

  title: {
    fontFamily: Fonts.display,
    fontSize: 26,
    color: Colors.text1,
    letterSpacing: ls(26, LS.display),
    lineHeight: 32,
  },

  orgInlineRow: { flexDirection: 'row', alignItems: 'center', gap: 7 },
  orgInlineAvatar: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Colors.surface2,
    borderWidth: 1,
    borderColor: Colors.border2,
  },
  orgInlineAvatarFallback: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: Colors.surface2,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 1,
    borderColor: Colors.border2,
  },
  orgInlineName: { fontFamily: Fonts.bodyMedium, fontSize: 13, color: Colors.text2, flex: 1 },

  metaRow: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  metaText: { fontFamily: Fonts.bodyMedium, fontSize: 13, color: Colors.text1 },
  metaSubText: { fontFamily: Fonts.body, fontSize: 12, color: Colors.text2, marginTop: 2 },
  metaDot: { color: Colors.text3, fontSize: 13 },

  mapPlaceholder: {
    height: 120,
    backgroundColor: Colors.surface2,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    alignItems: 'center',
    justifyContent: 'center',
    gap: 8,
  },
  mapText: { fontFamily: Fonts.body, fontSize: 13, color: Colors.text3 },

  section: { gap: Spacing.sm },
  sectionTitle: {
    fontFamily: Fonts.display,
    fontSize: 16,
    color: Colors.text2,
    letterSpacing: ls(16, LS.displaySubtle),
  },

  venueImage: { width: '100%', height: 180, borderRadius: 12 },

  detailGrid: { gap: Spacing.sm },
  detailRow: { flexDirection: 'row', gap: Spacing.sm },
  detailCard: {
    flex: 1,
    backgroundColor: Colors.surface2,
    borderRadius: 12,
    padding: Spacing.md,
    gap: 4,
  },
  detailCardWide: {
    backgroundColor: Colors.surface2,
    borderRadius: 12,
    padding: Spacing.md,
    gap: 4,
  },
  detailLabel: {
    fontFamily: Fonts.mono,
    fontSize: 10,
    color: Colors.text3,
    letterSpacing: ls(10, LS.labelWide),
    textTransform: 'uppercase',
  },
  detailValue: {
    fontFamily: Fonts.display,
    fontSize: 18,
    color: Colors.text1,
    letterSpacing: ls(18, LS.displaySubtle),
  },
  detailSub: { fontFamily: Fonts.body, fontSize: 11, color: Colors.text3 },
  stakeValue: {
    fontFamily: Fonts.display,
    fontSize: 28,
    color: Colors.accent,
    letterSpacing: ls(28, LS.displayTight),
    lineHeight: 34,
  },

  description: { fontFamily: Fonts.body, fontSize: 14, color: Colors.text1, lineHeight: 22 },

  cta: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
    backgroundColor: Colors.surface2,
    gap: Spacing.sm,
  },
})
