import { describe, it, expect, beforeEach, afterEach } from 'vitest';
import { isEMetallConfigured, loadEMetallConfig } from '../../infrastructure/e-metall.config';

describe('EMetallConfig', () => {
  const env = process.env;

  beforeEach(() => {
    process.env = { ...env };
  });

  afterEach(() => {
    process.env = env;
  });

  it('returns not configured when disabled', () => {
    process.env.EMETALL_ENABLED = 'false';
    process.env.EMETALL_API_KEY = 'secret';
    const config = loadEMetallConfig();
    expect(isEMetallConfigured(config)).toBe(false);
  });

  it('returns configured when enabled with api key', () => {
    process.env.EMETALL_ENABLED = 'true';
    process.env.EMETALL_API_KEY = 'secret';
    const config = loadEMetallConfig();
    expect(isEMetallConfigured(config)).toBe(true);
  });
});
