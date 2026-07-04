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
import {
  MEMBERSHIP_REPOSITORY,
  MembershipRepository,
} from '../../../memberships/domain/repositories/membership.repository';
import { MembershipStatusEnum } from '../../../memberships/domain/value-objects/membership-status.vo';
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

/** Org-scoped owner check: user must have an ACTIVE membership in the organization. */
async function resolveOwnerUserId(
  membershipRepo: MembershipRepository,
  organizationId: string,
  ownerUserId?: string | null,
): Promise<string | null | undefined> {
  if (ownerUserId === undefined) return undefined;
  if (ownerUserId === null) return null;
  const membership = await membershipRepo.findByUserAndOrganization(ownerUserId, organizationId);
  if (!membership || membership.status !== MembershipStatusEnum.ACTIVE) {
    throw new Error('Owner not found');
  }
  return ownerUserId;
}

@CommandHandler(CreateContactCommand)
export class CreateContactHandler implements ICommandHandler<CreateContactCommand> {
  constructor(
    @Inject(CONTACT_REPOSITORY) private readonly contactRepo: ContactRepository,
    @Inject(ORGANIZATION_REPOSITORY) private readonly orgRepo: OrganizationRepository,
    @Inject(COMPANY_REPOSITORY) private readonly companyRepo: CompanyRepository,
    @Inject(MEMBERSHIP_REPOSITORY) private readonly membershipRepo: MembershipRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(cmd: CreateContactCommand): Promise<{ id: string }> {
    const org = await this.orgRepo.findById(cmd.organizationId);
    if (!org) throw new Error('Organization not found');
    const companyId = await resolveCompanyId(this.companyRepo, cmd.organizationId, cmd.companyId);
    const resolvedOwner = await resolveOwnerUserId(this.membershipRepo, cmd.organizationId, cmd.ownerUserId);
    // Self-filling default (PRODUCT_PRINCIPLES #11): creator becomes owner unless explicitly set.
    const ownerUserId = resolvedOwner ?? cmd.currentUserId ?? null;
    const contact = Contact.create({
      tenantId: org.tenantId,
      organizationId: cmd.organizationId,
      name: cmd.name,
      phone: cmd.phone,
      email: cmd.email,
      companyId: companyId ?? null,
      ownerUserId,
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
    @Inject(MEMBERSHIP_REPOSITORY) private readonly membershipRepo: MembershipRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(cmd: UpdateContactCommand): Promise<void> {
    const contact = await this.contactRepo.findById(cmd.id, cmd.organizationId);
    if (!contact) throw new Error('Contact not found');
    const companyId = await resolveCompanyId(this.companyRepo, cmd.organizationId, cmd.companyId);
    const ownerUserId = await resolveOwnerUserId(this.membershipRepo, cmd.organizationId, cmd.ownerUserId);
    contact.updateDetails({
      name: cmd.name,
      phone: cmd.phone,
      email: cmd.email,
      ...(companyId !== undefined ? { companyId } : {}),
      ...(ownerUserId !== undefined ? { ownerUserId } : {}),
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
