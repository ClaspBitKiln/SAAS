import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../../../bootstrap/app.module';
import { authHeader, bootstrapE2eAuth } from '../../../../bootstrap/e2e-auth.helper';

describe('Contact notes E2E', () => {
  let app: INestApplication;
  let token: string;
  let otherToken: string;
  let contactId: string;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();

    const auth = await bootstrapE2eAuth(app);
    token = auth.token;
    const other = await bootstrapE2eAuth(app);
    otherToken = other.token;

    const contact = await request(app.getHttpServer())
      .post('/contacts')
      .set(authHeader(token))
      .send({ name: 'Notes Contact', email: 'notes@example.com' })
      .expect(201);
    contactId = contact.body.id;
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST and GET notes for own contact', async () => {
    const created = await request(app.getHttpServer())
      .post(`/contacts/${contactId}/notes`)
      .set(authHeader(token))
      .send({ body: 'First call — asked for quote.' })
      .expect(201);
    expect(created.body.body).toBe('First call — asked for quote.');

    const list = await request(app.getHttpServer())
      .get(`/contacts/${contactId}/notes`)
      .set(authHeader(token))
      .expect(200);
    expect(list.body).toHaveLength(1);
    expect(list.body[0].body).toContain('quote');
  });

  it('returns 404 for notes on another org contact', async () => {
    await request(app.getHttpServer())
      .get(`/contacts/${contactId}/notes`)
      .set(authHeader(otherToken))
      .expect(404);
  });
});
