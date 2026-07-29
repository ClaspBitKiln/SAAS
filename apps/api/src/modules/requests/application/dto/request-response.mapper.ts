import { Request } from '../../domain/entities/request.entity';
import {
  RequestListResponseDto,
  RequestResponseDto,
} from '../dto/request.dto';

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
    logisticsCost: request.logisticsCost,
    otherCosts: request.otherCosts,
    purchaseTotal: request.purchaseTotal,
    saleTotal: request.saleTotal,
    profitAmount: request.profitAmount,
    marginPercent: request.marginPercent,
    proposalNumber: request.proposalNumber,
    proposalIssuedAt: request.proposalIssuedAt?.toISOString() ?? null,
    proposalValidityDays: request.proposalValidityDays,
    proposalSentAt: request.proposalSentAt?.toISOString() ?? null,
    proposalSentVia: request.proposalSentVia,
    followUpAt: request.followUpAt?.toISOString() ?? null,
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
