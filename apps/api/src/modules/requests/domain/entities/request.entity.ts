import { AggregateRoot } from '../../../../shared/domain/aggregate-root';
import { newId } from '../../../../shared/infrastructure/uuid';
import { makeRequestEvent } from '../events/request.events';
import { RequestOutcomeEnum } from '../value-objects/request-outcome.vo';
import { ProposalSentViaEnum } from '../value-objects/proposal-sent-via.vo';
import { RequestLine, RequestLineProps } from '../value-objects/request-line.vo';
import { RequestSource, RequestSourceEnum } from '../value-objects/request-source.vo';
import { RequestStatus, RequestStatusEnum } from '../value-objects/request-status.vo';

function amount(value: number, field: string): number {
  if (!Number.isFinite(value) || value < 0) {
    throw new Error(`Request quote: ${field} must be a non-negative number`);
  }
  return Math.round(value * 100) / 100;
}

function round(value: number): number {
  return Math.round(value * 100) / 100;
}

export interface QuoteLineInput {
  lineId: string;
  purchaseAmount: number;
  saleAmount: number;
}

export class Request extends AggregateRoot {
  private _organizationId: string;
  private _contactId: string | null;
  private _title: string | null;
  private _notes: string | null;
  private _sourceText: string | null;
  private _source: RequestSource;
  private _status: RequestStatus;
  private _searchResult: Record<string, unknown> | null;
  private _currency: string;
  private _sellerName: string | null;
  private _deliveryTerms: string | null;
  private _priceSourceFileName: string | null;
  private _logisticsCost: number;
  private _otherCosts: number;
  private _proposalNumber: string | null;
  private _proposalIssuedAt: Date | null;
  private _proposalValidityDays: number;
  private _proposalDownloadedAt: Date | null;
  private _proposalSentAt: Date | null;
  private _proposalSentVia: ProposalSentViaEnum | null;
  private _proposalSentTo: string | null;
  private _followUpAt: Date | null;
  private _outcome: RequestOutcomeEnum | null;
  private _outcomeReason: string | null;
  private _outcomeAt: Date | null;
  private _lines: RequestLine[];

  private constructor(props: {
    id: string;
    tenantId: string;
    organizationId: string;
    contactId: string | null;
    title: string | null;
    notes: string | null;
    sourceText: string | null;
    source: RequestSource;
    status: RequestStatus;
    searchResult: Record<string, unknown> | null;
    currency: string;
    sellerName: string | null;
    deliveryTerms: string | null;
    priceSourceFileName: string | null;
    logisticsCost: number;
    otherCosts: number;
    proposalNumber: string | null;
    proposalIssuedAt: Date | null;
    proposalValidityDays: number;
    proposalDownloadedAt: Date | null;
    proposalSentAt: Date | null;
    proposalSentVia: ProposalSentViaEnum | null;
    proposalSentTo?: string | null;
    followUpAt: Date | null;
    outcome: RequestOutcomeEnum | null;
    outcomeReason: string | null;
    outcomeAt: Date | null;
    lines: RequestLine[];
    version?: number;
    createdAt?: Date;
    updatedAt?: Date;
  }) {
    super({
      id: props.id,
      tenantId: props.tenantId,
      version: props.version,
      createdAt: props.createdAt,
      updatedAt: props.updatedAt,
    });
    this._organizationId = props.organizationId;
    this._contactId = props.contactId;
    this._title = props.title;
    this._notes = props.notes;
    this._sourceText = props.sourceText;
    this._source = props.source;
    this._status = props.status;
    this._searchResult = props.searchResult;
    this._currency = props.currency;
    this._sellerName = props.sellerName;
    this._deliveryTerms = props.deliveryTerms;
    this._priceSourceFileName = props.priceSourceFileName;
    this._logisticsCost = props.logisticsCost;
    this._otherCosts = props.otherCosts;
    this._proposalNumber = props.proposalNumber;
    this._proposalIssuedAt = props.proposalIssuedAt;
    this._proposalValidityDays = props.proposalValidityDays;
    this._proposalDownloadedAt = props.proposalDownloadedAt;
    this._proposalSentAt = props.proposalSentAt;
    this._proposalSentVia = props.proposalSentVia;
    this._proposalSentTo = props.proposalSentTo?.trim() || null;
    this._followUpAt = props.followUpAt;
    this._outcome = props.outcome;
    this._outcomeReason = props.outcomeReason;
    this._outcomeAt = props.outcomeAt;
    this._lines = props.lines;
  }

  static create(input: {
    tenantId: string;
    organizationId: string;
    contactId?: string | null;
    title?: string | null;
    notes?: string | null;
    sourceText?: string | null;
    source: RequestSourceEnum;
    lines: RequestLineProps[];
  }): Request {
    if (input.lines.length === 0) throw new Error('Request: at least one line required');
    const id = newId();
    const lines = input.lines.map((l, i) => RequestLine.create(newId(), i, l));
    const request = new Request({
      id,
      tenantId: input.tenantId,
      organizationId: input.organizationId,
      contactId: input.contactId ?? null,
      title: input.title?.trim() || null,
      notes: input.notes?.trim() || null,
      sourceText: input.sourceText?.trim() || null,
      source:
        input.source === RequestSourceEnum.FILE
          ? RequestSource.file()
          : input.source === RequestSourceEnum.PASTED
            ? RequestSource.pasted()
            : RequestSource.manual(),
      status: RequestStatus.draft(),
      searchResult: null,
      currency: 'RUB',
      sellerName: null,
      deliveryTerms: null,
      priceSourceFileName: null,
      logisticsCost: 0,
      otherCosts: 0,
      proposalNumber: null,
      proposalIssuedAt: null,
      proposalValidityDays: 5,
      proposalDownloadedAt: null,
      proposalSentAt: null,
      proposalSentVia: null,
      proposalSentTo: null,
      followUpAt: null,
      outcome: null,
      outcomeReason: null,
      outcomeAt: null,
      lines,
    });
    request.addEvent(makeRequestEvent('request.created', request, { lineCount: lines.length }));
    return request;
  }

  static rehydrate(props: {
    id: string;
    tenantId: string;
    organizationId: string;
    contactId: string | null;
    title: string | null;
    notes: string | null;
    sourceText: string | null;
    source: RequestSourceEnum;
    status: RequestStatusEnum;
    searchResult: Record<string, unknown> | null;
    currency: string;
    sellerName: string | null;
    deliveryTerms: string | null;
    priceSourceFileName: string | null;
    logisticsCost: number;
    otherCosts: number;
    proposalNumber: string | null;
    proposalIssuedAt: Date | null;
    proposalValidityDays: number;
    proposalDownloadedAt: Date | null;
    proposalSentAt: Date | null;
    proposalSentVia: ProposalSentViaEnum | null;
    proposalSentTo?: string | null;
    followUpAt: Date | null;
    outcome: RequestOutcomeEnum | null;
    outcomeReason: string | null;
    outcomeAt: Date | null;
    lines: Array<{ id: string; sortOrder: number } & RequestLineProps>;
    version: number;
    createdAt: Date;
    updatedAt: Date;
  }): Request {
    return new Request({
      ...props,
      source: new RequestSource(props.source),
      status: new RequestStatus(props.status),
      lines: props.lines.map((l) => RequestLine.rehydrate(l.id, l.sortOrder, l)),
    });
  }

  updateDetails(input: {
    contactId?: string | null;
    title?: string | null;
    notes?: string | null;
    lines?: RequestLineProps[];
  }): void {
    if (input.contactId !== undefined) this._contactId = input.contactId;
    if (input.title !== undefined) this._title = input.title?.trim() || null;
    if (input.notes !== undefined) this._notes = input.notes?.trim() || null;
    if (input.lines !== undefined) {
      if (input.lines.length === 0) throw new Error('Request: at least one line required');
      this._lines = input.lines.map((l, i) => RequestLine.create(newId(), i, l));
      this._status = RequestStatus.draft();
      this._searchResult = null;
      this.clearQuote();
    }
    this.touch();
    this.addEvent(makeRequestEvent('request.updated', this, {}));
  }

  applySearchResult(result: Record<string, unknown>): void {
    this._searchResult = result;
    this._status = RequestStatus.searched();
    this.touch();
    this.addEvent(makeRequestEvent('request.searched', this, {}));
  }

  prepareQuote(input: {
    lines: QuoteLineInput[];
    currency: string;
    sellerName: string;
    deliveryTerms?: string | null;
    logisticsCost: number;
    otherCosts: number;
    proposalNumber: string;
    proposalIssuedAt: Date;
    proposalValidityDays: number;
    followUpAt: Date;
    priceSourceFileName?: string | null;
  }): void {
    const currency = input.currency.trim().toUpperCase();
    if (!/^[A-Z]{3}$/.test(currency)) throw new Error('Request quote: currency must be a 3-letter code');
    const sellerName = input.sellerName.trim();
    if (sellerName.length < 2 || sellerName.length > 255) {
      throw new Error('Request quote: seller name must be 2..255 chars');
    }
    if (!Number.isInteger(input.proposalValidityDays) || input.proposalValidityDays < 1 || input.proposalValidityDays > 90) {
      throw new Error('Request quote: validity must be 1..90 days');
    }
    if (Number.isNaN(input.followUpAt.getTime())) throw new Error('Request quote: follow-up date is invalid');
    if (input.followUpAt.getTime() <= input.proposalIssuedAt.getTime()) {
      throw new Error('Request quote: follow-up date must be in the future');
    }

    const amounts = new Map(input.lines.map((line) => [line.lineId, line]));
    if (amounts.size !== this._lines.length) {
      throw new Error('Request quote: set purchase and sale amounts for every line');
    }
    this._lines = this._lines.map((line) => {
      const commercial = amounts.get(line.id);
      if (!commercial) throw new Error('Request quote: unknown or missing line');
      return line.withCommercials(commercial.purchaseAmount, commercial.saleAmount);
    });
    this._currency = currency;
    this._sellerName = sellerName;
    this._deliveryTerms = input.deliveryTerms?.trim() || null;
    this._priceSourceFileName = input.priceSourceFileName?.trim() || null;
    this._logisticsCost = amount(input.logisticsCost, 'logistics cost');
    this._otherCosts = amount(input.otherCosts, 'other costs');
    this._proposalNumber = input.proposalNumber.trim();
    this._proposalIssuedAt = input.proposalIssuedAt;
    this._proposalValidityDays = input.proposalValidityDays;
    this._proposalDownloadedAt = null;
    this._proposalSentAt = null;
    this._proposalSentVia = null;
    this._proposalSentTo = null;
    this._followUpAt = input.followUpAt;
    this._status = RequestStatus.quoted();
    this.touch();
    this.addEvent(makeRequestEvent('request.quoted', this, {
      proposalNumber: this._proposalNumber,
      profitAmount: this.profitAmount,
      followUpAt: this._followUpAt.toISOString(),
      priceSourceFileName: this._priceSourceFileName ?? '',
    }));
  }

  markProposalDownloaded(downloadedAt: Date): void {
    if (
      ![RequestStatusEnum.QUOTED, RequestStatusEnum.SENT].includes(this._status.value) ||
      !this._proposalIssuedAt
    ) {
      throw new Error('Request proposal: quote must be prepared before download');
    }
    if (
      Number.isNaN(downloadedAt.getTime()) ||
      downloadedAt.getTime() < this._proposalIssuedAt.getTime()
    ) {
      throw new Error('Request proposal: download date is invalid');
    }

    this._proposalDownloadedAt = downloadedAt;
    this.touch();
    this.addEvent(makeRequestEvent('request.proposal_downloaded', this, {
      proposalNumber: this._proposalNumber,
      downloadedAt: downloadedAt.toISOString(),
    }));
  }

  markProposalSent(sentVia: ProposalSentViaEnum, sentAt: Date, sentTo?: string | null): void {
    if (this._status.value !== RequestStatusEnum.QUOTED) {
      throw new Error('Request proposal: quote must be prepared before marking sent');
    }
    if (!this._proposalIssuedAt) {
      throw new Error('Request proposal: proposal issue date is missing');
    }
    if (Number.isNaN(sentAt.getTime()) || sentAt.getTime() < this._proposalIssuedAt.getTime()) {
      throw new Error('Request proposal: sent date is invalid');
    }
    if (!Object.values(ProposalSentViaEnum).includes(sentVia)) {
      throw new Error('Request proposal: sent channel is invalid');
    }
    const normalizedSentTo = sentTo?.trim() || null;
    if (normalizedSentTo && normalizedSentTo.length > 255) {
      throw new Error('Request proposal: recipient must be at most 255 chars');
    }

    this._proposalSentAt = sentAt;
    this._proposalSentVia = sentVia;
    this._proposalSentTo = normalizedSentTo;
    this._status = RequestStatus.sent();
    this.touch();
    this.addEvent(makeRequestEvent('request.proposal_sent', this, {
      proposalNumber: this._proposalNumber,
      sentAt: sentAt.toISOString(),
      sentVia,
      sentTo: normalizedSentTo ?? '',
    }));
  }

  recordOutcome(outcome: RequestOutcomeEnum, reason: string, recordedAt: Date): void {
    if (this._status.value !== RequestStatusEnum.SENT || !this._proposalSentAt) {
      throw new Error('Request outcome: proposal must be sent first');
    }
    if (!Object.values(RequestOutcomeEnum).includes(outcome)) {
      throw new Error('Request outcome: invalid outcome');
    }
    const normalizedReason = reason.trim();
    if (normalizedReason.length < 2 || normalizedReason.length > 500) {
      throw new Error('Request outcome: reason must be 2..500 chars');
    }
    if (Number.isNaN(recordedAt.getTime()) || recordedAt.getTime() < this._proposalSentAt.getTime()) {
      throw new Error('Request outcome: date is invalid');
    }

    this._outcome = outcome;
    this._outcomeReason = normalizedReason;
    this._outcomeAt = recordedAt;
    this.touch();
    this.addEvent(makeRequestEvent('request.outcome_recorded', this, {
      outcome,
      reason: normalizedReason,
      outcomeAt: recordedAt.toISOString(),
    }));
  }

  private clearQuote(): void {
    this._sellerName = null;
    this._deliveryTerms = null;
    this._priceSourceFileName = null;
    this._logisticsCost = 0;
    this._otherCosts = 0;
    this._proposalNumber = null;
    this._proposalIssuedAt = null;
    this._proposalValidityDays = 5;
    this._proposalDownloadedAt = null;
    this._proposalSentAt = null;
    this._proposalSentVia = null;
    this._proposalSentTo = null;
    this._followUpAt = null;
    this._outcome = null;
    this._outcomeReason = null;
    this._outcomeAt = null;
  }

  get organizationId(): string { return this._organizationId; }
  get contactId(): string | null { return this._contactId; }
  get title(): string | null { return this._title; }
  get notes(): string | null { return this._notes; }
  get sourceText(): string | null { return this._sourceText; }
  get source(): RequestSourceEnum { return this._source.value; }
  get status(): RequestStatusEnum { return this._status.value; }
  get searchResult(): Record<string, unknown> | null { return this._searchResult; }
  get currency(): string { return this._currency; }
  get sellerName(): string | null { return this._sellerName; }
  get deliveryTerms(): string | null { return this._deliveryTerms; }
  get priceSourceFileName(): string | null { return this._priceSourceFileName; }
  get logisticsCost(): number { return this._logisticsCost; }
  get otherCosts(): number { return this._otherCosts; }
  get proposalNumber(): string | null { return this._proposalNumber; }
  get proposalIssuedAt(): Date | null { return this._proposalIssuedAt; }
  get proposalValidityDays(): number { return this._proposalValidityDays; }
  get proposalDownloadedAt(): Date | null { return this._proposalDownloadedAt; }
  get proposalSentAt(): Date | null { return this._proposalSentAt; }
  get proposalSentVia(): ProposalSentViaEnum | null { return this._proposalSentVia; }
  get proposalSentTo(): string | null { return this._proposalSentTo; }
  get followUpAt(): Date | null { return this._followUpAt; }
  get outcome(): RequestOutcomeEnum | null { return this._outcome; }
  get outcomeReason(): string | null { return this._outcomeReason; }
  get outcomeAt(): Date | null { return this._outcomeAt; }
  get lines(): RequestLine[] { return [...this._lines]; }

  get purchaseTotal(): number {
    return round(this._lines.reduce((sum, line) => sum + (line.purchaseAmount ?? 0), 0));
  }

  get saleTotal(): number {
    return round(this._lines.reduce((sum, line) => sum + (line.saleAmount ?? 0), 0));
  }

  get profitAmount(): number {
    return round(this.saleTotal - this.purchaseTotal - this._logisticsCost - this._otherCosts);
  }

  get marginPercent(): number {
    return this.saleTotal === 0 ? 0 : round((this.profitAmount / this.saleTotal) * 100);
  }
}
