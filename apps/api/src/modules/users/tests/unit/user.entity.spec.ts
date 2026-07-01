import { describe, it, expect } from 'vitest';
import { User } from '../../domain/entities/user.entity';

describe('User entity', () => {
  it('creates with user.created event', () => {
    const user = User.create({ email: 'test@example.com', name: 'Test User' });
    expect(user.email).toBe('test@example.com');
    expect(user.name).toBe('Test User');
    expect(user.status).toBe('INVITED');
    const events = user.pullEvents();
    expect(events.map((e) => e.eventName)).toContain('user.created');
  });

  it('updateProfile increments version', () => {
    const user = User.create({ email: 'u@example.com', name: 'Before' });
    user.pullEvents();
    const before = user.version;
    user.updateProfile({ name: 'After' });
    expect(user.name).toBe('After');
    expect(user.version).toBe(before + 1);
  });

  it('activate from INVITED', () => {
    const user = User.create({ email: 'a@example.com', name: 'Act' });
    user.activate();
    expect(user.status).toBe('ACTIVE');
  });
});
