import { Injectable } from '@nestjs/common';
import ExcelJS from 'exceljs';
import { PDFParse } from 'pdf-parse';
import { EMetallIntegrationService } from '../../../e-metall/application/services/e-metall-integration.service';
import { EMetallParsedLineDto } from '../../../e-metall/application/dto/e-metall.dto';
import { RequestLineDto } from '../dto/request.dto';

const PRODUCT_TYPES: Array<[RegExp, string]> = [
  [/(?<![А-Яа-яЁё])лист(?:ы|овой|овая)?(?![А-Яа-яЁё])/iu, 'Лист'],
  [/(?<![А-Яа-яЁё])труб(?:а|ы|у|ой)(?![А-Яа-яЁё])/iu, 'Труба'],
  [/(?<![А-Яа-яЁё])швеллер(?![А-Яа-яЁё])/iu, 'Швеллер'],
  [/(?<![А-Яа-яЁё])(?:двутавр|балка)(?![А-Яа-яЁё])/iu, 'Балка'],
  [/(?<![А-Яа-яЁё])уголок(?![А-Яа-яЁё])/iu, 'Уголок'],
  [/(?<![А-Яа-яЁё])круг(?![А-Яа-яЁё])/iu, 'Круг'],
  [/(?<![А-Яа-яЁё])арматур(?:а|ы)(?![А-Яа-яЁё])/iu, 'Арматура'],
  [/(?<![А-Яа-яЁё])полос(?:а|ы)(?![А-Яа-яЁё])/iu, 'Полоса'],
  [/(?<![А-Яа-яЁё])рулон(?![А-Яа-яЁё])/iu, 'Рулон'],
  [/(?<![А-Яа-яЁё])проволок(?:а|и)(?![А-Яа-яЁё])/iu, 'Проволока'],
];

const UNIT_ALIASES: Array<[RegExp, string]> = [
  [/(?:т|тн|тонн(?:а|ы)?)\.?/iu, 'т'],
  [/(?:кг|килограмм(?:а|ов)?)\.?/iu, 'кг'],
  [/(?:шт|штук(?:а|и)?)\.?/iu, 'шт'],
  [/(?:м2|м²|кв\.?\s*м)\.?/iu, 'м²'],
  [/(?:м|мп|п\.?\s*м\.?|метр(?:а|ов)?)\.?/iu, 'м'],
  [/(?:компл(?:ект(?:а|ов)?)?)\.?/iu, 'компл.'],
];

@Injectable()
export class RequestParseService {
  constructor(private readonly eMetall: EMetallIntegrationService) {}

  async parseRawText(rawText: string): Promise<{ lines: RequestLineDto[]; parser: 'e-metall' | 'built-in' }> {
    const result = await this.eMetall.parse({ rawText });
    if (result.status === 'OK' && result.lines.length > 0) {
      return { lines: result.lines.map((l) => this.toLineDto(l)), parser: 'e-metall' };
    }
    return { lines: this.builtInParse(rawText), parser: 'built-in' };
  }

  async parseFileBuffer(
    buffer: Buffer,
    mimeType: string,
    fileName: string,
  ): Promise<{
    lines: RequestLineDto[];
    parser: 'e-metall' | 'built-in';
    sourceText: string;
    sourceFileName: string;
  }> {
    const textTypes = ['text/plain', 'text/csv', 'application/csv'];
    const normalizedFileName = fileName.toLowerCase();
    if (
      textTypes.includes(mimeType) ||
      normalizedFileName.endsWith('.txt') ||
      normalizedFileName.endsWith('.csv')
    ) {
      const sourceText = buffer.toString('utf-8');
      const parsed = await this.parseRawText(sourceText);
      return { ...parsed, sourceText, sourceFileName: fileName };
    }
    if (
      mimeType === 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' ||
      normalizedFileName.endsWith('.xlsx')
    ) {
      let sourceText: string;
      try {
        sourceText = await this.extractWorkbookText(buffer);
      } catch {
        throw new Error('Invalid request file');
      }
      const parsed = await this.parseRawText(sourceText);
      return { ...parsed, sourceText, sourceFileName: fileName };
    }
    if (mimeType === 'application/pdf' || normalizedFileName.endsWith('.pdf')) {
      let sourceText: string;
      try {
        sourceText = await this.extractPdfText(buffer);
      } catch {
        throw new Error('Invalid request file');
      }
      if (!sourceText) throw new Error('PDF has no text layer');
      const parsed = await this.parseRawText(sourceText);
      return { ...parsed, sourceText, sourceFileName: fileName };
    }
    throw new Error('Unsupported request file type');
  }

  private async extractWorkbookText(buffer: Buffer): Promise<string> {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer as unknown as Parameters<typeof workbook.xlsx.load>[0]);
    const rows: string[] = [];

    workbook.eachSheet((worksheet) => {
      worksheet.eachRow((row) => {
        const cells: string[] = [];
        row.eachCell((cell) => {
          const text = cell.text.trim();
          if (text) cells.push(text);
        });
        if (cells.length > 0) rows.push(cells.join(' '));
      });
    });

    return rows.join('\n');
  }

  private async extractPdfText(buffer: Buffer): Promise<string> {
    const parser = new PDFParse({ data: buffer });
    try {
      const result = await parser.getText();
      return result.text.trim();
    } finally {
      await parser.destroy();
    }
  }

  private builtInParse(rawText: string): RequestLineDto[] {
    const rows = rawText
      .split(/\r?\n/)
      .map((line) => line.replace(/^\s*(?:[-–—•*]|\d+[.)])\s*/, '').trim())
      .filter(Boolean);
    const candidates = rows.filter((line) => this.looksLikeProductLine(line));
    return (candidates.length > 0 ? candidates : rows).map((rawLine) => this.parseLine(rawLine));
  }

  private looksLikeProductLine(line: string): boolean {
    return (
      PRODUCT_TYPES.some(([pattern]) => pattern.test(line)) ||
      /(?<![А-Яа-яЁё])(?:ГОСТ|ТУ|ОСТ)(?![А-Яа-яЁё])/iu.test(line) ||
      /(?:\d+(?:[.,]\d+)?\s*[xх×*]\s*){1,2}\d+(?:[.,]\d+)?/u.test(line) ||
      (this.extractGrade(line) != null && this.extractQuantity(line) != null)
    );
  }

  private parseLine(rawLine: string): RequestLineDto {
    const productType = PRODUCT_TYPES.find(([pattern]) => pattern.test(rawLine))?.[1];
    const dimensions = rawLine.match(
      /\b\d+(?:[.,]\d+)?\s*[xх×*]\s*\d+(?:[.,]\d+)?(?:\s*[xх×*]\s*\d+(?:[.,]\d+)?)?\b/u,
    )?.[0].replace(/\s*[xх×*]\s*/gu, 'х');
    const explicitThickness = rawLine.match(
      /(?:толщин(?:а|ой)?|толщ\.?|s)\s*[:=]?\s*(\d+(?:[.,]\d+)?)\s*(?:мм)?/iu,
    )?.[1];
    const thickness =
      explicitThickness ??
      (productType === 'Лист' && dimensions ? dimensions.split('х')[0] : undefined);
    const quantity = this.extractQuantity(rawLine);

    return {
      rawLine,
      productType,
      steelGrade: this.extractGrade(rawLine) ?? undefined,
      gost: rawLine.match(
        /(?<![А-Яа-яЁё])(?:ГОСТ|ТУ|ОСТ)\s*[A-ZА-Я0-9./-]+/iu,
      )?.[0],
      dimensions,
      thickness: thickness?.replace(',', '.'),
      quantity: quantity?.value,
      unit: quantity?.unit,
    };
  }

  private extractGrade(line: string): string | null {
    return (
      line.match(/\bAISI\s*\d{3,4}[A-Z]?\b/iu)?.[0].toUpperCase() ??
      line
        .match(/(?<![0-9A-Za-zА-Яа-яЁё])Ст\s*\d{1,2}(?:кп|пс|сп)?(?![0-9A-Za-zА-Яа-яЁё])/iu)?.[0]
        .replace(/\s+/g, '') ??
      line.match(
        /(?<![0-9A-Za-zА-Яа-яЁё])\d{1,2}(?:Х|Г|Н|М|Ф|С|Ю|Т|В|Д|Б|Р|К|Ц)[0-9А-Я]*(?![0-9A-Za-zА-Яа-яЁё])/u,
      )?.[0] ??
      line.match(/\b(?:K55|L80|P110|N80|J55|Q125)\b/iu)?.[0].toUpperCase() ??
      null
    );
  }

  private extractQuantity(line: string): { value: string; unit: string } | null {
    for (const [unitPattern, unit] of UNIT_ALIASES) {
      const match = line.match(new RegExp(`(\\d+(?:[.,]\\d+)?)\\s*(${unitPattern.source})(?=\\s|$|[,;.)])`, 'iu'));
      if (match) return { value: match[1].replace(',', '.'), unit };
    }
    return null;
  }

  private toLineDto(line: EMetallParsedLineDto): RequestLineDto {
    return {
      gost: line.gost,
      steelGrade: line.steelGrade,
      productType: line.productType,
      dimensions: line.dimensions,
      length: line.length,
      thickness: line.thickness,
      coating: line.coating,
      quantity: line.quantity,
      unit: line.unit,
      rawLine: line.rawLine,
    };
  }
}
