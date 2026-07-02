import { DomainEvent } from '../../../../shared/domain/domain-event';
import { newId } from '../../../../shared/infrastructure/uuid';

type CallEventName = 'call.started' | 'call.completed' | 'call.missed';

export function makeCallEvent(
  name: CallEventName,
  call: { id: string; tenantId: string; version: number },
  payload: Record<string, unknown>,
): DomainEvent {
  return {
    eventId: newId(),
    eventName: name,
    tenantId: call.tenantId,
    aggregateType: 'Call',
    aggregateId: call.id,
    version: call.version,
    occurredAt: new Date(),
    payload,
  };
}
