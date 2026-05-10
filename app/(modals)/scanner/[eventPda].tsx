import { View, Text, StyleSheet, ActivityIndicator, TouchableOpacity } from 'react-native'
import { useState, useCallback, useRef, useEffect } from 'react'
import { router, useLocalSearchParams } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { CameraView, useCameraPermissions } from 'expo-camera'
import { Colors } from '@/constants/colors'
import { Fonts, LS, ls } from '@/constants/fonts'
import { Spacing } from '@/constants/spacing'
import { ScanFrame } from '@/components/ui/ScanFrame'
import { Button } from '@/components/ui/Button'
import { useCheckIn } from '@/hooks/api/use-check-in'
import { getEventByPda } from '@/lib/api/events'
import { getRegistrationByPda } from '@/lib/api/registrations'
import { Ionicons } from '@expo/vector-icons'

export default function Scanner() {
  const { eventPda } = useLocalSearchParams<{ eventPda: string }>()
  const [permission, requestPermission] = useCameraPermissions()
  const checkIn = useCheckIn()
  const [scanned, setScanned] = useState(false)
  const scanTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleBarcodeScan = useCallback(
    async ({ data }: { data: string }) => {
      if (scanned || checkIn.isPending) return
      setScanned(true)

      try {
        const registration = await getRegistrationByPda(data)
        const event = await getEventByPda(registration.eventPda)
        const matchesSelectedEvent = registration.eventPda === eventPda

        if (!matchesSelectedEvent) {
          router.push({
            pathname: '/(modals)/scanner/result',
            params: {
              status: 'error',
              registrationPda: data,
              eventTitle: event.title,
              ticketEventPda: registration.eventPda,
              expectedEventPda: eventPda,
              eventMatches: 'false',
              failureReason: 'This ticket belongs to a different event.',
            },
          })
          return
        }

        const checkedInRegistration = await checkIn.mutateAsync({ registrationPda: data, eventPda })
        router.push({
          pathname: '/(modals)/scanner/result',
          params: {
            status: 'valid',
            registrationPda: data,
            checkedInAt: checkedInRegistration.checkedInAt ?? new Date().toISOString(),
            eventTitle: event.title,
            ticketEventPda: registration.eventPda,
            expectedEventPda: eventPda,
            eventMatches: 'true',
          },
        })
      } catch (error: any) {
        const isAlreadyUsed = error?.response?.status === 409
        const isNotFound = error?.response?.status === 404
        router.push({
          pathname: '/(modals)/scanner/result',
          params: {
            status: isAlreadyUsed ? 'used' : 'error',
            registrationPda: data,
            expectedEventPda: eventPda,
            failureReason: isAlreadyUsed
              ? 'This ticket has already been checked in.'
              : isNotFound
                ? 'We could not find a ticket for this QR code.'
                : 'Verification failed before check-in could be completed.',
          },
        })
      }
      // Allow re-scanning after 3s
      scanTimeoutRef.current = setTimeout(() => setScanned(false), 3000)
    },
    [scanned, checkIn, eventPda],
  )

  useEffect(() => {
    return () => {
      if (scanTimeoutRef.current) clearTimeout(scanTimeoutRef.current)
    }
  }, [])

  if (!permission) {
    return (
      <View style={styles.container}>
        <ActivityIndicator color={Colors.accent} />
      </View>
    )
  }

  if (!permission.granted) {
    return (
      <View style={styles.container}>
        <SafeAreaView style={styles.permContent}>
          <Text style={styles.permText}>Camera access needed to scan tickets</Text>
          <Button onPress={requestPermission}>Allow Camera</Button>
        </SafeAreaView>
      </View>
    )
  }

  return (
    <View style={styles.container}>
      <CameraView
        style={StyleSheet.absoluteFillObject}
        facing="back"
        onBarcodeScanned={handleBarcodeScan}
        barcodeScannerSettings={{ barcodeTypes: ['qr'] }}
      />
      {/* Overlay */}
      <View style={styles.overlay}>
        <SafeAreaView edges={['top']} style={styles.topBar}>
          <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} hitSlop={12}>
            <Ionicons name="arrow-back" size={20} color={Colors.text1} />
          </TouchableOpacity>
          <Text style={styles.title}>SCANNER</Text>
        </SafeAreaView>
        <View style={styles.frameContainer}>
          <ScanFrame />
        </View>
        <SafeAreaView edges={['bottom']} style={styles.footer}>
          <Text style={styles.hint}>Point camera at a ticket QR code</Text>
          {checkIn.isPending && (
            <View style={styles.processingRow}>
              <ActivityIndicator color={Colors.accent} size="small" />
              <Text style={styles.processingText}>Verifying…</Text>
            </View>
          )}
        </SafeAreaView>
      </View>
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0,0,0,0.45)',
    justifyContent: 'space-between',
  },
  topBar: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
  },
  backBtn: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(0,0,0,0.45)',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontFamily: Fonts.display,
    fontSize: 24,
    color: Colors.text1,
    letterSpacing: ls(24, LS.display),
  },
  frameContainer: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  footer: {
    alignItems: 'center',
    paddingBottom: Spacing.xl,
    gap: Spacing.sm,
  },
  hint: {
    fontFamily: Fonts.mono,
    fontSize: 10,
    color: Colors.text2,
    letterSpacing: ls(10, LS.label),
    textTransform: 'uppercase',
  },
  processingRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  processingText: {
    fontFamily: Fonts.mono,
    fontSize: 11,
    color: Colors.accent,
    textTransform: 'uppercase',
    letterSpacing: ls(11, LS.label),
  },
  permContent: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    padding: Spacing.xl,
    gap: Spacing.md,
  },
  permText: {
    fontFamily: Fonts.body,
    fontSize: 15,
    color: Colors.text2,
    textAlign: 'center',
  },
})
