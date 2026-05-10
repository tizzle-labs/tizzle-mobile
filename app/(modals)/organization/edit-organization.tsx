import { Button } from '@/components/ui/Button'
import { Colors } from '@/constants/colors'
import { Fonts, LS, ls } from '@/constants/fonts'
import { Spacing } from '@/constants/spacing'
import { useUpdateOrganization } from '@/hooks/api/use-update-organization'
import { useOrganization } from '@/hooks/api/use-my-organizations'
import { showErrorFeedback } from '@/lib/app-feedback'
import { Ionicons } from '@expo/vector-icons'
import { Image } from 'expo-image'
import * as ImagePicker from 'expo-image-picker'
import { router, useLocalSearchParams } from 'expo-router'
import { useEffect, useState } from 'react'
import {
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

export default function EditOrganizationScreen() {
  const insets = useSafeAreaInsets()
  const { organizationPda } = useLocalSearchParams<{ organizationPda: string }>()
  const { data: org, isLoading } = useOrganization(organizationPda)
  const updateOrg = useUpdateOrganization()

  const [name, setName] = useState('')
  const [description, setDescription] = useState('')
  const [twitter, setTwitter] = useState('')
  const [discord, setDiscord] = useState('')
  const [avatarUri, setAvatarUri] = useState<string | null>(null)

  useEffect(() => {
    if (!org) return
    setName(org.name ?? '')
    setDescription(org.description ?? '')
    setTwitter(org.twitter ?? '')
    setDiscord(org.discord ?? '')
  }, [org])

  async function pickAvatar() {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
    })
    if (!result.canceled && result.assets[0]) {
      setAvatarUri(result.assets[0].uri)
    }
  }

  async function handleSave() {
    if (!organizationPda || !name.trim()) return
    try {
      await updateOrg.mutateAsync({
        organizationPda,
        name: name.trim(),
        description: description.trim() || undefined,
        twitter: twitter.trim() || undefined,
        discord: discord.trim() || undefined,
        avatarUri: avatarUri ?? undefined,
      })
      router.back()
    } catch (e) {
      showErrorFeedback(e, 'Update Failed', 'Could not update organization.')
    }
  }

  const isDirty =
    !!avatarUri ||
    name !== (org?.name ?? '') ||
    description !== (org?.description ?? '') ||
    twitter !== (org?.twitter ?? '') ||
    discord !== (org?.discord ?? '')

  const avatarSource = avatarUri ? { uri: avatarUri } : org?.avatarUrl ? { uri: org.avatarUrl } : null

  if (isLoading) {
    return (
      <View style={s.loadingWrap}>
        <ActivityIndicator color={Colors.accent} />
      </View>
    )
  }

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: Colors.bg }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
      {/* Header */}
      <View style={[s.header, { paddingTop: insets.top + Spacing.sm }]}>
        <TouchableOpacity onPress={() => router.back()} style={s.iconBtn} hitSlop={12}>
          <Ionicons name="arrow-back" size={20} color={Colors.text1} />
        </TouchableOpacity>
        <Text style={s.title}>Edit Organization</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView
        style={s.scroll}
        contentContainerStyle={[s.scrollContent, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Avatar */}
        <Pressable style={s.avatarWrap} onPress={pickAvatar}>
          {avatarSource ? (
            <Image source={avatarSource} style={s.avatar} contentFit="cover" />
          ) : (
            <View style={[s.avatar, s.avatarFallback]}>
              <Ionicons name="business-outline" size={32} color={Colors.text3} />
            </View>
          )}
          <View style={s.avatarEditBadge}>
            <Ionicons name="camera-outline" size={14} color={Colors.bg} />
          </View>
        </Pressable>

        {/* Fields */}
        <View style={s.section}>
          <Text style={s.sectionLabel}>NAME</Text>
          <View style={s.fieldWrap}>
            <TextInput
              style={s.input}
              value={name}
              onChangeText={setName}
              placeholder="Organization name"
              placeholderTextColor={Colors.text3}
              autoCapitalize="words"
              autoCorrect={false}
              maxLength={60}
            />
          </View>
        </View>

        <View style={s.section}>
          <Text style={s.sectionLabel}>DESCRIPTION</Text>
          <View style={[s.fieldWrap, s.fieldWrapMulti]}>
            <TextInput
              style={[s.input, s.inputMulti]}
              value={description}
              onChangeText={setDescription}
              placeholder="What is your organization about?"
              placeholderTextColor={Colors.text3}
              multiline
              numberOfLines={4}
              maxLength={500}
              textAlignVertical="top"
            />
          </View>
          <Text style={s.charCount}>{description.length}/500</Text>
        </View>

        <View style={s.section}>
          <Text style={s.sectionLabel}>SOCIAL MEDIA</Text>
          <View style={s.fieldWrap}>
            <Ionicons name="logo-twitter" size={16} color={Colors.text2} style={s.fieldIcon} />
            <TextInput
              style={s.input}
              value={twitter}
              onChangeText={setTwitter}
              placeholder="@handle or full URL"
              placeholderTextColor={Colors.text3}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>
          <View style={[s.fieldWrap, { marginTop: Spacing.sm }]}>
            <Ionicons name="logo-discord" size={16} color={Colors.text2} style={s.fieldIcon} />
            <TextInput
              style={s.input}
              value={discord}
              onChangeText={setDiscord}
              placeholder="Discord invite URL or handle"
              placeholderTextColor={Colors.text3}
              autoCapitalize="none"
              autoCorrect={false}
            />
          </View>
        </View>

        <Button
          onPress={handleSave}
          loading={updateOrg.isPending}
          disabled={!isDirty || !name.trim() || updateOrg.isPending}
        >
          {updateOrg.isPending ? 'Saving…' : 'Save Changes'}
        </Button>
      </ScrollView>
    </KeyboardAvoidingView>
  )
}

const s = StyleSheet.create({
  loadingWrap: { flex: 1, backgroundColor: Colors.bg, alignItems: 'center', justifyContent: 'center' },

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
  title: {
    fontFamily: Fonts.display,
    fontSize: 18,
    color: Colors.text1,
    letterSpacing: ls(18, LS.displaySubtle),
  },

  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: Spacing.md, paddingTop: Spacing.lg, gap: Spacing.lg },

  // Avatar
  avatarWrap: { alignSelf: 'center', marginBottom: Spacing.sm },
  avatar: { width: 88, height: 88, borderRadius: 22 },
  avatarFallback: { backgroundColor: Colors.surface2, alignItems: 'center', justifyContent: 'center' },
  avatarEditBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.bg,
  },

  // Fields
  section: { gap: Spacing.xs },
  sectionLabel: {
    fontFamily: Fonts.mono,
    fontSize: 9,
    color: Colors.text3,
    letterSpacing: ls(9, LS.labelWide),
  },
  fieldWrap: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: Colors.surface2,
    borderRadius: 12,
    paddingHorizontal: Spacing.md,
    minHeight: 48,
  },
  fieldWrapMulti: { alignItems: 'flex-start', paddingVertical: Spacing.sm },
  fieldIcon: { marginRight: Spacing.sm },
  input: {
    flex: 1,
    fontFamily: Fonts.body,
    fontSize: 15,
    color: Colors.text1,
    paddingVertical: 0,
  },
  inputMulti: { minHeight: 80 },
  charCount: {
    fontFamily: Fonts.mono,
    fontSize: 10,
    color: Colors.text3,
    textAlign: 'right',
  },
})
