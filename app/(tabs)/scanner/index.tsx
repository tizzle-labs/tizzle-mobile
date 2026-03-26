import { View, Text, StyleSheet, ActivityIndicator } from 'react-native'
import { useState, useCallback, useRef, useEffect } from 'react'
import { router } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import { CameraView, useCameraPermissions } from 'expo-camera'
import { Colors } from '@/constants/colors'
import { Fonts } from '@/constants/fonts'
import { Spacing } from '@/constants/spacing'
import { ScanFrame } from '@/components/ui/ScanFrame'
import { Button } from '@/components/ui/Button'
import { useCheckIn } from '@/hooks/api/use-check-in'

export default function Scanner() {
  const [permission, requestPermission] = useCameraPermissions()
  const checkIn = useCheckIn()
  const [scanned, setScanned] = useState(false)
  const scanTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const handleBarcodeScan = useCallback(
    async ({ data }: { data: string }) => {
      if (scanned || checkIn.isPending) return
      setScanned(true)

      try {
        const registration = await checkIn.mutateAsync(data)
        router.push({
          pathname: '/(tabs)/scanner/result',
          params: {
            status: 'valid',
            registrationPda: data,
            checkedInAt: registration.checkedInAt ?? new Date().toISOString(),
          },
        })
      } catch (error: any) {
        const isAlreadyUsed = error?.response?.status === 409
        router.push({
          pathname: '/(tabs)/scanner/result',
          params: {
            status: isAlreadyUsed ? 'used' : 'error',
            registrationPda: data,
          },
        })
      }
      // Allow re-scanning after 3s
      scanTimeoutRef.current = setTimeout(() => setScanned(false), 3000)
    },
    [scanned, checkIn],
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
        <SafeAreaView edges={['top']}>
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
  title: {
    fontFamily: Fonts.display,
    fontSize: 24,
    color: Colors.text1,
    letterSpacing: -0.03,
    padding: Spacing.md,
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
    letterSpacing: 0.1,
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
    letterSpacing: 0.1,
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
