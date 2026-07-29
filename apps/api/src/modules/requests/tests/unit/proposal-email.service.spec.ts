import { describe, expect, it, vi } from 'vitest';
import { ProposalEmailService } from '../../application/services/proposal-email.service';
import { Request } from '../../domain/entities/request.entity';
import { RequestSourceEnum } from '../../domain/value-objects/request-source.vo';

function quotedRequest(): Request {
  const request = Request.create({
    tenantId: '11111111-1111-4111-8111-111111111111',
    organizationId: '22222222-2222-4222-8222-222222222222',
    source: RequestSourceEnum.MANUAL,
    title: 'Лист для ремонта',
    lines: [{ rawLine: 'Лист 6 мм Ст3', quantity: '2', unit: 'т' }],
  });
  request.prepareQuote({
    lines: [{ lineId: request.lines[0].id, purchaseAmount: 100000, saleAmount: 120000 }],
    currency: 'RUB',
    sellerName: 'ООО Мэджик Металл',
    deliveryTerms: 'Доставка до склада',
    logisticsCost: 0,
    otherCosts: 0,
    proposalNumber: 'КП-TEST-1',
    proposalIssuedAt: new Date('2026-07-29T10:00:00.000Z'),
    proposalValidityDays: 5,
    followUpAt: new Date('2026-07-30T10:00:00.000Z'),
  });
  return request;
}

describe('ProposalEmailService', () => {
  it('builds a traceable proposal message and delegates delivery', async () => {
    const quote = quotedRequest();
    const send = vi.fn().mockResolvedValue(undefined);
    const service = new ProposalEmailService(
      { findById: vi.fn().mockResolvedValue(quote) } as never,
      { send },
    );

    await service.send(quote.id, quote.organizationId, 'buyer@example.com');

    expect(send).toHaveBeenCalledOnce();
    expect(send).toHaveBeenCalledWith(
      expect.objectContaining({
        to: 'buyer@example.com',
        subject: 'Коммерческое предложение КП-TEST-1',
        text: expect.stringContaining('Итого:'),
        html: expect.stringContaining('Лист 6 мм Ст3'),
      }),
    );
  });

  it('does not send a draft request', async () => {
    const draft = Request.create({
      tenantId: '11111111-1111-4111-8111-111111111111',
      organizationId: '22222222-2222-4222-8222-222222222222',
      source: RequestSourceEnum.MANUAL,
      lines: [{ rawLine: 'Лист 6 мм Ст3' }],
    });
    const send = vi.fn();
    const service = new ProposalEmailService(
      { findById: vi.fn().mockResolvedValue(draft) } as never,
      { send },
    );

    await expect(
      service.send(draft.id, draft.organizationId, 'buyer@example.com'),
    ).rejects.toThrow('quote must be prepared');
    expect(send).not.toHaveBeenCalled();
  });
});
