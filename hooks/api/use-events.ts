import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { getEvents } from '@/lib/api/events'

const PAGE_SIZE = 20

export const eventKeys = {
  all: ['events'] as const,
  infinite: (sortBy: 'created_at' | 'start_time') => ['events', 'infinite', sortBy] as const,
  detail: (pda: string) => ['events', pda] as const,
}

export function useEvents() {
  return useQuery({
    queryKey: eventKeys.all,
    queryFn: () => getEvents(),
    staleTime: 30_000,
  })
}

export function useInfiniteEvents(sortBy: 'created_at' | 'start_time' = 'created_at') {
  return useInfiniteQuery({
    queryKey: eventKeys.infinite(sortBy),
    queryFn: ({ pageParam }) => getEvents({ limit: PAGE_SIZE, offset: pageParam, sortBy }),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.length < PAGE_SIZE) return undefined
      return allPages.reduce((total, page) => total + page.length, 0)
    },
    staleTime: 30_000,
  })
}
