import { Inject } from '@nestjs/common';
import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import {
  ORGANIZATION_REPOSITORY,
  OrganizationRepository,
} from '../../domain/repositories/organization.repository';
import { TENANT_REPOSITORY, TenantRepository } from '../../domain/repositories/tenant.repository';
import { Organization } from '../../domain/entities/organization.entity';
import { CreateOrganizationCommand, UpdateOrganizationCommand } from '../commands/organization.commands';

@CommandHandler(CreateOrganizationCommand)
export class CreateOrganizationHandler implements ICommandHandler<CreateOrganizationCommand> {
  constructor(
    @Inject(ORGANIZATION_REPOSITORY) private readonly orgRepo: OrganizationRepository,
    @Inject(TENANT_REPOSITORY) private readonly tenantRepo: TenantRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(cmd: CreateOrganizationCommand): Promise<{ id: string }> {
    const tenant = await this.tenantRepo.findById(cmd.tenantId);
    if (!tenant) throw new Error('Tenant не найден');
    const org = Organization.create({
      tenantId: cmd.tenantId,
      name: cmd.name,
      inn: cmd.inn,
      settings: cmd.settings,
    });
    await this.orgRepo.save(org);
    org.pullEvents().forEach((e) => this.eventBus.publish(e));
    return { id: org.id };
  }
}

@CommandHandler(UpdateOrganizationCommand)
export class UpdateOrganizationHandler implements ICommandHandler<UpdateOrganizationCommand> {
  constructor(
    @Inject(ORGANIZATION_REPOSITORY) private readonly orgRepo: OrganizationRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(cmd: UpdateOrganizationCommand): Promise<void> {
    const org = await this.orgRepo.findById(cmd.id);
    if (!org) throw new Error('Organization не найдена');
    org.updateDetails({ name: cmd.name, inn: cmd.inn, settings: cmd.settings });
    await this.orgRepo.save(org);
    org.pullEvents().forEach((e) => this.eventBus.publish(e));
  }
}
