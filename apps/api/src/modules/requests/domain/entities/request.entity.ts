import { AggregateRoot } from '../../../../shared/domain/aggregate-root';
import { newId } from '../../../../shared/infrastructure/uuid';
import { makeRequestEvent } from '../events/request.events';
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
  private _source: RequestSource;
  private _status: RequestStatus;
  private _searchResult: Record<string, unknown> | null;
  private _currency: string;
  private _sellerName: string | null;
  private _deliveryTerms: string | null;
  private _logisticsCost: number;
  private _otherCosts: number;
  private _proposalNumber: string | null;
  private _proposalIssuedAt: Date | null;
  private _proposalValidityDays: number;
  private _followUpAt: Date | null;
  private _lines: RequestLine[];

  private constructor(props: {
    id: string;
    tenantId: string;
    organizationId: string;
    contactId: string | null;
    title: string | null;
    notes: string | null;
    source: RequestSource;
    status: RequestStatus;
    searchResult: Record<string, unknown> | null;
    currency: string;
    sellerName: string | null;
    deliveryTerms: string | null;
    logisticsCost: number;
    otherCosts: number;
    proposalNumber: string | null;
    proposalIssuedAt: Date | null;
    proposalValidityDays: number;
    followUpAt: Date | null;
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
    this._source = props.source;
    this._status = props.status;
    this._searchResult = props.searchResult;
    this._currency = props.currency;
    this._sellerName = props.sellerName;
    this._deliveryTerms = props.deliveryTerms;
    this._logisticsCost = props.logisticsCost;
    this._otherCosts = props.otherCosts;
    this._proposalNumber = props.proposalNumber;
    this._proposalIssuedAt = props.proposalIssuedAt;
    this._proposalValidityDays = props.proposalValidityDays;
    this._followUpAt = props.followUpAt;
    this._lines = props.lines;
  }

  static create(input: {
    tenantId: string;
    organizationId: string;
    contactId?: string | null;
    title?: string | null;
    notes?: string | null;
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
      source: input.source === RequestSourceEnum.FILE ? RequestSource.file() : RequestSource.manual(),
      status: RequestStatus.draft(),
      searchResult: null,
      currency: 'RUB',
      sellerName: null,
      deliveryTerms: null,
      logisticsCost: 0,
      otherCosts: 0,
      proposalNumber: null,
      proposalIssuedAt: null,
      proposalValidityDays: 5,
      followUpAt: null,
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
    source: RequestSourceEnum;
    status: RequestStatusEnum;
    searchResult: Record<string, unknown> | null;
    currency: string;
    sellerName: string | null;
    deliveryTerms: string | null;
    logisticsCost: number;
    otherCosts: number;
    proposalNumber: string | null;
    proposalIssuedAt: Date | null;
    proposalValidityDays: number;
    followUpAt: Date | null;
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
    this._logisticsCost = amount(input.logisticsCost, 'logistics cost');
    this._otherCosts = amount(input.otherCosts, 'other costs');
    this._proposalNumber = input.proposalNumber.trim();
    this._proposalIssuedAt = input.proposalIssuedAt;
    this._proposalValidityDays = input.proposalValidityDays;
    this._followUpAt = input.followUpAt;
    this._status = RequestStatus.quoted();
    this.touch();
    this.addEvent(makeRequestEvent('request.quoted', this, {
      proposalNumber: this._proposalNumber,
      profitAmount: this.profitAmount,
      followUpAt: this._followUpAt.toISOString(),
    }));
  }

  private clearQuote(): void {
    this._sellerName = null;
    this._deliveryTerms = null;
    this._logisticsCost = 0;
    this._otherCosts = 0;
    this._proposalNumber = null;
    this._proposalIssuedAt = null;
    this._proposalValidityDays = 5;
    this._followUpAt = null;
  }

  get organizationId(): string { return this._organizationId; }
  get contactId(): string | null { return this._contactId; }
  get title(): string | null { return this._title; }
  get notes(): string | null { return this._notes; }
  get source(): RequestSourceEnum { return this._source.value; }
  get status(): RequestStatusEnum { return this._status.value; }
  get searchResult(): Record<string, unknown> | null { return this._searchResult; }
  get currency(): string { return this._currency; }
  get sellerName(): string | null { return this._sellerName; }
  get deliveryTerms(): string | null { return this._deliveryTerms; }
  get logisticsCost(): number { return this._logisticsCost; }
  get otherCosts(): number { return this._otherCosts; }
  get proposalNumber(): string | null { return this._proposalNumber; }
  get proposalIssuedAt(): Date | null { return this._proposalIssuedAt; }
  get proposalValidityDays(): number { return this._proposalValidityDays; }
  get followUpAt(): Date | null { return this._followUpAt; }
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
