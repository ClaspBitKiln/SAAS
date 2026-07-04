import { DomainEvent } from '../../../../shared/domain/domain-event';
import { newId } from '../../../../shared/infrastructure/uuid';

type TaskEventName = 'task.created' | 'task.updated' | 'task.completed' | 'task.cancelled';

export function makeTaskEvent(
  name: TaskEventName,
  task: { id: string; tenantId: string; version: number },
  payload: Record<string, unknown>,
): DomainEvent {
  return {
    eventId: newId(),
    eventName: name,
    tenantId: task.tenantId,
    aggregateType: 'Task',
    aggregateId: task.id,
    version: task.version,
    occurredAt: new Date(),
    payload,
  };
}
