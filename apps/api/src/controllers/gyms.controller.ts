import type { FastifyReply, FastifyRequest } from 'fastify';
import { sendError } from '../utils/send-error.util';

interface GymIdParams {
  id: string;
}

interface CapacityQuery {
  slotTime?: string;
}

export async function listGyms(_request: FastifyRequest, reply: FastifyReply): Promise<void> {
  try {
    const gyms = await _request.server.services.gym.listGyms();
    reply.status(200).send({ success: true, data: gyms, message: 'Gyms retrieved successfully' });
  } catch (error) {
    sendError(error, reply);
  }
}

export async function getCapacity(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  try {
    const params = request.params as GymIdParams;
    const query = request.query as CapacityQuery;
    const slotTime = query.slotTime ?? new Date().toISOString();
    const capacity = await request.server.services.booking.getGymCapacity(params.id, slotTime);
    reply.status(200).send({ success: true, data: capacity, message: 'Capacity retrieved successfully' });
  } catch (error) {
    sendError(error, reply);
  }
}
