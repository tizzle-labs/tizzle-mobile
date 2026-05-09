import { Button } from '@/components/ui/Button'
import { Colors } from '@/constants/colors'
import { Fonts, LS, ls } from '@/constants/fonts'
import { Spacing } from '@/constants/spacing'
import { useUpdateProfile } from '@/hooks/api/use-update-profile'
import { useMyProfile } from '@/hooks/api/use-user-profile'
import { checkUsernameAvailable } from '@/lib/api/users'
import { Ionicons } from '@expo/vector-icons'
import * as ImagePicker from 'expo-image-picker'
import { router } from 'expo-router'
import { useEffect, useMemo, useRef, useState } from 'react'
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

type UsernameStatus = 'idle' | 'checking' | 'available' | 'taken'

export default function EditProfileScreen() {
  const insets = useSafeAreaInsets()
  const { data: profile, isLoading } = useMyProfile()
  const { mutateAsync: updateProfile, isPending: isSaving } = useUpdateProfile()

  const [name, setName] = useState('')
  const [username, setUsername] = useState('')
  const [bio, setBio] = useState('')
  const [avatarUri, setAvatarUri] = useState<string | null>(null)
  const [usernameStatus, setUsernameStatus] = useState<UsernameStatus>('idle')
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  const NAME_MAX = 30
  const nameExceeded = name.length > NAME_MAX

  useEffect(() => {
    setName(profile?.name ?? '')
    setUsername(profile?.username ?? '')
    setBio(profile?.bio ?? '')
  }, [profile?.name, profile?.username, profile?.bio])

  function handleUsernameChange(value: string) {
    const stripped = value.replace(/\s/g, '')
    setUsername(stripped)

    if (debounceRef.current) clearTimeout(debounceRef.current)

    const trimmed = stripped.trim()
    if (!trimmed || trimmed === (profile?.username ?? '')) {
      setUsernameStatus('idle')
      return
    }

    setUsernameStatus('checking')
    debounceRef.current = setTimeout(async () => {
      try {
        const available = await checkUsernameAvailable(trimmed)
        setUsernameStatus(available ? 'available' : 'taken')
      } catch {
        setUsernameStatus('idle')
      }
    }, 500)
  }

  const isDirty = useMemo(
    () =>
      name !== (profile?.name ?? '') ||
      username !== (profile?.username ?? '') ||
      bio !== (profile?.bio ?? '') ||
      avatarUri !== null,
    [name, username, bio, avatarUri, profile],
  )

  const canSave = isDirty && usernameStatus !== 'taken' && usernameStatus !== 'checking' && !nameExceeded

  async function pickAvatar() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync()
    if (status !== 'granted') return
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.8,
    })
    if (!result.canceled) setAvatarUri(result.assets[0].uri)
  }

  async function handleSave() {
    try {
      await updateProfile({
        name: name.trim() || undefined,
        username: username.trim() || undefined,
        bio: bio.trim() || undefined,
        avatarUri: avatarUri ?? undefined,
      })
      setAvatarUri(null)
      router.back()
    } catch (e) {
      console.error('Profile update failed', e)
    }
  }

  if (isLoading) {
    return (
      <View style={s.loading}>
        <ActivityIndicator color={Colors.accent} />
      </View>
    )
  }

  const avatarSource = avatarUri ?? profile?.avatarUrl

  return (
    <View style={[s.container, { paddingTop: insets.top + Spacing.sm }]}>
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={s.backBtn} hitSlop={12}>
          <Ionicons name="arrow-back" size={20} color={Colors.text1} />
        </TouchableOpacity>
        <Text style={s.title}>Edit Profile</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView
        style={s.scroll}
        contentContainerStyle={[s.scrollContent, { paddingBottom: insets.bottom + 40 }]}
        showsVerticalScrollIndicator={false}
        keyboardShouldPersistTaps="handled"
      >
        {/* Avatar */}
        <View style={s.avatarSection}>
          <Pressable onPress={pickAvatar} style={s.avatarWrap}>
            {avatarSource ? (
              <Image source={{ uri: avatarSource }} style={s.avatar} />
            ) : (
              <View style={[s.avatar, s.avatarFallback]}>
                <Ionicons name="person" size={32} color={Colors.text3} />
              </View>
            )}
            <View style={s.avatarEditBadge}>
              <Ionicons name="camera" size={12} color={Colors.bg} />
            </View>
          </Pressable>
          <Text style={s.avatarHint}>Tap to change photo</Text>
        </View>

        {/* Fields */}
        <View style={s.fields}>
          <View style={s.fieldGroup}>
            <Text style={s.fieldLabel}>NAME</Text>
            <TextInput
              style={s.input}
              placeholder="Your display name"
              placeholderTextColor={Colors.text3}
              value={name}
              onChangeText={setName}
            />
            {nameExceeded && (
              <Text style={s.usernameError}>Name must be {NAME_MAX} characters or less</Text>
            )}
          </View>

          <View style={s.fieldGroup}>
            <Text style={s.fieldLabel}>USERNAME</Text>
            <View style={s.inputWrap}>
              <TextInput
                style={s.input}
                placeholder="your-handle"
                placeholderTextColor={Colors.text3}
                autoCapitalize="none"
                autoCorrect={false}
                value={username}
                onChangeText={handleUsernameChange}
                maxLength={24}
              />
              <View style={s.usernameStatus}>
                {usernameStatus === 'checking' && <ActivityIndicator size="small" color={Colors.text3} />}
                {usernameStatus === 'available' && <Ionicons name="checkmark-circle" size={18} color="#22C55E" />}
                {usernameStatus === 'taken' && <Ionicons name="close-circle" size={18} color={Colors.error} />}
              </View>
            </View>
            {usernameStatus === 'taken' && <Text style={s.usernameError}>Username already taken</Text>}
            {usernameStatus === 'available' && <Text style={s.usernameOk}>Username is available</Text>}
          </View>

          <View style={s.fieldGroup}>
            <Text style={s.fieldLabel}>BIO</Text>
            <TextInput
              style={[s.input, s.textarea]}
              placeholder="A short bio"
              placeholderTextColor={Colors.text3}
              value={bio}
              onChangeText={setBio}
              multiline
              numberOfLines={4}
              maxLength={160}
              textAlignVertical="top"
            />
            <Text style={s.charCount}>{bio.length}/160</Text>
          </View>
        </View>

        <Button onPress={handleSave} loading={isSaving} disabled={!canSave}>
          Save Changes
        </Button>
      </ScrollView>
    </View>
  )
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  loading: { flex: 1, alignItems: 'center', justifyContent: 'center', backgroundColor: Colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingBottom: Spacing.sm,
    marginBottom: Spacing.md,
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
  scrollContent: { paddingHorizontal: Spacing.md, gap: Spacing.lg },
  avatarSection: { alignItems: 'center', gap: Spacing.sm, paddingVertical: Spacing.md },
  avatarWrap: { position: 'relative' },
  avatar: { width: 90, height: 90, borderRadius: 45 },
  avatarFallback: {
    backgroundColor: Colors.surface2,
    alignItems: 'center',
    justifyContent: 'center',
  },
  avatarEditBadge: {
    position: 'absolute',
    bottom: 0,
    right: 0,
    width: 26,
    height: 26,
    borderRadius: 13,
    backgroundColor: Colors.accent,
    alignItems: 'center',
    justifyContent: 'center',
    borderWidth: 2,
    borderColor: Colors.bg,
  },
  avatarHint: { fontFamily: Fonts.body, fontSize: 12, color: Colors.text3 },
  fields: { gap: Spacing.md },
  fieldGroup: { gap: 6 },
  fieldLabel: {
    fontFamily: Fonts.mono,
    fontSize: 9,
    color: Colors.text3,
    letterSpacing: ls(9, LS.labelWide),
    textTransform: 'uppercase',
  },
  inputWrap: { position: 'relative' },
  input: {
    backgroundColor: Colors.surface,
    borderRadius: 12,
    paddingHorizontal: Spacing.md,
    paddingVertical: 13,
    color: Colors.text1,
    fontFamily: Fonts.body,
    fontSize: 15,
  },
  usernameStatus: {
    position: 'absolute',
    right: Spacing.md,
    top: 0,
    bottom: 0,
    justifyContent: 'center',
  },
  usernameError: { fontFamily: Fonts.mono, fontSize: 10, color: Colors.error },
  usernameOk: { fontFamily: Fonts.mono, fontSize: 10, color: '#22C55E' },
  textarea: { minHeight: 96, paddingTop: 13 },
  charCount: { fontFamily: Fonts.mono, fontSize: 9, color: Colors.text3, textAlign: 'right' },
})
