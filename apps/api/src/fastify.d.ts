import type { BookingModel } from './models/booking.model';
import type { GymModel } from './models/gym.model';
import type { UserModel } from './models/user.model';
import type { BookingService } from './services/booking.service';
import type { GymService } from './services/gym.service';
import type { UserService } from './services/user.service';

declare module 'fastify' {
  interface FastifyInstance {
    models: {
      gym: GymModel;
      user: UserModel;
      booking: BookingModel;
    };
    services: {
      booking: BookingService;
      gym: GymService;
      user: UserService;
    };
  }
}

export {};
