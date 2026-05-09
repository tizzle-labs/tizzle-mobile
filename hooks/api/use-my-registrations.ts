import { useQuery } from '@tanstack/react-query'
import { getMyRegistrations } from '@/lib/api/registrations'
import { useAuth } from '@/components/auth/auth-provider'

export const registrationKeys = {
  my: ['registrations', 'my'] as const,
  detail: (pda: string) => ['registrations', pda] as const,
}

export function useMyRegistrations() {
  const { isAuthenticated } = useAuth()
  return useQuery({
    queryKey: registrationKeys.my,
    queryFn: getMyRegistrations,
    enabled: isAuthenticated,
    staleTime: 0,
  })
}
