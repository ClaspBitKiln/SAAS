// E2E: POST /tenants → GET → PATCH suspend. Требует поднятую тест-БД.
import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { PlatformModule } from '../../platform.module';

describe('Tenant E2E', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [PlatformModule] }).compile();
    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /tenants создаёт арендатора', async () => {
    const slug = `e2e-co-${Date.now()}`;
    const res = await request(app.getHttpServer())
      .post('/tenants')
      .send({ name: 'E2E Co', slug })
      .expect(201);
    expect(res.body.id).toBeDefined();
    expect(res.body.status).toBe('ACTIVE');

    const id = res.body.id;
    await request(app.getHttpServer()).patch(`/tenants/${id}/suspend`).expect(200);
    const got = await request(app.getHttpServer()).get(`/tenants/${id}`).expect(200);
    expect(got.body.status).toBe('SUSPENDED');
  });

  it('POST /tenants отклоняет невалидный slug', async () => {
    await request(app.getHttpServer())
      .post('/tenants')
      .send({ name: 'X', slug: '' })
      .expect(400);
  });
});
