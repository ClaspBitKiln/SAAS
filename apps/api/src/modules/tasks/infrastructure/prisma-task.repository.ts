import { Injectable } from '@nestjs/common';
import { TaskStatus as PrismaTaskStatus, TaskType as PrismaTaskType } from '@prisma/client';
import { PrismaService } from '../../../database/prisma/prisma.service';
import { TaskListParams, TaskRepository } from '../domain/repositories/task.repository';
import { Task } from '../domain/entities/task.entity';
import { TaskStatusEnum, TaskTypeEnum } from '../domain/value-objects/task-enums';

@Injectable()
export class PrismaTaskRepository implements TaskRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string, organizationId: string): Promise<Task | null> {
    const row = await this.prisma.task.findFirst({
      where: { id, organizationId, deletedAt: null },
    });
    return row ? this.toDomain(row) : null;
  }

  async listByOrganization(
    organizationId: string,
    params: TaskListParams,
  ): Promise<{ items: Task[]; total: number }> {
    const where = {
      organizationId,
      deletedAt: null,
      ...(params.status ? { status: params.status as PrismaTaskStatus } : {}),
      ...(params.assigneeUserId ? { assigneeUserId: params.assigneeUserId } : {}),
      ...(params.dueBefore ? { dueAt: { lte: params.dueBefore } } : {}),
      ...(params.contactId ? { contactId: params.contactId } : {}),
      ...(params.companyId ? { companyId: params.companyId } : {}),
    };
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.task.findMany({
        where,
        orderBy: { dueAt: 'asc' },
        skip: (params.page - 1) * params.size,
        take: params.size,
      }),
      this.prisma.task.count({ where }),
    ]);
    return { items: rows.map((r) => this.toDomain(r)), total };
  }

  async save(task: Task): Promise<void> {
    const data = {
      tenantId: task.tenantId,
      organizationId: task.organizationId,
      assigneeUserId: task.assigneeUserId,
      contactId: task.contactId,
      companyId: task.companyId,
      title: task.title,
      type: task.type as PrismaTaskType,
      status: task.status as PrismaTaskStatus,
      dueAt: task.dueAt,
      completedAt: task.completedAt,
      deletedAt: task.deletedAt,
    };
    const existing = await this.prisma.task.findUnique({ where: { id: task.id } });
    if (!existing) {
      await this.prisma.task.create({ data: { id: task.id, ...data, version: task.version } });
      return;
    }
    const updated = await this.prisma.task.updateMany({
      where: { id: task.id, version: task.version - 1 },
      data: { ...data, version: task.version, updatedAt: new Date() },
    });
    if (updated.count === 0) {
      throw new Error('OptimisticLockError: Task was modified concurrently');
    }
  }

  private toDomain(row: {
    id: string;
    tenantId: string;
    organizationId: string;
    assigneeUserId: string;
    contactId: string | null;
    companyId: string | null;
    title: string;
    type: PrismaTaskType;
    status: PrismaTaskStatus;
    dueAt: Date;
    completedAt: Date | null;
    version: number;
    createdAt: Date;
    updatedAt: Date;
  }): Task {
    return Task.rehydrate({
      id: row.id,
      tenantId: row.tenantId,
      organizationId: row.organizationId,
      assigneeUserId: row.assigneeUserId,
      contactId: row.contactId,
      companyId: row.companyId,
      title: row.title,
      type: row.type as TaskTypeEnum,
      status: row.status as TaskStatusEnum,
      dueAt: row.dueAt,
      completedAt: row.completedAt,
      version: row.version,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }
}
