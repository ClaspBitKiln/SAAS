import { createHash, randomBytes } from 'crypto';
import { Injectable } from '@nestjs/common';
import { newId } from '../../../shared/infrastructure/uuid';

export const REFRESH_TOKEN_SERVICE = Symbol('REFRESH_TOKEN_SERVICE');

export interface RefreshTokenPair {
  token: string;
  hash: string;
  sessionId: string;
}

@Injectable()
export class RefreshTokenService {
  hash(token: string): string {
    return createHash('sha256').update(token).digest('hex');
  }

  issue(sessionId: string = newId()): RefreshTokenPair {
    const secret = randomBytes(32).toString('base64url');
    const token = `${sessionId}.${secret}`;
    return { token, hash: this.hash(token), sessionId };
  }

  parseSessionId(token: string): string | null {
    const dot = token.indexOf('.');
    if (dot <= 0) return null;
    return token.slice(0, dot);
  }
}

export function parseDurationMs(value: string, fallbackMs: number): number {
  const match = /^(\d+)([smhd])$/.exec(value.trim());
  if (!match) return fallbackMs;
  const amount = Number(match[1]);
  const unit = match[2];
  const multipliers: Record<string, number> = { s: 1000, m: 60_000, h: 3_600_000, d: 86_400_000 };
  return amount * (multipliers[unit] ?? 1000);
}

export function refreshExpiresAt(): Date {
  const ttl = process.env.JWT_REFRESH_TTL ?? '30d';
  return new Date(Date.now() + parseDurationMs(ttl, 30 * 86_400_000));
}
