import { DomainEvent } from '../../../../shared/domain/domain-event';
import { newId } from '../../../../shared/infrastructure/uuid';

type OrganizationEventName = 'organization.created' | 'organization.updated';

export function makeOrganizationEvent(
  name: OrganizationEventName,
  org: { id: string; tenantId: string; version: number },
  payload: Record<string, unknown>,
): DomainEvent {
  return {
    eventId: newId(),
    eventName: name,
    tenantId: org.tenantId,
    aggregateType: 'Organization',
    aggregateId: org.id,
    version: org.version,
    occurredAt: new Date(),
    payload,
  };
}
