import { describe, it, expect } from 'vitest';
import { Credential } from '../../domain/entities/credential.entity';
import { PlainPassword } from '../../domain/value-objects/plain-password.vo';

describe('Credential entity', () => {
  const userId = '0192a1b2-c3d4-7890-abcd-ef1234567890';

  it('create emits credential.created', () => {
    const c = Credential.create(userId, '$2a$10$hash');
    expect(c.userId).toBe(userId);
    const events = c.pullEvents();
    expect(events.map((e) => e.eventName)).toContain('credential.created');
  });

  it('changePassword emits credential.password_changed', () => {
    const c = Credential.create(userId, 'hash1');
    c.pullEvents();
    c.changePassword('hash2');
    expect(c.passwordHash).toBe('hash2');
    const events = c.pullEvents();
    expect(events.map((e) => e.eventName)).toContain('credential.password_changed');
  });
});

describe('PlainPassword VO', () => {
  it('rejects short passwords', () => {
    expect(() => new PlainPassword('short')).toThrow('Password: must be at least 8 characters');
  });

  it('accepts valid password', () => {
    const p = new PlainPassword('validpass1');
    expect(p.value).toBe('validpass1');
  });
});
