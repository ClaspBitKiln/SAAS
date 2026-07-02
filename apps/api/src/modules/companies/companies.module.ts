import { Module } from '@nestjs/common';
import { CqrsModule } from '@nestjs/cqrs';
import { PrismaService } from '../../database/prisma/prisma.service';
import { PlatformModule } from '../platform/platform.module';
import { COMPANY_REPOSITORY } from './domain/repositories/company.repository';
import { PrismaCompanyRepository } from './infrastructure/prisma-company.repository';
import { CompanyController } from './presentation/controllers/company.controller';
import {
  CreateCompanyHandler,
  DeleteCompanyHandler,
  UpdateCompanyHandler,
} from './application/handlers/company.command-handlers';
import { GetCompanyHandler, ListCompaniesHandler } from './application/handlers/company.query-handlers';

@Module({
  imports: [CqrsModule, PlatformModule],
  controllers: [CompanyController],
  providers: [
    PrismaService,
    { provide: COMPANY_REPOSITORY, useClass: PrismaCompanyRepository },
    CreateCompanyHandler,
    UpdateCompanyHandler,
    DeleteCompanyHandler,
    GetCompanyHandler,
    ListCompaniesHandler,
  ],
  exports: [COMPANY_REPOSITORY],
})
export class CompaniesModule {}
