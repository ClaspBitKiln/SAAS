import { describe, it, expect } from 'vitest';
import { Request } from '../../domain/entities/request.entity';
import { ProposalSentViaEnum } from '../../domain/value-objects/proposal-sent-via.vo';
import { RequestOutcomeEnum } from '../../domain/value-objects/request-outcome.vo';
import { RequestSourceEnum } from '../../domain/value-objects/request-source.vo';
import { RequestStatusEnum } from '../../domain/value-objects/request-status.vo';

function makeRequest(): Request {
  return Request.create({
    tenantId: '019f21bd-fa4e-786c-a1d5-9963d27fde55',
    organizationId: '019f21bd-fa86-79a2-beb6-f2f3c74371d8',
    source: RequestSourceEnum.MANUAL,
    lines: [{ rawLine: 'Лист 10мм 09Г2С', steelGrade: '09Г2С', thickness: '10' }],
  });
}

describe('Request entity', () => {
  it('creates request with lines', () => {
    const request = makeRequest();
    expect(request.lines).toHaveLength(1);
    expect(request.status).toBe(RequestStatusEnum.DRAFT);
  });

  it('retains pasted source text for manager review', () => {
    const request = Request.create({
      tenantId: '019f21bd-fa4e-786c-a1d5-9963d27fde55',
      organizationId: '019f21bd-fa86-79a2-beb6-f2f3c74371d8',
      source: RequestSourceEnum.PASTED,
      sourceText: 'Добрый день!\nЛист 5х1500х6000 09Г2С — 10 т',
      lines: [{ rawLine: 'Лист 5х1500х6000 09Г2С — 10 т' }],
    });

    expect(request.source).toBe(RequestSourceEnum.PASTED);
    expect(request.sourceText).toContain('Добрый день!');
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
    const request = makeRequest();
    request.applySearchResult({ offers: [] });
    expect(request.status).toBe(RequestStatusEnum.SEARCHED);
  });

  it('calculates profit and margin when quote is prepared', () => {
    const request = makeRequest();
    request.prepareQuote({
      lines: [{ lineId: request.lines[0].id, purchaseAmount: 50000, saleAmount: 70000 }],
      currency: 'rub',
      sellerName: 'ООО Мэджик Металл',
      deliveryTerms: 'DAP Ташкент',
      logisticsCost: 2000,
      otherCosts: 1000,
      proposalNumber: 'КП-20260728-001',
      proposalIssuedAt: new Date('2026-07-28T12:00:00.000Z'),
      proposalValidityDays: 5,
      followUpAt: new Date('2026-07-29T09:00:00.000Z'),
    });

    expect(request.status).toBe(RequestStatusEnum.QUOTED);
    expect(request.currency).toBe('RUB');
    expect(request.purchaseTotal).toBe(50000);
    expect(request.saleTotal).toBe(70000);
    expect(request.profitAmount).toBe(17000);
    expect(request.marginPercent).toBe(24.29);
    expect(request.followUpAt?.toISOString()).toBe('2026-07-29T09:00:00.000Z');
  });

  it('rejects a follow-up date that is not after the proposal date', () => {
    const request = makeRequest();
    expect(() =>
      request.prepareQuote({
        lines: [{ lineId: request.lines[0].id, purchaseAmount: 50000, saleAmount: 70000 }],
        currency: 'RUB',
        sellerName: 'ООО Мэджик Металл',
        logisticsCost: 0,
        otherCosts: 0,
        proposalNumber: 'КП-1',
        proposalIssuedAt: new Date('2026-07-28T12:00:00.000Z'),
        proposalValidityDays: 5,
        followUpAt: new Date('2026-07-28T11:59:59.000Z'),
      }),
    ).toThrow('must be in the future');
  });

  it('requires commercial amounts for every request line', () => {
    const request = makeRequest();
    expect(() =>
      request.prepareQuote({
        lines: [],
        currency: 'RUB',
        sellerName: 'ООО Мэджик Металл',
        logisticsCost: 0,
        otherCosts: 0,
        proposalNumber: 'КП-1',
        proposalIssuedAt: new Date('2026-07-28T12:00:00.000Z'),
        proposalValidityDays: 5,
        followUpAt: new Date('2026-07-29T12:00:00.000Z'),
      }),
    ).toThrow('every line');
  });

  it('records proposal delivery only after a quote is prepared', () => {
    const request = makeRequest();
    expect(() =>
      request.markProposalSent(ProposalSentViaEnum.EMAIL, new Date('2026-07-28T13:00:00.000Z')),
    ).toThrow('quote must be prepared');

    request.prepareQuote({
      lines: [{ lineId: request.lines[0].id, purchaseAmount: 50000, saleAmount: 70000 }],
      currency: 'RUB',
      sellerName: 'ООО Мэджик Металл',
      logisticsCost: 0,
      otherCosts: 0,
      proposalNumber: 'КП-1',
      proposalIssuedAt: new Date('2026-07-28T12:00:00.000Z'),
      proposalValidityDays: 5,
      followUpAt: new Date('2026-07-29T12:00:00.000Z'),
    });
    request.markProposalSent(
      ProposalSentViaEnum.EMAIL,
      new Date('2026-07-28T13:00:00.000Z'),
    );

    expect(request.status).toBe(RequestStatusEnum.SENT);
    expect(request.proposalSentVia).toBe(ProposalSentViaEnum.EMAIL);
    expect(request.proposalSentAt?.toISOString()).toBe('2026-07-28T13:00:00.000Z');
  });

  it('records a PDF download only after a quote is prepared', () => {
    const request = makeRequest();
    expect(() =>
      request.markProposalDownloaded(new Date('2026-07-28T12:30:00.000Z')),
    ).toThrow('quote must be prepared');

    request.prepareQuote({
      lines: [{ lineId: request.lines[0].id, purchaseAmount: 50000, saleAmount: 70000 }],
      currency: 'RUB',
      sellerName: 'ООО Мэджик Металл',
      logisticsCost: 0,
      otherCosts: 0,
      proposalNumber: 'КП-1',
      proposalIssuedAt: new Date('2026-07-28T12:00:00.000Z'),
      proposalValidityDays: 5,
      followUpAt: new Date('2026-07-29T12:00:00.000Z'),
    });
    request.markProposalDownloaded(new Date('2026-07-28T12:30:00.000Z'));

    expect(request.proposalDownloadedAt?.toISOString()).toBe('2026-07-28T12:30:00.000Z');
    expect(request.pullEvents().some((event) => event.eventName === 'request.proposal_downloaded')).toBe(true);
  });

  it('records a reasoned outcome only after proposal delivery', () => {
    const request = makeRequest();
    expect(() =>
      request.recordOutcome(
        RequestOutcomeEnum.WON,
        'Клиент подтвердил заказ',
        new Date('2026-07-28T14:00:00.000Z'),
      ),
    ).toThrow('proposal must be sent first');

    request.prepareQuote({
      lines: [{ lineId: request.lines[0].id, purchaseAmount: 50000, saleAmount: 70000 }],
      currency: 'RUB',
      sellerName: 'ООО Мэджик Металл',
      logisticsCost: 0,
      otherCosts: 0,
      proposalNumber: 'КП-1',
      proposalIssuedAt: new Date('2026-07-28T12:00:00.000Z'),
      proposalValidityDays: 5,
      followUpAt: new Date('2026-07-29T12:00:00.000Z'),
    });
    request.markProposalSent(
      ProposalSentViaEnum.EMAIL,
      new Date('2026-07-28T13:00:00.000Z'),
    );
    request.recordOutcome(
      RequestOutcomeEnum.WON,
      'Клиент подтвердил заказ',
      new Date('2026-07-28T14:00:00.000Z'),
    );

    expect(request.outcome).toBe(RequestOutcomeEnum.WON);
    expect(request.outcomeReason).toBe('Клиент подтвердил заказ');
    expect(request.outcomeAt?.toISOString()).toBe('2026-07-28T14:00:00.000Z');
  });
});
