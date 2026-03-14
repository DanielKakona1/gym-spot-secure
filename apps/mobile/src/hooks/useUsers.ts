import { useQuery } from '@tanstack/react-query';
import { gymService } from '../services/gymService';

export function useUsers() {
  return useQuery({
    queryKey: ['users'],
    queryFn: () => gymService.listUsers(),
  });
}
