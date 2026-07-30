import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  ServiceUnavailableException,
} from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { PrismaService } from '../../../../database/prisma/prisma.service';
import { CreateContactCommand } from '../../../contacts/application/commands/contact.commands';
import { CreateRequestCommand } from '../../../requests/application/commands/request.commands';
import { RequestSourceEnum } from '../../../requests/domain/value-objects/request-source.vo';
import {
  PublicFunnelEventDto,
  PublicLeadDto,
  PublicLeadResponseDto,
} from '../dto/public-intake.dto';

type ContactChannel = { phone?: string; email?: string };

type CommandResult = { id: string };

@Injectable()
export class PublicIntakeService {
  private readonly logger = new Logger(PublicIntakeService.name);

  constructor(
    private readonly prisma: PrismaService,
    private readonly commandBus: CommandBus,
  ) {}

  async createLead(
    dto: PublicLeadDto,
    idempotencyKey: string | undefined,
    origin: string | undefined,
  ): Promise<PublicLeadResponseDto> {
    this.assertAllowedOrigin(origin);
    this.assertLead(dto, idempotencyKey);

    const organizationId = await this.resolveOrganizationId();
    const marker = this.idempotencyMarker(dto.externalLeadId);
    const existing = await this.prisma.request.findFirst({
      where: {
        organizationId,
        deletedAt: null,
        notes: { contains: marker },
      },
      select: { id: true },
    });

    if (existing) {
      return {
        ok: true,
        leadId: existing.id,
        externalLeadId: dto.externalLeadId,
        duplicate: true,
      };
    }

    const channel = this.parseContactChannel(dto.contact.value);
    const contactId = await this.resolveContactId(
      organizationId,
      dto.contact.name,
      channel,
    );

    const title = this.buildTitle(dto.request.text);
    const notes = this.buildNotes(dto, marker);
    const sourceText = this.buildSourceText(dto);

    const result = await this.commandBus.execute<CreateRequestCommand, CommandResult>(
      new CreateRequestCommand(
        organizationId,
        contactId,
        title,
        notes,
        sourceText,
        RequestSourceEnum.PASTED,
        [{ rawLine: dto.request.text }],
      ),
    );

    this.logger.log(
      JSON.stringify({
        event: 'public_lead_created',
        requestId: result.id,
        externalLeadId: dto.externalLeadId,
        sourceSystem: dto.sourceSystem,
        sessionId: this.readString(dto.attribution, 'sessionId'),
      }),
    );

    return {
      ok: true,
      leadId: result.id,
      externalLeadId: dto.externalLeadId,
      duplicate: false,
    };
  }

  acceptEvent(dto: PublicFunnelEventDto, origin: string | undefined): void {
    this.assertAllowedOrigin(origin);
    this.logger.log(
      JSON.stringify({
        event: 'public_funnel_event',
        eventId: dto.eventId,
        name: dto.name,
        sessionId: dto.sessionId,
        sourceSystem: dto.sourceSystem,
        occurredAt: dto.occurredAt,
        path: dto.path,
        data: dto.data ?? {},
      }),
    );
  }

  private assertLead(dto: PublicLeadDto, idempotencyKey: string | undefined): void {
    if (!dto.consent.personalData) {
      throw new BadRequestException('Personal data consent is required');
    }
    if (idempotencyKey && idempotencyKey !== dto.externalLeadId) {
      throw new BadRequestException('X-Idempotency-Key must match externalLeadId');
    }
  }

  private assertAllowedOrigin(origin: string | undefined): void {
    if (!origin) return;
    const allowed = this.allowedOrigins();
    if (!allowed.includes(origin)) {
      throw new ForbiddenException('Origin is not allowed');
    }
  }

  private allowedOrigins(): string[] {
    return (
      process.env.PUBLIC_INTAKE_ALLOWED_ORIGINS ??
      'https://www.magicmet.ru,https://magicmet.ru,http://localhost:4173'
    )
      .split(',')
      .map((value) => value.trim())
      .filter(Boolean);
  }

  private async resolveOrganizationId(): Promise<string> {
    const configuredId = process.env.PUBLIC_INTAKE_ORGANIZATION_ID?.trim();
    if (configuredId) {
      const organization = await this.prisma.organization.findFirst({
        where: { id: configuredId, deletedAt: null },
        select: { id: true },
      });
      if (organization) return organization.id;
      throw new ServiceUnavailableException('Public intake organization not found');
    }

    const configuredInn = (process.env.PUBLIC_INTAKE_ORGANIZATION_INN ?? '7453362080').trim();
    const organization = await this.prisma.organization.findFirst({
      where: { inn: configuredInn, deletedAt: null },
      select: { id: true },
    });
    if (!organization) {
      throw new ServiceUnavailableException('Public intake organization is not configured');
    }
    return organization.id;
  }

  private parseContactChannel(value: string): ContactChannel {
    const normalized = value.trim();
    if (normalized.includes('@')) return { email: normalized.toLowerCase() };
    return { phone: normalized };
  }

  private async resolveContactId(
    organizationId: string,
    name: string,
    channel: ContactChannel,
  ): Promise<string> {
    const existing = await this.prisma.contact.findFirst({
      where: {
        organizationId,
        deletedAt: null,
        ...(channel.email ? { email: channel.email } : { phone: channel.phone }),
      },
      select: { id: true },
    });
    if (existing) return existing.id;

    const result = await this.commandBus.execute<CreateContactCommand, CommandResult>(
      new CreateContactCommand(
        organizationId,
        name.trim(),
        channel.phone ?? null,
        channel.email ?? null,
        null,
        null,
      ),
    );
    return result.id;
  }

  private idempotencyMarker(externalLeadId: string): string {
    return `[website-lead:${externalLeadId}]`;
  }

  private buildTitle(requestText: string): string {
    const compact = requestText.replace(/\s+/g, ' ').trim();
    return `Сайт: ${compact}`.slice(0, 255);
  }

  private buildNotes(dto: PublicLeadDto, marker: string): string {
    const attribution = dto.attribution ?? {};
    const journey = dto.journey ?? {};
    const intent = this.readObject(journey, 'intent');
    const lines = [
      marker,
      `Источник: ${dto.sourceSystem}`,
      `Рынок: ${dto.market}`,
      `Страница: ${dto.request.pageUrl ?? this.readString(attribution, 'currentPage') ?? 'не указана'}`,
      `UTM source: ${this.readString(attribution, 'utm_source') ?? 'нет'}`,
      `UTM campaign: ${this.readString(attribution, 'utm_campaign') ?? 'нет'}`,
      `Session ID: ${this.readString(attribution, 'sessionId') ?? 'нет'}`,
      `Поиск в каталоге: ${this.readStringArray(intent, 'searchQueries').join(', ') || 'нет'}`,
      `Выбранные группы: ${this.readStringArray(intent, 'selectedProductGroups').join(', ') || 'нет'}`,
    ];
    return lines.join('\n').slice(0, 2000);
  }

  private buildSourceText(dto: PublicLeadDto): string {
    return JSON.stringify(
      {
        type: 'website-lead',
        receivedAt: new Date().toISOString(),
        payload: dto,
      },
      null,
      2,
    );
  }

  private readObject(value: Record<string, unknown>, key: string): Record<string, unknown> {
    const nested = value[key];
    return nested && typeof nested === 'object' && !Array.isArray(nested)
      ? (nested as Record<string, unknown>)
      : {};
  }

  private readString(value: Record<string, unknown>, key: string): string | null {
    const candidate = value[key];
    return typeof candidate === 'string' && candidate.trim() ? candidate.trim() : null;
  }

  private readStringArray(value: Record<string, unknown>, key: string): string[] {
    const candidate = value[key];
    if (!Array.isArray(candidate)) return [];
    return candidate
      .filter((item): item is string => typeof item === 'string')
      .map((item) => item.trim())
      .filter(Boolean)
      .slice(0, 20);
  }
}
