import { View, Text, StyleSheet, ScrollView, TouchableOpacity, ActivityIndicator, TextInput, Image, Pressable } from 'react-native'
import { router } from 'expo-router'
import { SafeAreaView } from 'react-native-safe-area-context'
import * as ImagePicker from 'expo-image-picker'
import { Colors } from '@/constants/colors'
import { Fonts, LS, ls } from '@/constants/fonts'
import { Spacing } from '@/constants/spacing'
import { Button } from '@/components/ui/Button'
import { Card } from '@/components/ui/Card'
import { InfoGrid } from '@/components/ui/InfoGrid'
import { useAuth } from '@/components/auth/auth-provider'
import { useMyProfile } from '@/hooks/api/use-user-profile'
import { useMyRegistrations } from '@/hooks/api/use-my-registrations'
import { useUpdateProfile } from '@/hooks/api/use-update-profile'
import { useEffect, useMemo, useState } from 'react'

export default function ProfileModal() {
  const { walletAddress, signOut } = useAuth()
  const { data: profile, isLoading } = useMyProfile()
  const { data: registrations } = useMyRegistrations()
  const { mutateAsync: updateProfile, isPending: isSaving } = useUpdateProfile()
  const [name, setName] = useState('')
  const [username, setUsername] = useState('')
  const [bio, setBio] = useState('')
  const [avatarUri, setAvatarUri] = useState<string | null>(null)

  useEffect(() => {
    setName(profile?.name ?? '')
    setUsername(profile?.username ?? '')
    setBio(profile?.bio ?? '')
  }, [profile?.bio, profile?.name, profile?.username])

  async function handleSignOut() {
    await signOut()
    router.replace('/sign-in')
  }

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
    } catch (e) {
      console.error('Profile update failed', e)
    }
  }

  const statsRows = [
    { label: 'Tickets', value: String(registrations?.length ?? 0) },
    {
      label: 'Check-ins',
      value: String(registrations?.filter((r) => r.checkedIn).length ?? 0),
    },
  ]

  const profileRows = walletAddress ? [{ label: 'Wallet', value: walletAddress, mono: true }] : []
  const isDirty = useMemo(
    () =>
      name !== (profile?.name ?? '') ||
      username !== (profile?.username ?? '') ||
      bio !== (profile?.bio ?? '') ||
      avatarUri !== null,
    [avatarUri, bio, name, profile?.bio, profile?.name, profile?.username, username],
  )

  return (
    <View style={styles.container}>
      <SafeAreaView edges={['top']}>
        <View style={styles.header}>
          <Text style={styles.title}>PROFILE</Text>
          <TouchableOpacity onPress={() => router.back()}>
            <Text style={styles.closeText}>✕</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>

      {isLoading ? (
        <View style={styles.center}>
          <ActivityIndicator color={Colors.accent} />
        </View>
      ) : (
        <ScrollView contentContainerStyle={styles.scrollContent}>
          <View style={styles.nameSection}>
            <Pressable onPress={pickAvatar} style={styles.avatarWrapper}>
              {avatarUri || profile?.avatarUrl ? (
                <Image source={{ uri: avatarUri ?? profile!.avatarUrl! }} style={styles.avatar} />
              ) : (
                <View style={[styles.avatar, styles.avatarPlaceholder]} />
              )}
            </Pressable>
            <Text style={styles.avatarHint}>CHANGE PHOTO</Text>
            <Text style={styles.displayName}>{profile?.name ?? profile?.username ?? 'Anonymous'}</Text>
          </View>

          <Card>
            <Text style={styles.sectionLabel}>EDIT PROFILE</Text>
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>NAME</Text>
              <TextInput
                style={styles.input}
                placeholder="Your display name"
                placeholderTextColor={Colors.text3}
                value={name}
                onChangeText={setName}
                maxLength={30}
              />
            </View>
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>USERNAME</Text>
              <TextInput
                style={styles.input}
                placeholder="your-handle"
                placeholderTextColor={Colors.text3}
                autoCapitalize="none"
                value={username}
                onChangeText={setUsername}
                maxLength={24}
              />
            </View>
            <View style={styles.fieldGroup}>
              <Text style={styles.fieldLabel}>BIO</Text>
              <TextInput
                style={[styles.input, styles.textarea]}
                placeholder="A short bio"
                placeholderTextColor={Colors.text3}
                value={bio}
                onChangeText={setBio}
                multiline
                numberOfLines={4}
                maxLength={160}
                textAlignVertical="top"
              />
            </View>
            <Button onPress={handleSave} loading={isSaving} disabled={!isDirty} style={styles.saveButton}>
              Save Changes
            </Button>
          </Card>

          <Card>
            <InfoGrid rows={profileRows} />
          </Card>

          <Card variant="nested">
            <Text style={styles.statsLabel}>STATS</Text>
            <InfoGrid rows={statsRows} />
          </Card>

          <Button onPress={handleSignOut} variant="secondary">
            Disconnect Wallet
          </Button>
        </ScrollView>
      )}
    </View>
  )
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.bg },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  title: {
    fontFamily: Fonts.display,
    fontSize: 22,
    color: Colors.text1,
    letterSpacing: ls(22, LS.display),
  },
  closeText: {
    fontFamily: Fonts.mono,
    fontSize: 16,
    color: Colors.text2,
  },
  center: { flex: 1, alignItems: 'center', justifyContent: 'center' },
  scrollContent: { padding: Spacing.md, gap: Spacing.md },
  nameSection: { paddingVertical: Spacing.sm, gap: 6 },
  avatarWrapper: { alignSelf: 'flex-start' },
  avatar: {
    width: 80,
    height: 80,
    borderRadius: 40,
  },
  avatarPlaceholder: {
    backgroundColor: Colors.surface2,
    borderWidth: 1,
    borderColor: Colors.border2,
  },
  avatarHint: {
    fontFamily: Fonts.mono,
    fontSize: 9,
    color: Colors.text3,
    letterSpacing: ls(9, LS.labelWide),
  },
  displayName: {
    fontFamily: Fonts.display,
    fontSize: 36,
    color: Colors.text1,
    letterSpacing: ls(36, LS.displayTight),
  },
  sectionLabel: {
    fontFamily: Fonts.mono,
    fontSize: 9,
    color: Colors.text3,
    letterSpacing: ls(9, LS.labelWide),
    textTransform: 'uppercase',
    marginBottom: Spacing.md,
  },
  fieldGroup: {
    gap: 6,
    marginBottom: Spacing.md,
  },
  fieldLabel: {
    fontFamily: Fonts.mono,
    fontSize: 9,
    color: Colors.text3,
    letterSpacing: ls(9, LS.labelWide),
    textTransform: 'uppercase',
  },
  input: {
    backgroundColor: Colors.surface2,
    borderWidth: 1,
    borderColor: Colors.border2,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 12,
    color: Colors.text1,
    fontFamily: Fonts.body,
    fontSize: 15,
  },
  textarea: {
    minHeight: 96,
  },
  saveButton: {
    marginTop: Spacing.xs,
  },
  statsLabel: {
    fontFamily: Fonts.mono,
    fontSize: 9,
    color: Colors.text3,
    letterSpacing: ls(9, LS.labelWide),
    textTransform: 'uppercase',
    marginBottom: 10,
  },
})
