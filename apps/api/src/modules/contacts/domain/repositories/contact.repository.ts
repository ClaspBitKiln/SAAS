import { Contact } from '../entities/contact.entity';

export const CONTACT_REPOSITORY = Symbol('CONTACT_REPOSITORY');

export interface ContactRepository {
  findById(id: string, organizationId: string): Promise<Contact | null>;
  listByOrganization(
    organizationId: string,
    params: { page: number; size: number },
  ): Promise<{ items: Contact[]; total: number }>;
  save(contact: Contact): Promise<void>;
}
