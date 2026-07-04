import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../../../bootstrap/app.module';
import { authHeader, bootstrapE2eAuth, E2eAuthContext } from '../../../../bootstrap/e2e-auth.helper';

describe('Contact owner (responsible manager) E2E', () => {
  let app: INestApplication;
  let authA: E2eAuthContext;
  let authB: E2eAuthContext;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();

    authA = await bootstrapE2eAuth(app);
    authB = await bootstrapE2eAuth(app);
  });

  afterAll(async () => {
    await app.close();
  });

  it('defaults owner to creator on create', async () => {
    const res = await request(app.getHttpServer())
      .post('/contacts')
      .set(authHeader(authA.token))
      .send({ name: 'Owner Default Contact' })
      .expect(201);
    expect(res.body.ownerUserId).toBe(authA.userId);
  });

  it('rejects owner from another org with 404', async () => {
    await request(app.getHttpServer())
      .post('/contacts')
      .set(authHeader(authA.token))
      .send({ name: 'Owner Cross Org Contact', ownerUserId: authB.userId })
      .expect(404);

    const created = await request(app.getHttpServer())
      .post('/contacts')
      .set(authHeader(authA.token))
      .send({ name: 'Owner Patch Cross Org' })
      .expect(201);
    await request(app.getHttpServer())
      .patch(`/contacts/${created.body.id}`)
      .set(authHeader(authA.token))
      .send({ ownerUserId: authB.userId })
      .expect(404);
  });

  it('unsets owner with null', async () => {
    const created = await request(app.getHttpServer())
      .post('/contacts')
      .set(authHeader(authA.token))
      .send({ name: 'Owner Unset Contact' })
      .expect(201);
    const updated = await request(app.getHttpServer())
      .patch(`/contacts/${created.body.id}`)
      .set(authHeader(authA.token))
      .send({ ownerUserId: null })
      .expect(200);
    expect(updated.body.ownerUserId).toBeNull();
  });
});
