import { BottomSheet, type BottomSheetRef } from '@/components/ui/BottomSheet'
import { LoadingScreen } from '@/components/ui/LoadingScreen'
import { SolanaLogo } from '@/components/ui/SolanaLogo'
import { Image } from 'expo-image'
import { Colors } from '@/constants/colors'
import { Fonts, LS, ls } from '@/constants/fonts'
import { Spacing } from '@/constants/spacing'
import { useEventsByOrg } from '@/hooks/api/use-events'
import { useOrganization } from '@/hooks/api/use-my-organizations'
import type { Event } from '@/lib/api/events'
import { Ionicons } from '@expo/vector-icons'
import { router, useLocalSearchParams } from 'expo-router'
import { useRef, useMemo, useState } from 'react'
import { RefreshControl, ScrollView, StyleSheet, Text, TouchableOpacity, View, useWindowDimensions } from 'react-native'
import Svg, { G, Line, Rect, Text as SvgText } from 'react-native-svg'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

// ─── Chart ────────────────────────────────────────────────────────────────────

const PAD = { top: 8, right: 4, bottom: 36, left: 28 }
const CHART_H = 130
const BAR_REGISTERED = Colors.chain
const GRID_LINE = 'rgba(255,255,255,0.05)'
const AXIS_LINE = 'rgba(255,255,255,0.10)'

function AttendanceChart({ events, width }: { events: Event[]; width: number }) {
  const chartData = useMemo(
    () =>
      [...events]
        .sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime())
        .slice(0, 5)
        .reverse()
        .map((e) => ({
          label: e.title.slice(0, 8),
          registered: e.totalRegistered,
          checkedIn: e.totalCheckedIn,
        })),
    [events],
  )

  if (chartData.length === 0) return null

  const innerW = width - PAD.left - PAD.right
  const innerH = CHART_H
  const maxVal = Math.max(...chartData.flatMap((d) => [d.registered, d.checkedIn]), 1)
  const n = chartData.length
  const BAR_GAP = 4                        // gap between registered & checkedIn bars
  const GROUP_PAD = 6                      // space on each side of a group (between groups)
  const groupW = innerW / n
  const pairW = groupW - GROUP_PAD * 2    // usable width per group for the bar pair
  const barW = Math.max(6, (pairW - BAR_GAP) / 2)
  const yTicks = [0.5, 1]

  return (
    <Svg width={width} height={CHART_H + PAD.top + PAD.bottom}>
      <G x={PAD.left} y={PAD.top}>
        {/* Grid lines */}
        {yTicks.map((t) => {
          const y = innerH - t * innerH
          const val = Math.round(t * maxVal)
          return (
            <G key={t}>
              <Line x1={0} y1={y} x2={innerW} y2={y} stroke={GRID_LINE} strokeWidth={1} />
              <SvgText x={-5} y={y + 4} textAnchor="end" fontSize={8} fill={Colors.text2} fontFamily="GeistMono-Regular">
                {val}
              </SvgText>
            </G>
          )
        })}

        {/* Bars + labels (rendered before baseline so axis sits on top of bar bottoms) */}
        {chartData.map((d, i) => {
          const groupX = i * groupW + GROUP_PAD  // left edge of usable area in this group
          const cx = i * groupW + groupW / 2     // center of group for label
          const regH = maxVal > 0 ? (d.registered / maxVal) * innerH : 0
          const ciH = maxVal > 0 ? (d.checkedIn / maxVal) * innerH : 0
          const xReg = groupX
          const xCi = groupX + barW + BAR_GAP

          return (
            <G key={i}>
              <Rect x={xReg} y={innerH - regH} width={barW} height={Math.max(regH, 2)} fill={BAR_REGISTERED} rx={2} />
              <Rect x={xCi} y={innerH - ciH} width={barW} height={Math.max(ciH, 2)} fill={Colors.accent} rx={2} />
              <SvgText
                x={cx}
                y={innerH + 26}
                textAnchor="middle"
                fontSize={8}
                fill={Colors.text2}
                fontFamily="GeistMono-Regular"
              >
                {d.label}
              </SvgText>
            </G>
          )
        })}

        {/* Baseline on top so it covers rounded bar bottoms */}
        <Line x1={0} y1={innerH} x2={innerW} y2={innerH} stroke={AXIS_LINE} strokeWidth={1} />
      </G>
    </Svg>
  )
}

// ─── Stat Grid ────────────────────────────────────────────────────────────────

type StatCell = { label: string; value: string; sub?: string; accent?: boolean; chain?: boolean; solIcon?: boolean }

const COLS = 3

function StatGrid({ cells }: { cells: StatCell[] }) {
  const totalRows = Math.ceil(cells.length / COLS)
  return (
    <View style={s.statGrid}>
      {cells.map((cell, i) => {
        const col = i % COLS
        const row = Math.floor(i / COLS)
        const valueColor = cell.chain ? Colors.chain : cell.accent ? Colors.accent : Colors.text1
        return (
          <View
            key={i}
            style={[
              s.statGridCell,
              col < COLS - 1 && s.statGridCellRight,
              row < totalRows - 1 && s.statGridCellBottom,
            ]}
          >
            <Text style={s.statGridLabel}>{cell.label}</Text>
            {cell.solIcon ? (
              <View style={s.statGridValueRow}>
                <SolanaLogo size={14} />
                <Text style={[s.statGridValue, { color: valueColor }]}>{cell.value}</Text>
              </View>
            ) : (
              <Text style={[s.statGridValue, { color: valueColor }]}>{cell.value}</Text>
            )}
            {cell.sub && <Text style={s.statGridSub}>{cell.sub}</Text>}
          </View>
        )
      })}
    </View>
  )
}

// ─── Event Performance Row ────────────────────────────────────────────────────

const PERF_PAGE_SIZE = 5

function formatDate(iso: string) {
  const d = new Date(iso)
  return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function formatDateOnly(iso: string) {
  return new Date(iso).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })
}

function formatTimeOnly(iso: string) {
  return new Date(iso).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })
}

// ─── Event Performance Sheet ──────────────────────────────────────────────────


function DtChip({ icon, value }: { icon: 'calendar-outline' | 'time-outline'; value: string }) {
  return (
    <View style={sh.dtChip}>
      <Ionicons name={icon} size={12} color={Colors.text2} />
      <Text style={sh.dtChipText}>{value}</Text>
    </View>
  )
}

function EventPerfSheet({ event, onClose }: { event: Event; onClose: () => void }) {
  const stake = Number(event.stakeAmount) / Math.pow(10, event.stakeTokenDecimals)
  const rate = event.totalRegistered > 0 ? Math.round((event.totalCheckedIn / event.totalRegistered) * 100) : 0
  const rateColor = rate >= 75 ? Colors.accent : rate >= 50 ? Colors.warning : Colors.error

  return (
    <View style={sh.container}>
      {/* Cover */}
      {event.imageUrl ? (
        <Image source={{ uri: event.imageUrl }} style={sh.cover} contentFit="cover" />
      ) : (
        <View style={[sh.cover, sh.coverFallback]}>
          <Ionicons name="calendar-outline" size={40} color={Colors.border2} />
        </View>
      )}

      {/* Title */}
      <Text style={sh.title} numberOfLines={1}>{event.title}</Text>

      {/* Stats row */}
      <View style={sh.statsRow}>
        <View style={sh.statBox}>
          <Text style={sh.statBoxValue}>{event.totalRegistered}</Text>
          <Text style={sh.statBoxLabel}>REGISTERED</Text>
        </View>
        <View style={[sh.statBox, sh.statBoxMid]}>
          <Text style={sh.statBoxValue}>{event.totalCheckedIn}</Text>
          <Text style={sh.statBoxLabel}>ATTENDED</Text>
        </View>
        <View style={sh.statBox}>
          <Text style={[sh.statBoxValue, { color: rateColor }]}>{rate}%</Text>
          <Text style={sh.statBoxLabel}>RATE</Text>
        </View>
      </View>

      {/* Date/Time — create event style */}
      <View style={sh.card}>
        {/* Start */}
        <View style={sh.dtRow}>
          <View style={sh.dtLeft}>
            <View style={sh.dtDotFilled} />
            <Text style={sh.dtLabel}>Start</Text>
          </View>
          <View style={sh.dtChips}>
            <DtChip icon="calendar-outline" value={formatDateOnly(event.startTime)} />
            <DtChip icon="time-outline" value={formatTimeOnly(event.startTime)} />
          </View>
        </View>
        <View style={sh.dtConnector}>
          <View style={sh.dtConnectorSpacer} />
          <View style={sh.dtConnectorLine} />
        </View>
        {/* End */}
        <View style={sh.dtRow}>
          <View style={sh.dtLeft}>
            <View style={sh.dtDotEmpty} />
            <Text style={sh.dtLabel}>End</Text>
          </View>
          <View style={sh.dtChips}>
            <DtChip icon="calendar-outline" value={formatDateOnly(event.endTime)} />
            <DtChip icon="time-outline" value={formatTimeOnly(event.endTime)} />
          </View>
        </View>
        <View style={sh.dtConnector}>
          <View style={sh.dtConnectorSpacer} />
          <View style={sh.dtConnectorLine} />
        </View>
        {/* Unlock */}
        <View style={sh.dtRow}>
          <View style={sh.dtLeft}>
            <View style={sh.dtDotDim} />
            <Text style={[sh.dtLabel, { color: Colors.text3 }]}>Unlock</Text>
          </View>
          <View style={sh.dtChips}>
            <DtChip icon="calendar-outline" value={formatDateOnly(event.unlockTime)} />
            <DtChip icon="time-outline" value={formatTimeOnly(event.unlockTime)} />
          </View>
        </View>
      </View>

      {/* Financial — icon row style */}
      <View style={sh.card}>
        <View style={sh.iconRow}>
          <Ionicons name="wallet-outline" size={16} color={Colors.text3} style={sh.rowIcon} />
          <Text style={sh.rowLabel}>Deposit</Text>
          <View style={sh.rowRight}>
            <SolanaLogo size={13} />
            <Text style={[sh.rowValue, { color: Colors.chain }]}>{stake.toFixed(2)} {event.stakeTokenSymbol}</Text>
          </View>
        </View>
        <View style={sh.cardDivider} />
        <View style={sh.iconRow}>
          <Ionicons name="receipt-outline" size={16} color={Colors.text3} style={sh.rowIcon} />
          <Text style={sh.rowLabel}>Host Fee</Text>
          <Text style={[sh.rowValue, !event.hostFeeEnabled && { color: Colors.accent }]}>
            {event.hostFeeEnabled ? `${event.hostFeePercent}%` : 'Free'}
          </Text>
        </View>
      </View>

      {/* CTA */}
      <TouchableOpacity
        style={sh.ctaBtn}
        onPress={() => { onClose(); router.push(`/(modals)/event/${event.eventPda}`) }}
        activeOpacity={0.85}
      >
        <Text style={sh.ctaText}>View Event</Text>
        <Ionicons name="arrow-forward" size={16} color={Colors.bg} />
      </TouchableOpacity>
    </View>
  )
}

function EventStatRow({ event, onPress }: { event: Event; onPress: () => void }) {
  const totalRegistered = event.totalRegistered
  const totalCheckedIn = event.totalCheckedIn
  const rate = totalRegistered > 0 ? Math.round((totalCheckedIn / totalRegistered) * 100) : 0
  const stake = Number(event.stakeAmount) / Math.pow(10, event.stakeTokenDecimals)
  const totalStake = stake * event.totalRegistered
  const rateColor = rate >= 75 ? Colors.accent : rate >= 50 ? Colors.warning : Colors.error

  return (
    <TouchableOpacity
      style={s.eventRow}
      onPress={onPress}
      activeOpacity={0.75}
    >
      <View style={s.eventRowInner}>
        {/* Cover thumbnail */}
        {event.imageUrl ? (
          <Image source={{ uri: event.imageUrl }} style={s.eventCover} contentFit="cover" />
        ) : (
          <View style={[s.eventCover, s.eventCoverFallback]}>
            <Ionicons name="calendar-outline" size={22} color={Colors.border2} />
          </View>
        )}

        {/* Content */}
        <View style={s.eventRowContent}>
          {/* Title + rate */}
          <View style={s.eventRowTop}>
            <Text style={s.eventRowTitle} numberOfLines={1}>{event.title}</Text>
            <Text style={[s.eventRowRate, { color: rateColor }]}>{rate}%</Text>
          </View>

          {/* Progress bar */}
          <View style={s.progressTrack}>
            <View style={[s.progressFill, { width: `${rate}%` as any, backgroundColor: rateColor }]} />
          </View>

          {/* Meta */}
          <View style={s.eventRowMeta}>
            <View style={s.metaChip}>
              <Ionicons name="calendar-outline" size={12} color={Colors.text2} />
              <Text style={s.metaText}>{formatDate(event.startTime)}</Text>
            </View>
            <View style={s.metaChip}>
              <Ionicons name="people-outline" size={12} color={Colors.text2} />
              <Text style={s.metaText}>{totalCheckedIn}/{totalRegistered} attended</Text>
            </View>
            <View style={s.metaChip}>
              <Ionicons name="wallet-outline" size={12} color={Colors.text2} />
              <Text style={s.metaText}>{totalStake.toFixed(2)} {event.stakeTokenSymbol}</Text>
            </View>
          </View>
        </View>
      </View>
    </TouchableOpacity>
  )
}

// ─── Screen ───────────────────────────────────────────────────────────────────

export default function OrgManageScreen() {
  const insets = useSafeAreaInsets()
  const { organizationPda } = useLocalSearchParams<{ organizationPda: string }>()
  const { data: org, isLoading: orgLoading } = useOrganization(organizationPda)
  const { data: events = [], isLoading: eventsLoading, refetch, isRefetching } = useEventsByOrg(organizationPda)
  const { width: screenW } = useWindowDimensions()
  const [refreshing, setRefreshing] = useState(false)
  const [perfPage, setPerfPage] = useState(1)
  const [selectedEvent, setSelectedEvent] = useState<Event | null>(null)
  const sheetRef = useRef<BottomSheetRef>(null)

  function handleEventPress(event: Event) {
    setSelectedEvent(event)
    sheetRef.current?.present()
  }

  const chartWidth = screenW - Spacing.md * 2 - Spacing.md * 2

  async function handleRefresh() {
    setRefreshing(true)
    await refetch()
    setRefreshing(false)
  }

  const stats = useMemo(() => {
    const totalRegistered = events.reduce((s, e) => s + e.totalRegistered, 0)
    const totalCheckedIn = events.reduce((s, e) => s + e.totalCheckedIn, 0)
    const totalStake = events.reduce((s, e) => {
      const stake = Number(e.stakeAmount) / Math.pow(10, e.stakeTokenDecimals)
      return s + stake * e.totalRegistered
    }, 0)
    const avgRate = totalRegistered > 0 ? Math.round((totalCheckedIn / totalRegistered) * 100) : 0
    const stakeSymbol = events[0]?.stakeTokenSymbol ?? 'SOL'
    const thisMonth = events.filter((e) => {
      const d = new Date(e.startTime)
      const now = new Date()
      return d.getMonth() === now.getMonth() && d.getFullYear() === now.getFullYear()
    }).length
    return { totalRegistered, totalCheckedIn, totalStake, avgRate, stakeSymbol, thisMonth }
  }, [events])

  const sortedEvents = useMemo(
    () => [...events].sort((a, b) => new Date(b.startTime).getTime() - new Date(a.startTime).getTime()),
    [events],
  )

  if (orgLoading || eventsLoading) return <LoadingScreen />

  return (
    <View style={s.container}>
      <View style={[s.header, { paddingTop: insets.top + Spacing.sm }]}>
        <TouchableOpacity onPress={() => router.back()} style={s.iconBtn} hitSlop={12}>
          <Ionicons name="arrow-back" size={20} color={Colors.text1} />
        </TouchableOpacity>
        <View style={s.headerCenter}>
          {org && (
            <View style={s.headerOrg}>
              {org.avatarUrl ? (
                <Image source={{ uri: org.avatarUrl }} style={s.headerAvatar} contentFit="cover" />
              ) : (
                <View style={[s.headerAvatar, s.headerAvatarFallback]}>
                  <Ionicons name="business-outline" size={12} color={Colors.text3} />
                </View>
              )}
              <Text style={s.headerOrgName} numberOfLines={1}>{org.name}</Text>
            </View>
          )}
        </View>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView
        style={s.scroll}
        contentContainerStyle={[s.content, { paddingBottom: insets.bottom + 48 }]}
        showsVerticalScrollIndicator={false}
        refreshControl={
          <RefreshControl
            refreshing={refreshing || isRefetching}
            onRefresh={handleRefresh}
            tintColor={Colors.accent}
            colors={[Colors.accent]}
            progressBackgroundColor={Colors.bg}
          />
        }
      >
        {/* ── Overview ─────────────────────────────────────── */}
        <View style={s.section}>
          <Text style={s.sectionLabel}>OVERVIEW</Text>
          <StatGrid
            cells={[
              { label: 'Events', value: String(events.length) },
              { label: 'Registered', value: String(stats.totalRegistered) },
              { label: 'Attended', value: String(stats.totalCheckedIn) },
              { label: 'Att. Rate', value: `${stats.avgRate}%`, accent: stats.avgRate >= 75 },
              { label: 'Total Staked', value: stats.totalStake.toFixed(2), chain: true, solIcon: true },
              { label: 'This Month', value: String(stats.thisMonth) },
            ]}
          />
        </View>

        {/* ── Attendance Chart ──────────────────────────────── */}
        {events.length > 0 && (
          <View style={s.section}>
            <Text style={s.sectionLabel}>LAST {Math.min(events.length, 5)} EVENTS</Text>
            <View style={s.card}>
              <AttendanceChart events={events} width={chartWidth} />
              <View style={s.legend}>
                <View style={s.legendItem}>
                  <View style={[s.legendDot, { backgroundColor: BAR_REGISTERED }]} />
                  <Text style={s.legendText}>Registered</Text>
                </View>
                <View style={s.legendItem}>
                  <View style={[s.legendDot, { backgroundColor: Colors.accent }]} />
                  <Text style={s.legendText}>Checked In</Text>
                </View>
              </View>
            </View>
          </View>
        )}

        {/* ── Event Performance ─────────────────────────────── */}
        {sortedEvents.length > 0 && (
          <View style={s.section}>
            <View style={s.perfHeader}>
              <Text style={s.sectionLabel}>EVENT PERFORMANCE</Text>
              <Text style={s.perfCount}>
                {Math.min(perfPage * PERF_PAGE_SIZE, sortedEvents.length)}/{sortedEvents.length}
              </Text>
            </View>
            <View style={s.eventList}>
              {sortedEvents.slice(0, perfPage * PERF_PAGE_SIZE).map((event) => (
                <EventStatRow key={event.eventPda} event={event} onPress={() => handleEventPress(event)} />
              ))}
            </View>
            {sortedEvents.length > perfPage * PERF_PAGE_SIZE && (
              <TouchableOpacity style={s.loadMoreBtn} onPress={() => setPerfPage((p) => p + 1)} activeOpacity={0.7}>
                <Text style={s.loadMoreText}>Load More</Text>
                <Ionicons name="chevron-down" size={13} color={Colors.text2} />
              </TouchableOpacity>
            )}
          </View>
        )}

        {events.length === 0 && (
          <View style={s.empty}>
            <Ionicons name="bar-chart-outline" size={36} color={Colors.text3} />
            <Text style={s.emptyTitle}>No events yet</Text>
            <Text style={s.emptyBody}>Create your first event to see analytics here.</Text>
          </View>
        )}
      </ScrollView>

      <BottomSheet ref={sheetRef} scrollable dynamicSizing onDismiss={() => setSelectedEvent(null)}>
        {selectedEvent && <EventPerfSheet event={selectedEvent} onClose={() => sheetRef.current?.dismiss()} />}
      </BottomSheet>
    </View>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  scroll: { flex: 1 },
  content: { paddingHorizontal: Spacing.md, paddingTop: Spacing.sm, gap: Spacing.xl },

  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.sm,
    backgroundColor: Colors.bg,
  },
  iconBtn: {
    width: 38,
    height: 38,
    borderRadius: 19,
    backgroundColor: Colors.surface2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerCenter: { flex: 1, alignItems: 'center' },
  headerOrg: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.xs,
    maxWidth: '100%',
  },
  headerAvatar: {
    width: 26,
    height: 26,
    borderRadius: 7,
  },
  headerAvatarFallback: {
    backgroundColor: Colors.surface2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerOrgName: {
    fontFamily: Fonts.display,
    fontSize: 16,
    color: Colors.text1,
    letterSpacing: ls(16, LS.displaySubtle),
    flexShrink: 1,
  },

  section: { gap: Spacing.sm },
  sectionLabel: {
    fontFamily: Fonts.mono,
    fontSize: 11,
    color: Colors.text2,
    letterSpacing: ls(11, LS.labelWide),
  },

  // Stat grid
  statGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  statGridCell: {
    width: '33.33%',
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.sm,
    gap: 6,
  },
  statGridCellRight: {
    borderRightWidth: 1,
    borderRightColor: Colors.border,
  },
  statGridCellBottom: {
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  statGridLabel: {
    fontFamily: Fonts.mono,
    fontSize: 9,
    color: Colors.text2,
    letterSpacing: ls(9, LS.labelWide),
  },
  statGridValue: {
    fontFamily: Fonts.display,
    fontSize: 20,
    color: Colors.text1,
    letterSpacing: ls(20, LS.display),
    lineHeight: 24,
  },
  statGridValueRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 6,
  },
  statGridSub: {
    fontFamily: Fonts.mono,
    fontSize: 9,
    color: Colors.text3,
    letterSpacing: ls(9, LS.labelWide),
  },

  // Chart card
  card: {
    borderRadius: 12,
    paddingVertical: Spacing.sm,
    gap: Spacing.sm,
  },
  legend: { flexDirection: 'row', gap: Spacing.md, paddingLeft: 2 },
  legendItem: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  legendDot: { width: 8, height: 8, borderRadius: 4 },
  legendText: { fontFamily: Fonts.mono, fontSize: 10, color: Colors.text2 },

  // Event performance
  perfHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
  },
  perfCount: {
    fontFamily: Fonts.mono,
    fontSize: 9,
    color: Colors.text3,
    letterSpacing: ls(9, LS.labelWide),
  },
  eventList: { gap: Spacing.sm },
  eventRow: {
    backgroundColor: Colors.surface2,
    borderRadius: 12,
    padding: Spacing.sm,
  },
  eventRowInner: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  eventCover: {
    width: 64,
    height: 64,
    borderRadius: 8,
  },
  eventCoverFallback: {
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },
  eventRowContent: {
    flex: 1,
    gap: 6,
  },
  eventRowTop: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  eventRowTitle: {
    fontFamily: Fonts.display,
    fontSize: 14,
    color: Colors.text1,
    letterSpacing: ls(14, LS.displaySubtle),
    flex: 1,
  },
  eventRowRate: {
    fontFamily: Fonts.mono,
    fontSize: 14,
    letterSpacing: ls(14, LS.label),
  },
  progressTrack: {
    height: 4,
    borderRadius: 2,
    backgroundColor: Colors.border,
    overflow: 'hidden',
  },
  progressFill: { height: 4, borderRadius: 2 },
  eventRowMeta: { flexDirection: 'row', gap: Spacing.md, flexWrap: 'wrap' },
  metaChip: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  metaText: { fontFamily: Fonts.mono, fontSize: 11, color: Colors.text1 },
  loadMoreBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 4,
    paddingVertical: Spacing.sm,
  },
  loadMoreText: {
    fontFamily: Fonts.mono,
    fontSize: 11,
    color: Colors.text2,
    letterSpacing: ls(11, LS.labelWide),
  },

  // Empty
  empty: { alignItems: 'center', paddingTop: 60, gap: Spacing.sm },
  emptyTitle: {
    fontFamily: Fonts.display,
    fontSize: 18,
    color: Colors.text2,
    letterSpacing: ls(18, LS.displaySubtle),
  },
  emptyBody: { fontFamily: Fonts.body, fontSize: 13, color: Colors.text3, textAlign: 'center' },
})

// ─── Sheet Styles ─────────────────────────────────────────────────────────────

const sh = StyleSheet.create({
  container: { gap: Spacing.lg, paddingBottom: Spacing.sm },

  cover: {
    width: '100%',
    aspectRatio: 16 / 9,
    borderRadius: 12,
    overflow: 'hidden',
  },
  coverFallback: {
    backgroundColor: Colors.surface,
    alignItems: 'center',
    justifyContent: 'center',
  },

  title: {
    fontFamily: Fonts.display,
    fontSize: 22,
    color: Colors.text1,
    letterSpacing: ls(22, LS.display),
    lineHeight: 28,
  },

  // Stats
  statsRow: {
    flexDirection: 'row',
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  statBox: { flex: 1, paddingVertical: Spacing.md, alignItems: 'center', gap: 4 },
  statBoxMid: { borderLeftWidth: 1, borderRightWidth: 1, borderColor: Colors.border },
  statBoxValue: {
    fontFamily: Fonts.display,
    fontSize: 22,
    color: Colors.text1,
    letterSpacing: ls(22, LS.display),
  },
  statBoxLabel: {
    fontFamily: Fonts.mono,
    fontSize: 9,
    color: Colors.text2,
    letterSpacing: ls(9, LS.labelWide),
  },

  // Card (same as create event)
  card: {
    backgroundColor: Colors.surface,
    borderRadius: 16,
    paddingHorizontal: Spacing.md,
  },
  cardDivider: { height: 1, backgroundColor: Colors.border, marginLeft: 42 },

  // DateTime rows — mirrors create event styles exactly
  dtRow: { flexDirection: 'row', alignItems: 'center', paddingVertical: 12, gap: 10 },
  dtLeft: { flexDirection: 'row', alignItems: 'center', gap: 6, minWidth: 72 },
  dtDotFilled: { width: 10, height: 10, borderRadius: 5, backgroundColor: Colors.text2 },
  dtDotEmpty: {
    width: 10, height: 10, borderRadius: 5,
    borderWidth: 2, borderColor: Colors.text2, backgroundColor: 'transparent',
  },
  dtDotDim: {
    width: 10, height: 10, borderRadius: 5,
    borderWidth: 2, borderColor: Colors.text3, backgroundColor: 'transparent',
  },
  dtConnector: { flexDirection: 'row', alignItems: 'center', height: 10 },
  dtConnectorSpacer: { width: 4 },
  dtConnectorLine: {
    width: 0, height: 10,
    borderLeftWidth: 2, borderLeftColor: Colors.border2,
    borderStyle: 'dashed', marginLeft: 3,
  },
  dtLabel: { fontFamily: Fonts.bodyMedium, fontSize: 14, color: Colors.text2 },
  dtChips: { flexDirection: 'row', gap: 6, flex: 1, justifyContent: 'flex-end' },
  dtChip: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    backgroundColor: Colors.surface2, borderRadius: 8,
    paddingHorizontal: 10, paddingVertical: 7,
  },
  dtChipText: { fontFamily: Fonts.bodyMedium, fontSize: 12, color: Colors.text1 },

  // Icon rows — mirrors create event styles exactly
  iconRow: {
    flexDirection: 'row', alignItems: 'center',
    paddingVertical: 16, gap: 12, minHeight: 54,
  },
  rowIcon: { width: 18 },
  rowLabel: { flex: 1, fontFamily: Fonts.body, fontSize: 15, color: Colors.text2 },
  rowRight: { flexDirection: 'row', alignItems: 'center', gap: 5 },
  rowValue: { fontFamily: Fonts.body, fontSize: 15, color: Colors.text1 },

  ctaBtn: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: Spacing.sm,
    backgroundColor: Colors.accent,
    borderRadius: 14,
    paddingVertical: 14,
  },
  ctaText: {
    fontFamily: Fonts.display,
    fontSize: 15,
    color: Colors.bg,
    letterSpacing: ls(15, LS.displaySubtle),
  },
})
