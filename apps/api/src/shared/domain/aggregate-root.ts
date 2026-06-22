import { BaseEntity } from './base-entity';
import { DomainEvent } from './domain-event';

// Корень агрегата (ADR-012): состояние меняется только методами агрегата,
// которые накапливают доменные события. Хендлер забирает их через pullEvents().
export abstract class AggregateRoot extends BaseEntity {
  private _events: DomainEvent[] = [];

  protected addEvent(event: DomainEvent): void {
    this._events.push(event);
  }

  pullEvents(): DomainEvent[] {
    const events = this._events;
    this._events = [];
    return events;
  }
}
