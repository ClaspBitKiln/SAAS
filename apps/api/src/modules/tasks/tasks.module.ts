import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { PrismaService } from '../../database/prisma/prisma.service';
import { PlatformModule } from '../platform/platform.module';
import { MembershipsModule } from '../memberships/memberships.module';
import { ContactsModule } from '../contacts/contacts.module';
import { CompaniesModule } from '../companies/companies.module';
import { TASK_REPOSITORY } from './domain/repositories/task.repository';
import { PrismaTaskRepository } from './infrastructure/prisma-task.repository';
import { TaskController } from './presentation/controllers/task.controller';
import {
  CancelTaskHandler,
  CompleteTaskHandler,
  CreateTaskHandler,
  UpdateTaskHandler,
} from './application/handlers/task.command-handlers';
import { GetTaskHandler, ListTasksHandler, TodayTasksHandler } from './application/handlers/task.query-handlers';

@Module({
  imports: [CqrsModule, PlatformModule, MembershipsModule, ContactsModule, CompaniesModule],
  controllers: [TaskController],
  providers: [
    PrismaService,
    { provide: TASK_REPOSITORY, useClass: PrismaTaskRepository },
    CreateTaskHandler,
    UpdateTaskHandler,
    CompleteTaskHandler,
    CancelTaskHandler,
    GetTaskHandler,
    ListTasksHandler,
    TodayTasksHandler,
  ],
  exports: [TASK_REPOSITORY],
})
export class TasksModule {}
