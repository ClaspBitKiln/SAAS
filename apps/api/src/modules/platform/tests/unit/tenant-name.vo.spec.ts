import { describe, it, expect } from 'vitest';
import { TenantName } from '../../domain/value-objects/tenant-name.vo';

describe('TenantName VO', () => {
  it('принимает валидное имя и тримит', () => {
    expect(new TenantName('  Acme  ').toString()).toBe('Acme');
  });

  it('отклоняет слишком короткое', () => {
    expect(() => new TenantName('a')).toThrow();
  });

  it('отклоняет слишком длинное', () => {
    expect(() => new TenantName('x'.repeat(256))).toThrow();
  });

  it('equals сравнивает по значению', () => {
    expect(new TenantName('Acme').equals(new TenantName('Acme'))).toBe(true);
  });
});
