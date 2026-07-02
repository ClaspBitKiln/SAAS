import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../../../bootstrap/app.module';

describe('Auth rate limit E2E', () => {
  let app: INestApplication;
  let userId: string;
  const email = `e2e-rate-${Date.now()}@example.com`;
  const password = 'securepass1';

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();

    const tenantRes = await request(app.getHttpServer())
      .post('/tenants')
      .send({ name: 'Rate Limit Tenant', slug: `e2e-rate-${Date.now()}` })
      .expect(201);

    const orgRes = await request(app.getHttpServer())
      .post('/organizations')
      .send({ tenantId: tenantRes.body.id, name: 'Rate Limit Org' })
      .expect(201);

    const userRes = await request(app.getHttpServer())
      .post('/users')
      .send({ email, name: 'Rate User' })
      .expect(201);
    userId = userRes.body.id;

    const membershipRes = await request(app.getHttpServer())
      .post('/memberships')
      .send({
        tenantId: tenantRes.body.id,
        userId,
        organizationId: orgRes.body.id,
        isDefault: true,
      })
      .expect(201);

    await request(app.getHttpServer()).patch(`/memberships/${membershipRes.body.id}/accept`).expect(200);
    await request(app.getHttpServer()).post('/auth/set-password').send({ userId, password }).expect(204);
  });

  afterAll(async () => {
    await app.close();
  });

  it('returns 429 when login rate limit is exceeded', async () => {
    const statuses: number[] = [];
    for (let i = 0; i < 10; i++) {
      const res = await request(app.getHttpServer())
        .post('/auth/login')
        .send({ email, password: 'wrongpass1' });
      statuses.push(res.status);
    }

    expect(statuses).toContain(401);
    expect(statuses).toContain(429);
  });
});
