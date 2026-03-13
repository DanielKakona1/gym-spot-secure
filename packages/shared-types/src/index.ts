export interface Gym {
  id: string;
  name: string;
  location?: string;
  capacityLimit: number;
}

export interface User {
  id: string;
  name: string;
}

export interface Booking {
  id: string;
  gymId: string;
  userId: string;
  slotTime: string;
  createdAt: string;
  status?: 'BOOKED' | 'CHECKED_IN' | 'CHECKED_OUT' | 'CANCELLED' | 'NO_SHOW';
  checkedInAt?: string;
  checkedOutAt?: string;
  cancelledAt?: string;
  cancelledReason?: 'USER_CANCELLED' | 'NO_SHOW_TIMEOUT';
}

export interface BookingRequest {
  userId: string;
  slotTime: string;
}

export interface CapacityResponse {
  gymId: string;
  currentBookings: number;
  capacityLimit: number;
  fullnessPercentage: number;
}
