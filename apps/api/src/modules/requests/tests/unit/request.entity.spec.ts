import { describe, it, expect } from 'vitest';
import { Request } from '../../domain/entities/request.entity';
import { RequestSourceEnum } from '../../domain/value-objects/request-source.vo';
import { RequestStatusEnum } from '../../domain/value-objects/request-status.vo';

describe('Request entity', () => {
  it('creates request with lines', () => {
    const request = Request.create({
      tenantId: '019f21bd-fa4e-786c-a1d5-9963d27fde55',
      organizationId: '019f21bd-fa86-79a2-beb6-f2f3c74371d8',
      source: RequestSourceEnum.MANUAL,
      lines: [{ rawLine: 'Лист 10мм 09Г2С', steelGrade: '09Г2С', thickness: '10' }],
    });
    expect(request.lines).toHaveLength(1);
    expect(request.status).toBe(RequestStatusEnum.DRAFT);
  });

  it('rejects empty lines', () => {
    expect(() =>
      Request.create({
        tenantId: 't',
        organizationId: 'o',
        source: RequestSourceEnum.MANUAL,
        lines: [],
      }),
    ).toThrow('at least one line');
  });

  it('applySearchResult marks searched', () => {
    const request = Request.create({
      tenantId: 't',
      organizationId: 'o',
      source: RequestSourceEnum.MANUAL,
      lines: [{ rawLine: 'test' }],
    });
    request.applySearchResult({ offers: [] });
    expect(request.status).toBe(RequestStatusEnum.SEARCHED);
  });
});
