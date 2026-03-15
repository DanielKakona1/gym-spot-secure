import type { FastifyPluginAsync } from 'fastify';
import bookingRoutes from './bookings.route';
import gymRoutes from './gym.routes';
import userRoutes from './user.routes';

const routes: FastifyPluginAsync = async (fastify) => {
  fastify.register(gymRoutes);
  fastify.register(userRoutes);
  fastify.register(bookingRoutes);
};

export default routes;
