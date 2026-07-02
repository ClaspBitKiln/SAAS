import { ContactNote } from '../entities/contact-note.entity';

export const CONTACT_NOTE_REPOSITORY = Symbol('CONTACT_NOTE_REPOSITORY');

export interface ContactNoteRepository {
  listByContact(contactId: string, organizationId: string): Promise<ContactNote[]>;
  save(note: ContactNote): Promise<void>;
}
