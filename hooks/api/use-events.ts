import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import { getEvents, getForYouEvents } from '@/lib/api/events'
import { useAuth } from '@/components/auth/auth-provider'

const PAGE_SIZE = 20

export const eventKeys = {
  all: ['events'] as const,
  forYou: ['events', 'for-you'] as const,
  category: (cat: string) => ['events', 'category', cat] as const,
  org: (pda: string) => ['events', 'org', pda] as const,
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

export function useEventsByOrg(organizationPda: string | undefined) {
  return useQuery({
    queryKey: eventKeys.org(organizationPda ?? ''),
    queryFn: () => getEvents({ organizationPda }),
    enabled: !!organizationPda,
    staleTime: 0,
  })
}

export function useInfiniteEventsByOrg(organizationPda: string) {
  return useInfiniteQuery({
    queryKey: [...eventKeys.org(organizationPda), 'infinite'] as const,
    queryFn: ({ pageParam }) => getEvents({ limit: PAGE_SIZE, offset: pageParam, organizationPda, sortBy: 'start_time' }),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.length < PAGE_SIZE) return undefined
      return allPages.reduce((total, page) => total + page.length, 0)
    },
    enabled: !!organizationPda,
    staleTime: 0,
  })
}

export function useForYouEvents() {
  const { isAuthenticated } = useAuth()
  return useQuery({
    queryKey: eventKeys.forYou,
    queryFn: () => getForYouEvents(),
    enabled: isAuthenticated,
    staleTime: 0,
  })
}

export function useInfiniteEventsByCategory(category: string) {
  return useInfiniteQuery({
    queryKey: [...eventKeys.category(category), 'infinite'] as const,
    queryFn: ({ pageParam }) => getEvents({ limit: PAGE_SIZE, offset: pageParam, category, sortBy: 'start_time' }),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.length < PAGE_SIZE) return undefined
      return allPages.reduce((total, page) => total + page.length, 0)
    },
    enabled: !!category,
    staleTime: 0,
  })
}

export function useInfiniteForYouEvents() {
  const { isAuthenticated } = useAuth()
  return useInfiniteQuery({
    queryKey: [...eventKeys.forYou, 'infinite'] as const,
    queryFn: ({ pageParam }) => getForYouEvents({ limit: PAGE_SIZE, offset: pageParam }),
    initialPageParam: 0,
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.length < PAGE_SIZE) return undefined
      return allPages.reduce((total, page) => total + page.length, 0)
    },
    enabled: isAuthenticated,
    staleTime: 0,
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
