import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../../../bootstrap/app.module';
import { authHeader, bootstrapE2eAuth, E2eAuthContext } from '../../../../bootstrap/e2e-auth.helper';

describe('Company INN lookup E2E (no external key in CI)', () => {
  let app: INestApplication;
  let auth: E2eAuthContext;

  beforeAll(async () => {
    delete process.env.DADATA_API_KEY; // CI must not call external network
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
    auth = await bootstrapE2eAuth(app);
  });

  afterAll(async () => {
    await app.close();
  });

  it('returns configured=false when DADATA_API_KEY is not set', async () => {
    const res = await request(app.getHttpServer())
      .get('/companies/inn-lookup/7707083893')
      .set(authHeader(auth.token))
      .expect(200);
    expect(res.body.configured).toBe(false);
    expect(res.body.found).toBe(false);
  });

  it('rejects invalid INN format with 400', async () => {
    await request(app.getHttpServer())
      .get('/companies/inn-lookup/123')
      .set(authHeader(auth.token))
      .expect(400);
  });

  it('requires auth (401 without token)', async () => {
    await request(app.getHttpServer()).get('/companies/inn-lookup/7707083893').expect(401);
  });
});
