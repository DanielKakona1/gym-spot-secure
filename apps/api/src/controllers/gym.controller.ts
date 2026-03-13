import { FastifyReply, FastifyRequest } from 'fastify';
import { isCapacityExceededError, isConflictError, isNotFoundError } from '../errors/domain.error';
import { GymModel, UserModel } from '../models/gym.model';
import { BookingService } from '../services/booking.service';

interface CapacityParams {
  id: string;
}

interface BookingActionParams extends CapacityParams {
  bookingId: string;
}

interface CapacityQuery {
  slotTime?: string;
}

interface BookSlotBody {
  userId: string;
  slotTime: string;
}

function handleError(error: unknown, reply: FastifyReply): void {
  if (isNotFoundError(error)) {
    reply.status(404).send({ message: error.message });
    return;
  }

  if (isConflictError(error) || isCapacityExceededError(error)) {
    reply.status(409).send({ message: error.message });
    return;
  }

  reply.status(500).send({ message: 'Unexpected error' });
}

export interface GymController {
  listGyms: (_request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  listUsers: (_request: FastifyRequest, reply: FastifyReply) => Promise<void>;
  listUserBookings: (request: FastifyRequest<{ Params: CapacityParams }>, reply: FastifyReply) => Promise<void>;
  getCapacity: (request: FastifyRequest<{ Params: CapacityParams; Querystring: CapacityQuery }>, reply: FastifyReply) => Promise<void>;
  bookSlot: (request: FastifyRequest<{ Params: CapacityParams; Body: BookSlotBody }>, reply: FastifyReply) => Promise<void>;
  checkInBooking: (request: FastifyRequest<{ Params: BookingActionParams }>, reply: FastifyReply) => Promise<void>;
  checkOutBooking: (request: FastifyRequest<{ Params: BookingActionParams }>, reply: FastifyReply) => Promise<void>;
  cancelBooking: (request: FastifyRequest<{ Params: BookingActionParams }>, reply: FastifyReply) => Promise<void>;
}

export function createGymController(bookingService: BookingService, gymModel: GymModel, userModel: UserModel): GymController {
  return {
    async listGyms(_request: FastifyRequest, reply: FastifyReply): Promise<void> {
      try {
        const gyms = await gymModel.listGyms();
        reply.status(200).send(gyms);
      } catch (error) {
        handleError(error, reply);
      }
    },

    async listUsers(_request: FastifyRequest, reply: FastifyReply): Promise<void> {
      try {
        const users = await userModel.listUsers();
        reply.status(200).send(users);
      } catch (error) {
        handleError(error, reply);
      }
    },

    async listUserBookings(request: FastifyRequest<{ Params: CapacityParams }>, reply: FastifyReply): Promise<void> {
      try {
        const bookings = await bookingService.listUserBookings(request.params.id);
        reply.status(200).send(bookings);
      } catch (error) {
        handleError(error, reply);
      }
    },

    async getCapacity(
      request: FastifyRequest<{ Params: CapacityParams; Querystring: CapacityQuery }>,
      reply: FastifyReply,
    ): Promise<void> {
      try {
        const slotTime = request.query.slotTime ?? new Date().toISOString();
        const capacity = await bookingService.getGymCapacity(request.params.id, slotTime);
        reply.status(200).send(capacity);
      } catch (error) {
        handleError(error, reply);
      }
    },

    async bookSlot(
      request: FastifyRequest<{ Params: CapacityParams; Body: BookSlotBody }>,
      reply: FastifyReply,
    ): Promise<void> {
      try {
        const booking = await bookingService.bookSlot(request.params.id, request.body);
        reply.status(201).send(booking);
      } catch (error) {
        handleError(error, reply);
      }
    },

    async checkInBooking(request: FastifyRequest<{ Params: BookingActionParams }>, reply: FastifyReply): Promise<void> {
      try {
        const booking = await bookingService.checkInBooking(request.params.id, request.params.bookingId);
        reply.status(200).send(booking);
      } catch (error) {
        handleError(error, reply);
      }
    },

    async checkOutBooking(request: FastifyRequest<{ Params: BookingActionParams }>, reply: FastifyReply): Promise<void> {
      try {
        const booking = await bookingService.checkOutBooking(request.params.id, request.params.bookingId);
        reply.status(200).send(booking);
      } catch (error) {
        handleError(error, reply);
      }
    },

    async cancelBooking(request: FastifyRequest<{ Params: BookingActionParams }>, reply: FastifyReply): Promise<void> {
      try {
        const booking = await bookingService.cancelBooking(request.params.id, request.params.bookingId);
        reply.status(200).send(booking);
      } catch (error) {
        handleError(error, reply);
      }
    },
  };
}
