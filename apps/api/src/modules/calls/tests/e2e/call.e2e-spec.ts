import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../../../bootstrap/app.module';
import { authHeader, bootstrapE2eAuth } from '../../../../bootstrap/e2e-auth.helper';
import { CallDirectionEnum } from '../../domain/value-objects/call-direction.vo';
import { CallStatusEnum } from '../../domain/value-objects/call-status.vo';

describe('Call E2E', () => {
  let app: INestApplication;
  let token: string;
  let contactId: string;
  let orgId: string;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();

    const auth = await bootstrapE2eAuth(app);
    token = auth.token;
    orgId = auth.orgId;

    const contactRes = await request(app.getHttpServer())
      .post('/contacts')
      .set(authHeader(token))
      .send({ organizationId: orgId, name: 'Call Contact', phone: '+79991234567' })
      .expect(201);
    contactId = contactRes.body.id;
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /calls without token returns 401', async () => {
    await request(app.getHttpServer()).get('/calls').query({ contactId }).expect(401);
  });

  it('POST /calls start → complete flow', async () => {
    const res = await request(app.getHttpServer())
      .post('/calls')
      .set(authHeader(token))
      .send({ contactId, direction: CallDirectionEnum.OUTBOUND, phone: '+79991234567' })
      .expect(201);
    expect(res.body.status).toBe(CallStatusEnum.RINGING);
    expect(res.body.contactId).toBe(contactId);

    const completed = await request(app.getHttpServer())
      .patch(`/calls/${res.body.id}/complete`)
      .set(authHeader(token))
      .expect(200);
    expect(completed.body.status).toBe(CallStatusEnum.COMPLETED);
    expect(completed.body.durationSec).not.toBeNull();
  });

  it('POST /calls start → miss flow', async () => {
    const res = await request(app.getHttpServer())
      .post('/calls')
      .set(authHeader(token))
      .send({ contactId, direction: CallDirectionEnum.INBOUND, phone: '+79990001122' })
      .expect(201);

    const missed = await request(app.getHttpServer())
      .patch(`/calls/${res.body.id}/miss`)
      .set(authHeader(token))
      .expect(200);
    expect(missed.body.status).toBe(CallStatusEnum.MISSED);
  });

  it('GET /calls lists by contact and organization', async () => {
    await request(app.getHttpServer())
      .post('/calls')
      .set(authHeader(token))
      .send({ contactId, direction: CallDirectionEnum.OUTBOUND, phone: '+79991112233' })
      .expect(201);

    const byContact = await request(app.getHttpServer())
      .get('/calls')
      .set(authHeader(token))
      .query({ contactId })
      .expect(200);
    expect(byContact.body.total).toBeGreaterThanOrEqual(1);

    const byOrg = await request(app.getHttpServer())
      .get('/calls')
      .set(authHeader(token))
      .query({ organizationId: orgId })
      .expect(200);
    expect(byOrg.body.total).toBeGreaterThanOrEqual(1);
  });

  it('POST /calls rejects unknown contact', async () => {
    await request(app.getHttpServer())
      .post('/calls')
      .set(authHeader(token))
      .send({
        contactId: '0192a1b2-c3d4-7890-abcd-ef1234567890',
        direction: CallDirectionEnum.OUTBOUND,
        phone: '+79991234567',
      })
      .expect(400);
  });
});
