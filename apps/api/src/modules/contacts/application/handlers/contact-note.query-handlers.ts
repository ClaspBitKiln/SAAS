import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { CONTACT_REPOSITORY, ContactRepository } from '../../domain/repositories/contact.repository';
import { CONTACT_NOTE_REPOSITORY, ContactNoteRepository } from '../../domain/repositories/contact-note.repository';
import { ContactNoteResponseDto } from '../dto/contact-note.dto';
import { ListContactNotesQuery } from '../queries/contact-note.queries';

@QueryHandler(ListContactNotesQuery)
export class ListContactNotesHandler implements IQueryHandler<ListContactNotesQuery> {
  constructor(
    @Inject(CONTACT_REPOSITORY) private readonly contactRepo: ContactRepository,
    @Inject(CONTACT_NOTE_REPOSITORY) private readonly noteRepo: ContactNoteRepository,
  ) {}

  async execute(query: ListContactNotesQuery): Promise<ContactNoteResponseDto[]> {
    const contact = await this.contactRepo.findById(query.contactId, query.organizationId);
    if (!contact) throw new Error('Contact not found');
    const notes = await this.noteRepo.listByContact(query.contactId, query.organizationId);
    return notes.map((note) => ({
      id: note.id,
      contactId: note.contactId,
      body: note.body,
      createdById: note.createdById,
      createdAt: note.createdAt.toISOString(),
    }));
  }
}
