import { Injectable } from '@nestjs/common';
import * as bcrypt from 'bcryptjs';

export const PASSWORD_HASHER = Symbol('PASSWORD_HASHER');

export interface PasswordHasher {
  hash(plain: string): Promise<string>;
  compare(plain: string, hash: string): Promise<boolean>;
}

@Injectable()
export class BcryptPasswordHasher implements PasswordHasher {
  private readonly rounds = 10;

  async hash(plain: string): Promise<string> {
    return bcrypt.hash(plain, this.rounds);
  }

  async compare(plain: string, hash: string): Promise<boolean> {
    return bcrypt.compare(plain, hash);
  }
}
