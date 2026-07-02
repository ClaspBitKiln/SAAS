import { describe, it, expect } from 'vitest';
import { RequestParseService } from '../../application/services/request-parse.service';
import { EMetallIntegrationService } from '../../../e-metall/application/services/e-metall-integration.service';
import { HttpEMetallApiClient } from '../../../e-metall/infrastructure/e-metall-api.client';

describe('RequestParseService fallback', () => {
  const service = new RequestParseService(
    new EMetallIntegrationService(new HttpEMetallApiClient()),
  );

  it('splits multiline text into raw lines', async () => {
    const result = await service.parseRawText('Лист 10мм\nТруба 57х3.5');
    expect(result.parser).toBe('fallback');
    expect(result.lines).toHaveLength(2);
    expect(result.lines[0].rawLine).toBe('Лист 10мм');
  });
});
