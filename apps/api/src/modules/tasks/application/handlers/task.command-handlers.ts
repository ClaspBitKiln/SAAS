import { Inject } from '@nestjs/common';
import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { TASK_REPOSITORY, TaskRepository } from '../../domain/repositories/task.repository';
import {
  ORGANIZATION_REPOSITORY,
  OrganizationRepository,
} from '../../../platform/domain/repositories/organization.repository';
import {
  MEMBERSHIP_REPOSITORY,
  MembershipRepository,
} from '../../../memberships/domain/repositories/membership.repository';
import { MembershipStatusEnum } from '../../../memberships/domain/value-objects/membership-status.vo';
import {
  CONTACT_REPOSITORY,
  ContactRepository,
} from '../../../contacts/domain/repositories/contact.repository';
import {
  COMPANY_REPOSITORY,
  CompanyRepository,
} from '../../../companies/domain/repositories/company.repository';
import { Task } from '../../domain/entities/task.entity';
import { CancelTaskCommand, CompleteTaskCommand, CreateTaskCommand, UpdateTaskCommand } from '../commands/task.commands';

async function resolveAssignee(
  membershipRepo: MembershipRepository,
  organizationId: string,
  assigneeUserId?: string | null,
): Promise<string | undefined> {
  if (assigneeUserId === undefined || assigneeUserId === null) return undefined;
  const membership = await membershipRepo.findByUserAndOrganization(assigneeUserId, organizationId);
  if (!membership || membership.status !== MembershipStatusEnum.ACTIVE) {
    throw new Error('Assignee not found');
  }
  return assigneeUserId;
}

async function resolveContactId(
  contactRepo: ContactRepository,
  organizationId: string,
  contactId?: string | null,
): Promise<string | null | undefined> {
  if (contactId === undefined) return undefined;
  if (contactId === null) return null;
  const contact = await contactRepo.findById(contactId, organizationId);
  if (!contact) throw new Error('Contact not found');
  return contactId;
}

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

@CommandHandler(CreateTaskCommand)
export class CreateTaskHandler implements ICommandHandler<CreateTaskCommand> {
  constructor(
    @Inject(TASK_REPOSITORY) private readonly taskRepo: TaskRepository,
    @Inject(ORGANIZATION_REPOSITORY) private readonly orgRepo: OrganizationRepository,
    @Inject(MEMBERSHIP_REPOSITORY) private readonly membershipRepo: MembershipRepository,
    @Inject(CONTACT_REPOSITORY) private readonly contactRepo: ContactRepository,
    @Inject(COMPANY_REPOSITORY) private readonly companyRepo: CompanyRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(cmd: CreateTaskCommand): Promise<{ id: string }> {
    const org = await this.orgRepo.findById(cmd.organizationId);
    if (!org) throw new Error('Organization not found');
    const explicitAssignee = await resolveAssignee(this.membershipRepo, cmd.organizationId, cmd.assigneeUserId);
    const assigneeUserId = explicitAssignee ?? cmd.currentUserId;
    if (!assigneeUserId) throw new Error('Assignee not found');
    const contactId = await resolveContactId(this.contactRepo, cmd.organizationId, cmd.contactId);
    const companyId = await resolveCompanyId(this.companyRepo, cmd.organizationId, cmd.companyId);
    const task = Task.create({
      tenantId: org.tenantId,
      organizationId: cmd.organizationId,
      assigneeUserId,
      title: cmd.title,
      dueAt: cmd.dueAt,
      type: cmd.type,
      contactId: contactId ?? null,
      companyId: companyId ?? null,
    });
    await this.taskRepo.save(task);
    task.pullEvents().forEach((e) => this.eventBus.publish(e));
    return { id: task.id };
  }
}

@CommandHandler(UpdateTaskCommand)
export class UpdateTaskHandler implements ICommandHandler<UpdateTaskCommand> {
  constructor(
    @Inject(TASK_REPOSITORY) private readonly taskRepo: TaskRepository,
    @Inject(MEMBERSHIP_REPOSITORY) private readonly membershipRepo: MembershipRepository,
    @Inject(CONTACT_REPOSITORY) private readonly contactRepo: ContactRepository,
    @Inject(COMPANY_REPOSITORY) private readonly companyRepo: CompanyRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(cmd: UpdateTaskCommand): Promise<void> {
    const task = await this.taskRepo.findById(cmd.id, cmd.organizationId);
    if (!task) throw new Error('Task not found');
    const assigneeUserId = await resolveAssignee(this.membershipRepo, cmd.organizationId, cmd.assigneeUserId);
    const contactId = await resolveContactId(this.contactRepo, cmd.organizationId, cmd.contactId);
    const companyId = await resolveCompanyId(this.companyRepo, cmd.organizationId, cmd.companyId);
    task.updateDetails({
      title: cmd.title,
      dueAt: cmd.dueAt,
      type: cmd.type,
      ...(assigneeUserId !== undefined ? { assigneeUserId } : {}),
      ...(contactId !== undefined ? { contactId } : {}),
      ...(companyId !== undefined ? { companyId } : {}),
    });
    await this.taskRepo.save(task);
    task.pullEvents().forEach((e) => this.eventBus.publish(e));
  }
}

@CommandHandler(CompleteTaskCommand)
export class CompleteTaskHandler implements ICommandHandler<CompleteTaskCommand> {
  constructor(
    @Inject(TASK_REPOSITORY) private readonly taskRepo: TaskRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(cmd: CompleteTaskCommand): Promise<void> {
    const task = await this.taskRepo.findById(cmd.id, cmd.organizationId);
    if (!task) throw new Error('Task not found');
    task.complete();
    await this.taskRepo.save(task);
    task.pullEvents().forEach((e) => this.eventBus.publish(e));
  }
}

@CommandHandler(CancelTaskCommand)
export class CancelTaskHandler implements ICommandHandler<CancelTaskCommand> {
  constructor(
    @Inject(TASK_REPOSITORY) private readonly taskRepo: TaskRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(cmd: CancelTaskCommand): Promise<void> {
    const task = await this.taskRepo.findById(cmd.id, cmd.organizationId);
    if (!task) throw new Error('Task not found');
    task.cancel();
    await this.taskRepo.save(task);
    task.pullEvents().forEach((e) => this.eventBus.publish(e));
  }
}
