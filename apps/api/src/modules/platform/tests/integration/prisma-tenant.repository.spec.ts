// Integration: требует тест-БД PostgreSQL (DATABASE_URL на test-схему) и `prisma migrate`.
// Запуск: vitest run (с поднятой тестовой БД).
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { PrismaService } from '../../../../database/prisma/prisma.service';
import { PrismaTenantRepository } from '../../infrastructure/prisma-tenant.repository';
import { Tenant } from '../../domain/entities/tenant.entity';

describe('PrismaTenantRepository (integration)', () => {
  const prisma = new PrismaService();
  const repo = new PrismaTenantRepository(prisma);

  beforeAll(async () => {
    await prisma.onModuleInit();
    await prisma.tenant.deleteMany({ where: { slug: { startsWith: 'it-' } } });
  });

  afterAll(async () => {
    await prisma.tenant.deleteMany({ where: { slug: { startsWith: 'it-' } } });
    await prisma.$disconnect();
  });

  it('save + findById возвращает агрегат', async () => {
    const t = Tenant.create({ name: 'IT Co', slug: 'it-co' });
    await repo.save(t);
    const found = await repo.findById(t.id);
    expect(found?.slug).toBe('it-co');
    expect(found?.status.isActive()).toBe(true);
  });

  it('optimistic lock: повторный save с устаревшей версией падает', async () => {
    const t = Tenant.create({ name: 'IT Lock', slug: 'it-lock' });
    await repo.save(t);
    const a = await repo.findById(t.id);
    const b = await repo.findById(t.id);
    a!.suspend();
    await repo.save(a!);
    b!.suspend(); // версия устарела
    await expect(repo.save(b!)).rejects.toThrow(/OptimisticLockError/);
  });
});
