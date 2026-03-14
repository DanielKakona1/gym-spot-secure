import { useQuery } from '@tanstack/react-query';
import { gymService } from '../services/gymService';

export function useGyms() {
  return useQuery({
    queryKey: ['gyms'],
    queryFn: () => gymService.listGyms(),
  });
}
