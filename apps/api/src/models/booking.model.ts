import type { Booking } from '@gym-spot/shared-types';

export interface BookingModel {
  listBookingsForSlot: (gymId: string, slotTime: string) => Promise<Booking[]>;
  listBookingsByGym: (gymId: string) => Promise<Booking[]>;
  listBookingsByUser: (userId: string) => Promise<Booking[]>;
  findBookingById: (bookingId: string) => Promise<Booking | null>;
  createBooking: (booking: Booking) => Promise<Booking>;
  updateBooking: (booking: Booking) => Promise<Booking>;
}

export function createBookingModel(seedBookings?: Booking[]): BookingModel {
  const bookings: Booking[] = [...(seedBookings ?? [])];

  return {
    async listBookingsForSlot(gymId: string, slotTime: string): Promise<Booking[]> {
      return bookings.filter((booking) => booking.gymId === gymId && booking.slotTime === slotTime);
    },

    async listBookingsByGym(gymId: string): Promise<Booking[]> {
      return bookings.filter((booking) => booking.gymId === gymId);
    },

    async listBookingsByUser(userId: string): Promise<Booking[]> {
      return bookings.filter((booking) => booking.userId === userId);
    },

    async findBookingById(bookingId: string): Promise<Booking | null> {
      return bookings.find((booking) => booking.id === bookingId) ?? null;
    },

    async createBooking(booking: Booking): Promise<Booking> {
      bookings.push(booking);
      return booking;
    },

    async updateBooking(booking: Booking): Promise<Booking> {
      const index = bookings.findIndex((item) => item.id === booking.id);
      if (index >= 0) {
        bookings[index] = booking;
      }
      return booking;
    },
  };
}
