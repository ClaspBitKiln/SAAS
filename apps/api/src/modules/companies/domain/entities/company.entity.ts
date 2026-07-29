import { AggregateRoot } from '../../../../shared/domain/aggregate-root';
import { newId } from '../../../../shared/infrastructure/uuid';
import { CompanyName } from '../value-objects/company-name.vo';
import { CompanyCountryEnum, Inn } from '../value-objects/inn.vo';
import { CompanyStatus, CompanyStatusEnum } from '../value-objects/company-status.vo';
import { makeCompanyEvent } from '../events/company.events';

export class Company extends AggregateRoot {
  private _organizationId: string;
  private _ownerUserId: string | null;
  private _name: CompanyName;
  private _country: CompanyCountryEnum;
  private _inn: Inn | null;
  private _website: string | null;
  private _phone: string | null;
  private _email: string | null;
  private _city: string | null;
  private _industry: string | null;
  private _leadPriority: string | null;
  private _potentialNeed: string | null;
  private _managerComment: string | null;
  private _sourceUrl: string | null;
  private _sourceName: string | null;
  private _verifiedAt: Date | null;
  private _status: CompanyStatus;

  private constructor(props: {
    id: string;
    tenantId: string;
    organizationId: string;
    ownerUserId?: string | null;
    name: CompanyName;
    country?: CompanyCountryEnum;
    inn: Inn | null;
    website: string | null;
    phone: string | null;
    email: string | null;
    city?: string | null;
    industry?: string | null;
    leadPriority?: string | null;
    potentialNeed?: string | null;
    managerComment?: string | null;
    sourceUrl?: string | null;
    sourceName?: string | null;
    verifiedAt?: Date | null;
    status: CompanyStatus;
    version?: number;
    createdAt?: Date;
    updatedAt?: Date;
  }) {
    super({
      id: props.id,
      tenantId: props.tenantId,
      version: props.version,
      createdAt: props.createdAt,
      updatedAt: props.updatedAt,
    });
    this._organizationId = props.organizationId;
    this._ownerUserId = props.ownerUserId ?? null;
    this._country = props.country ?? CompanyCountryEnum.RU;
    this._name = props.name;
    this._inn = props.inn;
    this._website = props.website;
    this._phone = props.phone;
    this._email = props.email;
    this._city = props.city ?? null;
    this._industry = props.industry ?? null;
    this._leadPriority = props.leadPriority ?? null;
    this._potentialNeed = props.potentialNeed ?? null;
    this._managerComment = props.managerComment ?? null;
    this._sourceUrl = props.sourceUrl ?? null;
    this._sourceName = props.sourceName ?? null;
    this._verifiedAt = props.verifiedAt ?? null;
    this._status = props.status;
  }

  static create(input: {
    tenantId: string;
    organizationId: string;
    ownerUserId?: string | null;
    name: string;
    country?: CompanyCountryEnum;
    inn?: string | null;
    website?: string | null;
    phone?: string | null;
    email?: string | null;
    city?: string | null;
    industry?: string | null;
    leadPriority?: string | null;
    potentialNeed?: string | null;
    managerComment?: string | null;
    sourceUrl?: string | null;
    sourceName?: string | null;
    verifiedAt?: Date | null;
  }): Company {
    const id = newId();
    const country = input.country ?? CompanyCountryEnum.RU;
    const company = new Company({
      id,
      tenantId: input.tenantId,
      organizationId: input.organizationId,
      ownerUserId: input.ownerUserId ?? null,
      name: new CompanyName(input.name),
      country,
      inn: input.inn?.trim() ? new Inn(input.inn, country) : null,
      website: input.website?.trim() || null,
      phone: input.phone?.trim() || null,
      email: input.email?.trim().toLowerCase() || null,
      city: input.city?.trim() || null,
      industry: input.industry?.trim() || null,
      leadPriority: input.leadPriority?.trim().toUpperCase() || null,
      potentialNeed: input.potentialNeed?.trim() || null,
      managerComment: input.managerComment?.trim() || null,
      sourceUrl: input.sourceUrl?.trim() || null,
      sourceName: input.sourceName?.trim() || null,
      verifiedAt: input.verifiedAt ?? null,
      status: CompanyStatus.active(),
    });
    company.addEvent(makeCompanyEvent('company.created', company, { name: input.name }));
    return company;
  }

  static rehydrate(props: {
    id: string;
    tenantId: string;
    organizationId: string;
    ownerUserId: string | null;
    name: string;
    country: CompanyCountryEnum;
    inn: string | null;
    website: string | null;
    phone: string | null;
    email: string | null;
    city?: string | null;
    industry?: string | null;
    leadPriority?: string | null;
    potentialNeed?: string | null;
    managerComment?: string | null;
    sourceUrl?: string | null;
    sourceName?: string | null;
    verifiedAt?: Date | null;
    status: CompanyStatusEnum;
    version: number;
    createdAt: Date;
    updatedAt: Date;
  }): Company {
    return new Company({
      id: props.id,
      tenantId: props.tenantId,
      organizationId: props.organizationId,
      ownerUserId: props.ownerUserId,
      name: new CompanyName(props.name),
      country: props.country,
      inn: props.inn ? new Inn(props.inn, props.country) : null,
      website: props.website,
      phone: props.phone,
      email: props.email,
      city: props.city ?? null,
      industry: props.industry ?? null,
      leadPriority: props.leadPriority ?? null,
      potentialNeed: props.potentialNeed ?? null,
      managerComment: props.managerComment ?? null,
      sourceUrl: props.sourceUrl ?? null,
      sourceName: props.sourceName ?? null,
      verifiedAt: props.verifiedAt ?? null,
      status: new CompanyStatus(props.status),
      version: props.version,
      createdAt: props.createdAt,
      updatedAt: props.updatedAt,
    });
  }

  updateDetails(input: {
    name?: string;
    country?: CompanyCountryEnum;
    inn?: string | null;
    website?: string | null;
    phone?: string | null;
    email?: string | null;
    ownerUserId?: string | null;
    city?: string | null;
    industry?: string | null;
    leadPriority?: string | null;
    potentialNeed?: string | null;
    managerComment?: string | null;
    sourceUrl?: string | null;
    sourceName?: string | null;
    verifiedAt?: Date | null;
  }): void {
    if (input.country !== undefined) this._country = input.country;
    if (input.name !== undefined) this._name = new CompanyName(input.name);
    if (input.inn !== undefined) this._inn = input.inn?.trim() ? new Inn(input.inn, this._country) : null;
    if (input.website !== undefined) this._website = input.website?.trim() || null;
    if (input.phone !== undefined) this._phone = input.phone?.trim() || null;
    if (input.email !== undefined) this._email = input.email?.trim().toLowerCase() || null;
    if (input.ownerUserId !== undefined) this._ownerUserId = input.ownerUserId;
    if (input.city !== undefined) this._city = input.city?.trim() || null;
    if (input.industry !== undefined) this._industry = input.industry?.trim() || null;
    if (input.leadPriority !== undefined) this._leadPriority = input.leadPriority?.trim().toUpperCase() || null;
    if (input.potentialNeed !== undefined) this._potentialNeed = input.potentialNeed?.trim() || null;
    if (input.managerComment !== undefined) this._managerComment = input.managerComment?.trim() || null;
    if (input.sourceUrl !== undefined) this._sourceUrl = input.sourceUrl?.trim() || null;
    if (input.sourceName !== undefined) this._sourceName = input.sourceName?.trim() || null;
    if (input.verifiedAt !== undefined) this._verifiedAt = input.verifiedAt;
    this.touch();
    this.addEvent(makeCompanyEvent('company.updated', this, { ...input }));
  }

  archive(): void {
    this._status = new CompanyStatus(CompanyStatusEnum.ARCHIVED);
    this.softDelete();
    this.addEvent(makeCompanyEvent('company.deleted', this, {}));
  }

  get organizationId(): string {
    return this._organizationId;
  }

  get ownerUserId(): string | null {
    return this._ownerUserId;
  }

  get name(): string {
    return this._name.toString();
  }

  get country(): CompanyCountryEnum {
    return this._country;
  }

  get inn(): string | null {
    return this._inn?.toString() ?? null;
  }

  get website(): string | null {
    return this._website;
  }

  get phone(): string | null {
    return this._phone;
  }

  get email(): string | null {
    return this._email;
  }

  get city(): string | null { return this._city; }
  get industry(): string | null { return this._industry; }
  get leadPriority(): string | null { return this._leadPriority; }
  get potentialNeed(): string | null { return this._potentialNeed; }
  get managerComment(): string | null { return this._managerComment; }
  get sourceUrl(): string | null { return this._sourceUrl; }
  get sourceName(): string | null { return this._sourceName; }
  get verifiedAt(): Date | null { return this._verifiedAt; }

  get status(): CompanyStatusEnum {
    return this._status.value;
  }
}
