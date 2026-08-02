import { Injectable } from '@nestjs/common';
import { PrismaService } from '../../../database/prisma/prisma.service';
import {
  ExistingPublicLead,
  PublicIntakeContactChannel,
  PublicIntakeRepository,
} from '../domain/repositories/public-intake.repository';

@Injectable()
export class PrismaPublicIntakeRepository implements PublicIntakeRepository {
  constructor(private readonly prisma: PrismaService) {}

  async findOrganizationIdById(id: string): Promise<string | null> {
    const organization = await this.prisma.organization.findFirst({
      where: { id, deletedAt: null },
      select: { id: true },
    });
    return organization?.id ?? null;
  }

  async findOrganizationIdByInn(inn: string): Promise<string | null> {
    const organization = await this.prisma.organization.findFirst({
      where: { inn, deletedAt: null },
      select: { id: true },
    });
    return organization?.id ?? null;
  }

  async findLeadByMarker(
    organizationId: string,
    marker: string,
  ): Promise<ExistingPublicLead | null> {
    const request = await this.prisma.request.findFirst({
      where: {
        organizationId,
        deletedAt: null,
        notes: { contains: marker },
      },
      select: { id: true, contactId: true },
    });
    return request
      ? { requestId: request.id, contactId: request.contactId }
      : null;
  }

  async findContactIdByChannel(
    organizationId: string,
    channel: PublicIntakeContactChannel,
  ): Promise<string | null> {
    const contact = await this.prisma.contact.findFirst({
      where: {
        organizationId,
        deletedAt: null,
        ...(channel.email ? { email: channel.email } : { phone: channel.phone }),
      },
      select: { id: true },
    });
    return contact?.id ?? null;
  }
}
