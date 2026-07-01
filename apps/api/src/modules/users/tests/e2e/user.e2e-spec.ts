import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../../../bootstrap/app.module';

describe('User E2E', () => {
  let app: INestApplication;
  const email = `e2e-user-${Date.now()}@example.com`;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /users creates user', async () => {
    const res = await request(app.getHttpServer())
      .post('/users')
      .send({ email, name: 'E2E User', locale: 'ru-RU', timezone: 'Europe/Moscow' })
      .expect(201);
    expect(res.body.id).toBeDefined();
    expect(res.body.email).toBe(email);
    expect(res.body.status).toBe('INVITED');

    await request(app.getHttpServer())
      .patch(`/users/${res.body.id}`)
      .send({ name: 'E2E User Updated' })
      .expect(200);

    await request(app.getHttpServer())
      .patch(`/users/${res.body.id}/activate`)
      .expect(200)
      .expect((r) => {
        expect(r.body.status).toBe('ACTIVE');
      });
  });

  it('POST /users rejects duplicate email', async () => {
    await request(app.getHttpServer())
      .post('/users')
      .send({ email, name: 'Duplicate' })
      .expect(409);
  });

  it('POST /users rejects invalid email', async () => {
    await request(app.getHttpServer())
      .post('/users')
      .send({ email: 'bad', name: 'Bad Email' })
      .expect(400);
  });

  it('GET /users?email= finds user', async () => {
    const res = await request(app.getHttpServer()).get('/users').query({ email }).expect(200);
    expect(res.body.email).toBe(email);
  });
});
