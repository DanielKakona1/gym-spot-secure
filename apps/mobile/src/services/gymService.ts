import type { Booking, BookingRequest, CapacityResponse, Gym, User } from '@gym-spot/shared-types';

const API_BASE_URL = 'http://localhost:3000';

interface ApiEnvelope<T> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

async function parseResponse<T>(response: Response): Promise<T> {
  const payload = (await response.json()) as ApiEnvelope<T>;

  if (!response.ok) {
    const message = typeof payload?.message === 'string' ? payload.message : 'Request failed';
    throw new Error(message);
  }

  return payload.data as T;
}

export const gymService = {
  async listGyms(): Promise<Gym[]> {
    const response = await fetch(`${API_BASE_URL}/gyms`);
    return parseResponse<Gym[]>(response);
  },

  async listUsers(): Promise<User[]> {
    const response = await fetch(`${API_BASE_URL}/users`);
    return parseResponse<User[]>(response);
  },

  async listUserBookings(userId: string): Promise<Booking[]> {
    const response = await fetch(`${API_BASE_URL}/users/${userId}/bookings`);
    return parseResponse<Booking[]>(response);
  },

  async getCapacity(gymId: string, slotTime: string): Promise<CapacityResponse> {
    const query = new URLSearchParams({ slotTime }).toString();
    const response = await fetch(`${API_BASE_URL}/gyms/${gymId}/capacity?${query}`);
    return parseResponse<CapacityResponse>(response);
  },

  async bookSlot(gymId: string, request: BookingRequest): Promise<Booking> {
    const response = await fetch(`${API_BASE_URL}/gyms/${gymId}/book`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(request),
    });

    return parseResponse<Booking>(response);
  },

  async checkInBooking(gymId: string, bookingId: string): Promise<Booking> {
    const response = await fetch(`${API_BASE_URL}/gyms/${gymId}/bookings/${bookingId}/check-in`, {
      method: 'POST',
    });
    return parseResponse<Booking>(response);
  },

  async checkOutBooking(gymId: string, bookingId: string): Promise<Booking> {
    const response = await fetch(`${API_BASE_URL}/gyms/${gymId}/bookings/${bookingId}/check-out`, {
      method: 'POST',
    });
    return parseResponse<Booking>(response);
  },

  async cancelBooking(gymId: string, bookingId: string): Promise<Booking> {
    const response = await fetch(`${API_BASE_URL}/gyms/${gymId}/bookings/${bookingId}/cancel`, {
      method: 'POST',
    });
    return parseResponse<Booking>(response);
  },
};
