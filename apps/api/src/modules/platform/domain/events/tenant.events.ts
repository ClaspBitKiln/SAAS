import { DomainEvent } from '../../../../shared/domain/domain-event';
import { newId } from '../../../../shared/infrastructure/uuid';

type TenantEventName = 'tenant.created' | 'tenant.activated' | 'tenant.suspended';

export function makeTenantEvent(
  name: TenantEventName,
  tenant: { id: string; version: number },
  payload: Record<string, unknown>,
): DomainEvent {
  return {
    eventId: newId(),
    eventName: name,
    tenantId: tenant.id,
    aggregateType: 'Tenant',
    aggregateId: tenant.id,
    version: tenant.version,
    occurredAt: new Date(),
    payload,
  };
}
