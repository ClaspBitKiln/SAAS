import { Company } from '../entities/company.entity';

export const COMPANY_REPOSITORY = Symbol('COMPANY_REPOSITORY');

export interface CompanyRepository {
  findById(id: string, organizationId: string): Promise<Company | null>;
  findByInn(inn: string, organizationId: string): Promise<Company | null>;
  listByOrganization(
    organizationId: string,
    params: { page: number; size: number; q?: string },
  ): Promise<{ items: Company[]; total: number }>;
  save(company: Company): Promise<void>;
}
