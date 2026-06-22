import { AggregateRoot } from '../../../../shared/domain/aggregate-root';
import { newId } from '../../../../shared/infrastructure/uuid';
import { TenantName } from '../value-objects/tenant-name.vo';
import { TenantStatus, TenantStatusEnum } from '../value-objects/tenant-status.vo';
import { PlanType } from '../value-objects/plan-type.vo';
import { makeTenantEvent } from '../events/tenant.events';

// Агрегат Tenant. Состояние меняется ТОЛЬКО методами (ADR-012).
// Для платформенного корня tenantId == собственный id.
export class Tenant extends AggregateRoot {
  private _name: TenantName;
  private _slug: string;
  private _plan: PlanType;
  private _status: TenantStatus;

  private constructor(props: {
    id: string;
    name: TenantName;
    slug: string;
    plan: PlanType;
    status: TenantStatus;
    version?: number;
    createdAt?: Date;
    updatedAt?: Date;
  }) {
    super({ id: props.id, tenantId: props.id, version: props.version, createdAt: props.createdAt, updatedAt: props.updatedAt });
    this._name = props.name;
    this._slug = props.slug;
    this._plan = props.plan;
    this._status = props.status;
  }

  static create(input: { name: string; slug: string; plan?: PlanType }): Tenant {
    const id = newId();
    const tenant = new Tenant({
      id,
      name: new TenantName(input.name),
      slug: Tenant.normalizeSlug(input.slug),
      plan: input.plan ?? PlanType.free(),
      status: TenantStatus.active(),
    });
    tenant.addEvent(makeTenantEvent('tenant.created', tenant, { name: input.name, slug: tenant._slug }));
    return tenant;
  }

  // Восстановление из БД (без событий).
  static rehydrate(props: {
    id: string; name: string; slug: string; plan: PlanType; status: TenantStatus;
    version: number; createdAt: Date; updatedAt: Date;
  }): Tenant {
    return new Tenant({
      id: props.id, name: new TenantName(props.name), slug: props.slug,
      plan: props.plan, status: props.status, version: props.version,
      createdAt: props.createdAt, updatedAt: props.updatedAt,
    });
  }

  activate(): void {
    if (!this._status.canTransitionTo(TenantStatusEnum.ACTIVE)) {
      throw new Error('Tenant уже активен');
    }
    this._status = new TenantStatus(TenantStatusEnum.ACTIVE);
    this.touch();
    this.addEvent(makeTenantEvent('tenant.activated', this, {}));
  }

  suspend(): void {
    if (!this._status.canTransitionTo(TenantStatusEnum.SUSPENDED)) {
      throw new Error('Tenant уже приостановлен');
    }
    this._status = new TenantStatus(TenantStatusEnum.SUSPENDED);
    this.touch();
    this.addEvent(makeTenantEvent('tenant.suspended', this, {}));
  }

  private static normalizeSlug(slug: string): string {
    const s = (slug ?? '').trim().toLowerCase().replace(/[^a-z0-9-]/g, '-').replace(/-+/g, '-').replace(/^-|-$/g, '');
    if (s.length < 2) throw new Error('Tenant slug: минимум 2 символа');
    return s;
  }

  get name(): string { return this._name.toString(); }
  get slug(): string { return this._slug; }
  get plan(): PlanType { return this._plan; }
  get status(): TenantStatus { return this._status; }
}
