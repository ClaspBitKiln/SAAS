import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { PrismaService } from '../../../../database/prisma/prisma.service';
import { PrismaCallRepository } from '../../infrastructure/prisma-call.repository';
import { PrismaContactRepository } from '../../../contacts/infrastructure/prisma-contact.repository';
import { PrismaTenantRepository } from '../../../platform/infrastructure/prisma-tenant.repository';
import { PrismaOrganizationRepository } from '../../../platform/infrastructure/prisma-organization.repository';
import { Tenant } from '../../../platform/domain/entities/tenant.entity';
import { Organization } from '../../../platform/domain/entities/organization.entity';
import { Contact } from '../../../contacts/domain/entities/contact.entity';
import { Call } from '../../domain/entities/call.entity';
import { CallDirectionEnum } from '../../domain/value-objects/call-direction.vo';
import { CallStatusEnum } from '../../domain/value-objects/call-status.vo';

describe('PrismaCallRepository (integration)', () => {
  const prisma = new PrismaService();
  const callRepo = new PrismaCallRepository(prisma);
  const contactRepo = new PrismaContactRepository(prisma);
  const tenantRepo = new PrismaTenantRepository(prisma);
  const orgRepo = new PrismaOrganizationRepository(prisma);
  let tenantId: string;
  let orgId: string;
  let contactId: string;

  beforeAll(async () => {
    await prisma.onModuleInit();
    const t = Tenant.create({ name: 'IT Tenant Call', slug: 'it-tenant-call' });
    await tenantRepo.save(t);
    tenantId = t.id;
    const org = Organization.create({ tenantId, name: 'IT Org Call' });
    await orgRepo.save(org);
    orgId = org.id;
    const contact = Contact.create({ tenantId, organizationId: orgId, name: 'IT Contact Call' });
    await contactRepo.save(contact);
    contactId = contact.id;
    await prisma.call.deleteMany({ where: { contactId } });
  });

  afterAll(async () => {
    await prisma.call.deleteMany({ where: { contactId } });
    await prisma.contact.deleteMany({ where: { id: contactId } });
    await prisma.organization.deleteMany({ where: { id: orgId } });
    await prisma.tenant.deleteMany({ where: { slug: 'it-tenant-call' } });
    await prisma.$disconnect();
  });

  it('save + findById + listByContact + complete', async () => {
    const call = Call.start({
      tenantId,
      organizationId: orgId,
      contactId,
      direction: CallDirectionEnum.OUTBOUND,
      phone: '+79991234567',
    });
    await callRepo.save(call);
    const found = await callRepo.findById(call.id);
    expect(found?.status).toBe(CallStatusEnum.RINGING);

    const list = await callRepo.listByContact(contactId, { page: 1, size: 10 });
    expect(list.total).toBeGreaterThanOrEqual(1);

    found!.complete();
    await callRepo.save(found!);
    const completed = await callRepo.findById(call.id);
    expect(completed?.status).toBe(CallStatusEnum.COMPLETED);
    expect(completed?.durationSec).not.toBeNull();
  });
});
