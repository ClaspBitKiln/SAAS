import { RequestLineProps } from '../../domain/value-objects/request-line.vo';
import { RequestSourceEnum } from '../../domain/value-objects/request-source.vo';

export class CreateRequestCommand {
  constructor(
    readonly organizationId: string,
    readonly contactId: string | null | undefined,
    readonly title: string | null | undefined,
    readonly notes: string | null | undefined,
    readonly source: RequestSourceEnum,
    readonly lines: RequestLineProps[],
  ) {}
}

export class UpdateRequestCommand {
  constructor(
    readonly id: string,
    readonly contactId?: string | null,
    readonly title?: string | null,
    readonly notes?: string | null,
    readonly lines?: RequestLineProps[],
  ) {}
}

export class SearchRequestCommand {
  constructor(readonly id: string) {}
}
