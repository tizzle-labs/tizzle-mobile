import { useMutation } from '@tanstack/react-query'
import { checkInRegistration } from '@/lib/api/registrations'

export function useCheckIn() {
  return useMutation({
    mutationFn: (registrationPda: string) => checkInRegistration(registrationPda),
  })
}
