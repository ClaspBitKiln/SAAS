import { AggregateRoot } from '../../../../shared/domain/aggregate-root';
import { newId } from '../../../../shared/infrastructure/uuid';
import { CompanyName } from '../value-objects/company-name.vo';
import { Inn } from '../value-objects/inn.vo';
import { CompanyStatus, CompanyStatusEnum } from '../value-objects/company-status.vo';
import { makeCompanyEvent } from '../events/company.events';

export class Company extends AggregateRoot {
  private _organizationId: string;
  private _name: CompanyName;
  private _inn: Inn | null;
  private _website: string | null;
  private _phone: string | null;
  private _email: string | null;
  private _status: CompanyStatus;

  private constructor(props: {
    id: string;
    tenantId: string;
    organizationId: string;
    name: CompanyName;
    inn: Inn | null;
    website: string | null;
    phone: string | null;
    email: string | null;
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
    this._name = props.name;
    this._inn = props.inn;
    this._website = props.website;
    this._phone = props.phone;
    this._email = props.email;
    this._status = props.status;
  }

  static create(input: {
    tenantId: string;
    organizationId: string;
    name: string;
    inn?: string | null;
    website?: string | null;
    phone?: string | null;
    email?: string | null;
  }): Company {
    const id = newId();
    const company = new Company({
      id,
      tenantId: input.tenantId,
      organizationId: input.organizationId,
      name: new CompanyName(input.name),
      inn: input.inn?.trim() ? new Inn(input.inn) : null,
      website: input.website?.trim() || null,
      phone: input.phone?.trim() || null,
      email: input.email?.trim().toLowerCase() || null,
      status: CompanyStatus.active(),
    });
    company.addEvent(makeCompanyEvent('company.created', company, { name: input.name }));
    return company;
  }

  static rehydrate(props: {
    id: string;
    tenantId: string;
    organizationId: string;
    name: string;
    inn: string | null;
    website: string | null;
    phone: string | null;
    email: string | null;
    status: CompanyStatusEnum;
    version: number;
    createdAt: Date;
    updatedAt: Date;
  }): Company {
    return new Company({
      id: props.id,
      tenantId: props.tenantId,
      organizationId: props.organizationId,
      name: new CompanyName(props.name),
      inn: props.inn ? new Inn(props.inn) : null,
      website: props.website,
      phone: props.phone,
      email: props.email,
      status: new CompanyStatus(props.status),
      version: props.version,
      createdAt: props.createdAt,
      updatedAt: props.updatedAt,
    });
  }

  updateDetails(input: {
    name?: string;
    inn?: string | null;
    website?: string | null;
    phone?: string | null;
    email?: string | null;
  }): void {
    if (input.name !== undefined) this._name = new CompanyName(input.name);
    if (input.inn !== undefined) this._inn = input.inn?.trim() ? new Inn(input.inn) : null;
    if (input.website !== undefined) this._website = input.website?.trim() || null;
    if (input.phone !== undefined) this._phone = input.phone?.trim() || null;
    if (input.email !== undefined) this._email = input.email?.trim().toLowerCase() || null;
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

  get name(): string {
    return this._name.toString();
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

  get status(): CompanyStatusEnum {
    return this._status.value;
  }
}
