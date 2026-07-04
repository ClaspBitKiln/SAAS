import { describe, it, expect } from 'vitest';
import { Task } from '../../domain/entities/task.entity';
import { TaskStatusEnum, TaskTypeEnum } from '../../domain/value-objects/task-enums';

const base = {
  tenantId: '019f0000-0000-7000-8000-000000000001',
  organizationId: '019f0000-0000-7000-8000-000000000002',
  assigneeUserId: '019f0000-0000-7000-8000-000000000003',
};

describe('Task entity', () => {
  it('creates OPEN TODO task by default', () => {
    const t = Task.create({ ...base, title: 'Позвонить клиенту', dueAt: new Date('2026-07-05T10:00:00Z') });
    expect(t.status).toBe(TaskStatusEnum.OPEN);
    expect(t.type).toBe(TaskTypeEnum.TODO);
    expect(t.assigneeUserId).toBe(base.assigneeUserId);
    expect(t.pullEvents().map((e) => e.eventName)).toContain('task.created');
  });

  it('completes an open task', () => {
    const t = Task.create({ ...base, title: 'Встреча', dueAt: new Date(), type: TaskTypeEnum.MEETING });
    t.complete();
    expect(t.status).toBe(TaskStatusEnum.DONE);
    expect(t.completedAt).not.toBeNull();
  });

  it('rejects double completion', () => {
    const t = Task.create({ ...base, title: 'Задача', dueAt: new Date() });
    t.complete();
    expect(() => t.complete()).toThrow('Task is not open');
    expect(() => t.cancel()).toThrow('Task is not open');
  });

  it('rejects short title', () => {
    expect(() => Task.create({ ...base, title: 'x', dueAt: new Date() })).toThrow();
  });
});
