import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { PrismaService } from '../../../../database/prisma/prisma.service';
import { PrismaSessionRepository } from '../../infrastructure/prisma-session.repository';
import { PrismaUserRepository } from '../../../users/infrastructure/prisma-user.repository';
import { User } from '../../../users/domain/entities/user.entity';
import { Session } from '../../domain/entities/session.entity';

describe('PrismaSessionRepository (integration)', () => {
  const prisma = new PrismaService();
  const sessionRepo = new PrismaSessionRepository(prisma);
  const userRepo = new PrismaUserRepository(prisma);
  let userId: string;

  beforeAll(async () => {
    await prisma.onModuleInit();
    const user = User.create({ email: `it-session-${Date.now()}@example.com`, name: 'IT Session User' });
    await userRepo.save(user);
    userId = user.id;
    await prisma.session.deleteMany({ where: { userId } });
  });

  afterAll(async () => {
    await prisma.session.deleteMany({ where: { userId } });
    await prisma.user.deleteMany({ where: { id: userId } });
    await prisma.$disconnect();
  });

  it('save + findByRefreshTokenHash + revoke', async () => {
    const expiresAt = new Date(Date.now() + 86_400_000);
    const session = Session.create(userId, 'sha256hash', expiresAt);
    await sessionRepo.save(session);

    const found = await sessionRepo.findByRefreshTokenHash('sha256hash');
    expect(found?.userId).toBe(userId);

    found!.revoke();
    await sessionRepo.save(found!);
    const revoked = await sessionRepo.findById(session.id);
    expect(revoked?.isActive()).toBe(false);
  });
});
