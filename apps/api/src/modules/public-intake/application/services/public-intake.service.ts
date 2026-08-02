import { timingSafeEqual } from 'node:crypto';
import {
  BadRequestException,
  ForbiddenException,
  Inject,
  Injectable,
  Logger,
  ServiceUnavailableException,
  UnauthorizedException,
} from '@nestjs/common';
import { CommandBus } from '@nestjs/cqrs';
import { CreateContactCommand } from '../../../contacts/application/commands/contact.commands';
import { CreateRequestCommand } from '../../../requests/application/commands/request.commands';
import { RequestSourceEnum } from '../../../requests/domain/value-objects/request-source.vo';
import {
  PUBLIC_INTAKE_REPOSITORY,
  PublicIntakeContactChannel,
  PublicIntakeRepository,
} from '../../domain/repositories/public-intake.repository';
import {
  PublicFunnelEventDto,
  PublicLeadDto,
  PublicLeadResponseDto,
} from '../dto/public-intake.dto';

type CommandResult = { id: string };

@Injectable()
export class PublicIntakeService {
  private readonly logger = new Logger(PublicIntakeService.name);

  constructor(
    @Inject(PUBLIC_INTAKE_REPOSITORY)
    private readonly repository: PublicIntakeRepository,
    private readonly commandBus: CommandBus,
  ) {}

  async createLead(
    dto: PublicLeadDto,
    authorization: string | undefined,
    idempotencyKey: string | undefined,
    tenantId: string | undefined,
    origin: string | undefined,
  ): Promise<PublicLeadResponseDto> {
    this.assertAllowedOrigin(origin);
    this.assertAuthorized(authorization);
    this.assertLead(dto, idempotencyKey);

    const organizationId = await this.resolveOrganizationId();
    this.assertTenant(tenantId, organizationId);

    const marker = this.idempotencyMarker(dto.externalLeadId);
    const existing = await this.repository.findLeadByMarker(
      organizationId,
      marker,
    );

    if (existing) {
      return {
        ok: true,
        requestId: existing.requestId,
        companyId: null,
        contactId: existing.contactId,
        status: 'DRAFT',
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
      requestId: result.id,
      companyId: null,
      contactId,
      status: 'DRAFT',
      externalLeadId: dto.externalLeadId,
      duplicate: false,
    };
  }

  async acceptEvent(
    dto: PublicFunnelEventDto,
    authorization: string | undefined,
    tenantId: string | undefined,
    origin: string | undefined,
  ): Promise<void> {
    this.assertAllowedOrigin(origin);
    this.assertAuthorized(authorization);
    const organizationId = await this.resolveOrganizationId();
    this.assertTenant(tenantId, organizationId);

    this.logger.log(
      JSON.stringify({
        event: 'public_funnel_event',
        eventId: dto.eventId,
        name: dto.name,
        sessionId: dto.sessionId,
        sourceSystem: dto.sourceSystem,
        organizationId,
        occurredAt: dto.occurredAt,
        path: dto.path,
        data: dto.data ?? {},
      }),
    );
  }

  private assertAuthorized(authorization: string | undefined): void {
    const configuredToken = process.env.SITE_INGEST_TOKEN?.trim();
    if (!configuredToken) {
      throw new ServiceUnavailableException('Site intake token is not configured');
    }

    const suppliedToken = authorization?.match(/^Bearer\s+(.+)$/i)?.[1]?.trim();
    if (!suppliedToken || !this.secretsMatch(suppliedToken, configuredToken)) {
      throw new UnauthorizedException('Invalid site intake token');
    }
  }

  private secretsMatch(supplied: string, expected: string): boolean {
    const suppliedBuffer = Buffer.from(supplied);
    const expectedBuffer = Buffer.from(expected);
    return (
      suppliedBuffer.length === expectedBuffer.length &&
      timingSafeEqual(suppliedBuffer, expectedBuffer)
    );
  }

  private assertLead(dto: PublicLeadDto, idempotencyKey: string | undefined): void {
    if (!dto.consent.personalData) {
      throw new BadRequestException('Personal data consent is required');
    }
    if (!idempotencyKey) {
      throw new BadRequestException('Idempotency-Key is required');
    }
    if (idempotencyKey !== dto.externalLeadId) {
      throw new BadRequestException('Idempotency-Key must match externalLeadId');
    }
  }

  private assertTenant(tenantId: string | undefined, organizationId: string): void {
    if (!tenantId || tenantId !== organizationId) {
      throw new ForbiddenException('Tenant is not allowed');
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
      const organizationId = await this.repository.findOrganizationIdById(configuredId);
      if (organizationId) return organizationId;
      throw new ServiceUnavailableException('Public intake organization not found');
    }

    const configuredInn = (process.env.PUBLIC_INTAKE_ORGANIZATION_INN ?? '7453362080').trim();
    const organizationId = await this.repository.findOrganizationIdByInn(configuredInn);
    if (!organizationId) {
      throw new ServiceUnavailableException('Public intake organization is not configured');
    }
    return organizationId;
  }

  private parseContactChannel(value: string): PublicIntakeContactChannel {
    const normalized = value.trim();
    if (normalized.includes('@')) return { email: normalized.toLowerCase() };
    return { phone: normalized };
  }

  private async resolveContactId(
    organizationId: string,
    name: string,
    channel: PublicIntakeContactChannel,
  ): Promise<string> {
    const existingId = await this.repository.findContactIdByChannel(
      organizationId,
      channel,
    );
    if (existingId) return existingId;

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
