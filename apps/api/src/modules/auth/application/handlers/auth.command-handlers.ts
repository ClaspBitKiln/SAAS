import { Inject, UnauthorizedException } from '@nestjs/common';
import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import { USER_REPOSITORY, UserRepository } from '../../../users/domain/repositories/user.repository';
import { UserStatusEnum } from '../../../users/domain/value-objects/user-status.vo';
import {
  MEMBERSHIP_REPOSITORY,
  MembershipRepository,
} from '../../../memberships/domain/repositories/membership.repository';
import { CREDENTIAL_REPOSITORY, CredentialRepository } from '../../domain/repositories/credential.repository';
import { SESSION_REPOSITORY, SessionRepository } from '../../domain/repositories/session.repository';
import { Credential } from '../../domain/entities/credential.entity';
import { Session } from '../../domain/entities/session.entity';
import { PlainPassword } from '../../domain/value-objects/plain-password.vo';
import { PASSWORD_HASHER, PasswordHasher } from '../../infrastructure/bcrypt-password.hasher';
import { AccessTokenService } from '../../infrastructure/access-token.service';
import {
  REFRESH_TOKEN_SERVICE,
  RefreshTokenService,
  refreshExpiresAt,
} from '../../infrastructure/refresh-token.service';
import {
  LoginCommand,
  LogoutSessionCommand,
  RefreshSessionCommand,
  SetPasswordCommand,
} from '../commands/auth.commands';
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
    @Inject(SESSION_REPOSITORY) private readonly sessionRepo: SessionRepository,
    @Inject(PASSWORD_HASHER) private readonly passwordHasher: PasswordHasher,
    @Inject(REFRESH_TOKEN_SERVICE) private readonly refreshTokens: RefreshTokenService,
    private readonly accessTokens: AccessTokenService,
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
    const accessToken = await this.accessTokens.sign(user, membership);

    const pair = this.refreshTokens.issue();
    const session = Session.create(user.id, pair.hash, refreshExpiresAt(), pair.sessionId);
    await this.sessionRepo.save(session);
    session.pullEvents().forEach((e) => this.eventBus.publish(e));

    user.recordLogin();
    await this.userRepo.save(user);
    user.pullEvents().forEach((e) => this.eventBus.publish(e));

    return this.toResponse(user, membership, accessToken, pair.token);
  }

  private toResponse(
    user: { id: string; email: string; name: string },
    membership: { tenantId: string; organizationId: string } | null,
    accessToken: string,
    refreshToken: string,
  ): LoginResponseDto {
    return {
      accessToken,
      refreshToken,
      tokenType: 'Bearer',
      expiresIn: this.accessTokens.accessTtl,
      refreshExpiresIn: process.env.JWT_REFRESH_TTL ?? '30d',
      userId: user.id,
      email: user.email,
      name: user.name,
      tenantId: membership?.tenantId ?? null,
      organizationId: membership?.organizationId ?? null,
    };
  }
}

@CommandHandler(RefreshSessionCommand)
export class RefreshSessionHandler implements ICommandHandler<RefreshSessionCommand> {
  constructor(
    @Inject(USER_REPOSITORY) private readonly userRepo: UserRepository,
    @Inject(MEMBERSHIP_REPOSITORY) private readonly membershipRepo: MembershipRepository,
    @Inject(SESSION_REPOSITORY) private readonly sessionRepo: SessionRepository,
    @Inject(REFRESH_TOKEN_SERVICE) private readonly refreshTokens: RefreshTokenService,
    private readonly accessTokens: AccessTokenService,
    private readonly eventBus: EventBus,
  ) {}

  async execute(cmd: RefreshSessionCommand): Promise<LoginResponseDto> {
    const hash = this.refreshTokens.hash(cmd.refreshToken);
    const session = await this.sessionRepo.findByRefreshTokenHash(hash);
    if (!session || !session.isActive()) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const user = await this.userRepo.findById(session.userId);
    if (!user || user.status !== UserStatusEnum.ACTIVE) {
      throw new UnauthorizedException('Invalid refresh token');
    }

    const pair = this.refreshTokens.issue(session.id);
    session.rotateRefresh(pair.hash, refreshExpiresAt());
    await this.sessionRepo.save(session);
    session.pullEvents().forEach((e) => this.eventBus.publish(e));

    const membership = await this.membershipRepo.findDefaultActiveByUser(user.id);
    const accessToken = await this.accessTokens.sign(user, membership);

    return {
      accessToken,
      refreshToken: pair.token,
      tokenType: 'Bearer',
      expiresIn: this.accessTokens.accessTtl,
      refreshExpiresIn: process.env.JWT_REFRESH_TTL ?? '30d',
      userId: user.id,
      email: user.email,
      name: user.name,
      tenantId: membership?.tenantId ?? null,
      organizationId: membership?.organizationId ?? null,
    };
  }
}

@CommandHandler(LogoutSessionCommand)
export class LogoutSessionHandler implements ICommandHandler<LogoutSessionCommand> {
  constructor(
    @Inject(SESSION_REPOSITORY) private readonly sessionRepo: SessionRepository,
    @Inject(REFRESH_TOKEN_SERVICE) private readonly refreshTokens: RefreshTokenService,
    private readonly eventBus: EventBus,
  ) {}

  async execute(cmd: LogoutSessionCommand): Promise<void> {
    const hash = this.refreshTokens.hash(cmd.refreshToken);
    const session = await this.sessionRepo.findByRefreshTokenHash(hash);
    if (!session) return;

    try {
      session.revoke();
    } catch {
      return;
    }
    await this.sessionRepo.save(session);
    session.pullEvents().forEach((e) => this.eventBus.publish(e));
  }
}
