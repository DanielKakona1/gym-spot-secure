import type { Booking } from '@gym-spot/shared-types';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { gymService } from '../services/gymService';

type BookingAdminAction = 'CHECK_IN' | 'CHECK_OUT' | 'CANCEL';

interface BookingAdminActionPayload {
  action: BookingAdminAction;
  booking: Booking;
}

export function useBookingAdminActions() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async ({ action, booking }: BookingAdminActionPayload) => {
      if (action === 'CHECK_IN') {
        return gymService.checkInBooking(booking.gymId, booking.id);
      }
      if (action === 'CHECK_OUT') {
        return gymService.checkOutBooking(booking.gymId, booking.id);
      }
      return gymService.cancelBooking(booking.gymId, booking.id);
    },
    onSuccess: (_booking, variables) => {
      queryClient.invalidateQueries({ queryKey: ['user-bookings', variables.booking.userId] });
      queryClient.invalidateQueries({ queryKey: ['capacity'] });
      queryClient.invalidateQueries({ queryKey: ['capacity-by-time'] });
    },
  });
}
