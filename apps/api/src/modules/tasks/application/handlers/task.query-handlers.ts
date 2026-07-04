import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { TASK_REPOSITORY, TaskRepository } from '../../domain/repositories/task.repository';
import { GetTaskQuery, ListTasksQuery, TodayTasksQuery } from '../queries/task.queries';
import { TaskResponseDto, toTaskResponse } from '../dto/task-response.dto';
import { TaskStatusEnum } from '../../domain/value-objects/task-enums';
import { Page } from '../../../../shared/application/pagination';

@QueryHandler(GetTaskQuery)
export class GetTaskHandler implements IQueryHandler<GetTaskQuery> {
  constructor(@Inject(TASK_REPOSITORY) private readonly repo: TaskRepository) {}

  async execute(q: GetTaskQuery): Promise<TaskResponseDto | null> {
    const task = await this.repo.findById(q.id, q.organizationId);
    return task ? toTaskResponse(task) : null;
  }
}

@QueryHandler(ListTasksQuery)
export class ListTasksHandler implements IQueryHandler<ListTasksQuery> {
  constructor(@Inject(TASK_REPOSITORY) private readonly repo: TaskRepository) {}

  async execute(q: ListTasksQuery): Promise<Page<TaskResponseDto>> {
    const { items, total } = await this.repo.listByOrganization(q.organizationId, {
      page: q.page,
      size: q.size,
      status: q.status,
      assigneeUserId: q.assigneeUserId,
      contactId: q.contactId,
      companyId: q.companyId,
    });
    return { items: items.map(toTaskResponse), page: q.page, size: q.size, total };
  }
}

@QueryHandler(TodayTasksQuery)
export class TodayTasksHandler implements IQueryHandler<TodayTasksQuery> {
  constructor(@Inject(TASK_REPOSITORY) private readonly repo: TaskRepository) {}

  async execute(q: TodayTasksQuery): Promise<TaskResponseDto[]> {
    const endOfToday = new Date();
    endOfToday.setHours(23, 59, 59, 999);
    const { items } = await this.repo.listByOrganization(q.organizationId, {
      page: 1,
      size: 100,
      status: TaskStatusEnum.OPEN,
      assigneeUserId: q.assigneeUserId,
      dueBefore: endOfToday,
    });
    return items.map(toTaskResponse);
  }
}
