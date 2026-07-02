import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../../../bootstrap/app.module';
import { authHeader, bootstrapE2eAuth } from '../../../../bootstrap/e2e-auth.helper';

describe('Contact search E2E', () => {
  let app: INestApplication;
  let tokenA: string;
  let orgA: string;
  let tokenB: string;
  let contactAId: string;
  const marker = `search-marker-${Date.now()}`;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();

    const authA = await bootstrapE2eAuth(app);
    tokenA = authA.token;
    orgA = authA.orgId;
    const authB = await bootstrapE2eAuth(app);
    tokenB = authB.token;

    const createdA = await request(app.getHttpServer())
      .post('/contacts')
      .set(authHeader(tokenA))
      .send({ name: `${marker} Alpha`, email: `${marker}@org-a.example.com` })
      .expect(201);
    contactAId = createdA.body.id;

    await request(app.getHttpServer())
      .post('/contacts')
      .set(authHeader(tokenB))
      .send({ name: `${marker} Beta`, email: `${marker}@org-b.example.com` })
      .expect(201);
  });

  afterAll(async () => {
    await app.close();
  });

  it('filters contacts by q within own org', async () => {
    const res = await request(app.getHttpServer())
      .get(`/contacts?q=${encodeURIComponent(marker)}`)
      .set(authHeader(tokenA))
      .expect(200);

    expect(res.body.total).toBe(1);
    expect(res.body.items).toHaveLength(1);
    expect(res.body.items[0].id).toBe(contactAId);
    expect(res.body.items[0].organizationId).toBe(orgA);
  });

  it('never returns contacts from another org', async () => {
    const res = await request(app.getHttpServer())
      .get(`/contacts?q=${encodeURIComponent(marker)}`)
      .set(authHeader(tokenA))
      .expect(200);

    for (const item of res.body.items) {
      expect(item.organizationId).toBe(orgA);
      expect(item.email).not.toContain('@org-b.example.com');
    }
  });

  it('empty q returns full list for org', async () => {
    const res = await request(app.getHttpServer()).get('/contacts').set(authHeader(tokenA)).expect(200);
    expect(res.body.total).toBeGreaterThanOrEqual(1);
    expect(res.body.items.length).toBeGreaterThanOrEqual(1);
  });
});
