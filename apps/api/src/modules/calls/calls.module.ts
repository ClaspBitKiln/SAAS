import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { PrismaService } from '../../database/prisma/prisma.service';
import { ContactsModule } from '../contacts/contacts.module';
import { CALL_REPOSITORY } from './domain/repositories/call.repository';
import { PrismaCallRepository } from './infrastructure/prisma-call.repository';
import { CallController } from './presentation/controllers/call.controller';
import { CompleteCallHandler, MissCallHandler, StartCallHandler } from './application/handlers/call.command-handlers';
import {
  GetCallHandler,
  ListCallsByContactHandler,
  ListCallsByOrganizationHandler,
} from './application/handlers/call.query-handlers';

@Module({
  imports: [CqrsModule, ContactsModule],
  controllers: [CallController],
  providers: [
    PrismaService,
    { provide: CALL_REPOSITORY, useClass: PrismaCallRepository },
    StartCallHandler,
    CompleteCallHandler,
    MissCallHandler,
    GetCallHandler,
    ListCallsByContactHandler,
    ListCallsByOrganizationHandler,
  ],
})
export class CallsModule {}
