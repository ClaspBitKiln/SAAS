import { DomainEvent } from '../../../../shared/domain/domain-event';
import { newId } from '../../../../shared/infrastructure/uuid';

type MembershipEventName =
  | 'membership.invited'
  | 'membership.accepted'
  | 'membership.suspended'
  | 'membership.revoked'
  | 'membership.updated';

export function makeMembershipEvent(
  name: MembershipEventName,
  membership: { id: string; tenantId: string; version: number },
  payload: Record<string, unknown>,
): DomainEvent {
  return {
    eventId: newId(),
    eventName: name,
    tenantId: membership.tenantId,
    aggregateType: 'Membership',
    aggregateId: membership.id,
    version: membership.version,
    occurredAt: new Date(),
    payload,
  };
}
