import { ConflictException, Inject } from '@nestjs/common';
import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { COMPANY_REPOSITORY, CompanyRepository } from '../../domain/repositories/company.repository';
import {
  ORGANIZATION_REPOSITORY,
  OrganizationRepository,
} from '../../../platform/domain/repositories/organization.repository';
import { Company } from '../../domain/entities/company.entity';
import { CreateCompanyCommand, DeleteCompanyCommand, UpdateCompanyCommand } from '../commands/company.commands';

@CommandHandler(CreateCompanyCommand)
export class CreateCompanyHandler implements ICommandHandler<CreateCompanyCommand> {
  constructor(
    @Inject(COMPANY_REPOSITORY) private readonly companyRepo: CompanyRepository,
    @Inject(ORGANIZATION_REPOSITORY) private readonly orgRepo: OrganizationRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(cmd: CreateCompanyCommand): Promise<{ id: string }> {
    const org = await this.orgRepo.findById(cmd.organizationId);
    if (!org) throw new Error('Organization not found');
    if (cmd.inn) {
      const existing = await this.companyRepo.findByInn(cmd.inn, cmd.organizationId);
      if (existing) throw new ConflictException('Company with this INN already exists');
    }
    const company = Company.create({
      tenantId: org.tenantId,
      organizationId: cmd.organizationId,
      name: cmd.name,
      inn: cmd.inn,
      website: cmd.website,
      phone: cmd.phone,
      email: cmd.email,
    });
    await this.companyRepo.save(company);
    company.pullEvents().forEach((e) => this.eventBus.publish(e));
    return { id: company.id };
  }
}

@CommandHandler(UpdateCompanyCommand)
export class UpdateCompanyHandler implements ICommandHandler<UpdateCompanyCommand> {
  constructor(
    @Inject(COMPANY_REPOSITORY) private readonly companyRepo: CompanyRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(cmd: UpdateCompanyCommand): Promise<void> {
    const company = await this.companyRepo.findById(cmd.id, cmd.organizationId);
    if (!company) throw new Error('Company not found');
    if (cmd.inn) {
      const existing = await this.companyRepo.findByInn(cmd.inn, cmd.organizationId);
      if (existing && existing.id !== cmd.id) throw new ConflictException('Company with this INN already exists');
    }
    company.updateDetails({
      name: cmd.name,
      inn: cmd.inn,
      website: cmd.website,
      phone: cmd.phone,
      email: cmd.email,
    });
    await this.companyRepo.save(company);
    company.pullEvents().forEach((e) => this.eventBus.publish(e));
  }
}

@CommandHandler(DeleteCompanyCommand)
export class DeleteCompanyHandler implements ICommandHandler<DeleteCompanyCommand> {
  constructor(
    @Inject(COMPANY_REPOSITORY) private readonly companyRepo: CompanyRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(cmd: DeleteCompanyCommand): Promise<void> {
    const company = await this.companyRepo.findById(cmd.id, cmd.organizationId);
    if (!company) throw new Error('Company not found');
    company.archive();
    await this.companyRepo.save(company);
    company.pullEvents().forEach((e) => this.eventBus.publish(e));
  }
}
