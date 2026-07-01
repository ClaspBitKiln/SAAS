import { describe, it, expect } from 'vitest';
import { OrganizationName } from '../../domain/value-objects/organization-name.vo';

describe('OrganizationName VO', () => {
  it('принимает валидное имя', () => {
    expect(new OrganizationName('ООО Ромашка').toString()).toBe('ООО Ромашка');
  });

  it('отклоняет слишком короткое имя', () => {
    expect(() => new OrganizationName('A')).toThrow(/минимум 2/);
  });
});
