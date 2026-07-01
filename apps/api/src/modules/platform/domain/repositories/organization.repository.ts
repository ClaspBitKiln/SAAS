import { Organization } from '../entities/organization.entity';

export const ORGANIZATION_REPOSITORY = Symbol('ORGANIZATION_REPOSITORY');

export interface OrganizationRepository {
  findById(id: string): Promise<Organization | null>;
  listByTenant(tenantId: string, params: { page: number; size: number }): Promise<{ items: Organization[]; total: number }>;
  save(org: Organization): Promise<void>;
}
