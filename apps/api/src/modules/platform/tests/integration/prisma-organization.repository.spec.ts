import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { PrismaService } from '../../../../database/prisma/prisma.service';
import { PrismaOrganizationRepository } from '../../infrastructure/prisma-organization.repository';
import { PrismaTenantRepository } from '../../infrastructure/prisma-tenant.repository';
import { Organization } from '../../domain/entities/organization.entity';
import { Tenant } from '../../domain/entities/tenant.entity';

describe('PrismaOrganizationRepository (integration)', () => {
  const prisma = new PrismaService();
  const orgRepo = new PrismaOrganizationRepository(prisma);
  const tenantRepo = new PrismaTenantRepository(prisma);
  let tenantId: string;

  beforeAll(async () => {
    await prisma.onModuleInit();
    const t = Tenant.create({ name: 'IT Tenant Org', slug: 'it-tenant-org' });
    await tenantRepo.save(t);
    tenantId = t.id;
    await prisma.organization.deleteMany({ where: { tenantId } });
  });

  afterAll(async () => {
    await prisma.organization.deleteMany({ where: { tenantId } });
    await prisma.tenant.deleteMany({ where: { slug: 'it-tenant-org' } });
    await prisma.$disconnect();
  });

  it('save + findById + listByTenant', async () => {
    const org = Organization.create({ tenantId, name: 'IT Org', inn: '7707083893' });
    await orgRepo.save(org);
    const found = await orgRepo.findById(org.id);
    expect(found?.name).toBe('IT Org');
    const list = await orgRepo.listByTenant(tenantId, { page: 1, size: 10 });
    expect(list.total).toBeGreaterThanOrEqual(1);
  });
});
