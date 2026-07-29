import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { PrismaService } from '../../database/prisma/prisma.service';
import { PlatformModule } from '../platform/platform.module';
import { ContactsModule } from '../contacts/contacts.module';
import { EMetallModule } from '../e-metall/e-metall.module';
import { TasksModule } from '../tasks/tasks.module';
import { REQUEST_REPOSITORY } from './domain/repositories/request.repository';
import { PrismaRequestRepository } from './infrastructure/prisma-request.repository';
import { RequestController } from './presentation/controllers/request.controller';
import {
  CreateRequestHandler,
  MarkProposalDownloadedHandler,
  MarkProposalSentHandler,
  PrepareQuoteHandler,
  RecordRequestOutcomeHandler,
  SearchRequestHandler,
  UpdateRequestHandler,
} from './application/handlers/request.command-handlers';
import { GetRequestHandler, ListRequestsHandler } from './application/handlers/request.query-handlers';
import { RequestParseService } from './application/services/request-parse.service';
import {
  PROPOSAL_EMAIL_SENDER,
  ProposalEmailService,
} from './application/services/proposal-email.service';
import { SmtpProposalEmailSender } from './infrastructure/smtp-proposal-email.sender';

@Module({
  imports: [CqrsModule, PlatformModule, ContactsModule, EMetallModule, TasksModule],
  controllers: [RequestController],
  providers: [
    PrismaService,
    { provide: REQUEST_REPOSITORY, useClass: PrismaRequestRepository },
    RequestParseService,
    ProposalEmailService,
    { provide: PROPOSAL_EMAIL_SENDER, useClass: SmtpProposalEmailSender },
    CreateRequestHandler,
    UpdateRequestHandler,
    PrepareQuoteHandler,
    MarkProposalDownloadedHandler,
    MarkProposalSentHandler,
    RecordRequestOutcomeHandler,
    SearchRequestHandler,
    GetRequestHandler,
    ListRequestsHandler,
  ],
})
export class RequestsModule {}
