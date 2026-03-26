import { useQuery } from '@tanstack/react-query'
import { getEvents } from '@/lib/api/events'

export const eventKeys = {
  all: ['events'] as const,
  detail: (pda: string) => ['events', pda] as const,
}

export function useEvents() {
  return useQuery({
    queryKey: eventKeys.all,
    queryFn: () => getEvents(),
    staleTime: 30_000,
  })
}
