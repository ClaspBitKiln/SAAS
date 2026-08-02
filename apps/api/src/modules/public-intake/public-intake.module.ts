import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { PrismaService } from '../../database/prisma/prisma.service';
import { ContactsModule } from '../contacts/contacts.module';
import { RequestsModule } from '../requests/requests.module';
import { PUBLIC_INTAKE_REPOSITORY } from './domain/repositories/public-intake.repository';
import { PrismaPublicIntakeRepository } from './infrastructure/prisma-public-intake.repository';
import { PublicIntakeService } from './application/services/public-intake.service';
import { PublicIntakeController } from './presentation/controllers/public-intake.controller';

@Module({
  imports: [CqrsModule, ContactsModule, RequestsModule],
  controllers: [PublicIntakeController],
  providers: [
    PrismaService,
    {
      provide: PUBLIC_INTAKE_REPOSITORY,
      useClass: PrismaPublicIntakeRepository,
    },
    PublicIntakeService,
  ],
})
export class PublicIntakeModule {}
