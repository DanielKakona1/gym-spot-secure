import type { User } from '@gym-spot/shared-types';
import type { UserModel } from '../models/user.model';

export interface UserService {
  listUsers: () => Promise<User[]>;
}

export function createUserService(userModel: UserModel): UserService {
  return {
    async listUsers(): Promise<User[]> {
      return userModel.listUsers();
    },
  };
}
