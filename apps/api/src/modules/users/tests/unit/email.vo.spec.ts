import { describe, it, expect } from 'vitest';
import { Email } from '../../domain/value-objects/email.vo';

describe('Email VO', () => {
  it('normalizes to lowercase', () => {
    expect(new Email('Test@Example.COM').toString()).toBe('test@example.com');
  });

  it('rejects invalid format', () => {
    expect(() => new Email('not-an-email')).toThrow('Email: invalid format');
  });
});
