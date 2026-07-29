import { describe, it, expect } from 'vitest';
import { RequestParseService } from '../../application/services/request-parse.service';
import { EMetallIntegrationService } from '../../../e-metall/application/services/e-metall-integration.service';
import { HttpEMetallApiClient } from '../../../e-metall/infrastructure/e-metall-api.client';

describe('RequestParseService built-in parser', () => {
  const service = new RequestParseService(
    new EMetallIntegrationService(new HttpEMetallApiClient()),
  );

  it('splits multiline text into raw lines', async () => {
    const result = await service.parseRawText('Лист 10мм\nТруба 57х3.5');
    expect(result.parser).toBe('built-in');
    expect(result.lines).toHaveLength(2);
    expect(result.lines[0].rawLine).toBe('Лист 10мм');
  });

  it('extracts metal product fields and ignores greeting lines', async () => {
    const result = await service.parseRawText(
      [
        'Добрый день!',
        'Просим дать цену на следующие позиции:',
        '1. Лист 5х1500х6000 09Г2С ГОСТ 19281-2014 — 10 т',
        '2. Труба 57х3,5 Ст20 — 200 м',
        'Доставка: Ташкент',
      ].join('\n'),
    );

    expect(result.lines).toHaveLength(2);
    expect(result.lines[0]).toMatchObject({
      productType: 'Лист',
      steelGrade: '09Г2С',
      gost: 'ГОСТ 19281-2014',
      dimensions: '5х1500х6000',
      thickness: '5',
      quantity: '10',
      unit: 'т',
    });
    expect(result.lines[1]).toMatchObject({
      productType: 'Труба',
      steelGrade: 'Ст20',
      dimensions: '57х3,5',
      quantity: '200',
      unit: 'м',
    });
  });

  it('recognizes casing steel grades and metric quantity', async () => {
    const result = await service.parseRawText(
      'Труба обсадная 13-3/8" K55 BTC — 200 метров',
    );

    expect(result.lines[0]).toMatchObject({
      productType: 'Труба',
      steelGrade: 'K55',
      quantity: '200',
      unit: 'м',
    });
  });

  it('rejects binary formats until a reliable extractor is configured', async () => {
    await expect(
      service.parseFileBuffer(Buffer.from('%PDF binary'), 'application/pdf', 'request.pdf'),
    ).rejects.toThrow('Unsupported request file type');
  });

  it('retains extracted text and file name for manager review', async () => {
    const sourceText = 'Лист 5х1500х6000 09Г2С — 10 т';
    const result = await service.parseFileBuffer(
      Buffer.from(sourceText),
      'text/plain',
      'заявка клиента.txt',
    );

    expect(result.sourceText).toBe(sourceText);
    expect(result.sourceFileName).toBe('заявка клиента.txt');
    expect(result.lines[0]).toMatchObject({ steelGrade: '09Г2С', quantity: '10', unit: 'т' });
  });
});
