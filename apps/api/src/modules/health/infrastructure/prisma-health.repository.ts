import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma/prisma.service';
import { HealthRepository } from '../domain/health.repository';

@Injectable()
export class PrismaHealthRepository implements HealthRepository {
  constructor(private readonly prisma: PrismaService) {}

  async pingDatabase(): Promise<void> {
    await this.prisma.$queryRaw`SELECT 1`;
  }
}
