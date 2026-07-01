import { describe, it, expect } from 'vitest';
import { Membership } from '../../domain/entities/membership.entity';

describe('Membership entity', () => {
  const tenantId = '0192a1b2-c3d4-7890-abcd-ef1234567890';
  const userId = '0192a1b2-c3d4-7890-abcd-ef1234567891';
  const orgId = '0192a1b2-c3d4-7890-abcd-ef1234567892';

  it('invite creates PENDING membership with event', () => {
    const m = Membership.invite({ tenantId, userId, organizationId: orgId });
    expect(m.status).toBe('PENDING');
    expect(m.invitedAt).not.toBeNull();
    const events = m.pullEvents();
    expect(events.map((e) => e.eventName)).toContain('membership.invited');
  });

  it('accept from PENDING', () => {
    const m = Membership.invite({ tenantId, userId, organizationId: orgId });
    m.pullEvents();
    m.accept();
    expect(m.status).toBe('ACTIVE');
    expect(m.joinedAt).not.toBeNull();
  });
});
