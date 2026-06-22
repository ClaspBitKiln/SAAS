import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { PrismaService } from '../../database/prisma/prisma.service';
import { TENANT_REPOSITORY } from './domain/repositories/tenant.repository';
import { PrismaTenantRepository } from './infrastructure/prisma-tenant.repository';
import { TenantController } from './presentation/controllers/tenant.controller';
import { CreateTenantHandler, ActivateTenantHandler, SuspendTenantHandler } from './application/handlers/tenant.command-handlers';
import { GetTenantHandler, ListTenantsHandler } from './application/handlers/tenant.query-handlers';

const CommandHandlers = [CreateTenantHandler, ActivateTenantHandler, SuspendTenantHandler];
const QueryHandlers = [GetTenantHandler, ListTenantsHandler];

@Module({
  imports: [CqrsModule],
  controllers: [TenantController],
  providers: [
    PrismaService,
    { provide: TENANT_REPOSITORY, useClass: PrismaTenantRepository },
    ...CommandHandlers,
    ...QueryHandlers,
  ],
})
export class PlatformModule {}
