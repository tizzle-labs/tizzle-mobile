import { useQuery } from '@tanstack/react-query'
import { getMyOrganizations, getOrganizationByPda } from '@/lib/api/organizations'
import { useAuth } from '@/components/auth/auth-provider'

export const organizationKeys = {
  my: ['organizations', 'my'] as const,
  detail: (pda: string) => ['organizations', pda] as const,
}

export function useMyOrganizations() {
  const { isAuthenticated } = useAuth()
  return useQuery({
    queryKey: organizationKeys.my,
    queryFn: getMyOrganizations,
    enabled: isAuthenticated,
  })
}

export function useOrganization(organizationPda: string | undefined) {
  return useQuery({
    queryKey: organizationKeys.detail(organizationPda ?? ''),
    queryFn: () => getOrganizationByPda(organizationPda!),
    enabled: !!organizationPda,
    staleTime: 30_000,
  })
}
