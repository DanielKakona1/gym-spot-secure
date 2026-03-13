import { createBookingModel } from '../models/booking.model';
import { createGymModel } from '../models/gym.model';
import { createBookingService } from './booking.service';

describe('BookingService', () => {
  it('prevents overbooking under concurrent requests', async () => {
    const gymModel = createGymModel([
      {
        id: 'gym-1',
        name: 'Peak Club',
        capacityLimit: 1,
      },
    ]);
    const bookingModel = createBookingModel();

    const service = createBookingService(gymModel, bookingModel);
    const slotTime = '2099-03-12T18:00:00.000Z';

    const results = await Promise.allSettled([
      service.bookSlot('gym-1', { userId: 'user-1', slotTime }),
      service.bookSlot('gym-1', { userId: 'user-2', slotTime }),
    ]);

    const fulfilled = results.filter((result) => result.status === 'fulfilled');
    const rejected = results.filter((result) => result.status === 'rejected');

    expect(fulfilled.length).toBe(1);
    expect(rejected.length).toBe(1);
    expect(rejected[0]?.status).toBe('rejected');
    if (rejected[0]?.status === 'rejected') {
      expect(rejected[0].reason).toMatchObject({ code: 'CAPACITY_EXCEEDED' });
    }
  });

  it('prevents duplicate booking for same user and slot', async () => {
    const gymModel = createGymModel([
      {
        id: 'gym-1',
        name: 'Peak Club',
        capacityLimit: 10,
      },
      {
        id: 'gym-2',
        name: 'River Club',
        capacityLimit: 10,
      },
    ]);
    const bookingModel = createBookingModel();

    const service = createBookingService(gymModel, bookingModel);
    const slotTime = '2099-03-12T18:00:00.000Z';

    await service.bookSlot('gym-1', { userId: 'user-1', slotTime });

    await expect(service.bookSlot('gym-2', { userId: 'user-1', slotTime })).rejects.toMatchObject({ code: 'CONFLICT' });
  });

  it('prevents concurrent active bookings for the same user across slots', async () => {
    const gymModel = createGymModel([
      {
        id: 'gym-1',
        name: 'Peak Club',
        capacityLimit: 10,
      },
    ]);
    const bookingModel = createBookingModel();
    const service = createBookingService(gymModel, bookingModel);

    const results = await Promise.allSettled([
      service.bookSlot('gym-1', { userId: 'user-1', slotTime: '2099-03-12T08:00:00.000Z' }),
      service.bookSlot('gym-1', { userId: 'user-1', slotTime: '2099-03-12T10:00:00.000Z' }),
    ]);

    const fulfilled = results.filter((result) => result.status === 'fulfilled');
    const rejected = results.filter((result) => result.status === 'rejected');

    expect(fulfilled.length).toBe(1);
    expect(rejected.length).toBe(1);
    expect(rejected[0]?.status).toBe('rejected');
    if (rejected[0]?.status === 'rejected') {
      expect(rejected[0].reason).toMatchObject({ code: 'CONFLICT' });
    }
  });

  it('allows active bookings on different days for the same user', async () => {
    const gymModel = createGymModel([
      {
        id: 'gym-1',
        name: 'Peak Club',
        capacityLimit: 10,
      },
    ]);
    const bookingModel = createBookingModel();
    const service = createBookingService(gymModel, bookingModel);

    const first = await service.bookSlot('gym-1', { userId: 'user-1', slotTime: '2099-03-12T08:00:00.000Z' });
    const second = await service.bookSlot('gym-1', { userId: 'user-1', slotTime: '2099-03-13T10:00:00.000Z' });

    expect(first.id).toBeDefined();
    expect(second.id).toBeDefined();
  });

  it('counts checked-in members in capacity across other times until check-out', async () => {
    const gymModel = createGymModel([
      {
        id: 'gym-1',
        name: 'Peak Club',
        capacityLimit: 30,
      },
    ]);
    const bookingModel = createBookingModel();
    const service = createBookingService(gymModel, bookingModel);

    const booking = await service.bookSlot('gym-1', { userId: 'user-1', slotTime: '2099-03-12T10:00:00.000Z' });
    await service.checkInBooking('gym-1', booking.id);

    const capacityAtDifferentTime = await service.getGymCapacity('gym-1', '2099-03-12T12:00:00.000Z');
    expect(capacityAtDifferentTime.currentBookings).toBe(1);
  });

  it('counts both checked-in members and booked users for requested time', async () => {
    const gymModel = createGymModel([
      {
        id: 'gym-1',
        name: 'Peak Club',
        capacityLimit: 30,
      },
    ]);
    const bookingModel = createBookingModel();
    const service = createBookingService(gymModel, bookingModel);

    const checkedInBooking = await service.bookSlot('gym-1', { userId: 'user-1', slotTime: '2099-03-12T10:00:00.000Z' });
    await service.checkInBooking('gym-1', checkedInBooking.id);
    await service.bookSlot('gym-1', { userId: 'user-2', slotTime: '2099-03-12T12:00:00.000Z' });

    const capacityAtNoon = await service.getGymCapacity('gym-1', '2099-03-12T12:00:00.000Z');
    expect(capacityAtNoon.currentBookings).toBe(2);
  });

  it('does not count bookings from other days in live capacity', async () => {
    const gymModel = createGymModel([
      {
        id: 'gym-1',
        name: 'Peak Club',
        capacityLimit: 30,
      },
    ]);
    const bookingModel = createBookingModel();
    const service = createBookingService(gymModel, bookingModel);

    await service.bookSlot('gym-1', { userId: 'user-1', slotTime: '2099-03-12T10:00:00.000Z' });

    const sameDayCapacity = await service.getGymCapacity('gym-1', '2099-03-12T12:00:00.000Z');
    const otherDayCapacity = await service.getGymCapacity('gym-1', '2099-03-13T12:00:00.000Z');

    expect(sameDayCapacity.currentBookings).toBe(1);
    expect(otherDayCapacity.currentBookings).toBe(0);
  });

  it('does not count checked-in users from previous days', async () => {
    const gymModel = createGymModel([
      {
        id: 'gym-1',
        name: 'Peak Club',
        capacityLimit: 30,
      },
    ]);
    const bookingModel = createBookingModel();
    const service = createBookingService(gymModel, bookingModel);

    const oldBooking = await service.bookSlot('gym-1', { userId: 'user-1', slotTime: '2099-03-12T10:00:00.000Z' });
    await service.checkInBooking('gym-1', oldBooking.id);

    const nextDayCapacity = await service.getGymCapacity('gym-1', '2099-03-13T12:00:00.000Z');
    expect(nextDayCapacity.currentBookings).toBe(0);
  });

  it('lists bookings by user', async () => {
    const gymModel = createGymModel([
      { id: 'gym-1', name: 'Peak Club', capacityLimit: 10 },
      { id: 'gym-2', name: 'River Club', capacityLimit: 10 },
    ]);
    const bookingModel = createBookingModel();
    const service = createBookingService(gymModel, bookingModel);

    await service.bookSlot('gym-1', { userId: 'user-1', slotTime: '2099-03-12T08:00:00.000Z' });
    await expect(service.bookSlot('gym-2', { userId: 'user-1', slotTime: '2099-03-12T10:00:00.000Z' })).rejects.toMatchObject({
      code: 'CONFLICT',
    });
    await service.bookSlot('gym-1', { userId: 'user-2', slotTime: '2099-03-12T12:00:00.000Z' });

    const userBookings = await service.listUserBookings('user-1');

    expect(userBookings).toHaveLength(1);
    expect(userBookings.every((booking) => booking.userId === 'user-1')).toBe(true);
  });
});
