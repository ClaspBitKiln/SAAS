import { AggregateRoot } from '../../../../shared/domain/aggregate-root';
import { newId } from '../../../../shared/infrastructure/uuid';
import { MembershipStatus, MembershipStatusEnum } from '../value-objects/membership-status.vo';
import { makeMembershipEvent } from '../events/membership.events';

export class Membership extends AggregateRoot {
  private _userId: string;
  private _organizationId: string;
  private _roleId: string | null;
  private _status: MembershipStatus;
  private _invitedBy: string | null;
  private _invitedAt: Date | null;
  private _joinedAt: Date | null;
  private _leftAt: Date | null;
  private _isDefault: boolean;

  private constructor(props: {
    id: string;
    tenantId: string;
    userId: string;
    organizationId: string;
    roleId: string | null;
    status: MembershipStatus;
    invitedBy: string | null;
    invitedAt: Date | null;
    joinedAt: Date | null;
    leftAt: Date | null;
    isDefault: boolean;
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
    this._userId = props.userId;
    this._organizationId = props.organizationId;
    this._roleId = props.roleId;
    this._status = props.status;
    this._invitedBy = props.invitedBy;
    this._invitedAt = props.invitedAt;
    this._joinedAt = props.joinedAt;
    this._leftAt = props.leftAt;
    this._isDefault = props.isDefault;
  }

  static invite(input: {
    tenantId: string;
    userId: string;
    organizationId: string;
    invitedBy?: string | null;
    roleId?: string | null;
    isDefault?: boolean;
  }): Membership {
    const id = newId();
    const now = new Date();
    const membership = new Membership({
      id,
      tenantId: input.tenantId,
      userId: input.userId,
      organizationId: input.organizationId,
      roleId: input.roleId ?? null,
      status: MembershipStatus.pending(),
      invitedBy: input.invitedBy ?? null,
      invitedAt: now,
      joinedAt: null,
      leftAt: null,
      isDefault: input.isDefault ?? false,
    });
    membership.addEvent(
      makeMembershipEvent('membership.invited', membership, {
        userId: input.userId,
        organizationId: input.organizationId,
      }),
    );
    return membership;
  }

  static rehydrate(props: {
    id: string;
    tenantId: string;
    userId: string;
    organizationId: string;
    roleId: string | null;
    status: MembershipStatusEnum;
    invitedBy: string | null;
    invitedAt: Date | null;
    joinedAt: Date | null;
    leftAt: Date | null;
    isDefault: boolean;
    version: number;
    createdAt: Date;
    updatedAt: Date;
  }): Membership {
    return new Membership({
      ...props,
      status: new MembershipStatus(props.status),
    });
  }

  accept(): void {
    if (!this._status.canAccept()) {
      throw new Error('Membership: cannot accept from current status');
    }
    this._status = MembershipStatus.active();
    this._joinedAt = new Date();
    this.touch();
    this.addEvent(makeMembershipEvent('membership.accepted', this, {}));
  }

  suspend(): void {
    if (!this._status.canSuspend()) {
      throw new Error('Membership: cannot suspend from current status');
    }
    this._status = new MembershipStatus(MembershipStatusEnum.SUSPENDED);
    this.touch();
    this.addEvent(makeMembershipEvent('membership.suspended', this, {}));
  }

  revoke(): void {
    if (!this._status.canRevoke()) {
      throw new Error('Membership: already revoked');
    }
    this._status = new MembershipStatus(MembershipStatusEnum.REVOKED);
    this._leftAt = new Date();
    this.touch();
    this.addEvent(makeMembershipEvent('membership.revoked', this, {}));
  }

  setDefault(): void {
    this._isDefault = true;
    this.touch();
    this.addEvent(makeMembershipEvent('membership.updated', this, { isDefault: true }));
  }

  changeRole(roleId: string | null): void {
    this._roleId = roleId;
    this.touch();
    this.addEvent(makeMembershipEvent('membership.updated', this, { roleId }));
  }

  get userId(): string {
    return this._userId;
  }

  get organizationId(): string {
    return this._organizationId;
  }

  get roleId(): string | null {
    return this._roleId;
  }

  get status(): MembershipStatusEnum {
    return this._status.value;
  }

  get invitedBy(): string | null {
    return this._invitedBy;
  }

  get invitedAt(): Date | null {
    return this._invitedAt;
  }

  get joinedAt(): Date | null {
    return this._joinedAt;
  }

  get leftAt(): Date | null {
    return this._leftAt;
  }

  get isDefault(): boolean {
    return this._isDefault;
  }
}
