import { Injectable } from '@nestjs/common';
import { EMetallIntegrationService } from '../../../e-metall/application/services/e-metall-integration.service';
import { EMetallParsedLineDto } from '../../../e-metall/application/dto/e-metall.dto';
import { RequestLineDto } from '../dto/request.dto';

@Injectable()
export class RequestParseService {
  constructor(private readonly eMetall: EMetallIntegrationService) {}

  async parseRawText(rawText: string): Promise<{ lines: RequestLineDto[]; parser: 'e-metall' | 'fallback' }> {
    const result = await this.eMetall.parse({ rawText });
    if (result.status === 'OK' && result.lines.length > 0) {
      return { lines: result.lines.map((l) => this.toLineDto(l)), parser: 'e-metall' };
    }
    return { lines: this.fallbackParse(rawText), parser: 'fallback' };
  }

  parseFileBuffer(buffer: Buffer, mimeType: string, fileName: string): Promise<{ lines: RequestLineDto[]; parser: 'e-metall' | 'fallback' }> {
    const textTypes = ['text/plain', 'text/csv', 'application/csv'];
    if (textTypes.includes(mimeType) || fileName.endsWith('.txt') || fileName.endsWith('.csv')) {
      return this.parseRawText(buffer.toString('utf-8'));
    }
    return this.parseRawText(`[file:${fileName}] ${buffer.toString('utf-8', 0, Math.min(buffer.length, 8000))}`);
  }

  private fallbackParse(rawText: string): RequestLineDto[] {
    return rawText
      .split(/\r?\n/)
      .map((line) => line.trim())
      .filter(Boolean)
      .map((rawLine) => ({ rawLine }));
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
