import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../../../bootstrap/app.module';
import { authHeader, bootstrapE2eAuth } from '../../../../bootstrap/e2e-auth.helper';

describe('Contact E2E', () => {
  let app: INestApplication;
  let token: string;
  let orgId: string;
  let tenantId: string;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();

    const auth = await bootstrapE2eAuth(app);
    token = auth.token;
    tenantId = auth.tenantId;
    orgId = auth.orgId;
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /contacts without token returns 401', async () => {
    await request(app.getHttpServer()).get('/contacts').expect(401);
  });

  it('POST /contacts CRUD flow', async () => {
    const res = await request(app.getHttpServer())
      .post('/contacts')
      .set(authHeader(token))
      .send({ name: 'Jane Doe', email: 'jane@example.com', phone: '+79991234567' })
      .expect(201);
    expect(res.body.name).toBe('Jane Doe');
    expect(res.body.tenantId).toBe(tenantId);
    expect(res.body.organizationId).toBe(orgId);

    await request(app.getHttpServer())
      .patch(`/contacts/${res.body.id}`)
      .set(authHeader(token))
      .send({ name: 'Jane Updated' })
      .expect(200);

    const list = await request(app.getHttpServer()).get('/contacts').set(authHeader(token)).expect(200);
    expect(list.body.total).toBeGreaterThanOrEqual(1);

    await request(app.getHttpServer()).delete(`/contacts/${res.body.id}`).set(authHeader(token)).expect(200);
    await request(app.getHttpServer()).get(`/contacts/${res.body.id}`).set(authHeader(token)).expect(404);
  });
});
