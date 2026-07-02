import { Inject, UnauthorizedException } from '@nestjs/common';
import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { JwtService } from '@nestjs/jwt';
import { USER_REPOSITORY, UserRepository } from '../../../users/domain/repositories/user.repository';
import { UserStatusEnum } from '../../../users/domain/value-objects/user-status.vo';
import {
  MEMBERSHIP_REPOSITORY,
  MembershipRepository,
} from '../../../memberships/domain/repositories/membership.repository';
import { CREDENTIAL_REPOSITORY, CredentialRepository } from '../../domain/repositories/credential.repository';
import { Credential } from '../../domain/entities/credential.entity';
import { PlainPassword } from '../../domain/value-objects/plain-password.vo';
import { PASSWORD_HASHER, PasswordHasher } from '../../infrastructure/bcrypt-password.hasher';
import { LoginCommand, SetPasswordCommand } from '../commands/auth.commands';
import { LoginResponseDto } from '../dto/login-response.dto';

@CommandHandler(SetPasswordCommand)
export class SetPasswordHandler implements ICommandHandler<SetPasswordCommand> {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepo: UserRepository,
    @Inject(CREDENTIAL_REPOSITORY) private readonly credentialRepo: CredentialRepository,
    @Inject(PASSWORD_HASHER) private readonly passwordHasher: PasswordHasher,
    private readonly eventBus: EventBus,
  ) {}

  async execute(cmd: SetPasswordCommand): Promise<void> {
    const user = await this.userRepo.findById(cmd.userId);
    if (!user) throw new Error('User not found');
    if (user.status === UserStatusEnum.DISABLED) throw new Error('User is disabled');

    const password = new PlainPassword(cmd.password);
    const passwordHash = await this.passwordHasher.hash(password.value);

    const existing = await this.credentialRepo.findByUserId(cmd.userId);
    if (existing) {
      existing.changePassword(passwordHash);
      await this.credentialRepo.save(existing);
      existing.pullEvents().forEach((e) => this.eventBus.publish(e));
    } else {
      const credential = Credential.create(cmd.userId, passwordHash);
      await this.credentialRepo.save(credential);
      credential.pullEvents().forEach((e) => this.eventBus.publish(e));
    }

    if (user.status === UserStatusEnum.INVITED) {
      user.activate();
      await this.userRepo.save(user);
      user.pullEvents().forEach((e) => this.eventBus.publish(e));
    }
  }
}

@CommandHandler(LoginCommand)
export class LoginHandler implements ICommandHandler<LoginCommand> {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepo: UserRepository,
    @Inject(CREDENTIAL_REPOSITORY) private readonly credentialRepo: CredentialRepository,
    @Inject(MEMBERSHIP_REPOSITORY) private readonly membershipRepo: MembershipRepository,
    @Inject(PASSWORD_HASHER) private readonly passwordHasher: PasswordHasher,
    private readonly jwtService: JwtService,
    private readonly eventBus: EventBus,
  ) {}

  async execute(cmd: LoginCommand): Promise<LoginResponseDto> {
    const user = await this.userRepo.findByEmail(cmd.email.trim().toLowerCase());
    if (!user || user.status === UserStatusEnum.DISABLED) {
      throw new UnauthorizedException('Invalid email or password');
    }
    if (user.status !== UserStatusEnum.ACTIVE) {
      throw new UnauthorizedException('User is not active');
    }

    const credential = await this.credentialRepo.findByUserId(user.id);
    if (!credential) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const valid = await this.passwordHasher.compare(cmd.password, credential.passwordHash);
    if (!valid) {
      throw new UnauthorizedException('Invalid email or password');
    }

    const membership = await this.membershipRepo.findDefaultActiveByUser(user.id);
    const tenantId = membership?.tenantId ?? null;
    const organizationId = membership?.organizationId ?? null;

    const expiresIn = process.env.JWT_ACCESS_TTL ?? '15m';
    const payload = {
      sub: user.id,
      email: user.email,
      tenantId,
      organizationId,
    };
    const accessToken = await this.jwtService.signAsync(payload);

    user.recordLogin();
    await this.userRepo.save(user);
    user.pullEvents().forEach((e) => this.eventBus.publish(e));

    return {
      accessToken,
      tokenType: 'Bearer',
      expiresIn,
      userId: user.id,
      email: user.email,
      name: user.name,
      tenantId,
      organizationId,
    };
  }
}
