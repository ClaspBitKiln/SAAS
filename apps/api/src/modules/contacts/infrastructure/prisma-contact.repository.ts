import { Injectable } from '@nestjs/common';
import { ContactStatus as PrismaContactStatus } from '@prisma/client';
import { PrismaService } from '../../../database/prisma/prisma.service';
import { ContactRepository } from '../domain/repositories/contact.repository';
import { Contact } from '../domain/entities/contact.entity';
import { ContactStatusEnum } from '../domain/value-objects/contact-status.vo';

@Injectable()
export class PrismaContactRepository implements ContactRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findById(id: string): Promise<Contact | null> {
    const row = await this.prisma.contact.findFirst({ where: { id, deletedAt: null } });
    return row ? this.toDomain(row) : null;
  }

  async listByOrganization(
    organizationId: string,
    params: { page: number; size: number },
  ): Promise<{ items: Contact[]; total: number }> {
    const where = { organizationId, deletedAt: null };
    const [rows, total] = await this.prisma.$transaction([
      this.prisma.contact.findMany({
        where,
        orderBy: { createdAt: 'desc' },
        skip: (params.page - 1) * params.size,
        take: params.size,
      }),
      this.prisma.contact.count({ where }),
    ]);
    return { items: rows.map((r) => this.toDomain(r)), total };
  }

  async save(contact: Contact): Promise<void> {
    const data = {
      tenantId: contact.tenantId,
      organizationId: contact.organizationId,
      name: contact.name,
      phone: contact.phone,
      email: contact.email,
      status: contact.status as PrismaContactStatus,
      deletedAt: contact.deletedAt,
    };
    const existing = await this.prisma.contact.findUnique({ where: { id: contact.id } });
    if (!existing) {
      await this.prisma.contact.create({
        data: { id: contact.id, ...data, version: contact.version },
      });
      return;
    }
    const updated = await this.prisma.contact.updateMany({
      where: { id: contact.id, version: contact.version - 1 },
      data: { ...data, version: contact.version, updatedAt: new Date() },
    });
    if (updated.count === 0) {
      throw new Error('OptimisticLockError: Contact was modified concurrently');
    }
  }

  private toDomain(row: {
    id: string;
    tenantId: string;
    organizationId: string;
    name: string;
    phone: string | null;
    email: string | null;
    status: PrismaContactStatus;
    version: number;
    createdAt: Date;
    updatedAt: Date;
  }): Contact {
    return Contact.rehydrate({
      id: row.id,
      tenantId: row.tenantId,
      organizationId: row.organizationId,
      name: row.name,
      phone: row.phone,
      email: row.email,
      status: row.status as ContactStatusEnum,
      version: row.version,
      createdAt: row.createdAt,
      updatedAt: row.updatedAt,
    });
  }
}
