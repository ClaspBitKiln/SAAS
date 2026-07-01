import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { USER_REPOSITORY, UserRepository } from '../../domain/repositories/user.repository';
import { GetUserByEmailQuery, GetUserQuery, ListUsersQuery } from '../queries/user.queries';
import { UserResponseDto, toUserResponse } from '../dto/user-response.dto';
import { Page } from '../../../../shared/application/pagination';

@QueryHandler(GetUserQuery)
export class GetUserHandler implements IQueryHandler<GetUserQuery> {
  constructor(@Inject(USER_REPOSITORY) private readonly repo: UserRepository) {}

  async execute(q: GetUserQuery): Promise<UserResponseDto | null> {
    const user = await this.repo.findById(q.id);
    return user ? toUserResponse(user) : null;
  }
}

@QueryHandler(GetUserByEmailQuery)
export class GetUserByEmailHandler implements IQueryHandler<GetUserByEmailQuery> {
  constructor(@Inject(USER_REPOSITORY) private readonly repo: UserRepository) {}

  async execute(q: GetUserByEmailQuery): Promise<UserResponseDto | null> {
    const user = await this.repo.findByEmail(q.email);
    return user ? toUserResponse(user) : null;
  }
}

@QueryHandler(ListUsersQuery)
export class ListUsersHandler implements IQueryHandler<ListUsersQuery> {
  constructor(@Inject(USER_REPOSITORY) private readonly repo: UserRepository) {}

  async execute(q: ListUsersQuery): Promise<Page<UserResponseDto>> {
    const { items, total } = await this.repo.list({ page: q.page, size: q.size });
    return { items: items.map(toUserResponse), page: q.page, size: q.size, total };
  }
}
