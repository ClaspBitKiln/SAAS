import {
  BadRequestException,
  ForbiddenException,
  UnauthorizedException,
} from '@nestjs/common';
import { beforeEach, describe, expect, it, vi } from 'vitest';
import { PublicLeadDto } from '../../application/dto/public-intake.dto';
import { PublicIntakeService } from '../../application/services/public-intake.service';

const organizationId = '019f21bd-fa86-79a2-beb6-f2f3c74371d8';
const contactId = '019f21bd-fa86-79a2-beb6-f2f3c74371d9';
const requestId = '019f21bd-fa86-79a2-beb6-f2f3c74371da';
const token = 'test-site-ingest-token-with-enough-entropy';

function lead(overrides: Partial<PublicLeadDto> = {}): PublicLeadDto {
  return {
    schemaVersion: 1,
    externalLeadId: 'lead-12345678',
    source: 'magicmet-website',
    sourceSystem: 'magicmet-website',
    submittedAt: '2026-08-02T09:00:00.000Z',
    leadType: 'request_to_quote',
    market: 'RU_CIS',
    contact: {
      name: 'Иван',
      value: 'buyer@example.com',
    },
    request: {
      text: 'Лист 09Г2С 10×1500×6000, 12 тонн',
      pageTitle: 'Лист 09Г2С',
      pageUrl: 'https://www.magicmet.ru/catalog/list/',
    },
    consent: {
      personalData: true,
      capturedAt: '2026-08-02T09:00:00.000Z',
      privacyVersion: '2026-07-30',
    },
    attribution: {
      sessionId: 'session-12345678',
      utm_source: 'yandex',
    },
    journey: {},
    technical: {},
    ...overrides,
  };
}

describe('PublicIntakeService', () => {
  const prisma = {
    organization: { findFirst: vi.fn() },
    request: { findFirst: vi.fn() },
    contact: { findFirst: vi.fn() },
  };
  const commandBus = { execute: vi.fn() };
  const service = new PublicIntakeService(prisma as never, commandBus as never);

  beforeEach(() => {
    vi.clearAllMocks();
    process.env.SITE_INGEST_TOKEN = token;
    process.env.PUBLIC_INTAKE_ORGANIZATION_ID = organizationId;
    process.env.PUBLIC_INTAKE_ALLOWED_ORIGINS =
      'https://www.magicmet.ru,https://magicmet.ru';

    prisma.organization.findFirst.mockResolvedValue({ id: organizationId });
    prisma.request.findFirst.mockResolvedValue(null);
    prisma.contact.findFirst.mockResolvedValue({ id: contactId });
  });

  it('rejects a request without the gateway bearer token', async () => {
    await expect(
      service.createLead(
        lead(),
        undefined,
        'lead-12345678',
        organizationId,
        undefined,
      ),
    ).rejects.toBeInstanceOf(UnauthorizedException);

    expect(prisma.organization.findFirst).not.toHaveBeenCalled();
  });

  it('rejects a request with a different gateway bearer token', async () => {
    await expect(
      service.createLead(
        lead(),
        'Bearer wrong-token',
        'lead-12345678',
        organizationId,
        undefined,
      ),
    ).rejects.toBeInstanceOf(UnauthorizedException);
  });

  it('requires Idempotency-Key to match externalLeadId', async () => {
    await expect(
      service.createLead(
        lead(),
        `Bearer ${token}`,
        undefined,
        organizationId,
        undefined,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);

    await expect(
      service.createLead(
        lead(),
        `Bearer ${token}`,
        'another-lead-id',
        organizationId,
        undefined,
      ),
    ).rejects.toBeInstanceOf(BadRequestException);
  });

  it('rejects a tenant other than the configured organization', async () => {
    await expect(
      service.createLead(
        lead(),
        `Bearer ${token}`,
        'lead-12345678',
        '019f21bd-fa86-79a2-beb6-f2f3c74371ff',
        undefined,
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });

  it('creates a request and returns the contract expected by LeadGateway', async () => {
    commandBus.execute.mockResolvedValue({ id: requestId });

    const result = await service.createLead(
      lead(),
      `Bearer ${token}`,
      'lead-12345678',
      organizationId,
      undefined,
    );

    expect(result).toEqual({
      ok: true,
      requestId,
      companyId: null,
      contactId,
      status: 'DRAFT',
      externalLeadId: 'lead-12345678',
      duplicate: false,
    });
    expect(commandBus.execute).toHaveBeenCalledTimes(1);
  });

  it('returns the existing request for a repeated externalLeadId', async () => {
    prisma.request.findFirst.mockResolvedValue({ id: requestId, contactId });

    const result = await service.createLead(
      lead(),
      `Bearer ${token}`,
      'lead-12345678',
      organizationId,
      'https://www.magicmet.ru',
    );

    expect(result.requestId).toBe(requestId);
    expect(result.contactId).toBe(contactId);
    expect(result.duplicate).toBe(true);
    expect(commandBus.execute).not.toHaveBeenCalled();
  });

  it('rejects an unexpected browser origin when one is present', async () => {
    await expect(
      service.createLead(
        lead(),
        `Bearer ${token}`,
        'lead-12345678',
        organizationId,
        'https://attacker.example',
      ),
    ).rejects.toBeInstanceOf(ForbiddenException);
  });
});
