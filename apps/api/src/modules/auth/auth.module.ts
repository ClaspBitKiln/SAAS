import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { JwtModule } from '@nestjs/jwt';
import { PrismaService } from '../../database/prisma/prisma.service';
import { UsersModule } from '../users/users.module';
import { MembershipsModule } from '../memberships/memberships.module';
import { CREDENTIAL_REPOSITORY } from './domain/repositories/credential.repository';
import { PrismaCredentialRepository } from './infrastructure/prisma-credential.repository';
import { BcryptPasswordHasher, PASSWORD_HASHER } from './infrastructure/bcrypt-password.hasher';
import { AuthController } from './presentation/controllers/auth.controller';
import { LoginHandler, SetPasswordHandler } from './application/handlers/auth.command-handlers';

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
    { provide: PASSWORD_HASHER, useClass: BcryptPasswordHasher },
    SetPasswordHandler,
    LoginHandler,
  ],
})
export class AuthModule {}
