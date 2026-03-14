import { useQuery } from '@tanstack/react-query';
import { gymService } from '../services/gymService';

export function useUserBookings(userId: string) {
  return useQuery({
    queryKey: ['user-bookings', userId],
    queryFn: () => gymService.listUserBookings(userId),
    enabled: userId.length > 0,
    staleTime: 0,
    refetchOnMount: 'always',
  });
}
