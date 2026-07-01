import { describe, it, expect } from 'vitest';
import { Inn } from '../../domain/value-objects/inn.vo';

describe('Inn VO', () => {
  it('принимает 10 цифр (юрлицо)', () => {
    expect(new Inn('7707083893').toString()).toBe('7707083893');
  });

  it('принимает 12 цифр (ИП)', () => {
    expect(new Inn('500100732259').length).toBe(12);
  });

  it('отклоняет невалидный ИНН', () => {
    expect(() => new Inn('123')).toThrow(/10 или 12/);
    expect(() => new Inn('abcdefghij')).toThrow();
  });
});
