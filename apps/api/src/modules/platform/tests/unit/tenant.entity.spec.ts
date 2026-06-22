import { describe, it, expect } from 'vitest';
import { Tenant } from '../../domain/entities/tenant.entity';
import { TenantStatusEnum } from '../../domain/value-objects/tenant-status.vo';

describe('Tenant entity', () => {
  it('создаётся активным, с FREE-планом и событием tenant.created', () => {
    const t = Tenant.create({ name: 'ООО Ромашка', slug: 'Romashka!!' });
    expect(t.status.isActive()).toBe(true);
    expect(t.plan.value).toBe('FREE');
    expect(t.slug).toBe('romashka'); // нормализация slug
    const events = t.pullEvents();
    expect(events.map((e) => e.eventName)).toContain('tenant.created');
    expect(events[0].aggregateType).toBe('Tenant');
  });

  it('suspend меняет статус и инкрементит version + событие', () => {
    const t = Tenant.create({ name: 'Acme', slug: 'acme' });
    t.pullEvents();
    const before = t.version;
    t.suspend();
    expect(t.status.value).toBe(TenantStatusEnum.SUSPENDED);
    expect(t.version).toBe(before + 1);
    expect(t.pullEvents().map((e) => e.eventName)).toContain('tenant.suspended');
  });

  it('нельзя suspend дважды', () => {
    const t = Tenant.create({ name: 'Acme', slug: 'acme' });
    t.suspend();
    expect(() => t.suspend()).toThrow();
  });

  it('activate после suspend возвращает в ACTIVE', () => {
    const t = Tenant.create({ name: 'Acme', slug: 'acme' });
    t.suspend();
    t.activate();
    expect(t.status.isActive()).toBe(true);
  });

  it('нельзя activate уже активного', () => {
    const t = Tenant.create({ name: 'Acme', slug: 'acme' });
    expect(() => t.activate()).toThrow();
  });
});
