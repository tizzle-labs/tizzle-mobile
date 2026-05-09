import { useQuery } from '@tanstack/react-query'
import { getEventByPda } from '@/lib/api/events'
import { eventKeys } from './use-events'

export function useEventDetail(eventPda: string) {
  return useQuery({
    queryKey: eventKeys.detail(eventPda),
    queryFn: () => getEventByPda(eventPda),
    enabled: !!eventPda,
    staleTime: 0,
  })
}
