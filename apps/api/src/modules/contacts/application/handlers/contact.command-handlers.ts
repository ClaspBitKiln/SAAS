import { Inject } from '@nestjs/common';
import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { CONTACT_REPOSITORY, ContactRepository } from '../../domain/repositories/contact.repository';
import {
  ORGANIZATION_REPOSITORY,
  OrganizationRepository,
} from '../../../platform/domain/repositories/organization.repository';
import {
  COMPANY_REPOSITORY,
  CompanyRepository,
} from '../../../companies/domain/repositories/company.repository';
import { Contact } from '../../domain/entities/contact.entity';
import { CreateContactCommand, DeleteContactCommand, UpdateContactCommand } from '../commands/contact.commands';

async function resolveCompanyId(
  companyRepo: CompanyRepository,
  organizationId: string,
  companyId?: string | null,
): Promise<string | null | undefined> {
  if (companyId === undefined) return undefined;
  if (companyId === null) return null;
  const company = await companyRepo.findById(companyId, organizationId);
  if (!company) throw new Error('Company not found');
  return companyId;
}

@CommandHandler(CreateContactCommand)
export class CreateContactHandler implements ICommandHandler<CreateContactCommand> {
  constructor(
    @Inject(CONTACT_REPOSITORY) private readonly contactRepo: ContactRepository,
    @Inject(ORGANIZATION_REPOSITORY) private readonly orgRepo: OrganizationRepository,
    @Inject(COMPANY_REPOSITORY) private readonly companyRepo: CompanyRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(cmd: CreateContactCommand): Promise<{ id: string }> {
    const org = await this.orgRepo.findById(cmd.organizationId);
    if (!org) throw new Error('Organization not found');
    const companyId = await resolveCompanyId(this.companyRepo, cmd.organizationId, cmd.companyId);
    const contact = Contact.create({
      tenantId: org.tenantId,
      organizationId: cmd.organizationId,
      name: cmd.name,
      phone: cmd.phone,
      email: cmd.email,
      companyId: companyId ?? null,
    });
    await this.contactRepo.save(contact);
    contact.pullEvents().forEach((e) => this.eventBus.publish(e));
    return { id: contact.id };
  }
}

@CommandHandler(UpdateContactCommand)
export class UpdateContactHandler implements ICommandHandler<UpdateContactCommand> {
  constructor(
    @Inject(CONTACT_REPOSITORY) private readonly contactRepo: ContactRepository,
    @Inject(COMPANY_REPOSITORY) private readonly companyRepo: CompanyRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(cmd: UpdateContactCommand): Promise<void> {
    const contact = await this.contactRepo.findById(cmd.id, cmd.organizationId);
    if (!contact) throw new Error('Contact not found');
    const companyId = await resolveCompanyId(this.companyRepo, cmd.organizationId, cmd.companyId);
    contact.updateDetails({
      name: cmd.name,
      phone: cmd.phone,
      email: cmd.email,
      ...(companyId !== undefined ? { companyId } : {}),
    });
    await this.contactRepo.save(contact);
    contact.pullEvents().forEach((e) => this.eventBus.publish(e));
  }
}

@CommandHandler(DeleteContactCommand)
export class DeleteContactHandler implements ICommandHandler<DeleteContactCommand> {
  constructor(
    @Inject(CONTACT_REPOSITORY) private readonly contactRepo: ContactRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(cmd: DeleteContactCommand): Promise<void> {
    const contact = await this.contactRepo.findById(cmd.id, cmd.organizationId);
    if (!contact) throw new Error('Contact not found');
    contact.archive();
    await this.contactRepo.save(contact);
    contact.pullEvents().forEach((e) => this.eventBus.publish(e));
  }
}
