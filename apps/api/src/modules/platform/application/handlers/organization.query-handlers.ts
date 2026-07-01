import { Inject } from '@nestjs/common';
import { QueryHandler, IQueryHandler } from '@nestjs/cqrs';
import {
  ORGANIZATION_REPOSITORY,
  OrganizationRepository,
} from '../../domain/repositories/organization.repository';
import { GetOrganizationQuery, ListOrganizationsQuery } from '../queries/organization.queries';
import { OrganizationResponseDto, toOrganizationResponse } from '../dto/organization-response.dto';
import { Page } from '../../../../shared/application/pagination';

@QueryHandler(GetOrganizationQuery)
export class GetOrganizationHandler implements IQueryHandler<GetOrganizationQuery> {
  constructor(@Inject(ORGANIZATION_REPOSITORY) private readonly repo: OrganizationRepository) {}

  async execute(q: GetOrganizationQuery): Promise<OrganizationResponseDto | null> {
    const org = await this.repo.findById(q.id);
    return org ? toOrganizationResponse(org) : null;
  }
}

@QueryHandler(ListOrganizationsQuery)
export class ListOrganizationsHandler implements IQueryHandler<ListOrganizationsQuery> {
  constructor(@Inject(ORGANIZATION_REPOSITORY) private readonly repo: OrganizationRepository) {}

  async execute(q: ListOrganizationsQuery): Promise<Page<OrganizationResponseDto>> {
    const { items, total } = await this.repo.listByTenant(q.tenantId, { page: q.page, size: q.size });
    return { items: items.map(toOrganizationResponse), page: q.page, size: q.size, total };
  }
}
