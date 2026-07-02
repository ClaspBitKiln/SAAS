import { GlobalAggregateRoot } from '../../../../shared/domain/global-aggregate-root';
import { newId } from '../../../../shared/infrastructure/uuid';
import { makeCredentialEvent } from '../events/credential.events';

export class Credential extends GlobalAggregateRoot {
  private _userId: string;
  private _passwordHash: string;

  private constructor(props: {
    id: string;
    userId: string;
    passwordHash: string;
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
    this._userId = props.userId;
    this._passwordHash = props.passwordHash;
  }

  static create(userId: string, passwordHash: string): Credential {
    const credential = new Credential({
      id: newId(),
      userId,
      passwordHash,
    });
    credential.addEvent(makeCredentialEvent('credential.created', credential, { userId }));
    return credential;
  }

  static rehydrate(props: {
    id: string;
    userId: string;
    passwordHash: string;
    version: number;
    createdAt: Date;
    updatedAt: Date;
  }): Credential {
    return new Credential(props);
  }

  changePassword(passwordHash: string): void {
    this._passwordHash = passwordHash;
    this.touch();
    this.addEvent(makeCredentialEvent('credential.password_changed', this, { userId: this._userId }));
  }

  get userId(): string {
    return this._userId;
  }

  get passwordHash(): string {
    return this._passwordHash;
  }
}
