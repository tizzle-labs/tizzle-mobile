import { BottomSheet, type BottomSheetRef } from '@/components/ui/BottomSheet'
import { Colors } from '@/constants/colors'
import { Fonts } from '@/constants/fonts'
import { Spacing } from '@/constants/spacing'
import { getDescriptionInitialContent, resolveDescription } from '@/lib/description-callback-store'
import {
  CoreBridge,
  PlaceholderBridge,
  RichText,
  TenTapStartKit,
  Toolbar,
  darkEditorCss,
  darkEditorTheme,
  useEditorBridge,
  useEditorContent,
} from '@10play/tentap-editor'
import { Ionicons } from '@expo/vector-icons'
import { router } from 'expo-router'
import { useEffect, useRef } from 'react'
import { BackHandler, KeyboardAvoidingView, StyleSheet, Text, TouchableOpacity, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

const customCss =
  darkEditorCss +
  `
  * { background-color: ${Colors.bg} !important; }
  body {
    color: ${Colors.text1};
    font-size: 16px;
    line-height: 1.6;
    padding: 16px;
    box-sizing: border-box;
  }
  .is-editor-empty:first-child::before {
    color: ${Colors.text2};
    content: attr(data-placeholder);
    float: left;
    height: 0;
    pointer-events: none;
  }
`

export default function EventDescription() {
  const insets = useSafeAreaInsets()

  const editor = useEditorBridge({
    autofocus: true,
    avoidIosKeyboard: true,
    initialContent: getDescriptionInitialContent() || undefined,
    bridgeExtensions: [
      ...TenTapStartKit.filter((b) => b.name !== 'core'),
      CoreBridge.configureCSS(customCss),
      PlaceholderBridge.configureExtension({ placeholder: 'Start typing…' }),
    ],
    theme: {
      ...darkEditorTheme,
      toolbar: {
        toolbarBody: {
          backgroundColor: Colors.surface2,
          borderTopWidth: 0,
          borderBottomWidth: 0,
          height: 52,
          minWidth: '100%',
        },
        toolbarButton: {
          backgroundColor: Colors.surface2,
          paddingHorizontal: 10,
          alignItems: 'center',
          justifyContent: 'center',
        },
        iconWrapper: {
          borderRadius: 8,
          backgroundColor: Colors.surface2,
        },
        iconWrapperActive: {
          backgroundColor: Colors.surface,
        },
        icon: {
          tintColor: Colors.text2,
          height: 30,
          width: 30,
        },
        iconActive: {
          tintColor: Colors.text1,
        },
        iconDisabled: {
          tintColor: Colors.text2,
          opacity: 0.3,
        },
        hidden: { display: 'none' },
        keyboardAvoidingView: {
          position: 'absolute',
          width: '100%',
          bottom: 0,
        },
        linkBarTheme: {
          addLinkContainer: {
            backgroundColor: Colors.surface2,
            borderTopWidth: 0,
            flex: 1,
            flexDirection: 'row',
            height: 44,
            padding: 4,
            paddingHorizontal: 8,
            alignItems: 'center',
            justifyContent: 'center',
          },
          linkInput: {
            flex: 1,
            color: Colors.text1,
            fontFamily: Fonts.body,
            fontSize: 14,
            paddingHorizontal: 8,
            backgroundColor: Colors.surface2,
            borderRadius: 8,
            height: 32,
          },
          placeholderTextColor: Colors.text2,
          doneButton: {
            paddingHorizontal: 12,
            height: 32,
            backgroundColor: Colors.accent,
            borderRadius: 8,
            alignItems: 'center',
            justifyContent: 'center',
          },
          doneButtonText: {
            color: '#000000',
            fontFamily: Fonts.body,
            fontSize: 13,
          },
          linkToolbarButton: {
            paddingHorizontal: 8,
          },
        },
      },
      webview: {
        backgroundColor: Colors.bg,
      },
    },
  })

  const content = useEditorContent(editor, { type: 'html' })
  const initialContent = useRef(getDescriptionInitialContent())
  const discardSheetRef = useRef<BottomSheetRef>(null)

  const hasChanges = () => (content ?? '') !== initialContent.current

  function handleBack() {
    if (hasChanges()) {
      discardSheetRef.current?.present()
    } else {
      router.back()
    }
  }

  function handleSave() {
    resolveDescription(content ?? '')
    router.back()
  }

  function handleDiscard() {
    discardSheetRef.current?.dismiss()
    router.back()
  }

  useEffect(() => {
    const sub = BackHandler.addEventListener('hardwareBackPress', () => {
      handleBack()
      return true
    })
    return () => sub.remove()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [content])

  return (
    <View style={[styles.container, { paddingTop: insets.top }]}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={handleBack} hitSlop={12} activeOpacity={0.7}>
          <Ionicons name="arrow-back" size={22} color={Colors.text1} />
        </TouchableOpacity>
        <Text style={styles.title}>Event Description</Text>
        <TouchableOpacity onPress={handleSave} hitSlop={12} activeOpacity={0.7}>
          <Text style={styles.saveButton}>Save</Text>
        </TouchableOpacity>
      </View>

      {/* Editor */}
      <RichText editor={editor} style={styles.editor} />

      {/* Toolbar — sticks above keyboard via KeyboardAvoidingView */}
      <KeyboardAvoidingView behavior="padding" style={styles.toolbarWrapper}>
        <Toolbar editor={editor} />
      </KeyboardAvoidingView>

      {/* Discard confirmation */}
      <BottomSheet ref={discardSheetRef} dynamicSizing>
        <View style={styles.discardSheet}>
          <Text style={styles.discardTitle}>Discard changes?</Text>
          <Text style={styles.discardSubtitle}>Your description edits will be lost.</Text>
          <TouchableOpacity style={styles.discardBtn} onPress={handleDiscard} activeOpacity={0.8}>
            <Text style={styles.discardBtnText}>Discard</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.keepBtn}
            onPress={() => discardSheetRef.current?.dismiss()}
            activeOpacity={0.8}
          >
            <Text style={styles.keepBtnText}>Keep Editing</Text>
          </TouchableOpacity>
        </View>
      </BottomSheet>
    </View>
  )
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm + 4,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  title: {
    flex: 1,
    fontFamily: Fonts.display,
    fontSize: 17,
    color: Colors.text1,
    textAlign: 'center',
  },
  saveButton: {
    fontFamily: Fonts.body,
    fontSize: 15,
    color: Colors.accent,
  },
  discardSheet: {
    paddingBottom: Spacing.sm,
  },
  discardTitle: {
    fontFamily: Fonts.display,
    fontSize: 18,
    color: Colors.text1,
    marginBottom: Spacing.xs,
  },
  discardSubtitle: {
    fontFamily: Fonts.body,
    fontSize: 14,
    color: Colors.text2,
    marginBottom: Spacing.lg,
  },
  discardBtn: {
    backgroundColor: Colors.error,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
    marginBottom: Spacing.sm,
  },
  discardBtnText: {
    fontFamily: Fonts.body,
    fontSize: 15,
    color: Colors.text1,
  },
  keepBtn: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    paddingVertical: 14,
    alignItems: 'center',
  },
  keepBtnText: {
    fontFamily: Fonts.body,
    fontSize: 15,
    color: Colors.text1,
  },
  editor: {
    flex: 1,
    backgroundColor: Colors.bg,
  },
  toolbarWrapper: {
    position: 'absolute',
    width: '100%',
    bottom: 0,
  },
})
