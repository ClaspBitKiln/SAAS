import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../../../bootstrap/app.module';
import { authHeader, bootstrapE2eAuth } from '../../../../bootstrap/e2e-auth.helper';

describe('Request E2E', () => {
  let app: INestApplication;
  let token: string;
  let orgId: string;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();

    const auth = await bootstrapE2eAuth(app);
    token = auth.token;
    orgId = auth.orgId;
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /requests without token returns 401', async () => {
    await request(app.getHttpServer()).get('/requests').query({ organizationId: orgId }).expect(401);
  });

  it('POST /requests parse + create + search flow', async () => {
    const parsed = await request(app.getHttpServer())
      .post('/requests/parse')
      .set(authHeader(token))
      .send({ rawText: 'Лист 10мм 09Г2С\nТруба 57х3.5' })
      .expect(201);
    expect(parsed.body.lines.length).toBeGreaterThanOrEqual(1);

    const created = await request(app.getHttpServer())
      .post('/requests')
      .set(authHeader(token))
      .send({
        organizationId: orgId,
        title: 'E2E Request',
        source: 'MANUAL',
        lines: parsed.body.lines,
      })
      .expect(201);
    expect(created.body.lines.length).toBeGreaterThanOrEqual(1);

    const searched = await request(app.getHttpServer())
      .post(`/requests/${created.body.id}/search`)
      .set(authHeader(token))
      .expect(201);
    expect(searched.body.status).toBe('SEARCHED');

    const list = await request(app.getHttpServer())
      .get('/requests')
      .set(authHeader(token))
      .query({ organizationId: orgId })
      .expect(200);
    expect(list.body.total).toBeGreaterThanOrEqual(1);
  });
});
