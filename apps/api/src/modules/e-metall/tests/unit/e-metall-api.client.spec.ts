import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { HttpEMetallApiClient } from '../../infrastructure/e-metall-api.client';

describe('HttpEMetallApiClient', () => {
  const env = process.env;

  beforeEach(() => {
    process.env = { ...env, EMETALL_ENABLED: 'false' };
  });

  afterEach(() => {
    process.env = env;
  });

  it('filter returns NOT_CONFIGURED when disabled', async () => {
    const client = new HttpEMetallApiClient();
    const result = await client.filter({ rawText: 'нужен лист 10мм' });
    expect(result.status).toBe('NOT_CONFIGURED');
    expect(result.relevant).toBe(false);
  });

  it('parse returns empty lines when disabled', async () => {
    const client = new HttpEMetallApiClient();
    const result = await client.parse({ rawText: 'ГОСТ 19903 лист 10х1500х6000' });
    expect(result.status).toBe('NOT_CONFIGURED');
    expect(result.lines).toEqual([]);
  });

  it('search returns empty offers when disabled', async () => {
    const client = new HttpEMetallApiClient();
    const result = await client.search({ lines: [{ steelGrade: '09Г2С', thickness: '10' }] });
    expect(result.status).toBe('NOT_CONFIGURED');
    expect(result.offers).toEqual([]);
  });
});
