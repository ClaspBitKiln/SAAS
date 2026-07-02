import { AggregateRoot } from '../../../../shared/domain/aggregate-root';
import { newId } from '../../../../shared/infrastructure/uuid';
import { CallDirection, CallDirectionEnum } from '../value-objects/call-direction.vo';
import { CallStatus, CallStatusEnum } from '../value-objects/call-status.vo';
import { makeCallEvent } from '../events/call.events';

export class Call extends AggregateRoot {
  private _organizationId: string;
  private _contactId: string;
  private _direction: CallDirection;
  private _phone: string;
  private _status: CallStatus;
  private _startedAt: Date;
  private _endedAt: Date | null;
  private _durationSec: number | null;

  private constructor(props: {
    id: string;
    tenantId: string;
    organizationId: string;
    contactId: string;
    direction: CallDirection;
    phone: string;
    status: CallStatus;
    startedAt: Date;
    endedAt: Date | null;
    durationSec: number | null;
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
    this._contactId = props.contactId;
    this._direction = props.direction;
    this._phone = props.phone;
    this._status = props.status;
    this._startedAt = props.startedAt;
    this._endedAt = props.endedAt;
    this._durationSec = props.durationSec;
  }

  static start(input: {
    tenantId: string;
    organizationId: string;
    contactId: string;
    direction: CallDirectionEnum;
    phone: string;
    startedAt?: Date;
  }): Call {
    const id = newId();
    const startedAt = input.startedAt ?? new Date();
    const call = new Call({
      id,
      tenantId: input.tenantId,
      organizationId: input.organizationId,
      contactId: input.contactId,
      direction: new CallDirection(input.direction),
      phone: input.phone.trim(),
      status: CallStatus.ringing(),
      startedAt,
      endedAt: null,
      durationSec: null,
    });
    call.addEvent(makeCallEvent('call.started', call, { contactId: input.contactId }));
    return call;
  }

  static rehydrate(props: {
    id: string;
    tenantId: string;
    organizationId: string;
    contactId: string;
    direction: CallDirectionEnum;
    phone: string;
    status: CallStatusEnum;
    startedAt: Date;
    endedAt: Date | null;
    durationSec: number | null;
    version: number;
    createdAt: Date;
    updatedAt: Date;
  }): Call {
    return new Call({
      ...props,
      direction: new CallDirection(props.direction),
      status: new CallStatus(props.status),
    });
  }

  complete(endedAt: Date = new Date()): void {
    if (!this._status.canComplete()) {
      throw new Error('Call: cannot complete from current status');
    }
    this._status = new CallStatus(CallStatusEnum.COMPLETED);
    this._endedAt = endedAt;
    this._durationSec = Math.max(0, Math.floor((endedAt.getTime() - this._startedAt.getTime()) / 1000));
    this.touch();
    this.addEvent(makeCallEvent('call.completed', this, { durationSec: this._durationSec }));
  }

  markMissed(): void {
    if (!this._status.canMarkMissed()) {
      throw new Error('Call: cannot mark missed from current status');
    }
    this._status = new CallStatus(CallStatusEnum.MISSED);
    this._endedAt = new Date();
    this.touch();
    this.addEvent(makeCallEvent('call.missed', this, {}));
  }

  get organizationId(): string {
    return this._organizationId;
  }

  get contactId(): string {
    return this._contactId;
  }

  get direction(): CallDirectionEnum {
    return this._direction.value;
  }

  get phone(): string {
    return this._phone;
  }

  get status(): CallStatusEnum {
    return this._status.value;
  }

  get startedAt(): Date {
    return this._startedAt;
  }

  get endedAt(): Date | null {
    return this._endedAt;
  }

  get durationSec(): number | null {
    return this._durationSec;
  }
}
