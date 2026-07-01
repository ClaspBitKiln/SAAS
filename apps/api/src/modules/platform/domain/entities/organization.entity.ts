import { AggregateRoot } from '../../../../shared/domain/aggregate-root';
import { newId } from '../../../../shared/infrastructure/uuid';
import { OrganizationName } from '../value-objects/organization-name.vo';
import { Inn } from '../value-objects/inn.vo';
import { makeOrganizationEvent } from '../events/organization.events';

export class Organization extends AggregateRoot {
  private _name: OrganizationName;
  private _inn: Inn | null;
  private _settings: Record<string, unknown>;

  private constructor(props: {
    id: string;
    tenantId: string;
    name: OrganizationName;
    inn: Inn | null;
    settings: Record<string, unknown>;
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
    this._name = props.name;
    this._inn = props.inn;
    this._settings = props.settings;
  }

  static create(input: {
    tenantId: string;
    name: string;
    inn?: string | null;
    settings?: Record<string, unknown>;
  }): Organization {
    const id = newId();
    const org = new Organization({
      id,
      tenantId: input.tenantId,
      name: new OrganizationName(input.name),
      inn: input.inn ? new Inn(input.inn) : null,
      settings: input.settings ?? {},
    });
    org.addEvent(makeOrganizationEvent('organization.created', org, {
      name: input.name,
      inn: org.inn,
    }));
    return org;
  }

  static rehydrate(props: {
    id: string;
    tenantId: string;
    name: string;
    inn: string | null;
    settings: Record<string, unknown>;
    version: number;
    createdAt: Date;
    updatedAt: Date;
  }): Organization {
    return new Organization({
      id: props.id,
      tenantId: props.tenantId,
      name: new OrganizationName(props.name),
      inn: props.inn ? new Inn(props.inn) : null,
      settings: props.settings,
      version: props.version,
      createdAt: props.createdAt,
      updatedAt: props.updatedAt,
    });
  }

  rename(name: string): void {
    this._name = new OrganizationName(name);
    this.touch();
    this.addEvent(makeOrganizationEvent('organization.updated', this, { name }));
  }

  updateDetails(input: { name?: string; inn?: string | null; settings?: Record<string, unknown> }): void {
    if (input.name !== undefined) {
      this._name = new OrganizationName(input.name);
    }
    if (input.inn !== undefined) {
      this._inn = input.inn ? new Inn(input.inn) : null;
    }
    if (input.settings !== undefined) {
      this._settings = input.settings;
    }
    this.touch();
    this.addEvent(makeOrganizationEvent('organization.updated', this, { ...input }));
  }

  get name(): string {
    return this._name.toString();
  }

  get inn(): string | null {
    return this._inn?.toString() ?? null;
  }

  get settings(): Record<string, unknown> {
    return { ...this._settings };
  }
}
