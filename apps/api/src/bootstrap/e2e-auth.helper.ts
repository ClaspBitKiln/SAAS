import { INestApplication } from '@nestjs/common';
import request from 'supertest';

export interface E2eAuthContext {
  token: string;
  tenantId: string;
  orgId: string;
  userId: string;
  email: string;
  password: string;
}

export async function bootstrapE2eAuth(app: INestApplication): Promise<E2eAuthContext> {
  const email = `e2e-auth-${Date.now()}@example.com`;
  const password = 'securepass1';

  const tenantRes = await request(app.getHttpServer())
    .post('/tenants')
    .send({ name: 'E2E Auth Tenant', slug: `e2e-auth-${Date.now()}` })
    .expect(201);
  const tenantId = tenantRes.body.id;

  const orgRes = await request(app.getHttpServer())
    .post('/organizations')
    .send({ tenantId, name: 'E2E Auth Org' })
    .expect(201);
  const orgId = orgRes.body.id;

  const userRes = await request(app.getHttpServer())
    .post('/users')
    .send({ email, name: 'E2E Auth User' })
    .expect(201);
  const userId = userRes.body.id;

  const membershipRes = await request(app.getHttpServer())
    .post('/memberships')
    .send({ tenantId, userId, organizationId: orgId, isDefault: true })
    .expect(201);

  await request(app.getHttpServer()).patch(`/memberships/${membershipRes.body.id}/accept`).expect(200);
  await request(app.getHttpServer()).post('/auth/set-password').send({ userId, password }).expect(204);

  const loginRes = await request(app.getHttpServer()).post('/auth/login').send({ email, password }).expect(201);

  return { token: loginRes.body.accessToken, tenantId, orgId, userId, email, password };
}

export function authHeader(token: string): { Authorization: string } {
  return { Authorization: `Bearer ${token}` };
}
