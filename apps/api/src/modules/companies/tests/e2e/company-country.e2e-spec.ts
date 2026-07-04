import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../../../bootstrap/app.module';
import { authHeader, bootstrapE2eAuth, E2eAuthContext } from '../../../../bootstrap/e2e-auth.helper';

describe('Company country (CIS tax ids) E2E', () => {
  let app: INestApplication;
  let auth: E2eAuthContext;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
    auth = await bootstrapE2eAuth(app);
  });

  afterAll(async () => {
    await app.close();
  });

  it('defaults country to RU', async () => {
    const res = await request(app.getHttpServer())
      .post('/companies')
      .set(authHeader(auth.token))
      .send({ name: 'Default Country Co' })
      .expect(201);
    expect(res.body.country).toBe('RU');
  });

  it('accepts UZ company with 9-digit СТИР', async () => {
    const res = await request(app.getHttpServer())
      .post('/companies')
      .set(authHeader(auth.token))
      .send({ name: 'UZ Metall Trade', country: 'UZ', inn: '123456789' })
      .expect(201);
    expect(res.body.country).toBe('UZ');
    expect(res.body.inn).toBe('123456789');
  });

  it('accepts KZ company with 12-digit БИН and KG with 14 digits', async () => {
    await request(app.getHttpServer())
      .post('/companies')
      .set(authHeader(auth.token))
      .send({ name: 'KZ Steel', country: 'KZ', inn: '123456789012' })
      .expect(201);
    await request(app.getHttpServer())
      .post('/companies')
      .set(authHeader(auth.token))
      .send({ name: 'KG Metal', country: 'KG', inn: '12345678901234' })
      .expect(201);
  });

  it('rejects 9-digit tax id for RU with 400', async () => {
    // unique digits — a duplicate INN in the same org returns 409 before format check
    await request(app.getHttpServer())
      .post('/companies')
      .set(authHeader(auth.token))
      .send({ name: 'RU Wrong Inn Co', country: 'RU', inn: '987654321' })
      .expect(400);
  });

  it('rejects unknown country with 400', async () => {
    await request(app.getHttpServer())
      .post('/companies')
      .set(authHeader(auth.token))
      .send({ name: 'Mars Co', country: 'US', inn: '1234567890' })
      .expect(400);
  });
});
