import { Inject } from '@nestjs/common';
import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { USER_REPOSITORY, UserRepository } from '../../domain/repositories/user.repository';
import { User } from '../../domain/entities/user.entity';
import {
  ActivateUserCommand,
  CreateUserCommand,
  DisableUserCommand,
  UpdateUserCommand,
} from '../commands/user.commands';

@CommandHandler(CreateUserCommand)
export class CreateUserHandler implements ICommandHandler<CreateUserCommand> {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepo: UserRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(cmd: CreateUserCommand): Promise<{ id: string }> {
    const existing = await this.userRepo.findByEmail(cmd.email);
    if (existing) {
      throw new Error('User email already exists');
    }
    const user = User.create({
      email: cmd.email,
      name: cmd.name,
      avatarUrl: cmd.avatarUrl,
      locale: cmd.locale,
      timezone: cmd.timezone,
    });
    await this.userRepo.save(user);
    user.pullEvents().forEach((e) => this.eventBus.publish(e));
    return { id: user.id };
  }
}

@CommandHandler(UpdateUserCommand)
export class UpdateUserHandler implements ICommandHandler<UpdateUserCommand> {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepo: UserRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(cmd: UpdateUserCommand): Promise<void> {
    const user = await this.userRepo.findById(cmd.id);
    if (!user) throw new Error('User not found');
    user.updateProfile({
      name: cmd.name,
      avatarUrl: cmd.avatarUrl,
      locale: cmd.locale,
      timezone: cmd.timezone,
    });
    await this.userRepo.save(user);
    user.pullEvents().forEach((e) => this.eventBus.publish(e));
  }
}

@CommandHandler(ActivateUserCommand)
export class ActivateUserHandler implements ICommandHandler<ActivateUserCommand> {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepo: UserRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(cmd: ActivateUserCommand): Promise<void> {
    const user = await this.userRepo.findById(cmd.id);
    if (!user) throw new Error('User not found');
    user.activate();
    await this.userRepo.save(user);
    user.pullEvents().forEach((e) => this.eventBus.publish(e));
  }
}

@CommandHandler(DisableUserCommand)
export class DisableUserHandler implements ICommandHandler<DisableUserCommand> {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepo: UserRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(cmd: DisableUserCommand): Promise<void> {
    const user = await this.userRepo.findById(cmd.id);
    if (!user) throw new Error('User not found');
    user.disable();
    await this.userRepo.save(user);
    user.pullEvents().forEach((e) => this.eventBus.publish(e));
  }
}
