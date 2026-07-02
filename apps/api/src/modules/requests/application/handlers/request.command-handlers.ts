import { Inject } from '@nestjs/common';
import { CommandHandler, EventBus, ICommandHandler } from '@nestjs/cqrs';
import {
  ORGANIZATION_REPOSITORY,
  OrganizationRepository,
} from '../../../platform/domain/repositories/organization.repository';
import {
  CONTACT_REPOSITORY,
  ContactRepository,
} from '../../../contacts/domain/repositories/contact.repository';
import { EMetallIntegrationService } from '../../../e-metall/application/services/e-metall-integration.service';
import { Request } from '../../domain/entities/request.entity';
import { REQUEST_REPOSITORY, RequestRepository } from '../../domain/repositories/request.repository';
import {
  CreateRequestCommand,
  SearchRequestCommand,
  UpdateRequestCommand,
} from '../commands/request.commands';

@CommandHandler(CreateRequestCommand)
export class CreateRequestHandler implements ICommandHandler<CreateRequestCommand> {
  constructor(
    @Inject(REQUEST_REPOSITORY) private readonly requestRepo: RequestRepository,
    @Inject(ORGANIZATION_REPOSITORY) private readonly orgRepo: OrganizationRepository,
    @Inject(CONTACT_REPOSITORY) private readonly contactRepo: ContactRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(cmd: CreateRequestCommand): Promise<{ id: string }> {
    const org = await this.orgRepo.findById(cmd.organizationId);
    if (!org) throw new Error('Organization not found');
    if (cmd.contactId) {
      const contact = await this.contactRepo.findById(cmd.contactId, cmd.organizationId);
      if (!contact) throw new Error('Contact not found');
    }
    const request = Request.create({
      tenantId: org.tenantId,
      organizationId: cmd.organizationId,
      contactId: cmd.contactId,
      title: cmd.title,
      notes: cmd.notes,
      source: cmd.source,
      lines: cmd.lines,
    });
    await this.requestRepo.save(request);
    request.pullEvents().forEach((e) => this.eventBus.publish(e));
    return { id: request.id };
  }
}

@CommandHandler(UpdateRequestCommand)
export class UpdateRequestHandler implements ICommandHandler<UpdateRequestCommand> {
  constructor(
    @Inject(REQUEST_REPOSITORY) private readonly requestRepo: RequestRepository,
    @Inject(CONTACT_REPOSITORY) private readonly contactRepo: ContactRepository,
    private readonly eventBus: EventBus,
  ) {}

  async execute(cmd: UpdateRequestCommand): Promise<void> {
    const request = await this.requestRepo.findById(cmd.id, cmd.organizationId);
    if (!request) throw new Error('Request not found');
    if (cmd.contactId) {
      const contact = await this.contactRepo.findById(cmd.contactId, cmd.organizationId);
      if (!contact) throw new Error('Contact not found');
    }
    request.updateDetails({
      contactId: cmd.contactId,
      title: cmd.title,
      notes: cmd.notes,
      lines: cmd.lines,
    });
    await this.requestRepo.save(request);
    request.pullEvents().forEach((e) => this.eventBus.publish(e));
  }
}

@CommandHandler(SearchRequestCommand)
export class SearchRequestHandler implements ICommandHandler<SearchRequestCommand> {
  constructor(
    @Inject(REQUEST_REPOSITORY) private readonly requestRepo: RequestRepository,
    private readonly eMetall: EMetallIntegrationService,
    private readonly eventBus: EventBus,
  ) {}

  async execute(cmd: SearchRequestCommand): Promise<void> {
    const request = await this.requestRepo.findById(cmd.id, cmd.organizationId);
    if (!request) throw new Error('Request not found');
    const lines = request.lines.map((l) => ({
      gost: l.gost ?? undefined,
      steelGrade: l.steelGrade ?? undefined,
      productType: l.productType ?? undefined,
      dimensions: l.dimensions ?? undefined,
      length: l.length ?? undefined,
      thickness: l.thickness ?? undefined,
      coating: l.coating ?? undefined,
      quantity: l.quantity ?? undefined,
      unit: l.unit ?? undefined,
      rawLine: l.rawLine ?? undefined,
    }));
    const result = await this.eMetall.search({ lines });
    request.applySearchResult({ status: result.status, offers: result.offers, jobId: result.jobId ?? null });
    await this.requestRepo.save(request);
    request.pullEvents().forEach((e) => this.eventBus.publish(e));
  }
}
