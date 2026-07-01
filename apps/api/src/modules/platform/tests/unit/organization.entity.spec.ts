import { describe, it, expect } from 'vitest';
import { Organization } from '../../domain/entities/organization.entity';

describe('Organization entity', () => {
  const tenantId = '0192a1b2-c3d4-7890-abcd-ef1234567890';

  it('создаётся с событием organization.created', () => {
    const org = Organization.create({ tenantId, name: 'ООО Ромашка', inn: '7707083893' });
    expect(org.name).toBe('ООО Ромашка');
    expect(org.inn).toBe('7707083893');
    expect(org.tenantId).toBe(tenantId);
    const events = org.pullEvents();
    expect(events.map((e) => e.eventName)).toContain('organization.created');
  });

  it('updateDetails меняет поля и инкрементит version', () => {
    const org = Organization.create({ tenantId, name: 'Acme' });
    org.pullEvents();
    const before = org.version;
    org.updateDetails({ name: 'Acme LLC', settings: { tz: 'Europe/Moscow' } });
    expect(org.name).toBe('Acme LLC');
    expect(org.settings).toEqual({ tz: 'Europe/Moscow' });
    expect(org.version).toBe(before + 1);
  });
});
