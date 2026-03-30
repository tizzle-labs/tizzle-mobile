import { useMutation, useQueryClient } from '@tanstack/react-query'
import { uploadProfileAvatar } from '@/lib/api/storage'
import { updateMyProfile } from '@/lib/api/users'
import { userKeys } from './use-user-profile'

interface UpdateProfileInput {
  name?: string
  username?: string
  bio?: string
  avatarUri?: string
}

export function useUpdateProfile() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ avatarUri, ...fields }: UpdateProfileInput) => {
      let avatarUrl: string | undefined
      if (avatarUri) {
        const uploaded = await uploadProfileAvatar(avatarUri)
        avatarUrl = uploaded.url
      }
      return updateMyProfile({ ...fields, avatarUrl })
    },
    onSuccess: (updatedProfile) => {
      queryClient.setQueryData(userKeys.me, updatedProfile)
    },
  })
}
