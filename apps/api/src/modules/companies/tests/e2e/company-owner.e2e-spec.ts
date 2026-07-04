import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../../../bootstrap/app.module';
import { authHeader, bootstrapE2eAuth, E2eAuthContext } from '../../../../bootstrap/e2e-auth.helper';

/** Creates a second ACTIVE member inside an existing org. */
async function addOrgMember(app: INestApplication, ctx: E2eAuthContext): Promise<string> {
  const email = `e2e-owner-${Date.now()}@example.com`;
  const userRes = await request(app.getHttpServer())
    .post('/users')
    .send({ email, name: 'E2E Owner Colleague' })
    .expect(201);
  const userId = userRes.body.id;
  const membershipRes = await request(app.getHttpServer())
    .post('/memberships')
    .send({ tenantId: ctx.tenantId, userId, organizationId: ctx.orgId })
    .expect(201);
  await request(app.getHttpServer()).patch(`/memberships/${membershipRes.body.id}/accept`).expect(200);
  return userId;
}

describe('Company owner (responsible manager) E2E', () => {
  let app: INestApplication;
  let authA: E2eAuthContext;
  let authB: E2eAuthContext;
  let colleagueId: string;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();

    authA = await bootstrapE2eAuth(app);
    authB = await bootstrapE2eAuth(app);
    colleagueId = await addOrgMember(app, authA);
  });

  afterAll(async () => {
    await app.close();
  });

  it('defaults owner to creator on create', async () => {
    const res = await request(app.getHttpServer())
      .post('/companies')
      .set(authHeader(authA.token))
      .send({ name: 'Owner Default Co' })
      .expect(201);
    expect(res.body.ownerUserId).toBe(authA.userId);
  });

  it('assigns another active member of the same org as owner', async () => {
    const created = await request(app.getHttpServer())
      .post('/companies')
      .set(authHeader(authA.token))
      .send({ name: 'Owner Assign Co', ownerUserId: colleagueId })
      .expect(201);
    expect(created.body.ownerUserId).toBe(colleagueId);

    const updated = await request(app.getHttpServer())
      .patch(`/companies/${created.body.id}`)
      .set(authHeader(authA.token))
      .send({ ownerUserId: authA.userId })
      .expect(200);
    expect(updated.body.ownerUserId).toBe(authA.userId);
  });

  it('rejects owner from another org with 404', async () => {
    await request(app.getHttpServer())
      .post('/companies')
      .set(authHeader(authA.token))
      .send({ name: 'Owner Cross Org Co', ownerUserId: authB.userId })
      .expect(404);

    const created = await request(app.getHttpServer())
      .post('/companies')
      .set(authHeader(authA.token))
      .send({ name: 'Owner Cross Org Patch Co' })
      .expect(201);
    await request(app.getHttpServer())
      .patch(`/companies/${created.body.id}`)
      .set(authHeader(authA.token))
      .send({ ownerUserId: authB.userId })
      .expect(404);
  });

  it('unsets owner with null', async () => {
    const created = await request(app.getHttpServer())
      .post('/companies')
      .set(authHeader(authA.token))
      .send({ name: 'Owner Unset Co' })
      .expect(201);
    const updated = await request(app.getHttpServer())
      .patch(`/companies/${created.body.id}`)
      .set(authHeader(authA.token))
      .send({ ownerUserId: null })
      .expect(200);
    expect(updated.body.ownerUserId).toBeNull();
  });
});
