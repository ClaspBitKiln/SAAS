import { Inject } from '@nestjs/common';
import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { MEMBERSHIP_REPOSITORY, MembershipRepository } from '../../domain/repositories/membership.repository';
import { TENANT_REPOSITORY, TenantRepository } from '../../../platform/domain/repositories/tenant.repository';
import {
  ORGANIZATION_REPOSITORY,
  OrganizationRepository,
} from '../../../platform/domain/repositories/organization.repository';
import { USER_REPOSITORY, UserRepository } from '../../../users/domain/repositories/user.repository';
import { Membership } from '../../domain/entities/membership.entity';
import {
  AcceptMembershipCommand,
  ChangeMembershipRoleCommand,
  InviteMembershipCommand,
  RevokeMembershipCommand,
  SetDefaultMembershipCommand,
  SuspendMembershipCommand,
} from '../commands/membership.commands';

@CommandHandler(InviteMembershipCommand)
export class InviteMembershipHandler implements ICommandHandler<InviteMembershipCommand> {
  constructor(
    @Inject(MEMBERSHIP_REPOSITORY) private readonly membershipRepo: MembershipRepository,
    @Inject(TENANT_REPOSITORY) private readonly tenantRepo: TenantRepository,
    @Inject(ORGANIZATION_REPOSITORY) private readonly orgRepo: OrganizationRepository,
    @Inject(USER_REPOSITORY) private readonly userRepo: UserRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(cmd: InviteMembershipCommand): Promise<{ id: string }> {
    const tenant = await this.tenantRepo.findById(cmd.tenantId);
    if (!tenant) throw new Error('Tenant not found');
    const user = await this.userRepo.findById(cmd.userId);
    if (!user) throw new Error('User not found');
    const org = await this.orgRepo.findById(cmd.organizationId);
    if (!org) throw new Error('Organization not found');
    if (org.tenantId !== cmd.tenantId) throw new Error('Organization tenant mismatch');

    const existing = await this.membershipRepo.findByUserAndOrganization(cmd.userId, cmd.organizationId);
    if (existing) throw new Error('Membership already exists');

    const membership = Membership.invite({
      tenantId: cmd.tenantId,
      userId: cmd.userId,
      organizationId: cmd.organizationId,
      invitedBy: cmd.invitedBy,
      roleId: cmd.roleId,
      isDefault: cmd.isDefault,
    });
    await this.membershipRepo.save(membership);
    membership.pullEvents().forEach((e) => this.eventBus.publish(e));
    return { id: membership.id };
  }
}

@CommandHandler(AcceptMembershipCommand)
export class AcceptMembershipHandler implements ICommandHandler<AcceptMembershipCommand> {
  constructor(
    @Inject(MEMBERSHIP_REPOSITORY) private readonly membershipRepo: MembershipRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(cmd: AcceptMembershipCommand): Promise<void> {
    const membership = await this.membershipRepo.findById(cmd.id);
    if (!membership) throw new Error('Membership not found');
    membership.accept();
    await this.membershipRepo.save(membership);
    membership.pullEvents().forEach((e) => this.eventBus.publish(e));
  }
}

@CommandHandler(SuspendMembershipCommand)
export class SuspendMembershipHandler implements ICommandHandler<SuspendMembershipCommand> {
  constructor(
    @Inject(MEMBERSHIP_REPOSITORY) private readonly membershipRepo: MembershipRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(cmd: SuspendMembershipCommand): Promise<void> {
    const membership = await this.membershipRepo.findById(cmd.id);
    if (!membership) throw new Error('Membership not found');
    membership.suspend();
    await this.membershipRepo.save(membership);
    membership.pullEvents().forEach((e) => this.eventBus.publish(e));
  }
}

@CommandHandler(RevokeMembershipCommand)
export class RevokeMembershipHandler implements ICommandHandler<RevokeMembershipCommand> {
  constructor(
    @Inject(MEMBERSHIP_REPOSITORY) private readonly membershipRepo: MembershipRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(cmd: RevokeMembershipCommand): Promise<void> {
    const membership = await this.membershipRepo.findById(cmd.id);
    if (!membership) throw new Error('Membership not found');
    membership.revoke();
    await this.membershipRepo.save(membership);
    membership.pullEvents().forEach((e) => this.eventBus.publish(e));
  }
}

@CommandHandler(SetDefaultMembershipCommand)
export class SetDefaultMembershipHandler implements ICommandHandler<SetDefaultMembershipCommand> {
  constructor(
    @Inject(MEMBERSHIP_REPOSITORY) private readonly membershipRepo: MembershipRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(cmd: SetDefaultMembershipCommand): Promise<void> {
    const membership = await this.membershipRepo.findById(cmd.id);
    if (!membership) throw new Error('Membership not found');
    membership.setDefault();
    await this.membershipRepo.save(membership);
    membership.pullEvents().forEach((e) => this.eventBus.publish(e));
  }
}

@CommandHandler(ChangeMembershipRoleCommand)
export class ChangeMembershipRoleHandler implements ICommandHandler<ChangeMembershipRoleCommand> {
  constructor(
    @Inject(MEMBERSHIP_REPOSITORY) private readonly membershipRepo: MembershipRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(cmd: ChangeMembershipRoleCommand): Promise<void> {
    const membership = await this.membershipRepo.findById(cmd.id);
    if (!membership) throw new Error('Membership not found');
    membership.changeRole(cmd.roleId);
    await this.membershipRepo.save(membership);
    membership.pullEvents().forEach((e) => this.eventBus.publish(e));
  }
}
