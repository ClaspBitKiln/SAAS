import { Inject } from '@nestjs/common';
import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { CALL_REPOSITORY, CallRepository } from '../../domain/repositories/call.repository';
import { CONTACT_REPOSITORY, ContactRepository } from '../../../contacts/domain/repositories/contact.repository';
import { Call } from '../../domain/entities/call.entity';
import { CompleteCallCommand, MissCallCommand, StartCallCommand } from '../commands/call.commands';

@CommandHandler(StartCallCommand)
export class StartCallHandler implements ICommandHandler<StartCallCommand> {
  constructor(
    @Inject(CALL_REPOSITORY) private readonly callRepo: CallRepository,
    @Inject(CONTACT_REPOSITORY) private readonly contactRepo: ContactRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(cmd: StartCallCommand): Promise<{ id: string }> {
    const contact = await this.contactRepo.findById(cmd.contactId, cmd.organizationId);
    if (!contact) throw new Error('Contact not found');
    const call = Call.start({
      tenantId: contact.tenantId,
      organizationId: contact.organizationId,
      contactId: cmd.contactId,
      direction: cmd.direction,
      phone: cmd.phone,
    });
    await this.callRepo.save(call);
    call.pullEvents().forEach((e) => this.eventBus.publish(e));
    return { id: call.id };
  }
}

@CommandHandler(CompleteCallCommand)
export class CompleteCallHandler implements ICommandHandler<CompleteCallCommand> {
  constructor(
    @Inject(CALL_REPOSITORY) private readonly callRepo: CallRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(cmd: CompleteCallCommand): Promise<void> {
    const call = await this.callRepo.findById(cmd.id, cmd.organizationId);
    if (!call) throw new Error('Call not found');
    call.complete();
    await this.callRepo.save(call);
    call.pullEvents().forEach((e) => this.eventBus.publish(e));
  }
}

@CommandHandler(MissCallCommand)
export class MissCallHandler implements ICommandHandler<MissCallCommand> {
  constructor(
    @Inject(CALL_REPOSITORY) private readonly callRepo: CallRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(cmd: MissCallCommand): Promise<void> {
    const call = await this.callRepo.findById(cmd.id, cmd.organizationId);
    if (!call) throw new Error('Call not found');
    call.markMissed();
    await this.callRepo.save(call);
    call.pullEvents().forEach((e) => this.eventBus.publish(e));
  }
}
