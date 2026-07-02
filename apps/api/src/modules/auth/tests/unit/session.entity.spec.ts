import { describe, it, expect } from 'vitest';
import { Session } from '../../domain/entities/session.entity';

describe('Session entity', () => {
  const userId = '0192a1b2-c3d4-7890-abcd-ef1234567890';
  const expiresAt = new Date(Date.now() + 86_400_000);

  it('create emits session.created', () => {
    const session = Session.create(userId, 'hash1', expiresAt);
    expect(session.isActive()).toBe(true);
    const events = session.pullEvents();
    expect(events.map((e) => e.eventName)).toContain('session.created');
  });

  it('rotateRefresh updates hash and emits session.refreshed', () => {
    const session = Session.create(userId, 'hash1', expiresAt);
    session.pullEvents();
    const newExpiry = new Date(Date.now() + 172_800_000);
    session.rotateRefresh('hash2', newExpiry);
    expect(session.refreshTokenHash).toBe('hash2');
    expect(session.expiresAt).toEqual(newExpiry);
    const events = session.pullEvents();
    expect(events.map((e) => e.eventName)).toContain('session.refreshed');
  });

  it('revoke marks session inactive', () => {
    const session = Session.create(userId, 'hash1', expiresAt);
    session.revoke();
    expect(session.isActive()).toBe(false);
    expect(() => session.revoke()).toThrow('Session: already revoked');
  });

  it('cannot refresh revoked session', () => {
    const session = Session.create(userId, 'hash1', expiresAt);
    session.revoke();
    expect(() => session.rotateRefresh('hash2', expiresAt)).toThrow(
      'Session: cannot refresh revoked or expired session',
    );
  });
});
