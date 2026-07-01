import { DomainEvent } from '../../../../shared/domain/domain-event';
import { newId } from '../../../../shared/infrastructure/uuid';

type ContactEventName = 'contact.created' | 'contact.updated' | 'contact.deleted';

export function makeContactEvent(
  name: ContactEventName,
  contact: { id: string; tenantId: string; version: number },
  payload: Record<string, unknown>,
): DomainEvent {
  return {
    eventId: newId(),
    eventName: name,
    tenantId: contact.tenantId,
    aggregateType: 'Contact',
    aggregateId: contact.id,
    version: contact.version,
    occurredAt: new Date(),
    payload,
  };
}
