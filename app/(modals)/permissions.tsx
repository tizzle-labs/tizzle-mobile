import { Colors } from '@/constants/colors'
import { Fonts, LS, ls } from '@/constants/fonts'
import { Spacing } from '@/constants/spacing'
import { Ionicons } from '@expo/vector-icons'
import { useCameraPermissions } from 'expo-camera'
import * as ImagePicker from 'expo-image-picker'
import { router } from 'expo-router'
import { useEffect, useState } from 'react'
import { AppState, Linking, Platform, ScrollView, StyleSheet, Switch, Text, TouchableOpacity, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

type PermStatus = 'granted' | 'denied' | 'undetermined'

interface PermissionItem {
  key: string
  icon: string
  iconBg: string
  label: string
  description: string
  status: PermStatus
  onRequest: () => Promise<void>
}

export default function PermissionsScreen() {
  const insets = useSafeAreaInsets()
  const [cameraPermission, requestCameraPermission, getCameraPermission] = useCameraPermissions()
  const [mediaStatus, setMediaStatus] = useState<PermStatus>('undetermined')

  async function refreshAll() {
    const [media] = await Promise.all([ImagePicker.getMediaLibraryPermissionsAsync(), getCameraPermission()])
    setMediaStatus(media.status as PermStatus)
  }

  useEffect(() => {
    refreshAll()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  // Re-check both permissions when returning from system Settings
  useEffect(() => {
    const sub = AppState.addEventListener('change', (state) => {
      if (state === 'active') refreshAll()
    })
    return () => sub.remove()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  async function handleCameraRequest() {
    if (cameraPermission?.status === 'denied') {
      await Linking.openSettings()
    } else {
      await requestCameraPermission()
    }
  }

  async function handleMediaRequest() {
    if (mediaStatus === 'denied') {
      await Linking.openSettings()
    } else {
      const result = await ImagePicker.requestMediaLibraryPermissionsAsync()
      setMediaStatus(result.status as PermStatus)
    }
  }

  const cameraStatus = (cameraPermission?.status ?? 'undetermined') as PermStatus

  const permissions: PermissionItem[] = [
    {
      key: 'camera',
      icon: 'camera-outline',
      iconBg: '#1D4ED8',
      label: 'Camera',
      description: 'Required to scan QR codes for event check-in',
      status: cameraStatus,
      onRequest: handleCameraRequest,
    },
    // Android 13+ uses the system photo picker — no user permission needed
    ...(Platform.OS === 'ios'
      ? [
          {
            key: 'media',
            icon: 'image-outline',
            iconBg: '#7C3AED',
            label: 'Photo Library',
            description: 'Required to upload your profile photo and event cover image',
            status: mediaStatus,
            onRequest: handleMediaRequest,
          } satisfies PermissionItem,
        ]
      : []),
  ]

  return (
    <View style={[s.container, { paddingTop: insets.top + Spacing.sm }]}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn} hitSlop={12}>
          <Ionicons name="arrow-back" size={20} color={Colors.text1} />
        </TouchableOpacity>
        <Text style={s.title}>Permissions</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView
        style={s.scroll}
        contentContainerStyle={[s.scrollContent, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
      >
        <Text style={s.sectionLabel}>App Permissions</Text>
        <View style={s.group}>
          {permissions.map((item, i) => (
            <PermissionRow key={item.key} item={item} showDivider={i < permissions.length - 1} />
          ))}
        </View>

        <Text style={s.hint}>If a permission is blocked, tap to open system settings and enable it manually.</Text>
      </ScrollView>
    </View>
  )
}

function PermissionRow({ item, showDivider }: { item: PermissionItem; showDivider: boolean }) {
  const isGranted = item.status === 'granted'
  const isDenied = item.status === 'denied'

  return (
    <>
      <View style={s.row}>
        <View style={[s.rowIcon, { backgroundColor: item.iconBg }]}>
          <Ionicons name={item.icon as any} size={18} color="#fff" />
        </View>
        <View style={s.rowBody}>
          <Text style={s.rowLabel}>{item.label}</Text>
          <Text style={s.rowDesc}>{item.description}</Text>
          {isDenied && <Text style={s.openSettings}>Tap to open Settings</Text>}
        </View>
        <Switch
          value={isGranted}
          onValueChange={() => (isGranted ? Linking.openSettings() : item.onRequest())}
          trackColor={{ false: Colors.surface2, true: Colors.accent }}
          thumbColor="#fff"
          ios_backgroundColor={Colors.surface2}
        />
      </View>
      {showDivider && <View style={s.divider} />}
    </>
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

  row: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    gap: Spacing.md,
  },
  rowIcon: {
    width: 36,
    height: 36,
    borderRadius: 10,
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  rowBody: { flex: 1, gap: 3 },
  rowLabel: { fontFamily: Fonts.bodyMedium, fontSize: 15, color: Colors.text1 },
  rowDesc: { fontFamily: Fonts.body, fontSize: 12, color: Colors.text3, lineHeight: 17 },
  openSettings: { fontFamily: Fonts.mono, fontSize: 11, color: Colors.accent, marginTop: 4 },

  divider: { height: 1, backgroundColor: Colors.border, marginLeft: 52 + Spacing.md },

  hint: {
    fontFamily: Fonts.body,
    fontSize: 12,
    color: Colors.text3,
    lineHeight: 18,
    paddingHorizontal: Spacing.xs,
    marginTop: Spacing.xs,
  },
})
