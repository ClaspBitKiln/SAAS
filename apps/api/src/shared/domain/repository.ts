// Базовый интерфейс репозитория (ADR-009). Реализация — только в infrastructure.
// Все методы обязаны фильтровать по tenantId (изоляция арендатора + RLS).
export interface Repository<T> {
  findById(tenantId: string, id: string): Promise<T | null>;
  save(entity: T): Promise<void>;   // upsert + инкремент version
  delete(tenantId: string, id: string): Promise<void>; // soft delete
}
