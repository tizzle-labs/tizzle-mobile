import { useQuery } from '@tanstack/react-query'

export const registrationKeys = {
  my: ['registrations', 'my'] as const,
}

// Placeholder — full implementation in Task 6
export function useMyRegistrations() {
  return useQuery({
    queryKey: registrationKeys.my,
    queryFn: async () => [] as any[],
    enabled: false,
  })
}
