import { randomUUID } from 'node:crypto';
import type { Booking, BookingRequest, CapacityResponse } from '@gym-spot/shared-types';
import { createCapacityExceededError, createConflictError, createNotFoundError } from '../errors/domain.error';
import { BookingModel } from '../models/booking.model';
import { GymModel } from '../models/gym.model';
import { LockManager, createLockManager } from '../utils/lock-manager.util';

const NO_SHOW_GRACE_MINUTES = 15;

export interface BookingService {
  getGymCapacity: (gymId: string, slotTime: string) => Promise<CapacityResponse>;
  listUserBookings: (userId: string) => Promise<Booking[]>;
  bookSlot: (gymId: string, request: BookingRequest) => Promise<Booking>;
  checkInBooking: (gymId: string, bookingId: string) => Promise<Booking>;
  checkOutBooking: (gymId: string, bookingId: string) => Promise<Booking>;
  cancelBooking: (gymId: string, bookingId: string) => Promise<Booking>;
}

export function createBookingService(
  gymModel: GymModel,
  bookingModel: BookingModel,
  lockManager: LockManager = createLockManager(),
): BookingService {
  const getStatus = (booking: Booking): NonNullable<Booking['status']> => booking.status ?? 'BOOKED';
  const toDayKey = (slotTime: string): string => new Date(slotTime).toISOString().slice(0, 10);

  const isNoShowExpired = (booking: Booking, now: Date): boolean => {
    if (getStatus(booking) !== 'BOOKED') {
      return false;
    }
    const slotMs = new Date(booking.slotTime).getTime();
    const graceMs = NO_SHOW_GRACE_MINUTES * 60 * 1000;
    return now.getTime() > slotMs + graceMs;
  };

  const expireNoShowIfNeeded = async (booking: Booking, now: Date): Promise<Booking> => {
    if (!isNoShowExpired(booking, now)) {
      return booking;
    }
    const expired: Booking = {
      ...booking,
      status: 'NO_SHOW',
      cancelledAt: now.toISOString(),
      cancelledReason: 'NO_SHOW_TIMEOUT',
    };
    await bookingModel.updateBooking(expired);
    return expired;
  };

  const expireNoShowsForSlot = async (gymId: string, slotTime: string, now: Date): Promise<Booking[]> => {
    const bookings = await bookingModel.listBookingsForSlot(gymId, slotTime);
    const normalized = await Promise.all(bookings.map((booking) => expireNoShowIfNeeded(booking, now)));
    return normalized;
  };

  const expireNoShowsForGym = async (gymId: string, now: Date): Promise<Booking[]> => {
    const bookings = await bookingModel.listBookingsByGym(gymId);
    const normalized = await Promise.all(bookings.map((booking) => expireNoShowIfNeeded(booking, now)));
    return normalized;
  };

  const countsTowardsSlotCapacity = (booking: Booking, slotTime: string, now: Date): boolean => {
    if (toDayKey(booking.slotTime) !== toDayKey(slotTime)) {
      return false;
    }

    const status = getStatus(booking);
    if (status === 'CHECKED_IN') {
      return true;
    }
    if (status !== 'BOOKED') {
      return false;
    }
    if (booking.slotTime !== slotTime) {
      return false;
    }
    return !isNoShowExpired(booking, now);
  };

  const countsTowardsLiveCapacity = (booking: Booking, slotTime: string, now: Date): boolean => {
    if (toDayKey(booking.slotTime) !== toDayKey(slotTime)) {
      return false;
    }

    const status = getStatus(booking);
    if (status === 'CHECKED_IN') {
      return true;
    }
    if (status !== 'BOOKED') {
      return false;
    }
    return !isNoShowExpired(booking, now);
  };

  const resolveBookingForGym = async (gymId: string, bookingId: string): Promise<Booking> => {
    const booking = await bookingModel.findBookingById(bookingId);
    if (!booking || booking.gymId !== gymId) {
      throw createNotFoundError(`Booking ${bookingId} was not found for gym ${gymId}`);
    }
    return booking;
  };

  const runWithLocks = async <T>(keys: string[], task: () => Promise<T>): Promise<T> => {
    const orderedKeys = [...new Set(keys)].sort();

    const executeAt = (index: number): Promise<T> => {
      if (index >= orderedKeys.length) {
        return task();
      }

      return lockManager.runExclusive(orderedKeys[index], () => executeAt(index + 1));
    };

    return executeAt(0);
  };

  return {
    async getGymCapacity(gymId: string, slotTime: string): Promise<CapacityResponse> {
      const gym = await gymModel.getGymById(gymId);

      if (!gym) {
        throw createNotFoundError(`Gym ${gymId} was not found`);
      }

      const now = new Date();
      const bookings = await expireNoShowsForGym(gymId, now);
      const countedBookings = bookings.filter((booking) => countsTowardsLiveCapacity(booking, slotTime, now));
      const bookingsCount = countedBookings.length;
      const fullnessPercentage = Math.round((bookingsCount / gym.capacityLimit) * 100);

      if (process.env.CAPACITY_DEBUG === 'true') {
        console.info(
          '[capacity-debug]',
          JSON.stringify({
            gymId,
            slotTime,
            dayKey: toDayKey(slotTime),
            currentBookings: bookingsCount,
            countedBookings: countedBookings.map((booking) => ({
              id: booking.id,
              userId: booking.userId,
              slotTime: booking.slotTime,
              status: getStatus(booking),
            })),
          }),
        );
      }

      return {
        gymId,
        currentBookings: bookingsCount,
        capacityLimit: gym.capacityLimit,
        fullnessPercentage,
      };
    },

    async listUserBookings(userId: string): Promise<Booking[]> {
      const now = new Date();
      const bookings = await bookingModel.listBookingsByUser(userId);
      const normalized = await Promise.all(bookings.map((booking) => expireNoShowIfNeeded(booking, now)));
      return normalized.filter((booking) => {
        const status = getStatus(booking);
        return status === 'BOOKED' || status === 'CHECKED_IN';
      });
    },

    async bookSlot(gymId: string, request: BookingRequest): Promise<Booking> {
      const gym = await gymModel.getGymById(gymId);

      if (!gym) {
        throw createNotFoundError(`Gym ${gymId} was not found`);
      }

      const slotLockKey = `slot:${gymId}:${request.slotTime}`;
      const userLockKey = `user:${request.userId}`;

      return runWithLocks([slotLockKey, userLockKey], async () => {
        const now = new Date();
        const userBookings = await bookingModel.listBookingsByUser(request.userId);
        const normalizedUserBookings = await Promise.all(userBookings.map((booking) => expireNoShowIfNeeded(booking, now)));
        const hasActiveBookingSameDay = normalizedUserBookings.some((booking) => {
          const status = getStatus(booking);
          if (status !== 'BOOKED' && status !== 'CHECKED_IN') {
            return false;
          }
          return toDayKey(booking.slotTime) === toDayKey(request.slotTime);
        });
        if (hasActiveBookingSameDay) {
          throw createConflictError('User already has an active booking for this day.');
        }

        const slotBookings = await expireNoShowsForSlot(gymId, request.slotTime, now);
        const existingBooking = slotBookings.find(
          (booking) => booking.userId === request.userId && (getStatus(booking) === 'BOOKED' || getStatus(booking) === 'CHECKED_IN'),
        );
        if (existingBooking) {
          throw createConflictError('User already has this slot booked');
        }

        const gymBookings = await expireNoShowsForGym(gymId, now);
        const currentBookings = gymBookings.filter((booking) => countsTowardsSlotCapacity(booking, request.slotTime, now)).length;
        if (currentBookings >= gym.capacityLimit) {
          throw createCapacityExceededError('Slot is fully booked');
        }

        const newBooking: Booking = {
          id: randomUUID(),
          gymId,
          userId: request.userId,
          slotTime: request.slotTime,
          createdAt: now.toISOString(),
          status: 'BOOKED',
        };

        return bookingModel.createBooking(newBooking);
      });
    },

    async checkInBooking(gymId: string, bookingId: string): Promise<Booking> {
      const booking = await resolveBookingForGym(gymId, bookingId);
      const now = new Date();
      const normalized = await expireNoShowIfNeeded(booking, now);
      const status = getStatus(normalized);

      if (status === 'NO_SHOW' || status === 'CANCELLED') {
        throw createConflictError('Booking is no longer active');
      }
      if (status === 'CHECKED_OUT') {
        throw createConflictError('Booking has already been checked out');
      }
      if (status === 'CHECKED_IN') {
        return normalized;
      }

      const updated: Booking = {
        ...normalized,
        status: 'CHECKED_IN',
        checkedInAt: now.toISOString(),
      };
      return bookingModel.updateBooking(updated);
    },

    async checkOutBooking(gymId: string, bookingId: string): Promise<Booking> {
      const booking = await resolveBookingForGym(gymId, bookingId);
      const now = new Date();
      const normalized = await expireNoShowIfNeeded(booking, now);
      const status = getStatus(normalized);

      if (status === 'NO_SHOW' || status === 'CANCELLED') {
        throw createConflictError('Booking is no longer active');
      }
      if (status === 'CHECKED_OUT') {
        return normalized;
      }
      if (status !== 'CHECKED_IN') {
        throw createConflictError('Booking must be checked in before check out');
      }

      const updated: Booking = {
        ...normalized,
        status: 'CHECKED_OUT',
        checkedOutAt: now.toISOString(),
      };
      return bookingModel.updateBooking(updated);
    },

    async cancelBooking(gymId: string, bookingId: string): Promise<Booking> {
      const booking = await resolveBookingForGym(gymId, bookingId);
      const now = new Date();
      const normalized = await expireNoShowIfNeeded(booking, now);
      const status = getStatus(normalized);

      if (status === 'CHECKED_OUT' || status === 'NO_SHOW') {
        return normalized;
      }
      if (status === 'CHECKED_IN') {
        throw createConflictError('Cannot cancel while user is checked in; check out first');
      }
      if (status === 'CANCELLED') {
        return normalized;
      }

      const updated: Booking = {
        ...normalized,
        status: 'CANCELLED',
        cancelledAt: now.toISOString(),
        cancelledReason: 'USER_CANCELLED',
      };
      return bookingModel.updateBooking(updated);
    },
  };
}
