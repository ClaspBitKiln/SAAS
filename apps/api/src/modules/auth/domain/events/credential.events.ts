import { DomainEvent } from '../../../../shared/domain/domain-event';
import { newId } from '../../../../shared/infrastructure/uuid';

/** Event envelope tenantId for global Credential aggregate. */
export const CREDENTIAL_EVENT_TENANT_SCOPE = '00000000-0000-0000-0000-000000000001';

type CredentialEventName = 'credential.created' | 'credential.password_changed';

export function makeCredentialEvent(
  name: CredentialEventName,
  credential: { id: string; version: number },
  payload: Record<string, unknown>,
): DomainEvent {
  return {
    eventId: newId(),
    eventName: name,
    tenantId: CREDENTIAL_EVENT_TENANT_SCOPE,
    aggregateType: 'Credential',
    aggregateId: credential.id,
    version: credential.version,
    occurredAt: new Date(),
    payload,
  };
}
