// Базовый доменный эвент (ADR-006). Конверт события — единый формат.
export interface DomainEvent<TPayload = unknown> {
  readonly eventId: string;       // UUIDv7
  readonly eventName: string;     // напр. "deal.created"
  readonly tenantId: string;
  readonly aggregateType: string;
  readonly aggregateId: string;
  readonly version: number;       // версия агрегата на момент события
  readonly occurredAt: Date;
  readonly payload: TPayload;
}
