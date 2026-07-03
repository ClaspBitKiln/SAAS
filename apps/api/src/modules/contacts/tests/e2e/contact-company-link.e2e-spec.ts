import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../../../bootstrap/app.module';
import { authHeader, bootstrapE2eAuth } from '../../../../bootstrap/e2e-auth.helper';

describe('Contact company link E2E', () => {
  let app: INestApplication;
  let tokenA: string;
  let tokenB: string;
  let companyAId: string;
  let companyBId: string;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();

    const authA = await bootstrapE2eAuth(app);
    tokenA = authA.token;
    const authB = await bootstrapE2eAuth(app);
    tokenB = authB.token;

    const companyA = await request(app.getHttpServer())
      .post('/companies')
      .set(authHeader(tokenA))
      .send({ name: 'Link Test Co A', inn: '5024088380' })
      .expect(201);
    companyAId = companyA.body.id;

    const companyB = await request(app.getHttpServer())
      .post('/companies')
      .set(authHeader(tokenB))
      .send({ name: 'Link Test Co B', inn: '7702070139' })
      .expect(201);
    companyBId = companyB.body.id;
  });

  afterAll(async () => {
    await app.close();
  });

  it('creates contact linked to company in same org', async () => {
    const res = await request(app.getHttpServer())
      .post('/contacts')
      .set(authHeader(tokenA))
      .send({ name: 'Buyer Contact', email: 'buyer@link.test', companyId: companyAId })
      .expect(201);

    expect(res.body.companyId).toBe(companyAId);

    const updated = await request(app.getHttpServer())
      .patch(`/contacts/${res.body.id}`)
      .set(authHeader(tokenA))
      .send({ companyId: null })
      .expect(200);
    expect(updated.body.companyId).toBeNull();
  });

  it('rejects company from another org on create', async () => {
    await request(app.getHttpServer())
      .post('/contacts')
      .set(authHeader(tokenA))
      .send({ name: 'Cross Org', companyId: companyBId })
      .expect(404);
  });

  it('rejects company from another org on update', async () => {
    const created = await request(app.getHttpServer())
      .post('/contacts')
      .set(authHeader(tokenA))
      .send({ name: 'Update Cross Org' })
      .expect(201);

    await request(app.getHttpServer())
      .patch(`/contacts/${created.body.id}`)
      .set(authHeader(tokenA))
      .send({ companyId: companyBId })
      .expect(404);
  });
});
