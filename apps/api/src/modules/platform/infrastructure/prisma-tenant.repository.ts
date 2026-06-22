import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma/prisma.service';
import { TenantRepository } from '../domain/repositories/tenant.repository';
import { Tenant } from '../domain/entities/tenant.entity';
import { PlanType, PlanTypeEnum } from '../domain/value-objects/plan-type.vo';
import { TenantStatus, TenantStatusEnum } from '../domain/value-objects/tenant-status.vo';

// Реализация репозитория (ADR-009). Единственное место с Prisma для Tenant.
@Injectable()
export class PrismaTenantRepository implements TenantRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<Tenant | null> {
    const row = await this.prisma.tenant.findFirst({ where: { id, deletedAt: null } });
    return row ? this.toDomain(row) : null;
  }

  async findBySlug(slug: string): Promise<Tenant | null> {
    const row = await this.prisma.tenant.findFirst({ where: { slug, deletedAt: null } });
    return row ? this.toDomain(row) : null;
  }

  async list(params: { page: number; size: number }): Promise<{ items: Tenant[]; total: number }> {
    const { page, size } = params;
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.tenant.findMany({
        where: { deletedAt: null },
        orderBy: { createdAt: 'desc' },
        skip: (page - 1) * size,
        take: size,
      }),
      this.prisma.tenant.count({ where: { deletedAt: null } }),
    ]);
    return { items: rows.map((r) => this.toDomain(r)), total };
  }

  // Optimistic locking: обновляем только если version совпала.
  async save(tenant: Tenant): Promise<void> {
    const data = {
      name: tenant.name,
      slug: tenant.slug,
      plan: tenant.plan.value,
      status: tenant.status.value,
    };
    const existing = await this.prisma.tenant.findUnique({ where: { id: tenant.id } });
    if (!existing) {
      await this.prisma.tenant.create({
        data: { id: tenant.id, ...data, version: tenant.version },
      });
      return;
    }
    const updated = await this.prisma.tenant.updateMany({
      where: { id: tenant.id, version: tenant.version - 1 },
      data: { ...data, version: tenant.version, updatedAt: new Date() },
    });
    if (updated.count === 0) {
      throw new Error('OptimisticLockError: Tenant был изменён параллельно');
    }
  }

  private toDomain(row: {
    id: string; name: string; slug: string; plan: string; status: string;
    version: number; createdAt: Date; updatedAt: Date;
  }): Tenant {
    return Tenant.rehydrate({
      id: row.id,
      name: row.name,
      slug: row.slug,
      plan: new PlanType(row.plan as PlanTypeEnum),
      status: new TenantStatus(row.status as TenantStatusEnum),
      version: row.version,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }
}
