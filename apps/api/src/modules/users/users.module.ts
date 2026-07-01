import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { PrismaService } from '../../database/prisma/prisma.service';
import { USER_REPOSITORY } from './domain/repositories/user.repository';
import { PrismaUserRepository } from './infrastructure/prisma-user.repository';
import { UserController } from './presentation/controllers/user.controller';
import {
  ActivateUserHandler,
  CreateUserHandler,
  DisableUserHandler,
  UpdateUserHandler,
} from './application/handlers/user.command-handlers';
import {
  GetUserByEmailHandler,
  GetUserHandler,
  ListUsersHandler,
} from './application/handlers/user.query-handlers';

const CommandHandlers = [CreateUserHandler, UpdateUserHandler, ActivateUserHandler, DisableUserHandler];
const QueryHandlers = [GetUserHandler, GetUserByEmailHandler, ListUsersHandler];

@Module({
  imports: [CqrsModule],
  controllers: [UserController],
  providers: [
    PrismaService,
    { provide: USER_REPOSITORY, useClass: PrismaUserRepository },
    ...CommandHandlers,
    ...QueryHandlers,
  ],
})
export class UsersModule {}
