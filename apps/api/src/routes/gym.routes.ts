import type { FastifyPluginAsync } from 'fastify';
import { getCapacity, listGyms } from '../controllers/gyms.controller';

const gymRoutes: FastifyPluginAsync = async (fastify) => {
  fastify.get('/gyms', listGyms);
  fastify.get('/gyms/:id/capacity', getCapacity);
};

export default gymRoutes;
