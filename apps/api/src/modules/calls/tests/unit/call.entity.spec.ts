import { describe, it, expect } from 'vitest';
import { Call } from '../../domain/entities/call.entity';
import { CallDirectionEnum } from '../../domain/value-objects/call-direction.vo';
import { CallStatusEnum } from '../../domain/value-objects/call-status.vo';

describe('Call entity', () => {
  const tenantId = '0192a1b2-c3d4-7890-abcd-ef1234567890';
  const orgId = '0192a1b2-c3d4-7890-abcd-ef1234567891';
  const contactId = '0192a1b2-c3d4-7890-abcd-ef1234567892';

  it('start creates RINGING call with call.started event', () => {
    const call = Call.start({
      tenantId,
      organizationId: orgId,
      contactId,
      direction: CallDirectionEnum.OUTBOUND,
      phone: '+79991234567',
    });
    expect(call.status).toBe(CallStatusEnum.RINGING);
    expect(call.direction).toBe(CallDirectionEnum.OUTBOUND);
    const events = call.pullEvents();
    expect(events.map((e) => e.eventName)).toContain('call.started');
  });

  it('complete sets COMPLETED and durationSec', () => {
    const startedAt = new Date('2026-01-01T10:00:00Z');
    const endedAt = new Date('2026-01-01T10:05:30Z');
    const call = Call.start({
      tenantId,
      organizationId: orgId,
      contactId,
      direction: CallDirectionEnum.INBOUND,
      phone: '+79990001122',
      startedAt,
    });
    call.pullEvents();
    call.complete(endedAt);
    expect(call.status).toBe(CallStatusEnum.COMPLETED);
    expect(call.durationSec).toBe(330);
    expect(call.endedAt).toEqual(endedAt);
    const events = call.pullEvents();
    expect(events.map((e) => e.eventName)).toContain('call.completed');
  });

  it('markMissed sets MISSED', () => {
    const call = Call.start({
      tenantId,
      organizationId: orgId,
      contactId,
      direction: CallDirectionEnum.OUTBOUND,
      phone: '+79991234567',
    });
    call.pullEvents();
    call.markMissed();
    expect(call.status).toBe(CallStatusEnum.MISSED);
    expect(call.endedAt).not.toBeNull();
    const events = call.pullEvents();
    expect(events.map((e) => e.eventName)).toContain('call.missed');
  });

  it('cannot complete from COMPLETED', () => {
    const call = Call.start({
      tenantId,
      organizationId: orgId,
      contactId,
      direction: CallDirectionEnum.OUTBOUND,
      phone: '+79991234567',
    });
    call.complete();
    expect(() => call.complete()).toThrow('Call: cannot complete from current status');
  });
});
