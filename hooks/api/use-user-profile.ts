import { useQuery } from '@tanstack/react-query'
import { getMyProfile } from '@/lib/api/users'
import { useAuth } from '@/components/auth/auth-provider'

export const userKeys = {
  me: ['users', 'me'] as const,
}

export function useMyProfile() {
  const { hasJwt } = useAuth()
  return useQuery({
    queryKey: userKeys.me,
    queryFn: getMyProfile,
    enabled: hasJwt,
  })
}
