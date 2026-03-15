import type { FastifyPluginAsync } from 'fastify';
import { bookSlot, cancelBooking, checkInBooking, checkOutBooking } from '../controllers/bookings.controller';

const bookingRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.post('/gyms/:id/book', bookSlot);
  fastify.post('/gyms/:id/bookings/:bookingId/check-in', checkInBooking);
  fastify.post('/gyms/:id/bookings/:bookingId/check-out', checkOutBooking);
  fastify.post('/gyms/:id/bookings/:bookingId/cancel', cancelBooking);
};

export default bookingRoutes;
