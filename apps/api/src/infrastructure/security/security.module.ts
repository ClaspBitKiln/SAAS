import { Module } from '@nestjs/common';
import { APP_GUARD } from '@nestjs/core';
import { ThrottlerGuard, ThrottlerModule } from '@nestjs/throttler';

@Module({
  imports: [
    ThrottlerModule.forRoot({
      throttlers: [
        {
          name: 'default',
          ttl: 60_000,
          limit: 120,
        },
        {
          // Global default for the named 'auth' throttler must be permissive:
          // the strict 5/min is applied per-route via AuthThrottle() on auth endpoints.
          // With limit:5 here, EVERY route was capped at 5 req/min (F-017).
          name: 'auth',
          ttl: 60_000,
          limit: 600,
        },
      ],
    }),
  ],
  providers: [
    {
      provide: APP_GUARD,
      useClass: ThrottlerGuard,
    },
  ],
})
export class SecurityModule {}
