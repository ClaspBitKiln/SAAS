import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma/prisma.service';
import { SessionRepository } from '../domain/repositories/session.repository';
import { Session } from '../domain/entities/session.entity';

@Injectable()
export class PrismaSessionRepository implements SessionRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<Session | null> {
    const row = await this.prisma.session.findFirst({ where: { id, deletedAt: null } });
    return row ? this.toDomain(row) : null;
  }

  async findByRefreshTokenHash(refreshTokenHash: string): Promise<Session | null> {
    const row = await this.prisma.session.findFirst({
      where: { refreshTokenHash, deletedAt: null },
    });
    return row ? this.toDomain(row) : null;
  }

  async save(session: Session): Promise<void> {
    const data = {
      userId: session.userId,
      refreshTokenHash: session.refreshTokenHash,
      expiresAt: session.expiresAt,
      revokedAt: session.revokedAt,
    };
    const existing = await this.prisma.session.findUnique({ where: { id: session.id } });
    if (!existing) {
      await this.prisma.session.create({
        data: { id: session.id, ...data, version: session.version },
      });
      return;
    }
    const updated = await this.prisma.session.updateMany({
      where: { id: session.id, version: session.version - 1 },
      data: { ...data, version: session.version, updatedAt: new Date() },
    });
    if (updated.count === 0) {
      throw new Error('OptimisticLockError: Session was modified concurrently');
    }
  }

  private toDomain(row: {
    id: string;
    userId: string;
    refreshTokenHash: string;
    expiresAt: Date;
    revokedAt: Date | null;
    version: number;
    createdAt: Date;
    updatedAt: Date;
  }): Session {
    return Session.rehydrate({
      id: row.id,
      userId: row.userId,
      refreshTokenHash: row.refreshTokenHash,
      expiresAt: row.expiresAt,
      revokedAt: row.revokedAt,
      version: row.version,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }
}
