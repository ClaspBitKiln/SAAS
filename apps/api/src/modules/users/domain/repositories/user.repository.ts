import { User } from '../entities/user.entity';

export const USER_REPOSITORY = Symbol('USER_REPOSITORY');

export interface UserRepository {
  findById(id: string): Promise<User | null>;
  findByEmail(email: string): Promise<User | null>;
  list(params: { page: number; size: number }): Promise<{ items: User[]; total: number }>;
  save(user: User): Promise<void>;
}
