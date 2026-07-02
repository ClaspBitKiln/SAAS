import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { REQUEST_REPOSITORY, RequestRepository } from '../../domain/repositories/request.repository';
import { toRequestListResponse, toRequestResponse } from '../dto/request-response.mapper';
import { RequestListResponseDto, RequestResponseDto } from '../dto/request.dto';
import { GetRequestQuery, ListRequestsQuery } from '../queries/request.queries';

@QueryHandler(GetRequestQuery)
export class GetRequestHandler implements IQueryHandler<GetRequestQuery> {
  constructor(@Inject(REQUEST_REPOSITORY) private readonly requestRepo: RequestRepository) {}

  async execute(query: GetRequestQuery): Promise<RequestResponseDto | null> {
    const request = await this.requestRepo.findById(query.id);
    return request ? toRequestResponse(request) : null;
  }
}

@QueryHandler(ListRequestsQuery)
export class ListRequestsHandler implements IQueryHandler<ListRequestsQuery> {
  constructor(@Inject(REQUEST_REPOSITORY) private readonly requestRepo: RequestRepository) {}

  async execute(query: ListRequestsQuery): Promise<RequestListResponseDto> {
    const { items, total } = await this.requestRepo.listByOrganization(query.organizationId, {
      page: query.page,
      size: query.size,
    });
    return toRequestListResponse(items, total, query.page, query.size);
  }
}
