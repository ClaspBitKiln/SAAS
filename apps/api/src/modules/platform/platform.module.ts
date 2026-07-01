import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { PrismaService } from '../../database/prisma/prisma.service';
import { TENANT_REPOSITORY } from './domain/repositories/tenant.repository';
import { ORGANIZATION_REPOSITORY } from './domain/repositories/organization.repository';
import { PrismaTenantRepository } from './infrastructure/prisma-tenant.repository';
import { PrismaOrganizationRepository } from './infrastructure/prisma-organization.repository';
import { TenantController } from './presentation/controllers/tenant.controller';
import { OrganizationController } from './presentation/controllers/organization.controller';
import { CreateTenantHandler, ActivateTenantHandler, SuspendTenantHandler } from './application/handlers/tenant.command-handlers';
import { GetTenantHandler, ListTenantsHandler } from './application/handlers/tenant.query-handlers';
import {
  CreateOrganizationHandler,
  UpdateOrganizationHandler,
} from './application/handlers/organization.command-handlers';
import { GetOrganizationHandler, ListOrganizationsHandler } from './application/handlers/organization.query-handlers';

const CommandHandlers = [
  CreateTenantHandler,
  ActivateTenantHandler,
  SuspendTenantHandler,
  CreateOrganizationHandler,
  UpdateOrganizationHandler,
];
const QueryHandlers = [GetTenantHandler, ListTenantsHandler, GetOrganizationHandler, ListOrganizationsHandler];

@Module({
  imports: [CqrsModule],
  controllers: [TenantController, OrganizationController],
  providers: [
    PrismaService,
    { provide: TENANT_REPOSITORY, useClass: PrismaTenantRepository },
    { provide: ORGANIZATION_REPOSITORY, useClass: PrismaOrganizationRepository },
    ...CommandHandlers,
    ...QueryHandlers,
  ],
  exports: [TENANT_REPOSITORY, ORGANIZATION_REPOSITORY],
})
export class PlatformModule {}
