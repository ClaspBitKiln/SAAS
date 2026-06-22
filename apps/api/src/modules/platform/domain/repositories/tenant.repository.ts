import { Tenant } from '../entities/tenant.entity';

export const TENANT_REPOSITORY = Symbol('TENANT_REPOSITORY');

// Интерфейс репозитория (ADR-009). Реализация — в infrastructure.
export interface TenantRepository {
  findById(id: string): Promise<Tenant | null>;
  findBySlug(slug: string): Promise<Tenant | null>;
  list(params: { page: number; size: number }): Promise<{ items: Tenant[]; total: number }>;
  save(tenant: Tenant): Promise<void>; // upsert + optimistic version
}
