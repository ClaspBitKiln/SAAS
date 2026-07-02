import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma/prisma.service';
import { CredentialRepository } from '../domain/repositories/credential.repository';
import { Credential } from '../domain/entities/credential.entity';

@Injectable()
export class PrismaCredentialRepository implements CredentialRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findByUserId(userId: string): Promise<Credential | null> {
    const row = await this.prisma.credential.findFirst({ where: { userId, deletedAt: null } });
    return row ? this.toDomain(row) : null;
  }

  async save(credential: Credential): Promise<void> {
    const data = {
      userId: credential.userId,
      passwordHash: credential.passwordHash,
    };
    const existing = await this.prisma.credential.findUnique({ where: { id: credential.id } });
    if (!existing) {
      await this.prisma.credential.create({
        data: { id: credential.id, ...data, version: credential.version },
      });
      return;
    }
    const updated = await this.prisma.credential.updateMany({
      where: { id: credential.id, version: credential.version - 1 },
      data: { ...data, version: credential.version, updatedAt: new Date() },
    });
    if (updated.count === 0) {
      throw new Error('OptimisticLockError: Credential was modified concurrently');
    }
  }

  private toDomain(row: {
    id: string;
    userId: string;
    passwordHash: string;
    version: number;
    createdAt: Date;
    updatedAt: Date;
  }): Credential {
    return Credential.rehydrate({
      id: row.id,
      userId: row.userId,
      passwordHash: row.passwordHash,
      version: row.version,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }
}
