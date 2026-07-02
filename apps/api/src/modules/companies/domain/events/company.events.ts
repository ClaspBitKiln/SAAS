import { DomainEvent } from '../../../../shared/domain/domain-event';
import { newId } from '../../../../shared/infrastructure/uuid';

type CompanyEventName = 'company.created' | 'company.updated' | 'company.deleted';

export function makeCompanyEvent(
  name: CompanyEventName,
  company: { id: string; tenantId: string; version: number },
  payload: Record<string, unknown>,
): DomainEvent {
  return {
    eventId: newId(),
    eventName: name,
    tenantId: company.tenantId,
    aggregateType: 'Company',
    aggregateId: company.id,
    version: company.version,
    occurredAt: new Date(),
    payload,
  };
}
