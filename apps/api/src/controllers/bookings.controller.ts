import type { FastifyReply, FastifyRequest } from 'fastify';
import { sendError } from '../utils/send-error.util';

interface GymIdParams {
  id: string;
}

interface BookingActionParams extends GymIdParams {
  bookingId: string;
}

interface BookSlotBody {
  userId: string;
  slotTime: string;
}

export async function bookSlot(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  try {
    const bookingService = request.server.services.booking;
    const params = request.params as GymIdParams;
    const body = request.body as BookSlotBody;
    const booking = await bookingService.bookSlot(params.id, body);
    reply.status(201).send({ success: true, data: booking, message: 'Booking created successfully' });
  } catch (error) {
    sendError(error, reply);
  }
}

export async function checkInBooking(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  try {
    const bookingService = request.server.services.booking;
    const params = request.params as BookingActionParams;
    const booking = await bookingService.checkInBooking(params.id, params.bookingId);
    reply.status(200).send({ success: true, data: booking, message: 'Booking checked in successfully' });
  } catch (error) {
    sendError(error, reply);
  }
}

export async function checkOutBooking(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  try {
    const bookingService = request.server.services.booking;
    const params = request.params as BookingActionParams;
    const booking = await bookingService.checkOutBooking(params.id, params.bookingId);
    reply.status(200).send({ success: true, data: booking, message: 'Booking checked out successfully' });
  } catch (error) {
    sendError(error, reply);
  }
}

export async function cancelBooking(request: FastifyRequest, reply: FastifyReply): Promise<void> {
  try {
    const bookingService = request.server.services.booking;
    const params = request.params as BookingActionParams;
    const booking = await bookingService.cancelBooking(params.id, params.bookingId);
    reply.status(200).send({ success: true, data: booking, message: 'Booking cancelled successfully' });
  } catch (error) {
    sendError(error, reply);
  }
}
