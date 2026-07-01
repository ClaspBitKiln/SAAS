import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { PrismaService } from '../../../../database/prisma/prisma.service';
import { PrismaMembershipRepository } from '../../infrastructure/prisma-membership.repository';
import { PrismaTenantRepository } from '../../../platform/infrastructure/prisma-tenant.repository';
import { PrismaOrganizationRepository } from '../../../platform/infrastructure/prisma-organization.repository';
import { PrismaUserRepository } from '../../../users/infrastructure/prisma-user.repository';
import { Tenant } from '../../../platform/domain/entities/tenant.entity';
import { Organization } from '../../../platform/domain/entities/organization.entity';
import { User } from '../../../users/domain/entities/user.entity';
import { Membership } from '../../domain/entities/membership.entity';

describe('PrismaMembershipRepository (integration)', () => {
  const prisma = new PrismaService();
  const membershipRepo = new PrismaMembershipRepository(prisma);
  const tenantRepo = new PrismaTenantRepository(prisma);
  const orgRepo = new PrismaOrganizationRepository(prisma);
  const userRepo = new PrismaUserRepository(prisma);
  let tenantId: string;
  let userId: string;
  let orgId: string;

  beforeAll(async () => {
    await prisma.onModuleInit();
    const t = Tenant.create({ name: 'IT Tenant Mem', slug: 'it-tenant-mem' });
    await tenantRepo.save(t);
    tenantId = t.id;
    const org = Organization.create({ tenantId, name: 'IT Org Mem' });
    await orgRepo.save(org);
    orgId = org.id;
    const user = User.create({ email: 'mem-it@example.com', name: 'Mem IT' });
    await userRepo.save(user);
    userId = user.id;
    await prisma.membership.deleteMany({ where: { userId } });
  });

  afterAll(async () => {
    await prisma.membership.deleteMany({ where: { userId } });
    await prisma.user.deleteMany({ where: { id: userId } });
    await prisma.organization.deleteMany({ where: { id: orgId } });
    await prisma.tenant.deleteMany({ where: { slug: 'it-tenant-mem' } });
    await prisma.$disconnect();
  });

  it('save + findById + findByUserAndOrganization', async () => {
    const m = Membership.invite({ tenantId, userId, organizationId: orgId });
    await membershipRepo.save(m);
    const found = await membershipRepo.findById(m.id);
    expect(found?.status).toBe('PENDING');
    const byPair = await membershipRepo.findByUserAndOrganization(userId, orgId);
    expect(byPair?.id).toBe(m.id);
  });
});
