import type { BookingRequest } from '@gym-spot/shared-types';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { gymService } from '../services/gymService';

export function useBookSlot(gymId: string) {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (request: BookingRequest) => gymService.bookSlot(gymId, request),
    onSuccess: (booking) => {
      queryClient.invalidateQueries({
        queryKey: ['capacity', gymId, booking.slotTime],
      });
      queryClient.invalidateQueries({
        queryKey: ['user-bookings', booking.userId],
      });
    },
  });
}
