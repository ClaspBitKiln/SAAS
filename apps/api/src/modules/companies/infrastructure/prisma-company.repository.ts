import { Injectable } from '@nestjs/common';
import { CompanyStatus as PrismaCompanyStatus } from '@prisma/client';
import { PrismaService } from '../../../database/prisma/prisma.service';
import { CompanyRepository } from '../domain/repositories/company.repository';
import { Company } from '../domain/entities/company.entity';
import { CompanyStatusEnum } from '../domain/value-objects/company-status.vo';

@Injectable()
export class PrismaCompanyRepository implements CompanyRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string, organizationId: string): Promise<Company | null> {
    const row = await this.prisma.company.findFirst({
      where: { id, organizationId, deletedAt: null },
    });
    return row ? this.toDomain(row) : null;
  }

  async findByInn(inn: string, organizationId: string): Promise<Company | null> {
    const row = await this.prisma.company.findFirst({
      where: { inn, organizationId, deletedAt: null },
    });
    return row ? this.toDomain(row) : null;
  }

  async listByOrganization(
    organizationId: string,
    params: { page: number; size: number; q?: string },
  ): Promise<{ items: Company[]; total: number }> {
    const q = params.q?.trim();
    const where = {
      organizationId,
      deletedAt: null,
      ...(q
        ? {
            OR: [
              { name: { contains: q, mode: 'insensitive' as const } },
              { inn: { contains: q, mode: 'insensitive' as const } },
              { email: { contains: q, mode: 'insensitive' as const } },
            ],
          }
        : {}),
    };
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.company.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (params.page - 1) * params.size,
        take: params.size,
      }),
      this.prisma.company.count({ where }),
    ]);
    return { items: rows.map((r) => this.toDomain(r)), total };
  }

  async save(company: Company): Promise<void> {
    const data = {
      tenantId: company.tenantId,
      organizationId: company.organizationId,
      name: company.name,
      inn: company.inn,
      website: company.website,
      phone: company.phone,
      email: company.email,
      status: company.status as PrismaCompanyStatus,
      deletedAt: company.deletedAt,
    };
    const existing = await this.prisma.company.findUnique({ where: { id: company.id } });
    if (!existing) {
      await this.prisma.company.create({
        data: { id: company.id, ...data, version: company.version },
      });
      return;
    }
    const updated = await this.prisma.company.updateMany({
      where: { id: company.id, version: company.version - 1 },
      data: { ...data, version: company.version, updatedAt: new Date() },
    });
    if (updated.count === 0) {
      throw new Error('OptimisticLockError: Company was modified concurrently');
    }
  }

  private toDomain(row: {
    id: string;
    tenantId: string;
    organizationId: string;
    name: string;
    inn: string | null;
    website: string | null;
    phone: string | null;
    email: string | null;
    status: PrismaCompanyStatus;
    version: number;
    createdAt: Date;
    updatedAt: Date;
  }): Company {
    return Company.rehydrate({
      id: row.id,
      tenantId: row.tenantId,
      organizationId: row.organizationId,
      name: row.name,
      inn: row.inn,
      website: row.website,
      phone: row.phone,
      email: row.email,
      status: row.status as CompanyStatusEnum,
      version: row.version,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }
}
