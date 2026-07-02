import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { COMPANY_REPOSITORY, CompanyRepository } from '../../domain/repositories/company.repository';
import { GetCompanyQuery, ListCompaniesQuery } from '../queries/company.queries';
import { CompanyResponseDto, toCompanyResponse } from '../dto/company-response.dto';
import { Page } from '../../../../shared/application/pagination';

@QueryHandler(GetCompanyQuery)
export class GetCompanyHandler implements IQueryHandler<GetCompanyQuery> {
  constructor(@Inject(COMPANY_REPOSITORY) private readonly repo: CompanyRepository) {}

  async execute(q: GetCompanyQuery): Promise<CompanyResponseDto | null> {
    const company = await this.repo.findById(q.id, q.organizationId);
    return company ? toCompanyResponse(company) : null;
  }
}

@QueryHandler(ListCompaniesQuery)
export class ListCompaniesHandler implements IQueryHandler<ListCompaniesQuery> {
  constructor(@Inject(COMPANY_REPOSITORY) private readonly repo: CompanyRepository) {}

  async execute(q: ListCompaniesQuery): Promise<Page<CompanyResponseDto>> {
    const { items, total } = await this.repo.listByOrganization(q.organizationId, {
      page: q.page,
      size: q.size,
      q: q.q,
    });
    return { items: items.map(toCompanyResponse), page: q.page, size: q.size, total };
  }
}
