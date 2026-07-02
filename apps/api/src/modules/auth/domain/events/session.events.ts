import { DomainEvent } from '../../../../shared/domain/domain-event';
import { newId } from '../../../../shared/infrastructure/uuid';

export const SESSION_EVENT_TENANT_SCOPE = '00000000-0000-0000-0000-000000000001';

type SessionEventName = 'session.created' | 'session.refreshed' | 'session.revoked';

export function makeSessionEvent(
  name: SessionEventName,
  session: { id: string; version: number },
  payload: Record<string, unknown>,
): DomainEvent {
  return {
    eventId: newId(),
    eventName: name,
    tenantId: SESSION_EVENT_TENANT_SCOPE,
    aggregateType: 'Session',
    aggregateId: session.id,
    version: session.version,
    occurredAt: new Date(),
    payload,
  };
}
