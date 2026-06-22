// Базовая сущность (ADR-012). Поля общие для всех сущностей.
export abstract class BaseEntity {
  readonly id: string;            // UUIDv7 (immutable)
  readonly tenantId: string;
  readonly createdAt: Date;
  updatedAt: Date;
  deletedAt: Date | null = null;  // soft delete
  version: number = 0;            // оптимистическая блокировка

  protected constructor(props: {
    id: string;
    tenantId: string;
    createdAt?: Date;
    updatedAt?: Date;
    version?: number;
  }) {
    this.id = props.id;
    this.tenantId = props.tenantId;
    this.createdAt = props.createdAt ?? new Date();
    this.updatedAt = props.updatedAt ?? this.createdAt;
    this.version = props.version ?? 0;
  }

  protected touch(): void {
    this.updatedAt = new Date();
    this.version += 1;
  }

  softDelete(): void {
    this.deletedAt = new Date();
    this.touch();
  }
}
