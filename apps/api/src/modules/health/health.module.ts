import { Module } from '@nestjs/common';
import { PrismaService } from '../../database/prisma/prisma.service';
import { HEALTH_REPOSITORY } from './domain/health.repository';
import { PrismaHealthRepository } from './infrastructure/prisma-health.repository';
import { HealthController } from './presentation/health.controller';

@Module({
  controllers: [HealthController],
  providers: [PrismaService, { provide: HEALTH_REPOSITORY, useClass: PrismaHealthRepository }],
})
export class HealthModule {}
