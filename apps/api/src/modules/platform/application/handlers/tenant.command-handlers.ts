import { Inject } from '@nestjs/common';
import { CommandHandler, ICommandHandler, EventBus } from '@nestjs/cqrs';
import { TENANT_REPOSITORY, TenantRepository } from '../../domain/repositories/tenant.repository';
import { Tenant } from '../../domain/entities/tenant.entity';
import { PlanType, PlanTypeEnum } from '../../domain/value-objects/plan-type.vo';
import { CreateTenantCommand, ActivateTenantCommand, SuspendTenantCommand } from '../commands/tenant.commands';

// Примечание (ADR-006): сейчас доменные события публикуются через NestJS EventBus.
// Маршрутизация через event_outbox подключается, когда готов модуль events/outbox
// (он раньше platform в порядке сборки). См. modules/platform/README.md.

@CommandHandler(CreateTenantCommand)
export class CreateTenantHandler implements ICommandHandler<CreateTenantCommand> {
  constructor(
    @Inject(TENANT_REPOSITORY) private readonly repo: TenantRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(cmd: CreateTenantCommand): Promise<{ id: string }> {
    const existing = await this.repo.findBySlug(cmd.slug);
    if (existing) throw new Error('Tenant с таким slug уже существует');
    const plan = cmd.plan ? new PlanType(cmd.plan as PlanTypeEnum) : PlanType.free();
    const tenant = Tenant.create({ name: cmd.name, slug: cmd.slug, plan });
    await this.repo.save(tenant);
    tenant.pullEvents().forEach((e) => this.eventBus.publish(e));
    return { id: tenant.id };
  }
}

@CommandHandler(ActivateTenantCommand)
export class ActivateTenantHandler implements ICommandHandler<ActivateTenantCommand> {
  constructor(
    @Inject(TENANT_REPOSITORY) private readonly repo: TenantRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(cmd: ActivateTenantCommand): Promise<void> {
    const tenant = await this.repo.findById(cmd.id);
    if (!tenant) throw new Error('Tenant не найден');
    tenant.activate();
    await this.repo.save(tenant);
    tenant.pullEvents().forEach((e) => this.eventBus.publish(e));
  }
}

@CommandHandler(SuspendTenantCommand)
export class SuspendTenantHandler implements ICommandHandler<SuspendTenantCommand> {
  constructor(
    @Inject(TENANT_REPOSITORY) private readonly repo: TenantRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(cmd: SuspendTenantCommand): Promise<void> {
    const tenant = await this.repo.findById(cmd.id);
    if (!tenant) throw new Error('Tenant не найден');
    tenant.suspend();
    await this.repo.save(tenant);
    tenant.pullEvents().forEach((e) => this.eventBus.publish(e));
  }
}
