import type { Gym, User } from '@gym-spot/shared-types';

export interface GymModel {
  getGymById: (gymId: string) => Promise<Gym | null>;
  listGyms: () => Promise<Gym[]>;
}

export interface UserModel {
  listUsers: () => Promise<User[]>;
}

export function createGymModel(seedGyms?: Gym[]): GymModel {
  const gymsById = new Map<string, Gym>();
  const gyms = seedGyms ?? [
    { id: 'gym-1', name: 'Greenline Fitness', location: 'Johannesburg - Sandton', capacityLimit: 30 },
    { id: 'gym-2', name: 'Greenline Fitness', location: 'Johannesburg - Rosebank', capacityLimit: 24 },
    { id: 'gym-3', name: 'Greenline Fitness', location: 'Johannesburg - Midrand', capacityLimit: 20 },
    { id: 'gym-4', name: 'Greenline Fitness', location: 'Johannesburg - Fourways', capacityLimit: 16 },
  ];

  gyms.forEach((gym) => gymsById.set(gym.id, gym));

  return {
    async getGymById(gymId: string): Promise<Gym | null> {
      return gymsById.get(gymId) ?? null;
    },
    async listGyms(): Promise<Gym[]> {
      return [...gymsById.values()];
    },
  };
}

export function createUserModel(seedUsers?: User[]): UserModel {
  const users = seedUsers ?? [
    { id: 'user-daniel-kakona', name: 'Daniel Kakona' },
    { id: 'user-keiden-kakona', name: 'Keiden Kakona' },
    { id: 'user-benjamin-kakona', name: 'Benjamin Kakona' },
    { id: 'user-david-kakona', name: 'David Kakona' },
    { id: 'user-beni-kakona', name: 'Beni Kakona' },
  ];

  return {
    async listUsers(): Promise<User[]> {
      return [...users];
    },
  };
}
