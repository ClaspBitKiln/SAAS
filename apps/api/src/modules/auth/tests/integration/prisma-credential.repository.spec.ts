import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { PrismaService } from '../../../../database/prisma/prisma.service';
import { PrismaCredentialRepository } from '../../infrastructure/prisma-credential.repository';
import { PrismaUserRepository } from '../../../users/infrastructure/prisma-user.repository';
import { User } from '../../../users/domain/entities/user.entity';
import { Credential } from '../../domain/entities/credential.entity';

describe('PrismaCredentialRepository (integration)', () => {
  const prisma = new PrismaService();
  const credentialRepo = new PrismaCredentialRepository(prisma);
  const userRepo = new PrismaUserRepository(prisma);
  let userId: string;

  beforeAll(async () => {
    await prisma.onModuleInit();
    const user = User.create({ email: `it-cred-${Date.now()}@example.com`, name: 'IT Cred User' });
    await userRepo.save(user);
    userId = user.id;
    await prisma.credential.deleteMany({ where: { userId } });
  });

  afterAll(async () => {
    await prisma.credential.deleteMany({ where: { userId } });
    await prisma.user.deleteMany({ where: { id: userId } });
    await prisma.$disconnect();
  });

  it('save + findByUserId', async () => {
    const credential = Credential.create(userId, '$2a$10$integrationhash');
    await credentialRepo.save(credential);
    const found = await credentialRepo.findByUserId(userId);
    expect(found?.passwordHash).toBe('$2a$10$integrationhash');
  });
});
