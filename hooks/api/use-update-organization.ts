import { organizationKeys } from '@/hooks/api/use-my-organizations'
import { updateOrganization } from '@/lib/api/organizations'
import { uploadOrganizationAvatar } from '@/lib/api/storage'
import { useMutation, useQueryClient } from '@tanstack/react-query'

interface UpdateOrgInput {
  organizationPda: string
  name?: string
  description?: string
  avatarUri?: string
  twitter?: string
  discord?: string
}

export function useUpdateOrganization() {
  const queryClient = useQueryClient()

  return useMutation({
    mutationFn: async ({ organizationPda, avatarUri, ...fields }: UpdateOrgInput) => {
      let avatarUrl: string | undefined
      if (avatarUri) {
        const uploaded = await uploadOrganizationAvatar(avatarUri, organizationPda)
        avatarUrl = uploaded.url
      }
      return updateOrganization(organizationPda, { ...fields, avatarUrl })
    },
    onSuccess: (updated) => {
      queryClient.setQueryData(organizationKeys.detail(updated.organizationPda), updated)
      queryClient.invalidateQueries({ queryKey: organizationKeys.my })
    },
  })
}
