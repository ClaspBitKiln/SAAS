import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../../../bootstrap/app.module';
import { authHeader, bootstrapE2eAuth } from '../../../../bootstrap/e2e-auth.helper';

describe('Request E2E', () => {
  let app: INestApplication;
  let token: string;

  beforeAll(async () => {
    const moduleRef = await Test.createTestingModule({ imports: [AppModule] }).compile();
    app = moduleRef.createNestApplication();
    app.useGlobalPipes(new ValidationPipe({ whitelist: true, transform: true }));
    await app.init();

    const auth = await bootstrapE2eAuth(app);
    token = auth.token;
  });

  afterAll(async () => {
    await app.close();
  });

  it('GET /requests without token returns 401', async () => {
    await request(app.getHttpServer()).get('/requests').expect(401);
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
        title: 'E2E Request',
        source: 'PASTED',
        sourceText: 'Лист 10мм 09Г2С\nТруба 57х3.5',
        lines: parsed.body.lines,
      })
      .expect(201);
    expect(created.body.lines.length).toBeGreaterThanOrEqual(1);
    expect(created.body.source).toBe('PASTED');
    expect(created.body.sourceText).toContain('Лист 10мм');

    const searched = await request(app.getHttpServer())
      .post(`/requests/${created.body.id}/search`)
      .set(authHeader(token))
      .expect(201);
    expect(searched.body.status).toBe('SEARCHED');

    const list = await request(app.getHttpServer()).get('/requests').set(authHeader(token)).expect(200);
    expect(list.body.total).toBeGreaterThanOrEqual(1);
  });

  it('rejects a quote with a follow-up date in the past', async () => {
    const created = await request(app.getHttpServer())
      .post('/requests')
      .set(authHeader(token))
      .send({
        title: 'Past follow-up E2E',
        source: 'MANUAL',
        lines: [{ rawLine: 'Лист 6 мм Ст3 — 1 т', quantity: '1', unit: 'т' }],
      })
      .expect(201);

    await request(app.getHttpServer())
      .post(`/requests/${created.body.id}/quote`)
      .set(authHeader(token))
      .send({
        lines: [{
          lineId: created.body.lines[0].id,
          purchaseAmount: 50000,
          saleAmount: 70000,
        }],
        currency: 'RUB',
        sellerName: 'ООО Мэджик Металл',
        logisticsCost: 0,
        otherCosts: 0,
        proposalValidityDays: 5,
        followUpAt: '2000-01-01T00:00:00.000Z',
      })
      .expect(400);
  });

  it('prepares quote, creates follow-up task and records proposal delivery', async () => {
    const created = await request(app.getHttpServer())
      .post('/requests')
      .set(authHeader(token))
      .send({
        title: 'Quote E2E',
        source: 'MANUAL',
        lines: [{ rawLine: 'Лист 6 мм Ст3 — 10 т', quantity: '10', unit: 'т' }],
      })
      .expect(201);

    const followUpAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();
    const quoted = await request(app.getHttpServer())
      .post(`/requests/${created.body.id}/quote`)
      .set(authHeader(token))
      .send({
        lines: [{
          lineId: created.body.lines[0].id,
          purchaseAmount: 50000,
          saleAmount: 70000,
        }],
        currency: 'RUB',
        sellerName: 'ООО Мэджик Металл',
        deliveryTerms: 'DAP Ташкент',
        logisticsCost: 2000,
        otherCosts: 1000,
        proposalValidityDays: 5,
        followUpAt,
      })
      .expect(201);

    expect(quoted.body.status).toBe('QUOTED');
    expect(quoted.body.purchaseTotal).toBe(50000);
    expect(quoted.body.saleTotal).toBe(70000);
    expect(quoted.body.profitAmount).toBe(17000);
    expect(quoted.body.marginPercent).toBe(24.29);
    expect(quoted.body.proposalNumber).toMatch(/^КП-\d{8}-/);
    expect(quoted.body.followUpAt).toBe(followUpAt);

    const tasks = await request(app.getHttpServer())
      .get('/tasks?status=OPEN&size=100')
      .set(authHeader(token))
      .expect(200);
    expect(tasks.body.items.some((task: { title: string }) => task.title.includes(quoted.body.proposalNumber))).toBe(true);

    const sent = await request(app.getHttpServer())
      .post(`/requests/${created.body.id}/sent`)
      .set(authHeader(token))
      .send({ sentVia: 'EMAIL' })
      .expect(201);
    expect(sent.body.status).toBe('SENT');
    expect(sent.body.proposalSentVia).toBe('EMAIL');
    expect(new Date(sent.body.proposalSentAt).getTime()).toBeGreaterThan(0);

    const outcome = await request(app.getHttpServer())
      .post(`/requests/${created.body.id}/outcome`)
      .set(authHeader(token))
      .send({ outcome: 'WON', reason: 'Клиент подтвердил заказ' })
      .expect(201);
    expect(outcome.body.outcome).toBe('WON');
    expect(outcome.body.outcomeReason).toBe('Клиент подтвердил заказ');
    expect(new Date(outcome.body.outcomeAt).getTime()).toBeGreaterThan(0);

    await request(app.getHttpServer())
      .post(`/requests/${created.body.id}/sent`)
      .set(authHeader(token))
      .send({ sentVia: 'EMAIL' })
      .expect(400);
  });
});
