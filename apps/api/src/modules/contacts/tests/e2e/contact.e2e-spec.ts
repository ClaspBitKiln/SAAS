import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../../../bootstrap/app.module';

describe('Contact E2E', () => {
  let app: INestApplication;
  let tenantId: string;
  let orgId: string;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();

    const tenantRes = await request(app.getHttpServer())
      .post('/tenants')
      .send({ name: 'E2E Contact Tenant', slug: `e2e-contact-${Date.now()}` })
      .expect(201);
    tenantId = tenantRes.body.id;

    const orgRes = await request(app.getHttpServer())
      .post('/organizations')
      .send({ tenantId, name: 'E2E Contact Org' })
      .expect(201);
    orgId = orgRes.body.id;
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /contacts CRUD flow', async () => {
    const res = await request(app.getHttpServer())
      .post('/contacts')
      .send({ organizationId: orgId, name: 'Jane Doe', email: 'jane@example.com', phone: '+79991234567' })
      .expect(201);
    expect(res.body.name).toBe('Jane Doe');
    expect(res.body.tenantId).toBe(tenantId);

    await request(app.getHttpServer())
      .patch(`/contacts/${res.body.id}`)
      .send({ name: 'Jane Updated' })
      .expect(200);

    const list = await request(app.getHttpServer()).get('/contacts').query({ organizationId: orgId }).expect(200);
    expect(list.body.total).toBeGreaterThanOrEqual(1);

    await request(app.getHttpServer()).delete(`/contacts/${res.body.id}`).expect(200);
    await request(app.getHttpServer()).get(`/contacts/${res.body.id}`).expect(404);
  });

  it('POST /contacts rejects unknown organization', async () => {
    await request(app.getHttpServer())
      .post('/contacts')
      .send({
        organizationId: '0192a1b2-c3d4-7890-abcd-ef1234567890',
        name: 'Ghost',
      })
      .expect(400);
  });
});
