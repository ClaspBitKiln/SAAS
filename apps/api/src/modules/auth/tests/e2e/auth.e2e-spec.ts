import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../../../bootstrap/app.module';

describe('Auth E2E', () => {
  let app: INestApplication;
  let tenantId: string;
  let orgId: string;
  let userId: string;
  const email = `e2e-auth-${Date.now()}@example.com`;
  const password = 'securepass1';

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();

    const tenantRes = await request(app.getHttpServer())
      .post('/tenants')
      .send({ name: 'E2E Auth Tenant', slug: `e2e-auth-${Date.now()}` })
      .expect(201);
    tenantId = tenantRes.body.id;

    const orgRes = await request(app.getHttpServer())
      .post('/organizations')
      .send({ tenantId, name: 'E2E Auth Org' })
      .expect(201);
    orgId = orgRes.body.id;

    const userRes = await request(app.getHttpServer())
      .post('/users')
      .send({ email, name: 'Auth User' })
      .expect(201);
    userId = userRes.body.id;

    const membershipRes = await request(app.getHttpServer())
      .post('/memberships')
      .send({ tenantId, userId, organizationId: orgId, isDefault: true })
      .expect(201);

    await request(app.getHttpServer()).patch(`/memberships/${membershipRes.body.id}/accept`).expect(200);
  });

  afterAll(async () => {
    await app.close();
  });

  it('set-password + login flow', async () => {
    await request(app.getHttpServer()).post('/auth/set-password').send({ userId, password }).expect(204);

    const activated = await request(app.getHttpServer()).get(`/users/${userId}`).expect(200);
    expect(activated.body.status).toBe('ACTIVE');

    const login = await request(app.getHttpServer()).post('/auth/login').send({ email, password }).expect(201);
    expect(login.body.accessToken).toBeTruthy();
    expect(login.body.refreshToken).toBeTruthy();
    expect(login.body.userId).toBe(userId);
    expect(login.body.tenantId).toBe(tenantId);
    expect(login.body.organizationId).toBe(orgId);

    const refreshed = await request(app.getHttpServer())
      .post('/auth/refresh')
      .send({ refreshToken: login.body.refreshToken })
      .expect(201);
    expect(refreshed.body.accessToken).toBeTruthy();
    expect(refreshed.body.refreshToken).not.toBe(login.body.refreshToken);

    await request(app.getHttpServer())
      .post('/auth/logout')
      .send({ refreshToken: refreshed.body.refreshToken })
      .expect(204);

    await request(app.getHttpServer())
      .post('/auth/refresh')
      .send({ refreshToken: refreshed.body.refreshToken })
      .expect(401);
  });

  it('login rejects invalid password', async () => {
    await request(app.getHttpServer())
      .post('/auth/login')
      .send({ email, password: 'wrongpass1' })
      .expect(401);
  });
});
