import Fastify, { FastifyInstance } from 'fastify';
import { createGymController } from './controllers/gym.controller';
import { createBookingModel } from './models/booking.model';
import { createGymModel, createUserModel } from './models/gym.model';
import { registerGymRoutes } from './routes/gym.route';
import { buildSeedBookings } from './seeds/booking.seed';
import { createBookingService } from './services/booking.service';

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
