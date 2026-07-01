import { DomainEvent } from '../../../../shared/domain/domain-event';
import { newId } from '../../../../shared/infrastructure/uuid';

/** Event envelope tenantId for global User aggregate (no tenant scope on entity). */
export const USER_EVENT_TENANT_SCOPE = '00000000-0000-0000-0000-000000000001';

type UserEventName = 'user.created' | 'user.updated' | 'user.activated' | 'user.disabled';

export function makeUserEvent(
  name: UserEventName,
  user: { id: string; version: number },
  payload: Record<string, unknown>,
): DomainEvent {
  return {
    eventId: newId(),
    eventName: name,
    tenantId: USER_EVENT_TENANT_SCOPE,
    aggregateType: 'User',
    aggregateId: user.id,
    version: user.version,
    occurredAt: new Date(),
    payload,
  };
}
