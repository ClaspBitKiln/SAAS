import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma/prisma.service';
import { ContactNote } from '../domain/entities/contact-note.entity';
import { ContactNoteRepository } from '../domain/repositories/contact-note.repository';

@Injectable()
export class PrismaContactNoteRepository implements ContactNoteRepository {
  constructor(private readonly prisma: PrismaService) {}

  async listByContact(contactId: string, organizationId: string): Promise<ContactNote[]> {
    const rows = await this.prisma.contactNote.findMany({
      where: { contactId, organizationId },
      orderBy: { createdAt: 'desc' },
    });
    return rows.map((row) => this.toDomain(row));
  }

  async save(note: ContactNote): Promise<void> {
    await this.prisma.contactNote.create({
      data: {
        id: note.id,
        tenantId: note.tenantId,
        organizationId: note.organizationId,
        contactId: note.contactId,
        body: note.body,
        createdById: note.createdById,
        createdAt: note.createdAt,
        updatedAt: note.updatedAt,
      },
    });
  }

  private toDomain(row: {
    id: string;
    tenantId: string;
    organizationId: string;
    contactId: string;
    body: string;
    createdById: string | null;
    createdAt: Date;
    updatedAt: Date;
  }): ContactNote {
    return ContactNote.rehydrate(row);
  }
}
