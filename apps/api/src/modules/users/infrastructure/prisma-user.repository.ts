import { Injectable } from '@nestjs/common';
import { UserStatus as PrismaUserStatus } from '@prisma/client';
import { PrismaService } from '../../../database/prisma/prisma.service';
import { UserRepository } from '../domain/repositories/user.repository';
import { User } from '../domain/entities/user.entity';
import { UserStatusEnum } from '../domain/value-objects/user-status.vo';

@Injectable()
export class PrismaUserRepository implements UserRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<User | null> {
    const row = await this.prisma.user.findFirst({ where: { id, deletedAt: null } });
    return row ? this.toDomain(row) : null;
  }

  async findByEmail(email: string): Promise<User | null> {
    const row = await this.prisma.user.findFirst({
      where: { email: email.trim().toLowerCase(), deletedAt: null },
    });
    return row ? this.toDomain(row) : null;
  }

  async list(params: { page: number; size: number }): Promise<{ items: User[]; total: number }> {
    const where = { deletedAt: null };
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.user.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (params.page - 1) * params.size,
        take: params.size,
      }),
      this.prisma.user.count({ where }),
    ]);
    return { items: rows.map((r) => this.toDomain(r)), total };
  }

  async save(user: User): Promise<void> {
    const data = {
      email: user.email,
      name: user.name,
      avatarUrl: user.avatarUrl,
      locale: user.locale,
      timezone: user.timezone,
      status: user.status as PrismaUserStatus,
      lastLoginAt: user.lastLoginAt,
    };
    const existing = await this.prisma.user.findUnique({ where: { id: user.id } });
    if (!existing) {
      await this.prisma.user.create({
        data: { id: user.id, ...data, version: user.version },
      });
      return;
    }
    const updated = await this.prisma.user.updateMany({
      where: { id: user.id, version: user.version - 1 },
      data: { ...data, version: user.version, updatedAt: new Date() },
    });
    if (updated.count === 0) {
      throw new Error('OptimisticLockError: User was modified concurrently');
    }
  }

  private toDomain(row: {
    id: string;
    email: string;
    name: string;
    avatarUrl: string | null;
    locale: string;
    timezone: string;
    status: PrismaUserStatus;
    lastLoginAt: Date | null;
    version: number;
    createdAt: Date;
    updatedAt: Date;
  }): User {
    return User.rehydrate({
      id: row.id,
      email: row.email,
      name: row.name,
      avatarUrl: row.avatarUrl,
      locale: row.locale,
      timezone: row.timezone,
      status: row.status as UserStatusEnum,
      lastLoginAt: row.lastLoginAt,
      version: row.version,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }
}
