import { createBookingModel } from './booking.model';

describe('booking.model', () => {
  it('creates and finds booking by id', async () => {
    const model = createBookingModel();
    const booking = {
      id: 'b1',
      gymId: 'gym-1',
      userId: 'user-1',
      slotTime: '2026-03-12T18:00:00.000Z',
      createdAt: '2026-03-01T00:00:00.000Z',
    };

    await model.createBooking(booking);
    const found = await model.findBookingById('b1');

    expect(found).toEqual(booking);
  });

  it('counts bookings per gym and slot', async () => {
    const model = createBookingModel();

    await model.createBooking({
      id: 'b1',
      gymId: 'gym-1',
      userId: 'user-1',
      slotTime: '2026-03-12T18:00:00.000Z',
      createdAt: '2026-03-01T00:00:00.000Z',
    });
    await model.createBooking({
      id: 'b2',
      gymId: 'gym-1',
      userId: 'user-2',
      slotTime: '2026-03-12T18:00:00.000Z',
      createdAt: '2026-03-01T00:01:00.000Z',
    });

    const count = (await model.listBookingsForSlot('gym-1', '2026-03-12T18:00:00.000Z')).length;

    expect(count).toBe(2);
  });

  it('lists bookings by user', async () => {
    const model = createBookingModel();

    await model.createBooking({
      id: 'b1',
      gymId: 'gym-1',
      userId: 'user-1',
      slotTime: '2026-03-12T08:00:00.000Z',
      createdAt: '2026-03-01T00:00:00.000Z',
    });
    await model.createBooking({
      id: 'b2',
      gymId: 'gym-2',
      userId: 'user-1',
      slotTime: '2026-03-12T10:00:00.000Z',
      createdAt: '2026-03-01T00:01:00.000Z',
    });
    await model.createBooking({
      id: 'b3',
      gymId: 'gym-1',
      userId: 'user-2',
      slotTime: '2026-03-12T08:00:00.000Z',
      createdAt: '2026-03-01T00:02:00.000Z',
    });

    const bookings = await model.listBookingsByUser('user-1');

    expect(bookings).toHaveLength(2);
    expect(bookings.every((booking) => booking.userId === 'user-1')).toBe(true);
  });
});
