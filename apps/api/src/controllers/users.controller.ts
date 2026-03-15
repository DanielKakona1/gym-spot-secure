import type { FastifyReply, FastifyRequest } from 'fastify';
import { sendError } from '../utils/send-error.util';

interface UserIdParams {
  id: string;
}

export async function listUsers(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  try {
    const users = await request.server.services.user.listUsers();
    reply.status(200).send({ success: true, data: users, message: 'Users retrieved successfully' });
  } catch (error) {
    sendError(error, reply);
  }
}

export async function listUserBookings(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  try {
    const params = request.params as UserIdParams;
    const bookings = await request.server.services.booking.listUserBookings(params.id);
    reply.status(200).send({ success: true, data: bookings, message: 'User bookings retrieved successfully' });
  } catch (error) {
    sendError(error, reply);
  }
}
