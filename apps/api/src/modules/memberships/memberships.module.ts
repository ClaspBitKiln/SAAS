import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { PrismaService } from '../../database/prisma/prisma.service';
import { PlatformModule } from '../platform/platform.module';
import { UsersModule } from '../users/users.module';
import { MEMBERSHIP_REPOSITORY } from './domain/repositories/membership.repository';
import { PrismaMembershipRepository } from './infrastructure/prisma-membership.repository';
import { MembershipController } from './presentation/controllers/membership.controller';
import {
  AcceptMembershipHandler,
  ChangeMembershipRoleHandler,
  InviteMembershipHandler,
  RevokeMembershipHandler,
  SetDefaultMembershipHandler,
  SuspendMembershipHandler,
} from './application/handlers/membership.command-handlers';
import {
  GetMembershipHandler,
  ListMembershipsByOrganizationHandler,
  ListMembershipsByUserHandler,
} from './application/handlers/membership.query-handlers';

const CommandHandlers = [
  InviteMembershipHandler,
  AcceptMembershipHandler,
  SuspendMembershipHandler,
  RevokeMembershipHandler,
  SetDefaultMembershipHandler,
  ChangeMembershipRoleHandler,
];
const QueryHandlers = [GetMembershipHandler, ListMembershipsByUserHandler, ListMembershipsByOrganizationHandler];

@Module({
  imports: [CqrsModule, PlatformModule, UsersModule],
  controllers: [MembershipController],
  providers: [
    PrismaService,
    { provide: MEMBERSHIP_REPOSITORY, useClass: PrismaMembershipRepository },
    ...CommandHandlers,
    ...QueryHandlers,
  ],
})
export class MembershipsModule {}
