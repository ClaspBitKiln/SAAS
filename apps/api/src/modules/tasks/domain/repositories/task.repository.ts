import { Task } from '../entities/task.entity';
import { TaskStatusEnum } from '../value-objects/task-enums';

export const TASK_REPOSITORY = Symbol('TASK_REPOSITORY');

export interface TaskListParams {
  page: number;
  size: number;
  status?: TaskStatusEnum;
  assigneeUserId?: string;
  dueBefore?: Date;
  contactId?: string;
  companyId?: string;
}

export interface TaskRepository {
  findById(id: string, organizationId: string): Promise<Task | null>;
  listByOrganization(organizationId: string, params: TaskListParams): Promise<{ items: Task[]; total: number }>;
  save(task: Task): Promise<void>;
}
