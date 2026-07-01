import { describe, it, expect } from 'vitest';
import { Contact } from '../../domain/entities/contact.entity';

describe('Contact entity', () => {
  const tenantId = '0192a1b2-c3d4-7890-abcd-ef1234567890';
  const orgId = '0192a1b2-c3d4-7890-abcd-ef1234567891';

  it('creates with contact.created event', () => {
    const c = Contact.create({ tenantId, organizationId: orgId, name: 'John Doe', email: 'j@example.com' });
    expect(c.name).toBe('John Doe');
    expect(c.email).toBe('j@example.com');
    const events = c.pullEvents();
    expect(events.map((e) => e.eventName)).toContain('contact.created');
  });

  it('updateDetails changes fields', () => {
    const c = Contact.create({ tenantId, organizationId: orgId, name: 'Ab' });
    c.pullEvents();
    c.updateDetails({ name: 'Bob', phone: '+79990001122' });
    expect(c.name).toBe('Bob');
    expect(c.phone).toBe('+79990001122');
  });
});
