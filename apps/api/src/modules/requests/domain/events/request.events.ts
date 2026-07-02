import { DomainEvent } from '../../../../shared/domain/domain-event';
import { newId } from '../../../../shared/infrastructure/uuid';

type RequestEventName = 'request.created' | 'request.updated' | 'request.searched';

export function makeRequestEvent(
  name: RequestEventName,
  request: { id: string; tenantId: string; version: number },
  payload: Record<string, unknown>,
): DomainEvent {
  return {
    eventId: newId(),
    eventName: name,
    tenantId: request.tenantId,
    aggregateType: 'Request',
    aggregateId: request.id,
    version: request.version,
    occurredAt: new Date(),
    payload,
  };
}
