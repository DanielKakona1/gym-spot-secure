import Fastify, { FastifyInstance } from 'fastify';
import { createBookingModel } from './models/booking.model';
import { createGymModel } from './models/gym.model';
import { createUserModel } from './models/user.model';
import routes from './routes';
import { createBookingService } from './services/booking.service';
import { createGymService } from './services/gym.service';
import { createUserService } from './services/user.service';

export async function buildApp(): Promise<FastifyInstance> {
  const app = Fastify({ logger: true });

  const gymModel = createGymModel();
  const userModel = createUserModel();
  const bookingModel = createBookingModel();
  const bookingService = createBookingService(gymModel, bookingModel);
  const gymService = createGymService(gymModel);
  const userService = createUserService(userModel);

  app.decorate('models', {
    gym: gymModel,
    user: userModel,
    booking: bookingModel,
  });

  app.decorate('services', {
    booking: bookingService,
    gym: gymService,
    user: userService,
  });

  await app.register(routes);

  return app;
}
