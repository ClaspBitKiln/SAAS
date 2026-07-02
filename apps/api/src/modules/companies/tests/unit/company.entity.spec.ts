import { describe, it, expect } from 'vitest';
import { Company } from '../../domain/entities/company.entity';

describe('Company entity', () => {
  const tenantId = '0192a1b2-c3d4-7890-abcd-ef1234567890';
  const orgId = '0192a1b2-c3d4-7890-abcd-ef1234567891';

  it('creates with company.created event', () => {
    const c = Company.create({
      tenantId,
      organizationId: orgId,
      name: 'ООО Велесстрой',
      inn: '7707083893',
    });
    expect(c.name).toBe('ООО Велесстрой');
    expect(c.inn).toBe('7707083893');
    const events = c.pullEvents();
    expect(events.map((e) => e.eventName)).toContain('company.created');
  });

  it('updateDetails changes fields', () => {
    const c = Company.create({ tenantId, organizationId: orgId, name: 'Test Co' });
    c.pullEvents();
    c.updateDetails({ name: 'Updated Co', phone: '+79990001122' });
    expect(c.name).toBe('Updated Co');
    expect(c.phone).toBe('+79990001122');
  });

  it('rejects invalid INN', () => {
    expect(() =>
      Company.create({ tenantId, organizationId: orgId, name: 'Bad INN Co', inn: '123' }),
    ).toThrow('Inn: must be 10 or 12 digits');
  });
});
