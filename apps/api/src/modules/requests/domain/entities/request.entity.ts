import { AggregateRoot } from '../../../../shared/domain/aggregate-root';
import { newId } from '../../../../shared/infrastructure/uuid';
import { makeRequestEvent } from '../events/request.events';
import { RequestLine, RequestLineProps } from '../value-objects/request-line.vo';
import { RequestSource, RequestSourceEnum } from '../value-objects/request-source.vo';
import { RequestStatus, RequestStatusEnum } from '../value-objects/request-status.vo';

export class Request extends AggregateRoot {
  private _organizationId: string;
  private _contactId: string | null;
  private _title: string | null;
  private _notes: string | null;
  private _source: RequestSource;
  private _status: RequestStatus;
  private _searchResult: Record<string, unknown> | null;
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
    lines: Array<{ id: string; sortOrder: number } & RequestLineProps>;
    version: number;
    createdAt: Date;
    updatedAt: Date;
  }): Request {
    return new Request({
      id: props.id,
      tenantId: props.tenantId,
      organizationId: props.organizationId,
      contactId: props.contactId,
      title: props.title,
      notes: props.notes,
      source: new RequestSource(props.source),
      status: new RequestStatus(props.status),
      searchResult: props.searchResult,
      lines: props.lines.map((l) =>
        RequestLine.rehydrate(l.id, l.sortOrder, {
          gost: l.gost,
          steelGrade: l.steelGrade,
          productType: l.productType,
          dimensions: l.dimensions,
          length: l.length,
          thickness: l.thickness,
          coating: l.coating,
          quantity: l.quantity,
          unit: l.unit,
          rawLine: l.rawLine,
        }),
      ),
      version: props.version,
      createdAt: props.createdAt,
      updatedAt: props.updatedAt,
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

  get organizationId(): string {
    return this._organizationId;
  }

  get contactId(): string | null {
    return this._contactId;
  }

  get title(): string | null {
    return this._title;
  }

  get notes(): string | null {
    return this._notes;
  }

  get source(): RequestSourceEnum {
    return this._source.value;
  }

  get status(): RequestStatusEnum {
    return this._status.value;
  }

  get searchResult(): Record<string, unknown> | null {
    return this._searchResult;
  }

  get lines(): RequestLine[] {
    return [...this._lines];
  }
}
