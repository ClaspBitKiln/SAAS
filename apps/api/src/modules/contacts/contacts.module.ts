import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { PrismaService } from '../../database/prisma/prisma.service';
import { PlatformModule } from '../platform/platform.module';
import { CONTACT_REPOSITORY } from './domain/repositories/contact.repository';
import { CONTACT_NOTE_REPOSITORY } from './domain/repositories/contact-note.repository';
import { PrismaContactRepository } from './infrastructure/prisma-contact.repository';
import { PrismaContactNoteRepository } from './infrastructure/prisma-contact-note.repository';
import { ContactController } from './presentation/controllers/contact.controller';
import { ContactNoteController } from './presentation/controllers/contact-note.controller';
import {
  CreateContactHandler,
  DeleteContactHandler,
  UpdateContactHandler,
} from './application/handlers/contact.command-handlers';
import { CreateContactNoteHandler } from './application/handlers/contact-note.command-handlers';
import { GetContactHandler, ListContactsHandler } from './application/handlers/contact.query-handlers';
import { ListContactNotesHandler } from './application/handlers/contact-note.query-handlers';

@Module({
  imports: [CqrsModule, PlatformModule],
  controllers: [ContactController, ContactNoteController],
  providers: [
    PrismaService,
    { provide: CONTACT_REPOSITORY, useClass: PrismaContactRepository },
    { provide: CONTACT_NOTE_REPOSITORY, useClass: PrismaContactNoteRepository },
    CreateContactHandler,
    UpdateContactHandler,
    DeleteContactHandler,
    CreateContactNoteHandler,
    GetContactHandler,
    ListContactsHandler,
    ListContactNotesHandler,
  ],
  exports: [CONTACT_REPOSITORY],
})
export class ContactsModule {}
