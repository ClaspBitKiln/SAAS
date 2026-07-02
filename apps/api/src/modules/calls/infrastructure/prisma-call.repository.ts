import { Injectable } from '@nestjs/common';
import { CallDirection as PrismaCallDirection, CallStatus as PrismaCallStatus } from '@prisma/client';
import { PrismaService } from '../../../database/prisma/prisma.service';
import { CallRepository } from '../domain/repositories/call.repository';
import { Call } from '../domain/entities/call.entity';
import { CallDirectionEnum } from '../domain/value-objects/call-direction.vo';
import { CallStatusEnum } from '../domain/value-objects/call-status.vo';

@Injectable()
export class PrismaCallRepository implements CallRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<Call | null> {
    const row = await this.prisma.call.findFirst({ where: { id, deletedAt: null } });
    return row ? this.toDomain(row) : null;
  }

  async listByContact(
    contactId: string,
    params: { page: number; size: number },
  ): Promise<{ items: Call[]; total: number }> {
    const where = { contactId, deletedAt: null };
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.call.findMany({
        where,
        orderBy: { startedAt: 'desc' },
        skip: (params.page - 1) * params.size,
        take: params.size,
      }),
      this.prisma.call.count({ where }),
    ]);
    return { items: rows.map((r) => this.toDomain(r)), total };
  }

  async listByOrganization(
    organizationId: string,
    params: { page: number; size: number },
  ): Promise<{ items: Call[]; total: number }> {
    const where = { organizationId, deletedAt: null };
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.call.findMany({
        where,
        orderBy: { startedAt: 'desc' },
        skip: (params.page - 1) * params.size,
        take: params.size,
      }),
      this.prisma.call.count({ where }),
    ]);
    return { items: rows.map((r) => this.toDomain(r)), total };
  }

  async save(call: Call): Promise<void> {
    const data = {
      tenantId: call.tenantId,
      organizationId: call.organizationId,
      contactId: call.contactId,
      direction: call.direction as PrismaCallDirection,
      phone: call.phone,
      status: call.status as PrismaCallStatus,
      startedAt: call.startedAt,
      endedAt: call.endedAt,
      durationSec: call.durationSec,
    };
    const existing = await this.prisma.call.findUnique({ where: { id: call.id } });
    if (!existing) {
      await this.prisma.call.create({ data: { id: call.id, ...data, version: call.version } });
      return;
    }
    const updated = await this.prisma.call.updateMany({
      where: { id: call.id, version: call.version - 1 },
      data: { ...data, version: call.version, updatedAt: new Date() },
    });
    if (updated.count === 0) {
      throw new Error('OptimisticLockError: Call was modified concurrently');
    }
  }

  private toDomain(row: {
    id: string;
    tenantId: string;
    organizationId: string;
    contactId: string;
    direction: PrismaCallDirection;
    phone: string;
    status: PrismaCallStatus;
    startedAt: Date;
    endedAt: Date | null;
    durationSec: number | null;
    version: number;
    createdAt: Date;
    updatedAt: Date;
  }): Call {
    return Call.rehydrate({
      id: row.id,
      tenantId: row.tenantId,
      organizationId: row.organizationId,
      contactId: row.contactId,
      direction: row.direction as CallDirectionEnum,
      phone: row.phone,
      status: row.status as CallStatusEnum,
      startedAt: row.startedAt,
      endedAt: row.endedAt,
      durationSec: row.durationSec,
      version: row.version,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }
}
