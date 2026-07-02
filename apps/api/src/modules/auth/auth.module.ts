import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { CqrsModule } from '@nestjs/cqrs';
import { JwtModule } from '@nestjs/jwt';
import { PrismaService } from '../../database/prisma/prisma.service';
import { UsersModule } from '../users/users.module';
import { MembershipsModule } from '../memberships/memberships.module';
import { CREDENTIAL_REPOSITORY } from './domain/repositories/credential.repository';
import { SESSION_REPOSITORY } from './domain/repositories/session.repository';
import { PrismaCredentialRepository } from './infrastructure/prisma-credential.repository';
import { PrismaSessionRepository } from './infrastructure/prisma-session.repository';
import { BcryptPasswordHasher, PASSWORD_HASHER } from './infrastructure/bcrypt-password.hasher';
import { REFRESH_TOKEN_SERVICE, RefreshTokenService } from './infrastructure/refresh-token.service';
import { AccessTokenService } from './infrastructure/access-token.service';
import { JwtAuthGuard } from './infrastructure/jwt-auth.guard';
import { AuthController } from './presentation/controllers/auth.controller';
import {
  LoginHandler,
  LogoutSessionHandler,
  RefreshSessionHandler,
  SetPasswordHandler,
} from './application/handlers/auth.command-handlers';

@Module({
  imports: [
    CqrsModule,
    UsersModule,
    MembershipsModule,
    JwtModule.register({
      global: true,
      secret: process.env.JWT_SECRET ?? 'dev-only-jwt-secret',
      signOptions: { expiresIn: (process.env.JWT_ACCESS_TTL ?? '15m') as `${number}m` },
    }),
  ],
  controllers: [AuthController],
  providers: [
    PrismaService,
    { provide: CREDENTIAL_REPOSITORY, useClass: PrismaCredentialRepository },
    { provide: SESSION_REPOSITORY, useClass: PrismaSessionRepository },
    { provide: PASSWORD_HASHER, useClass: BcryptPasswordHasher },
    { provide: REFRESH_TOKEN_SERVICE, useClass: RefreshTokenService },
    AccessTokenService,
    SetPasswordHandler,
    LoginHandler,
    RefreshSessionHandler,
    LogoutSessionHandler,
    { provide: APP_GUARD, useClass: JwtAuthGuard },
  ],
})
export class AuthModule {}
