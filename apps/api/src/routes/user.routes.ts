import type { FastifyPluginAsync } from 'fastify';
import { listUserBookings, listUsers } from '../controllers/users.controller';

const userRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/users', listUsers);
  fastify.get('/users/:id/bookings', listUserBookings);
};

export default userRoutes;
