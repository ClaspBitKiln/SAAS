import { AggregateRoot } from '../../../../shared/domain/aggregate-root';
import { newId } from '../../../../shared/infrastructure/uuid';
import { ContactName } from '../value-objects/contact-name.vo';
import { ContactStatus, ContactStatusEnum } from '../value-objects/contact-status.vo';
import { makeContactEvent } from '../events/contact.events';

export class Contact extends AggregateRoot {
  private _organizationId: string;
  private _companyId: string | null;
  private _ownerUserId: string | null;
  private _name: ContactName;
  private _phone: string | null;
  private _email: string | null;
  private _status: ContactStatus;

  private constructor(props: {
    id: string;
    tenantId: string;
    organizationId: string;
    companyId?: string | null;
    ownerUserId?: string | null;
    name: ContactName;
    phone: string | null;
    email: string | null;
    status: ContactStatus;
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
    this._companyId = props.companyId ?? null;
    this._ownerUserId = props.ownerUserId ?? null;
    this._name = props.name;
    this._phone = props.phone;
    this._email = props.email;
    this._status = props.status;
  }

  static create(input: {
    tenantId: string;
    organizationId: string;
    name: string;
    phone?: string | null;
    email?: string | null;
    companyId?: string | null;
    ownerUserId?: string | null;
  }): Contact {
    const id = newId();
    const contact = new Contact({
      id,
      tenantId: input.tenantId,
      organizationId: input.organizationId,
      companyId: input.companyId ?? null,
      ownerUserId: input.ownerUserId ?? null,
      name: new ContactName(input.name),
      phone: input.phone?.trim() || null,
      email: input.email?.trim().toLowerCase() || null,
      status: ContactStatus.active(),
    });
    contact.addEvent(makeContactEvent('contact.created', contact, { name: input.name }));
    return contact;
  }

  static rehydrate(props: {
    id: string;
    tenantId: string;
    organizationId: string;
    companyId: string | null;
    ownerUserId: string | null;
    name: string;
    phone: string | null;
    email: string | null;
    status: ContactStatusEnum;
    version: number;
    createdAt: Date;
    updatedAt: Date;
  }): Contact {
    return new Contact({
      id: props.id,
      tenantId: props.tenantId,
      organizationId: props.organizationId,
      companyId: props.companyId,
      ownerUserId: props.ownerUserId,
      name: new ContactName(props.name),
      phone: props.phone,
      email: props.email,
      status: new ContactStatus(props.status),
      version: props.version,
      createdAt: props.createdAt,
      updatedAt: props.updatedAt,
    });
  }

  updateDetails(input: {
    name?: string;
    phone?: string | null;
    email?: string | null;
    companyId?: string | null;
    ownerUserId?: string | null;
  }): void {
    if (input.name !== undefined) this._name = new ContactName(input.name);
    if (input.phone !== undefined) this._phone = input.phone?.trim() || null;
    if (input.email !== undefined) this._email = input.email?.trim().toLowerCase() || null;
    if (input.companyId !== undefined) this._companyId = input.companyId;
    if (input.ownerUserId !== undefined) this._ownerUserId = input.ownerUserId;
    this.touch();
    this.addEvent(makeContactEvent('contact.updated', this, { ...input }));
  }

  archive(): void {
    this._status = new ContactStatus(ContactStatusEnum.ARCHIVED);
    this.softDelete();
    this.addEvent(makeContactEvent('contact.deleted', this, {}));
  }

  get organizationId(): string {
    return this._organizationId;
  }

  get companyId(): string | null {
    return this._companyId;
  }

  get ownerUserId(): string | null {
    return this._ownerUserId;
  }

  get name(): string {
    return this._name.toString();
  }

  get phone(): string | null {
    return this._phone;
  }

  get email(): string | null {
    return this._email;
  }

  get status(): ContactStatusEnum {
    return this._status.value;
  }
}
