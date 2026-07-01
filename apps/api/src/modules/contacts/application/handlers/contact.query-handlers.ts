import { Inject } from '@nestjs/common';
import { IQueryHandler, QueryHandler } from '@nestjs/cqrs';
import { CONTACT_REPOSITORY, ContactRepository } from '../../domain/repositories/contact.repository';
import { GetContactQuery, ListContactsQuery } from '../queries/contact.queries';
import { ContactResponseDto, toContactResponse } from '../dto/contact-response.dto';
import { Page } from '../../../../shared/application/pagination';

@QueryHandler(GetContactQuery)
export class GetContactHandler implements IQueryHandler<GetContactQuery> {
  constructor(@Inject(CONTACT_REPOSITORY) private readonly repo: ContactRepository) {}

  async execute(q: GetContactQuery): Promise<ContactResponseDto | null> {
    const contact = await this.repo.findById(q.id);
    return contact ? toContactResponse(contact) : null;
  }
}

@QueryHandler(ListContactsQuery)
export class ListContactsHandler implements IQueryHandler<ListContactsQuery> {
  constructor(@Inject(CONTACT_REPOSITORY) private readonly repo: ContactRepository) {}

  async execute(q: ListContactsQuery): Promise<Page<ContactResponseDto>> {
    const { items, total } = await this.repo.listByOrganization(q.organizationId, {
      page: q.page,
      size: q.size,
    });
    return { items: items.map(toContactResponse), page: q.page, size: q.size, total };
  }
}
