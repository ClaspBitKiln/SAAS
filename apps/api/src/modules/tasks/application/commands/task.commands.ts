import { TaskTypeEnum } from '../../domain/value-objects/task-enums';

export class CreateTaskCommand {
  constructor(
    readonly organizationId: string,
    readonly title: string,
    readonly dueAt: Date,
    readonly type?: TaskTypeEnum,
    readonly assigneeUserId?: string | null,
    readonly contactId?: string | null,
    readonly companyId?: string | null,
    readonly currentUserId?: string,
  ) {}
}

export class UpdateTaskCommand {
  constructor(
    readonly id: string,
    readonly organizationId: string,
    readonly title?: string,
    readonly dueAt?: Date,
    readonly type?: TaskTypeEnum,
    readonly assigneeUserId?: string,
    readonly contactId?: string | null,
    readonly companyId?: string | null,
  ) {}
}

export class CompleteTaskCommand {
  constructor(readonly id: string, readonly organizationId: string) {}
}

export class CancelTaskCommand {
  constructor(readonly id: string, readonly organizationId: string) {}
}
