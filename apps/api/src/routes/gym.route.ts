import { FastifyInstance } from 'fastify';
import { GymController } from '../controllers/gym.controller';

export async function registerGymRoutes(fastify: FastifyInstance, controller: GymController): Promise<void> {
  fastify.get('/gyms', controller.listGyms);
  fastify.get('/users', controller.listUsers);
  fastify.get('/users/:id/bookings', controller.listUserBookings);
  fastify.get('/gyms/:id/capacity', controller.getCapacity);
  fastify.post('/gyms/:id/book', controller.bookSlot);
  fastify.post('/gyms/:id/bookings/:bookingId/check-in', controller.checkInBooking);
  fastify.post('/gyms/:id/bookings/:bookingId/check-out', controller.checkOutBooking);
  fastify.post('/gyms/:id/bookings/:bookingId/cancel', controller.cancelBooking);
}
