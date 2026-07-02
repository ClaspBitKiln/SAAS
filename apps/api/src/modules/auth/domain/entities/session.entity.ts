import { GlobalAggregateRoot } from '../../../../shared/domain/global-aggregate-root';
import { newId } from '../../../../shared/infrastructure/uuid';
import { makeSessionEvent } from '../events/session.events';

export class Session extends GlobalAggregateRoot {
  private _userId: string;
  private _refreshTokenHash: string;
  private _expiresAt: Date;
  private _revokedAt: Date | null;

  private constructor(props: {
    id: string;
    userId: string;
    refreshTokenHash: string;
    expiresAt: Date;
    revokedAt: Date | null;
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
    this._refreshTokenHash = props.refreshTokenHash;
    this._expiresAt = props.expiresAt;
    this._revokedAt = props.revokedAt;
  }

  static create(userId: string, refreshTokenHash: string, expiresAt: Date, id: string = newId()): Session {
    const session = new Session({
      id,
      userId,
      refreshTokenHash,
      expiresAt,
      revokedAt: null,
    });
    session.addEvent(makeSessionEvent('session.created', session, { userId }));
    return session;
  }

  static rehydrate(props: {
    id: string;
    userId: string;
    refreshTokenHash: string;
    expiresAt: Date;
    revokedAt: Date | null;
    version: number;
    createdAt: Date;
    updatedAt: Date;
  }): Session {
    return new Session(props);
  }

  rotateRefresh(refreshTokenHash: string, expiresAt: Date): void {
    if (!this.isActive()) {
      throw new Error('Session: cannot refresh revoked or expired session');
    }
    this._refreshTokenHash = refreshTokenHash;
    this._expiresAt = expiresAt;
    this.touch();
    this.addEvent(makeSessionEvent('session.refreshed', this, { userId: this._userId }));
  }

  revoke(): void {
    if (this._revokedAt) {
      throw new Error('Session: already revoked');
    }
    this._revokedAt = new Date();
    this.touch();
    this.addEvent(makeSessionEvent('session.revoked', this, { userId: this._userId }));
  }

  isActive(at: Date = new Date()): boolean {
    return this._revokedAt === null && this._expiresAt > at;
  }

  get userId(): string {
    return this._userId;
  }

  get refreshTokenHash(): string {
    return this._refreshTokenHash;
  }

  get expiresAt(): Date {
    return this._expiresAt;
  }

  get revokedAt(): Date | null {
    return this._revokedAt;
  }
}
