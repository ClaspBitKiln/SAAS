import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../../../bootstrap/app.module';

describe('Membership E2E', () => {
  let app: INestApplication;
  let tenantId: string;
  let orgId: string;
  let userId: string;
  const email = `e2e-mem-${Date.now()}@example.com`;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();

    const tenantRes = await request(app.getHttpServer())
      .post('/tenants')
      .send({ name: 'E2E Mem Tenant', slug: `e2e-mem-${Date.now()}` })
      .expect(201);
    tenantId = tenantRes.body.id;

    const orgRes = await request(app.getHttpServer())
      .post('/organizations')
      .send({ tenantId, name: 'E2E Mem Org' })
      .expect(201);
    orgId = orgRes.body.id;

    const userRes = await request(app.getHttpServer())
      .post('/users')
      .send({ email, name: 'E2E Mem User' })
      .expect(201);
    userId = userRes.body.id;
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /memberships invites and accept flow', async () => {
    const res = await request(app.getHttpServer())
      .post('/memberships')
      .send({ tenantId, userId, organizationId: orgId, isDefault: true })
      .expect(201);
    expect(res.body.status).toBe('PENDING');

    await request(app.getHttpServer())
      .patch(`/memberships/${res.body.id}/accept`)
      .expect(200)
      .expect((r) => {
        expect(r.body.status).toBe('ACTIVE');
      });
  });

  it('POST /memberships rejects duplicate', async () => {
    await request(app.getHttpServer())
      .post('/memberships')
      .send({ tenantId, userId, organizationId: orgId })
      .expect(409);
  });

  it('GET /memberships?userId= lists memberships', async () => {
    const res = await request(app.getHttpServer()).get('/memberships').query({ userId }).expect(200);
    expect(res.body.total).toBeGreaterThanOrEqual(1);
  });
});
