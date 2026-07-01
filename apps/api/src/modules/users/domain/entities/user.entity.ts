import { GlobalAggregateRoot } from '../../../../shared/domain/global-aggregate-root';
import { newId } from '../../../../shared/infrastructure/uuid';
import { Email } from '../value-objects/email.vo';
import { UserName } from '../value-objects/user-name.vo';
import { UserStatus, UserStatusEnum } from '../value-objects/user-status.vo';
import { makeUserEvent } from '../events/user.events';

export class User extends GlobalAggregateRoot {
  private _email: Email;
  private _name: UserName;
  private _avatarUrl: string | null;
  private _locale: string;
  private _timezone: string;
  private _status: UserStatus;
  private _lastLoginAt: Date | null;

  private constructor(props: {
    id: string;
    email: Email;
    name: UserName;
    avatarUrl: string | null;
    locale: string;
    timezone: string;
    status: UserStatus;
    lastLoginAt: Date | null;
    version?: number;
    createdAt?: Date;
    updatedAt?: Date;
  }) {
    super({
      id: props.id,
      version: props.version,
      createdAt: props.createdAt,
      updatedAt: props.updatedAt,
    });
    this._email = props.email;
    this._name = props.name;
    this._avatarUrl = props.avatarUrl;
    this._locale = props.locale;
    this._timezone = props.timezone;
    this._status = props.status;
    this._lastLoginAt = props.lastLoginAt;
  }

  static create(input: {
    email: string;
    name: string;
    avatarUrl?: string | null;
    locale?: string;
    timezone?: string;
  }): User {
    const id = newId();
    const user = new User({
      id,
      email: new Email(input.email),
      name: new UserName(input.name),
      avatarUrl: input.avatarUrl ?? null,
      locale: input.locale ?? 'ru-RU',
      timezone: input.timezone ?? 'Europe/Moscow',
      status: UserStatus.invited(),
      lastLoginAt: null,
    });
    user.addEvent(
      makeUserEvent('user.created', user, {
        email: user.email,
        name: user.name,
      }),
    );
    return user;
  }

  static rehydrate(props: {
    id: string;
    email: string;
    name: string;
    avatarUrl: string | null;
    locale: string;
    timezone: string;
    status: UserStatusEnum;
    lastLoginAt: Date | null;
    version: number;
    createdAt: Date;
    updatedAt: Date;
  }): User {
    return new User({
      id: props.id,
      email: new Email(props.email),
      name: new UserName(props.name),
      avatarUrl: props.avatarUrl,
      locale: props.locale,
      timezone: props.timezone,
      status: new UserStatus(props.status),
      lastLoginAt: props.lastLoginAt,
      version: props.version,
      createdAt: props.createdAt,
      updatedAt: props.updatedAt,
    });
  }

  updateProfile(input: {
    name?: string;
    avatarUrl?: string | null;
    locale?: string;
    timezone?: string;
  }): void {
    if (input.name !== undefined) {
      this._name = new UserName(input.name);
    }
    if (input.avatarUrl !== undefined) {
      this._avatarUrl = input.avatarUrl;
    }
    if (input.locale !== undefined) {
      this._locale = input.locale;
    }
    if (input.timezone !== undefined) {
      this._timezone = input.timezone;
    }
    this.touch();
    this.addEvent(makeUserEvent('user.updated', this, { ...input }));
  }

  activate(): void {
    if (!this._status.canActivate()) {
      throw new Error('User: cannot activate from current status');
    }
    this._status = UserStatus.active();
    this.touch();
    this.addEvent(makeUserEvent('user.activated', this, {}));
  }

  disable(): void {
    if (!this._status.canDisable()) {
      throw new Error('User: already disabled');
    }
    this._status = new UserStatus(UserStatusEnum.DISABLED);
    this.touch();
    this.addEvent(makeUserEvent('user.disabled', this, {}));
  }

  recordLogin(at: Date = new Date()): void {
    this._lastLoginAt = at;
    this.touch();
    this.addEvent(makeUserEvent('user.updated', this, { lastLoginAt: at.toISOString() }));
  }

  get email(): string {
    return this._email.toString();
  }

  get name(): string {
    return this._name.toString();
  }

  get avatarUrl(): string | null {
    return this._avatarUrl;
  }

  get locale(): string {
    return this._locale;
  }

  get timezone(): string {
    return this._timezone;
  }

  get status(): UserStatusEnum {
    return this._status.value;
  }

  get lastLoginAt(): Date | null {
    return this._lastLoginAt;
  }
}
