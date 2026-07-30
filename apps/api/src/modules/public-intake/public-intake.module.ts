import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { PrismaService } from '../../database/prisma/prisma.service';
import { ContactsModule } from '../contacts/contacts.module';
import { RequestsModule } from '../requests/requests.module';
import { PublicIntakeService } from './application/services/public-intake.service';
import { PublicIntakeController } from './presentation/controllers/public-intake.controller';

@Module({
  imports: [CqrsModule, ContactsModule, RequestsModule],
  controllers: [PublicIntakeController],
  providers: [PrismaService, PublicIntakeService],
})
export class PublicIntakeModule {}
