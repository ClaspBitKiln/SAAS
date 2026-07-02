import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { PlatformModule } from '../../platform.module';

describe('Organization E2E', () => {
  let app: INestApplication;
  let tenantId: string;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [PlatformModule] }).compile();
    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();

    const tenantRes = await request(app.getHttpServer())
      .post('/tenants')
      .send({ name: 'E2E Tenant Org', slug: `e2e-tenant-org-${Date.now()}` })
      .expect(201);
    tenantId = tenantRes.body.id;
  });

  afterAll(async () => {
    await app.close();
  });

  it('POST /organizations создаёт организацию', async () => {
    const res = await request(app.getHttpServer())
      .post('/organizations')
      .send({ tenantId, name: 'E2E Organization', inn: '7707083893' })
      .expect(201);
    expect(res.body.id).toBeDefined();
    expect(res.body.name).toBe('E2E Organization');
    expect(res.body.inn).toBe('7707083893');

    await request(app.getHttpServer())
      .patch(`/organizations/${res.body.id}`)
      .send({ name: 'E2E Org Updated' })
      .expect(200);
  });

  it('POST /organizations отклоняет невалидный inn', async () => {
    await request(app.getHttpServer())
      .post('/organizations')
      .send({ tenantId, name: 'Bad Inn Org', inn: '123' })
      .expect(400);
  });

  it('POST /organizations отклоняет несуществующий tenantId', async () => {
    await request(app.getHttpServer())
      .post('/organizations')
      .send({
        tenantId: '0192a1b2-c3d4-7890-abcd-ef1234567890',
        name: 'Ghost Org',
      })
      .expect(400);
  });
});
