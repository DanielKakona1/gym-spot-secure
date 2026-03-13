import Fastify, { FastifyInstance } from 'fastify';
import type { Booking } from '@gym-spot/shared-types';
import { createGymController } from './controllers/gym.controller';
import { createBookingModel } from './models/booking.model';
import { createGymModel, createUserModel } from './models/gym.model';
import { registerGymRoutes } from './routes/gym.route';
import { createBookingService } from './services/booking.service';

function toSlotIso(base: Date, dayOffset: number, timeKey: string): string {
  const [hours, minutes] = timeKey.split(':').map(Number);
  const value = new Date(base);
  value.setDate(value.getDate() + dayOffset);
  value.setHours(hours, minutes, 0, 0);
  return value.toISOString();
}

function buildSeedBookings(gym2CapacityLimit: number): Booking[] {
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const now = new Date().toISOString();
  const entries: Booking[] = [];
  const timeKeys = ['06:00', '08:00', '10:00', '12:00', '14:00', '16:00', '18:00', '20:00'];

  // Keep gym-2 fully booked for the day, but never exceed active day capacity.
  for (let i = 1; i <= gym2CapacityLimit; i += 1) {
    const timeKey = timeKeys[(i - 1) % timeKeys.length];
    entries.push({
      id: `seed-gym2-active-${i}`,
      gymId: 'gym-2',
      userId: `seed-user-${i}`,
      slotTime: toSlotIso(today, 0, timeKey),
      createdAt: now,
      status: 'CHECKED_IN',
      checkedInAt: now,
    });
  }

  // Keep additional seeded booking history across all slots without impacting live capacity.
  for (const timeKey of timeKeys) {
    for (let i = 1; i <= gym2CapacityLimit; i += 1) {
      const timeKeyCompact = timeKey.replace(':', '');
      entries.push({
        id: `seed-gym2-history-${timeKeyCompact}-${i}`,
        gymId: 'gym-2',
        userId: `seed-history-user-${timeKeyCompact}-${i}`,
        slotTime: toSlotIso(today, 0, timeKey),
        createdAt: now,
        status: 'CHECKED_OUT',
        checkedInAt: now,
        checkedOutAt: now,
      });
    }
  }

  entries.push({
    id: 'seed-user-daniel-booked',
    gymId: 'gym-1',
    userId: 'user-daniel-kakona',
    slotTime: toSlotIso(today, 0, '10:00'),
    createdAt: now,
  });

  return entries;
}

export async function buildApp(): Promise<FastifyInstance> {
  const app = Fastify({ logger: true });

  const gymModel = createGymModel();
  const userModel = createUserModel();
  const gym2 = await gymModel.getGymById('gym-2');
  const bookingModel = createBookingModel(buildSeedBookings(gym2?.capacityLimit ?? 24));
  const bookingService = createBookingService(gymModel, bookingModel);
  const gymController = createGymController(bookingService, gymModel, userModel);

  await registerGymRoutes(app, gymController);

  return app;
}
