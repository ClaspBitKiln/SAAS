export interface EMetallConfig {
  enabled: boolean;
  baseUrl: string;
  apiKey: string;
  webhookSecret: string;
}

export function loadEMetallConfig(): EMetallConfig {
  const apiKey = process.env.EMETALL_API_KEY ?? '';
  const enabled = process.env.EMETALL_ENABLED === 'true';
  return {
    enabled,
    baseUrl: process.env.EMETALL_API_BASE_URL ?? 'https://api.e-metall.example/v1',
    apiKey,
    webhookSecret: process.env.EMETALL_WEBHOOK_SECRET ?? '',
  };
}

export function isEMetallConfigured(config: EMetallConfig): boolean {
  return config.enabled && config.apiKey.length > 0;
}
