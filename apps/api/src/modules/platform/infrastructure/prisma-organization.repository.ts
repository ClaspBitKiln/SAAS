import { Injectable } from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { PrismaService } from '../../../database/prisma/prisma.service';
import { OrganizationRepository } from '../domain/repositories/organization.repository';
import { Organization } from '../domain/entities/organization.entity';

@Injectable()
export class PrismaOrganizationRepository implements OrganizationRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<Organization | null> {
    const row = await this.prisma.organization.findFirst({ where: { id, deletedAt: null } });
    return row ? this.toDomain(row) : null;
  }

  async listByTenant(
    tenantId: string,
    params: { page: number; size: number },
  ): Promise<{ items: Organization[]; total: number }> {
    const { page, size } = params;
    const where = { tenantId, deletedAt: null };
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.organization.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * size,
        take: size,
      }),
      this.prisma.organization.count({ where }),
    ]);
    return { items: rows.map((r) => this.toDomain(r)), total };
  }

  async save(org: Organization): Promise<void> {
    const data = {
      tenantId: org.tenantId,
      name: org.name,
      inn: org.inn,
      settings: org.settings as Prisma.InputJsonValue,
    };
    const existing = await this.prisma.organization.findUnique({ where: { id: org.id } });
    if (!existing) {
      await this.prisma.organization.create({
        data: { id: org.id, ...data, version: org.version },
      });
      return;
    }
    const updated = await this.prisma.organization.updateMany({
      where: { id: org.id, version: org.version - 1 },
      data: { ...data, version: org.version, updatedAt: new Date() },
    });
    if (updated.count === 0) {
      throw new Error('OptimisticLockError: Organization была изменена параллельно');
    }
  }

  private toDomain(row: {
    id: string;
    tenantId: string;
    name: string;
    inn: string | null;
    settings: Prisma.JsonValue;
    version: number;
    createdAt: Date;
    updatedAt: Date;
  }): Organization {
    return Organization.rehydrate({
      id: row.id,
      tenantId: row.tenantId,
      name: row.name,
      inn: row.inn,
      settings: (row.settings as Record<string, unknown>) ?? {},
      version: row.version,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }
}
