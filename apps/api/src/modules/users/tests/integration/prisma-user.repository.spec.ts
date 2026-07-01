import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { PrismaService } from '../../../../database/prisma/prisma.service';
import { PrismaUserRepository } from '../../infrastructure/prisma-user.repository';
import { User } from '../../domain/entities/user.entity';

describe('PrismaUserRepository (integration)', () => {
  const prisma = new PrismaService();
  const userRepo = new PrismaUserRepository(prisma);
  const testEmail = 'it-user@example.com';

  beforeAll(async () => {
    await prisma.onModuleInit();
    await prisma.user.deleteMany({ where: { email: testEmail } });
  });

  afterAll(async () => {
    await prisma.user.deleteMany({ where: { email: testEmail } });
    await prisma.$disconnect();
  });

  it('save + findById + findByEmail + list', async () => {
    const user = User.create({ email: testEmail, name: 'IT User' });
    await userRepo.save(user);
    const found = await userRepo.findById(user.id);
    expect(found?.name).toBe('IT User');
    const byEmail = await userRepo.findByEmail(testEmail);
    expect(byEmail?.id).toBe(user.id);
    const list = await userRepo.list({ page: 1, size: 10 });
    expect(list.total).toBeGreaterThanOrEqual(1);
  });
});
