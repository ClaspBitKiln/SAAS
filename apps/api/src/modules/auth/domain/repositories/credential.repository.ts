import { Credential } from '../entities/credential.entity';

export const CREDENTIAL_REPOSITORY = Symbol('CREDENTIAL_REPOSITORY');

export interface CredentialRepository {
  findByUserId(userId: string): Promise<Credential | null>;
  save(credential: Credential): Promise<void>;
}
