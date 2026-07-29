import { describe, it, expect } from 'vitest';
import ExcelJS from 'exceljs';
import { RequestParseService } from '../../application/services/request-parse.service';
import { EMetallIntegrationService } from '../../../e-metall/application/services/e-metall-integration.service';
import { HttpEMetallApiClient } from '../../../e-metall/infrastructure/e-metall-api.client';

function createTextPdf(text: string): Buffer {
  const stream = `BT /F1 12 Tf 72 720 Td (${text}) Tj ET`;
  const objects = [
    '<< /Type /Catalog /Pages 2 0 R >>',
    '<< /Type /Pages /Kids [3 0 R] /Count 1 >>',
    '<< /Type /Page /Parent 2 0 R /MediaBox [0 0 612 792] /Resources << /Font << /F1 4 0 R >> >> /Contents 5 0 R >>',
    '<< /Type /Font /Subtype /Type1 /BaseFont /Helvetica >>',
    `<< /Length ${Buffer.byteLength(stream)} >>\nstream\n${stream}\nendstream`,
  ];
  let pdf = '%PDF-1.4\n';
  const offsets = [0];
  for (const [index, object] of objects.entries()) {
    offsets.push(Buffer.byteLength(pdf));
    pdf += `${index + 1} 0 obj\n${object}\nendobj\n`;
  }
  const xrefOffset = Buffer.byteLength(pdf);
  pdf += `xref\n0 ${objects.length + 1}\n0000000000 65535 f \n`;
  pdf += offsets
    .slice(1)
    .map((offset) => `${String(offset).padStart(10, '0')} 00000 n \n`)
    .join('');
  pdf += `trailer\n<< /Size ${objects.length + 1} /Root 1 0 R >>\nstartxref\n${xrefOffset}\n%%EOF`;
  return Buffer.from(pdf);
}

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
      recognitionConfidence: 100,
      reviewWarnings: [],
    });
    expect(result.lines[1]).toMatchObject({
      productType: 'Труба',
      steelGrade: 'Ст20',
      dimensions: '57х3,5',
      quantity: '200',
      unit: 'м',
      recognitionConfidence: 100,
      reviewWarnings: [],
    });
  });

  it('reports deterministic completeness and missing fields for manager review', async () => {
    const result = await service.parseRawText('Лист 09Г2С');

    expect(result.lines[0]).toMatchObject({
      productType: 'Лист',
      steelGrade: '09Г2С',
      recognitionConfidence: 40,
      reviewWarnings: ['dimensions', 'quantity', 'unit'],
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

  it('extracts text from a PDF text layer for manager review', async () => {
    const result = await service.parseFileBuffer(
      createTextPdf('AISI 304 10 kg'),
      'application/pdf',
      'request.pdf',
    );

    expect(result.sourceFileName).toBe('request.pdf');
    expect(result.sourceText).toContain('AISI 304 10 kg');
    expect(result.lines[0]).toMatchObject({ steelGrade: 'AISI 304', rawLine: 'AISI 304 10 kg' });
  });

  it('rejects a corrupt PDF file', async () => {
    await expect(
      service.parseFileBuffer(Buffer.from('%PDF binary'), 'application/pdf', 'request.pdf'),
    ).rejects.toThrow('Invalid request file');
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

  it('extracts request lines from an XLSX workbook for review', async () => {
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet('Заявка');
    sheet.addRow(['Наименование', 'Количество']);
    sheet.addRow(['Лист 5х1500х6000 09Г2С ГОСТ 19281-2014', '10 т']);
    sheet.addRow(['Труба 57х3,5 Ст20', '200 м']);
    const buffer = Buffer.from(await workbook.xlsx.writeBuffer());

    const result = await service.parseFileBuffer(
      buffer,
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'заявка.xlsx',
    );

    expect(result.sourceFileName).toBe('заявка.xlsx');
    expect(result.sourceText).toContain('Лист 5х1500х6000 09Г2С');
    expect(result.lines).toHaveLength(2);
    expect(result.lines[0]).toMatchObject({
      productType: 'Лист',
      steelGrade: '09Г2С',
      quantity: '10',
      unit: 'т',
    });
  });

  it('rejects a corrupt XLSX file', async () => {
    await expect(
      service.parseFileBuffer(
        Buffer.from('not an xlsx archive'),
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'заявка.xlsx',
      ),
    ).rejects.toThrow('Invalid request file');
  });
});
