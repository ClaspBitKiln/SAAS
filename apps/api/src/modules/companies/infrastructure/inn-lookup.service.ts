import { Injectable } from '@nestjs/common';
import { request } from 'node:https';

/** Result of an EGRUL lookup by INN (self-filling, PRODUCT_PRINCIPLES #11). */
export interface InnLookupResult {
  configured: boolean;
  found: boolean;
  inn?: string;
  name?: string;
  fullName?: string;
  ogrn?: string;
  kpp?: string;
  address?: string;
  status?: string;
  managementName?: string;
  managementPost?: string;
}

interface DaDataParty {
  data?: {
    inn?: string;
    kpp?: string;
    ogrn?: string;
    name?: { short_with_opf?: string; full_with_opf?: string };
    state?: { status?: string };
    address?: { unrestricted_value?: string };
    management?: { name?: string; post?: string };
  };
}

interface DaDataResponse {
  suggestions?: DaDataParty[];
}

/** Pure mapper — unit-tested without network. */
export function mapDaDataParty(json: DaDataResponse): InnLookupResult {
  const party = json.suggestions?.[0];
  if (!party?.data) return { configured: true, found: false };
  const d = party.data;
  return {
    configured: true,
    found: true,
    inn: d.inn,
    name: d.name?.short_with_opf ?? d.name?.full_with_opf,
    fullName: d.name?.full_with_opf,
    ogrn: d.ogrn,
    kpp: d.kpp,
    address: d.address?.unrestricted_value,
    status: d.state?.status,
    managementName: d.management?.name,
    managementPost: d.management?.post,
  };
}

function httpPostJson(url: string, headers: Record<string, string>, body: string): Promise<string> {
  return new Promise((resolve, reject) => {
    const req = request(url, { method: 'POST', headers }, (res) => {
      const chunks: Buffer[] = [];
      res.on('data', (c: Buffer) => chunks.push(c));
      res.on('end', () => {
        const text = Buffer.concat(chunks).toString('utf8');
        if ((res.statusCode ?? 500) >= 400) {
          reject(new Error(`INN lookup HTTP ${res.statusCode}`));
          return;
        }
        resolve(text);
      });
    });
    req.setTimeout(8000, () => req.destroy(new Error('INN lookup timeout')));
    req.on('error', reject);
    req.write(body);
    req.end();
  });
}

const DADATA_URL = 'https://suggestions.dadata.ru/suggestions/api/4_1/rs/findById/party';

@Injectable()
export class InnLookupService {
  get configured(): boolean {
    return Boolean(process.env.DADATA_API_KEY);
  }

  async lookup(inn: string): Promise<InnLookupResult> {
    if (!this.configured) return { configured: false, found: false };
    const text = await httpPostJson(
      DADATA_URL,
      {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: `Token ${process.env.DADATA_API_KEY}`,
      },
      JSON.stringify({ query: inn, count: 1 }),
    );
    const json = JSON.parse(text) as DaDataResponse;
    return mapDaDataParty(json);
  }
}
