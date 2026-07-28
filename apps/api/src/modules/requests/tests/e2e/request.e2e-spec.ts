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

    const list = await request(app.getHttpServer()).get('/requests').set(authHeader(token)).expect(200);
    expect(list.body.total).toBeGreaterThanOrEqual(1);
  });

  it('prepares quote, calculates profit and creates follow-up task', async () => {
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
  });
});
