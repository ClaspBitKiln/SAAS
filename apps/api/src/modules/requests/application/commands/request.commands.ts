import { QuoteLineInput } from '../../domain/entities/request.entity';
import { ProposalSentViaEnum } from '../../domain/value-objects/proposal-sent-via.vo';
import { RequestOutcomeEnum } from '../../domain/value-objects/request-outcome.vo';
import { RequestLineProps } from '../../domain/value-objects/request-line.vo';
import { RequestSourceEnum } from '../../domain/value-objects/request-source.vo';

export class CreateRequestCommand {
  constructor(
    readonly organizationId: string,
    readonly contactId: string | null | undefined,
    readonly title: string | null | undefined,
    readonly notes: string | null | undefined,
    readonly sourceText: string | null | undefined,
    readonly source: RequestSourceEnum,
    readonly lines: RequestLineProps[],
  ) {}
}

export class UpdateRequestCommand {
  constructor(
    readonly id: string,
    readonly organizationId: string,
    readonly contactId?: string | null,
    readonly title?: string | null,
    readonly notes?: string | null,
    readonly lines?: RequestLineProps[],
  ) {}
}

export class PrepareQuoteCommand {
  constructor(
    readonly id: string,
    readonly organizationId: string,
    readonly currentUserId: string,
    readonly lines: QuoteLineInput[],
    readonly currency: string,
    readonly sellerName: string,
    readonly deliveryTerms: string | null | undefined,
    readonly logisticsCost: number,
    readonly otherCosts: number,
    readonly proposalValidityDays: number,
    readonly followUpAt: Date,
  ) {}
}

export class MarkProposalSentCommand {
  constructor(
    readonly id: string,
    readonly organizationId: string,
    readonly sentVia: ProposalSentViaEnum,
  ) {}
}

export class MarkProposalDownloadedCommand {
  constructor(
    readonly id: string,
    readonly organizationId: string,
  ) {}
}

export class RecordRequestOutcomeCommand {
  constructor(
    readonly id: string,
    readonly organizationId: string,
    readonly outcome: RequestOutcomeEnum,
    readonly reason: string,
  ) {}
}

export class SearchRequestCommand {
  constructor(readonly id: string, readonly organizationId: string) {}
}
