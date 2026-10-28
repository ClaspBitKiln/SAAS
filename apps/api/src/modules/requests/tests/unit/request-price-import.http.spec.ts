import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { Test } from '@nestjs/testing';
import { INestApplication } from '@nestjs/common';
import { CommandBus, QueryBus } from '@nestjs/cqrs';
import request from 'supertest';
import { RequestController } from '../../presentation/controllers/request.controller';
import { RequestParseService } from '../../application/services/request-parse.service';
import { ProposalEmailService } from '../../application/services/proposal-email.service';

// Isolated HTTP adapter test; authentication and persistence belong to the E2E suite.
describe('Price import HTTP adapter', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      controllers: [RequestController],
      providers: [
        { provide: CommandBus, useValue: {} },
        { provide: QueryBus, useValue: {} },
        { provide: ProposalEmailService, useValue: {} },
        { provide: RequestParseService, useValue: new RequestParseService({} as never) },
      ],
    }).compile();
    app = module.createNestApplication();
    await app.init();
  });

  afterAll(async () => { await app?.close(); });

  it('returns 400 for a signed supplier price rather than a successful changed price', async () => {
    const response = await request(app.getHttpServer())
      .post('/requests/prices/file')
      .attach('file', Buffer.from('Наименование;Закупочная цена\nЛист;-100'), 'prices.csv')
      .expect(400);
    expect(response.body.message).toBe('Invalid price file');
  });

  it('returns exact amounts for an unambiguous localized price file', async () => {
    const response = await request(app.getHttpServer())
      .post('/requests/prices/file')
      .attach('file', Buffer.from('Наименование;Закупочная цена\nЛист;75 500,50'), 'prices.csv')
      .expect(201);
    expect(response.body.lines).toEqual([{ description: 'Лист', purchaseAmount: 75500.5 }]);
  });
});
