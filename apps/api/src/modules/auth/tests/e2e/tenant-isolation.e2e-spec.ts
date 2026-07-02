import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../../../bootstrap/app.module';
import { authHeader, bootstrapE2eAuth } from '../../../../bootstrap/e2e-auth.helper';
import { CallDirectionEnum } from '../../../calls/domain/value-objects/call-direction.vo';

describe('Tenant isolation E2E', () => {
  let app: INestApplication;
  let tokenA: string;
  let orgIdA: string;
  let tokenB: string;
  let orgIdB: string;
  let contactBId: string;
  let callBId: string;
  let requestBId: string;
  let companyBId: string;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();

    const authA = await bootstrapE2eAuth(app);
    tokenA = authA.token;
    orgIdA = authA.orgId;

    const authB = await bootstrapE2eAuth(app);
    tokenB = authB.token;
    orgIdB = authB.orgId;

    const contactB = await request(app.getHttpServer())
      .post('/contacts')
      .set(authHeader(tokenB))
      .send({ name: 'Tenant B Contact', phone: '+79990000001' })
      .expect(201);
    contactBId = contactB.body.id;

    const callB = await request(app.getHttpServer())
      .post('/calls')
      .set(authHeader(tokenB))
      .send({ contactId: contactBId, direction: CallDirectionEnum.OUTBOUND, phone: '+79990000001' })
      .expect(201);
    callBId = callB.body.id;

    const requestB = await request(app.getHttpServer())
      .post('/requests')
      .set(authHeader(tokenB))
      .send({ title: 'Tenant B Request', source: 'MANUAL', lines: [{ rawLine: 'Лист 10мм' }] })
      .expect(201);
    requestBId = requestB.body.id;

    const companyB = await request(app.getHttpServer())
      .post('/companies')
      .set(authHeader(tokenB))
      .send({ name: 'Tenant B Company', inn: '3664069397' })
      .expect(201);
    companyBId = companyB.body.id;
  });

  afterAll(async () => {
    await app.close();
  });

  it('tenant A cannot GET contact from tenant B by id', async () => {
    await request(app.getHttpServer()).get(`/contacts/${contactBId}`).set(authHeader(tokenA)).expect(404);
  });

  it('tenant A cannot GET call from tenant B by id', async () => {
    await request(app.getHttpServer()).get(`/calls/${callBId}`).set(authHeader(tokenA)).expect(404);
  });

  it('tenant A cannot GET request from tenant B by id', async () => {
    await request(app.getHttpServer()).get(`/requests/${requestBId}`).set(authHeader(tokenA)).expect(404);
  });

  it('tenant A cannot GET company from tenant B by id', async () => {
    await request(app.getHttpServer()).get(`/companies/${companyBId}`).set(authHeader(tokenA)).expect(404);
  });

  it('tenant A list ignores foreign organizationId query and returns only own org', async () => {
    await request(app.getHttpServer())
      .post('/contacts')
      .set(authHeader(tokenA))
      .send({ name: 'Tenant A Contact', phone: '+79990000002' })
      .expect(201);

    const list = await request(app.getHttpServer())
      .get('/contacts')
      .set(authHeader(tokenA))
      .query({ organizationId: orgIdB })
      .expect(200);

    expect(list.body.items.every((c: { organizationId: string }) => c.organizationId === orgIdA)).toBe(true);
    expect(list.body.items.some((c: { id: string }) => c.id === contactBId)).toBe(false);
  });

  it('tenant A cannot mutate tenant B contact', async () => {
    await request(app.getHttpServer())
      .patch(`/contacts/${contactBId}`)
      .set(authHeader(tokenA))
      .send({ name: 'Hijacked' })
      .expect(404);

    await request(app.getHttpServer()).delete(`/contacts/${contactBId}`).set(authHeader(tokenA)).expect(404);
  });

  it('tenant A cannot mutate tenant B company', async () => {
    await request(app.getHttpServer())
      .patch(`/companies/${companyBId}`)
      .set(authHeader(tokenA))
      .send({ name: 'Hijacked' })
      .expect(404);

    await request(app.getHttpServer()).delete(`/companies/${companyBId}`).set(authHeader(tokenA)).expect(404);
  });

  it('tenant A cannot start call on tenant B contact', async () => {
    await request(app.getHttpServer())
      .post('/calls')
      .set(authHeader(tokenA))
      .send({ contactId: contactBId, direction: CallDirectionEnum.OUTBOUND, phone: '+79990000001' })
      .expect(400);
  });
});
