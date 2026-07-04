import { TaskStatusEnum } from '../../domain/value-objects/task-enums';

export class GetTaskQuery {
  constructor(readonly id: string, readonly organizationId: string) {}
}

export class ListTasksQuery {
  constructor(
    readonly organizationId: string,
    readonly page: number,
    readonly size: number,
    readonly status?: TaskStatusEnum,
    readonly assigneeUserId?: string,
    readonly contactId?: string,
    readonly companyId?: string,
  ) {}
}

/** Open tasks of the given assignee due today or overdue. */
export class TodayTasksQuery {
  constructor(readonly organizationId: string, readonly assigneeUserId: string) {}
}
