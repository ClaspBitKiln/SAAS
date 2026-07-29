import { Request } from '../../domain/entities/request.entity';
import {
  RequestActivityResponseDto,
  RequestActivityType,
  RequestListResponseDto,
  RequestResponseDto,
} from '../dto/request.dto';

const ACTIVITY_ORDER = Object.values(RequestActivityType);

function requestActivity(request: Request): RequestActivityResponseDto[] {
  const activity: RequestActivityResponseDto[] = [];
  const push = (
    type: RequestActivityType,
    occurredAt: Date | null | undefined,
    details: Record<string, string> = {},
  ) => {
    if (occurredAt) activity.push({ type, occurredAt: occurredAt.toISOString(), details });
  };

  push(RequestActivityType.REQUEST_CREATED, request.createdAt, { source: request.source });
  push(RequestActivityType.QUOTE_PREPARED, request.proposalIssuedAt, {
    proposalNumber: request.proposalNumber ?? '',
    priceSourceFileName: request.priceSourceFileName ?? '',
  });
  push(RequestActivityType.FOLLOW_UP_SCHEDULED, request.proposalIssuedAt, {
    followUpAt: request.followUpAt?.toISOString() ?? '',
  });
  push(RequestActivityType.PROPOSAL_DOWNLOADED, request.proposalDownloadedAt);
  push(RequestActivityType.PROPOSAL_SENT, request.proposalSentAt, {
    sentVia: request.proposalSentVia ?? '',
  });
  push(RequestActivityType.OUTCOME_RECORDED, request.outcomeAt, {
    outcome: request.outcome ?? '',
    reason: request.outcomeReason ?? '',
  });

  return activity.sort((left, right) => {
    const time = left.occurredAt.localeCompare(right.occurredAt);
    return time || ACTIVITY_ORDER.indexOf(left.type) - ACTIVITY_ORDER.indexOf(right.type);
  });
}

export function toRequestResponse(request: Request): RequestResponseDto {
  return {
    id: request.id,
    tenantId: request.tenantId,
    organizationId: request.organizationId,
    contactId: request.contactId,
    title: request.title,
    notes: request.notes,
    sourceText: request.sourceText,
    source: request.source,
    status: request.status,
    searchResult: request.searchResult,
    currency: request.currency,
    sellerName: request.sellerName,
    deliveryTerms: request.deliveryTerms,
    priceSourceFileName: request.priceSourceFileName,
    logisticsCost: request.logisticsCost,
    otherCosts: request.otherCosts,
    purchaseTotal: request.purchaseTotal,
    saleTotal: request.saleTotal,
    profitAmount: request.profitAmount,
    marginPercent: request.marginPercent,
    proposalNumber: request.proposalNumber,
    proposalIssuedAt: request.proposalIssuedAt?.toISOString() ?? null,
    proposalValidityDays: request.proposalValidityDays,
    proposalDownloadedAt: request.proposalDownloadedAt?.toISOString() ?? null,
    proposalSentAt: request.proposalSentAt?.toISOString() ?? null,
    proposalSentVia: request.proposalSentVia,
    followUpAt: request.followUpAt?.toISOString() ?? null,
    outcome: request.outcome,
    outcomeReason: request.outcomeReason,
    outcomeAt: request.outcomeAt?.toISOString() ?? null,
    activity: requestActivity(request),
    lines: request.lines.map((l) => ({
      id: l.id,
      sortOrder: l.sortOrder,
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
      purchaseAmount: l.purchaseAmount,
      saleAmount: l.saleAmount,
    })),
    createdAt: request.createdAt?.toISOString() ?? new Date().toISOString(),
  };
}

export function toRequestListResponse(
  items: Request[],
  total: number,
  page: number,
  size: number,
): RequestListResponseDto {
  return { items: items.map(toRequestResponse), total, page, size };
}
