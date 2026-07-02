import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { CALL_REPOSITORY, CallRepository } from '../../domain/repositories/call.repository';
import { GetCallQuery, ListCallsByContactQuery, ListCallsByOrganizationQuery } from '../queries/call.queries';
import { CallResponseDto, toCallResponse } from '../dto/call-response.dto';
import { Page } from '../../../../shared/application/pagination';

@QueryHandler(GetCallQuery)
export class GetCallHandler implements IQueryHandler<GetCallQuery> {
  constructor(@Inject(CALL_REPOSITORY) private readonly repo: CallRepository) {}

  async execute(q: GetCallQuery): Promise<CallResponseDto | null> {
    const call = await this.repo.findById(q.id, q.organizationId);
    return call ? toCallResponse(call) : null;
  }
}

@QueryHandler(ListCallsByContactQuery)
export class ListCallsByContactHandler implements IQueryHandler<ListCallsByContactQuery> {
  constructor(@Inject(CALL_REPOSITORY) private readonly repo: CallRepository) {}

  async execute(q: ListCallsByContactQuery): Promise<Page<CallResponseDto>> {
    const { items, total } = await this.repo.listByContact(q.contactId, q.organizationId, {
      page: q.page,
      size: q.size,
    });
    return { items: items.map(toCallResponse), page: q.page, size: q.size, total };
  }
}

@QueryHandler(ListCallsByOrganizationQuery)
export class ListCallsByOrganizationHandler implements IQueryHandler<ListCallsByOrganizationQuery> {
  constructor(@Inject(CALL_REPOSITORY) private readonly repo: CallRepository) {}

  async execute(q: ListCallsByOrganizationQuery): Promise<Page<CallResponseDto>> {
    const { items, total } = await this.repo.listByOrganization(q.organizationId, {
      page: q.page,
      size: q.size,
    });
    return { items: items.map(toCallResponse), page: q.page, size: q.size, total };
  }
}
