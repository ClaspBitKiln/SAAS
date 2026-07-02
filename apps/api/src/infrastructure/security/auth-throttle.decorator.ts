import { applyDecorators, UseGuards } from '@nestjs/common';
import { Throttle, ThrottlerGuard } from '@nestjs/throttler';

/** Brute-force protection for public auth endpoints (5 requests / minute / IP). */
export const AUTH_RATE_LIMIT = { limit: 5, ttl: 60_000 } as const;

export function AuthThrottle(): MethodDecorator & ClassDecorator {
  return applyDecorators(UseGuards(ThrottlerGuard), Throttle({ auth: AUTH_RATE_LIMIT }));
}
