import { deriveEventStatus } from '@/components/event/EventStatusChip'
import { getEvents } from '@/lib/api/events'
import { useInfiniteQuery } from '@tanstack/react-query'

const PAGE_SIZE = 30

export type SearchStatusFilter = 'Available' | 'Ongoing' | 'Ended' | null

interface SearchParams {
  query: string
  category: string | null
  statusFilter: SearchStatusFilter
  sortBy: 'created_at' | 'start_time'
}

export function useSearchEvents({ query, category, statusFilter, sortBy }: SearchParams) {
  const result = useInfiniteQuery({
    queryKey: ['events', 'search', category ?? 'all', sortBy],
    queryFn: ({ pageParam }) =>
      getEvents({ limit: PAGE_SIZE, offset: pageParam, category: category ?? undefined, sortBy }),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.length < PAGE_SIZE) return undefined
      return allPages.reduce((total, page) => total + page.length, 0)
    },
    staleTime: 30_000,
  })

  const allEvents = result.data?.pages.flatMap((p) => p) ?? []
  const q = query.trim().toLowerCase()

  const events = allEvents.filter((event) => {
    if (q) {
      const matches =
        event.title.toLowerCase().includes(q) ||
        (event.organizationName ?? '').toLowerCase().includes(q) ||
        (event.location ?? '').toLowerCase().includes(q)
      if (!matches) return false
    }
    if (statusFilter) {
      const s = deriveEventStatus(event.startTime, event.endTime, event.unlockTime)
      if (statusFilter === 'Ended') {
        if (s !== 'Ended' && s !== 'Settlement' && s !== 'Closed') return false
      } else {
        if (s !== statusFilter) return false
      }
    }
    return true
  })

  return { ...result, events }
}
