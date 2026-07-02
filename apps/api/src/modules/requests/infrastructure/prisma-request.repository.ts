import { Injectable } from '@nestjs/common';
import {
  Prisma,
  RequestSource as PrismaRequestSource,
  RequestStatus as PrismaRequestStatus,
} from '@prisma/client';
import { PrismaService } from '../../../database/prisma/prisma.service';
import { Request } from '../domain/entities/request.entity';
import { RequestRepository } from '../domain/repositories/request.repository';
import { RequestSourceEnum } from '../domain/value-objects/request-source.vo';
import { RequestStatusEnum } from '../domain/value-objects/request-status.vo';

@Injectable()
export class PrismaRequestRepository implements RequestRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<Request | null> {
    const row = await this.prisma.request.findFirst({
      where: { id, deletedAt: null },
      include: { lines: { orderBy: { sortOrder: 'asc' } } },
    });
    return row ? this.toDomain(row) : null;
  }

  async listByOrganization(
    organizationId: string,
    params: { page: number; size: number },
  ): Promise<{ items: Request[]; total: number }> {
    const where = { organizationId, deletedAt: null };
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.request.findMany({
        where,
        include: { lines: { orderBy: { sortOrder: 'asc' } } },
        orderBy: { createdAt: 'desc' },
        skip: (params.page - 1) * params.size,
        take: params.size,
      }),
      this.prisma.request.count({ where }),
    ]);
    return { items: rows.map((r) => this.toDomain(r)), total };
  }

  async save(request: Request): Promise<void> {
    const existing = await this.prisma.request.findUnique({ where: { id: request.id } });
    const data = {
      tenantId: request.tenantId,
      organizationId: request.organizationId,
      contactId: request.contactId,
      title: request.title,
      notes: request.notes,
      source: request.source as PrismaRequestSource,
      status: request.status as PrismaRequestStatus,
      searchResult:
        request.searchResult != null ? (request.searchResult as Prisma.InputJsonValue) : undefined,
      deletedAt: request.deletedAt,
    };

    if (!existing) {
      await this.prisma.$transaction([
        this.prisma.request.create({
          data: { id: request.id, ...data, version: request.version },
        }),
        this.prisma.requestLine.createMany({
          data: request.lines.map((l) => ({
            id: l.id,
            requestId: request.id,
            sortOrder: l.sortOrder,
            gost: l.gost,
            steelGrade: l.steelGrade,
            productType: l.productType,
            dimensions: l.dimensions,
            length: l.length,
            thickness: l.thickness,
            coating: l.coating,
            quantity: l.quantity,
            unit: l.unit,
            rawLine: l.rawLine,
          })),
        }),
      ]);
      return;
    }

    await this.prisma.$transaction(async (tx) => {
      const updated = await tx.request.updateMany({
        where: { id: request.id, version: request.version - 1 },
        data: { ...data, version: request.version, updatedAt: new Date() },
      });
      if (updated.count === 0) throw new Error('OptimisticLockError: Request was modified concurrently');
      await tx.requestLine.deleteMany({ where: { requestId: request.id } });
      if (request.lines.length > 0) {
        await tx.requestLine.createMany({
          data: request.lines.map((l) => ({
            id: l.id,
            requestId: request.id,
            sortOrder: l.sortOrder,
            gost: l.gost,
            steelGrade: l.steelGrade,
            productType: l.productType,
            dimensions: l.dimensions,
            length: l.length,
            thickness: l.thickness,
            coating: l.coating,
            quantity: l.quantity,
            unit: l.unit,
            rawLine: l.rawLine,
          })),
        });
      }
    });
  }

  private toDomain(row: {
    id: string;
    tenantId: string;
    organizationId: string;
    contactId: string | null;
    title: string | null;
    notes: string | null;
    source: PrismaRequestSource;
    status: PrismaRequestStatus;
    searchResult: Prisma.JsonValue | null;
    version: number;
    createdAt: Date;
    updatedAt: Date;
    lines: Array<{
      id: string;
      sortOrder: number;
      gost: string | null;
      steelGrade: string | null;
      productType: string | null;
      dimensions: string | null;
      length: string | null;
      thickness: string | null;
      coating: string | null;
      quantity: string | null;
      unit: string | null;
      rawLine: string | null;
    }>;
  }): Request {
    return Request.rehydrate({
      id: row.id,
      tenantId: row.tenantId,
      organizationId: row.organizationId,
      contactId: row.contactId,
      title: row.title,
      notes: row.notes,
      source: row.source as RequestSourceEnum,
      status: row.status as RequestStatusEnum,
      searchResult: (row.searchResult as Record<string, unknown> | null) ?? null,
      lines: row.lines,
      version: row.version,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }
}
