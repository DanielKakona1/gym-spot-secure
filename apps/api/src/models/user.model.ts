import type { User } from '@gym-spot/shared-types';

export interface UserModel {
  listUsers: () => Promise<User[]>;
}

export function createUserModel(): UserModel {
  const users = [
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
