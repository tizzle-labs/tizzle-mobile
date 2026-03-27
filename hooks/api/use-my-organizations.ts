import { useQuery } from '@tanstack/react-query'
import { getMyOrganizations } from '@/lib/api/organizations'
import { useAuth } from '@/components/auth/auth-provider'

export const organizationKeys = {
  my: ['organizations', 'my'] as const,
}

export function useMyOrganizations() {
  const { isAuthenticated } = useAuth()
  return useQuery({
    queryKey: organizationKeys.my,
    queryFn: getMyOrganizations,
    enabled: isAuthenticated,
  })
}
