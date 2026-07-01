import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { MEMBERSHIP_REPOSITORY, MembershipRepository } from '../../domain/repositories/membership.repository';
import {
  GetMembershipQuery,
  ListMembershipsByOrganizationQuery,
  ListMembershipsByUserQuery,
} from '../queries/membership.queries';
import { MembershipResponseDto, toMembershipResponse } from '../dto/membership-response.dto';
import { Page } from '../../../../shared/application/pagination';

@QueryHandler(GetMembershipQuery)
export class GetMembershipHandler implements IQueryHandler<GetMembershipQuery> {
  constructor(@Inject(MEMBERSHIP_REPOSITORY) private readonly repo: MembershipRepository) {}

  async execute(q: GetMembershipQuery): Promise<MembershipResponseDto | null> {
    const m = await this.repo.findById(q.id);
    return m ? toMembershipResponse(m) : null;
  }
}

@QueryHandler(ListMembershipsByUserQuery)
export class ListMembershipsByUserHandler implements IQueryHandler<ListMembershipsByUserQuery> {
  constructor(@Inject(MEMBERSHIP_REPOSITORY) private readonly repo: MembershipRepository) {}

  async execute(q: ListMembershipsByUserQuery): Promise<Page<MembershipResponseDto>> {
    const { items, total } = await this.repo.listByUser(q.userId, { page: q.page, size: q.size });
    return { items: items.map(toMembershipResponse), page: q.page, size: q.size, total };
  }
}

@QueryHandler(ListMembershipsByOrganizationQuery)
export class ListMembershipsByOrganizationHandler implements IQueryHandler<ListMembershipsByOrganizationQuery> {
  constructor(@Inject(MEMBERSHIP_REPOSITORY) private readonly repo: MembershipRepository) {}

  async execute(q: ListMembershipsByOrganizationQuery): Promise<Page<MembershipResponseDto>> {
    const { items, total } = await this.repo.listByOrganization(q.organizationId, {
      page: q.page,
      size: q.size,
    });
    return { items: items.map(toMembershipResponse), page: q.page, size: q.size, total };
  }
}
