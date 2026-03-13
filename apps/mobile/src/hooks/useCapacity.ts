import { useQuery } from '@tanstack/react-query';
import { gymService } from '../services/gymService';

export function useCapacity(gymId: string, slotTime: string) {
  return useQuery({
    queryKey: ['capacity', gymId, slotTime],
    queryFn: () => gymService.getCapacity(gymId, slotTime),
    enabled: gymId.length > 0 && slotTime.length > 0,
    staleTime: 5_000,
    refetchInterval: 5_000,
  });
}
