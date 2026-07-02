import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { PrismaService } from '../../../../database/prisma/prisma.service';
import { PrismaCompanyRepository } from '../../infrastructure/prisma-company.repository';
import { PrismaTenantRepository } from '../../../platform/infrastructure/prisma-tenant.repository';
import { PrismaOrganizationRepository } from '../../../platform/infrastructure/prisma-organization.repository';
import { Tenant } from '../../../platform/domain/entities/tenant.entity';
import { Organization } from '../../../platform/domain/entities/organization.entity';
import { Company } from '../../domain/entities/company.entity';

describe('PrismaCompanyRepository (integration)', () => {
  const prisma = new PrismaService();
  const companyRepo = new PrismaCompanyRepository(prisma);
  const tenantRepo = new PrismaTenantRepository(prisma);
  const orgRepo = new PrismaOrganizationRepository(prisma);
  let tenantId: string;
  let orgId: string;
  const slug = `it-tenant-company-${Date.now()}`;

  beforeAll(async () => {
    await prisma.onModuleInit();
    const t = Tenant.create({ name: 'IT Tenant Company', slug });
    await tenantRepo.save(t);
    tenantId = t.id;
    const org = Organization.create({ tenantId, name: 'IT Org Company' });
    await orgRepo.save(org);
    orgId = org.id;
    await prisma.company.deleteMany({ where: { organizationId: orgId } });
  });

  afterAll(async () => {
    await prisma.company.deleteMany({ where: { organizationId: orgId } });
    await prisma.organization.deleteMany({ where: { id: orgId } });
    await prisma.tenant.deleteMany({ where: { slug } });
    await prisma.$disconnect();
  });

  it('save + findById + listByOrganization with search', async () => {
    const company = Company.create({
      tenantId,
      organizationId: orgId,
      name: 'ООО МеталлСтрой',
      inn: '7707083893',
      email: 'sales@metalstroy.example.com',
    });
    await companyRepo.save(company);
    const found = await companyRepo.findById(company.id, orgId);
    expect(found?.name).toBe('ООО МеталлСтрой');
    const list = await companyRepo.listByOrganization(orgId, { page: 1, size: 10 });
    expect(list.total).toBeGreaterThanOrEqual(1);
    const filtered = await companyRepo.listByOrganization(orgId, { page: 1, size: 10, q: '770708' });
    expect(filtered.total).toBeGreaterThanOrEqual(1);
    expect(filtered.items.every((c) => c.organizationId === orgId)).toBe(true);
  });
});
