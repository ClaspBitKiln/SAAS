import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../../../bootstrap/app.module';
import { authHeader, bootstrapE2eAuth } from '../../../../bootstrap/e2e-auth.helper';

describe('Company search isolation E2E', () => {
  let app: INestApplication;
  let tokenA: string;
  let orgA: string;
  let tokenB: string;
  let companyAId: string;
  const marker = `co-marker-${Date.now()}`;

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
      .post('/companies')
      .set(authHeader(tokenA))
      .send({ name: `${marker} Alpha Metal`, inn: '5024088380' })
      .expect(201);
    companyAId = createdA.body.id;

    await request(app.getHttpServer())
      .post('/companies')
      .set(authHeader(tokenB))
      .send({ name: `${marker} Beta Metal`, inn: '7702070139' })
      .expect(201);
  });

  afterAll(async () => {
    await app.close();
  });

  it('filters companies by q within own org', async () => {
    const res = await request(app.getHttpServer())
      .get(`/companies?q=${encodeURIComponent(marker)}`)
      .set(authHeader(tokenA))
      .expect(200);

    expect(res.body.total).toBe(1);
    expect(res.body.items).toHaveLength(1);
    expect(res.body.items[0].id).toBe(companyAId);
    expect(res.body.items[0].organizationId).toBe(orgA);
  });

  it('never returns companies from another org', async () => {
    const res = await request(app.getHttpServer())
      .get(`/companies?q=${encodeURIComponent(marker)}`)
      .set(authHeader(tokenA))
      .expect(200);

    for (const item of res.body.items) {
      expect(item.organizationId).toBe(orgA);
      expect(item.inn).not.toBe('7702070139');
    }
  });
});
