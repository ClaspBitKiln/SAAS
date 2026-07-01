import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { PrismaService } from '../../../../database/prisma/prisma.service';
import { PrismaContactRepository } from '../../infrastructure/prisma-contact.repository';
import { PrismaTenantRepository } from '../../../platform/infrastructure/prisma-tenant.repository';
import { PrismaOrganizationRepository } from '../../../platform/infrastructure/prisma-organization.repository';
import { Tenant } from '../../../platform/domain/entities/tenant.entity';
import { Organization } from '../../../platform/domain/entities/organization.entity';
import { Contact } from '../../domain/entities/contact.entity';

describe('PrismaContactRepository (integration)', () => {
  const prisma = new PrismaService();
  const contactRepo = new PrismaContactRepository(prisma);
  const tenantRepo = new PrismaTenantRepository(prisma);
  const orgRepo = new PrismaOrganizationRepository(prisma);
  let tenantId: string;
  let orgId: string;

  beforeAll(async () => {
    await prisma.onModuleInit();
    const t = Tenant.create({ name: 'IT Tenant Contact', slug: 'it-tenant-contact' });
    await tenantRepo.save(t);
    tenantId = t.id;
    const org = Organization.create({ tenantId, name: 'IT Org Contact' });
    await orgRepo.save(org);
    orgId = org.id;
    await prisma.contact.deleteMany({ where: { organizationId: orgId } });
  });

  afterAll(async () => {
    await prisma.contact.deleteMany({ where: { organizationId: orgId } });
    await prisma.organization.deleteMany({ where: { id: orgId } });
    await prisma.tenant.deleteMany({ where: { slug: 'it-tenant-contact' } });
    await prisma.$disconnect();
  });

  it('save + findById + listByOrganization', async () => {
    const contact = Contact.create({ tenantId, organizationId: orgId, name: 'IT Contact' });
    await contactRepo.save(contact);
    const found = await contactRepo.findById(contact.id);
    expect(found?.name).toBe('IT Contact');
    const list = await contactRepo.listByOrganization(orgId, { page: 1, size: 10 });
    expect(list.total).toBeGreaterThanOrEqual(1);
  });
});
