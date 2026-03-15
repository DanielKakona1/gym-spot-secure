import type { Gym } from '@gym-spot/shared-types';
import type { GymModel } from '../models/gym.model';

export interface GymService {
  listGyms: () => Promise<Gym[]>;
  getGymById: (gymId: string) => Promise<Gym | null>;
}

export function createGymService(gymModel: GymModel): GymService {
  return {
    async listGyms(): Promise<Gym[]> {
      return gymModel.listGyms();
    },
    async getGymById(gymId: string): Promise<Gym | null> {
      return gymModel.getGymById(gymId);
    },
  };
}
