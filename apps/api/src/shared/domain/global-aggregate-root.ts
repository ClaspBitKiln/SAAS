import { DomainEvent } from './domain-event';

// Global-scope aggregate (no tenantId). Used by User per authorization-model.
export abstract class GlobalAggregateRoot {
  readonly id: string;
  readonly createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null = null;
  version: number = 0;

  private _events: DomainEvent[] = [];

  protected constructor(props: {
    id: string;
    createdAt?: Date;
    updatedAt?: Date;
    version?: number;
  }) {
    this.id = props.id;
    this.createdAt = props.createdAt ?? new Date();
    this.updatedAt = props.updatedAt ?? this.createdAt;
    this.version = props.version ?? 0;
  }

  protected touch(): void {
    this.updatedAt = new Date();
    this.version += 1;
  }

  protected addEvent(event: DomainEvent): void {
    this._events.push(event);
  }

  pullEvents(): DomainEvent[] {
    const events = this._events;
    this._events = [];
    return events;
  }

  softDelete(): void {
    this.deletedAt = new Date();
    this.touch();
  }
}
