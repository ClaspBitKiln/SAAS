import { Inject } from '@nestjs/common';
import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import { TENANT_REPOSITORY, TenantRepository } from '../../domain/repositories/tenant.repository';
import { GetTenantQuery, ListTenantsQuery } from '../queries/tenant.queries';
import { TenantResponseDto, toTenantResponse } from '../dto/tenant-response.dto';
import { Page } from '../../../../shared/application/pagination';

@QueryHandler(GetTenantQuery)
export class GetTenantHandler implements IQueryHandler<GetTenantQuery> {
  constructor(@Inject(TENANT_REPOSITORY) private readonly repo: TenantRepository) {}

  async execute(q: GetTenantQuery): Promise<TenantResponseDto | null> {
    const tenant = await this.repo.findById(q.id);
    return tenant ? toTenantResponse(tenant) : null;
  }
}

@QueryHandler(ListTenantsQuery)
export class ListTenantsHandler implements IQueryHandler<ListTenantsQuery> {
  constructor(@Inject(TENANT_REPOSITORY) private readonly repo: TenantRepository) {}

  async execute(q: ListTenantsQuery): Promise<Page<TenantResponseDto>> {
    const { items, total } = await this.repo.list({ page: q.page, size: q.size });
    return { items: items.map(toTenantResponse), page: q.page, size: q.size, total };
  }
}
