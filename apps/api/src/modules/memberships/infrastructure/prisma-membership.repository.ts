import { Injectable } from '@nestjs/common';
import { MembershipStatus as PrismaMembershipStatus } from '@prisma/client';
import { PrismaService } from '../../../database/prisma/prisma.service';
import { MembershipRepository } from '../domain/repositories/membership.repository';
import { Membership } from '../domain/entities/membership.entity';
import { MembershipStatusEnum } from '../domain/value-objects/membership-status.vo';

@Injectable()
export class PrismaMembershipRepository implements MembershipRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<Membership | null> {
    const row = await this.prisma.membership.findFirst({ where: { id, deletedAt: null } });
    return row ? this.toDomain(row) : null;
  }

  async findByUserAndOrganization(userId: string, organizationId: string): Promise<Membership | null> {
    const row = await this.prisma.membership.findFirst({
      where: { userId, organizationId, deletedAt: null },
    });
    return row ? this.toDomain(row) : null;
  }

  async listByUser(
    userId: string,
    params: { page: number; size: number },
  ): Promise<{ items: Membership[]; total: number }> {
    const where = { userId, deletedAt: null };
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.membership.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (params.page - 1) * params.size,
        take: params.size,
      }),
      this.prisma.membership.count({ where }),
    ]);
    return { items: rows.map((r) => this.toDomain(r)), total };
  }

  async listByOrganization(
    organizationId: string,
    params: { page: number; size: number },
  ): Promise<{ items: Membership[]; total: number }> {
    const where = { organizationId, deletedAt: null };
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.membership.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (params.page - 1) * params.size,
        take: params.size,
      }),
      this.prisma.membership.count({ where }),
    ]);
    return { items: rows.map((r) => this.toDomain(r)), total };
  }

  async findDefaultActiveByUser(userId: string): Promise<Membership | null> {
    const row = await this.prisma.membership.findFirst({
      where: { userId, deletedAt: null, status: PrismaMembershipStatus.ACTIVE },
      orderBy: [{ isDefault: 'desc' }, { createdAt: 'asc' }],
    });
    return row ? this.toDomain(row) : null;
  }

  async save(membership: Membership): Promise<void> {
    const data = {
      tenantId: membership.tenantId,
      userId: membership.userId,
      organizationId: membership.organizationId,
      roleId: membership.roleId,
      status: membership.status as PrismaMembershipStatus,
      invitedBy: membership.invitedBy,
      invitedAt: membership.invitedAt,
      joinedAt: membership.joinedAt,
      leftAt: membership.leftAt,
      isDefault: membership.isDefault,
    };
    const existing = await this.prisma.membership.findUnique({ where: { id: membership.id } });
    if (!existing) {
      await this.prisma.membership.create({
        data: { id: membership.id, ...data, version: membership.version },
      });
      return;
    }
    const updated = await this.prisma.membership.updateMany({
      where: { id: membership.id, version: membership.version - 1 },
      data: { ...data, version: membership.version, updatedAt: new Date() },
    });
    if (updated.count === 0) {
      throw new Error('OptimisticLockError: Membership was modified concurrently');
    }
  }

  private toDomain(row: {
    id: string;
    tenantId: string;
    userId: string;
    organizationId: string;
    roleId: string | null;
    status: PrismaMembershipStatus;
    invitedBy: string | null;
    invitedAt: Date | null;
    joinedAt: Date | null;
    leftAt: Date | null;
    isDefault: boolean;
    version: number;
    createdAt: Date;
    updatedAt: Date;
  }): Membership {
    return Membership.rehydrate({
      id: row.id,
      tenantId: row.tenantId,
      userId: row.userId,
      organizationId: row.organizationId,
      roleId: row.roleId,
      status: row.status as MembershipStatusEnum,
      invitedBy: row.invitedBy,
      invitedAt: row.invitedAt,
      joinedAt: row.joinedAt,
      leftAt: row.leftAt,
      isDefault: row.isDefault,
      version: row.version,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }
}
