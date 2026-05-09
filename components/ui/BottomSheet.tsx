import { Colors } from '@/constants/colors'
import { Fonts, LS, ls } from '@/constants/fonts'
import { Spacing } from '@/constants/spacing'
import {
  BottomSheetBackdrop,
  BottomSheetModal,
  BottomSheetScrollView,
  BottomSheetView,
  type BottomSheetBackdropProps,
} from '@gorhom/bottom-sheet'
import { forwardRef, useCallback, useEffect, useImperativeHandle, useRef, useState } from 'react'
import { BackHandler, StyleSheet, Text } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

export interface BottomSheetRef {
  present: () => void
  dismiss: () => void
}

interface Props {
  title?: string
  children: React.ReactNode
  scrollable?: boolean
  snapPoints?: (string | number)[]
  dynamicSizing?: boolean
}

export const BottomSheet = forwardRef<BottomSheetRef, Props>(
  ({ title, children, scrollable = false, snapPoints, dynamicSizing = false }, ref) => {
    const modalRef = useRef<BottomSheetModal>(null)
    const insets = useSafeAreaInsets()
    const [isOpen, setIsOpen] = useState(false)

    useImperativeHandle(ref, () => ({
      present: () => modalRef.current?.present(),
      dismiss: () => modalRef.current?.dismiss(),
    }))

    useEffect(() => {
      if (!isOpen) return
      const sub = BackHandler.addEventListener('hardwareBackPress', () => {
        modalRef.current?.dismiss()
        return true
      })
      return () => sub.remove()
    }, [isOpen])

    const renderBackdrop = useCallback(
      (props: BottomSheetBackdropProps) => (
        <BottomSheetBackdrop {...props} disappearsOnIndex={-1} appearsOnIndex={0} pressBehavior="close" />
      ),
      [],
    )

    const resolvedSnapPoints = dynamicSizing ? undefined : (snapPoints ?? ['50%'])

    return (
      <BottomSheetModal
        ref={modalRef}
        snapPoints={resolvedSnapPoints}
        enableDynamicSizing={dynamicSizing}
        backdropComponent={renderBackdrop}
        backgroundStyle={styles.background}
        handleIndicatorStyle={styles.handle}
        enablePanDownToClose
        keyboardBehavior="extend"
        keyboardBlurBehavior="restore"
        onChange={(index) => setIsOpen(index >= 0)}
      >
        {scrollable ? (
          <BottomSheetScrollView
            showsVerticalScrollIndicator={false}
            contentContainerStyle={[styles.scrollContent, { paddingBottom: insets.bottom + Spacing.xl }]}
          >
            {title && <Text style={styles.title}>{title}</Text>}
            {children}
          </BottomSheetScrollView>
        ) : (
          <BottomSheetView style={[styles.viewContent, { paddingBottom: insets.bottom + Spacing.xl }]}>
            {title && <Text style={styles.title}>{title}</Text>}
            {children}
          </BottomSheetView>
        )}
      </BottomSheetModal>
    )
  },
)

BottomSheet.displayName = 'BottomSheet'

const styles = StyleSheet.create({
  background: {
    backgroundColor: Colors.surface2,
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
  },
  handle: {
    backgroundColor: Colors.border2,
    width: 36,
    height: 4,
    borderRadius: 2,
  },
  scrollContent: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
  },
  viewContent: {
    paddingHorizontal: Spacing.md,
    paddingTop: Spacing.sm,
  },
  title: {
    fontFamily: Fonts.display,
    fontSize: 20,
    color: Colors.text1,
    letterSpacing: ls(20, LS.displaySubtle),
    marginBottom: Spacing.md,
  },
})
