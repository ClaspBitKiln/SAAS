import { Call } from '../entities/call.entity';

export const CALL_REPOSITORY = Symbol('CALL_REPOSITORY');

export interface CallRepository {
  findById(id: string): Promise<Call | null>;
  listByContact(contactId: string, params: { page: number; size: number }): Promise<{ items: Call[]; total: number }>;
  listByOrganization(
    organizationId: string,
    params: { page: number; size: number },
  ): Promise<{ items: Call[]; total: number }>;
  save(call: Call): Promise<void>;
}
