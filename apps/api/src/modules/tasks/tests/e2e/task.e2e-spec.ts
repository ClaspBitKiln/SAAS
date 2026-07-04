import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { Test } from '@nestjs/testing';
import { INestApplication, ValidationPipe } from '@nestjs/common';
import request from 'supertest';
import { AppModule } from '../../../../bootstrap/app.module';
import { authHeader, bootstrapE2eAuth, E2eAuthContext } from '../../../../bootstrap/e2e-auth.helper';

describe('Task E2E', () => {
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

  it('creates task with assignee defaulting to creator', async () => {
    const res = await request(app.getHttpServer())
      .post('/tasks')
      .set(authHeader(authA.token))
      .send({ title: 'Позвонить по КП', dueAt: new Date().toISOString(), type: 'CALL' })
      .expect(201);
    expect(res.body.assigneeUserId).toBe(authA.userId);
    expect(res.body.status).toBe('OPEN');
    expect(res.body.type).toBe('CALL');
  });

  it('today returns overdue open tasks of current user only', async () => {
    const overdue = await request(app.getHttpServer())
      .post('/tasks')
      .set(authHeader(authA.token))
      .send({ title: 'Просроченная задача', dueAt: '2026-01-01T00:00:00.000Z' })
      .expect(201);

    const today = await request(app.getHttpServer()).get('/tasks/today').set(authHeader(authA.token)).expect(200);
    const ids = today.body.map((t: { id: string }) => t.id);
    expect(ids).toContain(overdue.body.id);

    const todayB = await request(app.getHttpServer()).get('/tasks/today').set(authHeader(authB.token)).expect(200);
    const idsB = todayB.body.map((t: { id: string }) => t.id);
    expect(idsB).not.toContain(overdue.body.id);
  });

  it('complete removes task from today and sets DONE', async () => {
    const created = await request(app.getHttpServer())
      .post('/tasks')
      .set(authHeader(authA.token))
      .send({ title: 'Сделать и закрыть', dueAt: '2026-01-02T00:00:00.000Z' })
      .expect(201);

    const done = await request(app.getHttpServer())
      .patch(`/tasks/${created.body.id}/complete`)
      .set(authHeader(authA.token))
      .expect(200);
    expect(done.body.status).toBe('DONE');
    expect(done.body.completedAt).not.toBeNull();

    await request(app.getHttpServer())
      .patch(`/tasks/${created.body.id}/complete`)
      .set(authHeader(authA.token))
      .expect(400);

    const today = await request(app.getHttpServer()).get('/tasks/today').set(authHeader(authA.token)).expect(200);
    const ids = today.body.map((t: { id: string }) => t.id);
    expect(ids).not.toContain(created.body.id);
  });

  it('rejects cross-org contact link with 404', async () => {
    const contactB = await request(app.getHttpServer())
      .post('/contacts')
      .set(authHeader(authB.token))
      .send({ name: 'Foreign Contact' })
      .expect(201);

    await request(app.getHttpServer())
      .post('/tasks')
      .set(authHeader(authA.token))
      .send({ title: 'Связь с чужим контактом', dueAt: new Date().toISOString(), contactId: contactB.body.id })
      .expect(404);
  });

  it('rejects cross-org task access with 404 and unauthenticated with 401', async () => {
    const created = await request(app.getHttpServer())
      .post('/tasks')
      .set(authHeader(authA.token))
      .send({ title: 'Приватная задача', dueAt: new Date().toISOString() })
      .expect(201);

    await request(app.getHttpServer()).get(`/tasks/${created.body.id}`).set(authHeader(authB.token)).expect(404);
    await request(app.getHttpServer()).get('/tasks/today').expect(401);
  });
});
