import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler } from '@nestjs/cqrs';
import { CONTACT_REPOSITORY, ContactRepository } from '../../domain/repositories/contact.repository';
import { CONTACT_NOTE_REPOSITORY, ContactNoteRepository } from '../../domain/repositories/contact-note.repository';
import { ContactNote } from '../../domain/entities/contact-note.entity';
import { CreateContactNoteCommand } from '../commands/contact-note.commands';

@CommandHandler(CreateContactNoteCommand)
export class CreateContactNoteHandler implements ICommandHandler<CreateContactNoteCommand> {
  constructor(
    @Inject(CONTACT_REPOSITORY) private readonly contactRepo: ContactRepository,
    @Inject(CONTACT_NOTE_REPOSITORY) private readonly noteRepo: ContactNoteRepository,
  ) {}

  async execute(cmd: CreateContactNoteCommand): Promise<{ id: string }> {
    const contact = await this.contactRepo.findById(cmd.contactId, cmd.organizationId);
    if (!contact) throw new Error('Contact not found');
    const note = ContactNote.create({
      tenantId: contact.tenantId,
      organizationId: cmd.organizationId,
      contactId: cmd.contactId,
      body: cmd.body,
      createdById: cmd.createdById,
    });
    await this.noteRepo.save(note);
    return { id: note.id };
  }
}
