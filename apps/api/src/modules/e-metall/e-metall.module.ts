import { Module } from '@nestjs/common';
import { EMetallIntegrationService } from './application/services/e-metall-integration.service';
import { EMETALL_API_CLIENT, HttpEMetallApiClient } from './infrastructure/e-metall-api.client';
import { EMetallController } from './presentation/controllers/e-metall.controller';

@Module({
  controllers: [EMetallController],
  providers: [
    EMetallIntegrationService,
    { provide: EMETALL_API_CLIENT, useClass: HttpEMetallApiClient },
  ],
  exports: [EMetallIntegrationService],
})
export class EMetallModule {}
